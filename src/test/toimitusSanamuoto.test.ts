// @vitest-environment node
/**
 * Ilmaisen toimituksen sanamuoto (12.11.2026): sama kaikkialla ja kassan säännön mukainen (api/_lib/vakiot.js
 * toimitusmaksu: kahdesta tuotteesta tai ILMAINEN_TOIMITUS_RAJA eurosta). Etusivulla luki osin "kahdesta tuotteesta" ja
 * osin "79 eurosta". Vanhat muodot, jotka mainitsevat vain rajan, eivät saa palata asiakkaan teksteihin.
 * Arkistoidut asiakasarviot (arvostelut-arkisto.ts) ovat asiakkaiden omia sanoja, eikä niitä muuteta.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ILMAINEN_TOIMITUS_RAJA, ILMAINEN_TOIMITUS_KPL } from "../../api/_lib/vakiot.js";
import { TOIMITUSRIVI } from "../config/toimitus";

const tiedostot = (k: string): string[] => readdirSync(k).flatMap((f) => {
  const p = join(k, f);
  return statSync(p).isDirectory() ? (f === "test" ? [] : tiedostot(p)) : /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f) && !/arvostelut-arkisto/.test(f) ? [p] : [];
});

const VANHAT = [
  /[Ii]lmainen toimitus (?:vähintään )?(?:\$\{ILMAINEN_RAJA_TEKSTI\}|\{ILMAINEN_RAJA\}|79) ?(?:€|euron tilauksi)/,
  /(?:\$\{ILMAINEN_RAJA_TEKSTI\}|\{ILMAINEN_RAJA\}) (?:euron tilauksista|eurosta) alkaen (?:toimitus|se) on (?:ilmainen|maksuton)/,
  /[Vv]ähintään (?:\$\{ILMAINEN_RAJA_TEKSTI\}|\{ILMAINEN_RAJA\}) euron tilaukse?t? toimitetaan/,
  /ilmainen kahdesta tuotteesta[`"]/,
];

describe("ilmaisen toimituksen sanamuoto", () => {
  it("vastaa kassan sääntöä: kaksi tuotetta tai 79 €", () => {
    expect(ILMAINEN_TOIMITUS_KPL).toBe(2);
    expect(TOIMITUSRIVI).toContain(`kahdesta tuotteesta tai ${ILMAINEN_TOIMITUS_RAJA} eurosta`);
  });
  it("vanhoja muotoja ei ole asiakkaan teksteissä", () => {
    const loydot: string[] = [];
    for (const f of tiedostot("src")) {
      const s = readFileSync(f, "utf8");
      for (const r of VANHAT) { const m = s.match(r); if (m) loydot.push(`${f}: ${m[0]}`); }
    }
    expect(loydot).toEqual([]);
  });
});
