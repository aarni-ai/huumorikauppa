#!/usr/bin/env node
/**
 * Rikkinäiset linkit ja sivukartta (GitHub Actions, .github/workflows/linkkitarkistus.yml, viikoittain).
 *   node scripts/linkkitarkistus.mjs [--url https://huumorikauppa.fi] [--rinnakkain 8] [--raja 0]
 *
 * 1. Hakee sivukartan (/sitemap.xml, myös sisäkkäiset sivukartat) ja tarkistaa jokaisen osoitteen (HEAD, tarvittaessa
 *    GET). Uudelleenohjaukset seurataan käsin: yli yhden hypyn ketju on virhe, yksittäinen ohjaus sivukartassa varoitus
 *    (sivukartassa pitäisi olla vain lopulliset osoitteet).
 * 2. Tuotesivut (/tuote/<slug>): SPA vastaa aina 200, joten tuotteen olemassaolo tarkistetaan /api/products?slug=.
 * 3. Avainsivujen HTML:n sisäiset linkit (href="/..."): sama tarkistus.
 * Tulostaa raportin ja päättyy koodiin 1, jos virheitä löytyi.
 */
const arg = (nimi, oletus) => {
  const i = process.argv.indexOf(`--${nimi}`);
  return i > 0 ? process.argv[i + 1] : oletus;
};
const POHJA = (arg("url", process.env.KAUPPA_URL || "https://huumorikauppa.fi")).replace(/\/$/, "");
const RINNAKKAIN = Number(arg("rinnakkain", 8));
const RAJA = Number(arg("raja", 0)); // 0 = kaikki
const AVAINSIVUT = ["/", "/kaikki-tuotteet", "/kategoria/t-paidat", "/kategoria/hupparit", "/lahjakortti", "/paketit", "/toimitusehdot", "/usein-kysytyt-kysymykset"];
const UA = "HuumorikauppaLinkkitarkistus/1.0 (+https://huumorikauppa.fi)";
const MAX_HYPYT = 5;

async function haku(url, method) {
  return fetch(url, { method, redirect: "manual", headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
}

/** Seuraa uudelleenohjaukset: { url, status, ketju: [osoitteet], virhe } */
export async function tarkista(url) {
  const ketju = [];
  let nykyinen = url;
  for (let hyppy = 0; hyppy <= MAX_HYPYT; hyppy++) {
    let res;
    try {
      res = await haku(nykyinen, "HEAD");
      if ([403, 405, 501].includes(res.status)) res = await haku(nykyinen, "GET");
    } catch (e) {
      return { url, status: 0, ketju, virhe: String(e?.cause?.code || e?.message || e) };
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      ketju.push(`${res.status} ${nykyinen}`);
      nykyinen = new URL(res.headers.get("location"), nykyinen).toString();
      continue;
    }
    return { url, status: res.status, lopullinen: nykyinen, ketju };
  }
  return { url, status: 0, ketju, virhe: `yli ${MAX_HYPYT} uudelleenohjausta` };
}

async function rinnakkain(lista, n, f) {
  const tulokset = new Array(lista.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, lista.length) }, async () => {
    while (i < lista.length) {
      const oma = i++;
      tulokset[oma] = await f(lista[oma]);
    }
  }));
  return tulokset;
}

const locit = (xml) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));

