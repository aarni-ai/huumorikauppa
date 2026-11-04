/**
 * Kumppanuusohjelma (hyväksytty 29.10.2026, KATTEET.md "Kumppanuusohjelma"). Asetukset api/_lib/vakiot.js KUMPPANUUS.
 *
 * Sääntö: provisio on enintään 10 % tilauksen tuotteiden arvosta ilman ALV:tä ja toimitusta, ja enintään summa, joka
 * jättää kauppaan provision jälkeen vähintään KUMPPANUUS.minKateEuroa (7,00 € 29.10.2026 alkaen, aiemmin 5,00 €)
 * nettokatetta. Jos tilauksen kate on raja tai alle, provisio on 0. Kate lasketaan Printifyn todellisilla kuluilla; kun kulua ei vielä tiedetä, provisio odottaa (0).
 *
 * Kumppanit ovat taulussa kumppanit (koodi, nimi, email, aktiivinen), ja niitä hallitaan sivulla /hallinta/kumppanit
 * (api/_lib/kumppanihallinta.js) tai cron-tehtävillä ?tehtava=kumppani-lisaa ja ?tehtava=kumppani-poista. Kassa kirjaa hyväksytyn koodin tilauksen tapahtumaksi
 * "kumppani" ({ koodi }). Raportti: ?tehtava=kumppanit[&kuukausi=YYYY-MM].
 */
import { KUMPPANUUS, KUMPPANIT } from "./vakiot.js";

export const KUMPPANIKOODI = /^[a-z0-9][a-z0-9-]{1,39}$/;

/** Kumppaneille näytettävä sääntö (sivu /kumppanit ja viestipohja). */
export const PROVISIOSAANTO =
  `Provisio on ${KUMPPANUUS.provisioProsentti} % tilauksen tuotteiden arvosta (ilman arvonlisäveroa ja toimituskuluja) tilauksista, joista kaupalle jää provision jälkeen vähintään ${KUMPPANUUS.minKateEuroa.toFixed(2).replace(".", ",")} € katetta. Jos kate ei riitä täyteen ${KUMPPANUUS.provisioProsentti} %:iin, provisio on pienempi, ja jos tilauksen kate on ${KUMPPANUUS.minKateEuroa.toFixed(2).replace(".", ",")} € tai alle, provisiota ei makseta.`;

/** Malli 2:n sääntö kumppaneille (sivu /kumppanit ja raportti). */
export const ALENNUSMALLI_SAANTO =
  `Kumppanin koodilla ostaja saa ${KUMPPANUUS.alennusmalli.alennusProsentti} %:n alennuksen tuotteista, ja kumppani saa ${KUMPPANUUS.alennusmalli.provisioProsentti} %:n provision tuotteiden arvosta (alennuksen jälkeen, ilman arvonlisäveroa ja toimituskuluja). Kaupalle jää jokaisesta tilauksesta vähintään ${KUMPPANUUS.minKateEuroa.toFixed(2).replace(".", ",")} € katetta: jos se ei muuten toteudu, alennus ja provisio pienenevät tai jäävät pois.`;

/** Koodin muoto: pienet kirjaimet, numerot ja väliviiva, 2-40 merkkiä. Palauttaa normalisoidun koodin tai null. */
export function kumppaniKoodinMuoto(arvo) {
  const k = String(arvo ?? "").trim().toLowerCase();
  return KUMPPANIKOODI.test(k) ? k : null;
}

/** Synkroninen tarkistus kiinteästä listasta (testit ja varalista KUMPPANIT). */
export function kumppaniKoodi(arvo, { asetukset = KUMPPANUUS, kumppanit = KUMPPANIT } = {}) {
  if (!asetukset.kaytossa) return null;
  const k = kumppaniKoodinMuoto(arvo);
  return k && Object.prototype.hasOwnProperty.call(kumppanit, k) ? k : null;
}

