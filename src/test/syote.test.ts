import { describe, it, expect } from "vitest";
import { TOIMITUS, ILMAINEN_TOIMITUS_RAJA } from "../../api/_lib/vakiot.js";
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
  it("toimitus kassan säännöllä: toimitusmaksu rajan alle, ilmainen rajasta alkaen", () => {
    expect(lisaaKentat(item("24.90"))).toMatch(new RegExp(`<g:price>${TOIMITUS.toFixed(2).replace(".", "\\.")} EUR</g:price>\\s*</g:shipping>`));
    expect(lisaaKentat(item("24.90"))).toContain("<g:shipping_label>vakiotoimitus</g:shipping_label>");
    expect(lisaaKentat(item(ILMAINEN_TOIMITUS_RAJA.toFixed(2)))).toMatch(/<g:price>0\.00 EUR<\/g:price>\s*<\/g:shipping>/);
  });
  it("product_type, identifier_exists ja sesonki; kateluokka vain kun kate tunnetaan", () => {
    const x = lisaaKentat(item("24.90"), { nyt: new Date("2026-11-15T00:00:00Z") });
    expect(x).toContain("<g:product_type>Vaatteet &gt; T-paidat</g:product_type>");
    expect(x).toContain("<g:identifier_exists>no</g:identifier_exists>");
    expect(x).toContain("<g:custom_label_1>joulu</g:custom_label_1>");
    expect(x).not.toContain("custom_label_0");
    expect(x).toContain("<g:custom_label_2>muut</g:custom_label_2>");
  });
  it("sesonki päättyy jouluaattoon", () => {
    expect(sesonki(new Date("2026-12-24T12:00:00Z"))).toBe("joulu");
    expect(sesonki(new Date("2026-12-27T12:00:00Z"))).toBe("ympari_vuoden");
  });
});
