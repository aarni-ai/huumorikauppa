/**
 * Uutiskirjelista (2.11.2026): tervetuloviestien jono, joulukampanjan kolme viestiä ja mittarin luvut.
 *
 *  - Tilaus: /api/sahkoposti action "tilaa" (api/_lib/markkinointi.js tilaaUutiskirje, taulu subscribers suostumuksen
 *    ajan, tekstin ja lähteen kanssa). Lomake näyttää 5 %:n ensitilauksen koodin (TERVE-xxxxxx) heti.
 *  - Lähetys vain, kun lähetysdomain on vahvistettu Resendissä (domainVahvistettu): SAHKOPOSTI_VAHVISTETTU=1 tai Resendin
 *    API kertoo EMAIL_FROM-osoitteen domainin tilaksi "verified", tai kun Gmailin väliaikaisreitti on käytössä
 *    (sahkoposti.js markkinointiKaytossa, 3.11.2026). Muuten ei lähetetä.
 *  - Ajastus: api/cron/tilaukset.js (tunnin välein) kutsuu ajaUutiskirje. Jokainen viesti lähtee osoitteelle kerran
 *    (taulu uutiskirje_lahetykset, perusavain viesti + email), vain tilaajille, jotka eivät ole peruneet (email_optouts),
 *    ja markkinoinnin yhteisen päivärajan sisällä (markkinointi.js lahetysrajat, sama kv-laskuri, enintään 100
 *    viestiä Helsingin päivässä).
 *  - Joulukalenteri (4.11.2026): 1.-24.12. klo 7 alkaen päivän luukku (joulukalenteriViesti, viesti joulukalenteri-<päivä>)
 *    tilaajille, jotka eivät ole saaneet uutiskirjeviestiä samana päivänä (joulukampanjan viesti ensin). Sama kerran per
 *    viesti ja osoite -sääntö, sama päiväraja ja sama domainin vahvistuksen ehto. Luukun tiedot antaa cron
 *    (api/_lib/joulukalenteri-seuranta.js luukkuViestiin) vain luukun omana päivänä.
 *  - Joulukampanjan päivät: JOULUKAMPANJA alla; src/test/uutiskirje.test.ts tarkistaa, että ne vastaavat
 *    src/data/campaignSchedule.ts:n joulun tilauspäiviä ja Black Fridayn kampanjaa (vakiot.js TPAITAPARI_KAMPANJA).
 */
import { TPAITAPARI_KAMPANJA, ENSITILAUS_ALENNUS_PROSENTTI } from "./vakiot.js";
import { kauppaUrl, peruutusLinkki, peruutusOtsakkeet, tervetuloViesti, lahetysrajat, onAllekirjoitus, kvAvain, rajatKatolla } from "./markkinointi.js";
import { pgMarkkinointi } from "./markkinointi-db.js";

/** Joulun viimeiset tilauspäivät (campaignSchedule.ts joulunTilauspaivaTyypille; testi vertaa). */
export const JOULU_TILAUSPAIVA = "2026-12-02";
export const JOULU_TPAITA_TILAUSPAIVA = "2026-12-02";

