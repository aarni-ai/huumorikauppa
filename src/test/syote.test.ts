import { describe, it, expect } from "vitest";
import { lisaaKentat, sesonki } from "../../api/_lib/syote-lisakentat.js";

const item = (hinta: string) => `<item>
      <g:id>a1</g:id>
      <g:price>${hinta} EUR</g:price>
      <g:google_product_category>Apparel &amp; Accessories &gt; Clothing &gt; Shirts &amp; Tops &gt; T-Shirts</g:google_product_category>
      <g:shipping>
        <g:country>FI</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
    </item>`;

describe("Merchant-syötteen lisäkentät", () => {
  it("toimitus kassan säännöllä: 6,90 € alle 79 €, ilmainen 79 €:sta", () => {
    expect(lisaaKentat(item("24.90"))).toMatch(/<g:price>6\.90 EUR<\/g:price>\s*<\/g:shipping>/);
    expect(lisaaKentat(item("24.90"))).toContain("<g:shipping_label>vakiotoimitus</g:shipping_label>");
    expect(lisaaKentat(item("79.00"))).toMatch(/<g:price>0\.00 EUR<\/g:price>\s*<\/g:shipping>/);
  });
  it("product_type, identifier_exists ja sesonki; kateluokka vain kun kate tunnetaan", () => {
    const x = lisaaKentat(item("24.90"), { nyt: new Date("2026-11-15T00:00:00Z") });
    expect(x).toContain("<g:product_type>Vaatteet &gt; T-paidat</g:product_type>");
    expect(x).toContain("<g:identifier_exists>no</g:identifier_exists>");
    expect(x).toContain("<g:custom_label_1>joulu</g:custom_label_1>");
    expect(x).not.toContain("custom_label_0");
    expect(lisaaKentat(item("24.90"), { kate: 0.55 })).toContain("<g:custom_label_0>kate_yli_50</g:custom_label_0>");
    expect(lisaaKentat(item("24.90"), { kate: 0.45 })).toContain("<g:custom_label_0>kate_40_50</g:custom_label_0>");
  });
  it("sesonki päättyy jouluaattoon", () => {
    expect(sesonki(new Date("2026-12-24T12:00:00Z"))).toBe("joulu");
    expect(sesonki(new Date("2026-12-27T12:00:00Z"))).toBe("ympari_vuoden");
  });
});
