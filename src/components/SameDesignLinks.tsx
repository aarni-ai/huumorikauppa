import { Link } from "react-router-dom";
import type { Product } from "@/types/product";
import { sameDesignLinks } from "@/lib/sameDesign";

/** "Sama design myös: Huppari · Tarra · Juliste" (src/lib/sameDesign.ts). Ei mitään, jos muita tyyppejä ei ole. */
export function SameDesignLinks({ product, all, className = "" }: { product: Product; all: readonly Product[]; className?: string }) {
  const links = sameDesignLinks(product, all);
  if (links.length === 0) return null;
  return (
    <nav aria-label="Sama design muina tuotteina" className={`text-sm text-muted-foreground ${className}`}>
      <span className="font-medium text-foreground">Sama design myös: </span>
      {links.map(({ label, product: p }, i) => (
        <span key={p.id}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          <Link to={`/tuote/${p.slug}`} className="text-primary hover:underline" title={p.name}>
            {label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
