import { TOIMITUSAIKA_TEKSTI } from "../config/toimitus";

export interface Dialect {
  slug: string;
  name: string;
  region: string;
  emoji: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  tldr: string;
  intro: string;
  characterTraits: string[];
  expressions: { expression: string; meaning: string }[];
  shirtTexts: string[];
  faqs: { q: string; a: string }[];
  relatedSlugs: string[];
  municipalities: string[];
}

export const dialects: Dialect[] = [
  {
    slug: "stadin-slangi",
    name: "Stadin slangi",
    region: "Helsinki",
    emoji: "🏙️",
    seoTitle: "Hauska lahja stadin slangipuhujalle | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat stadin slangilla: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja stadin slangilla",
    tldr: `Hauska lahja stadin slangipuhujalle on huumoripaita tai -huppari stadin slangilla. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    intro: "Stadin slangi on Helsingin oma kieli - sekoitus suomea, ruotsia ja katukulttuuria. Hauska slangipuhujalahja tunnistaa kaupunki-identiteetin hauskalla tavalla.",
    characterTraits: ["suorapuheinen", "kaupunkilainen", "trendiherkkä"],
    expressions: [
      { expression: "tsydeemi", meaning: "Helsinki (ydin)" },
      { expression: "nuffe", meaning: "nörtti" },
      { expression: "kundi", meaning: "tyyppi, kaveri" },
      { expression: "stafis", meaning: "Hakaniemen tori" },
      { expression: "döner", meaning: "kebabia" },
    ],
    shirtTexts: [
      "Kundi goes Stadi",
      "Siistiä bailaa",
      "Tsydeemissä asun",
      "Stadin slangi elää",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja stadin slangipuhujalle?",
        a: "Hauska lahja stadin slangipuhujalle on paita tai huppari stadin slangin teksteillä.",
      },
      {
        q: "Mitä on stadin slangi?",
        a: "Stadin slangi on Helsingin katukulttuuri-kieli, joka syntyi 1900-luvun alussa. Se sekoittaa suomea, ruotsia ja muita kieliä ainutlaatuiseksi kaupunkikieleksi.",
      },
    ],
    relatedSlugs: ["turunmurre", "tamperelainen"],
    municipalities: ["helsinki", "espoo", "vantaa"],
  },
  {
    slug: "savon-murre",
    name: "Savon murre",
    region: "Savo",
    emoji: "🌲",
    seoTitle: "Hauska lahja savolaiselle: paita ja huppari | Huumorikauppa",
    seoDescription: "Hauskat lahjat savon murteella: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja savolaiselle",
    tldr: `Hauska lahja savolaiselle on huumoripaita tai -huppari savon murteella. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    intro: "Savolaiset puhuvat omaan tahtiinsa - hitaasti, perusteellisesti ja aina pointin kanssa. Hauska savomieslahja tunnistaa murteen ja identiteetin.",
    characterTraits: ["rauhallinen", "humoristinen", "viisas"],
    expressions: [
      { expression: "pittää pittää", meaning: "pitää pitää (täytyy)" },
      { expression: "mihinkähän", meaning: "minne kai" },
      { expression: "kyllähän se niin on", meaning: "kyllä se on niin" },
      { expression: "sepäs se", meaning: "juuri niin" },
    ],
    shirtTexts: [
      "Savo siinä missä muukin",
      "Puhun niinku puhun",
      "Savolaisuus: ei paha asia",
      "Pittää pittää - savolaisesti",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja savolaiselle?",
        a: "Hauska lahja savolaiselle on paita tai huppari savon murteen teksteillä.",
      },
      {
        q: "Miten savon murre eroaa muista murteista?",
        a: "Savon murre tunnetaan pitkistä vokaaleista, omaperäisestä intonaatiosta ja humoristisesta sanomistyylissä. Se on yksi Suomen tunnistettavimmista murteista.",
      },
    ],
    relatedSlugs: ["tamperelainen", "etela-pohjanmaa"],
    municipalities: ["kuopio", "mikkeli", "joensuu", "iisalmi"],
  },
  {
    slug: "tamperelainen",
    name: "Tamperelainen murre",
    region: "Pirkanmaa",
    emoji: "🏭",
    seoTitle: "Hauska lahja tamperelaiselle | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat tamperelaiselle murteella: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja tamperelaiselle murteella",
    tldr: `Hauska lahja tamperelaiselle on huumoripaita tai -huppari tamperelaisen identiteetin vitseillä. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    intro: "Tamperelainen on ylpeä kotiseudustaan - Suomen sisäisimmästä kaupungista. Hauska tamperelaislahjä tunnistaa mustamakkaran ja Tammelan faniuden.",
    characterTraits: ["ylpeä", "rehellinen", "humoristinen"],
    expressions: [
      { expression: "se on niinku", meaning: "se on ikään kuin" },
      { expression: "mennäänkö", meaning: "mennäänkö (Tampereella)" },
    ],
    shirtTexts: [
      "Stadin ja muun Suomen välissä - Tampere voittaa",
      "Ratina forever",
      "Tampere > Helsinki (luonnollisesti)",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja tamperelaiselle?",
        a: "Hauska lahja tamperelaiselle on paita tai huppari tamperelaisen identiteetin teksteillä.",
      },
    ],
    relatedSlugs: ["savon-murre", "stadin-slangi"],
    municipalities: ["tampere", "pirkkala", "ylojarvi", "nokia"],
  },
  {
    slug: "turunmurre",
    name: "Turun murre",
    region: "Varsinais-Suomi",
    emoji: "⚓",
    seoTitle: "Hauska lahja turkulaiselle | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat turun murteella: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja turkulaiselle murteella",
    tldr: `Hauska lahja turkulaiselle on huumoripaita tai -huppari Turku-identiteetin vitseillä. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    intro: "Turkulainen puhuu selkeästi ja on ylpeä kaupunkinsa historiasta. Hauska turkulaislahja tunnistaa tämän ylpeyden hauskalla tavalla.",
    characterTraits: ["historiallinen", "ylpeä", "merenrantainen"],
    expressions: [
      { expression: "mää", meaning: "minä (turkulaisittain)" },
      { expression: "sää", meaning: "sinä (turkulaisittain)" },
      { expression: "ko", meaning: "kun" },
    ],
    shirtTexts: [
      "Turku on Suomen pääkaupunki - aina ollut",
      "Aurajoki kotini",
      "ÅBO: originaali",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja turkulaiselle?",
        a: "Hauska lahja turkulaiselle on paita tai huppari turun murteen teksteillä. 'Turku on Suomen pääkaupunki' naurattaa kaikki.",
      },
    ],
    relatedSlugs: ["stadin-slangi", "tamperelainen"],
    municipalities: ["turku", "kaarina", "lieto", "naantali"],
  },
  {
    slug: "etela-pohjanmaa",
    name: "Etelä-Pohjanmaan murre",
    region: "Etelä-Pohjanmaa",
    emoji: "🌾",
    seoTitle: "Hauska lahja eteläpohjanmaalaiselle | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat eteläpohjalaiselle: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja eteläpohjalaiselle",
    tldr: `Hauska lahja eteläpohjalaiselle on huumoripaita tai -huppari pohjalaisuuden vitseillä. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    intro: "Eteläpohjalainen sanoo asian suoraan - ei ylimääräistä sanaa. Hauska pohjalaislahjä tunnistaa murteen ja arvomaailman.",
    characterTraits: ["suorapuheinen", "rehellinen", "periksiantamaton"],
    expressions: [
      { expression: "ei turhaan jutelda", meaning: "ei puhuta turhaa" },
      { expression: "ämmä", meaning: "nainen" },
      { expression: "hitto vie", meaning: "hitto vie (hämmästys)" },
    ],
    shirtTexts: [
      "Ei turhaan jutelda",
      "Pohjalaisuus: ei puhetta, tekoja",
      "Tässä ei ämmä heilu",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja eteläpohjalaiselle?",
        a: "Hauska lahja eteläpohjalaiselle on paita tai huppari pohjalaisuuden teksteillä.",
      },
    ],
    relatedSlugs: ["savon-murre", "tamperelainen"],
    municipalities: ["seinajoki", "vaasa", "ilmajoki"],
  },
  {
    slug: "lapin-murre",
    name: "Lapin murre",
    region: "Lappi",
    emoji: "❄️",
    seoTitle: "Hauska lahja lappalaiselle | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat lapin murteella: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja lappalaiselle",
    tldr: `Hauska lahja lappalaiselle on huumoripaita tai -huppari lappilaisen identiteetin vitseillä. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    intro: "Lappalainen elää lähellä luontoa - ja sitä pidemmälle pohjoiseen, sitä vapaampi olo. Hauska lappilaislahja tunnistaa ainutlaatuisen kulttuurin.",
    characterTraits: ["rauhallinen", "luonnollinen", "kestävä"],
    expressions: [
      { expression: "poikki", meaning: "loppu (lapilaisittain)" },
      { expression: "jokinen", meaning: "joki/vesistö" },
    ],
    shirtTexts: [
      "Pohjoinen on paras suunta",
      "Lappi: revontulet kotipiha",
      "-30°C: sopiva ulkoilukeli",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja lappalaiselle?",
        a: "Hauska lahja lappalaiselle on paita tai huppari lappilaisen identiteetin teksteillä.",
      },
    ],
    relatedSlugs: ["savon-murre"],
    municipalities: ["rovaniemi", "kemijärvi", "tornio"],
  },
];

export function findDialect(slug: string): Dialect | undefined {
  return dialects.find((d) => d.slug === slug);
}
