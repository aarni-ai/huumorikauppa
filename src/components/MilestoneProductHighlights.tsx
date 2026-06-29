import { Link } from "react-router-dom";
import { Gift } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { milestoneHighlightArticles, milestoneHighlightSlugs } from "@/data/milestoneHighlights";
import { Product } from "@/types/product";

interface MilestoneProductHighlightsProps {
  articleSlug: string;
}

/**
 * Image-forward product highlights for the most popular / relevant blog articles.
 * Shows a cross-section of the new milestone products as clickable images that link
 * to the product page. Renders nothing until products are synced (no broken links),
 * and only on articles listed in milestoneHighlightArticles.
 */
export function MilestoneProductHighlights({ articleSlug }: MilestoneProductHighlightsProps) {
  const { data: products } = useProducts();

  if (!milestoneHighlightArticles.includes(articleSlug) || !products) return null;

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const items = milestoneHighlightSlugs
    .map((s) => bySlug.get(s))
    .filter((p): p is Product => Boolean(p));

  if (items.length === 0) return null;

  return (
    <section className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="h-5 w-5 text-primary shrink-0" />
        <h3 className="font-display text-lg text-foreground">Hauskat merkkipäivälahjat</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((p) => (
          <div
            key={p.id}
            className="flex flex-col rounded-lg border border-border bg-card overflow-hidden hover:border-primary/60 transition-colors"
            itemScope
            itemType="https://schema.org/Product"
          >
            <Link to={`/tuote/${p.slug}`} aria-label={p.name} className="block aspect-square bg-muted">
              <img
                src={p.images[0] || "/placeholder.svg"}
                alt={p.name}
                className="w-full h-full object-cover"
                loading="lazy"
                itemProp="image"
              />
            </Link>
            <div className="flex flex-col gap-1 p-2.5 flex-1">
              <Link
                to={`/tuote/${p.slug}`}
                className="text-xs font-medium text-foreground hover:text-primary transition-colors line-clamp-2"
                itemProp="name"
              >
                {p.name}
              </Link>
              <span className="text-sm font-bold text-primary mt-auto">{p.price.toFixed(2)} €</span>
              <Link
                to={`/tuote/${p.slug}`}
                className="mt-1 inline-flex items-center justify-center px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Katso tuote
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
