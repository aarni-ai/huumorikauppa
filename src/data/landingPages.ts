/**
 * Laskeutumissivut (seo/avainsanat.csv, prioriteetit 1 ja 2). Yksi lähde React-sivulle
 * (src/pages/LandingPage.tsx), esirenderöinnille (src/seo/prerender/pages.ts), sivukartalle
 * (api/sitemap.js, synkronointi testattu) ja Joululahjat-valikolle.
 *
 * Tuotesääntö: sivulla näytetään vain myynnissä olevia tuotteita (use-products.ts ja
 * normalizeProducts suodattavat luonnokset ja piilotetut kategoriat, mm. mukit), jotka sivun
 * suodatin hyväksyy. Sivu julkaistaan vain, jos sopivia tuotteita on vähintään 8
 * (LANDING_MIN_PRODUCTS, testattu tuotedatan tilannekuvaa vasten). Liian pienet sivut on
 * yhdistetty lähimpään sivuun (LANDING_REDIRECTS + vercel.json).
 *
 * Tekstisäännöt: ei ajatusviivoja, ei todistamattomia superlatiiveja, ei väitettä painatuksesta
 * Suomessa, ei muuta joulun tilauspäivää kuin src/data/christmas.ts.
 */
import type { Product } from "@/types/product";
import { getPriorityRank } from "@/lib/productPriority";
import { onPiilotettuTuote } from "@/lib/hiddenCategories";
import { CHRISTMAS_DEADLINE_PROMISE } from "./christmas";
import { FATHERS_DAY_LAST_ORDER_TEXT, FATHERS_DAY_TEXT } from "./campaignSchedule";
import { LANDING_REDIRECTS } from "./landingRoutes";
import {
  AMMATTI,
  ELAKE,
  HARRASTUS,
  isCityProduct,
  MEEMI,
  SETA,
  SUOMI,
  SUOMI_MEEMIT,
  theme,
  TONNIN_SETELI,
  TONNIN_SETELI_PATH,
} from "./themes";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "@/config/toimitus";

export { isCityProduct, TONNIN_SETELI, TONNIN_SETELI_PATH } from "./themes";
export { LANDING_PATHS, LANDING_REDIRECTS, NOT_CREATED_LANDINGS, CHRISTMAS_MENU, FATHERS_DAY_MENU } from "./landingRoutes";

export const LANDING_MIN_PRODUCTS = 8;
/** Tuoteruudukossa ja ItemListissä näytetään enintään näin monta tuotetta. */
export const LANDING_GRID_LIMIT = 48;

export type LandingGroup = "joulu" | "lahjat" | "tuotteet";

export interface LandingFaq {
  q: string;
  a: string;
}

/** Suodattimen näkemä tuote (sama muoto kuin use-products.ts ja normalizeProducts). */
export type LandingProduct = Pick<Product, "id" | "name" | "slug" | "category" | "price" | "description"> &
  Partial<Pick<Product, "humor_type">>;

export interface LandingPageDef {
  /** Polku ilman loppukauttaviivaa. */
  path: string;
  /** Lyhyt nimi linkkeihin ja murupolkuun. */
  name: string;
  group: LandingGroup;
  title: string;
  description: string;
  h1: string;
  /** 2-3 kappaletta. Ensimmäinen virke vastaa suoraan hakijan kysymykseen. */
  intro: string[];
  faqs: LandingFaq[];
  /** Muut laskeutumissivut (vähintään 3). */
  related: string[];
  /** Asiaankuuluvat tuotekategoriat (/kategoria/<slug>). */
  categories: string[];
  /** Muut sisäiset linkit (esim. ammattisivut). */
  extraLinks?: { href: string; label: string }[];
  filter: (p: LandingProduct) => boolean;
  /** Järjestys: oletuksena prioriteetti, sitten kaupunkituotteet viimeisenä. */
  sort?: "default" | "hupparit-first" | "price-desc";
  /** Sivun päätuotteet: suodattimen hyväksymistä nämä näytetään ensin (esim. teemasivun omat tuotteet). */
  featured?: (p: LandingProduct) => boolean;
  /** Nosto toiselle sivulle tuotteiden yläpuolella (esim. joulusivulta teemasivulle). */
  spotlight?: LandingSpotlight;
}

export interface LandingSpotlight {
  heading: string;
  text: string;
  links: { href: string; label: string }[];
}

// ── Suodattimen apurit ──────────────────────────────────────────────────────────

const lower = (p: LandingProduct) => `${p.name} ${p.slug}`.toLowerCase();

/**
 * Mukeja ei myydä. Tuotetasoinen sääntö (onPiilotettuTuote) piilottaa myös väärässä kategoriassa
 * olevat mukit; lisäksi varmistetaan nimen perusteella ("kahvikuppi").
 */
export const looksLikeMug = (p: LandingProduct) =>
  onPiilotettuTuote(p as Parameters<typeof onPiilotettuTuote>[0]) || /muki|kahvikuppi/.test(lower(p));


const any =
  (...fns: ((p: LandingProduct) => boolean)[]) =>
  (p: LandingProduct) =>
    fns.some((f) => f(p));

const not =
  (fn: (p: LandingProduct) => boolean) =>
  (p: LandingProduct) =>
    !fn(p);

const all =
  (...fns: ((p: LandingProduct) => boolean)[]) =>
  (p: LandingProduct) =>
    fns.every((f) => f(p));

const inCategory =
  (...cats: string[]) =>
  (p: LandingProduct) =>
    cats.includes(p.category);

const maxPrice = (eur: number) => (p: LandingProduct) => Number(p.price) <= eur;

/** Ikävuosi tuotteen nimessä: "40v", "40 ja", "40 vuotta", "40-vuotiaalle". */
const age = (n: number) => theme(new RegExp(`(^|[^0-9])${n}(v\\b|\\s|-vuotiaalle)`));
/** "40 vuotta töitä, nyt ikuinen viikonloppu" on eläketeksti, ei synttärilahja. */
const workYears = theme(/vuotta töitä/);

const OMA_TEKSTI = theme(/oma teksti/);
const PERSONOITAVA = theme(/personoitava/);
const PERSONAL = any(OMA_TEKSTI, PERSONOITAVA);
/** Personoidut tuotteet aikuiselle (ei vauvan bodya, tarraa tai lippistä). */
const PERSONAL_ADULT = all(PERSONAL, not(inCategory("bodyt", "tarrat", "pipot")));
/** Omalla tekstillä painettavat lahjat kotiin: peitto, seinätaulu, koriste. */
const OMA_KOTIIN = all(OMA_TEKSTI, inCategory("peitot", "seinataulut", "koristeet"));

const ISA = theme(/(?<![a-zåäö])isä/, /(?<![a-zåäö])iskä/, /amatimies/, /asuu yksi pomo/, /\bkalju/);
const AITI = theme(/äiti/, /äiskä/);
const PAPPA = theme(/\bukki/, /pappa/);
const NAINEN = theme(/äiti/, /äiskä/, /slay queen/, /my boyfriend/, /swedish boys/, /fabulous/, /hopeanhohtoinen/);
const MIES = theme(
  /(?<![a-zåäö])isä/, /(?<![a-zåäö])iskä/, /amatimies/, /\bkalju/, /kalamies/, /kalassa/, /\bukki/, /pappa/,
  /my girlfriend/, /swedish girls/, /museokamaa/, /asuu yksi pomo/,
);
const TYO = theme(
  /etätö/, /palaveri/, /lounastauko/, /tiimipelaaja/, /työkaveri/, /asiakaspalvelija/, /myyntimieh/,
  /paras pomo/, /työsankari/, /alalla x/, /pikkujoulu/, /kesäloma/,
);
const POMO = theme(/pomo/, /palaveri/, /tiimipelaaja/, /työsankari/, /kapteeni/, /alalla x/, /myyntimieh/);
/** Sisäpiirin huumori aikuisille kavereille. */
const KAVERI = any(
  theme(
    /oispa kaljaa/, /alkoholi/, /tonnin seteli/, /saatanan tunarit/, /ice aatana/, /viisaampi häipyy/,
    /yksi kerta vielä/, /\bkalju/, /paras ystävä ornament/,
  ),
  all(OMA_TEKSTI, inCategory("tarrat", "koristeet", "t-paidat")),
);
/** Teineille: meemit ja harrastukset ilman alkoholi- ja kirosanatekstejä. */
const TEINI = theme(
  /slay queen/, /(?<![a-zåäö])pelaaja/, /lumilautailija/, /swedish/, /tonnin seteli/, /maailman mestarit/,
  /viisaampi häipyy/,
);
const PUOLISO = any(theme(/my girlfriend/, /my boyfriend/, /lempinimi/), OMA_KOTIIN, all(OMA_TEKSTI, inCategory("hupparit", "t-paidat", "pitkahihaiset")));
const VAIMO = any(theme(/slay queen/, /äiskä/, /äiti/, /fabulous/, /hopeanhohtoinen/, /lempinimi/), OMA_KOTIIN);
/** Mummolle ja isoäidille: oma tervehdys kotiin tai vaatteeseen ja eläkeläishuumori. */
const MUMMO = any(
  all(OMA_TEKSTI, inCategory("peitot", "seinataulut", "koristeet", "t-paidat", "hupparit", "pitkahihaiset")),
  theme(/eläkeläinen/, /aamuherätys/, /kiireinen tekemään/),
);
const PAPPA_ALL = any(PAPPA, theme(/museokamaa/, /eläk/, /kalamies/, /kalassa/, /isäntä/, /pilkkijä/));
const SISKO = any(
  NAINEN,
  theme(/30v.{0,3}paranen/, /paras ystävä ornament/),
  all(OMA_TEKSTI, inCategory("tarrat", "koristeet", "t-paidat")),
);
const VELI = theme(
  /\bkalju/, /oispa kaljaa/, /tonnin seteli/, /amatimies/, /(?<![a-zåäö])pelaaja/, /kuntosali/, /swedish girls/,
  /ice aatana/, /saatanan tunarit/, /grillimest/, /autoharrastaja/,
);
const PIKKUJOULU = any(TYO, theme(/oispa kaljaa/, /yksi kerta vielä/, /paras ystävä ornament/), all(OMA_TEKSTI, inCategory("tarrat", "koristeet")));
const SALAINEN_PUKKI = all(
  maxPrice(30),
  not(inCategory("bodyt")),
  any(TYO, inCategory("tarrat", "koristeet")),
);
/** Isänpäivälahja isän tyypin mukaan: kalastaja, mökkeilijä, grillaaja, eläkeläinen, isoisä, nuori isä, työmies. */
const ISA_TYYPIT = any(
  ISA,
  PAPPA,
  theme(/eläkeläi/, /eläkkeellä/),
  theme(/kalamies/, /kalassa/, /kalastaja/, /pilkkijä/, /metsästäjä/),
  theme(/mökkeilijä/, /grillimest/),
  theme(/rakennusmie/, /sähköasentaja/, /sähkömie/, /putkimie/, /maanviljelijä/),
);
/** Hauska isänpäivälahja: isän oma vitsi ja setähuumori (ei alkoholivitsejä lasten lahjaksi). */
const ISA_VITSIT = all(
  any(ISA, SETA, theme(/kala pääsi/, /huonokin päivä kalassa/, /museokamaa/, /elävä legenda/)),
  not(theme(/alkoholi/, /oispa kaljaa/)),
);
const TONNIN_SETELI_TPAITA = "/tuote/tonnin-seteli-t-paita";
const SE_OLI_TPAITA = "/tuote/se-oli-tonnin-seteli-t-paita";

const ANY_AGE = all(any(age(30), age(40), age(50), age(60), age(70)), not(workYears));

// ── Sivut ───────────────────────────────────────────────────────────────────────

const D = CHRISTMAS_DEADLINE_PROMISE;

/** Joulusivujen nosto tonnin seteli -sivulle: sivu, t-paita ja huppari. */
const tonninSeteliSpotlight = (text: string): LandingSpotlight => ({
  heading: "Se oli tonnin seteli -paidat",
  text,
  links: [
    { href: TONNIN_SETELI_PATH, label: "Kaikki tonnin seteli -paidat" },
    { href: TONNIN_SETELI_TPAITA, label: "Tonnin Seteli -t-paita" },
    { href: "/tuote/se-oli-tonnin-seteli-huppari", label: "Se oli tonnin seteli -huppari" },
  ],
});

