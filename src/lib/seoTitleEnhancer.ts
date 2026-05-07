/**
 * SEO Title Enhancer (Finnish)
 * ----------------------------
 * Pure helper that returns alternative high-CTR title variants.
 * IMPORTANT: This does NOT replace existing titles. Use the variants as
 * suggestions or attach the chosen one as an optional `alternateTitle`
 * (e.g. <meta name="twitter:title"> or schema.org `alternateName`).
 */

export type TitleAudience = "gift" | "category" | "blog";

export interface TitleEnhancerInput {
  /** Target audience or topic, e.g. "miehelle", "opettajalle", "joulu". */
  target: string;
  /** Page kind – picks the best pattern set. */
  kind?: TitleAudience;
  /** Year suffix shown in titles. Defaults to current year. */
  year?: number;
}

const EMOJIS = ["😂", "🎁", "🔥"] as const;

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Deterministic emoji choice so SSR/CSR match. */
function pickEmoji(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return EMOJIS[h % EMOJIS.length];
}

export function generateTitleVariants({
  target,
  kind = "gift",
  year = new Date().getFullYear(),
}: TitleEnhancerInput): string[] {
  const t = target.trim();
  const T = cap(t);
  const e = pickEmoji(t + kind);

  if (kind === "blog") {
    return [
      `${T} – TOP-vinkit ${year} jotka oikeasti toimivat ${e}`,
      `${T}: 7 yllättävää ideaa (päivitetty ${year})`,
      `Näin valitset ${t.toLowerCase()} – opas ${year}`,
      `${T} ${e} – nämä eivät ole kliseisiä`,
    ];
  }

  if (kind === "category") {
    return [
      `${T} lahjat – 50 ideaa jotka yllättävät (päivitetty ${year})`,
      `Hauskat ${t.toLowerCase()} ${e} TOP-valinnat ${year}`,
      `${T} lahjat ${year} – kestosuosikit ja uudet hitit`,
      `Paras ${t.toLowerCase()} -lahja ${e} ei mene pieleen koskaan`,
    ];
  }

  // gift (default)
  return [
    `Hauskat lahjat ${t} – ${year} TOP ideat jotka oikeasti toimivat`,
    `Paras lahja ${t} ${e} – nämä eivät ole kliseisiä`,
    `Tämä lahja ${t} ei mene pieleen koskaan`,
    `${T} lahjaopas ${year} – 20 ideaa, joista yksi osuu aina`,
  ];
}

/** Convenience: pick the first (primary) alternative title. */
export function suggestAlternateTitle(input: TitleEnhancerInput): string {
  return generateTitleVariants(input)[0];
}