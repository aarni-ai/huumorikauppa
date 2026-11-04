/**
 * Kampanjakalenteri 2026 (2.11.2026): yksi paikka, joka kertoo mikä kampanja on päällä minäkin päivänä (Suomen aikaa).
 * Etusivun nosto (src/components/KampanjaNosto.tsx), /linkit-sivu (src/data/linkit.ts) ja yläbanneri
 * (src/data/campaignSchedule.ts BANNER_SCHEDULE) vaihtuvat tämän mukaan itsestään.
 *
 * Päivien lähteet (ei käsin kirjoitettuja päiviä tässä tiedostossa):
 * - Isänpäivä ja Black Friday -viikko: api/_lib/vakiot.js KAMPANJAPAIVAT. Black Fridayn parihinta toimii kassalla samoilla
 *   päivillä (TPAITAPARI_KAMPANJA, api/_lib/korialennus.js tpaitapariVoimassa), joten ennen 23.11. se ei näy eikä vaikuta.
 * - Joulun tilauspäivät tuotetyyppien toimitusajoista (src/config/toimitus.ts -> src/data/campaignSchedule.ts):
 *   JOULU_TILAUSPAIVA_ISO hupparit, julisteet ja muut tuotteet, JOULU_TPAIDAT_ISO t-paidat. 2.11.2026 alkaen molemmat
 *   15 arkipäivää. Tarkat päivät: src/test/kampanjat.test.ts.
 *
 * Vaiheet:
 *   isanpaiva       1.10.-8.11.   isänpäivä (painettu lahja ei enää ehdi 14.10. jälkeen: lahjakortti)
 *   joulu           9.11.-22.11.  joululahjat ja tilauspäivät
 *   black-friday    23.11.-30.11. kaksi t-paitaa 44,90 €
 *   joulu-takaraja  Black Fridayn jälkeen - JOULU_TPAIDAT_ISO  viimeiset tilauspäivät
 *   lahjakortti     JOULU_TPAIDAT_ISO + 1 - 24.12.             lahjakortti perille heti
 *
 * Rinnakkain (JOULUKALENTERI_VAIHE, 4.11.2026): joulukalenteri joulukuun alusta jouluaattoon (päivän luukku, banneri ja
 * etusivun nosto), ennakkonosto KAMPANJAPAIVAT.joulukalenteri.esittely-päivästä. Ei korvaa yllä olevia vaiheita.
 */
import { KAMPANJAPAIVAT, TPAITAPARI_KAMPANJA } from "../../api/_lib/vakiot.js";
import {
  JOULU_TILAUSPAIVA_ISO,
  JOULU_TPAIDAT_ISO,
  paivaLyhyt,
  paivanAlkuUtcMs,
  paivanLoppuUtcMs,
} from "./campaignSchedule.js";
import { isanpaivaLause, jouluLause } from "./tilauspaivat.js";

export type KampanjaVaiheId = "isanpaiva" | "joulu" | "black-friday" | "joulu-takaraja" | "lahjakortti";

export interface KampanjaVaihe {
  id: KampanjaVaiheId;
  /** Ensimmäinen päivä (YYYY-MM-DD, Suomen aikaa, mukaan lukien). */
  alku: string;
  /** Viimeinen päivä (mukaan lukien). */
  loppu: string;
}

