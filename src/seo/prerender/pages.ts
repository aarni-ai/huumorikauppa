import { buildBlogPostJsonLd } from "@/lib/blogJsonLd";
/**
 * Esirenderöitävien sivujen rakentaja. Käyttää samoja datalähteitä kuin React-sivut
 * (src/data/*, src/seo/*), jotta raaka HTML ja selaimessa näkyvä sivu vastaavat toisiaan.
 *
 * Ajetaan buildissa scripts/prerender.mjs:n kautta (Viten ssrLoadModule), testataan vitestillä.
 */
import { PRODUCT_IMAGE_SIZES, defaultColorImages, productImageSources } from "@/lib/productImages";
import { categories } from "@/data/products";
import { CATEGORY_H1, CATEGORY_H2_SECTIONS, selectCategoryProducts } from "@/data/categoryContent";
import { giftCategories } from "@/data/giftCategories";
import { situationGifts, filterProductsForSituation } from "@/data/situationGifts";
import { professions } from "@/data/professions";
import { hobbies } from "@/data/hobbies";
import { municipalities } from "@/data/municipalities";
import { dialects } from "@/data/dialects";
import { blogPosts } from "@/data/blog";
import { blogMidInsertLine, blogPageLabel, getBlogProductTheme, selectBlogProducts, splitBlogProducts } from "@/data/blogProducts";
import {
  landingPages,
  LANDING_GRID_LIMIT,
  LANDING_REDIRECTS,
  selectLandingProducts,
} from "@/data/landingPages";
import { CHRISTMAS_MENU } from "@/data/landingRoutes";
import { christmasDeadlinePage } from "@/data/christmasDeadlinePage";
import { onPiilotettu, onPiilotettuTuote } from "@/lib/hiddenCategories";
import { getPriorityRank } from "@/lib/productPriority";
import { generateGiftGuideContent } from "@/lib/giftGuideContent";
import { generateProductCopy, isGenericDescription, sanitizeProductDescription, truncateAtWord } from "@/lib/productCopy";
import { getProductContent } from "@/data/productContent";
import { isCustomTextProduct } from "@/lib/customProduct";
import { productImageAlt } from "@/lib/productNames";
import { proxiedImage } from "@/lib/imageProxy";
import type { Product } from "@/types/product";
import { SITE_URL, SHIPPING, RETURNS, formatPriceFi } from "../site";
import { STATIC_PAGE_META, type StaticPageMeta, type StaticPagePath } from "../staticPageMeta";
import { buildLandingJsonLd, landingBreadcrumbs, landingCategoryLinks, landingRelatedLinks } from "../landing";
import {
  SITE_FAQS,
  DEFAULT_BLOG_FAQS,
  HOME_FAQS,
  buildCategoryFaqs,
  buildGiftCategoryFaqs,
  buildProductFaqs,
  mergeFaqs,
  mergeSituationFaqs,
} from "../pageFaqs";
import {
  buildCollectionPageJsonLd,
  buildFaqJsonLd,
  buildProductJsonLd,
  ORGANIZATION_ID,
  type BreadcrumbItem,
  type JsonLd,
} from "../structuredData";
import type { LinkItem, PrerenderPage, PrerenderProduct, SiteNav } from "./html";
import { ILMAINEN_RAJA_TEKSTI } from "@/config/toimitus";

/** Supabasen products-rivi siinä muodossa kuin REST palauttaa sen. */
export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number | string;
  description?: string | null;
  images?: string[] | null;
  stock?: number | null;
  is_active?: boolean | null;
  is_featured?: boolean | null;
  humor_type?: string | null;
  variants?: Record<string, unknown> | null;
}

/** Sama suodatus kuin use-products.ts: luonnokset (is_active === false) ja piilotetut kategoriat pois. */
export function normalizeProducts(rows: ProductRow[]): Product[] {
  return rows
    .filter((p) => p.is_active !== false)
    .filter((p) => !onPiilotettuTuote(p))
    .filter((p) => !!p.slug && !!p.name)
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      humor_type: p.humor_type ?? "",
      price: Number(p.price),
      stock: typeof p.stock === "number" ? p.stock : 0,
      description: p.description ?? "",
      images: (p.images ?? []).filter(Boolean),
      variants: (p.variants as Record<string, unknown> | null) ?? {},
      is_featured: !!p.is_featured,
      is_new: false,
      is_gift_idea: false,
    }));
}

