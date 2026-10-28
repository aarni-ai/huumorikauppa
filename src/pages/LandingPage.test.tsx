import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import snapshot from "@/test/fixtures/products-snapshot.json";
import { normalizeProducts, type ProductRow } from "@/seo/prerender/pages";

const products = normalizeProducts(snapshot as unknown as ProductRow[]);

vi.mock("@/hooks/use-products", () => ({
  useProducts: () => ({ data: products, isLoading: false }),
}));
vi.mock("@/components/ProductCard", () => ({
  ProductCard: ({ product }: { product: { slug: string; name: string } }) => (
    <a href={`/tuote/${product.slug}`}>{product.name}</a>
  ),
}));

import LandingPage from "./LandingPage";
import ChristmasDeadlinePage from "./ChristmasDeadlinePage";

function renderAt(path: string, element: JSX.Element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={element} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LandingPage (client)", () => {
  it("renders H1, intro, products, FAQ and internal links", () => {
    renderAt("/joululahja-isalle", <LandingPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Hauska joululahja isälle" })).toBeInTheDocument();
    expect(screen.getByText(/Hauska joululahja isälle on paita tai huppari/)).toBeInTheDocument();
    expect(screen.getAllByRole("link").filter((a) => a.getAttribute("href")?.startsWith("/tuote/")).length).toBeGreaterThanOrEqual(8);
    expect(screen.getByText("Mikä on hauska joululahja isälle?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Isänpäivälahja isän tyypin mukaan" })).toHaveAttribute("href", "/isanpaivalahja");
    expect(screen.getByRole("link", { name: "Hauska isänpäivälahja" })).toHaveAttribute("href", "/hauska-isanpaivalahja");
    expect(document.title).toBe("Hauska joululahja isälle 2026 | Huumorikauppa");
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://huumorikauppa.fi/joululahja-isalle");
  });

  it.each([
    ["/isanpaivalahja", "Isänpäivälahja isän tyypin mukaan", "/hauska-isanpaivalahja"],
    ["/hauska-isanpaivalahja", "Hauska isänpäivälahja", "/isanpaivalahja"],
  ])("renders the Father's Day page %s", (path, h1, sibling) => {
    renderAt(path, <LandingPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: h1 })).toBeInTheDocument();
    expect(screen.getAllByRole("link").filter((a) => a.getAttribute("href")?.startsWith("/tuote/")).length).toBeGreaterThanOrEqual(8);
    expect(screen.getAllByRole("link").some((a) => a.getAttribute("href") === sibling)).toBe(true);
    expect(screen.getAllByRole("link").some((a) => a.getAttribute("href") === "/joululahja-isalle")).toBe(true);
    expect(screen.getAllByRole("link").some((a) => a.getAttribute("href") === "/lahjat/isoisalle")).toBe(true);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`https://huumorikauppa.fi${path}`);
  });

  it("renders the Christmas deadline page", () => {
    renderAt("/joulun-viimeiset-tilauspaivat", <ChristmasDeadlinePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Joulun viimeiset tilauspäivät 2026");
    expect(screen.getAllByText(/30\.11\.2026/).length).toBeGreaterThan(0);
  });
});
