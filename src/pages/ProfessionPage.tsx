import { useParams, Link, Navigate } from "react-router-dom";
import { useMemo } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Truck, RotateCcw, Shield, Flag } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/use-products";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { findProfession, professions } from "@/data/professions";
import { situationGifts } from "@/data/situationGifts";

const ProfessionPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const profession = slug ? findProfession(slug) : undefined;
  const { data: allProducts, isLoading } = useProducts();
  usePrerenderReady(!isLoading && (allProducts?.length ?? 0) > 0);

  const products = useMemo(() => {
    if (!profession || !allProducts) return [];
    const kws = profession.keywords.map((k) => k.toLowerCase());
    return allProducts
      .filter((p) => {
        const haystack = `${p.name} ${p.description ?? ""}`.toLowerCase();
        return kws.some((k) => haystack.includes(k));
      })
      .slice(0, 24);
  }, [allProducts, profession]);

  const fallbackProducts = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.slice(0, 8);
  }, [allProducts]);

  if (!profession) {
    return <Navigate to="/kaikki-tuotteet" replace />;
  }

  const canonical = `https://huumorikauppa.fi/ammatti/${profession.slug}`;

  const breadcrumbs = [
    { name: "Etusivu", url: "https://huumorikauppa.fi/" },
    { name: "Lahjaideat", url: "https://huumorikauppa.fi/kaikki-tuotteet" },
    { name: profession.h1, url: canonical },
  ];

  const displayProducts = products.length > 0 ? products : fallbackProducts;

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: profession.h1,
    numberOfItems: displayProducts.length,
    itemListElement: displayProducts.slice(0, 12).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://huumorikauppa.fi/tuote/${p.slug}`,
      name: p.name,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: profession.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [itemListJsonLd, faqJsonLd],
  };

  const relatedProfessions = professions
    .filter((p) => profession.relatedSlugs.includes(p.slug))
    .slice(0, 8);

  const popularSituations = situationGifts
    .filter((s) =>
      ["tyokaverille", "pomolle", "elakolle", "syntymapaivasankarille"].includes(s.slug)
    )
    .slice(0, 4);

  return (
    <div className="min-h-screen">
      <SEOHead
        title={profession.seoTitle}
        description={profession.seoDescription}
        canonical={canonical}
        jsonLd={combinedJsonLd}
        breadcrumbs={breadcrumbs}
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
          <Link to="/kaikki-tuotteet" className="hover:text-foreground">Lahjaideat</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{profession.emoji} {profession.h1}</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
          {profession.emoji} {profession.h1}
        </h1>

        {/* TLDR / AEO direct answer box */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-5 py-4 mb-6 max-w-2xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Vastaus lyhyesti</p>
          <p className="text-sm text-foreground leading-relaxed">{profession.tldr}</p>
        </div>

        <p className="text-muted-foreground mb-6 max-w-3xl">{profession.intro}</p>
        <p className="text-sm text-muted-foreground mb-8">{displayProducts.length} tuotetta</p>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">Tuotteita tulossa pian 😅</p>
            <Link to="/kaikki-tuotteet" className="inline-block mt-4 text-primary hover:underline">
              Selaa kaikkia tuotteita →
            </Link>
          </div>
        )}

        {/* Shirt text suggestions */}
        <section className="mt-10 p-6 bg-muted/30 rounded-xl border border-border">
          <h2 className="font-display text-xl text-foreground mb-3">
            Suosituimmat tekstit {profession.nameAllative}
          </h2>
          <ul className="space-y-2">
            {profession.shirtTexts.map((text, i) => (
              <li key={i} className="flex items-start gap-2 text-muted-foreground">
                <span className="text-primary mt-0.5">•</span>
                <span className="font-medium text-foreground">"{text}"</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Long-form SEO content */}
        <article className="prose prose-invert max-w-3xl mt-12 space-y-6 text-muted-foreground">
          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">
              Miksi hauska lahja {profession.nameAllative} toimii?
            </h2>
            <p>
              Ammattilahjat toimivat parhaiten silloin kun ne tunnistuvat — ne viittaavat ammatilliseen arkeen,
              sisäpiirihuumoriin tai työn todellisuuteen. Paita tai muki jossa on {profession.nameAllative} suunnattu
              teksti ei jää kaapin pohjalle, vaan päätyy aktiiviseen käyttöön ja saa aina positiivista huomiota.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Milloin antaa lahja?</h2>
            <p>
              Syntymäpäivä, eläkkeelle jääminen, valmistuminen tai ammatillinen saavutus ovat parhaita ajankohtia.
              Myös joululahja tai spontaani yllätys toimii — hyvä huumori ei tarvitse erityistä tilaisuutta.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Usein kysytyt kysymykset</h2>
            <dl className="space-y-4">
              {profession.faqs.map((f, i) => (
                <div key={i}>
                  <dt className="font-semibold text-foreground">{f.q}</dt>
                  <dd className="mt-1">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Top tuotevalinnat</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>T-paidat:</strong> päivittäinen käyttö, näkyvä huumori – vitsi kulkee töissä mukana.</li>
              <li><strong>Mukit:</strong> kestää vuosia, näkyy joka kahvitauolla – muistetaan aina.</li>
              <li><strong>Hupparit:</strong> mukava arkilahja jota käytetään oikeasti.</li>
            </ul>
          </section>
        </article>

        {/* Related professions */}
        {relatedProfessions.length > 0 && (
          <nav className="mt-12 pt-6 border-t border-border" aria-label="Muut ammattilahjat">
            <h2 className="font-display text-xl text-foreground mb-4">Muut ammattilahjat</h2>
            <div className="flex flex-wrap gap-2">
              {relatedProfessions.map((p) => (
                <Link
                  key={p.slug}
                  to={`/ammatti/${p.slug}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                >
                  {p.emoji} {p.h1.replace("Hauska lahja ", "")}
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* Cross-links to situation gifts */}
        <nav className="mt-8 pt-6 border-t border-border" aria-label="Lahjaideat tilanteen mukaan">
          <h2 className="font-display text-xl text-foreground mb-4">Lahjaideat tilanteen mukaan</h2>
          <div className="flex flex-wrap gap-2">
            {popularSituations.map((s) => (
              <Link
                key={s.slug}
                to={`/lahjat/${s.slug}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              >
                {s.emoji} {s.h1}
              </Link>
            ))}
            <Link
              to="/kaikki-tuotteet"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
            >
              🎁 Kaikki tuotteet
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default ProfessionPage;
