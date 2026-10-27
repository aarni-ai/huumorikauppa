/**
 * Tilauskohtaiset katteet Printifyn todellisilla tilauskuluilla -> KATTEET.md (osio "Tilauskohtaiset katteet (Printify,
 * 1.6.2026 alkaen)", korvataan uudelleenajossa; osion käsin kirjoitettu lohko säilyy). Vain lukee: GET orders,
 * products, catalog. Ei luo, peru eikä lähetä tilauksia.
 *
 *   set -a; . ./.env.printify.local; . ./.env.production.local; set +a
 *   node scripts/tilauskatteet.mjs [--alkaen 2026-06-01] [--json polku.json] [--kurssi 1] [--ei-kirjoitusta]
 *
 * Kaupan hinnat: Supabasen anon REST (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY), printify_product_id; EU-kopiot
 * ja poistetut kopiot data/eu-siirto-*.json -kirjausten kautta; varalla nimellä; viimeisenä Printifyn metadata.price
 * (liputettu). Laskenta scripts/lib/tilauskatteet.mjs, painotalon maa ja Printify Choice api/_lib/tilausvahti.js.
 * --kurssi: euroa per Printifyn tilin valuuttayksikkö (oletus 1 = summat luetaan euroina).
 * Henkilötiedot: vain etunimi ja sukunimen alkukirjain.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { printifyKulut, rivinPainotalo } from "../api/_lib/tilausvahti.js";
import { premiumSaasto } from "../api/_lib/premium.js";
import { OSIO, asiakas, teeHinnasto, siirtoKartta, laskeTilaus, markdown, korvaaOsio, eur, yhteensa } from "./lib/tilauskatteet.mjs";

const KEY = process.env.PRINTIFY_API_KEY;
const SHOP = process.env.PRINTIFY_SHOP_ID;
if (!KEY || !SHOP) { console.error("PRINTIFY_API_KEY ja PRINTIFY_SHOP_ID tarvitaan."); process.exit(1); }
const arvo = (n, d = null) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : d);
const ALKAEN = arvo("--alkaen", "2026-06-01");
const KURSSI = Number(arvo("--kurssi", "1"));
const JSON_POLKU = arvo("--json");
if (!/^\d{4}-\d{2}-\d{2}$/.test(ALKAEN) || !(KURSSI > 0)) { console.error("--alkaen VVVV-KK-PP, --kurssi > 0"); process.exit(1); }

let viimeisin = 0;
async function printify(polku, { salliVirhe = false } = {}) {
  for (let yritys = 0; yritys < 5; yritys++) {
    const odota = viimeisin + 250 - Date.now();
    if (odota > 0) await new Promise((r) => setTimeout(r, odota));
    viimeisin = Date.now();
    const res = await fetch(`https://api.printify.com/v1${polku}`, { headers: { Authorization: `Bearer ${KEY}` } });
    if (res.status === 429 || res.status >= 500) { await new Promise((r) => setTimeout(r, 1000 * 2 ** yritys)); continue; }
    if (!res.ok) {
      if (salliVirhe) return { ok: false, status: res.status, data: null };
      throw new Error(`Printify ${polku}: HTTP ${res.status}`);
    }
    const data = await res.json();
    return salliVirhe ? { ok: true, status: res.status, data } : data;
  }
  throw new Error(`Printify ${polku}: ei vastausta`);
}

async function kaikkiTilaukset() {
  const out = [];
  for (let sivu = 1; sivu < 500; sivu++) {
    const j = await printify(`/shops/${SHOP}/orders.json?limit=10&page=${sivu}`);
    out.push(...(j.data || []));
    if (!j.next_page_url || !(j.data || []).length) break;
  }
  return out;
}

async function kaupanTuotteet() {
  const url = process.env.VITE_SUPABASE_URL, k = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !k) throw new Error("VITE_SUPABASE_URL ja VITE_SUPABASE_PUBLISHABLE_KEY tarvitaan (.env.production.local)");
  const out = [];
  for (let alku = 0; alku < 20000; alku += 1000) {
    const res = await fetch(`${url}/rest/v1/products?select=slug,name,price,category,printify_product_id&order=slug&offset=${alku}&limit=1000`, {
      headers: { apikey: k, Authorization: `Bearer ${k}` },
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const sivu = await res.json();
    out.push(...sivu);
    if (sivu.length < 1000) break;
  }
  return out;
}

async function siirtoLokit() {
  const kansio = path.join(process.cwd(), "data");
  const nimet = (await fs.readdir(kansio)).filter((n) => /^eu-siirto-.*\.json$/.test(n)).sort();
  return Promise.all(nimet.map(async (n) => JSON.parse(await fs.readFile(path.join(kansio, n), "utf8"))));
}

const pvmFi = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return `${d}.${m}.${y}`;
};

const [tilaukset, tuotteet, lokit] = await Promise.all([kaikkiTilaukset(), kaupanTuotteet(), siirtoLokit()]);
const hinta = teeHinnasto(tuotteet, siirtoKartta(lokit));
const haePainotalo = (id) => printify(`/catalog/print_providers/${id}.json`, { salliVirhe: true });

const valitut = tilaukset
  .filter((o) => String(o.created_at).slice(0, 10) >= ALKAEN && o.status !== "canceled" && o.status !== "cancelled")
  .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));

const rivit = [];
const huomiot = [];
for (const o of valitut) {
  const kulut = printifyKulut(o);
  if (!kulut) { huomiot.push(`${pvmFi(o.created_at)} ${asiakas(o.address_to)}: Printify-kulut puuttuvat, ohitettu.`); continue; }
  const tilausRivit = [];
  for (const l of o.line_items || []) {
    const h = hinta(l);
    tilausRivit.push({
      title: l.metadata?.title || l.product_id, variant: l.metadata?.variant_label || "", quantity: l.quantity || 1,
      hinta: h.hinta, lahde: h.lahde, slug: h.slug, product_id: l.product_id, painotalo: await rivinPainotalo(l, haePainotalo),
    });
  }
  const luvut = laskeTilaus(tilausRivit, kulut, { kurssi: KURSSI });
  rivit.push({ pvm: pvmFi(o.created_at), iso: o.created_at, tyyppi: o.metadata?.order_type || "", status: o.status, asiakas: asiakas(o.address_to), rivit: tilausRivit, luvut, tuotekulu: (kulut.tuotteet || 0) * KURSSI });
}

// Huomiot: EU:n ulkopuoliset painotalot, varahinnat, tappiolliset tilaukset, kauppa yhä vanhassa (EU-siirron lähde) tuotteessa.
for (const t of rivit) {
  for (const r of t.rivit) {
    if (r.painotalo.eu === false) huomiot.push(`${t.pvm} ${t.asiakas}: ${r.title} painettiin EU:n ulkopuolella (${r.painotalo.nimi}, ${r.painotalo.maa || "?"}).`);
    if (r.lahde === "printify") huomiot.push(`${t.pvm} ${t.asiakas}: ${r.title}: kaupasta ei löytynyt tuotetta, hinta Printifyn metadata.price ${eur(r.hinta ?? 0)}.`);
    if (r.lahde === null) huomiot.push(`${t.pvm} ${t.asiakas}: ${r.title}: hintaa ei löytynyt, laskettu 0 €.`);
  }
  if (t.luvut.kate < 0) huomiot.push(`${t.pvm} ${t.asiakas}: tappiollinen (nettokate ${eur(t.luvut.kate)}).`);
}
const vanhat = new Set(lokit.flatMap((l) => (l.siirrot || []).map((s) => s.vanhaId)));
const kaupassaVanha = tuotteet.filter((p) => vanhat.has(p.printify_product_id));
if (kaupassaVanha.length) {
  huomiot.push(`Kaupan tuotteista ${kaupassaVanha.length}/${tuotteet.length} osoittaa yhä EU-siirron vanhaan (EU:n ulkopuoliseen) Printify-tuotteeseen (printify_product_id = siirtokirjauksen vanhaId), esim. ${kaupassaVanha.slice(0, 3).map((p) => p.slug).join(", ")}. Näiden tilaukset painetaan edelleen vanhalla painotalolla, kunnes kaupan rivi vaihdetaan EU-kopioon.`);
}

// Printify Premium: 20 % alennus vain tuotekulusta (total_price), 34,99 €/kk.
const nyt = new Date();
const raja30 = new Date(nyt.getTime() - 30 * 86400e3).toISOString();
const viim30 = rivit.filter((t) => new Date(t.iso).toISOString() >= raja30);
const p30 = premiumSaasto(viim30.reduce((s, t) => s + t.tuotekulu, 0));
const kuukausia = Math.max(1, (nyt - new Date(`${ALKAEN}T00:00:00Z`)) / (30 * 86400e3));
const pKaikki = premiumSaasto(rivit.reduce((s, t) => s + t.tuotekulu, 0));
const premiumHuomio = [
  "",
  "Printify Premium (34,99 €/kk, -20 % vain tuotekulusta, ei toimituksesta eikä verosta):",
  "",
  `- Edelliset 30 pv (${viim30.length} tilausta): tuotekulut ${eur(p30.tuotekulut)}, alennus brutto ${eur(p30.alennus)}, nettosäästö ${eur(p30.netto)}${p30.suositus ? " -> **suositus: ota Premium käyttöön**" : " (ei kannata, raja 35 € bruttoalennusta / 30 pv)"}.`,
  `- ${pvmFi(ALKAEN)} alkaen (${rivit.length} tilausta, noin ${kuukausia.toFixed(1).replace(".", ",")} x 30 pv): tuotekulut ${eur(pKaikki.tuotekulut)}, alennus brutto ${eur(pKaikki.alennus)}, maksut ${eur(34.99 * Math.ceil(kuukausia))} (${Math.ceil(kuukausia)} kk), nettosäästö ${eur(pKaikki.alennus - 34.99 * Math.ceil(kuukausia))}.`,
];

const paiva = nyt.toISOString().slice(0, 10);
const sisalto = markdown(rivit, { paiva, alkaen: pvmFi(ALKAEN), kurssi: KURSSI, huomiot }) + "\n" + premiumHuomio.join("\n");
const y = yhteensa(rivit);
console.log(sisalto);
console.log(`\nYhteensä ${y.tilauksia} tilausta: myynti alv 0 ${eur(y.myyntiAlv0)}, Printify ${eur(y.kulu)} (ilman alv ${eur(y.kuluIlmanAlv)}), kate ${eur(y.kate)} (ilman Printifyn alv ${eur(y.kateIlmanAlv)})`);

if (!process.argv.includes("--ei-kirjoitusta")) {
  const md = await fs.readFile("KATTEET.md", "utf8");
  await fs.writeFile("KATTEET.md", korvaaOsio(md, OSIO.replace("1.6.2026", pvmFi(ALKAEN)), sisalto));
  console.log("KATTEET.md päivitetty.");
}
if (JSON_POLKU) {
  await fs.writeFile(JSON_POLKU, JSON.stringify({ paiva, alkaen: ALKAEN, kurssi: KURSSI, yhteensa: y, premium: { viim30: p30, alkaen: pKaikki }, tilaukset: rivit, huomiot }, null, 2));
  console.log(`JSON: ${JSON_POLKU}`);
}
