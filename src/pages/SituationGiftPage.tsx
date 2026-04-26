import { useParams, Link, Navigate } from "react-router-dom";
import { useMemo } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Truck, RotateCcw, Shield, Flag } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/use-products";
import {
  findSituation,
  filterProductsForSituation,
  situationGifts,
} from "@/data/situationGifts";

const SituationGiftPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const situation = slug ? findSituation(slug) : undefined;
  const { data: allProducts, isLoading } = useProducts();

  const products = useMemo(() => {
    if (!situation || !allProducts) return [];
    return filterProductsForSituation(allProducts, situation).slice(0, 24);
  }, [allProducts, situation]);

  if (!situation) {
    return <Navigate to="/" replace />;
  }

  const canonical = `https://huumorikauppa.fi/lahjat/${situation.slug}`;

  const breadcrumbs = [
    { name: "Etusivu", url: "https://huumorikauppa.fi/" },
    { name: "Lahjaideat", url: "https://huumorikauppa.fi/kaikki-tuotteet" },
    { name: situation.h1, url: canonical },
  ];

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: situation.h1,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 12).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://huumorikauppa.fi/tuote/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title={situation.seoTitle}
        description={situation.seoDescription}
        canonical={canonical}
        jsonLd={itemListJsonLd}
        breadcrumbs={breadcrumbs}
        ogImage={products[0]?.images[0]}
      />

      <section className="bg-muted/50 py-3 border-b border-border">
        <div className="container flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Ilmainen toimitus yli 60 €</div>
          <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" /> 14 pv palautusoikeus</div>
          <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Turvallinen maksu</div>
          <div className="flex items-center gap-2"><Flag className="h-4 w-4 text-primary" /> 100 % suomalainen yritys</div>
        </div>
      </section>

      <div className="container py-8 md:py-12">
        <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <Link to="/kaikki-tuotteet" className="hover:text-foreground">Lahjaideat</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{situation.emoji} {situation.h1}</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
          {situation.emoji} {situation.h1}
        </h1>
        <p className="text-muted-foreground mb-6 max-w-3xl">{situation.intro}</p>
        <p className="text-sm text-muted-foreground mb-8">{products.length} tuotetta</p>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">Tuotteita tulossa pian 😅</p>
            <Link to="/kaikki-tuotteet" className="inline-block mt-4 text-primary hover:underline">
              Selaa kaikkia tuotteita →
            </Link>
          </div>
        )}

        {/* Cross-link other situation gifts */}
        <nav className="mt-12 pt-6 border-t border-border" aria-label="Muut lahjaideat tilanteen mukaan">
          <h2 className="font-display text-xl text-foreground mb-4">Lahjaideat eri tilanteisiin 🎁</h2>
          <div className="flex flex-wrap gap-2">
            {situationGifts.filter(s => s.slug !== situation.slug).map(s => (
              <Link
                key={s.slug}
                to={`/lahjat/${s.slug}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              >
                {s.emoji} {s.h1.replace(/^Hauskat lahjat /, "")}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default SituationGiftPage;