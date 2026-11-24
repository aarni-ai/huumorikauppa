import type { BlogPost } from "@/types/blog";

const SITE = "https://huumorikauppa.fi";

// Sama @id kuin sivuston Organization-skeemassa (src/seo/structuredData.ts: Uusiku Oy, Y-tunnus).
const ORGANIZATION = {
  "@type": "Organization",
  "@id": `${SITE}/#organization`,
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
 * Artikkelin tuotenostot merkitään ItemListinä. 24.11.2026: blogisivulla näkyvät tuotekortit hintoineen (Top 3 ja
 * tekstin kortit), joten ListItem sisältää Product-kohteen (nimi, kuva, tarjous), kun tuotteella on hinta ja kuva.
 * Ilman niitä vain position ja url (vajaa Product ilman offersia on Googlen virhe).
 */
export function buildBlogPostJsonLd(post: BlogPost, faqs: BlogFaq[], products: { slug: string; name?: string; price?: number; images?: string[] }[] = []) {
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
      "itemListElement": products.map((p, i) => {
        const tuoteUrl = `${SITE}/tuote/${p.slug}`;
        const kuva = p.images?.[0];
        if (!(p.price && p.price > 0 && kuva && p.name)) return { "@type": "ListItem", "position": i + 1, "url": tuoteUrl };
        return {
          "@type": "ListItem",
          "position": i + 1,
          "item": {
            "@type": "Product",
            "@id": `${tuoteUrl}#product`,
            "name": p.name,
            "url": tuoteUrl,
            "image": /^https?:\/\//.test(kuva) ? kuva : `${SITE}${kuva.startsWith("/") ? "" : "/"}${kuva}`,
            "brand": { "@type": "Brand", "name": "Huumorikauppa" },
            "offers": {
              "@type": "Offer",
              "url": tuoteUrl,
              "price": p.price.toFixed(2),
              "priceCurrency": "EUR",
              "availability": "https://schema.org/InStock",
              "seller": { "@id": `${SITE}/#organization` },
            },
          },
        };
      }),
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
