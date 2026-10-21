#!/usr/bin/env node
/**
 * Siirtää EU:n ulkopuolella painettavat Printify-tuotteet EU-painotaloille (omistajan päätös 21.10.2026).
 * Oletuksena KUIVA-AJO: hakee vain tiedot ja tulostaa suunnitelman, ei kirjoita mitään.
 *
 *   PRINTIFY_API_KEY=... PRINTIFY_SHOP_ID=... [DATABASE_URL=...] npx tsx scripts/printify-eu-painotalot.mjs [valinnat]
 *
 *   --toteuta                   luo uudet tuotteet Printifyyn, kirjaa data/eu-siirto-<pvm>.json ja (jos DATABASE_URL)
 *                               päivittää products-rivin: printify_product_id, variants (variant_map, värit, koot,
 *                               kuvat, costs, shipping_cents) ja images. Nimi, slug, hinta, näkyvyys ja kuvaus säilyvät.
 *   --julkaise                  julkaise uudet tuotteet Printifyssä (POST publish.json). Oletuksena ei: oma tausta
 *                               tilaa product_id + variant_id -tunnuksilla, julkaisua ei tarvita.
 *   --poista-vanhat-julkaisusta vanhat tuotteet POST unpublish.json (niitä EI koskaan poisteta).
 *   --raja N                    käsittele enintään N siirrettävää tuotetta (koeajo).
 *   --vain <printify-id>        käsittele vain tämä tuote.
 *
 * Säännöt ja puhdas logiikka: scripts/lib/eu-painotalot.mjs. Kategoria: buildProductRow (printify-sync.ts),
 * varalla vanhan blueprintin nimi. Jo siirretyt (data/eu-siirto-*.json) ohitetaan, joten ajon voi toistaa.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  onEU, painotalonMaa, valitseSaanto, valitsePainotalo, valitseBlueprint, tuotteenKoko, yhdistaVariantit,
  uudetPrintAreat, uusiTuoteRunko, suomenToimitus, uudetDbVariantit,
} from "./lib/eu-painotalot.mjs";

globalThis.Deno ??= { env: { get: (k) => process.env[k] } };
const { buildProductRow } = await import("../supabase/functions/_shared/printify-sync.ts");

const argv = process.argv.slice(2);
const lippu = (n) => argv.includes(n);
const arvo = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const toteuta = lippu("--toteuta");
const julkaise = lippu("--julkaise");
const poistaVanhatJulkaisusta = lippu("--poista-vanhat-julkaisusta");
const raja = arvo("--raja") ? Number(arvo("--raja")) : Infinity;
const vain = arvo("--vain");

const API = "https://api.printify.com/v1";
const KEY = process.env.PRINTIFY_API_KEY;
const SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY || !SHOP) { console.error("PRINTIFY_API_KEY ja PRINTIFY_SHOP_ID tarvitaan."); process.exit(1); }

const juuri = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataKansio = path.join(juuri, "data");
const odota = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- HTTP: 429/5xx uusitaan porrastetusti ----------
async function api(polku, { method = "GET", body } = {}) {
  for (let yritys = 1; ; yritys++) {
    const res = await fetch(`${API}${polku}`, {
      method,
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "User-Agent": "huumorikauppa-eu-siirto" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if ((res.status === 429 || res.status >= 500) && yritys < 6) {
      const ra = Number(res.headers.get("retry-after"));
      const ms = ra > 0 ? ra * 1000 : Math.min(60000, 2000 * 2 ** (yritys - 1));
      console.warn(`  HTTP ${res.status} ${method} ${polku}, uusi yritys ${ms / 1000} s päästä (${yritys}/5)`);
      await odota(ms);
      continue;
    }
    const teksti = await res.text();
    if (!res.ok) throw new Error(`Printify ${method} ${polku}: HTTP ${res.status} ${teksti.slice(0, 300)}`);
    return teksti ? JSON.parse(teksti) : null;
  }
}

const vm = new Map();
const muisti = (avain, f) => { if (!vm.has(avain)) vm.set(avain, f()); return vm.get(avain); };
const painotalo = (id) => muisti(`pp/${id}`, () => api(`/catalog/print_providers/${id}.json`));
const painotalot = () => muisti("pp", () => api(`/catalog/print_providers.json`));
const blueprintit = () => muisti("bp", () => api(`/catalog/blueprints.json`));
const blueprint = (id) => muisti(`bp/${id}`, () => api(`/catalog/blueprints/${id}.json`).catch(() => null));
const katalogiVariantit = (bp, pp) => muisti(`v/${bp}/${pp}`, async () => {
  const j = await api(`/catalog/blueprints/${bp}/print_providers/${pp}/variants.json`);
  return Array.isArray(j) ? j : j?.variants || [];
});
const toimitus = (bp, pp) => muisti(`s/${bp}/${pp}`, () => api(`/catalog/blueprints/${bp}/print_providers/${pp}/shipping.json`).then(suomenToimitus).catch(() => null));

/** Kohdepainotalon tarjoamat blueprintit: painotalon katalogitiedoista, varalla blueprints.json + tarkistus. */
async function painotalonBlueprintit(pp, saanto) {
  const tiedot = await painotalo(pp.id);
  if (Array.isArray(tiedot?.blueprints) && tiedot.blueprints.length) return tiedot.blueprints;
  return muisti(`ppbp/${pp.id}/${saanto.kategoria}`, async () => {
    const osat = (saanto.blueprint.sisaltaa || []).map((s) => s.toLowerCase());
    if (!osat.length) return []; // ilman hakusanoja ei käydä koko katalogia läpi
    const kaikki = await blueprintit();
    const ehdokkaat = kaikki.filter((b) => osat.every((o) => `${b.title} ${b.brand} ${b.model}`.toLowerCase().includes(o)));
    const tulos = [];
    for (const b of ehdokkaat) {
      const tarjoajat = await api(`/catalog/blueprints/${b.id}/print_providers.json`);
      if ((tarjoajat || []).some((t) => Number(t.id) === Number(pp.id))) tulos.push(b);
    }
    return tulos;
  });
}

