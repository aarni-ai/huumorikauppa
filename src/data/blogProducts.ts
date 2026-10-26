/**
 * Blogiartikkelien tuotenostot: jokaiselle artikkelille aiheeseen sopivat tuotteet keskelle tekstiä
 * ja loppuun, Katso tuotteet -painike osuvimmalle laskeutumis- tai kategoriasivulle sekä linkit
 * muille aiheeseen liittyville sivuille.
 *
 * Data: BLOG_PRODUCT_THEMES (teema = kohdesivu + tuotesuodattimet + liittyvät sivut) ja
 * BLOG_POST_THEMES (artikkelin slug -> teema). Artikkeli, jota ei ole kartassa, saa DEFAULT_THEMEn.
 *
 * Tuotesääntö: vain myynnissä olevat ja tilattavat tuotteet (ei piilotettuja, ei mukeja, ei
 * Printifyn valmistamattomia). Suodattimet täyttävät paikat järjestyksessä; jos aiheen tuotteita on
 * vähän, loput täytetään kohdesivun suodattimella ja lopuksi hauskoilla t-paidoilla, jotta lohkot
 * ovat aina täynnä (CLS 0: varattu koko vastaa lopullista).
 *
 * Sama valinta React-sivulla (src/pages/BlogPost.tsx) ja esirenderöinnissä (src/seo/prerender/pages.ts).
 */
import type { Product } from "@/types/product";
import { onPiilotettuTuote } from "@/lib/hiddenCategories";
import { hasAvailableVariant, isFullyUnavailable } from "@/lib/variantAvailability";
import { getPriorityRank } from "@/lib/productPriority";
import { getLandingPage, looksLikeMug } from "./landingPages";
import { categories } from "./products";
import { christmasDeadlinePage } from "./christmasDeadlinePage";
import { AMMATTI, ELAKE, HARRASTUS, isCityProduct, MEEMI, SUOMI, TONNIN_SETELI_PATH, theme } from "./themes";

/** Valinnan tarvitsemat tuotekentät (sama muoto kuin use-products.ts ja normalizeProducts). */
export type BlogProduct = Pick<Product, "id" | "name" | "slug" | "category" | "price" | "description" | "images"> &
  Partial<Pick<Product, "variants">>;

type Filter = (p: BlogProduct) => boolean;

export interface BlogProductTheme {
  /** Katso tuotteet -painikkeen kohde: laskeutumissivu, kategoria- tai kaupunkisivu. */
  href: string;
  /** Kohteen nimi painikkeeseen. */
  name: string;
  /** Tuotelohkon otsikko. */
  heading: string;
  /** Tuotesuodattimet tärkeysjärjestyksessä. Oletus: kohteen laskeutumissivun suodatin. */
  filters?: Filter[];
  /** Muut aiheeseen liittyvät sivut (laskeutumis-, kategoria- tai kaupunkisivut). */
  related: string[];
  /** Kaupunkituotteet sallittu (vain kaupunkiartikkelit). */
  cities?: boolean;
}

/** Tuotteita keskellä artikkelia ja lopussa. */
export const BLOG_MID_COUNT = 3;
export const BLOG_END_COUNT = 6;

// ── Suodattimet ──────────────────────────────────────────────────────────────────

const inCategory =
  (...cats: string[]): Filter =>
  (p) =>
    cats.includes(p.category);
const both =
  (a: Filter, b: Filter): Filter =>
  (p) =>
    a(p) && b(p);
const city =
  (name: string): Filter =>
  (p) =>
    (p.description ?? "").includes(`#kaupunki:${name}`);

const KALASTUS = theme(/kalas/, /kalamies/, /pilkki/, /metsästäjä/);
const MOKKI = theme(/mökki/, /mökkeilijä/, /saun/, /löyly/, /grillimest/, /avantouija/, /kalassa/);
const SAUNA = theme(/saun/, /löyly/, /avantouija/);
const URHEILU = theme(/juoksija/, /kuntosali/, /pyöräilijä/, /golfaaja/, /lumilautailija/, /valmentaja/, /tiimipelaaja/);
const KOIRA = theme(/koira/);
const KISSA = theme(/kissa/);
const PELAAJA = theme(/(?<![a-zåäö])pelaaja/, /koodari/, /gamer/, /nörtti/);
const OPETTAJA = theme(/opettaja/, /alalla x/, /työsankari/);
const ISA_AITI = theme(/(?<![a-zåäö])isä/, /(?<![a-zåäö])iskä/, /äiti/, /äiskä/);
const AITI = theme(/äiti/, /äiskä/);
const RYHMAPAITA = both(theme(/oma teksti/, /personoitava/), inCategory("t-paidat", "hupparit"));
const PAIDAT = inCategory("t-paidat", "hupparit");

