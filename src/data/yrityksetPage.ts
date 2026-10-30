/**
 * /yritykset: yritysten joululahjat ja tiimipaidat. Sama sisältö React-sivulle (src/pages/BusinessPage.tsx) ja
 * esirenderöintiin (src/seo/prerender/pages.ts). Portaat api/_lib/vakiot.js MAARAALENNUS (KATTEET.md
 * "Määräalennus yrityksille"), joulun päivä lasketaan (src/data/tilauspaivat.ts).
 */
import { MAARAALENNUS } from "../../api/_lib/vakiot.js";
import { esimerkkiHinnat, YRITYS_JOULU_TAKARAJA_ISO, paivaTeksti } from "../../api/_lib/yritysmyynti.js";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI } from "@/config/toimitus";
import { jouluAuki, JOULU_TPAITA_PAIVA_TEKSTI } from "./tilauspaivat";
import { CHRISTMAS_DEADLINE_PATH } from "./christmas";

const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;

/** Portaat pienimmästä suurimpaan. */
export const YRITYS_PORTAAT = [...MAARAALENNUS.portaat].sort((a, b) => a.min - b.min);

/** Esimerkkilasku: N t-paitaa portaan alennuksella. */
export function yritysEsimerkki(n: number): { kpl: number; ennen: string; prosentti: number; jalkeen: string } {
  const porras = [...YRITYS_PORTAAT].reverse().find((p) => n >= p.min);
  const summa = n * MAARAALENNUS.kappalehinta;
  const prosentti = porras?.prosentti ?? 0;
  return { kpl: n, ennen: eur(summa), prosentti, jalkeen: eur(summa * (1 - prosentti / 100)) };
}

const JOULU = jouluAuki()
  ? `T-paidat ehtivät jouluksi, kun tilaus on tehty viimeistään ${JOULU_TPAITA_PAIVA_TEKSTI}. Isossa tilauksessa jätä aikaa myös kokojen keräämiseen.`
  : `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta.`;

/** Yritysten joulutakaraja tekstinä, esim. "to 26.11." (api/_lib/yritysmyynti.js). */
export const YRITYS_JOULU_TEKSTI = paivaTeksti(YRITYS_JOULU_TAKARAJA_ISO);

/** Pakettitarjoukset kolmeen yleisimpään tilanteeseen; esimerkkihinnat 10, 25 ja 50 paidalle (koot M-XL). */
export const YRITYS_PAKETIT = [
  {
    id: "pikkujoulu",
    otsikko: "Pikkujoulupaita koko tiimille",
    kuvaus: "Sama pikkujoulupaita tai jokaiselle oma vitsi. Paidat tulevat yhteen osoitteeseen ennen pikkujouluja.",
    malli: "tpaita",
    linkki: { href: "/lahjat/pikkujouluihin", label: "Pikkujoulupaidat" },
    esimerkit: esimerkkiHinnat("tpaita"),
  },
  {
    id: "joululahja",
    otsikko: "Joululahja asiakkaille ja henkilökunnalle",
    kuvaus: "Meemipaita on joululahja, joka otetaan käyttöön. Paidat voivat olla eri designeja ja kokoja.",
    malli: "meemipaita",
    linkki: { href: "/meemipaidat", label: "Meemipaidat" },
    esimerkit: esimerkkiHinnat("meemipaita"),
  },
  {
    id: "tyomaa",
    otsikko: "Työmaa- tai tiimipaita",
    kuvaus: "Ammatti- tai tiimihuumoria koko porukalle, esimerkiksi rakennusmiehille, hoitajille tai IT-tiimille.",
    malli: "tpaita",
    linkki: { href: "/ammattipaidat", label: "Ammattipaidat" },
    esimerkit: esimerkkiHinnat("tpaita"),
  },
] as const;

