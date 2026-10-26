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
 * EU-siirrot (data/eu-siirto-*.json, scripts/lib/eu-kanta.mjs): vanhaa Printify-tuotetta, jolla on EU-kopio, ei tuoda;
 * EU-kopio päivittää vanhan tuotteen rivin (slug, nimi, hinta, näkyvyys ja kuvaus säilyvät) eikä luo kaksoisriviä.
 *   PRINTIFY_API_KEY=... PRINTIFY_SHOP_ID=... DATABASE_URL=... npx tsx scripts/printify-tuonti.mjs [--kuiva] [--hinnat]
 */
import postgres from "postgres";
import { fileURLToPath } from "node:url";
import { lueEuSiirrot, postgresKanta, printifyHaut, tuoPrintifysta } from "./lib/eu-kanta.mjs";

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

const { kulutRivi } = printifyHaut({ apiKey: process.env.PRINTIFY_API_KEY, shopId: process.env.PRINTIFY_SHOP_ID });
const siirrot = lueEuSiirrot(fileURLToPath(new URL("../data", import.meta.url)));
const t = await tuoPrintifysta({ tuotteet, kanta: sql ? postgresKanta(sql) : null, siirrot, buildProductRow, kulutRivi, hinnat, kulut, julkaise, kuiva });
console.log(`Printify: ${tuotteet.length} tuotetta. Uusia ${t.uusia}, päivitetty ${t.paivitetty}, vanha rivi siirretty EU-kopioon ${t.korvattu}, ` +
  `ohitettu vanhana (EU-kopio korvaa) ${t.ohitettuSiirretty}, ohitettu ${t.ohitettu}${kuiva ? " (kuiva-ajo)" : ""}.`);
if (t.poistetut.length) console.log(`Poistettu EU-kopion kaksoisrivit: ${t.poistetut.join(", ")}`);
if (sql) await sql.end();
