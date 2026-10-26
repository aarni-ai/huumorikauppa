import type { BlogPost } from "@/types/blog";

const SITE = "https://huumorikauppa.fi";

const ORGANIZATION = {
  "@type": "Organization",
  "name": "Huumorikauppa",
  "url": SITE,
};

export type BlogFaq = { q: string; a: string };

/** Absoluuttinen URL artikkelin kuvalle (polku tai valmis URL). */
export function blogImageUrl(image: string | undefined): string | undefined {
  if (!image) return undefined;
  return /^https?:\/\//.test(image) ? image : `${SITE}${image.startsWith("/") ? "" : "/"}${image}`;
}

/**
 * Blogiartikkelin rakenteinen data: Article + FAQPage samassa @graph-rakenteessa.
 * Yleinen kaikille artikkeleille; kuva lisätään vain, jos artikkelilla on sellainen.
 *
 * Artikkelin tuotenostot merkitään ItemListinä, jonka ListItem-kohteilla on vain position ja url
 * (tuotesivun osoite). Ei Product-kohteita: blogisivulla ei ole tarjoustietoja, ja vajaa Product
 * (ilman offersia) on Googlen Product snippets -virhe. Täydet Product-tiedot ovat tuotesivuilla.
 */
export function buildBlogPostJsonLd(post: BlogPost, faqs: BlogFaq[], products: { slug: string }[] = []) {
  const url = `${SITE}/blogi/${post.slug}`;
  const image = blogImageUrl(post.image);

  const article = {
    "@type": "Article",
    "@id": `${url}#article`,
    "headline": post.title,
    "description": post.metaDescription,
    "url": url,
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt,
    "author": ORGANIZATION,
    "publisher": {
      ...ORGANIZATION,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE}/favicon.ico`,
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url,
    },
    ...(image ? { "image": [image] } : {}),
    "articleSection": post.category,
    "inLanguage": "fi",
    "keywords": post.tags.join(", "),
  };

  const graph: object[] = [article];
  if (products.length > 0) {
    graph.push({
      "@type": "ItemList",
      "@id": `${url}#tuotteet`,
      "name": `Tuotteet: ${post.title}`,
      "numberOfItems": products.length,
      "itemListElement": products.map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `${SITE}/tuote/${p.slug}`,
      })),
    });
  }
  if (faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      "mainEntity": faqs.map((f) => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
