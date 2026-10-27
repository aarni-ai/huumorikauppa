import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PRODUCT_CONTENT } from "@/data/productContent";
import { SITE_FAQS, HOME_FAQS, DEFAULT_BLOG_FAQS, buildCategoryFaqs, buildGiftCategoryFaqs, buildProductFaqs, mergeFaqs } from "@/seo/pageFaqs";
import { STATIC_PAGE_META } from "@/seo/staticPageMeta";
import { buildFaqJsonLd } from "@/seo/structuredData";
import { cleanProductName, productImageAlt } from "@/lib/productNames";
import { sanitizeProductDescription } from "@/lib/productCopy";
import { jouluVastaus } from "@/data/tilauspaivat";
import { TOIMITUSMAKSU_TEKSTI, ILMAINEN_RAJA_TEKSTI } from "@/config/toimitus";
import fixture from "./fixtures/visible-product-slugs.json";

const SRC = path.resolve(__dirname, "..");
const DATA_FILES = [
  // arvostelut-arkisto.ts on poistettujen arvioiden arkisto, jota sovellus ei näytä (alkuperäinen teksti säilytetään).
  ...fs
    .readdirSync(path.join(SRC, "data"))
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && f !== "arvostelut-arkisto.ts")
    .map((f) => path.join(SRC, "data", f)),
  path.join(SRC, "seo/pageFaqs.ts"),
  path.join(SRC, "seo/staticPageMeta.ts"),
];

const DASH = /[–—]/;
const FALSE_PRINT_CLAIM = /painettu suomessa|painetaan suomessa|suomessa painettu|suomessa painetut|painettu eu:ssa/i;

function words(text: string): number {
  return text.trim().split(/\s+/).length;
}

function firstSentence(text: string): string {
  return text.trim().split(/(?<=[.!?])\s+/)[0];
}

describe("data-, UKK- ja metatiedostot", () => {
  it.each(DATA_FILES.map((f) => [path.relative(SRC, f), f]))("%s: ei ajatusviivoja eikä väitettä Suomessa painamisesta", (_name, file) => {
    const text = fs.readFileSync(file, "utf8");
    const dashLines = text.split("\n").filter((l) => DASH.test(l));
    expect(dashLines).toEqual([]);
    expect(text).not.toMatch(FALSE_PRINT_CLAIM);
  });

  it("ainoa joulun tilauspäivä on laskettu (tilauspaivat.ts)", () => {
    for (const file of DATA_FILES) {
      const text = fs.readFileSync(file, "utf8");
      // 6.12. (itsenäisyyspäivä) ja 24.12. (jouluaatto, toimituksen takaraja) ovat sallittuja; joulukuun
      // tilauspäiviä ei luvata.
      expect(text, file).not.toMatch(/\b(?!6\.12\.|24\.12\.)\d{1,2}\.12\./);
      expect(text, file).not.toMatch(/PostNord|3-7 arkip|5-7 arkip|30 päivän sisällä/);
    }
  });

  it("staattisten sivujen title alle 60 ja description alle 155 merkkiä", () => {
    for (const [p, meta] of Object.entries(STATIC_PAGE_META)) {
      expect(meta.title.length, p).toBeLessThan(60);
      expect(meta.description.length, p).toBeLessThan(155);
    }
  });
});

describe("UKK (AEO)", () => {
  const allFaqs = [
    ...SITE_FAQS,
    ...HOME_FAQS,
    ...DEFAULT_BLOG_FAQS,
    ...buildCategoryFaqs("T-paidat"),
    ...buildGiftCategoryFaqs("Hauskat joululahjat", 10),
    ...buildProductFaqs({ name: "Kalamies | T-Paita", category: "t-paidat" }, "T-paidat").faqs,
    ...buildProductFaqs({ name: "Oma Teksti/Kuva | Huppari", category: "hupparit" }, "Hupparit", { isCustom: true }).faqs,
  ];

  it("jokainen vastaus alkaa suoralla, enintään noin 25 sanan lauseella", () => {
    for (const f of allFaqs) {
      expect(words(firstSentence(f.a)), f.q).toBeLessThanOrEqual(25);
    }
  });

  it("vastauksissa ei ajatusviivoja, mukeja eikä väärää kuljetusliikettä", () => {
    for (const f of allFaqs) {
      expect(f.q + f.a).not.toMatch(DASH);
      expect(f.q + f.a).not.toMatch(/\bmuki|mukit|PostNord|Klarna|Apple Pay|MobilePay/i);
    }
  });

  it("sivuston UKK sisältää AI-avustajilta kysytyt kysymykset", () => {
    const qs = SITE_FAQS.map((f) => f.q);
    for (const q of [
      "Mistä saa hauskan joululahjan nopeasti?",
      "Ehtiikö tilaus jouluksi?",
      "Mikä on hyvä lahja miehelle, jolla on kaikki?",
      "Voiko tuotteeseen tilata oman tekstin?",
    ]) {
      expect(qs).toContain(q);
    }
    const text = SITE_FAQS.map((f) => f.a).join(" ");
    expect(text).toContain(jouluVastaus());
    expect(text).toContain(`${TOIMITUSMAKSU_TEKSTI} €`);
    expect(text).toContain(`${ILMAINEN_RAJA_TEKSTI} euron tilauksista alkaen`);
    expect(text).toContain("200 merkkiä");
    expect(text).toContain("huumorikauppa@gmail.com");
  });

  it("FAQPage-JSON-LD vastaa näkyvää UKK:ta", () => {
    const ld = buildFaqJsonLd(SITE_FAQS) as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(ld.mainEntity.map((q) => [q.name, q.acceptedAnswer.text])).toEqual(SITE_FAQS.map((f) => [f.q, f.a]));
  });

  it("personoidun tuotteen UKK ei lupaa peruutusoikeutta", () => {
    const { faqs } = buildProductFaqs({ name: "Oma Teksti/Kuva | T-Paita", category: "t-paidat" }, "T-paidat", { isCustom: true });
    const ret = faqs.find((f) => f.q.startsWith("Voinko palauttaa"));
    expect(ret?.a).toMatch(/ei ole 14 päivän peruutusoikeutta/);
  });

  it("mergeFaqs poistaa päällekkäiset kysymykset", () => {
    const merged = mergeFaqs([{ q: "Ehtiikö tilaus jouluksi?", a: "A" }], [{ q: "ehtiikö tilaus jouluksi", a: "B" }, { q: "Muu?", a: "C" }]);
    expect(merged.map((f) => f.a)).toEqual(["A", "C"]);
  });
});

