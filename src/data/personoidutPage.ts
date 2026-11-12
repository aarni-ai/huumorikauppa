/**
 * Personoidut lahjat -kategoriasivun (/personoidut) ja personointisivun sisältö (2.11.2026). Sama lähde React-sivulle
 * (src/pages/PersonoidutPage.tsx) ja esirenderöinnille (src/seo/prerender/pages.ts).
 */
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "../config/toimitus";
import { HINNASTO } from "../../api/_lib/vakiot.js";
import { AIHEET, MALLIT, NIMI_MAX, mallinPolku } from "../../api/_lib/personoitu.js";

const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;

export const PERSONOIDUT_PATH = "/personoidut";

/** Hinnat teksteihin (api/_lib/vakiot.js HINNASTO). */
export const PERSONOIDUT_HINNAT = {
  tpaita: eur(HINNASTO.personoitu),
  huppari: eur(HINNASTO.personoituHuppari.perus),
  huppariIso: eur(HINNASTO.personoituHuppari.iso),
};

export interface PersonoituMalliKortti {
  id: string;
  nimi: string;
  kuvaus: string;
  aihe: string;
  aiheNimi: string;
  polku: string;
  esimerkki: Record<string, string | number>;
}

/** Mallit korteiksi aiheittain (AIHEET-järjestys). */
export const PERSONOIDUT_MALLIT: PersonoituMalliKortti[] = Object.keys(AIHEET).flatMap((aihe) =>
  MALLIT.filter((m) => m.aihe === aihe).map((m) => ({
    id: m.id, nimi: m.nimi, kuvaus: m.kuvaus, aihe, aiheNimi: AIHEET[aihe as keyof typeof AIHEET], polku: mallinPolku(m.id), esimerkki: m.esimerkki,
  })),
);

export const PERSONOIDUT_INTRO = [
  `Personoitu paita tai huppari on lahja, jossa lukee saajan oma nimi, vuosiluku tai ikä. Valitse malli, kirjoita teksti ja katso esikatselu ennen kuin lisäät tuotteen koriin.`,
  `T-paita maksaa ${PERSONOIDUT_HINNAT.tpaita} ja huppari ${PERSONOIDUT_HINNAT.huppari} (3XL-5XL ${PERSONOIDUT_HINNAT.huppariIso}). Toimitus ${TOIMITUSMAKSU_TEKSTI} €, ilmainen kahdesta tuotteesta tai ${ILMAINEN_RAJA_TEKSTI} eurosta.`,
];

export const PERSONOIDUT_FAQS = [
  {
    q: "Mitä personoituun paitaan voi kirjoittaa?",
    a: `Malliin kirjoitetaan saajan nimi, toinen nimi, vuosiluku tai ikä mallin mukaan. Nimessä voi olla enintään ${NIMI_MAX} merkkiä: kirjaimia, välilyönti, väliviiva ja heittomerkki.`,
  },
  {
    q: "Näenkö tekstin ennen tilausta?",
    a: "Kyllä. Esikatselu näyttää tekstin valitun värisessä paidassa tai hupparissa, ja painokuva tehdään samasta asettelusta.",
  },
  {
    q: "Mitä personoitu paita ja huppari maksavat?",
    a: `T-paita maksaa ${PERSONOIDUT_HINNAT.tpaita} ja huppari ${PERSONOIDUT_HINNAT.huppari}, kokojen 3XL-5XL huppari ${PERSONOIDUT_HINNAT.huppariIso}. Toimitus on ${TOIMITUSMAKSU_TEKSTI} € ja ilmainen kahdesta tuotteesta tai ${ILMAINEN_RAJA_TEKSTI} eurosta.`,
  },
  {
    q: "Miksi kaikkia tekstejä ei voi painaa?",
    a: "Kirosanoja, loukkaavia sanoja, tuotemerkkejä, hahmoja ja urheilujoukkueiden nimiä ei paineta. Jos teksti ei mahdu painoalueelle, sivu pyytää lyhentämään sitä ennen kuin tuotteen voi lisätä koriin.",
  },
  {
    q: "Voiko personoidun tuotteen palauttaa?",
    a: "Personoidulla tuotteella ei ole 14 päivän palautusoikeutta, koska se tehdään yhdelle saajalle. Tarkista teksti, väri ja koko ennen tilausta.",
  },
  {
    q: "Kuinka nopeasti personoitu paita toimitetaan?",
    a: `Paita tai huppari painetaan tilauksen jälkeen, ja toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää.`,
  },
];
