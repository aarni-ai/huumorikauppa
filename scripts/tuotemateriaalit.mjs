#!/usr/bin/env node
/**
 * Tuotteiden materiaalit Printifyn tiedoista (29.10.2026): kunkin aktiivisen tuotteen Printify-tuotteen pohjatuote
 * (blueprint) ja painotalo, ja myytävien värien koostumus pohjatuotteen katalogikuvauksen mukaan. Tulos
 * api/_lib/tuotepohjat.generated.js (slug -> pohja, painotalo ja värikohtainen materiaali), jota tuotesivu, esirenderöinti ja
 * Merchant-syöte (api/_lib/materiaali.js) sekä joulun takaraja painotaloittain (src/data/jouluAikataulu.ts) käyttävät. Tuote, jonka pohjaa tai värin koostumusta Printify ei kerro,
 * jää ilman materiaaliriviä. Aja uusien tuotteiden jälkeen:
 *
 *   node scripts/tuotemateriaalit.mjs [--tuotteet https://huumorikauppa-five.vercel.app/api/products?limit=2000]
 *
 * Avaimet .env.printify.local-tiedostosta (PRINTIFY_API_KEY, PRINTIFY_SHOP_ID); avaimia ei tulosteta.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { POHJAT, materiaaliluokka } from "../api/_lib/materiaali.js";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const env = Object.fromEntries(readFileSync(".env.printify.local", "utf8").split("\n").filter((l) => l.includes("="))
  .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
const H = { authorization: `Bearer ${env.PRINTIFY_API_KEY}` };

async function hae(url, h = H) {
  for (let a = 0; a < 6; a++) {
    try { const r = await fetch(url, { headers: h }); if (r.ok) return r.json(); if (r.status < 500 && r.status !== 429) throw new Error(`${r.status} ${url}`); } catch (e) { if (a === 5) throw e; }
    await new Promise((s) => setTimeout(s, 2000 * (a + 1)));
  }
}

const tuotteet = await hae(arg("--tuotteet", "https://huumorikauppa-five.vercel.app/api/products?limit=2000"), {});
const lista = Array.isArray(tuotteet) ? tuotteet : tuotteet.products || tuotteet.data;

// Printify-tuote -> pohja ja painotalo.
const pf = new Map();
for (let s = 1; s < 60; s++) {
  const j = await hae(`https://api.printify.com/v1/shops/${env.PRINTIFY_SHOP_ID}/products.json?page=${s}&limit=50`);
  for (const t of j.data) pf.set(t.id, { bp: t.blueprint_id, pp: t.print_provider_id });
  if (!j.next_page_url) break;
}

// Katalogin variantti-id -> englanninkielinen väri (id:t ovat pohjakohtaisia).
const katalogi = new Map();
async function variantit(bp, pp) {
  const k = `${bp}/${pp}`;
  if (!katalogi.has(k)) {
    const j = await hae(`https://api.printify.com/v1/catalog/blueprints/${bp}/print_providers/${pp}/variants.json`);
    katalogi.set(k, new Map((j.variants || []).map((v) => [v.id, v.options?.color ?? null])));
  }
  return katalogi.get(k);
}

const tulos = {};
const tilasto = { tuotteita: lista.length, materiaali: 0, ilman: 0, pohjat: {} };
for (const p of lista.sort((a, b) => a.slug.localeCompare(b.slug))) {
  const x = pf.get(p.printify_product_id);
  const pohja = x && POHJAT[x.bp];
  tilasto.pohjat[x ? x.bp : "ei Printifyssä"] = (tilasto.pohjat[x ? x.bp : "ei Printifyssä"] || 0) + 1;
  if (!x) { tilasto.ilman++; continue; }
  const rivi = { b: x.bp, p: x.pp };
  if (pohja?.luokat) {
    const kat = await variantit(x.bp, x.pp);
    const vmap = p.variants?.variant_map || {};
    const v = {};
    let puuttuu = 0;
    for (const vari of p.variants?.colors || []) {
      const id = Object.entries(vmap).find(([k]) => k.split("|")[0] === vari)?.[1];
      const luokka = materiaaliluokka(x.bp, kat.get(Number(id)));
      if (luokka == null) puuttuu++; else v[vari] = luokka;
    }
    if (Object.keys(v).length) rivi.v = v;
    if (puuttuu) rivi.puuttuu = puuttuu;
  }
  tulos[p.slug] = rivi;
  if (pohja?.teksti || rivi.v) tilasto.materiaali++; else tilasto.ilman++;
}
writeFileSync("api/_lib/tuotepohjat.generated.js", `/** Generoitu: node scripts/tuotemateriaalit.mjs (${new Date().toISOString().slice(0, 10)}). Älä muokkaa käsin. */\nexport default ${JSON.stringify(tulos)};\n`);
console.log(JSON.stringify(tilasto));
