/**
 * Merchant-syötteen korjaukset Googlen maksuttomia listauksia varten (26.10.2026). Ajetaan
 * api/product-feed.js:ssä lisaaKentatSyotteeseen-vaiheen JÄLKEEN (product_type lasketaan alkuperäisestä
 * Google-kategoriasta). Tarkistus: scripts/validoi-syote.mjs. Jokaiselle <item>-lohkolle:
 *  - google_product_category: Lovablen virheelliset polut Googlen taksonomian mukaisiksi (T-Shirts ei ole kategoria)
 *  - title: ajatusviivat pilkuksi, leveä ｜ tavalliseksi, välilyönnit, max 150 merkkiä sanarajalta
 *  - description: sisäiset tagit (#kaupunki:Vaasa) pois, max 5000 merkkiä
 *  - price: muoto "24.90 EUR"
 *  - brand Huumorikauppa, condition new ja identifier_exists no (ei GTIN/MPN), jos puuttuvat
 *  - image_link: etukuva (camera_label=front), jos pääkuvana on muu näkymä; additional_image_link ilman
 *    pääkuvan toistoa ja kaksoiskappaleita, max 10
 *  - vaatteet (Apparel & Accessories): gender, age_group, color (oletusväri = pääkuvan väri) ja
 *    Clothing-tuotteille size (valmistettavat koot tuotetason arvona "S/M/L/XL/2XL"; syöte on tuotetasoinen)
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
/** Printify-saatavuus: slug -> { unavailable: ["Väri|Koko"] } (generaattori scripts/printify-saatavuus.mjs). */
let SAATAVUUS = {};
try {
  SAATAVUUS = require("../../src/data/printify-saatavuus.json").products || {};
} catch {
  SAATAVUUS = {};
}

export const BRAND = "Huumorikauppa";

/** Lovablen merchant-feedin kategoriat, joita ei ole Googlen taksonomiassa -> lähin kelvollinen polku. */
export const KATEGORIAKORJAUKSET = [
  ["Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts", "Apparel & Accessories > Clothing > Shirts & Tops"],
  ["Home & Garden > Decor > Ornaments", "Home & Garden > Decor > Seasonal & Holiday Decorations > Holiday Ornaments"],
  ["Apparel & Accessories > Clothing > Underwear & Socks > Undershirts", "Apparel & Accessories > Clothing > Baby & Toddler Clothing > Baby One-Pieces"],
  [
    "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Craft Kits > Sticker Kits",
    "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Materials > Embellishments & Trims > Decorative Stickers",
  ],
  ["Home & Garden > Decor > Artwork > Posters, Prints & Visual Artwork", "Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork"],
];

const dec = (s) => String(s ?? "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const enc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const kentta = (item, nimi) => {
  const m = item.match(new RegExp(`<g:${nimi}>([^<]*)</g:${nimi}>`));
  return m ? dec(m[1]) : undefined;
};
const asetaKentta = (item, nimi, arvo) => item.replace(new RegExp(`<g:${nimi}>[^<]*</g:${nimi}>`), () => `<g:${nimi}>${enc(arvo)}</g:${nimi}>`);

export function korjaaKategoria(kat) {
  const k = String(kat || "").trim();
  return (KATEGORIAKORJAUKSET.find(([vanha]) => vanha === k) || [null, k])[1];
}

/** Otsikko Googlen ohjeiden mukaiseksi: ei ajatusviivoja, ei leveitä merkkejä, max 150 merkkiä. */
export function korjaaOtsikko(title) {
  let t = String(title || "")
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/\s*｜\s*/g, " | ")
    .replace(/\s+/g, " ")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .trim();
  if (t.length > 150) {
    const cut = t.slice(0, 151);
    t = (cut.lastIndexOf(" ") > 100 ? cut.slice(0, cut.lastIndexOf(" ")) : t.slice(0, 150)).replace(/[,|:\s]+$/, "");
  }
  return t;
}

