#!/usr/bin/env node
/**
 * Ammatti- ja harrastussivujen uudet mallit Printify-listaksi (2.11.2026):
 *   npx tsx scripts/generoi-ammattimallisto.mjs
 * Lähde src/data/ammattisivut (viisi mallia sivua kohden), tulos data/uudet-tuotteet/ammattisivut-2026-11-02.json samassa
 * muodossa kuin kilpailija-aukkojen lista (aukot-2026-11-02.json): t-paidat OPT OnDemand (CZ) bp 145 S-2XL, hupparit
 * Atelier Katanga (FR) bp 77 S-3XL, samat värit. Kontrasti: tummilla väreillä valkoinen ja Sport Grey -pohjalla musta
 * teksti (scripts/lib/uudet-tuotteet.mjs tekstivariRyhmat), luonnin jälkeen scripts/tummat-varit.mjs.
 * Testi src/test/ammattisivut.test.ts varmistaa, että lista on synkronissa sivujen kanssa.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AMMATTISIVUT } from "../src/data/ammattisivut/index.ts";

const juuri = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kohde = path.join(juuri, "data", "uudet-tuotteet", "ammattisivut-2026-11-02.json");

const HUPPARI = { tyyppi: "huppari", painotalo: "Atelier Katanga", blueprint: 77, koot: ["S", "M", "L", "XL", "2XL", "3XL"] };

const tuotteet = AMMATTISIVUT.flatMap((s) => {
  const kategoria = s.ryhma === "ammatti" ? "Ammattipaidat" : "Harrastuspaidat";
  const lahja = `Lahja ${s.kohde}`;
  const tagit = [kategoria, lahja, s.ryhma === "ammatti" ? `Ammattipaita ${s.kohde}` : `Harrastuspaita ${s.kohde}`];
  return s.mallit.flatMap((rivit) => [
    {
      varit: ["Black", "Navy", "Sport Grey", "Red"], kategoria, otsikko: `{teksti} | {tuote} ${s.kohde}`, tagit, teema: `paidat-${s.slug}`,
      rivit,
      kuvaus: `{teksti}. Hauska {tuote_pienella} ${s.kohde}. Pehmeä unisex-t-paita, koot S-2XL. Jokainen paita painetaan tilauksesta EU:ssa.`,
    },
    {
      varit: ["Black", "Navy", "Red"], kategoria, otsikko: `{teksti} | {tuote} ${s.kohde}`, tagit, teema: `paidat-${s.slug}`,
      rivit, ...HUPPARI,
      kuvaus: `{teksti}. Hauska {tuote_pienella} ${s.kohde}. Lämmin unisex-huppari, koot S-3XL. Jokainen huppari painetaan tilauksesta EU:ssa.`,
    },
  ]);
});

const lista = {
  nimi: "Ammatti- ja harrastussivut 2026: 40 sivua x 5 mallia (2.11.2026)",
  _huom: "200 mallia sivuille /paidat/<slug> (src/data/ammattisivut), jokainen t-paitana ja hupparina. T-paidat OPT OnDemand (CZ) bp 145 S-2XL, hupparit Atelier Katanga (FR) bp 77 S-3XL, samat värit kuin aukkomallistossa (kate vähintään 7 € yhden tuotteen tilauksessa, testattu). Kontrasti: tummilla valkoinen, Sport Grey musta teksti; scripts/tummat-varit.mjs luonnin jälkeen. Ajo: --hintamalli live --kateraja 1. Generoitu: npx tsx scripts/generoi-ammattimallisto.mjs.",
  oletukset: { tyyppi: "t-paita", painotalo: "OPT OnDemand", blueprint: 145, koot: ["S", "M", "L", "XL", "2XL"] },
  tuotteet,
};

writeFileSync(kohde, JSON.stringify(lista, null, 1) + "\n");
console.log(`${path.relative(juuri, kohde)}: ${tuotteet.length} tuotetta (${tuotteet.length / 2} mallia)`);
