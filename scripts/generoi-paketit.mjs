#!/usr/bin/env node
/**
 * Generoi pakettimääritykset (api/_lib/paketit-data.js) tuotteiden tilannekuvasta: 20 parasta teemaparia
 * (t-paita + huppari tai paita + pipo samalla tekstillä, sama slugin runko). Aja uudelleen, kun tuotteet muuttuvat:
 *   node scripts/generoi-paketit.mjs [--maara 20]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { muodostaPaketit } from "../api/_lib/paketit.js";

const i = process.argv.indexOf("--maara");
const maara = i > 0 ? Number(process.argv[i + 1]) : 20;
const tuotteet = JSON.parse(readFileSync(new URL("../data/products-snapshot.json", import.meta.url), "utf8"));
const paketit = muodostaPaketit(tuotteet, maara);
const kohde = new URL("../api/_lib/paketit-data.js", import.meta.url);
writeFileSync(
  kohde,
  `/** Generoitu: node scripts/generoi-paketit.mjs (${paketit.length} pakettia tilannekuvasta). Älä muokkaa käsin. */\n` +
    `const PAKETIT = ${JSON.stringify(paketit, null, 2)};\n\nexport default PAKETIT;\n`,
);
console.log(`Kirjoitettu ${paketit.length} pakettia: api/_lib/paketit-data.js`);
