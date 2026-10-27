import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { blogPosts } from "./blog";
import { jouluOppaat2026 } from "./blogJoulu2026";
import { jouluOppaat2026Lisa } from "./blogJoulu2026Lisa";
import { sesonkiOppaat2026, ODOTTAA_SAHKOPOSTIA } from "./blogSesonki2026";
import { categories } from "./products";
import { situationGifts } from "./situationGifts";
import { professions } from "./professions";
import { hobbies } from "./hobbies";
import { municipalities } from "./municipalities";
import { dialects } from "./dialects";
import { PIILOTETUT_KATEGORIAT } from "@/lib/hiddenCategories";
// Aktiivisten (is_active != false), myynnissä olevien tuotteiden slugit, haettu Supabasesta 21.10.2026.
// Ei mukeja. Päivitä, kun tuotevalikoima muuttuu. 28.10.2026: lisätty 27.10.2026 julkaistut joulu- ja eläkepaidat.
import productSlugs from "@/test/fixtures/productSlugs.json";
import type { BlogPost } from "@/types/blog";
import { buildBlogPostJsonLd } from "@/lib/blogJsonLd";
import { LANDING_PATHS, LANDING_REDIRECTS } from "./landingRoutes";
import { CHRISTMAS_DEADLINE_PATH } from "./christmas";
import { JOULU_PAIVA_LYHYT } from "./tilauspaivat";
import { TOIMITUSMAKSU_TEKSTI } from "@/config/toimitus";

const DASHES = /[–—]/; // en dash, em dash
const HEDGES = /(?<!\p{L})(saattaa|saattavat|ehkä|todennäköisesti|pyrimme)(?!\p{L})/iu;

