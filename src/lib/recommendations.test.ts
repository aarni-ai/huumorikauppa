import { describe, expect, it } from "vitest";
import snapshot from "@/test/fixtures/products-snapshot.json";
import { normalizeProducts, type ProductRow } from "@/seo/prerender/pages";
import type { Product } from "@/types/product";
import { onPiilotettuTuote } from "@/lib/hiddenCategories";
import { isRecommendable, quickAddOption, selectComplementary, themeText } from "./recommendations";
import { freeShippingStatus, ILMAINEN_TOIMITUS_RAJA } from "@/config/toimitus";

/** Kaupan tuotteet (Supabase-tilannekuva): sama suodatus kuin kaupassa. */
const products = normalizeProducts(snapshot as unknown as ProductRow[]);
const bySlug = (slug: string) => {
  const p = products.find((x) => x.slug === slug);
  if (!p) throw new Error(slug);
  return p;
};

function make(over: Partial<Product> & { slug: string; name: string; category: string }): Product {
  return {
    id: over.slug,
    humor_type: "yleinen",
    price: 24.9,
    stock: 99,
    description: "",
    images: [],
    variants: {},
    is_featured: false,
    is_new: false,
    is_gift_idea: false,
    ...over,
  };
}

describe("selectComplementary", () => {
  it("t-paita -> saman tekstin huppari ensin, sitten saman teeman tuotteet", () => {
    const base = bySlug("tonnin-seteli-t-paita");
    const picks = selectComplementary([base], products);
    expect(picks).toHaveLength(3);
    expect(picks[0].slug).toBe("tonnin-seteli-huppari");
    expect(picks.map((p) => p.slug)).toEqual(
      expect.arrayContaining(["se-oli-tonnin-seteli-huppari", "se-oli-tonnin-seteli-t-paita"]),
    );
    for (const p of picks) expect(p.slug).toContain("tonnin-seteli");
  });

  // 27.10.2026: saatanan-tunarit-huppari piilotettu (Printify Choice, api/_lib/eu-reititys.js), esimerkkinä amatimies.
  it("huppari -> saman tekstin t-paita ensin", () => {
    const picks = selectComplementary([bySlug("amatimies-huppari")], products);
    expect(picks[0].slug).toBe("amatimies-t-paita");
    expect(picks.length).toBeGreaterThanOrEqual(2);
  });

  it("ei palauta pohjatuotteita, piilotettuja, kaupunki- tai personoitavia tuotteita", () => {
    const sample = products.filter((p) => p.category === "t-paidat").slice(0, 40);
    for (const base of sample) {
      const picks = selectComplementary([base], products);
      expect(picks.length, base.slug).toBeLessThanOrEqual(3);
      for (const p of picks) {
        expect(p.id).not.toBe(base.id);
        expect(onPiilotettuTuote(p), p.slug).toBe(false);
        expect(isRecommendable(p), p.slug).toBe(true);
        expect(p.description ?? "").not.toContain("#kaupunki:");
      }
    }
  });

  it("piilotettu muki ja valmistamaton tuote eivät tule suositeltaviksi, vaikka ne olisivat listassa", () => {
    const base = make({ slug: "oispa-kaljaa-t-paita-x", name: "oispa kaljaa | T-Paita", category: "t-paidat" });
    const mug = make({ slug: "oispa-kaljaa-kahvikuppi", name: "oispa kaljaa | Kahvikuppi", category: "mukit" });
    const unavailable = make({
      slug: "oispa-kaljaa-huppari-x",
      name: "oispa kaljaa | Huppari",
      category: "hupparit",
      variants: { colors: ["Musta"], sizes: ["S", "M"], variant_map: { "Valkoinen|S": 1 } },
    });
    const ok = make({
      slug: "oispa-kaljaa-pitkahihainen",
      name: "oispa kaljaa | Pitkähihainen",
      category: "pitkahihaiset",
      variants: { colors: ["Musta"], sizes: ["S", "M"], variant_map: { "Musta|S": 1, "Musta|M": 2 } },
    });
    const picks = selectComplementary([base], [base, mug, unavailable, ok]);
    expect(picks.map((p) => p.slug)).toEqual(["oispa-kaljaa-pitkahihainen"]);
  });

  it("ostoskori: useasta tuotteesta ei suositella korissa jo olevia", () => {
    const cart = [bySlug("tonnin-seteli-t-paita"), bySlug("tonnin-seteli-huppari")];
    const picks = selectComplementary(cart, products);
    expect(picks.length).toBeGreaterThanOrEqual(2);
    for (const p of picks) expect(cart.map((c) => c.id)).not.toContain(p.id);
  });

  it("tyhjä pohja -> ei suosituksia", () => {
    expect(selectComplementary([], products)).toEqual([]);
  });

  it("teemateksti ilman tuoteryhmää", () => {
    expect(themeText("se oli tonnin seteli. | Huppari")).toBe("se oli tonnin seteli");
    expect(themeText("Tonnin Seteli | T-Paita")).toBe("tonnin seteli");
  });
});

