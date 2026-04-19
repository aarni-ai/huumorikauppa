import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Truck, RotateCcw, Shield, Flag, Heart, Star, Gift, Coffee, Shirt, Sparkles } from "lucide-react";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";

// Finnish Mother's Day 2026 = Sunday May 10, 2026 (2nd Sunday of May)
const MOTHERS_DAY = new Date("2026-05-10T00:00:00+03:00");

const MOM_KEYWORDS = [
  "äiti", "äidi", "mamma", "mummi", "mummo", "anoppi", "maailman paras äiti",
  "äitsy", "äiskä", "muori", "mom", "mama", "mutsi", "mutsu", "äippä", "memma",
  "slay queen", "queen", "girlboss", "boss lady", "diiva",
];

function isMothersDayProduct(p: { name: string; description: string; slug?: string; category: string }): boolean {
  const t = (p.name + " " + p.description + " " + (p.slug || "")).toLowerCase();
  return MOM_KEYWORDS.some(k => t.includes(k));
}

function isCustomTextProduct(name: string, description: string): boolean {
  const t = (name + " " + description).toLowerCase();
  return t.includes("oma teksti") || t.includes("oma kuva") || t.includes("custom text") || t.includes("personoi");
}

type FilterKey = "all" | "mukit" | "t-paidat" | "hupparit" | "tarrat";

const FILTERS: { key: FilterKey; label: string; emoji: string }[] = [
  { key: "all", label: "Kaikki", emoji: "🌸" },
  { key: "mukit", label: "Mukit", emoji: "☕" },
  { key: "t-paidat", label: "T-paidat", emoji: "👕" },
  { key: "hupparit", label: "Hupparit", emoji: "🧥" },
  { key: "tarrat", label: "Tarrat", emoji: "🏷️" },
];

const FAQS = [
  {
    q: "Milloin äitienpäivä on 2026?",
    a: "Äitienpäivä on sunnuntaina 10. toukokuuta 2026.",
  },
  {
    q: "Milloin pitää tilata että ehtii äitienpäiväksi?",
    a: "Tilaa viimeistään 5. toukokuuta niin ehdit varmasti. Toimitamme 3–7 arkipäivässä koko Suomeen.",
  },
  {
    q: "Mikä on paras hauska lahja äidille?",
    a: "Suosituimpia ovat hupparit ja t-paidat hauskoilla teksteillä — äiti käyttää niitä ja muistaa lahjan aina. Myös hauskat mukit ovat aina varma valinta.",
  },
  {
    q: "Toimitetaanko äitienpäiväksi?",
    a: "Kyllä! Toimitamme 3–7 arkipäivässä koko Suomeen. Yli 60 € tilauksiin toimitus on ilmainen, ja kaikilla tuotteilla on 14 päivän palautusoikeus.",
  },
  {
    q: "Sopiiko lahja myös mummille tai anopille?",
    a: "Kyllä! Huumorikaupan tuotteet sopivat erinomaisesti myös mummille, anopille tai muille tärkeille naisille elämässäsi.",
  },
];

const REVIEWS = [
  { name: "Marjut H.", text: "tilasin äidille mukin ja se nauroi puoli tuntia. Paras lahja koskaan!", rating: 5 },
  { name: "Petri S.", text: "huppari mummille viime jouluna — käyttää joka päivä. tilaan nyt äitienpäiväksi paidan.", rating: 5 },
  { name: "Sanna K.", text: "Anoppi tykkäsi! ja se ei tykkää yleensä mistään 😅 nopea toimitus", rating: 5 },
];

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const diff = target.getTime() - now.getTime();
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const hours = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));
  return { days, hours };
}

