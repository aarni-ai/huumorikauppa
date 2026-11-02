/**
 * Ammattisivut, osa D: urheilu ja harrastukset (/paidat/<slug>). Muoto: ./tyypit.ts.
 */
import type { AmmattiSivuSisalto } from "./tyypit";

const mestari = (teksti: string) => `/tuote/personoitava-t-paita-harrastusmestari?teksti=${encodeURIComponent(teksti)}`;
const kapteeni = (teksti: string) => `/tuote/personoitava-t-paita-kapteeni?teksti=${encodeURIComponent(teksti)}`;

export const SIVUT_D: AmmattiSivuSisalto[] = [
  {
    slug: "kuntosali",
    nimi: "Kuntosalipaidat",
    ryhma: "harrastus",
    kohde: "kuntosaliharrastajalle",
    otsikko: "Kuntosalipaita ja lahja salilla kävijälle",
    kuvaus: "Hauskat kuntosalipaidat ja hupparit: jalkapäivä, vielä yksi sarja ja salin peili. Lahja kuntosaliharrastajalle.",
    h1: "Kuntosalipaidat ja lahjat kuntosaliharrastajalle",
    intro: [
      "Hauska lahja kuntosaliharrastajalle on paita, jonka vitsin tuntee jokainen, joka on laskenut toistoja ääneen: Vielä yksi sarja. Sanoin myös edellisellä ja Jalkapäivä tehty. Portaat eivät ole enää ystäviä.",
      "Sivulla on viisi uutta salimallia t-paitana ja hupparina sekä aiempi Jalkapäivä ohitettu jälleen -paita. Paidat on tehty treenikassiin, salin aulaan ja palautuspäivän sohvalle.",
    ],
    opas: [
      {
        otsikko: "Salin säännöt, joita ei lue seinällä",
        teksti: [
          "Kuntosalilla on oma kielensä. Toistot lasketaan kymmeneen, vaikka viimeiset kolme ovat neuvottelukysymys. Proteiinipurkki kulkee mukana kuin lemmikki, ja ohjelmaan kuuluu aina päivä, jonka jälkeen kotirapun portaat tuntuvat vuorelta. Peilin edessä tarkistetaan tekniikka, ja joskus myös hiukset.",
          "Proteiinia aamulla, illalla ja varmuuden vuoksi sopii treenaajalle, jonka keittiön kaapissa on enemmän jauheita kuin mausteita. En huuda. Nostan vain äänekkäästi on paita sille, jonka viimeinen toisto kuuluu pukuhuoneeseen asti. Salin peili tietää minusta liikaa kertoo, kuka käy salilla eniten iltaisin.",
          "Treenipäiväkirjaan merkitään sarjat, toistot ja painot, mutta harvoin sitä, kuinka monta kertaa juomapullo unohtui pukukaappiin. Salikaveri on tärkeä ihminen: hän varmistaa penkissä, laskee viimeiset toistot armollisesti ja muistuttaa, että palautuminen kuuluu ohjelmaan. Uudet mallit on kirjoitettu juuri tälle porukalle, joka tunnistaa toisensa aulassa jo kenkien perusteella ja tietää, kenen vuoro on pyyhkiä laite.",
        ],
      },
      {
        otsikko: "Lahjaksi aloittelijalle ja konkarille",
        teksti: [
          "Paita on hyvä lahja ystävälle, joka aloitti salitreenin tammikuussa ja jatkaa yhä, ja konkarille, jonka penkkipunnerrusennätys mainitaan jokaisessa illanistujaisessa. Se sopii syntymäpäivälle, treenikaverin kiitokseksi ja salikortin kylkiäiseksi.",
          "Huppari on lämmin talviaamujen kävelyyn salille ja lämmittelyyn ennen ensimmäistä sarjaa. T-paita kulkee itse treenissä. Jos lahjan saaja juoksee tai pyöräilee salin lisäksi, juoksijan ja pyöräilijän paidat löytyvät linkeistä.",
        ],
      },
      {
        otsikko: "Oma ennätys paitaan",
        teksti: [
          "Personoitavaan Harrastusmestari-paitaan voit kirjoittaa treenaajan nimen tai oman ennätyksen. Ehdotuksena on Penkkipunnerruksen harrastusmestari, ja tekstiä voi muokata tuotesivulla. Paita toimii myös salikaverin palkintona, kun yhteinen tavoite on saavutettu.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja kuntosaliharrastajalle?",
        a: "T-paita tai huppari salihuumorilla, esimerkiksi Vielä yksi sarja. Sanoin myös edellisellä tai Salin peili tietää minusta liikaa.",
      },
      {
        q: "Voiko paidalla treenata?",
        a: "Voi. T-paita sopii rauhalliseen salitreeniin ja venyttelyyn, ja huppari lämmittelyyn ja salimatkoille.",
      },
      {
        q: "Onko paita treenikaverille, joka ohittaa jalkapäivän?",
        a: "On. Jalkapäivä tehty. Portaat eivät ole enää ystäviä sopii sille, joka teki sen, ja aiempi Jalkapäivä ohitettu jälleen sille, joka ei tehnyt.",
      },
    ],
    tuotteet: [/kuntosali/, /jalkapäivä/],
    mallit: [
      ["JALKAPÄIVÄ TEHTY.", "PORTAAT EIVÄT", "OLE ENÄÄ YSTÄVIÄ."],
      ["VIELÄ YKSI SARJA.", "SANOIN MYÖS", "EDELLISELLÄ."],
      ["PROTEIINIA", "AAMULLA, ILLALLA", "JA VARMUUDEN VUOKSI."],
      ["EN HUUDA.", "NOSTAN VAIN", "ÄÄNEKKÄÄSTI."],
      ["SALIN PEILI", "TIETÄÄ MINUSTA", "LIIKAA."],
    ],
    liittyvat: ["/paidat/juoksija", "/paidat/pyorailija", "/paidat/padel", "/lahjat/harrastajalle", "/lahja-kaverille", "/syntymapaivalahjat"],
    personoitu: {
      teksti: "Kirjoita paitaan treenaajan nimi tai oma ennätys. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: mestari("Penkkipunnerruksen harrastusmestari"),
      label: "Harrastusmestari: penkkipunnerrus",
    },
  },
  {
    slug: "padel",
    nimi: "Padelpaidat",
    ryhma: "harrastus",
    kohde: "padelin pelaajalle",
    otsikko: "Padel paita ja lahja padelin pelaajalle",
    kuvaus: "Hauskat padelpaidat ja hupparit: lasi on minun puolellani, varattu vuoro ja nelinpelin syyllinen. Lahja padelin pelaajalle.",
    h1: "Padelpaidat ja lahjat padelin pelaajalle",
    intro: [
      "Lahja padelin pelaajalle on paita, jolla kentältä palaa kotiin hymyillen tuloksesta riippumatta: Lasi on minun puolellani ja Kokeilin kerran. Nyt minulla on kolme mailaa.",
      "Viisi uutta padelmallia ovat saatavana t-paitana ja hupparina. Ne sopivat pelaajalle, joka varaa vuoron jo maanantaina, ja kaverille, joka houkuteltiin mukaan yhden kerran kokeiluun.",
    ],
    opas: [
      {
        otsikko: "Kun seinä on joukkuetoveri",
        teksti: [
          "Padelissa pallo saa kimmota lasista, ja jokainen pelaaja oppii nopeasti, että seinä on joskus parempi pelikaveri kuin vieressä seisova ihminen. Padel on tennistä, jossa seinä on kaveri kertoo lajista sen, mitä aloittelijalle selitetään ensimmäisellä kerralla.",
          "Nelinpeli. Kolme kaveria ja yksi syyllinen on paita porukkaan, jossa ratkaisevan virheen tehnyt selvitetään vasta pukuhuoneessa. Vuoro varattu. Selitykset myös sopii pelaajalle, joka tietää jo etukäteen, miksi tänään ei kulje: kenkä, valaistus tai uusi maila.",
          "Padelporukassa on aina yksi, joka tuntee säännöt tarkemmin kuin muut, yksi, joka lyö jokaisen pallon täysillä, ja yksi, joka hoitaa vuorojen varaamisen ja maksujen jakamisen. Pelin jälkeen kentän sivulla puhutaan pitkään siitä yhdestä pallosta, joka kiersi lasin kautta takaisin kentälle. Uudet mallit sopivat koko porukalle, koska jokainen tunnistaa niistä itsensä tai ainakin pelikaverinsa.",
        ],
      },
      {
        otsikko: "Pelivuoron jälkeiseen lahjaan",
        teksti: [
          "Padelpaita on lahja työkaverille, jonka kanssa pelaatte aamuvuoroa ennen palaveria, ja ystävälle, jonka koko kalenteri järjestyy nykyään hallin aukioloaikojen mukaan. Se sopii syntymäpäivälle, porukan omaan turnaukseen palkinnoksi tai kiitokseksi siitä, että joku jaksaa aina varata vuoron.",
          "Huppari on hyvä matkalla hallille ja pelin jälkeen, kun kahvi juodaan aulassa. T-paidan voi ottaa kenttävaatteeksi kevyeen nelinpeliin. Jos porukassa pelataan myös salibandya tai käydään salilla, niiden paidat löytyvät linkeistä.",
        ],
      },
      {
        otsikko: "Kapteenin paita omalla tekstillä",
        teksti: [
          "Personoitavaan Kapteeni-paitaan voit kirjoittaa porukan nimen tai pelaajan lempinimen. Ehdotuksena on Tiistain padelporukan kapteeni. Kapteeniksi kelpaa se, joka varaa vuorot, tuo pallot ja muistaa, kuka maksoi viimeksi. Sama paita sopii myös porukan omaan turnaukseen voittajan palkinnoksi.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja padelin pelaajalle?",
        a: "T-paita tai huppari padelhuumorilla, esimerkiksi Lasi on minun puolellani tai Vuoro varattu. Selitykset myös.",
      },
      {
        q: "Sopiiko padelpaita aloittelijalle?",
        a: "Sopii. Kokeilin kerran. Nyt minulla on kolme mailaa on tehty juuri sille, joka innostui lajista ensimmäisellä vuorolla.",
      },
      {
        q: "Voiko padelporukalle tilata samat paidat?",
        a: "Voi. Valitse sama malli kaikille ja eri koot. Personoitavaan Kapteeni-paitaan saat porukan oman nimen.",
      },
    ],
    tuotteet: [/padel/],
    mallit: [
      ["LASI ON", "MINUN PUOLELLANI."],
      ["PADEL ON TENNISTÄ,", "JOSSA SEINÄ", "ON KAVERI."],
      ["VUORO VARATTU.", "SELITYKSET MYÖS."],
      ["NELINPELI.", "KOLME KAVERIA", "JA YKSI SYYLLINEN."],
      ["KOKEILIN KERRAN.", "NYT MINULLA", "ON KOLME MAILAA."],
    ],
    liittyvat: ["/paidat/salibandy", "/paidat/kuntosali", "/lahjat/golfaajalle", "/lahjat/harrastajalle", "/lahjat/tyokaverille"],
    personoitu: {
      teksti: "Kirjoita paitaan pelaajan lempinimi tai padelporukan nimi. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: kapteeni("Tiistain padelporukan kapteeni"),
      label: "Kapteeni: padelporukka",
    },
  },
  {
    slug: "jalkapallo",
    nimi: "Jalkapallopaidat",
    ryhma: "harrastus",
    kohde: "jalkapalloilijalle",
    otsikko: "Jalkapallo lahja: hauskat futispaidat",
    kuvaus: "Jalkapallo lahja huumorilla: paitsio, lisäaika ja sunnuntain futismatsi t-paitoina ja huppareina. Pelaajalle ja vanhemmalle.",
    h1: "Hauskat jalkapallopaidat ja lahjat futaajalle",
    intro: [
      "Jalkapallo lahja huumorilla on paita, jonka ymmärtää jokainen, joka on seissyt kentän laidalla sateessa: Paitsio. Selitän sen sinulle myöhemmin ja Lisäaika on minun aikaani.",
      "Sivun viisi uutta futismallia ovat t-paitoja ja huppareita, eikä niissä ole joukkueiden tunnuksia. Ne sopivat höntsäporukan pelaajalle, juniorin vanhemmalle ja katsomon äänekkäimmälle valmentajalle.",
    ],
    opas: [
      {
        otsikko: "Kentän laidan huumori",
        teksti: [
          "Jalkapallossa on sääntöjä, jotka jokainen fani osaa ulkoa, ja yksi sääntö, jota kukaan ei osaa selittää ilman suolapurkkeja ja kahvikuppeja. Tuomari näki. Minä näin paremmin on paita katsojalle, joka tietää aina, mitä kentällä oikeasti tapahtui.",
          "Sunnuntain futismatsi. Maanantain polvet kertoo aikuisten höntsäporukasta, jossa vauhti on entisellään mutta palautuminen ei. Lisäaika on minun aikaani sopii pelaajalle, joka herää vasta viimeisillä minuuteilla, ja kotisohvan katsojalle, joka ei lähde keittiöön ennen loppuvihellystä.",
          "Aikuisten futisvuorolla on oma kulttuurinsa. Joukkueet jaetaan liiveillä, maalivahdiksi päätyy se, joka saapui viimeisenä, ja pelin jälkeen arvioidaan omat suoritukset reilusti yläkanttiin. Juniorikentän laidalla taas vanhemmat jakavat termoskahvit, kannustavat jokaista syöttöä ja muistavat maalit vuosia. Paidat on kirjoitettu molemmille porukoille, ja niissä ei ole yhtään joukkuetta, joten ne sopivat jokaiselle kannattajalle.",
        ],
      },
      {
        otsikko: "Lahja futisvanhemmalle",
        teksti: [
          "Jalkapallovanhempi. Kentän laidalla sateessakin on kiitos isälle tai äidille, joka on kuskannut kassit, kerännyt pelipaidat pesuun ja seissyt aamupelissä termospullon kanssa. Paita sopii kauden päättäjäisiin, valmentajan kiitokseksi ja syntymäpäivälahjaksi.",
          "Huppari lämmittää syysillan harjoituksissa ja katsomossa, t-paita kulkee kesäturnauksissa. Jos perheessä pelataan myös jääkiekkoa tai salibandya, niiden paidat löytyvät linkeistä.",
        ],
      },
      {
        otsikko: "Joukkueen kapteenille",
        teksti: [
          "Personoitavaan Kapteeni-paitaan voit kirjoittaa joukkueen nimen tai pelaajan pelinumeron. Ehdotuksena on Höntsäfutiksen kapteeni. Kapteenin paita on hyvä kiitos pelaajalle, joka kerää porukan kasaan joka viikko, varaa kentän ja muistaa ottaa pallon mukaan. Junioreiden joukkueessa samaa paitaa voi käyttää valmentajan tai joukkueenjohtajan kiitoslahjana kauden lopussa.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja jalkapalloilijalle?",
        a: "T-paita tai huppari futishuumorilla, esimerkiksi Paitsio. Selitän sen sinulle myöhemmin tai Lisäaika on minun aikaani.",
      },
      {
        q: "Onko paidoissa joukkueiden logoja?",
        a: "Ei. Paidoissa on vain lajin omaa huumoria, joten ne sopivat kaikkien joukkueiden pelaajille ja faneille.",
      },
      {
        q: "Mikä paita sopii juniorin vanhemmalle?",
        a: "Jalkapallovanhempi. Kentän laidalla sateessakin. Se on tehty vanhemmalle, joka ei jätä yhtään peliä väliin.",
      },
    ],
    tuotteet: [],
    mallit: [
      ["PAITSIO.", "SELITÄN SEN", "SINULLE MYÖHEMMIN."],
      ["LISÄAIKA ON", "MINUN AIKAANI."],
      ["SUNNUNTAIN", "FUTISMATSI.", "MAANANTAIN POLVET."],
      ["JALKAPALLOVANHEMPI.", "KENTÄN LAIDALLA", "SATEESSAKIN."],
      ["TUOMARI NÄKI.", "MINÄ NÄIN", "PAREMMIN."],
    ],
    liittyvat: ["/paidat/jaakiekko", "/paidat/salibandy", "/paidat/juoksija", "/lahjat/harrastajalle", "/isanpaivalahja", "/joululahja-teinille"],
    personoitu: {
      teksti: "Kirjoita paitaan joukkueen nimi tai pelaajan pelinumero. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: kapteeni("Höntsäfutiksen kapteeni"),
      label: "Kapteeni: höntsäfutis",
    },
  },
  {
    slug: "jaakiekko",
    nimi: "Jääkiekkopaidat",
    ryhma: "harrastus",
    kohde: "jääkiekkoilijalle",
    otsikko: "Jääkiekko lahja: hauskat kiekkopaidat",
    kuvaus: "Jääkiekko lahja huumorilla: kiekkoisä hallilla kuudelta, mailan teippaus ja höntsät. Paidat pelaajalle, fanille ja vanhemmalle.",
    h1: "Hauskat jääkiekkopaidat ja lahjat kiekkoilijalle",
    intro: [
      "Jääkiekko lahja huumorilla on paita, jonka vitsin tunnistaa hallin kahvion jonossa: Kiekkoisä. Hallilla kuudelta. Kahvi mukana ja Mailan teippaus on taidetta.",
      "Viisi uutta kiekkomallia ovat saatavana t-paitana ja hupparina ilman seurojen tunnuksia. Ne on kirjoitettu pelaajalle, kaukalon laidan vanhemmalle ja aikuisten höntsävuoron konkarille.",
    ],
    opas: [
      {
        otsikko: "Aamujäät, kassit ja kaukalon laita",
        teksti: [
          "Kiekkoperheen viikko rakentuu jäävuorojen ympärille. Varusteet haisevat autossa, kassi painaa enemmän kuin pelaaja, ja aamun ensimmäinen kahvi juodaan hallin parvella ennen kuin aurinko on noussut. Kaukalon laidalla olen myös valmentaja sopii vanhemmalle, joka antaa ohjeita lasin takaa, vaikka kukaan ei kuule niitä.",
          "Mailan teippaus on taidetta on paita pelaajalle, jolla on teippaukseen oma järjestys ja vahva mielipide. Jäähy. En ollut edes kentällä kertoo pelaajasta, joka joutuu tuomarin listalle aina hieman epäreilusti. Höntsät alkaa. Selkä ei sitä vielä tiedä on aikuisten iltavuoron paita.",
          "Aikuisten iltavuoroon tullaan töiden jälkeen, varusteet puetaan pukukopissa vanhalla rutiinilla, ja ensimmäinen luistelukierros kertoo, kuinka pitkä tauko kesä oli. Pelin jälkeen saunassa käydään läpi jokainen syöttö ja muistellaan juniorivuosia, jolloin vauhtia oli enemmän. Paidat on kirjoitettu tälle porukalle ja kiekkoperheille, jotka viettävät talven viikonloput hallilla eväsrasioiden ja lämpimän kaakaon kera.",
        ],
      },
      {
        otsikko: "Kenelle kiekkopaita sopii",
        teksti: [
          "Kiekkoisä tai kiekkoäiti saa paidasta kiitoksen aamuherätyksistä ja turnausviikonlopuista. Pelaajalle paita on lahja kauden päättäjäisiin, syntymäpäiville tai joukkueen pikkujouluihin. Fani pukee hupparin televisiopelin ajaksi ja jännittää jatkoajan sohvan reunalla.",
          "Huppari on lämmin valinta kylmään halliin, ja t-paita kulkee pukukopissa varusteiden alla. Jos perheessä pelataan myös jalkapalloa tai salibandya, niiden paidat löytyvät linkeistä.",
        ],
      },
      {
        otsikko: "Oma teksti kapteenille",
        teksti: [
          "Personoitavaan Kapteeni-paitaan voit kirjoittaa joukkueen tai iltavuoron nimen. Ehdotuksena on Höntsävuoron kapteeni. Kapteenin paita sopii pelaajalle, joka hoitaa vuoron laskut, pitää yhteystiedot ajan tasalla ja kerää aina tarpeeksi pelaajia jäälle.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska jääkiekko lahja?",
        a: "T-paita tai huppari kiekkohuumorilla, esimerkiksi Mailan teippaus on taidetta tai Jäähy. En ollut edes kentällä.",
      },
      {
        q: "Onko kiekkoisälle oma paita?",
        a: "On. Kiekkoisä. Hallilla kuudelta. Kahvi mukana on tehty vanhemmalle, joka tuntee hallin aamut. Paita sopii myös kiekkoäidille.",
      },
      {
        q: "Onko paidoissa seurojen logoja?",
        a: "Ei. Paidoissa on lajin yhteistä huumoria, joten ne sopivat jokaisen joukkueen pelaajalle ja kannattajalle.",
      },
    ],
    tuotteet: [],
    mallit: [
      ["KIEKKOISÄ.", "HALLILLA KUUDELTA.", "KAHVI MUKANA."],
      ["MAILAN TEIPPAUS", "ON TAIDETTA."],
      ["KAUKALON LAIDALLA", "OLEN MYÖS", "VALMENTAJA."],
      ["HÖNTSÄT ALKAA.", "SELKÄ EI SITÄ", "VIELÄ TIEDÄ."],
      ["JÄÄHY.", "EN OLLUT EDES", "KENTÄLLÄ."],
    ],
    liittyvat: ["/paidat/jalkapallo", "/paidat/salibandy", "/paidat/hiihtaja", "/lahjat/harrastajalle", "/isanpaivalahja", "/lahjat/veljelle"],
    personoitu: {
      teksti: "Kirjoita paitaan joukkueen tai iltavuoron nimi. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: kapteeni("Höntsävuoron kapteeni"),
      label: "Kapteeni: höntsävuoro",
    },
  },
  {
    slug: "salibandy",
    nimi: "Salibandypaidat",
    ryhma: "harrastus",
    kohde: "salibandyn pelaajalle",
    otsikko: "Salibandy paita ja lahja säbän pelaajalle",
    kuvaus: "Hauskat salibandypaidat ja hupparit: säbävuoro tiistaina, katkennut maila ja maalivahdin polvet. Lahja salibandyn pelaajalle.",
    h1: "Salibandypaidat ja lahjat säbän pelaajalle",
    intro: [
      "Lahja salibandyn pelaajalle on paita, joka kertoo viikon tärkeimmän tapahtuman: Säbävuoro tiistaina. Muu viikko on taukoa ja Pallo on pieni. Ego ei.",
      "Sivun viisi uutta säbämallia ovat t-paitoja ja huppareita. Ne on tehty koulun liikuntasalin iltavuorolle, työpaikan porukalle ja maalivahdille, joka on kerännyt polviinsa vuosien kokemuksen.",
    ],
    opas: [
      {
        otsikko: "Iltavuoron tuttu porukka",
        teksti: [
          "Salibandy on monelle se laji, jota pelataan samalla porukalla vuodesta toiseen. Vuoro alkaa liikuntasalin oven avaamisella, jatkuu kiistalla siitä, kumpi joukkue saa liivit, ja päättyy pukuhuoneen analyysiin, jossa jokainen maali on kaunis ja jokainen päästetty maali on puolustuksen vika.",
          "Maila katkesi. Syy oli mailassa sopii pelaajalle, jonka laukaus ei koskaan epäonnistu, ainoastaan välineet. Vaihtoon vasta kun keuhkot pyytää on paita sille, joka pelaa vaihdon kerrallaan kolme minuuttia liian pitkään ja kehuu sitä vielä kotona.",
          "Iltavuoron lopussa joku ehdottaa aina vielä yhtä erää, ja joku toinen muistuttaa, että salin vuoro päättyy kohta. Mailat ovat vuosien varrella vaihtuneet, mutta porukan sisäpiirin vitsit pysyvät samoina, ja juuri niistä uudet mallit on kirjoitettu. Säbäpaita on siksi yhtä lailla kahvihuoneen keskustelunavaus kuin pelivaate.",
        ],
      },
      {
        otsikko: "Maalivahdille ja koko kentälle",
        teksti: [
          "Maalivahdin polvet muistavat jokaisen torjunnan on kunnianosoitus pelipaikalle, jolla kukaan muu ei halua seistä. Paita on hyvä lahja maalivahdille syntymäpäivänä tai kauden viimeisen vuoron jälkeen, kun porukka kokoontuu saunaan.",
          "Työpaikan säbäporukalle sama malli toimii yhteisenä paitana, ja juniorin vanhemmalle huppari on lämmin turnauspäivän katsomossa. Jos porukassa pelataan myös padelia tai jalkapalloa, niiden paidat löytyvät linkeistä.",
        ],
      },
      {
        otsikko: "Kapteenin paita",
        teksti: [
          "Personoitavaan Kapteeni-paitaan voit kirjoittaa porukan tai joukkueen nimen. Ehdotuksena on Tiistain säbävuoron kapteeni. Kapteeniksi sopii se, joka varaa salin, tuo liivit ja muistuttaa porukkaa viestillä vuoroa edeltävänä iltana. Paita on hyvä kiitos tästä näkymättömästä työstä.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja salibandyn pelaajalle?",
        a: "T-paita tai huppari säbähuumorilla, esimerkiksi Pallo on pieni. Ego ei tai Maila katkesi. Syy oli mailassa.",
      },
      {
        q: "Onko salibandyn maalivahdille oma paita?",
        a: "On. Maalivahdin polvet muistavat jokaisen torjunnan on tehty juuri maalivahdille.",
      },
      {
        q: "Voiko työpaikan säbäporukalle tilata samat paidat?",
        a: "Voi. Valitse kaikille sama malli eri kokoina, tai kirjoita porukan nimi personoitavaan Kapteeni-paitaan.",
      },
    ],
    tuotteet: [/salibandy/],
    mallit: [
      ["SÄBÄVUORO", "TIISTAINA.", "MUU VIIKKO ON TAUKOA."],
      ["PALLO ON PIENI.", "EGO EI."],
      ["MAILA KATKESI.", "SYY OLI MAILASSA."],
      ["MAALIVAHDIN", "POLVET MUISTAVAT", "JOKAISEN TORJUNNAN."],
      ["VAIHTOON", "VASTA KUN", "KEUHKOT PYYTÄÄ."],
    ],
    liittyvat: ["/paidat/jaakiekko", "/paidat/jalkapallo", "/paidat/padel", "/lahjat/harrastajalle", "/lahjat/tyokaverille"],
    personoitu: {
      teksti: "Kirjoita paitaan säbäporukan tai joukkueen nimi. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: kapteeni("Tiistain säbävuoron kapteeni"),
      label: "Kapteeni: säbävuoro",
    },
  },
  {
    slug: "hiihtaja",
    nimi: "Hiihtäjän paidat",
    ryhma: "harrastus",
    kohde: "hiihtäjälle",
    otsikko: "Lahja hiihtäjälle: hauskat hiihtopaidat",
    kuvaus: "Hauskat paidat hiihtäjälle: voitelu kolme tuntia, pito tänään arvaus ja latu terapeuttina. T-paidat ja hupparit hiihtäjälle.",
    h1: "Hauskat paidat ja lahjat hiihtäjälle",
    intro: [
      "Hauska lahja hiihtäjälle on paita, jonka ymmärtää jokainen, joka on seissyt voitelupöydän ääressä pidempään kuin ladulla: Voitelin kolme tuntia. Hiihdin tunnin ja Pito tänään: arvaus.",
      "Sivulla on viisi uutta hiihtomallia t-paitoina ja huppareina. Ne sopivat perinteisen hiihtäjälle, luistelijalle ja sille, joka lähtee ladulle vain silloin, kun pakkasta on juuri sopivasti.",
    ],
    opas: [
      {
        otsikko: "Voitelupöydän filosofia",
        teksti: [
          "Hiihtäjä seuraa sääennustetta tarkemmin kuin meteorologi. Lumen laatu, ilman kosteus ja lämpötila ratkaisevat, mikä purkki avataan, ja silti ladulla selviää, että naapurin halvempi voide pitää paremmin. Pito tänään: arvaus kertoo tämän rehellisesti kahdella sanalla.",
          "Latu on minun terapeuttini sopii hiihtäjälle, joka palaa metsälenkiltä rauhallisempana kuin lähti. Latu! Sanon sen ystävällisesti on muistutus vanhasta tavasta pyytää tietä, ja paidan kantaja tietää, että sävy ratkaisee. Pakkasta 15. Täydellinen hiihtokeli on paita sille, joka kaivaa sukset esiin, kun muut kaivavat villasukat.",
          "Talven ensimmäinen latu on hiihtäjälle juhlapäivä. Sukset on huollettu jo syksyllä, sauvojen hihnat säädetty ja reitti mietitty valmiiksi, vaikka lunta on vasta ohut kerros. Ladulla tervehditään tuttuja nyökkäyksellä, kahvitaukoa pidetään laavulla ja kotimatkalla lasketaan, montako kilometriä tällä kertaa kertyi. Uudet mallit on kirjoitettu näistä hetkistä.",
        ],
      },
      {
        otsikko: "Talven lahjaideat hiihtäjälle",
        teksti: [
          "Hiihtopaita sopii lahjaksi ystävälle, joka laskee talven onnistumista ladulla kertyneinä kilometreinä, ja isovanhemmalle, joka on hiihtänyt samaa reittiä vuosikymmeniä. Se on hyvä tuliainen hiihtolomalle ja syntymäpäivälahja talvella syntyneelle.",
          "Huppari on lämmin valinta laavutauolle ja mökin terassille hiihtolenkin jälkeen. T-paita kulkee kerrastojen päällä majan saunaillassa. Jos lahjan saaja kiekkoilee tai retkeilee talven lisäksi kesällä, niiden paidat löytyvät linkeistä.",
        ],
      },
      {
        otsikko: "Hiihtomestari omalla nimellä",
        teksti: [
          "Personoitavaan Harrastusmestari-paitaan voit kirjoittaa hiihtäjän nimen tai lempilatu. Ehdotuksena on Perinteisen hiihdon harrastusmestari. Teksti sopii myös hiihtoseuran talkoolaiselle, joka ajaa latuja ja keittää mehut kilpailupäivinä.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja hiihtäjälle?",
        a: "T-paita tai huppari hiihtohuumorilla, esimerkiksi Voitelin kolme tuntia. Hiihdin tunnin tai Latu on minun terapeuttini.",
      },
      {
        q: "Sopiiko paita hiihtolenkille?",
        a: "Paita on tarkoitettu vapaa-ajalle, laavutauolle ja saunailtaan. Itse lenkillä hiihtäjä käyttää teknisiä urheiluvaatteita.",
      },
      {
        q: "Mikä paita sopii voitelun harrastajalle?",
        a: "Pito tänään: arvaus ja Voitelin kolme tuntia. Hiihdin tunnin kertovat voitelupöydän todellisuudesta.",
      },
    ],
    tuotteet: [/hiihtäjä/],
    mallit: [
      ["PITO TÄNÄÄN:", "ARVAUS."],
      ["VOITELIN", "KOLME TUNTIA.", "HIIHDIN TUNNIN."],
      ["LATU ON", "MINUN TERAPEUTTINI."],
      ["LATU!", "SANON SEN", "YSTÄVÄLLISESTI."],
      ["PAKKASTA 15.", "TÄYDELLINEN", "HIIHTOKELI."],
    ],
    liittyvat: ["/paidat/retkeilija", "/paidat/juoksija", "/paidat/jaakiekko", "/lahjat/harrastajalle", "/lahjat/mokkeilijalle"],
    personoitu: {
      teksti: "Kirjoita paitaan hiihtäjän nimi tai oma lempilatu. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: mestari("Perinteisen hiihdon harrastusmestari"),
      label: "Harrastusmestari: hiihto",
    },
  },
  {
    slug: "pyorailija",
    nimi: "Pyöräilijän paidat",
    ryhma: "harrastus",
    kohde: "pyöräilijälle",
    otsikko: "Lahja pyöräilijälle: hauskat pyöräilypaidat",
    kuvaus: "Hauskat paidat pyöräilijälle: vastatuuli molempiin suuntiin, yksi pyörä lisää ja lenkki kahvilaan. T-paidat ja hupparit.",
    h1: "Hauskat paidat ja lahjat pyöräilijälle",
    intro: [
      "Hauska lahja pyöräilijälle on paita, jonka vitsi tulee jokaiselta lenkiltä: Vastatuuli molempiin suuntiin ja Montako pyörää tarvitaan? Yksi lisää.",
      "Sivulla on viisi uutta pyöräilymallia t-paitana ja hupparina sekä aiempi Ylämäki voitettu toistaiseksi -paita. Ne sopivat maantiepyöräilijälle, maastopyöräilijälle ja työmatkapyöräilijälle, joka ajaa ympäri vuoden.",
    ],
    opas: [
      {
        otsikko: "Eteisessä on jo kolme pyörää",
        teksti: [
          "Pyöräilijän kotona pyörien määrä kasvaa hiljalleen. Yksi on maantielle, toinen metsään, kolmas sateelle ja neljäs on rakenteilla autotallissa. Montako pyörää tarvitaan? Yksi lisää on paita, jonka puoliso lukee huokaisten ja pyöräilijä hymyillen.",
          "Vastatuuli molempiin suuntiin kertoo lenkistä, jonka jokainen pyöräilijä on ajanut: tuuli kääntyy aina kääntöpaikalla. Lenkki on matka kahvilaan sopii porukalle, jonka viikonloppulenkin tärkein välietappi on korvapuustin mittainen. Trikoot päällä. Selitykset takataskussa on paita sille, jolla on aina valmiina syy hitaaseen päivään.",
          "Pyöräilyporukan lenkillä on omat tapansa. Vetovuoroja vaihdetaan sovitusti, mäen päällä odotetaan viimeistä, ja huoltotauolla joku kaivaa takataskusta banaanin, joka on matkannut mukana jo kolmella lenkillä. Kotona pyörä pestään ennen ajajaa, ja ketjuöljyn tuoksu kuuluu eteisen normaaliin tunnelmaan. Paidat on kirjoitettu ihmiselle, joka tunnistaa tämän kaiken.",
        ],
      },
      {
        otsikko: "Lahjaksi kilometrien kerääjälle",
        teksti: [
          "Ensimmäisenä mäen päällä. Kerran on lahja kaverille, joka muistaa yhden voitetun mäkikirin vuosien takaa ja kertoo siitä edelleen. Paita sopii syntymäpäiville, porukan kauden päättäjäisiin ja kiitokseksi lenkin vetäjälle, joka jaksaa odottaa risteyksissä.",
          "Huppari on lämmin kahvilatauolle ja syksyn huoltopäivään autotallissa, t-paita sopii rauhalliseen arkiajoon ja kesäiltaan terassilla. Jos lahjan saaja myös juoksee tai käy salilla, niiden paidat löytyvät linkeistä.",
        ],
      },
      {
        otsikko: "Oma teksti pyöräilijälle",
        teksti: [
          "Personoitavaan Harrastusmestari-paitaan voit kirjoittaa pyöräilijän nimen tai lenkkiporukan nimen. Ehdotuksena on Sunnuntailenkin harrastusmestari. Teksti sopii lenkin vetäjälle, joka suunnittelee reitit, odottaa mäen päällä ja tietää, missä on matkan varrella auki oleva kahvila. Sama paita on hyvä kiitos myös huoltomiehelle, joka korjaa porukan renkaat.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja pyöräilijälle?",
        a: "T-paita tai huppari pyöräilyhuumorilla, esimerkiksi Vastatuuli molempiin suuntiin tai Montako pyörää tarvitaan? Yksi lisää.",
      },
      {
        q: "Voiko paidalla ajaa lenkin?",
        a: "Rauhalliseen arkiajoon kyllä. Pitkillä lenkeillä pyöräilijä käyttää teknistä ajopaitaa, ja tämä paita odottaa kahvilassa.",
      },
      {
        q: "Mikä paita sopii pyöräilyporukalle?",
        a: "Lenkki on matka kahvilaan sopii koko porukalle. Personoitavaan paitaan saa lisäksi porukan oman nimen.",
      },
    ],
    tuotteet: [/pyöräilijä/],
    mallit: [
      ["VASTATUULI", "MOLEMPIIN", "SUUNTIIN."],
      ["MONTAKO PYÖRÄÄ", "TARVITAAN?", "YKSI LISÄÄ."],
      ["LENKKI", "ON MATKA", "KAHVILAAN."],
      ["TRIKOOT PÄÄLLÄ.", "SELITYKSET", "TAKATASKUSSA."],
      ["ENSIMMÄISENÄ", "MÄEN PÄÄLLÄ.", "KERRAN."],
    ],
    liittyvat: ["/paidat/juoksija", "/paidat/kuntosali", "/paidat/retkeilija", "/lahjat/harrastajalle", "/hauskat-lahjat-miehelle"],
    personoitu: {
      teksti: "Kirjoita paitaan pyöräilijän tai lenkkiporukan nimi. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: mestari("Sunnuntailenkin harrastusmestari"),
      label: "Harrastusmestari: pyöräily",
    },
  },
  {
    slug: "juoksija",
    nimi: "Juoksijan paidat",
    ryhma: "harrastus",
    kohde: "juoksijalle",
    otsikko: "Lahja juoksijalle: hauskat juoksupaidat",
    kuvaus: "Hauskat paidat juoksijalle: pulla ei syö itseään, juoksin 10 km ja kerron siitä koko viikon. T-paidat ja hupparit.",
    h1: "Hauskat paidat ja lahjat juoksijalle",
    intro: [
      "Hauska lahja juoksijalle on paita, joka kertoo lenkin todellisen syyn: Juoksen, koska pulla ei syö itseään ja Juoksin 10 km. Kerron siitä koko viikon.",
      "Viisi uutta juoksumallia ovat t-paitoja ja huppareita, ja sivulla on myös aiempi juoksijan paita. Ne sopivat aloittelijalle, joka juoksi juuri ensimmäisen viitosensa, ja konkarille, jolla on kaapissa enemmän lenkkareita kuin kenkiä.",
    ],
    opas: [
      {
        otsikko: "Lenkkipolun totuudet",
        teksti: [
          "Juoksija tietää, että lenkin vaikein kohta on eteisen ovi. Kun se on ohitettu, loppu on helppoa, paitsi mäki, vastatuuli ja se kohta, jossa kello näyttää vasta kolmea kilometriä. Hidas lenkki on myös lenkki on paita sille, joka muistuttaa itseään tästä jokaisella palauttavalla kierroksella.",
          "Pitkä lenkki. Pitkä tarina sopii juoksijalle, jonka kahvipöytäkertomus kestää yhtä kauan kuin itse lenkki. Sade ei haittaa. Lenkkarit ovat eri mieltä on paita marraskuun pimeisiin iltoihin, kun märät kengät kuivuvat eteisessä sanomalehtien päällä. Juoksin 10 km. Kerron siitä koko viikon on rehellinen paita jokaiselle, joka on päivittänyt lenkkinsä jakoon heti suihkun jälkeen.",
          "Juoksijan viikossa on intervallit, pitkä lenkki ja lepopäivä, jota on vaikein noudattaa. Lenkkikaverin kanssa sovitaan aamukuudelta, ja kumpikaan ei halua olla se, joka peruu. Uudet mallit on tehty juuri tälle arjelle, ja ne naurattavat myös perhettä, joka kuulee kilometreistä illallispöydässä.",
        ],
      },
      {
        otsikko: "Milloin juoksupaita on hyvä lahja",
        teksti: [
          "Paita on lahja ystävälle, joka valmistautuu ensimmäiseen puolimaratoniinsa, ja kollegalle, joka juoksee työmatkat. Se sopii syntymäpäivälle, kiitokseksi lenkkiseurasta ja palkinnoksi tapahtuman maaliin päässeelle.",
          "Huppari on lämmin maalialueella ja verryttelyssä, t-paita rauhalliseen lenkkiin ja palautuspäivään. Jos juoksija pyöräilee tai hiihtää talvella, pyöräilijän ja hiihtäjän paidat löytyvät linkeistä.",
        ],
      },
      {
        otsikko: "Oma ennätys paitaan",
        teksti: [
          "Personoitavaan Harrastusmestari-paitaan voit kirjoittaa juoksijan nimen tai oman ennätyksen. Ehdotuksena on Iltalenkin harrastusmestari. Teksti sopii lenkkikaverille, joka on jaksanut lähteä mukaan sateessakin.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja juoksijalle?",
        a: "T-paita tai huppari juoksuhuumorilla, esimerkiksi Juoksen, koska pulla ei syö itseään tai Pitkä lenkki. Pitkä tarina.",
      },
      {
        q: "Mikä paita sopii aloittelevalle juoksijalle?",
        a: "Hidas lenkki on myös lenkki. Se kannustaa jatkamaan omaan tahtiin.",
      },
      {
        q: "Onko juoksuporukalle yhteistä paitaa?",
        a: "Valitse kaikille sama malli eri kokoina, tai kirjoita porukan nimi personoitavaan Harrastusmestari-paitaan.",
      },
    ],
    tuotteet: [/juoksija/],
    mallit: [
      ["JUOKSEN, KOSKA", "PULLA EI SYÖ", "ITSEÄÄN."],
      ["PITKÄ LENKKI.", "PITKÄ TARINA."],
      ["HIDAS LENKKI", "ON MYÖS", "LENKKI."],
      ["JUOKSIN 10 KM.", "KERRON SIITÄ", "KOKO VIIKON."],
      ["SADE EI HAITTAA.", "LENKKARIT", "OVAT ERI MIELTÄ."],
    ],
    liittyvat: ["/paidat/pyorailija", "/paidat/kuntosali", "/paidat/hiihtaja", "/lahjat/harrastajalle", "/lahja-kaverille", "/hauskat-lahjat-naiselle"],
    personoitu: {
      teksti: "Kirjoita paitaan juoksijan nimi tai oma ennätys. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: mestari("Iltalenkin harrastusmestari"),
      label: "Harrastusmestari: juoksu",
    },
  },
  {
    slug: "retkeilija",
    nimi: "Retkeilijän paidat",
    ryhma: "harrastus",
    kohde: "retkeilijälle",
    otsikko: "Lahja retkeilijälle: hauskat retkipaidat",
    kuvaus: "Hauskat paidat retkeilijälle: rinkka painaa, makkara paistuu ja laavulla on aina tilaa. T-paidat ja hupparit retkeilijälle.",
    h1: "Hauskat paidat ja lahjat retkeilijälle",
    intro: [
      "Hauska lahja retkeilijälle on paita, jonka vitsin ymmärtää jokainen, joka on kantanut rinkkaa pitkospuilla: Rinkka painaa. Eväät kevenevät ja Makkara paistuu. Muu voi odottaa.",
      "Sivulla on viisi uutta retkimallia t-paitoina ja huppareina sekä aiempi retkeilijän huppari. Ne on kirjoitettu kansallispuistojen kulkijalle, laavuretken järjestäjälle ja sille, joka eksyy mieluiten tarkoituksella.",
    ],
    opas: [
      {
        otsikko: "Polulla, laavulla ja nuotiolla",
        teksti: [
          "Retkeilyssä on omat lakinsa. Rinkka on raskaimmillaan ensimmäisenä aamuna ja kevenee sitä mukaa, kun eväät syödään. Kartan pieni lenkki on maastossa yllättävän pitkä, ja nuotiolla jokaisella on vahva mielipide siitä, miten tuli sytytetään oikein.",
          "Pieni lenkki, sanoi kartta. Viisitoista kilsaa on paita retkeilijälle, joka luottaa reittisuunnitelmaan vain ensimmäisen kilometrin. Laavulla on aina tilaa yhdelle lisää kertoo retkikulttuurin ystävällisyydestä. Hyttynen on myös retkeilijä sopii kesäretkelle, jolla seuraa riittää ilman kutsuakin.",
          "Retkiporukassa joku kantaa aina liikaa ruokaa, joku toinen unohtaa makuualustan, ja kolmas ottaa kuvia jokaisesta jäkälästä. Illalla nuotion ääressä kuivatetaan sukkia, keitetään kahvia pannulla ja suunnitellaan seuraavaa reissua, vaikka jalat ovat vielä märät tästä. Uudet mallit syntyivät näistä nuotioilloista ja pitkospuiden kilometreistä.",
        ],
      },
      {
        otsikko: "Retkikaverin lahjaksi",
        teksti: [
          "Retkipaita on lahja ystävälle, joka suunnittelee jo seuraavaa vaellusta ennen kuin edellisen kengät ovat kuivuneet, ja vanhemmalle, joka vei lapset ensimmäiselle laavuyölle. Se sopii syntymäpäivälle, eläkkeelle jäävälle retkeilijälle ja retkiporukan muistoksi.",
          "Huppari lämmittää iltanuotiolla ja kylmänä syysaamuna, t-paita kulkee kesäpäivän päiväretkellä. Mökkeilijän ja kalastajan lahjat ovat omilla sivuillaan, ja hiihtäjän paidat sopivat talviretkeilijälle.",
        ],
      },
      {
        otsikko: "Retkimestarin oma paita",
        teksti: [
          "Personoitavaan Harrastusmestari-paitaan voit kirjoittaa retkeilijän nimen tai porukan nimen. Ehdotuksena on Laavuretken harrastusmestari. Teksti sopii retkiporukan suunnittelijalle, joka tietää polut, laavut ja vesipaikat ulkoa ja muistaa ottaa mukaan tulitikut. Paita on hyvä kiitos myös partiojohtajalle, joka on vienyt lapset ensimmäiselle retkelleen.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja retkeilijälle?",
        a: "T-paita tai huppari retkihuumorilla, esimerkiksi Rinkka painaa. Eväät kevenevät tai Laavulla on aina tilaa yhdelle lisää.",
      },
      {
        q: "Mikä paita sopii vaeltajalle, joka suunnittelee reitit?",
        a: "Pieni lenkki, sanoi kartta. Viisitoista kilsaa sopii jokaiselle, jonka reitti venyi suunniteltua pidemmäksi.",
      },
      {
        q: "Onko retkeilijälle huppari?",
        a: "On. Jokainen uusi malli on saatavana myös hupparina, joka lämmittää laavulla ja nuotiolla.",
      },
    ],
    tuotteet: [/retkeilijä/],
    mallit: [
      ["RINKKA PAINAA.", "EVÄÄT KEVENEVÄT."],
      ["MAKKARA PAISTUU.", "MUU VOI ODOTTAA."],
      ["LAAVULLA", "ON AINA TILAA", "YHDELLE LISÄÄ."],
      ["PIENI LENKKI,", "SANOI KARTTA.", "VIISITOISTA KILSAA."],
      ["HYTTYNEN", "ON MYÖS", "RETKEILIJÄ."],
    ],
    liittyvat: ["/paidat/hiihtaja", "/paidat/pyorailija", "/lahjat/mokkeilijalle", "/lahjat/kalastajalle", "/lahjat/harrastajalle"],
    personoitu: {
      teksti: "Kirjoita paitaan retkeilijän tai retkiporukan nimi. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: mestari("Laavuretken harrastusmestari"),
      label: "Harrastusmestari: retkeily",
    },
  },
  {
    slug: "muusikko",
    nimi: "Muusikon paidat",
    ryhma: "harrastus",
    kohde: "muusikolle",
    otsikko: "Lahja muusikolle: hauskat muusikkopaidat",
    kuvaus: "Hauskat paidat muusikolle ja kitaristille: viritän ja soitan kohta, bänditreenit ja vain yksi kitara lisää. T-paidat ja hupparit.",
    h1: "Hauskat paidat ja lahjat muusikolle",
    intro: [
      "Hauska lahja muusikolle on paita, jonka vitsin tunnistaa jokainen treenikämpällä istunut: Viritän. Soitan sitten kohta ja Vain yksi kitara lisää. Lupaan.",
      "Sivulla on viisi uutta muusikkomallia t-paitana ja hupparina sekä aiempi kitaristin paita. Ne sopivat bändin soittajalle, kuoron laulajalle, kotistudion rakentajalle ja sille, joka harjoittelee iltaisin naapurin kiusaksi.",
    ],
    opas: [
      {
        otsikko: "Treenikämpän arki",
        teksti: [
          "Bänditreeneissä aika kuluu eri tavalla kuin muualla. Ensin juodaan kahvia, sitten kytketään piuhoja, sen jälkeen etsitään sitä yhtä piuhaa ja lopuksi soitetaan yksi kappale kolmeen kertaan. Bänditreenit. Kahvia kolme tuntia, soittoa vartti kertoo tämän ilman liioittelua.",
          "Vain yksi kitara lisää. Lupaan on paita soittajalle, jonka seinällä on jo tilaa enää kapodasterille. Soitan korvalla. Nuotit ovat vain ehdotus sopii muusikolle, joka oppi kappaleet levyltä. Ei ole vääriä nuotteja. On jazzia on lohdutus jokaiselle, joka on lyönyt keikalla väärän soinnun ja jatkanut itsevarmasti.",
          "Jokaisella bändillä on oma rytminsä. Rumpali tulee viimeisenä, basisti tietää setin järjestyksen, ja kitaristi virittää vielä silloinkin, kun muut jo soittavat. Kotistudiossa äänitetään sama osuus kymmeneen kertaan, ja ensimmäinen otto jää levylle. Uudet mallit on kirjoitettu tästä arjesta ihmiselle, joka kantaa vahvistinta portaissa ilolla.",
        ],
      },
      {
        otsikko: "Keikalle, kuoroon ja kotistudioon",
        teksti: [
          "Muusikon paita on lahja ystävälle, joka soittaa bändissä, lapselle, joka aloitti soittotunnit, ja vanhemmalle, joka on kuunnellut harjoittelua seinän takaa vuosia. Se sopii syntymäpäivälle, kevätkonsertin jälkeen ja bändin ensimmäisen keikan muistoksi.",
          "Huppari on lämmin roudauksessa ja talvikeikan takahuoneessa, t-paita kulkee lavalla ja treeneissä. Jos muusikko pelaa myös videopelejä, pelaajan paidat löytyvät linkeistä.",
        ],
      },
      {
        otsikko: "Bändin nimi paitaan",
        teksti: [
          "Personoitavaan Harrastusmestari-paitaan voit kirjoittaa muusikon nimen tai bändin nimen. Ehdotuksena on Autotallibändin harrastusmestari. Paidan voi antaa myös soitonopettajalle kiitokseksi kärsivällisyydestä, kuoron vetäjälle kevätkonsertin jälkeen tai bändin roudarille, joka kantaa rummut jokaiselle keikalle.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja muusikolle?",
        a: "T-paita tai huppari muusikkohuumorilla, esimerkiksi Viritän. Soitan sitten kohta tai Ei ole vääriä nuotteja. On jazzia.",
      },
      {
        q: "Onko kitaristille oma paita?",
        a: "On. Vain yksi kitara lisää. Lupaan on tehty kitaristille, ja sivulla on myös aiempi kitaristin paita.",
      },
      {
        q: "Voiko bändille tilata samat paidat?",
        a: "Voi. Valitse kaikille sama malli, tai kirjoita bändin nimi personoitavaan Harrastusmestari-paitaan.",
      },
    ],
    tuotteet: [/kitaristi/],
    mallit: [
      ["VIRITÄN.", "SOITAN SITTEN", "KOHTA."],
      ["BÄNDITREENIT.", "KAHVIA KOLME TUNTIA,", "SOITTOA VARTTI."],
      ["VAIN YKSI", "KITARA LISÄÄ.", "LUPAAN."],
      ["SOITAN KORVALLA.", "NUOTIT OVAT", "VAIN EHDOTUS."],
      ["EI OLE VÄÄRIÄ", "NUOTTEJA.", "ON JAZZIA."],
    ],
    liittyvat: ["/paidat/pelaaja", "/lahjat/harrastajalle", "/lahja-kaverille", "/lahjat/veljelle", "/syntymapaivalahjat"],
    personoitu: {
      teksti: "Kirjoita paitaan muusikon tai bändin nimi. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: mestari("Autotallibändin harrastusmestari"),
      label: "Harrastusmestari: bändi",
    },
  },
];
