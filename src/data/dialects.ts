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
    seoTitle: "Hauska lahja stadin slangipuhujalle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat stadin slangilla: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja stadin slangilla",
    tldr: "Paras hauska lahja stadin slangipuhujalle on huumoripaita tai -muki stadin slangilla. 'Siistiä bailaa' ja 'Kundi goes Stadi' ovat suosituimpia. Toimitus 3–7 arkipäivässä.",
    intro: "Stadin slangi on Helsingin oma kieli — sekoitus suomea, ruotsia ja katukulttuuria. Hauska slangipuhujalahja tunnistaa kaupunki-identiteetin hauskalla tavalla.",
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
        a: "Paras hauska lahja stadin slangipuhujalle on paita tai muki stadin slangin teksteillä. 'Kundi goes Stadi' ja 'Siistiä bailaa' ovat klassikkoja.",
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
    seoTitle: "Hauska lahja savolaiselle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat savon murteella: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja savolaiselle",
    tldr: "Paras hauska lahja savolaiselle on huumoripaita tai -muki savon murteella. 'Savo siinä missä muukin' ja 'Puhun niinku puhun' ovat suosituimpia. Toimitus 3–7 arkipäivässä.",
    intro: "Savolaiset puhuvat omaan tahtiinsa — hitaasti, perusteellisesti ja aina pointin kanssa. Hauska savomieslahja tunnistaa murteen ja identiteetin.",
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
      "Pittää pittää — savolaisesti",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja savolaiselle?",
        a: "Paras hauska lahja savolaiselle on paita tai muki savon murteen teksteillä. 'Savo siinä missä muukin' on klassikko.",
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
    seoTitle: "Hauska lahja tamperelaiselle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat tamperelaiselle murteella: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja tamperelaiselle murteella",
    tldr: "Paras hauska lahja tamperelaiselle on huumoripaita tai -muki tamperelaisen identiteetin vitseillä. 'Stadin ja muun Suomen välissä' ja 'Ratina forever' ovat suosituimpia. Toimitus 3–7 arkipäivässä.",
    intro: "Tamperelainen on ylpeä kotiseudustaan — Suomen sisäisimmästä kaupungista. Hauska tamperelaislahjä tunnistaa mustamakkaran ja Tammelan faniuden.",
    characterTraits: ["ylpeä", "rehellinen", "humoristinen"],
    expressions: [
      { expression: "se on niinku", meaning: "se on ikään kuin" },
      { expression: "mennäänkö", meaning: "mennäänkö (Tampereella)" },
    ],
    shirtTexts: [
      "Stadin ja muun Suomen välissä — Tampere voittaa",
      "Ratina forever",
      "Tampere > Helsinki (luonnollisesti)",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja tamperelaiselle?",
        a: "Paras hauska lahja tamperelaiselle on paita tai muki tamperelaisen identiteetin teksteillä. 'Mustamakkara ja Ratina' ovat klassikkoja.",
      },
    ],
    relatedSlugs: ["savon-murre", "stadin-slangi"],
    municipalities: ["tampere", "pirkkala", "ylojärvi", "nokia"],
  },
  {
    slug: "turunmurre",
    name: "Turun murre",
    region: "Varsinais-Suomi",
    emoji: "⚓",
    seoTitle: "Hauska lahja turkulaiselle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat turun murteella: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja turkulaiselle murteella",
    tldr: "Paras hauska lahja turkulaiselle on huumoripaita tai -muki Turku-identiteetin vitseillä. 'Turku on Suomen pääkaupunki' on klassikko. Toimitus 3–7 arkipäivässä.",
    intro: "Turkulainen puhuu selkeästi ja on ylpeä kaupunkinsa historiasta. Hauska turkulaislahja tunnistaa tämän ylpeyden hauskalla tavalla.",
    characterTraits: ["historiallinen", "ylpeä", "merenrantainen"],
    expressions: [
      { expression: "mää", meaning: "minä (turkulaisittain)" },
      { expression: "sää", meaning: "sinä (turkulaisittain)" },
      { expression: "ko", meaning: "kun" },
    ],
    shirtTexts: [
      "Turku on Suomen pääkaupunki — aina ollut",
      "Aurajoki kotini",
      "ÅBO: originaali",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja turkulaiselle?",
        a: "Paras hauska lahja turkulaiselle on paita tai muki turun murteen teksteillä. 'Turku on Suomen pääkaupunki' naurattaa kaikki.",
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
    seoTitle: "Hauska lahja eteläpohjanmaalaiselle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat eteläpohjalaiselle: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja eteläpohjalaiselle",
    tldr: "Paras hauska lahja eteläpohjalaiselle on huumoripaita tai -muki pohjalaisuuden vitseillä. 'Ei turhaan jutelda' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Eteläpohjalainen sanoo asian suoraan — ei ylimääräistä sanaa. Hauska pohjalaislahjä tunnistaa murteen ja arvomaailman.",
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
        a: "Paras hauska lahja eteläpohjalaiselle on paita tai muki pohjalaisuuden teksteillä. 'Ei turhaan jutelda' on klassikko.",
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
    seoTitle: "Hauska lahja lappalaiselle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat lapin murteella: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja lappalaiselle",
    tldr: "Paras hauska lahja lappalaiselle on huumoripaita tai -muki lappilaisen identiteetin vitseillä. 'Pohjoinen on paras suunta' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Lappalainen elää lähellä luontoa — ja sitä pidemmälle pohjoiseen, sitä vapaampi olo. Hauska lappilaislahja tunnistaa ainutlaatuisen kulttuurin.",
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
        a: "Paras hauska lahja lappalaiselle on paita tai muki lappilaisen identiteetin teksteillä. 'Pohjoinen on paras suunta' on suosittu.",
      },
    ],
    relatedSlugs: ["savon-murre"],
    municipalities: ["rovaniemi", "kemijärvi", "tornio"],
  },
];

export function findDialect(slug: string): Dialect | undefined {
  return dialects.find((d) => d.slug === slug);
}
