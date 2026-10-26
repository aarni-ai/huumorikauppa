import { describe, it, expect } from "vitest";
import {
  validateFeed,
  validateItem,
  parseFeed,
  summarize,
  imageSize,
  validateImageResponse,
  validateLandingPage,
  parsePrice,
} from "../../scripts/syote-validointi.mjs";

const LINK = "https://huumorikauppa.fi/tuote/hauska-paita";
const kentat = (o: Record<string, string>) =>
  Object.entries(o)
    .map(([k, v]) => `      <g:${k}>${v}</g:${k}>`)
    .join("\n");
const item = (o: Record<string, string> = {}, shipping = "6.90 EUR") => `<item>
${kentat({
  id: "a1",
  title: "Hauska paita",
  description: "Hauska paita lahjaksi.",
  link: LINK,
  image_link: "https://huumorikauppa.fi/api/img?u=x.jpg%3Fcamera_label%3Dfront&amp;v=2",
  availability: "in_stock",
  price: "24.90 EUR",
  brand: "Huumorikauppa",
  condition: "new",
  google_product_category: "Apparel &amp; Accessories &gt; Clothing &gt; Shirts &amp; Tops",
  identifier_exists: "no",
  gender: "unisex",
  age_group: "adult",
  color: "Musta",
  size: "M",
  ...o,
})}
      <g:shipping>
        <g:country>FI</g:country>
        <g:price>${shipping}</g:price>
      </g:shipping>
    </item>`;
const tyypit = (xml: string, opts = {}) => validateItem(parseFeed(xml)[0], opts).map((o) => o.tyyppi);

describe("syötteen validointisäännöt", () => {
  it("kelvollinen vaate ei tuota ongelmia", () => {
    expect(tyypit(item())).toEqual([]);
  });

  it("vaatteelta vaaditaan color, gender, age_group ja size (maksuttomat listaukset)", () => {
    const x = item({ color: "", gender: "", age_group: "", size: "" }).replace(/\s*<g:(color|gender|age_group|size)><\/g:\1>/g, "");
    expect(tyypit(x)).toEqual(expect.arrayContaining(["color_puuttuu_vaate", "gender_puuttuu_vaate", "age_group_puuttuu_vaate", "size_puuttuu_vaate"]));
  });

  it("asuste (Hats) ei vaadi kokoa, ei-vaate ei vaadi värejä", () => {
    const hattu = item({ google_product_category: "Apparel &amp; Accessories &gt; Clothing Accessories &gt; Hats" }).replace(/\s*<g:size>M<\/g:size>/, "");
    expect(tyypit(hattu)).toEqual([]);
    const koriste = item({ google_product_category: "Home &amp; Garden &gt; Decor" }).replace(/\s*<g:(color|gender|age_group|size)>[^<]*<\/g:\1>/g, "");
    expect(tyypit(koriste)).toEqual([]);
  });

  it("virheelliset arvot", () => {
    const t = tyypit(item({ availability: "available", price: "24,9 €", condition: "uusi", gender: "unisexx", age_group: "aikuinen" }));
    expect(t).toEqual(expect.arrayContaining(["availability_virheellinen", "price_muoto", "condition_virheellinen", "gender_virheellinen", "age_group_virheellinen"]));
  });

  it("otsikko: pituus, mainosteksti, ajatusviiva, versaalit", () => {
    expect(tyypit(item({ title: "a".repeat(151) }))).toContain("title_yli_150");
    expect(tyypit(item({ title: "Hauska paita, ilmainen toimitus" }))).toContain("title_mainosteksti");
    expect(tyypit(item({ title: "Hauska paita -20%" }))).toContain("title_mainosteksti");
    expect(tyypit(item({ title: "Hauska paita – lahja" }))).toContain("title_ajatusviiva");
    expect(tyypit(item({ title: "KALAMIES | T-Paita" }))).toContain("title_versaalit");
    expect(tyypit(item({ title: "Ale Kalevala" }))).toContain("title_mainosteksti");
    expect(tyypit(item({ title: "Kalevalan paita" }))).toEqual([]);
  });

  it("kuvaus: pituus ja sisäinen tagi", () => {
    expect(tyypit(item({ description: "x".repeat(5001) }))).toContain("description_yli_5000");
    expect(tyypit(item({ description: "Paita. #kaupunki:Vaasa" }))).toContain("description_sisainen_tagi");
  });

  it("linkki: https, kanoninen tuoteosoite, sivukartta", () => {
    expect(tyypit(item({ link: "http://huumorikauppa.fi/tuote/x" }))).toContain("link_ei_https");
    expect(tyypit(item({ link: `${LINK}?utm=1` }))).toContain("link_ei_kanoninen");
    expect(tyypit(item(), { sitemapSlugs: new Set(["muu"]) })).toContain("link_ei_sivukartassa");
    expect(tyypit(item(), { sitemapSlugs: new Set(["hauska-paita"]) })).toEqual([]);
  });

  it("toimitushinta kassan säännöllä: 6,90 € alle 79 €, ilmainen 79 €:sta", () => {
    expect(tyypit(item({}, "0.00 EUR"))).toContain("shipping_hinta_ei_vastaa_kassaa");
    expect(tyypit(item({ price: "79.00 EUR" }, "0.00 EUR"))).toEqual([]);
    expect(tyypit(item({ price: "79.00 EUR" }, "6.90 EUR"))).toContain("shipping_hinta_ei_vastaa_kassaa");
  });

  it("brand tai identifier_exists=no vaaditaan", () => {
    const x = item().replace(/\s*<g:brand>[^<]*<\/g:brand>/, "").replace(/\s*<g:identifier_exists>[^<]*<\/g:identifier_exists>/, "");
    expect(tyypit(x)).toEqual(expect.arrayContaining(["brand_puuttuu", "identifier_exists_puuttuu"]));
  });

  it("taksonomia: T-Shirts ei ole Googlen kategoria", () => {
    const tax = new Set(["Apparel & Accessories > Clothing > Shirts & Tops"]);
    expect(tyypit(item(), { taxonomy: tax })).toEqual([]);
    expect(tyypit(item({ google_product_category: "Apparel &amp; Accessories &gt; Clothing &gt; Shirts &amp; Tops &gt; T-Shirts" }), { taxonomy: tax })).toContain(
      "google_product_category_tuntematon",
    );
  });

  it("piilotetut tuotteet: mukit", () => {
    expect(tyypit(item({ link: "https://huumorikauppa.fi/tuote/x-muki" }))).toContain("piilotettu_muki");
    expect(tyypit(item({ google_product_category: "Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Tableware &gt; Drinkware &gt; Mugs" }))).toContain("piilotettu_muki");
  });

  it("pääkuva: takanäkymästä varoitus", () => {
    expect(tyypit(item({ image_link: "https://huumorikauppa.fi/api/img?u=x.jpg%3Fcamera_label%3Dback" }))).toContain("image_link_ei_etukuva");
  });

  it("kaksoiskappaleet ja yhteenveto", () => {
    const xml = `<rss><channel>${item()}${item()}</channel></rss>`;
    const { tulokset } = validateFeed(xml);
    const s = summarize(tulokset);
    expect(s.virheet).toEqual({ id_kaksoiskappale: 1, link_kaksoiskappale: 1 });
    expect(s.tuotteitaVirheilla).toBe(1);
    expect(summarize(validateFeed("<rss></rss>").tulokset).virheet).toEqual({ syote_tyhja: 1 });
  });

  it("parsePrice", () => {
    expect(parsePrice("24.90 EUR")).toBe(24.9);
    expect(Number.isNaN(parsePrice("24.9 EUR"))).toBe(true);
  });
});

