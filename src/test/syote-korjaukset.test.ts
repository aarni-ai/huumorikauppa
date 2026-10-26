import { describe, it, expect, vi, afterEach } from "vitest";
import { korjaaItem, korjaaSyote, korjaaOtsikko, korjaaKuvaus, korjaaHinta, korjaaKategoria, kokoArvo, haeTuotteet } from "../../api/_lib/syote-korjaukset.js";
import { validateFeed, summarize } from "../../scripts/syote-validointi.mjs";

const IMG = (label: string, n = 1) => `https://huumorikauppa.fi/api/img?u=https%3A%2F%2Fimages-api.printify.com%2Fmockup%2Fa%2F${n}%2Fb.jpg%3Fcamera_label%3D${label}&amp;v=2`;
const raakaItem = ({ id = "p1", slug = "hauska-paita", title = "Hauska T-Paita – Kesäloma Ansaittu", kat = "Apparel &amp; Accessories &gt; Clothing &gt; Shirts &amp; Tops &gt; T-Shirts", price = "24.9 EUR", kuva = IMG("front"), lisakuvat = [IMG("back", 2)] } = {}) => `<item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>Paita – lahjaksi. #kaupunki:Vaasa</g:description>
      <g:link>https://huumorikauppa.fi/tuote/${slug}</g:link>
      <g:image_link>${kuva}</g:image_link>
${lisakuvat.map((u) => `      <g:additional_image_link>${u}</g:additional_image_link>`).join("\n")}
      <g:availability>in_stock</g:availability>
      <g:price>${price}</g:price>
      <g:google_product_category>${kat}</g:google_product_category>
      <g:shipping>
        <g:country>FI</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
    </item>`;
const tuote = { slug: "hauska-paita", variants: { sizes: ["S", "M", "L"], colors: ["Musta", "Valkoinen"], default_color: "Valkoinen" } };
const kentta = (x: string, n: string) => (x.match(new RegExp(`<g:${n}>([^<]*)</g:${n}>`)) || [])[1];