/** Taulu kumppaneille (luodaan tarvittaessa, db/schema.sql). malli: "provisio" (malli 1) tai "alennus" (malli 2). */
export async function varmistaKumppanitaulu(db) {
  await db`create table if not exists kumppanit (koodi text primary key, nimi text not null, email text,
    aktiivinen boolean not null default true, created_at timestamptz not null default now())`;
  await db`alter table kumppanit add column if not exists malli text not null default 'provisio'`;
  // Ensimmäinen aito /k/<koodi>-avaus (4.11.2026, /hallinta/kumppanit): näyttää, kuka on avannut linkkinsä.
  await db`alter table kumppanit add column if not exists ensimmainen_kaynti timestamptz`;
}

/** Merkitsee kumppanilinkin ensimmäisen avauksen, jos sitä ei vielä ole (kutsuja on jo suodattanut botit ja oman liikenteen). */
export async function merkitseEnsimmainenKaynti(db, koodi) {
  await db`update kumppanit set ensimmainen_kaynti = now() where koodi = ${koodi} and ensimmainen_kaynti is null`;
}

export const KUMPPANIMALLIT = ["provisio", "alennus"];

/** Kumppanisivun osoite (2.11.2026): huumorikauppa.fi/k/<koodi> tallentaa koodin evästeeseen 30 päiväksi. */
export const kumppaniLinkki = (koodi, pohja = "https://huumorikauppa.fi") => `${pohja.replace(/\/$/, "")}/k/${koodi}`;
/** Syvälinkki: huumorikauppa.fi/k/<koodi>/tuote/<slug> tallentaa koodin ja avaa sivun (api/sahkoposti.js jatka=). */
export const kumppaniSyvalinkki = (koodi, polku, pohja = "https://huumorikauppa.fi") => `${kumppaniLinkki(koodi, pohja)}/${String(polku).replace(/^\/+/, "")}`;
export const KUMPPANI_EVASTE = "hk_kumppani";
export const KUMPPANI_EVASTE_PV = 30;

/** "Tervetuloa Antsan kautta": nimen genetiivi (sarake kautta_nimi ohittaa). Antsa -> Antsan, Keisarit -> Keisarien, Mikael -> Mikaelin. */
export function genetiivi(nimi) {
  const n = String(nimi || "").trim();
  if (!n) return n;
  if (/[aeiouyäö]$/i.test(n)) return `${n}n`;
  if (/it$/i.test(n)) return `${n.slice(0, -2)}ien`;
  return `${n}in`;
}

/** Kumppanisivun tervehdys (sama palvelimen HTML:ssä ja selaimessa, src/pages/PartnerLandingPage.tsx). */
export function kumppaniTervehdys(k, asetukset = KUMPPANUUS) {
  if (!k) return { otsikko: "Tervetuloa Huumorikauppaan", teksti: "Kumppanikoodia ei löytynyt. Tuotteet löytyvät alta." };
  const tallennettu = k.malli === "alennus"
    ? `Koodi ${k.koodi.toUpperCase()} on tallennettu: kassa antaa ${asetukset.alennusmalli.alennusProsentti} %:n alennuksen useimmista tilauksista, eikä koodia tarvitse kirjoittaa.`
    : `Koodi ${k.koodi.toUpperCase()} on tallennettu, eikä sitä tarvitse kirjoittaa kassalla.`;
  return { otsikko: `Tervetuloa ${k.kautta} kautta`, teksti: `${tallennettu} Koodi on voimassa tällä laitteella ${KUMPPANI_EVASTE_PV} päivää.` };
}

const html = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/**
 * /k/<koodi> palvelimella (2.11.2026, vercel.json rewrite -> api/sahkoposti.js ?kumppanisivu=&html=1): SPA-kuoreen
 * (dist/spa-shell.html) oma otsikko, noindex, canonical ja tervehdys, jotta tervehdys näkyy ilman JavaScriptiä.
 * window.__hkKumppani välittää tiedot sovellukselle, joka ei hae niitä uudelleen.
 */
