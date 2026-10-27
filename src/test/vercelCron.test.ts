import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Ajastetut työt Vercel Cronissa (27.10.2026): Vercel lähettää CRON_SECRETin itse (Authorization: Bearer), joten
 * GitHubin salaisuuksia ei tarvita. GitHub Actionsiin jäävät vain työt, jotka eivät tarvitse salaisuuksia.
 */
const ROOT = path.resolve(__dirname, "../..");
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
// Ajastukset erillisessä tiedostossa (scripts/julkaise-uusi.sh yhdistää ne uuden projektin julkaisuun).
const crons: { path: string; schedule: string }[] = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.crons.json"), "utf8")).crons;

describe("Vercel Cron", () => {
  it("ajaa valvonnan tunnin välein, yhteenvedon, saatavuuden ja katetarkistuksen", () => {
    const polut = crons.map((c) => c.path);
    expect(crons.find((c) => c.path === "/api/cron/tilaukset")?.schedule).toBe("17 * * * *");
    expect(polut).toContain("/api/cron/tilaukset?tehtava=yhteenveto");
    expect(polut).toContain("/api/cron/tilaukset?tehtava=saatavuus");
    expect(polut).toContain("/api/cron/tilaukset?tehtava=katetarkistus");
    expect(new Set(polut).size).toBe(polut.length);
  });

  it("yhteenveto ajetaan 04 ja 05 UTC (klo 7 Helsingissä kesä- ja talviaikana)", () => {
    expect(crons.find((c) => c.path.endsWith("tehtava=yhteenveto"))?.schedule).toBe("0 4,5 * * *");
  });

  it("yksikään GitHub-työnkulku ei tarvitse salaisuuksia", () => {
    const kansio = path.join(ROOT, ".github/workflows");
    for (const f of fs.readdirSync(kansio)) {
      expect(fs.readFileSync(path.join(kansio, f), "utf8"), f).not.toMatch(/secrets\./);
    }
  });

  it("cron-funktio tarkistaa CRON_SECRETin", () => {
    const koodi = fs.readFileSync(path.join(ROOT, "api/cron/tilaukset.js"), "utf8");
    expect(koodi).toMatch(/req\.headers\.authorization !== `Bearer \$\{process\.env\.CRON_SECRET\}`/);
  });
});

describe("vanhan projektin välitys (middleware.ts)", () => {
  it("vercel.json ei sisällä ajastuksia (vanha projekti voi olla Hobby-tasolla)", () => {
    expect(vercel.crons).toBeUndefined();
  });
  it("vercel.app-osoitteiden noindex ei koske välitettyjä pyyntöjä", () => {
    const r = vercel.headers.find((h: { has?: { value?: string }[] }) => h.has?.[0]?.value === ".*\\.vercel\\.app");
    expect(r.missing).toEqual([{ type: "header", key: "x-huumorikauppa-proxy" }]);
  });
});