/**
 * Gift-reitit, jotka App.tsx ohjaa GiftCategoryPage-komponentille. Laskeutumissivuiksi siirretyt
 * (src/data/landingPages.ts) ja uudelleenohjatut (/lahja-tyokaverille) eivät ole tässä.
 */
export const GIFT_ROUTE_SLUGS = [
  "polttari-lahjat",
  "lahja-miehelle",
  "haalarimerkit",
  "opiskelijan-haalarimerkit",
] as const;

/** Polut, jotka laskeutumissivu tai uudelleenohjaus korvaa (ei esirenderöidä vanhalla sisällöllä). */
const SUPERSEDED_PATHS = new Set<string>([...landingPages.map((p) => p.path), ...Object.keys(LANDING_REDIRECTS)]);

/** Sivut, joiden sisältö renderöidään React-komponentista (scripts/prerender.mjs). */
export const COMPONENT_PAGES = {
  "/toimitusehdot": "Terms",
  "/palautusehdot": "ReturnsPolicy",
  "/tietosuojakaytanto": "Privacy",
  "/saavutettavuusseloste": "Accessibility",
  "/yhteystiedot": "ContactPage",
  "/tietoa-meista": "AboutPage",
  "/suomalaiset-tyopaikkameemit-top-50": "WorkplaceMemesPage",
  "/hauskimmat-tyopaikkalaput-2026": "OfficeNotesPage",
} as const satisfies Partial<Record<StaticPagePath, string>>;

export type ComponentPagePath = keyof typeof COMPONENT_PAGES;

export interface BuildOptions {
  products: Product[];
  /** Komponenteista renderöity sisältö (polku -> HTML). Puuttuva sivu saa kevyen rungon. */
  componentHtml?: Partial<Record<ComponentPagePath, string>>;
}

/** Lahja- ja kampanjasivuilla listataan enintään näin monta tuotetta (kevyt HTML). */
export const LANDING_PRODUCT_LIMIT = 48;

const HOME: BreadcrumbItem ={ name: "Etusivu", url: `${SITE_URL}/` };
const LAHJAIDEAT: BreadcrumbItem = { name: "Lahjaideat", url: `${SITE_URL}/kaikki-tuotteet` };

function crumb(name: string, path: string): BreadcrumbItem {
  return { name, url: `${SITE_URL}${path}` };
}

function toPrerenderProducts(products: Product[]): PrerenderProduct[] {
  return products.map((p) => ({ slug: p.slug, name: p.name, price: p.price }));
}

function sortByPriority(products: Product[]): Product[] {
  return products
    .map((p, i) => ({ p, i }))
    .sort((a, b) => getPriorityRank(a.p) - getPriorityRank(b.p) || a.i - b.i)
    .map((x) => x.p);
}

function productImage(url?: string): string | undefined {
  if (!url) return undefined;
  const abs = url.startsWith("http") ? url : `${SITE_URL}${url}`;
  return proxiedImage(abs, { absolute: true }) || undefined;
}

function keywordProducts(all: Product[], keywords: string[]): Product[] {
  const kws = keywords.map((k) => k.toLowerCase());
  return all.filter((p) => {
    const haystack = `${p.name} ${p.description ?? ""}`.toLowerCase();
    return kws.some((k) => haystack.includes(k));
  });
}

