import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { proxiedImage } from "@/lib/imageProxy";
import { selectMilestoneHighlights } from "@/data/milestoneHighlights";
import { Product } from "@/types/product";

interface BlogInlineProductsProps {
  articleSlug: string;
  startIndex?: number;
  count?: number;
}

/**
 * Image-forward product grid injected mid-article after h2 headings.
 * 2 columns on mobile, 3 on desktop. All images lazy-load with fixed dimensions
 * to prevent CLS. Renders nothing until products are synced or if off-theme.
 */
export function BlogInlineProducts({ articleSlug, startIndex = 0, count = 3 }: BlogInlineProductsProps) {
  const { data: products } = useProducts();
  const highlight = selectMilestoneHighlights(articleSlug);

  if (!highlight || !products) return null;

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const resolved = highlight.slugs
    .map((s) => bySlug.get(s))
    .filter((p): p is Product => Boolean(p));

  if (resolved.length === 0) return null;

  // Rotate so different in-article positions surface different products
  const rotated = [...resolved.slice(startIndex), ...resolved.slice(0, startIndex)];
  const items = rotated.slice(0, count);

  return (
    <div className="my-8 rounded-xl border border-border bg-card/60 p-4 md:p-5 not-prose">
      <p className="text-[11px] font-semibold text-primary uppercase tracking-widest mb-3">
        {highlight.title}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((p) => (
          <BlogProductCard key={p.id} product={p} />
        ))}
      </div>
      <Link
        to={highlight.ctaLink}
        className="mt-4 flex items-center justify-center gap-1.5 w-full py-3 rounded-lg border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
      >
        {highlight.ctaLabel}
        <ArrowRight className="h-4 w-4 shrink-0" />
      </Link>
    </div>
  );
}

// Shared vertical product card for blog contexts — image on top, info below.
// Fixed aspect-square image box prevents CLS; lazy-load avoids LCP impact.
export function BlogProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/tuote/${product.slug}`}
      className="group flex flex-col rounded-xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-colors"
      itemScope
      itemType="https://schema.org/Product"
    >
      <div className="aspect-square bg-muted overflow-hidden">
        <img
          src={proxiedImage(product.images[0]) || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          width={240}
          height={240}
          itemProp="image"
        />
      </div>
      <div className="flex flex-col gap-1 p-3 flex-1">
        <span className="text-xs font-medium text-foreground line-clamp-2 leading-snug" itemProp="name">
          {product.name}
        </span>
        <span className="text-sm font-bold text-primary mt-1">
          {product.price.toFixed(2)} €
        </span>
        <span className="mt-auto pt-1.5 flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold min-h-[40px] hover:opacity-90 transition-opacity">
          Katso tuote
        </span>
      </div>
    </Link>
  );
}
