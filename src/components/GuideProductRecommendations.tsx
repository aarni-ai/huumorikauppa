import { Gift } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { InlineProductCard } from "@/components/InlineProductCard";
import { guideRecommendations } from "@/data/guideRecommendations";
import { Product } from "@/types/product";

interface GuideProductRecommendationsProps {
  guideSlug: string;
}

/**
 * Renders age-grouped product cards for a gift guide. The slug→guide mapping is
 * static (src/data/guideRecommendations.ts), but product data resolves live via
 * useProducts(), so cards appear automatically once products are synced and stay
 * hidden (no broken links) until then.
 */
export function GuideProductRecommendations({ guideSlug }: GuideProductRecommendationsProps) {
  const groups = guideRecommendations[guideSlug];
  const { data: products } = useProducts();

  if (!groups || !products) return null;

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const resolved = groups
    .map((g) => ({
      title: g.title,
      items: g.slugs
        .map((s) => bySlug.get(s))
        .filter((p): p is Product => Boolean(p)),
    }))
    .filter((g) => g.items.length > 0);

  if (resolved.length === 0) return null;

  return (
    <section className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="h-5 w-5 text-primary shrink-0" />
        <h3 className="font-display text-lg text-foreground">Suosittele näitä tuotteita</h3>
      </div>
      <div className="space-y-6">
        {resolved.map((g) => (
          <div key={g.title}>
            <h4 className="font-semibold text-sm text-foreground mb-3">{g.title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {g.items.map((p) => (
                <InlineProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Ilmainen toimitus yli 60 € tilauksiin · 14 pv palautusoikeus · Toimitus 3–10 arkipäivässä
      </p>
    </section>
  );
}
