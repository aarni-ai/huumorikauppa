/**
 * Ammatti- ja harrastussivut /paidat/<slug> (2.11.2026, src/data/ammattisivut): 40 sivua, joilla on oma teksti
 * (250-400 sanaa, ei mallipohjaa), tuotteet, viisi uutta mallia t-paitana ja hupparina, personoitu vaihtoehto, UKK
 * FAQPage-schemalla, sisäiset linkit, esirenderöinti, sivukartta ja 301-ohjaukset päällekkäisiltä sivuilta.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import snapshot from "@/test/fixtures/products-snapshot.json";
import kateKuva from "@/test/fixtures/kate-tilannekuva.json";
import {
  AMMATTIMALLISTO, AMMATTISIVUT, AMMATTISIVU_SLUGIT, AMMATTI_SIVUT, otsikkoTeksti, sivunUudet, tuoteSlug,
} from "@/data/ammattisivut";
import { AMMATTISIVU_KOHTEET } from "@/data/ammattisivut/polut";
import { LANDING_MIN_PRODUCTS, LANDING_PATHS, LANDING_REDIRECTS, landingPages, selectLandingProducts } from "@/data/landingPages";
import { buildPrerenderPages, buildSiteNav, normalizeProducts, type ProductRow } from "@/seo/prerender/pages";
import { renderPageHtml } from "@/seo/prerender/html";
import { AMMATTISIVUT_ODOTTAA, kannanRivit } from "@/test/euReititysMinimi";
import { tavaramerkki } from "../../api/_lib/tavaramerkit.js";
import { hakuotsikko } from "../../api/_lib/hakuotsikko.js";
import { laskeTilauksenNettokate } from "../../api/_lib/kate.js";
import { hinnoitteleRivi, rivinHinta } from "../../api/_lib/kokohinnat.js";
import { TILAUKSEN_MIN_KATE_EUROA } from "../../api/_lib/vakiot.js";
import { MALLIT } from "../../api/_lib/personoitu.js";
import { TOIMITUSMAKSU } from "@/config/toimitus";
import { liikenne } from "../../api/_lib/mittarit.js";
import { sivunOsio } from "../../api/_lib/kaynnit.js";
import { parseLista } from "../../scripts/lib/uudet-tuotteet.mjs";

const ROOT = path.resolve(__dirname, "../..");
const read = (f: string) => fs.readFileSync(path.join(ROOT, f), "utf8");

const tuotteet = normalizeProducts(kannanRivit(snapshot as unknown as ProductRow[]));
/** Uudet mallit tuotteina (tuonnin jälkeen kaupassa samoilla nimillä ja slugeilla). */
const uudetTuotteet = AMMATTIMALLISTO.map((t) => ({
  id: `ammatti-${t.slug}`, name: t.name, slug: t.slug, category: t.category, humor_type: "", description: "",
  price: t.category === "hupparit" ? 52.9 : 27.9, stock: 99, images: [], variants: {}, is_featured: false, is_new: true, is_gift_idea: false,
}));
const kaikki = [...tuotteet, ...uudetTuotteet];

const sanat = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
const omaTeksti = (s: (typeof AMMATTISIVUT)[number]) => [...s.intro, ...s.opas.flatMap((o) => o.teksti)].join(" ");
const jaksot = (s: string, n = 5) => {
  const w = sanat(s);
  const out = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
};

const KIELLETYT = [
  /[–—]/, /\bparas\b/i, /\bparhaa?t\b/i, /\bparhaan\b/i, /\bparasta\b/i, /suosituin/i, /suomen (johtava|hauskin)/i,
  /painet\w* suomessa/i, /\bmuki/i, /\behkä\b/i, /\bsaattaa\b/i, /mahdollisesti/i, /\b(voisi|voisit|saattaisi|kenties|luultavasti)\b/i,
  /\d+(,\d+)?\s?€/, /arkipäiv/i, /\b\d{1,2}\.\d{1,2}\./,
];