function itemListJsonLd(name: string, products: Product[], limit: number): JsonLd {
  const items = products.slice(0, limit);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/tuote/${p.slug}`,
      name: p.name,
    })),
  };
}

function visibleCategories() {
  return categories.filter((c) => !onPiilotettu(c.slug));
}

/** Kategoriat, joissa on tuotteita (navigaatioon). Ilman tuotedataa kaikki näkyvät kategoriat. */
function stockedCategories(products: Product[]) {
  if (products.length === 0) return visibleCategories();
  const used = new Set(products.map((p) => p.category));
  return visibleCategories().filter((c) => used.has(c.slug));
}

const DELIVERY_FACTS = `Toimitus koko Suomeen ${SHIPPING.deliveryBusinessDaysMin}-${SHIPPING.deliveryBusinessDaysMax} arkipäivässä tilauksesta, Postin tai Matkahuollon kautta. Toimituskulut ${formatPriceFi(SHIPPING.feeEur)}, ${SHIPPING.freeThresholdEur} euron tilauksista alkaen toimitus on ilmainen. ${RETURNS.days} päivän peruutusoikeus (ei koske personoituja tuotteita). Tilaa viimeistään perjantaina 20.11.2026, niin tilaus ehtii perille jouluaattoon mennessä.`;

export function buildSiteNav(products: Product[] = []): SiteNav {
  const main: LinkItem[] = [
    { href: "/kaikki-tuotteet", label: "Kaikki tuotteet" },
    ...stockedCategories(products).map((c) => ({ href: `/kategoria/${c.slug}`, label: c.name })),
    { href: "/hauskat-lahjat-miehelle", label: "Lahjat miehelle" },
    { href: "/hauskat-lahjat-naiselle", label: "Lahjat naiselle" },
    { href: "/joululahjat", label: "Joululahjat" },
    { href: "/isanpaivalahja", label: "Isänpäivälahjat" },
    { href: "/blogi", label: "Blogi" },
  ];
  const footer: LinkItem[] = [
    { href: "/usein-kysytyt-kysymykset", label: "Usein kysytyt kysymykset" },
    { href: "/toimitusehdot", label: "Toimitusehdot" },
    { href: "/palautusehdot", label: "Palautusehdot" },
    { href: "/tietosuojakaytanto", label: "Tietosuojakäytäntö" },
    { href: "/yhteystiedot", label: "Yhteystiedot" },
    { href: "/tietoa-meista", label: "Tietoa meistä" },
  ];
  return { main, footer };
}

function staticPage(path: StaticPagePath, extra: Partial<PrerenderPage>): PrerenderPage {
  const meta: StaticPageMeta = STATIC_PAGE_META[path];
  return {
    path,
    title: meta.title,
    description: meta.description,
    h1: meta.h1,
    breadcrumbs: path === "/" ? [] : [HOME, crumb(meta.name, path)],
    jsonLd: [],
    intro: meta.intro ? [meta.intro] : undefined,
    ...extra,
  };
}

function buildHome(products: Product[]): PrerenderPage {
  return staticPage("/", {
    sections: [
      {
        heading: "Tuotekategoriat",
        links: stockedCategories(products).map((c) => ({ href: `/kategoria/${c.slug}`, label: c.name })),
      },
      {
        heading: "Joululahjat",
        links: CHRISTMAS_MENU.map((m) => ({ href: m.href, label: m.label })),
      },
      {
        heading: "Lahjaideat",
        links: landingPages.filter((p) => p.group !== "joulu").map((p) => ({ href: p.path, label: p.h1 })),
      },
    ],
    productsHeading: "Suosittuja tuotteita",
    products: toPrerenderProducts(sortByPriority(products).slice(0, 24)),
    faqs: HOME_FAQS,
  });
}

function buildAllProducts(products: Product[]): PrerenderPage {
  return staticPage("/kaikki-tuotteet", {
    productsHeading: `Tuotteet (${products.length})`,
    products: toPrerenderProducts(sortByPriority(products)),
  });
}

function buildCategoryPages(products: Product[]): PrerenderPage[] {
  return visibleCategories().map((category) => {
    const path = `/kategoria/${category.slug}`;
    const h1 = CATEGORY_H1[category.slug] || `Hauskat ${category.name}`;
    const list = selectCategoryProducts(products, category.slug);
    const faqs = buildCategoryFaqs(category.name);
    const description =
      category.seoDescription || `${category.description}. Ilmainen toimitus ${ILMAINEN_RAJA_TEKSTI} euron tilauksista alkaen.`;
    return {
      path,
      title: category.seoTitle || `${h1} | Huumorikauppa.fi`,
      description,
      h1,
      ogImage: productImage(list[0]?.images[0]),
      breadcrumbs: [HOME, crumb(category.name, path)],
      intro: [category.description],
      sections: [
        ...(CATEGORY_H2_SECTIONS[category.slug] ?? []).map((s) => ({ heading: s.h2, paragraphs: [s.text] })),
        ...(category.seoText ? [{ markdown: category.seoText }] : []),
      ],
      productsHeading: `${category.name} (${list.length} tuotetta)`,
      products: toPrerenderProducts(list),
      faqs,
      jsonLd: [
        buildCollectionPageJsonLd({ name: h1, description, url: path, products: list }),
        buildFaqJsonLd(faqs),
      ],
    };
  });
}

function buildGiftPages(products: Product[]): PrerenderPage[] {
  return giftCategories
    .filter((g) => (GIFT_ROUTE_SLUGS as readonly string[]).includes(g.slug) && !SUPERSEDED_PATHS.has(`/${g.slug}`))
    .map((g) => {
      const path = `/${g.slug}`;
      const list = products.filter((p) => g.filterFn(p));
      const faqs = buildGiftCategoryFaqs(g.name, list.length);
      return {
        path,
        title: g.seoTitle,
        description: g.seoDescription,
        h1: g.h1,
        ogImage: productImage(list[0]?.images[0]),
        breadcrumbs: [HOME, crumb(g.name, path)],
        sections: g.seoText ? [{ markdown: g.seoText }] : [],
        productsHeading: `Tuotteet (${list.length})`,
        products: toPrerenderProducts(list.slice(0, LANDING_PRODUCT_LIMIT)),
        faqs,
        jsonLd: [
          buildCollectionPageJsonLd({ name: g.h1, description: g.seoDescription, url: path, products: list }),
          buildFaqJsonLd(faqs),
        ],
      };
    });
}

function buildMothersDay(products: Product[]): PrerenderPage {
  const mothers = giftCategories.find((g) => g.slug === "aitienpaiva-lahjat");
  const list = mothers ? products.filter((p) => mothers.filterFn(p)) : [];
  return staticPage("/aitienpaiva", {
    sections: mothers?.seoText ? [{ markdown: mothers.seoText }] : [],
    products: toPrerenderProducts(list.slice(0, LANDING_PRODUCT_LIMIT)),
    ogImage: productImage(list[0]?.images[0]),
  });
}

function buildSituationPages(products: Product[]): PrerenderPage[] {
  return situationGifts
    .filter((s) => !SUPERSEDED_PATHS.has(`/lahjat/${s.slug}`))
    .map((s) => {
    const path = `/lahjat/${s.slug}`;
    const list = filterProductsForSituation(products, s).slice(0, 24);
    const guide = generateGiftGuideContent(s);
    const faqs = mergeSituationFaqs(guide.faqs);
    return {
      path,
      title: s.seoTitle,
      description: s.seoDescription,
      h1: s.h1,
      ogImage: productImage(list[0]?.images[0]),
      breadcrumbs: [HOME, LAHJAIDEAT, crumb(s.h1, path)],
      intro: [guide.intro],
      sections: [
        { paragraphs: [guide.whyChoose, guide.howToChoose, guide.popular, guide.shippingTrust] },
      ],
      products: toPrerenderProducts(list),
      faqs,
      jsonLd: [itemListJsonLd(s.h1, list, 12), buildFaqJsonLd(faqs)],
    };
  });
}

interface ContentGraphEntry {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  tldr: string;
  intro: string;
  shirtTexts: string[];
  faqs: { q: string; a: string }[];
}

function buildContentGraphPage(
  base: string,
  entry: ContentGraphEntry,
  list: Product[],
  extraSections: PrerenderPage["sections"] = [],
): PrerenderPage {
  const path = `/${base}/${entry.slug}`;
  return {
    path,
    title: entry.seoTitle,
    description: entry.seoDescription,
    h1: entry.h1,
    breadcrumbs: [HOME, LAHJAIDEAT, crumb(entry.h1, path)],
    intro: [entry.tldr, entry.intro],
    sections: [...(extraSections ?? []), { heading: "Suosittuja paitatekstejä", items: entry.shirtTexts }],
    products: toPrerenderProducts(list),
    faqs: entry.faqs,
    jsonLd: [itemListJsonLd(entry.h1, list, 12), buildFaqJsonLd(entry.faqs)],
  };
}

function buildContentGraphPages(products: Product[]): PrerenderPage[] {
  const fallback = products.slice(0, 8);
  const pick = (keywords: string[]) => {
    const matched = keywordProducts(products, keywords).slice(0, 24);
    return matched.length > 0 ? matched : fallback;
  };
  return [
    ...professions.map((p) => buildContentGraphPage("ammatti", p, pick(p.keywords))),
    ...hobbies
      .filter((h) => !SUPERSEDED_PATHS.has(`/harrastus/${h.slug}`))
      .map((h) => buildContentGraphPage("harrastus", h, pick(h.keywords))),
    ...municipalities.map((m) =>
      buildContentGraphPage(
        "kaupunki",
        m,
        products.filter((p) => (p.description || "").includes(`#kaupunki:${m.name}`)),
        [{ paragraphs: [m.identity] }],
      ),
    ),
    ...dialects.map((d) =>
      buildContentGraphPage("murre", d, products.slice(0, 12), [
        { heading: "Murreilmaisuja", items: d.expressions.map((e) => `${e.expression}: ${e.meaning}`) },
      ]),
    ),
  ];
}