export function kumppaniSivunHtml(kuori, k, koodi) {
  const t = kumppaniTervehdys(k);
  const polku = `/k/${encodeURIComponent(String(koodi || "").toLowerCase())}`;
  const otsikko = k ? `${t.otsikko} | Huumorikauppa` : "Tervetuloa | Huumorikauppa";
  const kuvaus = "Hauskoja t-paitoja ja huppareita suomalaisella huumorilla.";
  const siemen = JSON.stringify({ pyynto: String(koodi || "").toLowerCase(), kumppani: k || null }).replace(/</g, "\\u003c");
  const sisalto = `<main><h1>${html(t.otsikko)}</h1><p>${html(t.teksti)}</p><p><a href="/joulu">Joulumallisto 2026</a> <a href="/kaikki-tuotteet">Kaikki tuotteet</a></p></main>`;
  return String(kuori)
    .replace(/<title>[^<]*<\/title>/, () => `<title>${html(otsikko)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${html(kuvaus)}" />`)
    .replace(/<meta name="(robots|googlebot)" content="[^"]*"\s*\/?>/g, '<meta name="$1" content="noindex, follow" />')
    .replace(/<link rel="canonical"[^>]*>/g, "")
    .replace("</head>", () => `<link rel="canonical" href="https://huumorikauppa.fi${polku}" />\n<script>window.__hkKumppani=${siemen}</script>\n</head>`)
    .replace(/(<div id="root">[\s\S]*?<\/header>)/, (m) => m + sisalto);
}

/** Kumppanisivun tiedot: { koodi, nimi, kautta, malli } tai null. */
export async function kumppaniSivu(db, arvo) {
  const t = await kumppaninTiedot(db, arvo);
  if (!t) return null;
  let nimi = t.koodi, kautta = null;
  try {
    await db`alter table kumppanit add column if not exists kautta_nimi text`;
    const [r] = await db`select nimi, kautta_nimi from kumppanit where koodi = ${t.koodi}`;
    if (r?.nimi) nimi = r.nimi;
    kautta = r?.kautta_nimi || null;
  } catch { /* oletuskumppani ilman taulua */ }
  // Lempinimi suluissa ("Antti Heinonen (antsa)" -> Antsa), muuten nimen ensimmäinen sana.
  const lempi = nimi.match(/\(([^)]+)\)/)?.[1]?.trim();
  const kutsu = lempi ? lempi.charAt(0).toUpperCase() + lempi.slice(1) : nimi.split(/\s+/)[0];
  return { koodi: t.koodi, nimi: lempi ? kutsu : nimi, kautta: kautta || genetiivi(kutsu), malli: t.malli };
}

/** Hyväksytty, aktiivinen kumppani ja sen malli: { koodi, malli } tai null. */
export async function kumppaninTiedot(db, arvo, { asetukset = KUMPPANUUS } = {}) {
  if (!asetukset.kaytossa) return null;
  const k = kumppaniKoodinMuoto(arvo);
  if (!k) return null;
  if (Object.prototype.hasOwnProperty.call(KUMPPANIT, k)) return { koodi: k, malli: "provisio" };
  try {
    await varmistaKumppanitaulu(db);
    const [r] = await db`select koodi, malli from kumppanit where koodi = ${k} and aktiivinen limit 1`;
    return r ? { koodi: r.koodi, malli: KUMPPANIMALLIT.includes(r.malli) ? r.malli : "provisio" } : null;
  } catch {
    return null;
  }
}

/**
 * Malli 2: suurin alennus (alennusProsentti, 1 %-yksikön askelin alas), jolla kauppaan jää provision jälkeen
 * minKateEuroa. laske(p) palauttaa kassan laskennan p %:n alennuksella tai null (kassa hylkäsi), nettokate(l) sen
 * nettokatteen. perus = laskenta ilman kumppanialennusta: jos sen alennus (määrä-, kahden tuotteen tai paketti) on
 * vähintään yhtä suuri, kumppanialennusta ei anneta ja provisio on mallin provisioProsentti kateehdolla.
 * Palauttaa { prosentti, provisioProsentti, laskettu } ja 0 %:n alennuksella myös syy ("muu_alennus" tai "kate").
 */