// ── Teemat ───────────────────────────────────────────────────────────────────────

export const BLOG_PRODUCT_THEMES = {
  joulu: {
    href: "/joululahjat",
    name: "Hauskat joululahjat",
    heading: "Hauskat joululahjat",
    related: ["/joulun-viimeiset-tilauspaivat", "/lahjat/joululahjaksi-miehelle", "/lahjat/joululahjaksi-naiselle", "/lahjat/pikkujouluihin"],
  },
  jouluMies: {
    href: "/lahjat/joululahjaksi-miehelle",
    name: "Joululahjat miehelle",
    heading: "Hauskat joululahjat miehelle",
    related: ["/joululahjat", "/joululahja-isalle", "/joululahja-miehelle-jolla-on-kaikki"],
  },
  jouluKaikki: {
    href: "/joululahja-miehelle-jolla-on-kaikki",
    name: "Lahja miehelle, jolla on kaikki",
    heading: "Lahjaideat miehelle, jolla on jo kaikki",
    related: ["/hauskat-lahjat-miehelle", "/lahjat/joululahjaksi-miehelle", "/joululahjat"],
  },
  jouluIsa: {
    href: "/joululahja-isalle",
    name: "Joululahjat isälle",
    heading: "Hauskat joululahjat isälle",
    related: ["/isanpaivalahja", "/setamiespaidat", "/joululahjat"],
  },
  jouluTyokaveri: {
    href: "/joululahja-tyokaverille",
    name: "Joululahjat työkaverille",
    heading: "Hauskat joululahjat työkaverille",
    related: ["/lahjat/pikkujouluihin", "/lahjat/pomolle", "/salainen-joulupukki-lahja"],
  },
  pikkujoulu: {
    href: "/lahjat/pikkujouluihin",
    name: "Pikkujoululahjat",
    heading: "Hauskat pikkujoululahjat",
    related: ["/joululahja-tyokaverille", "/salainen-joulupukki-lahja", "/lahjat/alle-30-euroa"],
  },
  salainenPukki: {
    href: "/salainen-joulupukki-lahja",
    name: "Salaisen joulupukin lahjat",
    heading: "Lahjat salaiselle joulupukille",
    related: ["/lahjat/pikkujouluihin", "/lahjat/alle-30-euroa", "/joululahja-alle-50-euroa"],
  },
  teini: {
    href: "/joululahja-teinille",
    name: "Lahjat teinille",
    heading: "Hauskat lahjat teinille",
    related: ["/meemipaidat", "/hauskat-hupparit", "/tonnin-seteli-paita"],
  },
  miehelle: {
    href: "/hauskat-lahjat-miehelle",
    name: "Hauskat lahjat miehelle",
    heading: "Hauskat lahjat miehelle",
    related: ["/setamiespaidat", "/lahjat/40-vuotiaalle-miehelle", "/lahjat/50-vuotiaalle-miehelle", "/isanpaivalahja"],
  },
  naiselle: {
    href: "/hauskat-lahjat-naiselle",
    name: "Hauskat lahjat naiselle",
    heading: "Hauskat lahjat naiselle",
    related: ["/lahjat/50-vuotiaalle-naiselle", "/lahjat/60-vuotiaalle-naiselle", "/lahjat/siskolle", "/joululahja-aidille"],
  },
  aiti: {
    href: "/aitienpaiva",
    name: "Äitienpäivälahjat",
    heading: "Hauskat lahjat äidille",
    filters: [AITI, getLandingPage("/hauskat-lahjat-naiselle")!.filter],
    related: ["/hauskat-lahjat-naiselle", "/joululahja-aidille", "/lahjat/isoaidille"],
  },
  isanpaiva: {
    href: "/hauska-isanpaivalahja",
    name: "Hauskat isänpäivälahjat",
    heading: "Hauskat isänpäivälahjat",
    related: ["/isanpaivalahja", "/setamiespaidat", "/joululahja-isalle"],
  },
  syntymapaiva: {
    href: "/syntymapaivalahjat",
    name: "Syntymäpäivälahjat",
    heading: "Hauskat syntymäpäivälahjat",
    related: ["/hauskat-lahjat-miehelle", "/hauskat-lahjat-naiselle", "/lahja-kaverille", "/lahjat/70-vuotiaalle"],
  },
  ika50: {
    href: "/lahjat/50-vuotiaalle-miehelle",
    name: "Lahjat 50-vuotiaalle",
    heading: "Hauskat lahjat 50-vuotiaalle",
    filters: [getLandingPage("/lahjat/50-vuotiaalle-miehelle")!.filter, getLandingPage("/lahjat/50-vuotiaalle-naiselle")!.filter],
    related: ["/lahjat/50-vuotiaalle-naiselle", "/lahjat/60-vuotiaalle-miehelle", "/syntymapaivalahjat"],
  },
  miesIat: {
    href: "/hauskat-lahjat-miehelle",
    name: "Hauskat lahjat miehelle",
    heading: "Hauskat lahjat miehelle iän mukaan",
    related: ["/lahjat/40-vuotiaalle-miehelle", "/lahjat/50-vuotiaalle-miehelle", "/lahjat/60-vuotiaalle-miehelle"],
  },
  naisIat: {
    href: "/hauskat-lahjat-naiselle",
    name: "Hauskat lahjat naiselle",
    heading: "Hauskat lahjat naiselle iän mukaan",
    related: ["/lahjat/50-vuotiaalle-naiselle", "/lahjat/60-vuotiaalle-naiselle", "/lahjat/siskolle"],
  },
  kaikki: {
    href: "/syntymapaivalahjat",
    name: "Syntymäpäivälahjat",
    heading: "Lahjaideat henkilölle, jolla on jo kaikki",
    related: ["/joululahja-miehelle-jolla-on-kaikki", "/lahja-kaverille", "/hauskat-lahjat-naiselle"],
  },
  elake: {
    href: "/elakelahjat",
    name: "Eläkelahjat",
    heading: "Hauskat eläkelahjat",
    filters: [ELAKE],
    related: ["/lahjat/tyokaverille", "/lahjat/70-vuotiaalle", "/lahjat/isoisalle"],
  },
  tyokaveri: {
    href: "/lahjat/tyokaverille",
    name: "Lahjat työkaverille",
    heading: "Hauskat lahjat työkaverille",
    related: ["/ammattipaidat", "/lahjat/pomolle", "/joululahja-tyokaverille"],
  },
  pikkujouluTyokaveri: {
    href: "/lahjat/pikkujouluihin",
    name: "Pikkujoululahjat",
    heading: "Hauskat pikkujoululahjat työkavereille",
    related: ["/joululahja-tyokaverille", "/lahjat/tyokaverille", "/salainen-joulupukki-lahja"],
  },
  pomo: {
    href: "/lahjat/pomolle",
    name: "Lahjat pomolle",
    heading: "Hauskat lahjat pomolle",
    related: ["/lahjat/tyokaverille", "/ammattipaidat", "/joululahja-tyokaverille"],
  },
  kaveri: {
    href: "/lahja-kaverille",
    name: "Lahjat kaverille",
    heading: "Hauskat lahjat kaverille",
    related: ["/syntymapaivalahjat", "/meemipaidat", "/lahjat/siskolle", "/lahjat/veljelle"],
  },
  alle30: {
    href: "/lahjat/alle-30-euroa",
    name: "Lahjat alle 30 euroa",
    heading: "Hauskat lahjat alle 30 eurolla",
    related: ["/joululahja-alle-50-euroa", "/salainen-joulupukki-lahja", "/lahjat/pikkujouluihin"],
  },
  harrastaja: {
    href: "/lahjat/harrastajalle",
    name: "Lahjat harrastajalle",
    heading: "Hauskat lahjat harrastajalle",
    related: ["/hauskat-lahjat-miehelle", "/lahjat/isoisalle", "/joululahjat"],
  },
  kalastaja: {
    href: "/lahjat/harrastajalle",
    name: "Lahjat harrastajalle",
    heading: "Hauskat lahjat kalastajalle",
    filters: [KALASTUS, HARRASTUS],
    related: ["/hauskat-lahjat-miehelle", "/lahjat/isoisalle", "/isanpaivalahja"],
  },
  mokki: {
    href: "/lahjat/harrastajalle",
    name: "Lahjat harrastajalle",
    heading: "Hauskat lahjat mökkeilijälle",
    filters: [MOKKI, HARRASTUS],
    related: ["/suomalainen-huumori-paidat", "/hauskat-lahjat-miehelle", "/lahjat/isoisalle"],
  },
  urheilija: {
    href: "/lahjat/harrastajalle",
    name: "Lahjat harrastajalle",
    heading: "Hauskat lahjat urheilijalle",
    filters: [URHEILU, HARRASTUS],
    related: ["/hauskat-t-paidat", "/lahja-kaverille", "/syntymapaivalahjat"],
  },
  koira: {
    href: "/lahjat/harrastajalle",
    name: "Lahjat harrastajalle",
    heading: "Hauskat lahjat koiraihmiselle",
    filters: [KOIRA, HARRASTUS],
    related: ["/lahja-kaverille", "/hauskat-lahjat-naiselle", "/syntymapaivalahjat"],
  },
  kissa: {
    href: "/lahjat/harrastajalle",
    name: "Lahjat harrastajalle",
    heading: "Hauskat lahjat kissaihmiselle",
    filters: [KISSA, KOIRA, HARRASTUS],
    related: ["/lahja-kaverille", "/hauskat-lahjat-naiselle", "/syntymapaivalahjat"],
  },
  pelaaja: {
    href: "/lahjat/harrastajalle",
    name: "Lahjat harrastajalle",
    heading: "Hauskat lahjat nörtille ja pelaajalle",
    filters: [PELAAJA, HARRASTUS],
    related: ["/ammattipaidat", "/meemipaidat", "/joululahja-teinille"],
  },
  sauna: {
    href: "/suomalainen-huumori-paidat",
    name: "Suomalainen huumori",
    heading: "Hauskat lahjat saunojalle",
    filters: [SAUNA, SUOMI],
    related: ["/lahjat/harrastajalle", "/hauskat-lahjat-miehelle", "/kategoria/peitot"],
  },
  juhannus: {
    href: "/suomalainen-huumori-paidat",
    name: "Suomalainen huumori",
    heading: "Hauskat lahjat juhannukseen",
    filters: [MOKKI, SUOMI],
    related: ["/lahjat/harrastajalle", "/meemipaidat", TONNIN_SETELI_PATH],
  },
  ammatti: {
    href: "/ammattipaidat",
    name: "Ammattipaidat",
    heading: "Hauskat ammattipaidat",
    filters: [AMMATTI],
    related: ["/lahjat/tyokaverille", "/lahja-kaverille", "/syntymapaivalahjat"],
  },
  opettaja: {
    href: "/ammattipaidat",
    name: "Ammattipaidat",
    heading: "Hauskat lahjat opettajalle",
    filters: [OPETTAJA, AMMATTI],
    related: ["/lahjat/tyokaverille", "/lahjat/pomolle", "/lahja-kaverille"],
  },
  tpaidat: {
    href: "/hauskat-t-paidat",
    name: "Hauskat t-paidat",
    heading: "Hauskat t-paidat",
    related: ["/meemipaidat", "/setamiespaidat", "/ammattipaidat", TONNIN_SETELI_PATH],
  },
  meemit: {
    href: "/meemipaidat",
    name: "Meemipaidat",
    heading: "Meemipaidat ja -hupparit",
    related: [TONNIN_SETELI_PATH, "/suomalainen-huumori-paidat", "/hauskat-hupparit"],
  },
  polttarit: {
    href: "/polttari-lahjat",
    name: "Polttarilahjat",
    heading: "Polttaripaidat koko porukalle",
    filters: [RYHMAPAITA, MEEMI, PAIDAT],
    related: ["/hauskat-t-paidat", "/meemipaidat", "/lahja-kaverille"],
  },
  tarrat: {
    href: "/meemipaidat",
    name: "Meemipaidat",
    heading: "Hauskat tarrat ja meemituotteet",
    filters: [inCategory("tarrat"), MEEMI],
    related: ["/kategoria/tarrat", "/lahjat/alle-30-euroa", "/suomalainen-huumori-paidat"],
  },
  vauva: {
    href: "/hauskat-t-paidat",
    name: "Hauskat t-paidat",
    heading: "Hauskat lahjat vauvalle ja vanhemmille",
    filters: [inCategory("bodyt"), ISA_AITI],
    related: ["/kategoria/bodyt", "/isanpaivalahja", "/hauskat-lahjat-naiselle"],
  },
  seinataulut: {
    href: "/hauskat-t-paidat",
    name: "Hauskat t-paidat",
    heading: "Hauskat seinätaulut ja lahjat kotiin",
    filters: [inCategory("seinataulut", "koristeet", "peitot")],
    related: ["/kategoria/seinataulut", "/kategoria/koristeet", "/syntymapaivalahjat"],
  },
  pipot: {
    href: "/hauskat-hupparit",
    name: "Hauskat hupparit",
    heading: "Hauskat pipot ja hupparit",
    filters: [inCategory("pipot"), getLandingPage("/hauskat-hupparit")!.filter],
    related: ["/kategoria/pipot", "/suomalainen-huumori-paidat", "/joululahjat"],
  },
  peitot: {
    href: "/hauskat-hupparit",
    name: "Hauskat hupparit",
    heading: "Hauskat peitot ja hupparit",
    filters: [inCategory("peitot"), getLandingPage("/hauskat-hupparit")!.filter],
    related: ["/kategoria/peitot", "/joululahjat", "/syntymapaivalahjat"],
  },
  laukut: {
    href: "/hauskat-t-paidat",
    name: "Hauskat t-paidat",
    heading: "Hauskat kassit ja paidat",
    filters: [inCategory("laukut")],
    related: ["/kategoria/laukut", "/lahjat/alle-30-euroa", "/meemipaidat"],
  },
  kaupungit: {
    href: "/suomalainen-huumori-paidat",
    name: "Suomalainen huumori",
    heading: "Kaupunkipaidat ja suomalainen huumori",
    filters: [isCityProduct, SUOMI],
    related: ["/kaupunki/helsinki", "/kaupunki/tampere", "/kaupunki/turku", "/kaupunki/oulu"],
    cities: true,
  },
  helsinki: {
    href: "/kaupunki/helsinki",
    name: "Helsinki-paidat",
    heading: "Helsinki-paidat ja -hupparit",
    filters: [city("Helsinki"), isCityProduct],
    related: ["/kaupunki/espoo", "/kaupunki/vantaa", "/suomalainen-huumori-paidat"],
    cities: true,
  },
  tampere: {
    href: "/kaupunki/tampere",
    name: "Tampere-paidat",
    heading: "Tampere-paidat ja -hupparit",
    filters: [city("Tampere"), isCityProduct],
    related: ["/kaupunki/helsinki", "/kaupunki/turku", "/suomalainen-huumori-paidat"],
    cities: true,
  },
} satisfies Record<string, BlogProductTheme>;

