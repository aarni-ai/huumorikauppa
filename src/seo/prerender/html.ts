/**
 * Esirenderöinnin HTML-apurit: index.html-pohjan <head>-kenttien korvaus ja kevyt,
 * semanttinen staattinen runko <div id="root">:n sisään.
 *
 * Staattinen runko on merkitty data-prerender-attribuutilla. src/main.tsx tyhjentää sen ja
 * käynnistää Reactin createRootilla (ei hydraatiota), joten merkintä saa olla yksinkertaista.
 */
import { SITE_URL, absoluteUrl, formatPriceFi } from "../site";
import { buildBreadcrumbJsonLd, buildSiteJsonLd, serializeJsonLd, type BreadcrumbItem, type JsonLd } from "../structuredData";

export interface LinkItem {
  href: string;
  label: string;
  /** Lyhyt lisätieto linkin perään, esim. hinta tai tiivistelmä. */
  note?: string;
}

export interface PrerenderSection {
  heading?: string;
  /** Pelkkää tekstiä; escapoidaan. */
  paragraphs?: string[];
  /** Blogimuotoinen markdown (##, ###, -, **lihavointi**, [linkki](url)). */
  markdown?: string;
  /** Tekstilista (ei linkkejä). */
  items?: string[];
  links?: LinkItem[];
}

export interface PrerenderProduct {
  slug: string;
  name: string;
  price: number;
}

export interface PrerenderPage {
  /** Polku ilman loppukauttaviivaa, esim. "/joululahjat". Etusivu on "/". */
  path: string;
  title: string;
  description: string;
  ogType?: "website" | "product" | "article";
  ogImage?: string;
  /** Sivukohtainen JSON-LD (Organization/WebSite lisätään aina erikseen). */
  jsonLd: JsonLd[];
  breadcrumbs: BreadcrumbItem[];
  h1: string;
  /** Hinta tuotesivulla (näytetään H1:n alla). */
  price?: number;
  /** Tuotekuvat kuvaavine alt-teksteineen (tuotesivu). */
  images?: { src: string; alt: string }[];
  intro?: string[];
  sections?: PrerenderSection[];
  productsHeading?: string;
  products?: PrerenderProduct[];
  faqs?: { q: string; a: string }[];
  /** Valmiiksi renderöity sisältö (esim. ehtosivut), korvaa intro/sections-osat. */
  contentHtml?: string;
  /** LCP-kuvan preload (tuotesivun pääkuva): sama src/srcset/sizes kuin Reactin <img>. */
  preloadImage?: PreloadImage;
  /**
   * Näkyvä esikatselu ennen staattista runkoa (tuotesivut ja etusivu, src/seo/prerender/renderPreview.tsx).
   * src/main.tsx näyttää sen, kunnes React-sivu on valmis.
   */
  previewHtml?: string;
}

export interface PreloadImage {
  href: string;
  srcset?: string;
  sizes?: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

/** **lihavointi** ja [linkki](url) kuten BlogPost.tsx:n renderInlineFormatting. */
export function renderInlineMarkdown(text: string): string {
  const regex = /\*\*(.*?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let out = "";
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    out += escapeHtml(text.slice(last, match.index));
    if (match[1] !== undefined) {
      out += `<strong>${escapeHtml(match[1])}</strong>`;
    } else {
      out += `<a href="${escapeAttr(match[3])}">${escapeHtml(match[2])}</a>`;
    }
    last = regex.lastIndex;
  }
  return out + escapeHtml(text.slice(last));
}

/** Sama rakenne kuin BlogPost.tsx:n renderContent: ## -> h2, ### -> h3, "- " -> lista, muu -> p. */
export function renderMarkdown(content: string): string {
  const out: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length > 0) {
      out.push(`<ul>${list.map((i) => `<li>${renderInlineMarkdown(i)}</li>`).join("")}</ul>`);
      list = [];
    }
  };
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      out.push(`<h3>${renderInlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      flush();
      out.push(`<h2>${renderInlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      // Sivulla on jo oma H1; sisällön #-otsikko näytetään H2:na.
      flush();
      out.push(`<h2>${renderInlineMarkdown(line.slice(2))}</h2>`);
    } else if (line.startsWith("- ")) {
      list.push(line.slice(2));
    } else {
      flush();
      out.push(`<p>${renderInlineMarkdown(line)}</p>`);
    }
  }
  flush();
  return out.join("\n");
}

