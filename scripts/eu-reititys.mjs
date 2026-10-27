#!/usr/bin/env node
/**
 * EU-reititys: jokainen aktiivinen, näkyvä kauppatuote ja sen variantit -> Printify-tuote -> painotalo ja sijainti.
 * EU:n ulkopuolella tai Printify Choicen reitityksellä valmistettavat ohjataan 301:llä EU-kopioon (jos kopio on näkyvä
 * kaupparivi) tai piilotetaan. Logiikka: scripts/lib/eu-reititys.mjs. Printifyssä ei muuteta, poisteta eikä tilata
 * mitään (vain GET).
 *
 *   set -a; . ./.env.printify.local; . ./.env.production.local; set +a
 *   npx tsx scripts/eu-reititys.mjs [--kuiva] [--pakota]
 *
 *   --kuiva   ei kirjoiteta tiedostoja, vain yhteenveto
 *   --pakota  kirjoita, vaikka turvaraja (yli 25 % näkyvistä riveistä liputettu) ylittyy
 *
 * Kirjoittaa data/eu-reititys.json (raportti: jokainen näkyvä rivi) ja api/_lib/eu-reititys-data.js (ajonaikainen).
 * Aja uudelleen Lovablen yöllisen synkronoinnin (03:16 UTC) jälkeen ja aina kun tuotteita siirretään EU-painotaloille.
 */
import fs from "node:fs/promises";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { laskeEuReititys, renderDataModule, siirtoKartta } from "./lib/eu-reititys.mjs";
import { onPiilotettuTuotePerus } from "../src/lib/hiddenCategories.ts";
import { OHJATUT_TUOTESLUGIT } from "../api/_lib/ohjatut-tuotteet.js";

const juuri = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const JSON_OUT = path.join(juuri, "data/eu-reititys.json");
const JS_OUT = path.join(juuri, "api/_lib/eu-reititys-data.js");
const TURVARAJA = 0.25;
const KUIVA = process.argv.includes("--kuiva");
const PAKOTA = process.argv.includes("--pakota");

const KEY = process.env.PRINTIFY_API_KEY;
const SHOP = process.env.PRINTIFY_SHOP_ID || "26630629";
const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const odota = (ms) => new Promise((r) => setTimeout(r, ms));
/** Printify GET; verkkovirhe (DNS katkeilee), 429 ja 5xx uusitaan porrastetusti. */
async function printify(polku) {
  for (let yritys = 1; yritys <= 10; yritys++) {
    let res;
    try {
      res = await fetch(`https://api.printify.com/v1${polku}`, { headers: { Authorization: `Bearer ${KEY}` }, signal: AbortSignal.timeout(60000) });
    } catch {
      await odota(Math.min(60000, 2000 * yritys));
      continue;
    }
    if (res.status === 429 || res.status >= 500) { await odota(Math.min(60000, 1500 * 2 ** yritys)); continue; }
    if (!res.ok) throw new Error(`Printify ${polku}: HTTP ${res.status}`);
    return res.json();
  }
  throw new Error(`Printify ${polku}: ei vastausta`);
}

async function kauppaRivit() {
  const rivit = [];
  const select = "slug,name,category,is_active,printify_product_id,variants";
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${SB_URL}/rest/v1/products?select=${select}&order=slug.asc&limit=1000&offset=${from}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) throw new Error(`Supabase: HTTP ${res.status}`);
    const j = await res.json();
    rivit.push(...j);
    if (j.length < 1000) break;
  }
  return rivit;
}

async function printifyTuotteet() {
  const out = [];
  for (let sivu = 1; sivu < 1000; sivu++) {
    const j = await printify(`/shops/${SHOP}/products.json?limit=50&page=${sivu}`);
    const d = Array.isArray(j?.data) ? j.data : [];
    out.push(...d);
    if (!d.length || sivu >= Number(j.last_page ?? sivu)) break;
  }
  return out;
}

function siirtoTiedostot() {
  const kansio = path.join(juuri, "data");
  return readdirSync(kansio).filter((x) => /^eu-siirto-.*\.json$/.test(x)).sort().map((f) => JSON.parse(readFileSync(path.join(kansio, f), "utf8")));
}

/** Näkyvä kaupassa mainin säännöillä ilman EU-reititystä (muuten vanha data vaikuttaisi uuteen ajoon). */
const onNakyva = (r) => r.is_active !== false && !onPiilotettuTuotePerus(r) && !OHJATUT_TUOTESLUGIT.has(r.slug);

if (!KEY || !SB_URL || !SB_KEY) {
  console.error("PRINTIFY_API_KEY, VITE_SUPABASE_URL ja VITE_SUPABASE_PUBLISHABLE_KEY tarvitaan.");
  process.exit(1);
}
const [rivit, tuotteet] = await Promise.all([kauppaRivit(), printifyTuotteet()]);
if (!tuotteet.length) throw new Error("Printify-kaupan tuotelista tyhjä, keskeytetään.");
const painotalot = new Map();
for (const id of [...new Set(tuotteet.map((p) => Number(p.print_provider_id)))].sort((a, b) => a - b)) {
  const j = await printify(`/catalog/print_providers/${id}.json`);
  painotalot.set(id, { title: j?.title ?? null, location: j?.location ?? null });
}
const tulos = laskeEuReititys({ rivit, tuotteet, painotalot, siirrot: siirtoKartta(siirtoTiedostot()), onNakyva });
const generoitu = new Date().toISOString();
console.log(JSON.stringify({ generoitu, ...tulos.yhteenveto, ohjaukset: tulos.ohjaukset, piilotetut: tulos.piilotetut }, null, 2));

const osuus = tulos.yhteenveto.liputettuja / Math.max(1, tulos.yhteenveto.nakyvia_riveja);
if (osuus > TURVARAJA && !PAKOTA) {
  console.error(`Turvaraja: ${(osuus * 100).toFixed(1)} % näkyvistä riveistä liputettu (> ${TURVARAJA * 100} %). Tarkista ja aja --pakota.`);
  process.exit(2);
}
if (KUIVA) process.exit(0);

const painotalotJson = Object.fromEntries([...painotalot].map(([id, p]) => [id, { title: p.title, maa: p.location?.country ?? null }]));
await fs.writeFile(JSON_OUT, `${JSON.stringify({ generoitu, yhteenveto: tulos.yhteenveto, painotalot: painotalotJson, ohjaukset: tulos.ohjaukset, piilotetut: tulos.piilotetut, tuotteet: tulos.tuotteet }, null, 2)}\n`);
await fs.writeFile(JS_OUT, renderDataModule({ generoitu, ...tulos }));
console.error(`Kirjoitettu ${path.relative(juuri, JSON_OUT)} ja ${path.relative(juuri, JS_OUT)}: ${tulos.yhteenveto.ohjattuja} ohjattu, ${tulos.yhteenveto.piilotettuja} piilotettu.`);