async function sivukartta(url, nahty = new Set()) {
  if (nahty.has(url)) return [];
  nahty.add(url);
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Sivukartta ${url}: HTTP ${res.status}`);
  const xml = await res.text();
  if (/<sitemapindex/i.test(xml)) {
    const osat = await Promise.all(locit(xml).map((u) => sivukartta(u, nahty)));
    return osat.flat();
  }
  return locit(xml);
}

function sisaisetLinkit(html, sivu) {
  const linkit = new Set();
  for (const m of html.matchAll(/<a\b[^>]*\shref="([^"#]+)"/gi)) {
    const h = m[1];
    if (/^(mailto|tel|javascript):/i.test(h)) continue;
    const u = new URL(h, sivu);
    if (u.origin !== new URL(POHJA).origin) continue;
    linkit.add(u.toString());
  }
  return [...linkit];
}

async function main() {
  const virheet = [];
  const varoitukset = [];
  let urlit = [];
  try {
    urlit = await sivukartta(`${POHJA}/sitemap.xml`);
  } catch (e) {
    virheet.push(`Sivukarttaa ei saatu: ${e.message}`);
  }
  const kaksoset = urlit.length - new Set(urlit).size;
  if (kaksoset) varoitukset.push(`Sivukartassa ${kaksoset} kaksoiskappaletta`);
  urlit = [...new Set(urlit)];
  if (RAJA > 0) urlit = urlit.slice(0, RAJA);
  const vieras = urlit.filter((u) => !u.startsWith(POHJA));
  // Sivukartta voi listata tuotanto-osoitteen, vaikka tarkistus ajettaisiin esikatselussa: ne tarkistetaan sellaisenaan.
  console.log(`Sivukartassa ${urlit.length} osoitetta (${vieras.length} muulla domainilla), tarkistetaan ${RINNAKKAIN} rinnakkain`);

  const tulokset = await rinnakkain(urlit, RINNAKKAIN, tarkista);
  for (const t of tulokset) {
    if (t.virhe || t.status >= 400 || t.status === 0) virheet.push(`[sivukartta] ${t.url}: ${t.virhe || `HTTP ${t.status}`}`);
    else if (t.ketju.length > 1) virheet.push(`[sivukartta] ${t.url}: uudelleenohjausketju ${t.ketju.length} hyppyä (${t.ketju.join(" -> ")} -> ${t.lopullinen})`);
    else if (t.ketju.length === 1) varoitukset.push(`[sivukartta] ${t.url} ohjautuu: ${t.lopullinen}`);
  }

  // Tuotesivut: tuote olemassa ja myynnissä
  const tuoteSlugit = urlit.map((u) => u.match(/\/tuote\/([^/?#]+)/)?.[1]).filter(Boolean);
  const tuoteTulokset = await rinnakkain(tuoteSlugit, RINNAKKAIN, async (slug) => {
    try {
      const r = await fetch(`${POHJA}/api/products?slug=${encodeURIComponent(slug)}&fields=slug,is_active,category`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
      if (r.status === 404) return `${slug}: tuotetta ei ole`;
      if (!r.ok) return `${slug}: /api/products HTTP ${r.status}`;
      const p = await r.json();
      if (p?.is_active === false) return `${slug}: tuote on piilotettu (is_active false), mutta sivukartassa`;
      return null;
    } catch (e) {
      return `${slug}: ${e?.message || e}`;
    }
  });
  for (const v of tuoteTulokset) if (v) virheet.push(`[tuote] ${v}`);

  // Avainsivujen sisäiset linkit
  const linkit = new Map();
  for (const polku of AVAINSIVUT) {
    try {
      const r = await fetch(`${POHJA}${polku}`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
      if (!r.ok) { virheet.push(`[avainsivu] ${polku}: HTTP ${r.status}`); continue; }
      for (const l of sisaisetLinkit(await r.text(), `${POHJA}${polku}`)) if (!linkit.has(l)) linkit.set(l, polku);
    } catch (e) {
      virheet.push(`[avainsivu] ${polku}: ${e?.message || e}`);
    }
  }
  const linkkiTulokset = await rinnakkain([...linkit.keys()], RINNAKKAIN, tarkista);
  for (const t of linkkiTulokset) {
    const mista = linkit.get(t.url);
    if (t.virhe || t.status >= 400 || t.status === 0) virheet.push(`[linkki sivulla ${mista}] ${t.url}: ${t.virhe || `HTTP ${t.status}`}`);
    else if (t.ketju.length > 1) virheet.push(`[linkki sivulla ${mista}] ${t.url}: uudelleenohjausketju ${t.ketju.length} hyppyä -> ${t.lopullinen}`);
    else if (t.ketju.length === 1) varoitukset.push(`[linkki sivulla ${mista}] ${t.url} ohjautuu: ${t.lopullinen}`);
  }

  console.log(`\nTarkistettu: ${urlit.length} sivukartan osoitetta, ${tuoteSlugit.length} tuotetta, ${linkit.size} sisäistä linkkiä ${AVAINSIVUT.length} avainsivulta`);
  if (varoitukset.length) console.log(`\nVaroitukset (${varoitukset.length}):\n${varoitukset.slice(0, 200).map((v) => `  - ${v}`).join("\n")}`);
  if (virheet.length) {
    console.log(`\nVIRHEET (${virheet.length}):\n${virheet.slice(0, 300).map((v) => `  - ${v}`).join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log("\nEi virheitä.");
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFileSync } = await import("node:fs");
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Linkkitarkistus\n\nVirheet: ${virheet.length}, varoitukset: ${varoitukset.length}\n\n${virheet.slice(0, 100).map((v) => `- ${v}`).join("\n")}\n`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
