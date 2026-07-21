import { Link } from "react-router-dom";
import { Gift, ArrowRight } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { selectMilestoneHighlights } from "@/data/milestoneHighlights";
import { Product } from "@/types/product";

interface MilestoneProductHighlightsProps {
  articleSlug: string;
}

/**
 * Theme-matched, image-forward product highlights for blog articles. The article's
 * theme is derived from its slug (selectMilestoneHighlights), so e.g. a "miehelle"
 * article shows men's products, a "toimisto"/"pomo" article shows mugs, etc.
 * Off-theme articles (stickers, baby, pets, sauna...) render nothing. Cards resolve
 * live via useProducts(), so they appear only once products are synced.
 */
export function MilestoneProductHighlights({ articleSlug }: MilestoneProductHighlightsProps) {
  const { data: products } = useProducts();
  const highlight = selectMilestoneHighlights(articleSlug);

  if (!highlight || !products) return null;

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const items = highlight.slugs
    .map((s) => bySlug.get(s))
    .filter((p): p is Product => Boolean(p));

  if (items.length === 0) return null;

  return (
    <section className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="h-5 w-5 text-primary shrink-0" />
        <h3 className="font-display text-lg text-foreground">{highlight.title}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((p) => (
          <div
            key={p.id}
            className="flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors"
            itemScope
            itemType="https://schema.org/Product"
          >
            <Link to={`/tuote/${p.slug}`} aria-label={p.name} className="block aspect-square bg-muted overflow-hidden group">
              <img
                src={p.images[0] || "/placeholder.svg"}
                alt={p.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                width={240}
                height={240}
                itemProp="image"
              />
            </Link>
            <div className="flex flex-col gap-1 p-3 flex-1">
              <Link
                to={`/tuote/${p.slug}`}
                className="text-xs font-medium text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
                itemProp="name"
              >
                {p.name}
              </Link>
              <span className="text-sm font-bold text-primary mt-1">{p.price.toFixed(2)} €</span>
              <Link
                to={`/tuote/${p.slug}`}
                className="mt-auto pt-1.5 inline-flex items-center justify-center px-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold min-h-[40px] hover:opacity-90 transition-opacity"
              >
                Katso tuote
              </Link>
            </div>
          </div>
        ))}
      </div>
      <Link
        to={highlight.ctaLink}
        className="mt-4 flex items-center justify-center gap-1.5 w-full py-3 rounded-lg border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
      >
        {highlight.ctaLabel}
        <ArrowRight className="h-4 w-4 shrink-0" />
      </Link>
    </section>
  );
}