function sortedBlogPosts() {
  return [...blogPosts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

function buildBlogIndex(): PrerenderPage {
  const posts = sortedBlogPosts();
  return staticPage("/blogi", {
    sections: [
      {
        heading: "Artikkelit",
        links: posts.map((p) => ({ href: `/blogi/${p.slug}`, label: p.title, note: p.excerpt })),
      },
    ],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "Huumorikauppa Blogi",
        url: `${SITE_URL}/blogi`,
        publisher: { "@id": ORGANIZATION_ID },
        blogPost: posts.map((post) => ({
          "@type": "BlogPosting",
          headline: post.title,
          url: `${SITE_URL}/blogi/${post.slug}`,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          description: post.excerpt,
        })),
      },
    ],
  });
}

function buildBlogPosts(products: Product[]): PrerenderPage[] {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  return blogPosts.map((post) => {
    const path = `/blogi/${post.slug}`;
    const faqs = post.faq && post.faq.length > 0 ? post.faq : DEFAULT_BLOG_FAQS;
    const linked = (post.productLinks ?? []).filter((l) => bySlug.has(l.slug));
    // Samat tuotenostot kuin React-sivulla (src/data/blogProducts.ts): keskellä ja lopussa.
    const theme = getBlogProductTheme(post.slug);
    const { mid, end } = splitBlogProducts(selectBlogProducts(theme, products));
    const productLinks = (list: Product[]) =>
      list.map((p) => ({ href: `/tuote/${p.slug}`, label: p.name, note: formatPriceFi(p.price) }));
    const cta = { href: theme.href, label: `Katso tuotteet: ${theme.name}` };
    const lines = post.content.split("\n");
    const midLine = blogMidInsertLine(post.content);
    const before = lines.slice(0, midLine).join("\n");
    const after = lines.slice(midLine).join("\n");
    return {
      path,
      title: post.metaTitle,
      description: post.metaDescription,
      h1: post.title,
      ogType: "article" as const,
      breadcrumbs: [HOME, crumb("Blogi", "/blogi"), crumb(post.title, path)],
      intro: [post.excerpt],
      sections: [
        { markdown: before },
        ...(mid.length > 0 ? [{ heading: theme.heading, links: [...productLinks(mid), cta] }] : []),
        ...(after.trim() ? [{ markdown: after }] : []),
        ...(end.length > 0 ? [{ heading: theme.heading, links: [...productLinks(end), cta] }] : []),
        { heading: "Lisää lahjaideoita", links: theme.related.map((href) => ({ href, label: blogPageLabel(href) })) },
        ...(linked.length > 0
          ? [{ heading: "Artikkelissa mainitut tuotteet", links: linked.map((l) => ({ href: `/tuote/${l.slug}`, label: l.label })) }]
          : []),
      ],
      faqs,
      // Sama Article + FAQPage + ItemList -graafi kuin selaimessa (src/lib/blogJsonLd.ts).
      jsonLd: [buildBlogPostJsonLd(post, faqs, [...mid, ...end.filter((p) => !mid.includes(p))])],
    };
  });
}

