#!/usr/bin/env node
/**
 * Tarkistaa kaikkien esirenderöityjen tuotesivujen (dist/tuote/<slug>/index.html) Product-JSON-LD:n
 * Googlen Product snippets- ja Merchant listings -kenttiä vasten. Aja `npm run build` ensin.
 *
 *   node scripts/validoi-tuotedata.mjs [dist-hakemisto]
 *
 * Poistuu koodilla 1, jos yhdessäkin sivussa on virhe tai tuotesivuja ei löydy.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { flattenNodes, extractJsonLd, looksPersonalised, validateProductPage } from "./tuotedata-validointi.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.resolve(process.argv[2] || path.join(ROOT, "dist"));
const tuoteDir = path.join(dist, "tuote");

/** Toimituslupaus luetaan suoraan konfiguraatiosta, jotta tarkistus seuraa sitä. */
function toimitusaika() {
  const src = fs.readFileSync(path.join(ROOT, "src/config/toimitus.ts"), "utf8");
  const num = (name) => Number(src.match(new RegExp(`export const ${name} = (\\d+)`))?.[1]);
  return { min: num("TOIMITUSAIKA_MIN_ARKIPAIVAA"), max: num("TOIMITUSAIKA_MAX_ARKIPAIVAA") };
}

/** Toimitusmaksu ja ilmaisen toimituksen raja samasta konfiguraatiosta. */
function toimitusmaksu() {
  const src = fs.readFileSync(path.join(ROOT, "src/config/toimitus.ts"), "utf8");
  const num = (name) => Number(src.match(new RegExp(`export const ${name} = ([\\d.]+)`))?.[1]);
  return { fee: num("TOIMITUSMAKSU"), freeThreshold: num("ILMAINEN_TOIMITUS_RAJA") };
}

if (!fs.existsSync(tuoteDir)) {
  console.error(`Tuotesivuja ei löydy: ${tuoteDir}. Aja ensin npm run build.`);
  process.exit(1);
}

const expectedDeliveryDays = toimitusaika();
const expectedShipping = toimitusmaksu();
const slugs = fs.readdirSync(tuoteDir).filter((s) => fs.existsSync(path.join(tuoteDir, s, "index.html"))).sort();
let failed = 0;
let personalisedCount = 0;
let jsonLdBlocks = 0;
const failures = [];

for (const slug of slugs) {
  const html = fs.readFileSync(path.join(tuoteDir, slug, "index.html"), "utf8");
  jsonLdBlocks += extractJsonLd(html).length;
  const product = extractJsonLd(html).flatMap((b) => (b.data ? flattenNodes(b.data) : [])).find((n) => n["@type"] === "Product");
  const personalised = product ? looksPersonalised(product.name, product.description) : undefined;
  const { errors, personalised: notPermitted } = validateProductPage(html, { expectedDeliveryDays, expectedShipping, personalised });
  if (product && !personalised && notPermitted) errors.push("MerchantReturnNotPermitted tuotteella, joka ei ole personoitu");
  if (notPermitted) personalisedCount++;
  if (errors.length) {
    failed++;
    failures.push({ slug, errors });
  }
}

for (const f of failures.slice(0, 50)) {
  console.error(`VIRHE /tuote/${f.slug}`);
  for (const e of f.errors) console.error(`  - ${e}`);
}
if (failures.length > 50) console.error(`... ja ${failures.length - 50} muuta sivua`);

console.log(
  `Tuotesivuja ${slugs.length}, JSON-LD-lohkoja ${jsonLdBlocks}, kunnossa ${slugs.length - failed}, virheellisiä ${failed}, ` +
    `personoituja (MerchantReturnNotPermitted) ${personalisedCount}. Toimituslupaus ${expectedDeliveryDays.min}-${expectedDeliveryDays.max} arkipäivää.`,
);
if (slugs.length === 0 || failed > 0) process.exit(1);
