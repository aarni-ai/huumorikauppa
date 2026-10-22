import { describe, it, expect, vi } from "vitest";

vi.mock("../../api/_lib/printify-saatavuus.js", () => ({
  SAATAVUUS_GENERATED_AT: "2026-10-22T00:00:00.000Z",
  KOKONAAN_EI_SAATAVILLA: new Set(["ei-valmisteta-t-paita"]),
}));

const { dropHiddenItems } = await import("../../api/product-feed.js");

const item = (slug: string) => `
    <item>
      <g:id>${slug}</g:id>
      <g:title>Paita</g:title>
      <g:link>https://huumorikauppa.fi/tuote/${slug}</g:link>
      <g:google_product_category>Apparel &amp; Accessories &gt; Clothing</g:google_product_category>
    </item>`;

describe("Merchant-syöte ja Printify-saatavuus", () => {
  it("tuote, jonka yhtään kokoa tai väriä ei valmisteta, pudotetaan; muut säilyvät", () => {
    const xml = `<rss><channel>${item("ei-valmisteta-t-paita")}${item("hyva-t-paita")}</channel></rss>`;
    const out = dropHiddenItems(xml);
    expect(out).not.toContain("ei-valmisteta-t-paita");
    expect(out).toContain("<g:id>hyva-t-paita</g:id>");
  });
});
