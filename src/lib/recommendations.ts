/**
 * "Sopii yhteen" -suositukset tuotesivulle, ostoskoriin ja koriin lisäyksen paneeliin.
 *
 * Suositukset eivät perustu tilausdataan, joten niitä ei saa kutsua "usein ostetaan yhdessä".
 * Logiikka (pisteet, suurin ensin):
 *   5  sama teksti eri tuoteryhmässä (t-paita -> saman tekstin huppari)
 *   4  sama teema eri tuoteryhmässä (Tonnin Seteli -paita -> se oli tonnin seteli. -huppari)
 *   3  sama teema samassa tuoteryhmässä, eri teksti (Tonnin Seteli -paita -> se oli tonnin seteli. -paita)
 *   2  sama huumorisarja (src/data/themes.ts, esim. suomalaiset meemit) eri tuoteryhmässä
 *   1  sama huumorisarja samassa tuoteryhmässä
 *   0.1 varalla muu tuoteryhmä kuin pohjatuotteilla
 * Tasapisteissä tuotteiden prioriteetti (src/lib/productPriority.ts), sitten alkuperäinen järjestys.
 * Pois jätetään: pohjatuotteet itse, piilotetut (onPiilotettuTuote), tuotteet ilman valmistettavaa
 * varianttia, kaupunkituotteet (eri tuote per paikkakunta) ja personoitavat tuotteet (vaativat tekstin).
 */
import type { Product } from "@/types/product";
import { onPiilotettuTuote } from "@/lib/hiddenCategories";
import { availableColors, availableSizes, hasAvailableVariant, isVariantAvailable } from "@/lib/variantAvailability";
import { isCustomTextProduct } from "@/lib/customProduct";
import { getPriorityRank } from "@/lib/productPriority";
import { isCityProduct, THEME_FAMILIES } from "@/data/themes";

/** Kategoriat, joissa kokoa ei valita (sama kuin tuotesivulla ja tuotekortissa). */
export const NO_SIZE_CATEGORIES: readonly string[] = ["mukit", "tarrat", "seinataulut", "peitot", "koristeet"];


const STOP_WORDS = new Set([
  "se", "oli", "on", "ja", "ei", "the", "my", "i", "a", "of", "olen", "kun", "mut", "mutta",
  "t-paita", "paita", "huppari", "pitkähihainen", "kahvikuppi", "muki",
]);

