#!/usr/bin/env node
/**
 * Tuotteet suoraan Printifystä omaan tietokantaan (jos tilannekuva vanhenee tai Printifyyn tulee uusia tuotteita).
 * Uudet tuotteet tuodaan piilotettuina (is_active false), ellei anneta --julkaise: Printifyyn ilmestyneet tuotteet
 * (esim. 21.10.2026 noin 280 kaupunkimukia) eivät tule myyntiin ilman hyväksyntää. Mukit pysyvät piilossa joka
 * tapauksessa (api/_lib/piilotetut.js).
 *   --kulut          Printifyn kulut katesääntöä varten: variants.costs (variantti -> sentit) ja variants.shipping_cents
 *                    (Suomeen, ensimmäinen kappale). Ajetaan ennen käyttöönottoa ja aina hintojen muuttuessa.
 *   --luotu VVVV-KK-PP  listaa vain Printify-tuotteet, jotka on luotu sinä päivänä (ei kirjoita mitään).
 * Käyttää vanhan taustan muunnoslogiikkaa sellaisenaan (supabase/functions/_shared/printify-sync.ts: kategoriat,
 * variant_map, hintapohjat, kuvajärjestys). Olemassa olevien tuotteiden hinta, näkyvyys ja kuvaus säilyvät
 * (vain Printify-tunnukset, variantit ja kuvat päivittyvät), ellei anneta --hinnat.
 *   PRINTIFY_API_KEY=... PRINTIFY_SHOP_ID=... DATABASE_URL=... npx tsx scripts/printify-tuonti.mjs [--kuiva] [--hinnat]
 */
import postgres from "postgres";

globalThis.Deno = { env: { get: (k) => process.env[k] } };
const { fetchAllPrintifyProducts, buildProductRow } = await import("../supabase/functions/_shared/printify-sync.ts");

const kuiva = process.argv.includes("--kuiva");
const hinnat = process.argv.includes("--hinnat");
const kulut = process.argv.includes("--kulut");
const julkaise = process.argv.includes("--julkaise");
const luotu = process.argv.includes("--luotu") ? process.argv[process.argv.indexOf("--luotu") + 1] : null;
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url && !kuiva && !luotu) { console.error("DATABASE_URL puuttuu (tai aja --kuiva)"); process.exit(1); }
const sql = url ? postgres(url, { ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : "require", max: 1, prepare: false }) : null;

const tuotteet = await fetchAllPrintifyProducts();

if (luotu) {
  const paivan = tuotteet.filter((p) => String(p.created_at || "").startsWith(luotu));
  console.log(`Printify-tuotteita luotu ${luotu}: ${paivan.length}`);
  for (const p of paivan) console.log(`  ${p.created_at}  ${p.id}  bp ${p.blueprint_id} / pp ${p.print_provider_id}  ${p.title}`);
  process.exit(0);
}

// Suomen toimituskulu (ensimmäinen kappale, sentit) painotalokohtaisesti, välimuistissa.
const toimitusVm = new Map();
async function suomenToimitus(bp, pp) {
  const avain = `${bp}/${pp}`;
  if (!toimitusVm.has(avain)) {
    const res = await fetch(`https://api.printify.com/v1/catalog/blueprints/${bp}/print_providers/${pp}/shipping.json`, { headers: { Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}` } });
    const j = res.ok ? await res.json() : null;
    const profiilit = j?.profiles || [];
    const fi = profiilit.find((x) => (x.countries || []).includes("FI")) || profiilit.find((x) => (x.countries || []).includes("REST_OF_THE_WORLD"));
    toimitusVm.set(avain, fi?.first_item?.cost ?? null);
  }
  return toimitusVm.get(avain);
}
async function kulutRivi(p) {
  const costs = Object.fromEntries((p.variants || []).filter((v) => v.is_enabled).map((v) => [String(v.id), v.cost]));
  return { costs, shipping_cents: await suomenToimitus(p.blueprint_id, p.print_provider_id) };
}
const olemassa = sql ? await sql`select slug, printify_product_id from products` : [];
const slugit = olemassa.map((r) => r.slug);
const byPrintify = new Map(olemassa.filter((r) => r.printify_product_id).map((r) => [r.printify_product_id, r.slug]));
let uusia = 0, paivitetty = 0, ohitettu = 0;
for (const p of tuotteet) {
  const rivi = buildProductRow(p, slugit);
  if (!rivi) { ohitettu++; continue; }
  if (kulut) Object.assign(rivi.variants, await kulutRivi(p));
  const vanhaSlug = byPrintify.get(rivi.printify_product_id);
  if (kuiva) { vanhaSlug ? paivitetty++ : uusia++; continue; }
  if (vanhaSlug) {
    await sql`update products set printify_product_id = ${rivi.printify_product_id}, variants = ${sql.json(rivi.variants)},
      images = ${sql.json(rivi.images)}, updated_at = now() ${hinnat ? sql`, price = ${rivi.price}` : sql``} where slug = ${vanhaSlug}`;
    paivitetty++;
  } else {
    await sql`insert into products (name, slug, category, humor_type, price, stock, description, images, variants, printify_product_id, supplier, is_active)
      values (${rivi.name}, ${rivi.slug}, ${rivi.category}, ${rivi.humor_type ?? null}, ${rivi.price}, ${rivi.stock ?? 99}, ${rivi.description ?? null},
        ${sql.json(rivi.images)}, ${sql.json(rivi.variants)}, ${rivi.printify_product_id}, 'printify', ${julkaise}) on conflict (slug) do nothing`;
    slugit.push(rivi.slug);
    uusia++;
  }
}
console.log(`Printify: ${tuotteet.length} tuotetta. Uusia ${uusia}, päivitetty ${paivitetty}, ohitettu ${ohitettu}${kuiva ? " (kuiva-ajo)" : ""}.`);
if (sql) await sql.end();
