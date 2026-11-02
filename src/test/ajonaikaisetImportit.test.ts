/**
 * Vercelin Node-ajoympäristö (ESM) ei arvaa tiedostopäätettä: middleware.ts ja api/-funktiot kaatuvat
 * (MIDDLEWARE_INVOCATION_FAILED, ERR_MODULE_NOT_FOUND), jos niiden tuoma tiedosto importtaa "../config/toimitus"
 * ilman .js-päätettä tai "@/"-aliaksella. Näin kävi 2.11.2026 (src/data/campaignSchedule.ts). Testi seuraa
 * importit middlewaresta ja api/-tiedostoista ja vaatii jokaiselle relatiiviselle importille päätteen.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");
const IMPORT = /(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

function apiTiedostot(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) return apiTiedostot(p);
    return /\.(js|ts|mjs)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
  });
}

/** .js-polku voi osoittaa .ts-lähteeseen (TypeScriptin ESM-käytäntö). */
function ratkaise(mista: string, spec: string): string | null {
  const p = path.resolve(path.dirname(mista), spec);
  for (const c of [p, p.replace(/\.js$/, ".ts"), p.replace(/\.js$/, ".tsx")]) if (existsSync(c) && statSync(c).isFile()) return c;
  return null;
}

describe("ajonaikaiset importit (middleware ja api)", () => {
  it("jokaisella relatiivisella importilla on pääte, eikä @/-aliaksia käytetä", () => {
    const jono = [path.join(ROOT, "middleware.ts"), ...apiTiedostot(path.join(ROOT, "api"))];
    const nahty = new Set<string>();
    const virheet: string[] = [];
    while (jono.length) {
      const f = jono.pop()!;
      if (nahty.has(f)) continue;
      nahty.add(f);
      const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      for (const m of src.matchAll(IMPORT)) {
        const spec = m[1] ?? m[2];
        const rel = path.relative(ROOT, f);
        if (spec.startsWith("@/")) {
          virheet.push(`${rel}: ${spec}`);
          continue;
        }
        if (!spec.startsWith(".")) continue;
        if (!/\.(js|mjs|json)$/.test(spec)) {
          virheet.push(`${rel}: ${spec} (pääte puuttuu)`);
          continue;
        }
        const kohde = ratkaise(f, spec);
        if (!kohde) virheet.push(`${rel}: ${spec} (tiedostoa ei löydy)`);
        else jono.push(kohde);
      }
    }
    expect(nahty.size).toBeGreaterThan(50);
    expect(virheet).toEqual([]);
  });
});
