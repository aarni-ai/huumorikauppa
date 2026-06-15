export interface Hobby {
  slug: string;
  name: string;
  namePossessive: string; // "kalastuksen" ystävälle
  nameAllative: string; // "kalastuksesta innostuneelle"
  emoji: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  tldr: string;
  intro: string;
  keywords: string[];
  shirtTexts: string[];
  faqs: { q: string; a: string }[];
  relatedSlugs: string[];
  categories?: string[];
}

export const hobbies: Hobby[] = [
  {
    slug: "kalastus",
    name: "Kalastus",
    namePossessive: "kalastuksen",
    nameAllative: "kalastajalle",
    emoji: "🎣",
    seoTitle: "Hauska lahja kalastajalle – Paita, muki & huppari | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat kalastajalle: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä. Toimitus 3–7 arkipäivässä.",
    h1: "Hauska lahja kalastajalle",
    tldr: "Paras hauska lahja kalastajalle on huumoripaita tai -muki kalastuksen vitseillä. 'Paras terapia on kalaretki' ja 'Ei kysy lupaa — menee kalaan' ovat suosituimpia. Toimitus 3–7 arkipäivässä.",
    intro: "Kalastaja löytää rauhallisuuden vedenrannalta — ja tarinat kasvavat joka kerrontakerralla. Hauska lahja kalastajalle osuu harrastuksen sisäpiirihuumoriin joka ei vanhene.",
    keywords: ["kalastus", "kalastaja", "kala", "mato", "viehe", "onki", "vene", "järvi", "hauki", "ahven", "fishing"],
    shirtTexts: [
      "Paras terapia on kalaretki",
      "Ei kysy lupaa — menee kalaan",
      "Kala pääsi — tällä kertaa",
      "Kalastaja: terapeutti edullisempaan hintaan",
      "Gone fishing — do not disturb",
    ],
    faqs: [
      {
        q: "Mikä on paras hauska lahja kalastajalle?",
        a: "Paras hauska lahja kalastajalle on huumoripaita tai -muki kalastusteemalla. 'Paras terapia on kalaretki' ja 'Gone fishing' ovat kaikkien aikojen suosituimpia tekstejä. Huumorikauppa.fi:stä löydät koko valikoiman.",
      },
      {
        q: "Milloin on hyvä antaa lahja kalastajalle?",
        a: "Syntymäpäivä, joulu ja isänpäivä ovat parhaita ajankohtia. Myös yllätyslahjana vapaa-ajalla tai ennen kalakautta hauska paita tai muki sopii mainiosti.",
      },
      {
        q: "Sopiiko huumoripaita kalastajalle lahjaksi?",
        a: "Kyllä! Kalastajat arvostavat harrastukseen liittyvää huumoria. Paita joka viittaa kalastuksen rituaaleihin — aikainen herätys, kala joka pääsi, terapia-aspekti — naurattaa aina.",
      },
    ],
    relatedSlugs: ["metsastys", "venely", "retkily", "sauna"],
    categories: ["t-paidat", "mukit", "hupparit"],
  },
  {
    slug: "metsastys",
    name: "Metsästys",
    namePossessive: "metsästyksen",
    nameAllative: "metsästäjälle",
    emoji: "🦌",
    seoTitle: "Hauska lahja metsästäjälle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat metsästäjälle: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja metsästäjälle",
    tldr: "Paras hauska lahja metsästäjälle on huumoripaita tai -muki metsästysteemalla. 'Ei ole kiire — olen metsässä' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Metsästäjä nousee ennen aurinkoa ja palaa metsästä — toisinaan tyhjin käsin, mutta aina hyvällä mielellä. Hauska metsästäjälahja tunnistaa harrastuksen ainutlaatuisen kulttuurin.",
    keywords: ["metsästys", "metsästäjä", "hirvi", "poro", "riista", "ase", "koira", "katraus", "hunting"],
    shirtTexts: [
      "Ei ole kiire — olen metsässä",
      "Metsästäjä: herää ennen aurinkoa",
      "Hirvi ei odota",
      "Metsässä kotonani",
    ],
    faqs: [
      {
        q: "Mikä on paras hauska lahja metsästäjälle?",
        a: "Paras hauska lahja metsästäjälle on paita tai muki metsästysteemalla. 'Ei ole kiire — olen metsässä' on erittäin suosittu.",
      },
    ],
    relatedSlugs: ["kalastus", "retkily", "sauna"],
    categories: ["t-paidat", "mukit", "hupparit"],
  },
  {
    slug: "golf",
    name: "Golf",
    namePossessive: "golfin",
    nameAllative: "golfaajalle",
    emoji: "⛳",
    seoTitle: "Hauska lahja golfaajalle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat golfaajalle: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja golfaajalle",
    tldr: "Paras hauska lahja golfaajalle on huumoripaita tai -muki golfteemalla. 'Bogey on elämäntapa' ja 'Eagle in my dreams' ovat suosituimpia. Toimitus 3–7 arkipäivässä.",
    intro: "Golfaaja kävelee 18 reikää — ja kertoo niistä puoli tuntia enemmän. Hauska golflahja tunnistaa harrastuksen sisäpiirihuumoria.",
    keywords: ["golf", "golfaaja", "birdie", "bogey", "eagle", "par", "fairway", "green", "caddie"],
    shirtTexts: [
      "Bogey on elämäntapa",
      "Eagle in my dreams — bogey reality",
      "19. reikä on paras reikä",
      "Golf: viisi tuntia kävely masentavien lyöntien välissä",
    ],
    faqs: [
      {
        q: "Mikä on paras hauska lahja golfaajalle?",
        a: "Paras hauska lahja golfaajalle on paita tai muki golfteemalla. 'Bogey on elämäntapa' ja '19. reikä on paras reikä' ovat klassikkoja.",
      },
    ],
    relatedSlugs: ["tennis", "kalastus"],
    categories: ["t-paidat", "mukit", "hupparit"],
  },
  {
    slug: "juokseminen",
    name: "Juokseminen",
    namePossessive: "juoksemisen",
    nameAllative: "juoksijalle",
    emoji: "🏃",
    seoTitle: "Hauska lahja juoksijalle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat juoksijalle: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja juoksijalle",
    tldr: "Paras hauska lahja juoksijalle on huumoripaita tai -muki juoksuteemalla. 'Jos näät minut juoksemassa — soita ambulanssi' on klassikko. Toimitus 3–7 arkipäivässä.",
    intro: "Juoksija ei tarvitse selitystä miksi juoksee — se kuuluu elämäntapaan. Hauska juoksijalahja tunnistaa harrastuksen omistautumisen ja absurditeetin.",
    keywords: ["juokseminen", "juoksija", "maraton", "juoksu", "treeni", "harjoitus", "runner", "marathon"],
    shirtTexts: [
      "Jos näät minut juoksemassa — soita ambulanssi",
      "26.2 km: sattuu joka kerta",
      "Running: halvempaa kuin terapia",
      "Juoksija: kipu on vain mielessä",
    ],
    faqs: [
      {
        q: "Mikä on paras hauska lahja juoksijalle?",
        a: "Paras hauska lahja juoksijalle on paita tai muki juoksuteemalla. 'Jos näät minut juoksemassa — soita ambulanssi' on kaikkien aikojen suosituin.",
      },
    ],
    relatedSlugs: ["pyoraily", "kuntosali", "triathlon"],
    categories: ["t-paidat", "mukit", "hupparit"],
  },
  {
    slug: "kuntosali",
    name: "Kuntosali",
    namePossessive: "kuntosalin",
    nameAllative: "kuntosaliharrastajalle",
    emoji: "💪",
    seoTitle: "Hauska lahja kuntosaliharrastajalle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat kuntosaliharrastajalle: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja kuntosaliharrastajalle",
    tldr: "Paras hauska lahja kuntosaliharrastajalle on huumoripaita tai -muki treeniaiheella. 'Joka vuosi uusi aloitus' ja 'Squat till you drop' ovat suosituimpia. Toimitus 3–7 arkipäivässä.",
    intro: "Kuntosaliharrastaja tietää mikä päivä on jalkapäivä — ja ohittaa sen joskus. Hauska treenilahjä tunnistaa salielämän todellisuuden.",
    keywords: ["kuntosali", "sali", "treeni", "gym", "lihaskasvatus", "fitness", "bodaus", "workout"],
    shirtTexts: [
      "Joka vuosi uusi aloitus",
      "Squat till you drop",
      "Do you even lift?",
      "Jalkapäivä: ohitettu jälleen",
      "Gainz don't care about your feelings",
    ],
    faqs: [
      {
        q: "Mikä on paras hauska lahja kuntosaliharrastajalle?",
        a: "Paras hauska lahja kuntosaliharrastajalle on paita tai muki treeniaiheella. 'Joka vuosi uusi aloitus' ja 'Do you even lift?' ovat klassikkoja.",
      },
    ],
    relatedSlugs: ["juokseminen", "crossfit", "pyoraily"],
    categories: ["t-paidat", "mukit", "hupparit"],
  },
  {
    slug: "sauna",
    name: "Sauna",
    namePossessive: "saunan",
    nameAllative: "saunaharrastajalle",
    emoji: "🧖",
    seoTitle: "Hauska lahja saunaharrastajalle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat saunaharrastajalle: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja saunaharrastajalle",
    tldr: "Paras hauska lahja saunaharrastajalle on huumoripaita tai -muki saunateemalla. 'Löyly lisää' ja 'Saunafilosofi' ovat suosituimpia. Toimitus 3–7 arkipäivässä.",
    intro: "Sauna on suomalaisen sielun koti — siellä puhutaan tai ollaan hiljaa, molemmat ovat oikein. Hauska saunalahja on klassinen ja aikaton.",
    keywords: ["sauna", "löyly", "kiuas", "saunaviikko", "lauteet", "saunaolut", "avantouinti"],
    shirtTexts: [
      "Löyly lisää",
      "Saunafilosofi",
      "Saunan ovet auki — elämä alkaa",
      "100 astetta — normaali perjantai",
    ],
    faqs: [
      {
        q: "Mikä on paras hauska lahja saunaharrastajalle?",
        a: "Paras hauska lahja saunaharrastajalle on paita tai muki saunateemalla. 'Löyly lisää' on kaikkien aikojen suosituin suomalainen slogan.",
      },
    ],
    relatedSlugs: ["kalastus", "metsastys", "avantouinti"],
    categories: ["t-paidat", "mukit", "hupparit"],
  },
  {
    slug: "pyoraily",
    name: "Pyöräily",
    namePossessive: "pyöräilyn",
    nameAllative: "pyöräilijälle",
    emoji: "🚴",
    seoTitle: "Hauska lahja pyöräilijälle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat pyöräilijälle: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja pyöräilijälle",
    tldr: "Paras hauska lahja pyöräilijälle on huumoripaita tai -muki pyöräilyteemalla. 'Eat sleep ride repeat' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Pyöräilijä löytää reitin joka kaikesta huolimatta menee ylämäkeen. Hauska pyöräilylahja tunnistaa harrastuksen rehellisyyden.",
    keywords: ["pyöräily", "pyöräilijä", "maantïepyörä", "mtb", "pyörä", "cycling", "bike"],
    shirtTexts: [
      "Eat sleep ride repeat",
      "Life is better on a bike",
      "Ylämäki: voitettu (toistaiseksi)",
    ],
    faqs: [
      {
        q: "Mikä on paras hauska lahja pyöräilijälle?",
        a: "Paras hauska lahja pyöräilijälle on paita tai muki pyöräilyteemalla. 'Eat sleep ride repeat' on klassikko.",
      },
    ],
    relatedSlugs: ["juokseminen", "kuntosali"],
    categories: ["t-paidat", "mukit", "hupparit"],
  },
  {
    slug: "koiraharrastus",
    name: "Koiraharrastus",
    namePossessive: "koiraharrastuksen",
    nameAllative: "koiranomistajalle",
    emoji: "🐕",
    seoTitle: "Hauska lahja koiranomistajalle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat koiranomistajalle: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja koiranomistajalle",
    tldr: "Paras hauska lahja koiranomistajalle on huumoripaita tai -muki koirateemalla. 'Koira on perhettä — ihminen on lisä' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Koiranomistaja rakastaa koiraansa enemmän kuin useimpia ihmisiä — ja se on täysin hyväksyttävää. Hauska koiralahja tunnistaa tämän erityisen siteen.",
    keywords: ["koira", "koiranomistaja", "lemmikki", "tassu", "haukkuminen", "koiranulkoilutus", "dog"],
    shirtTexts: [
      "Koira on perhettä — ihminen on lisä",
      "My dog thinks I'm amazing",
      "Koiran kanssa — maailma on parempi",
      "Rescued by my dog",
    ],
    faqs: [
      {
        q: "Mikä on paras hauska lahja koiranomistajalle?",
        a: "Paras hauska lahja koiranomistajalle on paita tai muki koirateemalla. 'Koira on perhettä' on erittäin suosittu.",
      },
    ],
    relatedSlugs: ["kissaharrastus", "kalastus"],
    categories: ["t-paidat", "mukit", "hupparit"],
  },
  {
    slug: "kissaharrastus",
    name: "Kissaharrastus",
    namePossessive: "kissaharrastuksen",
    nameAllative: "kissanomistajalle",
    emoji: "🐱",
    seoTitle: "Hauska lahja kissanomistajalle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat kissanomistajalle: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja kissanomistajalle",
    tldr: "Paras hauska lahja kissanomistajalle on huumoripaita tai -muki kissateemalla. 'Kissa on pomo — minä olen palvelija' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Kissanomistaja tietää totuuden: kissaa ei omisteta — kissa omistaa sinut. Hauska kissalahja tunnistaa tämän realistisen suhteen.",
    keywords: ["kissa", "kissanomistaja", "kisu", "katti", "lemmikki", "cat"],
    shirtTexts: [
      "Kissa on pomo — minä olen palvelija",
      "Cats rule, dogs drool",
      "In my cat's service since forever",
    ],
    faqs: [
      {
        q: "Mikä on paras hauska lahja kissanomistajalle?",
        a: "Paras hauska lahja kissanomistajalle on paita tai muki kissateemalla. 'Kissa on pomo' on klassikko.",
      },
    ],
    relatedSlugs: ["koiraharrastus"],
    categories: ["t-paidat", "mukit", "hupparit"],
  },
  {
    slug: "videopelit",
    name: "Videopelit",
    namePossessive: "videopelien",
    nameAllative: "pelaajalle",
    emoji: "🎮",
    seoTitle: "Hauska lahja pelaajalle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat pelaajalle: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja pelaajalle",
    tldr: "Paras hauska lahja pelaajalle on huumoripaita tai -muki pelimaailman vitseillä. 'Game Over: ei vielä' ja 'Level Up' ovat suosituimpia. Toimitus 3–7 arkipäivässä.",
    intro: "Pelaaja ei lopu kesken — vain tallentaa pelin. Hauska pelaajalahja tunnistaa gaming-kulttuurin sisäpiirihuumoria.",
    keywords: ["pelaaja", "videopelit", "peli", "gaming", "console", "pc", "game over", "level up"],
    shirtTexts: [
      "Game Over: ei vielä",
      "Level Up",
      "Respawn: always",
      "Just one more level — joka kerta",
    ],
    faqs: [
      {
        q: "Mikä on paras hauska lahja pelaajalle?",
        a: "Paras hauska lahja pelaajalle on paita tai muki gaming-teemalla. 'Just one more level' on kaikkien pelaajien klassikko.",
      },
    ],
    relatedSlugs: ["koodari", "kuntosali"],
    categories: ["t-paidat", "mukit", "hupparit"],
  },
  {
    slug: "ruoanlaitto",
    name: "Ruoanlaitto",
    namePossessive: "ruoanlaiton",
    nameAllative: "ruoanlaittoharrastajalle",
    emoji: "🍳",
    seoTitle: "Hauska lahja ruoanlaittoharrastajalle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat ruoanlaittoharrastajalle: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja ruoanlaittoharrastajalle",
    tldr: "Paras hauska lahja ruoanlaittoharrastajalle on huumoripaita tai -muki keittiöteemalla. 'Keittiö on taidegalleria' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Ruoanlaittoharrastaja ei vain tee ruokaa — hän luo taidetta. Hauska keittiölahja tunnistaa harrastuksen luovuuden.",
    keywords: ["ruoanlaitto", "keittiö", "resepti", "maku", "kokkaus", "cooking"],
    shirtTexts: [
      "Keittiö on taidegalleria",
      "Master Chef — kotiversio",
      "Secret ingredient: rakkaus (ja juusto)",
    ],
    faqs: [
      {
        q: "Mikä on paras hauska lahja ruoanlaittoharrastajalle?",
        a: "Paras hauska lahja ruoanlaittoharrastajalle on paita tai muki keittiöteemalla. 'Keittiö on taidegalleria' on suosittu.",
      },
    ],
    relatedSlugs: ["kokki", "viiniharrastus"],
    categories: ["t-paidat", "mukit", "hupparit"],
  },
  {
    slug: "retkily",
    name: "Retkeily",
    namePossessive: "retkeilyn",
    nameAllative: "retkeilijälle",
    emoji: "⛺",
    seoTitle: "Hauska lahja retkeilijälle – Paita & muki | Huumorikauppa.fi",
    seoDescription: "Parhaat hauskat lahjat retkeilijälle: huumoripaita, -muki tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja retkeilijälle",
    tldr: "Paras hauska lahja retkeilijälle on huumoripaita tai -muki retkeilyteemalla. 'Paikalle saapuminen on optionaalinen — lähteminen ei' on suosittu. Toimitus 3–7 arkipäivässä.",
    intro: "Retkeilijä löytää tien joka ei ole kartalla — ja se on koko pointti. Hauska retkeilylahja tunnistaa luontosuhteen huumorilla.",
    keywords: ["retkeily", "retkeilijä", "vaellus", "luonto", "teltta", "rinkka", "hiking", "camping"],
    shirtTexts: [
      "Paikalle saapuminen on optionaalinen — lähteminen ei",
      "Not all those who wander are lost",
      "Vaeltaja: GPS ei tarvita",
      "Luonnossa löydän itseni",
    ],
    faqs: [
      {
        q: "Mikä on paras hauska lahja retkeilijälle?",
        a: "Paras hauska lahja retkeilijälle on paita tai muki retkeilyteemalla. 'Not all those who wander are lost' on klassikko.",
      },
    ],
    relatedSlugs: ["kalastus", "metsastys", "pyoraily"],
    categories: ["t-paidat", "mukit", "hupparit"],
  },
];

export function findHobby(slug: string): Hobby | undefined {
  return hobbies.find((h) => h.slug === slug);
}
