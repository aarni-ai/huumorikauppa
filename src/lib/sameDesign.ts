/**
 * "Sama design myös: Huppari · Tarra · Juliste" -linkit tuotesivulle.
 *
 * Design tunnistetaan tuotenimestä: teksti ennen erotinta " | " (myös "｜"), pienaakkosina, välimerkit ja
 * ajatusviivat poistettuina. "Tonnin Seteli | T-Paita" ja "Tonnin seteli | Juliste (poster)" ovat sama design
 * "tonnin seteli"; "60v – kokenut, ei vanha | Muki" ja "60v kokenut, ei vanha | Juliste (poster)" samoin.
 * Tietopohjainen: Printifystä synkronoidut uudet tuotteet tulevat mukaan automaattisesti, kun nimi noudattaa
 * muotoa "Teksti | Tuotetyyppi". Nimi ilman erotinta ei kuulu mihinkään designiin (ei arvailla).
 *
 * Linkitetään vain näkyvät tuotteet: ei piilotettuja (onPiilotettuTuote: mukit, kaksoiskappaleet, testikopiot,
 * kokonaan valmistamattomat), ei tuotteita ilman tilattavaa varianttia, ei personoitavia. Yksi linkki per
 * tuotetyyppi; tuotesivun oma tyyppi jätetään pois.
 */
import type { Product } from "@/types/product";
import { onPiilotettuTuote } from "@/lib/hiddenCategories";
import { hasAvailableVariant } from "@/lib/variantAvailability";
import { isCustomTextProduct } from "@/lib/customProduct";

type DesignProduct = Pick<Product, "id" | "name" | "slug" | "category"> & Partial<Pick<Product, "variants" | "description">>;

const EROTIN = /\s+[|｜]\s+|\s*｜\s*/;

/** Designin avain tuotenimestä, tai null jos nimessä ei ole tuotetyypin erotinta. */
export function designKey(name: string | null | undefined): string | null {
  const s = String(name ?? "");
  const osat = s.split(EROTIN);
  if (osat.length < 2) return null;
  const avain = osat[0]
    .toLowerCase()
    .replace(/[–—-]/g, " ")
    .replace(/[^\p{L}\p{N}%\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return avain || null;
}

/** Tuotetyypin nimi linkkiin (kategoria, lasten koot nimestä). */
export function productTypeLabel(p: Pick<Product, "name" | "category">): string {
  const nimi = p.name.toLowerCase();
  const tyyppiOsa = nimi.split(EROTIN).slice(1).join(" ");
  switch (p.category) {
    case "t-paidat":
      return /lasten|lapsen|kids|youth/.test(tyyppiOsa) ? "Lasten t-paita" : "T-paita";
    case "hupparit":
      return /lasten|lapsen|kids|youth/.test(tyyppiOsa) ? "Lasten huppari" : "Huppari";
    case "mukit":
      return "Muki";
    case "tarrat":
      return "Tarra";
    case "seinataulut":
      return /juliste|poster/.test(tyyppiOsa) ? "Juliste" : "Seinätaulu";
    case "bodyt":
      return "Vauvan body";
    case "pitkahihaiset":
      return "Pitkähihainen";
    case "koristeet":
      return "Koriste";
    case "peitot":
      return "Peitto";
    case "pipot":
      return "Pipo";
    case "laukut":
      return "Kassi";
    default:
      return p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : "Tuote";
  }
}

/** Linkkien järjestys tuotetyypeittäin (tuntemattomat loppuun). */
const JARJESTYS = ["T-paita", "Huppari", "Pitkähihainen", "Lasten t-paita", "Lasten huppari", "Vauvan body", "Muki", "Tarra", "Juliste", "Seinätaulu", "Koriste", "Peitto", "Pipo", "Kassi"];
const jarjestys = (label: string) => {
  const i = JARJESTYS.indexOf(label);
  return i === -1 ? JARJESTYS.length : i;
};

const nakyva = (p: DesignProduct) =>
  !onPiilotettuTuote(p) && hasAvailableVariant(p) && !isCustomTextProduct({ name: p.name, description: "" });

export interface SameDesignLink<P extends DesignProduct = Product> {
  label: string;
  product: P;
}

/**
 * Saman designin muut tuotetyypit näkyvistä tuotteista: [{ label: "Juliste", product }], yksi per tyyppi
 * (ensimmäinen listassa), tuotesivun oma tyyppi pois. Tyhjä, jos designia ei tunnisteta.
 */
export function sameDesignLinks<P extends DesignProduct>(product: P, all: readonly P[]): SameDesignLink<P>[] {
  const avain = designKey(product.name);
  if (!avain) return [];
  const oma = productTypeLabel(product);
  const tyypit = new Map<string, P>();
  for (const p of all) {
    if (p.id === product.id || p.slug === product.slug) continue;
    if (designKey(p.name) !== avain) continue;
    if (!nakyva(p)) continue;
    const label = productTypeLabel(p);
    if (label === oma || tyypit.has(label)) continue;
    tyypit.set(label, p);
  }
  return [...tyypit.entries()]
    .map(([label, p]) => ({ label, product: p }))
    .sort((a, b) => jarjestys(a.label) - jarjestys(b.label));
}
