import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  KAIKKI_ZIP_ID,
  KARKITUOTTEET,
  LAHJAVINKIT,
  MEDIA_EMAIL,
  MEDIA_PATH,
  SARJAT,
  mediaKaupanTiedot,
  ryhmanZip,
  zipPolku,
} from "./mediaKit";
import { mediaKuvat, tulostusUrl, valitseTuotteet } from "@/lib/mediaKit";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "@/config/toimitus";
import { jouluLause } from "./tilauspaivat";
import { STATIC_PAGE_META } from "@/seo/staticPageMeta";
import { buildPrerenderPages, buildSiteNav } from "@/seo/prerender/pages";

const read = (p: string) => fs.readFileSync(path.resolve(__dirname, "../..", p), "utf8");

describe("/media", () => {
  it("kärkituotteita on 20 ja slugit ovat yksilöllisiä", () => {
    expect(KARKITUOTTEET.slugs).toHaveLength(20);
    expect(new Set(KARKITUOTTEET.slugs).size).toBe(20);
  });

  it("lahjavinkeissä on kuusi pyydettyä teemaa ja jokaisessa tuotteita", () => {
    expect(LAHJAVINKIT.map((t) => t.id)).toEqual(["remontoijat", "sauna", "kalastus", "autot", "elakelaiset", "isat-ja-aidit"]);
    for (const t of LAHJAVINKIT) expect(t.slugs.length, t.id).toBeGreaterThanOrEqual(3);
  });

  it("sarjojen id:t ovat ASCII-tunnuksia ja ainutlaatuisia", () => {
    const ids = [KARKITUOTTEET, ...SARJAT].map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
    expect(ryhmanZip(KARKITUOTTEET)).toBe(zipPolku(KAIKKI_ZIP_ID));
  });

  it("kaupan tiedot tulevat vakioista: toimitus, joulun tilauspäivä, myyjä ja sähköposti", () => {
    const text = mediaKaupanTiedot().join("\n");
    expect(text).toContain(`${TOIMITUSMAKSU_TEKSTI} €`);
    expect(text).toContain(`${ILMAINEN_RAJA_TEKSTI} euron`);
    expect(text).toContain(jouluLause());
    expect(text).toContain("Uusiku Oy");
    expect(text).toContain(MEDIA_EMAIL);
    for (const m of ["Visa", "Mastercard", "Apple Pay", "Google Pay", "Klarna", "MobilePay"]) expect(text).toContain(m);
    expect(text).not.toMatch(/[–—]/);
  });

  it("kuvavalinta: tunnelmakuva, varakuva ja 2048 px:n osoite", () => {
    const base = "https://images-api.printify.com/mockup/p/1/2/n.jpg?camera_label=";
    const lifestyle = mediaKuvat({ images: [], variants: { default_color: "A", variant_images: { A: [`${base}front`, `${base}back`, `${base}lifestyle`] } } });
    expect(lifestyle.tuote?.tulostusUrl).toBe(`${base}front&s=2048`);
    expect(lifestyle.toinen?.tunnus).toBe("tunnelmakuva");
    const vara = mediaKuvat({ images: [], variants: { default_color: "A", variant_images: { A: [`${base}front`, `${base}folded`] } } });
    expect(vara.toinen?.tunnus).toBe("lisakuva");
    expect(tulostusUrl("https://x/y.jpg")).toBe("https://x/y.jpg?s=2048");
    expect(valitseTuotteet(["b", "x", "a"], [{ slug: "a" }, { slug: "b" }]).map((p) => p.slug)).toEqual(["b", "a"]);
  });

  it("meta: ei ajatusviivoja, indeksoitava", () => {
    const meta = STATIC_PAGE_META[MEDIA_PATH];
    expect(`${meta.title}${meta.description}${meta.h1}${meta.intro}`).not.toMatch(/[–—]/);
    expect(read("src/pages/MediaPage.tsx")).not.toMatch(/noindex/);
  });

  it("reititys, sivukartta, alatunniste (ei päävalikossa), llms.txt ja esirenderöinti", () => {
    expect(read("src/App.tsx")).toContain("path={MEDIA_PATH}");
    expect(read("api/sitemap.js")).toContain(`"${MEDIA_PATH}"`);
    expect(read("src/components/layout/Footer.tsx")).toMatch(/to="\/media"[^>]*>Medialle</);
    const nav = buildSiteNav();
    expect(nav.footer).toContainEqual({ href: MEDIA_PATH, label: "Medialle" });
    expect(nav.main.map((l) => l.href)).not.toContain(MEDIA_PATH);
    const page = buildPrerenderPages({ products: [] }).find((p) => p.path === MEDIA_PATH)!;
    expect(page).toBeDefined();
    expect(page.title).toBe(STATIC_PAGE_META[MEDIA_PATH].title);
    expect(page.h1).toBe(STATIC_PAGE_META[MEDIA_PATH].h1);
  });

  it("esirenderöity sivu listaa kärkituotteet linkkeineen", () => {
    const products = KARKITUOTTEET.slugs.map((slug, i) => ({
      id: String(i), name: slug, slug, category: "t-paidat", humor_type: "yleinen", price: 24.9, stock: 5,
      description: "", images: [], variants: {}, is_featured: false, is_new: false, is_gift_idea: false,
    }));
    const page = buildPrerenderPages({ products }).find((p) => p.path === MEDIA_PATH)!;
    expect(page.products).toHaveLength(20);
  });

  it("zip-paketit on commitoitu ja kokonaiskoko pysyy rajassa", () => {
    const dir = path.resolve(__dirname, "../../public/media");
    const zips = fs.readdirSync(dir).filter((f) => f.endsWith(".zip"));
    expect(zips).toContain(`huumorikauppa-${KAIKKI_ZIP_ID}.zip`);
    const total = zips.reduce((sum, f) => sum + fs.statSync(path.join(dir, f)).size, 0);
    expect(total).toBeLessThan(25 * 1048576);
  });
});
