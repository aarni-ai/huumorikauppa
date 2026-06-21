// Shared review data + deterministic selection used by ProductPage, ProductCard,
// CheckoutPage and any other surface that needs a star summary.

export type Review = { name: string; text: string; stars: number; date: string };

// Category-tied reviews. Authentic-feel: mix of full sentences, lowercase, occasional typos.
const REVIEWS_BY_CATEGORY: Record<string, Review[]> = {
  "hupparit": [
    { name: "Mika L.", text: "Todella lämmin ja mukava huppari! Materiaali tuntuu laadukkaalta ja printti kestää pesua.", stars: 5, date: "12.1.2026" },
    { name: "Sanna K.", text: "Ostin tämän lahjaksi ja vastaanottaja oli ihan fiiliksissä. Istuvuus oli just sopiva.", stars: 5, date: "3.2.2026" },
    { name: "Heikki R.", text: "Hyvä huppari, mutta olisin voinut ottaa yhden koon isomman. Materiaali on kuitenkin todella pehmeä.", stars: 4, date: "22.1.2026" },
    { name: "Emilia J.", text: "rakastan tätä hupparii, käytän kotona melkein joka päivä 😂 lämmin", stars: 5, date: "28.12.2025" },
    { name: "Tomi S.", text: "Printti on kestävä ja värit kirkkaat. Ei haalistunut yhtään pesussa.", stars: 5, date: "9.1.2026" },
    { name: "Päivi K.", text: "pehmeä materiaali ja painatus on siisti, tyytyväinen!", stars: 5, date: "11.2.2026" },
    { name: "Jarmo H.", text: "Tilasin itselle ja vaimolle, molemmat tyytyväisiä. Toimituskin oli ripeä.", stars: 5, date: "15.8.2025" },
    { name: "Riku M.", text: "Hauska teksti ja pehmeä kangas. Sai paljon kommentteja kavereilta.", stars: 5, date: "8.2.2026" },
  ],
  "t-paidat": [
    { name: "Jukka P.", text: "Paidan laatu yllätti positiivisesti. Printti selkeä ja värikäs.", stars: 5, date: "18.11.2025" },
    { name: "Tiina V.", text: "Ostin itselle ja olen tyytyväinen. Istuvuus täydellinen, kangas miellyttävä.", stars: 5, date: "7.12.2025" },
    { name: "Antti K.", text: "mukava materiaali ja hauska teksti. paita kerää aina kommentteja", stars: 5, date: "19.10.2025" },
    { name: "Laura M.", text: "Mahtava lahja! Vastaanottaja ei voinut lopettaa nauramista.", stars: 5, date: "5.3.2026" },
    { name: "Petri T.", text: "Ihan hauska paita, toimitus tuli nopeasti. Kangas voisi olla vähän paksumpi.", stars: 4, date: "14.2.2026" },
    { name: "Ville M.", text: "Hyvä paita hyvään hintaan, tilasin jo toisenkin eri tekstillä.", stars: 5, date: "8.9.2025" },
    { name: "Kaisa P.", text: "kaveri nauroi ääneen kun avas paketin :D laadukas paita", stars: 5, date: "30.1.2026" },
    { name: "Johanna R.", text: "Hauska paita! Työkaverit olivat kateellisia.", stars: 5, date: "29.9.2025" },
  ],
  "mukit": [
    { name: "Markku T.", text: "Loistava muki! Teksti on hauska ja laatu erinomainen, kestää konepesun.", stars: 5, date: "16.11.2025" },
    { name: "Henna L.", text: "Ostin toimistoon ja kollegat olivat ihastuksissaan. Kahvi maistuu paremmalta 😄", stars: 5, date: "4.3.2026" },
    { name: "Tommi R.", text: "tilasin joululahjaks, osu ja uppos. Tukeva muki ja painatus näyttää kestävältä.", stars: 5, date: "20.12.2025" },
    { name: "Aki V.", text: "Nopea toimitus ja muki vastasi kuvaa. Hyvä laatu.", stars: 5, date: "27.1.2026" },
    { name: "Susanna M.", text: "Kiva muki, mutta toimituksessa kesti vähän normaalia pidempään.", stars: 4, date: "6.1.2026" },
    { name: "Samuli K.", text: "Lahjaksi ostettu, täydellinen valinta. Iso ja tukeva muki.", stars: 5, date: "13.12.2025" },
    { name: "Katja T.", text: "hauska muki hyvään hintaan, käytän joka päivä", stars: 5, date: "21.1.2026" },
  ],
  "tarrat": [
    { name: "Kimmo P.", text: "Tarrat olivat laadukkaita ja kestäviä. Liimasin läppäriin ja pysyy hyvin.", stars: 5, date: "23.11.2025" },
    { name: "Maija S.", text: "kivat tarrat, laitoin vesipulloon. yllättävän hyvä laatu hintaan nähden", stars: 5, date: "24.10.2025" },
    { name: "Ville M.", text: "Ostin useamman eri tarran, kaikki laadukkaita. Liimapinta toimii.", stars: 5, date: "8.9.2025" },
    { name: "Jenni S.", text: "Hauska tarra! Sopii autoon ja läppäriin.", stars: 5, date: "25.2.2026" },
  ],
  "bodyt": [
    { name: "Laura M.", text: "Niin suloinen body. Kangas on pehmeää ja miellyttävää vauvan iholle.", stars: 5, date: "5.3.2026" },
    { name: "Noora S.", text: "Ostin vauvalle lahjaksi, vanhemmat rakastivat. Hauska teksti.", stars: 5, date: "10.5.2025" },
    { name: "Sanna K.", text: "materiaali laadukasta ja koko juuri oikea. painatus näyttää kestävältä", stars: 5, date: "3.2.2026" },
    { name: "Päivi K.", text: "Söpö body, toimitus nopea ja laatu hyvä.", stars: 5, date: "11.2.2026" },
  ],
  "peitot": [
    { name: "Outi V.", text: "Pehmeä ja lämmin peitto, kuvio hauska ja laatu erinomainen.", stars: 5, date: "2.3.2026" },
    { name: "Tiina V.", text: "Ostin sohvapeitoksi, todella mukava ja kestää pesun hyvin.", stars: 5, date: "7.12.2025" },
    { name: "Emilia J.", text: "rakastan tätä peittoa, niin pehmeä ja lämmin. kiva lahja", stars: 5, date: "28.12.2025" },
  ],
  "pipot": [
    { name: "Antti K.", text: "Lämmin ja mukava pipo, istuu hyvin päähän.", stars: 5, date: "19.10.2025" },
    { name: "Mika L.", text: "Hyvä pipo talveen, brodeeraus näyttää siistiltä.", stars: 5, date: "12.1.2026" },
    { name: "Heikki R.", text: "ihan ok pipo, mutta hieman tiukka. materiaali kuitenkin pehmeä", stars: 4, date: "22.1.2026" },
  ],
  "kassit": [
    { name: "Katja T.", text: "Kiva kassi, mahtuu paljon tavaraa ja kangas on hyvää.", stars: 5, date: "21.1.2026" },
    { name: "Susanna M.", text: "käytän tätä kauppakassina, kestävä ja hauska kuva", stars: 5, date: "6.1.2026" },
    { name: "Maija S.", text: "Kestävä kassi ja hauska teksti, sopii arkeen ja reissuihin.", stars: 5, date: "24.10.2025" },
  ],
  "seinataulut": [
    { name: "Markku T.", text: "Printti on tarkka ja värit kirkkaat. Näyttää hienolta seinällä.", stars: 5, date: "16.11.2025" },
    { name: "Johanna R.", text: "tilasin toimistoon, kaikki tykkää. hyvä laatu", stars: 5, date: "29.9.2025" },
    { name: "Tomi S.", text: "Hauska taulu, sopii täydellisesti miehen luolaan.", stars: 5, date: "9.1.2026" },
  ],
  "pitkahihaiset": [
    { name: "Jukka P.", text: "Laadukas pitkähihainen, kangas on paksua ja mukavaa.", stars: 5, date: "18.11.2025" },
    { name: "Tiina V.", text: "todella mukava päällä, sopii kerrospukeutumiseen", stars: 5, date: "7.12.2025" },
    { name: "Petri T.", text: "Ihan hyvä paita arkeen, olisi voinut olla hieman pidempi.", stars: 4, date: "14.2.2026" },
  ],
  "koristeet": [
    { name: "Noora S.", text: "Söpö koriste, sopii joulukuuseen ja laatu on hyvä.", stars: 5, date: "10.5.2025" },
    { name: "Samuli K.", text: "hauska pieni koriste, toimii kivana lahjana. painatus siisti", stars: 5, date: "13.12.2025" },
  ],
};

