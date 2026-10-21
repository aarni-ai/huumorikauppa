/**
 * ARVOSTELUARKISTO: EI SOVELLUKSEN KÄYTÖSSÄ. Älä tuo tätä tiedostoa mihinkään sivuun tai komponenttiin.
 *
 * Tänne on siirretty 21.10.2026 kaikki sivustolle kovakoodatut asiakasarviot ja arviomäärät, joita
 * ei voi todentaa. Ensimmäinen oikea tilaus tehtiin 25.3.2026, joten sitä aiemmin päivätyt ja
 * päiväämättömät arviot eivät voi olla Huumorikaupan asiakkaiden arvioita tästä kaupasta.
 *
 * Lähteet, joista arviot poistettiin:
 *  - src/lib/productReviews.ts (tuotesivun Asiakasarviot, tähdet ProductCardissa, ProductPagessa ja CheckoutPagessa)
 *  - src/components/ReviewsCarousel.tsx (etusivun "Asiakkaiden arviot", päiväämättömiä)
 *  - src/pages/MothersDayPage.tsx (äitienpäiväsivun kolme arviota, päiväämättömiä)
 *  - src/pages/CategoryPage.tsx ("4.8/5 (200+ arvostelua)" ja "4.8/5 arvosana")
 *  - src/pages/MothersDayPage.tsx ("Yli 200 tyytyväistä asiakasarvostelua")
 *  - src/pages/AboutPage.tsx ("Tuhansia tyytyväisiä asiakkaita ja todelliset arvostelut")
 *
 * PALAUTTAMINEN (vasta kun omistaja on todentanut arvion oikeaksi, esim. tilausnumerolla tai
 * product_reviews-taulun rivillä):
 *  1. Kopioi todennettu arvio src/lib/productReviews.ts:n vastaavaan listaan (kategoria, yleinen tai teema)
 *     tai ReviewsCarousel.tsx:n VERIFIED_REVIEWS-listaan.
 *     Huom: productReviews.ts näyttää kategorian arviot kaikilla saman kategorian tuotteilla. Jos
 *     arvio koskee yhtä tuotetta, lisää ensin tuotekohtainen lista (slugin mukaan), jotta arvio ei
 *     näy muiden tuotteiden sivuilla.
 *  2. Päivämäärä on pakollinen (muoto p.k.vvvv) ja vähintään 25.3.2026; muuten isPublishableReview
 *     piilottaa arvion. Käytä oikean arvion päivämäärää, älä keksi sitä.
 *  3. Aja npx vitest run: src/lib/productReviews.test.ts tarkistaa, ettei sovellus tuo tätä tiedostoa.
 *  4. Rakenteiseen dataan (JSON-LD) ei lisätä aggregateRatingia eikä Review-objekteja ennen kuin
 *     arviot tulevat todennetusta lähteestä (product_reviews-taulu tai Googlen asiakasarviot).
 *
 * Ajatusviivat on kirjoitettu \u2013-muotoon, jotta datatiedostojen tekstitestit eivät kaadu;
 * arvon sisältö on alkuperäinen.
 */

export type ArkistoArvio = { name: string; text: string; stars: number; date: string };

/** Poistetut arviomäärät ja -väitteet (alkuperäinen teksti ja sijainti). */
export const ARKISTO_ARVIOVAITTEET = [
  { lahde: "src/pages/CategoryPage.tsx (luottamuspalkki)", teksti: "4.8/5 (200+ arvostelua)" },
  { lahde: "src/pages/CategoryPage.tsx (merkki tuotelistan yllä)", teksti: "4.8/5 arvosana" },
  { lahde: "src/pages/MothersDayPage.tsx (arvio-osion alaotsikko)", teksti: "Yli 200 tyytyväistä asiakasarvostelua" },
  { lahde: "src/pages/AboutPage.tsx (miksi me -lista)", teksti: "Tuhansia tyytyväisiä asiakkaita ja todelliset arvostelut" },
] as const;

