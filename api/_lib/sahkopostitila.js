/**
 * Sähköpostin valmiustila (4.11.2026): nimipalvelimet, Resendin DNS-tietueet ja domainin tila, lähetysreitti ja
 * viimeisen 7 päivän tilausvahvistukset. Käyttö:
 *  - GET /api/cron/tilaukset?tehtava=sahkopostitila (CRON_SECRET), scripts/sahkoposti-tila.mjs tulostaa sen.
 *  - &testi=1 lähettää jokaisesta viestityypistä yhden TESTI-viestin omistajalle (OMISTAJA_EMAIL) tavallista reittiä,
 *    vain kun reitti on Resend ja domain on vahvistettu (muuten Resend palauttaisi 403). &pakota=1 ohittaa ehdon.
 *  - Päivän yhteenvedon rivi (sahkopostiRivit), kunnes kaikki on valmista; sen jälkeen yksi OK-rivi.
 * Vaihto Resendiin on automaattinen (sahkoposti.js lahetysreitti, omaVahvistusKaytossaNyt): tila vain kertoo, missä
 * mennään. Odotetut arvot: KAYTTOONOTTO.md kohta 24.
 */
import { Resolver } from "node:dns/promises";

export const UUDET_NIMIPALVELIMET = ["annabel.ns.cloudflare.com", "vick.ns.cloudflare.com"];
export const VANHAT_NIMIPALVELIMET = ["aria.ns.cloudflare.com", "huxley.ns.cloudflare.com"];
export const DOMAIN = "huumorikauppa.fi";

/** Resendin tietueet (Resend loi 28.10.2026, alue eu-west-1) ja DMARC. Arvot tarkistetaan myös Resendin API:sta. */
export const ODOTETUT = {
  dkim: { nimi: `resend._domainkey.${DOMAIN}`, alku: "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCUF9+bjHNQ5hAgzDsFGX1wp7BSE29aR3LATlC5vLJ4LSzDc408WZTQ9uZOyZFFSoVhOLXzz0" },
  sendMx: { nimi: `send.${DOMAIN}`, arvo: "feedback-smtp.eu-west-1.amazonses.com" },
  sendSpf: { nimi: `send.${DOMAIN}`, arvo: "v=spf1 include:amazonses.com ~all" },
  dmarc: { nimi: `_dmarc.${DOMAIN}`, alku: "v=DMARC1" },
};

const pieni = (x) => String(x || "").toLowerCase().replace(/\.$/, "");

export function luoResolver(palvelimet = ["1.1.1.1", "8.8.8.8"]) {
  const r = new Resolver({ timeout: 3000, tries: 2 });
  r.setServers(palvelimet);
  return r;
}

/** Julkinen DNS: nimipalvelimet ja Resendin tietueet. Virhe tai puuttuva tietue -> null / []. */
export async function dnsTila(resolver = luoResolver()) {
  const turva = (p) => p.catch(() => null);
  const [ns, dkim, mx, txt, dmarc] = await Promise.all([
    turva(resolver.resolveNs(DOMAIN)),
    turva(resolver.resolveTxt(ODOTETUT.dkim.nimi)),
    turva(resolver.resolveMx(ODOTETUT.sendMx.nimi)),
    turva(resolver.resolveTxt(ODOTETUT.sendSpf.nimi)),
    turva(resolver.resolveTxt(ODOTETUT.dmarc.nimi)),
  ]);
  const liitetyt = (t) => (t || []).map((osat) => osat.join(""));
  const nimip = (ns || []).map(pieni).sort();
  const dmarcArvo = liitetyt(dmarc).find((x) => x.startsWith("v=DMARC1")) || null;
  return {
    nimipalvelimet: nimip,
    uusiCloudflare: UUDET_NIMIPALVELIMET.every((n) => nimip.includes(n)),
    vanhaCloudflare: VANHAT_NIMIPALVELIMET.some((n) => nimip.includes(n)),
    dkim: liitetyt(dkim).some((x) => x.replace(/\s/g, "").startsWith(ODOTETUT.dkim.alku)),
    sendMx: (mx || []).some((m) => pieni(m.exchange) === ODOTETUT.sendMx.arvo),
    sendSpf: liitetyt(txt).some((x) => x.trim() === ODOTETUT.sendSpf.arvo),
    dmarc: dmarcArvo,
    dmarcLovable: !!dmarcArvo && /lovable\.dev/i.test(dmarcArvo),
  };
}

