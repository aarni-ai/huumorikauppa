import { Link } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/types/product";
import TOP50 from "../../api/_lib/top50.generated.js";

/** Sama malli t-paitana ja huppareina: yksi nosto per malli. */
const malli = (slug: string) => slug.replace(/-(t-paita|huppari|pitkahihainen-paita|t-shirt-t-paita)$/, "");

/**
 * Etusivun yläosan 8 suosituinta (2.11.2026): TOP50-järjestys (api/_lib/top50.generated.js: myydyimmät ensin, sitten
 * suosituimmuussäännöt ja Search Consolen haut), vain t-paidat ja hupparit, yksi tuote per malli. Paikka varataan
 * ennen tuotteiden latausta, jottei sisältö siirry (CLS).
 */
export function valitseSuosituimmat(tuotteet: Product[], n = 8): Product[] {
  const bySlug = new Map(tuotteet.map((p) => [p.slug, p]));
  const valitut: Product[] = [];
  const mallit = new Set<string>();
  for (const slug of TOP50 as Set<string>) {
    const p = bySlug.get(slug);
    if (!p || !["t-paidat", "hupparit"].includes(p.category) || mallit.has(malli(slug))) continue;
    mallit.add(malli(slug));
    valitut.push(p);
    if (valitut.length === n) break;
  }
  return valitut;
}

export function EtusivunSuosituimmat({ tuotteet, lataa }: { tuotteet: Product[]; lataa: boolean }) {
  const valitut = valitseSuosituimmat(tuotteet);
  return (
    <section className="container pt-4 pb-2" aria-labelledby="suosituimmat-otsikko">
      <div className="flex items-baseline justify-between mb-3">
        <h2 id="suosituimmat-otsikko" className="font-display text-xl md:text-2xl text-foreground">Suosituimmat</h2>
        <Link to="/suosituimmat" className="text-sm text-primary underline">Katso kaikki</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 min-h-[560px] md:min-h-[380px]">
        {lataa || !valitut.length
          ? Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="space-y-2" aria-hidden="true">
              <div className="aspect-square rounded-md bg-muted animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/3 rounded bg-muted" />
            </div>
          ))
          : valitut.map((p) => <ProductCard key={p.id} product={p} ostaNappi />)}
      </div>
    </section>
  );
}
