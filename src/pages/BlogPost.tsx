import { useParams, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { blogPosts } from "@/data/blog";
import { categories } from "@/data/products";

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
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={match.index} className="font-semibold text-foreground">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

const BlogPost = () => {
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

  const otherPosts = blogPosts.filter((p) => p.slug !== slug);

  const relatedCats = post.relatedCategories
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter(Boolean);

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

  return (
    <div className="min-h-screen">
      <SEOHead
        title={post.metaTitle}
        description={post.metaDescription}
        canonical={`https://huumorikauppa.fi/blogi/${post.slug}`}
        jsonLd={articleJsonLd}
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

        {/* Related categories */}
        {relatedCats.length > 0 && (
          <nav className="mt-12 pt-6 border-t border-border" aria-label="Aiheeseen liittyvät kategoriat">
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

        {/* Other blog posts */}
        {otherPosts.length > 0 && (
          <section className="mt-12 pt-6 border-t border-border">
            <h3 className="font-display text-xl text-foreground mb-4">Lue myös:</h3>
            <div className="space-y-4">
              {otherPosts.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blogi/${p.slug}`}
                  className="block p-4 border border-border rounded-lg hover:border-primary/50 transition-colors bg-card"
                >
                  <h4 className="font-medium text-foreground hover:text-primary transition-colors mb-1">
                    {p.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
};

export default BlogPost;
