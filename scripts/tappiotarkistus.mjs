#!/usr/bin/env node
/**
 * Tappiotarkistus: jokaisen aktiivisen kauppatuotteen jokainen variantti (variants.variant_map "Väri|Koko" -> Printify
 * variant id), jonka Printify-kulu (variantin tuotekulu + Suomen toimitus ensimmäiselle kappaleelle) on suurempi kuin
 * myynti ilman ALV:tä miinus Stripe, eli api/_lib/kate.js laskeKate antaa nettokatteen < 0 (nykyinen kassa:
 * toimitusmaksu api/_lib/vakiot.js, ilmainen toimitus rajasta alkaen).
 *
 *   set -a; . ./.env.printify.local; . ./.env.production.local; set +a
 *   npx tsx scripts/tappiotarkistus.mjs [--lahde nykyinen|eu|molemmat] [--ulos data/tappio-variantit.json]
 *
 * Tuotteet: Supabasen anon REST (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY), aktiiviset rivit.
 * Kulut: Printify-kaupan tuotteet (variants[].cost) ja /catalog/blueprints/{bp}/print_providers/{pp}/shipping.json.
 *
 * EU-kopiot: jos rivin Printify-tuote on siirretty EU-painotalolle (data/eu-siirto-*.json), Lovablen yöllinen
 * synkronointi voi osoittaa rivin EU-kopioon. Silloin variantti arvioidaan myös EU-kopion kuluilla: kopion
 * "Väri|Koko"-avaimet muodostetaan samalla buildProductRow-funktiolla kuin synkronoinnissa.
 *   --lahde nykyinen  vain rivin nykyinen Printify-tuote
 *   --lahde eu        EU-kopio, jos sellainen on (muuten nykyinen)
 *   --lahde molemmat  (oletus) variantti on tappiollinen, jos se on tappiollinen kummalla tahansa (varovainen:
 *                     saatavuusdata pysyy oikeana riippumatta siitä, kumpaan tuotteeseen rivi yön jälkeen osoittaa)
 *
 * Tulos: { slug: ["Väri|Koko", ...] } (vain slugit, joilla on tappiollisia variantteja) tiedostoon --ulos
 * (oletus data/tappio-variantit.json); yhteenveto tulostetaan (tuotteet, tarkistetut variantit, tappiolliset
 * kategorioittain, sekä erikseen nykyisellä ja EU-kopiolla).
 */
import fs from "node:fs/promises";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { laskeKate } from "../api/_lib/kate.js";
import { suomenToimitus } from "./lib/eu-painotalot.mjs";

globalThis.Deno ??= { env: { get: (k) => process.env[k] } };
const { buildProductRow } = await import("../supabase/functions/_shared/printify-sync.ts");

const arvo = (n, oletus) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : oletus);
const LAHDE = arvo("--lahde", "molemmat");
const juuri = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ULOS = path.resolve(juuri, arvo("--ulos", "data/tappio-variantit.json"));

const KEY = process.env.PRINTIFY_API_KEY;
const SHOP = process.env.PRINTIFY_SHOP_ID;
const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const odota = (ms) => new Promise((r) => setTimeout(r, ms));
/** Printify GET; verkkovirhe (DNS katkeilee), 429 ja 5xx uusitaan porrastetusti. */
async function printify(polku) {
  for (let yritys = 1; yritys <= 8; yritys++) {
    let res;
    try {
      res = await fetch(`https://api.printify.com/v1${polku}`, { headers: { Authorization: `Bearer ${KEY}` }, signal: AbortSignal.timeout(60000) });
    } catch {
      await odota(2000 * yritys);
      continue;
    }
    if (res.status === 429 || res.status >= 500) { await odota(Math.min(60000, 1500 * 2 ** yritys)); continue; }
    if (!res.ok) throw new Error(`Printify ${polku}: HTTP ${res.status}`);
    return res.json();
  }
  throw new Error(`Printify ${polku}: ei vastausta`);
}

/** Puhdas: rivin variantit, joiden nettokate < 0 annetuilla kuluilla. Palauttaa { tarkistettu, tappio: [avain], tuntematon }. */
export function tappioVariantit(rivi, kulut, toimitusSentit, avainIdksi = rivi?.variants?.variant_map || {}) {
  const tuote = { price: rivi.price, variants: { costs: kulut, shipping_cents: toimitusSentit } };
  const tappio = [];
  let tarkistettu = 0, tuntematon = 0;
  for (const [avain, id] of Object.entries(avainIdksi)) {
    const k = laskeKate(tuote, id);
    if (!k.tunnettu) { tuntematon++; continue; }
    tarkistettu++;
    if (k.nettokate < 0) tappio.push(avain);
  }
  return { tarkistettu, tappio, tuntematon };
}

