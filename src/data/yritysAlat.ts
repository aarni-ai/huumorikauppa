/**
 * Yritysmyynnin alakohtaiset sivut /yritykset/<ala> (2.11.2026). Kylmäviesteissä luvattiin alaan sopivia paitoja:
 * jokaisella sivulla 8-12 alan tuotetta, oma logo tai teksti, määräalennus, yritysten joulutakaraja ja
 * tarjouspyyntölomake, joka esitäyttää alan. Sama data React-sivulle (src/pages/BusinessVerticalPage.tsx) ja
 * esirenderöintiin (src/seo/prerender/pages.ts buildBusinessVerticalPages).
 *
 * Tuotteet valittu tuotannon /api/products-listalta 2.11.2026 aiheen mukaan (kaikki myynnissä). Jos tuote poistuu
 * myynnistä, sivu näyttää loput (vähintään 8 testataan src/data/yritysAlat.test.ts:ssä fixturea vasten). Lisäksi
 * alaan sopivat kilpailija-aukkojen mallit (src/data/aukkomallisto2026.ts) ensin; ne näkyvät, kun tuonti on tehty.
 */

export interface YritysAla {
  slug: string;
  /** Lyhyt nimi linkkeihin ja lomakkeen Ala-kenttään. */
  nimi: string;
  metaTitle: string;
  description: string;
  h1: string;
  intro: string[];
  /** Ideoita omaan logoon tai tekstiin. */
  ideat: string[];
  tuotteetOtsikko: string;
  tuotteet: string[];
  /** Lisää alan tuotteita kaupassa (Katso tuotteet -painike). */
  katso: { href: string; label: string };
  /** Alakohtainen kysymys (yhteiset kysymykset lisätään sivulla). */
  faq: { q: string; a: string };
}