export type BlogThemeKey = keyof typeof BLOG_PRODUCT_THEMES;

/** Artikkelit, joilla ei ole omaa teemaa, saavat hauskat t-paidat. */
export const DEFAULT_THEME: BlogThemeKey = "tpaidat";

/** Artikkelin slug -> teema. */
export const BLOG_POST_THEMES: Record<string, BlogThemeKey> = {
  "hauskat-joululahjaideat-miehelle-2026": "jouluMies",
  "pikkujoululahja-alle-20-euroa": "pikkujoulu",
  "lahja-miehelle-jolla-on-kaikki": "jouluKaikki",
  "elakelahja-joka-naurattaa": "elake",
  "mita-ostaa-tyokaverille-jouluksi": "jouluTyokaveri",
  "joululahja-isalle-hauskat-ideat": "jouluIsa",
  "salaisen-joulupukin-lahja-10-20-30-euroa": "salainenPukki",
  "hauska-lahja-teinille-jouluksi": "teini",
  "lahja-kalastajalle-metsastajalle-mokkeilijalle": "kalastaja",
  "joululahjan-viimeiset-tilauspaivat-2026": "joulu",
  "20-hauskinta-t-paitaa-2026": "tpaidat",
  "hauskat-lahjat-miehelle-naiselle-syntymapaivaLahjat": "syntymapaiva",
  "hauskat-mukit-toimistoon-ja-lahjaksi": "tyokaveri",
  "parhaat-polttaripaidat-ja-polttarilahjat-2026": "polttarit",
  "parhaat-joululahjat-ja-pikkujoululahjat-2026": "joulu",
  "parhaat-hauskat-lahjat-miehelle": "miehelle",
  "hauskat-lahjat-naiselle-opas": "naiselle",
  "mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea": "ika50",
  "hauskat-isanpaivalahjat-opas": "isanpaiva",
  "hauska-aitienpaivalahja-opas": "aiti",
  "hauskat-elakelahjat-opas": "elake",
  "parhaat-hauskat-tarrat-lappariin": "tarrat",
  "hauska-vauvalahja-parhaat-bodyt": "vauva",
  "parhaat-meemituotteet-2025": "meemit",
  "hauskat-seinataulut-sisusta-huumorilla": "seinataulut",
  "miksi-hauska-paita-paras-lahja": "tpaidat",
  "lahja-miehelle-30v-40v-50v-60v": "miesIat",
  "lahja-naiselle-30v-40v-50v-60v": "naisIat",
  "hauskat-syntymapaivaLahjat-opas": "syntymapaiva",
  "lahja-henkilolle-jolla-on-jo-kaikkea": "kaikki",
  "hauskat-lahjat-tyokavereille-opas": "tyokaveri",
  "hauska-lahja-kalastajalle": "kalastaja",
  "hauska-lahja-alle-20-euroa": "alle30",
  "hauska-lahja-saunojalle": "sauna",
  "hauska-lahja-nortille-ja-gamerille": "pelaaja",
  "hauskat-valmistujaislahjat": "ammatti",
  "hauskat-pipot-suomi": "pipot",
  "hauskat-peitot-lahjaksi": "peitot",
  "hauska-lahja-opettajalle": "opettaja",
  "hauska-lahja-urheilijalle": "urheilija",
  "hauskat-laukut-kangaskassit": "laukut",
  "hauskat-lahjat-koiraihmiselle": "koira",
  "hauskat-lahjat-kissaihmiselle": "kissa",
  "hauska-lahja-kaverille": "kaveri",
  "hauska-lahja-pomolle": "pomo",
  "hauskat-pikkujoululahjat-tyokavereille": "pikkujouluTyokaveri",
  "hauskat-lahjat-teinipojalle-ja-tytolle": "teini",
  "hauskat-valmistujaislahjat-2026": "ammatti",
  "hauska-lahja-juhannukseen-2026": "juhannus",
  "hauskat-lahjat-alle-30-euroa": "alle30",
  "hauska-lahja-mokkilaiselle": "mokki",
  "hauskimmat-elakelahjat-selviytymisopas": "elake",
  "kaupunkituotteet-hauska-lahja-kotiseutuylpealle": "kaupungit",
  "hauska-lahja-helsinkilaiselle": "helsinki",
  "hauska-lahja-tamperelaiselle": "tampere",
  "kaupunkipaita-idea-kotiseudulle": "kaupungit",
};

