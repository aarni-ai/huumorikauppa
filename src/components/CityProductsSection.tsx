import { useMemo } from "react";
import { ProductCard } from "@/components/ProductCard";
import { useVisitorCity } from "@/hooks/use-visitor-city";
import type { Product } from "@/types/product";

interface CityProductsSectionProps {
  allProducts: Product[];
  currentProductId: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zåäö0-9]+/g, " ")
    .trim();
}

// Strip common Finnish case endings so e.g. "Tampereella" → "tamperee" → matches "tampere"
function cityStem(city: string): string {
  const n = normalize(city);
  // Keep first 5 chars min for a reasonable substring (e.g. "tampe", "helsi", "turku")
  if (n.length <= 5) return n;
  return n.slice(0, Math.max(5, n.length - 3));
}

export function CityProductsSection({ allProducts, currentProductId }: CityProductsSectionProps) {
  const city = useVisitorCity();

  const { cityProducts, displayCity } = useMemo(() => {
    if (!city) return { cityProducts: [] as Product[], displayCity: null as string | null };
    const stem = cityStem(city);
    if (!stem || stem.length < 4) return { cityProducts: [] as Product[], displayCity: city };

    const matches = allProducts.filter((p) => {
      if (p.id === currentProductId) return false;
      const haystack = normalize(`${p.name} ${p.description || ""} ${p.slug || ""}`);
      return haystack.includes(stem);
    }).slice(0, 4);

    return { cityProducts: matches, displayCity: city };
  }, [city, allProducts, currentProductId]);

  // Fallback: featured/bestseller-style products (excludes current)
  const fallbackProducts = useMemo(() => {
    const featured = allProducts.filter(
      (p) => p.id !== currentProductId && p.is_featured
    );
    const pool = featured.length >= 4
      ? featured
      : allProducts.filter((p) => p.id !== currentProductId);
    return pool.slice(0, 4);
  }, [allProducts, currentProductId]);

  const useCityList = cityProducts.length > 0;
  const products = useCityList ? cityProducts : fallbackProducts;

  if (products.length === 0) return null;

  const heading = useCityList && displayCity
    ? `Suosittua ${displayCity}ssa 📍`
    : "Suosituimmat juuri nyt 🔥";

  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl md:text-3xl text-foreground mb-2">
        {heading}
      </h2>
      {useCityList && (
        <p className="text-sm text-muted-foreground mb-6">
          Tehty sinun kaupungillesi – valikoima vaihtuu sijaintisi mukaan.
        </p>
      )}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 ${useCityList ? "" : "mt-6"}`}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
