/**
 * Katteet Printifyn todellisilla kuluilla -> KATTEET.md (ei kirjoita tietokantaan).
 *
 * Hakee kaikki Printify-kaupan tuotteet (variantit kuluineen) ja Suomen toimituskulun painotaloittain, yhdistää ne
 * myynnissä oleviin tuotteisiin printify_product_id:llä ja laskee jokaisen variantin katteen kaupan kaavalla
 * (api/_lib/kate.js laskeKate) kahdella toimitusehdolla: nykyinen kassa 6,90 € / ilmainen 79 €:sta ja oma tausta
 * 5,90 € / 60 €:sta. Tuotteen kate = heikoin myytävä variantti.
 *
 *   set -a; . ./.env.printify.local; . ./.env.production.local; set +a
 *   node scripts/katteet.mjs [--lahde https://huumorikauppa.fi/api/products] [--json data/katteet.json] [--eu]
 *
 * --eu: EU-siirron jälkeen. Tuote, jonka Printify-tuote on siirretty (data/eu-siirto-*.json), lasketaan EU-kopion
 * kuluilla ja painotalolla, vaikka kaupan rivi osoittaisi vielä vanhaan. Vertailu kirjoitetaan KATTEET.md:hen.
 *
 * Tuotelähde: oletuksena Supabasen anon REST (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY), tai --lahde.
 */
import fs from "node:fs/promises";
import { laskeKate, KATE_RAJA } from "../api/_lib/kate.js";
import { onPiilotettuTuote } from "../api/_lib/piilotetut.js";

const KEY = process.env.PRINTIFY_API_KEY;
const SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY || !SHOP) { console.error("PRINTIFY_API_KEY ja PRINTIFY_SHOP_ID tarvitaan."); process.exit(1); }
const arvo = (n) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : null);

const EHDOT = {
  nyky: { toimitusmaksu: 6.9, ilmainenRaja: 79, nimi: "6,90 € / 79 €" },
  oma: { toimitusmaksu: 5.9, ilmainenRaja: 60, nimi: "5,90 € / 60 €" },
};

let viimeisin = 0;
async function printify(polku) {
  for (let yritys = 0; yritys < 5; yritys++) {
    const odota = viimeisin + 200 - Date.now();
    if (odota > 0) await new Promise((r) => setTimeout(r, odota));
    viimeisin = Date.now();
    const res = await fetch(`https://api.printify.com/v1${polku}`, { headers: { Authorization: `Bearer ${KEY}` } });
    if (res.status === 429 || res.status >= 500) { await new Promise((r) => setTimeout(r, 1000 * 2 ** yritys)); continue; }
    if (!res.ok) throw new Error(`Printify ${polku}: HTTP ${res.status}`);
    return res.json();
  }
  throw new Error(`Printify ${polku}: ei vastausta`);
}

async function kauppaTuotteet() {
  const out = [];
  for (let sivu = 1; sivu < 100; sivu++) {
    const j = await printify(`/shops/${SHOP}/products.json?limit=50&page=${sivu}`);
    out.push(...(j.data || []));
    if (!j.next_page_url || (j.last_page && sivu >= j.last_page)) break;
  }
  return out;
}

const toimitusVm = new Map();
async function suomenToimitus(bp, pp) {
  const k = `${bp}/${pp}`;
  if (!toimitusVm.has(k)) {
    let cost = null;
    try {
      const j = await printify(`/catalog/blueprints/${bp}/print_providers/${pp}/shipping.json`);
      const prof = j?.profiles || [];
      const fi = prof.find((x) => (x.countries || []).includes("FI")) || prof.find((x) => (x.countries || []).includes("REST_OF_THE_WORLD"));
      cost = fi?.first_item?.cost ?? null;
    } catch { cost = null; }
    toimitusVm.set(k, cost);
  }
  return toimitusVm.get(k);
}

const painotaloVm = new Map();
async function painotalo(pp) {
  if (!painotaloVm.has(pp)) {
    try {
      const j = await printify(`/catalog/print_providers/${pp}.json`);
      painotaloVm.set(pp, { nimi: j.title, maa: j.location?.country ?? "?" });
    } catch { painotaloVm.set(pp, { nimi: `#${pp}`, maa: "?" }); }
  }
  return painotaloVm.get(pp);
}

