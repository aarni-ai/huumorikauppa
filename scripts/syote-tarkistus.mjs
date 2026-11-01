/**
 * Merchant-syötteen kenttätarkistus (2.11.2026): jokaiselta tuotteelta pakolliset ja suositellut kentät, puutteet
 * kenttäkohtaisesti. Ajettavissa uudelleen, ei muuta mitään.
 *
 * Ajo:
 *   node scripts/syote-tarkistus.mjs                       # tuotanto https://huumorikauppa.fi/product-feed.xml
 *   node scripts/syote-tarkistus.mjs <url tai tiedosto.xml>
 *   node scripts/syote-tarkistus.mjs --json                # koneluettava yhteenveto
 * Poistumiskoodi 1, jos jokin pakollinen kenttä puuttuu.
 *
 * Säännöt (Googlen tuotetietomääritys, vaatteet Suomeen):
 *  - pakolliset kaikille: id, title, description, link, image_link, availability, price, brand, condition,
 *    identifier_exists=no (omat painotuotteet, ei GTIN/MPN), google_product_category, product_type, shipping (FI,
 *    hinta kassan säännöllä: 6,90 € alle 79 €, muuten 0, käsittely- ja kuljetusajat)
 *  - vaatteet (Apparel & Accessories): color, gender, age_group; Clothing-tuotteille size
 *  - joulutuotteet (api/_lib/syote-lisakentat.js onJoulutuote): custom_label_3 = joulu2026
 */
import { readFile } from "node:fs/promises";
import { ILMAINEN_RAJA, KASITTELY, KULJETUS, TOIMITUS, onJoulutuote } from "../api/_lib/syote-lisakentat.js";

const args = process.argv.slice(2);
const json = args.includes("--json");
const lahde = args.find((a) => !a.startsWith("--")) || "https://huumorikauppa.fi/product-feed.xml";

const xml = /^https?:/.test(lahde) ? await (await fetch(lahde, { headers: { "User-Agent": "Mozilla/5.0 (syote-tarkistus)" } })).text() : await readFile(lahde, "utf8");
const items = [...xml.matchAll(/<item>[\s\S]*?<\/item>/g)].map((m) => m[0]);

const dec = (s) => String(s ?? "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const kentta = (item, nimi) => { const m = item.match(new RegExp(`<g:${nimi}>([^<]*)</g:${nimi}>`)); return m ? dec(m[1]).trim() : undefined; };

const puutteet = {}; // kenttä -> [id]
const kirjaa = (kenttanimi, id) => (puutteet[kenttanimi] ||= []).push(id);
let joulu = 0;
let vaatteita = 0;

for (const item of items) {
  const id = kentta(item, "id") || "(ei id:tä)";
  for (const k of ["id", "title", "description", "link", "image_link", "availability", "price", "brand", "condition", "google_product_category", "product_type"]) {
    if (!kentta(item, k)) kirjaa(k, id);
  }
  if (kentta(item, "identifier_exists") !== "no" && !kentta(item, "gtin")) kirjaa("identifier_exists=no", id);
  if (!/^https:\/\/huumorikauppa\.fi\/tuote\/[^/?#]+$/.test(kentta(item, "link") || "")) kirjaa("link (muoto)", id);
  if (!/^(in_stock|out_of_stock|preorder|backorder)$/.test(kentta(item, "availability") || "")) kirjaa("availability (arvo)", id);
  const hinta = (kentta(item, "price") || "").match(/^(\d+\.\d{2}) EUR$/);
  if (!hinta) kirjaa("price (muoto)", id);
  if ((kentta(item, "title") || "").length > 150) kirjaa("title (>150)", id);

  const ship = (item.match(/<g:shipping>([\s\S]*?)<\/g:shipping>/) || [])[1] || "";
  if (!ship) kirjaa("shipping", id);
  else {
    if (kentta(ship, "country") !== "FI") kirjaa("shipping.country", id);
    const odotettu = hinta && Number(hinta[1]) >= ILMAINEN_RAJA ? 0 : TOIMITUS;
    if (kentta(ship, "price") !== `${odotettu.toFixed(2)} EUR`) kirjaa("shipping.price", id);
    // Käsittely- ja kuljetusaika samat kuin src/config/toimitus.ts (tuotesivujen OfferShippingDetails).
    const ajat = { min_handling_time: KASITTELY[0], max_handling_time: KASITTELY[1], min_transit_time: KULJETUS[0], max_transit_time: KULJETUS[1] };
    for (const [k, v] of Object.entries(ajat)) if (kentta(ship, k) !== String(v)) kirjaa(`shipping.${k} (${v})`, id);
  }
  if (!/<g:free_shipping_threshold>[\s\S]*?<g:price_threshold>79\.00 EUR<\/g:price_threshold>/.test(item)) kirjaa("free_shipping_threshold", id);

  const kat = kentta(item, "google_product_category") || "";
  // Numeerinen id (api/_lib/syote-sisalto.js GOOGLE_KATEGORIA_ID) tai tekstipolku.
  const vaate = /^Apparel & Accessories/.test(kat) || ["212", "5598", "1604", "173", "166", "5322", "204"].includes(kat) || /^Vaatteet|^Asusteet/.test(kentta(item, "product_type") || "");
  if (vaate) {
    vaatteita++;
    for (const k of ["color", "gender", "age_group"]) if (!kentta(item, k)) kirjaa(k, id);
    if (!/pipo|lippis|laukku|kassi/i.test(kentta(item, "title") || "") && !kentta(item, "size")) kirjaa("size", id);
    if (kentta(item, "size")) {
      if (kentta(item, "size_system") !== "EU") kirjaa("size_system", id);
      if (kentta(item, "size_type") !== "regular") kirjaa("size_type", id);
      const koot = kentta(item, "size").split("/");
      const J = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
      if (koot.some((k, i) => i && J.indexOf(k) >= 0 && J.indexOf(koot[i - 1]) > J.indexOf(k))) kirjaa("size (järjestys)", id);
    }
  }
  const onJoulu = [0, 1, 2, 3, 4].some((n) => kentta(item, `custom_label_${n}`) === "joulu2026");
  if (onJoulu) joulu++;
  const slug = ((kentta(item, "link") || "").match(/\/tuote\/([^/?#]+)/) || [])[1] || "";
  if (onJoulutuote(`${kentta(item, "title") || ""} ${slug}`) && !onJoulu) kirjaa("custom_label_3=joulu2026", id);
}

const pakolliset = Object.keys(puutteet);
if (json) {
  console.log(JSON.stringify({ tuotteita: items.length, vaatteita, joulu2026: joulu, puutteet: Object.fromEntries(pakolliset.map((k) => [k, puutteet[k].length])) }, null, 2));
} else {
  console.log(`Lähde: ${lahde}`);
  console.log(`Tuotteita ${items.length}, vaatteita ${vaatteita}, joulu2026-label ${joulu}`);
  if (!pakolliset.length) console.log("Ei puutteita.");
  for (const k of pakolliset.sort()) console.log(`  ${k}: ${puutteet[k].length} (esim. ${puutteet[k].slice(0, 3).join(", ")})`);
}
process.exitCode = pakolliset.length ? 1 : 0;