/** Säännön kohde (painotalo + blueprint) tai { syy }. */
async function ratkaiseKohde(saanto, vanha, vanhaBp) {
  const pv = valitsePainotalo(await painotalot(), saanto.painotalo);
  if (!pv.ok) return { syy: pv.syy };
  const maa = painotalonMaa(await painotalo(pv.painotalo.id));
  if (!onEU(maa)) return { syy: `kohdepainotalo ${pv.painotalo.title} ei ole EU:ssa (${maa ?? "maa puuttuu"})` };
  if (saanto.blueprint.sama && !saanto.blueprint.sisaltaa?.length) {
    // Vain sama blueprint kelpaa: tarkista suoraan, tarjoaako kohdepainotalo sitä.
    const tarjoajat = await api(`/catalog/blueprints/${vanha.blueprint_id}/print_providers.json`).catch(() => []);
    if ((tarjoajat || []).some((t) => Number(t.id) === Number(pv.painotalo.id)) && vanhaBp) {
      return { painotalo: pv.painotalo, maa, blueprint: vanhaBp, peruste: "sama blueprint" };
    }
  }
  const lista = await painotalonBlueprintit(pv.painotalo, saanto);
  const bv = valitseBlueprint(lista, saanto, { blueprint_id: vanha.blueprint_id, blueprintTitle: vanhaBp?.title, koko: tuotteenKoko(vanha.variants) });
  if (!bv.ok) return { syy: `${pv.painotalo.title}: ${bv.syy}` };
  return { painotalo: pv.painotalo, maa, blueprint: bv.blueprint, peruste: bv.peruste };
}

// ---------- Kauppa ----------
async function kaikkiTuotteet() {
  const kaikki = [];
  for (let sivu = 1; ; sivu++) {
    const j = await api(`/shops/${SHOP}/products.json?page=${sivu}&limit=50`);
    const tuotteet = Array.isArray(j) ? j : j?.data || [];
    kaikki.push(...tuotteet);
    if (!tuotteet.length || tuotteet.length < 50 || (j?.last_page && sivu >= j.last_page)) break;
  }
  return kaikki;
}

function joSiirretyt() {
  const ids = new Set();
  if (!existsSync(dataKansio)) return ids;
  for (const f of readdirSync(dataKansio).filter((f) => /^eu-siirto-.*\.json$/.test(f))) {
    try { for (const r of JSON.parse(readFileSync(path.join(dataKansio, f), "utf8")).siirrot || []) ids.add(String(r.vanhaId)); } catch { /* rikkinäinen kirjaus ohitetaan */ }
  }
  return ids;
}

