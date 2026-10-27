import type { CartItem, Product } from "@/types/product";
import { quickAddOption } from "@/lib/recommendations";
import { PAKETTIMAARITYKSET } from "@/lib/ostoskori";
import { korinNettokate, valitseMittarinLisatuote, LISATUOTE_MIN_KATE_EUROA } from "../../api/_lib/lisatuote.js";

/**
 * Ostoskorin lisämyynti "Lisää tarra 11,90 €" (KATTEET.md, Keskiostoksen nosto: tarran lisämyynti 27.10.2026).
 * Tarra (OPT OnDemand, tuotekulu 3,89 €, lisäkappaleen toimitus 0,10 € saman painotalon kanssa, erikseen 5,59 €)
 * pitää korin katteen positiivisena t-paita- ja julistekoreissa sekä sivuston toimitusehdoilla (src/config/toimitus.ts)
 * että live-kassan vanhalla säännöllä (pienempi maksu, ilmainen toimitus jo 60 eurosta). Hupparikoriin ei ehdoteta:
 * vanhalla säännöllä huppari + tarra ylittää ilmaisen toimituksen rajan ja kori menee tappiolle (KATTEET.md).
 * Ehdotetaan vain kerran: ei, jos korissa on jo tarra.
 *
 * 28.10.2026: alle ilmaisen toimituksen rajan jäävälle korille ehdotetaan mittarissa yhtä lisätuotetta (tarra tai
 * juliste), joka kuroo puuttuvan summan parhaiten umpeen (valitseMittarinLisatuote, api/_lib/lisatuote.js). Kumpikin
 * ehdotus tehdään vain, jos korin nettokate lisätuotteen kanssa on positiivinen (sama laskenta kuin kassalla).
 */
export const LISATARRA_EI_KATEGORIAT = ["tarrat", "hupparit"] as const;
export const LISATARRA_SLUGIT = ["se-oli-tonnin-seteli-tarra"] as const;
export const LISATARRA_HINTA = 11.9;

type KoriRivi = Pick<CartItem, "product" | "quantity" | "selectedSize" | "selectedColor">;

/** Korin nettokate lisätuotteen kanssa on yli LISATUOTE_MIN_KATE_EUROA (tuntematon kulu: false). */
function katePositiivinen(kori: KoriRivi[], lisa: Product, kaikki: Product[]): boolean {
  const valinta = quickAddOption(lisa);
  if (valinta.kind !== "add") return false;
  const bySlug = new Map(kaikki.map((p) => [p.slug, p]));
  const k = korinNettokate([...kori, { product: lisa, quantity: 1, selectedSize: valinta.size, selectedColor: valinta.color }], bySlug, PAKETTIMAARITYKSET);
  return k.tunnettu && typeof k.nettokate === "number" && k.nettokate > LISATUOTE_MIN_KATE_EUROA;
}

/**
 * "Lisää tarra" -rivi. kori: tuotteet (vanha muoto) tai korin rivit; riveillä tarkistetaan myös korin nettokate.
 */
export function valitseLisatarra(kori: (Pick<Product, "slug" | "category"> | KoriRivi)[], kaikki: Product[]): Product | null {
  const tuotteet = kori.map((r) => ("product" in r ? r.product : r));
  if (tuotteet.length === 0 || tuotteet.some((p) => (LISATARRA_EI_KATEGORIAT as readonly string[]).includes(p.category))) return null;
  const rivit = kori.filter((r): r is KoriRivi => "product" in r);
  for (const slug of LISATARRA_SLUGIT) {
    const p = kaikki.find((t) => t.slug === slug);
    if (!p || p.price !== LISATARRA_HINTA || quickAddOption(p).kind !== "add") continue;
    if (rivit.length > 0 && !katePositiivinen(rivit, p, kaikki)) continue;
    return p;
  }
  return null;
}

export interface MittarinLisatuote {
  product: Product;
  size?: string;
  color?: string;
  /** Puuttuva summa ilmaiseen toimitukseen nyt ja lisätuotteen jälkeen (€). */
  puuttuu: number;
  puuttuuJalkeen: number;
  ilmainenJalkeen: boolean;
}

/**
 * Ilmaisen toimituksen mittarin lisätuote (tarra tai juliste, ei mukeja), joka kuroo puuttuvan summan parhaiten umpeen
 * ja pitää korin nettokatteen positiivisena. null, jos kori on jo rajan yli tai sopivaa tuotetta ei ole.
 */
export function valitseMittarinLisa(kori: KoriRivi[], kaikki: Product[]): MittarinLisatuote | null {
  const tulos = valitseMittarinLisatuote(kori, kaikki, {
    paketit: PAKETTIMAARITYKSET,
    suodatin: (p: Product) => quickAddOption(p).kind === "add",
  });
  if (!tulos) return null;
  const valinta = quickAddOption(tulos.product as Product);
  if (valinta.kind !== "add") return null;
  return {
    product: tulos.product as Product,
    size: valinta.size,
    color: valinta.color,
    puuttuu: tulos.puuttuu,
    puuttuuJalkeen: tulos.puuttuuJalkeen,
    ilmainenJalkeen: tulos.ilmainenJalkeen,
  };
}