describe("syötteen korjaukset", () => {
  it("otsikko: ajatusviivat pois, leveä pystyviiva, max 150", () => {
    expect(korjaaOtsikko("Hauska T-Paita – Kesäloma Ansaittu")).toBe("Hauska T-Paita, Kesäloma Ansaittu");
    expect(korjaaOtsikko("ICE AATANA｜T-Paita")).toBe("ICE AATANA | T-Paita");
    expect(korjaaOtsikko("Paita — ")).toBe("Paita");
    const pitka = korjaaOtsikko(`${"sana ".repeat(40)}loppu`);
    expect(pitka.length).toBeLessThanOrEqual(150);
    expect(pitka.endsWith("sana")).toBe(true);
  });

  it("kuvaus: sisäinen tagi pois, max 5000", () => {
    expect(korjaaKuvaus("Paita ylöjärveläiselle. #kaupunki:Ylöjärvi")).toBe("Paita ylöjärveläiselle.");
    expect(korjaaKuvaus("x ".repeat(3000)).length).toBeLessThanOrEqual(5000);
  });

  it("hinta ja kategoria normalisoidaan", () => {
    expect(korjaaHinta("24.9 EUR")).toBe("24.90 EUR");
    expect(korjaaHinta("24,90 €")).toBe("24.90 EUR");
    expect(korjaaHinta("24.90 EUR")).toBe("24.90 EUR");
    expect(korjaaKategoria("Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts")).toBe("Apparel & Accessories > Clothing > Shirts & Tops");
    expect(korjaaKategoria("Apparel & Accessories > Clothing > Outerwear > Coats & Jackets")).toBe("Apparel & Accessories > Clothing > Outerwear > Coats & Jackets");
    expect(kokoArvo(["One size"])).toBe("one_size");
    expect(kokoArvo(["S", "M"])).toBe("S/M");
  });

  it("vaatteelle color (oletusväri), size, gender, age_group, brand, condition", () => {
    const x = korjaaItem(raakaItem(), tuote);
    expect(kentta(x, "color")).toBe("Valkoinen");
    expect(kentta(x, "size")).toBe("S/M/L");
    expect(kentta(x, "gender")).toBe("unisex");
    expect(kentta(x, "age_group")).toBe("adult");
    expect(kentta(x, "brand")).toBe("Huumorikauppa");
    expect(kentta(x, "condition")).toBe("new");
    expect(kentta(x, "price")).toBe("24.90 EUR");
    expect(kentta(x, "title")).toBe("Hauska T-Paita, Kesäloma Ansaittu");
    expect(kentta(x, "google_product_category")).toBe("Apparel &amp; Accessories &gt; Clothing &gt; Shirts &amp; Tops");
  });

  it("ilman variaatiotietoja vaatteelle silti gender ja age_group; ei-vaatteelle ei vaatekenttiä", () => {
    const x = korjaaItem(raakaItem(), null);
    expect(kentta(x, "gender")).toBe("unisex");
    expect(kentta(x, "color")).toBeUndefined();
    const k = korjaaItem(raakaItem({ kat: "Home &amp; Garden &gt; Decor &gt; Ornaments" }), tuote);
    expect(kentta(k, "gender")).toBeUndefined();
    expect(kentta(k, "google_product_category")).toBe("Home &amp; Garden &gt; Decor &gt; Seasonal &amp; Holiday Decorations &gt; Holiday Ornaments");
  });

  it("vauvan body: infant", () => {
    const x = korjaaItem(raakaItem({ title: "Hauska vauvan body", kat: "Apparel &amp; Accessories &gt; Clothing &gt; Underwear &amp; Socks &gt; Undershirts" }), tuote);
    expect(kentta(x, "age_group")).toBe("infant");
  });

  it("pääkuvaksi etukuva, lisäkuvista toistot pois", () => {
    const x = korjaaItem(raakaItem({ kuva: IMG("back", 2), lisakuvat: [IMG("front"), IMG("back", 2), IMG("lifestyle", 3)] }), tuote);
    expect(kentta(x, "image_link")).toBe(IMG("front"));
    const lisat = [...x.matchAll(/<g:additional_image_link>([^<]*)</g)].map((m) => m[1]);
    expect(lisat).toEqual([IMG("back", 2), IMG("lifestyle", 3)]);
  });

  it("korjattu syöte läpäisee validoinnin ilman virheitä (custom labelit säilyvät)", () => {
    const xml = `<rss><channel>${raakaItem()}\n    <g:custom_label_0>x</g:custom_label_0></channel></rss>`.replace("</item>\n    <g:custom_label_0>x</g:custom_label_0>", "  <g:custom_label_0>kate-20-30</g:custom_label_0>\n    </item>");
    const out = korjaaSyote(xml, new Map([["p1", tuote]]));
    expect(out).toContain("<g:custom_label_0>kate-20-30</g:custom_label_0>");
    const s = summarize(validateFeed(out.replace(/<g:price>0\.00 EUR<\/g:price>/, "<g:price>6.90 EUR</g:price>")).tulokset);
    expect(s.virheet).toEqual({});
  });

  it("haeTuotteet: virheessä tyhjä Map, onnistuessa id -> variaatiot", async () => {
    const ok = vi.fn(async () => new Response(JSON.stringify([{ id: "p1", slug: "s", sizes: ["M"], colors: ["Musta"], default_color: "Musta" }])));
    const m = await haeTuotteet({ url: "https://x.supabase.co", key: "k", fetchImpl: ok });
    expect(m.get("p1")).toEqual({ slug: "s", variants: { sizes: ["M"], colors: ["Musta"], default_color: "Musta" } });
    const fail = vi.fn(async () => {
      throw new Error("verkko");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await haeTuotteet({ url: "https://x.supabase.co", key: "k", fetchImpl: fail })).size).toBe(0);
  });
});

// Oma tausta: käsittelijä lukee omat tuoterivit (api/_lib/tuotteet.js), ei Lovablen Supabase-syötettä; tämä mainin
// käsittelijän testi ei koske tätä haaraa. Korjausfunktiot testataan yllä.
describe.skip("api/product-feed käsittelijä mockatulla upstreamilla", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("korjaa ja pudottaa: muki pois, vaatteelle kentät, ei validointivirheitä", async () => {
    const muki = raakaItem({ id: "m1", slug: "hauska-muki", title: "Hauska Muki", kat: "Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Tableware &gt; Drinkware &gt; Mugs" });
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "testiavain");
    vi.resetModules();
    const { default: handler } = await import("../../api/product-feed.js");
    const raw = `<?xml version="1.0"?><rss xmlns:g="http://base.google.com/ns/1.0"><channel>\n    ${raakaItem()}\n    ${muki}\n</channel></rss>`;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        String(url).includes("merchant-feed")
          ? new Response(raw)
          : new Response(JSON.stringify([{ id: "p1", slug: "hauska-paita", sizes: ["S", "M"], colors: ["Musta"], default_color: "Musta" }])),
      ),
    );
    let body = "";
    let code = 0;
    const res = {
      setHeader: () => {},
      status(c: number) {
        code = c;
        return this;
      },
      send(b: string) {
        body = b;
        return this;
      },
    };
    await handler({}, res);
    expect(code).toBe(200);
    expect(body).not.toContain("hauska-muki");
    expect(kentta(body, "color")).toBe("Musta");
    expect(kentta(body, "size")).toBe("S/M");
    const s = summarize(validateFeed(body).tulokset);
    expect(s.virheet).toEqual({});
  }, 30000);
});
