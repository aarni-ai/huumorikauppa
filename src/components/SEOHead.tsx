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
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);

    // Robots noindex
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (robotsMeta && noindex) {
      robotsMeta.setAttribute("content", "noindex, nofollow");
    } else if (robotsMeta && !noindex) {
      robotsMeta.setAttribute("content", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    }

    // Open Graph
    const ogTitleEl = document.querySelector('meta[property="og:title"]');
    if (ogTitleEl) ogTitleEl.setAttribute("content", title);
    const ogDescEl = document.querySelector('meta[property="og:description"]');
    if (ogDescEl) ogDescEl.setAttribute("content", description);
    const ogUrlEl = document.querySelector('meta[property="og:url"]');
    if (ogUrlEl && canonical) ogUrlEl.setAttribute("content", canonical);

    // Twitter
    const twTitleEl = document.querySelector('meta[name="twitter:title"]');
    if (twTitleEl) twTitleEl.setAttribute("content", title);
    const twDescEl = document.querySelector('meta[name="twitter:description"]');
    if (twDescEl) twDescEl.setAttribute("content", description);

    // og:image and twitter:image
    if (ogImage) {
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg) ogImg.setAttribute("content", ogImage);
      const ogImgAlt = document.querySelector('meta[property="og:image:alt"]');
      if (ogImgAlt) ogImgAlt.setAttribute("content", title);
      const twImg = document.querySelector('meta[name="twitter:image"]');
      if (twImg) twImg.setAttribute("content", ogImage);
      const twImgAlt = document.querySelector('meta[name="twitter:image:alt"]');
      if (twImgAlt) twImgAlt.setAttribute("content", title);
    }

    // Canonical
    if (canonical) {
      const link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (link) link.href = canonical;
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
  }, [title, description, canonical, jsonLd, breadcrumbs, ogImage, noindex]);

  return null;
}