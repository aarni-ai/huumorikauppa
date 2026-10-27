import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ryhmatilausPage, RYHMATILAUS_MAILTO, RYHMATILAUS_PATH } from "./ryhmatilausPage";
import { TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "@/config/toimitus";
import { CHRISTMAS_DEADLINE_PROMISE } from "./christmas";
import { buildPrerenderPages, buildSiteNav } from "@/seo/prerender/pages";
import { buildLlmsTxt } from "@/seo/llms";

const read = (p: string) => fs.readFileSync(path.resolve(__dirname, "../..", p), "utf8");

const allText = [
  ryhmatilausPage.title,
  ryhmatilausPage.description,
  ryhmatilausPage.h1,
  ...ryhmatilausPage.intro,
  ...ryhmatilausPage.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.items ?? [])]),
  ...ryhmatilausPage.faqs.flatMap((f) => [f.q, f.a]),
].join("\n");

describe("/ryhmatilaukset", () => {
  it("tekstisäännöt: ei ajatusviivoja, epävarmuutta, hintalupauksia eikä alennuksia", () => {
    expect(allText).not.toMatch(/[–—]/);
    expect(allText).not.toMatch(/(?<!\p{L})(saattaa|ehkä|todennäköisesti|pyrimme|voi olla että)(?!\p{L})/iu);
    // Ainoa euromäärä on toimitusehtojen vakioista tuleva toimitusmaksu.
    const eurot = [...allText.matchAll(/(\d+(?:,\d+)?) ?€/g)].map((m) => m[1]);
    expect(eurot.every((e) => e === TOIMITUSMAKSU_TEKSTI)).toBe(true);
    expect(allText).not.toMatch(/%|määräalennu|paljousalennu|tarjoushint|edullisemmin|halvemmalla/i);
    expect(allText).not.toMatch(/painettu suomessa|suomen paras/i);
    // Alennus mainitaan vain kieltävässä UKK-vastauksessa.
    const alennus = ryhmatilausPage.faqs.find((f) => /alennus/i.test(f.q))!;
    expect(alennus.a).toMatch(/^Ei saa\./);
    expect(ryhmatilausPage.title.length).toBeLessThan(60);
    expect(ryhmatilausPage.description.length).toBeLessThan(155);
  });

  it("toimitusaika ja joulun tilauspäivä tulevat vakioista", () => {
    expect(allText).toContain(`${TOIMITUSAIKA_TEKSTI} arkipäivää`);
    expect(allText).toContain(CHRISTMAS_DEADLINE_PROMISE);
    const dates = [...allText.matchAll(/\b\d{1,2}\.\d{1,2}\.\d{4}\b/g)].map((m) => m[0]);
    for (const d of dates) expect(CHRISTMAS_DEADLINE_PROMISE).toContain(d);
  });

  it("sähköpostilinkissä on valmis aihe", () => {
    expect(RYHMATILAUS_MAILTO).toMatch(/^mailto:huumorikauppa@gmail\.com\?subject=Ryhm%C3%A4tilaus&body=/);
  });

  it("reititys, sivukartta, alatunniste, llms.txt ja esirenderöinti", () => {
    expect(read("src/App.tsx")).toContain(`path="${RYHMATILAUS_PATH}"`);
    expect(read("api/sitemap.js")).toContain(`"${RYHMATILAUS_PATH}"`);
    expect(read("src/components/layout/Footer.tsx")).toContain(`to="${RYHMATILAUS_PATH}"`);
    expect(buildSiteNav().footer.map((l) => l.href)).toContain(RYHMATILAUS_PATH);
    expect(buildLlmsTxt([])).toContain(`https://huumorikauppa.fi${RYHMATILAUS_PATH}`);
    const page = buildPrerenderPages({ products: [] }).find((p) => p.path === RYHMATILAUS_PATH)!;
    expect(page).toBeDefined();
    expect(page.title).toBe(ryhmatilausPage.title);
    expect(JSON.stringify(page.jsonLd)).toContain('"FAQPage"');
    expect(page.faqs).toEqual(ryhmatilausPage.faqs);
  });
});