describe("kuvan ja tuotesivun tarkistus", () => {
  const png = (w: number, h: number) => {
    const b = new Uint8Array(24);
    b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const v = new DataView(b.buffer);
    v.setUint32(16, w);
    v.setUint32(20, h);
    return b;
  };
  const jpeg = (w: number, h: number) => new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xc0, 0, 17, 8, h >> 8, h & 255, w >> 8, w & 255, 3, 0, 0, 0]);

  it("imageSize tunnistaa PNG:n ja JPEG:n", () => {
    expect(imageSize(png(800, 600))).toMatchObject({ width: 800, height: 600, type: "png" });
    expect(imageSize(jpeg(1024, 768))).toMatchObject({ width: 1024, height: 768, type: "jpeg" });
  });

  it("kuvan koko- ja tyyppirajat (vaatteet 250x250)", () => {
    const vaate = "Apparel & Accessories > Clothing > Shirts & Tops";
    const t = (o: object, kat = vaate) => validateImageResponse({ status: 200, contentType: "image/png", redirected: false, ...o }, kat).map((x) => x.tyyppi);
    expect(t({ bytes: png(1000, 1000) })).toEqual([]);
    expect(t({ bytes: png(200, 200) })).toEqual(["image_liian_pieni"]);
    expect(t({ bytes: png(200, 200) }, "Home & Garden > Decor")).toEqual(["image_alle_500_2027"]);
    expect(t({ bytes: png(1000, 1000), contentType: "text/html" })).toContain("image_ei_kuva");
    expect(t({ status: 404 })).toEqual(["image_status_404"]);
  });

  it("tuotesivu: ohjaus, canonical, hinta", () => {
    const link = LINK;
    const html = (canon: string, price: string) => `<link rel="canonical" href="${canon}" /><script type="application/ld+json">{"price":"${price}"}</script>`;
    expect(validateLandingPage({ status: 200, html: html(link, "24.90") }, { link, price: 24.9 })).toEqual([]);
    expect(validateLandingPage({ status: 301, location: "/x", html: "" }, { link, price: 24.9 })[0].tyyppi).toBe("link_uudelleenohjaus");
    expect(validateLandingPage({ status: 200, html: html(`${link}-2`, "24.90") }, { link, price: 24.9 })[0].tyyppi).toBe("link_canonical_eri");
    expect(validateLandingPage({ status: 200, html: html(link, "19.90") }, { link, price: 24.9 })[0].tyyppi).toBe("link_hinta_eri_kuin_sivulla");
  });
});
