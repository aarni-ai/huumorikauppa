import { execFileSync } from "node:child_process";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INTELLER, UUSIKU, YRITYS_VAIHTO, postiosoite, yritystiedot } from "./yritys";

const ROOT = path.resolve(__dirname, "../..");
const ENNEN = "2026-10-31T21:59:59Z";
const JALKEEN = "2026-10-31T22:00:00Z";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("yritystiedot()", () => {
  it("vaihtuu 1.11.2026 klo 00.00 Suomen aikaa", () => {
    expect(YRITYS_VAIHTO).toBe(JALKEEN);
    expect(new Date(JALKEEN).toLocaleString("fi-FI", { timeZone: "Europe/Helsinki" })).toBe("1.11.2026 klo 0.00.00");
    expect(yritystiedot(new Date(ENNEN))).toBe(INTELLER);
    expect(yritystiedot(new Date(JALKEEN))).toBe(UUSIKU);
    expect(yritystiedot(new Date("2027-06-01T00:00:00Z"))).toBe(UUSIKU);
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

  it("YRITYS_NYT ohittaa nykyhetken", () => {
    vi.stubEnv("YRITYS_NYT", JALKEEN);
    expect(yritystiedot()).toBe(UUSIKU);
    vi.stubEnv("YRITYS_NYT", ENNEN);
    expect(yritystiedot()).toBe(INTELLER);
  });
});

async function lataaHetkella(nyt: string) {
  vi.resetModules();
  vi.stubEnv("YRITYS_NYT", nyt);
  const site = await import("../seo/site");
  const sd = await import("../seo/structuredData");
  return { site, sd };
}

describe("ORGANIZATION seuraa vaihtoa moduulin latautuessa", () => {
  it.each([
    [ENNEN, INTELLER],
    [JALKEEN, UUSIKU],
  ])("hetkellä %s", async (nyt, odotettu) => {
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

  it("esirenderöidyt ehdot, tietosuoja, yritystiedot ja llms.txt näyttävät Uusiku Oy:n vaihdon jälkeen", async () => {
    await lataaHetkella("2026-11-01T00:05:00+02:00");
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
  });
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