export const landingPages: LandingPageDef[] = [
  // ─── Joulu ───
  {
    path: "/joululahjat",
    name: "Joululahjat",
    group: "joulu",
    title: "Hauskat joululahjat 2026 | Huumorikauppa",
    description:
      "Hauskat joululahjat paitoina ja huppareina isälle, äidille, kaverille ja työkaverille. Tilaa viimeistään pe 20.11.2026, niin lahja ehtii jouluaattoon.",
    h1: "Hauskat joululahjat 2026",
    intro: [
      "Hauska joululahja on t-paita, huppari tai personoitu tuote, jonka teksti osuu saajan omaan elämään: ikään, ammattiin, harrastukseen tai perheen sisäpiirin vitsiin. Tällä sivulla on koko joulun valikoima, ja alla olevista lahjaoppaista rajaat sen saajan tai budjetin mukaan.",
      `Tuotteet painetaan tilauksesta painokumppaneidemme tuotantolaitoksissa ja kuljetetaan sieltä Suomeen, joten joulutilauksella on takaraja. ${D}`,
      `Jos saajan koko on epävarma, valitse huppari: väljä istuvuus ei haittaa hupparissa samalla tavalla kuin t-paidassa. Yli ${ILMAINEN_RAJA_TEKSTI} euron tilaukset toimitetaan ilman toimituskuluja, joten useamman lahjan tilaaminen kerralla kannattaa.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska joululahja?",
        a: "Tuote, jonka teksti liittyy saajaan, esimerkiksi ikävuosipaita, eläkeläisen huppari tai sisäpiirin vitsi. Huumorikaupan valikoima on pääosin t-paitoja ja huppareita, ja osaan tuotteista kirjoitat oman tekstin.",
      },
      {
        q: "Milloin joululahjat pitää viimeistään tilata?",
        a: `${D} Päivä on sama kaikille tuotteille. Perustelut löytyvät sivulta Joulun viimeiset tilauspäivät.`,
      },
      {
        q: "Mitä joululahjoja saa alle 30 eurolla?",
        a: "T-paidat ja koristeet mahtuvat alle 30 euron budjettiin. Hupparit ovat kalliimpia, ja ne löytyvät alle 50 euron joululahjoista.",
      },
      {
        q: "Voiko joululahjan palauttaa?",
        a: "Tilauksilla on kuluttajansuojalain mukainen 14 päivän peruutusoikeus. Palautuksen postikulut maksaa asiakas, ellei tuote ole virheellinen.",
      },
      {
        q: "Mistä löydän joululahjan tietylle henkilölle?",
        a: "Sivun alalaidan lahjaoppaissa valikoima on rajattu saajan mukaan: miehelle, naiselle, isälle, äidille, vaimolle, kaverille, työkaverille, teinille, mummolle, papalle ja eläkeläiselle. Budjetin mukaan rajatut sivut ovat alle 30 ja alle 50 euron joululahjat.",
      },
    ],
    related: [
      "/lahjat/joululahjaksi-miehelle",
      "/lahjat/joululahjaksi-naiselle",
      "/joululahja-isalle",
      "/joululahja-aidille",
      "/joululahja-vaimolle",
      "/joululahja-kaverille",
      "/joululahja-tyokaverille",
      "/joululahja-teinille",
      "/joululahja-mummolle",
      "/joululahja-papalle",
      "/joululahja-elakelaiselle",
      "/joululahja-miehelle-jolla-on-kaikki",
      "/lahjat/alle-30-euroa",
      "/joululahja-alle-50-euroa",
      "/lahjat/pikkujouluihin",
      "/salainen-joulupukki-lahja",
      TONNIN_SETELI_PATH,
    ],
    categories: ["t-paidat", "hupparit"],
    extraLinks: [{ href: "/joulun-viimeiset-tilauspaivat", label: "Joulun viimeiset tilauspäivät" }],
    spotlight: tonninSeteliSpotlight(
      "Joululahja kaverille, joka tuntee meemin: se oli tonnin seteli. ja Tonnin Seteli t-paitana ja huppareina.",
    ),
    filter: (p) => !isCityProduct(p) && p.category !== "bodyt",
  },
  {
    path: "/lahjat/joululahjaksi-miehelle",
    name: "Joululahjat miehelle",
    group: "joulu",
    title: "Hauskat joululahjat miehelle 2026 | Huumorikauppa",
    description:
      "Joululahja miehelle huumorilla: Isäntä-, KALAMIES-, Amatimies- ja Kalju-paidat sekä hupparit. Tilaa viimeistään pe 20.11.2026, niin lahja ehtii jouluksi.",
    h1: "Hauskat joululahjat miehelle",
    intro: [
      "Hauska joululahja miehelle on huppari tai t-paita, jonka teksti kertoo jotain hänestä itsestään: kalastus, kalju, kotitalon isäntä tai lapsenlasten ukki.",
      "Jouluna huppari on käytännöllisempi kuin t-paita, koska sitä käytetään talvella sisällä ja ulkona. Siksi tällä sivulla hupparit näkyvät ensin. Jos mies on isä tai isoisä, isän ja papan joululahjasivuilla valikoima on rajattu tarkemmin.",
      `${D} Yli ${ILMAINEN_RAJA_TEKSTI} euron tilaukset, esimerkiksi kaksi hupparia, toimitetaan ilman toimituskuluja.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska joululahja miehelle?",
        a: "Huppari tai t-paita, jonka teksti liittyy miehen harrastukseen, ikään tai rooliin kotona. Valikoimassa on esimerkiksi Isäntä-, Kalju-, Amatimies- ja KALAMIES-tuotteet.",
      },
      {
        q: "Huppari vai t-paita joululahjaksi?",
        a: "Huppari on talvella käytössä useammin, ja väljä istuvuus antaa anteeksi, jos koko ei osu täsmälleen. T-paita on edullisempi ja sopii, jos lahja on osa isompaa pakettia.",
      },
      {
        q: "Mitä antaa miehelle, jolla on jo kaikkea?",
        a: "Personoitavan tuotteen, johon kirjoitetaan hänen lempinimensä tai oma tekstinsä. Ne on koottu sivulle Joululahja miehelle, jolla on kaikki.",
      },
      {
        q: "Ehtiikö tilaus jouluksi?",
        a: `${D}`,
      },
    ],
    related: [
      "/joululahjat",
      "/joululahja-isalle",
      "/joululahja-miehelle-jolla-on-kaikki",
      "/joululahja-papalle",
      "/setamiespaidat",
      "/hauskat-lahjat-miehelle",
    ],
    categories: ["hupparit", "t-paidat"],
    filter: MIES,
    sort: "hupparit-first",
  },
  {
    path: "/lahjat/joululahjaksi-naiselle",
    name: "Joululahjat naiselle",
    group: "joulu",
    title: "Hauskat joululahjat naiselle 2026 | Huumorikauppa",
    description:
      "Joululahja naiselle: Super äiskä, slay queen ja ikävuosipaidat, hupparit sekä omalla tekstillä painettu koriste. Tilaa viimeistään pe 20.11.2026.",
    h1: "Hauskat joululahjat naiselle",
    intro: [
      "Hauska joululahja naiselle on tuote, jonka teksti sopii hänen elämäntilanteeseensa: äidille Super äiskä -huppari, ystävälle slay queen ja pyöreitä vuosia täyttävälle ikävuosipaita.",
      "Jos haluat lahjaan perheen oman jutun, valitse Oma teksti/kuva -tuote ja kirjoita teksti tai kuvatoive tuotesivulla. Samaa tuotetta on koristeena, hupparina, pitkähihaisena ja paitana.",
      `${D} Tarkemmin rajatut oppaat äidille, vaimolle ja mummolle löydät sivun alalaidasta.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska joululahja naiselle?",
        a: "Tuote, jonka teksti on saajan puolella. Äidille sopii Super äiskä -huppari, pyöreitä vuosia täyttävälle ikävuosipaita ja ystävälle oma tekstipainatus.",
      },
      {
        q: "Voiko lahjaan painattaa oman tekstin?",
        a: "Voi. Oma teksti/kuva -tuotteissa kirjoitat tekstin tai kuvatoiveen tuotesivun kenttään ennen ostoskoriin lisäämistä, enintään 200 merkkiä.",
      },
      {
        q: "Mikä joululahja sopii äidille?",
        a: "Äidille on oma oppaansa, Joululahja äidille, jossa valikoima on rajattu äiti-aiheisiin ja personoitaviin tuotteisiin.",
      },
      {
        q: "Milloin tilaus on tehtävä, jotta se ehtii jouluksi?",
        a: `${D}`,
      },
    ],
    related: [
      "/joululahjat",
      "/joululahja-aidille",
      "/joululahja-vaimolle",
      "/joululahja-mummolle",
      "/hauskat-lahjat-naiselle",
      "/lahjat/siskolle",
    ],
    categories: ["hupparit", "t-paidat"],
    filter: any(NAINEN, OMA_KOTIIN),
    sort: "hupparit-first",
  },
  {
    path: "/joululahja-miehelle-jolla-on-kaikki",
    name: "Miehelle, jolla on kaikki",
    group: "joulu",
    title: "Joululahja miehelle, jolla on kaikki | Huumorikauppa",
    description:
      "Joululahja miehelle, jolla on jo kaikkea: personoitu paita, huppari tai koriste hänen omalla tekstillään. Tilaa viimeistään pe 20.11.2026.",
    h1: "Joululahja miehelle, jolla on kaikki",
    intro: [
      "Miehelle, jolla on jo kaikkea, kannattaa antaa tuote, jota ei voi ostaa valmiina: personoitu paita tai huppari hänen nimellään, lempinimellään tai teidän omalla vitsillänne.",
      "Valmiita personoitavia pohjia ovat esimerkiksi Elävä legenda, Kapteeni, Harrastusmestari ja Alalla X vuotta, joihin vaihdat oman tekstin. Vapaampi vaihtoehto on Oma teksti/kuva, johon kirjoitat tuotesivulla haluamasi tekstin tai kuvatoiveen.",
      `Personoitu tuote tehdään vasta tilauksesi tekstin pohjalta, joten varaa aikaa. ${D}`,
    ],
    faqs: [
      {
        q: "Mitä antaa joululahjaksi miehelle, jolla on jo kaikkea?",
        a: "Personoidun tuotteen, jossa on hänen nimensä, lempinimensä tai harrastuksensa. Sellaista hänellä ei ole, koska se tehdään vasta tilauksesta.",
      },
      {
        q: "Millaisia personoitavia tuotteita on?",
        a: "T-paitoja valmiilla pohjilla, kuten Elävä legenda, Kapteeni, Harrastusmestari ja Lempinimi, sekä Oma teksti/kuva -tuotteita paitana, hupparina ja pitkähihaisena.",
      },
      {
        q: "Kuinka teksti lisätään?",
        a: "Kirjoita teksti tai kuvatoive tuotesivun kenttään ennen kuin lisäät tuotteen ostoskoriin. Kenttään mahtuu 200 merkkiä, ja toive kulkee tilauksen mukana.",
      },
      {
        q: "Entä jos en keksi tekstiä?",
        a: "Valitse valmis tekstipaita hänen harrastuksensa tai ikänsä mukaan. Harrastuspaidat ovat sivulla Hauskat lahjat harrastajalle.",
      },
    ],
    related: [
      "/lahjat/joululahjaksi-miehelle",
      "/joululahja-isalle",
      "/lahjat/harrastajalle",
      "/lahjat/50-vuotiaalle-miehelle",
      TONNIN_SETELI_PATH,
    ],
    categories: ["t-paidat", "hupparit"],
    spotlight: tonninSeteliSpotlight(
      "Valmis vitsi personoinnin sijaan: se oli tonnin seteli -paita miehelle, joka muistelee menetettyjä rahojaan joka illanvietossa.",
    ),
    filter: PERSONAL_ADULT,
  },
  {
    path: "/joululahja-isalle",
    name: "Joululahja isälle",
    group: "joulu",
    title: "Hauska joululahja isälle 2026 | Huumorikauppa",
    description:
      "Joululahja isälle huumorilla: Isäntä-, Amatimies-, Kalju- ja iskä-paidat sekä hupparit. Myös isälle, jolla on jo kaikkea. Tilaa viimeistään pe 20.11.2026.",
    h1: "Hauska joululahja isälle",
    intro: [
      "Hauska joululahja isälle on paita tai huppari, jossa isän oma rooli on tekstinä: talon isäntä, kaiken itse korjaava iskä tai kotitalouden pomo.",
      "Isälle, jolla on jo kaikkea, valikoimassa on personoitava isä-paita, johon lisätään oma teksti. Jos isä on myös isoisä, papan joululahjasivulla ovat ukki- ja pappa-tuotteet.",
      `Talvella huppari on isällä käytössä useammin kuin t-paita. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska joululahja isälle?",
        a: "Paita tai huppari, jonka teksti kuvaa isää, esimerkiksi Isäntä, Amatimies, Kalju tai Jos iskä ei osaa korjata sitä. Ne sopivat isälle, joka nauraa itselleenkin.",
      },
      {
        q: "Mitä antaa isälle, jolla on jo kaikkea?",
        a: "Personoitavan paidan, johon lisätään oma teksti, tai harrastusaiheisen paidan. Harrastuspaidat on koottu sivulle Hauskat lahjat harrastajalle.",
      },
      {
        q: "Sopiiko sama lahja isänpäivään?",
        a: "Sopii. Isänpäivä on sunnuntaina 8.11.2026, ja isänpäivän ideat ovat sivuilla Isänpäivälahja isän tyypin mukaan ja Hauska isänpäivälahja.",
      },
      {
        q: "Mitä jos en tiedä isän kokoa?",
        a: "Valitse huppari, sillä väljempi istuvuus ei haittaa hupparissa. Tilauksilla on 14 päivän peruutusoikeus.",
      },
    ],
    related: [
      "/joululahjat",
      "/isanpaivalahja",
      "/hauska-isanpaivalahja",
      "/joululahja-papalle",
      "/joululahja-miehelle-jolla-on-kaikki",
      "/setamiespaidat",
      "/lahjat/joululahjaksi-miehelle",
      TONNIN_SETELI_PATH,
    ],
    categories: ["hupparit", "t-paidat"],
    spotlight: tonninSeteliSpotlight(
      "Isälle, joka kertoo joulupöydässä saman tarinan rahasta, joka vain katosi: se oli tonnin seteli -huppari tai -t-paita.",
    ),
    filter: ISA,
    sort: "hupparit-first",
  },
  {
    path: "/joululahja-aidille",
    name: "Joululahja äidille",
    group: "joulu",
    title: "Hauska joululahja äidille 2026 | Huumorikauppa",
    description:
      "Joululahja äidille: Super äiskä- ja äiti-aiheiset hupparit ja t-paidat sekä omalla tekstillä painettu koriste. Tilaa viimeistään pe 20.11.2026.",
    h1: "Hauska joululahja äidille",
    intro: [
      "Hauska joululahja äidille on äiti-aiheinen huppari tai t-paita, esimerkiksi Super äiskä, jota hän käyttää kotona ja ulkona koko talven.",
      "T-paita on hupparia edullisempi, ja huppari on lämpimämpi talvilahja. Jos haluat lahjaan perheen oman jutun, valitse Oma teksti/kuva -tuote ja kirjoita tuotesivulla teksti tai kuvatoive.",
      `Äidille, jolla on jo kaikkea, omalla tekstillä painettu paita tai huppari on lahja, jota hänellä ei vielä ole. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska joululahja äidille?",
        a: "Äiti-aiheinen huppari tai t-paita, esimerkiksi Super äiskä tai äiti-palkintoaiheinen paita. Niitä käytetään arjessa eikä vain joulupäivänä.",
      },
      {
        q: "Löytyykö edullinen joululahja äidille?",
        a: "T-paidat ovat huppareita edullisempia ja mahtuvat alle 30 euron budjettiin. Muut alle 30 euron lahjat ovat sivulla Hauskat lahjat alle 30 euroa.",
      },
      {
        q: "Mitä antaa äidille, jolla on kaikkea?",
        a: "Omalla tekstillä painetun tuotteen, esimerkiksi paidan, hupparin tai koristeen. Kirjoitat tekstin tai kuvatoiveen tuotesivulla.",
      },
      {
        q: "Ehtiikö lahja jouluaatoksi?",
        a: `${D}`,
      },
    ],
    related: [
      "/joululahjat",
      "/lahjat/joululahjaksi-naiselle",
      "/joululahja-vaimolle",
      "/joululahja-mummolle",
      "/lahjat/alle-30-euroa",
    ],
    categories: ["hupparit", "t-paidat"],
    filter: any(AITI, all(OMA_TEKSTI, inCategory("peitot", "seinataulut", "koristeet", "t-paidat", "hupparit", "pitkahihaiset"))),
  },
  {
    path: "/joululahja-vaimolle",
    name: "Joululahja vaimolle",
    group: "joulu",
    title: "Hauska joululahja vaimolle 2026 | Huumorikauppa",
    description:
      "Joululahja vaimolle: slay queen- ja äiskä-hupparit, ikävuosipaidat ja omalla tekstillä painettu koriste. Tilaa viimeistään pe 20.11.2026.",
    h1: "Hauska joululahja vaimolle",
    intro: [
      "Hyvä joululahja vaimolle on tuote, jossa on teidän oma juttunne: omalla tekstillä painettu huppari, paita tai koriste, tai valmis teksti kuten slay queen.",
      "Jos vaimo on lasten äiti, Super äiskä -huppari on lahja, jonka voi antaa myös lasten nimissä. Pyöreitä vuosia täyttävälle sopii ikävuosipaita, esimerkiksi 40 ja fabulous tai 50 ja hopeanhohtoinen (vain hiukset).",
      `Huumorilahja vaimolle toimii, kun vitsi on hänen kanssaan eikä hänen kustannuksellaan: valitse teksti, jonka hän pukisi itsekin päälleen. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hyvä joululahja vaimolle?",
        a: "Personoitu paita tai huppari teidän omalla tekstillänne, tai valmis teksti kuten slay queen tai Super äiskä.",
      },
      {
        q: "Millainen huumori sopii vaimon lahjaan?",
        a: "Teksti, joka kehuu tai jonka hän ottaisi itse käyttöön. Ikävitsit kannattaa valita vain, jos hän vitsailee iästään itsekin.",
      },
      {
        q: "Voinko kirjoittaa lahjaan oman tekstin?",
        a: "Voit. Oma teksti/kuva -tuotteissa ja Lempinimi-paidassa kirjoitat tekstin tuotesivun kenttään, enintään 200 merkkiä.",
      },
      {
        q: "Milloin tilaus on viimeistään tehtävä?",
        a: `${D}`,
      },
    ],
    related: [
      "/lahjat/puolisolle",
      "/joululahja-aidille",
      "/lahjat/joululahjaksi-naiselle",
      "/lahjat/50-vuotiaalle-naiselle",
    ],
    categories: ["hupparit", "t-paidat"],
    filter: VAIMO,
  },
  {
    path: "/joululahja-kaverille",
    name: "Joululahja kaverille",
    group: "joulu",
    title: "Hauska joululahja kaverille 2026 | Huumorikauppa",
    description:
      "Joululahja kaverille: se oli tonnin seteli, oispa kaljaa ja Saatanan Tunarit -paidat sekä koristeet. Tilaa viimeistään pe 20.11.2026.",
    h1: "Hauska joululahja kaverille",
    intro: [
      "Hauska joululahja kaverille on paita tai pikkulahja, jonka vitsi on teille yhteinen: meemi, lausahdus tai juttu, jota kukaan muu ei ymmärrä.",
      "Pieneksi joululahjaksi kaverille sopii koriste, isommaksi t-paita tai huppari. Valmiita tekstejä ovat esimerkiksi se oli tonnin seteli ja oispa kaljaa, ja oman sisäpiirin vitsin saat Oma teksti/kuva -tuotteeseen.",
      `Jos annatte lahjat pikkujouluissa, katso myös pikkujoululahjat. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska joululahja kaverille?",
        a: "Paita tai pikkulahja, jonka vitsi on teidän yhteinen, esimerkiksi meemiteksti tai oma sisäpiirin lausahdus t-paidassa.",
      },
      {
        q: "Mikä on pieni joululahja kaverille?",
        a: "Koriste. Se on t-paitaa edullisempi, ja Oma teksti/kuva -koristeeseen saa oman vitsin.",
      },
      {
        q: "Mitä antaa läheisimmälle ystävälle?",
        a: "Oman tekstin paidan tai hupparin, johon painetaan teidän oma vitsinne, tai ystävä-aiheisen keraamisen koristeen.",
      },
      {
        q: "Ehtiikö lahja jouluksi?",
        a: `${D}`,
      },
    ],
    related: ["/lahja-kaverille", "/lahjat/pikkujouluihin", "/meemipaidat", "/salainen-joulupukki-lahja", TONNIN_SETELI_PATH],
    categories: ["t-paidat", "koristeet"],
    filter: KAVERI,
  },
  {
    path: "/joululahja-tyokaverille",
    name: "Joululahja työkaverille",
    group: "joulu",
    title: "Hauska joululahja työkaverille 2026 | Huumorikauppa",
    description:
      "Joululahja työkaverille toimistohuumorilla: palaveri-, lounastauko-, etätyö- ja tiimipelaaja-paidat sekä pienet lahjat. Tilaa viimeistään pe 20.11.2026.",
    h1: "Hauska joululahja työkaverille",
    intro: [
      "Hauska joululahja työkaverille on toimistohuumoria, joka naurattaa koko työporukkaa eikä osu kehenkään henkilökohtaisesti: palaverit, lounastauko, etätyö ja tiimityö.",
      `Paitojen tekstit, kuten Tämäkin olisi voinut olla sähköposti tai Tärkeintä työssä on lounastauko, nauravat työlle eivätkä työkaverille. Jos lahjoja ostetaan koko tiimille, yli ${ILMAINEN_RAJA_TEKSTI} euron tilaus toimitetaan ilman toimituskuluja.`,
      `Jos lahjat jaetaan pikkujouluissa, katso myös pikkujoululahjat ja salaisen joulupukin lahjat. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska joululahja työkaverille?",
        a: "Toimistohuumori, joka nauraa työlle eikä työkaverille: palaverit, lounastauko, etätyö ja tiimityö. Valikoimassa ne ovat t-paitoja ja huppareita.",
      },
      {
        q: "Mikä on pieni joululahja työkaverille?",
        a: "Koriste on t-paitaa edullisempi. Siihen saa oman tekstin, esimerkiksi tiimin sisäisen vitsin.",
      },
      {
        q: "Voiko lahjat tilata koko tiimille kerralla?",
        a: `Voi. Lisää tuotteet ja koot samaan ostoskoriin. Yli ${ILMAINEN_RAJA_TEKSTI} euron tilaukset toimitetaan ilman toimituskuluja.`,
      },
      {
        q: "Mitä huumoria kannattaa välttää työkaverin lahjassa?",
        a: "Ulkonäköön, ikään tai alkoholiin liittyviä vitsejä. Työpaikalle sopivat tekstit, jotka koko porukka voi lukea ääneen.",
      },
    ],
    related: ["/joululahjat", "/lahjat/tyokaverille", "/lahjat/pikkujouluihin", "/salainen-joulupukki-lahja", "/lahjat/pomolle"],
    categories: ["t-paidat", "hupparit"],
    filter: any(TYO, all(OMA_TEKSTI, inCategory("tarrat", "koristeet"))),
  },
  {
    path: "/lahjat/pomolle",
    name: "Lahja pomolle",
    group: "joulu",
    title: "Hauska lahja pomolle | Huumorikauppa",
    description:
      "Lahja pomolle huumorilla, joka ei loukkaa: pomo-, palaveri- ja tiimipelaaja-paidat sekä personoitava Kapteeni-paita. Sopii joululahjaksi ja läksiäisiin.",
    h1: "Hauska lahja pomolle",
    intro: [
      "Hauska lahja pomolle on paita, jossa vitsi kohdistuu pomon rooliin eikä häneen henkilönä: pomo itse, palaverit, tiimityö tai kapteenin paikka.",
      "Turvallinen valinta on teksti, jonka pomo voi näyttää muulle tiimille, kuten Tässä talossa asuu yksi pomo tai Tämäkin olisi voinut olla sähköposti. Personoitavaan Kapteeni- tai Alalla X vuotta -paitaan kirjoitetaan tiimin oma teksti.",
      `Joululahjan pomolle voi antaa koko tiimin nimissä, jolloin huppari on jaettuna kohtuullinen yhteislahja. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja pomolle?",
        a: "Paita, jonka vitsi koskee pomon roolia, kuten Tässä talossa asuu yksi pomo tai personoitava Kapteeni-paita. Henkilökohtaiset vitsit kannattaa jättää pois.",
      },
      {
        q: "Sopiiko huumorilahja pomolle?",
        a: "Sopii, kun teksti nauraa työelämälle yleisesti. Palaveri- ja tiimipelaajapaidat ovat tekstejä, jotka voi antaa koko tiimin edessä.",
      },
      {
        q: "Mikä on hyvä joululahja pomolle?",
        a: `Tiimin yhteislahja, esimerkiksi huppari tai personoitu paita tiimin omalla tekstillä. ${D}`,
      },
      {
        q: "Voiko paitaan painaa tiimin nimen?",
        a: "Voi. Personoitavissa paidoissa, kuten Kapteeni ja Alalla X vuotta, kirjoitat oman tekstin tuotesivulla.",
      },
    ],
    related: ["/joululahja-tyokaverille", "/lahjat/tyokaverille", "/lahjat/pikkujouluihin", "/ammattipaidat"],
    categories: ["t-paidat"],
    filter: POMO,
  },
  {
    path: "/joululahja-mummolle",
    name: "Joululahja mummolle",
    group: "joulu",
    title: "Hauska joululahja mummolle 2026 | Huumorikauppa",
    description:
      "Joululahja mummolle: omalla tekstillä painettu koriste sekä eläkeläisen huumoripaidat ja hupparit. Tilaa viimeistään pe 20.11.2026.",
    h1: "Joululahja mummolle",
    intro: [
      "Hyvä joululahja mummolle on tuote, jossa on lastenlasten oma tervehdys: omalla tekstillä painettu huppari, paita tai koriste.",
      "Eläkkeellä olevalle mummolle sopivat myös eläkeläishuumorin paidat ja hupparit, kuten Eläkeläinen, aamuherätys vapaaehtoinen tai Eläkkeellä, kiireinen tekemään ei mitään. Tekstit eivät ole sukupuolisidonnaisia.",
      `Oma teksti/kuva -tuotteissa kirjoitat tuotesivulla tekstin tai kuvatoiveen, esimerkiksi lastenlasten nimet. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hyvä joululahja mummolle?",
        a: "Tuote, jossa on lastenlasten oma teksti, kuten omalla tekstillä painettu paita tai huppari. Eläkkeellä olevalle mummolle sopivat myös eläkeläisaiheiset paidat.",
      },
      {
        q: "Mitä antaa mummolle, jolla on jo kaikkea?",
        a: "Personoidun tuotteen. Lastenlasten nimillä ei ole valmiita tuotteita, joten oma teksti on hyvä valinta.",
      },
      {
        q: "Sopivatko eläkeläispaidat naisille?",
        a: "Sopivat. Tekstit eivät ole sukupuolisidonnaisia, joten ne käyvät mummolle yhtä hyvin kuin papalle.",
      },
      {
        q: "Kuinka kirjoitan tekstin personoituun lahjaan?",
        a: "Valitse Oma teksti/kuva -tuote ja kirjoita teksti tai kuvatoive tuotesivun kenttään ennen ostoskoriin lisäämistä, enintään 200 merkkiä.",
      },
      {
        q: "Ehtiikö lahja jouluksi?",
        a: `${D}`,
      },
    ],
    related: ["/lahjat/isoaidille", "/joululahja-papalle", "/joululahja-aidille", "/lahjat/70-vuotiaalle"],
    categories: ["peitot", "seinataulut", "hupparit"],
    filter: MUMMO,
  },
  {
    path: "/joululahja-papalle",
    name: "Joululahja papalle",
    group: "joulu",
    title: "Hauska joululahja papalle ja ukille | Huumorikauppa",
    description:
      "Joululahja papalle tai ukille: ukki- ja pappa-paidat, eläkeläisen hupparit, Museokamaa ja kalastusaiheiset paidat. Tilaa viimeistään pe 20.11.2026.",
    h1: "Hauska joululahja papalle",
    intro: [
      "Hauska joululahja papalle on paita tai huppari, jossa lukee ukki tai pappa, tai teksti hänen harrastuksestaan ja eläkepäivistään.",
      "Ukki- ja pappa-tekstit sopivat lahjaksi lastenlasten nimissä. Eläkkeellä olevalle papalle on lisäksi Museokamaa-, Eläkeläinen- ja Olen eläkkeellä -tuotteita, ja kalastavalle papalle KALAMIES-paita.",
      `Talvella huppari on papalla käytössä useammin kuin t-paita. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska joululahja papalle?",
        a: "Ukki- tai pappa-teksti paidassa tai hupparissa, tai eläkepäiviin liittyvä huumoripaita kuten Museokamaa.",
      },
      {
        q: "Mikä sopii ukille, joka kalastaa?",
        a: "KALAMIES-paita ja Huonokin päivä kalassa -paita tai -huppari. Lisää harrastuspaitoja on sivulla Hauskat lahjat harrastajalle.",
      },
      {
        q: "Voiko lahjan antaa lastenlasten nimissä?",
        a: "Voi. Ukki- ja pappa-tekstit sopivat siihen sellaisenaan, ja personoitavaan paitaan voit kirjoittaa lastenlasten nimet.",
      },
      {
        q: "Ehtiikö lahja jouluksi?",
        a: `${D}`,
      },
    ],
    related: ["/lahjat/isoisalle", "/joululahja-mummolle", "/joululahja-isalle", "/elakelahjat"],
    categories: ["hupparit", "t-paidat"],
    filter: PAPPA_ALL,
    sort: "hupparit-first",
  },
  {
    path: "/joululahja-elakelaiselle",
    name: "Joululahja eläkeläiselle",
    group: "joulu",
    title: "Hauska joululahja eläkeläiselle 2026 | Huumorikauppa",
    description:
      "Joululahja eläkeläiselle: Olen eläkkeellä, 100% Eläkeläinen ja muut eläkeläishuumorin hupparit ja paidat. Tilaa viimeistään pe 20.11.2026.",
    h1: "Hauska joululahja eläkeläiselle",
    intro: [
      "Hauska joululahja eläkeläiselle on huppari tai paita, joka nauraa eläkepäivien vapaudelle: aamuherätys on vapaaehtoinen ja kalenteri täynnä ei mitään.",
      "Talvella huppari on eläkeläiselle käytännöllisempi kuin t-paita, joten tällä sivulla hupparit näkyvät ensin. Eläketekstit eivät ole sukupuolisidonnaisia, joten sama lahja käy eläkkeellä olevalle miehelle ja naiselle, mummolle ja papalle.",
      `Jos saaja jää eläkkeelle vasta ensi vuonna, katso myös eläkelahjat eläkejuhliin. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska joululahja eläkeläiselle?",
        a: "Eläkeläishuumorin huppari tai paita, esimerkiksi Olen eläkkeellä, 100% Eläkeläinen tai Eläkkeellä, kiireinen tekemään ei mitään.",
      },
      {
        q: "Huppari vai t-paita eläkeläiselle jouluksi?",
        a: "Huppari, jos lahja on käytössä talvella. Väljä istuvuus antaa myös anteeksi, jos koko ei osu täsmälleen. T-paita on edullisempi vaihtoehto.",
      },
      {
        q: "Sopiiko sama lahja eläkkeellä olevalle naiselle ja miehelle?",
        a: "Sopii. Eläketekstit eivät ole sukupuolisidonnaisia. Mummolle ja papalle on lisäksi omat joululahjasivut.",
      },
      {
        q: "Mitä toimitus maksaa?",
        a: `Alle ${ILMAINEN_RAJA_TEKSTI} euron tilauksissa toimitus maksaa ${TOIMITUSMAKSU_TEKSTI} euroa, ja yli ${ILMAINEN_RAJA_TEKSTI} euron tilaukset toimitetaan ilman toimituskuluja.`,
      },
      {
        q: "Ehtiikö lahja jouluksi?",
        a: `${D}`,
      },
    ],
    related: ["/joululahjat", "/joululahja-papalle", "/joululahja-mummolle", "/elakelahjat", "/lahjat/70-vuotiaalle"],
    categories: ["hupparit", "t-paidat"],
    filter: all(ELAKE, not(inCategory("bodyt"))),
    sort: "hupparit-first",
  },
  {
    path: "/joululahja-teinille",
    name: "Joululahja teinille",
    group: "joulu",
    title: "Hauska joululahja teinille 2026 | Huumorikauppa",
    description:
      "Joululahja teinille: meemipaidat kuten se oli tonnin seteli ja slay queen sekä pelaajan ja lumilautailijan paidat. Tilaa viimeistään pe 20.11.2026.",
    h1: "Hauska joululahja teinille",
    intro: [
      "Hauska joululahja teinille on meemi tai lausahdus, jonka hän tunnistaa itse, esimerkiksi se oli tonnin seteli, slay queen tai pelaajan Just One More Level.",
      "Teini valitsee vaatteensa tarkasti, joten huppari on paitaa varmempi lahja: sitä käytetään koulussa ja kotona. Tämän sivun valikoimasta on rajattu pois alkoholiin ja kirosanoihin liittyvät tekstit.",
      `Jos et tiedä, mikä meemi on teinin porukassa ajankohtainen, kysy sisarukselta ennen tilausta. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska joululahja teinille?",
        a: "Meemipaita tai -huppari, jonka teini tunnistaa, kuten se oli tonnin seteli tai slay queen, tai harrastukseen liittyvä paita pelaajalle tai lumilautailijalle.",
      },
      {
        q: "Sopivatko tuotteet nuorelle teinille?",
        a: "Tämän sivun tuotteista on rajattu pois alkoholi- ja kirosanatekstit, joten ne sopivat myös nuoremmalle teinille.",
      },
      {
        q: "Huppari vai t-paita teinille?",
        a: "Huppari on käytössä ympäri vuoden, ja väljä istuvuus sopii useammalle. T-paita on edullisempi.",
      },
      {
        q: "Ehtiikö lahja jouluksi?",
        a: `${D}`,
      },
    ],
    related: ["/meemipaidat", "/joululahja-kaverille", "/lahjat/harrastajalle", "/hauskat-hupparit"],
    categories: ["hupparit", "t-paidat"],
    filter: TEINI,
    sort: "hupparit-first",
  },
  {
    path: "/lahjat/alle-30-euroa",
    name: "Lahjat alle 30 €",
    group: "joulu",
    title: "Hauskat lahjat ja joululahjat alle 30 € | Huumorikauppa",
    description:
      "Hauskat lahjat alle 30 eurolla: t-paidat ja koristeet, myös alle 20 euron lahjat. Jouluksi tilaa viimeistään pe 20.11.2026.",
    h1: "Hauskat lahjat alle 30 euroa",
    intro: [
      "Alle 30 eurolla saat Huumorikaupasta hauskan t-paidan tai koristeen: kaikki tämän sivun tuotteet maksavat enintään 30 euroa.",
      "Alle 20 euron lahjaksi sopii koriste. Alle 20 euron lahjat on koottu tälle samalle sivulle.",
      `Pieni joululahja miehelle tai naiselle löytyy t-paidoista: valitse teksti saajan iän, ammatin tai harrastuksen mukaan. ${D}`,
    ],
    faqs: [
      {
        q: "Mitä hauskaa saa alle 30 eurolla?",
        a: "T-paidan tai koristeen. Kaikki tämän sivun tuotteet maksavat enintään 30 euroa.",
      },
      {
        q: "Löytyykö hauska lahja alle 20 euroa?",
        a: "Koriste maksaa alle 20 euroa, ja siihen saa myös oman tekstin.",
      },
      {
        q: "Onko alle 10 euron joululahjoja?",
        a: "Alle 20 euron lahjoja ovat koristeet, joihin kirjoitat oman tekstin tuotesivulla.",
      },
      {
        q: "Mitä toimitus maksaa?",
        a: `Alle ${ILMAINEN_RAJA_TEKSTI} euron tilauksissa toimitus maksaa ${TOIMITUSMAKSU_TEKSTI} euroa, ja yli ${ILMAINEN_RAJA_TEKSTI} euron tilaukset toimitetaan ilman toimituskuluja. Useampi pieni lahja samassa tilauksessa jakaa toimituskulun.`,
      },
    ],
    related: ["/joululahjat", "/joululahja-alle-50-euroa", "/lahjat/pikkujouluihin", "/salainen-joulupukki-lahja", "/joululahja-kaverille"],
    categories: ["t-paidat", "koristeet"],
    filter: maxPrice(30),
    sort: "price-desc",
  },
  {
    path: "/joululahja-alle-50-euroa",
    name: "Joululahjat alle 50 €",
    group: "joulu",
    title: "Hauska joululahja alle 50 euroa | Huumorikauppa",
    description:
      "Joululahja alle 50 eurolla: hauskat hupparit ja t-paidat sekä omalla tekstillä painettu koriste. Tilaa viimeistään pe 20.11.2026.",
    h1: "Hauskat joululahjat alle 50 euroa",
    intro: [
      "Alle 50 eurolla saat hauskan hupparin, joka on talvella t-paitaa käytännöllisempi joululahja, tai t-paidan ja pienen lisälahjan yhdessä.",
      "Hupparit maksavat 30 ja 50 euron välillä, ja ne näkyvät tällä sivulla ensin. 50 euron budjettiin mahtuvat myös t-paita ja koriste yhdessä.",
      `Kahden hupparin tilaus ylittää ${ILMAINEN_RAJA_TEKSTI} euron rajan, jolloin toimitus on ilmainen. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hyvä joululahja alle 50 euroa?",
        a: "Hauska huppari. Se mahtuu 50 euron budjettiin ja on talvella käytössä useammin kuin t-paita.",
      },
      {
        q: "Mitä muuta kuin vaatteita saa alle 50 eurolla?",
        a: "Omalla tekstillä painetun koristeen.",
      },
      {
        q: "Saako ilmaisen toimituksen?",
        a: `Yli ${ILMAINEN_RAJA_TEKSTI} euron tilaukset toimitetaan ilman toimituskuluja, eli kaksi hupparia samassa tilauksessa ylittää rajan.`,
      },
      {
        q: "Milloin joululahja on viimeistään tilattava?",
        a: `${D}`,
      },
    ],
    related: ["/lahjat/alle-30-euroa", "/joululahjat", "/hauskat-hupparit", "/joululahja-isalle"],
    categories: ["hupparit", "t-paidat"],
    filter: all(maxPrice(50), not(inCategory("bodyt"))),
    sort: "price-desc",
  },
  {
    path: "/lahjat/pikkujouluihin",
    name: "Pikkujoululahjat",
    group: "joulu",
    title: "Hauskat pikkujoululahjat 2026 | Huumorikauppa",
    description:
      "Pikkujoululahja työkaverille tai kaveriporukkaan: toimistohuumorin paidat, pikkujouluhuppari ja koriste.",
    h1: "Hauskat pikkujoululahjat",
    intro: [
      "Hauska pikkujoululahja on lahja, joka naurattaa koko porukkaa, kun se avataan muiden edessä: toimistohuumoria, yhteinen vitsi tai pikkujouluaiheinen huppari.",
      "Pieneen lahjanvaihtoon sopii koriste. Isompaan sopivat toimistohuumorin t-paidat, kuten Tärkeintä työssä on lounastauko.",
      `Pikkujouluja vietetään marras- ja joulukuussa, ja toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta, joten tilaa vähintään kaksi viikkoa ennen juhlaa.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska pikkujoululahja?",
        a: "Lahja, joka naurattaa koko porukkaa avattaessa: toimistohuumorin paita, Pikkujoulut muistetaan vuosia -huppari tai oma vitsi koristeessa.",
      },
      {
        q: "Löytyykö edullinen pikkujoululahja?",
        a: "Koriste on t-paitaa edullisempi, ja siihen saa oman tekstin.",
      },
      {
        q: "Kuinka ajoissa pikkujoululahja pitää tilata?",
        a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta, joten tilaa vähintään kaksi viikkoa ennen pikkujouluja.`,
      },
      {
        q: "Mikä sopii lahjaksi tuntemattomalle työkaverille?",
        a: "Työtä koskeva teksti, kuten Tämäkin olisi voinut olla sähköposti. Lisää vinkkejä tuntemattomalle saajalle on sivulla Salaisen joulupukin lahja.",
      },
    ],
    related: ["/salainen-joulupukki-lahja", "/joululahja-tyokaverille", "/lahjat/alle-30-euroa", "/joululahja-kaverille"],
    categories: ["t-paidat", "tarrat"],
    filter: PIKKUJOULU,
  },
  {
    path: "/salainen-joulupukki-lahja",
    name: "Salaisen joulupukin lahja",
    group: "joulu",
    title: "Salaisen joulupukin lahja: hauskat ideat | Huumorikauppa",
    description:
      "Salaisen joulupukin lahja, kun et tunne saajaa: työelämähuumorin t-paidat ja koriste, kaikki alle 30 euroa.",
    h1: "Salaisen joulupukin lahja",
    intro: [
      "Salaisen joulupukin lahjaksi sopii tuote, joka toimii kenelle tahansa: työelämää koskeva huumoripaita tai koriste, jonka vitsi ei vaadi saajan tuntemista.",
      "Jos et tiedä saajan kokoa, valitse koriste, jossa kokoa ei tarvita.",
      `Tämän sivun t-paidoissa teksti koskee työtä tai arkea eikä saajaa itseään, esimerkiksi Tärkeintä työssä on lounastauko, ja kaikki tuotteet maksavat enintään 30 euroa. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hyvä salaisen joulupukin lahja?",
        a: "Tuote, jonka vitsi toimii saajasta riippumatta, kuten työelämähuumorin t-paita tai koriste.",
      },
      {
        q: "Mitä saa salaisen joulupukin pienellä budjetilla?",
        a: "Koristeen. Se on t-paitaa edullisempi.",
      },
      {
        q: "Entä jos en tiedä saajan kokoa?",
        a: "Valitse koriste. Siinä ei ole kokoa.",
      },
      {
        q: "Sopiiko lahja työpaikan arvontaan?",
        a: "Sopii. Tämän sivun tekstit eivät koske saajan ulkonäköä, ikää tai alkoholia, joten ne voi avata koko työporukan edessä.",
      },
    ],
    related: ["/lahjat/pikkujouluihin", "/joululahja-tyokaverille", "/lahjat/alle-30-euroa", "/joululahja-kaverille"],
    categories: ["t-paidat", "koristeet"],
    filter: SALAINEN_PUKKI,
    sort: "price-desc",
  },

  // ─── Tuotteet ───
  {
    path: "/hauskat-t-paidat",
    name: "Hauskat t-paidat",
    group: "tuotteet",
    title: "Hauskat t-paidat miehille ja naisille | Huumorikauppa",
    description:
      `Hauskat t-paidat suomalaisella huumorilla: meemit, ikävuodet, ammatit, harrastukset ja kotikaupunki. Myös oma teksti. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauskat t-paidat",
    intro: [
      "Hauska t-paita on paita, jonka painatus on vitsi: Huumorikaupan valikoimassa on meemejä, ikävuosipaitoja, ammatti- ja harrastuspaitoja sekä kotikaupunkiaiheisia paitoja.",
      "Miehille valikoimassa ovat esimerkiksi Isäntä, Amatimies ja Kalju, naisille slay queen ja Super äiskä. Kaupunkipaidoissa on omat mallinsa yli 50 paikkakunnalle, ja Oma teksti/kuva -paitaan kirjoitat itse painettavan tekstin.",
      `Paidat painetaan tilauksesta painokumppaneidemme tuotantolaitoksissa. Toimitusaika Suomeen on ${TOIMITUSAIKA_TEKSTI} arkipäivää, ja yli ${ILMAINEN_RAJA_TEKSTI} euron tilaukset toimitetaan ilman toimituskuluja.`,
    ],
    faqs: [
      {
        q: "Millaisia hauskoja t-paitoja on?",
        a: "Meemipaitoja, ikävuosipaitoja 30-, 40-, 50-, 60- ja 70-vuotiaille, ammatti- ja harrastuspaitoja, kotikaupunkipaitoja sekä personoitavia paitoja.",
      },
      {
        q: "Onko hauskoja t-paitoja naisille?",
        a: "On. Esimerkiksi slay queen, Super äiskä ja ikävuosipaidat kuten 40 ja fabulous. Lisää ideoita on sivulla Hauskat lahjat naiselle.",
      },
      {
        q: "Voiko t-paitaan painaa oman tekstin?",
        a: "Voi. Oma teksti/kuva -paidassa ja personoitavissa paidoissa kirjoitat tekstin tai kuvatoiveen tuotesivulla ennen ostoskoriin lisäämistä.",
      },
      {
        q: "Kauanko toimitus kestää?",
        a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta. ${D}`,
      },
    ],
    related: ["/hauskat-hupparit", "/meemipaidat", "/setamiespaidat", "/suomalainen-huumori-paidat", "/ammattipaidat"],
    categories: ["t-paidat"],
    filter: inCategory("t-paidat"),
  },
  {
    path: "/hauskat-hupparit",
    name: "Hauskat hupparit",
    group: "tuotteet",
    title: "Hauskat hupparit miehille ja naisille | Huumorikauppa",
    description:
      "Hauskat hupparit suomalaisella huumorilla: eläkeläis-, ikävuosi-, meemi- ja kaupunkihupparit sekä oma teksti. Tilaa jouluksi viimeistään pe 20.11.2026.",
    h1: "Hauskat hupparit",
    intro: [
      "Hauska huppari on huppari, jonka painatus on vitsi: valikoimassa on eläkeläis- ja ikävuosihuppareita, meemejä, äiti- ja isäaiheisia huppareita sekä kotikaupunkihuppareita.",
      "Huppari on talven lahjoista käytännöllinen, koska sitä käytetään sisällä ja ulkona, ja väljä istuvuus antaa anteeksi, jos koko ei osu täsmälleen. Kaupunkihuppareissa paikkakuntalainen selviää mistä vain.",
      `Hupparit painetaan tilauksesta painokumppaneidemme tuotantolaitoksissa ja toimitetaan Suomeen ${TOIMITUSAIKA_TEKSTI} arkipäivässä. ${D}`,
    ],
    faqs: [
      {
        q: "Millaisia hauskoja huppareita on?",
        a: "Eläkeläis- ja ikävuosihuppareita, meemihuppareita kuten se oli tonnin seteli, äiti- ja isäaiheisia huppareita, kaupunkihuppareita ja Oma teksti/kuva -huppari.",
      },
      {
        q: "Onko hauskoja huppareita miehille?",
        a: "On. Esimerkiksi Isäntä, Kalju, Amatimies ja Museokamaa. Lisää ideoita on sivulla Hauskat lahjat miehelle.",
      },
      {
        q: "Huppari vai t-paita lahjaksi?",
        a: "Huppari on talvella käytössä useammin, ja sen väljä istuvuus antaa anteeksi, jos koko ei osu täsmälleen. T-paita on edullisempi.",
      },
      {
        q: "Voiko hupparin palauttaa?",
        a: "Tilauksilla on 14 päivän peruutusoikeus. Palautuksen postikulut maksaa asiakas, ellei tuote ole virheellinen.",
      },
    ],
    related: ["/hauskat-t-paidat", "/lahjat/joululahjaksi-miehelle", "/joululahja-alle-50-euroa", "/elakelahjat"],
    categories: ["hupparit"],
    filter: inCategory("hupparit"),
  },
  {
    path: "/meemipaidat",
    name: "Meemipaidat",
    group: "tuotteet",
    title: "Meemipaidat: hauskat meemi t-paidat | Huumorikauppa",
    description:
      `Meemipaidat ja -hupparit suomalaisista meemeistä: se oli tonnin seteli, oispa kaljaa, Saatanan Tunarit, ICE AATANA ja Kalju. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Meemipaidat",
    intro: [
      "Meemipaita on t-paita tai huppari, johon on painettu tunnettu meemi tai lausahdus, kuten se oli tonnin seteli, oispa kaljaa tai ois viisaampi häipyy täält.",
      "Suomalainen meemi toimii paidassa, koska sen tunnistaa ilman selityksiä. Valikoimassa ovat myös ICE AATANA, Maailman Mestarit 2026, Saatanan Tunarit, Kalju ja Amatimies, ja useimmista on sekä t-paita että huppari.",
      "Meemipaita on helppo lahja kaverille, jonka huumorin tunnet. Teinille sopivat meemit ilman alkoholia ja kirosanoja on koottu sivulle Hauska joululahja teinille.",
    ],
    faqs: [
      {
        q: "Mikä on meemipaita?",
        a: "Paita, johon on painettu tunnettu meemi tai lausahdus. Meemipaidan vitsin tunnistaa ilman selitystä.",
      },
      {
        q: "Mitä meemejä paidoissa on?",
        a: "Esimerkiksi se oli tonnin seteli, Tonnin Seteli, oispa kaljaa, Saatanan Tunarit, ICE AATANA, Kalju ja Amatimies.",
      },
      {
        q: "Onko meemipaitoja hupparina?",
        a: "On. Useimmista meemiteksteistä on sekä t-paita että huppari.",
      },
      {
        q: "Voiko oman meemin painaa paitaan?",
        a: "Voi. Oma teksti/kuva -paidassa kirjoitat tekstin tai kuvatoiveen tuotesivulla.",
      },
    ],
    related: ["/suomalainen-huumori-paidat", "/setamiespaidat", "/hauskat-t-paidat", "/joululahja-kaverille", TONNIN_SETELI_PATH],
    categories: ["t-paidat", "hupparit"],
    filter: MEEMI,
  },
  {
    path: "/suomalainen-huumori-paidat",
    name: "Suomalainen huumori",
    group: "tuotteet",
    title: "Suomalainen huumori t-paidat ja hupparit | Huumorikauppa",
    description:
      `T-paidat ja hupparit suomalaisella huumorilla: Saatanan Tunarit, Suomi Finland, Isäntä, avantouinti ja pilkkiminen. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Suomalainen huumori paidoissa",
    intro: [
      "Suomalainen huumori t-paidassa tarkoittaa tekstiä, joka nojaa suomalaiseen arkeen: kirosanat, talon isäntä, avantouinti, pilkkiminen ja oispa kaljaa.",
      "Kirosanahuumoria edustavat Saatanan Tunarit ja ICE AATANA, kotimaista ylpeyttä Suomi Finland. Talven lajeille on omat paitansa: avantouijan -20°C sopiva uimakeli ja pilkkijän Jää kantaa, pilkki tulee.",
      "Sisua kotiseudulta tarjoavat kaupunkihupparit, joissa paikkakuntalainen selviää mistä vain. Ne löytyvät kaupunkisivuilta, esimerkiksi Tampere ja Oulu.",
    ],
    faqs: [
      {
        q: "Mitä on suomalainen huumori paidassa?",
        a: "Tekstejä, jotka nojaavat suomalaiseen arkeen: kirosanoja, talon isäntä, avantouinti, pilkkiminen ja oispa kaljaa.",
      },
      {
        q: "Onko perkele-paitoja?",
        a: "Perkele-tekstiä valikoimassa ei ole. Kirosanahuumoria ovat Saatanan Tunarit ja ICE AATANA, ja Oma teksti/kuva -paitaan voit kirjoittaa oman tekstin.",
      },
      {
        q: "Onko saunapaitoja?",
        a: "Valikoimassa ei ole saunapaitoja. Saunojalle sopivat talven lajien paidat, kuten avantouijan ja pilkkijän paidat.",
      },
      {
        q: "Onko sisu-paitoja?",
        a: "Sisu näkyy kaupunkihuppareissa, joissa paikkakuntalainen selviää mistä vain. Ne löytyvät kaupunkisivuilta.",
      },
    ],
    related: ["/meemipaidat", "/setamiespaidat", "/hauskat-t-paidat", "/lahjat/harrastajalle"],
    categories: ["t-paidat", "hupparit"],
    extraLinks: [
      { href: "/kaupunki/tampere", label: "Tampere-paidat" },
      { href: "/kaupunki/oulu", label: "Oulu-paidat" },
    ],
    filter: SUOMI,
  },
  {
    path: TONNIN_SETELI_PATH,
    name: "Tonnin seteli -paidat",
    group: "tuotteet",
    title: "Se oli tonnin seteli -paita ja huppari | Huumorikauppa",
    description:
      `Se oli tonnin seteli -paita ja -huppari sekä Tonnin Seteli -paidat meemin tunteville. Koot S-5XL, toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Se oli tonnin seteli -paidat ja hupparit",
    intro: [
      "Se oli tonnin seteli on suomalainen meemilausahdus, jolla surraan liioitellen rahaa, joka vain katosi: tonnin seteliä harva on koskaan nähnyt, ja juuri liioittelu tekee vitsistä hauskan.",
      "Tekstistä on kaksi versiota. Se oli tonnin seteli. on koko lausahdus pisteen kanssa, ja Tonnin Seteli on lyhyempi teksti. Kummastakin on t-paita ja huppari kooissa S-5XL, ja ne näkyvät listassa ensimmäisinä.",
      `Samaan sarjaan sopivat muut suomalaiset meemit, kuten oispa kaljaa, Saatanan Tunarit, ICE AATANA ja ois viisaampi häipyy täält. Yli ${ILMAINEN_RAJA_TEKSTI} euron tilaukset toimitetaan ilman toimituskuluja.`,
    ],
    faqs: [
      {
        q: "Mitä se oli tonnin seteli tarkoittaa?",
        a: "Se on suomalainen meemilausahdus, jolla muistellaan suureellisesti kadonnutta rahaa. Vitsi on liioittelussa: menetys kuulostaa lopulliselta ja dramaattiselta, vaikka tarina paisuu joka kerta kerrottaessa.",
      },
      {
        q: "Mitä eroa on se oli tonnin seteli- ja Tonnin Seteli -paidoilla?",
        a: "Teksti. Se oli tonnin seteli. -tuotteissa on koko lausahdus pisteen kanssa, Tonnin Seteli -tuotteissa lyhyempi teksti. Kummastakin on t-paita ja huppari.",
      },
      {
        q: "Kenelle tonnin seteli -paita sopii lahjaksi?",
        a: "Kaverille, veljelle tai työkaverille, joka tuntee meemin tai muistelee menetettyjä rahojaan joka illanvietossa. Se sopii synttäreille, pikkujouluihin ja joululahjaksi.",
      },
      {
        q: "Mitä kokoja tonnin seteli -paidoissa on?",
        a: "T-paidat ja hupparit ovat kooissa S-5XL. Tuotesivun kokoapu näyttää valitulle värille saatavilla olevat koot.",
      },
      {
        q: "Ehtiikö tonnin seteli -paita jouluksi?",
        a: `${D}`,
      },
    ],
    related: ["/meemipaidat", "/suomalainen-huumori-paidat", "/joululahja-kaverille", "/lahjat/veljelle", "/joululahjat"],
    categories: ["t-paidat", "hupparit"],
    extraLinks: [
      { href: TONNIN_SETELI_TPAITA, label: "Tonnin Seteli -t-paita" },
      { href: SE_OLI_TPAITA, label: "Se oli tonnin seteli -t-paita" },
    ],
    filter: any(TONNIN_SETELI, SUOMI_MEEMIT),
    featured: TONNIN_SETELI,
  },
  {
    path: "/setamiespaidat",
    name: "Setämiespaidat",
    group: "tuotteet",
    title: "Setämiespaidat ja äijäpaidat | Huumorikauppa",
    description:
      `Setämiespaidat ja äijäpaidat: Kalju, Isäntä, Amatimies, Museokamaa ja Jos iskä ei osaa korjata sitä. T-paidat ja hupparit, toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Setämiespaidat",
    intro: [
      "Setämiespaita on t-paita tai huppari, jonka teksti nauraa keski-ikäisen miehen omille jutuille: kalju, talon isäntä, kaiken itse korjaaminen ja grillin vartiointi.",
      "Äijäpaitoja ovat esimerkiksi Isäntä, Amatimies ja Kalju. Isille sopii Jos iskä ei osaa korjata sitä ja vanhemmalle setämiehelle Museokamaa. Tekstit ovat lyhyitä, ja ne erottuvat kauas.",
      `Setähuumori toimii lahjana, kun saaja vitsailee itsekin samoista asioista. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on setämiespaita?",
        a: "Huumoripaita, jonka teksti liittyy keski-ikäisen miehen omiin juttuihin, kuten kaljuun, isännän rooliin tai kaiken itse korjaamiseen.",
      },
      {
        q: "Mitä eroa on setämiespaidalla ja äijäpaidalla?",
        a: "Molemmat ovat miehen omille piirteille nauravia tekstipaitoja. Äijämäisiä ovat Isäntä ja Amatimies, setämäisiä Museokamaa ja Jos iskä ei osaa korjata sitä.",
      },
      {
        q: "Sopiiko setämiespaita lahjaksi isälle?",
        a: "Sopii, kun isä nauraa itselleen. Isälle rajatut tuotteet ovat sivulla Hauska joululahja isälle.",
      },
      {
        q: "Onko setämiespaitoja hupparina?",
        a: "On. Kalju, Isäntä, Amatimies ja Museokamaa ovat saatavilla myös hupparina.",
      },
    ],
    related: ["/joululahja-isalle", "/hauska-isanpaivalahja", "/hauskat-lahjat-miehelle", "/meemipaidat", "/lahjat/50-vuotiaalle-miehelle"],
    categories: ["t-paidat", "hupparit"],
    filter: SETA,
  },

  // ─── Lahjat ───
  {
    path: "/lahjat/40-vuotiaalle-miehelle",
    name: "Lahja 40-vuotiaalle miehelle",
    group: "lahjat",
    title: "Hauska lahja 40-vuotiaalle miehelle | Huumorikauppa",
    description:
      `40 v lahja miehelle: 40v-paidat ja -hupparit kuten 40v ei vanha, vintage ja 40 vuotta, henkisesti 18. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä, ilmainen yli ${ILMAINEN_RAJA_TEKSTI} €.`,
    h1: "Hauskat lahjat 40-vuotiaalle miehelle",
    intro: [
      "Hauska lahja 40-vuotiaalle miehelle on 40v-paita tai -huppari, jonka teksti kääntää ikävuodet vitsiksi, kuten 40v ei vanha, vintage tai 40v kunnossa niinku 20v.",
      "40-vuotistekstit tekevät iästä vitsin aiheen ilman loukkausta: ne kehuvat tai liioittelevat. Jos syntymäpäiväsankari on isä, sopivat myös isä-aiheiset paidat, ja harrastajalle harrastuspaidat.",
      `Juhliin tilaa ajoissa, sillä toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja 40-vuotiaalle miehelle?",
        a: "40v-paita tai -huppari, esimerkiksi 40v ei vanha, vintage tai 40 vuotta, henkisesti 18.",
      },
      {
        q: "Millainen ikävitsi ei loukkaa 40-vuotiasta?",
        a: "Teksti, joka kehuu tai liioittelee hyvään suuntaan, kuten 40v ei keski-ikä, klassikko. Se nauraa iälle eikä saajalle.",
      },
      {
        q: "Kuinka ajoissa lahja pitää tilata?",
        a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta, joten tilaa vähintään kaksi viikkoa ennen juhlia.`,
      },
      {
        q: "Onko 40-vuotiaalle naiselle omia paitoja?",
        a: "40 ja fabulous on tehty juhlijalle, joka juhlii tyylillä. Naisten lahjaideat ovat sivulla Hauskat lahjat naiselle.",
      },
    ],
    related: ["/lahjat/50-vuotiaalle-miehelle", "/syntymapaivalahjat", "/hauskat-lahjat-miehelle", "/lahjat/harrastajalle"],
    categories: ["t-paidat", "hupparit"],
    filter: all(age(40), not(workYears), not(theme(/fabulous/))),
  },
  {
    path: "/lahjat/50-vuotiaalle-miehelle",
    name: "Lahja 50-vuotiaalle miehelle",
    group: "lahjat",
    title: "Hauska lahja 50-vuotiaalle miehelle | Huumorikauppa",
    description:
      `50 v lahja miehelle: 50v-paidat ja -hupparit kuten 50v puoli vuosisataa, ei naarmuakaan ja Museokamaa. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauskat lahjat 50-vuotiaalle miehelle",
    intro: [
      "Hauska lahja 50-vuotiaalle miehelle on 50v-paita tai -huppari, jossa puoli vuosisataa on vitsin aihe, kuten 50v puoli vuosisataa, ei naarmuakaan tai 50 ja hopeanhohtoinen (vain hiukset).",
      "Museokamaa sopii 50-vuotiaalle, joka nauraa jo itselleen vanhana mallina, ja 50 vuotta nuori juhlijalle, joka ei koe ikäänsä.",
      `50-vuotislahjaksi huppari on t-paitaa näyttävämpi, ja yli ${ILMAINEN_RAJA_TEKSTI} euron tilaukset toimitetaan ilman toimituskuluja. Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja 50-vuotiaalle miehelle?",
        a: "50v-paita tai -huppari, esimerkiksi 50v puoli vuosisataa, ei naarmuakaan, tai Museokamaa.",
      },
      {
        q: "Mitä antaa 50-vuotiaalle, jolla on jo kaikkea?",
        a: "Personoitavan paidan, johon lisätään hänen nimensä tai lempinimensä, kuten Elävä legenda. Personoitavat tuotteet ovat sivulla Joululahja miehelle, jolla on kaikki.",
      },
      {
        q: "Sopiiko ikävitsi lahjaksi 50-vuotiaalle?",
        a: "Sopii, kun teksti on myönteinen. 50 vuotta nuori ja 50v puoli vuosisataa, ei naarmuakaan kehuvat eivätkä moiti.",
      },
      {
        q: "Kuinka ajoissa tilaus pitää tehdä?",
        a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää, joten tilaa vähintään kaksi viikkoa ennen juhlia.`,
      },
    ],
    related: ["/lahjat/40-vuotiaalle-miehelle", "/lahjat/60-vuotiaalle-miehelle", "/syntymapaivalahjat", "/setamiespaidat"],
    categories: ["t-paidat", "hupparit"],
    filter: any(age(50), theme(/museokamaa/)),
  },
  {
    path: "/lahjat/60-vuotiaalle-miehelle",
    name: "Lahja 60-vuotiaalle miehelle",
    group: "lahjat",
    title: "Hauska lahja 60-vuotiaalle miehelle | Huumorikauppa",
    description:
      `60 v lahja miehelle: 60v-paidat ja -hupparit kuten 60v takuu mennyt, toimii silti ja 60 vuotta nuori ja nokkela. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauskat lahjat 60-vuotiaalle miehelle",
    intro: [
      "Hauska lahja 60-vuotiaalle miehelle on 60v-paita tai -huppari, jonka teksti kehuu kokemusta tai liioittelee kuntoa, kuten 60v takuu mennyt, toimii silti.",
      "Valikoimassa on useita 60-vuotisaiheita, ja useimmista on sekä t-paita että huppari. Jos 60-vuotias on jäämässä eläkkeelle, eläkelahjoissa ovat Olen eläkkeellä ja muut eläketekstit.",
      `60-vuotislahja kannattaa tilata vähintään kaksi viikkoa ennen juhlia, sillä toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja 60-vuotiaalle miehelle?",
        a: "60v-paita tai -huppari, esimerkiksi 60v kokenut, ei vanha tai 60v takuu mennyt, toimii silti.",
      },
      {
        q: "Sopiiko lahja myös naiselle?",
        a: "60-vuotistekstit eivät ole sukupuolisidonnaisia. Naisille rajattu valikoima on sivulla Hauskat lahjat 60-vuotiaalle naiselle.",
      },
      {
        q: "Mikä sopii 60-vuotiaalle, joka jää eläkkeelle?",
        a: "Eläkeläishuumori, kuten Olen eläkkeellä tai Eläkeläinen, aamuherätys vapaaehtoinen. Ne ovat sivulla Hauskat eläkelahjat.",
      },
      {
        q: "Kauanko toimitus kestää?",
        a: `${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta. Yli ${ILMAINEN_RAJA_TEKSTI} euron tilaukset toimitetaan ilman toimituskuluja.`,
      },
    ],
    related: ["/lahjat/60-vuotiaalle-naiselle", "/lahjat/50-vuotiaalle-miehelle", "/lahjat/70-vuotiaalle", "/elakelahjat"],
    categories: ["t-paidat", "hupparit"],
    filter: age(60),
  },
  {
    path: "/lahjat/70-vuotiaalle",
    name: "Lahja 70-vuotiaalle",
    group: "lahjat",
    title: "Hauska lahja 70-vuotiaalle | Huumorikauppa",
    description:
      `70 v lahja miehelle tai naiselle: 70 vuotta, mitä siitä -paita, ukki- ja pappa-paidat sekä eläkeläisen hupparit. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauskat lahjat 70-vuotiaalle",
    intro: [
      "Hauska lahja 70-vuotiaalle on paita, jossa ikä on sivuseikka, kuten 70 vuotta, mitä siitä, tai eläkepäivistä nauttiva teksti, kuten Eläkkeellä, kiireinen tekemään ei mitään.",
      "70-vuotiaalle isälle tai isoisälle sopivat ukki- ja pappa-paidat sekä Museokamaa. Eläkeläistekstit eivät ole sukupuolisidonnaisia, joten ne käyvät myös 70-vuotiaalle naiselle.",
      `Jos juhlija kalastaa tai mökkeilee, harrastuspaidat ovat sivulla Hauskat lahjat harrastajalle. Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää, joten tilaa vähintään kaksi viikkoa ennen juhlia.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja 70-vuotiaalle?",
        a: "Paita, jonka teksti tekee iästä sivuseikan, kuten 70 vuotta, mitä siitä, tai eläkeläishuumori.",
      },
      {
        q: "Mikä on 70 v lahja isälle?",
        a: "Ukki- tai pappa-paita, jos hänellä on lapsenlapsia, tai Museokamaa. Isälle rajattu valikoima on sivulla Hauska joululahja isälle.",
      },
      {
        q: "Sopivatko tuotteet 70-vuotiaalle naiselle?",
        a: "Eläkeläistekstit sopivat, koska ne eivät ole sukupuolisidonnaisia. Ukki- ja pappa-paidat on tehty miehelle.",
      },
      {
        q: "Voiko lahjaan lisätä onnittelutekstin?",
        a: "Voi. Oma teksti/kuva -tuotteissa kirjoitat oman tekstin tuotesivulla, enintään 200 merkkiä.",
      },
    ],
    related: ["/lahjat/60-vuotiaalle-miehelle", "/elakelahjat", "/lahjat/isoisalle", "/joululahja-papalle"],
    categories: ["t-paidat", "hupparit"],
    filter: any(age(70), ELAKE, PAPPA, theme(/museokamaa/)),
  },
  {
    path: "/lahjat/50-vuotiaalle-naiselle",
    name: "Lahja 50-vuotiaalle naiselle",
    group: "lahjat",
    title: "Hauska lahja 50-vuotiaalle naiselle | Huumorikauppa",
    description:
      `50 v lahja naiselle: 50 ja hopeanhohtoinen (vain hiukset), 50 vuotta nuori ja muut 50v-paidat ja -hupparit sekä Super äiskä. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauskat lahjat 50-vuotiaalle naiselle",
    intro: [
      "Hauska lahja 50-vuotiaalle naiselle on 50v-paita tai -huppari, jonka teksti kehuu, kuten 50 vuotta nuori tai 50 ja hopeanhohtoinen (vain hiukset).",
      "Naiselle valittu ikävitsi toimii, kun se on hänen puolellaan: tekstit kuten 50v puoli vuosisataa, ei naarmuakaan nauravat iälle eivätkä ulkonäölle. Äidille 50-vuotislahjaksi sopii myös Super äiskä -huppari.",
      `Huppari on t-paitaa näyttävämpi juhlalahja. Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää, joten tilaa vähintään kaksi viikkoa ennen juhlia.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja 50-vuotiaalle naiselle?",
        a: "50v-paita tai -huppari, jonka teksti kehuu, kuten 50 vuotta nuori tai 50 ja hopeanhohtoinen (vain hiukset).",
      },
      {
        q: "Mikä on 50 v lahja äidille?",
        a: "50-vuotishuppari tai Super äiskä -huppari. Äidille rajatut tuotteet ovat sivulla Hauska joululahja äidille.",
      },
      {
        q: "Millainen ikävitsi sopii naiselle?",
        a: "Myönteinen teksti, joka koskee ikää eikä ulkonäköä, kuten 50 vuotta nuori.",
      },
      {
        q: "Kuinka ajoissa lahja pitää tilata?",
        a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta, joten tilaa vähintään kaksi viikkoa ennen juhlia.`,
      },
    ],
    related: ["/lahjat/60-vuotiaalle-naiselle", "/hauskat-lahjat-naiselle", "/syntymapaivalahjat", "/lahjat/50-vuotiaalle-miehelle"],
    categories: ["hupparit", "t-paidat"],
    filter: any(age(50), theme(/äiskä/, /slay queen/)),
  },
  {
    path: "/lahjat/60-vuotiaalle-naiselle",
    name: "Lahja 60-vuotiaalle naiselle",
    group: "lahjat",
    title: "Hauska lahja 60-vuotiaalle naiselle | Huumorikauppa",
    description:
      "60 v lahja naiselle tai äidille: 60v-paidat ja -hupparit kuten 60v mutta sydän kuin 20v sekä omalla tekstillä painettu koriste.",
    h1: "Hauskat lahjat 60-vuotiaalle naiselle",
    intro: [
      "Hauska lahja 60-vuotiaalle naiselle on 60v-paita tai -huppari, jonka teksti korostaa mieltä eikä vuosia, kuten 60v mutta sydän kuin 20v tai 60 vuotta nuori ja nokkela.",
      "Jos 60-vuotias on äiti tai isoäiti, lahjaksi sopii myös omalla tekstillä painettu huppari, paita tai koriste, johon kirjoitetaan lasten tai lastenlasten tervehdys.",
      `Eläkkeelle jäävälle 60-vuotiaalle sopivat myös eläkelahjat. Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja 60-vuotiaalle naiselle?",
        a: "60v-paita tai -huppari, esimerkiksi 60v mutta sydän kuin 20v tai 60 vuotta nuori ja nokkela.",
      },
      {
        q: "Mikä on 60 v lahja äidille?",
        a: "60-vuotishuppari tai omalla tekstillä painettu paita, jossa on lasten tervehdys.",
      },
      {
        q: "Sopivatko 60v-paidat myös miehelle?",
        a: "Sopivat, tekstit eivät ole sukupuolisidonnaisia. Miehille rajattu valikoima on sivulla Hauskat lahjat 60-vuotiaalle miehelle.",
      },
      {
        q: "Kuinka ajoissa lahja pitää tilata?",
        a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää, joten tilaa vähintään kaksi viikkoa ennen juhlia.`,
      },
    ],
    related: ["/lahjat/60-vuotiaalle-miehelle", "/lahjat/50-vuotiaalle-naiselle", "/elakelahjat", "/lahjat/isoaidille"],
    categories: ["hupparit", "peitot"],
    filter: any(age(60), OMA_KOTIIN),
  },
  {
    path: "/elakelahjat",
    name: "Eläkelahjat",
    group: "lahjat",
    title: "Hauskat eläkelahjat miehelle ja naiselle | Huumorikauppa",
    description:
      `Eläkelahja huumorilla: Olen eläkkeellä, 100% Eläkeläinen ja Eläkeläinen, aamuherätys vapaaehtoinen -paidat ja hupparit. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauskat eläkelahjat",
    intro: [
      "Hauska eläkelahja on paita tai huppari, joka juhlii vapautta työstä, kuten Olen eläkkeellä, Eläkkeellä, kiireinen tekemään ei mitään tai 40 vuotta töitä, nyt ikuinen viikonloppu.",
      `Eläketekstit eivät ole sukupuolisidonnaisia, joten sama lahja käy eläkkeelle jäävälle miehelle ja naiselle. Työkavereiden yhteislahjaksi sopii huppari, ja yli ${ILMAINEN_RAJA_TEKSTI} euron tilaukset toimitetaan ilman toimituskuluja.`,
      `Eläkejuhliin tilaa vähintään kaksi viikkoa etukäteen, sillä toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska eläkelahja?",
        a: "Paita tai huppari, joka juhlii vapaata, esimerkiksi Olen eläkkeellä tai Eläkeläinen, aamuherätys vapaaehtoinen.",
      },
      {
        q: "Mikä on eläkelahja miehelle?",
        a: "Eläkeläishuppari, kuten 100% Eläkeläinen tai Olen eläkkeellä. Isoisälle sopivat myös ukki- ja pappa-paidat.",
      },
      {
        q: "Mikä on eläkelahja naiselle?",
        a: "Samat eläketekstit, koska ne eivät ole sukupuolisidonnaisia. Esimerkiksi Eläkkeellä, kiireinen tekemään ei mitään sopii kenelle tahansa.",
      },
      {
        q: "Mikä sopii työkavereiden yhteiseksi eläkelahjaksi?",
        a: "Huppari, jonka hinta jaetaan. Siihen voi liittää kortin, jossa on koko työporukan terveiset.",
      },
    ],
    related: ["/joululahja-elakelaiselle", "/lahjat/70-vuotiaalle", "/lahjat/60-vuotiaalle-miehelle", "/lahjat/tyokaverille", "/joululahja-papalle"],
    categories: ["hupparit", "t-paidat"],
    filter: ELAKE,
  },
  {
    path: "/lahjat/isoisalle",
    name: "Lahja isoisälle",
    group: "lahjat",
    title: "Hauska lahja isoisälle | Huumorikauppa",
    description:
      "Lahja isoisälle tai vaarille: ukki- ja pappa-paidat, Museokamaa, eläkeläisen hupparit ja kalastusaiheiset paidat. Sopii joululahjaksi ja synttäreille.",
    h1: "Hauskat lahjat isoisälle",
    intro: [
      "Hauska lahja isoisälle on paita tai huppari, jossa lukee ukki tai pappa, sillä teksti kertoo suoraan, keneltä lahja tulee.",
      "Eläkkeellä olevalle isoisälle sopivat Museokamaa- ja eläkeläisaiheet, kalastavalle KALAMIES. Vaari-tekstiä valikoimassa ei ole, joten vaarille valitse personoitava Lempinimi-paita omalla tekstillä.",
      `Syntymäpäivälahjaksi tilaa vähintään kaksi viikkoa ennen juhlaa. Joululahjaksi: ${D.charAt(0).toLowerCase()}${D.slice(1)}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja isoisälle?",
        a: "Ukki- tai pappa-paita tai -huppari. Teksti kertoo, että lahja tulee lapsenlapsilta.",
      },
      {
        q: "Mikä on hauska joululahja isoisälle?",
        a: `Huppari, koska sitä käytetään talvella. ${D}`,
      },
      {
        q: "Onko vaari-paitoja?",
        a: "Valmista vaari-tekstiä ei ole. Personoitavaan Lempinimi-paitaan kirjoitat itse tekstin, esimerkiksi vaarin lempinimen.",
      },
      {
        q: "Mitä antaa isoisälle, joka kalastaa?",
        a: "KALAMIES-paidan tai Huonokin päivä kalassa -paidan. Lisää harrastuspaitoja on sivulla Hauskat lahjat harrastajalle.",
      },
    ],
    related: ["/joululahja-papalle", "/isanpaivalahja", "/lahjat/70-vuotiaalle", "/elakelahjat", "/lahjat/isoaidille"],
    categories: ["t-paidat", "hupparit"],
    filter: any(PAPPA_ALL, theme(/lempinimi/)),
  },
  {
    path: "/lahjat/isoaidille",
    name: "Lahja isoäidille",
    group: "lahjat",
    title: "Hauska lahja isoäidille | Huumorikauppa",
    description:
      "Lahja isoäidille: omalla tekstillä painettu koriste sekä eläkeläisen paidat ja hupparit. Sopii joululahjaksi ja syntymäpäiville.",
    h1: "Hauskat lahjat isoäidille",
    intro: [
      "Hauska lahja isoäidille on tuote, jossa on lastenlasten oma tervehdys, kuten omalla tekstillä painettu huppari, paita tai koriste.",
      "Valmiita mummo- tai isoäiti-tekstejä valikoimassa ei ole. Siksi tälle sivulle on koottu Oma teksti/kuva -tuotteet, joihin kirjoitetaan oma teksti tai kuvatoive, sekä eläkeläisaiheiset paidat, jotka sopivat isoäidille yhtä hyvin kuin isoisälle.",
      `Syntymäpäivälahjaksi tilaa vähintään kaksi viikkoa etukäteen. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja isoäidille?",
        a: "Omalla tekstillä painettu tuote, kuten huppari tai koriste, jossa on lastenlasten tervehdys.",
      },
      {
        q: "Mikä on hauska joululahja isoäidille?",
        a: `Koriste tai huppari lastenlasten tekstillä. ${D}`,
      },
      {
        q: "Kuinka teksti lisätään?",
        a: "Kirjoita teksti tai kuvatoive tuotesivun kenttään ennen ostoskoriin lisäämistä. Kenttään mahtuu 200 merkkiä.",
      },
      {
        q: "Löytyykö isoäidille huumoripaitoja?",
        a: "Eläkeläisaiheiset paidat ja hupparit, kuten Eläkeläinen, aamuherätys vapaaehtoinen.",
      },
    ],
    related: ["/joululahja-mummolle", "/lahjat/isoisalle", "/lahjat/60-vuotiaalle-naiselle", "/joululahja-aidille"],
    categories: ["peitot", "seinataulut"],
    filter: MUMMO,
  },
  {
    path: "/lahjat/siskolle",
    name: "Lahja siskolle",
    group: "lahjat",
    title: "Hauska lahja siskolle | Huumorikauppa",
    description:
      "Lahja siskolle syntymäpäiväksi tai jouluksi: slay queen- ja ikävuosipaidat, hupparit sekä sisarusten oma vitsi koristeessa tai paidassa.",
    h1: "Hauskat lahjat siskolle",
    intro: [
      "Hauska lahja siskolle on paita tai pikkulahja, jossa on sisarusten oma vitsi tai teksti, jonka sisko pukisi itse päälleen, kuten slay queen.",
      "Syntymäpäivälahjaksi siskolle sopii ikävuosipaita, jos hän täyttää pyöreitä, esimerkiksi 30v paranen iän myötä kuin viini tai 40 ja fabulous. Lapsuuden sisäpiirin vitsin saat Oma teksti/kuva -koristeeseen tai -paitaan.",
      `Jos sisko on äiti, sopii myös Super äiskä -huppari. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja siskolle?",
        a: "Paita tai pikkulahja, jossa on sisarusten yhteinen vitsi tai siskon oma tyyli, kuten slay queen.",
      },
      {
        q: "Mikä on hauska syntymäpäivälahja siskolle?",
        a: "Ikävuosipaita, jos hän täyttää pyöreitä, tai omalla tekstillä painettu tuote.",
      },
      {
        q: "Löytyykö pieni lahja siskolle?",
        a: "Koriste on t-paitaa edullisempi, ja siihen saa oman tekstin.",
      },
      {
        q: "Ehtiikö lahja jouluksi?",
        a: `${D}`,
      },
    ],
    related: ["/lahjat/veljelle", "/hauskat-lahjat-naiselle", "/lahjat/joululahjaksi-naiselle", "/joululahja-kaverille"],
    categories: ["t-paidat", "hupparit"],
    filter: SISKO,
  },
  {
    path: "/lahjat/veljelle",
    name: "Lahja veljelle",
    group: "lahjat",
    title: "Hauska lahja veljelle | Huumorikauppa",
    description:
      `Lahja veljelle syntymäpäiväksi tai jouluksi: meemipaidat, Kalju, oispa kaljaa sekä pelaajan ja kuntosalin paidat ja hupparit. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauskat lahjat veljelle",
    intro: [
      "Hauska lahja veljelle on paita, joka nauraa hänen jutuilleen niin kuin vain sisarus voi: kalju, kuntosalilla ohitettu jalkapäivä tai loputon pelaaminen.",
      "Aikuiselle veljelle sopivat meemit kuten se oli tonnin seteli ja oispa kaljaa sekä harrastuspaidat. Jos veli on jo isä, isän joululahjasivulla on iskä- ja isäntäpaidat.",
      `Jos et tiedä veljen kokoa, huppari on t-paitaa varmempi valinta. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja veljelle?",
        a: "Paita, joka nauraa hänen omille jutuilleen, kuten Kalju, Jalkapäivä ohitettu jälleen tai Just One More Level.",
      },
      {
        q: "Mikä on hauska lahja aikuiselle veljelle?",
        a: "Meemipaita kuten se oli tonnin seteli, tai harrastukseen liittyvä paita.",
      },
      {
        q: "Mitä jos en tiedä veljen kokoa?",
        a: "Valitse huppari, sillä väljä istuvuus ei haittaa hupparissa. Tilauksilla on 14 päivän peruutusoikeus.",
      },
      {
        q: "Ehtiikö lahja jouluksi?",
        a: `${D}`,
      },
    ],
    related: ["/lahjat/siskolle", "/meemipaidat", "/hauskat-lahjat-miehelle", "/lahjat/harrastajalle"],
    categories: ["t-paidat", "hupparit"],
    filter: VELI,
  },
  {
    path: "/lahjat/puolisolle",
    name: "Lahja puolisolle",
    group: "lahjat",
    title: "Hauska lahja puolisolle ja kumppanille | Huumorikauppa",
    description:
      "Lahja tyttöystävälle tai poikaystävälle: I love my girlfriend- ja I love my boyfriend -paidat ja hupparit sekä omalla tekstillä painetut lahjat.",
    h1: "Hauskat lahjat puolisolle, tyttöystävälle ja poikaystävälle",
    intro: [
      "Hauska lahja poikaystävälle on I love my girlfriend -paita ja tyttöystävälle I love my boyfriend -paita tai -huppari: saaja pukee päälleen tekstin, joka kertoo, kenen kanssa hän on.",
      "Pitkään yhdessä olleille sopii omalla tekstillä painettu paita tai huppari, jossa on teidän oma lausahduksenne. Personoitavaan Lempinimi-paitaan painetaan nimi, jota vain sinä käytät.",
      `${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja poikaystävälle?",
        a: "I love my girlfriend -paita tai -huppari. Hän kantaa sitä, ja teksti viittaa sinuun.",
      },
      {
        q: "Mikä on hauska lahja tyttöystävälle?",
        a: "I love my boyfriend -huppari tai -paita, tai omalla tekstillä painettu tuote.",
      },
      {
        q: "Voiko lahjaan painaa oman tekstin?",
        a: "Voi. Oma teksti/kuva -tuotteissa ja Lempinimi-paidassa kirjoitat tekstin tuotesivulla, enintään 200 merkkiä.",
      },
      {
        q: "Ehtiikö lahja jouluksi?",
        a: `${D}`,
      },
    ],
    related: ["/joululahja-vaimolle", "/lahjat/joululahjaksi-miehelle", "/lahjat/joululahjaksi-naiselle", "/lahja-kaverille"],
    categories: ["t-paidat", "hupparit"],
    filter: PUOLISO,
  },
  {
    path: "/lahja-kaverille",
    name: "Lahja kaverille",
    group: "lahjat",
    title: "Hauska lahja kaverille tai ystävälle | Huumorikauppa",
    description:
      `Hauska lahja kaverille tai ystävälle: meemipaidat kuten oispa kaljaa ja Saatanan Tunarit, ystävä-koriste ja oma teksti. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauska lahja kaverille",
    intro: [
      "Hauska lahja kaverille on paita tai pikkulahja, jonka vitsi on teidän: meemi, jota toistatte, tai lausahdus, jonka vain te ymmärrätte.",
      "Ystävälle sopii keraaminen ystävä-koriste, ja oman sisäpiirin vitsin saat painettua Oma teksti/kuva -tuotteeseen. Pyöreitä vuosia täyttävälle kaverille on ikävuosipaitoja syntymäpäivälahjoissa.",
      `Aikuisten kaveriporukoissa toimivat oispa kaljaa ja Alkoholi tappaa hitaasti. Jos lahja annetaan nuoremmalle, valitse meemi ilman alkoholia. Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja kaverille?",
        a: "Paita tai pikkulahja yhteisellä vitsillä, esimerkiksi meemipaita tai omalla tekstillä painettu tuote.",
      },
      {
        q: "Mikä on hauska lahja ystävälle?",
        a: "Ystävä-aiheinen keraaminen koriste tai oma teksti paidassa tai koristeessa.",
      },
      {
        q: "Mikä on edullinen lahja kaverille?",
        a: "Koriste on t-paitaa edullisempi. Alle 30 euron lahjat on koottu sivulle Hauskat lahjat alle 30 euroa.",
      },
      {
        q: "Mikä sopii kaverin synttärilahjaksi?",
        a: "Ikävuosipaita, jos hän täyttää pyöreitä, tai meemipaita. Ikävuosipaidat ovat sivulla Hauskat syntymäpäivälahjat.",
      },
    ],
    related: ["/joululahja-kaverille", "/meemipaidat", "/syntymapaivalahjat", "/lahjat/veljelle"],
    categories: ["t-paidat", "koristeet"],
    filter: KAVERI,
  },
  {
    path: "/lahjat/tyokaverille",
    name: "Lahja työkaverille",
    group: "lahjat",
    title: "Hauska lahja työkaverille | Huumorikauppa",
    description:
      "Mitä lahjaksi työkaverille? Toimistohuumorin paidat: palaverit, lounastauko, etätyö, tiimipelaaja ja asiakaspalvelu. Sopii synttäreille ja läksiäisiin.",
    h1: "Hauskat lahjat työkaverille",
    intro: [
      "Työkaverille sopii lahjaksi toimistohuumorin paita, jonka teksti nauraa työlle eikä työkaverille, kuten Tämäkin olisi voinut olla sähköposti tai Tärkeintä työssä on lounastauko.",
      "Ammatin mukaan valittu paita osuu tarkemmin: asiakaspalvelijalle, myyntimiehelle ja etätöitä tekevälle on omat tekstinsä, ja muut ammatit löytyvät ammattipaidoista. Pitkän uran tehneelle sopii personoitava Alalla X vuotta -paita.",
      `Läksiäisiin eläkkeelle jäävälle sopivat eläkelahjat. Koko työporukan tilaus yli ${ILMAINEN_RAJA_TEKSTI} eurolla toimitetaan ilman toimituskuluja.`,
    ],
    faqs: [
      {
        q: "Mitä lahjaksi työkaverille?",
        a: "Toimistohuumorin paita, jonka teksti koskee työtä, kuten palavereja, lounastaukoa tai etätyötä.",
      },
      {
        q: "Mikä on hauska syntymäpäivälahja työkaverille?",
        a: "Toimistohuumorin paita tai ikävuosipaita, jos hän täyttää pyöreitä.",
      },
      {
        q: "Mikä sopii läksiäislahjaksi?",
        a: "Personoitava Alalla X vuotta -paita tai eläkkeelle lähtevälle eläkeläispaita.",
      },
      {
        q: "Voiko lahjat tilata usealle kerralla?",
        a: `Voi. Lisää tuotteet samaan ostoskoriin. Yli ${ILMAINEN_RAJA_TEKSTI} euron tilaukset toimitetaan ilman toimituskuluja.`,
      },
    ],
    related: ["/joululahja-tyokaverille", "/ammattipaidat", "/elakelahjat", "/lahjat/pomolle"],
    categories: ["t-paidat"],
    filter: TYO,
  },
  {
    path: "/isanpaivalahja",
    name: "Isänpäivälahja",
    group: "lahjat",
    title: "Isänpäivälahja 2026: ideat joka isälle | Huumorikauppa",
    description:
      "Isänpäivälahja kalastajalle, mökkeilijälle, grillaajalle, eläkeläiselle, isoisälle, nuorelle isälle tai työmiehelle. Isänpäivä on su 8.11.2026.",
    h1: "Isänpäivälahja isän tyypin mukaan",
    intro: [
      "Isänpäivälahjaksi sopii paita tai huppari, jonka teksti osuu isän omaan juttuun: kalastajalle KALAMIES, mökkeilijälle Mökki on terapiaa, grillaajalle Grillimestari ja eläkeläiselle Olen eläkkeellä.",
      "Isoisälle valitse pappa- tai ukki-paita, nuorelle isälle personoitava isä-paita tai Jos iskä ei osaa korjata sitä -huppari. Työmiehelle on oman alan paitoja sähköasentajalle, putkimiehelle, rakennusmiehelle ja maanviljelijälle.",
      `Isänpäivä on ${FATHERS_DAY_TEXT}. Tilaa viimeistään ${FATHERS_DAY_LAST_ORDER_TEXT}, niin lahja ehtii perille isänpäiväksi.`,
    ],
    faqs: [
      {
        q: "Mikä on hyvä isänpäivälahja?",
        a: "Paita tai huppari, jonka teksti liittyy isän harrastukseen, työhön tai elämänvaiheeseen. Kalastajalle KALAMIES tai Kala pääsi tällä kertaa, mökkeilijälle Mökki on terapiaa ja eläkeläiselle Olen eläkkeellä.",
      },
      {
        q: "Mitä antaa isänpäivänä isoisälle?",
        a: "Pappa- tai ukki-paidan tai -hupparin, josta näkee heti, keneltä lahja tulee. Lisää ideoita on sivulla Hauskat lahjat isoisälle.",
      },
      {
        q: "Mikä isänpäivälahja sopii nuorelle isälle?",
        a: "Personoitava isä-paita, johon kirjoitat oman tekstin, esimerkiksi lapsen nimen. Toinen vaihtoehto on Jos iskä ei osaa korjata sitä, joka sopii kaiken itse korjaavalle isälle.",
      },
      {
        q: "Mitä antaa isälle, jolla on jo kaikkea?",
        a: "Personoitavan paidan omalla tekstillä tai harrastuspaidan. Kalastus-, metsästys-, grilli- ja mökkipaidat on koottu sivulle Hauskat lahjat harrastajalle.",
      },
      {
        q: "Milloin isänpäivälahja pitää tilata?",
        a: `Isänpäivä on ${FATHERS_DAY_TEXT}. Tilaa viimeistään ${FATHERS_DAY_LAST_ORDER_TEXT}, niin lahja on perillä isänpäiväksi.`,
      },
    ],
    related: [
      "/hauska-isanpaivalahja",
      "/joululahja-isalle",
      "/lahjat/isoisalle",
      "/lahjat/harrastajalle",
      "/elakelahjat",
      "/ammattipaidat",
    ],
    categories: ["t-paidat", "hupparit"],
    extraLinks: [{ href: "/blogi/hauskat-isanpaivalahjat-opas", label: "Opas: hauskat isänpäivälahjat" }],
    filter: ISA_TYYPIT,
  },
  {
    path: "/hauska-isanpaivalahja",
    name: "Hauska isänpäivälahja",
    group: "lahjat",
    title: "Hauska isänpäivälahja: isävitsit paidassa | Huumorikauppa",
    description:
      "Hauska isänpäivälahja setähuumorilla: Kalju-, Isäntä-, Amatimies- ja Museokamaa-paidat sekä iskä-vitsit hupparissa. Isänpäivä on su 8.11.2026.",
    h1: "Hauska isänpäivälahja",
    intro: [
      "Hauska isänpäivälahja on paita tai huppari, jossa on isän oma vitsi: Kalju, Isäntä, Amatimies, Museokamaa tai Tässä talossa asuu yksi pomo.",
      "Setähuumori toimii, kun isä nauraa vitsille itse. Kaljulle isälle sopii Kalju, kaiken itse korjaavalle Jos iskä ei osaa korjata sitä ja kalajuttujen kertojalle Kala pääsi tällä kertaa tai Huonokin päivä kalassa on parempi kuin hyvä päivä töissä.",
      `Isänpäiväksi ${FATHERS_DAY_TEXT} tilaa viimeistään ${FATHERS_DAY_LAST_ORDER_TEXT}. Jos haluat valita lahjan isän harrastuksen tai elämänvaiheen mukaan, katso sivu Isänpäivälahja isän tyypin mukaan.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska isänpäivälahja?",
        a: "Paita tai huppari, jossa on isän oma vitsi, esimerkiksi Kalju, Isäntä, Amatimies tai Museokamaa.",
      },
      {
        q: "Mitä setähuumori tarkoittaa?",
        a: "Kuivaa ja itseironista huumoria, jossa vitsi kohdistuu kertojaan itseensä: kaljuun, ikään, grillitaitoihin tai siihen, että isä korjaa kaiken itse. Lisää tällaisia paitoja on sivulla Setämiespaidat.",
      },
      {
        q: "Mikä paita sopii isälle, joka kertoo isävitsejä?",
        a: "Paita, jonka teksti on itsessään isävitsi, kuten Museokamaa, Kalju tai Grillimestari, sää ei estä. Isä saa vitsin mukaansa joka kerta, kun pukee paidan päälle.",
      },
      {
        q: "Loukkaako kalju- tai ikävitsi isää?",
        a: "Ei, kun isä vitsailee asiasta itsekin. Jos et ole varma, valitse vitsi isän harrastuksesta, esimerkiksi Kala pääsi tällä kertaa.",
      },
      {
        q: "Milloin hauska isänpäivälahja pitää tilata?",
        a: `Viimeistään ${FATHERS_DAY_LAST_ORDER_TEXT}. Isänpäivä on ${FATHERS_DAY_TEXT}.`,
      },
    ],
    related: [
      "/isanpaivalahja",
      "/setamiespaidat",
      "/joululahja-isalle",
      "/lahjat/isoisalle",
      "/hauskat-lahjat-miehelle",
    ],
    categories: ["t-paidat", "hupparit"],
    extraLinks: [{ href: "/blogi/hauskat-isanpaivalahjat-opas", label: "Opas: hauskat isänpäivälahjat" }],
    filter: ISA_VITSIT,
  },
  {
    path: "/hauskat-lahjat-miehelle",
    name: "Lahjat miehelle",
    group: "lahjat",
    title: "Hauskat lahjat miehelle | Huumorikauppa",
    description:
      `Hauska lahja miehelle: Isäntä-, Kalju-, Amatimies- ja kalastuspaidat sekä hupparit isälle, kaverille, puolisolle ja isoisälle. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauskat lahjat miehelle",
    intro: [
      "Hauska lahja miehelle on paita tai huppari, jonka teksti liittyy hänen harrastukseensa tai rooliinsa, kuten Isäntä, Kalju, KALAMIES tai Museokamaa.",
      "Valitse ensin, kenelle lahja on: isälle sopivat iskä- ja isäntätekstit, puolisolle I love my girlfriend -paita ja isoisälle ukki- ja pappa-paidat. Jokaiselle on oma, tarkemmin rajattu lahjasivunsa.",
      `Miehelle, jolla on jo kaikkea, valitse personoitava paita. Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää, ja yli ${ILMAINEN_RAJA_TEKSTI} euron tilaukset toimitetaan ilman toimituskuluja.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja miehelle?",
        a: "Paita tai huppari, jonka teksti kuvaa häntä, esimerkiksi Isäntä, Kalju, Amatimies tai KALAMIES.",
      },
      {
        q: "Mitä antaa miehelle, jolla on jo kaikkea?",
        a: "Personoitavan paidan, johon lisätään hänen nimensä tai lempinimensä. Ne ovat sivulla Joululahja miehelle, jolla on kaikki.",
      },
      {
        q: "Onko hauskoja lahjoja harrastajalle?",
        a: "On. Kalastus-, metsästys-, mökki-, peli- ja urheilupaidat on koottu sivulle Hauskat lahjat harrastajalle.",
      },
      {
        q: "Mikä on hauska lahja miehelle alle 30 eurolla?",
        a: "T-paita. Kaikki alle 30 euron lahjat ovat sivulla Hauskat lahjat alle 30 euroa.",
      },
    ],
    related: [
      "/lahjat/joululahjaksi-miehelle",
      "/setamiespaidat",
      "/lahjat/harrastajalle",
      "/joululahja-miehelle-jolla-on-kaikki",
      "/hauskat-lahjat-naiselle",
    ],
    categories: ["t-paidat", "hupparit"],
    filter: MIES,
  },
  {
    path: "/hauskat-lahjat-naiselle",
    name: "Lahjat naiselle",
    group: "lahjat",
    title: "Hauskat lahjat naiselle | Huumorikauppa",
    description:
      `Hauska lahja naiselle: Super äiskä, slay queen, äiti- ja ikävuosipaidat sekä omalla tekstillä painettu koriste. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauskat lahjat naiselle",
    intro: [
      "Hauska lahja naiselle on tuote, jonka teksti on hänen puolellaan: Super äiskä äidille, slay queen ystävälle tai 40 ja fabulous pyöreitä vuosia täyttävälle.",
      "Huumorilahja naiselle onnistuu, kun vitsi kehuu tai liioittelee eikä koske ulkonäköä. Perheen oman jutun saat Oma teksti/kuva -tuotteeseen, jota on koristeena ja vaatteina.",
      `Rajatummat oppaat on tehty äidille, vaimolle, siskolle ja isoäidille. Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja naiselle?",
        a: "Tuote, jonka teksti kehuu tai sopii saajan elämään, esimerkiksi Super äiskä, slay queen tai 40 ja fabulous.",
      },
      {
        q: "Millainen huumorilahja ei loukkaa naista?",
        a: "Teksti, joka koskee roolia tai asennetta eikä ulkonäköä. Ikävitsit kannattaa valita vain, jos saaja vitsailee iästään itse.",
      },
      {
        q: "Voiko lahjaan painaa oman tekstin?",
        a: "Voi. Oma teksti/kuva -tuotteissa kirjoitat tekstin tai kuvatoiveen tuotesivulla, enintään 200 merkkiä.",
      },
      {
        q: "Mikä on edullinen lahja naiselle?",
        a: "T-paita tai koriste. Kaikki alle 30 euron lahjat ovat sivulla Hauskat lahjat alle 30 euroa.",
      },
    ],
    related: [
      "/lahjat/joululahjaksi-naiselle",
      "/joululahja-aidille",
      "/lahjat/siskolle",
      "/joululahja-vaimolle",
      "/hauskat-lahjat-miehelle",
    ],
    categories: ["hupparit", "t-paidat"],
    filter: any(NAINEN, OMA_KOTIIN),
  },
  {
    path: "/syntymapaivalahjat",
    name: "Syntymäpäivälahjat",
    group: "lahjat",
    title: "Hauskat syntymäpäivälahjat | Huumorikauppa",
    description:
      `Hauska syntymäpäivälahja 30-, 40-, 50-, 60- tai 70-vuotiaalle: ikävuosipaidat ja -hupparit miehelle ja naiselle. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauskat syntymäpäivälahjat",
    intro: [
      "Hauska syntymäpäivälahja on ikävuosipaita tai -huppari, jossa juhlijan uusi ikä on vitsinä: 30 ja liian vanha tyhmyyksiin (teen ne silti), 40v ei vanha, vintage tai 60v takuu mennyt, toimii silti.",
      "Ikävuosipaitoja on 30-, 40-, 50-, 60- ja 70-vuotiaille. Valitse teksti juhlijan luonteen mukaan: itseironinen juhlija nauraa selkävaivoille, toinen arvostaa kehua kuten 50 vuotta nuori.",
      `Synttärilahja kannattaa tilata vähintään kaksi viikkoa ennen juhlia, sillä toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska syntymäpäivälahja?",
        a: "Ikävuosipaita tai -huppari, jonka teksti tekee juhlijan iästä vitsin, esimerkiksi 30v selkä alkaa jo rusahdella.",
      },
      {
        q: "Mikä on hauska syntymäpäivälahja miehelle?",
        a: "Ikävuosipaita. Miehille rajatut sivut on tehty 40-, 50- ja 60-vuotiaille, ja ne löytyvät sivun alalaidasta.",
      },
      {
        q: "Onko ikävuosipaitoja jokaiselle iälle?",
        a: "Paitoja on 30-, 40-, 50-, 60- ja 70-vuotiaille. Muuhun ikään sopii Oma teksti/kuva -paita, johon kirjoitat juhlijan iän.",
      },
      {
        q: "Kuinka ajoissa synttärilahja pitää tilata?",
        a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta, joten tilaa vähintään kaksi viikkoa ennen juhlia.`,
      },
    ],
    related: [
      "/lahjat/40-vuotiaalle-miehelle",
      "/lahjat/50-vuotiaalle-miehelle",
      "/lahjat/60-vuotiaalle-naiselle",
      "/lahjat/70-vuotiaalle",
      "/lahja-kaverille",
    ],
    categories: ["t-paidat", "hupparit"],
    filter: ANY_AGE,
  },
  {
    path: "/lahjat/harrastajalle",
    name: "Lahjat harrastajalle",
    group: "lahjat",
    title: "Hauskat lahjat harrastajalle | Huumorikauppa",
    description:
      `Lahja kalastajalle, metsästäjälle, mökkeilijälle, pelaajalle tai golfaajalle: harrastuspaidat ja -hupparit huumorilla. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauskat lahjat harrastajalle",
    intro: [
      "Hauska lahja harrastajalle on paita tai huppari, jonka vitsi on lajin sisäpiiriä: kalastajalle Kala pääsi tällä kertaa, metsästäjälle Ei ole kiire, olen metsässä ja pelaajalle Just One More Level.",
      "Valikoimassa on paidat kalastukseen, pilkkimiseen, metsästykseen, mökkeilyyn, golfiin, juoksuun, kuntosalille, pyöräilyyn, lumilautailuun, retkeilyyn, avantouintiin, grillaamiseen, valokuvaukseen ja kitaransoittoon sekä koiranomistajille. Kuhunkin lajiin on yksi tai muutama malli, joten ne on koottu yhdelle sivulle.",
      `Jos harrastusta ei löydy listalta, personoitavaan Harrastusmestari-paitaan kirjoitat lajin itse. Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää. ${D}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja kalastajalle?",
        a: "KALAMIES, Kala pääsi tällä kertaa ja Huonokin päivä kalassa -paita tai -huppari. Pilkkijälle on oma paitansa.",
      },
      {
        q: "Mikä on hauska lahja metsästäjälle tai mökkeilijälle?",
        a: "Metsästäjälle Ei ole kiire, olen metsässä -huppari ja mökkeilijälle Mökki on terapiaa -huppari.",
      },
      {
        q: "Mikä on hauska lahja pelaajalle?",
        a: "Just One More Level -paita. Lumilautailijalle on Gravity Is Just A Suggestion -huppari.",
      },
      {
        q: "Entä jos harrastusta ei löydy?",
        a: "Personoitavaan Harrastusmestari-paitaan kirjoitat lajin tai oman tekstin tuotesivulla.",
      },
    ],
    related: ["/joululahja-miehelle-jolla-on-kaikki", "/lahjat/veljelle", "/joululahja-isalle", "/suomalainen-huumori-paidat"],
    categories: ["t-paidat", "hupparit"],
    filter: HARRASTUS,
  },
  {
    path: "/ammattipaidat",
    name: "Ammattipaidat",
    group: "tuotteet",
    title: "Hauskat ammattipaidat | Huumorikauppa",
    description:
      "Hauskat ammattipaidat: sähköasentaja, putkimies, poliisi, palomies, kokki, koodari, parturi, siivooja ja muut. Lahja työkaverille tai valmistuneelle.",
    h1: "Hauskat ammattipaidat",
    intro: [
      "Hauska ammattipaita on t-paita tai huppari, jonka vitsi tulee ammatin arjesta, kuten sähköasentajan Ei kosketa märkänä tai koodarin Ei se ole bugi, se on feature.",
      "Valikoimassa on paidat sähköasentajalle, putkimiehelle, rakennusmiehelle, maanviljelijälle, poliisille, palomiehelle, kokille, parturille, siivoojalle, linja-autonkuljettajalle, myyntimiehelle, asiakaspalvelijalle ja koodarille. Opettajalle ja hoitajalle ei ole omaa mallia, joten heille sopii personoitava Alalla X vuotta- tai työsankari-paita omalla tekstillä.",
      `Ammattipaita on lahja valmistuneelle, työkaverille tai pitkän uran tehneelle. Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää.`,
    ],
    faqs: [
      {
        q: "Mikä on hauska ammattipaita?",
        a: "Paita, jonka teksti tulee ammatin arjesta, kuten putkimiehen Löytää aina lekkauksen tai poliisin Lain käsi myös kahvitunnilla.",
      },
      {
        q: "Onko opettajalle tai sairaanhoitajalle ammattipaitaa?",
        a: "Valmista mallia ei ole. Personoitavaan Alalla X vuotta- tai työsankari-paitaan kirjoitat ammatin ja oman tekstin.",
      },
      {
        q: "Mikä on hauska lahja vastavalmistuneelle?",
        a: "Oman alan ammattipaita, tai personoitava paita, johon painetaan uusi ammattinimike.",
      },
      {
        q: "Voiko paitaan painaa työpaikan nimen?",
        a: "Voi. Personoitavissa paidoissa kirjoitat tekstin tuotesivulla, enintään 200 merkkiä.",
      },
    ],
    related: ["/lahjat/tyokaverille", "/joululahja-tyokaverille", "/lahjat/pomolle", "/hauskat-t-paidat"],
    categories: ["t-paidat"],
    filter: AMMATTI,
  },
];

