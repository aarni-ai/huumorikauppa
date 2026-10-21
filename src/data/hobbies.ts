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
    seoTitle: "Hauska lahja kalastajalle: paita ja huppari | Huumorikauppa",
    seoDescription: "Hauskat lahjat kalastajalle: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä. Toimitus 3-10 arkipäivässä.",
    h1: "Hauska lahja kalastajalle",
    tldr: "Hauska lahja kalastajalle on huumoripaita tai -huppari kalastuksen vitseillä. Toimitus 3-10 arkipäivässä.",
    intro: "Kalastaja löytää rauhallisuuden vedenrannalta - ja tarinat kasvavat joka kerrontakerralla. Hauska lahja kalastajalle osuu harrastuksen sisäpiirihuumoriin joka ei vanhene.",
    keywords: ["kalastus", "kalastaja", "kala", "mato", "viehe", "onki", "vene", "järvi", "hauki", "ahven", "fishing"],
    shirtTexts: [
      "Paras terapia on kalaretki",
      "Ei kysy lupaa - menee kalaan",
      "Kala pääsi - tällä kertaa",
      "Kalastaja: terapeutti edullisempaan hintaan",
      "Gone fishing - do not disturb",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja kalastajalle?",
        a: "Hauska lahja kalastajalle on huumoripaita tai -huppari kalastusteemalla. Huumorikauppa.fi:stä löydät koko valikoiman.",
      },
      {
        q: "Milloin on hyvä antaa lahja kalastajalle?",
        a: "Syntymäpäivä, joulu ja isänpäivä ovat parhaita ajankohtia. Myös yllätyslahjana vapaa-ajalla tai ennen kalakautta hauska paita tai huppari sopii mainiosti.",
      },
      {
        q: "Sopiiko huumoripaita kalastajalle lahjaksi?",
        a: "Kyllä! Kalastajat arvostavat harrastukseen liittyvää huumoria. Paita joka viittaa kalastuksen rituaaleihin - aikainen herätys, kala joka pääsi, terapia-aspekti - naurattaa aina.",
      },
    ],
    relatedSlugs: ["metsastys", "venely", "retkily", "sauna"],
    categories: ["t-paidat", "hupparit"],
  },
  {
    slug: "metsastys",
    name: "Metsästys",
    namePossessive: "metsästyksen",
    nameAllative: "metsästäjälle",
    emoji: "🦌",
    seoTitle: "Hauska lahja metsästäjälle | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat metsästäjälle: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja metsästäjälle",
    tldr: "Hauska lahja metsästäjälle on huumoripaita tai -huppari metsästysteemalla. Toimitus 3-10 arkipäivässä.",
    intro: "Metsästäjä nousee ennen aurinkoa ja palaa metsästä - toisinaan tyhjin käsin, mutta aina hyvällä mielellä. Hauska metsästäjälahja tunnistaa harrastuksen ainutlaatuisen kulttuurin.",
    keywords: ["metsästys", "metsästäjä", "hirvi", "poro", "riista", "ase", "koira", "katraus", "hunting"],
    shirtTexts: [
      "Ei ole kiire - olen metsässä",
      "Metsästäjä: herää ennen aurinkoa",
      "Hirvi ei odota",
      "Metsässä kotonani",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja metsästäjälle?",
        a: "Hauska lahja metsästäjälle on paita tai huppari metsästysteemalla.",
      },
    ],
    relatedSlugs: ["kalastus", "retkily", "sauna"],
    categories: ["t-paidat", "hupparit"],
  },
  {
    slug: "golf",
    name: "Golf",
    namePossessive: "golfin",
    nameAllative: "golfaajalle",
    emoji: "⛳",
    seoTitle: "Hauska lahja golfaajalle: paita ja huppari | Huumorikauppa",
    seoDescription: "Hauskat lahjat golfaajalle: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja golfaajalle",
    tldr: "Hauska lahja golfaajalle on huumoripaita tai -huppari golfteemalla. Toimitus 3-10 arkipäivässä.",
    intro: "Golfaaja kävelee 18 reikää - ja kertoo niistä puoli tuntia enemmän. Hauska golflahja tunnistaa harrastuksen sisäpiirihuumoria.",
    keywords: ["golf", "golfaaja", "birdie", "bogey", "eagle", "par", "fairway", "green", "caddie"],
    shirtTexts: [
      "Bogey on elämäntapa",
      "Eagle in my dreams - bogey reality",
      "19. reikä on paras reikä",
      "Golf: viisi tuntia kävely masentavien lyöntien välissä",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja golfaajalle?",
        a: "Hauska lahja golfaajalle on paita tai huppari golfteemalla.",
      },
    ],
    relatedSlugs: ["tennis", "kalastus"],
    categories: ["t-paidat", "hupparit"],
  },
  {
    slug: "juokseminen",
    name: "Juokseminen",
    namePossessive: "juoksemisen",
    nameAllative: "juoksijalle",
    emoji: "🏃",
    seoTitle: "Hauska lahja juoksijalle: paita ja huppari | Huumorikauppa",
    seoDescription: "Hauskat lahjat juoksijalle: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja juoksijalle",
    tldr: "Hauska lahja juoksijalle on huumoripaita tai -huppari juoksuteemalla. Toimitus 3-10 arkipäivässä.",
    intro: "Juoksija ei tarvitse selitystä miksi juoksee - se kuuluu elämäntapaan. Hauska juoksijalahja tunnistaa harrastuksen omistautumisen ja absurditeetin.",
    keywords: ["juokseminen", "juoksija", "maraton", "juoksu", "treeni", "harjoitus", "runner", "marathon"],
    shirtTexts: [
      "Jos näät minut juoksemassa - soita ambulanssi",
      "26.2 km: sattuu joka kerta",
      "Running: halvempaa kuin terapia",
      "Juoksija: kipu on vain mielessä",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja juoksijalle?",
        a: "Hauska lahja juoksijalle on paita tai huppari juoksuteemalla.",
      },
    ],
    relatedSlugs: ["pyoraily", "kuntosali", "triathlon"],
    categories: ["t-paidat", "hupparit"],
  },
  {
    slug: "kuntosali",
    name: "Kuntosali",
    namePossessive: "kuntosalin",
    nameAllative: "kuntosaliharrastajalle",
    emoji: "💪",
    seoTitle: "Hauska lahja kuntosaliharrastajalle | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat kuntosaliharrastajalle: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja kuntosaliharrastajalle",
    tldr: "Hauska lahja kuntosaliharrastajalle on huumoripaita tai -huppari treeniaiheella. Toimitus 3-10 arkipäivässä.",
    intro: "Kuntosaliharrastaja tietää mikä päivä on jalkapäivä - ja ohittaa sen joskus. Hauska treenilahjä tunnistaa salielämän todellisuuden.",
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
        q: "Mikä on hauska lahja kuntosaliharrastajalle?",
        a: "Hauska lahja kuntosaliharrastajalle on paita tai huppari treeniaiheella.",
      },
    ],
    relatedSlugs: ["juokseminen", "crossfit", "pyoraily"],
    categories: ["t-paidat", "hupparit"],
  },
  {
    slug: "sauna",
    name: "Sauna",
    namePossessive: "saunan",
    nameAllative: "saunaharrastajalle",
    emoji: "🧖",
    seoTitle: "Hauska lahja saunaharrastajalle | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat saunaharrastajalle: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja saunaharrastajalle",
    tldr: "Hauska lahja saunaharrastajalle on huumoripaita tai -huppari saunateemalla. Toimitus 3-10 arkipäivässä.",
    intro: "Sauna on suomalaisen sielun koti - siellä puhutaan tai ollaan hiljaa, molemmat ovat oikein. Hauska saunalahja on klassinen ja aikaton.",
    keywords: ["sauna", "löyly", "kiuas", "saunaviikko", "lauteet", "saunaolut", "avantouinti"],
    shirtTexts: [
      "Löyly lisää",
      "Saunafilosofi",
      "Saunan ovet auki - elämä alkaa",
      "100 astetta - normaali perjantai",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja saunaharrastajalle?",
        a: "Hauska lahja saunaharrastajalle on paita tai huppari saunateemalla.",
      },
    ],
    relatedSlugs: ["kalastus", "metsastys", "avantouinti"],
    categories: ["t-paidat", "hupparit"],
  },
  {
    slug: "pyoraily",
    name: "Pyöräily",
    namePossessive: "pyöräilyn",
    nameAllative: "pyöräilijälle",
    emoji: "🚴",
    seoTitle: "Hauska lahja pyöräilijälle | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat pyöräilijälle: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja pyöräilijälle",
    tldr: "Hauska lahja pyöräilijälle on huumoripaita tai -huppari pyöräilyteemalla. Toimitus 3-10 arkipäivässä.",
    intro: "Pyöräilijä löytää reitin joka kaikesta huolimatta menee ylämäkeen. Hauska pyöräilylahja tunnistaa harrastuksen rehellisyyden.",
    keywords: ["pyöräily", "pyöräilijä", "maantïepyörä", "mtb", "pyörä", "cycling", "bike"],
    shirtTexts: [
      "Eat sleep ride repeat",
      "Life is better on a bike",
      "Ylämäki: voitettu (toistaiseksi)",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja pyöräilijälle?",
        a: "Hauska lahja pyöräilijälle on paita tai huppari pyöräilyteemalla.",
      },
    ],
    relatedSlugs: ["juokseminen", "kuntosali"],
    categories: ["t-paidat", "hupparit"],
  },
  {
    slug: "koiraharrastus",
    name: "Koiraharrastus",
    namePossessive: "koiraharrastuksen",
    nameAllative: "koiranomistajalle",
    emoji: "🐕",
    seoTitle: "Hauska lahja koiranomistajalle | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat koiranomistajalle: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja koiranomistajalle",
    tldr: "Hauska lahja koiranomistajalle on huumoripaita tai -huppari koirateemalla. Toimitus 3-10 arkipäivässä.",
    intro: "Koiranomistaja rakastaa koiraansa enemmän kuin useimpia ihmisiä - ja se on täysin hyväksyttävää. Hauska koiralahja tunnistaa tämän erityisen siteen.",
    keywords: ["koira", "koiranomistaja", "lemmikki", "tassu", "haukkuminen", "koiranulkoilutus", "dog"],
    shirtTexts: [
      "Koira on perhettä - ihminen on lisä",
      "My dog thinks I'm amazing",
      "Koiran kanssa - maailma on parempi",
      "Rescued by my dog",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja koiranomistajalle?",
        a: "Hauska lahja koiranomistajalle on paita tai huppari koirateemalla.",
      },
    ],
    relatedSlugs: ["kissaharrastus", "kalastus"],
    categories: ["t-paidat", "hupparit"],
  },
  {
    slug: "kissaharrastus",
    name: "Kissaharrastus",
    namePossessive: "kissaharrastuksen",
    nameAllative: "kissanomistajalle",
    emoji: "🐱",
    seoTitle: "Hauska lahja kissanomistajalle | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat kissanomistajalle: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja kissanomistajalle",
    tldr: "Hauska lahja kissanomistajalle on huumoripaita tai -huppari kissateemalla. Toimitus 3-10 arkipäivässä.",
    intro: "Kissanomistaja tietää totuuden: kissaa ei omisteta - kissa omistaa sinut. Hauska kissalahja tunnistaa tämän realistisen suhteen.",
    keywords: ["kissa", "kissanomistaja", "kisu", "katti", "lemmikki", "cat"],
    shirtTexts: [
      "Kissa on pomo - minä olen palvelija",
      "Cats rule, dogs drool",
      "In my cat's service since forever",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja kissanomistajalle?",
        a: "Hauska lahja kissanomistajalle on paita tai huppari kissateemalla.",
      },
    ],
    relatedSlugs: ["koiraharrastus"],
    categories: ["t-paidat", "hupparit"],
  },
  {
    slug: "videopelit",
    name: "Videopelit",
    namePossessive: "videopelien",
    nameAllative: "pelaajalle",
    emoji: "🎮",
    seoTitle: "Hauska lahja pelaajalle: paita ja huppari | Huumorikauppa",
    seoDescription: "Hauskat lahjat pelaajalle: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja pelaajalle",
    tldr: "Hauska lahja pelaajalle on huumoripaita tai -huppari pelimaailman vitseillä. Toimitus 3-10 arkipäivässä.",
    intro: "Pelaaja ei lopu kesken - vain tallentaa pelin. Hauska pelaajalahja tunnistaa gaming-kulttuurin sisäpiirihuumoria.",
    keywords: ["pelaaja", "videopelit", "peli", "gaming", "console", "pc", "game over", "level up"],
    shirtTexts: [
      "Game Over: ei vielä",
      "Level Up",
      "Respawn: always",
      "Just one more level - joka kerta",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja pelaajalle?",
        a: "Hauska lahja pelaajalle on paita tai huppari gaming-teemalla.",
      },
    ],
    relatedSlugs: ["koodari", "kuntosali"],
    categories: ["t-paidat", "hupparit"],
  },
  {
    slug: "ruoanlaitto",
    name: "Ruoanlaitto",
    namePossessive: "ruoanlaiton",
    nameAllative: "ruoanlaittoharrastajalle",
    emoji: "🍳",
    seoTitle: "Hauska lahja ruoanlaittoharrastajalle | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat ruoanlaittoharrastajalle: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja ruoanlaittoharrastajalle",
    tldr: "Hauska lahja ruoanlaittoharrastajalle on huumoripaita tai -huppari keittiöteemalla. Toimitus 3-10 arkipäivässä.",
    intro: "Ruoanlaittoharrastaja ei vain tee ruokaa - hän luo taidetta. Hauska keittiölahja tunnistaa harrastuksen luovuuden.",
    keywords: ["ruoanlaitto", "keittiö", "resepti", "maku", "kokkaus", "cooking"],
    shirtTexts: [
      "Keittiö on taidegalleria",
      "Master Chef - kotiversio",
      "Secret ingredient: rakkaus (ja juusto)",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja ruoanlaittoharrastajalle?",
        a: "Hauska lahja ruoanlaittoharrastajalle on paita tai huppari keittiöteemalla.",
      },
    ],
    relatedSlugs: ["kokki", "viiniharrastus"],
    categories: ["t-paidat", "hupparit"],
  },
  {
    slug: "retkily",
    name: "Retkeily",
    namePossessive: "retkeilyn",
    nameAllative: "retkeilijälle",
    emoji: "⛺",
    seoTitle: "Hauska lahja retkeilijälle | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat retkeilijälle: huumoripaita tai -huppari. Tilaa Huumorikauppa.fi:stä.",
    h1: "Hauska lahja retkeilijälle",
    tldr: "Hauska lahja retkeilijälle on huumoripaita tai -huppari retkeilyteemalla. Toimitus 3-10 arkipäivässä.",
    intro: "Retkeilijä löytää tien joka ei ole kartalla - ja se on koko pointti. Hauska retkeilylahja tunnistaa luontosuhteen huumorilla.",
    keywords: ["retkeily", "retkeilijä", "vaellus", "luonto", "teltta", "rinkka", "hiking", "camping"],
    shirtTexts: [
      "Paikalle saapuminen on optionaalinen - lähteminen ei",
      "Not all those who wander are lost",
      "Vaeltaja: GPS ei tarvita",
      "Luonnossa löydän itseni",
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja retkeilijälle?",
        a: "Hauska lahja retkeilijälle on paita tai huppari retkeilyteemalla.",
      },
    ],
    relatedSlugs: ["kalastus", "metsastys", "pyoraily"],
    categories: ["t-paidat", "hupparit"],
  },
];

export function findHobby(slug: string): Hobby | undefined {
  return hobbies.find((h) => h.slug === slug);
}
