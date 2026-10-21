import { useLocation, Link } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { Truck, RotateCcw, Shield, Flag } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { proxiedImage } from "@/lib/imageProxy";
import { blogPosts } from "@/data/blog";
import { useProducts } from "@/hooks/use-products";
import { SEOGiftContent, SEOTargetGroupContent, SEOLongTailContent } from "@/components/SEOKeywordContent";

import { giftCategories, getGiftCategory } from "@/data/giftCategories";
import { buildGiftCategoryFaqs } from "@/seo/pageFaqs";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI } from "@/config/toimitus";

export { giftCategories, getGiftCategory };

const GiftCategoryPage = () => {
  const location = useLocation();
  const slug = location.pathname.replace(/^\//, '');
  const category = giftCategories.find(c => c.slug === slug);
  const { data: allProducts = [], isLoading } = useProducts();

  if (!category) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl text-foreground mb-4">Kategoriaa ei löydy 😅</h1>
        <Link to="/" className="text-primary hover:underline">Takaisin etusivulle →</Link>
      </div>
    );
  }

  const products = allProducts.filter(p => category.filterFn(p));
  const relatedPosts = category.relatedBlogSlugs
    .map(s => blogPosts.find(b => b.slug === s))
    .filter(Boolean);

  const breadcrumbs = [
    { name: "Etusivu", url: "https://huumorikauppa.fi/" },
    { name: category.name, url: `https://huumorikauppa.fi/${category.slug}` },
  ];

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category.h1,
    "description": category.seoDescription,
    "url": `https://huumorikauppa.fi/${category.slug}`,
    "isPartOf": { "@type": "WebSite", "name": "Huumorikauppa", "url": "https://huumorikauppa.fi" },
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": products.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://huumorikauppa.fi/tuote/${p.slug}`,
        "name": p.name,
      })),
    },
  };

  // FAQ for AI/GEO optimointi — quotable Finnish answers
  const faqs = buildGiftCategoryFaqs(category.name, products.length);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  const combinedJsonLd = { "@context": "https://schema.org", "@graph": [itemListJsonLd, faqJsonLd] };

  return (
    <div className="min-h-screen">
      <SEOHead
        title={category.seoTitle}
        description={category.seoDescription}
        canonical={`https://huumorikauppa.fi/${category.slug}`}
        jsonLd={combinedJsonLd}
        breadcrumbs={breadcrumbs}
        ogImage={proxiedImage(products[0]?.images[0], { absolute: true })}
      />

      <section className="bg-muted/50 py-3 border-b border-border">
        <div className="container flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Ilmainen toimitus yli {ILMAINEN_RAJA_TEKSTI} €</div>
          <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" /> 14 pv palautusoikeus</div>
          <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Turvallinen maksu</div>
          <div className="flex items-center gap-2"><Flag className="h-4 w-4 text-primary" /> 100 % suomalainen yritys</div>
        </div>
      </section>

      <div className="container py-8 md:py-12">
        <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{category.emoji} {category.name}</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
          {category.h1} {category.emoji}
        </h1>
        <p className="text-muted-foreground mb-4">{products.length} tuotetta</p>

        {/* DIRECT ANSWER BLOCK — visuaalisesti piilossa, indeksoitavissa SEO/GEO:lle */}
        <div className="sr-only" aria-hidden="false">
          <p>
            <strong>{category.h1}</strong> ovat yksi Suomen suosituimmista huumorilahjaideoista.
            Huumorikauppa.fi:stä löydät {products.length}+ persoonallista vaihtoehtoa — täydellisiä
            silloin, kun haluat antaa lahjan joka oikeasti naurattaa ja jää mieleen. Toimitus {TOIMITUSAIKA_TEKSTI}
            arkipäivässä koko Suomeen, ilmainen yli {ILMAINEN_RAJA_TEKSTI} € tilauksiin.
          </p>
        </div>

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
            <p className="text-xl text-muted-foreground">Tuotteita tulossa pian 😅</p>
          </div>
        )}

        {/* SEO Text */}
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
                if (trimmed.startsWith('- ')) {
                  return (
                    <ul key={i} className="space-y-1 ml-1">
                      {trimmed.split('\n').map((line, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{line.replace(/^- /, '')}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }
                return <p key={i} className="text-sm leading-relaxed">{trimmed}</p>;
              })}
            </div>
          </section>
        )}

        {/* Related blog posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-12 pt-6 border-t border-border max-w-3xl">
            <h3 className="font-display text-xl text-foreground mb-4">📝 Aiheeseen liittyvät artikkelit</h3>
            <div className="space-y-3">
              {relatedPosts.map((post) => post && (
                <Link
                  key={post.slug}
                  to={`/blogi/${post.slug}`}
                  className="block p-4 border border-border rounded-lg hover:border-primary/50 transition-colors bg-card"
                >
                  <h4 className="font-medium text-foreground hover:text-primary transition-colors mb-1">
                    {post.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Cross-link other gift categories */}
        <nav className="mt-8 pt-6 border-t border-border max-w-3xl" aria-label="Muut lahjaideat">
          <h3 className="text-sm font-semibold text-foreground mb-3">Katso myös:</h3>
          <div className="flex flex-wrap gap-2">
            {giftCategories.filter(c => c.slug !== slug).map(cat => (
              <Link
                key={cat.slug}
                to={`/${cat.slug}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
              >
                {cat.emoji} {cat.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* FAQ — näkyvä versio AI- ja Google-hakuja varten */}
        <section className="mt-12 max-w-3xl">
          <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">Usein kysyttyä – {category.name}</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <details key={i} className="group border border-border rounded-lg bg-card">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors flex items-center justify-between gap-3">
                  <span>{f.q}</span>
                  <span className="text-primary transition-transform group-open:rotate-45 text-lg leading-none">+</span>
                </summary>
                <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </section>
      </div>
      <SEOGiftContent />
      <SEOTargetGroupContent />
      <SEOLongTailContent />
    </div>
  );
};

export default GiftCategoryPage;
