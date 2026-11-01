/**
 * /kumppanit: kumppanuusohjelma sisällöntuottajille (sisältö React-sivulle src/pages/PartnersPage.tsx ja
 * esirenderöintiin). Sääntö ja esimerkit lasketaan samalla funktiolla kuin raportti (api/_lib/kumppani.js).
 */
import { PROVISIOSAANTO, ALENNUSMALLI_SAANTO, provisioJaTila } from "../../api/_lib/kumppani.js";
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

/**
 * Malli 2 esimerkkikorille (sama sääntö kuin kassalla, api/_lib/kumppani.js valitseKumppaniAlennus): suurin alennus
 * 5 %:sta alaspäin, jolla kauppaan jää provision jälkeen 7 €. hinta = tuotteet ennen alennusta, kate = nettokate ilman
 * alennusta (KATTEET.md).
 */
export function malli2Esimerkki(hinta: number, kate: number) {
  const { alennusProsentti, provisioProsentti } = KUMPPANUUS.alennusmalli;
  for (let p = alennusProsentti; p >= 1; p--) {
    const tuotteet = hinta * (1 - p / 100);
    const ale = hinta - tuotteet;
    const nk = kate - ale * (1 / 1.255 - 0.015);
    const prov = (tuotteet / 1.255) * (Math.min(p, provisioProsentti) / 100);
    if (nk - prov >= KUMPPANUUS.minKateEuroa) return { prosentti: p, alennus: ale, provisio: prov };
  }
  return { prosentti: 0, alennus: 0, provisio: 0 };
}

const ESIMERKIT2 = [
  { kori: "1 t-paita, 27,90 €", tuotteet: 27.9, kate: 9.57 },
  { kori: "1 meemipaita, 24,90 €", tuotteet: 24.9, kate: 7.22 },
  { kori: "1 huppari, 52,90 €", tuotteet: 52.9, kate: 10.14 },
];

export const kumppanitPage = {
  path: "/kumppanit",
  intro: [
    "Huumorikaupan kumppanina saat provision tilauksista, jotka tulevat oman linkkisi tai kumppanikoodisi kautta. Ohjelma sopii sisällöntuottajille, joiden seuraajat arvostavat suomalaista huumoria.",
    "Valitse kahdesta mallista: malli 1 antaa sinulle suuremman provision, malli 2 antaa seuraajillesi alennuksen.",
  ],
  mallit: [
    { otsikko: "Malli 1: provisio", saanto: PROVISIOSAANTO, ostaja: "Ostaja maksaa tavallisen hinnan." },
    { otsikko: `Malli 2: seuraajille -${KUMPPANUUS.alennusmalli.alennusProsentti} %`, saanto: ALENNUSMALLI_SAANTO, ostaja: `Kassalla näkyy esimerkiksi "Koodi ANNA-K: -${KUMPPANUUS.alennusmalli.alennusProsentti} %".` },
  ],
  esimerkit2: ESIMERKIT2.map((e) => {
    const m = malli2Esimerkki(e.tuotteet, e.kate);
    return { kori: e.kori, alennus: m.prosentti ? `-${m.prosentti} % (${eur(m.alennus)})` : "ei alennusta", provisio: eur(m.provisio) };
  }),
  esimerkit: ESIMERKIT.map((e) => ({ kori: e.kori, provisio: eur(provisioJaTila(e.tuotteet, e.kate).provisio) })),
  sections: [
    {
      heading: "Näin kumppanuus toimii",
      items: [
        "Saat oman kumppanikoodin, esimerkiksi anna-k, ja oman sivun huumorikauppa.fi/k/anna-k, joka toivottaa kävijät tervetulleiksi nimelläsi ja tallentaa koodin 30 päiväksi, joten sitä ei tarvitse kirjoittaa kassalla. Suoraan tuotteeseen vievä linkki on muotoa huumorikauppa.fi/k/anna-k/tuote/tuotteen-nimi, ja sekin tallentaa koodin.",
        "Tilaus kirjataan sinulle, kun ostaja tulee linkistäsi ja tilaa samalla laitteella koodin ollessa tallessa (30 päivää), tai kun ostaja kirjoittaa koodisi kassan kenttään Kumppanikoodi.",
        "Mallissa 1 ostaja maksaa tavallisen hinnan. Mallissa 2 koodi antaa ostajalle alennuksen, ja kassa näyttää sen.",
        "Merkitse julkaisut mainonnaksi, esimerkiksi Kaupallinen yhteistyö: Huumorikauppa.",
      ],
    },
    {
      heading: "Provisio",
      paragraphs: [
        `Tuotteiden arvo lasketaan alennusten jälkeen. Provisio lasketaan maksetuista tilauksista: mallissa 1 enintään ${KUMPPANUUS.provisioProsentti} %, mallissa 2 enintään ${KUMPPANUUS.alennusmalli.provisioProsentti} %. Malli valitaan, kun kumppanuudesta sovitaan.`,
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
    { q: "Paljonko provisio on?", a: `Malli 1: ${PROVISIOSAANTO} Malli 2: ${ALENNUSMALLI_SAANTO}` },
    { q: "Milloin provisio maksetaan?", a: "Kerran kuussa edellisen kalenterikuukauden tilauksista, kun 14 päivän palautusaika on päättynyt." },
    { q: "Saako ostaja alennuksen?", a: `Mallissa 2 saa: ostaja saa koodilla -${KUMPPANUUS.alennusmalli.alennusProsentti} % tuotteista, jos tilauksen kate riittää. Mallissa 1 ostaja maksaa tavallisen hinnan.` },
    { q: "Miten pääsen mukaan?", a: "Lähetä sähköposti osoitteeseen huumorikauppa@gmail.com ja kerro kanavasi ja yleisösi." },
  ],
};
