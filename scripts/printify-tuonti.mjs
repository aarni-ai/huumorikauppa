#!/usr/bin/env node
/**
 * Tuotteet suoraan Printifystä omaan tietokantaan (jos tilannekuva vanhenee tai Printifyyn tulee uusia tuotteita).
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
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url && !kuiva) { console.error("DATABASE_URL puuttuu (tai aja --kuiva)"); process.exit(1); }
const sql = url ? postgres(url, { ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : "require", max: 1, prepare: false }) : null;

const tuotteet = await fetchAllPrintifyProducts();
const olemassa = sql ? await sql`select slug, printify_product_id from products` : [];
const slugit = olemassa.map((r) => r.slug);
const byPrintify = new Map(olemassa.filter((r) => r.printify_product_id).map((r) => [r.printify_product_id, r.slug]));
let uusia = 0, paivitetty = 0, ohitettu = 0;
for (const p of tuotteet) {
  const rivi = buildProductRow(p, slugit);
  if (!rivi) { ohitettu++; continue; }
  const vanhaSlug = byPrintify.get(rivi.printify_product_id);
  if (kuiva) { vanhaSlug ? paivitetty++ : uusia++; continue; }
  if (vanhaSlug) {
    await sql`update products set printify_product_id = ${rivi.printify_product_id}, variants = ${sql.json(rivi.variants)},
      images = ${sql.json(rivi.images)}, updated_at = now() ${hinnat ? sql`, price = ${rivi.price}` : sql``} where slug = ${vanhaSlug}`;
    paivitetty++;
  } else {
    await sql`insert into products (name, slug, category, humor_type, price, stock, description, images, variants, printify_product_id, supplier)
      values (${rivi.name}, ${rivi.slug}, ${rivi.category}, ${rivi.humor_type ?? null}, ${rivi.price}, ${rivi.stock ?? 99}, ${rivi.description ?? null},
        ${sql.json(rivi.images)}, ${sql.json(rivi.variants)}, ${rivi.printify_product_id}, 'printify') on conflict (slug) do nothing`;
    slugit.push(rivi.slug);
    uusia++;
  }
}
console.log(`Printify: ${tuotteet.length} tuotetta. Uusia ${uusia}, päivitetty ${paivitetty}, ohitettu ${ohitettu}${kuiva ? " (kuiva-ajo)" : ""}.`);
if (sql) await sql.end();
