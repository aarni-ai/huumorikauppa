#!/usr/bin/env node
/**
 * Painotiedostojen tarkistus kaikille myynnissä oleville Printify-tuotteille (3.11.2026, Teron Tonnin seteli
 * -reklamaatio). Laskenta: api/_lib/painotiedosto.js.
 *   - tehollinen resoluutio painoalueella vähintään 150 DPI
 *   - kuvan näkyvä sisältö ei ylitä painoaluetta (läpinäkyvä reuna saa ylittää; sisältö lasketaan kuvasta sharpilla)
 *   - kierretyt kuvat listataan tarkistettaviksi
 *   - painotalot: myynnissä olevien tuotteiden painotalot (reklamaation painotalo 417 Latvia ei saa olla mukana)
 *
 * Myynnissä olevat tuotteet: kaupan /api/products (printify_product_id). Printify: .env.printify.local
 * (PRINTIFY_API_KEY, PRINTIFY_SHOP_ID), avaimia ei tulosteta. Tulos: data/painotiedostot-tarkistus.json.
 *
 * Käyttö: node scripts/painotiedostot-tarkistus.mjs [--kauppa https://huumorikauppa.fi]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tarkistaTuote, suurimmatPainoalueet, sisallonYlitys, MIN_DPI } from "../api/_lib/painotiedosto.js";

const JUURI = new URL("..", import.meta.url).pathname;
const env = { ...process.env };
const tiedosto = [join(JUURI, ".env.printify.local"), join(JUURI, "../../../.env.printify.local")].find(existsSync);
if (tiedosto) for (const l of readFileSync(tiedosto, "utf8").split("\n")) {
  const m = l.match(/^([A-Z_]+)=["']?([^"'\n]*)/);
  if (m && !env[m[1]]) env[m[1]] = m[2];
}
if (!env.PRINTIFY_API_KEY || !env.PRINTIFY_SHOP_ID) { console.error("PRINTIFY_API_KEY tai PRINTIFY_SHOP_ID puuttuu."); process.exit(1); }
const i = process.argv.indexOf("--kauppa");
const KAUPPA = i > 0 ? process.argv[i + 1] : "https://huumorikauppa.fi";
/** Reklamaation painotalo (Teron tilaus 26630629.22, Latvia). */
export const REKLAMAATIO_PAINOTALOT = [417];

const H = { Authorization: `Bearer ${env.PRINTIFY_API_KEY}` };
const odota = (ms) => new Promise((r) => setTimeout(r, ms));
async function g(polku) {
  for (let yritys = 0; yritys < 5; yritys++) {
    const r = await fetch(`https://api.printify.com/v1/${polku}`, { headers: H });
    if (r.status === 429 || r.status >= 500) { await odota(2000 * (yritys + 1)); continue; }
    if (!r.ok) throw new Error(`Printify ${r.status} ${polku}`);
    return r.json();
  }
  throw new Error(`Printify ei vastaa: ${polku}`);
}

const kauppa = await (await fetch(`${KAUPPA}/api/products`)).json();
const lista = Array.isArray(kauppa) ? kauppa : kauppa.products || kauppa.data;
const myynnissa = new Map(lista.filter((p) => p.printify_product_id).map((p) => [p.printify_product_id, p]));

const tuotteet = [];
for (let sivu = 1; ; sivu++) {
  const s = await g(`shops/${env.PRINTIFY_SHOP_ID}/products.json?limit=50&page=${sivu}`);
  for (const p of s.data || []) if (myynnissa.has(p.id)) tuotteet.push(p);
  if (sivu >= s.last_page) break;
}

