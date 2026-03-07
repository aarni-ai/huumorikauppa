import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    humor_type: p.humor_type,
    price: Number(p.price),
    stock: p.stock,
    description: p.description,
    images: p.images || [],
    variants: (p.variants as Record<string, any>) || {},
    is_featured: p.is_featured,
    is_new: p.is_new,
    is_gift_idea: p.is_gift_idea,
  }));
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
