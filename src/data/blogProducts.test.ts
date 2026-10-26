import { describe, expect, it } from "vitest";
import snapshot from "@/test/fixtures/products-snapshot.json";
import { normalizeProducts, GIFT_ROUTE_SLUGS, type ProductRow } from "@/seo/prerender/pages";
import { blogPosts } from "./blog";
import { categories } from "./products";
import { municipalities } from "./municipalities";
import { isLandingPath, looksLikeMug } from "./landingPages";
import { STATIC_PAGE_META } from "@/seo/staticPageMeta";
import { christmasDeadlinePage } from "./christmasDeadlinePage";
import { onPiilotettu, onPiilotettuTuote } from "@/lib/hiddenCategories";
import { isFullyUnavailable } from "@/lib/variantAvailability";
import { isCityProduct } from "./themes";
import {
  BLOG_END_COUNT,
  BLOG_MID_COUNT,
  BLOG_POST_THEMES,
  BLOG_PRODUCT_THEMES,
  blogMidInsertLine,
  blogPageLabel,
  DEFAULT_THEME,
  getBlogProductTheme,
  selectBlogProducts,
  splitBlogProducts,
} from "./blogProducts";

const products = normalizeProducts(snapshot as unknown as ProductRow[]);

/** Sivu on olemassa: laskeutumissivu, näkyvä kategoria, kaupunkisivu, lahjareitti tai staattinen sivu. */
function pageExists(href: string): boolean {
  if (isLandingPath(href)) return true;
  if (href === christmasDeadlinePage.path) return true;
  if (href in STATIC_PAGE_META) return true;
  const cat = href.match(/^\/kategoria\/([a-z0-9-]+)$/)?.[1];
  if (cat) return categories.some((c) => c.slug === cat) && !onPiilotettu(cat);
  const town = href.match(/^\/kaupunki\/([a-z0-9-]+)$/)?.[1];
  if (town) return municipalities.some((m) => m.slug === town);
  return (GIFT_ROUTE_SLUGS as readonly string[]).includes(href.slice(1));
}

describe("blogiartikkelien tuotenostot", () => {
  it("jokaisella artikkelilla on oma teema (kartassa ei vanhentuneita slugeja)", () => {
    const slugs = new Set(blogPosts.map((p) => p.slug));
    for (const p of blogPosts) expect(BLOG_POST_THEMES[p.slug], p.slug).toBeDefined();
    for (const s of Object.keys(BLOG_POST_THEMES)) expect(slugs.has(s), s).toBe(true);
  });

  it("tuntematon artikkeli saa oletusteeman", () => {
    expect(getBlogProductTheme("ei-ole-olemassa")).toBe(BLOG_PRODUCT_THEMES[DEFAULT_THEME]);
  });

  it.each(Object.entries(BLOG_PRODUCT_THEMES))("teeman %s kohde ja liittyvät sivut ovat olemassa", (_key, theme) => {
    expect(pageExists(theme.href), theme.href).toBe(true);
    expect(theme.related.length).toBeGreaterThanOrEqual(3);
    for (const href of theme.related) {
      expect(pageExists(href), href).toBe(true);
      expect(href).not.toBe(theme.href);
      expect(blogPageLabel(href)).not.toMatch(/^\//);
    }
    expect(theme.name).not.toMatch(/[–—]/);
    expect(theme.heading).not.toMatch(/[–—]/);
  });

  it.each(blogPosts.map((p) => p.slug))("%s: vähintään 3 myynnissä olevaa tuotetta keskelle ja loppuun", (slug) => {
    const theme = getBlogProductTheme(slug);
    const list = selectBlogProducts(theme, products);
    expect(list.length).toBeGreaterThanOrEqual(3);
    expect(new Set(list.map((p) => p.slug)).size).toBe(list.length);
    for (const p of list) {
      expect(onPiilotettuTuote(p), p.slug).toBe(false);
      expect(looksLikeMug(p), p.slug).toBe(false);
      expect(isFullyUnavailable(p), p.slug).toBe(false);
      if (!theme.cities) expect(isCityProduct(p), p.slug).toBe(false);
    }
    const { mid, end } = splitBlogProducts(list);
    expect(mid.length).toBe(BLOG_MID_COUNT);
    expect(end.length).toBeGreaterThanOrEqual(3);
    expect(end.length).toBeLessThanOrEqual(BLOG_END_COUNT);
  });

  it("aiheen omat tuotteet tulevat ensin", () => {
    const elake = selectBlogProducts(getBlogProductTheme("hauskat-elakelahjat-opas"), products);
    expect(elake[0].name.toLowerCase()).toMatch(/eläk|vapautunut|ikuinen viikonloppu|työtön/);
    const kalastaja = selectBlogProducts(getBlogProductTheme("hauska-lahja-kalastajalle"), products);
    expect(kalastaja[0].name.toLowerCase()).toMatch(/kala|pilkki|metsäst/);
    const helsinki = selectBlogProducts(getBlogProductTheme("hauska-lahja-helsinkilaiselle"), products);
    expect(helsinki[0].description).toContain("#kaupunki:Helsinki");
  });

  it("tehtävänannon esimerkit: joulu, eläke ja ammatti osoittavat oikeille laskeutumissivuille", () => {
    expect(getBlogProductTheme("parhaat-joululahjat-ja-pikkujoululahjat-2026").href).toBe("/joululahjat");
    expect(getBlogProductTheme("hauskimmat-elakelahjat-selviytymisopas").href).toBe("/elakelahjat");
    expect(getBlogProductTheme("hauskat-valmistujaislahjat").href).toBe("/ammattipaidat");
    expect(getBlogProductTheme("20-hauskinta-t-paitaa-2026").related).toContain("/tonnin-seteli-paita");
  });

  it("keskimmäinen lohko tulee kahden osion jälkeen", () => {
    expect(blogMidInsertLine("## A\nx\n## B\ny\n## C\nz")).toBe(4);
    expect(blogMidInsertLine("## A\nx\n## B\ny")).toBe(2);
    expect(blogMidInsertLine("a\nb\n\nc\nd")).toBe(2);
    for (const p of blogPosts) {
      const line = blogMidInsertLine(p.content);
      expect(line, p.slug).toBeGreaterThan(0);
      expect(line, p.slug).toBeLessThanOrEqual(p.content.split("\n").length);
    }
  });
});
