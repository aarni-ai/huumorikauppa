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

/**
 * Somen sovelluksen sisäinen selain User-Agentista (2.11.2026): biossa on pelkkä huumorikauppa.fi ilman UTM-linkkiä,
 * ja sovellukset jättävät viittaajan usein tyhjäksi. Sama tunnistus selaimessa: index.html (GA4) ja src/lib/kaynti.ts.
 */
export function someSovellus(ua) {
  const u = String(ua || "");
  if (/Instagram/i.test(u)) return "instagram";
  if (/musical_ly|BytedanceWebview|TikTok|trill_/i.test(u)) return "tiktok";
  if (/FBAN|FBAV|FB_IAB|FBIOS/.test(u)) return "facebook";
  if (/Pinterest/i.test(u)) return "pinterest";
  return null;
}

/** Lähde kirjattavista kentistä: { utm, ref, gclid, viittaaja (host), ua } -> lyhyt tunnus. */
export function kaynninLahde({ utm, ref, gclid, viittaaja, ua } = {}) {
  const u = String(utm || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24);
  if (u) return UTM_NIMET[u] || u;
  if (ref && /^[a-z0-9][a-z0-9-]{1,39}$/i.test(String(ref))) return "kumppani";
  if (gclid) return "google-ads";
  const sovellus = someSovellus(ua);
  if (sovellus) return sovellus;
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

// 2.11.2026: lisätty Googlen ja muiden työkalujen selaimet, joiden nimessä ei ole "bot" (Google-InspectionTool,
// GoogleOther, Chrome-Lighthouse), testiselaimet (Playwright, Puppeteer, Selenium) ja palvelinten HTTP-asiakkaat (node, undici).
export const onBotti = (ua) => !ua || /bot|crawl|spider|slurp|preview|headless|prerender|lighthouse|pagespeed|facebookexternalhit|whatsapp|curl|wget|python|node-fetch|axios|vercel|google-inspectiontool|googleother|google-read-aloud|mediapartners|gtmetrix|pingdom|uptime|playwright|puppeteer|selenium|phantomjs|\bnode\b|undici|okhttp|go-http|java\/|ahrefs|semrush|yandex|baidu|bytespider|petal|claude|anthropic|gptbot|perplexity|ccbot|meta-externalagent/i.test(ua);

/**
 * Oma liikenne ja botit pois laskureista (2.11.2026): bottien User-Agentit, hallinnan aktivoinnin evästeet (Coworkin
 * Chrome ja muut hallintaselaimet: hk_oma tai hk_hallinta_*), testiajojen merkintä (testi: true) ja muualta kuin
 * sivustolta tulevat pyynnöt (Sec-Fetch-Site ei same-origin: skriptit ja palvelimen omat kutsut).
 */
export function onOmaTaiBotti({ ua, cookie, secFetchSite, testi } = {}) {
  if (onBotti(String(ua || ""))) return "botti";
  if (/(?:^|;\s*)(hk_oma|hk_hallinta_[a-z]+)=/.test(String(cookie || ""))) return "oma";
  if (testi === true) return "testi";
  if (secFetchSite && secFetchSite !== "same-origin") return "ulkoinen";
  return null;
}

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

/** Koonti; lähteet "testi" (tuotannon tarkistusajot, utm_source=testi) ja "oma" (jälkikäteen omaksi liikenteeksi
 * merkityt rivit, cron ?tehtava=kaynnit-oma) eivät kuulu lukuihin. */
export const EI_LUKUIHIN = ["testi", "oma"];
export function koostaKaynnit(rivit) {
  const lahteet = new Map(), osiot = new Map(), paivat = new Set();
  let yhteensa = 0;
  for (const r of rivit) {
    if (EI_LUKUIHIN.includes(r.lahde)) continue;
    const n = Number(r.kaynnit) || 0;
    yhteensa += n;
    paivat.add(r.paiva);
    lahteet.set(r.lahde, (lahteet.get(r.lahde) || 0) + n);
    osiot.set(r.osio, (osiot.get(r.osio) || 0) + n);
  }
  const jarjesta = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([nimi, kaynnit]) => ({ nimi, kaynnit, osuus: yhteensa ? r2((kaynnit / yhteensa) * 100) : 0 }));
  return { yhteensa, paivia: paivat.size, ensimmainen: [...paivat].sort()[0] || null, lahteet: jarjesta(lahteet), osiot: jarjesta(osiot) };
}
