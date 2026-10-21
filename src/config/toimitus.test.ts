import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import * as toimitus from "./toimitus";
import { ILMAINEN_RAJA, TOIMITUS } from "../../api/_lib/syote-lisakentat.js";
import * as vakiot from "../../api/_lib/vakiot.js";
import { SHIPPING } from "../seo/site";

const ROOT = path.resolve(__dirname, "../..");

/**
 * Kovakoodatut toimitusehdot: nykyiset (6,90 € / 79 €) ja tulevat (5,90 € / 60 €) arvot.
 * Edeltävä numero, pilkku tai piste ei saa olla osa lukua (esim. 16,90 € tai 79,60 € ovat hintoja).
 */
const KIELLETYT = /(?<![\d,.])(6,90|6\.90|79 ?€|79 ?&euro;|79 ?euro|5,90|60 ?€)/;

/** Sallitut: testit, fixturet, Supabase-funktiot (kassa) ja itse konfiguraatio. */
const SALLITUT = [
  /\.test\.[jt]sx?$/,
  /\/test\//,
  /fixtures\//,
  /^supabase\/functions\//,
  /^src\/config\/toimitus\.ts$/,
  // Poistettujen arvioiden arkisto (ei sovelluksen käytössä): asiakkaan alkuperäinen teksti säilytetään.
  /^src\/data\/arvostelut-arkisto\.ts$/,
];

/** Väliaikaisesti ohitettavat tiedostot (tyhjä: kaikki lukevat arvot src/config/toimitus.ts:stä). */
const VALIAIKAISESTI_OHITETUT: string[] = [];

/** Rivikohtainen poikkeus perustelulla (esim. tietokannan vanhan tekstin siivous). */
const RIVIPOIKKEUS = "toimitus-grep: sallittu";

const TEKSTITIEDOSTO = /\.(ts|tsx|js|jsx|mjs|cjs|json|html|txt|xml|md|css|svg)$/;

function tiedostot(kohde: string): string[] {
  const abs = path.join(ROOT, kohde);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isFile()) return [kohde];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) => {
    const rel = `${kohde}/${e.name}`;
    if (e.isDirectory()) return e.name === "node_modules" ? [] : tiedostot(rel);
    return TEKSTITIEDOSTO.test(e.name) ? [rel] : [];
  });
}

describe("toimitusehdot yhdessä konfiguraatiossa", () => {
  it("arvot vastaavat kassaa (6,90 € alle 79 €, muuten ilmainen)", () => {
    expect(toimitus.TOIMITUSMAKSU_TEKSTI).toBe(toimitus.euroluku(toimitus.TOIMITUSMAKSU));
    expect(toimitus.toimitusmaksuSummalle(toimitus.ILMAINEN_TOIMITUS_RAJA)).toBe(0);
    expect(toimitus.toimitusmaksuSummalle(toimitus.ILMAINEN_TOIMITUS_RAJA - 0.01)).toBe(toimitus.TOIMITUSMAKSU);
    expect(toimitus.TOIMITUSAIKA_TEKSTI).toBe("3-10");
  });

  it("kassan vakiot (api/_lib/vakiot.js) ovat samat", () => {
    expect(vakiot.TOIMITUS).toBe(toimitus.TOIMITUSMAKSU);
    expect(vakiot.ILMAINEN_TOIMITUS_RAJA).toBe(toimitus.ILMAINEN_TOIMITUS_RAJA);
  });

  it("Merchant-syötteen peili (api/_lib/syote-lisakentat.js) on samat arvot", () => {
    expect(TOIMITUS).toBe(toimitus.TOIMITUSMAKSU);
    expect(ILMAINEN_RAJA).toBe(toimitus.ILMAINEN_TOIMITUS_RAJA);
  });

  it("rakenteisen datan SHIPPING lukee konfiguraatiota", () => {
    expect(SHIPPING.feeEur).toBe(toimitus.TOIMITUSMAKSU);
    expect(SHIPPING.freeThresholdEur).toBe(toimitus.ILMAINEN_TOIMITUS_RAJA);
    expect(SHIPPING.deliveryBusinessDaysMin).toBe(toimitus.TOIMITUSAIKA_MIN_ARKIPAIVAA);
    expect(SHIPPING.deliveryBusinessDaysMax).toBe(toimitus.TOIMITUSAIKA_MAX_ARKIPAIVAA);
  });

  it("src/, api/, middleware.ts, public/ ja index.html eivät sisällä kovakoodattuja toimitusarvoja", () => {
    const osumat: string[] = [];
    for (const rel of ["src", "api", "middleware.ts", "public", "index.html"].flatMap(tiedostot)) {
      if (SALLITUT.some((re) => re.test(rel)) || VALIAIKAISESTI_OHITETUT.includes(rel)) continue;
      fs.readFileSync(path.join(ROOT, rel), "utf8")
        .split("\n")
        .forEach((rivi, i) => {
          if (KIELLETYT.test(rivi) && !rivi.includes(RIVIPOIKKEUS)) osumat.push(`${rel}:${i + 1}: ${rivi.trim().slice(0, 140)}`);
        });
    }
    expect(osumat).toEqual([]);
  });
});
