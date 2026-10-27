#!/usr/bin/env node
/**
 * Generoi pakettimääritykset (api/_lib/paketit-data.js) tuotteiden tilannekuvasta: 20 parasta teemaparia
 * (t-paita + huppari tai paita + pipo samalla tekstillä, sama slugin runko), kiinnitetyt teemat (Tonnin seteli) ensin.
 * Aja uudelleen, kun tuotteet tai hinnat muuttuvat:
 *   node scripts/generoi-paketit.mjs [--maara 20] [--kulut katteet.json]
 *
 * --kulut: Printify-kulut ({ slug, kulu, toimitus } euroina, scripts/katteet.mjs-tuloste). Jokaiselle paketille
 * valitaan suurin alennus 10..5 %, jolla paketin kate pysyy vähintään 30 %:ssa (api/_lib/paketit.js
 * valitsePakettialennus). Jos mikään ei riitä, paketti jää määrityksiin, mutta alennus on pois käytöstä
 * (kaytossa: false) ja syy kirjoitetaan kommenttina. Ilman --kulut-tiedostoa alennus on 10 % ja kassan katevahti
 * päättää sen käytöstä tilaushetkellä.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { muodostaPaketit, valitsePakettialennus, PAKETTI_ALENNUKSET } from "../api/_lib/paketit.js";
import { paketinHeikoinKate } from "../api/_lib/kate.js";

const arvo = (nimi) => {
  const i = process.argv.indexOf(nimi);
  return i > 0 ? process.argv[i + 1] : null;
};
const maara = Number(arvo("--maara") || 20);
const kulutPolku = arvo("--kulut");
let tuotteet = JSON.parse(readFileSync(new URL("../data/products-snapshot.json", import.meta.url), "utf8"));

/** Kulutiedosto tuoteriveille: sama kulu jokaiselle variantille (tiedostossa heikoin variantti). */
export function liitaKulut(rivit, kulut) {
  const bySlug = new Map(kulut.filter((k) => typeof k.kulu === "number" && typeof k.toimitus === "number").map((k) => [k.slug, k]));
  return rivit.map((p) => {
    const k = bySlug.get(p.slug);
    if (!k) return p;
    const idt = Object.values(p.variants?.variant_map || {});
    return {
      ...p,
      price: k.price ?? p.price,
      variants: { ...p.variants, costs: Object.fromEntries(idt.map((id) => [String(id), Math.round(k.kulu * 100)])), shipping_cents: Math.round(k.toimitus * 100) },
    };
  });
}

/** Pienin parin yhteishinta (hinnat samassa suhteessa, 1 €:n välein), jolla pienin alennus täyttää 30 %:n rajan. */
function tarvittavaHinta(pari) {
  const summa = pari.reduce((s, p) => s + Number(p.price), 0);
  for (let t = Math.ceil(summa); t < summa * 5; t += 1) {
    const k = t / summa;
    if (paketinHeikoinKate(pari.map((p) => ({ ...p, price: Number(p.price) * k })), Math.min(...PAKETTI_ALENNUKSET)).sallittu) return t;
  }
  return null;
}
const eur = (x) => `${x.toFixed(2).replace(".", ",")} €`;

if (kulutPolku) tuotteet = liitaKulut(tuotteet, JSON.parse(readFileSync(kulutPolku, "utf8")));
const bySlug = new Map(tuotteet.map((p) => [p.slug, p]));
const paketit = muodostaPaketit(tuotteet, maara).map((p) => {
  if (!kulutPolku) return { paketti: p, syy: null };
  const pari = p.tuotteet.map((s) => bySlug.get(s));
  const v = valitsePakettialennus(pari);
  if (v.alennus) return { paketti: { ...p, alennus_prosentti: v.alennus }, syy: null };
  const t = v.kate === null ? null : tarvittavaHinta(pari);
  const nyt = pari.reduce((s, x) => s + Number(x.price), 0);
  const syy = t ? `${v.syy}; vaatisi parin hinnaksi vähintään ${eur(t)} (nyt ${eur(nyt)})` : v.syy;
  return { paketti: { ...p, alennus_prosentti: Math.min(...PAKETTI_ALENNUKSET), kaytossa: false }, syy };
});
const pvm = new Date().toISOString().slice(0, 10);
const pois = paketit.filter((p) => p.syy).length;
const rivit = paketit.map(({ paketti, syy }) => {
  const json = JSON.stringify(paketti, null, 2).replace(/^/gm, "  ");
  return `${syy ? `  // Alennus pois käytöstä (${pvm}): ${syy}.\n` : ""}${json}`;
});
const kohde = new URL("../api/_lib/paketit-data.js", import.meta.url);
writeFileSync(
  kohde,
  `/**\n * Generoitu: node scripts/generoi-paketit.mjs${kulutPolku ? " --kulut <kulutiedosto>" : ""} (${paketit.length} pakettia tilannekuvasta). Älä muokkaa käsin.\n` +
    (kulutPolku ? ` * Alennus valittu kuluista (${pvm}): suurin 10..5 %, jolla paketin kate >= 30 %. Pois käytöstä: ${pois}/${paketit.length}.\n` : "") +
    ` */\nconst PAKETIT = [\n${rivit.join(",\n")}\n];\n\nexport default PAKETIT;\n`,
);
console.log(`Kirjoitettu ${paketit.length} pakettia (alennus pois käytöstä ${pois}): api/_lib/paketit-data.js`);
