/**
 * Harrastus- ja ammattisarjojen laskeutumissivut (29.10.2026, data/uudet-tuotteet/harrastussarjat-2026-10-29.json):
 * kahdeksan sarjaa x kuusi t-paitaa. Tuotteiden nimet päättyvät "| T-paita <pääte>", ja suodatin tunnistaa sarjan
 * päätteestä. Mukaan otetaan lisäksi selvästi samaan aiheeseen kuuluvat aiemmat tuotteet.
 *
 * Nämä sivut korvaavat päällekkäiset /harrastus/ ja /ammatti/ -sivut (301, landingRoutes.ts). Sivut ovat omia
 * kanonisiaan; otsikot ja H1:t eroavat toisistaan ja /lahjat/harrastajalle-sivusta.
 *
 * Tekstisäännöt kuten landingPages.ts: ei ajatusviivoja, ei todistamattomia väitteitä. Joulun tilauspäivä tulee
 * aina tilauspäivä-apureista (t-paidoille oma päivä), ei kirjoiteta käsin.
 */
import type { LandingPageDef, LandingProduct } from "./landingPages";
import { theme } from "./themes";
import { jouluAuki, JOULU_TPAITA_PAIVA_TEKSTI, jouluVastaus } from "./tilauspaivat";
import { TOIMITUSAIKA_LAUSE, TOIMITUSAIKA_TEKSTI } from "@/config/toimitus";

/** Sivun tuoteparit: sarjan pääte nimessä (t-paita <pääte>) ja siihen liittyvät aiemmat tuotteet. */
const sarja = (...pattern: RegExp[]) => theme(...pattern);

/** Sarjojen sivut keskenään ja hubit (jokaiselle sivulle sama lista, omaa sivua ei näytetä). */
const SARJA_POLUT = [
  "/lahjat/remontoijalle",
  "/lahjat/kalastajalle",
  "/lahjat/metsastajalle",
  "/lahjat/autoilijalle",
  "/lahjat/golfaajalle",
  "/lahjat/mokkeilijalle",
  "/lahjat/maanviljelijalle",
  "/lahjat/it-ihmiselle",
] as const;

export const SARJA_SIVUT: readonly string[] = SARJA_POLUT;

const related = (self: string): string[] => [
  ...SARJA_POLUT.filter((p) => p !== self),
  "/joululahjat",
  "/lahjat/harrastajalle",
];

/** T-paitojen joulun viimeinen tilauspäivä (sama apuri kuin tuotesivuilla), tilausajan jälkeen toimitusaika. */
const JOULU_TPAITA = jouluAuki()
  ? `T-paita ehtii jouluksi, kun tilaat sen viimeistään ${JOULU_TPAITA_PAIVA_TEKSTI}.`
  : `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää.`;

/** UKK-vastaus "Ehtiikö jouluksi?" (tilausajan jälkeen jouluVastaus). */
const JOULU_VASTAUS = jouluAuki()
  ? `Ehtii, kun tilaat t-paidan viimeistään ${JOULU_TPAITA_PAIVA_TEKSTI}. Tilaus ehtii silloin perille jouluaattoon mennessä. ${TOIMITUSAIKA_LAUSE}`
  : jouluVastaus();

const JOULU_KYSYMYS = "Ehtiikö paita jouluksi?";

const filterOf = (f: (p: LandingProduct) => boolean) => f;