function renderLinks(links: LinkItem[]): string {
  return `<ul>${links
    .map((l) => `<li><a href="${escapeAttr(l.href)}">${escapeHtml(l.label)}</a>${l.note ? ` ${escapeHtml(l.note)}` : ""}</li>`)
    .join("")}</ul>`;
}

function renderSection(section: PrerenderSection): string {
  const parts: string[] = [];
  if (section.heading) parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
  for (const p of section.paragraphs ?? []) parts.push(`<p>${escapeHtml(p)}</p>`);
  if (section.markdown) parts.push(renderMarkdown(section.markdown));
  if (section.items && section.items.length > 0) {
    parts.push(`<ul>${section.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`);
  }
  if (section.links && section.links.length > 0) parts.push(renderLinks(section.links));
  return `<section>${parts.join("\n")}</section>`;
}

/** Sivuston yhteinen navigaatio staattiseen runkoon (kategoriat ja tärkeimmät sivut). */
export interface SiteNav {
  main: LinkItem[];
  footer: LinkItem[];
}

export function renderStaticBody(page: PrerenderPage, nav: SiteNav): string {
  const parts: string[] = [];
  parts.push(`<header><p><a href="/">Huumorikauppa</a></p><nav aria-label="Päävalikko">${renderLinks(nav.main)}</nav></header>`);
  parts.push("<main>");
  if (page.breadcrumbs.length > 1) {
    parts.push(
      `<nav aria-label="Murupolku"><ol>${page.breadcrumbs
        .map((b) => `<li><a href="${escapeAttr(b.url.replace(SITE_URL, "") || "/")}">${escapeHtml(b.name)}</a></li>`)
        .join("")}</ol></nav>`,
    );
  }
  parts.push(`<h1>${escapeHtml(page.h1)}</h1>`);
  if (typeof page.price === "number") parts.push(`<p>Hinta ${escapeHtml(formatPriceFi(page.price))}</p>`);
  for (const img of page.images ?? []) {
    parts.push(`<img src="${escapeAttr(img.src)}" alt="${escapeAttr(img.alt)}" width="600" height="600" loading="lazy">`);
  }
  if (page.contentHtml) {
    parts.push(page.contentHtml);
  } else {
    for (const p of page.intro ?? []) parts.push(`<p>${escapeHtml(p)}</p>`);
  }
  for (const s of page.sections ?? []) parts.push(renderSection(s));
  if (page.products && page.products.length > 0) {
    parts.push(
      renderSection({
        heading: page.productsHeading ?? "Tuotteet",
        links: page.products.map((p) => ({ href: `/tuote/${p.slug}`, label: p.name, note: formatPriceFi(p.price) })),
      }),
    );
  }
  if (page.faqs && page.faqs.length > 0) {
    parts.push(
      `<section><h2>Usein kysytyt kysymykset</h2><dl>${page.faqs
        .map((f) => `<dt>${escapeHtml(f.q)}</dt><dd>${escapeHtml(f.a)}</dd>`)
        .join("")}</dl></section>`,
    );
  }
  parts.push("</main>");
  parts.push(`<footer><nav aria-label="Asiakaspalvelu">${renderLinks(nav.footer)}</nav></footer>`);
  return `<div data-prerender="true">${parts.join("\n")}</div>`;
}

/**
 * Staattinen runko piilotetaan näkyvistä silloin kun JavaScript on käytössä (React korvaa sen
 * heti), jotta sivu ei välähdä tyylittömänä. Ilman JavaScriptiä <noscript>-tyyli näyttää sen ja
 * piilottaa tuotesivun esikatselun (data-prerender-visual), jottei sisältö näy kahdesti.
 */
export const PRERENDER_STYLE =
  `<style id="prerender-style">[data-prerender]{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}</style>` +
  `<noscript><style>[data-prerender-visual]{display:none}[data-prerender]{position:static;width:auto;height:auto;margin:0 auto;padding:16px;overflow:visible;clip:auto;white-space:normal;max-width:960px;font-family:system-ui,sans-serif;line-height:1.5}</style></noscript>`;

