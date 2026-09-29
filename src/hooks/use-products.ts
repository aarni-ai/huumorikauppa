import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

function getOriginalPrice(_slug: string, _name: string, _category: string, _price: number): number | undefined {
  // Compare-at prices removed 2026-09-29 (Omnibus directive: vertailuhinta = alin 30 pv:n hinta).
  // Strikethrough prices must never be shown after a price increase.
  return undefined;
}

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || [])
    // Hide ONLY explicit drafts (is_active === false, e.g. AliExpress imports awaiting
    // approval). Done in JS — never in the query — so a missing is_active column (frontend
    // may deploy before the migration) can't break the query or hide existing products.
    .filter((p) => (p as { is_active?: boolean }).is_active !== false)
    .map((p) => {
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
      supplier: (p as { supplier?: string }).supplier ?? "printify",
      aliexpress_url: (p as { aliexpress_url?: string }).aliexpress_url ?? undefined,
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
