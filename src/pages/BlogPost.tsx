import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { ProductCard } from "@/components/ProductCard";
import { BLOG_VASTAUKSET } from "@/data/blogVastaukset";
import { kirjaaBlogi } from "@/lib/blogiseuranta";
import { useCartContext } from "@/context/CartContext";
import { JOULU_PAIVA_LYHYT, JOULU_LAHJAKORTTI_TEKSTI, jouluAuki } from "@/data/tilauspaivat";
import { JoulunLahjakorttiKortti, useJoulunLahjakorttiAika } from "@/components/JoulunLahjakortti";
import type { Product } from "@/types/product";
import { revealApp } from "@/lib/prerenderPreview";
import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { blogPosts } from "@/data/blog";
import { DEFAULT_BLOG_FAQS } from "@/seo/pageFaqs";
import { categories } from "@/data/products";
import { onKategoriasivu } from "@/lib/hiddenCategories";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { ShoppingBag } from "lucide-react";
import { GuideProductRecommendations } from "@/components/GuideProductRecommendations";
import { BlogProductStrip } from "@/components/BlogProductStrip";
import { abVersio } from "@/lib/abTestit";
import { YritysNosto } from "@/components/YritysNosto";
import { onYritysNostoBlogi } from "@/data/yritysNostot";
import { NewsletterBoxLazy } from "@/components/NewsletterBoxLazy";
import { useProducts } from "@/hooks/use-products";
import {
  BLOG_END_COUNT,
  BLOG_MID_COUNT,
  blogMidInsertLine,
  getBlogProductTheme,
  selectBlogProducts,
  splitBlogProducts,
} from "@/data/blogProducts";
import { buildBlogPostJsonLd, blogImageUrl } from "@/lib/blogJsonLd";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "@/config/toimitus";

/** Tekstin tuotelinkkien slugit ([nimi](/tuote/slug)). */
const tuoteSlugit = (teksti: string) => [...teksti.matchAll(/\]\(\/tuote\/([a-z0-9-]+)\)/g)].map((m) => m[1]);

/**
 * Tekstin tuotekortit (24.11.2026): jokainen tekstissä mainittu tuote näkyy kappaleen tai listan perässä klikattavana
 * korttina, jossa on kuva, hinta ja "Lisää koriin". Kukin tuote kerran artikkelia kohden (naytetyt).
 */
function tekstinKortit(teksti: string, tuotteet: Map<string, Product> | null, naytetyt: Set<string>, avain: string): JSX.Element | null {
  if (!tuotteet) return null;
  const kortit = tuoteSlugit(teksti).filter((s) => !naytetyt.has(s) && tuotteet.has(s));
  if (!kortit.length) return null;
  for (const s of kortit) naytetyt.add(s);
  return (
    <div key={avain} className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 not-prose">
      {kortit.map((s) => <ProductCard key={s} product={tuotteet.get(s)!} lisaaKoriinNappi />)}
    </div>
  );
}

/** Artikkelin teksti; midBlock (tuotenosto) lisätään blogMidInsertLine-riville (kahden osion jälkeen). */
function renderContent(content: string, midBlock: ReactNode, tuotteet: Map<string, Product> | null = null, naytetyt: Set<string> = new Set()) {
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  const midLine = blogMidInsertLine(content);

  const flushList = () => {
    if (listItems.length > 0) {
      const kortit = tekstinKortit(listItems.join("\n"), tuotteet, naytetyt, `kortit-lista-${elements.length}`);
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-2 ml-1 my-4">
          {listItems.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm">
              <span className="text-primary mt-0.5 shrink-0">•</span>
              <span>{renderInlineFormatting(item)}</span>
            </li>
          ))}
        </ul>
      );
      if (kortit) elements.push(kortit);
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (i === midLine) {
      flushList();
      elements.push(<div key="blog-mid-products">{midBlock}</div>);
    }

    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={i} className="font-display text-xl md:text-2xl text-foreground mt-8 mb-3">
          {trimmed.replace("## ", "")}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={i} className="font-semibold text-lg text-foreground mt-6 mb-2">
          {trimmed.replace("### ", "")}
        </h3>
      );
    } else if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.replace(/^- /, ""));
    } else {
      flushList();
      elements.push(
        <p key={i} className="text-sm leading-relaxed my-3">
          {renderInlineFormatting(trimmed)}
        </p>
      );
      const kortit = tekstinKortit(trimmed, tuotteet, naytetyt, `kortit-${i}`);
      if (kortit) elements.push(kortit);
    }
  }
  flushList();
  if (midLine >= lines.length) elements.push(<div key="blog-mid-products">{midBlock}</div>);
  return elements;
}