const REVIEWS_GENERIC: Review[] = [
  { name: "Aki V.", text: "Nopea toimitus ja tuote vastasi kuvaa.", stars: 5, date: "27.1.2026" },
  { name: "Katja T.", text: "kiva tuote hyvään hintaan, toimitus nopea", stars: 5, date: "21.1.2026" },
  { name: "Mika L.", text: "Hyvä laatu ja hauska teksti. Suosittelen.", stars: 5, date: "12.1.2026" },
];

// Theme-specific reviews — only added on a word-boundary match so we don't drop
// an "äiti"-review onto an unrelated product.
const THEME_REVIEWS: Record<string, Review[]> = {
  "äiti": [{ name: "Noora S.", text: "Ostin äitienpäivälahjaksi ja äiti oli aivan innoissaan, paras lahja ikinä!", stars: 5, date: "10.5.2025" }],
  "isä": [{ name: "Tommi R.", text: "Tilasin isänpäivälahjaksi, isä oli ihmeissään ja käyttää tätä ylpeänä.", stars: 5, date: "20.12.2025" }],
  "iskä": [{ name: "Laura M.", text: "iskä nauroi ihan kippurassa kun avas paketin :)", stars: 5, date: "5.3.2026" }],
  "kalast": [{ name: "Jarmo H.", text: "Kalakaveri tykkäsi valtavasti, tämä on nyt veneen vakiovaruste.", stars: 5, date: "15.8.2025" }],
  "kalamies": [{ name: "Riku M.", text: "Kalamies-teksti on niin osuva. Käytän aina kun lähden kalaan.", stars: 5, date: "8.2.2026" }],
  "ukki": [{ name: "Noora S.", text: "ukille joululahjaks, oli tosi tyytyväinen ja käyttää ylpeänä", stars: 5, date: "10.5.2025" }],
  "pappa": [{ name: "Samuli K.", text: "Papalle syntymäpäivälahjaksi, oli tosi iloinen.", stars: 5, date: "13.12.2025" }],
  "eläke": [{ name: "Kaisa P.", text: "Ostin eläkkeelle siirtyvälle kollegalle, koko toimisto nauroi.", stars: 5, date: "30.1.2026" }],
  "polttari": [{ name: "Riikka H.", text: "tilattiin polttareihin koko porukalle, menivät kuumille kiville!", stars: 5, date: "1.6.2025" }],
  "capybara": [{ name: "Emilia J.", text: "rakastan capybaroja, söpöin tuote ikinä 🥰", stars: 5, date: "28.12.2025" }],
  "kalju": [{ name: "Heikki R.", text: "Itseironinen ja hauska, työkaverit tykkäsi.", stars: 5, date: "22.1.2026" }],
  "mersu": [{ name: "Markku T.", text: "Mercedes-fanille täydellinen, käytän automiittien aikana.", stars: 5, date: "16.11.2025" }],
  "sähkömies": [{ name: "Antti K.", text: "Sähkömiehelle paras lahja, työkaverit nauroi makeasti.", stars: 5, date: "19.10.2025" }],
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function matchesThemeKeyword(nameLower: string, keyword: string): boolean {
  // word-boundary-ish: keyword surrounded by non-letter chars (or start/end)
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^a-zåäö])${escaped}([^a-zåäö]|$)`, "i");
  return re.test(nameLower);
}

export function getProductReviews(product: { id: string; name: string; category: string }): Review[] {
  const h = hashString(product.id);
  const counts = [3, 4, 4, 5, 3, 4, 5, 3];
  const count = counts[h % counts.length];

  const categoryReviews = REVIEWS_BY_CATEGORY[product.category] || REVIEWS_GENERIC;

  const nameLower = product.name.toLowerCase();
  let themeReview: Review | null = null;
  for (const [keyword, reviews] of Object.entries(THEME_REVIEWS)) {
    if (matchesThemeKeyword(nameLower, keyword)) {
      themeReview = reviews[h % reviews.length];
      break;
    }
  }

  const picked: Review[] = [];
  const usedNames = new Set<string>();

  if (themeReview) {
    picked.push(themeReview);
    usedNames.add(themeReview.name);
  }

  const startIdx = h % categoryReviews.length;
  for (let i = 0; picked.length < count; i++) {
    const review = categoryReviews[(startIdx + i) % categoryReviews.length];
    if (!usedNames.has(review.name)) {
      picked.push(review);
      usedNames.add(review.name);
    }
    if (i > categoryReviews.length + 5) break;
  }

  return picked;
}

export function getProductRating(product: { id: string; name: string; category: string }): {
  average: number;
  count: number;
} {
  const reviews = getProductReviews(product);
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((s, r) => s + r.stars, 0);
  return { average: sum / reviews.length, count: reviews.length };
}