export const YRITYS_ALAT: YritysAla[] = [
  {
    slug: "rakennus",
    nimi: "Rakennusala",
    metaTitle: "Työpaidat rakennusalalle omalla logolla | Huumorikauppa",
    description: "Hauskat t-paidat rakennusalan yrityksille: työmaahuumoria, oma logo tai teksti, määräalennus 10 paidasta ja tarjous laskulla.",
    h1: "Paidat rakennusalan yrityksille",
    intro: [
      "Työmaalla arvostetaan suoraa puhetta, ja sama pätee paitaan. Näissä paidoissa on rakentajien, sähkömiesten ja putkimiesten omaa huumoria, joka naurattaa koko porukkaa kahvikopissa.",
      "Valitse valmiit designit tai paina paitaan yrityksen logo ja oma teksti. Paidat sopivat joululahjaksi henkilökunnalle, työmaan yhteispaidaksi ja asiakaslahjaksi.",
    ],
    ideat: ["Yrityksen logo rintaan ja teksti \"Kädet tekee, tulos näkyy\"", "Työmaan nimi ja vuosi muistoksi valmistuneesta kohteesta", "Logo ja huumoridesign samaan paitaan"],
    tuotteetOtsikko: "Paidat rakentajille ja asentajille",
    tuotteet: [
      "rakentaja-aikataulu-on-arvio-t-paita-rakentajalle",
      "sahkomies-tiedan-mika-johtaa-mihinkin-t-paita-sahkomiehelle",
      "putkimies-naen-asioita-joita-et-halua-nahda-t-paita-putkimiehelle",
      "hauska-t-paita-rakennusmiehelle-kadet-tekee-tulos-nakyy",
      "hauska-t-paita-sahkoasentajalle-ei-kosketa-markana",
      "ala-kosketa-sahkomiesta-kun-olet-marka-t-paita",
      "hauska-t-paita-putkimiehelle-loytaa-aina-lekkauksen",
      "vasara-kadessa-kaikki-nayttaa-naulalta-t-paita-remontoijalle",
      "mittaa-kerran-sahaa-kolme-kertaa-t-paita-remontoijalle",
      "ei-ole-kantava-seina-oli-t-paita-remontoijalle",
      "rautakaupan-kanta-asiakas-t-paita-remontoijalle",
    ],
    katso: { href: "/lahjat/remontoijalle", label: "Paidat remontoijille" },
    faq: {
      q: "Voiko samassa tilauksessa olla eri designeja eri ammattiryhmille?",
      a: "Voi. Määräalennus lasketaan kaikista tilauksen t-paidoista, joten sähkömiehille, putkimiehille ja kirvesmiehille voi valita omat designit samaan tilaukseen.",
    },
  },
  {
    slug: "insinoorit",
    nimi: "Insinööritoimistot",
    metaTitle: "Paidat insinööritoimistoille omalla logolla | Huumorikauppa",
    description: "Hauskat t-paidat insinööri- ja suunnittelutoimistoille: tekniikan huumoria, oma logo tai teksti ja määräalennus 10 paidasta.",
    h1: "Paidat insinööri- ja suunnittelutoimistoille",
    intro: [
      "Insinöörin huumori on tarkkaa: mittaa kerran, sahaa kolme kertaa. Näissä paidoissa on vitsejä suunnittelusta, laskennasta, palavereista ja siitä, miksi se toimii omalla koneella.",
      "Paidat sopivat projektin päättäjäisiin, pikkujouluun ja joululahjaksi koko toimistolle. Oman logon ja tekstin saa samaan paitaan.",
    ],
    ideat: ["Toimiston logo ja teksti \"Laskettu, tarkistettu, laskettu uudelleen\"", "Projektin nimi ja valmistumisvuosi", "Tiimin nimi ja huumoridesign"],
    tuotteetOtsikko: "Paidat insinööreille ja suunnittelijoille",
    tuotteet: [
      "insinoori-toimii-teoriassa-t-paita-insinoorille",
      "mittaa-kerran-sahaa-kolme-kertaa-t-paita-remontoijalle",
      "toimii-minun-koneellani-t-paita-it-ihmiselle",
      "oletko-kokeillut-sammuttaa-ja-kaynnistaa-t-paita-it-ihmiselle",
      "hauska-t-paita-koodarille-ei-se-ole-bugi-se-on-feature",
      "hauska-t-paita-palaverien-kritisoijalle-tamakin-olisi-voinut-olla-sahkoposti",
      "ei-ole-kantava-seina-oli-t-paita-remontoijalle",
      "hauska-t-paita-sahkoasentajalle-ei-kosketa-markana",
      "perjantaina-ei-julkaista-t-paita-it-ihmiselle",
      "hauska-t-paita-tiimipelaajalle-tiimipelaaja-vaikka-tiimi-ei-pelaa",
      "personoitava-t-paita-alalla-x-vuotta",
    ],
    katso: { href: "/ammatti/insinoori", label: "Paidat insinööreille" },
    faq: {
      q: "Voiko paitaan painaa jokaiselle oman nimen?",
      a: "Personoitavaan paitaan \"Alalla X vuotta\" kirjoitetaan teksti tilauksen yhteydessä. Oma logo -paidassa teksti on sama koko tilauksessa, joten eri nimet tilataan omina riveinä.",
    },
  },
  {
    slug: "vpk",
    nimi: "VPK ja pelastusala",
    metaTitle: "Paidat VPK:lle ja palokunnille | Huumorikauppa",
    description: "Hauskat t-paidat VPK:lle, palokunnille ja pelastusalalle: oma logo tai teksti, määräalennus 10 paidasta ja tilaus laskulla.",
    h1: "Paidat VPK:lle ja palokunnille",
    intro: [
      "Palokunnassa porukka pitää yhtä, ja yhteinen paita näkyy harjoituksissa, talkoissa ja tapahtumissa. Näissä paidoissa on palomiesten ja pelastajien huumoria savusukelluksesta saunan löylyihin.",
      "Paina paitaan oman palokunnan logo tai teksti ja valitse halutessasi huumoridesign mukaan. Paidat sopivat myös joululahjaksi hälytysosastolle ja nuoriso-osastolle.",
    ],
    ideat: ["Palokunnan logo ja perustamisvuosi", "Teksti \"Hälytysosasto\" ja paikkakunta", "Logo ja huumoridesign samaan paitaan"],
    tuotteetOtsikko: "Paidat palokuntalaisille",
    tuotteet: [
      "palomies-kuumat-paikat-ovat-minun-t-paita-palomiehelle",
      "hauska-t-paita-palomiehelle-sankari-savussa",
      "kuka-heitti-tuon-loylyn-mina-t-paita-saunojalle",
      "oletko-kokeillut-sammuttaa-ja-kaynnistaa-t-paita-it-ihmiselle",
      "loylya-lisaa-ei-ole-kuuma-t-paita-mokkeilijalle",
      "hauska-t-paita-grillimesterille-grillimestari-saa-ei-esta",
      "otsalamppu-on-muotia-marraskuussa-t-paita-talveen",
      "hauska-t-paita-avantouijalle-20c-sopiva-uimakeli",
      "hauska-t-paita-tiimipelaajalle-tiimipelaaja-vaikka-tiimi-ei-pelaa",
      "saatanan-tunarit-t-paita",
      "amatimies-t-paita",
      "personoitava-t-paita-nimi-legendaarinen-tyosankari",
    ],
    katso: { href: "/ammatti/palomies", label: "Paidat palomiehille" },
    faq: {
      q: "Voiko yhdistys tilata laskulla?",
      a: "Voi. Yhdistys, jolla on Y-tunnus, voi tilata vähintään 10 tuotetta laskulla. Lähetä tarjouspyyntö lomakkeella, niin vastaamme sähköpostilla.",
    },
  },
  {
    slug: "terveys",
    nimi: "Hammas- ja eläinlääkäriasemat",
    metaTitle: "Paidat hammas- ja eläinlääkäriasemille | Huumorikauppa",
    description: "Hauskat t-paidat hammaslääkäri- ja eläinlääkäriasemille: oma logo tai teksti, määräalennus 10 paidasta ja tarjous laskulla.",
    h1: "Paidat hammaslääkäri- ja eläinlääkäriasemille",
    intro: [
      "Vastaanotolla päivät ovat kiireisiä, ja hyvä vitsi keventää tunnelmaa taukohuoneessa. Näissä paidoissa on huumoria pipareista, koirista, aamuvuoroista ja työkavereista, joiden ansiosta päivästä selviää.",
      "Paidat sopivat henkilökunnan joululahjaksi, virkistyspäivään ja pikkujouluun. Aseman logon tai oman tekstin saa samaan paitaan.",
    ],
    ideat: ["Aseman logo ja teksti \"Hymyä vastaanotolta\"", "Eläinlääkäriasemalle logo ja teksti \"Tassut ensin\"", "Tiimin nimi ja huumoridesign"],
    tuotteetOtsikko: "Paidat vastaanoton väelle",
    tuotteet: [
      "sairaanhoitaja-kahvi-on-ensiapua-t-paita-sairaanhoitajalle",
      "lahihoitaja-kiire-on-toinen-nimeni-t-paita-lahihoitajalle",
      "piparivaras-ei-todisteita-t-paita-jouluun",
      "hauska-t-paita-koiranomistajalle-koira-on-perhetta-ihminen-on-lisa",
      "personoitava-t-paita-koiranomistajalle-koiran-nimi-herran-paras-ystava",
      "hauska-t-paita-siivoojalle-puhtaus-on-puoli-elamaa",
      "hauska-t-paita-asiakaspalvelijalle-asiakas-on-aina-oikeassa-lahes",
      "hauska-t-paita-lounastaukoa-rakastaville-tarkeinta-tyossa-on-lounastauko",
      "d-vitamiinia-ja-kahvia-kaamosdieetti-t-paita-talveen",
      "marraskuussa-en-ole-aamuihminen-t-paita-talveen",
      "hauska-t-paita-tyokaverillle-selvian-tyokaverit-auttaa",
      "personoitava-t-paita-alalla-x-vuotta",
    ],
    katso: { href: "/ammatti/hammaslaakari", label: "Paidat hammaslääkäreille" },
    faq: {
      q: "Sopiiko paita työvaatteeksi vastaanotolle?",
      a: "Paidat ovat t-paitoja vapaa-aikaan, virkistyspäiviin ja juhliin. Hygieniavaatimukset täyttävät työasut hankitaan erikseen.",
    },
  },
  {
    slug: "kauneus",
    nimi: "Kauneusala",
    metaTitle: "Paidat kampaamoille ja kauneushoitoloille | Huumorikauppa",
    description: "Hauskat t-paidat kampaamoille, parturiliikkeille ja kauneushoitoloille: oma logo tai teksti ja määräalennus 10 paidasta.",
    h1: "Paidat kampaamoille ja kauneushoitoloille",
    intro: [
      "Kampaamossa ja hoitolassa tyyli on tärkeää, ja hyvä paita on myös puheenaihe asiakkaan kanssa. Näissä paidoissa on huumoria hiuksista, aamuista, asiakaspalvelusta ja siitä, kuka talossa päättää.",
      "Paina paitaan liikkeen logo tai oma teksti. Paidat sopivat tiimin yhteisasuksi tapahtumiin, henkilökunnan joululahjaksi ja kanta-asiakkaiden arvontaan.",
    ],
    ideat: ["Liikkeen logo ja teksti \"Hyvä hiuspäivä joka päivä\"", "Liikkeen nimi ja somekanava selkään tai rintaan", "Logo ja huumoridesign samaan paitaan"],
    tuotteetOtsikko: "Paidat kauneusalan ammattilaisille",
    tuotteet: [
      "hauska-t-paita-parturille-leikkaa-myos-tukkaa",
      "slay-queen-t-paita",
      "40-ja-fabulous-t-paita",
      "50-ja-hopeanhohtoinen-vain-hiukset-t-paita",
      "kalju-t-paita",
      "hauska-t-paita-asiakaspalvelijalle-asiakas-on-aina-oikeassa-lahes",
      "hauska-t-paita-tyokaverillle-selvian-tyokaverit-auttaa",
      "marraskuussa-en-ole-aamuihminen-t-paita-talveen",
      "d-vitamiinia-ja-kahvia-kaamosdieetti-t-paita-talveen",
      "tassa-talossa-asuu-yksi-pomo-t-paita",
      "personoitava-t-paita-alalla-x-vuotta",
    ],
    katso: { href: "/ammattipaidat", label: "Ammattipaidat" },
    faq: {
      q: "Voiko paitoja käyttää liikkeen myyntituotteena?",
      a: "Paidat on tarkoitettu yrityksen omaan käyttöön, lahjoiksi ja arvontoihin. Kerro jälleenmyyntitoiveesta tarjouspyynnössä, niin vastaamme sähköpostilla.",
    },
  },
  {
    slug: "it",
    nimi: "IT-yritykset",
    metaTitle: "Paidat IT-yrityksille ja koodareille | Huumorikauppa",
    description: "Hauskat t-paidat IT-yrityksille: koodari- ja IT-tukihuumoria, oma logo tai teksti, määräalennus 10 paidasta ja tilaus laskulla.",
    h1: "Paidat IT-yrityksille ja ohjelmistotiimeille",
    intro: [
      "IT-alalla jokainen tuntee lauseet \"toimii minun koneellani\" ja \"perjantaina ei julkaista\". Näissä paidoissa ne on painettu niin, että koko tiimi tunnistaa vitsin heti.",
      "Paidat sopivat rekrytointitapahtumiin, hackathoneihin, pikkujouluun ja joululahjaksi kehittäjille. Yrityksen logon ja oman tekstin saa samaan paitaan.",
    ],
    ideat: ["Yrityksen logo ja teksti \"Deploy perjantaina? Ei.\"", "Tiimin nimi ja sprintin numero", "Logo ja huumoridesign samaan paitaan"],
    tuotteetOtsikko: "Paidat koodareille ja IT-tuelle",
    tuotteet: [
      "it-tuki-kokeilitko-sammuttaa-ja-kaynnistaa-t-paita-it-tuelle",
      "toimii-minun-koneellani-t-paita-it-ihmiselle",
      "oletko-kokeillut-sammuttaa-ja-kaynnistaa-t-paita-it-ihmiselle",
      "kahvi-sisaan-koodia-ulos-t-paita-it-ihmiselle",
      "salasana-vaihdettu-en-muista-t-paita-it-ihmiselle",
      "perjantaina-ei-julkaista-t-paita-it-ihmiselle",
      "sukulaisten-it-tuki-ei-palkkaa-t-paita-it-ihmiselle",
      "hauska-t-paita-koodarille-ei-se-ole-bugi-se-on-feature",
      "hauska-t-paita-palaverien-kritisoijalle-tamakin-olisi-voinut-olla-sahkoposti",
      "hauska-t-paita-pelaajalle-just-one-more-level",
      "hauska-huppari-etatoita-tekeville-konttori-3-metria-sangysta",
    ],
    katso: { href: "/lahjat/it-ihmiselle", label: "Paidat IT-ihmisille" },
    faq: {
      q: "Voiko paitoja toimittaa etätyöntekijöille eri osoitteisiin?",
      a: "Yksi tilaus toimitetaan yhteen osoitteeseen. Jokaiseen osoitteeseen tehdään oma tilaus, ja määräalennus lasketaan tilauskohtaisesti.",
    },
  },
  {
    slug: "mainos",
    nimi: "Mainos- ja viestintätoimistot",
    metaTitle: "Paidat mainos- ja viestintätoimistoille | Huumorikauppa",
    description: "Hauskat t-paidat mainos-, markkinointi- ja viestintätoimistoille: oma logo tai teksti, määräalennus 10 paidasta ja tarjous laskulla.",
    h1: "Paidat mainos- ja viestintätoimistoille",
    intro: [
      "Mainostoimistossa tiedetään, että hyvä viesti on lyhyt. Näissä paidoissa on huumoria palavereista, kaupan klousaamisesta, asiakkaista ja julkaisupäivistä.",
      "Paidat toimivat tiimin asuna tapahtumissa, asiakaslahjana ja joululahjana henkilökunnalle. Toimiston logon tai oman sloganin saa samaan paitaan.",
    ],
    ideat: ["Toimiston logo ja teksti \"Tämäkin olisi voinut olla sähköposti\"", "Kampanjan nimi ja vuosi muistoksi onnistuneesta projektista", "Logo ja huumoridesign samaan paitaan"],
    tuotteetOtsikko: "Paidat mainos- ja myyntiväelle",
    tuotteet: [
      "hauska-t-paita-palaverien-kritisoijalle-tamakin-olisi-voinut-olla-sahkoposti",
      "hauska-t-paita-myyntimiehelle-kaupat-klousattu",
      "hauska-t-paita-asiakaspalvelijalle-asiakas-on-aina-oikeassa-lahes",
      "hauska-t-paita-valokuvaajalle-hetki-kiinni-muisti-vapaana",
      "perjantaina-ei-julkaista-t-paita-it-ihmiselle",
      "tonnin-seteli-t-paita",
      "saatanan-tunarit-t-paita",
      "maailman-mestarit-2026-t-paita",
      "hauska-t-paita-pomolle-maailman-paras-pomo-itse-sanoo",
      "hauska-t-paita-lounastaukoa-rakastaville-tarkeinta-tyossa-on-lounastauko",
      "hauska-huppari-etatoita-tekeville-konttori-3-metria-sangysta",
    ],
    katso: { href: "/meemipaidat", label: "Meemipaidat" },
    faq: {
      q: "Voiko paitaan painaa asiakkaan logon asiakaslahjaksi?",
      a: "Paitaan painetaan logo, jonka käyttöön tilaajalla on oikeus. Kun teette asiakaslahjoja, lähettäkää logo ja käyttölupa tarjouspyynnön yhteydessä.",
    },
  },
  {
    slug: "tapahtumat",
    nimi: "Tapahtumat ja juhlat",
    metaTitle: "Paidat tapahtumiin ja pikkujouluihin | Huumorikauppa",
    description: "Hauskat t-paidat tapahtumiin, pikkujouluihin ja yrityksen juhliin: oma logo tai teksti, määräalennus 10 paidasta ja tilaus laskulla.",
    h1: "Paidat tapahtumiin, juhliin ja pikkujouluihin",
    intro: [
      "Yhteinen paita tekee porukasta tunnistettavan ja juhlasta muistettavan. Näissä paidoissa on pikkujoulujen, karaoken ja tanssilattian huumoria sekä paitoja järjestäjille ja kuvaajille.",
      "Paina paitaan tapahtuman nimi ja vuosi tai yrityksen logo. Paidat sopivat pikkujouluihin, kesäjuhliin, messuille ja tiimipäiviin.",
    ],
    ideat: ["Tapahtuman nimi, päivämäärä ja paikka", "Teksti \"Järjestäjä\" tai \"Crew\" ja yrityksen logo", "Pikkujoulujen teema ja huumoridesign"],
    tuotteetOtsikko: "Paidat juhliin ja pikkujouluihin",
    tuotteet: [
      "pikkujoulut-nyt-sinuttelen-esimiesta-t-paita-jouluun",
      "tanssilattian-kuningas-pikkujoulut-2026-t-paita-jouluun",
      "karaokevuoro-varattu-jo-syyskuussa-t-paita-pikkujouluihin",
      "pikkujoulujen-nimetty-kuski-t-paita-pikkujouluihin",
      "tanaan-tanssin-huomenna-kadun-t-paita-pikkujouluihin",
      "pikkujoulut-muistan-osittain-t-paita-pikkujouluihin",
      "pikkujouluissa-kaikki-on-salaista-t-paita-jouluun",
      "hauska-t-paita-kitaristille-one-more-song-aina-yksi-lisaa",
      "hauska-t-paita-grillimesterille-grillimestari-saa-ei-esta",
      "hauska-t-paita-valokuvaajalle-hetki-kiinni-muisti-vapaana",
      "hauska-huppari-pikkujouluihin-pikkujoulut-muistetaan-vuosia",
      "kaljavahti-tanaan-ei-lopu-kesken-t-paita-oluen-ystavalle",
    ],
    katso: { href: "/lahjat/pikkujouluihin", label: "Pikkujoulupaidat" },
    faq: {
      q: "Ehtivätkö paidat tapahtumaan?",
      a: "Kirjoita tapahtuman päivä lomakkeen kohtaan Toivottu toimituspäivä, niin laskuri näyttää heti, ehtiikö tänään tehty tilaus perille.",
    },
  },
  {
    slug: "urheiluseurat",
    nimi: "Urheiluseurat",
    metaTitle: "Paidat urheiluseuroille ja joukkueille | Huumorikauppa",
    description: "Hauskat t-paidat urheiluseuroille, joukkueille ja kuntosaleille: oma logo tai teksti, määräalennus 10 paidasta ja tilaus laskulla.",
    h1: "Paidat urheiluseuroille ja joukkueille",
    intro: [
      "Seurapaita kertoo, mihin porukkaan kuuluu, ja hyvä vitsi tekee siitä paidan, jota käytetään myös treenien ulkopuolella. Näissä paidoissa on joukkuepelaajien, juoksijoiden, golfaajien ja salitreenaajien huumoria.",
      "Paina paitaan seuran logo ja joukkueen nimi. Paidat sopivat kannattajapaidoiksi, varainhankintaan, kauden päättäjäisiin ja valmentajien lahjaksi.",
    ],
    ideat: ["Seuran logo ja perustamisvuosi", "Joukkueen nimi ja kausi, esimerkiksi \"Kausi 2026\"", "Teksti \"Kannattaja\" ja huumoridesign"],
    tuotteetOtsikko: "Paidat urheilijoille ja kannattajille",
    tuotteet: [
      "hauska-t-paita-tiimipelaajalle-tiimipelaaja-vaikka-tiimi-ei-pelaa",
      "maailman-mestarit-2026-t-paita",
      "hauska-t-paita-kuntosaliharrastajalle-jalkapaiva-ohitettu-jalleen",
      "hauska-t-paita-juoksijalle-jos-naat-minut-juoksemassa-soita-ambulanssi",
      "hauska-t-paita-pyorailijalle-ylamaki-voitettu-toistaiseksi",
      "19-reika-on-minun-vahvuuteni-t-paita-golfaajalle",
      "saunominen-on-urheilua-olen-ammattilainen-t-paita-saunojalle",
      "tasoitus-on-mielentila-t-paita-golfaajalle",
      "hauska-t-paita-avantouijalle-20c-sopiva-uimakeli",
      "hauska-huppari-lumilautailijalle-gravity-is-just-a-suggestion",
      "saatanan-tunarit-t-paita",
      "personoitava-t-paita-kapteeni",
    ],
    katso: { href: "/harrastus/kuntosali", label: "Paidat treenaajille" },
    faq: {
      q: "Sopivatko paidat urheiluun?",
      a: "Paidat ovat t-paitoja kannattajille, vapaa-aikaan ja seuran tapahtumiin. Kilpailuasuiksi tarkoitetut tekniset paidat hankitaan erikseen.",
    },
  },
];

export const YRITYS_ALA_POLKU = (slug: string) => `/yritykset/${slug}`;
export const YRITYS_ALA_POLUT = YRITYS_ALAT.map((a) => YRITYS_ALA_POLKU(a.slug));
export const yritysAla = (slug: string | undefined): YritysAla | undefined => YRITYS_ALAT.find((a) => a.slug === slug);
