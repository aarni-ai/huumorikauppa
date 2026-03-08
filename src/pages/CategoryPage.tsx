import { useParams, Link } from "react-router-dom";
import { categories } from "@/data/products";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Truck, RotateCcw, Shield, Flag } from "lucide-react";
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
  const categoryProducts = allProducts.filter(p => p.category === slug);
  const nonCustomProducts = categoryProducts.filter(p => !isCustomTextProduct(p.name, p.description));
  const products = (nonCustomProducts.length > 0 ? nonCustomProducts : categoryProducts)
    .sort((a, b) => getPriority(a) - getPriority(b));

  if (!category) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl text-foreground mb-4">Kategoriaa ei löydy 😅</h1>
        <Link to="/" className="text-primary hover:underline">Takaisin etusivulle →</Link>
      </div>
    );
  }

  // Other categories for cross-linking
  const otherCategories = categories.filter(c => c.slug !== slug);
  const crossLinkCategories = otherCategories
    .filter(c => allProducts.some(p => p.category === c.slug))
    .slice(0, 5);

  const breadcrumbs = [
    { name: "Etusivu", url: "https://huumorikauppa.fi/" },
    { name: category.name, url: `https://huumorikauppa.fi/kategoria/${slug}` },
  ];

  // ItemList schema for product listing (Google Merchant rich results)
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Hauskat ${category.name}`,
    "description": category.seoDescription || category.description,
    "url": `https://huumorikauppa.fi/kategoria/${slug}`,
    "isPartOf": { "@type": "WebSite", "name": "Huumorikauppa", "url": "https://huumorikauppa.fi" },
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": products.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://huumorikauppa.fi/tuote/${p.slug}`,
        "name": p.name,
        "image": p.images[0] || "/placeholder.svg",
      })),
    },
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title={category.seoTitle || `Hauskat ${category.name} | Huumorikauppa`}
        description={category.seoDescription || `${category.description}. Ilmainen toimitus yli 60 € tilauksiin!`}
        canonical={`https://huumorikauppa.fi/kategoria/${slug}`}
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

        {/* SEO Category Text */}
        {category.seoText && (
          <section className="mt-12 max-w-3xl">
            <div className="prose prose-sm text-muted-foreground space-y-4">
              {category.seoText.split('\n\n').map((paragraph, i) => {
                const trimmed = paragraph.trim();
                if (trimmed.startsWith('## ')) {
                  return <h2 key={i} className="font-display text-xl text-foreground mt-6 mb-2">{trimmed.replace('## ', '')}</h2>;
                }
                if (trimmed.startsWith('### ')) {
                  return <h3 key={i} className="font-semibold text-foreground mt-4 mb-1">{trimmed.replace('### ', '')}</h3>;
                }
                return <p key={i} className="text-sm leading-relaxed">{trimmed}</p>;
              })}
            </div>
            <nav className="mt-8 pt-6 border-t border-border" aria-label="Tutustu muihin kategorioihin">
              <h3 className="text-sm font-semibold text-foreground mb-3">Tutustu myös muihin kategorioihin:</h3>
              <div className="flex flex-wrap gap-2">
                {crossLinkCategories.map(cat => (
                  <Link
                    key={cat.slug}
                    to={`/kategoria/${cat.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    {cat.emoji} {cat.name}
                  </Link>
                ))}
              </div>
            </nav>
          </section>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