function renderInlineFormatting(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = [];
  // Matches **bold** OR [label](url)
  const regex = /\*\*(.*?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      parts.push(
        <strong key={match.index} className="font-semibold text-foreground">
          {match[1]}
        </strong>
      );
    } else {
      const href = match[3];
      const isExternal = /^https?:\/\//.test(href);
      parts.push(
        <a
          key={match.index}
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-primary underline hover:text-primary/80 transition-colors"
        >
          {match[2]}
        </a>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

const BlogPost = () => {
  usePrerenderReady();
  // Blogiartikkeli hydratoidaan esirenderöidystä merkinnästä (renderPreview.tsx renderBlogApp); revealApp ei tee mitään
  // ilman esikatselua. Säilytetään varalle, jos esikatselu palautetaan:
  // ensimmäistä maalausta: sama näkymä, tuotekortit täydentyvät haun jälkeen.
  useLayoutEffect(() => {
    revealApp();
  }, []);
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);
  const { data: allProducts, isError } = useProducts();
  const productTheme = getBlogProductTheme(slug ?? "");
  const blogProducts = useMemo(
    () => (allProducts ? selectBlogProducts(productTheme, allProducts) : null),
    [allProducts, productTheme],
  );
  // Tuotteet slugin mukaan: tekstin tuotekortit (vain myynnissä olevat, joilla on hinta).
  const tuotteetSlugilla = useMemo(
    () => (allProducts ? new Map(allProducts.filter((p) => p.price > 0).map((p) => [p.slug, p as Product])) : null),
    [allProducts],
  );
  // Blogien konversioseuranta (src/lib/blogiseuranta.ts): näyttö kerran, koriin lisäys blogisivulla.
  const { lastAddedItem } = useCartContext();
  const ensimmainenLisays = useRef(lastAddedItem);
  useEffect(() => { if (slug && post) kirjaaBlogi("naytto", slug); }, [slug, post]);
  useEffect(() => {
    if (lastAddedItem && lastAddedItem !== ensimmainenLisays.current && slug) kirjaaBlogi("kori", slug);
  }, [lastAddedItem, slug]);

  if (!post) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl text-foreground mb-4">Artikkelia ei löydy 😅</h1>
        <Link to="/blogi" className="text-primary hover:underline">
          Takaisin blogiin →
        </Link>
      </div>
    );
  }

  // Smart related posts: match by shared tags, then category, limit to 5
  const relatedPosts = blogPosts
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const sharedTags = p.tags.filter((t) => post.tags.includes(t)).length;
      const sameCategory = p.category === post.category ? 1 : 0;
      return { ...p, score: sharedTags * 2 + sameCategory };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const relatedCats = post.relatedCategories
    .filter((slug) => onKategoriasivu(slug))
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter(Boolean)
    .slice(0, 2);

  // Per-post FAQ overrides the generic set when the post defines its own.
  const blogFaqs = post.faq && post.faq.length > 0 ? post.faq : DEFAULT_BLOG_FAQS;

  // Ladattaessa varataan korttien tila; jos haku epäonnistuu, lohkot jätetään pois.
  const ideatEnsin = abVersio("blogi") === "b";
  // Top 3 (24.11.2026): kolme ensimmäistä teeman tuotetta H1:n alle; muut nostot niiden jälkeen.
  const top3 = blogProducts ? blogProducts.slice(0, 3) : null;
  // Joulun lahjakorttiaika 3.12.-26.12. (src/data/tilauspaivat.ts): lahjakortti Top 3:n ensimmäiseksi.
  const joulunLahjakortti = useJoulunLahjakorttiAika();
  const split = blogProducts ? splitBlogProducts(blogProducts.slice(3)) : null;
  const naytetyt = new Set<string>((top3 || []).map((p) => p.slug));
  const midProducts = split ? split.mid : isError ? [] : null;
  const endProducts = split ? split.end : isError ? [] : null;
  const combinedJsonLd = buildBlogPostJsonLd(post, blogFaqs, split ? [...(top3 || []), ...split.mid, ...split.end.filter((p) => !split.mid.includes(p))] : []);

  return (
    <div className="min-h-screen">
      <SEOHead
        title={post.metaTitle}
        description={post.metaDescription}
        canonical={`https://huumorikauppa.fi/blogi/${post.slug}`}
        jsonLd={combinedJsonLd}
        ogType="article"
        ogImage={blogImageUrl(post.image)}
        articlePublishedTime={post.publishedAt}
        articleModifiedTime={post.updatedAt}
        breadcrumbs={[
          { name: "Etusivu", url: "https://huumorikauppa.fi/" },
          { name: "Blogi", url: "https://huumorikauppa.fi/blogi" },
          { name: post.title, url: `https://huumorikauppa.fi/blogi/${post.slug}` },
        ]}
      />

      <article className="container py-8 md:py-12 max-w-3xl">
        <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <Link to="/blogi" className="hover:text-foreground">Blogi</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground line-clamp-1">{post.title}</span>
        </nav>

        <header className="mb-8">
          {/* Avainsanat vain työpöydällä: mobiilissa ne työnsivät artikkelin ja tuotteet alemmas. */}
          <div className="hidden md:flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="font-display text-2xl md:text-4xl text-foreground mb-3">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <time dateTime={post.publishedAt}>
              Julkaistu{" "}
              {new Date(post.publishedAt).toLocaleDateString("fi-FI", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {post.updatedAt !== post.publishedAt && (
              <time dateTime={post.updatedAt}>
                Päivitetty{" "}
                {new Date(post.updatedAt).toLocaleDateString("fi-FI", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            )}
          </div>
        </header>

        {/* A/B-testi blogi (src/lib/abTestit.ts): versio b näyttää artikkelin tuoteideat heti otsikon alla, koska
            blogista tuleva kävijä hakee ideoita; versio a tekstin keskellä kuten ennen. */}
        {/* Suora vastaus ja Top 3 heti H1:n alle (24.11.2026, AEO ja konversio). */}
        <section aria-label="Lyhyt vastaus ja suosituimmat" className="mb-8"
          onClickCapture={(e) => { if ((e.target as HTMLElement).closest?.('a[href^="/tuote/"]')) kirjaaBlogi("tuote", post.slug); }}>
          {BLOG_VASTAUKSET[post.slug] && (
            <p className="text-base leading-relaxed text-foreground border-l-4 border-primary pl-4 mb-5">{BLOG_VASTAUKSET[post.slug]}</p>
          )}
          {top3 && top3.length > 0 && (
            <>
              <h2 className="font-display text-lg text-foreground mb-3">Top 3</h2>
              {joulunLahjakortti && <p className="text-sm font-semibold text-foreground mb-3">{JOULU_LAHJAKORTTI_TEKSTI}.</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {joulunLahjakortti && <JoulunLahjakorttiKortti />}
                {(joulunLahjakortti ? top3.slice(0, 2) : top3).map((p) => <ProductCard key={p.slug} product={p as Product} lisaaKoriinNappi />)}
              </div>
            </>
          )}
        </section>

        {ideatEnsin && <BlogProductStrip theme={productTheme} products={midProducts} count={BLOG_MID_COUNT} variant="mid" />}

        <div className="text-muted-foreground"
          onClickCapture={(e) => { if ((e.target as HTMLElement).closest?.('a[href^="/tuote/"]')) kirjaaBlogi("tuote", post.slug); }}>
          {renderContent(
            post.content,
            ideatEnsin ? null : <BlogProductStrip theme={productTheme} products={midProducts} count={BLOG_MID_COUNT} variant="mid" />,
            tuotteetSlugilla,
            naytetyt,
          )}
        </div>

        <BlogProductStrip theme={productTheme} products={endProducts} count={BLOG_END_COUNT} variant="end" />

        {onYritysNostoBlogi(post.slug) && <YritysNosto className="mt-8" />}

        {/* Hand-picked product links — internal linking to specific products */}
        {post.productLinks && post.productLinks.length > 0 && (
          <section className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="h-5 w-5 text-primary shrink-0" />
              <h3 className="font-display text-lg text-foreground">Suosittelemme näitä tuotteita</h3>
            </div>
            <ul className="space-y-2">
              {post.productLinks.map((pl) => (
                <li key={pl.slug}>
                  <Link
                    to={`/tuote/${pl.slug}`}
                    className="text-primary underline hover:text-primary/80 transition-colors text-sm"
                  >
                    {pl.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Age-grouped product recommendations (gift guides) */}
        <GuideProductRecommendations guideSlug={post.slug} />

        {/* Inline product CTA — category cards after article body */}
        {relatedCats.length > 0 && (
          <section className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="h-5 w-5 text-primary shrink-0" />
              <h3 className="font-display text-lg text-foreground">Osta tämä lahja Huumorikaupasta</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedCats.map((cat) =>
                cat ? (
                  <Link
                    key={cat.slug}
                    to={`/kategoria/${cat.slug}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card hover:border-primary/60 hover:bg-muted/50 transition-colors p-3"
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <div>
                      <p className="font-medium text-foreground text-sm">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">Selaa tuotteita →</p>
                    </div>
                  </Link>
                ) : null
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Ilmainen toimitus kahdesta tuotteesta tai {ILMAINEN_RAJA_TEKSTI} eurosta, muuten {TOIMITUSMAKSU_TEKSTI} € · 14 pv palautusoikeus · Toimitus {TOIMITUSAIKA_TEKSTI} arkipäivässä
            </p>
          </section>
        )}

        {/* Related categories (pill nav) */}
        {relatedCats.length > 0 && (
          <nav className="mt-8 pt-6 border-t border-border" aria-label="Aiheeseen liittyvät kategoriat">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Selaa aiheeseen liittyviä tuotteita:
            </h3>
            <div className="flex flex-wrap gap-2">
              {relatedCats.map((cat) =>
                cat ? (
                  <Link
                    key={cat.slug}
                    to={`/kategoria/${cat.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    {cat.emoji} {cat.name}
                  </Link>
                ) : null
              )}
            </div>
          </nav>
        )}

        {/* Related blog posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-12 pt-6 border-t border-border">
            <h3 className="font-display text-xl text-foreground mb-4">Lue myös:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedPosts.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blogi/${p.slug}`}
                  className="block p-4 border border-border rounded-lg hover:border-primary/50 transition-colors bg-card"
                >
                  <h4 className="font-medium text-foreground hover:text-primary transition-colors mb-1 line-clamp-2">
                    {p.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ – GEO/AI-optimointi */}
        <section className="mt-12 pt-6 border-t border-border">
          <h3 className="font-display text-xl text-foreground mb-4">Usein kysyttyä</h3>
          <div className="space-y-3">
            {blogFaqs.map((f, i) => (
              <details
                key={i}
                className="group border border-border rounded-lg bg-card/50 p-4"
              >
                <summary className="cursor-pointer font-medium text-foreground list-none flex justify-between items-center">
                  <span>{f.q}</span>
                  <span className="text-muted-foreground group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Uutiskirje artikkelin lopussa: ladataan laiskasti, varattu korkeus */}
        <div className="mt-12">
          <NewsletterBoxLazy lahde="blogi" />
        </div>
      </article>

      {/* Mobiilin kiinteä alapalkki (24.11.2026): joulun viimeinen tilauspäivä ja ilmainen toimitus. Vain tilausaikana. */}
      {joulunLahjakortti && (
        <>
          <div className="h-12 md:hidden" aria-hidden="true" />
          <Link to="/lahjakortti" className="fixed inset-x-0 bottom-0 z-40 md:hidden bg-primary text-primary-foreground text-center text-xs font-semibold px-3 py-2.5 shadow-lg underline-offset-2">
            {JOULU_LAHJAKORTTI_TEKSTI}. <span className="underline">Osta lahjakortti</span>
          </Link>
        </>
      )}
      {jouluAuki() && (
        <>
          <div className="h-12 md:hidden" aria-hidden="true" />
          <div className="fixed inset-x-0 bottom-0 z-40 md:hidden bg-primary text-primary-foreground text-center text-xs font-semibold px-3 py-2.5 shadow-lg">
            Joulun viimeinen tilauspäivä {JOULU_PAIVA_LYHYT.replace(/\d{4}$/, "")} Ilmainen toimitus 2 tuotteesta.
          </div>
        </>
      )}
    </div>
  );
};

export default BlogPost;