export function valitseKumppaniAlennus({ laske, nettokate, perus, asetukset = KUMPPANUUS }) {
  const { alennusProsentti, provisioProsentti } = asetukset.alennusmalli;
  // syy, kun alennus jää 0 %:iin: "muu_alennus" (korin oma alennus on suurempi) tai "kate" (7 €:n kateehto).
  let syy = "kate";
  for (let p = alennusProsentti; p >= 1; p--) {
    const l = laske(p);
    if (!l) continue;
    // Vertailu loppusummalla: kahden tuotteen ilmainen toimitus (2.11.2026) ei yhdisty kumppanialennukseen.
    if (perus && (perus.total <= l.total || perus.discount >= l.discount)) { syy = "muu_alennus"; break; }
    const nk = nettokate(l);
    if (!Number.isFinite(nk)) continue;
    const tuotteet = l.total - l.shipping;
    const prov = (tuotteet / 1.255) * (Math.min(p, provisioProsentti) / 100);
    if (nk - prov >= asetukset.minKateEuroa) return { prosentti: p, provisioProsentti: Math.min(p, provisioProsentti), laskettu: l };
  }
  return { prosentti: 0, provisioProsentti, laskettu: perus, syy };
}

/** Provision asetukset tilauksen kumppanitapahtumasta (malli 2 tallentaa prosentin). */
export const provisioAsetukset = (details, asetukset = KUMPPANUUS) =>
  details?.malli === "alennus" ? { ...asetukset, provisioProsentti: Number(details.provisio ?? asetukset.alennusmalli.provisioProsentti) } : asetukset;

/** Hyväksytty, aktiivinen kumppanikoodi kannasta tai varalistasta; muuten null. */
export async function tarkistaKumppani(db, arvo, { asetukset = KUMPPANUUS } = {}) {
  if (!asetukset.kaytossa) return null;
  const k = kumppaniKoodinMuoto(arvo);
  if (!k) return null;
  if (Object.prototype.hasOwnProperty.call(KUMPPANIT, k)) return k;
  try {
    await varmistaKumppanitaulu(db);
    const [r] = await db`select koodi from kumppanit where koodi = ${k} and aktiivinen limit 1`;
    return r ? k : null;
  } catch {
    return null;
  }
}

/**
 * Provisio ja sen peruste. tuotteet = tuotteiden summa alennusten jälkeen (sis. ALV), nettokate euroina ennen
 * provisiota (Printifyn todelliset kulut). tila: "taysi" (10 %), "rajattu" (kauppaan jää 7 €), "ei" (kate 7 € tai
 * alle) tai "kate-tuntematon" (Printify-kulu ei vielä tiedossa, provisio 0 kunnes kulu tiedetään).
 */
export function provisioJaTila(tuotteet, nettokate, asetukset = KUMPPANUUS) {
  if (!Number.isFinite(nettokate)) return { provisio: 0, tila: "kate-tuntematon" };
  const taysi = (Number(tuotteet) / 1.255) * (asetukset.provisioProsentti / 100);
  const varaa = nettokate - asetukset.minKateEuroa;
  if (varaa <= 0) return { provisio: 0, tila: "ei" };
  const p = Math.round(Math.min(taysi, varaa) * 100) / 100;
  return { provisio: p, tila: taysi <= varaa ? "taysi" : "rajattu" };
}

/** Provisio euroina (ks. provisioJaTila). */
export const provisio = (tuotteet, nettokate, asetukset = KUMPPANUUS) => provisioJaTila(tuotteet, nettokate, asetukset).provisio;

/** Kumppanin raporttiavaimen tarkoitus (api/_lib/markkinointi.js allekirjoita / tarkistaTunniste). */
export const RAPORTTI_TARKOITUS = "kumppaniraportti";

/** Klikkaukset päivittäin koodeittain (ei henkilötietoja, ei evästeitä): kumppanilinkin avaukset. */
export async function varmistaKlikkitaulu(db) {
  await db`create table if not exists kumppani_klikit (koodi text not null, paiva date not null,
    klikit integer not null default 0, primary key (koodi, paiva))`;
}

/** Kirjaa yhden kumppanilinkin avauksen, jos koodi on hyväksytty ja aktiivinen. Palauttaa true, jos kirjattiin. */
export async function kirjaaKlikki(db, arvo) {
  const koodi = await tarkistaKumppani(db, arvo);
  if (!koodi) return false;
  await varmistaKlikkitaulu(db);
  const paiva = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  await db`insert into kumppani_klikit (koodi, paiva, klikit) values (${koodi}, ${paiva}::date, 1)
    on conflict (koodi, paiva) do update set klikit = kumppani_klikit.klikit + 1`;
  return true;
}