function buildFaqPage(): PrerenderPage {
  return staticPage("/usein-kysytyt-kysymykset", {
    faqs: SITE_FAQS,
    jsonLd: [buildFaqJsonLd(SITE_FAQS)],
  });
}

function buildComponentPages(componentHtml: BuildOptions["componentHtml"] = {}): PrerenderPage[] {
  return (Object.keys(COMPONENT_PAGES) as ComponentPagePath[]).map((path) => {
    const html = componentHtml[path];
    return staticPage(path, html ? { contentHtml: html } : { intro: [STATIC_PAGE_META[path].description] });
  });
}

/** Laskeutumissivut (src/data/landingPages.ts). */
export function buildLandingPages(products: Product[]): PrerenderPage[] {
  return landingPages.map((page) => {
    const list = selectLandingProducts(page, products);
    const shown = list.slice(0, LANDING_GRID_LIMIT);
    const related = landingRelatedLinks(page);
    const extra = page.extraLinks ?? [];
    return {
      path: page.path,
      title: page.title,
      description: page.description,
      h1: page.h1,
      ogImage: productImage(list[0]?.images[0]),
      breadcrumbs: landingBreadcrumbs(page),
      intro: page.intro,
      sections: [
        ...(page.spotlight
          ? [{ heading: page.spotlight.heading, paragraphs: [page.spotlight.text], links: page.spotlight.links }]
          : []),
        { heading: "Lisää lahjaideoita", links: [...related, ...extra] },
        { heading: "Tuotekategoriat", links: landingCategoryLinks(page) },
      ],
      productsHeading: list.length > shown.length ? `Tuotteet (${shown.length} / ${list.length})` : `Tuotteet (${list.length})`,
      products: toPrerenderProducts(shown),
      faqs: page.faqs,
      jsonLd: buildLandingJsonLd(page, list),
    };
  });
}