export const sarjaPages: LandingPageDef[] = [
  {
    path: "/lahjat/remontoijalle",
    name: "Lahjat remontoijalle",
    group: "lahjat",
    title: "Hauska t-paita remontoijalle | Huumorikauppa",
    description: `T-paidat remontoijalle ja rakentajalle: Mittaa kerran, sahaa kolme kertaa ja muut remonttivitsit. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauska lahja remontoijalle",
    intro: [
      "Hauska t-paita remontoijalle on paita, jonka vitsin tunnistaa jokainen, jonka kylpyhuone on ollut kesken: Remontti valmis ensi vuonna, Mittaa kerran. Sahaa kolme kertaa ja Ei ole kantava seinä. Oli.",
      "Sarjassa on kuusi paitaa pikkuremontin kolmannesta vuodesta rautakaupan kanta-asiakkuuteen ja vasaraan, joka näyttää kaiken naulalta. Sivulla ovat myös rakennusmiehen, sähköasentajan ja putkimiehen ammattipaidat, joten sama sivu sopii sekä oman talon remontoijalle että alan ammattilaiselle.",
      `Paita on lahja ihmiselle, jonka olohuoneessa on ollut työmaa pitkään. ${JOULU_TPAITA}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja remontoijalle?",
        a: "T-paita remonttivitsillä, esimerkiksi Mittaa kerran. Sahaa kolme kertaa, Rautakaupan kanta-asiakas tai Vasara kädessä kaikki näyttää naulalta.",
      },
      {
        q: "Mikä paita sopii, kun remontti on ollut kesken jo vuosia?",
        a: "Remontti valmis ensi vuonna ja Pikkuremontti. Kolmas vuosi kertovat tilanteen puolestasi.",
      },
      {
        q: "Onko rakennusmiehelle tai sähköasentajalle oma paita?",
        a: "On. Rakennusmiehelle Kädet tekee, tulos näkyy, sähköasentajalle Ei kosketa märkänä ja putkimiehelle Löytää aina lekkauksen.",
      },
      { q: JOULU_KYSYMYS, a: JOULU_VASTAUS },
    ],
    related: related("/lahjat/remontoijalle"),
    categories: ["t-paidat", "hupparit"],
    filter: filterOf(
      sarja(
        /t-paita[ -]remontoijalle/,
        /kädet tekee tulos näkyy/,
        /rakennusmiehelle/,
        /sähköasentajalle/,
        /älä kosketa sähkömiestä/,
        /putkimiehelle/,
      ),
    ),
    featured: sarja(/t-paita[ -]remontoijalle/),
  },
  {
    path: "/lahjat/kalastajalle",
    name: "Lahjat kalastajalle",
    group: "lahjat",
    title: "Hauska t-paita kalastajalle | Huumorikauppa",
    description: `T-paidat kalastajalle ja pilkkijälle: Kalastan, siis valehtelen, Pilkillä. Älä soita ja muut kalavitsit. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauska lahja kalastajalle",
    intro: [
      "Hauska t-paita kalastajalle kertoo sen, minkä jokainen vedellä istunut tunnistaa: Kala oli tätäkin isompi, Kalastan, siis valehtelen ja Syötti loppui. Kahvi ei.",
      "Sarjassa on kuusi paitaa kesän uistelijalle ja talven pilkkijälle. Mukana ovat myös aiemmat suosikit KALAMIES, Kala pääsi tällä kertaa ja Jää kantaa, pilkki tulee. Viehelaatikko on sijoitus -paita sopii sille, jolla on vieheitä enemmän kuin sukkia.",
      `Paita sopii lahjaksi lomaviikon kalamiehelle ja perheen pilkkijälle. ${JOULU_TPAITA}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja kalastajalle?",
        a: "T-paita kalavitsillä, esimerkiksi Kala oli tätäkin isompi, Kalastan, siis valehtelen tai KALAMIES.",
      },
      {
        q: "Mikä paita sopii pilkkijälle?",
        a: "Pilkillä. Älä soita ja Jää kantaa, pilkki tulee. Kumpikin kertoo jäällä istujan arjesta.",
      },
      {
        q: "Onko kalastajalle huppariakin?",
        a: "On. Huonokin päivä kalassa on parempi kuin hyvä päivä töissä on saatavana sekä t-paitana että hupparina.",
      },
      { q: JOULU_KYSYMYS, a: JOULU_VASTAUS },
    ],
    related: related("/lahjat/kalastajalle"),
    categories: ["t-paidat", "hupparit"],
    filter: filterOf(
      sarja(
        /t-paita[ -]kalastajalle/,
        /kalamies/,
        /huonokin päivä kalassa/,
        /pilkkijälle/,
        /jää kantaa/,
      ),
    ),
    featured: sarja(/t-paita[ -]kalastajalle/),
  },
  {
    path: "/lahjat/metsastajalle",
    name: "Lahjat metsästäjälle",
    group: "lahjat",
    title: "Hauska t-paita metsästäjälle | Huumorikauppa",
    description: `T-paidat metsästäjälle: Passissa 14 tuntia, Koira löysi, minä en ja muut jahtiporukan vitsit. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauska lahja metsästäjälle",
    intro: [
      "Hauska t-paita metsästäjälle on jahtiporukan sisäpiirivitsi paidassa: Passissa 14 tuntia. Hirvi näki minut, Koira löysi. Minä en ja Peijaiset on kauden tärkein osa.",
      "Sarjassa on kuusi paitaa passimiehestä metsästysseuran virallisiin kahvinkeittäjiin. Sivulla on myös Ei ole kiire, olen metsässä -huppari sekä retkeilijän ja grillimestarin paidat nuotiolle.",
      `Paidat sopivat jahtimajalle, peijaisiin ja kotiin. Ne eivät korvaa näkyvyysvaatetusta, joten metsässä käytetään edelleen turvavarusteita. ${JOULU_TPAITA}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja metsästäjälle?",
        a: "T-paita jahtivitsillä, esimerkiksi Passissa 14 tuntia. Hirvi näki minut tai Syksy alkaa, kun jahti alkaa.",
      },
      {
        q: "Mikä paita sopii metsästysseuran jäsenelle?",
        a: "Metsästysseuran virallinen kahvinkeittäjä ja Peijaiset on kauden tärkein osa. Koiramiehelle sopii Koira löysi. Minä en.",
      },
      {
        q: "Sopiiko paita metsään?",
        a: "Paidat ovat huumorivaatteita jahtimajalle, nuotiolle ja kotiin. Metsässä tarvitaan edelleen näkyvyysvaatetus.",
      },
      { q: JOULU_KYSYMYS, a: JOULU_VASTAUS },
    ],
    related: related("/lahjat/metsastajalle"),
    categories: ["t-paidat", "hupparit"],
    filter: filterOf(
      sarja(
        /t-paita[ -]metsästäjälle/,
        /huppari metsästäjälle/,
        /ei ole kiire olen metsässä/,
        /retkeilijälle/,
        /grillimesterille/,
      ),
    ),
    featured: sarja(/t-paita[ -]metsästäjälle/),
  },
  {
    path: "/lahjat/autoilijalle",
    name: "Lahjat autoilijalle",
    group: "lahjat",
    title: "Hauska t-paita autoilijalle | Huumorikauppa",
    description: `T-paidat autoilijalle ja motoristille: Öljynvaihto on terapiaa, Katsastus meni läpi ja muut tallivitsit. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauska lahja autoilijalle ja motoristille",
    intro: [
      "Hauska t-paita autoilijalle on paita, jonka vitsin tuntee jokainen, jonka auto on odottanut tallissa vielä yhtä osaa: Vielä yksi osa. Sitten se käy ja Tallissa. Takaisin, kun se käy.",
      "Sarjan kuusi paitaa kattavat öljynvaihdon, kesärenkaat lokakuuhun asti, katsastuksen ja moottoripyörän: Moottoripyörä ei ole kriisi. Se on ratkaisu. Mukana ovat myös Ei myydä ei koskaan -paita autoharrastajalle, Isä tietää oikotien. Aina -paita ja linja-autonkuljettajan oma paita.",
      `Paita sopii lahjaksi korjaajalle, harrasteauton omistajalle ja motoristille. ${JOULU_TPAITA}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja autoilijalle?",
        a: "T-paita autovitsillä, esimerkiksi Öljynvaihto on terapiaa, Vielä yksi osa. Sitten se käy tai Katsastus meni läpi. Juhlitaan.",
      },
      {
        q: "Onko moottoripyöräilijälle oma paita?",
        a: "On. Moottoripyörä ei ole kriisi. Se on ratkaisu on sarjan motoristipaita.",
      },
      {
        q: "Mikä paita sopii autoharrastajalle, joka ei myy autoaan?",
        a: "Ei myydä ei koskaan -paita. Tallissa. Takaisin, kun se käy sopii niille, joiden projekti on jo vuosia kesken.",
      },
      { q: JOULU_KYSYMYS, a: JOULU_VASTAUS },
    ],
    related: related("/lahjat/autoilijalle"),
    categories: ["t-paidat", "hupparit"],
    filter: filterOf(
      sarja(
        /t-paita[ -]autoilijalle/,
        /ei myydä ei koskaan/,
        /autoharrastajalle/,
        /linja-autonkuljettajalle/,
        /isä tietää oikotien/,
      ),
    ),
    featured: sarja(/t-paita[ -]autoilijalle/),
  },
  {
    path: "/lahjat/golfaajalle",
    name: "Lahjat golfaajalle",
    group: "lahjat",
    title: "Hauska t-paita golfaajalle | Huumorikauppa",
    description: `T-paidat golfaajalle: Mulligan on ihmisoikeus, Vesieste rakastaa minua ja 19. reikä. Golfvitsit paidassa. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauska lahja golfaajalle",
    intro: [
      "Hauska t-paita golfaajalle on paita, jonka vitsit osuvat kentän jokaiselle reiälle: Pallo löytyi. Ei ollut minun, Tasoitus on mielentila ja Vesieste rakastaa minua.",
      "Sarjassa on kuusi paitaa. Mukana ovat Mulligan on ihmisoikeus, Se yksi hyvä lyönti pitää minut täällä ja 19. reikä on minun vahvuuteni sekä aiempi Bogey on elämäntapa. Samalle ulkoilijalle sopivat myös pyöräilijän ja juoksijan paidat.",
      `Paita sopii lahjaksi seuran jäsenelle, kaverille, jonka tasoitus ei laske, ja kierroksen jälkeen klubilla istuvalle. ${JOULU_TPAITA}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja golfaajalle?",
        a: "T-paita golfvitsillä, esimerkiksi Mulligan on ihmisoikeus, Bogey on elämäntapa tai Tasoitus on mielentila.",
      },
      {
        q: "Mikä paita sopii aloittelevalle golfaajalle?",
        a: "Vesieste rakastaa minua ja Pallo löytyi. Ei ollut minun kertovat jokaisen alkajan kierroksesta.",
      },
      {
        q: "Mitä 19. reikä tarkoittaa?",
        a: "Golfaajat kutsuvat 19. reiäksi kierroksen jälkeistä istumista klubilla. Paita on vitsi siitä, että se on oma lajinsa.",
      },
      { q: JOULU_KYSYMYS, a: JOULU_VASTAUS },
    ],
    related: related("/lahjat/golfaajalle"),
    categories: ["t-paidat", "hupparit"],
    filter: filterOf(
      sarja(
        /t-paita[ -]golfaajalle/,
        /bogey on elämäntapa/,
        /pyöräilijälle/,
        /juoksijalle/,
      ),
    ),
    featured: sarja(/t-paita[ -]golfaajalle/, /bogey on elämäntapa/),
  },
  {
    path: "/lahjat/mokkeilijalle",
    name: "Lahjat mökkeilijälle",
    group: "lahjat",
    title: "Hauska t-paita mökkeilijälle | Huumorikauppa",
    description: `T-paidat mökkeilijälle ja saunojalle: Löylyä lisää, Laiturilla istuminen on harrastus ja huussivitsit. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauska lahja mökkeilijälle ja saunojalle",
    intro: [
      "Hauska t-paita mökkeilijälle on paita laiturille, saunan lauteille ja kuistille: Löylyä lisää. Ei ole kuuma, Sauna lämpiää. Muut asiat odottaa ja Kantovesi pitää kunnossa.",
      "Sarjan kuusi paitaa kattavat mökkiviikonlopun: laiturilla istumisen, kantoveden, huussin lukunurkkauksen ja mökin, jossa ei ole kiire eikä kenttää. Mukana ovat myös Mökki on terapiaa -huppari, Joulusaunan löylymestari ja eläkeläisen Työt loppui. Mökki ei -paita ja avantouijan paita.",
      `Sauna- ja mökkipaita sopii lahjaksi isäntäväelle, vieraalle ja sukulaiselle, joka on mökillä joka kesä. ${JOULU_TPAITA}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja mökkeilijälle?",
        a: "T-paita mökkivitsillä, esimerkiksi Laiturilla istuminen on harrastus, Kantovesi pitää kunnossa tai Mökki on terapiaa -huppari.",
      },
      {
        q: "Mikä paita sopii saunojalle?",
        a: "Löylyä lisää. Ei ole kuuma ja Sauna lämpiää. Muut asiat odottaa. Jouluksi sopii Joulusaunan löylymestari.",
      },
      {
        q: "Onko paidoissa huussihuumoria?",
        a: "On. Sarjassa on paita huussin lukunurkkauksesta, mökin pienimmästä huoneesta.",
      },
      { q: JOULU_KYSYMYS, a: JOULU_VASTAUS },
    ],
    related: related("/lahjat/mokkeilijalle"),
    categories: ["t-paidat", "hupparit"],
    filter: filterOf(
      sarja(
        /t-paita[ -]mökkeilijälle/,
        /huppari mökkeilijälle/,
        /mökki on terapiaa/,
        /joulusaunan löylymestari/,
        /työt loppui\. mökki ei/,
        /avantouijalle/,
        /grillimesterille/,
        /retkeilijälle/,
      ),
    ),
    featured: sarja(/t-paita[ -]mökkeilijälle/),
  },
  {
    path: "/lahjat/maanviljelijalle",
    name: "Lahjat maanviljelijälle",
    group: "lahjat",
    title: "Hauska t-paita maanviljelijälle | Huumorikauppa",
    description: `T-paidat maanviljelijälle ja metsänomistajalle: Traktori ei kysy vapaapäiviä, Sateen ennustan polvista. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauska lahja maanviljelijälle ja metsänomistajalle",
    intro: [
      "Hauska t-paita maanviljelijälle kertoo sen, minkä tilan arki jo tietää: Traktori ei kysy vapaapäiviä, Pelto kutsuu. Soita illalla ja Sateen ennustan polvista.",
      "Metsänomistajalle sarjassa on omia paitoja: Metsänomistaja. Puhun kuutioista, Harvennus tehty. Kahvi ansaittu ja Puukaupat tehdään keittiön pöydän äärellä. Lisäksi sivulla ovat aiemmat Sää päättää, teen silti ja Isäntä -paidat.",
      `Paita sopii lahjaksi peltotöiden ja metsätöiden välisen kahvitauon seuraksi. ${JOULU_TPAITA}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja maanviljelijälle?",
        a: "T-paita maatilan vitsillä, esimerkiksi Traktori ei kysy vapaapäiviä, Pelto kutsuu. Soita illalla tai Sää päättää, teen silti.",
      },
      {
        q: "Mikä paita sopii metsänomistajalle?",
        a: "Metsänomistaja. Puhun kuutioista, Harvennus tehty. Kahvi ansaittu ja Puukaupat tehdään keittiön pöydän äärellä.",
      },
      {
        q: "Onko sääaiheista paitaa?",
        a: "On. Sateen ennustan polvista ja Sää päättää, teen silti kertovat jokaisen viljelijän tavan lukea taivasta.",
      },
      { q: JOULU_KYSYMYS, a: JOULU_VASTAUS },
    ],
    related: related("/lahjat/maanviljelijalle"),
    categories: ["t-paidat", "hupparit"],
    filter: filterOf(
      sarja(
        /t-paita[ -]maanviljelijälle/,
        /sää päättää teen silti/,
        /^isäntä \|/,
      ),
    ),
    featured: sarja(/t-paita[ -]maanviljelijälle/),
  },
  {
    path: "/lahjat/it-ihmiselle",
    name: "Lahjat IT-ihmiselle",
    group: "lahjat",
    title: "Hauska t-paita IT-ihmiselle | Huumorikauppa",
    description: `T-paidat IT-ihmiselle ja koodarille: Toimii minun koneellani, Perjantaina ei julkaista ja muut IT-vitsit. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauska lahja IT-ihmiselle",
    intro: [
      "Hauska t-paita IT-ihmiselle on paita, jonka vitsin tunnistaa jokainen, joka on vastannut kysymykseen Oletko kokeillut sammuttaa ja käynnistää?",
      "Sarjan kuusi paitaa kattavat sukulaisten IT-tuen, unohtuneen salasanan, perjantain julkaisukiellon ja kahvin, joka muuttuu koodiksi. Mukana on myös Ei se ole bugi, se on feature -paita koodarille sekä etätyöläisen ja pelaajan paidat.",
      `Paita sopii lahjaksi ylläpitäjälle, kehittäjälle ja sille, jota koko suku kutsuu korjaamaan tulostimen. ${JOULU_TPAITA}`,
    ],
    faqs: [
      {
        q: "Mikä on hauska lahja IT-ihmiselle?",
        a: "T-paita IT-vitsillä, esimerkiksi Toimii minun koneellani, Perjantaina ei julkaista tai Salasana vaihdettu. En muista.",
      },
      {
        q: "Mikä paita sopii koodarille?",
        a: "Kahvi sisään, koodia ulos ja Ei se ole bugi, se on feature kertovat ohjelmoijan arjesta.",
      },
      {
        q: "Onko etätyöläiselle oma paita?",
        a: "On. Konttori 3 metriä sängystä -huppari ja Tämäkin olisi voinut olla sähköposti -paita sopivat etätöihin.",
      },
      { q: JOULU_KYSYMYS, a: JOULU_VASTAUS },
    ],
    related: related("/lahjat/it-ihmiselle"),
    categories: ["t-paidat", "hupparit"],
    filter: filterOf(
      sarja(
        /t-paita[ -]it-ihmiselle/,
        /koodarille/,
        /etätöitä tekeville/,
        /palaverien kritisoijalle/,
        /t-paita pelaajalle/,
      ),
    ),
    featured: sarja(/t-paita[ -]it-ihmiselle/),
  },
];
