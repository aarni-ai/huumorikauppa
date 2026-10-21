/**
 * Laskeutumissivujen murupolku, linkit ja JSON-LD. Yksi lähde React-sivulle
 * (src/pages/LandingPage.tsx) ja esirenderöinnille (src/seo/prerender/pages.ts).
 */
import { categories } from "@/data/products";
import {
  getLandingPage,
  LANDING_GRID_LIMIT,
  type LandingPageDef,
  type LandingProduct,
} from "@/data/landingPages";
import { SITE_URL } from "./site";
import { buildFaqJsonLd, type BreadcrumbItem, type JsonLd } from "./structuredData";

export interface LandingLink {
  href: string;
  label: string;
}

export function landingBreadcrumbs(page: LandingPageDef): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ name: "Etusivu", url: `${SITE_URL}/` }];
  if (page.group === "joulu" && page.path !== "/joululahjat") {
    items.push({ name: "Joululahjat", url: `${SITE_URL}/joululahjat` });
  }
  items.push({ name: page.name, url: `${SITE_URL}${page.path}` });
  return items;
}

/** Muut laskeutumissivut, joihin sivu linkittää (vain olemassa olevat). */
export function landingRelatedLinks(page: LandingPageDef): LandingLink[] {
  return page.related
    .map((path) => getLandingPage(path))
    .filter((p): p is LandingPageDef => !!p && p.path !== page.path)
    .map((p) => ({ href: p.path, label: p.h1 }));
}

export function landingCategoryLinks(page: LandingPageDef): LandingLink[] {
  return page.categories
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is (typeof categories)[number] => !!c)
    .map((c) => ({ href: `/kategoria/${c.slug}`, label: c.name }));
}

export function buildLandingItemList(page: LandingPageDef, products: LandingProduct[]): JsonLd {
  const items = products.slice(0, LANDING_GRID_LIMIT);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: page.h1,
    url: `${SITE_URL}${page.path}`,
    numberOfItems: items.length,
    itemListElement: items.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/tuote/${p.slug}`,
      name: p.name,
    })),
  };
}

/** Sivun oma JSON-LD (BreadcrumbList lisätään erikseen SEOHeadissa ja esirenderöinnissä). */
export function buildLandingJsonLd(page: LandingPageDef, products: LandingProduct[]): JsonLd[] {
  return [buildLandingItemList(page, products), buildFaqJsonLd(page.faqs)];
}
