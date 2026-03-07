import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function mapToCategory(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes('hoodie') || t.includes('hooded') || t.includes('sweatshirt')) return 'hupparit';
  if (t.includes('t-shirt') || t.includes('tee') || t.includes('t-paita')) return 't-paidat';
  if (t.includes('mug') || t.includes('cup') || t.includes('tumbler') || t.includes('kahvikuppi')) return 'mukit';
  if (t.includes('sticker') || t.includes('decal') || t.includes('tarra')) return 'tarrat';
  if (t.includes('onesie') || t.includes('bodysuit') || t.includes('body') || t.includes('baby')) return 'bodyt';
  if (t.includes('blanket') || t.includes('peitto') || t.includes('fleece')) return 'peitot';
  if (t.includes('beanie') || t.includes('pipo') || t.includes('hat') || t.includes('cap')) return 'pipot';
  if (t.includes('bag') || t.includes('tote') || t.includes('laukku') || t.includes('backpack')) return 'laukut';
  if (t.includes('poster') || t.includes('canvas') || t.includes('wall art') || t.includes('seinätaulu') || t.includes('seinataulu') || t.includes('taulu') || t.includes('koriste')) return 'seinataulut';
  return null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/å/g, 'a')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Known Printify size values
const SIZE_VALUES = new Set([
  'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL',
  'XXL', 'XXXL', '6XL',
  '0-3M', '3-6M', '6-12M', '12-18M', '18-24M',
  '2T', '3T', '4T', '5T',
  '11oz', '15oz', '20oz',
  'One size', 'ONE SIZE',
]);

