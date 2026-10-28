/**
 * Google Merchant Center -syötteen (RSS 2.0 + g:-nimiavaruus) tarkistussäännöt maksuttomia
 * listauksia (free listings) varten. Lähde: Merchant Center product data specification
 * https://support.google.com/merchants/answer/7052112 (tarkistettu 26.10.2026):
 *  - color, gender, age_group: pakollisia maksuttomissa listauksissa kaikille Apparel & Accessories (166) -tuotteille
 *  - size: pakollinen maksuttomissa listauksissa Apparel & Accessories > Clothing (1604) -tuotteille
 *  - item_group_id: pakollinen maksuttomissa listauksissa vain, jos lähetetään variantteja
 *  - title max 150, description max 5000, hinta sisältää ALV:n (muut maat kuin US/CA)
 *  - kuvat: vähintään 100x100 (vaatteet 250x250); 500x500 suositus, pakollinen 31.1.2027 alkaen
 *  - google_product_category: polku tai numeerinen ID (taxonomy-with-ids.en-US.txt); ID:t puretaan poluksi vaatesääntöjä varten
 *  - 28.10.2026 lisätty: emoji ja mainosteksti otsikossa/kuvauksessa, kuvauksen pituus 500-1500 (varoitus),
 *    product_type, material, hinta = sivuston /api/products-hinta (opts.apiHinnat)
 *
 * Puhdas moduuli ilman sivuvaikutuksia: CLI on scripts/validoi-syote.mjs, testit src/test/syoteValidointi.test.ts.
 */
import { OHJATUT_TUOTESLUGIT } from "../api/_lib/ohjatut-tuotteet.js";
import { KOKONAAN_EI_SAATAVILLA } from "../api/_lib/printify-saatavuus.js";
import { onKaksoiskappaleTaiTestikopio } from "../api/_lib/kaksoiskappaleet.js";
import { onEuReititettySlug } from "../api/_lib/eu-reititys.js";
// Toimitussääntö kassan vakioista (api/_lib/vakiot.js, sama kuin api/_lib/kassa.js), ei syötteen omasta peilistä.
import { ILMAINEN_TOIMITUS_RAJA as ILMAINEN_RAJA, TOIMITUS } from "../api/_lib/vakiot.js";
import { GOOGLE_KATEGORIAT } from "../api/_lib/syote-sisalto.js";

export const SITE = "https://huumorikauppa.fi";
export const AVAILABILITY = new Set(["in_stock", "out_of_stock", "preorder", "backorder"]);
export const CONDITION = new Set(["new", "refurbished", "used"]);
export const GENDER = new Set(["male", "female", "unisex"]);
export const AGE_GROUP = new Set(["newborn", "infant", "toddler", "kids", "adult"]);

