#!/usr/bin/env node
/**
 * Tarkistaa kaikkien esirenderöityjen blogisivujen (dist/blogi/<slug>/index.html) rakenteisen datan:
 * ei vajaita Product-kohteita (JSON-LD tai mikrodata), ItemListin ListItemeillä url, FAQ kunnossa.
 * Lisäksi jokaisella artikkelilla pitää olla tuotelinkkejä ja Katso tuotteet -linkki. Aja `npm run build` ensin.
 *
 *   node scripts/validoi-blogidata.mjs [dist-hakemisto]
 *
 * Poistuu koodilla 1, jos yhdessäkin sivussa on virhe tai blogisivuja ei löydy.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateBlogPage } from "./blogidata-validointi.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.resolve(process.argv[2] || path.join(ROOT, "dist"));
const blogDir = path.join(dist, "blogi");

if (!fs.existsSync(blogDir)) {
  console.error(`Blogisivuja ei löydy: ${blogDir}. Aja ensin npm run build.`);
  process.exit(1);
}

const slugs = fs.readdirSync(blogDir).filter((s) => fs.existsSync(path.join(blogDir, s, "index.html"))).sort();
const totals = { jsonLdBlocks: 0, products: 0, itemLists: 0, listItems: 0, microdataProducts: 0, productLinks: 0 };
const failures = [];

for (const slug of slugs) {
  const html = fs.readFileSync(path.join(blogDir, slug, "index.html"), "utf8");
  const { errors, counts } = validateBlogPage(html);
  for (const k of Object.keys(counts)) totals[k] += counts[k];
  // Staattisen rungon tuotelinkit (otsikkonavigaation ulkopuolella) ja Katso tuotteet -linkki.
  const body = html.slice(html.indexOf('data-prerender'));
  const productLinks = new Set([...body.matchAll(/href="\/tuote\/([^"]+)"/g)].map((m) => m[1])).size;
  totals.productLinks += productLinks;
  if (productLinks < 3) errors.push(`tuotelinkkejä ${productLinks}, odotettiin vähintään 3`);
  if (!/>Katso tuotteet[^<]*<\/a>/.test(body)) errors.push("Katso tuotteet -linkki puuttuu");
  if (errors.length) failures.push({ slug, errors });
}

for (const f of failures.slice(0, 50)) {
  console.error(`VIRHE /blogi/${f.slug}`);
  for (const e of f.errors) console.error(`  - ${e}`);
}
if (failures.length > 50) console.error(`... ja ${failures.length - 50} muuta sivua`);

console.log(
  `Blogisivuja ${slugs.length}, kunnossa ${slugs.length - failures.length}, virheellisiä ${failures.length}. ` +
    `JSON-LD-lohkoja ${totals.jsonLdBlocks}, Product-solmuja ${totals.products}, ItemList ${totals.itemLists} ` +
    `(${totals.listItems} ListItem), mikrodatan Product-kohteita ${totals.microdataProducts}, tuotelinkkejä ${totals.productLinks}.`,
);
if (slugs.length === 0 || failures.length > 0) process.exit(1);