/**
 * Tilauksen nettokate ennen provisiota Printifyn todellisilla kuluilla (sama kaava kuin api/_lib/kate.js:
 * myynti / 1,255 - Printify-tuote ja -toimitus ilman ALV:tä - Stripe 1,5 % + 0,25 €). null, jos kulua ei vielä tiedetä.
 */
export async function tilauksenKate(tilaus, haeTilaus) {
  if (!tilaus.printify_order_id || !haeTilaus) return null;
  const h = await haeTilaus(tilaus.printify_order_id);
  if (!h?.ok || !h.data || h.data.status === "canceled") return null;
  const myynti = Number(tilaus.total) || 0;
  return myynti / 1.255 - ((Number(h.data.total_price) || 0) + (Number(h.data.total_shipping) || 0)) / 100 - (myynti * 0.015 + 0.25);
}

/**
 * Kumppanin oma raportti (/kumppanit/raportti): klikkaukset, tilaukset ja provisio kuukausittain. Ei asiakkaiden
 * henkilötietoja: tilauksista vain päivä, tuotteiden arvo ja provisio. Kumppanin nimestä vain etunimi.
 */
export async function kumppaniRaportti(db, koodi, { haeTilaus } = {}) {
  await varmistaKumppanitaulu(db);
  await varmistaKlikkitaulu(db);
  const [k] = await db`select koodi, nimi, malli, created_at from kumppanit where koodi = ${koodi} and aktiivinen limit 1`;
  if (!k) return null;
  const klikit = await db`select to_char(paiva, 'YYYY-MM') as kuukausi, sum(klikit)::int as klikit
    from kumppani_klikit where koodi = ${koodi} group by 1`;
  const rivit = await db`select o.paid_at, o.total, o.shipping, o.printify_order_id, e.details
    from orders o join order_events e on e.order_id = o.id and e.kind = 'kumppani'
    where e.details->>'koodi' = ${koodi} and o.status = 'maksettu' and o.customer_email <> 'kassatesti@huumorikauppa.fi'
    order by o.paid_at desc limit 500`;
  const kk = new Map(klikit.map((r) => [r.kuukausi, { kuukausi: r.kuukausi, klikit: r.klikit, tilauksia: 0, tuotteet: 0, provisio: 0, odottaa: 0 }]));
  const tilaukset = [];
  const r2 = (x) => Math.round(x * 100) / 100;
  for (const t of rivit) {
    const tuotteet = (Number(t.total) || 0) - (Number(t.shipping) || 0);
    const p = provisioJaTila(tuotteet, (await tilauksenKate(t, haeTilaus)) ?? NaN, provisioAsetukset(t.details));
    const kuukausi = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date(t.paid_at)).slice(0, 7);
    const m = kk.get(kuukausi) || { kuukausi, klikit: 0, tilauksia: 0, tuotteet: 0, provisio: 0, odottaa: 0 };
    m.tilauksia += 1;
    m.tuotteet = r2(m.tuotteet + tuotteet);
    m.provisio = r2(m.provisio + p.provisio);
    if (p.tila === "kate-tuntematon") m.odottaa += 1;
    kk.set(kuukausi, m);
    tilaukset.push({ pvm: new Date(t.paid_at).toISOString().slice(0, 10), tuotteet: r2(tuotteet), provisio: p.provisio, tila: p.tila });
  }
  const kuukaudet = [...kk.values()].sort((a, b) => b.kuukausi.localeCompare(a.kuukausi));
  const summa = (f) => r2(kuukaudet.reduce((s, m) => s + m[f], 0));
  return {
    koodi: k.koodi, etunimi: String(k.nimi || "").trim().split(/\s+/)[0] || k.koodi,
    linkki: kumppaniLinkki(k.koodi), saanto: k.malli === "alennus" ? ALENNUSMALLI_SAANTO : PROVISIOSAANTO,
    kuukaudet, tilaukset, yhteensa: { klikit: summa("klikit"), tilauksia: summa("tilauksia"), tuotteet: summa("tuotteet"), provisio: summa("provisio") },
  };
}
