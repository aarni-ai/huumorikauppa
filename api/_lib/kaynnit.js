/**
 * Oma käyntilaskuri (1.11.2026, /hallinta/mittarit): sivustolle saapuminen ulkopuolelta (hakukone, some, suora
 * osoite) kirjataan yhdeksi käynniksi. Tallennetaan vain koostemäärä päivä x lähde x osio: ei evästeitä, ei
 * selaimen tallennusta, ei IP-osoitetta eikä muita tunnisteita. Sivuston sisäiset siirtymät ja uudelleenlataukset
 * eivät ole uusia käyntejä. Selain: src/lib/kaynti.ts, kirjaus api/sahkoposti.js action "kaynti".
 *
 * Lähde: utm_source (somelinkit, /linkit), kumppanilinkki (?ref=), Google Ads (gclid), muuten viittaavan sivun
 * verkkotunnus; ilman viittaajaa "suora".
 */
const r2 = (x) => Math.round(x * 100) / 100;

const VERKKOTUNNUKSET = [
  [/(^|\.)google\./, "google"], [/(^|\.)bing\.com$/, "bing"], [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "facebook"], [/(^|\.)instagram\.com$/, "instagram"], [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"], [/(^|\.)(t\.co|x\.com|twitter\.com)$/, "x"], [/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"],
  [/(^|\.)(chatgpt\.com|openai\.com)$/, "chatgpt"], [/(^|\.)perplexity\.ai$/, "perplexity"], [/(^|\.)yahoo\./, "yahoo"],
  [/(^|\.)(ecosia\.org)$/, "ecosia"], [/(^|\.)pinterest\./, "pinterest"], [/(^|\.)reddit\.com$/, "reddit"],
  [/(^|\.)(mail\.google\.com|outlook\.|mail\.)/, "sahkoposti"],
];
const UTM_NIMET = { ig: "instagram", insta: "instagram", fb: "facebook", yt: "youtube", tt: "tiktok" };

/** Lähde kirjattavista kentistä: { utm, ref, gclid, viittaaja (host) } -> lyhyt tunnus. */
export function kaynninLahde({ utm, ref, gclid, viittaaja } = {}) {
  const u = String(utm || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24);
  if (u) return UTM_NIMET[u] || u;
  if (ref && /^[a-z0-9][a-z0-9-]{1,39}$/i.test(String(ref))) return "kumppani";
  if (gclid) return "google-ads";
  const host = String(viittaaja || "").trim().toLowerCase().replace(/^www\./, "");
  if (!host) return "suora";
  if (host === "huumorikauppa.fi" || host.endsWith(".vercel.app")) return "suora";
  for (const [re, nimi] of VERKKOTUNNUKSET) if (re.test(host)) return nimi;
  return "muu";
}

/** Saapumissivun osio: "/" -> "etusivu", "/tuote/x" -> "tuote", "/lahjat/x" -> "lahjat". */
export function sivunOsio(polku) {
  const osat = String(polku || "/").split(/[?#]/)[0].split("/").filter(Boolean);
  const siivoa = (x) => x.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
  // Yritysten alakohtaiset sivut (2.11.2026) omina osioinaan: /yritykset/rakennus -> "yritykset-rakennus".
  if (siivoa(osat[0] || "") === "yritykset" && osat[1] && siivoa(osat[1]) !== "tilaus") return siivoa(`yritykset-${osat[1]}`);
  return siivoa(osat[0] || "etusivu") || "etusivu";
}

export const onBotti = (ua) => !ua || /bot|crawl|spider|slurp|preview|headless|prerender|lighthouse|pagespeed|facebookexternalhit|whatsapp|curl|wget|python|node-fetch|axios|vercel/i.test(ua);

export async function varmistaKayntitaulu(db) {
  await db`create table if not exists kaynnit (paiva date not null, lahde text not null, osio text not null,
    kaynnit integer not null default 0, primary key (paiva, lahde, osio))`;
}

/** Kirjaa yhden käynnin (Helsingin päivä). */
export async function kirjaaKaynti(db, { lahde, osio }) {
  await varmistaKayntitaulu(db);
  const paiva = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  await db`insert into kaynnit (paiva, lahde, osio, kaynnit) values (${paiva}::date, ${lahde}, ${osio}, 1)
    on conflict (paiva, lahde, osio) do update set kaynnit = kaynnit.kaynnit + 1`;
}

/** Käynnit päiväväliltä [alku, loppu] (YYYY-MM-DD, Helsingin päivät): { yhteensa, paivia, ensimmainen, lahteet, osiot }. */
export async function kaynnitValilla(db, alku, loppu) {
  await varmistaKayntitaulu(db);
  const rivit = await db`select to_char(paiva, 'YYYY-MM-DD') as paiva, lahde, osio, kaynnit from kaynnit
    where paiva between ${alku}::date and ${loppu}::date`;
  return koostaKaynnit(rivit);
}

/** Koonti; lähde "testi" (tuotannon tarkistusajot, utm_source=testi) ei kuulu lukuihin. */
export function koostaKaynnit(rivit) {
  const lahteet = new Map(), osiot = new Map(), paivat = new Set();
  let yhteensa = 0;
  for (const r of rivit) {
    if (r.lahde === "testi") continue;
    const n = Number(r.kaynnit) || 0;
    yhteensa += n;
    paivat.add(r.paiva);
    lahteet.set(r.lahde, (lahteet.get(r.lahde) || 0) + n);
    osiot.set(r.osio, (osiot.get(r.osio) || 0) + n);
  }
  const jarjesta = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([nimi, kaynnit]) => ({ nimi, kaynnit, osuus: yhteensa ? r2((kaynnit / yhteensa) * 100) : 0 }));
  return { yhteensa, paivia: paivat.size, ensimmainen: [...paivat].sort()[0] || null, lahteet: jarjesta(lahteet), osiot: jarjesta(osiot) };
}
