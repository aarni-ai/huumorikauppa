#!/usr/bin/env node
/**
 * Tuotteet tilannekuvasta (data/products-snapshot.json) omaan tietokantaan. Turvallinen ajaa uudelleen (upsert slugin mukaan).
 *   DATABASE_URL=... [PRINTIFY_API_KEY=... PRINTIFY_SHOP_ID=...] node scripts/tuo-tuotteet.mjs
 *
 * Tilannekuva on ajalta ennen EU-painotalosiirtoa, joten sen rivit osoittavat vanhoihin Printify-tuotteisiin. Lopuksi
 * kirjatut siirrot (data/eu-siirto-*.json) viedään kantaan: rivi siirtyy EU-kopioon (printify_product_id, variantit,
 * kulut, kuvat), slug, nimi, hinta, näkyvyys ja kuvaus säilyvät (scripts/lib/eu-kanta.mjs). Ilman Printify-avainta
 * rivit jäävät vanhoihin tuotteisiin (ne ovat yhä tilattavissa) ja skripti kertoo, miten siirrot ajetaan myöhemmin.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { lueEuSiirrot, paivitaSiirrotKantaan, postgresKanta, printifyHaut, tuoTilannekuvaRivit } from "./lib/eu-kanta.mjs";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) { console.error("DATABASE_URL puuttuu"); process.exit(1); }
const sql = postgres(url, { ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : "require", max: 1, prepare: false });
const rivit = JSON.parse(readFileSync(new URL("../data/products-snapshot.json", import.meta.url), "utf8"));
const siirrot = lueEuSiirrot(fileURLToPath(new URL("../data", import.meta.url)));
const n = await tuoTilannekuvaRivit(sql, rivit, siirrot);
console.log(`Tuotu ${n} tuotetta.`);

// ---------- EU-siirrot ----------
const KEY = process.env.PRINTIFY_API_KEY;
const SHOP = process.env.PRINTIFY_SHOP_ID;
let virheita = 0;
if (siirrot.vanhaan.size && KEY && SHOP) {
  globalThis.Deno ??= { env: { get: (k) => process.env[k] } };
  const { buildProductRow } = await import("../supabase/functions/_shared/printify-sync.ts");
  const { haeTuote, toimitus } = printifyHaut({ apiKey: KEY, shopId: SHOP });
  console.log(`EU-siirrot (${siirrot.vanhaan.size} kirjattua): päivitetään rivit EU-kopioihin.`);
  const t = await paivitaSiirrotKantaan({
    kanta: postgresKanta(sql), siirrot, buildProductRow, toimitus, haeTuote,
  });
  virheita = t.virheet.length;
  console.log(`EU-siirrot: päivitetty ${t.paivitetty} riviä, jo EU-kopiossa ${t.jo}, ei riviä kannassa ${t.eiRivia}, virheitä ${virheita}.`);
  for (const v of t.virheet) console.log(`  ${v.vanhaId} -> ${v.uusiId}: ${v.virhe}`);
} else if (siirrot.vanhaan.size) {
  console.log(`EU-siirtoja ${siirrot.vanhaan.size} kirjattu, mutta PRINTIFY_API_KEY/PRINTIFY_SHOP_ID puuttuu: rivit osoittavat vielä vanhoihin`);
  console.log("Printify-tuotteisiin (tilattavissa). Vie siirrot kantaan myöhemmin:");
  console.log("  set -a && . ./.env.local && . ./.env.printify.local && set +a && npx tsx scripts/printify-eu-painotalot.mjs --paivita-kanta");
}
await sql.end();
if (virheita) process.exit(1);
