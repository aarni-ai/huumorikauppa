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

function setMeta(selector: string, content: string, attr = "content") {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, content);
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
    setMeta('meta[name="description"]', description);

    // Robots
    const robotsContent = noindex
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
    setMeta('meta[name="robots"]', robotsContent);

    // Open Graph
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    if (canonical) setMeta('meta[property="og:url"]', canonical);

    // Twitter
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);

    // og:image and twitter:image
    if (ogImage) {
      setMeta('meta[property="og:image"]', ogImage);
      setMeta('meta[property="og:image:alt"]', title);
      setMeta('meta[name="twitter:image"]', ogImage);
      setMeta('meta[name="twitter:image:alt"]', title);
    }

    // Canonical – always update if provided
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    // Article meta (for blog posts)
    if (articlePublishedTime) {
      let el = document.querySelector('meta[property="article:published_time"]');
      if (!el) {
        el = document.createElement("meta");
        (el as HTMLMetaElement).setAttribute("property", "article:published_time");
        document.head.appendChild(el);
      }
      el.setAttribute("content", articlePublishedTime);
    }
    if (articleModifiedTime) {
      let el = document.querySelector('meta[property="article:modified_time"]');
      if (!el) {
        el = document.createElement("meta");
        (el as HTMLMetaElement).setAttribute("property", "article:modified_time");
        document.head.appendChild(el);
      }
      el.setAttribute("content", articleModifiedTime);
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