describe("ammattisivut: sisältö", () => {
  it("40 sivua polkulistan järjestyksessä, slugit ASCII ja yksilöllisiä", () => {
    expect(AMMATTISIVU_SLUGIT).toHaveLength(40);
    expect(new Set(AMMATTISIVU_SLUGIT).size).toBe(40);
    expect(AMMATTISIVUT.map((s) => s.slug)).toEqual([...AMMATTISIVU_SLUGIT]);
    for (const s of AMMATTISIVU_SLUGIT) expect(s).toMatch(/^[a-z0-9-]+$/);
    expect(AMMATTISIVUT.filter((s) => s.ryhma === "ammatti").length).toBeGreaterThanOrEqual(20);
    // Kevyt kohdelista (tuotesivun Sopii lahjaksi -rivi) vastaa sisällön kohdetta.
    expect(Object.fromEntries(AMMATTISIVUT.map((s) => [s.slug, s.kohde]))).toEqual({ ...AMMATTISIVU_KOHTEET });
  });

  it.each(AMMATTISIVUT.map((s) => [s.slug, s] as const))("%s: 250-400 sanaa omaa tekstiä, ei ajatusviivoja eikä kiellettyjä ilmauksia", (_slug, s) => {
    const n = sanat(omaTeksti(s)).length;
    expect(n, `${s.slug}: ${n} sanaa`).toBeGreaterThanOrEqual(250);
    expect(n, `${s.slug}: ${n} sanaa`).toBeLessThanOrEqual(400);
    expect(s.intro.length).toBeGreaterThanOrEqual(2);
    expect(s.intro.length).toBeLessThanOrEqual(3);
    expect(s.opas.length).toBeGreaterThanOrEqual(2);
    expect(s.ukk).toHaveLength(3);
    const tekstit = [s.nimi, s.otsikko, s.kuvaus, s.h1, s.personoitu.teksti, s.personoitu.label, ...s.intro,
      ...s.opas.flatMap((o) => [o.otsikko, ...o.teksti]), ...s.ukk.flatMap((f) => [f.q, f.a]), ...s.mallit.flat()];
    for (const t of tekstit) for (const re of KIELLETYT) expect(t, `${s.slug}: ${re}`).not.toMatch(re);
    expect(`${s.otsikko} | Huumorikauppa`.length, s.otsikko).toBeLessThan(60);
    expect(s.kuvaus.length, s.kuvaus).toBeGreaterThan(70);
    expect(s.kuvaus.length, s.kuvaus).toBeLessThan(155);
  });

  it("tekstit eroavat toisistaan: 5 sanan jaksoista alle 15 % yhteisiä minkään toisen sivun kanssa", () => {
    const j = AMMATTISIVUT.map((s) => ({ slug: s.slug, g: jaksot(omaTeksti(s)) }));
    // Vertailuun myös aiemmat laskeutumissivut (sarja-, aihe- ja lahjasivut).
    const muut = landingPages.filter((p) => !p.path.startsWith("/paidat/"))
      .map((p) => ({ slug: p.path, g: jaksot([...p.intro, ...(p.opas ?? []).flatMap((o) => o.teksti)].join(" ")) }));
    for (const a of j) {
      for (const b of [...j, ...muut]) {
        if (a.slug === b.slug) continue;
        let yhteiset = 0;
        for (const x of a.g) if (b.g.has(x)) yhteiset++;
        expect(yhteiset / a.g.size, `${a.slug} vs ${b.slug}`).toBeLessThan(0.15);
      }
    }
  });

  it("otsikot, H1:t, kuvaukset, ensimmäiset virkkeet ja UKK:n kysymykset ovat sivukohtaisia", () => {
    for (const key of ["otsikko", "h1", "kuvaus", "nimi"] as const) {
      const arvot = AMMATTISIVUT.map((s) => s[key].toLowerCase());
      expect(new Set(arvot).size, key).toBe(arvot.length);
    }
    const kysymykset = AMMATTISIVUT.flatMap((s) => s.ukk.map((f) => f.q.toLowerCase()));
    expect(new Set(kysymykset).size).toBe(kysymykset.length);
  });

  it("linkit: vähintään 3 laskeutumissivua, ei omaa polkua eikä ohjattuja polkuja", () => {
    const polut = new Set(LANDING_PATHS);
    for (const s of AMMATTISIVUT) {
      const oma = `/paidat/${s.slug}`;
      expect(s.liittyvat.length, s.slug).toBeGreaterThanOrEqual(3);
      expect(new Set(s.liittyvat).size, s.slug).toBe(s.liittyvat.length);
      for (const r of s.liittyvat) {
        expect(r, s.slug).not.toBe(oma);
        expect(polut.has(r), `${s.slug} -> ${r}`).toBe(true);
      }
      for (const l of s.lisalinkit ?? []) expect(LANDING_REDIRECTS[l.href], `${s.slug} -> ${l.href}`).toBeUndefined();
    }
  });

  it("personoitu vaihtoehto: esitäytetty linkki olemassa olevaan personoitavaan tuotteeseen tai malliin", () => {
    const slugit = new Set(tuotteet.map((p) => p.slug));
    const mallit = new Set(MALLIT.map((m: { id: string }) => m.id));
    for (const s of AMMATTISIVUT) {
      const url = new URL(s.personoitu.href, "https://huumorikauppa.fi");
      if (url.pathname === "/personoitu-paita") {
        expect(mallit.has(url.searchParams.get("malli")), s.slug).toBe(true);
      } else {
        expect(url.pathname, s.slug).toMatch(/^\/tuote\/personoitava-/);
        expect(slugit.has(url.pathname.replace("/tuote/", "")), s.slug).toBe(true);
        const teksti = url.searchParams.get("teksti") ?? "";
        expect(teksti.length, s.slug).toBeGreaterThan(3);
        expect(teksti.length, s.slug).toBeLessThanOrEqual(200);
      }
    }
  });
});

