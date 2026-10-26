import { useQuery } from "@tanstack/react-query";
import { Product } from "@/types/product";
import type { Database } from "@/integrations/supabase/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
import { onPiilotettuTuote } from "@/lib/hiddenCategories";
import { productSeedFor } from "@/lib/prerenderPreview";

/** Piilotettujen kategorioiden tuotteiden slugit (tuotesivu ohjaa ne /kaikki-tuotteet). */
export const piilotetutSlugit = new Set<string>();

function getOriginalPrice(_slug: string, _name: string, _category: string, _price: number): number | undefined {
  // Compare-at prices removed 2026-09-29 (Omnibus directive: vertailuhinta = alin 30 pv:n hinta).
  // Strikethrough prices must never be shown after a price increase.
  return undefined;
}

async function fetchProducts(): Promise<Product[]> {
  // Oma tausta (21.10.2026): tuotteet sivuston omasta /api/products-funktiosta (tietokanta tai tilannekuva),
  // ei enää suoraan Lovable Cloudin Supabasesta. Rivimuoto on sama.
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error(`Tuotteiden haku epäonnistui (${res.status})`);
  const data: ProductRow[] = await res.json();

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

/** Tuoterivi -> Product (myös esirenderöinti, src/seo/prerender/renderPreview.tsx). */
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
  const res = await fetch(`/api/products?slug=${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Tuotteen haku epäonnistui (${res.status})`);
  const row: ProductRow | null = await res.json();
  if (!row || (row as { is_active?: boolean }).is_active === false) return null;
  if (onPiilotettuTuote(row)) {
    piilotetutSlugit.add(row.slug);
    return null;
  }
  return mapProduct(row);
}

/**
 * Koko tuoteluettelo (satoja rivejä, noin 360 kt). enabled: false jättää haun tekemättä, mutta
 * välimuistissa jo oleva luettelo palautetaan silti.
 */
export function useProducts(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
    enabled: options.enabled ?? true,
  });
}

/** Esirenderöityyn sivuun upotettu tuoterivi samoilla suodatuksilla kuin fetchProductBySlug. */
function seededProduct(slug: string | undefined): Product | undefined {
  const row = productSeedFor(slug) as ProductRow | undefined;
  if (!row || (row as { is_active?: boolean }).is_active === false || onPiilotettuTuote(row)) return undefined;
  try {
    return mapProduct(row);
  } catch {
    return undefined;
  }
}

export function useProduct(slug: string | undefined) {
  const single = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    // Upotettu data näytetään heti; updatedAt 0 = vanhentunut, joten haku päivittää sen taustalla.
    initialData: () => seededProduct(slug),
    initialDataUpdatedAt: 0,
  });
  // Luettelo (suositukset sivun alaosassa) haetaan vasta yksittäishaun jälkeen, ettei se kilpaile
  // kaistasta tuotesivun oman, pienen haun kanssa. Virheessä luettelo toimii varalla.
  const { data: products, ...rest } = useProducts({ enabled: !slug || single.isFetched || single.isError });
  const product = products?.find((p) => p.slug === slug) ?? single.data ?? undefined;
  // Ladataan, kunnes tuote löytyy tai molemmat haut ovat valmiita (yksittäishaun virheessä luettelo ratkaisee).
  const isLoading =
    !product && (single.isLoading ? true : single.isError ? rest.isPending : single.data === undefined && rest.isLoading);
  return { product, products, ...rest, isLoading };
}
