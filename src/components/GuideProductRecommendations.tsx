import { Link } from "react-router-dom";
import { Gift, ArrowRight } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { BlogProductCard } from "@/components/BlogInlineProducts";
import { guideRecommendations } from "@/data/guideRecommendations";
import { Product } from "@/types/product";

interface GuideProductRecommendationsProps {
  guideSlug: string;
}

const GUIDE_CTA: Record<string, { link: string; label: string }> = {
  "lahja-miehelle-30v-40v-50v-60v":         { link: "/hauskat-lahjat-miehelle", label: "Katso kaikki miesten lahjat" },
  "lahja-naiselle-30v-40v-50v-60v":         { link: "/hauskat-lahjat-naiselle", label: "Katso kaikki naisten lahjat" },
  "hauskimmat-elakelahjat-selviytymisopas": { link: "/elakelahjat",             label: "Katso kaikki eläkelahjat" },
};

/**
 * Age-grouped product grid for gift guides. Image-forward cards (BlogProductCard),
 * 2 cols mobile / 3 cols desktop. Renders nothing until products are synced.
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
        .filter((p): p is Product => Boolean(p))
        .slice(0, 3),
    }))
    .filter((g) => g.items.length > 0);

  if (resolved.length === 0) return null;

  const cta = GUIDE_CTA[guideSlug];

  return (
    <section className="mt-10 rounded-xl border border-primary/20 bg-card/60 p-4 md:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="h-5 w-5 text-primary shrink-0" />
        <h3 className="font-display text-lg text-foreground">Tuotesuositukset iän mukaan</h3>
      </div>
      <div className="space-y-6">
        {resolved.map((g) => (
          <div key={g.title}>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              {g.title}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {g.items.map((p) => (
                <BlogProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4 mb-3">
        Ilmainen toimitus yli 60 € tilauksiin · 14 pv palautusoikeus · Toimitus 3–10 arkipäivässä
      </p>
      {cta && (
        <Link
          to={cta.link}
          className="flex items-center justify-center gap-1.5 w-full py-3 rounded-lg border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
        >
          {cta.label}
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      )}
    </section>
  );
}