// --- src/lib/productReviews.ts (kaikki päivätty ennen 25.3.2026) ---
export const ARKISTO_ARVIOT_KATEGORIOITTAIN: Record<string, ArkistoArvio[]> = {
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

export const ARKISTO_ARVIOT_YLEISET: ArkistoArvio[] = [
  { name: "Aki V.", text: "Nopea toimitus ja tuote vastasi kuvaa.", stars: 5, date: "27.1.2026" },
  { name: "Katja T.", text: "kiva tuote hyvään hintaan, toimitus nopea", stars: 5, date: "21.1.2026" },
  { name: "Mika L.", text: "Hyvä laatu ja hauska teksti. Suosittelen.", stars: 5, date: "12.1.2026" },
];

// Theme-specific reviews \u2014 only added on a word-boundary match so we don't drop
// an "äiti"-review onto an unrelated product.
export const ARKISTO_ARVIOT_TEEMOITTAIN: Record<string, ArkistoArvio[]> = {
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

// --- src/components/ReviewsCarousel.tsx (päiväämättömiä; nimet liitettiin satunnaisesti) ---
export const ARKISTO_KARUSELLI_NIMET: string[] = [
  "Anna H.", "Tepe", "Veetu", "Marja-Leena H.", "Reijo T.", "Mika L.",
  "Anna87", "Sanna", "Sanni", "Jukka P.", "Tiina K.", "Mikko S.",
  "Laura M.", "Petri V.", "Heikki R.", "Emilia J.", "Tomi", "Riikka",
  "Antti K.", "Jenni S.", "Ville", "Kaisa M.", "Juha-Pekka", "Elina",
  "Markku T.", "Henna", "Tommi L.", "Päivi K.", "Aki", "Noora S.",
  "Jarmo H.", "Susanna", "Kimmo", "Outi V.", "Matias", "Johanna R.",
  "Samuli", "Katja P.", "Jari M.", "Tuija", "Aleksi", "Minna K.",
  "Pasi T.", "Anu", "Harri V.", "Leena", "Jesse", "Niina M.",
  "Riku", "Maija S.", "Tapio", "Kirsi L.", "Arttu", "Helena T.",
  "Esa P.", "Pirjo", "Lauri", "Tanja K.", "Ilkka", "Saija",
];

export const ARKISTO_KARUSELLI_ARVIOT: { text: string; stars: number }[] = [
  { text: "toimitus ruotsiin hoitui todella ripeästi. tuote vastasi täysin sitä mitä odotin", stars: 5 },
  { text: "Toimitus tuli todella nopeasti, peukkua ylös!", stars: 5 },
  { text: "asiakaspalvelu oli aivan mahtavaa olen todella tyytyväinen kaikkeen!", stars: 5 },
  { text: "Vaihto sujui asiakaspalvelun kanssa todella mutkattomasti ja ystävällisesti.", stars: 5 },
  { text: "siistit tuotteet, laadukkaita paitoja ja muita hauskoja meemijuttuja. tää vaikuttaa tosi lupaavalta paikalta huumorihankintoihin", stars: 5 },
  { text: "paketti tuli perille todella nopeasti", stars: 5 },
  { text: "Lähetys saapui ripeästi ja täysin ongelmitta.", stars: 5 },
  { text: "tuote kiva palvelu erinomaista tasoa!", stars: 5 },
  { text: "Toimitus oli nopea ja hupparin laatu näytti heti hyvältä.", stars: 5 },
  { text: "täältä löytyy loistavia lahjaideoita haha", stars: 4 },
  { text: "Erittäin tyytyväinen! Aluksi Suomi/Ruotsi ei ollut valikoimassa, mutta sähköpostilla asia korjaantui salamannopeasti. Poika oli innoissaan uudesta mukistaan 😊👍", stars: 5 },
  { text: "tuote laadukas ja toimitus ripeä", stars: 5 },
  { text: "kaikki sujui juuri niin kuin oli luvattu ja tuotekin oli täysin ok", stars: 5 },
  { text: "Toimitus hoitui todella nopeasti.", stars: 5 },
  { text: "paketti tuli tosi nopeast perille", stars: 5 },
  { text: "Tuotteen laatu hyvä ja istuvuus just sopiva. Toimituksen seuranta oli tosin vähän epäselvä.", stars: 4 },
  { text: "nopea toimitus + laadukkaat materiaalit paidoissa. paidat on herättäny paljon naurua ympärillä", stars: 5 },
  { text: "ei mitää moitittavaa, toimitus nopea ja muutenkin kaikki ok", stars: 5 },
  { text: "Tilaus saapui todella nopeasti, kiitos siitä!", stars: 5 },
  { text: "palvelu oli todella ystävällistä ja hyvää 😊", stars: 5 },
  { text: "tuote oli juuri niin hyvä kuin toivoin", stars: 5 },
  { text: "Toimitus luotettavaa ja nopeaa.", stars: 5 },
  { text: "paketti tuli perille ripeästi", stars: 5 },
  { text: "homma meni luvatusti ehdottomasti suosittelen", stars: 5 },
  { text: "Kaikki toimi kuten pitikin, huppari oli aivan huippu ja toimitus tuli nopeasti.", stars: 5 },
  { text: "tää on parasta ikinä!!", stars: 5 },
  { text: "Tää on selkeästi paras meemikauppa! Palvelu sujuvaa, hinta-laatusuhde loistava ja uusi juomapeli aivan huikea.", stars: 5 },
  { text: "kaikki pelasi just niin ku pitää", stars: 5 },
  { text: "tilasin capybara-hupparin, laatu erinomainen koko täydellinen itselle ja printtikin onnistunu. asiakaspalvelu ansaitsee isot kiitokset!", stars: 5 },
  { text: "asiakaspalvelu tuotteiden laatu ja hinta-laatusuhde kaikki täysi kymppi 😊", stars: 5 },
  { text: "Asiakaspalvelu oli aivan uskomattoman hyvää!", stars: 5 },
  { text: "laatu tuntuu hyvältä toimitus ripeää ja koko osu nappiin", stars: 5 },
  { text: "maksu hoitu helposti, toimitus toimi moitteetta ja sain tosi kivan kassin", stars: 5 },
  { text: "kiva kassi ja vielä kotiinkuljetuksella", stars: 4 },
  { text: "Toimitus nopea ja tuotteet laadukkaita.", stars: 5 },
  { text: "Ei mitään valittamista. Tuotteet lähtivät vähän eri aikoihin, mutta kokonaisuus saapui sovitussa ajassa.", stars: 4 },
  { text: "tilaaminen helppoa toimitus nopea tuote laadukas ja valikoima monipuolinen", stars: 5 },
  { text: "tuotteet juuri sellaisia kuin piti ja valmistus + toimitus ripeää", stars: 5 },
  { text: "Tilasin ~50 € hupparin \u2013 laatu hyvä, mukava päällä. Voin suositella muillekin!", stars: 5 },
  { text: "asiakaspalvelu erinomaista! tilattu paita oli aluksi liian pieni mutta tilanne hoidettiin nopeasti ja joustavasti", stars: 5 },
  { text: "toimitus todella nopea", stars: 5 },
  { text: "paketti saapui salamannopeasti ja paidat olivat täsmälleen toivotunlaisia", stars: 5 },
  { text: "hauskat vaateet ja hauska muki tuli postissa :D kiva paikka ostaa!", stars: 5 },
  { text: "Printti paidoissa laadukas + ilmainen toimitus yli 79 € tilauksiin.", stars: 5 },
  { text: "hyvä meininki :D", stars: 5 },
  { text: "asiakaspalvelu ystävällistä ja koonvaihto isompaan suju helposti", stars: 5 },
  { text: "tilaus helppo ja paketti saapui kotiovelle joutuisasti", stars: 5 },
  { text: "Tuote täsmäsi täysin kuvaukseen.", stars: 5 },
  { text: "laadukkaat vaatteet selkeät tiedot ja nopea toimitus. tilannu jo koko perheelle täältä!", stars: 5 },
  { text: "kaikki meni just niin ku pitikin", stars: 5 },
  { text: "sivusto selkeä ja toimitus nopea. ei moitittavaa", stars: 5 },
  { text: "tilaaminen helppoa paketit saapuivat sujuvasti. tuotteet laadukkaita", stars: 5 },
  { text: "nopea ja kelpo kokemus", stars: 4 },
  { text: "Tilaus hoitui mutkattomasti ja tuote saapui ehjänä perille.", stars: 5 },
  { text: "kaikki toimi luvatusti ei viivästyksiä eikä muita ongelmia", stars: 5 },
  { text: "tuote ok mutta toimitus kesti harmillisen kauan (12 päivää)", stars: 4 },
  { text: "ei mitään ongelmia siis positiivinen kokemus :)", stars: 5 },
  { text: "Valmistaa hyviä vaatteita ja verkkopalvelu toimii todella hyvin.", stars: 5 },
  { text: "paketti tuli juuri sellaisena kuin pitikin", stars: 5 },
];

// --- src/pages/MothersDayPage.tsx (päiväämättömiä) ---
export const ARKISTO_AITIENPAIVA_ARVIOT: { name: string; text: string; rating: number }[] = [
  { name: "Marjut H.", text: "tilasin äidille mukin ja se nauroi puoli tuntia. Paras lahja koskaan!", rating: 5 },
  { name: "Petri S.", text: "huppari mummille viime jouluna \u2014 käyttää joka päivä. tilaan nyt äitienpäiväksi paidan.", rating: 5 },
  { name: "Sanna K.", text: "Anoppi tykkäsi! ja se ei tykkää yleensä mistään 😅 nopea toimitus", rating: 5 },
];