/** /joulun-viimeiset-tilauspaivat */
export function buildChristmasDeadlinePage(): PrerenderPage {
  const page = christmasDeadlinePage;
  return {
    path: page.path,
    title: page.title,
    description: page.description,
    h1: page.h1,
    breadcrumbs: [HOME, crumb("Joululahjat", "/joululahjat"), crumb(page.name, page.path)],
    intro: page.intro,
    sections: [
      ...page.sections.map((s) => ({ heading: s.heading, paragraphs: s.paragraphs })),
      { heading: "Joululahjaoppaat", links: page.links },
    ],
    faqs: page.faqs,
    jsonLd: [buildFaqJsonLd(page.faqs)],
  };
}

export function buildProductPage(product: Product, all: Product[]): PrerenderPage {
  const path = `/tuote/${product.slug}`;
  const category = categories.find((c) => c.slug === product.category);
  const categoryName = category?.name || product.category;
  const copy = generateProductCopy({
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    price: product.price,
    description: product.description,
  });
  // Sama järjestys kuin ProductPage: käsin kirjoitettu kuvaus > siistitty tietokannan kuvaus > generoitu.
  const override = getProductContent(product.slug);
  const description = override
    ? override.description
    : isGenericDescription(product.description)
      ? copy.longDescription
      : sanitizeProductDescription(product.description);
  const images = product.images.map((img) => productImage(img)).filter((x): x is string => !!x);
  const { faqs: genericFaqs } = buildProductFaqs(product, categoryName, { isCustom: isCustomTextProduct(product) });
  const faqs = mergeFaqs(override?.faqs ?? [], genericFaqs);
  const imageAlts = product.images.slice(0, 4).flatMap((img, i) => {
    const src = productImage(img);
    return src ? [{ src, alt: productImageAlt(product, { url: img, index: i }) }] : [];
  });
  const related = all.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 8);
  // Pääkuva samalla valinnalla ja srcsetillä kuin ProductPage (oletusvärin ensimmäinen kuva).
  const mainImage = productImageSources(defaultColorImages(product)[0]);
  return {
    path,
    title: `${product.name} | Huumorikauppa`,
    description: override ? truncateAtWord(override.description.replace(/\s+/g, " "), 155) : copy.shortDescription,
    h1: product.name,
    price: product.price,
    images: imageAlts,
    ogType: "product",
    ogImage: images[0],
    preloadImage: mainImage.srcSet ? { href: mainImage.src, srcset: mainImage.srcSet, sizes: PRODUCT_IMAGE_SIZES } : undefined,
    breadcrumbs: [HOME, crumb(categoryName, `/kategoria/${product.category}`), crumb(product.name, path)],
    sections: [
      { paragraphs: description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) },
      { heading: "Materiaali ja hoito", paragraphs: [copy.material, copy.care] },
      { heading: "Toimitus ja palautus", paragraphs: [DELIVERY_FACTS] },
      { links: [{ href: `/kategoria/${product.category}`, label: `Kaikki ${categoryName.toLowerCase()}` }] },
    ],
    productsHeading: "Samankaltaisia tuotteita",
    products: toPrerenderProducts(related),
    faqs,
    jsonLd: [
      buildProductJsonLd({
        id: product.id,
        slug: product.slug,
        name: product.name,
        description,
        images,
        price: product.price,
        stock: product.stock,
        categoryName,
        variants: product.variants,
      }),
      buildFaqJsonLd(faqs),
    ],
  };
}

/** Kaikki esirenderöitävät sivut. */
export function buildPrerenderPages(opts: BuildOptions): PrerenderPage[] {
  const { products } = opts;
  return [
    buildHome(products),
    buildAllProducts(products),
    ...buildCategoryPages(products),
    ...buildGiftPages(products),
    ...buildLandingPages(products),
    buildChristmasDeadlinePage(),
    buildMothersDay(products),
    ...buildSituationPages(products),
    ...buildContentGraphPages(products),
    buildBlogIndex(),
    ...buildBlogPosts(products),
    buildFaqPage(),
    ...buildComponentPages(opts.componentHtml),
    ...products.map((p) => buildProductPage(p, products)),
  ];
}