describe("productContent", () => {
  const entries = Object.entries(PRODUCT_CONTENT);
  const visible = new Set<string>(fixture.slugs);

  it("sisältää 100 tuotetta, kaikki näkyviä (ei mukeja)", () => {
    expect(entries).toHaveLength(100);
    for (const [slug] of entries) {
      expect(visible.has(slug), slug).toBe(true);
      expect(slug).not.toMatch(/muki|kahvikuppi/);
    }
  });

  it("kuvaukset ovat 120-220 sanaa ja keskenään uniikkeja", () => {
    const descriptions = new Set<string>();
    const openings = new Set<string>();
    for (const [slug, c] of entries) {
      const n = words(c.description);
      expect(n, slug).toBeGreaterThanOrEqual(120);
      expect(n, slug).toBeLessThanOrEqual(220);
      descriptions.add(c.description);
      openings.add(c.description.split(/\s+/).slice(0, 6).join(" "));
    }
    expect(descriptions.size).toBe(100);
    expect(openings.size).toBe(100);
  });

  it("jokaisella tuotteella on 3 UKK:ta, joiden vastaus alkaa lyhyellä suoralla lauseella", () => {
    for (const [slug, c] of entries) {
      expect(c.faqs, slug).toHaveLength(3);
      for (const f of c.faqs) expect(words(firstSentence(f.a)), `${slug}: ${f.q}`).toBeLessThanOrEqual(25);
    }
  });

  it("ei ajatusviivoja, mukeja, painopaikkaväitteitä eikä arvailevia ilmaisuja", () => {
    for (const [slug, c] of entries) {
      const text = c.description + " " + c.faqs.map((f) => f.q + " " + f.a).join(" ");
      expect(text, slug).not.toMatch(DASH);
      expect(text, slug).not.toMatch(FALSE_PRINT_CLAIM);
      expect(text, slug).not.toMatch(/\bmuki|kahvikupp|saattaa|todennäköisesti|pyrimme|\behkä\b/i);
      expect(text, slug).toContain("3-10 arkipäiv");
    }
  });
});

describe("tuotekuvien alt-tekstit ja tietokantakuvausten siivous", () => {
  it("alt-teksti muodostetaan datasta ilman ajatusviivoja", () => {
    const alt = productImageAlt(
      { name: "Eläkkeellä – kiireinen tekemään ei mitään | Huppari", category: "hupparit", variants: { variant_images: { Musta: ["https://x/a.jpg?camera_label=front"] } } },
      { url: "https://x/a.jpg?camera_label=front" },
    );
    expect(alt).toBe("Eläkkeellä - kiireinen tekemään ei mitään, huppari, musta - kuva edestä");
    expect(productImageAlt({ name: "Kalju | T-Paita", category: "t-paidat" }, { url: "https://x/b.jpg?camera_label=back", index: 1, color: "Valkoinen" })).toBe(
      "Kalju, t-paita, valkoinen - kuva takaa",
    );
    expect(cleanProductName("ICE AATANA｜T-Paita")).toBe("ICE AATANA");
  });

  it("tietokannan väärät väitteet poistetaan näytettävästä kuvauksesta", () => {
    const d = "Hauska paita eläkeläiselle. Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus. 100 % puuvillaa.";
    expect(sanitizeProductDescription(d)).toBe("Hauska paita eläkeläiselle. 100 % puuvillaa.");
  });
});
