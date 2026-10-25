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
import { lueEuSiirrot, paivitaSiirrotKantaan, postgresKanta } from "./lib/eu-kanta.mjs";
import { suomenToimitus } from "./lib/eu-painotalot.mjs";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) { console.error("DATABASE_URL puuttuu"); process.exit(1); }
const sql = postgres(url, { ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : "require", max: 1, prepare: false });
const rivit = JSON.parse(readFileSync(new URL("../data/products-snapshot.json", import.meta.url), "utf8"));
const sarakkeet = ["id", "name", "slug", "category", "humor_type", "price", "stock", "description", "images", "variants", "is_featured", "is_new",
  "is_gift_idea", "is_active", "supplier", "aliexpress_url", "origin_country", "printify_product_id", "created_at", "updated_at"];
const siirrot = lueEuSiirrot(fileURLToPath(new URL("../data", import.meta.url)));
// Uusinta-ajo ei palauta jo EU-kopioon siirrettyä riviä vanhaan tuotteeseen.
const nykyiset = new Map((await sql`select slug, printify_product_id from products`).map((r) => [r.slug, String(r.printify_product_id ?? "")]));
const EU_SARAKKEET = new Set(["printify_product_id", "variants", "images", "id", "slug"]);
let n = 0;
for (const r of rivit) {
  const arvot = Object.fromEntries(sarakkeet.map((k) => [k, ["images", "variants"].includes(k) ? sql.json(r[k] ?? (k === "images" ? [] : {})) : r[k] ?? null]));
  const euRivi = String(siirrot.uuteen.get(nykyiset.get(r.slug))?.vanhaId ?? "") === String(r.printify_product_id ?? "-");
  const paivitettavat = sarakkeet.filter((k) => (euRivi ? !EU_SARAKKEET.has(k) : k !== "id" && k !== "slug"));
  await sql`insert into products ${sql(arvot, sarakkeet)} on conflict (slug) do update set ${sql(arvot, paivitettavat)}`;
  n++;
}
console.log(`Tuotu ${n} tuotetta.`);

// ---------- EU-siirrot ----------
const KEY = process.env.PRINTIFY_API_KEY;
const SHOP = process.env.PRINTIFY_SHOP_ID;
let virheita = 0;
if (siirrot.vanhaan.size && KEY && SHOP) {
  globalThis.Deno ??= { env: { get: (k) => process.env[k] } };
  const { buildProductRow } = await import("../supabase/functions/_shared/printify-sync.ts");
  const hae = async (polku) => {
    for (let yritys = 1; ; yritys++) {
      const res = await fetch(`https://api.printify.com/v1${polku}`, { headers: { Authorization: `Bearer ${KEY}`, "User-Agent": "huumorikauppa-tuonti" } });
      if ((res.status === 429 || res.status >= 500) && yritys < 6) { await new Promise((r) => setTimeout(r, 2000 * 2 ** (yritys - 1))); continue; }
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Printify HTTP ${res.status} ${polku}`);
      return res.json();
    }
  };
  const toimitukset = new Map();
  const toimitus = (bp, pp) => {
    if (!toimitukset.has(`${bp}/${pp}`)) toimitukset.set(`${bp}/${pp}`, hae(`/catalog/blueprints/${bp}/print_providers/${pp}/shipping.json`).then(suomenToimitus).catch(() => null));
    return toimitukset.get(`${bp}/${pp}`);
  };
  console.log(`EU-siirrot (${siirrot.vanhaan.size} kirjattua): päivitetään rivit EU-kopioihin.`);
  const t = await paivitaSiirrotKantaan({
    kanta: postgresKanta(sql), siirrot, buildProductRow, toimitus, haeTuote: (id) => hae(`/shops/${SHOP}/products/${id}.json`),
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
