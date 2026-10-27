import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { BlogProductStrip } from "@/components/BlogProductStrip";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { useProducts } from "@/hooks/use-products";
import { ryhmatilausPage as page } from "@/data/ryhmatilausPage";
import { BLOG_END_COUNT, BLOG_PRODUCT_THEMES, selectBlogProducts } from "@/data/blogProducts";
import { buildFaqJsonLd } from "@/seo/structuredData";
import { SITE_URL } from "@/seo/site";

const theme = BLOG_PRODUCT_THEMES.ryhmatilaus;

/** /ryhmatilaukset: ryhmätilaukset pikkujouluihin, kerhoille ja työpaikoille (sisältö src/data/ryhmatilausPage.ts). */
const GroupOrderPage = () => {
  usePrerenderReady();
  const canonical = `${SITE_URL}${page.path}`;
  const { data: allProducts, isError } = useProducts();
  const products = useMemo(
    () => (allProducts ? selectBlogProducts(theme, allProducts, BLOG_END_COUNT) : isError ? [] : null),
    [allProducts, isError],
  );

  const mailButton = (
    <a
      href={page.mailto}
      className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
    >
      <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
      Lähetä ryhmätilauksen tiedot: {page.email}
    </a>
  );

  return (
    <div className="container py-8 md:py-12">
      <SEOHead
        title={page.title}
        description={page.description}
        canonical={canonical}
        jsonLd={buildFaqJsonLd(page.faqs)}
        breadcrumbs={[
          { name: "Etusivu", url: `${SITE_URL}/` },
          { name: page.name, url: canonical },
        ]}
      />
      <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Etusivu</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{page.name}</span>
      </nav>

      <article className="max-w-3xl space-y-6 text-muted-foreground">
        <h1 className="font-display text-3xl md:text-4xl text-foreground">{page.h1}</h1>
        {page.intro.map((p, i) => (
          <p key={i} className={i === 0 ? "text-lg text-foreground font-medium" : undefined}>{p}</p>
        ))}
        {mailButton}

        {page.sections.map((s) => (
          <section key={s.heading} className="space-y-3">
            <h2 className="font-display text-2xl text-foreground">{s.heading}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {"items" in s && s.items && (
              <ul className="space-y-2 ml-1">
                {s.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5 shrink-0" aria-hidden="true">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <BlogProductStrip theme={theme} products={products} count={BLOG_END_COUNT} variant="end" />

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-foreground">Ideoita porukalle</h2>
          <div className="flex flex-wrap gap-2">
            {page.links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className="inline-flex items-center px-3 py-1.5 rounded-full border border-border text-sm hover:text-primary hover:border-primary/50 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-2xl text-foreground">Usein kysytyt kysymykset</h2>
          <dl className="space-y-4">
            {page.faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-foreground">{f.q}</dt>
                <dd className="mt-1">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {mailButton}
      </article>
    </div>
  );
};

export default GroupOrderPage;