const VIIKONPAIVA = ["su", "ma", "ti", "ke", "to", "pe", "la"];
/** "2026-12-01" -> "ti 1.12." */
export const lyhytPaiva = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${VIIKONPAIVA[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${d}.${m}.`;
};
const lisaaPaivia = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

const utm = (polku, kampanja) => `${kauppaUrl()}${polku}${polku.includes("?") ? "&" : "?"}utm_source=uutiskirje&utm_medium=email&utm_campaign=${kampanja}`;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const eur = (x) => `${Number(x).toFixed(2).replace(".", ",")} €`;

function kehys(sisalto, peruutus) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.5">${sisalto}` +
    `<p style="color:#666;font-size:12px;margin-top:28px">Sait tämän viestin, koska tilasit Huumorikaupan uutiskirjeen. <a href="${esc(peruutus)}" style="color:#666">Peru viestit</a>.<br>Huumorikauppa.fi, huumorikauppa@gmail.com</p></div>`;
}
const nappi = (url, teksti) => `<p><a href="${esc(url)}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${esc(teksti)}</a></p>`;
const tuotelista = (tuotteet, kampanja) => `<ul>${tuotteet.map(([slug, nimi]) => `<li><a href="${esc(utm(`/tuote/${slug}`, kampanja))}">${esc(nimi)}</a></li>`).join("")}</ul>`;
const tekstilista = (tuotteet, kampanja) => tuotteet.map(([slug, nimi]) => `${nimi}: ${utm(`/tuote/${slug}`, kampanja)}`).join("\n");

const AIKATAULU = JOULU_TPAITA_TILAUSPAIVA === JOULU_TILAUSPAIVA
  ? `T-paidat, hupparit ja julisteet ehtivät jouluksi, kun tilaat viimeistään ${lyhytPaiva(JOULU_TILAUSPAIVA)}`
  : `T-paidat ehtivät jouluksi, kun tilaat viimeistään ${lyhytPaiva(JOULU_TPAITA_TILAUSPAIVA)} Hupparit ja muut tuotteet tilaa viimeistään ${lyhytPaiva(JOULU_TILAUSPAIVA)}`;

/** Joulukampanjan viestit: lähetysikkuna [alku, loppu] Suomen aikaa (päivät mukaan lukien), klo 9 alkaen. */
export const JOULUKAMPANJA = [
  {
    id: "joulu2026-1",
    alku: "2026-11-16",
    loppu: "2026-11-22",
    subject: "Joulumallisto 2026: glögiä, kinkkua ja anoppivitsejä | Huumorikauppa",
    otsikko: "Joulumallisto 2026 on valmis",
    teksti: "Joulun lahjat kannattaa hoitaa ennen kiireitä. Joulumallistossa on t-paitoja ja huppareita glögin ystävälle, kinkun vartijalle ja koko suvulle.",
    tuotteet: [
      ["glogin-virallinen-maistaja-t-paita-jouluun", "Glögin virallinen maistaja | T-paita"],
      ["kinkkuvahti-ala-koske-t-paita-jouluun", "Kinkkuvahti. Älä koske | T-paita"],
      ["maailman-paras-anoppi-sanoi-anoppi-t-paita-jouluun", "Maailman paras anoppi. Sanoi anoppi | T-paita"],
      ["lahjapaniikki-perinteinen-joulutapa-t-paita-jouluun", "Lahjapaniikki. Perinteinen joulutapa | T-paita"],
    ],
    nappi: ["/joulu", "Katso joulumallisto"],
  },
  {
    id: "joulu2026-2",
    alku: TPAITAPARI_KAMPANJA.alku,
    // Viimeisen tilauspäivän muistutus (viesti 3) lähtee päivää ennen; tämä ikkuna päättyy sitä ennen.
    loppu: lisaaPaivia(JOULU_TILAUSPAIVA, -2),
    subject: `Kaksi t-paitaa ${eur(TPAITAPARI_KAMPANJA.parihinta)} ${lyhytPaiva(TPAITAPARI_KAMPANJA.loppu)} asti | Huumorikauppa`,
    otsikko: `Kaksi t-paitaa ${eur(TPAITAPARI_KAMPANJA.parihinta)}`,
    teksti: `Black Friday Huumorikaupassa: kaksi ${eur(TPAITAPARI_KAMPANJA.kappalehinta)}:n t-paitaa yhteensä ${eur(TPAITAPARI_KAMPANJA.parihinta)}. Hinta lasketaan kassalla automaattisesti, eikä koodia tarvita. Tarjous on voimassa ${lyhytPaiva(TPAITAPARI_KAMPANJA.alku)} alkaen ${lyhytPaiva(TPAITAPARI_KAMPANJA.loppu)} asti. T-paidan alin hinta 30 päivän aikana: ${eur(TPAITAPARI_KAMPANJA.alinHinta30pv)}.`,
    tuotteet: [
      ["tonnin-seteli-t-paita", "Tonnin seteli | T-paita"],
      ["saatanan-tunarit-t-paita", "Saatanan tunarit | T-paita"],
    ],
    nappi: ["/black-friday", "Katso tarjouksen t-paidat"],
  },
  {
    id: "joulu2026-3",
    alku: lisaaPaivia(JOULU_TILAUSPAIVA, -1),
    loppu: JOULU_TILAUSPAIVA,
    subject: `Jouluksi ehtii vielä: tilaa viimeistään ${lyhytPaiva(JOULU_TILAUSPAIVA)} | Huumorikauppa`,
    otsikko: "Joulun viimeiset tilauspäivät",
    teksti: "Joululahjat painetaan tilauksesta, joten tilauspäivä ratkaisee.",
    tuotteet: [
      ["kolmas-glogi-nyt-laulan-t-paita-jouluun", "Kolmas glögi. Nyt laulan | T-paita"],
      ["ostin-itselleni-lahjan-varmuuden-vuoksi-t-paita-jouluun", "Ostin itselleni lahjan. Varmuuden vuoksi | T-paita"],
      ["kinkku-on-minun-rakkauskieleni-t-paita-jouluun", "Kinkku on minun rakkauskieleni | T-paita"],
    ],
    nappi: ["/joulun-viimeiset-tilauspaivat", "Katso aikataulu"],
  },
];

/** Joulukampanjan viesti osoitteelle (HTML, teksti ja yhden klikkauksen peruutus). */
export function joulukampanjaViesti(viesti, email) {
  const peruutus = peruutusLinkki(email);
  const [polku, napinTeksti] = viesti.nappi;
  return {
    subject: viesti.subject,
    html: kehys(`<h2>${esc(viesti.otsikko)}</h2><p>${esc(viesti.teksti)}</p>${tuotelista(viesti.tuotteet, viesti.id)}<p>${esc(AIKATAULU)}</p>${nappi(utm(polku, viesti.id), napinTeksti)}`, peruutus),
    text: `${viesti.otsikko}\n\n${viesti.teksti}\n\n${tekstilista(viesti.tuotteet, viesti.id)}\n\n${AIKATAULU}\n\n${napinTeksti}: ${utm(polku, viesti.id)}\n\nPeru viestit: ${peruutus}`,
    headers: peruutusOtsakkeet(email),
  };
}

// ---------- Joulukalenteri ----------

/** Luukun aamuviesti lähtee aikaisintaan tällä tunnilla Suomen aikaa. */
export const LUUKKU_TUNTI = 7;

/**
 * Joulukalenterin päivän luukku viestinä. luukku: { id, paiva, pvm, slug, nimi, hinta, kpl, normaali, alin30 }
 * (api/_lib/joulukalenteri-seuranta.js luukkuViestiin). Hinta on voimassa vain luukun päivän (Suomen aika).
 */
export function joulukalenteriViesti(luukku, email) {
  const peruutus = peruutusLinkki(email);
  const [, m, d] = luukku.pvm.split("-").map(Number);
  const hinta = Number(luukku.kpl) > 1 ? `${luukku.kpl} kpl yhteensä ${eur(luukku.hinta)}` : eur(luukku.hinta);
  const otsikko = `Joulukalenterin luukku ${luukku.paiva}: ${luukku.nimi}`;
  const teksti = [
    `Tämän päivän luukussa on ${luukku.nimi}: ${hinta} (normaalihinta ${eur(luukku.normaali)}). Hinta on voimassa vain tänään ${d}.${m}. klo 23.59 asti, ja se lasketaan kassalla ilman koodia.`,
    `Alin hinta 30 päivän aikana ennen tarjousta: ${eur(luukku.alin30 ?? luukku.normaali)}. Luukun hinta ei yhdisty muihin alennuksiin.`,
    luukku.pvm > JOULU_TILAUSPAIVA
      ? `Joulun viimeinen tilauspäivä oli ${lyhytPaiva(JOULU_TILAUSPAIVA)}, joten tänään tilattu paita on perillä joulun jälkeen.`
      : AIKATAULU,
  ];
  const sivu = utm("/joulukalenteri", luukku.id);
  const tuote = utm(`/tuote/${luukku.slug}`, luukku.id);
  return {
    subject: `Luukku ${luukku.paiva}: ${luukku.nimi.split(" | ")[0]} ${hinta} tänään | Huumorikauppa`,
    html: kehys(`<h2>${esc(otsikko)}</h2>${teksti.map((t) => `<p>${esc(t)}</p>`).join("")}<p><a href="${esc(tuote)}">${esc(luukku.nimi)}</a></p>${nappi(sivu, "Avaa päivän luukku")}`, peruutus),
    text: `${otsikko}\n\n${teksti.join("\n\n")}\n\n${luukku.nimi}: ${tuote}\n\nAvaa päivän luukku: ${sivu}\n\nPeru viestit: ${peruutus}`,
    headers: peruutusOtsakkeet(email),
  };
}

/** Lähetetäänkö luukun viesti nyt: luukun oma päivä Suomen aikaa ja klo LUUKKU_TUNTI jälkeen. */
export function luukkuViestiAuki(luukku, nyt = new Date()) {
  if (!luukku?.id || !luukku?.pvm) return false;
  const h = helsinki(nyt);
  return h.paiva === luukku.pvm && h.tunti >= LUUKKU_TUNTI;
}

/** Helsingin päivä (YYYY-MM-DD) ja tunti. */
export function helsinki(nyt = new Date()) {
  const osat = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false })
    .formatToParts(nyt).map((p) => [p.type, p.value]));
  return { paiva: `${osat.year}-${osat.month}-${osat.day}`, tunti: Number(osat.hour) % 24 };
}

