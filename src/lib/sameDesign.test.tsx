import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import snapshot from "@/test/fixtures/products-snapshot.json";
import { normalizeProducts, type ProductRow } from "@/seo/prerender/pages";
import type { Product } from "@/types/product";
import { designKey, productTypeLabel, sameDesignLinks } from "./sameDesign";
import { SameDesignLinks } from "@/components/SameDesignLinks";

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

describe("designKey", () => {
  it("teksti ennen erotinta, kirjainkoko ja välimerkit normalisoitu", () => {
    expect(designKey("Tonnin Seteli | T-Paita")).toBe("tonnin seteli");
    expect(designKey("Tonnin seteli | Juliste (poster)")).toBe("tonnin seteli");
    expect(designKey("Tonnin Seteli | Huppari")).toBe(designKey("tonnin seteli | Tarra"));
  });

  it("ajatusviiva ja pilkut eivät erota designeja", () => {
    expect(designKey("60v – kokenut, ei vanha | Muki")).toBe(designKey("60v kokenut, ei vanha | Juliste (poster)"));
  });

  it("leveä erotin ｜ (ICE AATANA｜T-Paita)", () => {
    expect(designKey("ICE AATANA｜T-Paita")).toBe("ice aatana");
    expect(designKey("ICE AATANA | Tarra")).toBe("ice aatana");
  });

  it("eri teksti on eri design", () => {
    expect(designKey("se oli tonnin seteli. | Huppari")).not.toBe(designKey("Tonnin Seteli | Huppari"));
  });

  it("ilman erotinta ei designia", () => {
    expect(designKey("Hauska T-Paita Koodarille – Ei Se Ole Bugi")).toBeNull();
    expect(designKey("")).toBeNull();
    expect(designKey(undefined)).toBeNull();
  });
});

describe("productTypeLabel", () => {
  it("kategoriasta ja nimestä", () => {
    expect(productTypeLabel({ name: "X | T-Paita", category: "t-paidat" })).toBe("T-paita");
    expect(productTypeLabel({ name: "X | Lasten t-paita", category: "t-paidat" })).toBe("Lasten t-paita");
    expect(productTypeLabel({ name: "X | Juliste (poster)", category: "seinataulut" })).toBe("Juliste");
    expect(productTypeLabel({ name: "X | Tarra", category: "tarrat" })).toBe("Tarra");
    expect(productTypeLabel({ name: "X | Body", category: "bodyt" })).toBe("Vauvan body");
  });
});

describe("sameDesignLinks", () => {
  const paita = make({ slug: "tonnin-seteli-t-paita", name: "Tonnin Seteli | T-Paita", category: "t-paidat" });
  const huppari = make({ slug: "tonnin-seteli-huppari", name: "Tonnin Seteli | Huppari", category: "hupparit", price: 49.9 });
  const juliste = make({ slug: "tonnin-seteli-juliste-poster", name: "Tonnin seteli | Juliste (poster)", category: "seinataulut", price: 22.9 });
  const tarra = make({ slug: "tonnin-seteli-tarra", name: "Tonnin seteli | Tarra", category: "tarrat", price: 9.9 });
  const muki = make({ slug: "tonnin-seteli-kahvikuppi", name: "tonnin seteli | Kahvikuppi", category: "mukit", price: 14.9 });
  const toinenDesign = make({ slug: "se-oli-tonnin-seteli-huppari", name: "se oli tonnin seteli. | Huppari", category: "hupparit" });
  const kaksoiskappale = make({ slug: "tonnin-seteli-t-paita-0d6670", name: "Tonnin Seteli | T-Paita", category: "t-paidat" });

  it("muut tuotetyypit, oma tyyppi ja muut designit pois, kiinteä järjestys", () => {
    const links = sameDesignLinks(paita, [tarra, toinenDesign, juliste, paita, huppari, kaksoiskappale]);
    expect(links.map((l) => l.label)).toEqual(["Huppari", "Tarra", "Juliste"]);
    expect(links.map((l) => l.product.slug)).toEqual(["tonnin-seteli-huppari", "tonnin-seteli-tarra", "tonnin-seteli-juliste-poster"]);
  });

  it("piilotetut (muki) eivät tule linkeiksi", () => {
    const links = sameDesignLinks(paita, [muki, huppari]);
    expect(links.map((l) => l.label)).toEqual(["Huppari"]);
  });

  it("ei tilattavaa varianttia: ei linkkiä", () => {
    const loppu = make({
      slug: "tonnin-seteli-lasten-t-paita",
      name: "Tonnin seteli | Lasten t-paita",
      category: "t-paidat",
      variants: { colors: ["Musta"], sizes: ["S"], variant_map: { "Valkoinen|M": 1 } },
    });
    expect(sameDesignLinks(paita, [loppu])).toEqual([]);
  });

  it("uusi synkronoitu tuote tulee mukaan pelkän nimen perusteella", () => {
    const uusi = make({ slug: "tonnin-seteli-lasten-t-paita", name: "Tonnin seteli | Lasten t-paita", category: "t-paidat" });
    expect(sameDesignLinks(juliste, [paita, uusi]).map((l) => l.label)).toEqual(["T-paita", "Lasten t-paita"]);
  });

  it("tuote ilman designia: ei linkkejä", () => {
    const vapaa = make({ slug: "hauska-paita", name: "Hauska paita koodarille", category: "t-paidat" });
    expect(sameDesignLinks(vapaa, [vapaa, paita])).toEqual([]);
  });

  it("kaupan tilannekuva: Tonnin Seteli -paidasta huppariin, ei mukiin eikä toiseen designiin", () => {
    const products = normalizeProducts(snapshot as unknown as ProductRow[]);
    const base = products.find((p) => p.slug === "tonnin-seteli-t-paita")!;
    const links = sameDesignLinks(base, products);
    expect(links.map((l) => l.product.slug)).toContain("tonnin-seteli-huppari");
    expect(links.map((l) => l.product.slug)).not.toContain("tonnin-seteli-kahvikuppi");
    expect(links.map((l) => l.product.slug)).not.toContain("se-oli-tonnin-seteli-huppari");
  });
});

describe("<SameDesignLinks>", () => {
  const paita = make({ slug: "ice-aatanat-paita", name: "ICE AATANA｜T-Paita", category: "t-paidat" });
  const huppari = make({ slug: "ice-aatanahuppari", name: "ICE AATANA｜Huppari", category: "hupparit" });
  const juliste = make({ slug: "ice-aatana-juliste-poster", name: "ICE AATANA | Juliste (poster)", category: "seinataulut" });

  it("linkit tuotesivuille erottimella", () => {
    render(
      <MemoryRouter>
        <SameDesignLinks product={paita} all={[paita, huppari, juliste]} />
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "Sama design muina tuotteina" });
    expect(nav.textContent).toBe("Sama design myös: Huppari · Juliste");
    expect(screen.getByRole("link", { name: "Huppari" }).getAttribute("href")).toBe("/tuote/ice-aatanahuppari");
    expect(screen.getByRole("link", { name: "Juliste" }).getAttribute("href")).toBe("/tuote/ice-aatana-juliste-poster");
  });

  it("ei mitään, kun muita tyyppejä ei ole", () => {
    const { container } = render(
      <MemoryRouter>
        <SameDesignLinks product={paita} all={[paita]} />
      </MemoryRouter>,
    );
    expect(container.innerHTML).toBe("");
  });
});