/** Resendin domain ja tietueiden tilat (GET /domains, /domains/:id). */
export async function resendTila({ hae = fetch, avain = process.env.RESEND_API_KEY } = {}) {
  if (!avain) return { avain: false, status: null, tietueet: [] };
  const otsakkeet = { Authorization: `Bearer ${avain}` };
  try {
    const lista = await hae("https://api.resend.com/domains", { headers: otsakkeet, signal: AbortSignal.timeout(8000) });
    if (!lista.ok) return { avain: true, status: null, virhe: `Resend ${lista.status}`, tietueet: [] };
    const d = ((await lista.json())?.data || []).find((x) => pieni(x?.name) === DOMAIN);
    if (!d) return { avain: true, status: "puuttuu", tietueet: [] };
    const t = await hae(`https://api.resend.com/domains/${d.id}`, { headers: otsakkeet, signal: AbortSignal.timeout(8000) }).then((r) => r.json()).catch(() => ({}));
    return { avain: true, status: t?.status || d.status, tietueet: (t?.records || []).map((r) => ({ nimi: r.name, tyyppi: r.type, tila: r.status })) };
  } catch (e) {
    return { avain: true, status: null, virhe: String(e?.message || e).slice(0, 200), tietueet: [] };
  }
}

/** Viimeisen 7 päivän maksetut tilaukset, lähetetyt vahvistukset ja vahvistusvirheet. */
export async function vahvistusLuvut(db) {
  try {
    const [r] = await db`select
        count(*) filter (where paid_at is not null)::int as maksettu,
        count(*) filter (where paid_at is not null and confirmation_email_sent_at is not null)::int as vahvistettu
      from orders where paid_at > now() - interval '7 days' and coalesce(customer_email, '') not like '%kassatesti%'`;
    const [v] = await db`select count(*)::int as virheet from order_events where kind = 'vahvistus_virhe' and created_at > now() - interval '7 days'`.catch(() => [{ virheet: null }]);
    return { maksettu: r.maksettu, vahvistettu: r.vahvistettu, virheet: v?.virheet ?? null };
  } catch {
    return null;
  }
}

/** Mitä vielä puuttuu, järjestyksessä. Tyhjä lista = sähköposti valmis Resendillä. */
export function puutteet({ dns, resend, reitti, omaVahvistus }) {
  const p = [];
  if (!dns.uusiCloudflare) p.push(`nimipalvelimet eivät vielä ole uudet (${dns.nimipalvelimet.join(", ") || "ei vastausta"}); Cowork vaihtaa Domainhotellissa (KAYTTOONOTTO.md kohta 24)`);
  if (!dns.dkim) p.push("resend._domainkey TXT puuttuu DNS:stä");
  if (!dns.sendMx) p.push("send MX puuttuu DNS:stä");
  if (!dns.sendSpf) p.push("send TXT (SPF) puuttuu DNS:stä");
  if (!dns.dmarc) p.push("_dmarc TXT puuttuu");
  else if (dns.dmarcLovable) p.push("_dmarc raportit menevät yhä lovable.dev-osoitteeseen; vaihda rua=mailto:huumorikauppa@gmail.com");
  if (!resend.avain) p.push("RESEND_API_KEY puuttuu Vercelistä");
  else if (resend.status !== "verified") p.push(`Resendin domainin tila ${resend.status || resend.virhe || "tuntematon"}; aja ?tehtava=resend-domain&vahvista=1, kun DNS-tietueet näkyvät`);
  if (reitti !== "resend") p.push(`viestit lähtevät reittiä ${reitti}`);
  if (!omaVahvistus) p.push("oma tilausvahvistus ei ole käytössä (Stripe lähettää kuitin)");
  return p;
}

