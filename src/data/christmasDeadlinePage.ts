/**
 * /joulun-viimeiset-tilauspaivat: sisältö React-sivulle ja esirenderöinnille.
 * Ainoa luvattu päivä on src/data/christmas.ts:n CHRISTMAS_DEADLINE_PROMISE.
 */
import { CHRISTMAS_DEADLINE_PATH, CHRISTMAS_DEADLINE_PROMISE } from "./christmas";
import { landingPages } from "./landingPages";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "../config/toimitus";
import { jouluLause, jouluTyypitLause } from "./tilauspaivat";

const D = CHRISTMAS_DEADLINE_PROMISE;

export const christmasDeadlinePage = {
  path: CHRISTMAS_DEADLINE_PATH,
  name: "Joulun viimeiset tilauspäivät",
  title: "Joulun viimeiset tilauspäivät 2026 | Huumorikauppa",
  description:
    `${jouluLause()} Näin tilauspäivä on laskettu ja mitä sen jälkeen tapahtuu.`,
  h1: "Joulun viimeiset tilauspäivät 2026",
  intro: [
    `${D} ${jouluTyypitLause()}`.trim(),
    "Tuotteemme painetaan vasta tilauksen jälkeen, joten joulutilauksen takaraja on aikaisemmin kuin kaupoissa, jotka lähettävät valmiita tuotteita omasta varastostaan.",
  ],
  sections: [
    {
      heading: "Miten viimeinen tilauspäivä on laskettu?",
      paragraphs: [
        "Huumorikaupan tuotteita ei ole valmiina varastossa. Jokainen paita, huppari ja muu tuote painetaan tilauksen jälkeen painokumppaneidemme tuotantolaitoksissa Euroopassa, ja valmis tuote kuljetetaan sieltä Suomeen. Toimitusaikaan kuuluu siis sekä painaminen että kuljetus.",
        "T-paitojen päivä perustuu toteutuneisiin toimitusaikoihin Suomeen, ja siihen on lisätty kahden arkipäivän varaus joulun ruuhkaa varten. Muista tuotteista toimituksia on vielä vähän, joten niiden päivä perustuu painokumppanin ilmoittamaan enimmäistoimitusaikaan Suomeen, 15 arkipäivää, ja samaan kahden arkipäivän varaukseen.",
        "Ostoskorissa näkyy aina korin tuotteiden varhaisin päivä, ja tuotesivulla tuotteen oma päivä.",
      ],
    },
    {
      heading: "Mitä tapahtuu viimeisen tilauspäivän jälkeen?",
      paragraphs: [
        "Tilauksia otetaan vastaan normaalisti myös viimeisen tilauspäivän jälkeen, ja ne painetaan ja toimitetaan tavalliseen tapaan. Emme kuitenkaan lupaa, että viimeisen tilauspäivän jälkeen tehty tilaus on perillä jouluaattoon mennessä.",
      ],
    },
  ],
  faqs: [
    { q: "Mikä on viimeinen tilauspäivä jouluksi 2026?", a: D },
    {
      q: "Onko päivä sama kaikille tuotteille?",
      a: `${jouluTyypitLause() || "Joulun tilausaika on päättynyt kaikilta tuotteilta."} Tuotesivulla näkyy tuotteen oma päivä.`,
    },
    {
      q: "Voinko tilata vielä viimeisen tilauspäivän jälkeen?",
      a: "Voit. Tilaukset käsitellään normaalisti, mutta toimitusta jouluaattoon mennessä emme lupaa.",
    },
    {
      q: "Miksi joulutilaus pitää tehdä näin aikaisin?",
      a: "Tuotteet painetaan vasta tilauksen jälkeen painokumppaneidemme tuotantolaitoksissa Suomen ulkopuolella ja kuljetetaan sieltä Suomeen. Joulun alla kuljetuksiin on varattu lisäaikaa.",
    },
    {
      q: "Mitä toimitus maksaa?",
      a: `Alle ${ILMAINEN_RAJA_TEKSTI} euron tilauksissa toimitus maksaa ${TOIMITUSMAKSU_TEKSTI} euroa. Vähintään ${ILMAINEN_RAJA_TEKSTI} euron tilaukset toimitetaan ilman toimituskuluja.`,
    },
  ],
  /** Joululahjaoppaat. */
  links: landingPages.filter((p) => p.group === "joulu").map((p) => ({ href: p.path, label: p.h1 })),
};