function jsonLdScript(data: JsonLd, id: string, prerenderHead: boolean): string {
  return `<script type="application/ld+json" id="${id}"${prerenderHead ? " data-prerender-head" : ""}>${serializeJsonLd(data)}</script>`;
}

/** Yhdistää sivun JSON-LD-objektit yhdeksi @graphiksi (kuten React-sivut tekevät). */
export function combineJsonLd(items: JsonLd[]): JsonLd | null {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  return {
    "@context": "https://schema.org",
    "@graph": items.map((item) => {
      const { ["@context"]: _ctx, ...rest } = item;
      return rest;
    }),
  };
}

function replaceTag(html: string, pattern: RegExp, replacement: string): string {
  if (pattern.test(html)) return html.replace(pattern, () => replacement);
  return html.replace("</head>", () => `  ${replacement}\n</head>`);
}

function setMeta(html: string, attr: "name" | "property", key: string, content: string): string {
  const pattern = new RegExp(`<meta ${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`);
  return replaceTag(html, pattern, `<meta ${attr}="${key}" content="${escapeAttr(content)}" />`);
}

/** Poistaa pohjasta kaikki JSON-LD-skriptit, jotta niitä ei tule tuplana. */
export function stripJsonLd(html: string): string {
  return html.replace(/\s*<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, "");
}

export interface HeadOptions {
  title: string;
  description: string;
  /** Absoluuttinen canonical. null = poista canonical (SPA-kuori tuntemattomille reiteille). */
  canonical: string | null;
  ogType?: string;
  ogImage?: string;
  pageJsonLd?: JsonLd | null;
  breadcrumbJsonLd?: JsonLd | null;
  /** Etusivun hero-kuvien preload vain etusivulle. */
  keepHeroPreload?: boolean;
  preloadImage?: PreloadImage;
}

/** <link rel=preload> LCP-kuvalle. Lisätään heti viewportin jälkeen, jotta selain löytää sen ensimmäisenä. */
export function preloadImageTag(img: PreloadImage): string {
  const attrs = [
    `rel="preload"`,
    `as="image"`,
    `href="${escapeAttr(img.href)}"`,
    img.srcset ? `imagesrcset="${escapeAttr(img.srcset)}"` : "",
    img.sizes ? `imagesizes="${escapeAttr(img.sizes)}"` : "",
    `fetchpriority="high"`,
  ].filter(Boolean);
  return `<link ${attrs.join(" ")} />`;
}

export function applyHead(template: string, opts: HeadOptions): string {
  let html = stripJsonLd(template);
  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(opts.title)}</title>`);
  html = setMeta(html, "name", "description", opts.description);
  if (opts.canonical) {
    html = replaceTag(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${escapeAttr(opts.canonical)}" />`);
    html = setMeta(html, "property", "og:url", opts.canonical);
  } else {
    html = html.replace(/\s*<link rel="canonical"[^>]*>/, "");
    html = html.replace(/\s*<meta property="og:url"[^>]*>/, "");
  }
  html = setMeta(html, "property", "og:title", opts.title);
  html = setMeta(html, "property", "og:description", opts.description);
  html = setMeta(html, "property", "og:type", opts.ogType ?? "website");
  html = setMeta(html, "name", "twitter:title", opts.title);
  html = setMeta(html, "name", "twitter:description", opts.description);
  if (opts.ogImage) {
    html = setMeta(html, "property", "og:image", opts.ogImage);
    html = setMeta(html, "property", "og:image:alt", opts.title);
    html = setMeta(html, "name", "twitter:image", opts.ogImage);
    html = setMeta(html, "name", "twitter:image:alt", opts.title);
    // Pohjan mitat koskevat etusivun hero-kuvaa, eivät tätä kuvaa.
    html = html.replace(/\s*<meta property="og:image:(width|height)"[^>]*>/g, "");
  }
  if (!opts.keepHeroPreload) {
    html = html.replace(/\s*<link rel="preload" as="image"[^>]*data-hero-preload[^>]*>/g, "");
  }
  if (opts.preloadImage) {
    const tag = preloadImageTag(opts.preloadImage);
    html = /<meta name="viewport"[^>]*>/.test(html)
      ? html.replace(/(<meta name="viewport"[^>]*>)/, (m) => `${m}\n    ${tag}`)
      : html.replace("</head>", () => `  ${tag}\n</head>`);
  }
  const scripts = [jsonLdScript(buildSiteJsonLd(), "seo-site-jsonld", false)];
  if (opts.pageJsonLd) scripts.push(jsonLdScript(opts.pageJsonLd, "seo-jsonld", true));
  if (opts.breadcrumbJsonLd) scripts.push(jsonLdScript(opts.breadcrumbJsonLd, "seo-breadcrumb-jsonld", true));
  html = html.replace("</head>", () => `  ${PRERENDER_STYLE}\n    ${scripts.join("\n    ")}\n  </head>`);
  return html;
}

