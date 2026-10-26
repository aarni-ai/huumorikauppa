/**
 * Tuotesivun esirenderöity esikatselu (src/seo/prerender/renderProductPreview.tsx): src/main.tsx
 * käynnistää Reactin piilotettuun #rootiin ja rekisteröi tähän vaihtofunktion, jota ProductPage
 * kutsuu layout-efektissä heti, kun tuote on renderöity. Vaihto tapahtuu ennen seuraavaa maalausta,
 * joten esikatselu ja sovellus eivät näy päällekkäin eikä välissä näy tyhjää.
 */
let reveal: (() => void) | null = null;

export function setPreviewReveal(fn: () => void): void {
  reveal = fn;
}

/** Näyttää sovelluksen ja poistaa esikatselun. Kutsu on turvallinen myös ilman esikatselua. */
export function revealApp(): void {
  const fn = reveal;
  reveal = null;
  fn?.();
}
