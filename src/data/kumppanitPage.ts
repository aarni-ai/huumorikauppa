/**
 * /kumppanit: kumppanuusohjelma sisällöntuottajille (sisältö React-sivulle src/pages/PartnersPage.tsx ja
 * esirenderöintiin). Sääntö ja esimerkit lasketaan samalla funktiolla kuin raportti (api/_lib/kumppani.js).
 */
import { PROVISIOSAANTO, provisioJaTila } from "../../api/_lib/kumppani.js";
import { KUMPPANUUS } from "../../api/_lib/vakiot.js";

const eur = (x: number) => `${x.toFixed(2).replace(".", ",")} €`;

/** Esimerkkitilaukset (KATTEET.md korien nettokatteet ennen provisiota). */
const ESIMERKIT = [
  { kori: "1 t-paita, 24,90 €", tuotteet: 24.9, kate: 7.22 },
  { kori: "2 t-paitaa, 47,31 € (kahden tuotteen -5 %)", tuotteet: 47.31, kate: 14.65 },
  { kori: "1 huppari, 49,99 €", tuotteet: 49.99, kate: 7.86 },
  { kori: "25 t-paitaa yritykselle, 547,80 € (määräalennus -12 %)", tuotteet: 547.8, kate: 158.89 },
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
