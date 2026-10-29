/**
 * /ryhmatilaukset: sisältö React-sivulle (src/pages/GroupOrderPage.tsx) ja esirenderöinnille
 * (src/seo/prerender/pages.ts). Ryhmätilaus = vähintään RYHMATILAUS_VAHIMMAISMAARA tuotetta samalle porukalle.
 *
 * Säännöt: ei hintalupauksia, alennuksia eikä määrähintoja (kate ei kestä niitä). Toimitusmaksu, toimitusaika ja
 * joulun tilauspäivä tulevat vakioista (src/config/toimitus.ts, src/data/christmas.ts). Ei ajatusviivoja.
 * Tarkistus: src/data/ryhmatilausPage.test.ts.
 */
import { CHRISTMAS_DEADLINE_PATH, CHRISTMAS_DEADLINE_PROMISE } from "./christmas";
import { TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_LAUSE } from "../config/toimitus";
import { ORGANIZATION } from "../seo/site";
import { STATIC_PAGE_META } from "../seo/staticPageMeta";

export const RYHMATILAUS_PATH = "/ryhmatilaukset";
/** Ryhmätilauksen vähimmäismäärä (tuotetta). */
export const RYHMATILAUS_VAHIMMAISMAARA = 5;

const SUBJECT = "Ryhmätilaus";
const BODY = [
  "Hei,",
  "",
  `suunnittelemme ryhmätilausta (${RYHMATILAUS_VAHIMMAISMAARA} tai useampi tuote).`,
  "",
  "Porukka (pikkujoulut, kerho, seura tai työpaikka):",
  "Tuotteet (linkit tai nimet):",
  "Määrät, koot ja värit:",
  "Oma teksti tai kuvatoive:",
  "Milloin tuotteet tarvitaan:",
  "",
].join("\n");

/** mailto-linkki valmiilla aiheella ja runkopohjalla. */
export const RYHMATILAUS_MAILTO = `mailto:${ORGANIZATION.email}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`;

const meta = STATIC_PAGE_META[RYHMATILAUS_PATH];

