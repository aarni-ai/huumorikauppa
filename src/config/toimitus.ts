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

/**
 * Toimitusaika tilauksesta perille arkipäivinä tuotetyypeittäin (2.11.2026, KASVU-RAPORTTI.md "Toimitusajat
 * tuotetyypeittäin"). Lähteet: kaupan toteutuneet Printify-tilaukset 3-10/2026 (scripts/joulu-aikataulu.mjs, tilaus ->
 * perillä) ja Printifyn ilmoittama toimitusaika Suomeen (API v2 shipping/standard: EU-painotalot 5-15). Alaraja on
 * nopein toteutunut toimitus tai Printifyn alaraja, yläraja hitain toteutunut toimitus tai Printifyn yläraja (pienempi
 * ja suurempi). Kaikki kaupan tuotteet valmistetaan EU:ssa (OPT OnDemand CZ, Textildruck Europa DE, Atelier Katanga
 * FR, Printify Choice LV/CZ); syöte jättää EU:n ulkopuolella valmistettavat pois (api/_lib/eu-reititys.js).
 *  - t-paidat: toteutunut 4-15 (10 toimitusta, OPT 5-9, Choice 4-15), Printify 5-15 -> 4-15
 *  - hupparit: toteutunut 11-14 (3 toimitusta, Textildruck), Printify 5-15 -> 5-15
 *  - julisteet ja tarrat: ei toimituksia, Printify 5-15 -> 5-15
 * Joulun ja isänpäivän viimeiset tilauspäivät lasketaan samoista ylärajoista (src/data/campaignSchedule.ts).
 */
export const TOIMITUSAJAT_TYYPEITTAIN: Readonly<Record<string, readonly [number, number]>> = {
  "t-paidat": [4, 15],
  hupparit: [5, 15],
  seinataulut: [5, 15],
  tarrat: [5, 15],
};
/** Tuntematon tuotetyyppi: hitain alaraja ja yläraja. */
export const TOIMITUSAIKA_OLETUS: readonly [number, number] = [5, 15];

/** Koko kaupan toimitusaika arkipäivinä (kaikkien tuotetyyppien vaihteluväli; Terms.tsx kohta 4, syöte, rakenteinen data). */
export const TOIMITUSAIKA_MIN_ARKIPAIVAA = 4;
export const TOIMITUSAIKA_MAX_ARKIPAIVAA = 15;

/** Tuotetyypin toimitusaika [vähintään, enintään] arkipäivinä. */
export function toimitusaikaKategorialle(kategoria?: string | null): readonly [number, number] {
  return (kategoria && TOIMITUSAJAT_TYYPEITTAIN[kategoria]) || TOIMITUSAIKA_OLETUS;
}

/**
 * Kokonaistoimitusajan jako rakenteista dataa ja Merchant-syötettä varten (Googlen OfferShippingDetails vaatii
 * handlingTime + transitTime). Käsittely = tilaus painotalolle, painatus ja lähetys (toteutunut 0-3 arkipäivää),
 * kuljetus = loput. Summat vastaavat yllä olevaa koko kaupan aikaa (toimitus.test.ts).
 */
export const KASITTELYAIKA_MIN_ARKIPAIVAA = 1;
export const KASITTELYAIKA_MAX_ARKIPAIVAA = 3;
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
/** "4-15" (koko kauppa) */
export const TOIMITUSAIKA_TEKSTI = `${TOIMITUSAIKA_MIN_ARKIPAIVAA}-${TOIMITUSAIKA_MAX_ARKIPAIVAA}`;
/** Tuotetyypin toimitusaika tekstinä, esim. "5-15". */
export const toimitusaikaTeksti = (kategoria?: string | null): string => toimitusaikaKategorialle(kategoria).join("-");
/** Korin tai tilauksen toimitusaika tekstinä: tuotetyyppien vaihteluväli, esim. ["t-paidat", "hupparit"] -> "4-15". */
export function toimitusaikaKorille(kategoriat: readonly (string | null | undefined)[]): string {
  if (kategoriat.length === 0) return TOIMITUSAIKA_TEKSTI;
  const ajat = kategoriat.map(toimitusaikaKategorialle);
  return `${Math.min(...ajat.map((a) => a[0]))}-${Math.max(...ajat.map((a) => a[1]))}`;
}
/** "T-paidat ovat perillä 4-15 arkipäivässä ja hupparit 5-15 arkipäivässä tilauksesta." */
export const TOIMITUSAIKA_TYYPEITTAIN_LAUSE = `T-paidat ovat perillä ${toimitusaikaTeksti("t-paidat")} arkipäivässä ja hupparit ${toimitusaikaTeksti("hupparit")} arkipäivässä tilauksesta.`;
/** Julisteet ja tarrat (toimitusehdot). */
export const TOIMITUSAIKA_MUUT_LAUSE = `Julisteet ja tarrat ovat perillä ${toimitusaikaTeksti("seinataulut")} arkipäivässä.`;

/** Kahden tuotteen ilmainen toimitus (2.11.2026, api/_lib/vakiot.js ILMAINEN_TOIMITUS_KPL; ei yhdisty alennuskoodiin). */
export const ILMAINEN_TOIMITUS_KPL = 2;

/**
 * Lyhyt toimitusrivi ostopainikkeen ja ostoskorin yhteenvedon alle. Sama sanamuoto kaikkialla (12.11.2026):
 * "ilmainen toimitus kahdesta tuotteesta tai 79 eurosta" (kassa: api/_lib/vakiot.js toimitusmaksu).
 */
export const TOIMITUSRIVI = `Toimitus ${TOIMITUSMAKSU_TEKSTI} €, ilmainen kahdesta tuotteesta tai ${ILMAINEN_RAJA_TEKSTI} eurosta`;

/** Toimitusaikalause: tuotetyypeittäin. */
export const TOIMITUSAIKA_LAUSE = TOIMITUSAIKA_TYYPEITTAIN_LAUSE;
/** Toimitusmaksulause, esim. "Toimitus maksaa 6,90 €, ja 79 euron tilauksista alkaen toimitus on ilmainen." */
export const TOIMITUSMAKSU_LAUSE = `Toimitus maksaa ${TOIMITUSMAKSU_TEKSTI} €. Ilmainen toimitus kahdesta tuotteesta tai ${ILMAINEN_RAJA_TEKSTI} eurosta; joissakin tuoteyhdistelmissä toimitus on alennettu, ja ostoskori näyttää maksun ennen maksamista.`;

/** Kahden tuotteen säännön ehdot (toimitusehdot, UKK). Katevahti: api/_lib/kate.js toimitusmaksuKatteella (2.11.2026). */
export const KAHDEN_TUOTTEEN_EHTO = `Kahden tuotteen ilmainen toimitus koskee t-paitoja, huppareita ja julisteita (tarrat eivät lasketa), eikä se yhdisty alennuskoodiin eikä t-paitaparin kampanjahintaan. Niissä toimitus on ilmainen kahdesta tuotteesta tai ${ILMAINEN_RAJA_TEKSTI} eurosta. Lahjapaketeissa on kaksi tuotetta, joten niiden toimitus on ilmainen. Kahden t-paidan tilaus toimitetaan ilmaiseksi. Joissakin hupparin tai koristeen ja toisen tuotteen yhdistelmissä toimitus on 2,90 € tai 4,90 €, ja ostoskori näyttää tilauksen toimitusmaksun ennen maksamista.`;

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
