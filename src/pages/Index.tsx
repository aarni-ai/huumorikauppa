import { Link } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
import { categories } from "@/data/products";
import { useProducts } from "@/hooks/use-products";
import { Users, ThumbsUp, Heart, Star, Truck, RotateCcw, Shield, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback, useRef } from "react";
import { ReviewsCarousel } from "@/components/ReviewsCarousel";

function isCustomTextProduct(name: string, description: string): boolean {
  const t = (name + ' ' + description).toLowerCase();
  return t.includes('oma teksti') || t.includes('oma kuva') || t.includes('custom text') || t.includes('personoi');
}

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

const CAROUSEL_SLUGS = [
  "kalamies-t-paita",
  "maailman-paras-aiti-huppari",
  "ice-aatanahuppari",
  "amatimies-t-paita",
  "mersumies-kahvikuppi",
  "saatanan-tunarit-huppari",
];

const Index = () => {
  const { data: allProducts = [], isLoading } = useProducts();

  const carouselProducts = CAROUSEL_SLUGS
    .map(slug => allProducts.find(p => p.slug === slug || p.slug.includes(slug.replace(/-/g, ''))))
    .filter(Boolean) as typeof allProducts;

  // Dynamic categories sorted by product count (most items first)
  const categoriesWithProducts = categories
    .map(cat => ({
      ...cat,
      count: allProducts.filter(p => p.category === cat.slug).length,
    }))
    .filter(cat => cat.count > 0)
    .sort((a, b) => b.count - a.count);

  const featured = allProducts.filter(p => p.is_featured).slice(0, 8);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Huumorikauppa",
    "url": "https://huumorikauppa.fi",
    "logo": "https://huumorikauppa.fi/favicon.ico",
    "description": "Suomen hauskin verkkokauppa – hauskoja t-paitoja, huppareita, mukeja ja tarroja.",
    "address": { "@type": "PostalAddress", "addressLocality": "Helsinki", "addressCountry": "FI" },
    "email": "info@huumorikauppa.fi",
    "sameAs": [
      "https://www.instagram.com/huumorikauppa",
      "https://www.facebook.com/profile.php?id=61584153329326"
    ]
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Huumorikauppa – Hauskat t-paidat, hupparit, mukit ja tarrat"
        description="Osta hauskoja t-paitoja, huppareita, mukeja ja tarroja Suomen hauskimmasta verkkokaupasta. Ilmainen toimitus yli 60 € tilauksiin. Täydellisiä lahjoja!"
        canonical="https://huumorikauppa.fi"
        jsonLd={orgJsonLd}
      />

      {/* HERO BANNER IMAGE */}
      <section className="container pt-4 pb-2 md:pt-2 md:pb-1">
        <Link to="/kaikki-tuotteet" className="block overflow-hidden rounded-xl md:rounded-2xl">
          {/* Mobile: tall version */}
          <img
            src="/images/hero-banner.png?v=2"
            alt="Kevätale – Suosituimmat huumorituotteet nyt huippuhinnoin"
            className="w-full h-auto object-cover object-center block md:hidden"
          />
          {/* Tablet & Desktop: wide version */}
          <img
            src="/images/hero-banner-wide.png?v=3"
            alt="Kevätale – Suosituimmat huumorituotteet nyt huippuhinnoin"
            className="w-full md:w-[75%] lg:w-[65%] h-auto object-cover object-center hidden md:block mx-auto"
          />
        </Link>
      </section>

      {/* TRUST BADGES */}
      <section className="bg-muted/50 py-4 border-y border-border">
        <div className="container flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Ilmainen toimitus yli 60 €</div>
          <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" /> 14 pv palautusoikeus</div>
          <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Turvallinen maksu</div>
          <div className="flex items-center gap-2"><Flag className="h-4 w-4 text-primary" /> 100 % suomalainen yritys</div>
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
          {/* CURATED CAROUSEL */}
          {carouselProducts.length > 0 && (
            <HeroCarousel products={carouselProducts} />
          )}

          {/* CATEGORY SECTIONS – sorted by product count */}
          {categoriesWithProducts.map(cat => {
            const catProducts = allProducts
              .filter(p => p.category === cat.slug && !isCustomTextProduct(p.name, p.description))
              .sort((a, b) => getPriority(a) - getPriority(b))
              .slice(0, 4);
            return (
              <ProductSection
                key={cat.slug}
                title={`${cat.name} ${cat.emoji}`}
                linkTo={`/kategoria/${cat.slug}`}
                products={catProducts}
              />
            );
          })}

          {/* BESTSELLERIT */}
          {featured.length > 0 && (
            <ProductSection title="Bestsellerit 🏆" linkTo="/kaikki-tuotteet?filter=featured" products={featured} />
          )}
        </>
      )}

      {/* KATEGORIAT GRID */}
      <section className="container py-12 md:py-16">
        <h2 className="font-display text-2xl md:text-3xl text-foreground mb-8 text-center">
          Selaa kategorioittain 📦
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {categoriesWithProducts.map(cat => (
            <CategoryCard key={cat.slug} slug={cat.slug} name={cat.name} emoji={cat.emoji} description={`${cat.description} (${cat.count})`} />
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <ReviewsCarousel />

      {/* WHY HUUMORIKAUPPA */}
      <section className="bg-card border-y border-border py-12 md:py-16">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl text-foreground text-center mb-10">
            Miksi asiakkaat rakastavat Huumorikauppaa? 🤔
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <TrustCard icon={<Users className="h-8 w-8 text-primary" />} title="Tyytyväisiä asiakkaita" desc="Sadat suomalaiset ovat löytäneet meiltä hauskimmat tuotteet – ja palaavat aina uudelleen." />
            <TrustCard icon={<Heart className="h-8 w-8 text-accent" />} title="Helppo tilata" desc="Selkeä kauppa, turvallinen maksu ja toimitus koko Suomeen. Tilaaminen onnistuu kaikilta." />
            <TrustCard icon={<Star className="h-8 w-8 text-primary" />} title="Täydellinen lahja" desc="Vuoden paras lahja itselle tai läheiselle. Hauskuus taattu!" />
            <TrustCard icon={<ThumbsUp className="h-8 w-8 text-secondary" />} title="Custom-painatukset" desc="Haluatko oman tekstin paitaan tai mukiin? Teemme myös custom-painatuksia – ota yhteyttä!" />
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

/* ========== HERO CAROUSEL ========== */
function HeroCarousel({ products }: { products: import("@/types/product").Product[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isMobile = useIsMobile();
  const isTablet = typeof window !== "undefined" && window.innerWidth >= 768 && window.innerWidth < 1024;
  const itemsPerView = isMobile ? 2 : isTablet ? 4 : 5;
  const maxIndex = Math.max(0, products.length - itemsPerView);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, maxIndex)));
  }, [maxIndex]);

  const next = useCallback(() => {
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (isAutoPlaying) {
      intervalRef.current = setInterval(next, 4000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [isAutoPlaying, next]);

  const handleInteraction = () => {
    setIsAutoPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  return (
    <section className="container py-10 md:py-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl md:text-3xl text-foreground">Suositut tuotteet ⭐</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { handleInteraction(); prev(); }}
            className="w-9 h-9 rounded-full border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors"
            aria-label="Edellinen"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <button
            onClick={() => { handleInteraction(); next(); }}
            className="w-9 h-9 rounded-full border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors"
            aria-label="Seuraava"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
        </div>
      </div>
      <div
        className="overflow-hidden"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
        >
          {products.map(product => (
            <div
              key={product.id}
              className="shrink-0 px-2"
              style={{ width: `${100 / itemsPerView}%` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => { handleInteraction(); goTo(i); }}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentIndex ? "bg-primary w-5" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Siirry kohtaan ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

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

function TrustCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="text-center space-y-3">
      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-display text-lg text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

export default Index;
