import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { blogPosts } from "@/data/blog";

const BlogIndex = () => {
  const sortedPosts = [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const blogListJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Huumorikauppa Blogi",
    "description": "Lahjaideoita, tuotevinkkejä ja huumoria – Huumorikaupan blogi",
    "url": "https://huumorikauppa.fi/blogi",
    "publisher": {
      "@type": "Organization",
      "name": "Huumorikauppa",
      "url": "https://huumorikauppa.fi",
    },
    "blogPost": sortedPosts.map((post) => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "url": `https://huumorikauppa.fi/blogi/${post.slug}`,
      "datePublished": post.publishedAt,
      "dateModified": post.updatedAt,
      "description": post.excerpt,
      "author": { "@type": "Organization", "name": "Huumorikauppa" },
    })),
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Blogi – Lahjaideat, vinkit ja huumori | Huumorikauppa"
        description="Huumorikaupan blogi: lahjaideoita, tuotevinkkejä ja huumoria. Löydä parhaat hauskat lahjat miehelle, naiselle ja kaverille."
        canonical="https://huumorikauppa.fi/blogi"
        jsonLd={blogListJsonLd}
        breadcrumbs={[
          { name: "Etusivu", url: "https://huumorikauppa.fi/" },
          { name: "Blogi", url: "https://huumorikauppa.fi/blogi" },
        ]}
      />

      <div className="container py-8 md:py-12 max-w-4xl">
        <nav aria-label="Murupolku" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Etusivu</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Blogi</span>
        </nav>

        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
          Huumorikaupan Blogi 📝
        </h1>
        <p className="text-muted-foreground mb-10">
          Lahjaideoita, tuotevinkkejä ja inspiraatiota hauskojen tuotteiden maailmasta.
        </p>

        <div className="space-y-8">
          {sortedPosts.map((post) => (
            <article
              key={post.slug}
              className="border border-border rounded-lg p-6 bg-card hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link to={`/blogi/${post.slug}`}>
                <h2 className="font-display text-xl md:text-2xl text-foreground hover:text-primary transition-colors mb-2">
                  {post.title}
                </h2>
              </Link>
              <p className="text-muted-foreground text-sm mb-4">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <time dateTime={post.publishedAt} className="text-xs text-muted-foreground">
                  {new Date(post.publishedAt).toLocaleDateString("fi-FI", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <Link
                  to={`/blogi/${post.slug}`}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Lue lisää →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogIndex;