describe("quickAddOption", () => {
  it("vaate, jossa on useita kokoja: koko valitaan, vain oletusvärillä valmistettavat koot", () => {
    const p = make({
      slug: "testi-huppari",
      name: "Testi | Huppari",
      category: "hupparit",
      variants: {
        colors: ["Musta", "Valkoinen"],
        sizes: ["S", "M", "L"],
        default_color: "Musta",
        variant_map: { "Musta|S": 1, "Musta|L": 3, "Valkoinen|M": 4 },
      },
    });
    expect(quickAddOption(p)).toEqual({ kind: "choose-size", color: "Musta", sizes: ["S", "L"] });
  });

  it("valmistamaton oletusväri vaihtuu ensimmäiseen valmistettavaan", () => {
    const p = make({
      slug: "testi-paita",
      name: "Testi | T-Paita",
      category: "t-paidat",
      variants: { colors: ["Musta", "Valkoinen"], sizes: ["S", "M"], default_color: "Musta", variant_map: { "Valkoinen|M": 1 } },
    });
    expect(quickAddOption(p)).toEqual({ kind: "choose-size", color: "Valkoinen", sizes: ["M"] });
  });

  it("kokoton tuote lisätään yhdellä klikkauksella valmistettavalla variantilla", () => {
    const p = make({
      slug: "testi-koriste",
      name: "Testi | Koriste",
      category: "koristeet",
      variants: { sizes: ["3 in"], variant_map: { "|3 in": 1 } },
    });
    expect(quickAddOption(p)).toEqual({ kind: "add", size: "3 in", color: undefined });
  });

  it("personoitava tuote ja piilotettu tuote ohjataan tuotesivulle", () => {
    expect(quickAddOption(make({ slug: "oma-teksti-paita", name: "Oma Teksti/Kuva | T-Paita", category: "t-paidat" }))).toEqual({ kind: "link" });
    expect(quickAddOption(make({ slug: "testi-kahvikuppi", name: "Testi | Kahvikuppi", category: "mukit" }))).toEqual({ kind: "link" });
  });
});

describe("freeShippingStatus", () => {
  it("laskee puuttuvan summan konfiguraation rajasta", () => {
    expect(freeShippingStatus(0)).toEqual({ free: false, gap: ILMAINEN_TOIMITUS_RAJA, progress: 0 });
    expect(freeShippingStatus(ILMAINEN_TOIMITUS_RAJA).free).toBe(true);
    expect(freeShippingStatus(ILMAINEN_TOIMITUS_RAJA + 10).gap).toBe(0);
    const half = freeShippingStatus(ILMAINEN_TOIMITUS_RAJA / 2);
    expect(half.progress).toBeCloseTo(50);
  });

  it("ostoskorin paneeli ja poistumisikkuna eivät käytä kovakoodattua rajaa", async () => {
    const fs = await import("node:fs");
    for (const f of ["src/components/AddToCartDrawer.tsx", "src/components/ExitIntentPopup.tsx", "src/components/FreeShippingProgress.tsx"]) {
      const src = fs.readFileSync(f, "utf8");
      expect(src, f).not.toMatch(/\b(60|79)\s*-\s*totalPrice/);
      expect(src, f).not.toMatch(/Muut ostivat|Usein ostetaan/);
    }
  });
});
