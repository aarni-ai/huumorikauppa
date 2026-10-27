import { describe, expect, it, vi } from "vitest";

// Esikatselu ei tee hakuja; Supabase-asiakasta ei tarvita (eikä testissä ole sen ympäristömuuttujia).
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { productSeedScript, renderHomePreview, renderProductPreview, toPreviewHtml } from "./renderPreview";
import type { Tables } from "@/integrations/supabase/types";

const row = {
  id: "p1",
  name: "Testipaita",
  slug: "testipaita-t-paita",
  category: "t-paidat",
  humor_type: null,
  price: 24.9,
  stock: 100,
  description: "Hauska paita.",
  images: ["https://images-api.printify.com/mockup/a/1/oletus.jpg", "https://images-api.printify.com/mockup/a/2/taka.jpg"],
  variants: {
    colors: ["Musta", "Valkoinen"],
    sizes: ["S", "M", "L"],
    default_color: "Valkoinen",
    variant_images: { Valkoinen: ["https://images-api.printify.com/mockup/a/3/valkoinen.jpg"] },
  },
  is_featured: false,
  is_new: false,
  is_gift_idea: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
} as unknown as Tables<"products">;

describe("toPreviewHtml", () => {
  it("wraps the markup in an inert preview and turns H1s into divs", () => {
    expect(toPreviewHtml('<h1 class="a">Nimi</h1><h2>Muu</h2>')).toBe(
      '<div data-prerender-visual="true" inert=""><div class="a">Nimi</div><h2>Muu</h2></div>',
    );
  });
});

describe("renderProductPreview", () => {
  const html = renderProductPreview(row, Date.UTC(2026, 0, 15));

  it("renders the above-the-fold product view without H1 and without below-the-fold sections", () => {
    expect(html.startsWith('<div data-prerender-visual="true" inert="">')).toBe(true);
    expect(html).not.toMatch(/<h1[\s>]/);
    expect(html).toContain("Testipaita");
    expect(html).toContain("Lisää koriin");
    expect(html).not.toContain("Tuotekuvaus");
  });

  it("embeds the product row as a JSON seed for the client (no Supabase round trip before reveal)", () => {
    const seed = html.match(/<script type="application\/json" data-product-seed>([\s\S]*?)<\/script>/);
    expect(seed).not.toBeNull();
    expect(JSON.parse(seed![1]).slug).toBe("testipaita-t-paita");
  });

  it("escapes < in the seed so it cannot close the script element", () => {
    const out = productSeedScript({ description: "</script><b>" });
    expect(out).not.toContain("</script><b>");
    expect(JSON.parse(out.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "")).description).toBe("</script><b>");
  });

  it("shows the default colour's image first as the high-priority (LCP) image, with its sizes", () => {
    const first = html.match(/<img[^>]*fetchpriority="high"[^>]*>/)?.[0] ?? "";
    expect(first).toContain("valkoinen.jpg");
    expect(html).toMatch(/aria-label="Koko"[\s\S]*?>S<\/button>/);
  });
});

describe("renderHomePreview", () => {
  it("renders the home hero image without an H1 heading tag", () => {
    const html = renderHomePreview(Date.UTC(2026, 0, 15));
    expect(html).toContain("/images/etusivu-hero-800.webp");
    expect(html).not.toMatch(/<h1[\s>]/);
  });
});
