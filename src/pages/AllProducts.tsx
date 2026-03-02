import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Truck, RotateCcw, Shield } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";

const AllProducts = () => {
  const { data: products = [], isLoading } = useProducts();

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Kaikki tuotteet – Hauskat t-paidat, hupparit, mukit | Huumorikauppa"
        description="Selaa kaikkia Huumorikaupan tuotteita: hauskoja t-paitoja, huppareita, housuja, mukeja ja tarroja. Ilmainen toimitus yli 60 € tilauksiin!"
        canonical="https://huumorikauppa.fi/kaikki-tuotteet"
      />

      <section className="bg-muted/50 py-3 border-b border-border">
        <div className="container flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Ilmainen toimitus yli 60 €</div>
          <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" /> 14 pv palautusoikeus</div>
          <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Turvallinen maksu</div>
        </div>
      </section>

      <div className="container py-8 md:py-12">
        <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Kaikki tuotteet</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">Kaikki Tuotteet 🛍️</h1>
        <p className="text-muted-foreground mb-8">Runsaasti valikoimaa – kaikki Suomen hauskimmat meemituotteet yhdessä paikassa!</p>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllProducts;
