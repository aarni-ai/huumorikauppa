#!/usr/bin/env node
/**
 * Tuotteet tilannekuvasta (data/products-snapshot.json) omaan tietokantaan. Turvallinen ajaa uudelleen (upsert slugin mukaan).
 *   DATABASE_URL=... node scripts/tuo-tuotteet.mjs
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) { console.error("DATABASE_URL puuttuu"); process.exit(1); }
const sql = postgres(url, { ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : "require", max: 1, prepare: false });
const rivit = JSON.parse(readFileSync(new URL("../data/products-snapshot.json", import.meta.url), "utf8"));
const sarakkeet = ["id", "name", "slug", "category", "humor_type", "price", "stock", "description", "images", "variants", "is_featured", "is_new",
  "is_gift_idea", "is_active", "supplier", "aliexpress_url", "origin_country", "printify_product_id", "created_at", "updated_at"];
let n = 0;
for (const r of rivit) {
  const arvot = Object.fromEntries(sarakkeet.map((k) => [k, ["images", "variants"].includes(k) ? sql.json(r[k] ?? (k === "images" ? [] : {})) : r[k] ?? null]));
  await sql`insert into products ${sql(arvot, sarakkeet)} on conflict (slug) do update set ${sql(arvot, sarakkeet.filter((k) => k !== "id" && k !== "slug"))}`;
  n++;
}
console.log(`Tuotu ${n} tuotetta.`);
await sql.end();
