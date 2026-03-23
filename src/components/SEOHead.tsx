import { useEffect } from "react";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  jsonLd?: object;
  breadcrumbs?: BreadcrumbItem[];
  ogImage?: string;
  noindex?: boolean;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
}

/** Set or create a meta tag */
function ensureMeta(selector: string, content: string, createAttrs?: Record<string, string>) {
  let el = document.querySelector(selector);
  if (!el && createAttrs) {
    el = document.createElement("meta");
    for (const [k, v] of Object.entries(createAttrs)) {
      el.setAttribute(k, v);
    }
    document.head.appendChild(el);
  }
  if (el) el.setAttribute("content", content);
}

export function SEOHead({
  title,
  description,
  canonical,
  jsonLd,
  breadcrumbs,
  ogImage,
  noindex,
  articlePublishedTime,
  articleModifiedTime,
}: SEOHeadProps) {
  useEffect(() => {
    // Title
    document.title = title;

    // Meta description
    ensureMeta('meta[name="description"]', description, { name: "description" });

    // Robots
    const robotsContent = noindex
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
    ensureMeta('meta[name="robots"]', robotsContent, { name: "robots" });

    // Open Graph
    ensureMeta('meta[property="og:title"]', title, { property: "og:title" });
    ensureMeta('meta[property="og:description"]', description, { property: "og:description" });
    if (canonical) ensureMeta('meta[property="og:url"]', canonical, { property: "og:url" });

    // Twitter
    ensureMeta('meta[name="twitter:title"]', title, { name: "twitter:title" });
    ensureMeta('meta[name="twitter:description"]', description, { name: "twitter:description" });

    // og:image and twitter:image
    if (ogImage) {
      ensureMeta('meta[property="og:image"]', ogImage, { property: "og:image" });
      ensureMeta('meta[property="og:image:alt"]', title, { property: "og:image:alt" });
      ensureMeta('meta[name="twitter:image"]', ogImage, { name: "twitter:image" });
      ensureMeta('meta[name="twitter:image:alt"]', title, { name: "twitter:image:alt" });
    }

    // Canonical
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    // Article meta
    if (articlePublishedTime) {
      ensureMeta('meta[property="article:published_time"]', articlePublishedTime, { property: "article:published_time" });
    }
    if (articleModifiedTime) {
      ensureMeta('meta[property="article:modified_time"]', articleModifiedTime, { property: "article:modified_time" });
    }

    // JSON-LD (main)
    if (jsonLd) {
      const existingScript = document.getElementById("seo-jsonld");
      if (existingScript) existingScript.remove();
      const script = document.createElement("script");
      script.id = "seo-jsonld";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    // BreadcrumbList JSON-LD
    if (breadcrumbs && breadcrumbs.length > 0) {
      const existingBc = document.getElementById("seo-breadcrumb-jsonld");
      if (existingBc) existingBc.remove();
      const bcJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((item, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": item.name,
          "item": item.url,
        })),
      };
      const script = document.createElement("script");
      script.id = "seo-breadcrumb-jsonld";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(bcJsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const s1 = document.getElementById("seo-jsonld");
      if (s1) s1.remove();
      const s2 = document.getElementById("seo-breadcrumb-jsonld");
      if (s2) s2.remove();
    };
  }, [title, description, canonical, jsonLd, breadcrumbs, ogImage, noindex, articlePublishedTime, articleModifiedTime]);

  return null;
}