export function injectRoot(html: string, bodyHtml: string): string {
  const marker = '<div id="root"></div>';
  if (!html.includes(marker)) throw new Error('index.html: tyhjä <div id="root"></div> puuttuu');
  return html.replace(marker, () => `<div id="root">${bodyHtml}</div>`);
}

/** Kuinka kauan sovelluksen JavaScript odottaa esikatselun pääkuvaa ennen latauksen aloittamista. */
export const ENTRY_DEFER_MAX_MS = 1000;

/**
 * Sivulla, jolla on näkyvä esikatselu, sovelluksen JavaScript (Viten entry-skripti ja sen
 * modulepreloadit, yhteensä satoja kilotavuja) ladataan vasta, kun esikatselun pääkuva on maalattu
 * (tai viimeistään ENTRY_DEFER_MAX_MS:n jälkeen). Näin hidas mobiiliyhteys käyttää kaistan ensin
 * CSS:ään ja LCP-kuvaan, ja React käynnistyy heti niiden jälkeen. Ilman entry-skriptiä pohja
 * palautetaan sellaisenaan.
 */
export function deferEntryScripts(html: string): string {
  const entry = html.match(/\s*<script type="module" crossorigin src="([^"]+)"><\/script>/);
  if (!entry) return html;
  const preloads: string[] = [];
  let out = html.replace(entry[0], "");
  out = out.replace(/\s*<link rel="modulepreload" crossorigin href="([^"]+)">/g, (_m, href: string) => {
    preloads.push(href);
    return "";
  });
  // Chromium: odotetaan LCP-merkintää pääkuvalle (kuva on maalattu). Muut selaimet: kuvan load +
  // kaksi ruudunpäivitystä. Aina viimeistään ENTRY_DEFER_MAX_MS:n jälkeen.
  const loader =
    `<script>(function(){var d=document,w=window,done=false,po;function go(){if(done)return;done=true;if(po)po.disconnect();` +
    `${JSON.stringify(preloads)}.forEach(function(h){var l=d.createElement("link");l.rel="modulepreload";l.crossOrigin="";l.href=h;d.head.appendChild(l)});` +
    `var s=d.createElement("script");s.type="module";s.crossOrigin="";s.src=${JSON.stringify(entry[1])};d.head.appendChild(s)}` +
    `setTimeout(go,${ENTRY_DEFER_MAX_MS});` +
    `var i=d.querySelector("[data-prerender-visual] img[fetchpriority=high]")||d.querySelector("[data-prerender-visual] img");` +
    `if(!i){go();return}` +
    `i.addEventListener("error",go);` +
    `try{if(w.PerformanceObserver&&PerformanceObserver.supportedEntryTypes.indexOf("largest-contentful-paint")>=0){` +
    `po=new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(e.url&&e.url===i.currentSrc)go()})});` +
    `po.observe({type:"largest-contentful-paint",buffered:true});return}}catch(x){}` +
    `function later(){requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(go,0)})})}` +
    `if(i.complete)later();else i.addEventListener("load",later)})()</script>`;
  return out.replace("</body>", () => `  ${loader}\n  </body>`);
}

