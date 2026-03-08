import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

// Original prices for specific products (by slug keyword match)
const ORIGINAL_PRICES: Record<string, number> = {
  "kalamies": 39,
  "amatimies": 60,
  "elakkeella": 95,
  "eläkkeellä": 95,
  "i-love-my-girlfriend": 40,
  "i-my-girlfriend": 40,
};

function getOriginalPrice(slug: string, name: string, category: string, price: number): number | undefined {
  const key = (slug + ' ' + name).toLowerCase();
  
  // Check specific product matches
  for (const [keyword, origPrice] of Object.entries(ORIGINAL_PRICES)) {
    if (key.includes(keyword) && origPrice > price) {
      return origPrice;
    }
  }
  
  // General category-based original prices
  if (category === 't-paidat' && price <= 24.90) return 34.90;
  if (category === 'hupparit' && price <= 49.90) return 69.90;
  if (category === 'pitkahihaiset' && price <= 39.90) return 54.90;
  if (category === 'mukit' && price <= 19.90) return 27.90;
  if (category === 'bodyt' && price <= 24.90) return 34.90;
  
  return undefined;
}

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((p) => {
    const price = Number(p.price);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      humor_type: p.humor_type,
      price,
      original_price: getOriginalPrice(p.slug, p.name, p.category, price),
      stock: p.stock,
      description: p.description,
      images: p.images || [],
      variants: (p.variants as Record<string, any>) || {},
      is_featured: p.is_featured,
      is_new: p.is_new,
      is_gift_idea: p.is_gift_idea,
    };
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(slug: string | undefined) {
  const { data: products, ...rest } = useProducts();
  const product = products?.find((p) => p.slug === slug);
  return { product, products, ...rest };
}
