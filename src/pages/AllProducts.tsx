import { Link } from "react-router-dom";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Truck, RotateCcw, Shield, Flag } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOProductsContent, SEOTargetGroupContent, SEOCustomContent } from "@/components/SEOKeywordContent";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";

const PRIORITY_KEYWORDS = [
  "amatimies", "museo", "eläkkeellä", "eläke", "iskä ei osaa", "isä ei osaa",
  "kalju", "i ❤️ my", "i love my", "i ❤ my"
];

function isCustomTextProduct(name: string, description: string): boolean {
  const t = (name + ' ' + description).toLowerCase();
  return t.includes('oma teksti') || t.includes('oma kuva') || t.includes('custom text') || t.includes('personoi');
}

function getPriority(product: { name: string; description: string }): number {
  const t = (product.name + ' ' + product.description).toLowerCase();
  for (let i = 0; i < PRIORITY_KEYWORDS.length; i++) {
    if (t.includes(PRIORITY_KEYWORDS[i].toLowerCase())) return i;
  }
  return PRIORITY_KEYWORDS.length + 1;
}

const AllProducts = () => {
  const { data: products = [], isLoading } = useProducts();
  usePrerenderReady(!isLoading && products.length > 0);

  // Filter out custom text/image products, sort by category count then priority
  const filtered = products.filter(p => !isCustomTextProduct(p.name, p.description));
  
  // Count products per category
  const catCounts: Record<string, number> = {};
  for (const p of filtered) {
    catCounts[p.category] = (catCounts[p.category] || 0) + 1;
  }
  
  // Sort: categories with most products first, then by priority within category
  const filteredProducts = filtered.sort((a, b) => {
    const catDiff = (catCounts[b.category] || 0) - (catCounts[a.category] || 0);
    if (catDiff !== 0) return catDiff;
    return getPriority(a) - getPriority(b);
  });

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Kaikki hauskat tuotteet – T-paidat, hupparit, mukit ja paljon muuta | Huumorikauppa.fi"
        description="Selaa kaikkia Huumorikaupan tuotteita: hauskoja t-paitoja, huppareita, mukeja ja tarroja. Ilmainen toimitus yli 60 € tilauksiin!"
        canonical="https://huumorikauppa.fi/kaikki-tuotteet"
        breadcrumbs={[
          { name: "Etusivu", url: "https://huumorikauppa.fi/" },
          { name: "Kaikki tuotteet", url: "https://huumorikauppa.fi/kaikki-tuotteet" },
        ]}
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
          <span className="text-foreground">Kaikki tuotteet</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">Kaikki hauskat tuotteet 🛍️</h1>
        <p className="text-muted-foreground mb-8">Runsaasti valikoimaa – kaikki Suomen hauskimmat meemituotteet yhdessä paikassa!</p>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      <SEOProductsContent />
      <SEOTargetGroupContent />
      <SEOCustomContent />
    </div>
  );
};

export default AllProducts;
