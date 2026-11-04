/**
 * /joulukalenteri: ohjeet ja UKK React-sivulle ja esirenderöinnille (src/seo/prerender/pages.ts). Ei luukkujen tuotteita
 * eikä hintoja: ne ovat vain palvelimella (api/_lib/joulukalenteri-data.js). Päivät lasketaan kampanjakalenterista
 * (api/_lib/vakiot.js KAMPANJAPAIVAT.joulukalenteri) ja joulun tilauspäivästä (campaignSchedule.ts).
 */
import { KAMPANJAPAIVAT } from "../../api/_lib/vakiot.js";
import { JOULU_TILAUSPAIVA_ISO, paivaTeksti } from "./campaignSchedule";
import { TOIMITUSAIKA_TEKSTI } from "../config/toimitus";

const ALKU = paivaTeksti(KAMPANJAPAIVAT.joulukalenteri.alku);
const LOPPU = paivaTeksti(KAMPANJAPAIVAT.joulukalenteri.loppu);
const TILAUSPAIVA = paivaTeksti(JOULU_TILAUSPAIVA_ISO);

export const JOULUKALENTERI_OHJEET: string[] = [
  `Ensimmäinen luukku aukeaa ${ALKU} ja viimeinen ${LOPPU}.`,
  "Luukku aukeaa keskiyöllä Suomen aikaa, ja sen hinta on voimassa saman päivän loppuun.",
  "Tulevia luukkuja ei voi avata etukäteen. Mennyt luukku ei enää anna tarjousta.",
  "Luukun hinta lasketaan kassalla ilman koodia, kun tuote on korissa luukun päivänä. Se ei yhdisty alennuskoodeihin eikä muihin alennuksiin.",
  "Luukun vieressä näkyy tuotteen alin hinta 30 päivän aikana ennen tarjousta.",
  `Tuotteet painetaan tilauksesta ja ovat perillä ${TOIMITUSAIKA_TEKSTI} arkipäivässä. Joulun viimeinen tilauspäivä on ${TILAUSPAIVA}, joten sen jälkeen tilatut tuotteet ovat perillä joulun jälkeen.`,
];

export const JOULUKALENTERI_FAQS: { q: string; a: string }[] = [
  {
    q: "Voiko luukun avata etukäteen?",
    a: "Ei voi. Luukku aukeaa vasta omana päivänään keskiyöllä Suomen aikaa, eikä tulevien luukkujen tuotteita tai hintoja näytetä etukäteen.",
  },
  {
    q: "Kuinka kauan luukun hinta on voimassa?",
    a: "Luukun päivän loppuun klo 23.59 Suomen aikaa. Hinta lasketaan kassalla ilman koodia, kun maksat tilauksen saman päivän aikana.",
  },
  {
    q: "Yhdistyykö luukun hinta muihin alennuksiin?",
    a: "Ei yhdisty. Jos käytät alennuskoodia, kassa laskee tilauksen koodilla ja tavallisilla hinnoilla.",
  },
  {
    q: "Ehtiikö luukun tuote jouluksi?",
    a: `Ehtii, kun tilaat viimeistään ${TILAUSPAIVA}. Sen jälkeen tilatut tuotteet painetaan ja toimitetaan normaalisti, ja ne ovat perillä joulun jälkeen.`,
  },
];
