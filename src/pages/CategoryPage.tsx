import { useParams, Link, Navigate } from "react-router-dom";
import { onPiilotettu } from "@/lib/hiddenCategories";
import { categories } from "@/data/products";
import { CATEGORY_H1, CATEGORY_H2_SECTIONS, selectCategoryProducts } from "@/data/categoryContent";
import { buildCategoryFaqs } from "@/seo/pageFaqs";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Truck, RotateCcw, Shield, Flag, CheckCircle } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOProductsContent, SEOGiftContent } from "@/components/SEOKeywordContent";
import { blogPosts } from "@/data/blog";
import { proxiedImage } from "@/lib/imageProxy";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "@/config/toimitus";

// Blog posts relevant to each category — hub & spoke internal linking
const CATEGORY_BLOG_SLUGS: Record<string, string[]> = {
  "t-paidat":       ["20-hauskinta-t-paitaa-2026", "miksi-hauska-paita-paras-lahja", "hauskat-lahjat-miehelle-naiselle-syntymapaivaLahjat"],
  "hupparit":       ["hauskat-valmistujaislahjat-2026", "parhaat-polttaripaidat-ja-polttarilahjat-2026", "parhaat-hauskat-lahjat-miehelle"],
  "mukit":          ["hauskat-mukit-toimistoon-ja-lahjaksi", "hauskat-lahjat-tyokavereille-opas", "hauska-lahja-alle-20-euroa"],
  "tarrat":         ["parhaat-hauskat-tarrat-lappariin", "hauska-lahja-nortille-ja-gamerille"],
  "bodyt":          ["hauska-vauvalahja-parhaat-bodyt"],
  "peitot":         ["hauskat-peitot-lahjaksi", "lahja-henkilolle-jolla-on-jo-kaikkea"],
  "pipot":          ["hauskat-pipot-suomi", "parhaat-joululahjat-ja-pikkujoululahjat-2026"],
  "laukut":         ["hauskat-laukut-kangaskassit", "hauskat-lahjat-naiselle-opas"],
  "seinataulut":    ["hauskat-seinataulut-sisusta-huumorilla", "lahja-henkilolle-jolla-on-jo-kaikkea"],
  "koristeet":      ["parhaat-joululahjat-ja-pikkujoululahjat-2026", "hauskat-lahjat-tyokavereille-opas"],
  "pitkahihaiset":  ["20-hauskinta-t-paitaa-2026", "miksi-hauska-paita-paras-lahja"],
};

