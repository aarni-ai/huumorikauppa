import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Truck, RotateCcw, CalendarClock } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/use-products";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { proxiedImage } from "@/lib/imageProxy";
import { getLandingPage, LANDING_GRID_LIMIT, selectLandingProducts } from "@/data/landingPages";
import { CHRISTMAS_DEADLINE_PATH } from "@/data/christmas";
import {
  buildLandingJsonLd,
  landingBreadcrumbs,
  landingCategoryLinks,
  landingRelatedLinks,
} from "@/seo/landing";
import { SITE_URL } from "@/seo/site";
import NotFound from "./NotFound";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI } from "@/config/toimitus";

const chip =
  "inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors";

const LandingPage = () => {
  const { pathname } = useLocation();
  const page = getLandingPage(pathname);
  const { data: allProducts, isLoading } = useProducts();
  usePrerenderReady(!isLoading && (allProducts?.length ?? 0) > 0);

  const products = useMemo(
    () => (page && allProducts ? selectLandingProducts(page, allProducts) : []),
    [page, allProducts],
  );

  const jsonLd = useMemo(() => {
    if (!page) return undefined;
    const items = buildLandingJsonLd(page, products).map(({ ["@context"]: _ctx, ...rest }) => rest);
    return { "@context": "https://schema.org", "@graph": items };
  }, [page, products]);

  if (!page) return <NotFound />;

  const canonical = `${SITE_URL}${page.path}`;
  const breadcrumbs = landingBreadcrumbs(page);
  const related = landingRelatedLinks(page);
  const categoryLinks = landingCategoryLinks(page);
  const shown = products.slice(0, LANDING_GRID_LIMIT);

  return (
    <div className="min-h-screen">
      <SEOHead
        title={page.title}
        description={page.description}
        canonical={canonical}
        jsonLd={jsonLd}
        breadcrumbs={breadcrumbs}
        ogImage={proxiedImage(products[0]?.images[0], { absolute: true })}
      />

      <section className="bg-muted/50 py-3 border-b border-border">
        <div className="container flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Toimitus {TOIMITUSAIKA_TEKSTI} arkipäivää, ilmainen yli {ILMAINEN_RAJA_TEKSTI} €</div>
          <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" /> 14 päivän peruutusoikeus</div>
          {page.group === "joulu" && (
            <Link to={CHRISTMAS_DEADLINE_PATH} className="flex items-center gap-2 hover:text-foreground">
              <CalendarClock className="h-4 w-4 text-primary" /> Joulun viimeiset tilauspäivät
            </Link>
          )}
        </div>
      </section>

      <div className="container py-8 md:py-12">
        <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
          {breadcrumbs.map((b, i) => {
            const href = b.url.replace(SITE_URL, "") || "/";
            const last = i === breadcrumbs.length - 1;
            return (
              <span key={b.url}>
                {i > 0 && <span className="mx-2">/</span>}
                {last ? (
                  <span className="text-foreground">{b.name}</span>
                ) : (
                  <Link to={href} className="hover:text-foreground">{b.name}</Link>
                )}
              </span>
            );
          })}
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">{page.h1}</h1>
        <div className="max-w-3xl space-y-3 text-muted-foreground mb-6">
          {page.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <h2 className="font-display text-xl text-foreground mb-4">
          Tuotteet{!isLoading && products.length > 0 ? ` (${products.length})` : ""}
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : shown.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {shown.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-10">
            Tuotteita ei juuri nyt löytynyt. <Link to="/kaikki-tuotteet" className="text-primary hover:underline">Selaa kaikkia tuotteita</Link>.
          </p>
        )}
        {products.length > shown.length && (
          <p className="mt-6 text-sm text-muted-foreground">
            Näytetään {shown.length} / {products.length} tuotetta.{" "}
            {categoryLinks[0] && (
              <Link to={categoryLinks[0].href} className="text-primary hover:underline">
                Katso kaikki: {categoryLinks[0].label}
              </Link>
            )}
          </p>
        )}

        <section className="max-w-3xl mt-12">
          <h2 className="font-display text-2xl text-foreground mb-4">Usein kysytyt kysymykset</h2>
          <dl className="space-y-4 text-muted-foreground">
            {page.faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-foreground">{f.q}</dt>
                <dd className="mt-1">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {related.length > 0 && (
          <nav className="mt-12 pt-6 border-t border-border" aria-label="Lisää lahjaideoita">
            <h2 className="font-display text-xl text-foreground mb-4">Lisää lahjaideoita</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((l) => (
                <Link key={l.href} to={l.href} className={chip}>
                  {l.label}
                </Link>
              ))}
              {(page.extraLinks ?? []).map((l) => (
                <Link key={l.href} to={l.href} className={chip}>
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        )}

        {categoryLinks.length > 0 && (
          <nav className="mt-8 pt-6 border-t border-border" aria-label="Tuotekategoriat">
            <h2 className="font-display text-xl text-foreground mb-4">Tuotekategoriat</h2>
            <div className="flex flex-wrap gap-2">
              {categoryLinks.map((l) => (
                <Link key={l.href} to={l.href} className={chip}>
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
