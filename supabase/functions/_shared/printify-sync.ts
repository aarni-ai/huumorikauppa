// Shared Printify catalog sync logic.
//
// Used by:
//   - sync-printify (admin trigger, full catalog "replace" mode)
//   - auto-sync-printify (cron, daily "upsert" mode)
//   - process-order (lazy "upsert" of a single product when missing
//     printify_product_id / variant_map at order time)
//
// IMPORTANT: this module must NOT enforce admin auth. Auth lives in the
// HTTP handler that calls it. The cron + lazy-sync paths run as the
// service role.

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

const PRINTIFY_API = "https://api.printify.com/v1";

// ---------- Category mapping ----------

function mapToCategory(text: string): string | null {
  const t = (text || "").toLowerCase();
  if (t.includes('ornament') || t.includes('koriste') || t.includes('decoration') || t.includes('christmas ornament')) return 'koristeet';
  if (t.includes('long sleeve') || t.includes('pitkähihainen') || t.includes('pitkahihainen')) return 'pitkahihaiset';
  if (t.includes('hoodie') || t.includes('hooded') || t.includes('sweatshirt') || t.includes('huppari')) return 'hupparit';
  if (t.includes('t-shirt') || t.includes('tee') || t.includes('t-paita')) return 't-paidat';
  if (t.includes('mug') || t.includes('cup') || t.includes('tumbler') || t.includes('kahvikuppi')) return 'mukit';
  if (t.includes('sticker') || t.includes('decal') || t.includes('tarra')) return 'tarrat';
  if (t.includes('onesie') || t.includes('bodysuit') || t.includes('body') || t.includes('baby')) return 'bodyt';
  if (t.includes('blanket') || t.includes('peitto') || t.includes('fleece')) return 'peitot';
  if (t.includes('beanie') || t.includes('pipo') || t.includes('hat') || t.includes('cap')) return 'pipot';
  if (t.includes('bag') || t.includes('tote') || t.includes('laukku') || t.includes('backpack')) return 'laukut';
  if (t.includes('poster') || t.includes('canvas') || t.includes('wall art') || t.includes('seinätaulu') || t.includes('seinataulu') || t.includes('taulu')) return 'seinataulut';
  return null;
}

function overrideCategory(title: string, currentCategory: string): string {
  const t = (title || "").toLowerCase();
  if (t.includes('pitkähihainen') || t.includes('pitkahihainen') || t.includes('long sleeve')) return 'pitkahihaiset';
  if (t.includes('koriste') || t.includes('ornament')) return 'koristeet';
  return currentCategory;
}

function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/å/g, 'a')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ---------- Color translation ----------

