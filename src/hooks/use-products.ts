import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Product } from "@/types/product";
import { onPiilotettuTuote } from "@/lib/hiddenCategories";

/** Piilotettujen kategorioiden tuotteiden slugit (tuotesivu ohjaa ne /kaikki-tuotteet). */
export const piilotetutSlugit = new Set<string>();

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
    // Myynnistä piilotetut kategoriat (src/lib/hiddenCategories.ts, mukit 21.10.2026).
    .filter((p) => {
      if (!onPiilotettuTuote(p)) return true;
      piilotetutSlugit.add(p.slug);
      return false;
    })
    .map(mapProduct);
}

type ProductRow = Tables<"products">;

/** Supabase-rivi -> Product (myös esirenderöinti, src/seo/prerender/renderProductPreview.tsx). */
export function mapProduct(p: ProductRow): Product {
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
}

/**
 * Yksi tuote slugilla. Tuotesivu ei odota koko luetteloa (satoja rivejä): pääkuva ja ostopainike
 * renderöidään heti tämän pienen haun jälkeen. Sama suodatus kuin fetchProducts.
 */
async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).limit(1);
  if (error) throw error;
  const row = data?.[0];
  if (!row || (row as { is_active?: boolean }).is_active === false) return null;
  if (onPiilotettuTuote(row)) {
    piilotetutSlugit.add(row.slug);
    return null;
  }
  return mapProduct(row);
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
  const single = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
  const product = products?.find((p) => p.slug === slug) ?? single.data ?? undefined;
  // Ladataan, kunnes tuote löytyy tai molemmat haut ovat valmiita (yksittäishaun virheessä luettelo ratkaisee).
  const isLoading =
    !product && (single.isLoading ? true : single.isError ? rest.isLoading : single.data === undefined && rest.isLoading);
  return { product, products, ...rest, isLoading };
}
