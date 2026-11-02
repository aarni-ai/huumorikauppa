#!/usr/bin/env node
/**
 * Lähikuvatuotteet (2.11.2026): tuotteet, joiden tuotesivun ensimmäinen kuva on lähikuva painatuksesta
 * (api/_lib/lahikuva.js, src/lib/lahikuva.ts). 50 suosituinta (api/_lib/top50.generated.js) ja kaikki uudet mallit
 * (data/uudet-tuotteet-*.json), vain t-paidat ja hupparit. Kirjoittaa api/_lib/lahikuva-tuotteet.generated.js.
 * Ajo: node scripts/lahikuva-tuotteet.mjs (aja uudelleen, kun uusia malleja tuodaan).
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const JUURI = new URL("..", import.meta.url).pathname;
const { default: TOP50 } = await import(join(JUURI, "api/_lib/top50.generated.js"));
const vaate = (slug) => /-(t-paita|huppari)(-|$)/.test(slug);
const uudet = readdirSync(join(JUURI, "data")).filter((f) => /^uudet-tuotteet-.*\.json$/.test(f))
  .flatMap((f) => JSON.parse(readFileSync(join(JUURI, "data", f), "utf8")).tuotteet.map((t) => t.slug));
const slugit = [...new Set([...[...TOP50].filter(vaate).slice(0, 50), ...uudet.filter(vaate)])];
writeFileSync(join(JUURI, "api/_lib/lahikuva-tuotteet.generated.js"),
  `/** Generoitu ${new Date().toISOString().slice(0, 10)} (scripts/lahikuva-tuotteet.mjs): ${slugit.length} tuotetta, joiden ensimmäinen kuva on lähikuva painatuksesta. */\nexport default new Set(${JSON.stringify(slugit, null, 1)});\n`);
console.log(`${slugit.length} tuotetta (top50-vaatteet ${[...TOP50].filter(vaate).length}, uudet ${uudet.filter(vaate).length})`);