/** Tuotteen teksti ilman tuoteryhmää: "Tonnin Seteli | Huppari" -> "tonnin seteli". */
export function themeText(name: string): string {
  return name
    .split("|")[0]
    .toLowerCase()
    .replace(/[^a-z0-9åäöü\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function themeWords(name: string): Set<string> {
  return new Set(
    themeText(name)
      .split(" ")
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
}

/** Sama teema: teksti on sama, tai sisältää toisen (vähintään kaksi merkitsevää sanaa). */
function sameTheme(a: Product, b: Product): "same-text" | "same-theme" | null {
  const ta = themeText(a.name);
  const tb = themeText(b.name);
  if (!ta || !tb) return null;
  if (ta === tb) return "same-text";
  const wa = themeWords(a.name);
  const wb = themeWords(b.name);
  const shared = [...wa].filter((w) => wb.has(w)).length;
  if (shared >= 2 && (shared === wa.size || shared === wb.size)) return "same-theme";
  return null;
}

function families(p: Product): Set<string> {
  const out = new Set<string>();
  for (const [key, matches] of Object.entries(THEME_FAMILIES)) {
    if (matches(p)) out.add(key);
  }
  return out;
}

/** Voiko tuotetta suositella (näkyy kaupassa, valmistettava, ei vaadi omaa tekstiä). */
export function isRecommendable(p: Product): boolean {
  return (
    !onPiilotettuTuote(p) &&
    hasAvailableVariant(p) &&
    !isCityProduct(p) &&
    !isCustomTextProduct(p)
  );
}

export function selectComplementary(base: Product[], all: Product[], limit = 3): Product[] {
  if (base.length === 0) return [];
  const baseIds = new Set(base.map((b) => b.id));
  const baseCategories = new Set(base.map((b) => b.category));
  const baseFamilies = base.map(families);

  const scored: { p: Product; score: number; i: number }[] = [];
  all.forEach((p, i) => {
    if (baseIds.has(p.id) || !isRecommendable(p)) return;
    let score = 0;
    const pFamilies = families(p);
    base.forEach((b, bi) => {
      const otherCategory = p.category !== b.category;
      const theme = sameTheme(b, p);
      let s = 0;
      if (theme === "same-text") s = otherCategory ? 5 : 0; // sama teksti samassa ryhmässä = sama tuote toisella nimellä
      else if (theme === "same-theme") s = otherCategory ? 4 : 3;
      else if ([...baseFamilies[bi]].some((f) => pFamilies.has(f))) s = otherCategory ? 2 : 1;
      score = Math.max(score, s);
    });
    // Varalla: muu tuoteryhmä kuin pohjatuotteilla (esim. t-paidan rinnalle huppari), prioriteettijärjestyksessä.
    if (score === 0 && !baseCategories.has(p.category)) score = 0.1;
    if (score > 0) scored.push({ p, score, i });
  });

  scored.sort((a, b) => b.score - a.score || getPriorityRank(a.p) - getPriorityRank(b.p) || a.i - b.i);

  // Monipuolisuus: sama teksti näytetään vain kerran (esim. ei sekä t-paitaa että pitkähihaista samasta).
  const result: Product[] = [];
  const seenThemes = new Set<string>();
  for (const { p } of scored) {
    if (result.length >= limit) break;
    const key = `${themeText(p.name)}|${p.category}`;
    if (seenThemes.has(key)) continue;
    seenThemes.add(key);
    result.push(p);
  }
  return result;
}

export type QuickAdd =
  | { kind: "add"; size?: string; color?: string }
  | { kind: "choose-size"; color?: string; sizes: string[] }
  | { kind: "link" };

/**
 * Miten suositus lisätään koriin. Sama valinta kuin tuotesivulla: väri on oletusväri (tai ensimmäinen
 * valmistettava), kokoa ei arvata. Vaatteissa, joissa on useampi koko, asiakas valitsee koon
 * (vain valitulle värille valmistettavat koot). Personoitavat tuotteet ohjataan tuotesivulle.
 */
export function quickAddOption(p: Product): QuickAdd {
  if (onPiilotettuTuote(p) || isCustomTextProduct(p) || !hasAvailableVariant(p)) return { kind: "link" };
  const colors = (p.variants?.colors || []) as string[];
  const sizes = (p.variants?.sizes || []) as string[];
  const sellable = availableColors(p, colors, sizes);
  const defaultColor = p.variants?.default_color as string | undefined;
  const color = colors.length > 0 ? (defaultColor && sellable.includes(defaultColor) ? defaultColor : sellable[0]) : undefined;
  if (colors.length > 0 && !color) return { kind: "link" };

  const hideSize = NO_SIZE_CATEGORIES.includes(p.category);
  if (hideSize) {
    const size = availableSizes(p, color, sizes)[0] ?? sizes[0];
    if ((size !== undefined || sizes.length === 0) && !isVariantAvailable(p, color, size)) return { kind: "link" };
    return { kind: "add", size, color };
  }
  if (sizes.length > 1) {
    const forColor = availableSizes(p, color, sizes);
    return forColor.length > 0 ? { kind: "choose-size", color, sizes: forColor } : { kind: "link" };
  }
  // Yksi koko tai ei kokoja: tuotesivu lisää ilman kokoa, tarkistus ainoalla koolla.
  if (!isVariantAvailable(p, color, sizes[0])) return { kind: "link" };
  return { kind: "add", size: undefined, color };
}
