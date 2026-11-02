import { describe, it, expect } from "vitest";
import { TOIMITUS, ILMAINEN_TOIMITUS_RAJA } from "../../api/_lib/vakiot.js";
import { KASITTELY, KULJETUS, KULJETUS_TYYPEITTAIN, lisaaKentat, onJoulutuote, sesonki, teemaluokka } from "../../api/_lib/syote-lisakentat.js";
import { korjaaItem, saatavatKoot } from "../../api/_lib/syote-korjaukset.js";
import { JOULUMALLISTO_SLUGIT } from "@/data/joulumallisto2026";
import { KASITTELYAIKA_MAX_ARKIPAIVAA, KASITTELYAIKA_MIN_ARKIPAIVAA, KULJETUSAIKA_MAX_ARKIPAIVAA, KULJETUSAIKA_MIN_ARKIPAIVAA, toimitusaikaKategorialle } from "@/config/toimitus";

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
    expect(lisaaKentat(item("24.90"))).toMatch(new RegExp(`<g:price>${TOIMITUS.toFixed(2).replace(".", "\\.")} EUR</g:price>\\s*<g:min_handling_time>1</g:min_handling_time>[\\s\\S]*?<g:max_transit_time>12</g:max_transit_time>\\s*</g:shipping>`));
    expect(lisaaKentat(item("24.90"))).toContain("<g:shipping_label>vakiotoimitus</g:shipping_label>");
    expect(lisaaKentat(item(ILMAINEN_TOIMITUS_RAJA.toFixed(2)))).toMatch(/<g:price>0\.00 EUR<\/g:price>[\s\S]*?<\/g:shipping>/);
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

describe("Merchant-syötteen laatu 2.11.2026", () => {
  it("käsittely- ja kuljetusaika samat kuin src/config/toimitus.ts", () => {
    expect(KASITTELY).toEqual([KASITTELYAIKA_MIN_ARKIPAIVAA, KASITTELYAIKA_MAX_ARKIPAIVAA]);
    expect(KULJETUS).toEqual([KULJETUSAIKA_MIN_ARKIPAIVAA, KULJETUSAIKA_MAX_ARKIPAIVAA]);
    // Tuotetyypeittäin: käsittely + kuljetus = sivuston "perillä X-Y arkipäivässä".
    const summa = (k: number[]) => [KASITTELY[0] + k[0], KASITTELY[1] + k[1]];
    expect(summa(KULJETUS_TYYPEITTAIN.tpaita)).toEqual([...toimitusaikaKategorialle("t-paidat")]);
    for (const k of ["hupparit", "seinataulut", "tarrat"]) expect(summa(KULJETUS_TYYPEITTAIN.muu), k).toEqual([...toimitusaikaKategorialle(k)]);
    const item = (nimi: string, slug: string) => lisaaKentat(`<item><g:title>${nimi}</g:title><g:link>https://huumorikauppa.fi/tuote/${slug}</g:link><g:price>27.90 EUR</g:price><g:google_product_category>Apparel &amp; Accessories &gt; Clothing &gt; Shirts &amp; Tops</g:google_product_category><g:shipping><g:country>FI</g:country><g:price>6.90 EUR</g:price></g:shipping></item>`);
    expect(item("Sauna | T-paita", "sauna-t-paita")).toContain("<g:min_transit_time>3</g:min_transit_time>");
    expect(item("Sauna | Huppari", "sauna-huppari")).toContain("<g:min_transit_time>4</g:min_transit_time>");
    expect(item("Sauna | Huppari", "sauna-huppari")).toContain("<g:max_transit_time>12</g:max_transit_time>");
  });
  it("jokainen joulumalliston 2026 tuote ja muut jouluaiheiset saavat custom_label_3 joulu2026", () => {
    expect(JOULUMALLISTO_SLUGIT.length).toBeGreaterThan(0);
    for (const slug of JOULUMALLISTO_SLUGIT) expect(teemaluokka(slug), slug).toBe("joulu2026");
    expect(onJoulutuote("Glögi ensin, sitten joulu | T-paita")).toBe(true);
    expect(onJoulutuote("Tonnin seteli t-paita")).toBe(false);
    expect(onJoulutuote("porvoo-t-paita")).toBe(false);
    const item = `<item>
      <g:id>j1</g:id>
      <g:title>Tonttu valvoo aina | T-paita</g:title>
      <g:link>https://huumorikauppa.fi/tuote/tonttu-valvoo-aina-t-paita-jouluun</g:link>
      <g:price>27.90 EUR</g:price>
      <g:google_product_category>Apparel &amp; Accessories &gt; Clothing &gt; Shirts &amp; Tops</g:google_product_category>
      <g:shipping><g:country>FI</g:country><g:price>0.00 EUR</g:price></g:shipping>
    </item>`;
    expect(lisaaKentat(item)).toContain("<g:custom_label_3>joulu2026</g:custom_label_3>");
  });
  it("vaatteelle kaikki suositellut kentät: brand, identifier_exists, gender, age_group, color, size järjestyksessä, size_system, size_type", () => {
    const item = `<item>
      <g:id>v1</g:id>
      <g:title>Testi | T-paita</g:title>
      <g:price>27.90 EUR</g:price>
      <g:google_product_category>Apparel &amp; Accessories &gt; Clothing &gt; Shirts &amp; Tops</g:google_product_category>
    </item>`;
    const x = korjaaItem(item, { slug: "ei-saatavuustietoa", variants: { sizes: ["L", "M", "S", "XL", "2XL"], colors: ["Valkoinen"], default_color: "Valkoinen" } });
    for (const k of ["<g:brand>Huumorikauppa</g:brand>", "<g:identifier_exists>no</g:identifier_exists>", "<g:gender>unisex</g:gender>", "<g:age_group>adult</g:age_group>",
      "<g:color>Valkoinen</g:color>", "<g:size>S/M/L/XL/2XL</g:size>", "<g:size_system>EU</g:size_system>", "<g:size_type>regular</g:size_type>"]) expect(x).toContain(k);
    expect(saatavatKoot("x", { sizes: ["5XL", "S", "Muu"], colors: [] })).toEqual(["S", "5XL", "Muu"]);
  });
});
