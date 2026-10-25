#!/usr/bin/env node
/**
 * Tilattavuustarkistus omalle taustalle: jokaisen aktiivisen tuoterivin (is_active) jokaisen variants.variant_map-
 * avaimen ("Väri|Koko" -> Printify-variantti) on oltava käytössä (is_enabled) ja saatavilla (is_available) siinä
 * Printify-tuotteessa, johon rivi osoittaa (printify_product_id). Ajetaan, kun kanta on täytetty (tuonti, EU-siirrot,
 * kulut) ja aina epäiltäessä, ettei tilaus mene Printifyyn. Ei kirjoita mitään, ei luo tilauksia.
 *
 *   DATABASE_URL=... PRINTIFY_API_KEY=... PRINTIFY_SHOP_ID=... node scripts/tarkista-tilattavuus.mjs [--lahde URL] [--json]
 *
 *   --lahde URL  tuoterivit JSON-osoitteesta (taulukko tai { products | data: [...] }) kannan sijaan
 *   --json       tulosta tulos JSONina
 *
 * Raportoi tilaamattomat avaimet syineen: printify_tuote_puuttuu (404), variantti_puuttuu, ei_kaytossa, ei_saatavilla,
 * virheellinen_variantti (arvo ei ole numero), ei_printify_id, variant_map_tyhja. Varoittaa riveistä, jotka osoittavat
 * yhä vanhaan tuotteeseen, jolla on EU-kopio (data/eu-siirto-*.json: aja printify-eu-painotalot.mjs --paivita-kanta).
 * Poistumiskoodi 1, jos yksikin avain ei ole tilattavissa.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPrintifyClient } from "./printify-saatavuus.mjs";
import { lueEuSiirrot } from "./lib/eu-kanta.mjs";

const juuri = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Puhdas tarkistus. printifyGet: createPrintifyClient-funktio ({ status, data }). */
export async function tarkistaTilattavuus({ rivit, printifyGet, shopId, siirrot = null }) {
  const ongelmat = [];
  const vanhaan = [];
  let tuotteita = 0, avaimia = 0;
  for (const r of rivit) {
    if (!r || r.is_active === false) continue;
    if (r.supplier && r.supplier !== "printify") continue;
    tuotteita++;
    const kartta = r.variants?.variant_map && typeof r.variants.variant_map === "object" ? r.variants.variant_map : {};
    const avaimet = Object.entries(kartta);
    avaimia += avaimet.length;
    const pid = r.printify_product_id ? String(r.printify_product_id) : null;
    const lisaa = (avain, variantId, syy) => ongelmat.push({ slug: r.slug, printify_product_id: pid, avain, variantId, syy });
    if (!pid) { lisaa(null, null, "ei_printify_id"); continue; }
    if (!avaimet.length) { lisaa(null, null, "variant_map_tyhja"); continue; }
    if (siirrot?.vanhaan.has(pid)) vanhaan.push({ slug: r.slug, vanhaId: pid, uusiId: String(siirrot.vanhaan.get(pid).uusiId) });
    const { status, data } = await printifyGet(`/shops/${shopId}/products/${pid}.json`);
    if (status === 404 || !data) { for (const [k, v] of avaimet) lisaa(k, v, "printify_tuote_puuttuu"); continue; }
    const variantit = new Map((data.variants || []).map((v) => [Number(v.id), v]));
    for (const [k, v] of avaimet) {
      if (typeof v !== "number") { lisaa(k, v, "virheellinen_variantti"); continue; }
      const pv = variantit.get(v);
      if (!pv) lisaa(k, v, "variantti_puuttuu");
      else if (!pv.is_enabled) lisaa(k, v, "ei_kaytossa");
      else if (pv.is_available === false) lisaa(k, v, "ei_saatavilla");
    }
  }
  const syyt = {};
  for (const o of ongelmat) syyt[o.syy] = (syyt[o.syy] ?? 0) + 1;
  return { tuotteita, avaimia, ongelmat, syyt, vanhaan };
}

async function lueRivit(lahde) {
  if (lahde) {
    const res = await fetch(lahde);
    if (!res.ok) throw new Error(`Tuotelista ${res.status}: ${lahde}`);
    const d = await res.json();
    return Array.isArray(d) ? d : d?.products ?? d?.data ?? [];
  }
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL puuttuu (tai anna --lahde).");
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, { ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : "require", max: 1, prepare: false });
  try {
    return await sql`select slug, is_active, supplier, printify_product_id, variants from products where is_active is not false order by slug`;
  } finally {
    await sql.end();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const lahde = args.includes("--lahde") ? args[args.indexOf("--lahde") + 1] : null;
  const KEY = process.env.PRINTIFY_API_KEY;
  const SHOP = process.env.PRINTIFY_SHOP_ID;
  if (!KEY || !SHOP) { console.error("PRINTIFY_API_KEY ja PRINTIFY_SHOP_ID tarvitaan."); process.exit(2); }
  const rivit = await lueRivit(lahde);
  const siirrot = lueEuSiirrot(path.join(juuri, "data"), { varoita: () => {} });
  const tulos = await tarkistaTilattavuus({ rivit, printifyGet: createPrintifyClient({ apiKey: KEY }), shopId: SHOP, siirrot });
  if (args.includes("--json")) console.log(JSON.stringify(tulos, null, 2));
  else {
    console.log(`Tarkistettu ${tulos.tuotteita} aktiivista tuotetta, ${tulos.avaimia} variant_map-avainta.`);
    console.log(`Ei tilattavissa: ${tulos.ongelmat.length}${tulos.ongelmat.length ? ` ${JSON.stringify(tulos.syyt)}` : ""}`);
    for (const o of tulos.ongelmat) console.log(`  ${o.slug}  ${o.avain ?? "-"}  ${o.variantId ?? "-"}  ${o.syy}  (${o.printify_product_id ?? "ei id:tä"})`);
    if (tulos.vanhaan.length) {
      console.log(`Varoitus: ${tulos.vanhaan.length} riviä osoittaa vanhaan tuotteeseen, jolla on EU-kopio (aja printify-eu-painotalot.mjs --paivita-kanta):`);
      for (const v of tulos.vanhaan) console.log(`  ${v.slug}  ${v.vanhaId} -> ${v.uusiId}`);
    }
  }
  process.exit(tulos.ongelmat.length ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e?.message ?? e); process.exit(2); });
}
