/**
 * Toimitusehdot: AINOA paikka toimitusmaksulle, ilmaisen toimituksen rajalle ja toimitusajalle.
 *
 * Arvojen on vastattava sitä, mitä kassa oikeasti veloittaa. Oma tausta (haara oma-tausta):
 * kassa api/_lib/kassa.js lukee arvot tiedostosta api/_lib/vakiot.js, ja Merchant-syöte
 * api/_lib/syote-lisakentat.js samoin. src/config/toimitus.test.ts kaatuu, jos arvot eroavat.
 * Oma tausta pitää samat arvot kuin main-haaran vanha kassa (Lovable create-checkout): 6,90 € / 79 €
 * (27.10.2026, KATTEET.md "Keskiostoksen nosto: laskelma"). Kaikki sivuston tekstit, UKK:t,
 * rakenteinen data ja llms.txt lukevat arvot täältä.
 *
 * Tiedosto on tarkoituksella riippuvuudeton (ei "@/"-aliaksia), jotta sitä voi käyttää myös
 * Vercelin middlewaressa, vite.config.ts:ssä ja build-skripteissä.
 */

/** Toimitusmaksu euroina, kun tilaus jää alle ilmaisen toimituksen rajan. */
export const TOIMITUSMAKSU = 6.9;
/** Tilauksen summa (€), josta alkaen toimitus on ilmainen. */
export const ILMAINEN_TOIMITUS_RAJA = 79;

/** Kokonaistoimitusaika tilauksesta arkipäivinä (Terms.tsx kohta 4). */
export const TOIMITUSAIKA_MIN_ARKIPAIVAA = 3;
export const TOIMITUSAIKA_MAX_ARKIPAIVAA = 10;

/**
 * Kokonaistoimitusajan jako rakenteista dataa varten (Googlen OfferShippingDetails vaatii
 * handlingTime + transitTime). Käsittely = painatus tilauksen pohjalta, kuljetus = Posti tai
 * Matkahuolto. Summat vastaavat yllä olevaa 3-10 arkipäivän lupausta (toimitus.test.ts).
 */
export const KASITTELYAIKA_MIN_ARKIPAIVAA = 1;
export const KASITTELYAIKA_MAX_ARKIPAIVAA = 4;
export const KULJETUSAIKA_MIN_ARKIPAIVAA = TOIMITUSAIKA_MIN_ARKIPAIVAA - KASITTELYAIKA_MIN_ARKIPAIVAA;
export const KULJETUSAIKA_MAX_ARKIPAIVAA = TOIMITUSAIKA_MAX_ARKIPAIVAA - KASITTELYAIKA_MAX_ARKIPAIVAA;

/** Euromäärä suomalaisittain ilman €-merkkiä: 6.9 -> "6,90", 79 -> "79". */
export function euroluku(summa: number): string {
  return Number.isInteger(summa) ? String(summa) : summa.toFixed(2).replace(".", ",");
}

/** "6,90" */
export const TOIMITUSMAKSU_TEKSTI = euroluku(TOIMITUSMAKSU);
/** "79" */
export const ILMAINEN_RAJA_TEKSTI = euroluku(ILMAINEN_TOIMITUS_RAJA);
/** "3-10" */
export const TOIMITUSAIKA_TEKSTI = `${TOIMITUSAIKA_MIN_ARKIPAIVAA}-${TOIMITUSAIKA_MAX_ARKIPAIVAA}`;

/** Lyhyt toimitusrivi ostopainikkeen ja ostoskorin yhteenvedon alle: "Toimitus 6,90 €, ilmainen 79 eurosta". */
export const TOIMITUSRIVI = `Toimitus ${TOIMITUSMAKSU_TEKSTI} €, ilmainen ${ILMAINEN_RAJA_TEKSTI} eurosta`;

/** Toimitusehtojen toimitusaikalause. */
export const TOIMITUSAIKA_LAUSE = `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta.`;
/** Toimitusmaksulause, esim. "Toimitus maksaa 6,90 €, ja 79 euron tilauksista alkaen toimitus on ilmainen." */
export const TOIMITUSMAKSU_LAUSE = `Toimitus maksaa ${TOIMITUSMAKSU_TEKSTI} €, ja ${ILMAINEN_RAJA_TEKSTI} euron tilauksista alkaen toimitus on ilmainen.`;

/** Toimitusmaksu tilauksen välisummalle (sama sääntö kuin kassalla). */
export function toimitusmaksuSummalle(valisumma: number): number {
  return valisumma >= ILMAINEN_TOIMITUS_RAJA ? 0 : TOIMITUSMAKSU;
}

/** Puuttuva summa ilmaiseen toimitukseen ja edistyminen prosentteina (ostoskorin paneelin palkki). */
export function freeShippingStatus(total: number): { free: boolean; gap: number; progress: number } {
  const gap = Math.max(0, ILMAINEN_TOIMITUS_RAJA - total);
  return {
    free: gap === 0,
    gap,
    progress: Math.min(100, Math.max(0, (total / ILMAINEN_TOIMITUS_RAJA) * 100)),
  };
}
