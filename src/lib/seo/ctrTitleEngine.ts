/**
 * CTR Title Engine (Finnish)
 * --------------------------
 * Pure helpers that generate high-CTR Finnish title variants for gift,
 * category, blog and seasonal pages. Suggestions only — never replaces
 * existing titles automatically. Safe to import anywhere.
 */

export type CTRPageType = "gift" | "category" | "blog" | "seasonal";

export interface CTRTitleInput {
  /** Recipient or audience, e.g. "miehelle", "opettajalle". Used by gift/seasonal. */
  target?: string;
  /** Product or theme category, e.g. "mukit", "hupparit". Used by category. */
  category?: string;
  /** Topic or keyword, e.g. "joululahja", "polttarit". Used by blog/seasonal. */
  topic?: string;
  /** Page kind – picks the matching pattern set. */
  type: CTRPageType;
  /** Year suffix shown in titles. Defaults to current year (or 2026 if unknown). */
  year?: number;
}

const SOFT_EMOJIS = ["🎁", "😂", "🔥", "✨"] as const;

function cap(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Stable hash so SSR and CSR produce the same emoji choice. */
function stableHash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

function pickEmoji(seed: string): string {
  return SOFT_EMOJIS[stableHash(seed) % SOFT_EMOJIS.length];
}

function resolveYear(input?: number): number {
  if (typeof input === "number" && input > 2024) return input;
  const now = new Date().getFullYear();
  return now > 2024 ? now : 2026;
}

/**
 * Returns 3–4 alternative title variants for the given page.
 * Always Finnish, natural human tone, no keyword stuffing.
 */
export function generateCTRAlternatives(input: CTRTitleInput): string[] {
  const year = resolveYear(input.year);

  if (input.type === "gift") {
    const t = (input.target ?? "").trim();
    const T = cap(t);
    const e = pickEmoji(t + "gift");
    return [
      `Hauskat lahjat ${t} – TOP ideat ${year} jotka oikeasti toimivat`,
      `Paras lahja ${t}? Nämä ideat eivät petä ${e}`,
      `Et voi mennä pieleen: ${t} lahjaopas ${year}`,
      `${T} lahjaideat ${year} – nopea toimitus, varma onnistuminen`,
    ].filter(Boolean);
  }

  if (input.type === "category") {
    const c = (input.category ?? "").trim();
    const C = cap(c);
    return [
      `${C} lahjat ${year} – 50 ideaa jotka yllättävät`,
      `Suosituimmat ${c} lahjat Suomessa juuri nyt`,
      `TOP ${c} lahjat – nämä toimivat aina`,
      `${C} lahjat ${year} – kestosuosikit ja uudet hitit`,
    ].filter(Boolean);
  }

  if (input.type === "blog") {
    const topic = (input.topic ?? "").trim();
    const T = cap(topic);
    return [
      `7 yllättävää ideaa ${topic} – et ole nähnyt näitä ennen`,
      `Näin valitset täydellisen ${topic} lahjan (opas ${year})`,
      `${T}: 5 virhettä, jotka tekevät lahjasta tylsän`,
      `${T} ${year} – mitä todella kannattaa ostaa`,
    ].filter(Boolean);
  }

  // seasonal
  const season = (input.topic ?? input.target ?? "").trim();
  const S = cap(season);
  const e = pickEmoji(season + "seasonal");
  return [
    `${S} ${year} – hauskat lahjaideat, jotka toimivat ${e}`,
    `Paras ${season} lahjaopas ${year} – nopea toimitus Suomessa`,
    `${S}-lahjat ${year}: 20 ideaa, joista yksi osuu aina`,
    `Älä jätä viime tinkaan: ${season} lahjat ${year}`,
  ].filter(Boolean);
}

/** Returns the first (primary) recommended CTR title variant. */
export function suggestBestCTRTitle(input: CTRTitleInput): string {
  return generateCTRAlternatives(input)[0];
}

/**
 * Convenience wrapper: returns the recommended title with optional brand suffix
 * (default "| Huumorikauppa.fi"). Pass `{ brand: false }` to omit.
 */
export function generateCTRTitle(
  input: CTRTitleInput & { brand?: false | string },
): string {
  const base = suggestBestCTRTitle(input);
  if (input.brand === false) return base;
  const brand = typeof input.brand === "string" ? input.brand : "| Huumorikauppa.fi";
  return `${base} ${brand}`.trim();
}