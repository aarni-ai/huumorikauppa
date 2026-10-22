import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

const addItem = vi.fn();

vi.mock("@/lib/variantAvailability", async (orig) => {
  const actual = await orig<typeof import("@/lib/variantAvailability")>();
  const a = actual.createAvailability({
    generated_at: "2026-10-22T00:00:00Z",
    products: { "testipaita": { unavailable: ["Valkoinen|S", "Valkoinen|M", "Valkoinen|L", "Valkoinen|XL", "Musta|XL", "Keltainen|S"] } },
    kokonaan_ei_saatavilla: [],
    summary: null,
  });
  return { ...actual, ...a };
});

const product = {
  id: "p1",
  name: "Testipaita",
  slug: "testipaita",
  category: "t-paidat",
  humor_type: "",
  price: 34.9,
  stock: 10,
  description: "Hauska paita.",
  images: ["https://example.com/a.jpg"],
  variants: { colors: ["Valkoinen", "Musta", "Keltainen"], sizes: ["S", "M", "L", "XL"], default_color: "Valkoinen" },
  is_featured: false,
  is_new: false,
  is_gift_idea: false,
  supplier: "printify",
};

vi.mock("@/hooks/use-products", () => ({
  useProduct: () => ({ product, products: [], isLoading: false }),
  useProducts: () => ({ data: [], isLoading: false }),
  piilotetutSlugit: new Set<string>(),
}));
vi.mock("@/context/CartContext", () => ({ useCartContext: () => ({ addItem }) }));

const { default: ProductPage } = await import("./ProductPage");

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/tuote/testipaita"]}>
        <Routes>
          <Route path="/tuote/:slug" element={<ProductPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

const vaihtoehdot = (ryhma: string) =>
  screen.getAllByRole("radiogroup", { name: ryhma })[0].querySelectorAll("[role=radio]");
const nimet = (ryhma: string) => [...vaihtoehdot(ryhma)].map((b) => b.textContent);

describe("ProductPage: Printify-saatavuus valitsimissa", () => {
  beforeEach(() => addItem.mockClear());

  it("väri ilman valmistettavia kokoja piilotetaan, oletus on valmistettava väri", () => {
    renderPage();
    expect(nimet("Väri")).not.toContain("Valkoinen");
    expect(nimet("Väri")).toEqual(expect.arrayContaining(["Musta", "Keltainen"]));
    const valittu = [...vaihtoehdot("Väri")].find((b) => b.getAttribute("aria-checked") === "true");
    expect(valittu?.textContent).toBe("Musta");
  });

  it("koot suodatetaan valitun värin mukaan ja valmistamaton valinta poistuu värin vaihtuessa", () => {
    renderPage();
    expect(nimet("Koko")).toEqual(["S", "M", "L"]);
    fireEvent.click([...vaihtoehdot("Koko")].find((b) => b.textContent === "S")!);
    fireEvent.click([...vaihtoehdot("Väri")].find((b) => b.textContent === "Keltainen")!);
    expect(nimet("Koko")).toEqual(["M", "L", "XL"]);
    expect([...vaihtoehdot("Koko")].some((b) => b.getAttribute("aria-checked") === "true")).toBe(false);
    fireEvent.click([...vaihtoehdot("Koko")].find((b) => b.textContent === "XL")!);
    fireEvent.click(screen.getAllByRole("button", { name: /Lisää koriin/i })[0]);
    expect(addItem).toHaveBeenCalledWith(product, 1, "XL", "Keltainen", undefined);
  });
});