// Staattiset reitit suoraan App.tsx:stä, jotta testi seuraa reitityksen muutoksia.
const appSource = fs.readFileSync(path.resolve(__dirname, "../App.tsx"), "utf8");
const staticRoutes = new Set(
  [...appSource.matchAll(/<Route path="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((p) => !p.includes(":") && p !== "*"),
);
// Laskeutumissivujen reitit generoidaan App.tsx:ssä LANDING_PATHS-listasta.
for (const p of [...LANDING_PATHS, CHRISTMAS_DEADLINE_PATH]) staticRoutes.add(p);

const dynamicRoutes: Record<string, Set<string>> = {
  kategoria: new Set(categories.map((c) => c.slug).filter((s) => !PIILOTETUT_KATEGORIAT.includes(s))),
  tuote: new Set(productSlugs as string[]),
  blogi: new Set(blogPosts.map((p) => p.slug)),
  lahjat: new Set(situationGifts.map((s) => s.slug)),
  ammatti: new Set(professions.map((p) => p.slug)),
  harrastus: new Set(hobbies.map((h) => h.slug)),
  kaupunki: new Set(municipalities.map((m) => m.slug)),
  murre: new Set(dialects.map((d) => d.slug)),
};

function resolves(href: string): boolean {
  const clean = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  // 301-ohjattuun polkuun ei linkitetä: linkin pitää osoittaa suoraan lopulliseen sivuun.
  if (LANDING_REDIRECTS[clean] || LANDING_REDIRECTS[decodeURIComponent(clean)]) return false;
  if (staticRoutes.has(clean)) return true;
  const m = clean.match(/^\/([^/]+)\/([^/]+)$/);
  return !!m && !!dynamicRoutes[m[1]]?.has(decodeURIComponent(m[2]));
}

function internalLinks(post: BlogPost): string[] {
  const fromContent = [...post.content.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);
  const fromProducts = (post.productLinks ?? []).map((p) => `/tuote/${p.slug}`);
  return [...fromContent, ...fromProducts];
}

/** Kaikki näkyvä teksti: otsikot, metat, sisältö ja FAQ. */
function allText(post: BlogPost): string {
  const faq = (post.faq ?? []).flatMap((f) => [f.q, f.a]);
  return [post.title, post.metaTitle, post.metaDescription, post.excerpt, post.content, ...post.tags, ...faq].join("\n");
}

/** Joulun 2026 oppaat, 26.10.2026 lisäoppaat ja 28.10.2026 sesonkioppaat: samat teksti-, linkitys- ja FAQ-säännöt. */
const KAIKKI_JOULU = [...jouluOppaat2026, ...jouluOppaat2026Lisa, ...sesonkiOppaat2026];

function julkaisupaiva(post: BlogPost): string {
  if (jouluOppaat2026.includes(post)) return "2026-10-21";
  if (jouluOppaat2026Lisa.includes(post)) return "2026-10-26";
  return "2026-10-28";
}

function wordCount(md: string): number {
  return md
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/[#*[\]]/g, " ")
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

describe("blogi: kaikki artikkelit", () => {
  it("slugit ovat yksilöllisiä", () => {
    const slugs = blogPosts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("title-tagit ovat yksilöllisiä", () => {
    const titles = blogPosts.map((p) => p.metaTitle);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it.each(blogPosts.map((p) => [p.slug, p] as const))("%s: jokainen sisäinen linkki osuu olemassa olevaan sivuun", (_slug, post) => {
    const broken = internalLinks(post).filter((href) => !resolves(href));
    expect(broken).toEqual([]);
  });
});

describe("blogi: ei ostokehotuksia myynnistä poistettuihin kategorioihin", () => {
  // relatedCategories näkyy BlogPost-sivulla "Osta tämä lahja Huumorikaupasta" -kortteina.
  it.each(blogPosts.map((p) => [p.slug, p] as const))("%s", (_slug, post) => {
    for (const c of post.relatedCategories) expect(["peitot", "seinataulut", "tarrat", "bodyt"]).not.toContain(c);
  });
});

describe("blogi: palautetut artikkelit ja niiden uudet vastinparit", () => {
  // 04596ec vaihtoi neljän artikkelin aiheen samassa osoitteessa. Alkuperäiset aiheet palautettiin ja uudet aiheet
  // julkaistiin omissa osoitteissaan. Myynnistä poistettuja tuotteita (peitto, seinätaulu, tarra, body) ei luvata.
  const parit: [string, string][] = [
    ["hauskat-peitot-lahjaksi", "hauskat-hupparit-lahjaksi"],
    ["hauskat-seinataulut-sisusta-huumorilla", "hauskat-koristeet-lahjaksi"],
    ["hauska-vauvalahja-parhaat-bodyt", "lahja-tuoreille-vanhemmille"],
  ];
  const post = (slug: string) => blogPosts.find((p) => p.slug === slug)!;

  it.each(parit)("%s <-> %s: molemmat olemassa ja linkittävät toisiinsa", (vanha, uusi) => {
    expect(post(vanha)).toBeDefined();
    expect(post(uusi)).toBeDefined();
    expect(internalLinks(post(vanha))).toContain(`/blogi/${uusi}`);
    expect(internalLinks(post(uusi))).toContain(`/blogi/${vanha}`);
  });

  it("palautetut aiheet ovat alkuperäiset", () => {
    expect(post("hauskat-peitot-lahjaksi").title).toMatch(/peitto/i);
    expect(post("hauskat-seinataulut-sisusta-huumorilla").title).toMatch(/seinätaulu/i);
    expect(post("hauska-vauvalahja-parhaat-bodyt").title).toMatch(/body/i);
    expect(post("parhaat-hauskat-tarrat-lappariin").title).toMatch(/tarra/i);
  });

  it.each([...parit.flat(), "parhaat-hauskat-tarrat-lappariin"])("%s: ei myyntilupauksia poistetuista tuotteista, SEO-rajat", (slug) => {
    const p = post(slug);
    const text = allText(p);
    expect(text).not.toMatch(DASHES);
    expect(text).not.toMatch(HEDGES);
    expect(text).not.toMatch(/tilaa nyt|bodymme|taulujamme|tilaa (peitto|seinätaulu|tarr|body)/i);
    expect(text).not.toMatch(/€|\beuroa?\b(?! tilauksista)/);
    for (const href of internalLinks(p)) expect(href).not.toMatch(/\/kategoria\/(peitot|seinataulut|tarrat|bodyt)$|\/tuote\/oma-tekstikuva-(peitto|seinataulu|tarra|vauvantaaperon-body)/);
    for (const c of p.relatedCategories) expect(["peitot", "seinataulut", "tarrat", "bodyt"]).not.toContain(c);
    expect(p.metaTitle.length).toBeLessThan(60);
    expect(p.metaDescription.length).toBeLessThan(155);
  });
});

describe("blogi: joulun 2026 oppaat", () => {
  it("oppaita on 10 ja ne ovat mukana blogPosts-listassa", () => {
    expect(jouluOppaat2026).toHaveLength(10);
    for (const post of jouluOppaat2026) expect(blogPosts).toContain(post);
  });

  it("lisäoppaita on 6, ne ovat mukana blogPosts-listassa ja julkaistu 26.10.2026", () => {
    expect(jouluOppaat2026Lisa).toHaveLength(6);
    for (const post of jouluOppaat2026Lisa) {
      expect(blogPosts).toContain(post);
      expect(post.publishedAt).toBe("2026-10-26");
    }
  });

  it("lisäoppaat eivät käytä olemassa olevien artikkelien slugeja", () => {
    const muut = new Set(blogPosts.filter((p) => !jouluOppaat2026Lisa.includes(p)).map((p) => p.slug));
    for (const post of jouluOppaat2026Lisa) expect(muut.has(post.slug), post.slug).toBe(false);
  });

  it("sesonkioppaita on 8 (7 julkaistu, 1 odottaa sähköpostia), ne ovat mukana blogPosts-listassa, julkaistu 28.10.2026 ja uusilla slugeilla", () => {
    expect(sesonkiOppaat2026.length + ODOTTAA_SAHKOPOSTIA.size).toBe(8);
    const muut = new Set(blogPosts.filter((p) => !sesonkiOppaat2026.includes(p)).map((p) => p.slug));
    for (const post of sesonkiOppaat2026) {
      expect(blogPosts).toContain(post);
      expect(post.publishedAt).toBe("2026-10-28");
      expect(muut.has(post.slug), post.slug).toBe(false);
    }
  });

  it("sesonkioppaat: ei hintoja tekstissä, isänpäivälle ei toimituslupausta, pikkujouluoppaat linkittävät ryhmätilauksiin", () => {
    for (const post of sesonkiOppaat2026) {
      const text = allText(post);
      // Hinnat tulevat tuotekorteista; ainoa euromäärä on toimitusehtojen vakioista tuleva toimitusmaksu.
      const eurot = [...text.matchAll(/(\d+(?:,\d+)?) ?€/g)].map((m) => m[1]);
      expect(eurot.every((e) => e === TOIMITUSMAKSU_TEKSTI), post.slug).toBe(true);
      expect(text).not.toMatch(/voi olla että|suomen paras|painettu suomessa|varastossa/i);
      if (post.tags.some((t) => t.includes("isänpäivä"))) {
        expect(text, post.slug).not.toMatch(/ehtii (perille )?isänpäiväksi|perillä isänpäiväksi|isänpäivään mennessä/);
        expect(internalLinks(post), post.slug).toContain("/isanpaivalahja");
      }
    }
    for (const slug of ["pikkujoulujen-lahjapeli", "pikkujoulupaidat-porukalle"]) {
      const post = sesonkiOppaat2026.find((p) => p.slug === slug)!;
      expect(internalLinks(post), slug).toContain("/ryhmatilaukset");
    }
  });

  it.each(KAIKKI_JOULU.map((p) => [p.slug, p] as const))("%s: tekstisäännöt ja SEO-rajat", (_slug, post) => {
    const text = allText(post);
    expect(text).not.toMatch(DASHES);
    expect(text).not.toMatch(HEDGES);
    expect(text.toLowerCase()).not.toMatch(/\bmuki/);
    expect(post.metaTitle.length).toBeLessThan(60);
    expect(post.metaDescription.length).toBeLessThan(155);
    const words = wordCount(post.content);
    expect(words).toBeGreaterThanOrEqual(1000);
    expect(words).toBeLessThanOrEqual(1500);
  });

  it.each(KAIKKI_JOULU.map((p) => [p.slug, p] as const))("%s: linkitys ja FAQ", (_slug, post) => {
    const links = internalLinks(post);
    const products = new Set(links.filter((l) => l.startsWith("/tuote/")));
    const pages = new Set(links.filter((l) => !l.startsWith("/tuote/")));
    expect(products.size).toBeGreaterThanOrEqual(4);
    expect(products.size).toBeLessThanOrEqual(10);
    expect(pages.size).toBeGreaterThanOrEqual(4);
    expect(pages.size).toBeLessThanOrEqual(8);
    expect(links.some((l) => l.includes("mukit"))).toBe(false);

    const faq = post.faq ?? [];
    expect(faq.length).toBeGreaterThanOrEqual(3);
    expect(faq.length).toBeLessThanOrEqual(5);
    for (const f of faq) expect(f.a).toMatch(/^[^.?!]+[.!]/); // alkaa suoralla yhden lauseen vastauksella
  });

  it("joulun toimituslupaus on kaikissa sama (lasketusta päivästä)", () => {
    for (const post of KAIKKI_JOULU) {
      const dates = [...allText(post).matchAll(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g)].map((m) => m[0]);
      for (const d of dates) expect([JOULU_PAIVA_LYHYT.split(" ")[1], "24.12.2026", "8.11.2026"]).toContain(d);
    }
  });
});

describe("blogi: rakenteinen data", () => {
  it.each(KAIKKI_JOULU.map((p) => [p.slug, p] as const))("%s: Article + FAQPage", (_slug, post) => {
    const ld = buildBlogPostJsonLd(post, post.faq ?? []);
    const [article, faq] = ld["@graph"] as Record<string, unknown>[];
    expect(article["@type"]).toBe("Article");
    expect(article.headline).toBe(post.title);
    expect(article.description).toBe(post.metaDescription);
    expect(article.datePublished).toBe(julkaisupaiva(post));
    expect(article.dateModified).toBe(post.updatedAt);
    expect(article.author).toMatchObject({ "@type": "Organization", name: "Huumorikauppa" });
    expect(article.publisher).toMatchObject({ "@type": "Organization", name: "Huumorikauppa", logo: { "@type": "ImageObject" } });
    expect(article.mainEntityOfPage).toMatchObject({ "@id": `https://huumorikauppa.fi/blogi/${post.slug}` });
    expect("image" in article).toBe(Boolean(post.image));
    expect(faq["@type"]).toBe("FAQPage");
    expect((faq.mainEntity as unknown[]).length).toBe(post.faq!.length);
  });

  it("kuva lisätään Articleen absoluuttisena URLina, kun artikkelilla on kuva", () => {
    const ld = buildBlogPostJsonLd({ ...jouluOppaat2026[0], image: "/images/etusivu-joulu.png" }, []);
    const graph = ld["@graph"] as Record<string, unknown>[];
    expect(graph).toHaveLength(1);
    expect(graph[0].image).toEqual(["https://huumorikauppa.fi/images/etusivu-joulu.png"]);
  });
});