/** Kuvaus: sisäiset luokittelutagit (#kaupunki:Vaasa) pois, max 5000 merkkiä. */
export function korjaaKuvaus(desc) {
  let d = String(desc || "")
    .replace(/\s*#[\p{L}_]+:[^\s<]+/gu, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  if (d.length > 5000) d = d.slice(0, 5000).replace(/\s+\S*$/, "");
  return d;
}

/** "24.9 EUR" / "24,90 €" / "24.90" -> "24.90 EUR"; tunnistamaton palautetaan sellaisenaan. */
export function korjaaHinta(price) {
  const m = String(price || "").trim().match(/^(\d+(?:[.,]\d{1,2})?)\s*(EUR|€)?$/i);
  return m ? `${Number(m[1].replace(",", ".")).toFixed(2)} EUR` : price;
}

const kameraKulma = (url) => (dec(decodeURIComponent(dec(url))).match(/camera_label=([\w-]+)/) || [])[1] || "";

/** Valmistettavat koot (vähintään yhdessä värissä saatavilla) variants.sizes-järjestyksessä. */
export function saatavatKoot(slug, variants) {
  const koot = Array.isArray(variants?.sizes) ? variants.sizes : [];
  const varit = Array.isArray(variants?.colors) && variants.colors.length ? variants.colors : [""];
  const ei = new Set(SAATAVUUS[slug]?.unavailable || []);
  return koot.filter((koko) => varit.some((vari) => !ei.has(`${vari}|${koko}`)));
}

export function kokoArvo(koot) {
  if (koot.length === 1 && /^one[\s_-]?size$/i.test(koot[0])) return "one_size";
  return koot.join("/").slice(0, 100);
}

function sukupuoli(title) {
  if (/\bnaisten\b/i.test(title)) return "female";
  if (/\bmiesten\b/i.test(title)) return "male";
  return "unisex";
}
function ikaryhma(title, kat) {
  if (/Baby & Toddler|Baby One-Pieces/.test(kat) || /\b(vauva\w*|body)\b/i.test(title)) return "infant";
  if (/\blasten\b/i.test(title)) return "kids";
  return "adult";
}

/**
 * @param item yhden <item>-lohkon XML
 * @param tuote { slug, variants } Supabasen products-taulusta (tai null: värit ja koot jäävät pois)
 */
export function korjaaItem(item, tuote = null) {
  let out = item;
  const katVanha = kentta(out, "google_product_category");
  const kat = korjaaKategoria(katVanha);
  if (katVanha != null && kat !== katVanha) out = asetaKentta(out, "google_product_category", kat);

  const title = kentta(out, "title");
  if (title != null) out = asetaKentta(out, "title", korjaaOtsikko(title));
  const desc = kentta(out, "description");
  if (desc != null) out = asetaKentta(out, "description", korjaaKuvaus(desc));
  const price = kentta(out, "price");
  if (price != null) out = asetaKentta(out, "price", korjaaHinta(price));
  const sale = kentta(out, "sale_price");
  if (sale != null) out = asetaKentta(out, "sale_price", korjaaHinta(sale));

  // Pääkuva: etunäkymä. Jos pääkuvana on taka- tms. näkymä ja lisäkuvissa etukuva, vaihdetaan.
  const lisakuvat = [...out.matchAll(/<g:additional_image_link>([^<]*)<\/g:additional_image_link>/g)].map((m) => m[1]);
  let paakuva = (out.match(/<g:image_link>([^<]*)<\/g:image_link>/) || [])[1];
  const etu = lisakuvat.find((u) => kameraKulma(u) === "front");
  if (paakuva && kameraKulma(paakuva) && !/^front/.test(kameraKulma(paakuva)) && etu) {
    out = out.replace(/<g:image_link>[^<]*<\/g:image_link>/, () => `<g:image_link>${etu}</g:image_link>`);
    lisakuvat.splice(lisakuvat.indexOf(etu), 1, paakuva);
    paakuva = etu;
  }
  const uniikit = [...new Set(lisakuvat)].filter((u) => u !== paakuva).slice(0, 10);
  if (lisakuvat.length) {
    out = out.replace(/\s*<g:additional_image_link>[^<]*<\/g:additional_image_link>/g, "");
    const rivit = uniikit.map((u) => `\n      <g:additional_image_link>${u}</g:additional_image_link>`).join("");
    out = /<\/g:image_link>/.test(out) ? out.replace(/<\/g:image_link>/, () => `</g:image_link>${rivit}`) : out.replace(/\s*<\/item>$/, () => `${rivit}\n    </item>`);
  }

  const lisat = [];
  const lisaa = (nimi, arvo) => {
    if (arvo != null && arvo !== "" && !new RegExp(`<g:${nimi}>`).test(out)) lisat.push(`      <g:${nimi}>${enc(arvo)}</g:${nimi}>`);
  };
  lisaa("brand", BRAND);
  lisaa("condition", "new");
  if (!/<g:(gtin|mpn)>/.test(out)) lisaa("identifier_exists", "no");
  if (/^Apparel & Accessories\b/.test(kat || "")) {
    const t = title || "";
    lisaa("gender", sukupuoli(t));
    lisaa("age_group", ikaryhma(t, kat));
    const v = tuote?.variants || null;
    const varit = Array.isArray(v?.colors) ? v.colors : [];
    lisaa("color", v?.default_color || varit[0]);
    if (/^Apparel & Accessories > (Clothing|Shoes)(?: >|$)/.test(kat)) {
      const koot = saatavatKoot(tuote?.slug, v);
      if (koot.length) lisaa("size", kokoArvo(koot));
    }
  }
  return lisat.length ? out.replace(/\s*<\/item>$/, `\n${lisat.join("\n")}\n    </item>`) : out;
}

/** @param tuotteet Map tuote-id -> { slug, variants } */
export function korjaaSyote(xml, tuotteet = new Map()) {
  return xml.replace(/<item>[\s\S]*?<\/item>/g, (item) => korjaaItem(item, tuotteet.get(kentta(item, "id")) || null));
}

/** Hakee tuotteiden variaatiotiedot Supabasesta (julkinen avain). Virheessä tyhjä Map: syöte toimitetaan silti. */
export async function haeTuotteet({ url, key, fetchImpl = fetch, timeoutMs = 5000 } = {}) {
  const tuotteet = new Map();
  if (!url || !key) return tuotteet;
  const ctrl = new AbortController();
  const ajastin = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    for (let from = 0; from < 10000; from += 1000) {
      const r = await fetchImpl(
        `${url}/rest/v1/products?select=id,slug,sizes:variants->sizes,colors:variants->colors,default_color:variants->default_color&order=id`,
        { headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 999}`, "Range-Unit": "items" }, signal: ctrl.signal },
      );
      if (!r.ok) break;
      const rivit = await r.json();
      if (!Array.isArray(rivit)) break;
      for (const p of rivit) tuotteet.set(p.id, { slug: p.slug, variants: { sizes: p.sizes, colors: p.colors, default_color: p.default_color } });
      if (rivit.length < 1000) break;
    }
  } catch (err) {
    console.error("product-feed: variaatiotietojen haku epäonnistui:", err?.message || err);
  } finally {
    clearTimeout(ajastin);
  }
  return tuotteet;
}