/** Koko sivun HTML pohjasta. */
export function renderPageHtml(template: string, page: PrerenderPage, nav: SiteNav): string {
  const canonical = absoluteUrl(page.path);
  const html = applyHead(template, {
    title: page.title,
    description: page.description,
    canonical,
    ogType: page.ogType,
    ogImage: page.ogImage,
    pageJsonLd: combineJsonLd(page.jsonLd),
    breadcrumbJsonLd: page.breadcrumbs.length > 1 ? buildBreadcrumbJsonLd(page.breadcrumbs) : null,
    keepHeroPreload: page.path === "/",
    preloadImage: page.preloadImage,
  });
  const full = injectRoot(html, (page.previewHtml ?? "") + renderStaticBody(page, nav));
  return page.previewHtml ? deferEntryScripts(full) : full;
}

/**
 * Siistii renderToStringin tuottaman sivukomponentin kevyeksi sisällöksi: luokat, tyylit,
 * ikonit ja lomakkeet pois, sekä H1 ja murupolku (staattinen runko lisää ne itse).
 */
export function cleanComponentHtml(html: string): string {
  return html
    .replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<form[\s\S]*?<\/form>/g, "")
    .replace(/<nav aria-label="Murupolku"[\s\S]*?<\/nav>/g, "")
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/g, "")
    .replace(/\s(class|style|data-[a-z-]+|aria-hidden|tabindex)="[^"]*"/g, "")
    .replace(/<!-- -->/g, "")
    .replace(/<(div|span)>\s*<\/\1>/g, "")
    .trim();
}

/**
 * SPA-kuori reiteille, joita ei ole esirenderöity (esim. buildin jälkeen lisätyt tuotteet).
 * Ei canonicalia eikä sivukohtaista sisältöä: React asettaa ne ladattuaan, ja botit saavat
 * middleware.ts:n kautta sivukohtaiset metat.
 */
export function renderShellHtml(template: string, nav: SiteNav, meta: { title: string; description: string }): string {
  const html = applyHead(template, { title: meta.title, description: meta.description, canonical: null });
  const body = `<div data-prerender="true"><header><p><a href="/">Huumorikauppa</a></p><nav aria-label="Päävalikko">${renderLinks(nav.main)}</nav></header><footer><nav aria-label="Asiakaspalvelu">${renderLinks(nav.footer)}</nav></footer></div>`;
  return injectRoot(html, body);
}

/**
 * 404-sivu (dist/404.html). middleware.ts palauttaa sen tilakoodilla 404 tuntemattomille
 * tuotesivuille. Ei canonicalia, robots noindex. React käynnistyy normaalisti ja näyttää
 * reitin oman "ei löydy" -näkymän.
 */
export function renderNotFoundHtml(template: string, nav: SiteNav): string {
  let html = applyHead(template, {
    title: "Sivua ei löytynyt | Huumorikauppa",
    description: "Etsimääsi sivua tai tuotetta ei löytynyt. Selaa kaikkia tuotteita tai joululahjaoppaita.",
    canonical: null,
  });
  const noindex = '<meta name="robots" content="noindex, follow" />';
  html = /<meta name="robots"[^>]*>/.test(html)
    ? html.replace(/<meta name="robots"[^>]*>/, () => noindex)
    : html.replace("</head>", () => `  ${noindex}\n</head>`);
  html = html.replace(/<meta name="googlebot"[^>]*>/, () => '<meta name="googlebot" content="noindex, follow" />');
  const body =
    `<div data-prerender="true"><header><p><a href="/">Huumorikauppa</a></p><nav aria-label="Päävalikko">${renderLinks(nav.main)}</nav></header>` +
    `<main><h1>Sivua ei löytynyt</h1><p>Etsimääsi sivua tai tuotetta ei löytynyt. Se on voitu poistaa myynnistä.</p>` +
    `<ul><li><a href="/kaikki-tuotteet">Kaikki tuotteet</a></li><li><a href="/joululahjat">Joululahjat</a></li><li><a href="/">Etusivu</a></li></ul></main>` +
    `<footer><nav aria-label="Asiakaspalvelu">${renderLinks(nav.footer)}</nav></footer></div>`;
  return injectRoot(html, body);
}
