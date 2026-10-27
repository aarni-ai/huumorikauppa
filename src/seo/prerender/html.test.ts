import { describe, expect, it } from "vitest";
import {
  applyHead,
  cleanComponentHtml,
  deferEntryScripts,
  renderMarkdown,
  renderPageHtml,
  renderShellHtml,
  type PrerenderPage,
  type SiteNav,
} from "./html";

const TEMPLATE = `<!doctype html>
<html lang="fi">
  <head>
    <title>Vanha otsikko</title>
    <meta name="description" content="Vanha kuvaus">
    <link rel="canonical" href="https://huumorikauppa.fi/" />
    <link rel="preload" as="image" href="/images/etusivu-joulu-800.webp" imagesrcset="/images/etusivu-joulu-480.webp 480w" fetchpriority="high" data-hero-preload />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://huumorikauppa.fi" />
    <meta property="og:title" content="Vanha">
    <meta property="og:image" content="https://huumorikauppa.fi/images/etusivu-joulu.png">
    <meta property="og:image:width" content="1200">
    <script type="application/ld+json">{"@type":"Store"}</script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

const nav: SiteNav = {
  main: [{ href: "/kategoria/t-paidat", label: "T-Paidat" }],
  footer: [{ href: "/toimitusehdot", label: "Toimitusehdot" }],
};

const page: PrerenderPage = {
  path: "/joululahjat",
  title: "Joululahjat 2026 | Huumorikauppa.fi",
  description: "Hauskat joululahjat & ideat.",
  h1: "Hauskat joululahjat",
  breadcrumbs: [
    { name: "Etusivu", url: "https://huumorikauppa.fi/" },
    { name: "Joululahjat", url: "https://huumorikauppa.fi/joululahjat" },
  ],
  intro: ["Johdanto <b>ei html:ää</b>"],
  products: [{ slug: "amatimies-t-paita", name: "Amatimies", price: 24.9 }],
  faqs: [{ q: "Milloin?", a: "Ajoissa." }],
  jsonLd: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: "x" }, { "@context": "https://schema.org", "@type": "FAQPage" }],
};

function jsonLdBlocks(html: string) {
  return [...html.matchAll(/<script type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g)].map((m) => ({
    attrs: m[1],
    data: JSON.parse(m[2]),
  }));
}

describe("renderPageHtml", () => {
  const html = renderPageHtml(TEMPLATE, page, nav);

  it("sets the page's own title, description and self canonical", () => {
    expect(html).toContain("<title>Joululahjat 2026 | Huumorikauppa.fi</title>");
    expect(html).toContain('<meta name="description" content="Hauskat joululahjat &amp; ideat." />');
    expect(html.match(/<link rel="canonical"[^>]*>/g)).toEqual([
      '<link rel="canonical" href="https://huumorikauppa.fi/joululahjat" />',
    ]);
    expect(html).toContain('<meta property="og:url" content="https://huumorikauppa.fi/joululahjat" />');
    expect(html).not.toContain("Vanha");
  });

  it("renders exactly one H1, intro, product links with prices and FAQ inside #root", () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('<div id="root"><div data-prerender="true">');
    expect(html).toContain("Johdanto &lt;b&gt;ei html:ää&lt;/b&gt;");
    expect(html).toContain('<a href="/tuote/amatimies-t-paita">Amatimies</a> 24,90 €');
    expect(html).toContain("<dt>Milloin?</dt><dd>Ajoissa.</dd>");
    expect(html).toContain('<nav aria-label="Murupolku">');
  });

  it("replaces template JSON-LD with site + page + breadcrumb JSON-LD", () => {
    const blocks = jsonLdBlocks(html);
    expect(blocks.map((b) => b.attrs)).toEqual([
      ' id="seo-site-jsonld"',
      ' id="seo-jsonld" data-prerender-head',
      ' id="seo-breadcrumb-jsonld" data-prerender-head',
    ]);
    expect(blocks[1].data["@graph"].map((n: { "@type": string }) => n["@type"])).toEqual(["CollectionPage", "FAQPage"]);
    expect(blocks[1].data["@graph"][0]).not.toHaveProperty("@context");
    expect(blocks[2].data["@type"]).toBe("BreadcrumbList");
    expect(html).not.toContain('"Store"');
  });

  it("drops the homepage hero preload on other pages", () => {
    expect(html).not.toContain("etusivu-joulu-800.webp");
    expect(renderPageHtml(TEMPLATE, { ...page, path: "/", breadcrumbs: [] }, nav)).toContain("etusivu-joulu-800.webp");
  });

  it("adds a noscript style so the static content is visible without JavaScript", () => {
    expect(html).toContain("<noscript><style>[data-prerender-visual]{display:none}[data-prerender]{position:static");
  });

  it("keeps the entry script untouched on pages without a visible preview", () => {
    const withEntry = TEMPLATE.replace("</head>", '<script type="module" crossorigin src="/assets/index-a.js"></script>\n</head>');
    expect(renderPageHtml(withEntry, page, nav)).toContain('<script type="module" crossorigin src="/assets/index-a.js"></script>');
  });
});

describe("product preview", () => {
  const VITE_TEMPLATE = TEMPLATE.replace(
    "</head>",
    [
      '    <script type="module" crossorigin src="/assets/index-a.js"></script>',
      '    <link rel="modulepreload" crossorigin href="/assets/vendor-b.js">',
      '    <link rel="modulepreload" crossorigin href="/assets/query-c.js">',
      '    <link rel="stylesheet" crossorigin href="/assets/index-d.css">',
      "</head>",
    ].join("\n"),
  );
  const preview = '<div data-prerender-visual="true" inert=""><img src="/api/img?u=x&amp;w=800" fetchpriority="high"></div>';
  const html = renderPageHtml(VITE_TEMPLATE, { ...page, path: "/tuote/x", previewHtml: preview }, nav);

  it("puts the visible preview before the static body inside #root", () => {
    expect(html).toContain(`<div id="root">${preview}<div data-prerender="true">`);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
  });

  it("loads the app JavaScript only after the preview image (no early module script or modulepreload)", () => {
    expect(html).not.toMatch(/<script type="module"/);
    expect(html).not.toMatch(/<link rel="modulepreload"/);
    expect(html).toContain('<link rel="stylesheet" crossorigin href="/assets/index-d.css">');
    const loader = html.match(/<script>(\(function\(\)\{var d=document[\s\S]*?)<\/script>\s*<\/body>/);
    expect(loader).not.toBeNull();
    expect(loader![1]).toContain('s.src="/assets/index-a.js"');
    expect(loader![1]).toContain('["/assets/vendor-b.js","/assets/query-c.js"]');
  });

  it("adds extra module preloads (page chunk) to the loader without duplicates or the entry itself", () => {
    const out = deferEntryScripts(VITE_TEMPLATE, ["/assets/ProductPage-x.js", "/assets/vendor-b.js", "/assets/index-a.js"]);
    expect(out).toContain('["/assets/vendor-b.js","/assets/query-c.js","/assets/ProductPage-x.js"]');
  });

  it("deferEntryScripts leaves HTML without an entry script unchanged", () => {
    expect(deferEntryScripts(TEMPLATE)).toBe(TEMPLATE);
  });
});

describe("applyHead", () => {
  it("replaces og:image and removes the hero image dimensions", () => {
    const html = applyHead(TEMPLATE, {
      title: "T",
      description: "D",
      canonical: "https://huumorikauppa.fi/tuote/x",
      ogType: "product",
      ogImage: "https://huumorikauppa.fi/api/img?u=x",
    });
    expect(html).toContain('<meta property="og:image" content="https://huumorikauppa.fi/api/img?u=x" />');
    expect(html).toContain('<meta property="og:type" content="product" />');
    expect(html).not.toContain("og:image:width");
  });
});

describe("renderShellHtml", () => {
  it("has no canonical and no H1 (unknown routes)", () => {
    const html = renderShellHtml(TEMPLATE, nav, { title: "Koti", description: "Kuvaus" });
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain("og:url");
    expect(html).not.toMatch(/<h1[\s>]/);
    expect(jsonLdBlocks(html)).toHaveLength(1);
  });
});

describe("renderMarkdown", () => {
  it("renders the blog markdown subset safely", () => {
    const out = renderMarkdown("## Otsikko\n\nTeksti **lihava** ja [linkki](/blogi).\n\n- yksi\n- <kaksi>\n\n### Alaotsikko");
    expect(out).toBe(
      [
        "<h2>Otsikko</h2>",
        '<p>Teksti <strong>lihava</strong> ja <a href="/blogi">linkki</a>.</p>',
        "<ul><li>yksi</li><li>&lt;kaksi&gt;</li></ul>",
        "<h3>Alaotsikko</h3>",
      ].join("\n"),
    );
  });
});

describe("cleanComponentHtml", () => {
  it("strips classes, icons, forms, breadcrumbs and the component's own H1", () => {
    const out = cleanComponentHtml(
      '<div class="x"><nav aria-label="Murupolku"><a>Etusivu</a></nav><h1 class="y">Otsikko</h1><svg><path/></svg><p style="a">Teksti</p><form><input/></form></div>',
    );
    expect(out).toBe("<div><p>Teksti</p></div>");
  });
});
