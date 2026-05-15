import { useParams, Link, Navigate } from "react-router-dom";
import { useMemo } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Truck, RotateCcw, Shield, Flag } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/use-products";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import {
  findSituation,
  filterProductsForSituation,
  situationGifts,
} from "@/data/situationGifts";
import type { SituationGift } from "@/data/situationGifts";
import { generateGiftGuideContent } from "@/lib/giftGuideContent";
import { categories } from "@/data/products";
import { generateTitleVariants } from "@/lib/seoTitleEnhancer";

const SituationGiftPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const situation = slug ? findSituation(slug) : undefined;
  const { data: allProducts, isLoading } = useProducts();
  usePrerenderReady(!isLoading && (allProducts?.length ?? 0) > 0);

  const products = useMemo(() => {
    if (!situation || !allProducts) return [];
    return filterProductsForSituation(allProducts, situation).slice(0, 24);
  }, [allProducts, situation]);

  if (!situation) {
    return <Navigate to="/" replace />;
  }

  const canonical = `https://huumorikauppa.fi/lahjat/${situation.slug}`;

  const breadcrumbs = [
    { name: "Etusivu", url: "https://huumorikauppa.fi/" },
    { name: "Lahjaideat", url: "https://huumorikauppa.fi/kaikki-tuotteet" },
    { name: situation.h1, url: canonical },
  ];

  const guide = generateGiftGuideContent(situation);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: situation.h1,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 12).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://huumorikauppa.fi/tuote/${p.slug}`,
      name: p.name,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const combinedJsonLd = { "@context": "https://schema.org", "@graph": [itemListJsonLd, faqJsonLd] };

  const linkedCategories = (situation.categories || [])
    .map(slug => categories.find(c => c.slug === slug))
    .filter((c): c is (typeof categories)[number] => Boolean(c));

  const otherSituations = situationGifts.filter(s => s.slug !== situation.slug).slice(0, 12);

  // Authority hub: top 8 most useful gift guides for cross-linking
  const popularHubs = [
    "miehelle",
    "naiselle",
    "tyokaverille",
    "pomolle",
    "joulu",
    "pikkujouluihin",
    "alle-20-euroa",
    "polttareihin",
  ]
    .filter(slug => slug !== situation.slug)
    .map(slug => situationGifts.find(s => s.slug === slug))
    .filter((s): s is SituationGift => Boolean(s))
    .slice(0, 8);

  // 3-step gift decision logic — appended only, never replaces existing copy
  const decisionSteps = [
    `1. Mieti vastaanottaja: harrastus, ammatti tai sisäpiirin vitsi (${situation.h1.toLowerCase()}).`,
    "2. Valitse tuotemuoto: paita arkikäyttöön, muki työpöydälle, huppari rentoon päivään.",
    "3. Tarkista koko ja toimitusaika – tilaa 7 arkipäivää ennen lahjapäivää.",
  ];

  // FAQ enhancement layer — only adds if guide has fewer than 5 FAQs
  const extraFaqs = [
    { q: "Voiko lahjan saada nimettömänä?", a: "Kyllä – emme lähetä lähettäjän tietoja paketin mukana, joten yllätyslahja pysyy yllätyksenä." },
    { q: "Mitä jos koko on väärä?", a: "Vaihdamme tai palautamme tuotteen 14 päivän sisällä – pidä alkuperäinen pakkaus mukana." },
    { q: "Soveltuuko tämä lahjaksi viime hetkellä?", a: "Tilaa arkena ennen klo 12, niin tilaus lähtee yleensä samana päivänä. Toimitus 3–10 arkipäivää." },
  ];
  const mergedFaqs = guide.faqs.length < 5
    ? [...guide.faqs, ...extraFaqs.slice(0, 5 - guide.faqs.length)]
    : guide.faqs;

  // SEO title alternates (suggestions only — primary title remains unchanged)
  const targetForTitle = situation.h1.replace(/^Hauskat lahjat\s*/i, "");
  const titleAlternates = generateTitleVariants({ target: targetForTitle, kind: "gift" });

  return (
    <div className="min-h-screen">
      <SEOHead
        title={situation.seoTitle}
        description={situation.seoDescription}
        canonical={canonical}
        jsonLd={combinedJsonLd}
        breadcrumbs={breadcrumbs}
        ogImage={products[0]?.images[0]}
      />
      {/* SEO: alternateName signals additional title variants without replacing the primary title */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            url: canonical,
            name: situation.seoTitle,
            alternateName: titleAlternates,
          }),
        }}
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
          <span className="text-foreground">{situation.emoji} {situation.h1}</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
          {situation.emoji} {situation.h1}
        </h1>
        <p className="text-muted-foreground mb-6 max-w-3xl">{guide.intro}</p>
        <p className="text-sm text-muted-foreground mb-8">{products.length} tuotetta</p>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map(product => (
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

        {/* Long-form SEO content – unique per situation */}
        <article className="prose prose-invert max-w-3xl mt-12 space-y-6 text-muted-foreground">
          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Miksi hauska lahja kannattaa?</h2>
            <p>{guide.whyChoose}</p>
          </section>
          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Kuinka valita oikea lahja</h2>
            <p>{guide.howToChoose}</p>
          </section>
          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Suosituimmat valinnat</h2>
            <p>{guide.popular}</p>
          </section>
          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Toimitus ja palautus</h2>
            <p>{guide.shippingTrust}</p>
          </section>
          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Usein kysytyt kysymykset</h2>
            <dl className="space-y-4">
              {mergedFaqs.map((f, i) => (
                <div key={i}>
                  <dt className="font-semibold text-foreground">{f.q}</dt>
                  <dd className="mt-1">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Lahjan valintaopas – 3 askelta</h2>
            <ol className="space-y-2 list-decimal pl-5">
              {decisionSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </section>
          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Miksi tämä toimii</h2>
            <p>
              Hauskat lahjat aktivoivat tunnemuistia paremmin kuin yleisluontoiset tuotteet. Kun lahja viittaa
              vastaanottajan arkeen, ammattiin tai harrastukseen, se ei jää kaapin pohjalle vaan päätyy aktiiviseen
              käyttöön. Juuri tämä erottaa onnistuneen lahjan persoonattomasta lahjakortista.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl text-foreground mb-3">Top-valinnat – miksi nämä toimivat</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>T-paidat:</strong> näkyvä huumori, päivittäinen käyttö – vitsi kulkee mukana.</li>
              <li><strong>Mukit:</strong> kestää vuosia, näkyy joka kahvitauolla työpaikalla.</li>
              <li><strong>Hupparit:</strong> mukava, pidetty asuste – arvostetaan myös arkilahjana.</li>
            </ul>
          </section>
        </article>

        {/* Suosituimmat lahjaoppaat — internal authority graph */}
        <nav className="mt-12 pt-6 border-t border-border" aria-label="Suosituimmat lahjaoppaat">
          <h2 className="font-display text-xl text-foreground mb-4">Suosituimmat lahjaoppaat</h2>
          <div className="flex flex-wrap gap-2">
            {popularHubs.map(s => (
              <Link
                key={s.slug}
                to={`/lahjat/${s.slug}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              >
                {s.emoji} {s.h1}
              </Link>
            ))}
          </div>
        </nav>

        {/* Katso myös — backlink-asset cross-promo */}
        <nav className="mt-8 pt-6 border-t border-border" aria-label="Katso myös">
          <h2 className="font-display text-xl text-foreground mb-4">Katso myös</h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/suomalaiset-tyopaikkameemit-top-50" className="px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/50 transition">😂 Suomalaiset työpaikkameemit – TOP 50</Link>
            <Link to="/hauskimmat-tyopaikkalaput-2026" className="px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/50 transition">📋 Hauskimmat työpaikkalaput 2026</Link>
            <Link to="/blogi" className="px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/50 transition">📰 Lahjaopas-blogi</Link>
            <Link to="/tietoa-meista" className="px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/50 transition">ℹ️ Tietoa meistä</Link>
          </div>
        </nav>

        {/* Hide the original closing </article> below — keep DOM tree valid */}
        <article className="hidden">
        </article>

        {/* Internal linking: related categories */}
        {linkedCategories.length > 0 && (
          <nav className="mt-12 pt-6 border-t border-border" aria-label="Liittyvät kategoriat">
            <h2 className="font-display text-xl text-foreground mb-4">Selaa kategorioita</h2>
            <div className="flex flex-wrap gap-2">
              {linkedCategories.map(c => (
                <Link
                  key={c.slug}
                  to={`/kategoria/${c.slug}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                >
                  {c.emoji} {c.name}
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* Cross-link other situation gifts */}
        <nav className="mt-12 pt-6 border-t border-border" aria-label="Muut lahjaideat tilanteen mukaan">
          <h2 className="font-display text-xl text-foreground mb-4">Lahjaideat eri tilanteisiin 🎁</h2>
          <div className="flex flex-wrap gap-2">
            {otherSituations.map(s => (
              <Link
                key={s.slug}
                to={`/lahjat/${s.slug}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              >
                {s.emoji} {s.h1.replace(/^Hauskat lahjat /, "")}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default SituationGiftPage;