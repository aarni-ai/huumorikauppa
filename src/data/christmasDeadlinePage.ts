/**
 * /joulun-viimeiset-tilauspaivat: sisältö React-sivulle ja esirenderöinnille.
 * Ainoa luvattu päivä on src/data/christmas.ts:n CHRISTMAS_DEADLINE_PROMISE.
 */
import { CHRISTMAS_DEADLINE_PATH, CHRISTMAS_DEADLINE_PROMISE } from "./christmas";
import { landingPages } from "./landingPages";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "../config/toimitus";

const D = CHRISTMAS_DEADLINE_PROMISE;

export const christmasDeadlinePage = {
  path: CHRISTMAS_DEADLINE_PATH,
  name: "Joulun viimeiset tilauspäivät",
  title: "Joulun viimeiset tilauspäivät 2026 | Huumorikauppa",
  description:
    "Tilaa viimeistään pe 20.11.2026, niin tilaus ehtii perille jouluaattoon mennessä. Näin päivä on laskettu ja mitä sen jälkeen tapahtuu.",
  h1: "Joulun viimeiset tilauspäivät 2026",
  intro: [
    `${D} Päivä koskee kaikkia Huumorikaupan tuotteita, myös personoituja.`,
    "Tuotteemme painetaan vasta tilauksen jälkeen, joten joulutilauksen takaraja on aikaisemmin kuin kaupoissa, jotka lähettävät valmiita tuotteita omasta varastostaan.",
  ],
  sections: [
    {
      heading: "Miksi viimeinen tilauspäivä on jo marraskuussa?",
      paragraphs: [
        "Huumorikaupan tuotteita ei ole valmiina varastossa. Jokainen paita, huppari ja muu tuote painetaan tilauksen jälkeen painokumppaneidemme tuotantolaitoksissa Suomen ulkopuolella, ja valmis tuote kuljetetaan sieltä Suomeen. Toimitusaikaan kuuluu siis sekä painaminen että kuljetus.",
        "Painokumppanien ilmoittamat tuotantoajat ovat 2-6 arkipäivää. Päivämäärä 20.11.2026 on laskettu painokumppanien edellisen joulun viimeisistä suositelluista tilauspäivistä Eurooppaan, ja niistä on vähennetty viikko Suomeen tulevaa kuljetusta varten. Joulun alla paketteja kulkee tavallista enemmän, ja tämä varaus kattaa sen.",
        "Tuotteitamme painetaan useammassa painotalossa. Valitsimme päivän, joka riittää myös niistä hitaimmalle, joten sama päivä koskee kaikkia tuotteita.",
      ],
    },
    {
      heading: "Mitä tapahtuu 20.11.2026 jälkeen?",
      paragraphs: [
        "Tilauksia otetaan vastaan normaalisti myös 20.11.2026 jälkeen, ja ne painetaan ja toimitetaan tavalliseen tapaan. Emme kuitenkaan lupaa, että 20.11.2026 jälkeen tehty tilaus on perillä jouluaattoon mennessä.",
      ],
    },
  ],
  faqs: [
    { q: "Mikä on viimeinen tilauspäivä jouluksi 2026?", a: D },
    {
      q: "Koskeeko päivä kaikkia tuotteita?",
      a: "Koskee. Sama päivä on voimassa kaikille tuotteille, myös personoiduille Oma teksti/kuva -tuotteille.",
    },
    {
      q: "Voinko tilata vielä 20.11.2026 jälkeen?",
      a: "Voit. Tilaukset käsitellään normaalisti, mutta toimitusta jouluaattoon mennessä emme lupaa.",
    },
    {
      q: "Miksi joulutilaus pitää tehdä näin aikaisin?",
      a: "Tuotteet painetaan vasta tilauksen jälkeen painokumppaneidemme tuotantolaitoksissa Suomen ulkopuolella ja kuljetetaan sieltä Suomeen. Joulun alla kuljetuksiin on varattu lisäaikaa.",
    },
    {
      q: "Mitä toimitus maksaa?",
      a: `Alle ${ILMAINEN_RAJA_TEKSTI} euron tilauksissa toimitus maksaa ${TOIMITUSMAKSU_TEKSTI} euroa. Yli ${ILMAINEN_RAJA_TEKSTI} euron tilaukset toimitetaan ilman toimituskuluja.`,
    },
  ],
  /** Joululahjaoppaat. */
  links: landingPages.filter((p) => p.group === "joulu").map((p) => ({ href: p.path, label: p.h1 })),
};
