// GENEROITU: node scripts/generoi-printify-sync.mjs (lähde supabase/functions/_shared/printify-sync.ts). Älä muokkaa käsin.
/* eslint-disable */
const PRINTIFY_API = "https://api.printify.com/v1";
function mapToCategory(text) {
  const t = (text || "").toLowerCase();
  if (t.includes("ornament") || t.includes("koriste") || t.includes("decoration") || t.includes("christmas ornament")) return "koristeet";
  if (t.includes("long sleeve") || t.includes("pitk\xE4hihainen") || t.includes("pitkahihainen")) return "pitkahihaiset";
  if (t.includes("hoodie") || t.includes("hooded") || t.includes("sweatshirt") || t.includes("huppari")) return "hupparit";
  if (t.includes("t-shirt") || t.includes("tee") || t.includes("t-paita")) return "t-paidat";
  if (t.includes("mug") || t.includes("cup") || t.includes("tumbler") || t.includes("kahvikuppi") || t.includes("kahvimuki") || t.includes("muki")) return "mukit";
  if (t.includes("sticker") || t.includes("decal") || t.includes("tarra")) return "tarrat";
  if (t.includes("onesie") || t.includes("bodysuit") || t.includes("body") || t.includes("baby")) return "bodyt";
  if (t.includes("blanket") || t.includes("peitto") || t.includes("fleece")) return "peitot";
  if (t.includes("beanie") || t.includes("pipo") || t.includes("hat") || t.includes("cap")) return "pipot";
  if (t.includes("bag") || t.includes("tote") || t.includes("laukku") || t.includes("backpack")) return "laukut";
  if (t.includes("poster") || t.includes("canvas") || t.includes("wall art") || t.includes("sein\xE4taulu") || t.includes("seinataulu") || t.includes("taulu")) return "seinataulut";
  return null;
}
function overrideCategory(title, currentCategory) {
  const t = (title || "").toLowerCase();
  if (t.includes("pitk\xE4hihainen") || t.includes("pitkahihainen") || t.includes("long sleeve")) return "pitkahihaiset";
  if (t.includes("koriste") || t.includes("ornament")) return "koristeet";
  return currentCategory;
}
function slugify(text) {
  return (text || "").toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/å/g, "a").replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}