/** XML-tekstisolmun purku (syötteessä &amp; &gt; &lt; &quot; &apos;). */
export function xmlDecode(s) {
  return String(s ?? "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Jäsentää syötteen <item>-lohkot objekteiksi: kenttä -> [arvot] (purettuina), lisäksi shipping-alilohkot. */
export function parseFeed(xml) {
  const items = String(xml).match(/<item>[\s\S]*?<\/item>/g) || [];
  return items.map((raw) => {
    const shipping = (raw.match(/<g:shipping>[\s\S]*?<\/g:shipping>/g) || []).map((s) => ({
      country: xmlDecode((s.match(/<g:country>([^<]*)<\/g:country>/) || [])[1]),
      price: xmlDecode((s.match(/<g:price>([^<]*)<\/g:price>/) || [])[1]),
    }));
    const body = raw.replace(/<g:shipping>[\s\S]*?<\/g:shipping>/g, "");
    const fields = {};
    for (const m of body.matchAll(/<g:(\w+)>([^<]*)<\/g:\1>/g)) (fields[m[1]] ||= []).push(xmlDecode(m[2]));
    return { raw, fields, shipping };
  });
}

const eka = (item, nimi) => (item.fields[nimi] || [])[0];

export function slugOf(link) {
  return (String(link || "").match(/\/tuote\/([^?#/]+)\/?$/) || [])[1] || "";
}

export function isApparel(category) {
  return /^Apparel & Accessories\b/.test(category || "");
}
export function isClothing(category) {
  return /^Apparel & Accessories > (Clothing|Shoes)(?: >|$)/.test(category || "");
}

/** Hinta muodossa "24.90 EUR" -> 24.9, muuten NaN. */
export function parsePrice(s) {
  const m = String(s || "").match(/^(\d+)\.(\d{2}) ([A-Z]{3})$/);
  return m ? Number(`${m[1]}.${m[2]}`) : NaN;
}

// "ilmaiseksi" yksinään ei ole mainosteksti (painoteksti "Neuvoja ilmaiseksi"); toimitukseen liitettynä on.
export const PROMO = /(?<![\p{L}])(ilmainen toimitus|ilmaiset toimitukset|toimitus ilmaiseksi|ilmaisella toimituksella|ale|alennus|alennuksella|tarjous|tarjouksessa|osta nyt|tilaa nyt|free shipping|sale|discount|buy now)(?![\p{L}])|-\d+\s?%|\d+\s?%\s?(?:ale|off)(?![\p{L}])/iu;
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}]/u;

/** Kategoria polkuna: numeerinen ID puretaan (opts.taxonomyIds tai syötteen tunnetut ID:t), polku sellaisenaan. */
export function categoryPath(cat, taxonomyIds) {
  if (!/^\d+$/.test(cat || "")) return cat || "";
  return taxonomyIds?.get(cat) || GOOGLE_KATEGORIAT[cat] || "";
}
const CAPS_WORD = /(?:^|[\s|｜,:])([A-ZÅÄÖ]{4,})(?=$|[\s|｜,:])/;

/**
 * Tarkistaa yhden tuotteen. Palauttaa [{ taso: "virhe"|"varoitus", tyyppi, viesti }].
 * @param opts.taxonomy Set Google-kategoriapolkuja (taxonomy.en-US.txt), tarkistetaan jos annettu
 * @param opts.sitemapSlugs Set sivukartan tuoteslugeja, tarkistetaan jos annettu
 */
export function validateItem(item, opts = {}) {
  const out = [];
  const virhe = (tyyppi, viesti = "") => out.push({ taso: "virhe", tyyppi, viesti });
  const varoitus = (tyyppi, viesti = "") => out.push({ taso: "varoitus", tyyppi, viesti });

  const id = eka(item, "id");
  if (!id) virhe("id_puuttuu");
  else if (id.length > 50) virhe("id_liian_pitka", id);

  const title = eka(item, "title") || "";
  if (!title.trim()) virhe("title_puuttuu");
  else {
    if (title.length > 150) virhe("title_yli_150", `${title.length} merkkiä`);
    if (PROMO.test(title)) virhe("title_mainosteksti", title);
    if (EMOJI.test(title)) virhe("title_emoji", title);
    if (/[–—]/.test(title)) varoitus("title_ajatusviiva", title);
    if (CAPS_WORD.test(title)) varoitus("title_versaalit", title);
    if (/\[[^\]]*\]/.test(title)) varoitus("title_paikkamerkki", title);
    if (title !== title.trim() || /\s{2,}/.test(title)) varoitus("title_valilyonnit", title);
    if (/[｜]/.test(title)) varoitus("title_erikoismerkki", title);
    if (/!{2,}|\?{2,}/.test(title)) virhe("title_liikaa_valimerkkeja", title);
    else if (/!/.test(title)) varoitus("title_huutomerkki", title);
  }

  const desc = eka(item, "description") || "";
  if (!desc.trim()) virhe("description_puuttuu");
  else {
    if (desc.length > 5000) virhe("description_yli_5000", `${desc.length} merkkiä`);
    if (/#[\p{L}_]+:\S+/u.test(desc)) varoitus("description_sisainen_tagi", desc.slice(-60));
    if (/https?:\/\//.test(desc)) varoitus("description_linkki");
    if (PROMO.test(desc)) virhe("description_mainosteksti", (desc.match(PROMO) || [])[0]);
    if (/[–—]/.test(desc)) varoitus("description_ajatusviiva");
    if (EMOJI.test(desc)) varoitus("description_emoji");
    if (desc.length < 500) varoitus("description_alle_500", `${desc.length} merkkiä`);
    else if (desc.length > 1500) varoitus("description_yli_1500", `${desc.length} merkkiä`);
  }

  const link = eka(item, "link") || "";
  const slug = slugOf(link);
  if (!link) virhe("link_puuttuu");
  else if (!link.startsWith("https://")) virhe("link_ei_https", link);
  else if (!slug || link !== `${SITE}/tuote/${slug}`) virhe("link_ei_kanoninen", link);
  if (slug && opts.sitemapSlugs && !opts.sitemapSlugs.has(slug)) virhe("link_ei_sivukartassa", slug);

  const img = eka(item, "image_link") || "";
  if (!img) virhe("image_link_puuttuu");
  else {
    if (!img.startsWith("https://")) virhe("image_link_ei_https", img);
    if (/placeholder|no[-_]?image/i.test(img)) virhe("image_link_paikkamerkki", img);
    const label = (decodeURIComponent(img).match(/camera_label=([\w-]+)/) || [])[1];
    if (label && label !== "front" && !/^front/.test(label)) varoitus("image_link_ei_etukuva", label);
  }
  const extra = item.fields.additional_image_link || [];
  if (extra.length > 10) virhe("additional_image_link_yli_10", String(extra.length));
  if (img && extra.includes(img)) varoitus("additional_image_link_toistaa_paakuvan");
  if (new Set(extra).size !== extra.length) varoitus("additional_image_link_kaksoiskappale");

  const avail = eka(item, "availability");
  if (!avail) virhe("availability_puuttuu");
  else if (!AVAILABILITY.has(avail)) virhe("availability_virheellinen", avail);

  const priceStr = eka(item, "price");
  const price = parsePrice(priceStr);
  if (!priceStr) virhe("price_puuttuu");
  else if (Number.isNaN(price)) virhe("price_muoto", priceStr);
  else {
    if (!priceStr.endsWith(" EUR")) virhe("price_valuutta", priceStr);
    if (price <= 0) virhe("price_nolla", priceStr);
    // Hinta = sivuston rajapinnan hinta (sama kuin tuotesivu ja kassa). opts.apiHinnat: Map slug -> hinta.
    if (opts.apiHinnat && slug) {
      const api = opts.apiHinnat.get(slug);
      if (api == null) varoitus("price_ei_rajapinnassa", slug);
      else if (Math.abs(Number(api) - price) > 0.005) virhe("price_ei_vastaa_sivustoa", `${priceStr} != ${Number(api).toFixed(2)} EUR (${slug})`);
    }
  }
  const sale = eka(item, "sale_price");
  if (sale && !(parsePrice(sale) < price)) virhe("sale_price_virheellinen", sale);

  const brand = eka(item, "brand");
  if (!brand) virhe("brand_puuttuu");
  const ie = eka(item, "identifier_exists");
  if (!item.fields.gtin && !item.fields.mpn && ie !== "no") virhe("identifier_exists_puuttuu");

  const cond = eka(item, "condition");
  if (!cond) varoitus("condition_puuttuu");
  else if (!CONDITION.has(cond)) virhe("condition_virheellinen", cond);

  const catRaw = eka(item, "google_product_category") || "";
  const cat = categoryPath(catRaw, opts.taxonomyIds);
  if (!catRaw) varoitus("google_product_category_puuttuu");
  else if (/^\d+$/.test(catRaw)) {
    if (opts.taxonomyIds ? !opts.taxonomyIds.has(catRaw) : !cat) (opts.taxonomyIds ? virhe : varoitus)("google_product_category_id_tuntematon", catRaw);
  } else if (opts.taxonomy && !opts.taxonomy.has(catRaw)) virhe("google_product_category_tuntematon", catRaw);
  const ptype = eka(item, "product_type");
  if (!ptype) varoitus("product_type_puuttuu");
  else if (ptype.length > 750) virhe("product_type_yli_750", `${ptype.length} merkkiä`);
  const material = eka(item, "material");
  if (material != null && (!material.trim() || material.length > 200)) virhe("material_virheellinen", material);

  if (isApparel(cat)) {
    const color = eka(item, "color");
    if (!color) virhe("color_puuttuu_vaate");
    else if (color.length > 100 || /^\d+$/.test(color)) virhe("color_virheellinen", color);
    const gender = eka(item, "gender");
    if (!gender) virhe("gender_puuttuu_vaate");
    else if (!GENDER.has(gender)) virhe("gender_virheellinen", gender);
    const age = eka(item, "age_group");
    if (!age) virhe("age_group_puuttuu_vaate");
    else if (!AGE_GROUP.has(age)) virhe("age_group_virheellinen", age);
    if (isClothing(cat)) {
      const size = eka(item, "size");
      if (!size) virhe("size_puuttuu_vaate");
      else if (size.length > 100) virhe("size_virheellinen", size);
      else if (/\//.test(size) && !eka(item, "item_group_id")) varoitus("size_monta_arvoa_tuotetasolla", size);
    }
  }
  if (eka(item, "item_group_id") && !eka(item, "color") && !eka(item, "size")) varoitus("item_group_id_ilman_varianttikenttia");

  if (!item.shipping.length) varoitus("shipping_puuttuu");
  for (const s of item.shipping) {
    if (s.country !== "FI") virhe("shipping_maa", s.country);
    const expected = price >= ILMAINEN_RAJA ? 0 : TOIMITUS;
    const sp = parsePrice(s.price);
    if (Number.isNaN(sp)) virhe("shipping_hinta_muoto", s.price);
    else if (!Number.isNaN(price) && Math.abs(sp - expected) > 0.001) virhe("shipping_hinta_ei_vastaa_kassaa", `${s.price}, odotettu ${expected.toFixed(2)} EUR`);
  }

  // Myynnistä piilotetut / ohjatut / valmistamattomat / kaksoiskappaleet (api/product-feed.js dropHiddenItems).
  if (/Drinkware > Mugs/.test(cat) || /-muki$/.test(slug) || /\b(?:Muki|kahvimuki)\b/i.test(title)) virhe("piilotettu_muki", slug);
  if (slug && OHJATUT_TUOTESLUGIT.has(slug)) virhe("ohjattu_tuote", slug);
  if (slug && KOKONAAN_EI_SAATAVILLA.has(slug)) virhe("ei_valmisteta", slug);
  if (slug && onKaksoiskappaleTaiTestikopio(slug)) virhe("kaksoiskappale_tai_testikopio", slug);
  // opts.euReititetty(slug): rivitietoon perustuva päätös (validoi-syote.mjs hakee rivit /api/products-rajapinnasta),
  // jotta EU-kopioon siirretty rivi ei ole virhe. Oletuksena päätös slugista.
  if (slug && (opts.euReititetty || onEuReititettySlug)(slug)) virhe("valmistetaan_eu_ulkopuolella", slug);
  return out;
}

/** Koko syötteen tarkistus: tuotekohtaiset säännöt + kaksoiskappaleet (id, link). */
export function validateFeed(xml, opts = {}) {
  const items = parseFeed(xml);
  const tulokset = items.map((item) => ({ id: eka(item, "id") || "", link: eka(item, "link") || "", ongelmat: validateItem(item, opts) }));
  const nahty = { id: new Map(), link: new Map() };
  for (const t of tulokset) {
    for (const k of ["id", "link"]) {
      if (!t[k]) continue;
      if (nahty[k].has(t[k])) t.ongelmat.push({ taso: "virhe", tyyppi: `${k}_kaksoiskappale`, viesti: t[k] });
      else nahty[k].set(t[k], true);
    }
  }
  if (!items.length) tulokset.push({ id: "", link: "", ongelmat: [{ taso: "virhe", tyyppi: "syote_tyhja", viesti: "" }] });
  return { items, tulokset };
}

/** Laskee ongelmat tyypeittäin: { virheet: {tyyppi: n}, varoitukset: {...}, tuotteitaVirheilla } */
export function summarize(tulokset) {
  const virheet = {};
  const varoitukset = {};
  let tuotteitaVirheilla = 0;
  for (const t of tulokset) {
    if (t.ongelmat.some((o) => o.taso === "virhe")) tuotteitaVirheilla++;
    for (const o of t.ongelmat) {
      const kohde = o.taso === "virhe" ? virheet : varoitukset;
      kohde[o.tyyppi] = (kohde[o.tyyppi] || 0) + 1;
    }
  }
  return { tuotteita: tulokset.length, tuotteitaVirheilla, virheet, varoitukset };
}

/** Kuvan mitat JPEG/PNG/WebP/GIF-tavuista (riittää alku, JPEG voi vaatia enemmän). null jos ei tunnistu. */
export function imageSize(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const u16 = (i) => (b[i] << 8) | b[i + 1];
  const u32 = (i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { width: u32(16), height: u32(20), type: "png" };
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return { width: b[6] | (b[7] << 8), height: b[8] | (b[9] << 8), type: "gif" };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) {
    const fmt = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (fmt === "VP8X") return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)), type: "webp" };
    if (fmt === "VP8 ") return { width: (b[26] | (b[27] << 8)) & 0x3fff, height: (b[28] | (b[29] << 8)) & 0x3fff, type: "webp" };
    if (fmt === "VP8L") {
      const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1, type: "webp" };
    }
    return null;
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { width: u16(i + 7), height: u16(i + 5), type: "jpeg" };
      i += 2 + u16(i + 2);
    }
  }
  return null;
}

/**
 * Tarkistaa kuvan HTTP-vastauksen: tila, sisältötyyppi, mitat. category vaatteiden 250x250-rajaa varten.
 * Palauttaa ongelmat samassa muodossa kuin validateItem.
 */
export function validateImageResponse({ status, contentType, bytes, redirected }, category) {
  const out = [];
  if (status !== 200) return [{ taso: "virhe", tyyppi: `image_status_${status}`, viesti: "" }];
  if (redirected) out.push({ taso: "varoitus", tyyppi: "image_uudelleenohjaus", viesti: "" });
  if (!/^image\//.test(contentType || "")) out.push({ taso: "virhe", tyyppi: "image_ei_kuva", viesti: contentType || "" });
  const koko = bytes ? imageSize(bytes) : null;
  if (!koko) out.push({ taso: "varoitus", tyyppi: "image_mitat_tuntemattomat", viesti: "" });
  else {
    const min = isApparel(category) ? 250 : 100;
    if (koko.width < min || koko.height < min) out.push({ taso: "virhe", tyyppi: "image_liian_pieni", viesti: `${koko.width}x${koko.height}` });
    else if (koko.width < 500 || koko.height < 500) out.push({ taso: "varoitus", tyyppi: "image_alle_500_2027", viesti: `${koko.width}x${koko.height}` });
  }
  return out;
}

/**
 * Tarkistaa tuotesivun vastauksen: 200 ilman ohjausta, canonical = syötteen link, JSON-LD-hinta = syötteen hinta.
 */
export function validateLandingPage({ status, location, html }, { link, price }) {
  if (status >= 300 && status < 400) return [{ taso: "virhe", tyyppi: "link_uudelleenohjaus", viesti: location || "" }];
  if (status !== 200) return [{ taso: "virhe", tyyppi: `link_status_${status}`, viesti: link }];
  const out = [];
  const canonical = (html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/) || [])[1];
  if (!canonical) out.push({ taso: "varoitus", tyyppi: "link_canonical_puuttuu", viesti: link });
  else if (canonical !== link) out.push({ taso: "virhe", tyyppi: "link_canonical_eri", viesti: canonical });
  const sivuHinnat = [...html.matchAll(/"price"\s*:\s*"?(\d+(?:\.\d+)?)"?/g)].map((m) => Number(m[1]));
  if (!sivuHinnat.length) out.push({ taso: "varoitus", tyyppi: "link_sivulla_ei_hintaa", viesti: link });
  else if (!Number.isNaN(price) && !sivuHinnat.some((h) => Math.abs(h - price) < 0.005)) out.push({ taso: "virhe", tyyppi: "link_hinta_eri_kuin_sivulla", viesti: `${sivuHinnat[0]} != ${price}` });
  if (/<title>[^<]*(?:404|Sivua ei löytynyt|Tuotetta ei löytynyt)/i.test(html)) out.push({ taso: "virhe", tyyppi: "link_soft_404", viesti: link });
  return out;
}