async function kauppaRivit() {
  const rivit = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${SB_URL}/rest/v1/products?select=slug,category,price,variants,printify_product_id,is_active&is_active=eq.true&order=slug`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Range: `${from}-${from + 999}`, "Range-Unit": "items" },
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
  for (let sivu = 1; sivu < 200; sivu++) {
    const j = await printify(`/shops/${SHOP}/products.json?limit=50&page=${sivu}`);
    out.push(...(j.data || []));
    if (!j.next_page_url || (j.last_page && sivu >= j.last_page)) break;
  }
  return new Map(out.map((p) => [String(p.id), p]));
}

function euSiirrot() {
  const kansio = path.join(juuri, "data");
  const m = new Map();
  for (const f of readdirSync(kansio).filter((x) => /^eu-siirto-.*\.json$/.test(x)).sort()) {
    for (const s of JSON.parse(readFileSync(path.join(kansio, f), "utf8")).siirrot || []) m.set(String(s.vanhaId), String(s.uusiId));
  }
  return m;
}

const toimitusVm = new Map();
async function toimitus(p) {
  const k = `${p.blueprint_id}/${p.print_provider_id}`;
  if (!toimitusVm.has(k)) {
    toimitusVm.set(k, await printify(`/catalog/blueprints/${p.blueprint_id}/print_providers/${p.print_provider_id}/shipping.json`).then(suomenToimitus).catch(() => null));
  }
  return toimitusVm.get(k);
}
const kulut = (p) => Object.fromEntries((p.variants || []).filter((v) => typeof v.cost === "number").map((v) => [String(v.id), v.cost]));

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!KEY || !SHOP || !SB_URL || !SB_KEY) {
    console.error("PRINTIFY_API_KEY, PRINTIFY_SHOP_ID, VITE_SUPABASE_URL ja VITE_SUPABASE_PUBLISHABLE_KEY tarvitaan.");
    process.exit(1);
  }
  if (!["nykyinen", "eu", "molemmat"].includes(LAHDE)) { console.error("--lahde: nykyinen | eu | molemmat"); process.exit(1); }
  const [rivit, pf] = await Promise.all([kauppaRivit(), printifyTuotteet()]);
  const siirrot = euSiirrot();
  const tulos = {};
  const yht = { tuotteet: rivit.length, eiPrintifyTuotetta: 0, nykyinen: { tarkistettu: 0, tappio: 0, tuntematon: 0 }, eu: { rivit: 0, tarkistettu: 0, tappio: 0, puuttuu: 0 /* rivin avaimet, joita EU-kopiossa ei ole */ } };
  const kategoriat = {};
  const tappioRivit = [];
  for (const r of rivit) {
    const kat = (kategoriat[r.category || "?"] ??= { tuotteet: 0, variantit: 0, tappio: 0, tappioTuotteet: 0 });
    kat.tuotteet++;
    const nyky = pf.get(String(r.printify_product_id));
    let nykyTappio = [];
    if (!nyky) yht.eiPrintifyTuotetta++;
    else if (LAHDE !== "eu" || !siirrot.has(String(r.printify_product_id))) {
      const t = tappioVariantit(r, kulut(nyky), await toimitus(nyky));
      yht.nykyinen.tarkistettu += t.tarkistettu; yht.nykyinen.tappio += t.tappio.length; yht.nykyinen.tuntematon += t.tuntematon;
      nykyTappio = t.tappio;
    }
    let euTappio = [];
    const euId = siirrot.get(String(r.printify_product_id));
    const eu = euId && pf.get(euId);
    if (eu && LAHDE !== "nykyinen") {
      // EU-kopion avaimet samalla tavalla kuin yöllinen synkronointi: kun rivi osoittaa kopioon, sen variant_map on
      // kopion oma (esim. muki "|11oz" -> "Valkoinen|11oz"), joten arvioidaan kopion kaikki avaimet.
      const map = buildProductRow(eu, [])?.variants?.variant_map || {};
      const t = tappioVariantit(r, kulut(eu), await toimitus(eu), map);
      yht.eu.rivit++; yht.eu.tarkistettu += t.tarkistettu; yht.eu.tappio += t.tappio.length;
      yht.eu.puuttuu += Object.keys(r.variants?.variant_map || {}).filter((a) => !(a in map)).length;
      euTappio = t.tappio;
    }
    const kaikki = [...new Set([...nykyTappio, ...euTappio])];
    kat.variantit += Object.keys(r.variants?.variant_map || {}).length;
    if (kaikki.length) {
      tulos[r.slug] = kaikki.sort();
      kat.tappio += kaikki.length; kat.tappioTuotteet++;
      tappioRivit.push({ slug: r.slug, kategoria: r.category, hinta: Number(r.price), variantteja: Object.keys(r.variants?.variant_map || {}).length, tappio: kaikki.length, nykyinen: nykyTappio.length, eu: eu ? euTappio.length : null });
    }
  }
  await fs.mkdir(path.dirname(ULOS), { recursive: true });
  await fs.writeFile(ULOS, JSON.stringify(Object.fromEntries(Object.entries(tulos).sort()), null, 2) + "\n");
  const yhteenveto = {
    paiva: new Date().toISOString().slice(0, 10), lahde: LAHDE, ...yht,
    tappioVariantit: Object.values(tulos).reduce((a, b) => a + b.length, 0), tappioTuotteet: Object.keys(tulos).length,
    kategoriat, tappioRivit: tappioRivit.sort((a, b) => a.kategoria.localeCompare(b.kategoria) || a.slug.localeCompare(b.slug)),
  };
  console.log(JSON.stringify(yhteenveto, null, 2));
  console.error(`Kirjoitettu ${path.relative(juuri, ULOS)}: ${yhteenveto.tappioTuotteet} tuotetta, ${yhteenveto.tappioVariantit} tappiollista varianttia.`);
}
