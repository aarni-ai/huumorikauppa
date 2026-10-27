import type { Product } from "@/types/product";
import { quickAddOption } from "@/lib/recommendations";

/**
 * Ostoskorin lisämyynti "Lisää tarra 11,90 €" (KATTEET.md, Keskiostoksen nosto: tarran lisämyynti 27.10.2026).
 * Tarra (OPT OnDemand, tuotekulu 3,89 €, lisäkappaleen toimitus 0,10 € saman painotalon kanssa, erikseen 5,59 €)
 * pitää korin katteen positiivisena t-paita- ja julistekoreissa sekä sivuston toimitusehdoilla (src/config/toimitus.ts)
 * että live-kassan vanhalla säännöllä (pienempi maksu, ilmainen toimitus jo 60 eurosta). Hupparikoriin ei ehdoteta:
 * vanhalla säännöllä huppari + tarra ylittää ilmaisen toimituksen rajan ja kori menee tappiolle (KATTEET.md).
 * Ehdotetaan vain kerran: ei, jos korissa on jo tarra.
 */
export const LISATARRA_EI_KATEGORIAT = ["tarrat", "hupparit"] as const;
export const LISATARRA_SLUGIT = ["se-oli-tonnin-seteli-tarra"] as const;
export const LISATARRA_HINTA = 11.9;

export function valitseLisatarra(kori: Pick<Product, "slug" | "category">[], kaikki: Product[]): Product | null {
  if (kori.length === 0 || kori.some((p) => (LISATARRA_EI_KATEGORIAT as readonly string[]).includes(p.category))) return null;
  for (const slug of LISATARRA_SLUGIT) {
    const p = kaikki.find((t) => t.slug === slug);
    if (p && p.price === LISATARRA_HINTA && quickAddOption(p).kind === "add") return p;
  }
  return null;
}
