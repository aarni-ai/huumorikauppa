/**
 * Alakohtaisten yrityssivujen (/yritykset/<ala>) yhteinen logiikka React-sivulle ja esirenderöintiin:
 * tuotteiden valinta datan järjestyksessä, tuotelohkon teema ja kysymykset.
 */
import { isBlogProductEligible, type BlogProduct, type BlogProductTheme } from "./blogProducts";
import { YRITYS_PORTAAT, YRITYS_JOULU_TEKSTI, portaatEhto } from "./yrityksetPage";
import { LOGOPAITA_HINTA, LOGOPAITA_MIN_KPL } from "../../api/_lib/logopaita.js";
import type { YritysAla } from "./yritysAlat";

const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;

/** Alan tuotteet datan järjestyksessä; myynnistä poistuneet ja loppuunmyydyt jätetään pois. */
export function valitseAlanTuotteet<T extends BlogProduct>(ala: YritysAla, products: T[]): T[] {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  return ala.tuotteet.map((s) => bySlug.get(s)).filter((p): p is T => !!p && isBlogProductEligible(p));
}

/** Tuotelohkon otsikko ja Katso tuotteet -painike. */
export function yritysAlaTeema(ala: YritysAla): BlogProductTheme {
  return { href: ala.katso.href, name: ala.katso.label, heading: ala.tuotteetOtsikko, related: [] };
}

/** Alakohtainen kysymys ja yhteiset kysymykset (määräalennus, oma logo, joulu). */
export function yritysAlaFaqs(ala: YritysAla): { q: string; a: string }[] {
  return [
    ala.faq,
    {
      q: "Paljonko oma logo -paita maksaa?",
      a: `Oma logo tai teksti -t-paita maksaa ${eur(LOGOPAITA_HINTA)}/kpl, ja tilauksessa on vähintään ${LOGOPAITA_MIN_KPL} paitaa. Määräalennus vähennetään tästä hinnasta.`,
    },
    {
      q: "Miten määräalennus toimii?",
      a: `Kassa laskee alennuksen automaattisesti samassa tilauksessa olevista t-paidoista: ${YRITYS_PORTAAT.map((p) => `${p.min}+ t-paitaa -${p.prosentti} %`).join(", ")}. ${portaatEhto()} Paidat voivat olla eri designeja, kokoja ja värejä.`,
    },
    {
      q: "Mihin mennessä joulun yritystilaus pitää tehdä?",
      a: `Tilatkaa ja maksakaa viimeistään ${YRITYS_JOULU_TEKSTI}, niin paidat ovat perillä ennen joulua. Laskulla tilattaessa paidat lähtevät painoon, kun lasku on maksettu.`,
    },
  ];
}