describe("ammattisivut: tuotteet ja uudet mallit", () => {
  it("jokaisella sivulla on viisi uutta mallia t-paitana ja hupparina, nimet ja slugit yksilöllisiä", () => {
    expect(AMMATTIMALLISTO).toHaveLength(40 * 5 * 2);
    const vanhat = new Set(tuotteet.flatMap((p) => [p.slug, p.name.toLowerCase()]));
    const slugit = AMMATTIMALLISTO.map((t) => t.slug);
    expect(new Set(slugit).size).toBe(slugit.length);
    for (const s of AMMATTISIVUT) {
      expect(s.mallit, s.slug).toHaveLength(5);
      expect(sivunUudet(s.slug).size, s.slug).toBe(10);
    }
    for (const t of AMMATTIMALLISTO) {
      expect(vanhat.has(t.slug), t.slug).toBe(false);
      expect(vanhat.has(t.name.toLowerCase()), t.name).toBe(false);
      expect(t.slug).toBe(tuoteSlug(t.name));
      expect(t.slug).toMatch(/^[a-z0-9-]+$/);
      expect(t.name).not.toMatch(/[–—]/);
      expect(t.rivit.length, t.name).toBeGreaterThanOrEqual(2);
      expect(t.rivit.length, t.name).toBeLessThanOrEqual(4);
      for (const r of t.rivit) {
        expect(r, t.name).toBe(r.toLocaleUpperCase("fi"));
        expect(r.length, `${t.name}: ${r}`).toBeLessThanOrEqual(22);
      }
      expect(tavaramerkki(t.rivit.join(" ")), t.name).toBeNull();
      // Hakuotsikko (Merchant, tuotesivun title) alle 70 merkkiä ilman, että painoteksti katkeaa.
      const h = hakuotsikko({ name: t.name, slug: t.slug, category: t.category, description: "" });
      expect(h.length, h).toBeLessThan(70);
      expect(h.toLowerCase(), h).toContain(otsikkoTeksti(t.rivit).toLowerCase().replace(/[.!?]+$/, ""));
    }
  });

  it.each(AMMATTI_SIVUT.map((p) => [p.path, p] as const))("%s: vähintään 6 aiheen tuotetta ja 8 tuotetta sivulla, uudet mallit ensin", (_p, p) => {
    const lista = selectLandingProducts(p, kaikki);
    expect(lista.length).toBeGreaterThanOrEqual(Math.max(6, LANDING_MIN_PRODUCTS));
    const uudet = sivunUudet(p.path.replace("/paidat/", ""));
    expect(lista.slice(0, 10).every((x) => uudet.has(x.slug))).toBe(true);
    for (const x of lista) expect(x.category).not.toBe("mukit");
  });

  it("odotuslista (AMMATTISIVUT_ODOTTAA) puretaan, kun sivun uudet mallit ovat tilannekuvassa", () => {
    const tilannekuvassa = new Set(tuotteet.map((p) => p.slug));
    for (const s of AMMATTISIVU_SLUGIT) {
      const tuotu = [...sivunUudet(s)].every((slug) => tilannekuvassa.has(slug));
      if (tuotu) expect(AMMATTISIVUT_ODOTTAA.has(`/paidat/${s}`), `/paidat/${s}: poista AMMATTISIVUT_ODOTTAA-listalta`).toBe(false);
    }
  });

  it("Printify-lista on synkronissa (npx tsx scripts/generoi-ammattimallisto.mjs) ja kelpaa putkelle", () => {
    const json = JSON.parse(read("data/uudet-tuotteet/ammattisivut-2026-11-02.json"));
    const { tuotteet: rivit, virheet } = parseLista(json, { tiedosto: "ammattisivut" });
    expect(virheet).toEqual([]);
    expect(rivit.map((r: { otsikko: string }) => r.otsikko)).toEqual(AMMATTIMALLISTO.map((t) => t.name));
    for (const r of rivit as { tyyppi: string; varit: string[]; koot: string[] }[]) {
      if (r.tyyppi === "huppari") {
        expect(r.varit).toEqual(["Black", "Navy", "Red"]);
        expect(r.koot).toEqual(["S", "M", "L", "XL", "2XL", "3XL"]);
      } else {
        expect(r.varit).toEqual(["Black", "Navy", "Sport Grey", "Red"]);
        expect(r.koot).toEqual(["S", "M", "L", "XL", "2XL"]);
      }
    }
    expect(json.oletukset).toMatchObject({ painotalo: "OPT OnDemand", blueprint: 145 });
  });

  it("kate: jokaisen variantin nettokate yhden tuotteen tilauksessa on vähintään 7 € (samat pohjat ja kulut kuin 2.11. ammattimallistossa)", () => {
    const kulut = (kateKuva as unknown as { tuotteet: { slug: string; category: string; variants: Record<string, unknown> }[] }).tuotteet;
    const pohja = {
      "t-paidat": kulut.find((p) => p.slug === "sahkomies-tiedan-mika-johtaa-mihinkin-t-paita-sahkomiehelle")!,
      hupparit: kulut.find((p) => p.slug === "sahkomies-tiedan-mika-johtaa-mihinkin-huppari-sahkomiehelle")!,
    };
    expect(pohja["t-paidat"]).toBeTruthy();
    expect(pohja.hupparit).toBeTruthy();
    let pienin = Infinity;
    for (const t of AMMATTIMALLISTO) {
      const p = pohja[t.category];
      const rivi = hinnoitteleRivi({ ...p, name: t.name, slug: t.slug, price: t.category === "hupparit" ? 52.9 : 27.9 });
      const kartta = (rivi.variants as { variant_map: Record<string, number> }).variant_map;
      for (const [avain, id] of Object.entries(kartta)) {
        const koko = avain.split("|")[1];
        const k = laskeTilauksenNettokate([{ tuote: rivi, varianttiId: id, maara: 1, yksikkohinta: rivinHinta(rivi, koko) }], TOIMITUSMAKSU);
        expect(k.tunnettu).toBe(true);
        pienin = Math.min(pienin, k.nettokate!);
        expect(k.nettokate!, `${t.name} ${avain}`).toBeGreaterThanOrEqual(TILAUKSEN_MIN_KATE_EUROA);
      }
    }
    expect(pienin).toBeGreaterThanOrEqual(TILAUKSEN_MIN_KATE_EUROA);
  });
});