const COLOR_TRANSLATIONS: Record<string, string> = {
  "White": "Valkoinen", "Black": "Musta", "Red": "Punainen", "Blue": "Sininen",
  "Navy": "Tummansininen", "Navy Blazer": "Tummansininen", "Royal Blue": "Tummansininen",
  "Light Blue": "Vaaleansininen", "Sky Blue": "Taivaansininen", "Baby Blue": "Vaaleansininen",
  "Green": "Vihreä", "Forest Green": "Metsänvihreä", "Dark Green": "Tummanvihreä",
  "Olive": "Oliivi", "Lime": "Limenvihreä", "Kelly Green": "Kirkasvihreä",
  "Yellow": "Keltainen", "Gold": "Kulta", "Orange": "Oranssi",
  "Pink": "Pinkki", "Light Pink": "Vaaleanpinkki", "Hot Pink": "Pinkki",
  "Purple": "Violetti", "Maroon": "Viininpunainen", "Burgundy": "Viininpunainen",
  "Brown": "Ruskea", "Tan": "Hiekanruskea", "Beige": "Beige", "Khaki": "Khaki",
  "Gray": "Harmaa", "Grey": "Harmaa", "Dark Grey": "Tummanharmaa", "Dark Gray": "Tummanharmaa",
  "Light Gray": "Vaaleanharmaa", "Light Grey": "Vaaleanharmaa", "Charcoal": "Antrasiitti",
  "Heather Grey": "Meleerattu harmaa", "Dark Heather": "Tummanharmaa",
  "Sport Grey": "Vaaleanharmaa", "Ash": "Vaaleanharmaa",
  "Silver": "Hopea", "Cream": "Kerma", "Ivory": "Norsunluu",
  "Teal": "Sinivihreä", "Cyan": "Syaani", "Aqua": "Akvamariini",
  "Coral": "Koralli", "Salmon": "Lohenpunainen", "Peach": "Persikka",
  "Lavender": "Laventeli", "Lilac": "Lila", "Magenta": "Magenta",
  "Indigo": "Tummansininen", "Slate": "Harmaa", "Charcoal Heather": "Tummanharmaa",
  "Heather Red": "Meleerattu punainen", "Heather Navy": "Meleerattu tummansininen",
  "Heather Blue": "Meleerattu sininen", "Heather Green": "Meleerattu vihreä",
  "Heather Purple": "Meleerattu violetti", "Heather Pink": "Meleerattu pinkki",
  "Dark Red": "Tummanpunainen", "Cardinal Red": "Kardinaalinapunainen",
  "Irish Green": "Irlanninvihreä", "Military Green": "Armeijanvihreä",
  "Sand": "Hiekka", "Natural": "Luonnonvalkoinen",
  "Sunset": "Oranssi", "Sapphire": "Tummansininen", "Cornsilk": "Keltainen",
  "True Royal": "Tummansininen", "Leaf": "Vihreä", "Autumn": "Syksy",
  "Berry": "Marja", "Heliconia": "Pinkki", "Tropical Blue": "Vaaleansininen",
  "Ash Grey": "Vaaleanharmaa", "Ice Grey": "Vaaleanharmaa", "Daisy": "Keltainen",
  "Safety Green": "Turvavihreä", "Safety Orange": "Turvaoranssi",
  "Antique Cherry Red": "Tummanpunainen", "Antique Sapphire": "Tummansininen",
  "Sapphire Blue": "Tummansininen",
  "Turf Green": "Vihreä", "Irish Cream": "Kerma",
  "White Fleck": "Valkopilkullinen", "Black Fleck": "Mustapilkullinen",
  "Midnight Navy": "Tummansininen", "Oxford Navy": "Tummansininen",
  "Jet Black": "Pikimusta", "Royal": "Tummansininen",
  "Heather Midnight Navy": "Meleerattu tummansininen",
  "Mustard": "Sinappi", "Rust": "Ruoste", "Wine": "Viini",
  "Storm": "Harmaa", "Mint": "Minttu", "Dusty Rose": "Vanha roosa",
  "Mauve": "Vaaleanvioletti", "Plum": "Luumu",
  "Dark Chocolate": "Tumma suklaa", "Chocolate": "Suklaa",
  "Charcoal Grey": "Tummanharmaa", "Dark Charcoal": "Tummanharmaa",
  "Banana": "Keltainen", "Green Camo": "Camo vihreä", "Key Lime": "Limenvihreä",
  "Orchid": "Vaaleanvioletti", "Safety Pink": "Pinkki", "Stone": "Harmaa",
  "Turquoise": "Turkoosi", "Granite": "Harmaa", "Graphite": "Tummanharmaa",
};

function translateColor(color: string): string {
  const trimmed = (color || "").trim();
  if (!trimmed) return trimmed;
  if (COLOR_TRANSLATIONS[trimmed]) return COLOR_TRANSLATIONS[trimmed];
  for (const [en, fi] of Object.entries(COLOR_TRANSLATIONS)) {
    if (en.toLowerCase() === trimmed.toLowerCase()) return fi;
  }
  const lower = trimmed.toLowerCase();
  if (lower.includes('heather')) {
    const rest = trimmed.replace(/heather\s*/i, '').trim();
    if (!rest) return 'Meleerattu harmaa';
    return 'Meleerattu ' + translateColor(rest).toLowerCase();
  }
  if (lower.includes('dark ')) return 'Tumma ' + translateColor(trimmed.replace(/dark\s*/i, '').trim()).toLowerCase();
  if (lower.includes('light ')) return 'Vaalea ' + translateColor(trimmed.replace(/light\s*/i, '').trim()).toLowerCase();
  return trimmed;
}

const SIZE_VALUES = new Set([
  'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL',
  'XXL', 'XXXL', '6XL',
  '0-3M', '3-6M', '6-12M', '12-18M', '18-24M',
  'NB', 'NB (0-3M)', '6M', '12M', '18M', '24M',
  '2T', '3T', '4T', '5T',
  '11oz', '15oz', '20oz',
  'One size', 'ONE SIZE',
  'Round', 'Square', 'Transparent',
]);