export const ryhmatilausPage = {
  path: RYHMATILAUS_PATH,
  name: meta.name,
  title: meta.title,
  description: meta.description,
  h1: meta.h1,
  email: ORGANIZATION.email,
  mailto: RYHMATILAUS_MAILTO,
  intro: [
    meta.intro,
    `Jokainen tuote painetaan tilauksesta painokumppaneidemme painotaloissa. Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta, ja toimitusmaksu määräytyy tavallisten toimitusehtojen mukaan.`,
  ],
  sections: [
    {
      heading: "Kenelle ryhmätilaus sopii",
      paragraphs: [
        "Ryhmätilaus sopii porukalle, joka haluaa samat tai samaan teemaan sopivat paidat tai hupparit. Tyypillisiä tilaajia ovat:",
      ],
      items: [
        "Pikkujoulut: koko tiimille tai kaveriporukalle jouluaiheiset paidat tai porukan oma teksti.",
        "Kerhot ja seurat: kuorot, urheiluseurat, harrastuskerhot ja yhdistykset, joille seuran nimi tai tunnuslause painetaan paitaan.",
        "Työpaikat: tiimipäivät, työpaikan juhlat ja läksiäiset, joihin sopii ammattiaiheinen vitsi tai tiimin oma teksti.",
      ],
    },
    {
      heading: "Näin ryhmätilaus etenee",
      paragraphs: [],
      items: [
        "Valitkaa tuotteet: valmis teksti valikoimasta tai Oma teksti/kuva -tuote, johon painetaan porukan oma teksti tai kuvatoive.",
        "Kerätkää jokaisen nimi, tuote, koko ja väri yhteen listaan. Pyytäkää jokaista vertaamaan oman paitansa mittoja tuotteen mittoihin.",
        `Lähettäkää lista sähköpostilla osoitteeseen ${ORGANIZATION.email}. Vastaamme 1-2 arkipäivässä ja autamme valitsemaan tuotteet ja tarkistamaan oman tekstin ennen tilausta.`,
        "Tilaus tehdään verkkokaupassa tavalliseen tapaan: jokainen tuote lisätään ostoskoriin oikealla koolla ja värillä, ja tilaus maksetaan kassalla.",
        `Jokainen tuote painetaan tilauksen jälkeen. Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta.`,
      ],
    },
    {
      heading: "Toimitus ja hinnat",
      paragraphs: [
        `${TOIMITUSMAKSU_LAUSE} Sama sääntö koskee ryhmätilauksia.`,
        "Ryhmätilauksen tuotteet maksavat saman verran kuin verkkokaupassa. Hinnat näkyvät tuotesivuilla.",
        "Personoituja Oma teksti/kuva -tuotteita ei voi palauttaa, koska ne tehdään tilaajan toiveen mukaan. Tarkistakaa teksti ja kirjoitusasu ennen tilausta.",
      ],
    },
    {
      heading: "Pikkujoulut ja joulu",
      paragraphs: [
        `Pikkujouluja vietetään marras- ja joulukuussa, joten kokojen keruu kannattaa aloittaa ajoissa. ${CHRISTMAS_DEADLINE_PROMISE}`,
      ],
    },
  ],
  faqs: [
    {
      q: "Mikä on ryhmätilaus?",
      a: `Ryhmätilaus on tilaus, jossa samalle porukalle tilataan ${RYHMATILAUS_VAHIMMAISMAARA} tai useampi tuote. Se sopii pikkujouluihin, kerhoille, seuroille ja työpaikoille.`,
    },
    {
      q: "Miten ryhmätilaus tehdään?",
      a: `Kerätkää tuotteet, koot ja värit listaksi ja lähettäkää se osoitteeseen ${ORGANIZATION.email}. Autamme tuotteiden valinnassa, ja tilaus tehdään verkkokaupassa tavalliseen tapaan.`,
    },
    {
      q: "Saako ryhmätilauksesta alennusta?",
      a: "Ei saa. Tuotteet maksavat saman verran kuin verkkokaupassa, ja toimitusmaksu määräytyy tavallisten toimitusehtojen mukaan.",
    },
    {
      q: "Voiko kaikkiin paitoihin painaa saman oman tekstin?",
      a: "Voi. Valitkaa Oma teksti/kuva -tuote ja kirjoittakaa sama teksti jokaiseen tilattavaan tuotteeseen.",
    },
    {
      q: "Kauanko ryhmätilauksen toimitus kestää?",
      a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta. Jokainen tuote painetaan tilauksen jälkeen painokumppaneidemme painotaloissa.`,
    },
    { q: "Ehtiikö ryhmätilaus jouluksi?", a: CHRISTMAS_DEADLINE_PROMISE },
  ],
  /** Sisäiset linkit: ideat ja tilausaikataulu. */
  links: [
    { href: "/yritykset", label: "Yritysten joululahjat ja määräalennus (10+ t-paitaa)" },
    { href: "/blogi/pikkujoulupaidat-porukalle", label: "Opas: pikkujoulupaidat porukalle" },
    { href: "/blogi/pikkujoulujen-lahjapeli", label: "Opas: pikkujoulujen lahjapeli" },
    { href: "/blogi/pikkujouluohjelma-tyopaikalle", label: "Opas: pikkujouluohjelmaa työpaikalle" },
    { href: "/blogi/joululahja-tyontekijoille", label: "Opas: joululahja työntekijöille" },
    { href: "/lahjat/pikkujouluihin", label: "Pikkujoululahjat" },
    { href: "/ammattipaidat", label: "Ammattipaidat" },
    { href: "/joululahja-tyokaverille", label: "Joululahja työkaverille" },
    { href: CHRISTMAS_DEADLINE_PATH, label: "Joulun viimeiset tilauspäivät" },
    { href: "/toimitusehdot", label: "Toimitusehdot" },
  ],
};