const MothersDayPage = () => {
  const { data: allProducts = [], isLoading } = useProducts();
  const [filter, setFilter] = useState<FilterKey>("all");
  usePrerenderReady(!isLoading && allProducts.length > 0);

  const baseProducts = useMemo(
    () => allProducts.filter(p => !isCustomTextProduct(p.name, p.description) && isMothersDayProduct(p)),
    [allProducts]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return baseProducts;
    return baseProducts.filter(p => p.category === filter);
  }, [baseProducts, filter]);

  const { days, hours } = useCountdown(MOTHERS_DAY);

  // Gift guide buckets
  const cheap = baseProducts.filter(p => p.price < 20).slice(0, 4);
  const mid = baseProducts.filter(p => p.price >= 20 && p.price <= 35).slice(0, 4);
  const premium = baseProducts.filter(p => p.price > 35).slice(0, 4);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Hauskat Äitienpäivälahjat 2026",
    "description":
      "Suomen parhaat hauskat äitienpäivälahjat. T-paitoja, huppareita, mukeja ja tarroja äitienpäivälahjaksi.",
    "url": "https://huumorikauppa.fi/aitienpaiva",
    "provider": {
      "@type": "Organization",
      "name": "Huumorikauppa",
      "url": "https://huumorikauppa.fi",
    },
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": baseProducts.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://huumorikauppa.fi/tuote/${p.slug}`,
        "name": p.name,
        "image": p.images[0] || "/placeholder.svg",
      })),
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  // Combine schemas via @graph
  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [collectionJsonLd, faqJsonLd],
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Hauskat Äitienpäivälahjat 2026 – Paras lahja äidille | Huumorikauppa"
        description="Älä osta kukkia – osta jotain mitä äiti oikeasti muistaa. Hauskat äitienpäivälahjat 2026: paidat, hupparit, mukit. Nopea toimitus koko Suomeen."
        canonical="https://huumorikauppa.fi/aitienpaiva"
        jsonLd={combinedJsonLd}
        ogImage={baseProducts[0]?.images[0] || "https://huumorikauppa.fi/images/hero-banner-wide.png"}
        breadcrumbs={[
          { name: "Etusivu", url: "https://huumorikauppa.fi/" },
          { name: "Äitienpäivälahjat 2026", url: "https://huumorikauppa.fi/aitienpaiva" },
        ]}
      />

      {/* HERO — soft pink/rose, modern */}
      <section
        className="relative overflow-hidden border-b border-border"
        style={{
          background:
            "linear-gradient(135deg, hsl(340 80% 96%) 0%, hsl(355 85% 92%) 50%, hsl(20 80% 94%) 100%)",
        }}
      >
        <div className="container py-12 md:py-20 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur text-sm font-medium text-rose-700 mb-4">
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            Äitienpäivä 10.5.2026
          </div>
          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl text-rose-900 mb-3 leading-tight">
            Hauskat Äitienpäivälahjat 2026 – Lahja jota äiti ei unohda
          </h1>
          <p className="text-base md:text-xl text-rose-800/80 max-w-2xl mx-auto mb-6">
            Älä osta kukkia – osta jotain mitä äiti oikeasti muistaa.
          </p>

          {/* Countdown */}
          <div className="inline-flex items-center gap-3 md:gap-4 mb-7 bg-white/80 backdrop-blur rounded-2xl px-4 md:px-6 py-3 md:py-4 shadow-sm">
            <div className="text-center">
              <div className="font-display text-2xl md:text-4xl text-rose-700 leading-none">{days}</div>
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-rose-600/80 mt-1">päivää</div>
            </div>
            <div className="h-8 md:h-10 w-px bg-rose-300/60" />
            <div className="text-center">
              <div className="font-display text-2xl md:text-4xl text-rose-700 leading-none">{hours}</div>
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-rose-600/80 mt-1">tuntia</div>
            </div>
            <div className="h-8 md:h-10 w-px bg-rose-300/60" />
            <div className="text-center px-1">
              <div className="font-display text-base md:text-xl text-rose-700 leading-tight">10.5.</div>
              <div className="text-[10px] md:text-xs uppercase tracking-wider text-rose-600/80 mt-1">2026</div>
            </div>
          </div>

          <div>
            <a href="#tuotteet">
              <Button
                size="lg"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 md:px-8"
              >
                Katso äitienpäivätuotteet →
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-muted/50 py-3 border-b border-border">
        <div className="container flex flex-wrap items-center justify-center gap-4 md:gap-10 text-xs md:text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-primary" /> Ilmainen toimitus yli 60 €</div>
          <div className="flex items-center gap-1.5"><RotateCcw className="h-4 w-4 text-primary" /> 14 pv palautusoikeus</div>
          <div className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary" /> Turvallinen maksu</div>
          <div className="flex items-center gap-1.5"><Flag className="h-4 w-4 text-primary" /> 100 % suomalainen</div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="container pt-6">
        <nav aria-label="Murupolku" className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Äitienpäivälahjat 2026</span>
        </nav>
      </div>

      {/* SEO INTRO — natural ~200 words, above products */}
      <section className="container pt-6 pb-2 max-w-3xl">
        <div className="text-muted-foreground leading-relaxed space-y-4 text-sm md:text-base">
          <p>
            Etsitkö parasta <strong>äitienpäivälahjaa</strong> vuodelle 2026? Olet oikeassa paikassa.
            Huumorikauppa on Suomen suurin valikoima hauskoja äitienpäivälahjoja — paitoja, huppareita,
            mukeja ja tarroja, joissa on persoonaa enemmän kuin keskivertokukkakimpussa. Äitienpäivä
            2026 on sunnuntaina <strong>10. toukokuuta</strong>, ja jos haluat antaa lahjan jonka äiti
            oikeasti muistaa, kannattaa unohtaa rutiininomaiset valinnat.
          </p>
          <p>
            <strong>Hauska lahja äidille</strong> jää mieleen vuosiksi — etenkin silloin kun siinä on
            oikeasti äidin näköistä huumoria. Meiltä löytyy <strong>paras äitienpäivälahja</strong> sekä
            kahvia rakastavalle mammalle, salilla käyvälle äidille että anopille jolle ei tunnu mikään
            kelpaavan. Kaikki tuotteet painetaan Suomessa ja toimitetaan nopeasti 3–7 arkipäivässä —
            ehdit siis varmasti ajoissa, jos tilaat viimeistään 5.5.2026.
          </p>
          <p>
            <strong>Ilmainen toimitus yli 60 € tilauksiin</strong> ja <strong>14 päivän palautusoikeus</strong>{" "}
            kuuluvat aina kauppaan. Selaa alta valikoima ja löydä äidillesi se täydellinen{" "}
            <strong>äitienpäivälahja 2026</strong>, joka saa hänet nauramaan ääneen — ja muistamaan sinut
            koko vuoden.
          </p>
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section id="tuotteet" className="container py-8 md:py-12 scroll-mt-20">
        <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6">
          Äitienpäivätuotteet 🌸
        </h2>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                filter === f.key
                  ? "bg-rose-600 border-rose-600 text-white"
                  : "border-border text-muted-foreground hover:border-rose-300 hover:text-rose-700"
              }`}
            >
              {f.emoji} {f.label}
              {f.key !== "all" && (
                <span className="ml-1 text-xs opacity-70">
                  ({baseProducts.filter(p => p.category === f.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Ei tuotteita tällä suodattimella 😅
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {filtered.map(product => (
              <div key={product.id} className="relative">
                <ProductCard product={product} />
                {/* Mother's Day badge — overlay top-left under existing badges */}
                <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-sm pointer-events-none">
                  Äitienpäivälahja ⭐
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SEO TEXT BLOCK — moved below products */}
      <section className="container py-8 md:py-12 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl text-foreground mb-3">
          Miksi hauska äitienpäivälahja on paras äitienpäivälahja?
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Äitienpäivä on 10. toukokuuta 2026, ja lahjan etsiminen voi tuntua haastavalta. Kukkaset ja
          suklaat ovat kauniita, mutta ne unohtuvat nopeasti. Hauska äitienpäivälahja — paita, muki tai
          tarra jossa on täydellinen teksti — jää mieleen vuosiksi. Huumorikauppa.fi on Suomen hauskin
          verkkokauppa, ja meillä on täydellinen valikoima hauskoja äitienpäivälahjoja kaikille äideille.
        </p>

        <h2 className="font-display text-2xl md:text-3xl text-foreground mb-3">
          Parhaat hauskat äitienpäivälahjat äidille
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Löydät Huumorikaupasta äitienpäivälahjoja joka makuun ja budjettiin. Hauskat mukit sopivat
          kahvia rakastavalle äidille, hauskat t-paidat ja hupparit ovat täydellisiä äideille joilla on
          huumorintajua, ja tarrat ovat hauska ja edullinen lisä muiden lahjojen kylkeen.
        </p>

        <h2 className="font-display text-2xl md:text-3xl text-foreground mb-3">
          Nopea toimitus — tilaa ajoissa
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Tilaa äitienpäivälahja ajoissa — toimitamme nopeasti koko Suomeen. Älä jää kiireeseen, vaan
          tilaa heti ja varmista että lahja saapuu ennen äitienpäivää 10.5.2026.
        </p>
      </section>

      {/* GIFT GUIDE */}
      <section className="container py-12 md:py-16">
        <h2 className="font-display text-2xl md:text-3xl text-foreground text-center mb-2">
          Lahjaopas budjetin mukaan 🎁
        </h2>
        <p className="text-center text-muted-foreground mb-8">Löydä täydellinen lahja jokaiseen budjettiin</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          <GiftGuideCard
            icon={<Coffee className="h-6 w-6" />}
            title="Alle 20 €"
            desc="Hauskat mukit ja tarrat — edulliset mutta mieleenpainuvat."
            count={cheap.length}
            link="#tuotteet"
            tone="rose"
          />
          <GiftGuideCard
            icon={<Shirt className="h-6 w-6" />}
            title="20–35 €"
            desc="Hauskat t-paidat ja pienemmät tekstiilit äidille."
            count={mid.length}
            link="#tuotteet"
            tone="pink"
          />
          <GiftGuideCard
            icon={<Sparkles className="h-6 w-6" />}
            title="Yli 35 €"
            desc="Premium-hupparit ja peitot — lämmintä luksusta äidille."
            count={premium.length}
            link="#tuotteet"
            tone="rose-dark"
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-12 md:py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl text-foreground mb-6 text-center">
          Usein kysyttyä äitienpäivälahjoista
        </h2>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details key={i} className="group border border-border rounded-lg bg-card">
              <summary className="cursor-pointer px-5 py-4 text-base font-medium text-foreground hover:bg-muted/50 transition-colors flex items-center justify-between gap-3">
                <span>{f.q}</span>
                <span className="text-rose-500 transition-transform group-open:rotate-45 text-xl leading-none">+</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="bg-muted/40 border-y border-border py-12 md:py-16">
        <div className="container max-w-5xl">
          <h2 className="font-display text-2xl md:text-3xl text-foreground text-center mb-2">
            Suomalaiset rakastavat Huumorikauppaa ❤️
          </h2>
          <p className="text-center text-muted-foreground mb-8">Yli 200 tyytyväistä asiakasarvostelua</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {REVIEWS.map((r, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center gap-0.5 mb-2 text-yellow-500">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-sm text-foreground mb-3 leading-relaxed">"{r.text}"</p>
                <div className="text-xs text-muted-foreground font-medium">— {r.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER URGENCY CTA */}
      <section
        className="py-8 md:py-10 text-center"
        style={{
          background: "linear-gradient(90deg, hsl(340 75% 55%) 0%, hsl(350 80% 60%) 100%)",
        }}
      >
        <div className="container">
          <p className="text-white font-display text-xl md:text-2xl mb-4">
            ⏰ Äitienpäivä 10.5.2026 — Tilaa ajoissa, nopea toimitus!
          </p>
          <a href="#tuotteet">
            <Button size="lg" className="bg-white text-rose-700 hover:bg-white/90 font-bold">
              Tilaa nyt <Gift className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
};

function GiftGuideCard({
  icon,
  title,
  desc,
  count,
  link,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  count: number;
  link: string;
  tone: "rose" | "pink" | "rose-dark";
}) {
  const toneStyles: Record<string, string> = {
    "rose": "bg-rose-50 border-rose-200 text-rose-700",
    "pink": "bg-pink-50 border-pink-200 text-pink-700",
    "rose-dark": "bg-rose-100 border-rose-300 text-rose-800",
  };
  return (
    <a
      href={link}
      className={`block rounded-xl border p-6 transition-all hover:scale-[1.02] hover:shadow-md ${toneStyles[tone]}`}
    >
      <div className="w-12 h-12 rounded-full bg-white/70 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-display text-xl mb-2">{title}</h3>
      <p className="text-sm opacity-80 mb-3 leading-relaxed">{desc}</p>
      <div className="text-xs font-semibold opacity-90">{count} tuotetta · Katso valikoima →</div>
    </a>
  );
}

export default MothersDayPage;
