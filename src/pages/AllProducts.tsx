import { Link } from "react-router-dom";
import { mockProducts } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { Truck, RotateCcw, Shield, Users } from "lucide-react";

const AllProducts = () => {
  return (
    <div className="min-h-screen">
      <section className="bg-muted/50 py-3 border-b border-border">
        <div className="container flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Ilmainen toimitus yli 60 €</div>
          <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" /> 14 pv palautusoikeus</div>
          <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Turvallinen maksu</div>
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Turvallinen suomalainen kauppa 🇫🇮</div>
        </div>
      </section>

      <div className="container py-8 md:py-12">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Kaikki tuotteet</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">Kaikki Tuotteet 🛍️</h1>
        <p className="text-muted-foreground mb-8">Runsaasti valikoimaa – kaikki Suomen hauskimmat meemituotteet yhdessä paikassa!</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {mockProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllProducts;
