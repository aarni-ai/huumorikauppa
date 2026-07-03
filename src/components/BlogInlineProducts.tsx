import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/use-products";
import { selectMilestoneHighlights } from "@/data/milestoneHighlights";
import { Product } from "@/types/product";

interface BlogInlineProductsProps {
  articleSlug: string;
  startIndex?: number;
  count?: number;
}

/**
 * Compact, theme-matched product strip injected mid-article (after subheadings).
 * Uses the same slug→theme classifier as the end-of-article highlights, rotating
 * the selection by `startIndex` so different in-text spots surface different
 * products. Renders nothing until products are synced or if the article is off-theme.
 */
export function BlogInlineProducts({ articleSlug, startIndex = 0, count = 2 }: BlogInlineProductsProps) {
  const { data: products } = useProducts();
  const highlight = selectMilestoneHighlights(articleSlug);

  if (!highlight || !products) return null;

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const resolved = highlight.slugs
    .map((s) => bySlug.get(s))
    .filter((p): p is Product => Boolean(p));

  if (resolved.length === 0) return null;

  const rotated = [...resolved.slice(startIndex), ...resolved.slice(0, startIndex)];
  const items = rotated.slice(0, count);

  return (
    <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((p) => (
        <Link
          key={p.id}
          to={`/tuote/${p.slug}`}
          className="flex gap-3 rounded-xl border border-primary/25 bg-primary/5 hover:border-primary/60 transition-colors p-3"
          itemScope
          itemType="https://schema.org/Product"
        >
          <img
            src={p.images[0] || "/placeholder.svg"}
            alt={p.name}
            className="w-16 h-16 rounded-lg object-cover bg-muted shrink-0"
            loading="lazy"
            itemProp="image"
          />
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-sm font-medium text-foreground line-clamp-2" itemProp="name">
              {p.name}
            </span>
            <span className="text-sm font-bold text-primary mt-1">{p.price.toFixed(2)} €</span>
            <span className="text-xs text-primary mt-0.5">Katso tuote →</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
