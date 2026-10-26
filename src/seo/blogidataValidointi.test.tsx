import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import snapshot from "@/test/fixtures/products-snapshot.json";
import { normalizeProducts, type ProductRow } from "@/seo/prerender/pages";
import { blogPosts } from "@/data/blog";
import { getBlogProductTheme } from "@/data/blogProducts";
import { buildPrerenderPages, buildSiteNav } from "@/seo/prerender/pages";
import { renderPageHtml } from "@/seo/prerender/html";
import { validateBlogPage } from "../../scripts/blogidata-validointi.mjs";

const products = normalizeProducts(snapshot as unknown as ProductRow[]);

vi.mock("@/hooks/use-products", () => ({
  useProducts: () => ({ data: products, isLoading: false }),
}));

import BlogPost from "@/pages/BlogPost";

function renderPost(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/blogi/${slug}`]}>
      <Routes>
        <Route path="/blogi/:slug" element={<BlogPost />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
});

describe("blogisivujen rakenteinen data (React-renderöinti)", () => {
  it.each(blogPosts.map((p) => p.slug))("%s: ei vajaita Product-kohteita, ItemList kelvollinen", (slug) => {
    renderPost(slug);
    const { errors, counts } = validateBlogPage(document.documentElement.outerHTML);
    expect(errors).toEqual([]);
    expect(counts.products).toBe(0);
    expect(counts.microdataProducts).toBe(0);
    expect(counts.itemLists).toBe(1);
    expect(counts.listItems).toBeGreaterThanOrEqual(3);
    // Tuotekortit keskellä ja lopussa, Katso tuotteet -painike kohdesivulle, linkit liittyville sivuille.
    const theme = getBlogProductTheme(slug);
    const article = document.querySelector("article")!;
    const productHrefs = [...article.querySelectorAll("a")].map((a) => a.getAttribute("href") ?? "").filter((h) => h.startsWith("/tuote/"));
    expect(new Set(productHrefs).size).toBeGreaterThanOrEqual(3);
    const ctas = [...article.querySelectorAll("a")].filter((a) => a.textContent?.startsWith("Katso tuotteet"));
    expect(ctas.length).toBe(2);
    for (const a of ctas) expect(a.getAttribute("href")).toBe(theme.href);
    for (const href of theme.related) expect(article.querySelector(`a[href="${href}"]`), href).not.toBeNull();
    // Keskimmäinen lohko on tekstin sisällä (sen jälkeen tulee vielä artikkelin otsikoita tai tekstiä).
    const mid = ctas[0].closest("section")!;
    expect(mid.parentElement?.nextElementSibling).not.toBeNull();
  });
});

describe("blogisivujen rakenteinen data (esirenderöity HTML)", () => {
  const template =
    '<!doctype html><html lang="fi"><head><title>x</title><meta name="description" content="x"></head><body><div id="root"></div><script type="module" src="/assets/index.js"></script></body></html>';
  const pages = buildPrerenderPages({ products }).filter((p) => p.path.startsWith("/blogi/"));
  const nav = buildSiteNav(products);

  it("kaikki artikkelit esirenderöidään", () => {
    expect(pages.length).toBe(blogPosts.length);
  });

  it.each(pages.map((p) => [p.path, p] as const))("%s: 0 virhettä, tuotelinkit ja Katso tuotteet näkyvät ilman JavaScriptiä", (_path, page) => {
    const html = renderPageHtml(template, page, nav);
    const { errors, counts } = validateBlogPage(html);
    expect(errors).toEqual([]);
    expect(counts.products).toBe(0);
    expect(counts.itemLists).toBe(1);
    expect((html.match(/>Katso tuotteet[^<]*<\/a>/g) ?? []).length).toBe(2);
    expect(new Set([...html.matchAll(/href="\/tuote\/([^"]+)"/g)].map((m) => m[1])).size).toBeGreaterThanOrEqual(3);
  });
});

describe("validateBlogPage", () => {
  it("hylkää mikrodatan Productin ilman offersia ja ListItemin ilman urlia", () => {
    const html =
      `<script type="application/ld+json">${JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: [{ "@type": "ListItem", position: 1, name: "Paita" }],
      })}</script>` +
      `<a itemscope itemtype="https://schema.org/Product"><span itemprop="name">Paita</span></a>`;
    const { errors, counts } = validateBlogPage(html);
    expect(counts.microdataProducts).toBe(1);
    expect(errors.some((e) => e.includes("url puuttuu"))).toBe(true);
    expect(errors.some((e) => e.includes("mikrodatan Product"))).toBe(true);
  });

  it("hyväksyy ItemListin, jonka ListItemeillä on position ja url", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: [{ "@type": "ListItem", position: 1, url: "https://huumorikauppa.fi/tuote/a" }],
    })}</script>`;
    expect(validateBlogPage(html).errors).toEqual([]);
  });
});