function isSizeOrDimension(val: string): boolean {
  if (SIZE_VALUES.has(val)) return true;
  if (/^\d+oz$/.test(val)) return true;
  if (/^\d+-\d+[A-Z]$/.test(val)) return true;
  if (/^\d+[\."']/.test(val) || /\d+"\s*[x×]\s*\d+"/.test(val)) return true;
  if (/^\d+"\s*$/.test(val)) return true;
  return false;
}

// ---------- Printify API helpers ----------

function getCreds(): { apiKey: string; shopId: string } {
  const apiKey = Deno.env.get("PRINTIFY_API_KEY");
  const shopId = Deno.env.get("PRINTIFY_SHOP_ID");
  if (!apiKey || !shopId) {
    throw new Error("Missing Printify credentials (PRINTIFY_API_KEY / PRINTIFY_SHOP_ID)");
  }
  return { apiKey, shopId };
}

export async function fetchAllPrintifyProducts(): Promise<any[]> {
  const { apiKey, shopId } = getCreds();
  const all: any[] = [];
  let page = 1;
  while (true) {
    const url = `${PRINTIFY_API}/shops/${shopId}/products.json?page=${page}&limit=50`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { break; }
    const products = Array.isArray(data) ? data : (data.data || data.products || []);
    if (!products.length) break;
    all.push(...products);
    const lastPage = data.last_page || data.total_pages;
    if (lastPage && page >= lastPage) break;
    if (products.length < 50) break;
    page++;
  }
  return all;
}

export async function fetchPrintifyProductById(printifyProductId: string): Promise<any | null> {
  const { apiKey, shopId } = getCreds();
  const url = `${PRINTIFY_API}/shops/${shopId}/products/${printifyProductId}.json`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) return null;
  return await res.json();
}

// ---------- Build DB row from Printify product ----------

export interface BuiltProductRow {
  name: string;
  slug: string;
  category: string;
  humor_type: 'yleinen';
  price: number;
  stock: number;
  description: string;
  images: string[];
  variants: Record<string, any>;
  printify_product_id: string;
  is_featured: boolean;
  is_new: boolean;
  is_gift_idea: boolean;
}

export function buildProductRow(p: any, existingSlugs: string[] = []): BuiltProductRow | null {
  const productTitle = p.title || '';
  let category = mapToCategory(productTitle);
  if (!category && p.tags) for (const tag of p.tags) { category = mapToCategory(tag); if (category) break; }
  if (!category && p.description) category = mapToCategory(p.description);
  if (!category) {
    const desc = JSON.stringify(p).toLowerCase();
    if (desc.includes('ornament') || desc.includes('koriste')) category = 'koristeet';
    else if (desc.includes('long sleeve')) category = 'pitkahihaiset';
    else if (desc.includes('hoodie') || desc.includes('hooded')) category = 'hupparit';
    else if (desc.includes('t-shirt') || desc.includes('tee') || desc.includes('unisex')) category = 't-paidat';
    else if (desc.includes('mug')) category = 'mukit';
    else if (desc.includes('sticker')) category = 'tarrat';
    else if (desc.includes('onesie') || desc.includes('bodysuit')) category = 'bodyt';
    else if (desc.includes('blanket') || desc.includes('fleece')) category = 'peitot';
    else if (desc.includes('beanie')) category = 'pipot';
    else if (desc.includes('tote') || desc.includes('bag')) category = 'laukut';
  }
  if (!category) return null;
  category = overrideCategory(productTitle, category);

  const sizes = new Set<string>();
  const colors = new Set<string>();
  const colorVariantIds = new Map<string, number[]>();
  const variantMap: Record<string, number> = {};
  let minPrice = Infinity;
  let maxPrice = 0;
  let totalStock = 0;

  for (const variant of (p.variants || [])) {
    if (!variant.is_enabled) continue;
    let variantColor: string | null = null;
    let variantSize: string | null = null;
    if (variant.title) {
      const parts = variant.title.split('/').map((s: string) => s.trim());
      for (const part of parts) {
        if (isSizeOrDimension(part)) { sizes.add(part); variantSize = part; }
        else if (part.length > 0) {
          colors.add(part);
          if (!colorVariantIds.has(part)) colorVariantIds.set(part, []);
          colorVariantIds.get(part)!.push(variant.id);
          variantColor = part;
        }
      }
    }
    const colorKey = variantColor ? translateColor(variantColor) : '';
    const sizeKey = variantSize || '';
    const key = `${colorKey}|${sizeKey}`;
    if (!(key in variantMap)) variantMap[key] = variant.id;
    const price = variant.price / 100;
    if (price < minPrice) minPrice = price;
    if (price > maxPrice) maxPrice = price;
    totalStock += (variant.quantity !== undefined ? variant.quantity : 99);
  }

  if (minPrice === Infinity) minPrice = 29.95;
  if (category === 't-paidat') minPrice = 24.90;
  if (category === 'hupparit') minPrice = 49.90;
  if (category === 'pitkahihaiset') minPrice = 39.90;
  if (category === 'bodyt') minPrice = 24.90;

  const variantImages: Record<string, string[]> = {};
  const allImagesSorted = (p.images || [])
    .filter((img: any) => img.src)
    .sort((a: any, b: any) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return (a.position || 0) - (b.position || 0);
    });
  const maxImagesPerColor = category === 'hupparit' ? 3 : 4;

  for (const color of colors) {
    const varIds = colorVariantIds.get(color) || [];
    const colorImages: string[] = [];
    const usedSrcsForColor = new Set<string>();
    const usedCameraLabels = new Set<string>();
    for (const img of allImagesSorted) {
      if (colorImages.length >= maxImagesPerColor) break;
      const imgVarIds: number[] = img.variant_ids || [];
      if (imgVarIds.length === 0 || imgVarIds.some((vid: number) => varIds.includes(vid))) {
        if (!usedSrcsForColor.has(img.src)) {
          let cameraLabel = img.src;
          try { cameraLabel = new URL(img.src).searchParams.get('camera_label') || img.src; } catch { /* noop */ }
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

  const defaultImages: string[] = [];
  const usedSrcs = new Set<string>();
  for (const img of allImagesSorted) {
    if (defaultImages.length >= maxImagesPerColor) break;
    if (!usedSrcs.has(img.src)) { defaultImages.push(img.src); usedSrcs.add(img.src); }
  }

  let defaultColor: string | null = null;
  if (allImagesSorted.length > 0) {
    const firstImg = allImagesSorted[0];
    const firstVarIds: number[] = firstImg.variant_ids || [];
    for (const [color, varIds] of colorVariantIds.entries()) {
      if (firstVarIds.some((vid: number) => varIds.includes(vid))) { defaultColor = color; break; }
    }
  }

  const translatedVariantImages: Record<string, string[]> = {};
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
  const translatedColors = [...new Set(Array.from(colors).map(c => translateColor(c)))];
  const translatedDefaultColor = defaultColor ? translateColor(defaultColor) : null;

  const variants: Record<string, any> = {};
  if (sizes.size > 0) variants.sizes = Array.from(sizes);
  if (translatedColors.length > 0) variants.colors = translatedColors;
  if (Object.keys(translatedVariantImages).length > 0) variants.variant_images = translatedVariantImages;
  if (translatedDefaultColor) variants.default_color = translatedDefaultColor;
  if (Object.keys(variantMap).length > 0) variants.variant_map = variantMap;

  const cleanDesc = (p.description || '').replace(/<[^>]*>/g, '').trim();

  let productSlug = slugify(productTitle);
  if (existingSlugs.includes(productSlug)) {
    productSlug = productSlug + '-' + (p.id || '').slice(-6);
  }

  return {
    name: productTitle,
    slug: productSlug,
    category,
    humor_type: 'yleinen',
    price: minPrice,
    stock: Math.min(totalStock, 999),
    description: cleanDesc || `Hauska tuote Huumorikaupasta!`,
    images: defaultImages,
    variants,
    printify_product_id: p.id,
    is_featured: false,
    is_new: false,
    is_gift_idea: false,
  };
}

// ---------- Sync entrypoints ----------

/**
 * Sync the entire Printify catalog into the products table.
 *
 * mode = "replace": delete-all then insert (legacy admin behaviour, exact mirror).
 * mode = "upsert" : non-destructive — inserts new, updates existing by
 *                   printify_product_id. Preserves manually-set flags
 *                   (is_featured, is_new, is_gift_idea) and does not
 *                   change product UUIDs.
 */
export async function syncPrintifyCatalog(
  supabase: SupabaseClient,
  mode: "replace" | "upsert" = "upsert",
): Promise<{ total_fetched: number; products_synced: number; skipped: { title: string; reason: string }[] }> {
  const all = await fetchAllPrintifyProducts();
  const built: BuiltProductRow[] = [];
  const skipped: { title: string; reason: string }[] = [];
  for (const p of all) {
    const row = buildProductRow(p, built.map((b) => b.slug));
    if (!row) skipped.push({ title: p.title || '(untitled)', reason: 'no category match' });
    else built.push(row);
  }
  if (built.length === 0) return { total_fetched: all.length, products_synced: 0, skipped };

  if (mode === "replace") {
    const { error: deleteError } = await supabase
      .from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) console.error('Delete error:', deleteError);
    const { data: inserted, error: insertError } = await supabase
      .from('products').insert(built).select('id');
    if (insertError) throw new Error(insertError.message);
    return { total_fetched: all.length, products_synced: inserted?.length || 0, skipped };
  }

  // upsert mode — preserve existing rows / flags
  // Strip is_featured/is_new/is_gift_idea so we don't overwrite admin choices.
  // We split into existing (UPDATE by printify_product_id, omitting slug to
  // avoid unique-slug conflicts) and new (INSERT). This sidesteps the fact
  // that upsert with a single onConflict can't handle two unique columns.
  const printifyIds = built.map((b) => b.printify_product_id);
  const slugs = built.map((b) => b.slug);
  const { data: existingRows } = await supabase
    .from('products')
    .select('id, printify_product_id, slug')
    .or(`printify_product_id.in.(${printifyIds.join(',')}),slug.in.(${slugs.join(',')})`);
  const existingByPid = new Map<string, string>();
  const existingBySlug = new Map<string, string>();
  for (const r of existingRows || []) {
    if (r.printify_product_id) existingByPid.set(r.printify_product_id as string, r.id as string);
    if (r.slug) existingBySlug.set(r.slug as string, r.id as string);
  }

  let updated = 0;
  let inserted = 0;
  for (const row of built) {
    const { is_featured: _f, is_new: _n, is_gift_idea: _g, ...rest } = row;
    const existsId = existingByPid.get(row.printify_product_id) || existingBySlug.get(row.slug);
    if (existsId) {
      // Don't overwrite slug — keeps SEO-stable URLs and avoids unique conflicts.
      const { slug: _slug, ...updateFields } = rest;
      const { error } = await supabase.from('products').update(updateFields).eq('id', existsId);
      if (error) console.error(`Update failed for ${row.name}:`, error.message);
      else updated++;
    } else {
      const { error } = await supabase.from('products').insert(rest);
      if (error) console.error(`Insert failed for ${row.name}:`, error.message);
      else inserted++;
    }
  }
  return { total_fetched: all.length, products_synced: updated + inserted, skipped };
}

async function upsertSingleByPrintifyId(
  supabase: SupabaseClient,
  row: BuiltProductRow,
): Promise<void> {
  const { is_featured: _f, is_new: _n, is_gift_idea: _g, ...rest } = row;
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('printify_product_id', row.printify_product_id)
    .maybeSingle();
  if (existing?.id) {
    const { slug: _slug, ...updateFields } = rest;
    const { error } = await supabase.from('products').update(updateFields).eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('products').insert(rest);
    if (error) throw new Error(error.message);
  }
}

/**
 * Sync a single Printify product into the DB by its Printify product id.
 * Used by process-order for lazy-sync when printify_product_id is missing.
 */
export async function syncSinglePrintifyProduct(
  supabase: SupabaseClient,
  printifyProductId: string,
): Promise<BuiltProductRow | null> {
  const p = await fetchPrintifyProductById(printifyProductId);
  if (!p) return null;
  const row = buildProductRow(p);
  if (!row) return null;
  try { await upsertSingleByPrintifyId(supabase, row); } catch (err) {
    console.error('Single product upsert failed:', err);
    return null;
  }
  return row;
}

/**
 * Find a Printify product whose title matches the given name (case-insensitive,
 * trimmed) and sync it. Returns the freshly synced row, or null.
 */
export async function syncPrintifyProductByName(
  supabase: SupabaseClient,
  productName: string,
): Promise<BuiltProductRow | null> {
  const all = await fetchAllPrintifyProducts();
  const target = (productName || '').trim().toLowerCase();
  const match = all.find((p) => (p.title || '').trim().toLowerCase() === target);
  if (!match) return null;
  const row = buildProductRow(match);
  if (!row) return null;
  try { await upsertSingleByPrintifyId(supabase, row); } catch (err) {
    console.error('Single product upsert by name failed:', err);
    return null;
  }
  return row;
}