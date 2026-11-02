#!/usr/bin/env node
/**
 * Ammatti- ja harrastussivujen uusien mallien tuontitiedosto (2.11.2026), kun mallit on luotu Printifyyn:
 *   npx tsx scripts/ammattimallisto-tuontitiedosto.mjs
 * Lukee luontikirjaukset (data/uudet-tuotteet/luotu-*.json, scripts/printify-uudet-tuotteet.mjs --toteuta) ja kirjoittaa
 * data/uudet-tuotteet-2026-11-02-ammatit.json samassa muodossa kuin aiemmat tuonnit (slug, kategoria, Printify-tunnus,
 * kaupan hinta: t-paita 27,90 €, huppari 52,90 €, 3XL kokohinnoista). Kauppaan tuonti julkaisun jälkeen:
 *   /api/cron/tilaukset?tehtava=tuo-aktiiviset&tiedosto=uudet-tuotteet-2026-11-02-ammatit (CRON_SECRET, toista kunnes valmis)
 * Ei kirjoita Printifyyn eikä kantaan.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AMMATTIMALLISTO } from "../src/data/ammattisivut/index.ts";

const juuri = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kansio = path.join(juuri, "data", "uudet-tuotteet");
const kohde = path.join(juuri, "data", "uudet-tuotteet-2026-11-02-ammatit.json");

const luodut = new Map();
for (const f of readdirSync(kansio).filter((x) => /^luotu-.*\.json$/.test(x))) {
  for (const r of JSON.parse(readFileSync(path.join(kansio, f), "utf8")).tuotteet ?? []) {
    if (r.printify_id && r.otsikko) luodut.set(r.otsikko, r.printify_id);
  }
}

const tuotteet = [];
const puuttuu = [];
for (const t of AMMATTIMALLISTO) {
  const id = luodut.get(t.name);
  if (!id) { puuttuu.push(t.name); continue; }
  tuotteet.push({
    slug: t.slug, category: t.category, printify_product_id: id, lovable_price: t.category === "hupparit" ? 52.9 : 27.9,
    teema: `ammatit-${t.sivu}`, nimi: t.name.split(" | ")[0],
  });
}

if (!tuotteet.length) {
  console.log("Yhtään mallia ei ole vielä luotu Printifyyn: aja ensin scripts/printify-uudet-tuotteet.mjs --toteuta.");
  process.exit(1);
}
writeFileSync(kohde, JSON.stringify({
  paiva: "2026-11-02",
  kuvaus: "Ammatti- ja harrastussivut /paidat/<slug>: 200 mallia t-paitoina (OPT OnDemand CZ, 27,90 €) ja huppareina (Atelier Katanga FR, 52,90 €), data/uudet-tuotteet/ammattisivut-2026-11-02.json. Tuonti: tehtava=tuo-aktiiviset&tiedosto=uudet-tuotteet-2026-11-02-ammatit",
  tuotteet,
}, null, 1) + "\n");
console.log(`${path.relative(juuri, kohde)}: ${tuotteet.length}/${AMMATTIMALLISTO.length} tuotetta.`);
if (puuttuu.length) {
  console.log(`Ei vielä Printifyssä (${puuttuu.length}):`);
  for (const n of puuttuu.slice(0, 20)) console.log(`  ${n}`);
  process.exitCode = 1;
}