export function getBlogProductTheme(slug: string): BlogProductTheme {
  return BLOG_PRODUCT_THEMES[BLOG_POST_THEMES[slug] ?? DEFAULT_THEME];
}

/** Muiden kuin laskeutumissivujen nimet linkkeihin. */
const PAGE_LABELS: Record<string, string> = {
  [christmasDeadlinePage.path]: christmasDeadlinePage.name,
  "/aitienpaiva": "Äitienpäivälahjat",
  "/polttari-lahjat": "Polttarilahjat",
  // Kaupunkisivut (src/data/municipalities.ts; ei tuoda tänne koko kaupunkidataa).
  "/kaupunki/helsinki": "Helsinki",
  "/kaupunki/espoo": "Espoo",
  "/kaupunki/vantaa": "Vantaa",
  "/kaupunki/tampere": "Tampere",
  "/kaupunki/turku": "Turku",
  "/kaupunki/oulu": "Oulu",
};

/** Liittyvän sivun nimi: laskeutumissivu, PAGE_LABELS tai kategoria. */
export function blogPageLabel(href: string): string {
  const landing = getLandingPage(href);
  if (landing) return landing.name;
  if (PAGE_LABELS[href]) return PAGE_LABELS[href];
  const cat = categories.find((c) => `/kategoria/${c.slug}` === href);
  if (cat) return cat.name;
  return href;
}

