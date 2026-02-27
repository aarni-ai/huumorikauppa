import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
import { mockProducts, categories } from "@/data/products";
import { Users, ThumbsUp, Heart, Truck, RotateCcw, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";

const Index = () => {
  const featured = mockProducts.filter(p => p.is_featured).slice(0, 4);
  const newProducts = mockProducts.filter(p => p.is_new).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-card to-background py-16 md:py-24">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 text-6xl md:text-8xl">😂</div>
          <div className="absolute top-20 right-20 text-5xl md:text-7xl">🤣</div>
          <div className="absolute bottom-10 left-1/3 text-4xl md:text-6xl">💀</div>
          <div className="absolute bottom-20 right-10 text-5xl md:text-7xl">🔥</div>
        </div>
        <div className="container relative text-center space-y-6 md:space-y-8">
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-foreground leading-tight">
            Hauskimmat meemit nyt{" "}
            <span className="text-primary text-glow-lime">paidassa</span>,{" "}
            <span className="text-secondary text-glow-pink">mukissa</span> ja{" "}
            <span className="text-accent text-glow-cyan">tarrassa</span> 😂
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Suomen hauskin verkkokauppa. Setähuumoria, äitihuumoria ja perusmulkkujen suosikkeja.
            Tilaa ennen kuin naapurit ehtii! 🚀
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground font-bold text-lg px-8 shadow-glow-lime hover:scale-105 transition-transform">
              <Link to="/kategoria/t-paidat">Selaa tuotteita 🛒</Link>
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
          <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Ilmainen toimitus yli 60 €</div>
          <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" /> 14 pv palautusoikeus</div>
          <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Turvallinen maksu</div>
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Yli 2000 tyytyväistä asiakasta</div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="container py-12 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl text-foreground">
            Bestsellerit 🏆
          </h2>
          <Link to="/kategoria/t-paidat" className="text-sm text-primary hover:underline font-medium">
            Näytä kaikki →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featured.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container py-12 md:py-16">
        <h2 className="font-display text-2xl md:text-3xl text-foreground mb-8 text-center">
          Kategoriat 📦
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.map(cat => (
            <CategoryCard key={cat.slug} {...cat} />
          ))}
        </div>
      </section>

      {/* NEW PRODUCTS */}
      <section className="container py-12 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl text-foreground">
            Uutuudet 🔥
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {newProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* WHY HUUMORIKAUPPA */}
      <section className="bg-card border-y border-border py-12 md:py-16">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl text-foreground text-center mb-10">
            Miksi Huumorikauppa? 🤔
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-lg text-foreground">Yli 2000 tyytyväistä setää</h3>
              <p className="text-sm text-muted-foreground">Ja yhtä monta äitiä jotka tilasi "vain yhden mukin". Spoiler: ei jäänyt yhteen.</p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center">
                <ThumbsUp className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-display text-lg text-foreground">Naapurit kateellisia</h3>
              <p className="text-sm text-muted-foreground">Kun sä kävelet "Oispa kaljaa" -paita päällä, koko naapurusto haluaa tietää mistä sait sen.</p>
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                <Heart className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-display text-lg text-foreground">Mummokin tilasi mukin</h3>
              <p className="text-sm text-muted-foreground">Niin helppo tilata, että 87-vuotias mummo sai "Maailman paras mummo" -mukin itse tilattua. True story.</p>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="container py-12 md:py-16">
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-border rounded-lg p-8 md:p-12 text-center max-w-2xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl text-foreground mb-3">
            Tilaa meemi-isku 💥
          </h2>
          <p className="text-muted-foreground mb-6">
            Saat 10% alennuskoodin + viikoittaisen meemiterveisin sähköpostiisi. Lupaamme: ei spämmiä, vain huumoria.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input placeholder="anna@sahkoposti.fi" className="h-11 bg-muted border-border" />
            <Button className="bg-primary text-primary-foreground font-bold h-11 px-6 shrink-0 shadow-glow-lime">
              Tilaa 🚀
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Voit peruuttaa milloin vain. Emme myy tietojasi (paitsi meemejä).</p>
        </div>
      </section>
    </div>
  );
};

export default Index;
