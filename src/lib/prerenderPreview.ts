/**
 * Tuote- ja etusivun esirenderöity esikatselu (src/seo/prerender/renderPreview.tsx): src/main.tsx
 * käynnistää Reactin piilotettuun #rootiin ja rekisteröi tähän vaihtofunktion. Sovellus vaihdetaan
 * näkyviin (revealApp), kun ensimmäinen seuraavista tapahtuu:
 *   - sivukomponentti on renderöity (ProductPage: tuotedata on HTML:ään upotetusta siemenestä heti
 *     käytettävissä, Index: ensimmäinen renderöinti), layout-efektissä ennen maalausta;
 *   - App on ollut asennettuna REVEAL_AFTER_MOUNT_MS (ei koskaan riipu tuotehausta);
 *   - main.tsx:n kova aikaraja.
 * Esikatselu on inert, joten näkymä ei saa koskaan jäädä siihen.
 */
let reveal: (() => void) | null = null;

/** Viimeistään näin kauan Appin asennuksen jälkeen sovellus näytetään, vaikka sivu ei olisi valmis. */
export const REVEAL_AFTER_MOUNT_MS = 800;

export function setPreviewReveal(fn: () => void): void {
  reveal = fn;
}

/** Näyttää sovelluksen ja poistaa esikatselun. Kutsu on turvallinen myös ilman esikatselua. */
export function revealApp(): void {
  const fn = reveal;
  reveal = null;
  fn?.();
}

/**
 * Tuotesivun data upotettuna esikatseluun (<script type="application/json" data-product-seed>):
 * ProductPage renderöi tuotteen heti ilman Supabase-hakua (haku päivittää taustalla).
 */
let productSeed: { slug: string; row: unknown } | null = null;

export function setProductSeed(row: unknown): void {
  const slug = (row as { slug?: unknown } | null)?.slug;
  productSeed = typeof slug === "string" ? { slug, row } : null;
}

export function productSeedFor(slug: string | undefined): unknown {
  return slug && productSeed?.slug === slug ? productSeed.row : undefined;
}
