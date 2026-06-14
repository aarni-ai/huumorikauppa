export interface Municipality {
  slug: string;
  name: string;
  region: string;
  emoji: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  tldr: string;
  intro: string;
  identity: string;
  shirtTexts: string[];
  faqs: { q: string; a: string }[];
  neighbors: string[];
  dialect?: string;
}

export const municipalities: Municipality[] = [
  {
    slug: "helsinki",
    name: "Helsinki",
    region: "Uusimaa",
    emoji: "🏙️",
    seoTitle: "Hauska Helsinki-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Helsinki-lahjat: huumoripaita, -muki tai -huppari. Kaupunkilaislahja joka osuu oikeaan. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja helsinkiläiselle",
    tldr: "Paras hauska lahja helsinkiläiselle on huumoripaita tai -muki Helsinki-teemalla. 'Ruuhka-aika Helsingissä: aina' ja 'Stadi elää' ovat suosituimpia. Toimitus 3–7 arkipäivässä.",
    intro: "Helsinki on Suomen sydän — täynnä elämää, ruuhkia ja Stockmannin hulluja päiviä. Hauska Helsinki-lahja tunnistaa pääkaupungin ainutlaatuisen identiteetin.",
    identity: "Pääkaupunki, stadi, Suomen suurin kaupunki",
    shirtTexts: [
      "Ruuhka-aika Helsingissä: aina",
      "Stadi elää",
      "Helsinkiläinen: ei muualle muuta",
      "Kamppi → Kallio → Krunis: Stadin kulma",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja helsinkiläiselle?",
        a: "Paras hauska lahja helsinkiläiselle on paita tai muki Helsinki-teemalla. 'Stadi elää' ja 'Ruuhka-aika Helsingissä: aina' ovat suosituimpia.",
      },
      {
        q: "Mistä saa hauskoja Helsinki-aiheisia lahjoja?",
        a: "Huumorikauppa.fi:stä löydät Helsinki-aiheiset huumoripaita, -mukit ja -hupparit. Toimitus 3–7 arkipäivässä.",
      },
    ],
    neighbors: ["espoo", "vantaa", "porvoo"],
    dialect: "stadin-slangi",
  },
  {
    slug: "espoo",
    name: "Espoo",
    region: "Uusimaa",
    emoji: "🏘️",
    seoTitle: "Hauska Espoo-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Espoo-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja espoolaiselle",
    tldr: "Paras hauska lahja espoolaiselle on huumoripaita tai -muki Espoo-teemalla. 'Espoo: hyvät tiet, parempi elämä' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Espoo on Suomen toiseksi suurin kaupunki — ja geneettisesti oma entiteettinsä. Hauska Espoo-lahja tunnistaa lähiöelämän ainutlaatuisen kulttuurin.",
    identity: "Piilaakso Suomessa, teknologiakeskus",
    shirtTexts: [
      "Espoo: hyvät tiet, parempi elämä",
      "Leppävaara tai ei mitään",
      "Espoolainen: ei Helsingistä",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja espoolaiselle?",
        a: "Paras hauska lahja espoolaiselle on paita tai muki Espoo-teemalla. Huumorikauppa.fi:stä löydät koko valikoiman.",
      },
    ],
    neighbors: ["helsinki", "vantaa", "lohja"],
  },
  {
    slug: "tampere",
    name: "Tampere",
    region: "Pirkanmaa",
    emoji: "🏭",
    seoTitle: "Hauska Tampere-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Tampere-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja tamperelaiselle",
    tldr: "Paras hauska lahja tamperelaiselle on huumoripaita tai -muki Tampere-teemalla. 'Mustamakkara > kaikki' ja 'Ratina forever' ovat suosituimpia. Toimitus 3–7 arkipäivässä.",
    intro: "Tampere on Suomen sisin kaupunki — teollisuushistoriallaan ja mustamakkarallaan ylpeä. Hauska Tampere-lahja tunnistaa tämän ainutlaatuisen kaupunki-identiteetin.",
    identity: "Suomen sisin kaupunki, mustamakkaran pääkaupunki",
    shirtTexts: [
      "Mustamakkara > kaikki",
      "Ratina forever",
      "Tampere: veden välissä — parhaimmillaan",
      "Tammerkoski vuodesta 1779",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja tamperelaiselle?",
        a: "Paras hauska lahja tamperelaiselle on paita tai muki Tampere-teemalla. 'Mustamakkara > kaikki' on kaikkien tamperelaisten klassikko.",
      },
      {
        q: "Mistä saa hauskoja Tampere-lahjoja?",
        a: "Huumorikauppa.fi:stä löydät Tampere-aiheiset huumoripaida, -mukit ja -hupparit. Toimitus 3–7 arkipäivässä.",
      },
    ],
    neighbors: ["pirkkala", "ylojärvi", "nokia", "kangasala"],
    dialect: "tamperelainen",
  },
  {
    slug: "turku",
    name: "Turku",
    region: "Varsinais-Suomi",
    emoji: "⚓",
    seoTitle: "Hauska Turku-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Turku-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja turkulaiselle",
    tldr: "Paras hauska lahja turkulaiselle on huumoripaita tai -muki Turku-teemalla. 'Turku on Suomen pääkaupunki — Helsingissä vain töissä' on klassikko. Toimitus 3–7 arkipäivässä.",
    intro: "Turku on Suomen vanhin kaupunki — ja se kertoo siitä kaikille. Hauska Turku-lahja tunnistaa turkulaisen ylpeyden hauskalla tavalla.",
    identity: "Suomen vanhin kaupunki, entinen pääkaupunki",
    shirtTexts: [
      "Turku on Suomen pääkaupunki",
      "Aurajoki kutoi elämäni",
      "ÅBO: klassikko",
      "Turkulainen: vanhaa koulua",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja turkulaiselle?",
        a: "Paras hauska lahja turkulaiselle on paita tai muki Turku-teemalla. 'Turku on Suomen pääkaupunki' on klassikko joka naurattaa kaikki.",
      },
    ],
    neighbors: ["kaarina", "lieto", "naantali", "raisio"],
    dialect: "turunmurre",
  },
  {
    slug: "oulu",
    name: "Oulu",
    region: "Pohjois-Pohjanmaa",
    emoji: "❄️",
    seoTitle: "Hauska Oulu-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Oulu-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja oulaiselle",
    tldr: "Paras hauska lahja oulaiselle on huumoripaita tai -muki Oulu-teemalla. 'Pyöräilen myös talvella — olen oululainen' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Oulu on pohjolan Silicon Valley — teknologiaa, pakkasta ja ympärivuotista pyöräilyä. Hauska Oulu-lahja tunnistaa pohjoisen kaupungin ainutlaatuisen identiteetin.",
    identity: "Pohjolan Silicon Valley, ympärivuotinen pyöräilykaupunki",
    shirtTexts: [
      "Pyöräilen myös talvella — olen oululainen",
      "Nokia-henki elää Oulussa",
      "-20°C: sopiva pyöräilykeli",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja oulaiselle?",
        a: "Paras hauska lahja oulaiselle on paita tai muki Oulu-teemalla. 'Pyöräilen myös talvella' on klassikko.",
      },
    ],
    neighbors: ["kempele", "liminka", "ii"],
    dialect: "pohjoispohjalaiset",
  },
  {
    slug: "jyvaskyla",
    name: "Jyväskylä",
    region: "Keski-Suomi",
    emoji: "🏫",
    seoTitle: "Hauska Jyväskylä-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Jyväskylä-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja jyväskyläläiselle",
    tldr: "Paras hauska lahja jyväskyläläiselle on huumoripaita tai -muki Jyväskylä-teemalla. 'Alvar Aalto kävi täällä — jäi' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Jyväskylä on Suomen yliopistokaupunki — täynnä opiskelijoita ja Aalto-arkkitehtuuria. Hauska Jyväskylä-lahja tunnistaa opiskelukaupungin hengen.",
    identity: "Suomen yliopistokaupunki, opiskelijakaupunki",
    shirtTexts: [
      "Alvar Aalto kävi täällä — jäi",
      "Jyväskylässä opiskelu: parasta aikaa",
      "JKL: Suomen sydämessä",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja jyväskyläläiselle?",
        a: "Paras hauska lahja jyväskyläläiselle on paita tai muki Jyväskylä-teemalla. Huumorikauppa.fi:stä löydät valikoiman.",
      },
    ],
    neighbors: ["muurame", "laukaa", "hankasalmi"],
  },
  {
    slug: "lahti",
    name: "Lahti",
    region: "Päijät-Häme",
    emoji: "⛷️",
    seoTitle: "Hauska Lahti-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Lahti-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja lahtelaiselle",
    tldr: "Paras hauska lahja lahtelaiselle on huumoripaita tai -muki Lahti-teemalla. 'Salpausselkä: mäkihyppääjien koti' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Lahti on suomalaisen talvimatkailun ja mäkihypyn kotipaikka. Hauska Lahti-lahja tunnistaa kaupungin urheiluperinnön.",
    identity: "Suomen mäkihypyn ja hiihtolajien pääkaupunki",
    shirtTexts: [
      "Salpausselkä: mäkihyppääjien koti",
      "Lahti: puhdas vesi, kirkas ilma",
      "Lahtis-henki",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja lahtelaiselle?",
        a: "Paras hauska lahja lahtelaiselle on paita tai muki Lahti-teemalla. Huumorikauppa.fi:stä löydät valikoiman.",
      },
    ],
    neighbors: ["nastola", "hollola", "asikkala"],
  },
  {
    slug: "kuopio",
    name: "Kuopio",
    region: "Pohjois-Savo",
    emoji: "🫑",
    seoTitle: "Hauska Kuopio-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Kuopio-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja kuopiolaiselle",
    tldr: "Paras hauska lahja kuopiolaiselle on huumoripaita tai -muki Kuopio-teemalla. 'Kalakukko: maailman paras' ja 'Puijo näkee kauas' ovat suosituimpia. Toimitus 3–7 arkipäivässä.",
    intro: "Kuopio on savon pääkaupunki — kalakukolla, Puijolla ja Kallaveden rannalla. Hauska Kuopio-lahja tunnistaa savolaisuuden hauskalla tavalla.",
    identity: "Savon pääkaupunki, kalakukon kotimaa",
    shirtTexts: [
      "Kalakukko: maailman paras",
      "Puijo näkee kauas",
      "Savolaisuus — sydämen asia",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja kuopiolaiselle?",
        a: "Paras hauska lahja kuopiolaiselle on paita tai muki Kuopio-teemalla. 'Kalakukko: maailman paras' on klassikko.",
      },
    ],
    neighbors: ["siilinjärvi", "karttula", "vehmersalmi"],
    dialect: "savon-murre",
  },
  {
    slug: "joensuu",
    name: "Joensuu",
    region: "Pohjois-Karjala",
    emoji: "🌲",
    seoTitle: "Hauska Joensuu-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Joensuu-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja joensuulaiselle",
    tldr: "Paras hauska lahja joensuulaiselle on huumoripaita tai -muki Joensuu-teemalla. 'Karjala sydämessä' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Joensuu on Pohjois-Karjalan sydän — metsien, järvien ja karjalaisen kulttuurin kaupunki. Hauska Joensuu-lahja tunnistaa karjalaisen identiteetin.",
    identity: "Pohjois-Karjalan keskuskaupunki",
    shirtTexts: [
      "Karjala sydämessä",
      "Joensuu: luonnon helmassa",
      "Karjalainen: suorapuheinen ja rehellinen",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja joensuulaiselle?",
        a: "Paras hauska lahja joensuulaiselle on paita tai muki Joensuu-teemalla. Huumorikauppa.fi:stä löydät valikoiman.",
      },
    ],
    neighbors: ["liperi", "kontiolahti", "outokumpu"],
  },
  {
    slug: "rovaniemi",
    name: "Rovaniemi",
    region: "Lappi",
    emoji: "🎅",
    seoTitle: "Hauska Rovaniemi-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Rovaniemi-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja rovaniemeläiselle",
    tldr: "Paras hauska lahja rovaniemeläiselle on huumoripaita tai -muki Lappi-teemalla. 'Joulupukki on naapuri' ja 'Napapiiri: kotipiiri' ovat suosituimpia. Toimitus 3–7 arkipäivässä.",
    intro: "Rovaniemi on Joulupukin kotipaikka — napapiirillä, auringon alapuolella yöllä kesällä. Hauska Rovaniemi-lahja tunnistaa lappilaisen erityislaatuisuuden.",
    identity: "Lapin pääkaupunki, Joulupukin virallinen kotipaikka",
    shirtTexts: [
      "Joulupukki on naapuri",
      "Napapiiri: kotipiiri",
      "Lappi: missä revontulet on arkipäivää",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja rovaniemeläiselle?",
        a: "Paras hauska lahja rovaniemeläiselle on paita tai muki Lappi-teemalla. 'Joulupukki on naapuri' on klassikko.",
      },
    ],
    neighbors: ["kemijärvi", "ranua"],
    dialect: "lapin-murre",
  },
  {
    slug: "vaasa",
    name: "Vaasa",
    region: "Pohjanmaa",
    emoji: "🌊",
    seoTitle: "Hauska Vaasa-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Vaasa-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja vaasalaiselle",
    tldr: "Paras hauska lahja vaasalaiselle on huumoripaita tai -muki Vaasa-teemalla. 'Vaasa: tuulee aina' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Vaasa on Pohjanmaan suurkaupunki — tuulinen, kaksikielinen ja energinen. Hauska Vaasa-lahja tunnistaa pohjalaisuuden hauskalla tavalla.",
    identity: "Pohjanmaan energiapääkaupunki, kaksikielinen kaupunki",
    shirtTexts: [
      "Vaasa: tuulee aina",
      "Pohjanmaa: tässä ei ämmä heilu",
      "Bothnian pride",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja vaasalaiselle?",
        a: "Paras hauska lahja vaasalaiselle on paita tai muki Vaasa-teemalla. Huumorikauppa.fi:stä löydät valikoiman.",
      },
    ],
    neighbors: ["mustasaari", "vöyri", "laihia"],
  },
  {
    slug: "seinajoki",
    name: "Seinäjoki",
    region: "Etelä-Pohjanmaa",
    emoji: "🎺",
    seoTitle: "Hauska Seinäjoki-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Seinäjoki-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja seinäjokelaiselle",
    tldr: "Paras hauska lahja seinäjokelaiselle on huumoripaita tai -muki Seinäjoki-teemalla. 'Provinssirock forever' ja 'Tangomarkkinat — kotona olo' ovat suosituimpia. Toimitus 3–7 arkipäivässä.",
    intro: "Seinäjoki on Etelä-Pohjanmaan pääkaupunki — Tangomarkkinoiden ja Provinssirockin kaupunki. Hauska Seinäjoki-lahja tunnistaa eteläpohjalaisuuden hauskalla tavalla.",
    identity: "Tangomarkkinoiden ja Provinssirockin kaupunki",
    shirtTexts: [
      "Provinssirock forever",
      "Tango is my language",
      "Pohjalaisuus: ei turhaan jutelda",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja seinäjokelaiselle?",
        a: "Paras hauska lahja seinäjokelaiselle on paita tai muki Seinäjoki-teemalla. 'Tangomarkkinat' ja 'Provinssirock' ovat klassikkoja.",
      },
    ],
    neighbors: ["ilmajoki", "nurmo", "ylistaro"],
    dialect: "etela-pohjanmaa",
  },
  {
    slug: "pori",
    name: "Pori",
    region: "Satakunta",
    emoji: "🎵",
    seoTitle: "Hauska Pori-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Pori-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja porilaiselle",
    tldr: "Paras hauska lahja porilaiselle on huumoripaita tai -muki Pori-teemalla. 'Pori Jazz: tunnetaan maailmalla' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Pori on Satakunnan sydän — Pori Jazz -festivaalin ja Kirjurinluodon kaupunki. Hauska Pori-lahja tunnistaa porilaisuuden ainutlaatuisuuden.",
    identity: "Pori Jazzin kaupunki, Satakunta",
    shirtTexts: [
      "Pori Jazz: tunnetaan maailmalla",
      "Porilaisuus: sydäntä on",
      "Kirjurinluoto: kotipiha",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja porilaiselle?",
        a: "Paras hauska lahja porilaiselle on paita tai muki Pori-teemalla. 'Pori Jazz' on kansainvälisesti tunnettu klassikko.",
      },
    ],
    neighbors: ["ulvila", "nakkila", "harjavalta"],
  },
  {
    slug: "hameenlinna",
    name: "Hämeenlinna",
    region: "Kanta-Häme",
    emoji: "🏰",
    seoTitle: "Hauska Hämeenlinna-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Hämeenlinna-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja hämeenlinnalaiselle",
    tldr: "Paras hauska lahja hämeenlinnalaiselle on huumoripaita tai -muki Hämeenlinna-teemalla. 'Sibeliuksen kotimaa' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Hämeenlinna on Suomen historian ja musiikin kaupunki — Jean Sibeliuksen syntymäpaikka. Hauska Hämeenlinna-lahja tunnistaa historiallisen kaupungin.",
    identity: "Jean Sibeliuksen kotipaikka, historiallinen linnakaupunki",
    shirtTexts: [
      "Sibeliuksen kotimaa",
      "Häme sydämessä",
      "Linnakaupunki — oikeasti linna on täällä",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja hämeenlinnalaiselle?",
        a: "Paras hauska lahja hämeenlinnalaiselle on paita tai muki Hämeenlinna-teemalla. Huumorikauppa.fi:stä löydät valikoiman.",
      },
    ],
    neighbors: ["janakkala", "kalvola", "hattula"],
  },
  {
    slug: "mikkeli",
    name: "Mikkeli",
    region: "Etelä-Savo",
    emoji: "🌿",
    seoTitle: "Hauska Mikkeli-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Mikkeli-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja mikkeliläiselle",
    tldr: "Paras hauska lahja mikkeliläiselle on huumoripaita tai -muki Mikkeli-teemalla. 'Saimaan rannat kotipiha' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Mikkeli on Etelä-Savon sydän — järvien, metsien ja savon murteen kaupunki. Hauska Mikkeli-lahja tunnistaa savolaisen identiteetin.",
    identity: "Etelä-Savon maakuntakeskus",
    shirtTexts: [
      "Saimaan rannat kotipiha",
      "Savosta parasta",
      "Mikkeliläinen: suorapuheinen kuin savo",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja mikkeliläiselle?",
        a: "Paras hauska lahja mikkeliläiselle on paita tai muki Mikkeli-teemalla. Huumorikauppa.fi:stä löydät valikoiman.",
      },
    ],
    neighbors: ["kangasniemi", "hirvensalmi", "juva"],
    dialect: "savon-murre",
  },
  {
    slug: "kokkola",
    name: "Kokkola",
    region: "Keski-Pohjanmaa",
    emoji: "🌾",
    seoTitle: "Hauska Kokkola-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Kokkola-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja kokkolalaiselle",
    tldr: "Paras hauska lahja kokkolalaiselle on huumoripaita tai -muki Kokkola-teemalla. 'Pohjanmaan tuuli puhtaana' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Kokkola on Keski-Pohjanmaan sydän — pohjalaisuuden, kaksikielisyyden ja merenrannan kaupunki.",
    identity: "Keski-Pohjanmaan maakuntakeskus",
    shirtTexts: [
      "Pohjanmaan tuuli puhtaana",
      "Kokkola: kaksikielinen, kaksin niin parempi",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja kokkolalaiselle?",
        a: "Paras hauska lahja kokkolalaiselle on paita tai muki Kokkola-teemalla. Huumorikauppa.fi:stä löydät valikoiman.",
      },
    ],
    neighbors: ["kruunupyy", "kaustinen", "veteli"],
  },
  {
    slug: "lappeenranta",
    name: "Lappeenranta",
    region: "Etelä-Karjala",
    emoji: "🏖️",
    seoTitle: "Hauska Lappeenranta-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Lappeenranta-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja lappeenrantalainen",
    tldr: "Paras hauska lahja lappeenrantalaiselle on huumoripaita tai -muki Lappeenranta-teemalla. 'Saimaa kotipiha' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Lappeenranta on Etelä-Karjalan sydän — Saimaan ja Venäjän rajan kaupunki. Hauska Lappeenranta-lahja tunnistaa karjalaisen identiteetin.",
    identity: "Etelä-Karjalan maakuntakeskus, Saimaan kaupunki",
    shirtTexts: [
      "Saimaa kotipiha",
      "Lappeenranta: rajan tuntumassa",
      "Karjalaisuus: sydäntä on",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja lappeenrantalaiselle?",
        a: "Paras hauska lahja lappeenrantalaiselle on paita tai muki Lappeenranta-teemalla. Huumorikauppa.fi:stä löydät valikoiman.",
      },
    ],
    neighbors: ["imatra", "lemi", "luumäki"],
  },
  {
    slug: "imatra",
    name: "Imatra",
    region: "Etelä-Karjala",
    emoji: "💧",
    seoTitle: "Hauska Imatra-lahja – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat Imatra-lahjat: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja imatralaiselle",
    tldr: "Paras hauska lahja imatralaiselle on huumoripaita tai -muki Imatra-teemalla. 'Imatrankoski: voima virtaa' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Imatra on Imatrankosken ja teollisuuden kaupunki — karjalaisuuden sydämessä. Hauska Imatra-lahja tunnistaa voimakkaan kaupunki-identiteetin.",
    identity: "Imatrankosken kaupunki, teollisuuskaupunki",
    shirtTexts: [
      "Imatrankoski: voima virtaa",
      "Imatra: rajalla ja hienona",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja imatralaiselle?",
        a: "Paras hauska lahja imatralaiselle on paita tai muki Imatra-teemalla. Huumorikauppa.fi:stä löydät valikoiman.",
      },
    ],
    neighbors: ["lappeenranta", "ruokolahti"],
  },
];

export function findMunicipality(slug: string): Municipality | undefined {
  return municipalities.find((m) => m.slug === slug);
}

export function getMunicipalityNeighbors(slug: string): Municipality[] {
  const m = findMunicipality(slug);
  if (!m) return [];
  return m.neighbors
    .map((n) => findMunicipality(n))
    .filter((n): n is Municipality => n !== undefined);
}
