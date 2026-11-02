/**
 * Ammattisivut, osa C: metsä, tie, korjaamo ja ilmailu sekä lemmikit, kahvi, puutarha ja pelit (/paidat/<slug>).
 * Muoto: ./tyypit.ts.
 */
import type { AmmattiSivuSisalto } from "./tyypit";

const alallaVuotta = (teksti: string) => `/tuote/personoitava-t-paita-alalla-x-vuotta?teksti=${encodeURIComponent(teksti)}`;
const harrastusmestari = (teksti: string) => `/tuote/personoitava-t-paita-harrastusmestari?teksti=${encodeURIComponent(teksti)}`;

export const SIVUT_C: AmmattiSivuSisalto[] = [
  {
    slug: "metsuri",
    nimi: "Metsurin paidat",
    ryhma: "ammatti",
    kohde: "metsurille",
    otsikko: "Metsurin paidat ja hupparit huumorilla",
    kuvaus: "Hauskat metsurin paidat ja hupparit: kuutiot, moottorisahan ääni ja taukokahvi kannon päällä. Lahja metsurille ja koneenkuljettajalle.",
    h1: "Metsurin paidat ja lahjat metsätyöläiselle",
    intro: [
      "Metsuri paita on t-paita tai huppari metsätyön huumorilla, ja sen vitsin tunnistaa jokainen, joka on seissyt marraskuun leimikolla märissä hanskoissa: Kaadoin puun. Puu ei valittanut ja Kuutiot ensin. Kahvi sitten.",
      "Sivulla on viisi uutta mallia metsurille t-paitoina ja huppareina. Mukana ovat myös metsänomistajan Puhun kuutioista ja Harvennus tehty. Kahvi ansaittu, jotka sopivat yhtä hyvin palstan omistajalle kuin sahan varressa seisovalle ammattilaiselle.",
    ],
    opas: [
      {
        otsikko: "Leimikon hiljainen huumori",
        teksti: [
          "Metsurin työpäivä alkaa pimeässä ja päättyy pimeässä, ja välissä puhutaan vähän. Siksi metsurin vitsi on lyhyt. Saha käy. En kuule sinuakaan on vastaus jokaiselle, joka yrittää kysyä jotain kuulosuojainten läpi. Toimistoni on metsässä. Tuoli on kanto kertoo, missä kahvitauko pidetään, kun lähin kahvila on neljänkymmenen kilometrin päässä.",
          "Tänään kaatui koivu, kuusi ja aikataulu sopii päivään, jona sade, routa tai rikkoutunut ketju sotki suunnitelman. Jokainen metsässä työskennellyt tietää, että puu kaatuu sinne, minne se itse haluaa, ja aikataulu samoin.",
          "Metsurin huumori on kuivaa kuin kesän tukkipino. Taukokopissa ei kerrota pitkiä tarinoita, mutta yksi lause kannon päältä riittää naurattamaan koko porukan. Kaadoin puun. Puu ei valittanut on juuri sellainen lause: lyhyt, rauhallinen ja täysin totta. Kuutiot ensin. Kahvi sitten taas muistuttaa järjestyksestä, jota jokainen urakoitsija noudattaa, vaikka termospullo kutsuu jo aamukymmeneltä.",
        ],
      },
      {
        otsikko: "Lahjaksi metsurille ja koneenkuljettajalle",
        teksti: [
          "Paita on hyvä lahja metsurille syntymäpäivänä, metsäalan opintojen päättyessä tai urakkakauden lopussa. Huppari lämmittää metsäkoneen hytissä aamuvuorossa ja mökin pihalla halkoja tehdessä. T-paita kulkee kesällä taimikonhoidossa ja vapaapäivinä.",
          "Lahja sopii myös isälle tai isoisälle, joka käy viikonloppuisin omalla palstallaan ja mittaa omaisuutensa mottimetreinä. Maanviljelijän ja metsänomistajan oma sivu sekä metsästäjän lahjasivu löytyvät alta, jos lahjan saaja liikkuu metsässä useammasta syystä.",
        ],
      },
      {
        otsikko: "Paita omalla tekstillä",
        teksti: [
          "Personoitavaan paitaan kirjoitat metsurin nimen ja vuodet alalla. Linkissä on valmiina Metsuri, alalla 25 vuotta, ja tekstiä voi muuttaa ennen tilausta.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja metsurille?",
        a: "T-paita tai huppari metsätyön vitsillä, esimerkiksi Kaadoin puun. Puu ei valittanut tai Toimistoni on metsässä. Tuoli on kanto.",
      },
      {
        q: "Sopiiko paita metsäkoneenkuljettajalle?",
        a: "Sopii. Kuutiot ensin. Kahvi sitten ja Tänään kaatui koivu, kuusi ja aikataulu kertovat koko metsäporukan arjesta.",
      },
      {
        q: "Voiko paitaa käyttää metsätöissä?",
        a: "Paita on vapaa-ajan vaate. Metsätöissä käytetään aina suojavaatteita, kypärää ja viiltosuojattuja housuja.",
      },
    ],
    tuotteet: [/harvennus tehty/, /metsänomistaja/],
    mallit: [
      ["KAADOIN PUUN.", "PUU EI", "VALITTANUT."],
      ["KUUTIOT ENSIN.", "KAHVI SITTEN."],
      ["TÄNÄÄN KAATUI", "KOIVU, KUUSI", "JA AIKATAULU."],
      ["SAHA KÄY.", "EN KUULE", "SINUAKAAN."],
      ["TOIMISTONI ON", "METSÄSSÄ.", "TUOLI ON KANTO."],
    ],
    liittyvat: ["/lahjat/maanviljelijalle", "/lahjat/metsastajalle", "/paidat/rekkakuski", "/paidat/mekaanikko", "/ammatit", "/ammattipaidat"],
    personoitu: {
      teksti: "Kirjoita paitaan metsurin nimi ja vuodet metsässä tai porukan oma sanonta. Ehdotus on valmiina tuotesivulla.",
      href: alallaVuotta("Metsuri, alalla 25 vuotta"),
      label: "Alalla X vuotta: Metsuri",
    },
  },
  {
    slug: "rekkakuski",
    nimi: "Rekkakuskin paidat",
    ryhma: "ammatti",
    kohde: "rekkakuskille",
    otsikko: "Rekkakuski paita ja kuljettajan huppari",
    kuvaus: "Hauskat rekkakuskin ja kuorma-autonkuljettajan paidat: ajopiirturi, huoltoaseman kahvi ja perävaunun peruutus. Lahja rekkakuskille.",
    h1: "Rekkakuskin paidat ja lahjat kuorma-autonkuljettajalle",
    intro: [
      "Rekkakuski paita on t-paita tai huppari kuorma-autonkuljettajan huumorilla: Ajopiirturi sanoi tauko. Minä sanoin kahvi ja Peruutan perävaunun paremmin kuin sinä auton. Vitsit syntyvät pitkistä öistä, ahtaista lastauslaitureista ja huoltoasemien tiskeiltä.",
      "Sivulla on viisi uutta mallia rekkakuskille sekä aiemmat Rekkakuski. Minun toimistoni liikkuu, Kuski. Ajan, koska muut eivät osaa ja linja-autonkuljettajan Kuljetan Suomen. Uudet mallit ovat saatavana t-paitoina ja huppareina.",
    ],
    opas: [
      {
        otsikko: "Tien päällä syntyvät vitsit",
        teksti: [
          "Kuljettajan viikko kulkee rahtikirjojen ja lepoaikojen tahdissa. Kotona käyn viikonloppuisin. Asun moottoritiellä on tuttu lause jokaiselle, joka on syönyt viikon lounaat tienvarsiravintolassa. Huoltoaseman kahvi. Minun dieselini sopii kuljettajalle, joka tuntee jokaisen reitin kahvinkeittimet nimeltä.",
          "Rahti perillä. Aikataulu oli toiveikas kertoo, miten lähettäjän lupaukset ja talvinen tie kohtaavat. Peruutuspaita on taas tervehdys kaikille, jotka ovat seuranneet henkilöauton parkkeerausta ja miettineet, miten kolmen metrin aukko voi olla niin vaikea.",
          "Kuljettajan huumori syntyy usein yksin hytissä, kun radio on hiljaa ja edessä on vielä neljäsataa kilometriä. Siksi vitsit ovat lyhyitä ja osuvia. Rekkakuski ei selitä, miksi lastauslaiturilla odotettiin kaksi tuntia, vaan toteaa asian ja kaataa termoksesta lisää kahvia. Paita tekee saman: se kertoo tilanteen yhdellä rivillä, ja jokainen ammattikuljettaja ymmärtää loput.",
        ],
      },
      {
        otsikko: "Kenelle rekkapaita sopii",
        teksti: [
          "Paita on lahja kuorma-autonkuljettajalle, puutavara-auton kuskille, jakeluauton kuljettajalle ja ajoneuvoyhdistelmän kortin juuri suorittaneelle. Se sopii syntymäpäivään, eläkejuhlan sijaan uran merkkipaaluun ja kuljetusliikkeen pikkujouluihin, joissa koko porukka tunnistaa vitsit.",
          "Huppari on lämmin valinta talviaamun lastaukseen ja hytin taukoon. Jos lahja menee korjaamolle tai metsään, mekaanikon ja metsurin sivut löytyvät alta. Autoharrastajan ja motoristin lahjat ovat omalla sivullaan.",
        ],
      },
      {
        otsikko: "Kuljettajan nimi paitaan",
        teksti: [
          "Personoitavaan paitaan voit kirjoittaa kuljettajan nimen ja ajetut vuodet. Linkissä on valmiina Rekkakuski, alalla 30 vuotta.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja rekkakuskille?",
        a: "T-paita tai huppari kuljettajan vitsillä, esimerkiksi Ajopiirturi sanoi tauko. Minä sanoin kahvi tai Rahti perillä. Aikataulu oli toiveikas.",
      },
      {
        q: "Onko linja-autonkuljettajalle oma paita?",
        a: "On. Kuljetan Suomen on linja-autonkuljettajan paita, ja Kuski. Ajan, koska muut eivät osaa sopii kaikille ammattikuljettajille.",
      },
      {
        q: "Sopiiko huppari hyttiin?",
        a: "Sopii. Huppari on pehmeä ja lämmin, ja sen taskuun mahtuvat avaimet ja rahtikirjan kynä.",
      },
    ],
    tuotteet: [/rekkakuski/, /kuskille/, /linja-autonkuljettaja/],
    mallit: [
      ["AJOPIIRTURI SANOI", "TAUKO.", "MINÄ SANOIN KAHVI."],
      ["PERUUTAN", "PERÄVAUNUN PAREMMIN", "KUIN SINÄ AUTON."],
      ["KOTONA KÄYN", "VIIKONLOPPUISIN.", "ASUN MOOTTORITIELLÄ."],
      ["HUOLTOASEMAN KAHVI.", "MINUN DIESELINI."],
      ["RAHTI PERILLÄ.", "AIKATAULU", "OLI TOIVEIKAS."],
    ],
    liittyvat: ["/paidat/mekaanikko", "/paidat/metsuri", "/lahjat/autoilijalle", "/ammatit", "/ammattipaidat"],
    personoitu: {
      teksti: "Kirjoita paitaan kuljettajan nimi, ajetut vuodet tai oman kuljetusliikkeen sisäpiirin vitsi. Ehdotus on valmiina tuotesivulla.",
      href: alallaVuotta("Rekkakuski, alalla 30 vuotta"),
      label: "Alalla X vuotta: Rekkakuski",
    },
  },
  {
    slug: "mekaanikko",
    nimi: "Mekaanikon paidat",
    ryhma: "ammatti",
    kohde: "mekaanikolle",
    otsikko: "Mekaanikko paita: hauskat korjaamopaidat",
    kuvaus: "Hauskat mekaanikon paidat ja hupparit: vikakoodi, ylimääräinen ruuvi ja asiakkaan kuulema outo ääni. Lahja automekaanikolle.",
    h1: "Mekaanikon paidat ja lahjat automekaanikolle",
    intro: [
      "Mekaanikko paita on korjaamon arjesta kertova t-paita tai huppari: Asiakkaan mukaan se piti ääntä. Nyt se ei pidä ja Yksi ruuvi jäi yli. Se on varaosa. Vitsit on tehty ammattilaiselle, joka kuulee vian ennen kuin asiakas ehtii kuvailla sitä.",
      "Sivulla on viisi uutta mallia mekaanikolle t-paitoina ja huppareina sekä tallin aiemmat paidat Öljynvaihto on terapiaa, Tallissa. Takaisin, kun se käy ja Vielä yksi osa. Sitten se käy. Autoharrastajan ja motoristin lahjat ovat omalla sivullaan, tämä sivu on korjaamon ammattilaiselle.",
    ],
    opas: [
      {
        otsikko: "Korjaamon tutut tilanteet",
        teksti: [
          "Asiakas tuo auton ja kertoo, että ääni kuuluu vain kuudenkymmenen kilometrin tuntinopeudessa vasemmalle kaartaessa, kun ulkona sataa. Nostimella auto on tietysti hiljaa. Vikakoodi löytyi. Syy ei kuvaa päivää, jona testeri antaa vastauksen mutta ei selitystä.",
          "Korjaan kaiken. Paitsi oman autoni on paita jokaiselle mekaanikolle, jonka oma auto seisoo pihalla odottamassa samaa osaa kolmatta kuukautta. Öljyä käsissä. Kahvia suonissa kertoo loput: korjaamolla työ etenee kahvikeittimen ja kompressorin tahdissa.",
          "Mekaanikon arkeen kuuluvat myös asiakkaat, jotka ovat katsoneet videon ja tietävät vian valmiiksi. He ovat väärässä useammin kuin oikeassa, mutta mekaanikko nyökkää kohteliaasti ja avaa konepellin. Paidan vitsi on tehty juuri tähän hetkeen: se on ystävällinen, mutta kertoo, kuka hallissa tuntee moottorin. Kollegat tunnistavat tilanteen heti, ja asiakaskin hymyilee lukiessaan sen.",
        ],
      },
      {
        otsikko: "Lahja korjaamolle ja valmistuvalle",
        teksti: [
          "Mekaanikon paita sopii lahjaksi ajoneuvoasentajaksi valmistuvalle, pitkän uran tehneelle konkarille ja korjaamon koko porukalle pikkujouluihin. Huppari on hyvä valinta kylmään halliin ja renkaanvaihtokauteen, jolloin ovet käyvät koko päivän.",
          "Raskaan kaluston mekaanikolle kannattaa katsoa myös rekkakuskin paidat, ja sähköpuolen asentajalle sähkömiehen sivu. Kaikki mallit ovat vapaa-ajan vaatteita, joten haalari pysyy töissä ja paita kotona.",
        ],
      },
      {
        otsikko: "Oma teksti mekaanikolle",
        teksti: [
          "Personoitavaan paitaan voit kirjoittaa mekaanikon nimen ja vuodet alalla. Linkissä on valmiina Mekaanikko, alalla 15 vuotta.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja mekaanikolle?",
        a: "T-paita tai huppari korjaamon vitsillä, esimerkiksi Vikakoodi löytyi. Syy ei tai Korjaan kaiken. Paitsi oman autoni.",
      },
      {
        q: "Mikä ero on mekaanikon ja autoilijan sivulla?",
        a: "Tämä sivu on korjaamon ammattilaiselle. Autoharrastajan ja motoristin paidat ovat sivulla lahjat autoilijalle.",
      },
      {
        q: "Sopiiko paita raskaan kaluston mekaanikolle?",
        a: "Sopii. Yksi ruuvi jäi yli. Se on varaosa ja Öljyä käsissä. Kahvia suonissa kuuluvat jokaiseen korjaamoon kaluston koosta riippumatta.",
      },
    ],
    tuotteet: [/öljynvaihto on terapiaa/, /tallissa/, /vielä yksi osa/],
    mallit: [
      ["ASIAKKAAN MUKAAN", "SE PITI ÄÄNTÄ.", "NYT SE EI PIDÄ."],
      ["YKSI RUUVI JÄI YLI.", "SE ON VARAOSA."],
      ["VIKAKOODI LÖYTYI.", "SYY EI."],
      ["KORJAAN KAIKEN.", "PAITSI OMAN", "AUTONI."],
      ["ÖLJYÄ KÄSISSÄ.", "KAHVIA SUONISSA."],
    ],
    liittyvat: ["/lahjat/autoilijalle", "/paidat/rekkakuski", "/paidat/sahkomies", "/ammatit", "/ammattipaidat"],
    personoitu: {
      teksti: "Kirjoita paitaan mekaanikon nimi, korjaamon nimi tai vuodet alalla. Ehdotus on valmiina tuotesivulla.",
      href: alallaVuotta("Mekaanikko, alalla 15 vuotta"),
      label: "Alalla X vuotta: Mekaanikko",
    },
  },
  {
    slug: "lentaja",
    nimi: "Lentäjän paidat",
    ryhma: "ammatti",
    kohde: "lentäjälle",
    otsikko: "Lentäjä paita ja lahja lentäjälle",
    kuvaus: "Hauskat lentäjän paidat ja hupparit: kapteenin kuulutus, sivutuuli ja tarkistuslista. Lahja lentäjälle ja harrastelentäjälle.",
    h1: "Lentäjän paidat ja lahjat lentäjälle",
    intro: [
      "Lahja lentäjälle on paita, joka puhuu ohjaamon kieltä: Täällä kapteeni. Kahvi on loppu ja Sivutuuli on vain mielipide. Vitsit on kirjoitettu liikennelentäjälle, harrastelentäjälle ja lentokoulun oppilaalle, joka laskee jo lentotunteja.",
      "Sivulla on viisi uutta lentäjän mallia, ja jokainen on saatavana t-paitana ja hupparina. Kaikki tekstit ovat suomeksi eivätkä sisällä lentoyhtiöiden tai konevalmistajien nimiä.",
    ],
    opas: [
      {
        otsikko: "Ohjaamon huumori",
        teksti: [
          "Lentäjien keskuudessa kiertää vanha sanonta: jokainen lasku, josta kävellään pois, on hyvä lasku. Se on nyt paidassa, ja se sopii yhtä hyvin pienkoneen ensimmäiseen yksinlentoon kuin pitkän uran viimeiseen laskeutumiseen. Tarkistuslista käyty. Kahvi kädessä kertoo, missä järjestyksessä asiat tehdään ennen lähtöä.",
          "Lentäjä. Puhun lentämisestä joka päivä on paita lentäjän perheelle tuttuun ilmiöön: jokainen illallinen päätyy lopulta puhumaan säärintamista ja laskeutumisnopeuksista. Sivutuuli on vain mielipide sopii lentäjälle, joka on laskeutunut puuskissa ja kertoo siitä nyt rauhallisena.",
          "Ilmailussa kaikki tehdään tarkasti, joten huumori syntyy pienistä asioista: kahvinkeittimestä, joka hajoaa juuri ennen pitkää lentoa, kuulutuksesta, jonka matkustajat kuulevat puoliksi, ja säätiedotuksesta, joka muuttuu kesken kaiken. Lentäjän paita ei naura turvallisuudelle. Se nauraa ihmisille, jotka rakastavat lentämistä niin paljon, että puhuvat siitä myös lomalla, saunassa ja sukujuhlissa.",
        ],
      },
      {
        otsikko: "Milloin lentäjälle annetaan lahja",
        teksti: [
          "Paita on hyvä lahja lupakirjan saaneelle, tyyppikoulutuksen läpäisseelle, ensimmäisen yksinlennon tehneelle ja lentokerhon jäsenelle syntymäpäivänä. Se sopii myös matkustamohenkilökunnalle ja lennonjohtajalle, jotka kuulevat kapteenin kuulutukset joka päivä.",
          "Huppari on mukava kerhon hallissa ja kentän laidalla odotellessa säätä. T-paita kulkee matkalaukussa yöpymiskohteeseen. Insinöörin ja rekkakuskin sivuilta löytyvät paidat muille kulkuneuvojen ammattilaisille. Kun lahja menee koko kerholle, sama malli eri väreissä tekee porukasta yhtenäisen kentän laidalla ja kerhoillassa.",
        ],
      },
      {
        otsikko: "Lentotunnit paitaan",
        teksti: [
          "Personoitavaan paitaan voit kirjoittaa lentäjän nimen, lentotunnit tai kerhon nimen. Linkissä on valmiina Lentäjä, alalla 10 vuotta.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja lentäjälle?",
        a: "T-paita tai huppari ohjaamon vitsillä, esimerkiksi Täällä kapteeni. Kahvi on loppu tai Jokainen lasku, josta kävellään pois, on hyvä lasku.",
      },
      {
        q: "Sopiiko paita harrastelentäjälle?",
        a: "Sopii. Tarkistuslista käyty. Kahvi kädessä ja Sivutuuli on vain mielipide kertovat lentämisestä koneen koosta riippumatta.",
      },
      {
        q: "Onko paidoissa lentoyhtiöiden logoja?",
        a: "Ei ole. Paidoissa on vain suomenkielinen tekstivitsi, ei yhtiöiden tai valmistajien nimiä.",
      },
    ],
    tuotteet: [],
    mallit: [
      ["TÄÄLLÄ KAPTEENI.", "KAHVI ON", "LOPPU."],
      ["JOKAINEN LASKU,", "JOSTA KÄVELLÄÄN POIS,", "ON HYVÄ LASKU."],
      ["SIVUTUULI", "ON VAIN MIELIPIDE."],
      ["LENTÄJÄ.", "PUHUN LENTÄMISESTÄ", "JOKA PÄIVÄ."],
      ["TARKISTUSLISTA KÄYTY.", "KAHVI KÄDESSÄ."],
    ],
    liittyvat: ["/paidat/insinoori", "/paidat/rekkakuski", "/ammatit", "/ammattipaidat", "/lahjat/harrastajalle"],
    personoitu: {
      teksti: "Kirjoita paitaan lentäjän nimi, lentotunnit tai lentokerhon nimi. Ehdotus on valmiina tuotesivulla.",
      href: alallaVuotta("Lentäjä, alalla 10 vuotta"),
      label: "Alalla X vuotta: Lentäjä",
    },
  },
  {
    slug: "kissaihminen",
    nimi: "Kissapaidat",
    ryhma: "harrastus",
    kohde: "kissaihmiselle",
    otsikko: "Lahja kissaihmiselle: hauskat kissapaidat",
    kuvaus: "Hauskat kissapaidat ja hupparit kissaihmiselle: kolmen aikaan herättävä kissa ja näppäimistöllä nukkuva kissa. Lahja kissanomistajalle.",
    h1: "Kissapaidat ja lahjat kissaihmiselle",
    intro: [
      "Lahja kissaihmiselle on paita, jonka vitsin ymmärtää jokainen, jonka sohvan mukavin kulma kuuluu kissalle: Kissa päätti. Minä tottelin ja Olen kissan henkilökuntaa. Kissan kanssa asuva tietää, kuka talossa tekee päätökset.",
      "Sivulla on viisi uutta kissamallia t-paitoina ja huppareina. Tekstit kertovat kissaihmisen arjesta lempeästi, eikä yksikään niistä naura kissalle. Ne nauravat ihmiselle, joka on hyväksynyt asemansa.",
    ],
    opas: [
      {
        otsikko: "Kissan kanssa eläneen arki",
        teksti: [
          "Kissaihminen herää ilman herätyskelloa, koska kissa on nälkäinen tasan kolmelta. Herätys kello kolme. Kissa oli nälkäinen on paita juuri siihen aamuun. Etätöitä tekevä tuntee myös näppäimistön, joka muuttuu kissan sängyksi heti, kun palaveri alkaa. Näppäimistö on kissan sänky. Teen töitä reunalla kertoo kompromissista, jonka jokainen kissan kanssa työskennellyt on tehnyt.",
          "En voi tulla. Kissa nukkuu sylissä on ainoa hyväksyttävä syy perua iltamenot, ja jokainen kissaihminen tietää sen. Paita säästää selittelyltä: kaverit lukevat vastauksen rinnasta.",
          "Kissaihmisen koti on järjestetty kissan ehdoilla. Lempituolissa nukkuu joku muu, pahvilaatikko on tärkeämpi kuin sen sisältämä lahja ja ruokakuppi pitää täyttää, vaikka siinä on vielä ruokaa. Kissa päätti. Minä tottelin tiivistää tämän kaiken kahteen lauseeseen. Paidan lukija hymyilee, kun hänellä on kissa, ja ymmärtää kaiken, kun kissoja on kaksi.",
        ],
      },
      {
        otsikko: "Kenelle kissapaita",
        teksti: [
          "Kissapaita on lahja ystävälle, joka on juuri hakenut löytökissan kotiin, siskolle, jonka puhelimen kuvagalleria on täynnä samaa kissaa, ja isovanhemmalle, jonka kissa istuu aina ikkunalaudalla vahdissa. Se sopii syntymäpäiviin, tupaantuliaisiin ja pikkujoulujen lahjapeliin.",
          "Huppari on pehmeä ja lämmin, ja kissa hyväksyy sen nopeasti omaksi alustakseen. Karvat näkyvät tummalla kankaalla, mutta kissaihminen pitää niitä koristeena. Kissa ja koira samassa taloudessa? Koiraihmisen paidat löytyvät alta.",
        ],
      },
      {
        otsikko: "Kissan nimi paitaan",
        teksti: [
          "Personoitavaan harrastusmestari-paitaan voit kirjoittaa oman tekstin, esimerkiksi kissan nimen ja tittelin. Linkissä on valmiina ehdotus, jota voit muokata.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja kissaihmiselle?",
        a: "T-paita tai huppari kissavitsillä, esimerkiksi Olen kissan henkilökuntaa tai Kissa päätti. Minä tottelin.",
      },
      {
        q: "Voiko paitaan painaa oman kissan nimen?",
        a: "Voi. Personoitavaan paitaan kirjoitat kissan nimen ja oman tekstin tuotesivulla.",
      },
      {
        q: "Onko kissaihmiselle muitakin lahjaideoita?",
        a: "Blogissa on oma opas hauskoista lahjoista kissaihmiselle, ja koiraihmisen paidat ovat omalla sivullaan.",
      },
    ],
    tuotteet: [],
    mallit: [
      ["KISSA PÄÄTTI.", "MINÄ TOTTELIN."],
      ["HERÄTYS KELLO KOLME.", "KISSA OLI", "NÄLKÄINEN."],
      ["OLEN KISSAN", "HENKILÖKUNTAA."],
      ["EN VOI TULLA.", "KISSA NUKKUU", "SYLISSÄ."],
      ["NÄPPÄIMISTÖ ON", "KISSAN SÄNKY.", "TEEN TÖITÄ REUNALLA."],
    ],
    liittyvat: ["/paidat/koiraihminen", "/paidat/kahvinjuoja", "/lahjat/harrastajalle", "/lahja-kaverille", "/hauskat-lahjat-naiselle"],
    lisalinkit: [{ href: "/blogi/hauskat-lahjat-kissaihmiselle", label: "Opas: hauskat lahjat kissaihmiselle" }],
    personoitu: {
      teksti: "Kirjoita paitaan kissan nimi ja titteli tai oma kissavitsi. Ehdotus on valmiina tuotesivulla.",
      href: harrastusmestari("Kissan henkilökuntaa: Mirri"),
      label: "Oma teksti: kissan henkilökuntaa",
    },
  },
  {
    slug: "koiraihminen",
    nimi: "Koirapaidat",
    ryhma: "harrastus",
    kohde: "koiraihmiselle",
    otsikko: "Lahja koiraihmiselle: hauskat koirapaidat",
    kuvaus: "Hauskat koirapaidat ja hupparit koiraihmiselle: aamulenkki vaakasateessa, karvat sohvalla ja herkut taskussa. Lahja koiranomistajalle.",
    h1: "Koirapaidat ja lahjat koiraihmiselle",
    intro: [
      "Hauska lahja koiraihmiselle on paita aamulenkin, karvaisen sohvan ja täyden herkkutaskun elämästä: Koira halusi ulos. Satoi vaakaan. Mentiin silti ja Karvat sohvalla ovat sisustusta.",
      "Sivulla on viisi uutta koiramallia t-paitoina ja huppareina sekä aiemmat koiranomistajan paidat, kuten Koira on perhettä, ihminen on lisä, ja personoitava paita koiran nimellä.",
    ],
    opas: [
      {
        otsikko: "Lenkkipolun totuudet",
        teksti: [
          "Koiraihmisen päivä rakentuu lenkkien ympärille. Sää ei ratkaise mitään, koska koira on jo ovella hihna suussa. Lenkillä taas. Koira on virkeä. Minä en on paita marraskuun aamuun, jolloin taskulamppu on ainoa valo ja koira löytää jokaisen lätäkön.",
          "Taskussa herkkuja. Aina kertoo totuuden jokaisesta koiraihmisen takista: kun käden laittaa taskuun, sieltä löytyy nameja, kakkapusseja ja kuitti viime viikolta. Koira on hyvä poika. Minä yritän on lempeä tunnustus siitä, kumpi perheessä on kasvatettu paremmin.",
          "Koiraihmiset tunnistavat toisensa kaukaa. Puistossa vaihdetaan kuulumiset koiran nimellä, mutta omistajan nimi jää usein kysymättä. Keskustelu kulkee rokotuksista ruokamerkkeihin ja siihen, miksi koira kieltäytyy menemästä ulos sateella, vaikka äsken halusi. Koirapaita on tähän seuraan sopiva tervehdys, ja lenkillä se aloittaa keskustelun vieraankin koiranomistajan kanssa.",
        ],
      },
      {
        otsikko: "Lahja koiran omistajalle",
        teksti: [
          "Koirapaita sopii lahjaksi pennun juuri saaneelle, agilityn tai näyttelyiden harrastajalle, metsästyskoiran omistajalle ja ystävälle, joka puhuu koirastaan kuin perheenjäsenestä. Se on hyvä lahja syntymäpäivään, tupaantuliaisiin ja koirakerhon pikkujouluihin.",
          "Huppari on lenkkien vaate: lämmin, väljä ja taskullinen, joten herkut kulkevat mukana. Karvat näkyvät, mutta koiraihminen ei siitä välitä. Kissaihmisen ja retkeilijän paidat löytyvät alta, ja blogissa on erillinen lahjaopas koiraihmiselle. Pennun kasvattajalle paita on myös hauska luovutuslahja uudelle perheelle, joka on vasta aloittamassa yhteisiä lenkkejä.",
        ],
      },
      {
        otsikko: "Koiran nimi paitaan",
        teksti: [
          "Personoitavaan koiranomistajan paitaan kirjoitat koiran nimen. Linkissä on valmiina esimerkki, jonka vaihdat oman koiran nimeen.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja koiraihmiselle?",
        a: "T-paita tai huppari koiravitsillä, esimerkiksi Karvat sohvalla ovat sisustusta tai Koira halusi ulos. Satoi vaakaan. Mentiin silti.",
      },
      {
        q: "Voiko paitaan painaa koiran nimen?",
        a: "Voi. Personoitavaan koiranomistajan paitaan kirjoitat koiran nimen tuotesivulla.",
      },
      {
        q: "Sopiiko huppari koiran ulkoiluttamiseen?",
        a: "Sopii. Huppari on lämmin ja väljä, ja sen etutaskuun mahtuvat herkut ja pussit.",
      },
    ],
    tuotteet: [/koiranomistaja/],
    mallit: [
      ["KOIRA HALUSI ULOS.", "SATOI VAAKAAN.", "MENTIIN SILTI."],
      ["KARVAT SOHVALLA", "OVAT SISUSTUSTA."],
      ["TASKUSSA", "HERKKUJA.", "AINA."],
      ["KOIRA ON", "HYVÄ POIKA.", "MINÄ YRITÄN."],
      ["LENKILLÄ TAAS.", "KOIRA ON VIRKEÄ.", "MINÄ EN."],
    ],
    liittyvat: ["/paidat/kissaihminen", "/paidat/retkeilija", "/paidat/juoksija", "/lahjat/harrastajalle", "/lahja-kaverille"],
    lisalinkit: [{ href: "/blogi/hauskat-lahjat-koiraihmiselle", label: "Opas: hauskat lahjat koiraihmiselle" }],
    personoitu: {
      teksti: "Kirjoita paitaan koiran nimi. Esimerkki on valmiina, ja vaihdat sen oman koiran nimeen tuotesivulla.",
      href: `/tuote/personoitava-t-paita-koiranomistajalle-koiran-nimi-herran-paras-ystava?teksti=${encodeURIComponent("Koiran nimi: Rekku")}`,
      label: "Koiran nimi paitaan",
    },
  },
  {
    slug: "hevosihminen",
    nimi: "Hevospaidat",
    ryhma: "harrastus",
    kohde: "hevosihmiselle",
    otsikko: "Lahja hevosihmiselle: hauskat tallipaidat",
    kuvaus: "Hauskat hevospaidat ja hupparit hevosihmiselle: tallivuoro, satulasta putoaminen ja hevonen, joka päätti toisin. Lahja ratsastajalle.",
    h1: "Hevospaidat ja lahjat hevosihmiselle",
    intro: [
      "Hauska lahja hevosihmiselle tai ratsastajalle on paita, joka tuoksuu tallille jo pelkän tekstin perusteella: Tallivuoro. Tuoksun siltä ja Hevonen päätti toisin. Vitsit tuntee jokainen, joka on viettänyt lauantain karsinaa siivoten.",
      "Sivulla on viisi uutta tallimallia, ja jokainen on saatavana t-paitana ja hupparina. Ne sopivat ratsastajalle, ravihevosen omistajalle ja talliyrittäjälle.",
    ],
    opas: [
      {
        otsikko: "Tallin kirjoittamattomat säännöt",
        teksti: [
          "Hevosihminen tietää, että tallille lähdetään hetkeksi ja palataan illalla. Tallilla asun. Kotona käyn vaihtamassa sukat kuvaa elämää, jossa kalenteri täyttyy ruokinnoista, kengityksistä ja valmennuksista. Hevonen on halvin harrastus. Sanoi ei kukaan on tervehdys jokaiselle, joka on laskenut rehulaskun ja eläinlääkärin käynnit samalle kuukaudelle.",
          "Hevonen päätti toisin sopii päivään, jona suunniteltu koulurata muuttui maastolenkiksi, koska hevonen näki muovipussin. Putosin satulasta. Nousin takaisin on ratsastajan sisun tiivistys: jokainen on pudonnut, ja jokainen on noussut uudelleen selkään.",
          "Tallilla puhutaan omaa kieltä, jota ulkopuolinen ei aina ymmärrä. Karsina, kavioura, loimi ja maastolenkki ovat hevosihmisen arkisanastoa, ja niiden takana on tuhansia tunteja ulkona sateessa, pakkasessa ja helteessä. Paidan vitsit tulevat tästä maailmasta. Ne ovat lempeitä, koska hevosihminen rakastaa eläintään, vaikka se on juuri kävellyt hänen varpailleen.",
        ],
      },
      {
        otsikko: "Lahjaksi tallille",
        teksti: [
          "Tallipaita on hyvä lahja ratsastusta aloittavalle lapselle tai aikuiselle, kilpailijalle ennen kauden avausta ja tallin työntekijälle kiitokseksi. Se sopii myös vanhemmalle, joka kuljettaa ratsastajaa tallille joka viikko ja tuntee heinän tuoksun autossaan.",
          "Huppari on tallin talvivaate: se on lämmin ruokinnalla ja mukava satulahuoneessa. T-paita sopii kesän maastoretkille ja kisapaikan katsomoon. Koiran ja kissan ystävien paidat löytyvät alta. Tallin koko porukalle sama paita on hauska yhteinen asu kisamatkalle tai tallin pikkujouluihin.",
        ],
      },
      {
        otsikko: "Hevosen nimi paitaan",
        teksti: [
          "Personoitavaan harrastusmestari-paitaan voit kirjoittaa hevosen nimen tai tallin nimen. Linkissä on valmiina ehdotus.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja hevosihmiselle?",
        a: "T-paita tai huppari tallivitsillä, esimerkiksi Tallilla asun. Kotona käyn vaihtamassa sukat tai Hevonen päätti toisin.",
      },
      {
        q: "Sopiiko paita ratsastajalle ja raviharrastajalle?",
        a: "Sopii. Tallivuoro. Tuoksun siltä ja Hevonen on halvin harrastus. Sanoi ei kukaan kuuluvat jokaiselle tallille lajista riippumatta.",
      },
      {
        q: "Voiko paitaan painaa hevosen nimen?",
        a: "Voi. Personoitavaan paitaan kirjoitat hevosen tai tallin nimen tuotesivulla.",
      },
    ],
    tuotteet: [],
    mallit: [
      ["HEVONEN ON", "HALVIN HARRASTUS.", "SANOI EI KUKAAN."],
      ["TALLIVUORO.", "TUOKSUN SILTÄ."],
      ["HEVONEN PÄÄTTI", "TOISIN."],
      ["TALLILLA ASUN.", "KOTONA KÄYN", "VAIHTAMASSA SUKAT."],
      ["PUTOSIN SATULASTA.", "NOUSIN TAKAISIN."],
    ],
    liittyvat: ["/paidat/koiraihminen", "/paidat/kissaihminen", "/lahjat/harrastajalle", "/hauskat-lahjat-naiselle", "/lahjat/siskolle"],
    personoitu: {
      teksti: "Kirjoita paitaan hevosen nimi, tallin nimi tai oma tallivitsi. Ehdotus on valmiina tuotesivulla.",
      href: harrastusmestari("Tallimestari: Tähti ja minä"),
      label: "Oma teksti: tallimestari",
    },
  },
  {
    slug: "kahvinjuoja",
    nimi: "Kahvipaidat",
    ryhma: "harrastus",
    kohde: "kahvinjuojalle",
    otsikko: "Lahja kahvinjuojalle: hauskat kahvipaidat",
    kuvaus: "Hauskat kahvipaidat ja hupparit kahvinjuojalle: aamun ensimmäinen kupillinen, tyhjä pannu ja suodattimen vaihto. Lahja kahvin ystävälle.",
    h1: "Kahvipaidat ja lahjat kahvinjuojalle",
    intro: [
      "Lahja kahvinjuojalle on paita, joka sanoo ääneen sen, mitä kahvin ystävä ajattelee ennen ensimmäistä kupillista: Ensin kahvi. Sitten ihmiset ja Kuka jätti pannun tyhjäksi? Vitsit sopivat jokaiseen kahvihuoneeseen ja kotikeittiöön.",
      "Sivulla on viisi uutta kahvimallia t-paitoina ja huppareina sekä aiemmat paidat, joissa kahvi on pääosassa, kuten Kahvi sisään, koodia ulos ja Metsästysseuran virallinen kahvinkeittäjä.",
    ],
    opas: [
      {
        otsikko: "Kahvin ystävän päivä",
        teksti: [
          "Kahvinjuojan päivä alkaa keittimen äänestä ja päättyy iltapäivän viimeiseen kupilliseen, jonka jälkeen on luvattu lopettaa. Tämä on neljäs kupillinen. En laske kertoo rehellisesti, miten lupaus pitää. Kahvi ei ole juoma. Se on suunnitelma sopii ihmiselle, jonka kalenteri on rakennettu kahvitaukojen varaan.",
          "Työpaikan kahvihuoneessa jokainen tuntee tilanteen, jossa pannu on tyhjä ja kukaan ei muista juoneensa viimeistä tilkkaa. Kuka jätti pannun tyhjäksi? on paita, joka hoitaa keskustelun puolestasi. Suodatin vaihdettu. Elämä jatkuu on puolestaan pieni voitonjulistus aamun ensimmäisestä onnistumisesta.",
          "Kahvinjuojia on monenlaisia. Yksi juo suodatinkahvia isosta pannusta, toinen jauhaa pavut ja punnitsee veden grammalleen, ja kolmas juo sitä, mitä työpaikan automaatti antaa. Heitä yhdistää aamun hiljainen hetki ennen ensimmäistä siemausta, jolloin kukaan ei puhu. Kahvipaidan vitsit kunnioittavat sitä hetkeä ja kertovat muille, milloin kahvinjuojaa kannattaa lähestyä.",
        ],
      },
      {
        otsikko: "Kenelle kahvipaita sopii",
        teksti: [
          "Kahvipaita on helppo lahja työkaverille, joka keittää aina uuden pannullisen, ystävälle, joka jauhaa pavut itse, ja isälle, jonka termospullo kulkee jokaisella reissulla mukana. Se sopii syntymäpäiviin, läksiäisiin ja pikkujoulujen lahjapeliin, jossa vitsin ymmärtää koko porukka.",
          "Työkaverin lahjasivulta löytyy lisää ideoita toimistolle. Kahvinjuojan paita sopii myös kissaihmiselle, joka juo aamukahvinsa kissa sylissä, ja pelaajalle, jonka ilta venyy kahvin voimalla.",
        ],
      },
      {
        otsikko: "Kahvihuoneen oma paita",
        teksti: [
          "Personoitavaan harrastusmestari-paitaan voit kirjoittaa oman kahvitittelin. Linkissä on valmiina ehdotus Kahvihuoneen harrastusmestari, ja tekstin voi muuttaa tuotesivulla.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja kahvinjuojalle?",
        a: "T-paita tai huppari kahvivitsillä, esimerkiksi Ensin kahvi. Sitten ihmiset tai Kahvi ei ole juoma. Se on suunnitelma.",
      },
      {
        q: "Mikä kahvipaita sopii työkaverille?",
        a: "Kuka jätti pannun tyhjäksi? sopii työpaikan kahvihuoneeseen, ja Tämä on neljäs kupillinen. En laske palaveripäivään.",
      },
      {
        q: "Voiko kahvipaitaan painaa oman tekstin?",
        a: "Voi. Personoitavaan paitaan kirjoitat oman tekstin, esimerkiksi kahvihuoneen tittelin ja nimen.",
      },
    ],
    tuotteet: [],
    mallit: [
      ["ENSIN KAHVI.", "SITTEN IHMISET."],
      ["KUKA JÄTTI", "PANNUN TYHJÄKSI?"],
      ["TÄMÄ ON", "NELJÄS KUPILLINEN.", "EN LASKE."],
      ["SUODATIN VAIHDETTU.", "ELÄMÄ JATKUU."],
      ["KAHVI EI OLE", "JUOMA.", "SE ON SUUNNITELMA."],
    ],
    liittyvat: ["/lahjat/tyokaverille", "/joululahja-tyokaverille", "/paidat/kissaihminen", "/lahjat/harrastajalle", "/lahja-kaverille"],
    personoitu: {
      teksti: "Kirjoita paitaan kahvihuoneen titteli ja nimi tai oma kahvivitsi. Ehdotus on valmiina tuotesivulla.",
      href: harrastusmestari("Kahvihuoneen harrastusmestari"),
      label: "Oma teksti: kahvihuoneen mestari",
    },
  },
  {
    slug: "puutarhuri",
    nimi: "Puutarhapaidat",
    ryhma: "harrastus",
    kohde: "puutarhurille",
    otsikko: "Puutarhurin paidat ja lahjat huumorilla",
    kuvaus: "Hauskat puutarhapaidat ja hupparit: rikkaruohot, multaiset kynnet ja kesän ainoa tomaatti. Lahja puutarhurille ja viherpeukalolle.",
    h1: "Puutarhapaidat ja lahjat puutarhurille",
    intro: [
      "Lahja puutarhurille on paita kasvimaan ja kukkapenkin huumorilla: Rikkaruoho voitti taas. Ensi kesänä minä ja Yksi tomaatti. Koko kesän työ. Vitsit tuntee jokainen, joka on kantanut kastelukannua heinäkuun helteellä.",
      "Sivulla on viisi uutta puutarhamallia t-paitoina ja huppareina. Ne sopivat kotipuutarhurille, siirtolapuutarhan palstaviljelijälle ja ammattipuutarhurille.",
    ],
    opas: [
      {
        otsikko: "Kasvimaan opetukset",
        teksti: [
          "Puutarhurin kevät alkaa ikkunalaudalla, jossa taimet kurkottavat valoa kohti, ja jatkuu penkissä, jossa rikkaruohot kasvavat kaksi kertaa nopeammin kuin istutetut kasvit. Rikkaruoho voitti taas. Ensi kesänä minä on paita jokaiselle, joka lupaa itselleen paremman kauden.",
          "Yksi tomaatti. Koko kesän työ kertoo sadonkorjuusta, joka ei aina vastaa siemenpussin kuvaa. Puhun kasveille. Ne eivät keskeytä sopii puutarhurille, joka viihtyy penkkien välissä ilman seuraa. Multaa kynsissä. Rauhaa mielessä on taas lempeä kuvaus siitä, miksi puutarhaan mennään ylipäätään.",
          "Puutarhurin kalenteri ei noudata viikonpäiviä vaan säätä. Hallaöinä peitellään taimia harsolla, sateen jälkeen kitketään, ja kuivalla jaksolla kannetaan vettä illalla. Jokainen kausi opettaa jotain uutta, ja jokainen kausi päättyy lupaukseen tehdä ensi vuonna toisin. Puutarhapaidat on kirjoitettu juuri tästä kiintymyksestä: kasvimaa ei aina onnistu, mutta siihen palataan joka kevät.",
        ],
      },
      {
        otsikko: "Lahja viherpeukalolle",
        teksti: [
          "Puutarhapaita on hyvä lahja isoäidille, jonka pihan perennat kukkivat järjestyksessä, ystävälle, joka on juuri saanut ensimmäisen palstan, ja eläkkeelle siirtyvälle, jolla on vihdoin aikaa kasvihuoneelle. Se sopii syntymäpäiviin, äitienpäivään ja kesän ensimmäisiin pihajuhliin.",
          "En osta kukkia. Kasvatan niitä. Hitaasti on paita sille, joka kieltäytyy kimpuista ja odottaa omia kukkia vaikka koko kesän. Huppari on lämmin syksyn sipulinistutuksiin ja kevään viileisiin aamuihin, kun taimet viedään karaistumaan. Mökkeilijän lahjat löytyvät alta.",
        ],
      },
      {
        otsikko: "Oma puutarhateksti",
        teksti: [
          "Personoitavaan harrastusmestari-paitaan voit kirjoittaa puutarhurin tittelin ja nimen. Linkissä on valmiina ehdotus.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja puutarhurille?",
        a: "T-paita tai huppari puutarhavitsillä, esimerkiksi Rikkaruoho voitti taas. Ensi kesänä minä tai Puhun kasveille. Ne eivät keskeytä.",
      },
      {
        q: "Sopiiko paita palstaviljelijälle?",
        a: "Sopii. Yksi tomaatti. Koko kesän työ ja Multaa kynsissä. Rauhaa mielessä sopivat jokaiselle kasvimaalle.",
      },
      {
        q: "Voiko puutarhapaitaan painaa oman tekstin?",
        a: "Voi. Personoitavaan paitaan kirjoitat esimerkiksi puutarhurin nimen ja tittelin tuotesivulla.",
      },
    ],
    tuotteet: [],
    mallit: [
      ["RIKKARUOHO", "VOITTI TAAS.", "ENSI KESÄNÄ MINÄ."],
      ["PUHUN KASVEILLE.", "NE EIVÄT", "KESKEYTÄ."],
      ["MULTAA KYNSISSÄ.", "RAUHAA MIELESSÄ."],
      ["YKSI TOMAATTI.", "KOKO KESÄN TYÖ."],
      ["EN OSTA KUKKIA.", "KASVATAN NIITÄ.", "HITAASTI."],
    ],
    liittyvat: ["/lahjat/mokkeilijalle", "/paidat/kahvinjuoja", "/lahjat/harrastajalle", "/lahjat/isoaidille", "/elakelahjat"],
    personoitu: {
      teksti: "Kirjoita paitaan puutarhurin nimi ja titteli tai oma kasvimaan sanonta. Ehdotus on valmiina tuotesivulla.",
      href: harrastusmestari("Kasvimaan harrastusmestari"),
      label: "Oma teksti: kasvimaan mestari",
    },
  },
  {
    slug: "pelaaja",
    nimi: "Pelipaidat",
    ryhma: "harrastus",
    kohde: "pelaajalle",
    otsikko: "Lahja pelaajalle: hauskat pelipaidat",
    kuvaus: "Hauskat pelipaidat ja hupparit pelaajalle: vielä yksi peli, tallennuspiste ja latautuva päivitys. Lahja pelaajalle ja teinille.",
    h1: "Pelipaidat ja lahjat pelaajalle",
    intro: [
      "Hauska lahja pelaajalle on paita, jonka vitsin ymmärtää jokainen, joka on luvannut lopettaa kymmeneltä: Vielä yksi peli. Sanoin kello kymmeneltä ja En nuku. Odotan tallennuspistettä. Tekstit ovat suomeksi eivätkä mainitse yhtään peliä tai konsolia nimeltä.",
      "Sivulla on viisi uutta pelimallia t-paitoina ja huppareina sekä aiempi Just one more level -paita. Ne sopivat konsolipelaajalle, tietokonepelaajalle ja lautapeli-illan vakiokävijälle.",
    ],
    opas: [
      {
        otsikko: "Pelaajan aikavyöhyke",
        teksti: [
          "Pelaajan kello käy eri tahtia kuin muun perheen. Ilta alkaa yhdellä pelillä, ja kun seuraavan kerran katsoo ulos, lehtipoika kulkee jo pihalla. Päivitys latautuu. Minäkin on paita siihen hetkeen, kun peli ilmoittaa ladattavasta päivityksestä juuri, kun ilta oli vapaa.",
          "Tauko ei ole luovutus kertoo pelaajasta, joka nousee välillä venyttelemään ja palaa sitten vaikeaan kenttään. Kotityöt on tehty. Pelissä sopii kaikille, joiden virtuaalinen talo on siistimpi kuin oma eteinen. Se on myös lempeä muistutus perheelle siitä, mitä pelaaja tarkoittaa sanoessaan, että tiskit on hoidettu.",
          "Pelaajan huumori on yhteisöllistä. Samat vitsit kiertävät kaveriporukan äänikanavalla, koulun käytävällä ja työpaikan kahvipöydässä, jossa aikuiset vertaavat yöunien määrää edellisen illan pelisessioon. En nuku. Odotan tallennuspistettä on paita juuri tälle porukalle. Se ei arvota pelaamista vaan nauraa sille, miten vaikea hyvästä pelistä on irrottautua.",
        ],
      },
      {
        otsikko: "Lahja pelaajalle joka ikään",
        teksti: [
          "Pelipaita on hyvä lahja teinille, joka viettää viikonloput kuulokkeet päässä, aikuiselle, joka pelaa lasten mentyä nukkumaan, ja isovanhemmalle, joka on oppinut pelaamaan lastenlasten kanssa. Se sopii syntymäpäiviin, valmistujaisiin ja joulupukin säkkiin.",
          "Huppari on pelaajan perusvaate: pehmeä, lämmin ja huomaamaton pitkässä pelisessiossa. IT-ihmisen ja harrastajan lahjasivuilta löydät lisää ideoita, ja kahvinjuojan paidat sopivat pelaajalle, joka pysyy hereillä kahvin voimalla.",
        ],
      },
      {
        otsikko: "Pelinimi paitaan",
        teksti: [
          "Personoitavaan harrastusmestari-paitaan voit kirjoittaa pelaajan nimimerkin. Linkissä on valmiina ehdotus, jonka vaihdat oikeaan nimimerkkiin.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja pelaajalle?",
        a: "T-paita tai huppari pelivitsillä, esimerkiksi Vielä yksi peli. Sanoin kello kymmeneltä tai En nuku. Odotan tallennuspistettä.",
      },
      {
        q: "Sopiiko pelipaita teinille?",
        a: "Sopii. Tekstit ovat siistejä ja suomenkielisiä, ja Kotityöt on tehty. Pelissä naurattaa myös vanhempia.",
      },
      {
        q: "Voiko paitaan painaa pelaajan nimimerkin?",
        a: "Voi. Personoitavaan paitaan kirjoitat nimimerkin tai oman tekstin tuotesivulla.",
      },
    ],
    tuotteet: [/just one more level/],
    mallit: [
      ["VIELÄ YKSI PELI.", "SANOIN KELLO", "KYMMENELTÄ."],
      ["EN NUKU.", "ODOTAN", "TALLENNUSPISTETTÄ."],
      ["PÄIVITYS", "LATAUTUU.", "MINÄKIN."],
      ["TAUKO EI OLE", "LUOVUTUS."],
      ["KOTITYÖT", "ON TEHTY.", "PELISSÄ."],
    ],
    liittyvat: ["/lahjat/it-ihmiselle", "/lahjat/harrastajalle", "/joululahja-teinille", "/paidat/kahvinjuoja", "/lahja-kaverille"],
    personoitu: {
      teksti: "Kirjoita paitaan pelaajan nimimerkki tai oman porukan pelivitsi. Ehdotus on valmiina tuotesivulla.",
      href: harrastusmestari("Pelimestari: nimimerkki"),
      label: "Oma teksti: pelimestari",
    },
  },
];
