import { useParams, Link } from "react-router-dom";
import { mockProducts, categories } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { Truck, RotateCcw, Shield, Users } from "lucide-react";

const CategoryPage = () => {
  const { slug } = useParams();
  const category = categories.find(c => c.slug === slug);
  const products = mockProducts.filter(p => p.category === slug);

  if (!category) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl text-foreground mb-4">Kategoriaa ei löydy 😅</h1>
        <Link to="/" className="text-primary hover:underline">Takaisin etusivulle →</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Trust bar */}
      <section className="bg-muted/50 py-3 border-b border-border">
        <div className="container flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Ilmainen toimitus yli 60 €</div>
          <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" /> 14 pv palautusoikeus</div>
          <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Turvallinen maksu</div>
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> +500 tyytyväistä asiakasta 💎</div>
        </div>
      </section>

      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{category.emoji} {category.name}</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
          Hauskat {category.name} {category.emoji}
        </h1>
        <p className="text-muted-foreground mb-8">{category.description} – {products.length} tuotetta</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">Ei tuotteita tässä kategoriassa vielä 😅</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