const pvm = new Date().toISOString().slice(0, 10);
const kirjausPolku = path.join(dataKansio, `eu-siirto-${pvm}.json`);
const kirjaus = existsSync(kirjausPolku) ? JSON.parse(readFileSync(kirjausPolku, "utf8")) : { paiva: pvm, siirrot: [] };
const tallennaKirjaus = () => { mkdirSync(dataKansio, { recursive: true }); writeFileSync(kirjausPolku, JSON.stringify(kirjaus, null, 2) + "\n"); };

let sql = null;
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (toteuta && dbUrl) {
  const { default: postgres } = await import("postgres");
  sql = postgres(dbUrl, { ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(dbUrl) ? false : "require", max: 1, prepare: false });
}

async function paivitaKanta(vanhaId, uusi) {
  const rivit = await sql`select slug, variants from products where printify_product_id = ${vanhaId}`;
  if (!rivit.length) return "ei riviä kannassa";
  const rakennettu = buildProductRow(uusi, []);
  if (!rakennettu) return "buildProductRow ei tunnistanut uutta tuotetta, kantaa ei päivitetty";
  const shipping = await toimitus(uusi.blueprint_id, uusi.print_provider_id);
  for (const r of rivit) {
    const variants = uudetDbVariantit(r.variants, rakennettu, uusi, shipping);
    await sql`update products set printify_product_id = ${uusi.id}, variants = ${sql.json(variants)},
      ${rakennettu.images.length ? sql`images = ${sql.json(rakennettu.images)},` : sql``} updated_at = now() where slug = ${r.slug}`;
  }
  return `päivitetty ${rivit.map((r) => r.slug).join(", ")}`;
}

// ---------- Ajo ----------
console.log(`EU-painotalosiirto ${toteuta ? "(TOTEUTUS)" : "(kuiva-ajo, ei kirjoita mitään)"}`);
const siirretyt = joSiirretyt();
let tuotteet = await kaikkiTuotteet();
if (vain) tuotteet = tuotteet.filter((p) => String(p.id) === vain);
console.log(`Kaupassa ${tuotteet.length} tuotetta.`);

const yhteenveto = {}; // kategoria -> { siirretaan, ohitetaan }
const laske = (k, kentta) => { yhteenveto[k] ??= { siirretaan: 0, ohitetaan: 0 }; yhteenveto[k][kentta]++; };
let euSsa = 0, jo = 0, kasitelty = 0;

