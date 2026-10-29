/**
 * /kumppanit: kumppanuusohjelma sisällöntuottajille (sisältö React-sivulle src/pages/PartnersPage.tsx ja
 * esirenderöintiin). Sääntö ja esimerkit lasketaan samalla funktiolla kuin raportti (api/_lib/kumppani.js).
 */
import { PROVISIOSAANTO, provisioJaTila } from "../../api/_lib/kumppani.js";
import { KUMPPANUUS } from "../../api/_lib/vakiot.js";

const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;

/**
 * Esimerkkitilaukset (KATTEET.md "Hinnoittelu 29.10.2026": korien nettokatteet ennen provisiota uusilla hinnoilla).
 * Kauppaan jää provision jälkeen vähintään KUMPPANUUS.minKateEuroa (7 €).
 */
const ESIMERKIT = [
  { kori: "1 t-paita, 27,90 €", tuotteet: 27.9, kate: 9.57 },
  { kori: "1 meemipaita, 24,90 €", tuotteet: 24.9, kate: 7.22 },
  { kori: "2 t-paitaa, 53,01 € (kahden tuotteen -5 %)", tuotteet: 53.01, kate: 19.11 },
  { kori: "1 huppari, 52,90 €", tuotteet: 52.9, kate: 10.14 },
  { kori: "25 meemipaitaa yritykselle, 547,80 € (määräalennus -12 %)", tuotteet: 547.8, kate: 158.89 },
];

export const kumppanitPage = {
  path: "/kumppanit",
  intro: [
    "Huumorikaupan kumppanina saat provision tilauksista, jotka tulevat oman linkkisi tai kumppanikoodisi kautta. Ohjelma sopii sisällöntuottajille, joiden seuraajat arvostavat suomalaista huumoria.",
    PROVISIOSAANTO,
  ],
  esimerkit: ESIMERKIT.map((e) => ({ kori: e.kori, provisio: eur(provisioJaTila(e.tuotteet, e.kate).provisio) })),
  sections: [
    {
      heading: "Näin kumppanuus toimii",
      items: [
        "Saat oman kumppanikoodin, esimerkiksi anna-k, ja linkin muotoa huumorikauppa.fi/?ref=anna-k. Linkin voi lisätä minkä tahansa sivun perään.",
        "Tilaus kirjataan sinulle, kun ostaja tulee linkistäsi ja tilaa samalla käynnillä, tai kun ostaja kirjoittaa koodisi kassan kenttään Kumppanikoodi.",
        "Ostaja maksaa tavallisen hinnan. Kumppanikoodi ei ole alennuskoodi.",
        "Merkitse julkaisut mainonnaksi, esimerkiksi Kaupallinen yhteistyö: Huumorikauppa.",
      ],
    },
    {
      heading: "Provisio",
      paragraphs: [
        PROVISIOSAANTO,
        `Tuotteiden arvo lasketaan alennusten jälkeen. Provisio lasketaan maksetuista tilauksista, ja enimmäismäärä on ${KUMPPANUUS.provisioProsentti} %.`,
      ],
    },
    {
      heading: "Tilitys kerran kuussa",
      paragraphs: [
        "Provisiot tilitetään kerran kuussa edellisen kalenterikuukauden tilauksista, kun 14 päivän palautusaika on päättynyt. Palautetuista ja perutuista tilauksista ei makseta provisiota. Saat kuukausiraportin, jossa on tilaukset ja provisio tilauksittain.",
      ],
    },
    {
      heading: "Yhteys",
      paragraphs: ["Kerro kanavasi ja yleisösi sähköpostilla huumorikauppa@gmail.com, niin sovimme kumppanuudesta ja lähetämme kumppanikoodisi."],
    },
  ],
  faqs: [
    { q: "Paljonko provisio on?", a: PROVISIOSAANTO },
    { q: "Milloin provisio maksetaan?", a: "Kerran kuussa edellisen kalenterikuukauden tilauksista, kun 14 päivän palautusaika on päättynyt." },
    { q: "Saako ostaja alennuksen?", a: "Ei. Kumppanikoodi kertoo, että tilaus tuli sinun kauttasi. Ostaja maksaa tavallisen hinnan." },
    { q: "Miten pääsen mukaan?", a: "Lähetä sähköposti osoitteeseen huumorikauppa@gmail.com ja kerro kanavasi ja yleisösi." },
  ],
};
