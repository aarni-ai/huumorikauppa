import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { proxiedImage } from "@/lib/imageProxy";
import { blogPageLabel, type BlogProductTheme } from "@/data/blogProducts";
import type { Product } from "@/types/product";

interface BlogProductStripProps {
  theme: BlogProductTheme;
  /** null = tuotteet latautuvat: varataan sama tila luurankokorteilla (CLS 0). */
  products: Product[] | null;
  /** Korttien määrä (myös latauksen aikana). */
  count: number;
  /** "end" näyttää lisäksi linkit aiheeseen liittyville sivuille. */
  variant: "mid" | "end";
}

/**
 * Artikkelin tuotenosto: tuotekortit, Katso tuotteet -painike kohdesivulle ja (lopussa) linkit
 * liittyville sivuille. Kortit ovat kiinteän kokoisia ja kuvat ladataan laiskasti.
 * Ei mikrodataa: tuotteet merkitään ItemListinä artikkelin JSON-LD:ssä (src/lib/blogJsonLd.ts).
 */
export function BlogProductStrip({ theme, products, count, variant }: BlogProductStripProps) {
  if (products && products.length === 0) return null;
  const items = products ? products.slice(0, count) : null;
  const Heading = variant === "end" ? "h2" : "p";
  return (
    <section
      className={`not-prose rounded-xl border border-primary/30 bg-primary/5 p-4 md:p-5 ${variant === "end" ? "mt-10" : "my-8"}`}
      aria-label={theme.heading}
    >
      <div className="flex items-center gap-2 mb-3">
        <ShoppingBag className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
        <Heading className="font-display text-lg text-foreground">{theme.heading}</Heading>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items
          ? items.map((p) => <BlogProductCard key={p.id} product={p} />)
          : Array.from({ length: count }, (_, i) => <BlogProductCardSkeleton key={i} />)}
      </div>
      <Link
        to={theme.href}
        className="mt-4 flex items-center justify-center gap-1.5 w-full min-h-[44px] py-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
      >
        Katso tuotteet: {theme.name}
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </Link>
      {variant === "end" && theme.related.length > 0 && (
        <nav className="mt-4" aria-label="Aiheeseen liittyvät lahjasivut">
          <p className="text-sm font-semibold text-foreground mb-2">Lisää lahjaideoita:</p>
          <ul className="flex flex-wrap gap-2">
            {theme.related.map((href) => (
              <li key={href}>
                <Link
                  to={href}
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                >
                  {blogPageLabel(href)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  );
}

const CARD = "flex flex-col rounded-xl overflow-hidden border border-border bg-card";
const NAME = "text-xs font-medium text-foreground line-clamp-2 leading-snug min-h-[2.5em]";

/**
 * Pystysuuntainen tuotekortti blogiin: kuva ylhäällä, tiedot alla, Osta vie tuotesivulle (koko ja koriin). Kiinteä neliökuva ja
 * kahden rivin nimi pitävät koon vakiona; kuva ladataan laiskasti.
 */
export function BlogProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/tuote/${product.slug}`} className={`group ${CARD} hover:border-primary/40 transition-colors`}>
      <div className="aspect-square bg-muted overflow-hidden">
        <img
          src={proxiedImage(product.images[0], { width: 480 }) || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          width={240}
          height={240}
        />
      </div>
      <div className="flex flex-col gap-1 p-3 flex-1">
        <span className={NAME}>{product.name}</span>
        <span className="text-sm font-bold text-primary mt-1">{product.price.toFixed(2).replace(".", ",")} €</span>
        <span className="mt-auto pt-1.5 flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold min-h-[40px] hover:opacity-90 transition-opacity">
          Osta
        </span>
      </div>
    </Link>
  );
}

function BlogProductCardSkeleton() {
  return (
    <div className={CARD} aria-hidden="true">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="flex flex-col gap-1 p-3 flex-1">
        <span className={`${NAME} rounded bg-muted`} />
        <span className="text-sm font-bold mt-1 invisible">0,00 €</span>
        <span className="mt-auto pt-1.5 min-h-[40px] rounded-lg bg-muted" />
      </div>
    </div>
  );
}
