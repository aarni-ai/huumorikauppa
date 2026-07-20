import { Link } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { categories } from "@/data/products";
import { blogPosts } from "@/data/blog";
import { municipalities } from "@/data/municipalities";
import { useProducts } from "@/hooks/use-products";
import { proxiedImage } from "@/lib/imageProxy";
import {
  Users, ThumbsUp, Heart, Star, Truck, RotateCcw, Shield,
  ChevronLeft, ChevronRight, Flag,
  MapPin, Sun, ArrowRight,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ReviewsCarousel = lazy(() => import("@/components/ReviewsCarousel").then(m => ({ default: m.ReviewsCarousel })));

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
  const { toast } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const handleNewsletterSubmit = async () => {
    if (!newsletterEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) {
      toast({ title: "Tarkista sähköpostiosoite", variant: "destructive" });
      return;
    }
    try {
      const email = newsletterEmail.trim().toLowerCase();
      await supabase.functions.invoke("subscribe-mailerlite", { body: { email } });
      await supabase.from("newsletter_subscribers").insert({ email, is_active: true });
      await supabase.functions.invoke("notify-store", { body: { email, type: "newsletter" } });
    } catch {}
    setNewsletterSubmitted(true);
    toast({ title: "Kiitos!", description: "Alennuskoodisi on HUUMORI5 (-5%)" });
  };

  const carouselProducts = CAROUSEL_SLUGS
    .map(slug => allProducts.find(p => p.slug === slug || p.slug.includes(slug.replace(/-/g, ''))))
    .filter(Boolean) as typeof allProducts;

  const categoriesWithProducts = categories
    .map(cat => ({
      ...cat,
      count: allProducts.filter(p => p.category === cat.slug).length,
    }))
    .filter(cat => cat.count > 0)
    .sort((a, b) => b.count - a.count);

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
      "https://www.wikidata.org/wiki/Q139915256",
      "https://www.instagram.com/huumorikauppa_fi",
      "https://www.tiktok.com/@huumorikauppa",
      "https://www.youtube.com/@huumorikauppa",
      "https://www.facebook.com/profile.php?id=61584153329326"
    ],
    "identifier": {
      "@type": "PropertyValue",
      "propertyID": "Finnish Business ID (Y-tunnus)",
      "value": "3583677-2"
    }
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Hauskat lahjat ja huumorituotteet | Huumorikauppa.fi"
        description={`Löydä Suomen hauskin lahja! T-paitoja, huppareita, mukeja, tarroja. Yli ${Math.floor((allProducts.length || 700) / 50) * 50} tuotetta, nopea toimitus. Tilaa helposti!`}
        canonical="https://huumorikauppa.fi"
        jsonLd={orgJsonLd}
        ogImage="https://huumorikauppa.fi/images/hero-banner-wide.png"
      />

      {/* SEASONAL BANNER */}
      <section className="container pt-3">
        <Link
          to="/kaikki-tuotteet"
          className="group flex items-center justify-center gap-2 rounded-2xl overflow-hidden text-center px-4 py-3 bg-foreground text-background transition-opacity hover:opacity-90"
        >
          <Sun className="h-4 w-4 shrink-0 opacity-80" />
          <span className="text-sm font-medium">
            Kesälahjat 2026 — Löydä hauskin lahja kesäjuhliin ja valmistujaisiin
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 opacity-60 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </section>

      {/* HERO BANNER IMAGE */}
      <section className="container pb-2 md:pb-1 pt-3">
        <Link to="/kaikki-tuotteet" className="block overflow-hidden rounded-2xl">
          <img
            src="/images/hero-banner.png?v=5"
            alt="Huumorikauppa – Hauskat t-paidat, hupparit ja mukit"
            className="w-full h-auto object-cover object-center block md:hidden"
            width={800}
            height={800}
            {...{ fetchpriority: "high" } as any}
            loading="eager"
            decoding="sync"
          />
          <img
            src="/images/hero-banner-wide.png?v=5"
            alt="Huumorikauppa – Hauskat t-paidat, hupparit ja mukit"
            className="w-full md:w-[75%] lg:w-[65%] h-auto object-cover object-center hidden md:block mx-auto"
            width={1200}
            height={600}
            {...{ fetchpriority: "high" } as any}
            loading="eager"
            decoding="sync"
          />
        </Link>
      </section>

      {/* TRUST BADGES */}
      <section className="border-y border-border py-4 mt-3">
        <div className="container flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Truck className="h-4 w-4" /> Ilmainen toimitus yli 60 €</div>
          <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4" /> 14 pv palautusoikeus</div>
          <div className="flex items-center gap-2"><Shield className="h-4 w-4" /> Turvallinen maksu</div>
          <div className="flex items-center gap-2"><Flag className="h-4 w-4" /> Kotimainen yritys</div>
        </div>
      </section>

      {/* GIFT FINDER */}
      <section className="container py-6 md:py-8">
        <h2 className="font-display text-lg md:text-xl text-foreground mb-5 text-center">
          Kenelle etsit lahjaa?
        </h2>
        <div className="flex flex-wrap gap-2.5 justify-center">
          {[
            { to: "/lahjat/miehelle",        label: "Miehelle" },
            { to: "/lahjat/naiselle",        label: "Naiselle" },
            { to: "/lahja-tyokaverille",     label: "Työkavereille" },
            { to: "/kaikki-tuotteet?max=30", label: "Alle 30 €" },
            { to: "/lahjat/joulu",           label: "Kesälahjat" },
          ].map((g) => (
            <Link
              key={g.to}
              to={g.to}
              className="px-5 py-2.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-150"
            >
              {g.label}
            </Link>
          ))}
        </div>
      </section>

      <h1 className="sr-only">Huumorikauppa.fi – Suomen hauskin lahjakauppa</h1>

      {isLoading ? (
        <section className="container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        </section>
      ) : (
        <>
          {carouselProducts.length > 0 && (
            <HeroCarousel products={carouselProducts} />
          )}

          {categoriesWithProducts.map(cat => {
            const catProducts = allProducts
              .filter(p => p.category === cat.slug && !isCustomTextProduct(p.name, p.description))
              .sort((a, b) => getPriority(a) - getPriority(b))
              .slice(0, 4);
            return (
              <ProductSection
                key={cat.slug}
                title={cat.name}
                linkTo={`/kategoria/${cat.slug}`}
                products={catProducts}
              />
            );
          })}
        </>
      )}

      {/* KAUPUNKITUOTTEET */}
      <section className="container py-10 md:py-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl md:text-3xl text-foreground">
            Kaupunkituotteet
          </h2>
          <Link to="/kaupungit" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex items-center gap-1">
            Kaikki kaupungit <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <p className="text-muted-foreground text-sm mb-6 max-w-xl">
          Hauskoja t-paitoja, huppareita ja mukeja omalle kotiseudulle – yli 50 kaupunkia.
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {municipalities.slice(0, 18).map(m => (
            <Link
              key={m.slug}
              to={`/kaupunki/${m.slug}`}
              className="group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card hover:border-foreground/20 hover:shadow-sm transition-all p-3 text-center"
            >
              <MapPin className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="font-medium text-foreground text-xs leading-tight">
                {m.name}
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-4 text-center sm:hidden">
          <Link to="/kaupungit" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Kaikki kaupungit
          </Link>
        </div>
      </section>

      {/* KATEGORIAT GRID */}
      <section className="container py-12 md:py-16">
        <h2 className="font-display text-2xl md:text-3xl text-foreground mb-2 text-center">
          Selaa kategorioita
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-8">Löydä oikea lahja — tuotteita kaikille maun mukaan.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {categoriesWithProducts.slice(0, 8).map(cat => {
            const catImg = allProducts
              .filter(p => p.category === cat.slug && p.images[0] && !isCustomTextProduct(p.name, p.description || ''))
              [0]?.images[0] || '';
            return (
              <Link
                key={cat.slug}
                to={`/kategoria/${cat.slug}`}
                className="group block"
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
                  {catImg && (
                    <img
                      src={proxiedImage(catImg) || catImg}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-sm md:text-base leading-tight">{cat.name}</h3>
                    <p className="text-white/65 text-xs mt-0.5">{cat.count} tuotetta</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <Suspense fallback={null}>
        <ReviewsCarousel />
      </Suspense>

      {/* WHY HUUMORIKAUPPA */}
      <section className="border-y border-border py-12 md:py-16 bg-muted/40">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl text-foreground text-center mb-10">
            Miksi Huumorikauppa?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <TrustCard icon={<Users className="h-5 w-5" />} title="Tyytyväisiä asiakkaita" desc="Sadat suomalaiset ovat löytäneet meiltä hauskimmat tuotteet – ja palaavat aina uudelleen." />
            <TrustCard icon={<Heart className="h-5 w-5" />} title="Helppo tilata" desc="Selkeä kauppa, turvallinen maksu ja toimitus koko Suomeen. Tilaaminen onnistuu kaikilta." />
            <TrustCard icon={<Star className="h-5 w-5" />} title="Täydellinen lahja" desc="Vuoden paras lahja itselle tai läheiselle. Hauskuus taattu!" />
            <TrustCard icon={<ThumbsUp className="h-5 w-5" />} title="Custom-painatukset" desc="Haluatko oman tekstin paitaan tai mukiin? Teemme myös custom-painatuksia – ota yhteyttä!" />
          </div>
        </div>
      </section>

      {/* LAHJAOPPAAT */}
      <section className="container py-12 md:py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl md:text-3xl text-foreground">Lahjaoppaat</h2>
          <Link to="/blogi" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:flex items-center gap-1">
            Kaikki artikkelit <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {blogPosts
            .slice()
            .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
            .slice(0, 4)
            .map(post => (
              <Link
                key={post.slug}
                to={`/blogi/${post.slug}`}
                className="group block rounded-2xl border border-border bg-card hover:border-foreground/20 hover:shadow-sm transition-all p-5"
              >
                <p className="text-xs text-muted-foreground mb-2">
                  {new Date(post.publishedAt).toLocaleDateString("fi-FI", { year: "numeric", month: "long", day: "numeric" })}
                </p>
                <h3 className="font-semibold text-foreground group-hover:text-foreground transition-colors mb-2 line-clamp-2 leading-snug text-sm">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{post.excerpt}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs text-foreground font-medium">
                  Lue artikkeli <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
        </div>
        <div className="mt-4 text-center sm:hidden">
          <Link to="/blogi" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Kaikki artikkelit</Link>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="container py-12 md:py-16">
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-center max-w-xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl text-foreground mb-3">
            Tilaa uutiskirje
          </h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Tilaa ja saat 5 % alennuskoodin ensimmäiseen tilaukseesi.
          </p>
          {newsletterSubmitted ? (
            <p className="text-foreground font-semibold">Kiitos! Alennuskoodisi on HUUMORI5</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
              <Input
                type="email"
                placeholder="anna@sahkoposti.fi"
                className="h-11 bg-muted border-border rounded-xl"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNewsletterSubmit()}
              />
              <Button
                onClick={handleNewsletterSubmit}
                className="h-11 px-6 shrink-0 rounded-xl"
              >
                Tilaa
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">Voit peruuttaa milloin vain.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6 text-center">
            Usein kysyttyä
          </h2>
          <div className="space-y-2">
            {[
              { q: "Mikä on Huumorikauppa?", a: "Huumorikauppa on suomalainen verkkokauppa, joka myy hauskoja t-paitoja, huppareita, mukeja, tarroja ja muita huumorituotteita. Designit suunnitellaan Suomessa ja jokainen tuote painetaan tilauksesta." },
              { q: "Kuinka nopeasti tilaus toimitetaan?", a: "Toimitamme tilaukset PostNordin kautta. Toimitusaika on tyypillisesti 3–10 arkipäivää. Saat sähköpostiisi seurantakoodin kun paketti on lähetetty." },
              { q: "Mikä on hauska lahja miehelle?", a: "Suosituimmat hauskat lahjat miehelle ovat huumorit-paidat, hupparit, kahvimukit ja meemitarrat. Katso valikoima kategoriasta hauskat lahjat miehelle." },
              { q: "Mikä on hauska lahja naiselle?", a: "Naisille suosituimpia ovat hauskat tekstihupparit, kahvimukit, kangaskassit ja meemipaidat. Katso lahjaideoita kategoriasta hauskat lahjat naiselle." },
              { q: "Onko toimitus ilmainen?", a: "Toimitus on ilmainen yli 60 euron tilauksille. Alle 60 euron tilauksille toimitusmaksu on 3,90 €." },
            ].map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-border bg-card px-5 py-4"
              >
                <summary className="cursor-pointer list-none font-semibold text-sm text-foreground flex items-center justify-between gap-4">
                  <span>{item.q}</span>
                  <span className="text-muted-foreground group-open:rotate-45 transition-transform duration-200 text-lg leading-none shrink-0">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Lisää vastauksia: <Link to="/usein-kysytyt-kysymykset" className="text-foreground hover:underline font-medium">Usein kysytyt kysymykset</Link>
          </p>
        </div>
      </section>

      {/* SEO COPY */}
      <section className="container py-10 md:py-12 border-t border-border">
        <article className="max-w-2xl mx-auto">
          <h2 className="font-display text-xl md:text-2xl text-foreground mb-5 text-center">
            Huumorikauppa.fi – Suomen hauskin lahjakauppa
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              Etsitkö lahjaa, joka oikeasti naurattaa? Huumorikauppa on suomalainen verkkokauppa,
              josta löydät hauskat t-paidat, hupparit, mukit ja tarrat – kaikki suunniteltu
              kotimaisella sydämellä ja vinolla huumorilla. Tuotteemme sopivat täydellisesti
              syntymäpäiviin, isänpäivään, työkavereille tai vain piristämään ihan tavallista
              keskiviikkoa.
            </p>
            <p>
              Tilaaminen on helppoa, toimitus nopea ja yli 60 € tilauksiin saat ilmaisen
              toimituksen. Jokainen paita ja muki painetaan tilauksesta, joten saat juuri sen
              tuotteen jonka valitsit – ilman ylituotantoa. Jos jokin meni pieleen, vastaamme
              henkilökohtaisesti osoitteessa <a href="mailto:huumorikauppa@gmail.com" className="text-foreground hover:underline">huumorikauppa@gmail.com</a>.
              Tervetuloa nauramaan!
            </p>
          </div>
        </article>
      </section>
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
    const update = () => setIsTouchViewport(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
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
    const observer = new IntersectionObserver(([e]) => { isInViewRef.current = e.isIntersecting; }, { threshold: 0.2 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = window.requestAnimationFrame(() => {
        isScrollingRef.current = true;
        if (scrollIdleTimeoutRef.current) clearTimeout(scrollIdleTimeoutRef.current);
        scrollIdleTimeoutRef.current = setTimeout(() => { isScrollingRef.current = false; }, 300);
        scrollRafRef.current = null;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollIdleTimeoutRef.current) clearTimeout(scrollIdleTimeoutRef.current);
      if (scrollRafRef.current !== null) window.cancelAnimationFrame(scrollRafRef.current);
    };
  }, []);

  useEffect(() => { return () => { if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current); }; }, []);

  const goTo = useCallback((index: number) => { setCurrentIndex(Math.max(0, Math.min(index, maxIndex))); }, [maxIndex]);
  const next = useCallback(() => { setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1)); }, [maxIndex]);
  const prev = useCallback(() => { setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1)); }, [maxIndex]);

  useEffect(() => {
    if (shouldUseStaticMobileLayout || !isAutoPlaying) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    intervalRef.current = setInterval(() => {
      if (!document.hidden && isInViewRef.current && !isScrollingRef.current) next();
    }, 4000);
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
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
        <h2 className="font-display text-2xl md:text-3xl text-foreground">Suositut tuotteet</h2>
        {!shouldUseStaticMobileLayout && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { handleInteraction(); prev(); }}
              className="min-h-9 min-w-9 rounded-full border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="Edellinen"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <button
              onClick={() => { handleInteraction(); next(); }}
              className="min-h-9 min-w-9 rounded-full border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors"
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
                <div key={product.id} className="shrink-0 px-2" style={{ width: `${100 / itemsPerView}%` }}>
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
                className="min-h-9 min-w-9 rounded-full transition-all flex items-center justify-center hover:bg-muted"
                aria-label={`Siirry kohtaan ${i + 1}`}
              >
                <span className={`h-1.5 rounded-full transition-all ${i === currentIndex ? "bg-foreground w-5" : "bg-border w-1.5"}`} />
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
        <Link to={linkTo} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium whitespace-nowrap flex items-center gap-1">
          Näytä kaikki <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
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
      <div className="mx-auto w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <h3 className="font-semibold text-sm text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

export default Index;
