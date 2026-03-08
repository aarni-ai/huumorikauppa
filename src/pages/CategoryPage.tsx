import { useParams, Link } from "react-router-dom";
import { categories } from "@/data/products";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Truck, RotateCcw, Shield } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";

const PRIORITY_KEYWORDS = [
  "amatimies", "museo", "eläkkeellä", "eläke", "iskä ei osaa", "isä ei osaa",
  "kalju", "i ❤️ my", "i love my", "i ❤ my"
];

function getPriority(product: { name: string; description: string }): number {
  const t = (product.name + ' ' + product.description).toLowerCase();
  for (let i = 0; i < PRIORITY_KEYWORDS.length; i++) {
    if (t.includes(PRIORITY_KEYWORDS[i].toLowerCase())) return i;
  }
  return PRIORITY_KEYWORDS.length + 1;
}

function isCustomTextProduct(name: string, description: string): boolean {
  const t = (name + ' ' + description).toLowerCase();
  return t.includes('oma teksti') || t.includes('oma kuva') || t.includes('custom text') || t.includes('personoi');
}

const CategoryPage = () => {
  const { slug } = useParams();
  const category = categories.find(c => c.slug === slug);
  const { data: allProducts = [], isLoading } = useProducts();
  const products = allProducts
    .filter(p => p.category === slug && !isCustomTextProduct(p.name, p.description))
    .sort((a, b) => getPriority(a) - getPriority(b));

  if (!category) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl text-foreground mb-4">Kategoriaa ei löydy 😅</h1>
        <Link to="/" className="text-primary hover:underline">Takaisin etusivulle →</Link>
      </div>
    );
  }

  const categoryKeywords: Record<string, string> = {
    "t-paidat": "Hauskat t-paidat – meemipaidat, huumoripaidat netistä | Huumorikauppa",
    "hupparit": "Hauskat hupparit – meemihupparit, huumorihupparit | Huumorikauppa",
    "housut": "Hauskat housut – collegehousut, joggerit, shortsit | Huumorikauppa",
    "mukit": "Hauskat mukit – kahvimukit, toimistomukit, lahjamukit | Huumorikauppa",
    "tarrat": "Hauskat tarrat – tarra-arkit, meemitarrat | Huumorikauppa",
  };

  const categoryDescs: Record<string, string> = {
    "t-paidat": "Osta hauskoja t-paitoja netistä! Meemipaidat, huumoripaidat ja sarkasmipaidat. Täydellisiä lahjoja. Ilmainen toimitus yli 60 €.",
    "hupparit": "Osta hauskoja huppareita! Meemihupparit, sarkastisia huppareita koko perheelle. Ilmainen toimitus yli 60 €.",
    "housut": "Osta hauskoja housuja! Collegehousut, joggerit ja shortsit huumorilla. Ilmainen toimitus yli 60 €.",
    "mukit": "Osta hauskoja mukeja! Kahvimukit, toimistomukit ja lahjamukit tekstillä. Ilmainen toimitus yli 60 €.",
    "tarrat": "Osta hauskoja tarroja! Tarra-arkit läppäriin, autoon ja jääkaappiin. Ilmainen toimitus yli 60 €.",
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title={categoryKeywords[slug || ""] || `Hauskat ${category.name} | Huumorikauppa`}
        description={categoryDescs[slug || ""] || `${category.description}. Ilmainen toimitus yli 60 € tilauksiin!`}
        canonical={`https://huumorikauppa.fi/kategoria/${slug}`}
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
          <span className="text-foreground">{category.emoji} {category.name}</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
          Hauskat {category.name} {category.emoji}
        </h1>
        <p className="text-muted-foreground mb-8">{category.description} – {products.length} tuotetta</p>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
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

        {!isLoading && products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">Ei tuotteita tässä kategoriassa vielä 😅</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