export const yrityksetPage = {
  path: "/yritykset",
  intro: [
    `Huumorikaupan t-paidat ovat yrityksen joululahja tai tiimipaita, joka tulee käyttöön. Kun samassa tilauksessa on vähintään ${YRITYS_PORTAAT[0].min} t-paitaa, kassa vähentää määräalennuksen automaattisesti ilman koodia.`,
    `Määräalennus koskee kaikkia t-paitoja, ja paidat voivat olla eri designeja, kokoja ja värejä. Esimerkit on laskettu ${eur(MAARAALENNUS.kappalehinta)}:n t-paidoilla.`,
  ],
  portaat: YRITYS_PORTAAT.map((p) => ({ teksti: `${p.min}+ t-paitaa`, prosentti: p.prosentti })),
  esimerkit: [10, 25, 50].map(yritysEsimerkki),
  sections: [
    {
      heading: "Edut yritykselle",
      items: [
        `Määräalennus ${YRITYS_PORTAAT.map((p) => `${p.min}+ paitaa -${p.prosentti} %`).join(", ")} lasketaan kassalla automaattisesti.`,
        `Toimitus on ilmainen ${ILMAINEN_RAJA_TEKSTI} euron tilauksista alkaen, joten kymmenen t-paidan tilaus toimitetaan ilman toimituskuluja.`,
        "Paidat painetaan tilauksesta EU:ssa, ja jokaisella tuotesivulla on kokotaulukko senttimetreinä.",
        "Valikoimassa on satoja valmiita designeja, esimerkiksi ammatti-, harrastus- ja meemipaidat.",
      ],
    },
    {
      heading: "Toimitus yhteen osoitteeseen",
      paragraphs: [
        `Yksi tilaus toimitetaan yhteen osoitteeseen, esimerkiksi toimistolle. Jos paidat lähetetään usealle vastaanottajalle, jokainen osoite tarvitsee oman tilauksensa, ja määräalennus lasketaan tilauskohtaisesti. Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää.`,
      ],
    },
    {
      heading: "Laskutus ja kuitti",
      paragraphs: [
        "Myyjä on Uusiku Oy (Y-tunnus 3653666-7, ALV-numero FI36536667). Kassalla maksetaan Visalla, Mastercardilla, Apple Paylla, Google Paylla, Klarnalla tai MobilePaylla, ja kuitti tulee sähköpostiin Uusiku Oy:n nimissä.",
        "Jos yritys tarvitsee laskun, lähetä tarjouspyyntö alla olevalla lomakkeella, niin laskutuksesta sovitaan sähköpostilla.",
      ],
    },
    {
      heading: "Viimeinen tilauspäivä jouluksi",
      paragraphs: [JOULU],
      links: [{ href: CHRISTMAS_DEADLINE_PATH, label: "Joulun viimeiset tilauspäivät" }],
    },
  ],
  faqs: [
    {
      q: "Miten määräalennus toimii?",
      a: `Lisää koriin vähintään ${YRITYS_PORTAAT[0].min} t-paitaa. Kassa laskee alennuksen automaattisesti: ${YRITYS_PORTAAT.map((p) => `${p.min}+ t-paitaa -${p.prosentti} %`).join(", ")}. Alennuskoodia ei tarvita.`,
    },
    {
      q: "Voiko paidat olla eri designeja ja kokoja?",
      a: "Voi. Määräalennus lasketaan kaikista samassa tilauksessa olevista t-paidoista designista, koosta ja väristä riippumatta.",
    },
    {
      q: "Koskeeko määräalennus huppareita?",
      a: "Ei. Määräalennus koskee t-paitoja. Hupparit saavat kahden tuotteen alennuksen -5 %, kun korissa on vähintään kaksi tuotetta.",
    },
    {
      q: "Voiko paidat toimittaa usealle vastaanottajalle?",
      a: "Yksi tilaus toimitetaan yhteen osoitteeseen. Usealle vastaanottajalle tehdään erillinen tilaus jokaiseen osoitteeseen.",
    },
    {
      q: "Saako yritys laskun?",
      a: "Lähetä tarjouspyyntö lomakkeella, niin laskutuksesta sovitaan sähköpostilla. Kassalla maksettaessa kuitti tulee Uusiku Oy:n nimissä.",
    },
  ],
  links: [
    { href: "/ryhmatilaukset", label: "Ryhmätilaukset pikkujouluihin ja kerhoille" },
    { href: "/ammattipaidat", label: "Ammattipaidat" },
    { href: "/joululahja-tyokaverille", label: "Joululahja työkaverille" },
    { href: "/blogi/joululahja-tyontekijoille", label: "Opas: joululahja työntekijöille" },
  ],
};