/** Näkyvän sisällön laatikko kuvan osuuksina (alfa yli 8). Läpinäkymätön kuva (esim. JPEG) on kokonaan sisältöä. */
const rajaVarasto = new Map();
async function sisallonRajat(src) {
  if (rajaVarasto.has(src)) return rajaVarasto.get(src);
  const sharp = (await import("sharp")).default;
  const puskuri = Buffer.from(await (await fetch(src)).arrayBuffer());
  const kuva = sharp(puskuri);
  const meta = await kuva.metadata();
  let rajat = { x0: 0, y0: 0, x1: 1, y1: 1 };
  if (meta.hasAlpha) {
    const L = 600, K = Math.max(1, Math.round((L * meta.height) / meta.width));
    const { data } = await sharp(puskuri).resize(L, K, { fit: "fill" }).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
    let x0 = L, y0 = K, x1 = -1, y1 = -1;
    for (let y = 0; y < K; y++) for (let x = 0; x < L; x++) if (data[y * L + x] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    rajat = x1 < 0 ? { x0: 0.5, y0: 0.5, x1: 0.5, y1: 0.5 } : { x0: x0 / L, y0: y0 / K, x1: (x1 + 1) / L, y1: (y1 + 1) / K };
  }
  rajaVarasto.set(src, rajat);
  return rajat;
}
let lapinakyvaYlitys = 0;

const katalogi = new Map();
const loydot = [];
const painotalot = {};
let dpiMin = Infinity;
for (const p of tuotteet) {
  const k = `${p.blueprint_id}/${p.print_provider_id}`;
  if (!katalogi.has(k)) katalogi.set(k, (await g(`catalog/blueprints/${p.blueprint_id}/print_providers/${p.print_provider_id}/variants.json?show-out-of-stock=1`)).variants);
  const kaytossa = new Set((p.variants || []).filter((v) => v.is_enabled).map((v) => v.id));
  const paikat = suurimmatPainoalueet(katalogi.get(k), kaytossa);
  const kauppaTuote = myynnissa.get(p.id);
  painotalot[p.print_provider_id] = (painotalot[p.print_provider_id] || 0) + 1;
  for (const area of p.print_areas || []) for (const ph of area.placeholders || []) for (const kuva of ph.images || []) {
    const alue = paikat[ph.position];
    if (alue && kuva.width) dpiMin = Math.min(dpiMin, (300 * kuva.width) / (kuva.scale * alue.width));
  }
  for (const l of tarkistaTuote(p, paikat)) {
    if (l.syy === "ylitys") {
      const kuva = p.print_areas.flatMap((a) => a.placeholders).filter((ph) => ph.position === l.paikka).flatMap((ph) => ph.images).find((k) => k.id === l.kuvaId);
      const rajat = await sisallonRajat(kuva.src);
      const s = sisallonYlitys(kuva, paikat[l.paikka], rajat);
      delete l.kuvaId;
      if (!s.ylittaa) { lapinakyvaYlitys++; continue; }
      l.sisalto = [s.vasen, s.oikea, s.yla, s.ala].map((v) => Math.round(v * 1000) / 1000);
    }
    loydot.push({ slug: kauppaTuote.slug, kategoria: kauppaTuote.category, printify: p.id, blueprint: p.blueprint_id, painotalo: p.print_provider_id, ...l });
  }
}

const syyt = loydot.reduce((a, l) => ({ ...a, [l.syy]: (a[l.syy] || 0) + 1 }), {});
const reklamaatioPainotalolla = tuotteet.filter((p) => REKLAMAATIO_PAINOTALOT.includes(p.print_provider_id)).map((p) => myynnissa.get(p.id).slug);
const tulos = {
  ajettu: new Date().toISOString(), kauppa: KAUPPA, myynnissa: myynnissa.size, tarkistettu: tuotteet.length,
  puuttuu_printifysta: [...myynnissa.keys()].filter((id) => !tuotteet.some((p) => p.id === id)).map((id) => myynnissa.get(id).slug),
  ylitys_vain_lapinakyva: lapinakyvaYlitys, min_dpi_raja: MIN_DPI, pienin_dpi: Math.round(dpiMin), syyt, painotalot, reklamaatio_painotalolla: reklamaatioPainotalolla, loydot,
};
writeFileSync(join(JUURI, "data/painotiedostot-tarkistus.json"), `${JSON.stringify(tulos, null, 2)}\n`);
console.log(`Myynnissä ${tulos.myynnissa}, tarkistettu ${tulos.tarkistettu}, Printifystä puuttuu ${tulos.puuttuu_printifysta.length}.`);
console.log(`Pienin tehollinen resoluutio ${tulos.pienin_dpi} DPI (raja ${MIN_DPI}). Löydökset: ${JSON.stringify(syyt)}.`);
console.log(`Ylitys vain läpinäkyvällä reunalla (ei painovirhettä): ${lapinakyvaYlitys}.`);
console.log(`Painotalot: ${JSON.stringify(painotalot)}. Reklamaation painotalolla (417): ${reklamaatioPainotalolla.length}.`);
for (const l of loydot.slice(0, 20)) console.log(`- ${l.slug} ${l.paikka}: ${l.syy}${l.dpi ? ` ${l.dpi} DPI` : ""}${l.sisalto ? ` sisältö ${l.sisalto.join(" / ")}` : ""}`);
if (loydot.length > 20) console.log(`- ... ja ${loydot.length - 20} muuta (data/painotiedostot-tarkistus.json)`);
