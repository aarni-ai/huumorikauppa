/**
 * Tuotesivun toimitusarvion profiilit (src/lib/toimitusarvio.ts). Kokonaisajat tuotetyypeittäin tulevat tiedostosta
 * src/config/toimitus.ts (TOIMITUSAJAT_TYYPEITTAIN, toteutuneet tilaukset ja Printifyn toimitusaika Suomeen 2.11.2026),
 * joten tuotesivun "perillä viimeistään" -päivä, tekstit ja joulun tilauspäivät käyttävät samoja lukuja.
 * Käsittely 1-3 arkipäivää (KASITTELYAIKA_*), kuljetus loput.
 */
import { KASITTELYAIKA_MAX_ARKIPAIVAA, KASITTELYAIKA_MIN_ARKIPAIVAA, toimitusaikaKategorialle } from "./toimitus";

export interface ToimitusProfiili {
  nimi: string;
  /** Käsittely ja tuotanto arkipäivinä [vähintään, enintään]. */
  tuotanto: [number, number];
  /** Kuljetus Suomeen arkipäivinä [vähintään, enintään]. */
  kuljetus: [number, number];
}

/** Tuotetyypin profiili: tuotanto + kuljetus = TOIMITUSAJAT_TYYPEITTAIN. */
export function toimitusprofiili(kategoria?: string | null): ToimitusProfiili {
  const [min, max] = toimitusaikaKategorialle(kategoria);
  return {
    nimi: kategoria || "muut",
    tuotanto: [KASITTELYAIKA_MIN_ARKIPAIVAA, KASITTELYAIKA_MAX_ARKIPAIVAA],
    kuljetus: [min - KASITTELYAIKA_MIN_ARKIPAIVAA, max - KASITTELYAIKA_MAX_ARKIPAIVAA],
  };
}

/** Joulun raja: paketti perillä viimeistään tänä päivänä (kuukausi-päivä). */
export const JOULU_RAJA = "12-23";
/** "Ehtii jouluksi" -merkki näytetään aikaisintaan tästä päivästä alkaen (kuukausi-päivä). */
export const JOULUSESONKI_ALKAA = "10-15";
