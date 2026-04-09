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
import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from "react";

const ReviewsCarousel = lazy(() => import("@/components/ReviewsCarousel").then(m => ({ default: m.ReviewsCarousel })));
const LazySEOContent = lazy(() => import("@/components/SEOKeywordContent").then(m => ({
  default: () => (
    <>
      <m.SEOHomeContent />
      <m.SEOBuyingContent />
      <m.SEODesignContent />
      <m.SEOLongTailContent />
    </>
  )
})));

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
    "email": "huumorikauppa@gmail.com",
    "sameAs": [
      "https://instagram.com/huumorikauppa.fi",
      "https://www.facebook.com/profile.php?id=61584153329326"
    ]
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Hauskat lahjat & huumorituotteet – Nopea toimitus | Huumorikauppa.fi"
        description="Löydä Suomen hauskin lahja! T-paitoja, huppareita, mukeja, tarroja. Yli 200 tuotetta, nopea toimitus. Tilaa helposti! 🎁"
        canonical="https://huumorikauppa.fi"
        jsonLd={orgJsonLd}
        ogImage="https://huumorikauppa.fi/images/hero-banner-wide.png"
      />

      {/* H1 — visually integrated with hero */}

      {/* HERO BANNER IMAGE – LCP element */}
      <section className="container pb-2 md:pb-1">
        <Link to="/kaikki-tuotteet" className="block overflow-hidden rounded-xl md:rounded-2xl">
          {/* Mobile: tall version */}
          <img
            src="/images/hero-banner.png?v=2"
            alt="Huumorikauppa kevätale – Hauskat t-paidat, hupparit ja mukit huippuhinnoin"
            className="w-full h-auto object-cover object-center block md:hidden"
            width={800}
            height={800}
            fetchPriority="high"
            loading="eager"
            decoding="sync"
          />
          {/* Tablet & Desktop: wide version */}
          <img
            src="/images/hero-banner-wide.png?v=3"
            alt="Huumorikauppa kevätale – Hauskat t-paidat, hupparit ja mukit huippuhinnoin"
            className="w-full md:w-[75%] lg:w-[65%] h-auto object-cover object-center hidden md:block mx-auto"
            width={1200}
            height={600}
            fetchPriority="high"
            loading="eager"
            decoding="sync"
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

        </>
      )}

      {/* KATEGORIAT GRID */}
      <section className="container py-12 md:py-16">
        <h2 className="font-display text-2xl md:text-3xl text-foreground mb-8 text-center">
          Etsitkö lahjaa tilaisuuteen? 📦
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {categoriesWithProducts.map(cat => (
            <CategoryCard key={cat.slug} slug={cat.slug} name={cat.name} emoji={cat.emoji} description={`${cat.description} (${cat.count})`} />
          ))}
        </div>
      </section>

      <Suspense fallback={null}>
        <ReviewsCarousel />
      </Suspense>

      {/* WHY HUUMORIKAUPPA */}
      <section className="bg-card border-y border-border py-12 md:py-16">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl text-foreground text-center mb-10">
            Miksi valita Huumorikauppa? 🤔
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
      <Suspense fallback={null}>
        <LazySEOContent />
      </Suspense>
    </div>
  );
};

/* ========== HERO CAROUSEL ========== */
function HeroCarousel({ products }: { products: import("@/types/product").Product[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const isScrollingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const interactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const isInViewRef = useRef(true);
  const sectionRef = useRef<HTMLElement>(null);

  const isMobile = useIsMobile();
  const [isTouchViewport, setIsTouchViewport] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 1023px), (pointer: coarse)");
    const updateTouchViewport = () => setIsTouchViewport(mediaQuery.matches);

    updateTouchViewport();
    mediaQuery.addEventListener("change", updateTouchViewport);

    return () => mediaQuery.removeEventListener("change", updateTouchViewport);
  }, []);

  const isTablet = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  }, [isMobile]);

  const itemsPerView = isMobile ? 2 : isTablet ? 4 : 5;
  const maxIndex = Math.max(0, products.length - itemsPerView);
  const shouldUseStaticMobileLayout = isTouchViewport || isMobile;

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewRef.current = entry.isIntersecting;
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onScroll = () => {
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = window.requestAnimationFrame(() => {
        isScrollingRef.current = true;

        if (scrollIdleTimeoutRef.current) {
          clearTimeout(scrollIdleTimeoutRef.current);
        }

        scrollIdleTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
        }, 300);

        scrollRafRef.current = null;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollIdleTimeoutRef.current) clearTimeout(scrollIdleTimeoutRef.current);
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
    };
  }, []);

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
    if (shouldUseStaticMobileLayout || !isAutoPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (!document.hidden && isInViewRef.current && !isScrollingRef.current) {
        next();
      }
    }, 4000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAutoPlaying, next, shouldUseStaticMobileLayout]);

  const handleInteraction = () => {
    if (shouldUseStaticMobileLayout) return;

    setIsAutoPlaying(false);
    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
    interactionTimeoutRef.current = setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  return (
    <section ref={sectionRef} className="container py-10 md:py-14" style={{ contain: 'layout paint', willChange: 'auto' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl md:text-3xl text-foreground">Suositut tuotteet ⭐</h2>
        {!shouldUseStaticMobileLayout && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { handleInteraction(); prev(); }}
              className="min-h-11 min-w-11 rounded-full border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="Edellinen"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <button
              onClick={() => { handleInteraction(); next(); }}
              className="min-h-11 min-w-11 rounded-full border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="Seuraava"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </div>
        )}
      </div>
      {shouldUseStaticMobileLayout ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 touch-pan-x snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-3">
            {products.map(product => (
              <div key={product.id} className="w-[78vw] max-w-[320px] shrink-0 snap-start sm:w-[46vw]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div
            className="overflow-hidden touch-pan-y"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            <div
              className="flex ease-out will-change-transform [transform:translateZ(0)] [backface-visibility:hidden] transition-transform duration-500"
              style={{ transform: `translate3d(-${currentIndex * (100 / itemsPerView)}%,0,0)` }}
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
                className={`min-h-11 min-w-11 rounded-full transition-all flex items-center justify-center ${
                  i === currentIndex ? "bg-primary/15" : "hover:bg-muted"
                }`}
                aria-label={`Siirry kohtaan ${i + 1}`}
              >
                <span
                  className={`h-2 w-2 rounded-full transition-all ${
                    i === currentIndex ? "bg-primary w-5" : "bg-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
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