const lisaaPaivia = (iso: string, n: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Järjestyksessä, peräkkäiset päivät ilman aukkoja (src/test/kampanjat.test.ts). */
export const KAMPANJAVAIHEET: readonly KampanjaVaihe[] = [
  { id: "isanpaiva", alku: KAMPANJAPAIVAT.isanpaiva.alku, loppu: KAMPANJAPAIVAT.isanpaiva.loppu },
  { id: "joulu", alku: lisaaPaivia(KAMPANJAPAIVAT.isanpaiva.loppu, 1), loppu: lisaaPaivia(KAMPANJAPAIVAT.blackFriday.alku, -1) },
  { id: "black-friday", alku: KAMPANJAPAIVAT.blackFriday.alku, loppu: KAMPANJAPAIVAT.blackFriday.loppu },
  { id: "joulu-takaraja", alku: lisaaPaivia(KAMPANJAPAIVAT.blackFriday.loppu, 1), loppu: JOULU_TPAIDAT_ISO },
  { id: "lahjakortti", alku: lisaaPaivia(JOULU_TPAIDAT_ISO, 1), loppu: KAMPANJAPAIVAT.lahjakorttiLoppu },
];

/** Joulukalenteri (api/_lib/joulukalenteri.js): kulkee vaiheiden rinnalla, ei ole osa KAMPANJAVAIHEET-ketjua. */
export const JOULUKALENTERI_VAIHE = {
  id: "joulukalenteri" as const,
  esittely: KAMPANJAPAIVAT.joulukalenteri.esittely,
  alku: KAMPANJAPAIVAT.joulukalenteri.alku,
  loppu: KAMPANJAPAIVAT.joulukalenteri.loppu,
};

const HELSINKI_PAIVA = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" });
/** Päivä Suomen aikaa (YYYY-MM-DD) annettuna hetkenä. */
export const helsinginPaiva = (nowMs: number): string => HELSINKI_PAIVA.format(new Date(nowMs));

/** Vaihe annettuna hetkenä (Suomen päivän mukaan) tai null. */
export function kampanjaVaihe(nowMs: number = Date.now(), vaiheet: readonly KampanjaVaihe[] = KAMPANJAVAIHEET): KampanjaVaiheId | null {
  const p = helsinginPaiva(nowMs);
  return vaiheet.find((v) => p >= v.alku && p <= v.loppu)?.id ?? null;
}

/** Seuraava vaiheen vaihtumishetki (UTC ms, keskiyö Suomen aikaa) tai null. */
export function seuraavaKampanjaVaihtoMs(nowMs: number, vaiheet: readonly KampanjaVaihe[] = KAMPANJAVAIHEET): number | null {
  const rajat = vaiheet.flatMap((v) => [paivanAlkuUtcMs(v.alku), paivanLoppuUtcMs(v.loppu) + 1]).filter((t) => t > nowMs);
  return rajat.length ? Math.min(...rajat) : null;
}

const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;
const ilmanVuotta = (iso: string) => paivaLyhyt(iso).replace(/\d{4}$/, "");

/**
 * Black Fridayn teksti yläpalkkiin. Kuluttajansuojalaki 2:6 a §: t-paidan hinta ja 30 päivän alin hinta mukana
 * (KATTEET.md "Black Friday ja joulu 2026").
 */
export const BLACK_FRIDAY_PALKKI =
  `Black Friday ${ilmanVuotta(TPAITAPARI_KAMPANJA.loppu)} asti: kaksi t-paitaa ${eur(TPAITAPARI_KAMPANJA.parihinta)}. ` +
  `T-paidan hinta ${eur(TPAITAPARI_KAMPANJA.kappalehinta)}, alin hinta 30 päivän aikana ${eur(TPAITAPARI_KAMPANJA.alinHinta30pv)}.`;

export interface KampanjaNostonSisalto {
  vaihe: KampanjaVaiheId;
  otsikko: string;
  teksti: string;
  linkki: { polku: string; teksti: string };
  /** Toissijainen linkki (esim. lahjapaketit). */
  lisalinkki?: { polku: string; teksti: string };
  /** true: näytetään vain, kun lahjakortit ovat myynnissä (muuten nosto jää pois). */
  vaatiiLahjakortin?: boolean;
}

/**
 * Etusivun noston sisältö hetkellä nowMs. Black Friday -vaiheessa sisältö tulee komponentista BlackFridayNosto
 * (src/components/KorialennusVihje.tsx), jotta kampanjan tekstit ovat yhdessä paikassa; tässä sama tieto testejä varten.
 */
export function kampanjaNosto(nowMs: number = Date.now()): KampanjaNostonSisalto | null {
  const vaihe = kampanjaVaihe(nowMs);
  switch (vaihe) {
    case "isanpaiva":
      return {
        vaihe,
        otsikko: "Isänpäivä su 8.11.",
        teksti: `${isanpaivaLause(nowMs)} Lahjakortin koodi ja tulostettava PDF ovat valmiina heti maksun jälkeen.`,
        linkki: { polku: "/lahjakortti", teksti: "Osta lahjakortti" },
        lisalinkki: { polku: "/isanpaivalahja", teksti: "Isänpäivälahjat" },
        vaatiiLahjakortin: true,
      };
    case "joulu":
      return {
        vaihe,
        otsikko: "Joululahjat ajoissa",
        teksti: jouluLause(nowMs),
        linkki: { polku: "/joululahjat", teksti: "Katso joululahjat" },
        lisalinkki: { polku: "/paketit", teksti: "Lahjapaketit, toimitus ilmainen" },
      };
    case "black-friday":
      return {
        vaihe,
        otsikko: `Black Friday: kaksi t-paitaa ${eur(TPAITAPARI_KAMPANJA.parihinta)}`,
        teksti: BLACK_FRIDAY_PALKKI,
        linkki: { polku: "/black-friday", teksti: "Katso t-paidat" },
      };
    case "joulu-takaraja": {
      const tanaan = helsinginPaiva(nowMs);
      const muutAuki = tanaan <= JOULU_TILAUSPAIVA_ISO;
      // Sama päivä kaikille tuotetyypeille (src/config/toimitus.ts): yksi lause.
      if (JOULU_TILAUSPAIVA_ISO === JOULU_TPAIDAT_ISO) {
        return {
          vaihe,
          otsikko: "Viimeiset tilauspäivät jouluksi",
          teksti: `T-paidat, hupparit ja julisteet ehtivät jouluksi, kun tilaat viimeistään ${ilmanVuotta(JOULU_TILAUSPAIVA_ISO)}`,
          linkki: { polku: "/joululahjat", teksti: "Katso joululahjat" },
          lisalinkki: { polku: "/joulun-viimeiset-tilauspaivat", teksti: "Joulun viimeiset tilauspäivät" },
        };
      }
      return {
        vaihe,
        otsikko: muutAuki ? "Viimeinen tilauspäivä jouluksi" : "T-paidat ehtivät vielä jouluksi",
        teksti: muutAuki
          ? `Hupparit, julisteet ja muut tuotteet ehtivät jouluksi, kun tilaat viimeistään ${ilmanVuotta(JOULU_TILAUSPAIVA_ISO)} T-paidat ehtivät, kun tilaat viimeistään ${ilmanVuotta(JOULU_TPAIDAT_ISO)}`
          : `Tilaa t-paidat viimeistään ${ilmanVuotta(JOULU_TPAIDAT_ISO)}, niin ne ehtivät perille jouluaattoon mennessä. Muiden tuotteiden tilausaika päättyi.`,
        linkki: muutAuki
          ? { polku: "/joululahjat", teksti: "Katso joululahjat" }
          : { polku: "/kategoria/t-paidat", teksti: "Katso t-paidat" },
        lisalinkki: { polku: "/joulun-viimeiset-tilauspaivat", teksti: "Joulun viimeiset tilauspäivät" },
      };
    }
    case "lahjakortti":
      return {
        vaihe,
        otsikko: "Lahjakortti on perillä heti",
        teksti: "Joulun tilausaika päättyi, mutta lahjakortin koodi ja tulostettava PDF ovat valmiina heti maksun jälkeen.",
        linkki: { polku: "/lahjakortti", teksti: "Osta lahjakortti" },
        vaatiiLahjakortin: true,
      };
    default:
      return null;
  }
}
