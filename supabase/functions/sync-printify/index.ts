import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function mapToCategory(title: string): string | null {
  const t = title.toLowerCase();
  if (t.includes('t-shirt') || t.includes('tee')) return 't-paidat';
  if (t.includes('hoodie') || t.includes('hooded') || t.includes('sweatshirt')) return 'hupparit';
  if (t.includes('jogger') || t.includes('pant') || t.includes('short') || t.includes('trouser')) return 'housut';
  if (t.includes('mug') || t.includes('cup') || t.includes('tumbler')) return 'mukit';
  if (t.includes('sticker') || t.includes('decal')) return 'tarrat';
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

    // Fetch all products from Printify
    const url = `https://api.printify.com/v1/shops/${shopId}/products.json`;
    console.log(`Fetching from: ${url}`);
    
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    
    const rawText = await res.text();
    console.log(`Response status: ${res.status}`);
    console.log(`Response body (first 2000): ${rawText.slice(0, 2000)}`);
    
    let responseData;
    try {
      responseData = JSON.parse(rawText);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON from Printify", raw: rawText.slice(0, 500) }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle both array and object responses
    const allProducts = Array.isArray(responseData) 
      ? responseData 
      : (responseData.data || responseData.products || []);

    console.log(`Total products: ${allProducts.length}`);
    
    if (allProducts.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No products found in Printify",
        response_keys: Object.keys(responseData),
        raw_preview: rawText.slice(0, 1000)
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log each product for debugging
    for (const p of allProducts) {
      console.log(`Product: "${p.title}" | visible: ${p.visible} | tags: ${JSON.stringify(p.tags)} | variants: ${p.variants?.length}`);
    }

    const dbProducts = [];
    const skipped = [];

    for (const p of allProducts) {
      // Get blueprint/product type info
      const blueprintId = p.blueprint_id;
      const productTitle = p.title || '';
      
      // Try to map category from tags, title, or description
      let category = mapToCategory(productTitle);
      
      // Also check tags
      if (!category && p.tags) {
        for (const tag of p.tags) {
          category = mapToCategory(tag);
          if (category) break;
        }
      }

      // Check description
      if (!category && p.description) {
        category = mapToCategory(p.description);
      }

      // Fallback: check variant options for product type hints
      if (!category) {
        // Common Printify blueprint IDs
        // Gildan 18000 Heavy Blend Hoodie = hupparit
        // Bella Canvas 3001 = t-paidat
        // etc.
        const desc = JSON.stringify(p).toLowerCase();
        if (desc.includes('hoodie') || desc.includes('hooded')) category = 'hupparit';
        else if (desc.includes('t-shirt') || desc.includes('tee') || desc.includes('unisex')) category = 't-paidat';
        else if (desc.includes('mug')) category = 'mukit';
        else if (desc.includes('sticker')) category = 'tarrat';
      }
      
      if (!category) {
        skipped.push({ title: p.title, reason: 'no category match' });
        continue;
      }

      // Extract images – prioritize high-res, get multiple variants for hover effect
      const images: string[] = [];
      if (p.images) {
        // Sort by position, prefer "default" images first, then variants
        const sortedImages = [...p.images]
          .filter((img: any) => img.src)
          .sort((a: any, b: any) => {
            // Prefer is_default images first
            if (a.is_default && !b.is_default) return -1;
            if (!a.is_default && b.is_default) return 1;
            return (a.position || 0) - (b.position || 0);
          });
        
        // Try to get diverse images (different variants/colors)
        const seenVariants = new Set<string>();
        for (const img of sortedImages) {
          if (images.length >= 6) break;
          // Use variant_ids to avoid duplicate color mockups
          const variantKey = (img.variant_ids || []).sort().join(',');
          if (!seenVariants.has(variantKey) || images.length < 2) {
            images.push(img.src);
            if (variantKey) seenVariants.add(variantKey);
          }
        }
      }

      // Extract variants
      const sizes = new Set<string>();
      const colors = new Set<string>();
      let minPrice = Infinity;

      for (const variant of (p.variants || [])) {
        if (!variant.is_enabled) continue;
        if (variant.title) {
          const parts = variant.title.split('/').map((s: string) => s.trim());
          if (parts.length >= 1) sizes.add(parts[0]);
          if (parts.length >= 2) colors.add(parts[1]);
        }
        // Also check options
        if (variant.options) {
          for (const opt of Object.values(variant.options)) {
            if (typeof opt === 'string') {
              if (['S', 'M', 'L', 'XL', 'XXL', 'XS', '2XL', '3XL'].includes(opt)) sizes.add(opt);
            }
          }
        }
        const price = variant.price / 100;
        if (price < minPrice) minPrice = price;
      }

      if (minPrice === Infinity) minPrice = 29.95;

      const variants: Record<string, string[]> = {};
      if (sizes.size > 0) variants.sizes = Array.from(sizes);
      if (colors.size > 0) variants.colors = Array.from(colors);

      const cleanDesc = (p.description || '').replace(/<[^>]*>/g, '').trim();

      dbProducts.push({
        name: productTitle,
        slug: slugify(productTitle),
        category,
        humor_type: 'yleinen' as const,
        price: minPrice,
        stock: 99,
        description: cleanDesc || `Hauska tuote Huumorikaupasta!`,
        images,
        variants,
        is_featured: false,
        is_new: true,
        is_gift_idea: false,
      });
    }

    console.log(`Mapped ${dbProducts.length} products, skipped ${skipped.length}`);

    if (dbProducts.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No products mapped to categories",
        total_fetched: allProducts.length,
        skipped,
        products_info: allProducts.map((p: any) => ({ title: p.title, tags: p.tags, visible: p.visible }))
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
      return new Response(JSON.stringify({ error: insertError.message, products_attempted: dbProducts }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      total_fetched: allProducts.length,
      products_synced: inserted?.length || 0,
      skipped,
      categories: [...new Set(dbProducts.map(p => p.category))],
      products: inserted?.map(p => ({ name: p.name, category: p.category, price: p.price }))
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
