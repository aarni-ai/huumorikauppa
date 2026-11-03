#!/usr/bin/env node
/**
 * Painoalueen ylitysten korjaus (3.11.2026): tuotteet, joiden painokuvan näkyvä sisältö ylittää painoalueen
 * (data/painotiedostot-tarkistus.json, syy "ylitys"), saavat Printifyssä sijoituksen, jolla sisältö mahtuu alueelle
 * (api/_lib/painotiedosto.js korjattuSijoitus). Kuva vain siirtyy, tai pienenee, jos se ei muuten mahdu.
 * Mitään tuotetta ei poisteta eikä painotaloa vaihdeta. Vanhat ja uudet sijoitukset tallennetaan
 * data/painotiedostot-korjaus.json-tiedostoon (perumista varten).
 *
 * Käyttö: node scripts/painotiedostot-korjaus.mjs [--aja]   (ilman --aja vain listaa muutokset)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { korjattuSijoitus, sisallonYlitys, suurimmatPainoalueet, arvioiPainokuva } from "../api/_lib/painotiedosto.js";

const JUURI = new URL("..", import.meta.url).pathname;
const sharp = createRequire(join(JUURI, "package.json"))("sharp");
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
  const r = await fetch(`https://api.printify.com/v1/${polku}`, { headers: H, ...opts });
  const t = await r.text();
  if (!r.ok) throw new Error(`Printify ${r.status} ${polku}: ${t.slice(0, 300)}`);
  return JSON.parse(t);
}

/** Näkyvän sisällön laatikko kuvan osuuksina (alfa yli 8); läpinäkymätön kuva on kokonaan sisältöä. */
async function sisallonRajat(src) {
  const puskuri = Buffer.from(await (await fetch(src)).arrayBuffer());
  const meta = await sharp(puskuri).metadata();
  if (!meta.hasAlpha) return { x0: 0, y0: 0, x1: 1, y1: 1 };
  const L = 600, K = Math.max(1, Math.round((L * meta.height) / meta.width));
  const { data } = await sharp(puskuri).resize(L, K, { fit: "fill" }).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  let x0 = L, y0 = K, x1 = -1, y1 = -1;
  for (let y = 0; y < K; y++) for (let x = 0; x < L; x++) if (data[y * L + x] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return x1 < 0 ? { x0: 0.5, y0: 0.5, x1: 0.5, y1: 0.5 } : { x0: x0 / L, y0: y0 / K, x1: (x1 + 1) / L, y1: (y1 + 1) / K };
}

const tarkistus = JSON.parse(readFileSync(join(JUURI, "data/painotiedostot-tarkistus.json"), "utf8"));
const kohteet = [...new Map(tarkistus.loydot.filter((l) => l.syy === "ylitys").map((l) => [l.printify, l])).values()];
const lokiPolku = join(JUURI, "data/painotiedostot-korjaus.json");
const loki = existsSync(lokiPolku) ? JSON.parse(readFileSync(lokiPolku, "utf8")) : { korjaukset: [] };
const katalogi = new Map();
const rajaVarasto = new Map();
let korjattu = 0;
const joKorjatut = new Set(loki.korjaukset.map((k) => k.printify));
for (const l of kohteet) {
  if (joKorjatut.has(l.printify)) continue;
  let p;
  try {
    p = await api(`shops/${env.PRINTIFY_SHOP_ID}/products/${l.printify}.json`);
  } catch (e) {
    console.log(`virhe: ${l.slug}: ${e.message.slice(0, 200)}`);
    continue;
  }
  if (p.is_locked) { console.log(`ohitettu (lukittu): ${l.slug}`); continue; }
  const k = `${p.blueprint_id}/${p.print_provider_id}`;
  if (!katalogi.has(k)) katalogi.set(k, (await api(`catalog/blueprints/${p.blueprint_id}/print_providers/${p.print_provider_id}/variants.json?show-out-of-stock=1`)).variants);
  const paikat = suurimmatPainoalueet(katalogi.get(k), new Set(p.variants.filter((v) => v.is_enabled).map((v) => v.id)));
  const muutokset = [];
  for (const area of p.print_areas) for (const ph of area.placeholders) for (const kuva of ph.images || []) {
    const alue = paikat[ph.position];
    if (!alue || !kuva.src || !kuva.width) continue;
    // Sisällön rajat tarkistuksen tuloksesta (reunat ja sisältö painoalueen osuuksina), kun sijoitus on sama;
    // muuten kuva ladataan ja rajat lasketaan (hidas: painokuvat ovat useita megatavuja).
    const r = arvioiPainokuva(kuva, alue);
    const tunnettu = l.paikka === ph.position && l.reunat && l.sisalto && Math.abs(l.reunat[0] - r.vasen) < 0.002 && Math.abs(l.reunat[2] - r.yla) < 0.002;
    if (tunnettu) {
      const [v, o, y, a] = l.reunat;
      const [sv, so, sy, sa] = l.sisalto;
      rajaVarasto.set(kuva.src, { x0: (sv - v) / (o - v), x1: (so - v) / (o - v), y0: (sy - y) / (a - y), y1: (sa - y) / (a - y) });
    }
    if (!rajaVarasto.has(kuva.src)) rajaVarasto.set(kuva.src, await sisallonRajat(kuva.src));
    const rajat = rajaVarasto.get(kuva.src);
    if (!sisallonYlitys(kuva, alue, rajat).ylittaa) continue;
    const uusi = korjattuSijoitus(kuva, alue, rajat);
    muutokset.push({ paikka: ph.position, kuva: kuva.id, vanha: { x: kuva.x, y: kuva.y, scale: kuva.scale }, uusi });
    Object.assign(kuva, uusi);
  }
  if (!muutokset.length) continue;
  const e = muutokset[0];
  const r3 = (v) => Math.round(v * 1000) / 1000;
  console.log(`${AJA ? "korjataan" : "korjattaisiin"}: ${l.slug} ${e.paikka} y ${r3(e.vanha.y)} -> ${r3(e.uusi.y)}, scale ${r3(e.vanha.scale)} -> ${r3(e.uusi.scale)} (${muutokset.length} sijoitusta)`);
  if (!AJA) continue;
  // Printify ottaa print_areas-kentän kokonaisena; kuvista lähetetään tunniste ja sijoitus.
  const print_areas = p.print_areas.map((a) => ({
    variant_ids: a.variant_ids,
    // Printify hylkää tyhjät painopaikat: vain paikat, joissa on kuva.
    placeholders: a.placeholders.filter((ph) => (ph.images || []).length > 0).map((ph) => ({ position: ph.position, images: ph.images.map((kuva) => (kuva.src ? { id: kuva.id, x: kuva.x, y: kuva.y, scale: kuva.scale, angle: kuva.angle ?? 0 } : kuva)) })),
  }));
  try {
    await api(`shops/${env.PRINTIFY_SHOP_ID}/products/${p.id}.json`, { method: "PUT", body: JSON.stringify({ print_areas }) });
  } catch (e) {
    console.log(`virhe: ${l.slug}: ${e.message.slice(0, 200)}`);
    loki.virheet = [...(loki.virheet || []), { aika: new Date().toISOString(), slug: l.slug, virhe: e.message.slice(0, 300) }];
    writeFileSync(lokiPolku, `${JSON.stringify(loki, null, 2)}\n`);
    continue;
  }
  loki.korjaukset.push({ aika: new Date().toISOString(), slug: l.slug, printify: p.id, muutokset });
  writeFileSync(lokiPolku, `${JSON.stringify(loki, null, 2)}\n`);
  korjattu++;
}
console.log(AJA ? `Korjattu ${korjattu} tuotetta (data/painotiedostot-korjaus.json).` : `${kohteet.length} tuotetta tarkistettu. Aja --aja korjataksesi.`);