/** Polku, johon vanha polku ohjautuu (tai polku itse). */
export function resolveLandingRedirect(path: string): string {
  let decoded = path;
  try {
    decoded = decodeURI(path);
  } catch {
    // jätetään sellaisenaan
  }
  return LANDING_REDIRECTS[decoded] ?? LANDING_REDIRECTS[path] ?? path;
}

const BY_PATH = new Map(landingPages.map((p) => [p.path, p]));

export function getLandingPage(path: string): LandingPageDef | undefined {
  return BY_PATH.get(path.replace(/\/+$/, "") || "/");
}

export function isLandingPath(path: string): boolean {
  return BY_PATH.has(path);
}

const SORT_CATEGORY_HUPPARIT: Record<string, number> = { hupparit: 0 };

/** Sivun tuotteet suodatettuna ja järjestettynä. Kaupunkituotteet aina viimeisenä. */
export function selectLandingProducts<T extends LandingProduct>(page: LandingPageDef, products: T[]): T[] {
  const matched = products.filter((p) => !looksLikeMug(p) && page.filter(p));
  const indexed = matched.map((p, i) => ({ p, i }));
  indexed.sort((a, b) => {
    const city = Number(isCityProduct(a.p)) - Number(isCityProduct(b.p));
    if (city !== 0) return city;
    if (page.featured) {
      const f = Number(page.featured(b.p)) - Number(page.featured(a.p));
      if (f !== 0) return f;
    }
    if (page.sort === "hupparit-first") {
      const h = (SORT_CATEGORY_HUPPARIT[a.p.category] ?? 1) - (SORT_CATEGORY_HUPPARIT[b.p.category] ?? 1);
      if (h !== 0) return h;
    }
    if (page.sort === "price-desc") {
      const d = Number(b.p.price) - Number(a.p.price);
      if (d !== 0) return d;
    }
    return getPriorityRank(a.p) - getPriorityRank(b.p) || a.i - b.i;
  });
  return indexed.map((x) => x.p);
}
