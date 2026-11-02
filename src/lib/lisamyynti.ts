/**
 * Ostoskorin lisämyynti (2.11.2026): kolme koriin sopivaa suositusta (sama aihe tai lahjasivu, src/lib/recommendations.ts)
 * ja "Lisää toinen paita, niin toimitus on ilmainen" vain, kun toimitus todella muuttuu ilmaiseksi kassan säännöllä
 * (api/_lib/kate.js toimitusmaksuKatteella: tilauksen nettokate vähintään 7 € ilman toimitusmaksua). Ehdotettu paita
 * tarkistetaan jokaisella sen myytävällä koko- ja väriyhdistelmällä, joten lupaus pätee mihin tahansa valintaan.
 * Seuranta: src/lib/lisamyyntiSeuranta.ts (koostemäärät, ei tunnisteita).
 */
import type { CartItem, Product } from "@/types/product";
import { selectComplementary, selectSecondTshirt } from "@/lib/recommendations";
import { toimitusKpl, toimitusTila } from "@/lib/ostoskori";
import { myytavatVariantit } from "../../api/_lib/kate.js";
import { onLahjakortti } from "../../api/_lib/lahjakortti.js";

type KoriRivi = Pick<CartItem, "product" | "quantity"> & Partial<Pick<CartItem, "selectedSize" | "selectedColor">>;

/** Onko toimitus ilmainen, kun koriin lisätään tämä paita millä tahansa myytävällä koolla ja värillä. */
export function ilmainenToisellaPaidalla(items: KoriRivi[], paita: Product): boolean {
  const variantit = myytavatVariantit(paita) as [string, number][];
  if (variantit.length === 0) return false;
  return variantit.every(([avain]) => {
    const [selectedColor, selectedSize] = avain.split("|");
    return toimitusTila([...items, { product: paita, quantity: 1, selectedColor, selectedSize }]).ilmainen;
  });
}

export interface ToinenPaita {
  /** 1-3 t-paitaa; tyhjä, kun ehdotusta ei näytetä. */
  paidat: Product[];
  /** true: jokainen ehdotettu paita tekee toimituksesta ilmaisen (otsikko "...niin toimitus on ilmainen"). */
  ilmainenToimitus: boolean;
}

/**
 * Toisen paidan ehdotus, kun korissa on yksi toimitukseen laskettava tuote eikä toimitus ole vielä ilmainen. Paidat,
 * joilla toimitus muuttuu ilmaiseksi, ensin; jos niitä on alle kaksi, näytetään tavalliset toisen paidan ehdotukset
 * ilman toimituslupausta.
 */
export function toinenPaita(items: KoriRivi[], kaikki: Product[], maara = 3): ToinenPaita {
  const fyysiset = items.filter((i) => !onLahjakortti(i));
  const tyhja = { paidat: [], ilmainenToimitus: false };
  if (toimitusKpl(fyysiset) !== 1 || fyysiset.length !== 1) return tyhja;
  const tila = toimitusTila(items);
  if (tila.ilmainen || tila.summa === 0) return tyhja;
  const pohja = fyysiset.map((i) => i.product);
  const ehdokkaat = selectSecondTshirt(pohja, kaikki, 12);
  const ilmaiset = ehdokkaat.filter((p) => ilmainenToisellaPaidalla(items, p)).slice(0, maara);
  if (ilmaiset.length >= 2) return { paidat: ilmaiset, ilmainenToimitus: true };
  return { paidat: pohja[0].category === "t-paidat" ? ehdokkaat.slice(0, maara) : [], ilmainenToimitus: false };
}

/** Kolme koriin sopivaa suositusta (sama aihe tai lahjasivu), ei toisen paidan ehdotuksen tuotteita. */
export function korinSuositukset(items: KoriRivi[], kaikki: Product[], pois: Product[] = [], maara = 3): Product[] {
  const pohja = items.filter((i) => !onLahjakortti(i)).map((i) => i.product);
  const poissa = new Set(pois.map((p) => p.id));
  return selectComplementary(pohja, kaikki.filter((p) => !poissa.has(p.id)), maara);
}