async function myytavat() {
  const lahde = arvo("--lahde");
  if (lahde) return (await (await fetch(lahde)).json()).filter((p) => p.is_active !== false && !onPiilotettuTuote(p));
  const url = process.env.VITE_SUPABASE_URL, k = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const rivit = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${url}/rest/v1/products?select=slug,name,category,price,variants,printify_product_id,is_active&order=slug`, {
      headers: { apikey: k, Authorization: `Bearer ${k}`, Range: `${from}-${from + 999}`, "Range-Unit": "items" },
    });
    const j = await res.json();
    rivit.push(...j);
    if (j.length < 1000) break;
  }
  // Lovable-synkronoinnin kaksoiskappaleet (slug-pääte = Printify-id:n 6 viimeistä merkkiä) ja testikopiot eivät ole myynnissä.
  const kaksoiskappale = (slug) => /^.+-(?=[0-9a-f]*\d)[0-9a-f]{6}$/.test(slug) || slug.startsWith("copy-of-") || slug === "ceramic-mug-eu";
  return rivit.filter((p) => p.is_active !== false && !kaksoiskappale(p.slug));
}

const eur = (x) => (x == null ? "-" : `${x.toFixed(2).replace(".", ",")} €`);
const pros = (x) => (x == null ? "-" : `${(x * 100).toFixed(1).replace(".", ",")} %`);

const [tuotteet, pf] = await Promise.all([myytavat(), kauppaTuotteet()]);
const pfById = new Map(pf.map((p) => [String(p.id), p]));
// EU-siirrot: vanha Printify-id -> EU-kopion id (data/eu-siirto-*.json).
const siirrot = new Map();
for (const f of (await fs.readdir("data")).filter((x) => /^eu-siirto-.*\.json$/.test(x))) {
  for (const s of JSON.parse(await fs.readFile(`data/${f}`, "utf8")).siirrot || []) siirrot.set(String(s.vanhaId), String(s.uusiId));
}
const EU = process.argv.includes("--eu");
const kohde = (id) => (EU && siirrot.has(String(id)) ? siirrot.get(String(id)) : String(id));
// EU-kopiolla on uudet varianttitunnukset vain, jos blueprint vaihtui; kartta käännetään nimellä (värin ja koon otsikko).
const tulos = [];
for (const t of tuotteet) {
  const vanha = pfById.get(String(t.printify_product_id));
  const p = pfById.get(kohde(t.printify_product_id)) || vanha;
  const piilossa = onPiilotettuTuote(t);
  if (!p) { tulos.push({ slug: t.slug, name: t.name, category: t.category, price: Number(t.price), piilossa, puuttuu: true }); continue; }
  const shipping = await suomenToimitus(p.blueprint_id, p.print_provider_id);
  const pt = await painotalo(p.print_provider_id);
  const costs = Object.fromEntries((p.variants || []).filter((v) => v.is_enabled).map((v) => [String(v.id), v.cost]));
  const rivi = { ...t, variants: { ...(t.variants || {}), costs, shipping_cents: shipping } };
  let idt = Object.values(t.variants?.variant_map || {}).filter((id) => typeof costs[String(id)] === "number");
  if (!idt.length && p !== vanha) idt = Object.keys(costs); // blueprint vaihtui (mukit): kaikki EU-kopion variantit
  const heikoin = (ehto) => {
    const k = idt.map((id) => ({ id, ...laskeKate(rivi, id, ehto) })).filter((x) => x.tunnettu);
    return k.length ? k.reduce((a, b) => (b.kate < a.kate ? b : a)) : null;
  };
  const nyky = heikoin(EHDOT.nyky), oma = heikoin(EHDOT.oma);
  const kulu = nyky ? costs[String(nyky.id)] / 100 : null;
  tulos.push({
    slug: t.slug, name: t.name, category: t.category, price: Number(t.price), piilossa,
    printify_product_id: String(p.id), blueprint_id: p.blueprint_id, provider_id: p.print_provider_id, painotalo: pt.nimi, maa: pt.maa,
    kulu, toimitus: shipping == null ? null : shipping / 100,
    nyky: nyky && { nettokate: nyky.nettokate, kate: nyky.kate }, oma: oma && { nettokate: oma.nettokate, kate: oma.kate },
  });
}

const myynnissa = tulos.filter((r) => !r.piilossa);
const tunnetut = myynnissa.filter((r) => r.nyky);
const alle = (e) => tunnetut.filter((r) => r[e].kate < KATE_RAJA);
const kat = new Map();
for (const r of tunnetut) {
  const k = kat.get(r.category) || { n: 0, nyky: 0, oma: 0, alleNyky: 0, alleOma: 0 };
  k.n++; k.nyky += r.nyky.kate; k.oma += r.oma.kate;
  if (r.nyky.kate < KATE_RAJA) k.alleNyky++;
  if (r.oma.kate < KATE_RAJA) k.alleOma++;
  kat.set(r.category, k);
}
const talot = new Map();
for (const r of tunnetut) { const k = `${r.painotalo} (${r.maa})`; talot.set(k, (talot.get(k) || 0) + 1); }

const nyt = new Date().toISOString().slice(0, 10);
const md = [
  "# Katteet Printifyn todellisilla kuluilla",
  "",
  `Päivitetty ${nyt} skriptillä \`scripts/katteet.mjs\` (Printify-kauppa ${SHOP}). Kaava api/_lib/kate.js: myynti alv 0 =`,
  "(hinta + toimitusmaksu) / 1,255; nettokate = myynti alv 0 - Printifyn tuotekulu - Suomen toimituskulu (1. kappale) -",
  "Stripe 1,5 % + 0,25 €. Yhden kappaleen tilaus, tuotteen kate = heikoin variantti (yleensä suurin koko). Raja 40 %.",
  "",
  `- Myynnissä ${myynnissa.length} tuotetta, kulut tiedossa ${tunnetut.length}, Printify-tuote puuttuu ${myynnissa.filter((r) => r.puuttuu).length}.`,
  `- Alle 40 %: nykyisellä kassalla (${EHDOT.nyky.nimi}) ${alle("nyky").length} tuotetta, omalla taustalla (${EHDOT.oma.nimi}) ${alle("oma").length}.`,
  "",
  "## Kategorioittain (keskimääräinen heikoimman variantin kate)",
  "",
  "| Kategoria | Tuotteita | Kate 6,90/79 | Kate 5,90/60 | Alle 40 % (6,90/79) | Alle 40 % (5,90/60) |",
  "|---|---|---|---|---|---|",
  ...[...kat].sort((a, b) => b[1].n - a[1].n).map(([c, k]) => `| ${c} | ${k.n} | ${pros(k.nyky / k.n)} | ${pros(k.oma / k.n)} | ${k.alleNyky} | ${k.alleOma} |`),
  "",
  "## Painotalot",
  "",
  ...[...talot].sort((a, b) => b[1] - a[1]).map(([t, n]) => `- ${t}: ${n} tuotetta`),
  "",
  "## Alle 40 %:n tuotteet (5,90 € / 60 €)",
  "",
  "| Tuote | Kategoria | Hinta | Kulu | Toimitus | Nettokate | Kate 5,90/60 | Kate 6,90/79 | Painotalo |",
  "|---|---|---|---|---|---|---|---|---|",
  ...alle("oma").sort((a, b) => a.oma.kate - b.oma.kate).map((r) =>
    `| ${r.slug} | ${r.category} | ${eur(r.price)} | ${eur(r.kulu)} | ${eur(r.toimitus)} | ${eur(r.oma.nettokate)} | ${pros(r.oma.kate)} | ${pros(r.nyky.kate)} | ${r.painotalo} (${r.maa}) |`),
  "",
  "## Kaikki myynnissä olevat",
  "",
  "| Tuote | Hinta | Kulu | Toimitus | Kate 6,90/79 | Kate 5,90/60 | Painotalo |",
  "|---|---|---|---|---|---|---|",
  ...myynnissa.sort((a, b) => a.slug.localeCompare(b.slug)).map((r) =>
    r.nyky
      ? `| ${r.slug} | ${eur(r.price)} | ${eur(r.kulu)} | ${eur(r.toimitus)} | ${pros(r.nyky.kate)} | ${pros(r.oma.kate)} | ${r.painotalo} (${r.maa}) |`
      : `| ${r.slug} | ${eur(r.price)} | - | - | ${r.puuttuu ? "Printify-tuote puuttuu" : "kulu puuttuu"} | - | - |`),
  "",
].join("\n");
const tiedosto = arvo("--md") || "KATTEET.md";
await fs.writeFile(tiedosto, md);
const jsonOut = arvo("--json");
if (jsonOut) await fs.writeFile(jsonOut, JSON.stringify(tulos, null, 2));
console.log(`Myynnissä ${myynnissa.length}, kulut tiedossa ${tunnetut.length}. Alle 40 %: ${alle("nyky").length} (6,90/79), ${alle("oma").length} (5,90/60).`);
console.log([...talot].map(([t, n]) => `${t}: ${n}`).join("\n"));
