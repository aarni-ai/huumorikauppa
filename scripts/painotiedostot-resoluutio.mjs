#!/usr/bin/env node
/**
 * Painotiedostojen resoluution korjaus (3.11.2026, Teron Tonnin seteli -reklamaatio). Lähde:
 * data/painotiedostot-tarkistus.json (syy "resoluutio", tehollinen resoluutio alle 150 DPI).
 *   - Pienennys riittää (api/_lib/painotiedosto.js resoluutioSijoitus, vähintään 60 % nykyisestä leveydestä):
 *     Printifyn sijoitus päivitetään (--aja). Yläreuna ja keskikohta pysyvät.
 *   - Ei riitä: tuote piilotetaan myynnistä (api/_lib/painolaatu-data.js), Printify-tuotetta ei poisteta.
 * Vanhat ja uudet sijoitukset: data/painotiedostot-resoluutio.json (perumista varten).
 *
 * Tekstikerroksellinen tuote (Printifyn API ei tue tekstikerroksia) jää myyntiin ja listataan käsin korjattavaksi
 * (data/painotiedostot-resoluutio.json "kasin").
 *
 * Lukittu Printify-tuote (is_locked, keskeneräinen julkaisu Lovable-ajalta) avataan muokattavaksi Printifyn
 * publishing_failed-kutsulla ennen päivitystä; kutsu ei muuta tuotetta eikä sen myyntiä.
 *
 * Käyttö: node scripts/painotiedostot-resoluutio.mjs [--aja]   (ilman --aja vain listaa)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { resoluutioSijoitus, arvioiPainokuva, suurimmatPainoalueet, MIN_DPI, PIENENNYS_MIN_OSUUS } from "../api/_lib/painotiedosto.js";

const JUURI = new URL("..", import.meta.url).pathname;
const env = { ...process.env };
const tiedosto = [join(JUURI, ".env.printify.local"), join(JUURI, "../../../.env.printify.local")].find(existsSync);
if (tiedosto) for (const l of readFileSync(tiedosto, "utf8").split("\n")) {
  const m = l.match(/^([A-Z_]+)=["']?([^"'\n]*)/);
  if (m && !env[m[1]]) env[m[1]] = m[2];
}
if (!env.PRINTIFY_API_KEY || !env.PRINTIFY_SHOP_ID) { console.error("PRINTIFY_API_KEY tai PRINTIFY_SHOP_ID puuttuu."); process.exit(1); }
const AJA = process.argv.includes("--aja");
const H = { Authorization: `Bearer ${env.PRINTIFY_API_KEY}`, "Content-Type": "application/json" };
async function api(polku, opts = {}) {
  for (let yritys = 0; yritys < 4; yritys++) {
    try {
      const r = await fetch(`https://api.printify.com/v1/${polku}`, { headers: H, signal: AbortSignal.timeout(180000), ...opts });
      const t = await r.text();
      if (r.status === 429 || r.status >= 500) throw new Error(`Printify ${r.status}`);
      if (!r.ok) throw new Error(`Printify ${r.status} ${polku}: ${t.slice(0, 300)}`);
      return JSON.parse(t);
    } catch (e) {
      if (yritys === 3 || /Printify 4\d\d /.test(e.message)) throw e;
    }
  }
}

const tarkistus = JSON.parse(readFileSync(join(JUURI, "data/painotiedostot-tarkistus.json"), "utf8"));
const kohteet = [...new Map(tarkistus.loydot.filter((l) => l.syy === "resoluutio").map((l) => [l.printify, l])).values()];
const lokiPolku = join(JUURI, "data/painotiedostot-resoluutio.json");
const loki = existsSync(lokiPolku) ? JSON.parse(readFileSync(lokiPolku, "utf8")) : { korjaukset: [], piilotetut: {} };
const katalogi = new Map();
const piilotetut = {};
const kasin = [];
let korjattu = 0;
for (const l of kohteet) {
  const p = await api(`shops/${env.PRINTIFY_SHOP_ID}/products/${l.printify}.json`);
  const k = `${p.blueprint_id}/${p.print_provider_id}`;
  if (!katalogi.has(k)) katalogi.set(k, (await api(`catalog/blueprints/${p.blueprint_id}/print_providers/${p.print_provider_id}/variants.json?show-out-of-stock=1`)).variants);
  const paikat = suurimmatPainoalueet(katalogi.get(k), new Set(p.variants.filter((v) => v.is_enabled).map((v) => v.id)));
  const muutokset = [];
  let pienin = Infinity;
  let eiRiita = false;
  for (const area of p.print_areas) for (const ph of area.placeholders) for (const kuva of ph.images || []) {
    const alue = paikat[ph.position];
    if (!alue || !kuva.src || !kuva.width || /svg/i.test(kuva.type || "")) continue;
    const dpi = arvioiPainokuva(kuva, alue).dpi;
    if (dpi >= MIN_DPI) continue;
    pienin = Math.min(pienin, dpi);
    const uusi = resoluutioSijoitus(kuva, alue);
    if (!uusi) { eiRiita = true; continue; }
    const alaEnnen = arvioiPainokuva(kuva, alue).ala;
    muutokset.push({ paikka: ph.position, kuva: kuva.id, dpi, vanha: { x: kuva.x, y: kuva.y, scale: kuva.scale }, uusi });
    Object.assign(kuva, uusi);
    // Kuvan alla oleva teksti nousee saman verran kuin kuvan alareuna, jotta väli säilyy.
    const nousu = alaEnnen - arvioiPainokuva(kuva, alue).ala;
    for (const t of ph.images) if (t.layerType === "text" && t.y > alaEnnen - 0.05) t.y = Math.round((t.y - nousu) * 1e6) / 1e6;
  }
  if (eiRiita) {
    piilotetut[l.slug] = pienin === Infinity ? l.dpi : pienin;
    // Saman Printify-tuotteen muut kaupan rivit (esim. kaksoiskappaleet) samasta löydöksestä.
    for (const m of tarkistus.loydot.filter((x) => x.printify === l.printify && x.syy === "resoluutio")) piilotetut[m.slug] = piilotetut[l.slug];
    console.log(`piilotetaan: ${l.slug} (${piilotetut[l.slug]} DPI, pienennys alle ${PIENENNYS_MIN_OSUUS * 100} %)`);
    continue;
  }
  if (!muutokset.length) continue;
  // Printifyn API ei tue tekstikerroksia (ne hylätään päivityksessä), joten tekstikerroksellinen tuote korjataan
  // Printifyn editorissa käsin (data/painotiedostot-resoluutio.json "kasin") ja piilotetaan siihen asti.
  if (p.print_areas.some((a) => a.placeholders.some((ph) => (ph.images || []).some((i) => i.layerType === "text")))) {
    // Pienennys riittää (vähintään 90 DPI): tuote pysyy myynnissä, kunnes sijoitus korjataan käsin.
    kasin.push({ slug: l.slug, printify: p.id, muutokset: muutokset.filter((m, i, kaikki) => kaikki.findIndex((x) => x.paikka === m.paikka) === i) });
    console.log(`korjaus käsin (tekstikerros): ${l.slug} ${pienin} DPI -> scale ${muutokset[0].uusi.scale}, y ${muutokset[0].uusi.y}`);
    continue;
  }
  const e = muutokset[0];
  console.log(`${AJA ? "pienennetään" : "pienennettäisiin"}${p.is_locked ? " (lukittu, avataan)" : ""}: ${l.slug} ${e.paikka} ${e.dpi} DPI -> scale ${e.vanha.scale.toFixed(3)} -> ${e.uusi.scale.toFixed(3)} (${muutokset.length} sijoitusta)`);
  if (!AJA) continue;
  if (p.is_locked) {
    await api(`shops/${env.PRINTIFY_SHOP_ID}/products/${p.id}/publishing_failed.json`, { method: "POST", body: JSON.stringify({ reason: "Painotiedoston sijoituksen korjaus (resoluutio)" }) });
    const auki = await api(`shops/${env.PRINTIFY_SHOP_ID}/products/${p.id}.json`);
    if (auki.is_locked) {
      piilotetut[l.slug] = pienin;
      console.log(`piilotetaan: ${l.slug} (${pienin} DPI, lukitus ei auennut)`);
      continue;
    }
  }
  // Lovable-ajan tuotteissa on painopaikkoja, joiden kuvaa ei ole enää Printifyn kuvakirjastossa eikä sillä ole
  // lähdeosoitetta (niskan text_layer.svg): Printify hylkää päivityksen ("Provided images do not exist"). Ne jätetään
  // pois ja kirjataan lokiin.
  const poistetut = [];
  const olemassa = new Map();
  for (const area of p.print_areas) for (const ph of area.placeholders) {
    const kuvat = [];
    for (const kuva of ph.images || []) {
      if (kuva.layerType === "text" || kuva.src) { kuvat.push(kuva); continue; }
      if (!olemassa.has(kuva.id)) olemassa.set(kuva.id, (await fetch(`https://api.printify.com/v1/uploads/${kuva.id}.json`, { headers: H })).ok);
      if (olemassa.get(kuva.id)) kuvat.push(kuva);
      else poistetut.push({ paikka: ph.position, kuva: kuva.name || kuva.id });
    }
    ph.images = kuvat;
  }
  const print_areas = p.print_areas.map((a) => ({
    variant_ids: a.variant_ids,
    // Printify hylkää tyhjät painopaikat: vain paikat, joissa on kuva.
    placeholders: a.placeholders.filter((ph) => (ph.images || []).length > 0).map((ph) => ({ position: ph.position, images: ph.images.map((kuva) => (kuva.src ? { id: kuva.id, x: kuva.x, y: kuva.y, scale: kuva.scale, angle: kuva.angle ?? 0 } : kuva)) })),
  }));
  await api(`shops/${env.PRINTIFY_SHOP_ID}/products/${p.id}.json`, { method: "PUT", body: JSON.stringify({ print_areas }) });
  loki.korjaukset.push({ aika: new Date().toISOString(), slug: l.slug, printify: p.id, muutokset, poistetut });
  writeFileSync(lokiPolku, `${JSON.stringify(loki, null, 2)}\n`);
  korjattu++;
}

if (AJA) {
  loki.piilotetut = piilotetut;
  loki.kasin = kasin;
  writeFileSync(lokiPolku, `${JSON.stringify(loki, null, 2)}\n`);
  const rivit = Object.entries(piilotetut).sort(([a], [b]) => a.localeCompare(b)).map(([s, d]) => `  ${JSON.stringify(s)}: ${d},`).join("\n");
  writeFileSync(join(JUURI, "api/_lib/painolaatu-data.js"), `/** Generoitu ${new Date().toISOString().slice(0, 10)} (scripts/painotiedostot-resoluutio.mjs): slug -> tehollinen resoluutio (DPI). api/_lib/painolaatu.js */
export const PAINOLAATU_PIILOTETUT = {
${rivit}
};
`);
}
console.log(AJA ? `Pienennetty ${korjattu} tuotetta, piilotettu ${Object.keys(piilotetut).length}.` : `${kohteet.length} tuotetta. Aja --aja korjataksesi.`);
