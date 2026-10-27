import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import snapshot from "@/test/fixtures/products-snapshot.json";
import { CHRISTMAS_MENU, getLandingPage, selectLandingProducts } from "@/data/landingPages";
import { buildPrerenderPages, buildSiteNav, normalizeProducts, type ProductRow } from "./prerender/pages";
import { renderPageHtml } from "./prerender/html";
import { buildLlmsTxt } from "./llms";
import { landingMinimi } from "@/test/euReititysMinimi";

const ROOT = path.resolve(__dirname, "../..");
const products = normalizeProducts(snapshot as unknown as ProductRow[]);
const pages = new Map(buildPrerenderPages({ products }).map((p) => [p.path, p]));
const nav = buildSiteNav(products);
const TEMPLATE = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

/** Pyydetyt joululahjasivut (saaja tai budjetti -> sivu). Olemassa olevat käytetään, uusi vain eläkeläiselle. */
const SUBPAGES = {
  miehelle: "/lahjat/joululahjaksi-miehelle",
  naiselle: "/lahjat/joululahjaksi-naiselle",
  tyokaverille: "/joululahja-tyokaverille",
  isalle: "/joululahja-isalle",
  aidille: "/joululahja-aidille",
  elakelaiselle: "/joululahja-elakelaiselle",
  alle30: "/lahjat/alle-30-euroa",
};

describe("joululahjasivut", () => {
  const hub = getLandingPage("/joululahjat")!;

  it.each(Object.entries(SUBPAGES))("%s: joulusivu, tuotteita ja linkit hubiin ja takaisin", (_k, p) => {
    const page = getLandingPage(p)!;
    expect(page, p).toBeTruthy();
    expect(page.group).toBe("joulu");
    expect(hub.related).toContain(p);
    expect(page.related).toContain("/joululahjat");
    expect(selectLandingProducts(page, products).length).toBeGreaterThanOrEqual(landingMinimi(p));
    const html = renderPageHtml(TEMPLATE, pages.get(p)!, nav);
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('"name":"Joululahjat"');
    expect(html).toContain('href="/joululahjat"');
  });

  it("hub linkittää kaikki alasivut näkyvästi ja on valikossa", () => {
    const html = renderPageHtml(TEMPLATE, pages.get("/joululahjat")!, nav);
    for (const p of Object.values(SUBPAGES)) expect(html, p).toContain(`href="${p}"`);
    expect(CHRISTMAS_MENU.map((m) => m.href)).toContain("/joululahja-elakelaiselle");
  });

  it("eläkeläisen joululahjasivu: vain eläketuotteita, ei bodyja", () => {
    const list = selectLandingProducts(getLandingPage("/joululahja-elakelaiselle")!, products);
    for (const p of list) {
      expect(p.category).not.toBe("bodyt");
      expect(`${p.name} ${p.slug}`.toLowerCase()).toMatch(/eläk|elak|vapautunut virallisesti|ikuinen viikonloppu|virallisesti työtön/);
    }
  });

  it("sivukartta ja llms.txt sisältävät joululahjasivut", () => {
    const sitemap = fs.readFileSync(path.join(ROOT, "api/sitemap.js"), "utf8");
    const llms = buildLlmsTxt(products);
    const joulu = llms.slice(llms.indexOf("## Joulu 2026"), llms.indexOf("## Lahjaideat"));
    for (const p of ["/joululahjat", ...Object.values(SUBPAGES)]) {
      expect(sitemap, p).toContain(`"${p}"`);
      expect(joulu, p).toContain(`https://huumorikauppa.fi${p}`);
    }
  });
});
