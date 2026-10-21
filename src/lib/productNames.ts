/**
 * Tuotenimien siistiminen asiakkaalle näkyviin teksteihin (alt-tekstit, UKK) sekä kuvien
 * alt-tekstien muodostus tuotedatasta. Riippuvuudeton, jotta sitä voi käyttää myös esirenderöinnissä.
 */

/** Kategorian yksikkömuoto ("t-paita", "huppari"...). */
export const PRODUCT_TYPE_LABEL: Record<string, string> = {
  "t-paidat": "t-paita",
  hupparit: "huppari",
  bodyt: "vauvan body",
  pitkahihaiset: "pitkähihainen paita",
  pipot: "pipo",
  tarrat: "tarra",
  peitot: "peitto",
  seinataulut: "seinätaulu",
  koristeet: "koriste",
  laukut: "kangaskassi",
};

/**
 * Poistaa nimen tuotetyyppiliitteen ("| T-Paita") ja korvaa ajatusviivat tavuviivalla.
 * "Eläkkeellä – kiireinen tekemään ei mitään | Huppari" -> "Eläkkeellä - kiireinen tekemään ei mitään"
 */
export function cleanProductName(name: string): string {
  const base = name.split(/[|｜]/)[0];
  return base
    .replace(/\s*[–—]\s*/g, " - ")
    .replace(/\s+/g, " ")
    .replace(/^[\s-]+|[\s-]+$/g, "")
    .trim();
}

const VIEW_LABEL: [RegExp, string][] = [
  [/^front-collar/, "kaulus lähikuvana"],
  [/^front/, "kuva edestä"],
  [/^back/, "kuva takaa"],
  [/^left/, "kuva vasemmalta"],
  [/^right/, "kuva oikealta"],
  [/^side/, "kuva sivulta"],
  [/^(context|lifestyle|person)/, "käyttökuva"],
];

/** Kuvakulma Printify-mockupin camera_label-parametrista. */
export function imageViewLabel(url: string | undefined, index: number): string {
  const label = url ? /[?&]camera_label=([a-z0-9-]+)/i.exec(url)?.[1]?.toLowerCase() : undefined;
  if (label) {
    for (const [re, text] of VIEW_LABEL) if (re.test(label)) return text;
  }
  return index === 0 ? "kuva edestä" : `kuva ${index + 1}`;
}

/** Värivariantti, jonka kuviin annettu kuva kuuluu (variants.variant_images). */
export function colorForImage(variants: Record<string, unknown> | undefined, url: string | undefined): string | undefined {
  if (!url || !variants) return undefined;
  const map = variants.variant_images as Record<string, string[]> | undefined;
  if (!map) return undefined;
  for (const [color, urls] of Object.entries(map)) {
    if (Array.isArray(urls) && urls.includes(url)) return color;
  }
  return undefined;
}

/**
 * Kuvaava alt-teksti tuotekuvalle datasta:
 * "Saatanan Tunarit, t-paita, musta - kuva edestä"
 */
export function productImageAlt(
  product: { name: string; category: string; variants?: Record<string, unknown> },
  opts: { url?: string; index?: number; color?: string } = {},
): string {
  const index = opts.index ?? 0;
  const type =
    product.category === "pipot" && /lippis/i.test(product.name) ? "lippis" : PRODUCT_TYPE_LABEL[product.category] ?? "tuote";
  const color = opts.color ?? colorForImage(product.variants, opts.url);
  const parts = [cleanProductName(product.name), type];
  if (color && !/^(one size|circle)$/i.test(color)) parts.push(color.toLowerCase());
  return `${parts.join(", ")} - ${imageViewLabel(opts.url, index)}`;
}
