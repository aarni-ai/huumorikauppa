import { execFileSync } from "node:child_process";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INTELLER, UUSIKU, postiosoite, valittuMyyja, yritystiedot } from "./yritys";

const ROOT = path.resolve(__dirname, "../..");
const ENNEN = "";
const JALKEEN = "uusiku";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("yritystiedot()", () => {
  it("oletus on Inteller; Uusiku Oy vain, kun MYYJA=uusiku (ei päivämäärään sidottua vaihtoa)", () => {
    vi.stubEnv("MYYJA", "");
    expect(valittuMyyja()).toBe("inteller");
    expect(yritystiedot()).toBe(INTELLER);
    expect(yritystiedot("inteller")).toBe(INTELLER);
    expect(yritystiedot("uusiku")).toBe(UUSIKU);
    vi.stubEnv("MYYJA", "Uusiku");
    expect(yritystiedot()).toBe(UUSIKU);
    vi.stubEnv("MYYJA", "jotain");
    expect(yritystiedot()).toBe(INTELLER);
  });

  it("Uusiku Oy:n tiedot vastaavat YTJ:tä", () => {
    expect(UUSIKU).toMatchObject({
      legalName: "Uusiku Oy",
      businessId: "3653666-7",
      vatId: "FI36536667",
      streetAddress: "Capellan puistotie 21",
      postalCode: "00580",
      addressLocality: "Helsinki",
      email: "huumorikauppa@gmail.com",
    });
    expect(postiosoite(UUSIKU)).toBe("Capellan puistotie 21, 00580 Helsinki");
    expect(postiosoite(INTELLER)).toBe("Helsinki");
  });

  it("ei ajastettua vaihtoa: GitHub Actions -työnkulkua ei ole", async () => {
    const fs = await import("node:fs");
    expect(fs.existsSync(path.join(ROOT, ".github/workflows/yritysvaihto.yml"))).toBe(false);
  });
});

async function lataaHetkella(myyja: string) {
  vi.resetModules();
  vi.stubEnv("MYYJA", myyja);
  const site = await import("../seo/site");
  const sd = await import("../seo/structuredData");
  return { site, sd };
}

describe("ORGANIZATION seuraa MYYJA-muuttujaa moduulin latautuessa", () => {
  it.each([
    [ENNEN, INTELLER],
    [JALKEEN, UUSIKU],
  ])("MYYJA=%s", async (nyt, odotettu) => {
    const { site, sd } = await lataaHetkella(nyt);
    expect(site.ORGANIZATION.legalName).toBe(odotettu.legalName);
    expect(site.ORGANIZATION.legalId).toBe(odotettu.businessId);
    expect(site.ORGANIZATION.vatID).toBe(odotettu.vatId);
    expect(site.ORGANIZATION.streetAddress).toBe(odotettu.streetAddress);
    expect(site.ORGANIZATION.postalCode).toBe(odotettu.postalCode);
    expect(site.ORGANIZATION.email).toBe(odotettu.email);

    const org = sd.buildOrganizationJsonLd() as Record<string, any>;
    expect(org.legalName).toBe(odotettu.legalName);
    expect(org.taxID).toBe(odotettu.businessId);
    expect(org.vatID).toBe(odotettu.vatId);
    expect(org.identifier.value).toBe(odotettu.businessId);
    expect(org.address["@type"]).toBe("PostalAddress");
    expect(org.address.streetAddress).toBe(odotettu.streetAddress ?? undefined);
    expect(org.address.postalCode).toBe(odotettu.postalCode ?? undefined);
  });

  it("esirenderöidyt ehdot, tietosuoja, yritystiedot ja llms.txt näyttävät Uusiku Oy:n, kun MYYJA=uusiku", async () => {
    await lataaHetkella("uusiku");
    const { renderComponentPages } = await import("../seo/prerender/renderComponents");
    const html = await renderComponentPages(() => {});
    for (const reitti of ["/toimitusehdot", "/tietosuojakaytanto", "/tietoa-meista"]) {
      const sivu = html[reitti];
      expect(sivu, reitti).toBeTruthy();
      expect(sivu).toContain("Uusiku Oy");
      expect(sivu).toContain("3653666-7");
      expect(sivu).toContain("Capellan puistotie 21, 00580 Helsinki");
      expect(sivu).not.toMatch(/inteller|3583677/i);
    }
    expect(html["/toimitusehdot"]).toContain("FI36536667");

    const llms = await import("../seo/llms");
    const txt = llms.buildLlmsTxt([]);
    expect(txt).toContain("Uusiku Oy");
    expect(txt).toContain("Y-tunnus: 3653666-7");
    expect(txt).toContain("ALV-numero: FI36536667");
    expect(txt).not.toMatch(/inteller|3583677/i);
  }, 30_000);
});

/** git grep seuratuista tiedostoista (tyhjä tulos = ei osumia). */
function gitGrep(pattern: string, pathspecs: string[]): string[] {
  try {
    return execFileSync("git", ["grep", "-n", "-i", "-E", pattern, "--", ...pathspecs], { cwd: ROOT, encoding: "utf8" })
      .split("\n")
      .filter(Boolean);
  } catch (err) {
    if ((err as { status?: number }).status === 1) return [];
    throw err;
  }
}

describe("vanhat tunnisteet ja Seniorituki", () => {
  it("Intellerin nimi, Y-tunnus tai ALV-numero löytyy vain yritys.ts:stä ja sen testistä", () => {
    const osumat = gitGrep("inteller|3583677|FI35836772", [
      "src",
      "public",
      "api",
      "index.html",
      "middleware.ts",
      "vite.config.ts",
      "scripts",
      "supabase",
      ":!src/config/yritys.ts",
      ":!api/_lib/yritys.js",
      ":!src/config/yritys.test.ts",
    ]);
    expect(osumat).toEqual([]);
  });

  it("Senioritukea ei mainita sivustolla", () => {
    const osumat = gitGrep("seniorituki", [
      "src",
      "public",
      "api",
      "index.html",
      "middleware.ts",
      ":!src/config/yritys.test.ts",
    ]);
    expect(osumat).toEqual([]);
  });
});