for (const lista of tuotteet) {
  const maa = painotalonMaa(await painotalo(lista.print_provider_id).catch(() => null));
  if (onEU(maa)) { euSsa++; continue; }
  if (siirretyt.has(String(lista.id))) { jo++; continue; }
  if (kasitelty >= raja) break;
  kasitelty++;

  const vanha = await api(`/shops/${SHOP}/products/${lista.id}.json`);
  const vanhaPp = await painotalo(vanha.print_provider_id);
  const vanhaBp = await blueprint(vanha.blueprint_id);
  const kategoria = buildProductRow(vanha, [])?.category || buildProductRow({ title: vanhaBp?.title || "" }, [])?.category || "tuntematon";
  console.log(`\n${vanha.title}  [${vanha.id}]  ${kategoria}`);
  console.log(`  nyt: ${vanhaPp?.title ?? vanha.print_provider_id} (${maa ?? "?"}), blueprint ${vanhaBp?.title ?? vanha.blueprint_id} (${vanha.blueprint_id})`);
  const ohita = (syy) => { console.log(`  OHITETAAN: ${syy}`); laske(kategoria, "ohitetaan"); };

  const saanto = valitseSaanto(kategoria, vanhaPp?.title);
  if (!saanto) { ohita(`ei siirtosääntöä (kategoria ${kategoria}, painotalo ${vanhaPp?.title ?? "?"})`); continue; }
  const kohde = await ratkaiseKohde(saanto, vanha, vanhaBp);
  if (kohde.syy) { ohita(kohde.syy); continue; }

  const uudet = await katalogiVariantit(kohde.blueprint.id, kohde.painotalo.id);
  const { yhdistetyt, pudotetut } = yhdistaVariantit(vanha.variants, uudet);
  const { print_areas, pudotetutPaikat } = uudetPrintAreat(vanha.print_areas, yhdistetyt, uudet);
  console.log(`  ->  ${kohde.painotalo.title} (${kohde.maa}), blueprint ${kohde.blueprint.title}${kohde.blueprint.model ? ` ${kohde.blueprint.model}` : ""} (${kohde.blueprint.id}), peruste: ${kohde.peruste}`);
  const pudKaytossa = pudotetut.filter((p) => p.is_enabled);
  console.log(`  variantit: ${yhdistetyt.length} yhdistetty${yhdistetyt.some((y) => y.ainoa) ? " (ainoa variantti)" : ""}, ${pudKaytossa.length} käytössä olevaa pudotetaan${pudotetut.length - pudKaytossa.length ? `, ${pudotetut.length - pudKaytossa.length} pois käytöstä olevaa pudotetaan` : ""}`);
  if (pudKaytossa.length) console.log(`    pudotetaan: ${pudKaytossa.map((p) => p.title).join(", ")}`);
  if (pudotetutPaikat.length) console.log(`    painopaikat joita kohteella ei ole: ${pudotetutPaikat.join(", ")}`);
  if (!yhdistetyt.some((y) => y.is_enabled)) { ohita("yksikään käytössä oleva variantti ei vastaa kohdeblueprintia"); continue; }
  if (!print_areas.length) { ohita("painokuvia ei voitu siirtää (ei yhteisiä painopaikkoja)"); continue; }
  laske(kategoria, "siirretaan");
  if (!toteuta) continue;

  const runko = uusiTuoteRunko(vanha, kohde.blueprint.id, kohde.painotalo.id, yhdistetyt, print_areas);
  const luotu = await api(`/shops/${SHOP}/products.json`, { method: "POST", body: runko });
  console.log(`  LUOTU ${luotu.id}`);
  const rivi = {
    vanhaId: vanha.id, uusiId: luotu.id, title: vanha.title, kategoria,
    vanha: { painotalo: vanhaPp?.title, maa, blueprint_id: vanha.blueprint_id, print_provider_id: vanha.print_provider_id },
    uusi: { painotalo: kohde.painotalo.title, maa: kohde.maa, blueprint_id: kohde.blueprint.id, print_provider_id: kohde.painotalo.id },
    yhdistetyt: yhdistetyt.map(({ vanhaId, uusiId, title }) => ({ vanhaId, uusiId, title })),
    pudotetut, pudotetutPaikat, julkaistu: false, vanhaPoistettuJulkaisusta: false, kanta: null,
  };
  kirjaus.siirrot.push(rivi);
  tallennaKirjaus();
  if (julkaise) {
    await api(`/shops/${SHOP}/products/${luotu.id}/publish.json`, { method: "POST", body: { title: true, description: true, images: true, variants: true, tags: true, keyFeatures: true, shipping_template: true } });
    rivi.julkaistu = true;
  }
  if (poistaVanhatJulkaisusta) {
    await api(`/shops/${SHOP}/products/${vanha.id}/unpublish.json`, { method: "POST" });
    rivi.vanhaPoistettuJulkaisusta = true;
  }
  const uusi = await api(`/shops/${SHOP}/products/${luotu.id}.json`);
  const halvat = (uusi.variants || []).filter((v) => v.is_enabled && v.cost != null && v.price <= v.cost);
  if (halvat.length) console.log(`  VAROITUS: hinta <= kulu ${halvat.length} variantilla (${halvat.map((v) => v.title).join(", ")})`);
  if (sql) { rivi.kanta = await paivitaKanta(vanha.id, uusi); console.log(`  kanta: ${rivi.kanta}`); }
  tallennaKirjaus();
  await odota(1500); // tuotteen luonti on hidas ja rajoitettu, pidetään väliä
}

console.log(`\nYhteenveto: EU:ssa jo ${euSsa}, aiemmin siirretty ${jo}, käsitelty ${kasitelty}${kasitelty >= raja ? ` (raja ${raja})` : ""}.`);
for (const [k, v] of Object.entries(yhteenveto).sort()) console.log(`  ${k.padEnd(14)} siirretään ${v.siirretaan}, ohitetaan ${v.ohitetaan}`);
if (toteuta) console.log(`Kirjaus: ${path.relative(juuri, kirjausPolku)}`);
if (sql) await sql.end();
