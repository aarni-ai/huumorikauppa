import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { blogPosts } from "@/data/blog";
import { categories } from "@/data/products";
import { usePrerenderReady } from "@/hooks/use-prerender-ready";
import { ShoppingBag } from "lucide-react";
import { GuideProductRecommendations } from "@/components/GuideProductRecommendations";
import { MilestoneProductHighlights } from "@/components/MilestoneProductHighlights";

function renderContent(content: string) {
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
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
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

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
    }
  }
  flushList();
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
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);

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
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter(Boolean)
    .slice(0, 2);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.metaDescription,
    "url": `https://huumorikauppa.fi/blogi/${post.slug}`,
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt,
    "author": {
      "@type": "Organization",
      "name": "Huumorikauppa",
      "url": "https://huumorikauppa.fi",
    },
    "publisher": {
      "@type": "Organization",
      "name": "Huumorikauppa",
      "url": "https://huumorikauppa.fi",
      "logo": {
        "@type": "ImageObject",
        "url": "https://huumorikauppa.fi/favicon.ico",
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://huumorikauppa.fi/blogi/${post.slug}`,
    },
    "inLanguage": "fi",
    "keywords": post.tags.join(", "),
  };

  // Per-post FAQ overrides the generic set when the post defines its own.
  const blogFaqs = post.faq && post.faq.length > 0 ? post.faq : [
    {
      q: "Mistä löydän hauskoja lahjaideoita?",
      a: "Huumorikauppa.fi tarjoaa yli 200 hauskaa lahjaa: t-paitoja, huppareita, mukeja, tarroja ja sisustustuotteita. Selaa kategorioita tai lue muita blogiartikkeleita lisävinkkejä varten.",
    },
    {
      q: "Kuinka nopeasti tilaus toimitetaan?",
      a: "Toimitamme tilaukset koko Suomeen yleensä 3–10 arkipäivässä. Yli 60 € tilauksiin toimitus on ilmainen.",
    },
    {
      q: "Voinko palauttaa tuotteen?",
      a: "Kyllä. Tuotteilla on 14 päivän palautusoikeus. Personoituja tuotteita ei kuitenkaan voi palauttaa.",
    },
    {
      q: "Onko Huumorikauppa suomalainen yritys?",
      a: "Kyllä, Huumorikauppa.fi on 100 % suomalainen verkkokauppa. Asiakaspalvelu toimii suomeksi.",
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": blogFaqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": [articleJsonLd, faqJsonLd],
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title={post.metaTitle}
        description={post.metaDescription}
        canonical={`https://huumorikauppa.fi/blogi/${post.slug}`}
        jsonLd={combinedJsonLd}
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
          <div className="flex flex-wrap gap-2 mb-4">
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

        <div className="text-muted-foreground">{renderContent(post.content)}</div>

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

        {/* Milestone product highlights (most popular / relevant articles) */}
        <MilestoneProductHighlights articleSlug={post.slug} />

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
              Ilmainen toimitus yli 60 € tilauksiin · 14 pv palautusoikeus · Toimitus 3–10 arkipäivässä
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
      </article>
    </div>
  );
};

export default BlogPost;
