/**
 * Hintamaininnat sisältöihin voimassa olevasta hinnastosta (api/_lib/vakiot.js HINNASTO). Kun ALV-varasuunnitelma
 * kytketään päälle (PRINTIFY_ALV_VAHENNETTAVA = false), nämä tekstit päivittyvät hinnaston mukana.
 */
import { HINNASTO } from "../../api/_lib/vakiot.js";

const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;
const luku = (x: number) => x.toFixed(2).replace(".", ",");

export const HINTA = {
  /** Edullisin t-paita (suora kilpailijavertailu, S-2XL), esim. "24,90 €". */
  tpaitaAlkaen: eur(HINNASTO.tpaita.suora),
  /** Muiden t-paitojen perushinta, esim. "27,90 €". */
  tpaitaUniikki: eur(HINNASTO.tpaita.uniikki),
  /** T-paitojen koko hintahaarukka, esim. "24,90-29,90 €". */
  tpaitaHaarukka: `${luku(HINNASTO.tpaita.suora)}-${eur(Math.max(HINNASTO.tpaita.uniikkiIso, HINNASTO.tpaita.suoraIso))}`,
  huppariAlkaen: eur(HINNASTO.hupparit.perus),
  personoitu: eur(HINNASTO.personoitu),
  koriste: eur(HINNASTO.kategoriat.koristeet),
  juliste: eur(HINNASTO.kategoriat.seinataulut),
  /** Yhteishinnat esimerkkeihin. */
  huppariJaKoriste: eur(HINNASTO.hupparit.perus + HINNASTO.kategoriat.koristeet),
  kaksiMeemipaitaa: eur(2 * HINNASTO.tpaita.suora),
  meemipaitaJaKoriste: eur(HINNASTO.tpaita.suora + HINNASTO.kategoriat.koristeet),
} as const;