function isSize(val: string): boolean {
  return SIZE_VALUES.has(val) || /^\d+oz$/.test(val) || /^\d+-\d+[A-Z]$/.test(val);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("PRINTIFY_API_KEY");
    const shopId = Deno.env.get("PRINTIFY_SHOP_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!apiKey || !shopId) {
      return new Response(JSON.stringify({ error: "Missing Printify credentials" }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all products from Printify (handle pagination)
    let allProducts: any[] = [];
    let page = 1;
    while (true) {
      const url = `https://api.printify.com/v1/shops/${shopId}/products.json?page=${page}&limit=50`;
      console.log(`Fetching page ${page}: ${url}`);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const rawText = await res.text();
      console.log(`Response status: ${res.status}, body preview: ${rawText.slice(0, 500)}`);
      let data;
      try { data = JSON.parse(rawText); } catch { break; }
      const products = Array.isArray(data) ? data : (data.data || data.products || []);
      console.log(`Page ${page}: got ${products.length} products`);
      if (products.length === 0) break;
      allProducts = allProducts.concat(products);
      const lastPage = data.last_page || data.total_pages;
      if (lastPage && page >= lastPage) break;
      if (products.length < 50) break;
      page++;
    }

    console.log(`Total products fetched: ${allProducts.length}`);

    const dbProducts = [];
    const skipped = [];

    for (const p of allProducts) {
      const productTitle = p.title || '';
      
      // Try mapping category from title, tags, description, then full JSON
      let category = mapToCategory(productTitle);
      if (!category && p.tags) {
        for (const tag of p.tags) {
          category = mapToCategory(tag);
          if (category) break;
        }
      }
      if (!category && p.description) {
        category = mapToCategory(p.description);
      }
      if (!category) {
        const desc = JSON.stringify(p).toLowerCase();
        if (desc.includes('hoodie') || desc.includes('hooded')) category = 'hupparit';
        else if (desc.includes('t-shirt') || desc.includes('tee') || desc.includes('unisex')) category = 't-paidat';
        else if (desc.includes('mug')) category = 'mukit';
        else if (desc.includes('sticker')) category = 'tarrat';
        else if (desc.includes('onesie') || desc.includes('bodysuit')) category = 'bodyt';
        else if (desc.includes('blanket') || desc.includes('fleece')) category = 'peitot';
        else if (desc.includes('beanie')) category = 'pipot';
        else if (desc.includes('tote') || desc.includes('bag')) category = 'laukut';
      }
      
      if (!category) {
        skipped.push({ title: p.title, reason: 'no category match' });
        continue;
      }

      // Build variant data: extract sizes, colors, and map images per color
      const sizes = new Set<string>();
      const colors = new Set<string>();
      // Map: color -> variant_ids for that color
      const colorVariantIds = new Map<string, number[]>();
      let minPrice = Infinity;

      for (const variant of (p.variants || [])) {
        if (!variant.is_enabled) continue;
        
        // Parse variant title: Printify uses "Color / Size" format
        if (variant.title) {
          const parts = variant.title.split('/').map((s: string) => s.trim());
          for (const part of parts) {
            if (isSize(part)) {
              sizes.add(part);
            } else if (part.length > 0) {
              colors.add(part);
              // Track variant IDs per color
              if (!colorVariantIds.has(part)) colorVariantIds.set(part, []);
              colorVariantIds.get(part)!.push(variant.id);
            }
          }
        }
        
        const price = variant.price / 100;
        if (price < minPrice) minPrice = price;
      }

      if (minPrice === Infinity) minPrice = 29.95;

      // Build images per color from Printify mockup data
      // Printify images have variant_ids linking to which variants they show
      const variantImages: Record<string, string[]> = {};
      const allImagesSorted = (p.images || [])
        .filter((img: any) => img.src)
        .sort((a: any, b: any) => {
          if (a.is_default && !b.is_default) return -1;
          if (!a.is_default && b.is_default) return 1;
          return (a.position || 0) - (b.position || 0);
        });

      // Map images to colors via variant_ids
      for (const color of colors) {
        const varIds = colorVariantIds.get(color) || [];
        const colorImages: string[] = [];
        for (const img of allImagesSorted) {
          if (colorImages.length >= 4) break; // Max 4 images per color
          const imgVarIds: number[] = img.variant_ids || [];
          // Check if this image is associated with any variant of this color
          if (imgVarIds.some((vid: number) => varIds.includes(vid))) {
            colorImages.push(img.src);
          }
        }
        if (colorImages.length > 0) {
          variantImages[color] = colorImages;
        }
      }

      // Default images: first 4 unique images for the main display
      const defaultImages: string[] = [];
      const usedSrcs = new Set<string>();
      for (const img of allImagesSorted) {
        if (defaultImages.length >= 4) break;
        if (!usedSrcs.has(img.src)) {
          defaultImages.push(img.src);
          usedSrcs.add(img.src);
        }
      }

      // Determine default display color from the first default image
      let defaultColor: string | null = null;
      if (allImagesSorted.length > 0) {
        const firstImg = allImagesSorted[0];
        const firstVarIds: number[] = firstImg.variant_ids || [];
        for (const [color, varIds] of colorVariantIds.entries()) {
          if (firstVarIds.some((vid: number) => varIds.includes(vid))) {
            defaultColor = color;
            break;
          }
        }
      }

      const variants: Record<string, any> = {};
      if (sizes.size > 0) variants.sizes = Array.from(sizes);
      if (colors.size > 0) variants.colors = Array.from(colors);
      if (Object.keys(variantImages).length > 0) variants.variant_images = variantImages;
      if (defaultColor) variants.default_color = defaultColor;

      const cleanDesc = (p.description || '').replace(/<[^>]*>/g, '').trim();

      // Ensure unique slug using Printify product ID
      let productSlug = slugify(productTitle);
      const existingSlugs = dbProducts.map(dp => dp.slug);
      if (existingSlugs.includes(productSlug)) {
        productSlug = productSlug + '-' + (p.id || '').slice(-6);
      }

      dbProducts.push({
        name: productTitle,
        slug: productSlug,
        category,
        humor_type: 'yleinen' as const,
        price: minPrice,
        stock: 99,
        description: cleanDesc || `Hauska tuote Huumorikaupasta!`,
        images: defaultImages,
        variants,
        is_featured: false,
        is_new: false,
        is_gift_idea: false,
      });
    }

    console.log(`Mapped ${dbProducts.length} products, skipped ${skipped.length}`);
    console.log('Skipped:', JSON.stringify(skipped));

    if (dbProducts.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No products mapped to categories",
        total_fetched: allProducts.length,
        skipped,
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Delete all existing products
    const { error: deleteError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) console.error('Delete error:', deleteError);

    // Insert new products
    const { data: inserted, error: insertError } = await supabase.from('products').insert(dbProducts).select();
    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message, products_attempted: dbProducts.length }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      total_fetched: allProducts.length,
      products_synced: inserted?.length || 0,
      skipped,
      categories: [...new Set(dbProducts.map(p => p.category))],
      products: inserted?.map(p => ({ name: p.name, category: p.category, price: p.price, variants_summary: { colors: p.variants?.colors?.length, sizes: p.variants?.sizes?.length, variant_images: Object.keys(p.variants?.variant_images || {}).length } }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
