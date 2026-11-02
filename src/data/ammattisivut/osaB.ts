/**
 * Ammattisivut, osa B: koulu, tekniikka, turvallisuus, palvelu ja asiantuntijat (/paidat/<slug>). Muoto: ./tyypit.ts.
 */
import type { AmmattiSivuSisalto } from "./tyypit";

const alallaVuotta = (teksti: string) => `/tuote/personoitava-t-paita-alalla-x-vuotta?teksti=${encodeURIComponent(teksti)}`;
const tyosankari = (teksti: string) => `/tuote/personoitava-t-paita-nimi-legendaarinen-tyosankari?teksti=${encodeURIComponent(teksti)}`;

export const SIVUT_B: AmmattiSivuSisalto[] = [
  {
    slug: "opettaja",
    nimi: "Opettajan paidat",
    ryhma: "ammatti",
    kohde: "opettajalle",
    otsikko: "Lahja opettajalle: hauskat paidat",
    kuvaus: "Hauska lahja opettajalle: paidat ja hupparit kokeista, kopiokoneesta ja välitunnilla kylmenneestä kahvista.",
    h1: "Hauskat paidat ja lahjat opettajalle",
    intro: [
      "Lahja opettajalle on helppo valita, kun se naurattaa opettajainhuoneessa: t-paita tai huppari, jossa lukee Tämä tulee kokeeseen. Kaikki tulee tai Kopiokone ja minä olemme tauolla.",
      "Uusia opettajan malleja on viisi, ja jokainen löytyy sekä t-paitana että hupparina. Mukana on myös aiempi Opettaja. Kyllä, näin sen, joka kertoo luokan takarivin salaisuuksista kaiken olennaisen.",
    ],
    opas: [
      {
        otsikko: "Opettajainhuoneen sisäpiirin vitsit",
        teksti: [
          "Opettajan päivä on täynnä pieniä hetkiä, joita ulkopuolinen ei huomaa. Kahvi kaadetaan kuppiin ennen ensimmäistä tuntia ja juodaan haaleana viimeisen jälkeen. Kopiokone jumittuu juuri silloin, kun monisteiden pitäisi olla luokassa kahden minuutin päästä. Vihkoista löytyy käsialaa, jota kirjoittaja ei itsekään pysty lukemaan.",
          "Näistä hetkistä syntyivät uudet mallit. Opettaja. Kahvi kylmeni välitunnilla sopii jokaiselle, joka on lähtenyt käytävävalvontaan kesken kupin. Luen käsialaa, jota kirjoittaja ei itsekään lue on äidinkielen ja historian opettajan kunnianosoitus kokeiden korjaamiselle. Lukuvuosi ohi. Ääni palaa elokuussa kertoo kevään viimeisestä viikosta.",
        ],
      },
      {
        otsikko: "Kiitos lukuvuodesta, läksiäiset ja eläkepäivä",
        teksti: [
          "Moni hakee lahjaa opettajalle kevätjuhlan alla, kun luokka haluaa kiittää yhteisestä vuodesta. Paita on muisto, joka ei pölyynny hyllyllä: sitä käytetään retkipäivänä, vanhempainillassa tai kesämökillä. Toinen tavallinen hetki on eläkkeelle jäävän kollegan läksiäiset, joissa yhteinen lahja kerätään opettajainhuoneen kahvikassasta.",
          "Opettajaksi valmistuvalle paita on hauska tapa toivottaa tervetulleeksi ammattiin. Huppari sopii välituntivalvontaan pakkasaamuna, ja t-paita kulkee liikuntatunnilla ja luokkaretkellä.",
        ],
      },
      {
        otsikko: "Opettajan nimi ja vuodet paitaan",
        teksti: [
          "Jos haluat lahjaan henkilökohtaisen sävyn, valitse personoitava paita. Linkissä on valmiina teksti Opettaja, alalla 25 vuotta, ja voit vaihtaa vuodet, aineen tai koulun nimen ennen tilausta. Varhaiskasvattajan ja muiden ammattien paidat löydät sivun alalaidan linkeistä.",
        ],
      },
      {
        otsikko: "Kun lahja on koko luokalta",
        teksti: [
          "Luokan yhteinen lahja on helppo järjestää: yksi vanhempi kerää pienen summan ja valitsee mallin, jonka vitsi sopii juuri tähän opettajaan. Matematiikan opettaja ilahtuu kokeeseen liittyvästä vitsistä, ja kielten opettaja tunnistaa käsialapaidan heti.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja opettajalle?",
        a: "T-paita tai huppari koulun arjen vitsillä, esimerkiksi Tämä tulee kokeeseen. Kaikki tulee tai Opettaja. Kahvi kylmeni välitunnilla.",
      },
      {
        q: "Sopiiko paita luokan yhteiseksi kiitoslahjaksi opettajalle?",
        a: "Sopii. Paita on muisto, jota opettaja käyttää vapaa-ajalla ja retkipäivinä, ja personoitavaan paitaan voi painaa luokan terveiset.",
      },
      {
        q: "Onko eläkkeelle jäävälle opettajalle omaa paitaa?",
        a: "Lukuvuosi ohi. Ääni palaa elokuussa sopii viimeiseen kevääseen. Lisää eläkelahjoja on sivulla eläkelahjat.",
      },
    ],
    tuotteet: [/opettaja/],
    mallit: [
      ["TÄMÄ TULEE", "KOKEESEEN.", "KAIKKI TULEE."],
      ["OPETTAJA.", "KAHVI KYLMENI", "VÄLITUNNILLA."],
      ["LUEN KÄSIALAA,", "JOTA KIRJOITTAJA", "EI ITSEKÄÄN LUE."],
      ["KOPIOKONE JA MINÄ", "OLEMME TAUOLLA."],
      ["LUKUVUOSI OHI.", "ÄÄNI PALAA", "ELOKUUSSA."],
    ],
    liittyvat: ["/ammatit", "/paidat/lahihoitaja", "/paidat/juristi", "/elakelahjat", "/lahjat/tyokaverille", "/ammattipaidat"],
    personoitu: {
      teksti: "Kirjoita paitaan opettajan nimi, aine tai työvuodet. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: alallaVuotta("Opettaja, alalla 25 vuotta"),
      label: "Alalla X vuotta: Opettaja",
    },
  },
  {
    slug: "insinoori",
    nimi: "Insinöörin paidat",
    ryhma: "ammatti",
    kohde: "insinöörille",
    otsikko: "Insinööri paita: hauskat lahjat",
    kuvaus: "Hauskat insinööripaidat ja hupparit: varmuuskerroin kaksi, toleranssi ja suunnitelma, jota todellisuus ei hyväksynyt.",
    h1: "Insinöörin paidat ja hauskat lahjat insinöörille",
    intro: [
      "Insinööri paita on lahja ihmiselle, joka laskee asian kahdesti ja saa kaksi eri tulosta: Laskin sen kahdesti. Tulos on eri ja Mitoitettu varmuuskertoimella kaksi.",
      "Viiden uuden mallin rinnalla sivulla on aiempi Insinööri. Toimii teoriassa. Kaikki uudet mallit ovat saatavana t-paitana ja hupparina.",
    ],
    opas: [
      {
        otsikko: "Teoria, käytäntö ja välissä insinööri",
        teksti: [
          "Insinöörihuumori asuu siinä raossa, joka jää piirustuksen ja työmaan väliin. Suunnitelma on hyväksytty kolmessa palaverissa, mutta paikan päällä putki kulkee juuri siitä kohdasta, johon ilmanvaihtokanava piirrettiin. Kone toimii, kunhan kukaan ei koske siihen. Tämä tunne on tuttu konetekniikasta, rakennuksista, prosesseista ja sähköstä.",
          "Suunnitelma ok. Todellisuus ei hyväksynyt tiivistää koko projektin yhteen paitaan. Ei se ole rikki. Se on toleranssin sisällä on vastaus laatupoikkeamaan, ja Insinööri. Piirsin jo kaavion tästä sopii ihmiselle, joka selittää kaiken lohkokaaviolla, myös perheen lomasuunnitelman.",
        ],
      },
      {
        otsikko: "Valmistujaisiin, syntymäpäivälle ja projektin päätökseen",
        teksti: [
          "Insinööriksi valmistuva saa paidasta muiston opintojen viimeisestä keväästä, ja kokeneelle kollegalle se on hauska kiitos ison projektin käyttöönotosta. Paita toimii myös syntymäpäivälahjana ja pikkujoulujen vaihtolahjana, kun tiimissä on useampi saman alan ihminen.",
          "IT-ihmisille on oma sivunsa, jossa vitsit kertovat koodista, salasanoista ja tuesta. Tämä sivu on niille, jotka mitoittavat, laskevat ja piirtävät.",
        ],
      },
      {
        otsikko: "Oma teksti insinöörin paitaan",
        teksti: [
          "Personoitavaan paitaan voit kirjoittaa insinöörin nimen, erikoisalan tai vuodet alalla. Linkin ehdotus on Insinööri, alalla 15 vuotta.",
        ],
      },
      {
        otsikko: "Lahja koko suunnittelutiimille",
        teksti: [
          "Kun samassa toimistossa istuu kymmenen insinööriä, jokainen saa oman vitsinsä. Rakennesuunnittelija valitsee varmuuskertoimen, laatupäällikkö toleranssin ja projektipäällikkö suunnitelman, jota todellisuus ei hyväksynyt. Yhteinen kuva paidoissa sopii projektin päättäjäisiin, ja insinööritoimistoille on omat tiimipaidat. Huppari lämmittää työmaakäynnillä ja kylmässä koestushallissa, t-paita kulkee messuilla ja kesän ulkotapahtumassa.",
          "Insinööri arvostaa lahjaa, jonka toiminta on selvää ilman käyttöohjetta. Paita puetaan päälle, vitsi luetaan kerran ja kollega nauraa. Mitään ei tarvitse kalibroida, eikä muutoksesta tarvitse avata muutostilausta. Sellainen ratkaisu kelpaa jokaiselle, joka on istunut yhdessäkään katselmoinnissa.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja insinöörille?",
        a: "Paita tai huppari insinöörin vitsillä, esimerkiksi Suunnitelma ok. Todellisuus ei hyväksynyt tai Mitoitettu varmuuskertoimella kaksi.",
      },
      {
        q: "Mitä eroa on insinöörin ja IT-ihmisen paidoilla?",
        a: "Insinöörin paidat kertovat mitoituksesta, toleransseista ja suunnitelmista. IT-ihmisen paidat ovat omalla sivullaan ja kertovat koodista ja tuesta.",
      },
      {
        q: "Sopiiko insinööripaita valmistujaislahjaksi?",
        a: "Sopii. Personoitavaan paitaan voi painaa valmistumisvuoden tai erikoisalan, ja valmiit mallit sopivat sellaisenaan.",
      },
    ],
    tuotteet: [/insinööri/],
    mallit: [
      ["MITOITETTU", "VARMUUSKERTOIMELLA", "KAKSI."],
      ["INSINÖÖRI.", "PIIRSIN JO", "KAAVION TÄSTÄ."],
      ["EI SE OLE RIKKI.", "SE ON TOLERANSSIN", "SISÄLLÄ."],
      ["LASKIN SEN", "KAHDESTI.", "TULOS ON ERI."],
      ["SUUNNITELMA OK.", "TODELLISUUS", "EI HYVÄKSYNYT."],
    ],
    liittyvat: ["/ammatit", "/lahjat/it-ihmiselle", "/paidat/arkkitehti", "/paidat/sahkomies", "/ammattipaidat"],
    lisalinkit: [{ href: "/yritykset/insinoorit", label: "Tiimipaidat insinööritoimistolle" }],
    personoitu: {
      teksti: "Kirjoita paitaan insinöörin nimi, erikoisala tai työvuodet. Ehdotus on valmiina, ja tekstiä voi muokata tuotesivulla.",
      href: alallaVuotta("Insinööri, alalla 15 vuotta"),
      label: "Alalla X vuotta: Insinööri",
    },
  },
  {
    slug: "poliisi",
    nimi: "Poliisin paidat",
    ryhma: "ammatti",
    kohde: "poliisille",
    otsikko: "Lahja poliisille: hauskat paidat",
    kuvaus: "Hauska lahja poliisille vapaa-ajalle: paidat ja hupparit raporteista, peruutuspeilistä ja koirasta, joka ei tunnustanut.",
    h1: "Hauskat paidat ja lahjat poliisille",
    intro: [
      "Lahja poliisille on vapaa-ajan paita, jonka vitsi syntyy virkavuosista: Kuulustelin jo koiran. Se ei tunnustanut ja Raportti on kirjoitettu. Kahvi ei vielä.",
      "Sivulla on viisi uutta mallia t-paitana ja hupparina sekä aiemmat Poliisi vapaalla. Näen silti kaiken ja Lain käsi myös kahvitunnilla. Mallit ovat selvästi huumoria eivätkä muistuta virka-asua.",
    ],
    opas: [
      {
        otsikko: "Kun ammatti ei jää työpaikalle",
        teksti: [
          "Poliisin perhe tietää, ettei ammattitaito sammu vuoron päättyessä. Kauppareissulla katse käy kentän reunoilla, ravintolassa istutaan selkä seinää vasten ja ruokapöydässä kuulustellaan, kuka söi viimeisen makkaran. Kotikoira on päivän pääepäilty, eikä se tunnusta mitään.",
          "Uudet mallit kertovat juuri tästä. Vapaapäivänäkin tarkistan peruutuspeilin sopii jokaiselle, joka ajaa lomalla kuin partiossa. Minulla on oikeus pysyä hiljaa. Käytän sitä on lahja harvasanaiselle konstaapelille, ja Huomasin sen. En sano mitään. Vielä kertoo katseesta, josta lapset tietävät, että jotain on tapahtunut.",
        ],
      },
      {
        otsikko: "Valmistuminen, ylennys ja viimeinen vuoro",
        teksti: [
          "Poliisiksi valmistuva saa paidasta muiston koulutuksen päättymisestä, ja pitkän uran tehneelle se on hauska lahja viimeisen vuoron jälkeiseen kahvitilaisuuteen. Paita sopii myös syntymäpäivälle ja yksikön pikkujouluihin, joissa sisäpiirin vitsit naurattavat koko vuoroa.",
          "Paidat on tarkoitettu vapaa-ajalle. Niissä ei ole tunnuksia, arvomerkkejä eikä mitään, mikä näyttäisi viralliselta asulta, ja juuri siksi niitä voi käyttää huoletta mökillä ja kaupassa.",
        ],
      },
      {
        otsikko: "Perheen ja kollegoiden lahja",
        teksti: [
          "Moni poliisin puoliso tai lapsi etsii lahjaa, joka kertoo ammatista ilman virka-asun vakavuutta. Kuulustelin jo koiran. Se ei tunnustanut naurattaa myös niitä, jotka eivät ole koskaan istuneet partioautossa. Kollegat valitsevat usein raporttipaidan, koska kirjaaminen on se osa vuoroa, josta ei kerrota televisiosarjoissa. Huppari on lämmin valinta talviselle koiralenkille ja mökin laiturille.",
          "Eläkkeelle jäävän konstaapelin läksiäisissä paita on muisto pitkästä urasta ilman puheita, joita kukaan ei halua pitää. Minulla on oikeus pysyä hiljaa. Käytän sitä sopii myös siihen hetkeen, kun juhlakalu pyydetään lavalle ja hän vastaa vain nyökkäämällä.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja poliisille?",
        a: "Vapaa-ajan paita tai huppari virkavuosien vitsillä, esimerkiksi Kuulustelin jo koiran. Se ei tunnustanut tai Raportti on kirjoitettu. Kahvi ei vielä.",
      },
      {
        q: "Onko paidoissa poliisin tunnuksia?",
        a: "Ei ole. Paidat ovat selvästi huumoria, eikä niissä ole virallisia tunnuksia tai virka-asuun viittaavia merkkejä.",
      },
      {
        q: "Voiko paitaan painaa poliisin nimen?",
        a: "Voi. Personoitavaan työsankari-paitaan kirjoitat nimen ja oman tekstin, ehdotus on valmiina linkissä.",
      },
    ],
    tuotteet: [/poliisi/],
    mallit: [
      ["KUULUSTELIN JO", "KOIRAN.", "SE EI TUNNUSTANUT."],
      ["RAPORTTI ON", "KIRJOITETTU.", "KAHVI EI VIELÄ."],
      ["VAPAAPÄIVÄNÄKIN", "TARKISTAN", "PERUUTUSPEILIN."],
      ["MINULLA ON", "OIKEUS PYSYÄ HILJAA.", "KÄYTÄN SITÄ."],
      ["HUOMASIN SEN.", "EN SANO MITÄÄN.", "VIELÄ."],
    ],
    liittyvat: ["/ammatit", "/paidat/palomies", "/paidat/ensihoitaja", "/paidat/juristi", "/ammattipaidat"],
    personoitu: {
      teksti: "Kirjoita työsankari-paitaan poliisin nimi ja oma terveinen. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: tyosankari("Konstaapeli Virtanen, legendaarinen työsankari"),
      label: "Työsankari: poliisin nimellä",
    },
  },
  {
    slug: "palomies",
    nimi: "Palomiehen paidat",
    ryhma: "ammatti",
    kohde: "palomiehelle",
    otsikko: "Lahja palomiehelle: hauskat paidat",
    kuvaus: "Hauska lahja palomiehelle: paidat ja hupparit hälytyksestä kesken ruoan, kiukaasta ja kotona testatuista palovaroittimista.",
    h1: "Hauskat paidat ja lahjat palomiehelle",
    intro: [
      "Lahja palomiehelle on paita, jonka asemalla ymmärtää heti: Hälytys tuli kesken ruokaa. Taas ja Kotona minä testaan palovaroittimet.",
      "Sivulla on viisi uutta mallia, jokainen t-paitana ja hupparina, sekä aiemmat Palomies. Kuumat paikat ovat minun ja Sankari savussa. Sopivat myös sopimuspalokuntalaiselle ja VPK:n jäsenelle.",
    ],
    opas: [
      {
        otsikko: "Aseman arki hälytysten välissä",
        teksti: [
          "Paloaseman päivä ei ole pelkkiä hälytyksiä. Kalustoa huolletaan, letkuja rullataan ja harjoitellaan, ja keittiössä valmistuu ruoka, joka jää yhtä usein kesken. Kun kello soi, lautaset jäävät pöydälle ja kahvi jäähtyy. Palatessa joku on aina syönyt jälkiruoan.",
          "Siitä syntyi malli Hälytys tuli kesken ruokaa. Taas. Letku rullalla. Elämä ei aina on paita palomiehelle, jonka kalusto on järjestyksessä silloinkin, kun kotona on remontti kesken. Saunan kiuas on minulle työkokemusta sopii lauantaisaunaan, ja Palomies. Kahvi on kuumaa vain hetken kertoo aseman kahvinkeitosta enemmän kuin pitkä selitys.",
        ],
      },
      {
        otsikko: "Palokunnan pikkujouluihin ja syntymäpäiville",
        teksti: [
          "Paita on hauska lahja nuorelle palomiehelle, joka on juuri valmistunut, ja kokeneelle konkarille eläkejuhliin. VPK:n ja sopimuspalokunnan väki tunnistaa samat tilanteet: hälytys tulee aina perhejuhlan keskelle, ja koko suku tietää, kuka nousee pöydästä.",
          "Kotona palomies on se, joka tarkistaa palovaroittimen paristot ennen kuin kukaan muu muistaa niitä. Kotona minä testaan palovaroittimet on paita juuri hänelle.",
        ],
      },
      {
        otsikko: "Paita aseman koko porukalle",
        teksti: [
          "Kun asemalla on monta vuoroa, yhteinen paita on helppo tapa näyttää samaa joukkuetta myös vapaa-ajalla. Yksi valitsee kiuasvitsin, toinen palovaroitinpaidan ja kolmas paidan kahvista, joka ehtii jäähtyä ennen ensimmäistä kulausta. Personoitavaan työsankari-paitaan voi kirjoittaa palomiehen nimen ja aseman tervehdyksen. Huppari kulkee harjoituksiin ja kalustohuoltoon, t-paita kesän palokuntaleirille.",
          "Lasten silmissä palomies on sankari, ja kotona hän on se, joka tarkistaa sammuttimen paineen ennen juhannusta. Paita sopii myös isälle, joka on ollut palokunnassa nuoruudestaan asti ja kertoo joka joulu saman tarinan ensimmäisestä hälytyksestään.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja palomiehelle?",
        a: "T-paita tai huppari aseman arjesta, esimerkiksi Hälytys tuli kesken ruokaa. Taas tai Saunan kiuas on minulle työkokemusta.",
      },
      {
        q: "Sopivatko paidat VPK:n jäsenelle?",
        a: "Sopivat. Vitsit kertovat hälytyksistä, kalustosta ja aseman kahvista, jotka ovat tuttuja myös sopimuspalokunnissa.",
      },
      {
        q: "Voiko palomiehen paitaan painaa nimen?",
        a: "Voi. Personoitavaan työsankari-paitaan kirjoitat nimen ja oman tekstin tuotesivulla.",
      },
    ],
    tuotteet: [/palomie/],
    mallit: [
      ["HÄLYTYS TULI", "KESKEN RUOKAA.", "TAAS."],
      ["LETKU RULLALLA.", "ELÄMÄ EI AINA."],
      ["SAUNAN KIUAS", "ON MINULLE", "TYÖKOKEMUSTA."],
      ["PALOMIES.", "KAHVI ON KUUMAA", "VAIN HETKEN."],
      ["KOTONA MINÄ", "TESTAAN", "PALOVAROITTIMET."],
    ],
    liittyvat: ["/ammatit", "/paidat/poliisi", "/paidat/ensihoitaja", "/sauna", "/ammattipaidat"],
    lisalinkit: [{ href: "/yritykset/vpk", label: "Paidat VPK:lle ja palokunnalle" }],
    personoitu: {
      teksti: "Kirjoita työsankari-paitaan palomiehen nimi ja aseman terveiset. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: tyosankari("Palomies Mikko, legendaarinen työsankari"),
      label: "Työsankari: palomiehen nimellä",
    },
  },
  {
    slug: "kokki",
    nimi: "Kokin paidat",
    ryhma: "ammatti",
    kohde: "kokille",
    otsikko: "Kokki paita: hauskat lahjat kokille",
    kuvaus: "Hauskat kokin paidat ja hupparit: kuumaa takana myös kotona, resepti on suositus ja muut keittiön vitsit. Lahja kokille.",
    h1: "Kokin paidat ja hauskat lahjat kokille",
    intro: [
      "Kokki paita on lahja ammattilaiselle, joka sanoo kotikeittiössäkin Kuumaa takana ja jolle Resepti on suositus.",
      "Uusia kokin malleja on viisi, jokainen t-paitana ja hupparina. Sivulla ovat myös aiemmat Kokki. Maistan vain varmuuden vuoksi ja Keittiö on valtakuntani.",
    ],
    opas: [
      {
        otsikko: "Keittiön kieli ja kiire",
        teksti: [
          "Ravintolakeittiössä puhutaan lyhyesti. Tilaus tulee sisään, passiin huudetaan ja selän takana kulkeva kollega ilmoittaa itsestään sanomalla kuumaa takana. Tapa tarttuu niin, että kokki sanoo saman kotona kantaessaan kattilaa olohuoneen ohi. Vuoron jälkeen omaksi ateriaksi riittää leipä, joka syödään seisten tiskipöydän vieressä.",
          "Uudet mallit kertovat tästä arjesta. Kuumaa takana. Myös kotona on paita kokille, jonka perhe on oppinut väistämään. Tilaus sisään. Hermot ulos. Annos kauniina tiivistää lauantai-illan ruuhkan. Kokki. Kotona syön leipää seisten kertoo vuoron lopusta, ja Veitsi on terävä. Huumori myös sopii keittiöön, jossa vitsit lentävät yhtä nopeasti kuin annokset.",
        ],
      },
      {
        otsikko: "Kokkikoulusta keittiöpäälliköksi",
        teksti: [
          "Paita on hauska valmistujaislahja kokkiopiskelijalle ja kiitos keittiöpäällikölle, joka on pitänyt tiimin kasassa koko joulusesongin. Se sopii myös ravintolan pikkujouluihin, jotka keittiöväki viettää usein vasta tammikuussa, kun muut ovat jo juhlineet.",
          "Kotikokki, joka ei noudata reseptiä grammalleen, tunnistaa itsensä paidasta Resepti on suositus. Linkeistä löydät leipurin ja muiden ammattien paidat.",
        ],
      },
      {
        otsikko: "Lahja koko keittiötiimille",
        teksti: [
          "Keittiössä jokaisella on oma roolinsa: joku pitää passin järjestyksessä, toinen leipoo leivät aamuyöllä ja kolmas tiskaa vuoron lopussa vielä kaksi kattilaa. Yhteiset paidat ovat hauska tapa kiittää porukkaa raskaan sesongin jälkeen. Huppari sopii kylmiöön ja takapihan raittiiseen ilmaan, t-paita kesäterassille ja grillijuhliin, joissa kokki ei suostu olemaan vieras.",
          "Kokin perheelle paita on tapa sanoa kiitos kaikista juhlista, joissa hän seisoi hellan ääressä, vaikka oli kutsuttu vieraaksi. Ensi kerralla hän voi pukea paidan ja ilmoittaa ystävällisesti, että keittiö on tänään kiinni ja ruoka tilataan.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja kokille?",
        a: "Paita tai huppari keittiön vitsillä, esimerkiksi Kuumaa takana. Myös kotona tai Tilaus sisään. Hermot ulos. Annos kauniina.",
      },
      {
        q: "Sopiiko kokin paita kotikokille?",
        a: "Sopii. Resepti on suositus ja Veitsi on terävä. Huumori myös osuvat myös kotikeittiön harrastajaan.",
      },
      {
        q: "Voiko kokin paitaan painaa ravintolan nimen?",
        a: "Voi. Personoitavaan työsankari-paitaan kirjoitat nimen ja oman tekstin, esimerkiksi keittiön nimen.",
      },
    ],
    tuotteet: [/kokille/, /kokki\./],
    mallit: [
      ["KUUMAA TAKANA.", "MYÖS KOTONA."],
      ["TILAUS SISÄÄN.", "HERMOT ULOS.", "ANNOS KAUNIINA."],
      ["KOKKI.", "KOTONA SYÖN", "LEIPÄÄ SEISTEN."],
      ["VEITSI ON TERÄVÄ.", "HUUMORI MYÖS."],
      ["RESEPTI ON", "SUOSITUS."],
    ],
    liittyvat: ["/ammatit", "/paidat/kahvinjuoja", "/paidat/yrittaja", "/lahjat/tyokaverille", "/ammattipaidat"],
    lisalinkit: [{ href: "/yritykset/tapahtumat", label: "Paidat tapahtumiin ja ravintolatiimille" }],
    personoitu: {
      teksti: "Kirjoita työsankari-paitaan kokin nimi tai keittiön oma terveinen. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: tyosankari("Keittiön Kalle, legendaarinen työsankari"),
      label: "Työsankari: kokin nimellä",
    },
  },
  {
    slug: "kampaaja",
    nimi: "Kampaajan paidat",
    ryhma: "ammatti",
    kohde: "kampaajalle",
    otsikko: "Lahja kampaajalle ja parturille",
    kuvaus: "Hauska lahja kampaajalle ja parturille: paidat ja hupparit latvoista, sakseista ja omista hiuksista, jotka odottavat vuoroaan.",
    h1: "Hauskat paidat kampaajalle ja parturille",
    intro: [
      "Lahja kampaajalle naurattaa, kun vitsi tulee tuolin vierestä: Vain latvat? Tiedän, tiedän ja Kampaaja. Kuulen kaiken. En kerro mitään.",
      "Sivulla on viisi uutta mallia parturi-kampaajalle t-paitana ja hupparina sekä aiempi Leikkaa myös tukkaa -paita parturille.",
    ],
    opas: [
      {
        otsikko: "Tuolissa kerrotaan kaikki",
        teksti: [
          "Kampaamossa puhutaan asioista, joita ei kerrota edes läheisimmälle ystävälle. Asiakas istuu tuoliin, peili on edessä ja tunnin aikana käydään läpi lomat, remontit ja anopin syntymäpäivät. Kampaaja kuuntelee, nyökkää ja pitää kaiken omana tietonaan. Siksi Kampaaja. Kuulen kaiken. En kerro mitään on luottamuksen paita.",
          "Sakset kädessä. Terapia samaan hintaan kertoo saman asian toisin päin. Hiuspäivä huono? Minä hoidan sopii kampaajalle, joka korjaa itse leikatun otsatukan ilman ainuttakaan kommenttia. Vain latvat? Tiedän, tiedän on vastaus pyyntöön, jonka jokainen alan ihminen on kuullut kymmeniä kertoja.",
        ],
      },
      {
        otsikko: "Oman liikkeen avajaisiin ja kollegan synttäreille",
        teksti: [
          "Paita on hauska lahja vastavalmistuneelle parturi-kampaajalle, liikkeen avaavalle yrittäjälle ja kollegalle, jonka kanssa on jaettu sama takahuone vuosia. Se sopii myös kampaamon pikkujouluihin ja kanta-asiakkaan kiitokseksi.",
          "Omat hiukset odottavat vielä vuoroaan on paita kampaajalle, jonka oma tukka jää aina viimeiseksi, koska kalenteri on täynnä. Kauneusalan muut paidat ja tiimipaidat löydät alla olevista linkeistä.",
        ],
      },
      {
        otsikko: "Vinkki lahjan antajalle",
        teksti: [
          "Jos et tiedä, mikä vitsi osuu, mieti, mitä kampaaja sanoo useimmin. Jos hän kuuntelee, valitse Kuulen kaiken. Jos hän korjaa muiden kotikokeiluja, valitse Hiuspäivä huono? Minä hoidan. Jos hänen oma tukkansa on aina viimeisenä vuorossa, valinta on selvä. Huppari sopii kylmään aamuun ennen liikkeen avaamista, ja t-paita kulkee messuilla ja koulutuspäivillä.",
          "Moni kanta-asiakas haluaa kiittää kampaajaa vuosien hiustenleikkuista, värjäyksistä ja kuunnelluista tarinoista. Paita on henkilökohtaisempi kuin kukkakimppu ja kestää käytössä pidempään kuin suklaarasia, joka katoaa kahvihuoneessa ennen iltapäivän ensimmäistä asiakasta.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja kampaajalle?",
        a: "Paita tai huppari kampaamon vitsillä, esimerkiksi Vain latvat? Tiedän, tiedän tai Sakset kädessä. Terapia samaan hintaan.",
      },
      {
        q: "Sopivatko paidat myös parturille?",
        a: "Sopivat. Mallit on kirjoitettu parturi-kampaajalle, ja sivulla on myös aiempi parturin paita Leikkaa myös tukkaa.",
      },
      {
        q: "Voiko kampaajan paitaan painaa liikkeen nimen?",
        a: "Voi. Personoitavaan paitaan kirjoitat oman tekstin, ja kauneusalan tiimipaidat löytyvät yrityksille tarkoitetulta sivulta.",
      },
    ],
    tuotteet: [/parturi/, /kampaaja/],
    mallit: [
      ["VAIN LATVAT?", "TIEDÄN, TIEDÄN."],
      ["KAMPAAJA.", "KUULEN KAIKEN.", "EN KERRO MITÄÄN."],
      ["HIUSPÄIVÄ HUONO?", "MINÄ HOIDAN."],
      ["SAKSET KÄDESSÄ.", "TERAPIA", "SAMAAN HINTAAN."],
      ["OMAT HIUKSET", "ODOTTAVAT", "VIELÄ VUOROAAN."],
    ],
    liittyvat: ["/ammatit", "/paidat/yrittaja", "/hauskat-lahjat-naiselle", "/lahjat/tyokaverille", "/ammattipaidat"],
    lisalinkit: [{ href: "/yritykset/kauneus", label: "Tiimipaidat kauneusalalle" }],
    personoitu: {
      teksti: "Kirjoita paitaan kampaajan nimi ja vuodet alalla. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: alallaVuotta("Kampaaja, alalla 10 vuotta"),
      label: "Alalla X vuotta: Kampaaja",
    },
  },
  {
    slug: "siivooja",
    nimi: "Siivoojan paidat",
    ryhma: "ammatti",
    kohde: "siivoojalle",
    otsikko: "Lahja siivoojalle: hauskat paidat",
    kuvaus: "Hauska lahja siivoojalle ja laitoshuoltajalle: paidat ja hupparit mikrokuidusta, mopista ja kahvihuoneen tiskeistä.",
    h1: "Hauskat paidat ja lahjat siivoojalle",
    intro: [
      "Lahja siivoojalle kertoo, että työ on huomattu: paita, jossa lukee Siivooja. Näen pölyn, jota et näe tai Mikrokuitu on minun supervoimani.",
      "Sivulla on viisi uutta mallia siivoojalle ja laitoshuoltajalle, jokainen t-paitana ja hupparina, sekä aiempi Puhtaus on puoli elämää.",
    ],
    opas: [
      {
        otsikko: "Näkymätön työ näkyy paidassa",
        teksti: [
          "Hyvin tehty siivous on sellaista, ettei kukaan huomaa sitä. Toimisto on aamulla valmis, käytävä kiiltää ja roskakorit ovat tyhjiä, mutta harva tietää, kuka työn teki ennen kahdeksaa. Jälkeni on näkymätön. Se on tarkoitus kertoo ammattiylpeydestä, joka ei tarvitse kehuja.",
          "Kahvihuoneen tiskit eivät pese itseään on ystävällinen muistutus koko työpaikalle. Moppi vauhdissa. Älä astu tähän sopii aamuvuoroon, jolloin käytävällä kulkee aina joku liian aikaisin. Mikrokuitu on minun supervoimani on paita ammattilaiselle, joka tietää, mitä liina tekee, kun sitä käyttää oikein.",
        ],
      },
      {
        otsikko: "Kiitos siivoojalle ja laitoshuoltajalle",
        teksti: [
          "Monella työpaikalla siivooja on se ihminen, joka tuntee talon kuin omat taskunsa ja tietää, missä avaimet ovat. Paita on lämmin tapa kiittää häntä syntymäpäivänä, eläkkeelle jäädessä tai pikkujouluissa. Sama paita sopii kotisiivouksen ammattilaiselle, jonka asiakkaat haluavat sanoa kiitos huumorilla.",
          "Huppari on mukava aamuvuoroon ja ulkoportaille, t-paita kesän suursiivoukseen. Personoitavaan paitaan voit kirjoittaa nimen ja vuodet, jos haluat lahjasta henkilökohtaisen.",
        ],
      },
      {
        otsikko: "Paidat koko siivoustiimille",
        teksti: [
          "Siivousalan tiimeissä kulkee oma huumori, joka syntyy aamuvarhaisista vuoroista ja tyhjistä käytävistä. Yhteiset paidat ovat hauska tapa näyttää, että samassa porukassa ollaan myös työn ulkopuolella. Yksi valitsee mikrokuitupaidan, toinen mopin ja kolmas kahvihuoneen tiskit, jotka eivät koskaan pese itseään. Sama vitsi naurattaa myös toimiston väkeä, joka käy kahvilla ja jättää kupin altaaseen.",
          "Eläkkeelle jäävälle laitoshuoltajalle paita on muisto vuosista, joina hän näki talon jokaisen nurkan ennen muita. Läksiäisissä se ojennetaan kortin kanssa, johon koko henkilökunta kirjoittaa kiitoksen puhtaista lattioista ja aamun ensimmäisestä hymystä.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja siivoojalle?",
        a: "Paita tai huppari siivoojan vitsillä, esimerkiksi Siivooja. Näen pölyn, jota et näe tai Moppi vauhdissa. Älä astu tähän.",
      },
      {
        q: "Sopiiko paita laitoshuoltajalle?",
        a: "Sopii. Vitsit kertovat siivoustyön arjesta, joka on sama toimistossa, sairaalassa ja koulussa.",
      },
      {
        q: "Voiko siivoojan paitaan painaa nimen?",
        a: "Voi. Personoitavaan työsankari-paitaan kirjoitat nimen ja oman kiitoksen tuotesivulla.",
      },
    ],
    tuotteet: [/siivoojalle/],
    mallit: [
      ["SIIVOOJA.", "NÄEN PÖLYN,", "JOTA ET NÄE."],
      ["MIKROKUITU", "ON MINUN", "SUPERVOIMANI."],
      ["KAHVIHUONEEN", "TISKIT", "EIVÄT PESE ITSEÄÄN."],
      ["JÄLKENI ON", "NÄKYMÄTÖN.", "SE ON TARKOITUS."],
      ["MOPPI VAUHDISSA.", "ÄLÄ ASTU TÄHÄN."],
    ],
    liittyvat: ["/ammatit", "/paidat/lahihoitaja", "/lahjat/tyokaverille", "/elakelahjat", "/ammattipaidat"],
    personoitu: {
      teksti: "Kirjoita työsankari-paitaan siivoojan nimi ja työpaikan kiitos. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: tyosankari("Talon Tarja, legendaarinen työsankari"),
      label: "Työsankari: siivoojan nimellä",
    },
  },
  {
    slug: "yrittaja",
    nimi: "Yrittäjän paidat",
    ryhma: "ammatti",
    kohde: "yrittäjälle",
    otsikko: "Lahja yrittäjälle: hauskat paidat",
    kuvaus: "Hauska lahja yrittäjälle: paidat ja hupparit laskutettavista tunneista, lomasta sähköpostin ääressä ja Y-tunnuksesta.",
    h1: "Hauskat paidat ja lahjat yrittäjälle",
    intro: [
      "Lahja yrittäjälle on paita, joka kertoo työnkuvan rehellisesti: Toimitusjohtaja. Myös siivooja ja Y-tunnus on minun toinen nimeni.",
      "Sivulla on viisi uutta yrittäjän mallia, jokainen t-paitana ja hupparina. Ne sopivat toiminimen pitäjälle, perheyrityksen vetäjälle ja pienen firman koko porukalle.",
    ],
    opas: [
      {
        otsikko: "Kaikki tittelit samalla ihmisellä",
        teksti: [
          "Pienessä yrityksessä sama ihminen myy, laskuttaa, vastaa puhelimeen ja vie roskat. Käyntikortissa lukee toimitusjohtaja, mutta perjantai-iltana hän imuroi toimiston lattian. Toimitusjohtaja. Myös siivooja on paita juuri tälle ihmiselle.",
          "Lomalla. Vastaan silti sähköpostiin kertoo kesämökin laiturista, jolla puhelin on aina vieressä. Työpäivä alkaa, kun herään. Loppuu, kun nukun tiivistää yrittäjän työajan. Laskutettava tunti. Tämäkin keskustelu on paita konsultille ja freelancerille, joka laskee kahvitaukonsakin minuutteina. Y-tunnus on minun toinen nimeni sopii jokaiselle, joka on täyttänyt kaupparekisterin lomakkeet itse.",
        ],
      },
      {
        otsikko: "Avajaisiin, vuosipäivään ja tilikauden loppuun",
        teksti: [
          "Paita on hauska lahja yrityksen avajaisiin, firman vuosipäivään tai yrittäjän syntymäpäivälle. Moni antaa sen myös kiitoksena kirjanpitäjälle tai liikekumppanille, jonka kanssa on selvitty vaikeasta vuodesta. Kun koko tiimi tarvitsee yhteiset paidat, yrityksille on oma sivu tiimipaidoille.",
          "Huppari on lämmin valinta messuosastolle ja varastolle, t-paita kesän asiakastapahtumaan.",
        ],
      },
      {
        otsikko: "Lahja yrittäjäkollegalle ja perheelle",
        teksti: [
          "Yrittäjän perhe tietää, että lomalla puhelin kulkee taskussa ja illalla lasketaan laskuja keittiön pöydän ääressä. Paita on lämmin tapa sanoa, että työ on huomattu. Yrittäjäyhdistyksen tapaamisessa tai verkostoillassa sama vitsi avaa keskustelun nopeammin kuin käyntikortti. Kampaajan, kokin ja juristin paidat löydät linkeistä, jos yrittäjä tekee työtään jollakin näistä aloista. Huppari on myös kotitoimiston talviasu.",
          "Toiminimen perustaneelle ystävälle paita on hauska onnittelu ensimmäisestä laskusta. Se muistuttaa, että yrittäjänä saa nauraa myös arvonlisäveroilmoitukselle, kunhan se on lähetetty ajallaan. Pitkän linjan yrittäjälle sama paita on kiitos vuosikymmenistä, joina lomakin oli puoliksi työtä.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja yrittäjälle?",
        a: "Paita tai huppari yrittäjän arjesta, esimerkiksi Toimitusjohtaja. Myös siivooja tai Lomalla. Vastaan silti sähköpostiin.",
      },
      {
        q: "Mikä paita sopii konsultille tai freelancerille?",
        a: "Laskutettava tunti. Tämäkin keskustelu ja Työpäivä alkaa, kun herään. Loppuu, kun nukun.",
      },
      {
        q: "Voiko yrittäjän paitaan painaa firman nimen?",
        a: "Voi. Personoitavaan paitaan kirjoitat oman tekstin, ja yrityksille on erikseen tiimipaidat omalla logolla.",
      },
    ],
    tuotteet: [/yrittäjä/],
    mallit: [
      ["TOIMITUSJOHTAJA.", "MYÖS SIIVOOJA."],
      ["LOMALLA.", "VASTAAN SILTI", "SÄHKÖPOSTIIN."],
      ["TYÖPÄIVÄ ALKAA,", "KUN HERÄÄN.", "LOPPUU, KUN NUKUN."],
      ["LASKUTETTAVA TUNTI.", "TÄMÄKIN", "KESKUSTELU."],
      ["Y-TUNNUS", "ON MINUN", "TOINEN NIMENI."],
    ],
    liittyvat: ["/ammatit", "/lahjat/pomolle", "/paidat/kampaaja", "/paidat/juristi", "/ammattipaidat"],
    lisalinkit: [{ href: "/yritykset", label: "Tiimipaidat ja yritysten lahjat" }],
    personoitu: {
      teksti: "Kirjoita paitaan yrittäjän nimi ja vuodet yrittäjänä. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: alallaVuotta("Yrittäjä, alalla 10 vuotta"),
      label: "Alalla X vuotta: Yrittäjä",
    },
  },
  {
    slug: "arkkitehti",
    nimi: "Arkkitehdin paidat",
    ryhma: "ammatti",
    kohde: "arkkitehdille",
    otsikko: "Lahja arkkitehdille: hauskat paidat",
    kuvaus: "Hauska lahja arkkitehdille: paidat ja hupparit mittakaavasta, mustasta väristä ja seinästä, joka on konsepti.",
    h1: "Hauskat paidat ja lahjat arkkitehdille",
    intro: [
      "Lahja arkkitehdille on paita, jonka vitsi syntyy piirustuspöydän ääreltä: Tämä seinä on konsepti ja Mittakaava yksi sataan. Kahvi yksi yhteen.",
      "Arkkitehdille on viisi uutta mallia, jokainen t-paitana ja hupparina. Tummat paidat sopivat alan perinteeseen, ja Musta on väri. Muut ovat asiakkaan toiveita kertoo miksi.",
    ],
    opas: [
      {
        otsikko: "Valo, mittakaava ja musta paita",
        teksti: [
          "Arkkitehdin työssä yksi viiva voi tarkoittaa kuukausien keskustelua. Asiakas toivoo isoja ikkunoita ja pientä lämmityslaskua, rakennesuunnittelija kysyy, mitä seinää kannattaa, ja kaavoittaja muistuttaa räystäskorkeudesta. Arkkitehti piirtää, pyyhkii ja piirtää uudestaan, usein yöllä.",
          "Valo tulee etelästä. Ideat yöllä kuvaa tätä rytmiä. Tämä seinä on konsepti on vastaus kysymykseen, miksi seinässä ei ole ovea. Arkkitehti. Piirrän talon, en hyllyä on paita sille, jolta suku pyytää apua jokaiseen kirjahyllyyn ja terassiin. Mittakaava yksi sataan. Kahvi yksi yhteen kertoo luonnospöydän tärkeimmästä mittasuhteesta.",
        ],
      },
      {
        otsikko: "Diplomityöstä toimiston pikkujouluihin",
        teksti: [
          "Paita on hauska lahja arkkitehdiksi valmistuvalle diplomityön palautuksen jälkeen, kun pöydällä ei enää ole pienoismallia. Se sopii myös toimiston pikkujouluihin, kilpailuehdotuksen jättöpäivän juhlaan ja kollegan syntymäpäivälle.",
          "Insinöörin ja rakentajan paidat löydät linkeistä, jos lahjan saaja istuu samassa suunnittelupalaverissa eri puolella pöytää.",
        ],
      },
      {
        otsikko: "Lahja koko suunnittelutoimistolle",
        teksti: [
          "Arkkitehtitoimistossa jokaisella on oma suhteensa mustaan väriin, yöhön ja pienoismalleihin. Yhteiset paidat ovat hauska tapa juhlistaa voitettua kilpailua tai valmistunutta rakennusta. Yksi valitsee mittakaavan, toinen konseptiseinän ja kolmas paidan valosta, joka tulee etelästä. Huppari sopii työmaakäynnille ja kylmään ateljeehen, ja t-paita kulkee arkkitehtuurimatkalla, jolla katsotaan kymmenen rakennusta päivässä.",
          "Arkkitehdin ystävälle tai puolisolle paita on myös pieni kosto kaikista kerroista, kun yhteinen kävelyretki pysähtyi katsomaan räystäslinjaa tai porrashuoneen kaidetta. Nyt arkkitehti voi kertoa vitsin itse, ja muut voivat kerrankin nyökätä ymmärtäväisesti. Sama paita sopii myös sisustusarkkitehdille ja maisema-arkkitehdille, joiden piirustukset elävät yhtä monta kierrosta.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja arkkitehdille?",
        a: "Paita tai huppari suunnittelun vitsillä, esimerkiksi Tämä seinä on konsepti tai Arkkitehti. Piirrän talon, en hyllyä.",
      },
      {
        q: "Missä väreissä arkkitehdin paidat ovat?",
        a: "T-paidat ovat mustia, tummansinisiä, harmaita ja punaisia, hupparit mustia, tummansinisiä ja punaisia. Tummilla pohjilla teksti on valkoinen.",
      },
      {
        q: "Sopiiko paita arkkitehtiopiskelijalle?",
        a: "Sopii. Valo tulee etelästä. Ideat yöllä on tuttu jokaiselle, joka on valvonut luonnoskritiikkiä edeltävän yön.",
      },
    ],
    tuotteet: [/arkkiteh/],
    mallit: [
      ["ARKKITEHTI.", "PIIRRÄN TALON,", "EN HYLLYÄ."],
      ["MUSTA ON VÄRI.", "MUUT OVAT", "ASIAKKAAN TOIVEITA."],
      ["VALO TULEE", "ETELÄSTÄ.", "IDEAT YÖLLÄ."],
      ["MITTAKAAVA", "YKSI SATAAN.", "KAHVI YKSI YHTEEN."],
      ["TÄMÄ SEINÄ", "ON KONSEPTI."],
    ],
    liittyvat: ["/ammatit", "/paidat/insinoori", "/lahjat/remontoijalle", "/paidat/yrittaja", "/ammattipaidat"],
    personoitu: {
      teksti: "Kirjoita paitaan arkkitehdin nimi tai vuodet suunnittelupöydän ääressä. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: alallaVuotta("Arkkitehti, alalla 20 vuotta"),
      label: "Alalla X vuotta: Arkkitehti",
    },
  },
  {
    slug: "juristi",
    nimi: "Juristin paidat",
    ryhma: "ammatti",
    kohde: "juristille",
    otsikko: "Lahja juristille: hauskat paidat",
    kuvaus: "Hauska lahja juristille ja lakimiehelle: paidat ja hupparit pienestä präntistä, pykälistä ja vastauksesta riippuu tapauksesta.",
    h1: "Hauskat paidat ja lahjat juristille",
    intro: [
      "Lahja juristille on paita, jonka vastaus on tuttu jokaiselle lakimiehelle: Riippuu tapauksesta. Toinen uusi malli muistuttaa, että Luin pienen präntin. Sinä et.",
      "Juristille on viisi uutta mallia, jokainen t-paitana ja hupparina. Ne sopivat asianajajalle, yrityksen lakimiehelle, tuomarille ja oikeustieteen opiskelijalle.",
    ],
    opas: [
      {
        otsikko: "Pykälät, momentit ja varaukset",
        teksti: [
          "Juristin ammattitauti on tarkkuus. Kun ystävä kysyy illallisella, saako naapurin omenapuun oksan sahata, vastaus alkaa sanoilla riippuu tapauksesta ja jatkuu kymmenen minuuttia. Sopimukset luetaan loppuun asti, myös alaviitteet, ja jokaiseen myöntävään vastaukseen kuuluu pieni varaus.",
          "Siitä syntyi Juristi. Vastaus on kyllä, mutta. Pykälä kolme, momentti kahvi on paita lakiasiaintoimiston aamuun, jolloin ensimmäinen säädös koskee kahvinkeitintä. En sano mitään ilman kirjallista sopimusta sopii neuvottelijalle, joka ei lupaa suullisesti edes saunavuoroa. Luin pienen präntin. Sinä et on hyväntahtoinen muistutus kaikille, jotka hyväksyvät ehdot lukematta.",
        ],
      },
      {
        otsikko: "Oikeustieteen valmistujaisiin ja toimiston juhliin",
        teksti: [
          "Paita on hauska lahja varatuomariksi tai oikeustieteen maisteriksi valmistuvalle, kun pitkän opiskelun jälkeen on aika nauraa omalle alalle. Se sopii myös asianajotoimiston pikkujouluihin, kollegan syntymäpäiville ja eläkkeelle jäävän tuomarin läksiäisiin.",
          "Personoitavaan paitaan voit kirjoittaa juristin nimen ja vuodet alalla. Linkissä on valmiina ehdotus, jota voi muokata tuotesivulla.",
        ],
      },
      {
        otsikko: "Kun lahja on toimistolta",
        teksti: [
          "Asianajotoimistossa sama vitsi kulkee osakkaalta notaarille ja assistentille. Yhteinen paita on hauska tapa juhlistaa voitettua juttua, onnistunutta yrityskauppaa tai pitkän sopimusneuvottelun loppua. Pykälä kolme, momentti kahvi sopii jokaiselle, joka on aloittanut aamun laintulkinnalla ja jatkanut sitä lounaalle. Huppari lämmittää kotitoimistossa, kun lausunto valmistuu myöhään illalla, ja t-paita sopii kesän oikeustieteen tapahtumiin.",
          "Juristin ystävälle paita on keino lopettaa illallispöydän lakineuvonta hymyllä. Kun seuraava kysymys naapurin aidasta tai perinnönjaosta tulee, riittää osoittaa paitaa, jossa lukee riippuu tapauksesta, ja siirtyä jälkiruokaan. Asia hoituu kerralla ilman laskua.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja juristille?",
        a: "Paita tai huppari lakimiehen vitsillä, esimerkiksi Riippuu tapauksesta tai Luin pienen präntin. Sinä et.",
      },
      {
        q: "Sopiiko juristin paita oikeustieteen opiskelijalle?",
        a: "Sopii. Pykälä kolme, momentti kahvi on tuttu jokaiselle, joka on lukenut tenttiin lakikirjan kanssa.",
      },
      {
        q: "Voiko juristin paitaan painaa oman tekstin?",
        a: "Voi. Personoitavaan paitaan kirjoitat nimen, ammattinimikkeen tai vuodet alalla tuotesivulla.",
      },
    ],
    tuotteet: [/juristi/, /lakimie/],
    mallit: [
      ["RIIPPUU", "TAPAUKSESTA."],
      ["LUIN PIENEN", "PRÄNTIN.", "SINÄ ET."],
      ["JURISTI.", "VASTAUS ON KYLLÄ,", "MUTTA."],
      ["PYKÄLÄ KOLME,", "MOMENTTI", "KAHVI."],
      ["EN SANO MITÄÄN", "ILMAN KIRJALLISTA", "SOPIMUSTA."],
    ],
    liittyvat: ["/ammatit", "/paidat/poliisi", "/paidat/yrittaja", "/paidat/opettaja", "/elakelahjat", "/ammattipaidat"],
    personoitu: {
      teksti: "Kirjoita paitaan juristin nimi tai vuodet alalla. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: alallaVuotta("Juristi, alalla 15 vuotta"),
      label: "Alalla X vuotta: Juristi",
    },
  },
];