describe("ammattisivut: reitit, esirenderöinti, sivukartta ja canonical", () => {
  const sivut = buildPrerenderPages({ products: tuotteet });
  const polulla = new Map(sivut.map((p) => [p.path, p]));
  const nav = buildSiteNav(tuotteet);
  const TEMPLATE = read("index.html");
  const sitemap = read("api/sitemap.js");

  it("jokainen sivu on reitti, laskeutumissivu ja sivukartassa", () => {
    for (const s of AMMATTISIVU_SLUGIT) {
      const p = `/paidat/${s}`;
      expect(LANDING_PATHS, p).toContain(p);
      expect(sitemap, p).toContain(`"${p}"`);
    }
  });

  it("esirenderöity HTML: oma canonical, H1, FAQPage-JSON-LD ja personoitu linkki", () => {
    for (const s of AMMATTISIVUT) {
      const p = polulla.get(`/paidat/${s.slug}`);
      expect(p, s.slug).toBeTruthy();
      const html = renderPageHtml(TEMPLATE, p!, nav);
      expect(html).toContain(`<link rel="canonical" href="https://huumorikauppa.fi/paidat/${s.slug}" />`);
      expect(html).toContain('"@type":"FAQPage"');
      expect(html).toContain(s.h1.replace(/&/g, "&amp;"));
      expect(html).not.toMatch(/<meta name="robots" content="[^"]*noindex/);
    }
  });

  it("päällekkäiset vanhat ammatti- ja harrastussivut ohjautuvat 301:llä uudelle sivulle", () => {
    const ohjattavat: Record<string, string> = {
      "/ammatti/sahkoasentaja": "/paidat/sahkomies", "/ammatti/putkimies": "/paidat/putkimies",
      "/ammatti/sairaanhoitaja": "/paidat/sairaanhoitaja", "/ammatti/lahihoitaja": "/paidat/lahihoitaja",
      "/ammatti/laakari": "/paidat/laakari", "/ammatti/opettaja": "/paidat/opettaja", "/ammatti/kokki": "/paidat/kokki",
      "/ammatti/poliisi": "/paidat/poliisi", "/ammatti/palomies": "/paidat/palomies", "/ammatti/yrittaja": "/paidat/yrittaja",
      "/ammatti/fysioterapeutti": "/paidat/fysioterapeutti", "/ammatti/hammaslaakari": "/paidat/hammaslaakari",
      "/ammatti/insinoori": "/paidat/insinoori", "/ammatti/siivoja": "/paidat/siivooja", "/ammatti/rekkakuljettaja": "/paidat/rekkakuski",
      "/harrastus/juokseminen": "/paidat/juoksija", "/harrastus/kuntosali": "/paidat/kuntosali", "/harrastus/pyoraily": "/paidat/pyorailija",
      "/harrastus/koiraharrastus": "/paidat/koiraihminen", "/harrastus/kissaharrastus": "/paidat/kissaihminen",
      "/harrastus/retkily": "/paidat/retkeilija", "/harrastus/videopelit": "/paidat/pelaaja",
      "/lahjat/opettajalle": "/paidat/opettaja", "/lahjat/hoitajalle": "/paidat/sairaanhoitaja",
      "/lahjat/kahvinystavalle": "/paidat/kahvinjuoja", "/lahjat/yrittajalle": "/paidat/yrittaja",
    };
    const vercel = JSON.parse(read("vercel.json")) as { redirects: { source: string; destination: string; statusCode?: number }[] };
    for (const [from, to] of Object.entries(ohjattavat)) {
      expect(LANDING_REDIRECTS[from], from).toBe(to);
      expect(polulla.has(from), from).toBe(false);
      const r = vercel.redirects.find((x) => x.source === from);
      expect(r?.destination, from).toBe(to);
      expect(r?.statusCode, from).toBe(301);
    }
  });

  it("hub-sivut linkittävät ammatti- ja harrastussivuille", () => {
    const ammatit = landingPages.find((p) => p.path === "/ammatit")!;
    const harrastajalle = landingPages.find((p) => p.path === "/lahjat/harrastajalle")!;
    const linkit = (p: typeof ammatit) => new Set((p.extraLinks ?? []).map((l) => l.href));
    for (const s of AMMATTISIVUT) {
      const hub = s.ryhma === "ammatti" ? ammatit : harrastajalle;
      expect(linkit(hub).has(`/paidat/${s.slug}`), s.slug).toBe(true);
    }
  });
});

describe("ammattisivut: mittari", () => {
  it("käynnit /paidat/-polulta kirjataan omaan osioonsa ja lasketaan ammattisivuiksi, ei lahjasivuiksi", () => {
    expect(sivunOsio("/paidat/sahkomies?utm_source=x")).toBe("paidat");
    const k = liikenne({ lahteet: [], osiot: [{ nimi: "paidat", kaynnit: 4 }, { nimi: "lahjat", kaynnit: 2 }] });
    expect(k.ammattisivut).toBe(4);
    expect(k.lahjasivut).toBe(2);
  });
});
