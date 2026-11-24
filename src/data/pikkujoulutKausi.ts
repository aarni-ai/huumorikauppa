/**
 * /pikkujoulut-yritykset vaihtaa sisältönsä automaattisesti (24.11.2026): yritysten joulutakarajaan
 * (api/_lib/yritysmyynti.js YRITYS_JOULU_TAKARAJA_ISO, to 26.11.2026) asti pikkujoulupaketit, sen jälkeen tiimipaidat
 * kevään tapahtumiin ja virkistyspäiviin. Osoite pysyy samana (sivu on indeksoitu). Sama päivälogiikka React-sivulle,
 * metatiedoille (src/seo/staticPageMeta.ts) ja esirenderöinnille (src/seo/prerender/pages.ts).
 * Kevään sivun sisältö: src/data/pikkujoulutYrityksetPage.ts pikkujoulutKevatPage.
 */
import { tanaanHelsinki, YRITYS_JOULU_TAKARAJA_ISO } from "../../api/_lib/yritysmyynti.js";
import { MAARAALENNUS } from "../../api/_lib/vakiot.js";

export type PikkujoulutKausi = "joulu" | "kevat";

/** Yritysten joulutilaukset auki takarajapäivän loppuun (Suomen aika). */
export const yritysJouluAuki = (nyt: Date = new Date()): boolean => tanaanHelsinki(nyt) <= YRITYS_JOULU_TAKARAJA_ISO;

export const pikkujoulutKausi = (nyt: Date = new Date()): PikkujoulutKausi => (yritysJouluAuki(nyt) ? "joulu" : "kevat");

const PORTAAT = [...MAARAALENNUS.portaat].sort((a, b) => a.min - b.min);

export const PIKKUJOULUT_JOULU_META = {
  title: "Pikkujoulupaidat yrityksille | Huumorikauppa",
  description:
    "Pikkujoulupaketit yrityksille: 10, 25 tai 50 t-paitaa eri vitseillä ja oma kokojakauma. Hinta näkyy heti, toimitus yhteen osoitteeseen.",
  h1: "Pikkujoulupaidat yrityksille: valmiit paketit",
  name: "Pikkujoulupaketit yrityksille",
  intro:
    "Valitse paketti, vaihda halutessasi designeja ja aseta kokojakauma. Hinta päivittyy heti, ja tarjouspyyntö lähtee samalla lomakkeella.",
};

export const PIKKUJOULUT_KEVAT_META = {
  title: "Tiimipaidat kevään tapahtumiin | Huumorikauppa",
  description:
    `Tiimipaidat kevään tapahtumiin ja virkistyspäiviin: määräalennus ${PORTAAT[0].min} t-paidasta alkaen, toimitus yhteen osoitteeseen, maksu kortilla tai laskulla.`,
  h1: "Tiimipaidat kevään tapahtumiin ja virkistyspäiviin",
  name: "Tiimipaidat kevään tapahtumiin",
  intro:
    "Hauska yhteinen paita kokoaa tiimin kevään tapahtumaan, virkistyspäivään tai tiimipäivään. Valitse valmiit huumoridesignit tai tilaa paidat yrityksen omalla logolla tai tekstillä.",
};

export const pikkujoulutMeta = (nyt: Date = new Date()) => (pikkujoulutKausi(nyt) === "joulu" ? PIKKUJOULUT_JOULU_META : PIKKUJOULUT_KEVAT_META);

