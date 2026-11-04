/**
 * Joulukalenterin luukut 1.-24.12.2026. VAIN PALVELIMELLA: tätä tiedostoa ei saa tuoda selaimen koodiin (src/), jotta
 * tulevien luukkujen tuotteet ja hinnat eivät päädy staattiseen pakettiin (src/test/joulukalenteri.test.ts tarkistaa).
 * Rajapinta /api/products?joulukalenteri=1 palauttaa vain tämän päivän luukun tuotteen ja hinnan.
 *
 * Generoitu: node scripts/joulukalenteri-valinta.mjs (2026-11-04, lähde: etusivun suosituimmat (top50.generated.js) ja tuotannon tuotekuva 3.11.2026).
 * paiva = joulukuun päivä, hinta = luukun hinta perushinnalle (muut koot saman euromäärän alennuksella),
 * normaali = perushinta valintahetkellä, valinnainen kpl (sarja), koot ja varit (rajaus).
 */
export const JOULUKALENTERI = [
  { paiva: 1, slug: "elakelainen-aamuheratys-vapaaehtoinen-t-paita", nimi: "Eläkeläinen: aamuherätys vapaaehtoinen | T-Paita", normaali: 27.9, hinta: 24.9 }, // kate vähintään 7,22 €/kpl
  { paiva: 2, slug: "maailman-paras-aiti-huppari", nimi: "maailman paras ÄITI | Huppari", normaali: 52.9, hinta: 49.9 }, // kate vähintään 7,79 €/kpl
  { paiva: 3, slug: "elakelainen-ala-soita-ennen-kymmenta-t-paita-elakelaiselle", nimi: "Eläkeläinen. Älä soita ennen kymmentä | T-paita eläkeläiselle", normaali: 27.9, hinta: 24.9 }, // kate vähintään 7,22 €/kpl
  { paiva: 4, slug: "tonnin-seteli-huppari", nimi: "Tonnin Seteli | Huppari", normaali: 52.9, hinta: 49.9 }, // kate vähintään 7,79 €/kpl
  { paiva: 5, slug: "50-ja-hopeanhohtoinen-vain-hiukset-t-paita", nimi: "50 ja hopeanhohtoinen (vain hiukset) | T-Paita", normaali: 27.9, hinta: 24.9 }, // kate vähintään 7,22 €/kpl
  { paiva: 6, slug: "saatanan-tunarit-huppari", nimi: "Saatanan Tunarit | Huppari", normaali: 52.9, hinta: 49.9 }, // kate vähintään 7,79 €/kpl
  { paiva: 7, slug: "50-ja-paras-vasta-tulossa-t-paita", nimi: "50 ja paras vasta tulossa | T-Paita", normaali: 27.9, hinta: 24.9 }, // kate vähintään 7,22 €/kpl
  { paiva: 8, slug: "se-oli-tonnin-seteli-huppari", nimi: "se oli tonnin seteli. | Huppari", normaali: 52.9, hinta: 49.9 }, // kate vähintään 7,79 €/kpl
  { paiva: 9, slug: "hauska-t-paita-60-vuotiaalle-60-vuotta-kokemusta-loytyy", nimi: "Hauska T-Paita 60-Vuotiaalle: 60 Vuotta Kokemusta Löytyy", normaali: 27.9, hinta: 24.9 }, // kate vähintään 7,22 €/kpl
  { paiva: 10, slug: "lahjakortti-on-myos-lahja-huppari-jouluun", nimi: "Lahjakortti on myös lahja | Huppari jouluun", normaali: 52.9, hinta: 49.9 }, // kate vähintään 7,57 €/kpl, jouluaiheinen
  { paiva: 11, slug: "lahjatoive-hiljaisuus-t-paita-jouluun", nimi: "Lahjatoive: hiljaisuus | T-paita jouluun", normaali: 27.9, hinta: 24.9 }, // kate vähintään 7,22 €/kpl, jouluaiheinen
  { paiva: 12, slug: "ostin-itselleni-lahjan-varmuuden-vuoksi-huppari-jouluun", nimi: "Ostin itselleni lahjan. Varmuuden vuoksi | Huppari jouluun", normaali: 52.9, hinta: 49.9 }, // kate vähintään 7,57 €/kpl, jouluaiheinen
  { paiva: 13, slug: "kolmas-glogi-nyt-laulan-t-paita-jouluun", nimi: "Kolmas glögi. Nyt laulan | T-paita jouluun", normaali: 27.9, hinta: 24.9 }, // kate vähintään 7,22 €/kpl, jouluaiheinen
  { paiva: 14, slug: "kuuma-glogi-kylma-talvi-taydellista-huppari-jouluun", nimi: "Kuuma glögi. Kylmä talvi. Täydellistä | Huppari jouluun", normaali: 52.9, hinta: 49.9 }, // kate vähintään 7,57 €/kpl, jouluaiheinen
  { paiva: 15, slug: "glogin-virallinen-maistaja-t-paita-jouluun", nimi: "Glögin virallinen maistaja | T-paita jouluun", normaali: 27.9, hinta: 24.9 }, // kate vähintään 7,22 €/kpl, jouluaiheinen
  { paiva: 16, slug: "glogi-ilman-rusinoita-huppari-jouluun", nimi: "Glögi. Ilman rusinoita | Huppari jouluun", normaali: 52.9, hinta: 49.9 }, // kate vähintään 7,57 €/kpl, jouluaiheinen
  { paiva: 17, slug: "joulukinkun-suojelija-t-paita-jouluun", nimi: "Joulukinkun suojelija | T-paita jouluun", normaali: 27.9, hinta: 24.9 }, // kate vähintään 7,22 €/kpl, jouluaiheinen
  { paiva: 18, slug: "sinappia-riittaa-kinkkua-ei-huppari-jouluun", nimi: "Sinappia riittää. Kinkkua ei | Huppari jouluun", normaali: 52.9, hinta: 49.9 }, // kate vähintään 7,57 €/kpl, jouluaiheinen
  { paiva: 19, slug: "kinkkuvahti-ala-koske-t-paita-jouluun", nimi: "Kinkkuvahti. Älä koske | T-paita jouluun", normaali: 27.9, hinta: 24.9 }, // kate vähintään 7,22 €/kpl, jouluaiheinen
  { paiva: 20, slug: "kinkku-on-minun-rakkauskieleni-huppari-jouluun", nimi: "Kinkku on minun rakkauskieleni | Huppari jouluun", normaali: 52.9, hinta: 49.9 }, // kate vähintään 7,57 €/kpl, jouluaiheinen
  { paiva: 21, slug: "maailman-paras-anoppi-sanoi-anoppi-t-paita-jouluun", nimi: "Maailman paras anoppi. Sanoi anoppi | T-paita jouluun", normaali: 27.9, hinta: 24.9 }, // kate vähintään 7,22 €/kpl, jouluaiheinen
  { paiva: 22, slug: "anoppi-arvioi-mina-hymyilen-huppari-jouluun", nimi: "Anoppi arvioi. Minä hymyilen | Huppari jouluun", normaali: 52.9, hinta: 49.9 }, // kate vähintään 7,57 €/kpl, jouluaiheinen
  { paiva: 23, slug: "anopin-joulukinkku-on-parempi-t-paita-jouluun", nimi: "Anopin joulukinkku on parempi | T-paita jouluun", normaali: 27.9, hinta: 24.9 }, // kate vähintään 7,22 €/kpl, jouluaiheinen
  { paiva: 24, slug: "poly-on-osa-joulutunnelmaa-huppari-jouluun", nimi: "Pöly on osa joulutunnelmaa | Huppari jouluun", normaali: 52.9, hinta: 49.9 }, // kate vähintään 7,57 €/kpl, jouluaiheinen
];

export default JOULUKALENTERI;