// ── Valinta ──────────────────────────────────────────────────────────────────────

/** Myynnissä ja tilattavissa: ei piilotettu, ei muki, Printify valmistaa ainakin yhden yhdistelmän, hinta tiedossa. */
export function isBlogProductEligible(p: BlogProduct): boolean {
  return (
    !onPiilotettuTuote(p) &&
    !looksLikeMug(p) &&
    !isFullyUnavailable(p) &&
    hasAvailableVariant(p) &&
    Number(p.price) > 0
  );
}

const landingFilter = (href: string): Filter | undefined => getLandingPage(href)?.filter;
const FALLBACK: Filter = landingFilter("/hauskat-t-paidat") ?? PAIDAT;

/** Kuvalliset ensin, sitten tuoteprioriteetti, muuten alkuperäinen järjestys. */
function ranked<T extends BlogProduct>(list: T[]): T[] {
  return list
    .map((p, i) => ({ p, i }))
    .sort(
      (a, b) =>
        Number(b.p.images.length > 0) - Number(a.p.images.length > 0) ||
        getPriorityRank(a.p) - getPriorityRank(b.p) ||
        a.i - b.i,
    )
    .map((x) => x.p);
}

/**
 * Artikkelin tuotteet (enintään BLOG_MID_COUNT + BLOG_END_COUNT, ei kaksoiskappaleita).
 * Suodattimet täyttävät paikat järjestyksessä: teeman omat, kohdesivun suodatin, hauskat t-paidat.
 */