const CategoryPage = () => {
  const { slug } = useParams();
  const category = categories.find(c => c.slug === slug);
  const { data: allProducts = [], isLoading } = useProducts();
  const products = selectCategoryProducts(allProducts, slug);

  if (onPiilotettu(slug)) return <Navigate to="/kaikki-tuotteet" replace />;

  if (!category) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl text-foreground mb-4">Kategoriaa ei löydy 😅</h1>
        <Link to="/" className="text-primary hover:underline">Takaisin etusivulle →</Link>
      </div>
    );
  }

  const otherCategories = categories.filter(c => c.slug !== slug);
  const crossLinkCategories = otherCategories
    .filter(c => allProducts.some(p => p.category === c.slug))
    .slice(0, 5);

  const relatedBlogPosts = (CATEGORY_BLOG_SLUGS[slug || ""] || [])
    .map(s => blogPosts.find(p => p.slug === s))
    .filter(Boolean) as typeof blogPosts;

  const h1Text = CATEGORY_H1[slug || ""] || `Hauskat ${category.name}`;
  const h2Sections = CATEGORY_H2_SECTIONS[slug || ""] || [];

  const breadcrumbs = [
    { name: "Etusivu", url: "https://huumorikauppa.fi/" },
    { name: category.name, url: `https://huumorikauppa.fi/kategoria/${slug}` },
  ];

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": h1Text,
    "description": category.seoDescription || category.description,
    "url": `https://huumorikauppa.fi/kategoria/${slug}`,
    "isPartOf": { "@type": "WebSite", "name": "Huumorikauppa", "url": "https://huumorikauppa.fi" },
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": products.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://huumorikauppa.fi/tuote/${p.slug}`,
        "name": p.name,
        "image": proxiedImage(p.images[0], { absolute: true }) || "/placeholder.svg",
      })),
    },
  };

  // FAQ JSON-LD — quotable answers for AI Overviews / ChatGPT / Perplexity
  const categoryFaqs = buildCategoryFaqs(category.name);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": categoryFaqs.map((f) => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  const combinedJsonLd = { "@context": "https://schema.org", "@graph": [itemListJsonLd, faqJsonLd] };

  return (
    <div className="min-h-screen">
      <SEOHead
        title={category.seoTitle || `${h1Text} | Huumorikauppa.fi`}
        description={category.seoDescription || `${category.description}. Ilmainen toimitus vähintään ${ILMAINEN_RAJA_TEKSTI} € tilauksiin!`}
        canonical={`https://huumorikauppa.fi/kategoria/${slug}`}
        jsonLd={combinedJsonLd}
        breadcrumbs={breadcrumbs}
        ogImage={proxiedImage(products[0]?.images[0], { absolute: true })}
      />

      {/* Trust bar */}
      <section className="bg-muted/50 py-3 border-b border-border">
        <div className="container flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs md:text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-primary" /> Toimitus {TOIMITUSMAKSU_TEKSTI} €, ilmainen {ILMAINEN_RAJA_TEKSTI} eurosta</div>
          <div className="flex items-center gap-1.5"><RotateCcw className="h-4 w-4 text-primary" /> 14 pv palautusoikeus</div>
          <div className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary" /> Turvallinen maksu</div>
          <div className="flex items-center gap-1.5"><Flag className="h-4 w-4 text-primary" /> 100 % suomalainen yritys</div>
        </div>
      </section>

      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{category.emoji} {category.name}</span>
        </nav>

        {/* H1 */}
        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
          {h1Text} {category.emoji}
        </h1>
        <p className="text-muted-foreground mb-4">{category.description} – {products.length} tuotetta</p>

        {/* DIRECT ANSWER BLOCK — visuaalisesti piilossa, indeksoitavissa SEO/GEO:lle */}
        <div className="sr-only" aria-hidden="false">
          <p>
            <strong>{h1Text}</strong> ovat yksi Suomen suosituimmista huumorilahjaideoista.
            Huumorikauppa.fi:stä löydät {products.length}+ erilaista hauskaa {category.name.toLowerCase()} —
            täydellisiä lahjoja töihin, kaverille, perheelle tai itsellesi. Toimitus {TOIMITUSAIKA_TEKSTI} arkipäivässä koko Suomeen,
            ilmainen {ILMAINEN_RAJA_TEKSTI} euron tilauksista alkaen.
          </p>
        </div>

        {/* Trust badges inline */}
        <div className="flex flex-wrap gap-3 mb-8 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
            <CheckCircle className="h-3.5 w-3.5" /> Varastossa
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="h-3.5 w-3.5" /> Toimitus {TOIMITUSAIKA_TEKSTI} arkipäivässä
          </span>
        </div>

        {/* Product grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!isLoading && products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">Ei tuotteita tässä kategoriassa vielä 😅</p>
          </div>
        )}

        {/* H2 SEO sections - these give Google additional headings to index */}
        {h2Sections.length > 0 && (
          <section className="mt-12 max-w-3xl space-y-6">
            {h2Sections.map((section, i) => (
              <div key={i}>
                <h2 className="font-display text-xl md:text-2xl text-foreground mb-2">{section.h2}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{section.text}</p>
              </div>
            ))}
          </section>
        )}

        {/* SEO Category Text */}
        {category.seoText && (
          <section className="mt-12 max-w-3xl">
            <div className="prose prose-sm text-muted-foreground space-y-4">
              {category.seoText.split('\n\n').map((paragraph, i) => {
                const trimmed = paragraph.trim();
                if (trimmed.startsWith('## ')) {
                  return <h2 key={i} className="font-display text-xl text-foreground mt-6 mb-2">{trimmed.replace('## ', '')}</h2>;
                }
                if (trimmed.startsWith('### ')) {
                  return <h3 key={i} className="font-semibold text-foreground mt-4 mb-1">{trimmed.replace('### ', '')}</h3>;
                }
                return <p key={i} className="text-sm leading-relaxed">{trimmed}</p>;
              })}
            </div>

            {/* Cross-links */}
            <nav className="mt-8 pt-6 border-t border-border" aria-label="Tutustu muihin kategorioihin">
              <h3 className="text-sm font-semibold text-foreground mb-3">Tutustu myös muihin kategorioihin:</h3>
              <div className="flex flex-wrap gap-2">
                {crossLinkCategories.map(cat => (
                  <Link
                    key={cat.slug}
                    to={`/kategoria/${cat.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    {cat.emoji} {cat.name}
                  </Link>
                ))}
              </div>
            </nav>
          </section>
        )}

        {/* Related blog posts — hub & spoke internal linking */}
        {relatedBlogPosts.length > 0 && (
          <section className="mt-12 max-w-3xl">
            <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Lue myös – lahjaoppaat</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedBlogPosts.map(post => (
                <Link
                  key={post.slug}
                  to={`/blogi/${post.slug}`}
                  className="group block rounded-lg border border-border bg-card hover:border-primary/50 transition-colors p-4"
                >
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors mb-1 line-clamp-2 text-sm leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  <span className="mt-2 inline-block text-xs text-primary font-medium">Lue artikkeli →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ section for category - gives Google extra headings */}
        <section className="mt-12 max-w-3xl">
          <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Usein kysyttyä – {category.name}</h2>
          <div className="space-y-4">
            {categoryFaqs.map((faq, i) => (
              <details key={i} className="group border border-border rounded-lg">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
                  {faq.q}
                </summary>
                <p className="px-4 pb-3 text-sm text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Lisää kysymyksiä? Lue <Link to="/usein-kysytyt-kysymykset" className="text-primary hover:underline">kaikki UKK:t</Link> tai kirjoita huumorikauppa@gmail.com
          </p>
        </section>
      </div>
      <SEOProductsContent />
      <SEOGiftContent />
    </div>
  );
};

export default CategoryPage;