/** Kampanjaviesti, jonka lähetysikkuna on nyt auki (tai null). */
export function avoinKampanjaviesti(nyt = new Date()) {
  const h = helsinki(nyt);
  if (h.tunti < 9) return null;
  return JOULUKAMPANJA.find((v) => h.paiva >= v.alku && h.paiva <= v.loppu) || null;
}

// ---------- Domainin tila ----------

let domainMuisti = { aika: 0, arvo: false };
export const nollaaDomainMuisti = () => { domainMuisti = { aika: 0, arvo: false }; };
const lahettajanDomain = () => (String(process.env.EMAIL_FROM || "tilaukset@huumorikauppa.fi").match(/@([^>\s]+)/)?.[1] || "huumorikauppa.fi").toLowerCase();

/**
 * Onko lähetysdomain vahvistettu Resendissä. SAHKOPOSTI_VAHVISTETTU=1 riittää (sama kytkin kuin omalla
 * tilausvahvistuksella); muuten kysytään Resendin API:sta (GET /domains) ja tulos pidetään muistissa tunnin.
 */
export async function domainVahvistettu({ hae = fetch, nyt = Date.now() } = {}) {
  if (process.env.SAHKOPOSTI_VAHVISTETTU === "1") return true;
  if (!process.env.RESEND_API_KEY) return false;
  if (domainMuisti.aika && nyt - domainMuisti.aika < 3600000) return domainMuisti.arvo;
  let arvo = false;
  try {
    const r = await hae("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }, signal: AbortSignal.timeout(8000) });
    if (r.ok) {
      const j = await r.json();
      const d = lahettajanDomain();
      arvo = (j?.data || []).some((x) => String(x?.name).toLowerCase() === d && x?.status === "verified");
    }
  } catch {
    arvo = false;
  }
  domainMuisti = { aika: nyt, arvo };
  return arvo;
}

// ---------- Tietovarasto ----------

export async function varmistaUutiskirjeTaulut(db) {
  await db`create table if not exists uutiskirje_lahetykset (viesti text not null, email text not null,
    sent_at timestamptz not null default now(), primary key (viesti, email))`;
}

/** Postgres-varasto (markkinoinnin varasto + uutiskirjeen lähetysloki). Testeissä muistivarasto samalla rajapinnalla. */
export function pgUutiskirje(db) {
  return {
    ...pgMarkkinointi(db),
    varmista: () => varmistaUutiskirjeTaulut(db),
    tervetulojono: async (raja) => db`select s.email from subscribers s where s.welcome_sent_at is null and s.consent_at is not null
      and s.created_at > now() - interval '60 days' and not exists (select 1 from email_optouts o where o.email = s.email)
      order by s.created_at limit ${raja}`,
    /** eiTanaan (YYYY-MM-DD): ei osoitteille, joille on lähtenyt jokin uutiskirjeviesti sinä päivänä (Suomen aika). */
    kampanjanVastaanottajat: async (viesti, raja, { eiTanaan = null } = {}) => db`select s.email from subscribers s
      where s.consent_at is not null and not exists (select 1 from email_optouts o where o.email = s.email)
        and not exists (select 1 from uutiskirje_lahetykset l where l.viesti = ${viesti} and l.email = s.email)
        ${eiTanaan ? db`and not exists (select 1 from uutiskirje_lahetykset l2 where l2.email = s.email
          and (l2.sent_at at time zone 'Europe/Helsinki')::date = ${eiTanaan}::date)` : db``}
      order by s.created_at limit ${raja}`,
    /** Varaa lähetyksen (true = tämä ajo lähettää); epäonnistunut lähetys vapautetaan. */
    varaaLahetys: async (viesti, email) => (await db`insert into uutiskirje_lahetykset (viesti, email) values (${viesti}, ${email})
      on conflict do nothing returning email`).length > 0,
    vapautaLahetys: async (viesti, email) => { await db`delete from uutiskirje_lahetykset where viesti = ${viesti} and email = ${email}`; },
  };
}


/**
 * Cron: tervetuloviestit jonosta ja avoimen kampanjaviestin lähetys. Vain vahvistetulla domainilla (vahvistettu).
 * Palauttaa { lahetetty, loki }.
 */
export async function ajaUutiskirje(store, { laheta, vahvistettu, nyt = new Date(), rajat: annetut = lahetysrajat(), kuiva = false, prosentti = ENSITILAUS_ALENNUS_PROSENTTI, luukku = null } = {}) {
  const loki = [];
  const rajat = rajatKatolla(annetut);
  if (!vahvistettu) return { lahetetty: 0, loki: ["uutiskirje ohitettu: lähetysdomainia ei ole vahvistettu"] };
  if (!onAllekirjoitus()) return { lahetetty: 0, loki: ["uutiskirje ohitettu: MARKKINOINTI_SALAISUUS tai CRON_SECRET puuttuu"] };
  await store.varmista?.();
  const avain = kvAvain(nyt);
  let tanaan = Number(await store.lueKv(avain)) || 0;
  let lahetetty = 0;
  const tilaa = () => Math.max(0, Math.min(rajat.ajo - lahetetty, rajat.paiva - tanaan));
  const kirjaa = async () => { lahetetty++; tanaan++; await store.kirjoitaKv(avain, String(tanaan)); };

  // Tervetuloviestit (koodi vain, jos osoitteella ei ole maksettuja tilauksia eikä koodia ole käytetty).
  for (const { email } of tilaa() ? await store.tervetulojono(tilaa()) : []) {
    if (!tilaa()) break;
    const t = await store.haeTilaaja(email);
    if (!t || t.welcome_sent_at) continue;
    const koodi = t.discount_code && prosentti > 0 && (await store.maksettujaTilauksia(email)) === 0 && !(await store.koodiKaytetty(t.discount_code)) ? t.discount_code : null;
    loki.push(`tervetuloviesti ${email}${koodi ? " (koodi)" : ""}`);
    if (kuiva) continue;
    const r = await laheta({ to: email, ...tervetuloViesti({ email, koodi, prosentti: Number(t.discount_percent) > 0 ? Math.min(Number(t.discount_percent), prosentti) : prosentti }) });
    if (r.ok) { await store.merkitseTervetulo(email, nyt); await kirjaa(); } else loki.push(`tervetuloviesti epäonnistui ${email}: ${r.virhe}`);
  }

  const viesti = avoinKampanjaviesti(nyt);
  if (viesti) {
    let n = 0;
    for (const { email } of tilaa() ? await store.kampanjanVastaanottajat(viesti.id, tilaa()) : []) {
      if (!tilaa()) break;
      if (kuiva) { n++; continue; }
      if (!(await store.varaaLahetys(viesti.id, email))) continue;
      const r = await laheta({ to: email, ...joulukampanjaViesti(viesti, email) });
      if (r.ok) { await kirjaa(); n++; } else { await store.vapautaLahetys(viesti.id, email); loki.push(`${viesti.id} epäonnistui ${email}: ${r.virhe}`); }
    }
    if (n) loki.push(`${viesti.id}: ${n} viestiä${kuiva ? " (kuiva)" : ""}`);
  }

  // Joulukalenterin päivän luukku: vain luukun päivänä, kerran per osoite, ei osoitteille, jotka saivat jo tänään viestin.
  if (luukkuViestiAuki(luukku, nyt)) {
    let n = 0;
    const paiva = helsinki(nyt).paiva;
    for (const { email } of tilaa() ? await store.kampanjanVastaanottajat(luukku.id, tilaa(), { eiTanaan: paiva }) : []) {
      if (!tilaa()) break;
      if (kuiva) { n++; continue; }
      if (!(await store.varaaLahetys(luukku.id, email))) continue;
      const r = await laheta({ to: email, ...joulukalenteriViesti(luukku, email) });
      if (r.ok) { await kirjaa(); n++; } else { await store.vapautaLahetys(luukku.id, email); loki.push(`${luukku.id} epäonnistui ${email}: ${r.virhe}`); }
    }
    if (n) loki.push(`${luukku.id}: ${n} viestiä${kuiva ? " (kuiva)" : ""}`);
  }
  return { lahetetty, loki };
}

/** Mittari: tilaajat (ei peruneita) yhteensä, 7 ja 28 päivässä sekä lähteittäin. */
export async function uutiskirjeLuvut(db) {
  const [r] = await db`select count(*)::int as yhteensa,
      count(*) filter (where s.created_at > now() - interval '7 days')::int as pv7,
      count(*) filter (where s.created_at > now() - interval '28 days')::int as pv28
    from subscribers s where not exists (select 1 from email_optouts o where o.email = s.email)`;
  const lahteet = await db`select split_part(s.source, ':', 1) as lahde, count(*)::int as n from subscribers s
    where not exists (select 1 from email_optouts o where o.email = s.email) group by 1 order by 2 desc`;
  return { yhteensa: r.yhteensa, pv7: r.pv7, pv28: r.pv28, lahteet: Object.fromEntries(lahteet.map((x) => [x.lahde, x.n])) };
}
