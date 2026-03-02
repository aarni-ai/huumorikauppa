import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
import { categories } from "@/data/products";
import { useProducts } from "@/hooks/use-products";
import { Users, ThumbsUp, Heart, Star, Truck, RotateCcw, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { data: allProducts = [], isLoading } = useProducts();

  const featured = allProducts.filter(p => p.is_featured).slice(0, 8);
  const newProducts = allProducts.filter(p => p.is_new).slice(0, 8);
  const tpaidat = allProducts.filter(p => p.category === "t-paidat").slice(0, 4);
  const hupparit = allProducts.filter(p => p.category === "hupparit").slice(0, 4);
  const housut = allProducts.filter(p => p.category === "housut").slice(0, 4);
  const mukit = allProducts.filter(p => p.category === "mukit").slice(0, 4);
  const tarrat = allProducts.filter(p => p.category === "tarrat").slice(0, 4);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Huumorikauppa",
    "url": "https://huumorikauppa.fi",
    "logo": "https://huumorikauppa.fi/favicon.ico",
    "description": "Suomen hauskin verkkokauppa – hauskoja t-paitoja, huppareita, mukeja ja tarroja.",
    "address": { "@type": "PostalAddress", "addressLocality": "Helsinki", "addressCountry": "FI" },
    "email": "info@huumorikauppa.fi",
    "sameAs": []
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Huumorikauppa – Hauskat t-paidat, hupparit, mukit ja tarrat"
        description="Osta hauskoja t-paitoja, huppareita, mukeja ja tarroja Suomen hauskimmasta verkkokaupasta. Ilmainen toimitus yli 60 € tilauksiin. Täydellisiä lahjoja!"
        canonical="https://huumorikauppa.fi"
        jsonLd={orgJsonLd}
      />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-card to-background py-16 md:py-28">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 text-6xl md:text-8xl">😂</div>
          <div className="absolute top-20 right-20 text-5xl md:text-7xl">🤣</div>
          <div className="absolute bottom-10 left-1/3 text-4xl md:text-6xl">💀</div>
          <div className="absolute bottom-20 right-10 text-5xl md:text-7xl">🔥</div>
        </div>
        <div className="container relative text-center space-y-6 md:space-y-8">
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground leading-tight md:leading-snug">
            Suomen hauskin{" "}
            <span className="text-primary text-glow-lime">meemikauppa</span>{" "}
            on täällä 💜😂
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Setähuumoria, äitihuumoria ja kaikkien suomalaisten suosikkeja.
            Tilaa ennen kuin naapurit ehtii! 🚀
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground font-bold text-lg px-8 shadow-glow-lime hover:scale-105 transition-transform">
              <Link to="/kaikki-tuotteet">Selaa tuotteita 🛒</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground font-bold text-lg px-8">
              <Link to="/kategoria/mukit">Katso mukit ☕</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="bg-muted/50 py-4 border-y border-border">
        <div className="container flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Ilmainen toimitus yli 60 € tilauksista</div>
          <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" /> 14 pv palautusoikeus</div>
          <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Turvallinen maksu</div>
        </div>
      </section>

      {isLoading ? (
        <section className="container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* UUTUUDET */}
          <ProductSection title="Uutuudet 🔥" linkTo="/kaikki-tuotteet?filter=new" products={newProducts} />

          {/* KATEGORIOITTAIN */}
          <ProductSection title="Hauskat T-Paidat 👕" linkTo="/kategoria/t-paidat" products={tpaidat} />
          <ProductSection title="Hauskat Hupparit 🧥" linkTo="/kategoria/hupparit" products={hupparit} />
          <ProductSection title="Hauskat Housut 👖" linkTo="/kategoria/housut" products={housut} />
          <ProductSection title="Hauskat Mukit ☕" linkTo="/kategoria/mukit" products={mukit} />
          <ProductSection title="Hauskat Tarrat 🏷️" linkTo="/kategoria/tarrat" products={tarrat} />

          {/* BESTSELLERIT */}
          <ProductSection title="Bestsellerit 🏆" linkTo="/kaikki-tuotteet?filter=featured" products={featured} />
        </>
      )}

      {/* KATEGORIAT GRID */}
      <section className="container py-12 md:py-16">
        <h2 className="font-display text-2xl md:text-3xl text-foreground mb-8 text-center">
          Selaa kategorioittain 📦
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {categories.map(cat => (
            <CategoryCard key={cat.slug} {...cat} />
          ))}
        </div>
      </section>

      {/* WHY HUUMORIKAUPPA */}
      <section className="bg-card border-y border-border py-12 md:py-16">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl text-foreground text-center mb-10">
            Miksi asiakkaat rakastavat Huumorikauppaa? 🤔
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <TrustCard icon={<Users className="h-8 w-8 text-primary" />} title="Tyytyväisiä asiakkaita" desc="Sadot suomalaiset ovat löytäneet meiltä hauskimmat tuotteet – ja palaavat aina uudelleen." bg="primary" />
            <TrustCard icon={<Heart className="h-8 w-8 text-accent" />} title="Helppo tilata" desc="Selkeä kauppa, turvallinen maksu ja toimitus koko Suomeen. Tilaaminen onnistuu kaikilta." bg="accent" />
            <TrustCard icon={<Star className="h-8 w-8 text-primary" />} title="Täydellinen lahja" desc="Vuoden paras lahja itselle tai läheiselle. Hauskuus taattu!" bg="primary" />
            <TrustCard icon={<ThumbsUp className="h-8 w-8 text-secondary" />} title="Custom-painatukset" desc="Haluatko oman tekstin paitaan tai mukiin? Teemme myös custom-painatuksia – ota yhteyttä!" bg="secondary" />
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="container py-12 md:py-16">
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-border rounded-lg p-8 md:p-12 text-center max-w-2xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl text-foreground mb-3">
            Tilaa uutiskirje 💥
          </h2>
          <p className="text-muted-foreground mb-6">
            Tilaa uutiskirje ja saat 10% alennuskoodin ensimmäiseen tilaukseesi!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input placeholder="anna@sahkoposti.fi" className="h-11 bg-muted border-border" />
            <Button className="bg-primary text-primary-foreground font-bold h-11 px-6 shrink-0 shadow-glow-lime">
              Tilaa 🚀
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Voit peruuttaa milloin vain.</p>
        </div>
      </section>
    </div>
  );
};

function ProductSection({ title, linkTo, products }: { title: string; linkTo: string; products: import("@/types/product").Product[] }) {
  if (products.length === 0) return null;
  return (
    <section className="container py-10 md:py-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl md:text-3xl text-foreground">{title}</h2>
        <Link to={linkTo} className="text-sm text-primary hover:underline font-medium whitespace-nowrap">
          Näytä kaikki →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function TrustCard({ icon, title, desc, bg }: { icon: React.ReactNode; title: string; desc: string; bg: string }) {
  return (
    <div className="text-center space-y-3">
      <div className={`mx-auto w-16 h-16 bg-${bg}/10 rounded-full flex items-center justify-center`}>
        {icon}
      </div>
      <h3 className="font-display text-lg text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

export default Index;
