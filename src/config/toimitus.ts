/**
 * Toimitusehdot: AINOA paikka toimitusmaksulle, ilmaisen toimituksen rajalle ja toimitusajalle.
 *
 * Arvojen on vastattava sitä, mitä kassa oikeasti veloittaa. Nykyinen kassa
 * (supabase/functions/create-checkout/index.ts) veloittaa 6,90 € alle 79 euron tilauksista ja
 * toimittaa 79 eurosta alkaen ilmaiseksi. Toimitusaika on toimitusehtojen (Terms.tsx) mukainen.
 *
 * Vaihto omaan taustaan (5,90 € / 60 €): muuta alla olevat kaksi arvoa samassa muutoksessa kuin
 * kassan logiikka. Merchant-syötteen peili api/_lib/syote-lisakentat.js on päivitettävä samalla;
 * src/config/toimitus.test.ts kaatuu, jos arvot eroavat. Kaikki sivuston tekstit, UKK:t,
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

/** Toimitusehtojen toimitusaikalause. */
export const TOIMITUSAIKA_LAUSE = `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta.`;
/** Toimitusmaksulause, esim. "Toimitus maksaa 6,90 €, ja 79 euron tilauksista alkaen toimitus on ilmainen." */
export const TOIMITUSMAKSU_LAUSE = `Toimitus maksaa ${TOIMITUSMAKSU_TEKSTI} €, ja ${ILMAINEN_RAJA_TEKSTI} euron tilauksista alkaen toimitus on ilmainen.`;

/** Toimitusmaksu tilauksen välisummalle (sama sääntö kuin kassalla). */
export function toimitusmaksuSummalle(valisumma: number): number {
  return valisumma >= ILMAINEN_TOIMITUS_RAJA ? 0 : TOIMITUSMAKSU;
}