export function selectBlogProducts<T extends BlogProduct>(
  themeDef: BlogProductTheme,
  products: T[],
  limit = BLOG_MID_COUNT + BLOG_END_COUNT,
): T[] {
  const eligible = products.filter((p) => isBlogProductEligible(p) && (themeDef.cities || !isCityProduct(p)));
  const filters = [...(themeDef.filters ?? []), landingFilter(themeDef.href), FALLBACK].filter((f): f is Filter => !!f);
  const out: T[] = [];
  const seenSlugs = new Set<string>();
  const seenNames = new Set<string>();
  for (const f of filters) {
    for (const p of ranked(eligible.filter(f))) {
      if (out.length >= limit) return out;
      // Sama kuva-aihe t-paitana ja huppareina ("Amatimies | T-Paita") näytetään kerran.
      const name = p.name.split("|")[0].trim().toLowerCase();
      if (seenSlugs.has(p.slug) || seenNames.has(name)) continue;
      seenSlugs.add(p.slug);
      seenNames.add(name);
      out.push(p);
    }
  }
  return out;
}

/** Tuotteet jaettuna keskikohtaan ja loppuun. */
export function splitBlogProducts<T>(list: T[]): { mid: T[]; end: T[] } {
  const mid = list.slice(0, BLOG_MID_COUNT);
  const rest = list.slice(BLOG_MID_COUNT, BLOG_MID_COUNT + BLOG_END_COUNT);
  // Pieni valikoima: loppuun samat tuotteet kuin keskelle, jotta lohko ei jää tyhjäksi.
  return { mid, end: rest.length >= BLOG_MID_COUNT ? rest : list.slice(0, BLOG_END_COUNT) };
}

/**
 * Rivi, jonka eteen keskimmäinen tuotelohko lisätään: kolmas ##-otsikko (eli kahden osion jälkeen),
 * kahdella otsikolla jälkimmäinen, muuten ensimmäinen tyhjä rivi puolivälin jälkeen.
 */
export function blogMidInsertLine(content: string): number {
  const lines = content.split("\n");
  const h2 = lines.flatMap((l, i) => (l.trim().startsWith("## ") ? [i] : []));
  if (h2.length >= 3) return h2[2];
  if (h2.length === 2) return h2[1];
  const half = Math.floor(lines.length / 2);
  const blank = lines.findIndex((l, i) => i >= half && !l.trim());
  return blank >= 0 ? blank : lines.length;
}