export async function sahkopostiTila({ db = null, resolver, hae = fetch, lahetysreitti, markkinointiKaytossa, omaVahvistusKaytossaNyt } = {}) {
  const [dns, resend] = await Promise.all([dnsTila(resolver), resendTila({ hae })]);
  const reitti = lahetysreitti ? await lahetysreitti() : null;
  const markkinointi = markkinointiKaytossa ? await markkinointiKaytossa() : null;
  const omaVahvistus = omaVahvistusKaytossaNyt ? await omaVahvistusKaytossaNyt() : null;
  const vahvistukset = db ? await vahvistusLuvut(db) : null;
  const tila = { dns, resend, reitti, markkinointi, omaVahvistus, vahvistukset };
  const puuttuu = puutteet(tila);
  return { valmis: puuttuu.length === 0, puuttuu, ...tila };
}

/** Päivän yhteenvedon rivit. */
export function sahkopostiRivit(t) {
  if (!t) return [];
  const v = t.vahvistukset;
  const luvut = v && v.maksettu ? ` Tilausvahvistuksia 7 pv: ${v.vahvistettu}/${v.maksettu}${v.virheet ? `, virheitä ${v.virheet}` : ""}.` : "";
  if (t.valmis) return ["", `Sähköposti: Resend vahvistettu, kaikki viestit lähtevät osoitteesta tilaukset@huumorikauppa.fi.${luvut}`];
  return ["", `Sähköposti ei vielä valmis (reitti ${t.reitti || "?"}):`, ...t.puuttuu.map((x) => `- ${x}`), ...(luvut ? [luvut.trim()] : [])];
}

/**
 * Yksi esimerkkiviesti jokaisesta tyypistä TESTI-otsikolla. Viestipohjat ovat samat kuin oikeissa lähetyksissä;
 * tiedot ovat keksittyjä esimerkkejä (ei oikeaa asiakasta), ja otsikko kertoo sen.
 */
export async function testiviestit(vastaanottaja, nyt = new Date()) {
  const { vahvistusViesti, lahjakorttiViesti, lahetysViesti } = await import("./sahkoposti.js");
  const { koriMuistutusViesti, arvostelupyyntoViesti, tervetuloViesti } = await import("./markkinointi.js");
  const { joulukampanjaViesti, JOULUKAMPANJA } = await import("./uutiskirje.js");
  const id = "00000000-test-4000-8000-000000000000";
  const rivi = { name: "Esimerkkipaita", quantity: 1, unit_price: 24.9, size: "L", color: "Black" };
  const tilaus = { id, items: [rivi], shipping: 6.9, discount: 0, total: 31.8, customer_email: vastaanottaja, delivered_at: nyt.toISOString(), carrier: "Posti", tracking_url: "https://www.posti.fi/" };
  const kortti = { code: "TESTI-0000-0000", initial_value: 30, expires_at: new Date(nyt.getTime() + 365 * 864e5).toISOString(), recipient_email: null, message: "" };
  const kori = { id, email: vastaanottaja, items: [rivi], total: 24.9 };
  const viestit = [
    ["tilausvahvistus", vahvistusViesti(tilaus)],
    ["lähetysilmoitus", lahetysViesti(tilaus)],
    ["lahjakortti", lahjakorttiViesti(kortti)],
    ["korimuistutus", koriMuistutusViesti(kori, 2)],
    ["uutiskirjeen tervetuloviesti", tervetuloViesti({ email: vastaanottaja })],
    ...(JOULUKAMPANJA?.[0] ? [["uutiskirje", joulukampanjaViesti(JOULUKAMPANJA[0], vastaanottaja)]] : []),
    ["arvostelupyyntö", arvostelupyyntoViesti(tilaus)],
    ["hallinta", { subject: "Hallinnan viesti", text: "Hallinnan viestien reitin testi.", html: "<p>Hallinnan viestien reitin testi.</p>" }],
  ];
  return viestit.map(([tyyppi, v]) => ({ tyyppi, viesti: { ...v, to: vastaanottaja, subject: `TESTI (${tyyppi}): ${v.subject}` } }));
}