const COLOR_TRANSLATIONS = {
  "White": "Valkoinen",
  "Black": "Musta",
  "Red": "Punainen",
  "Blue": "Sininen",
  "Navy": "Tummansininen",
  "Navy Blazer": "Tummansininen",
  "Royal Blue": "Tummansininen",
  "Light Blue": "Vaaleansininen",
  "Sky Blue": "Taivaansininen",
  "Baby Blue": "Vaaleansininen",
  "Green": "Vihre\xE4",
  "Forest Green": "Mets\xE4nvihre\xE4",
  "Dark Green": "Tummanvihre\xE4",
  "Olive": "Oliivi",
  "Lime": "Limenvihre\xE4",
  "Kelly Green": "Kirkasvihre\xE4",
  "Yellow": "Keltainen",
  "Gold": "Kulta",
  "Orange": "Oranssi",
  "Pink": "Pinkki",
  "Light Pink": "Vaaleanpinkki",
  "Hot Pink": "Pinkki",
  "Purple": "Violetti",
  "Maroon": "Viininpunainen",
  "Burgundy": "Viininpunainen",
  "Brown": "Ruskea",
  "Tan": "Hiekanruskea",
  "Beige": "Beige",
  "Khaki": "Khaki",
  "Gray": "Harmaa",
  "Grey": "Harmaa",
  "Dark Grey": "Tummanharmaa",
  "Dark Gray": "Tummanharmaa",
  "Light Gray": "Vaaleanharmaa",
  "Light Grey": "Vaaleanharmaa",
  "Charcoal": "Antrasiitti",
  "Heather Grey": "Meleerattu harmaa",
  "Dark Heather": "Tummanharmaa",
  "Sport Grey": "Vaaleanharmaa",
  "Ash": "Vaaleanharmaa",
  "Silver": "Hopea",
  "Cream": "Kerma",
  "Ivory": "Norsunluu",
  "Teal": "Sinivihre\xE4",
  "Cyan": "Syaani",
  "Aqua": "Akvamariini",
  "Coral": "Koralli",
  "Salmon": "Lohenpunainen",
  "Peach": "Persikka",
  "Lavender": "Laventeli",
  "Lilac": "Lila",
  "Magenta": "Magenta",
  "Indigo": "Tummansininen",
  "Slate": "Harmaa",
  "Charcoal Heather": "Tummanharmaa",
  "Heather Red": "Meleerattu punainen",
  "Heather Navy": "Meleerattu tummansininen",
  "Heather Blue": "Meleerattu sininen",
  "Heather Green": "Meleerattu vihre\xE4",
  "Heather Purple": "Meleerattu violetti",
  "Heather Pink": "Meleerattu pinkki",
  "Dark Red": "Tummanpunainen",
  "Cardinal Red": "Kardinaalinapunainen",
  "Irish Green": "Irlanninvihre\xE4",
  "Military Green": "Armeijanvihre\xE4",
  "Sand": "Hiekka",
  "Natural": "Luonnonvalkoinen",
  "Sunset": "Oranssi",
  "Sapphire": "Tummansininen",
  "Cornsilk": "Keltainen",
  "True Royal": "Tummansininen",
  "Leaf": "Vihre\xE4",
  "Autumn": "Syksy",
  "Berry": "Marja",
  "Heliconia": "Pinkki",
  "Tropical Blue": "Vaaleansininen",
  "Ash Grey": "Vaaleanharmaa",
  "Ice Grey": "Vaaleanharmaa",
  "Daisy": "Keltainen",
  "Safety Green": "Turvavihre\xE4",
  "Safety Orange": "Turvaoranssi",
  "Antique Cherry Red": "Tummanpunainen",
  "Antique Sapphire": "Tummansininen",
  "Sapphire Blue": "Tummansininen",
  "Turf Green": "Vihre\xE4",
  "Irish Cream": "Kerma",
  "White Fleck": "Valkopilkullinen",
  "Black Fleck": "Mustapilkullinen",
  "Midnight Navy": "Tummansininen",
  "Oxford Navy": "Tummansininen",
  "Jet Black": "Pikimusta",
  "Royal": "Tummansininen",
  "Heather Midnight Navy": "Meleerattu tummansininen",
  "Mustard": "Sinappi",
  "Rust": "Ruoste",
  "Wine": "Viini",
  "Storm": "Harmaa",
  "Mint": "Minttu",
  "Dusty Rose": "Vanha roosa",
  "Mauve": "Vaaleanvioletti",
  "Plum": "Luumu",
  "Dark Chocolate": "Tumma suklaa",
  "Chocolate": "Suklaa",
  "Charcoal Grey": "Tummanharmaa",
  "Dark Charcoal": "Tummanharmaa",
  "Banana": "Keltainen",
  "Green Camo": "Camo vihre\xE4",
  "Key Lime": "Limenvihre\xE4",
  "Orchid": "Vaaleanvioletti",
  "Safety Pink": "Pinkki",
  "Stone": "Harmaa",
  "Turquoise": "Turkoosi",
  "Granite": "Harmaa",
  "Graphite": "Tummanharmaa"
};
function translateColor(color) {
  const trimmed = (color || "").trim();
  if (!trimmed) return trimmed;
  if (COLOR_TRANSLATIONS[trimmed]) return COLOR_TRANSLATIONS[trimmed];
  for (const [en, fi] of Object.entries(COLOR_TRANSLATIONS)) {
    if (en.toLowerCase() === trimmed.toLowerCase()) return fi;
  }
  const lower = trimmed.toLowerCase();
  if (lower.includes("heather")) {
    const rest = trimmed.replace(/heather\s*/i, "").trim();
    if (!rest) return "Meleerattu harmaa";
    return "Meleerattu " + translateColor(rest).toLowerCase();
  }
  if (lower.includes("dark ")) return "Tumma " + translateColor(trimmed.replace(/dark\s*/i, "").trim()).toLowerCase();
  if (lower.includes("light ")) return "Vaalea " + translateColor(trimmed.replace(/light\s*/i, "").trim()).toLowerCase();
  return trimmed;
}
const SIZE_VALUES = /* @__PURE__ */ new Set([
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "XXL",
  "XXXL",
  "6XL",
  "0-3M",
  "3-6M",
  "6-12M",
  "12-18M",
  "18-24M",
  "NB",
  "NB (0-3M)",
  "6M",
  "12M",
  "18M",
  "24M",
  "2T",
  "3T",
  "4T",
  "5T",
  "11oz",
  "15oz",
  "20oz",
  "One size",
  "ONE SIZE",
  "Round",
  "Square",
  "Transparent"
]);
function isSizeOrDimension(val) {
  if (SIZE_VALUES.has(val)) return true;
  if (/^\d+oz$/.test(val)) return true;
  if (/^\d+-\d+[A-Z]$/.test(val)) return true;
  if (/^\d+[\."']/.test(val) || /\d+"\s*[x×]\s*\d+"/.test(val)) return true;
  if (/^\d+"\s*$/.test(val)) return true;
  return false;
}
function getCreds() {
  const apiKey = Deno.env.get("PRINTIFY_API_KEY");
  const shopId = Deno.env.get("PRINTIFY_SHOP_ID");
  if (!apiKey || !shopId) {
    throw new Error("Missing Printify credentials (PRINTIFY_API_KEY / PRINTIFY_SHOP_ID)");
  }
  return { apiKey, shopId };
}
async function fetchAllPrintifyProducts() {
  const { apiKey, shopId } = getCreds();
  const all = [];
  let page = 1;
  while (true) {
    const url = `${PRINTIFY_API}/shops/${shopId}/products.json?page=${page}&limit=50`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[printify-sync] Printify API error on page ${page}: HTTP ${res.status} \u2014 ${body}`);
      if (res.status === 401) throw new Error(`Printify API returned 401 Unauthorized \u2014 tarkista PRINTIFY_API_KEY Supabase-secreteiss\xE4. Body: ${body}`);
      if (res.status === 403) throw new Error(`Printify API returned 403 Forbidden \u2014 token ei oikeuksia shopiin ${shopId}. Body: ${body}`);
      if (res.status === 429) throw new Error(`Printify API returned 429 Too Many Requests \u2014 rate limit ylitetty. Yrit\xE4 my\xF6hemmin uudelleen.`);
      throw new Error(`Printify API returned HTTP ${res.status}. Body: ${body}`);
    }
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error(`[printify-sync] JSON parse failed on page ${page}:`, text.slice(0, 200));
      break;
    }
    const products = Array.isArray(data) ? data : data.data || data.products || [];
    if (!products.length) break;
    all.push(...products);
    const lastPage = data.last_page || data.total_pages;
    if (lastPage && page >= lastPage) break;
    if (products.length < 50) break;
    page++;
  }
  console.log(`[printify-sync] Fetched ${all.length} products from Printify (${page} page(s))`);
  return all;
}
async function fetchPrintifyProductById(printifyProductId) {
  const { apiKey, shopId } = getCreds();
  const url = `${PRINTIFY_API}/shops/${shopId}/products/${printifyProductId}.json`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[printify-sync] fetchPrintifyProductById(${printifyProductId}) failed: HTTP ${res.status} \u2014 ${body}`);
    return null;
  }
  return await res.json();
}
const KATEGORIAN_POHJAHINNAT = {
  "t-paidat": 34.9,
  "hupparit": 64.9,
  "pitkahihaiset": 39.9,
  "bodyt": 29.9,
  "mukit": 39.9,
  "pipot": 32.9,
  "laukut": 32.9,
  "seinataulut": 49.9,
  "peitot": 69.9,
  "koristeet": 24.9,
  "tarrat": 7.9
};
const KIINTEA_POHJAHINTA = /* @__PURE__ */ new Set(["t-paidat", "hupparit", "pitkahihaiset", "bodyt"]);
function buildProductRow(p, existingSlugs = []) {
  const productTitle = p.title || "";
  let category = mapToCategory(productTitle);
  if (!category && p.tags) for (const tag of p.tags) {
    category = mapToCategory(tag);
    if (category) break;
  }
  if (!category && p.description) category = mapToCategory(p.description);
  if (!category) {
    const desc = JSON.stringify(p).toLowerCase();
    if (desc.includes("ornament") || desc.includes("koriste")) category = "koristeet";
    else if (desc.includes("long sleeve")) category = "pitkahihaiset";
    else if (desc.includes("hoodie") || desc.includes("hooded")) category = "hupparit";
    else if (desc.includes("t-shirt") || desc.includes("tee") || desc.includes("unisex")) category = "t-paidat";
    else if (desc.includes("mug")) category = "mukit";
    else if (desc.includes("sticker")) category = "tarrat";
    else if (desc.includes("onesie") || desc.includes("bodysuit")) category = "bodyt";
    else if (desc.includes("blanket") || desc.includes("fleece")) category = "peitot";
    else if (desc.includes("beanie")) category = "pipot";
    else if (desc.includes("tote") || desc.includes("bag")) category = "laukut";
  }
  if (!category) return null;
  category = overrideCategory(productTitle, category);
  const sizes = /* @__PURE__ */ new Set();
  const colors = /* @__PURE__ */ new Set();
  const colorVariantIds = /* @__PURE__ */ new Map();
  const variantMap = {};
  let minPrice = Infinity;
  let maxPrice = 0;
  let totalStock = 0;
  for (const variant of p.variants || []) {
    if (!variant.is_enabled) continue;
    let variantColor = null;
    let variantSize = null;
    if (variant.title) {
      const parts = variant.title.split("/").map((s) => s.trim());
      for (const part of parts) {
        if (isSizeOrDimension(part)) {
          sizes.add(part);
          variantSize = part;
        } else if (part.length > 0) {
          colors.add(part);
          if (!colorVariantIds.has(part)) colorVariantIds.set(part, []);
          colorVariantIds.get(part).push(variant.id);
          variantColor = part;
        }
      }
    }
    const colorKey = variantColor ? translateColor(variantColor) : "";
    const sizeKey = variantSize || "";
    const key = `${colorKey}|${sizeKey}`;
    if (!(key in variantMap)) variantMap[key] = variant.id;
    const price = variant.price / 100;
    if (price < minPrice) minPrice = price;
    if (price > maxPrice) maxPrice = price;
    totalStock += variant.quantity !== void 0 ? variant.quantity : 99;
  }
  if (minPrice === Infinity) minPrice = 29.95;
  if (category in KATEGORIAN_POHJAHINNAT) {
    minPrice = KIINTEA_POHJAHINTA.has(category) ? KATEGORIAN_POHJAHINNAT[category] : Math.max(minPrice, KATEGORIAN_POHJAHINNAT[category]);
  }
  const variantImages = {};
  const cameraLabelOf = (src) => {
    try {
      return (new URL(src).searchParams.get("camera_label") || "").toLowerCase();
    } catch {
      return String(src).toLowerCase();
    }
  };
  const isPersonMockup = (src) => /person/.test(cameraLabelOf(src));
  const imageRank = (src) => {
    const c = cameraLabelOf(src);
    if (c === "front") return 0;
    if (c.includes("folded") || c.includes("size")) return 3;
    return 1;
  };
  let candidateImages = (p.images || []).filter((img) => img.src && !isPersonMockup(img.src));
  if (candidateImages.length === 0) candidateImages = (p.images || []).filter((img) => img.src);
  const allImagesSorted = candidateImages.sort((a, b) => {
    const ra = imageRank(a.src), rb = imageRank(b.src);
    if (ra !== rb) return ra - rb;
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;
    return (a.position || 0) - (b.position || 0);
  });
  const maxImagesPerColor = category === "hupparit" ? 3 : 4;
  for (const color of colors) {
    const varIds = colorVariantIds.get(color) || [];
    const colorImages = [];
    const usedSrcsForColor = /* @__PURE__ */ new Set();
    const usedCameraLabels = /* @__PURE__ */ new Set();
    for (const img of allImagesSorted) {
      if (colorImages.length >= maxImagesPerColor) break;
      const imgVarIds = img.variant_ids || [];
      if (imgVarIds.length === 0 || imgVarIds.some((vid) => varIds.includes(vid))) {
        if (!usedSrcsForColor.has(img.src)) {
          let cameraLabel = img.src;
          try {
            cameraLabel = new URL(img.src).searchParams.get("camera_label") || img.src;
          } catch {
          }
          if (usedCameraLabels.has(cameraLabel)) continue;
          usedCameraLabels.add(cameraLabel);
          colorImages.push(img.src);
          usedSrcsForColor.add(img.src);
        }
      }
    }
    if (colorImages.length === 0) {
      for (const img of allImagesSorted) {
        if (colorImages.length >= maxImagesPerColor) break;
        if (!usedSrcsForColor.has(img.src)) {
          colorImages.push(img.src);
          usedSrcsForColor.add(img.src);
        }
      }
    }
    if (colorImages.length > 0) variantImages[color] = colorImages;
  }
  const defaultImages = [];
  const usedSrcs = /* @__PURE__ */ new Set();
  for (const img of allImagesSorted) {
    if (defaultImages.length >= maxImagesPerColor) break;
    if (!usedSrcs.has(img.src)) {
      defaultImages.push(img.src);
      usedSrcs.add(img.src);
    }
  }
  let defaultColor = null;
  if (allImagesSorted.length > 0) {
    const firstImg = allImagesSorted[0];
    const firstVarIds = firstImg.variant_ids || [];
    for (const [color, varIds] of colorVariantIds.entries()) {
      if (firstVarIds.some((vid) => varIds.includes(vid))) {
        defaultColor = color;
        break;
      }
    }
  }
  const translatedVariantImages = {};
  for (const [color, imgs] of Object.entries(variantImages)) {
    const translated = translateColor(color);
    if (translatedVariantImages[translated]) {
      for (const img of imgs) {
        if (!translatedVariantImages[translated].includes(img)) translatedVariantImages[translated].push(img);
      }
      translatedVariantImages[translated] = translatedVariantImages[translated].slice(0, maxImagesPerColor);
    } else {
      translatedVariantImages[translated] = imgs;
    }
  }
  const translatedColors = [...new Set(Array.from(colors).map((c) => translateColor(c)))];
  const translatedDefaultColor = defaultColor ? translateColor(defaultColor) : null;
  const variants = {};
  if (sizes.size > 0) variants.sizes = Array.from(sizes);
  if (translatedColors.length > 0) variants.colors = translatedColors;
  if (Object.keys(translatedVariantImages).length > 0) variants.variant_images = translatedVariantImages;
  if (translatedDefaultColor) variants.default_color = translatedDefaultColor;
  if (Object.keys(variantMap).length > 0) variants.variant_map = variantMap;
  let cleanDesc = (p.description || "").replace(/<[^>]*>/g, "").trim();
  const SKIP_TAGS = /* @__PURE__ */ new Set(["Kaupunkipaidat", "Kaupunkituotteet", "t-paita", "huppari", "muki", "tpaita"]);
  if (Array.isArray(p.tags) && p.tags.includes("Kaupunkipaidat")) {
    const cityTag = p.tags.find((t) => !SKIP_TAGS.has(t));
    if (cityTag) cleanDesc = cleanDesc + ` #kaupunki:${cityTag}`;
  }
  let productSlug = slugify(productTitle);
  if (existingSlugs.includes(productSlug)) {
    productSlug = productSlug + "-" + (p.id || "").slice(-6);
  }
  return {
    name: productTitle,
    slug: productSlug,
    category,
    humor_type: "yleinen",
    price: minPrice,
    // Floor stock at 4 so customers can buy multiple units and the
    // "vain X kpl jäljellä" urgency banner stays believable / non-blocking.
    stock: Math.max(4, Math.min(totalStock, 999)),
    description: cleanDesc || `Hauska tuote Huumorikaupasta!`,
    images: defaultImages,
    variants,
    printify_product_id: p.id,
    supplier: "printify",
    origin_country: "EU",
    // Printify products are printed in the EU
    is_featured: false,
    is_new: false,
    is_gift_idea: false
  };
}
async function syncPrintifyCatalog(supabase, mode = "upsert") {
  const all = await fetchAllPrintifyProducts();
  const built = [];
  const skipped = [];
  for (const p of all) {
    const row = buildProductRow(p, built.map((b) => b.slug));
    if (!row) skipped.push({ title: p.title || "(untitled)", reason: "no category match" });
    else built.push(row);
  }
  if (built.length === 0) return { total_fetched: all.length, products_synced: 0, skipped };
  if (mode === "replace") {
    const { error: deleteError } = await supabase.from("products").delete().eq("supplier", "printify");
    if (deleteError) console.error("Delete error:", deleteError);
    const { data: inserted2, error: insertError } = await supabase.from("products").insert(built).select("id");
    if (insertError) throw new Error(insertError.message);
    return { total_fetched: all.length, products_synced: inserted2?.length || 0, skipped };
  }
  const existingByPid = /* @__PURE__ */ new Map();
  const existingBySlug = /* @__PURE__ */ new Map();
  let page = 0;
  const PAGE_SIZE = 1e3;
  while (true) {
    const { data: rows, error } = await supabase.from("products").select("id, printify_product_id, slug").range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) {
      console.error("Existing products fetch error:", error.message);
      break;
    }
    if (!rows || rows.length === 0) break;
    for (const r of rows) {
      if (r.printify_product_id) existingByPid.set(r.printify_product_id, r.id);
      if (r.slug) existingBySlug.set(r.slug, r.id);
    }
    if (rows.length < PAGE_SIZE) break;
    page++;
  }
  let updated = 0;
  let inserted = 0;
  for (const row of built) {
    const { is_featured: _f, is_new: _n, is_gift_idea: _g, ...rest } = row;
    const existsId = existingByPid.get(row.printify_product_id) || existingBySlug.get(row.slug);
    if (existsId) {
      const { slug: _slug, ...updateFields } = rest;
      const { error } = await supabase.from("products").update(updateFields).eq("id", existsId);
      if (error) console.error(`Update failed for ${row.name}:`, error.message);
      else updated++;
    } else {
      const { error } = await supabase.from("products").insert(rest);
      if (error) console.error(`Insert failed for ${row.name}:`, error.message);
      else inserted++;
    }
  }
  return { total_fetched: all.length, products_synced: updated + inserted, skipped };
}
async function upsertSingleByPrintifyId(supabase, row) {
  const { is_featured: _f, is_new: _n, is_gift_idea: _g, ...rest } = row;
  const { data: existing } = await supabase.from("products").select("id").or(`printify_product_id.eq.${row.printify_product_id},slug.eq.${row.slug}`).maybeSingle();
  if (existing?.id) {
    const { slug: _slug, ...updateFields } = rest;
    const { error } = await supabase.from("products").update(updateFields).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("products").insert(rest);
    if (error) throw new Error(error.message);
  }
}
async function syncSinglePrintifyProduct(supabase, printifyProductId) {
  const p = await fetchPrintifyProductById(printifyProductId);
  if (!p) return null;
  const row = buildProductRow(p);
  if (!row) return null;
  try {
    await upsertSingleByPrintifyId(supabase, row);
  } catch (err) {
    console.error("Single product upsert failed:", err);
    return null;
  }
  return row;
}
async function syncPrintifyProductByName(supabase, productName) {
  const all = await fetchAllPrintifyProducts();
  const target = (productName || "").trim().toLowerCase();
  const match = all.find((p) => (p.title || "").trim().toLowerCase() === target);
  if (!match) return null;
  const row = buildProductRow(match);
  if (!row) return null;
  try {
    await upsertSingleByPrintifyId(supabase, row);
  } catch (err) {
    console.error("Single product upsert by name failed:", err);
    return null;
  }
  return row;
}
export {
  KATEGORIAN_POHJAHINNAT,
  KIINTEA_POHJAHINTA,
  buildProductRow,
  fetchAllPrintifyProducts,
  fetchPrintifyProductById,
  syncPrintifyCatalog,
  syncPrintifyProductByName,
  syncSinglePrintifyProduct
};
