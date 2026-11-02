/**
 * Abipaitojen kaupunkisivut, osa A: Helsinki, Espoo, Tampere, Vantaa, Oulu, Turku, Jyväskylä, Kuopio, Lahti ja Pori.
 * Muoto ja tekstisäännöt: ./tyypit.ts.
 */
import type { AbiKaupunkiSisalto } from "./tyypit";
import {
  ABI_TAKARAJA_TEKSTI as T, PENKKARIT_TEKSTI as P, RYHMA_TOIMITUSAIKA, RYHMA_MIN_KPL, RYHMA_MAX_KPL, SELKA_NIMI_MAX, RYHMA_NIMI_MAX,
} from "../ryhmapaidat";

export const KAUPUNGIT_A: AbiKaupunkiSisalto[] = [
  {
    slug: "helsinki",
    kaupunki: "Helsinki",
    inessiivi: "Helsingissä",
    otsikko: "Abipaidat Helsinki penkkareihin 2027",
    kuvaus: "Abipaidat helsinkiläiselle vuosikurssille: oma väri penkkariajeluun, jokaisen nimi selkään ja kokotaulukko jaetusta linkistä.",
    h1: "Abipaidat Helsingin penkkareihin",
    intro: [
      "Helsinkiläisen abivuosikurssin paita syntyy tällä sivulla: suunnitelkaa etupuoli yhdessä, jakakaa kokotaulukon linkki ja antakaa jokaisen abin kirjoittaa selkäänsä oma nimi. Pääkaupungissa penkkaripäivänä liikkeellä on monen lukion rekkoja ja lava-autoja yhtä aikaa, joten oma väri ja selkeä teksti erottavat teidän porukkanne kadulla.",
      `Penkkarit ovat ${P}. Paidat ehtivät hyvissä ajoin, kun ryhmä lukitsee tilauksen viimeistään ${T}.`,
    ],
    osiot: [
      {
        otsikko: "Penkkariajelu keskustan kaduilla",
        teksti: [
          "Kun lava kääntyy Mannerheimintieltä kohti Esplanadia ja Senaatintoria, jalkakäytävällä seisova näkee ensin paidan värin ja vasta sitten kasvot. Valitkaa siksi sävy, joka ei huku harmaaseen helmikuun päivään, ja kirjoittakaa porukan nimi niin isosti, että sen lukee kadun toiselta puolelta.",
          "Pakkasella t-paita puetaan usein haalarin tai takin päälle. Jokainen valitsee kokonsa itse, joten paksun takin päälle pukeva abi ottaa yhden koon isomman ilman, että siitä tarvitsee sopia koko porukan kanssa.",
        ],
      },
      {
        otsikko: "Iso vuosikurssi, yksi linkki",
        teksti: [
          `Suuren vuosikurssin kanssa sähköpostiketju hajoaa jo parinkymmenen viestin jälkeen. Vetäjä luo ryhmän, valitsee maksutavan ja jakaa jäsenlinkin abien ryhmächattiin, ja jokainen täyttää nimensä ja kokonsa puhelimella. Yhteen tilaukseen mahtuu ${RYHMA_MAX_KPL} paitaa. Kun teitä on enemmän, perustakaa kaksi ryhmää samalla etupuolella, niin jokainen ryhmä saa oman määräalennuksensa.`,
        ],
      },
      {
        otsikko: "Etupuoli suomeksi tai ruotsiksi",
        teksti: [
          `Helsinki on kaksikielinen kaupunki, ja etupuolen tekstin voi kirjoittaa suomeksi, ruotsiksi tai vaikka stadin slangilla. Selkään painetaan juuri se nimi, jonka jäsen itse kirjoittaa, enintään ${SELKA_NIMI_MAX} merkkiä. Lempinimi, jota kaverit oikeasti käyttävät, toimii selässä paremmin kuin virallinen etunimi.`,
        ],
      },
      {
        otsikko: "Kalliosta Vuosaareen",
        teksti: [
          `Lukioita on eri puolilla Helsinkiä, Kalliosta Vuosaareen ja Munkkiniemestä Malmille. Kun porukka kokoontuu aamulla koululle, yhtenäinen paita kokoaa vuosikurssin jo ennen kuin lava saapuu. Pitäkää etupuolen teksti niin lyhyenä, että sen ehtii lukea ohi ajavasta autosta.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Mahtuuko koko vuosikurssi yhteen tilaukseen?",
        a: `Yhteen ryhmätilaukseen mahtuu ${RYHMA_MIN_KPL}-${RYHMA_MAX_KPL} paitaa. Isompi vuosikurssi tekee kaksi ryhmää, joilla on sama etupuoli, ja kumpikin ryhmä saa oman määräalennuksensa.`,
      },
    ],
    lahella: ["espoo", "vantaa", "porvoo"],
    esimerkki: { nimi: "Stadin abit", teksti: "Lukio läpi, kohti kevättä", jasenet: ["Aino", "Elias", "Venla"] },
  },
  {
    slug: "espoo",
    kaupunki: "Espoo",
    inessiivi: "Espoossa",
    otsikko: "Abipaidat Espoo: nimet selkään penkkareihin",
    kuvaus: "Abipaidat espoolaiselle vuosikurssille Tapiolasta Leppävaaraan: porukan nimi eteen, jokaisen nimi selkään, maksu jaetusta linkistä.",
    h1: "Abipaidat Espoon abeille",
    intro: [
      "Espoossa ei ole yhtä keskustaa vaan monta: Tapiola, Leppävaara, Matinkylä, Espoon keskus ja Espoonlahti ovat kukin oman alueensa keskuksia. Siksi paidan etupuoleen sopii oman alueen nimi, ja paita kertoo heti, mistä päin kaupunkia porukka tulee.",
      `Penkkaripäivä on ${P}, ja tilaus lukitaan viimeistään ${T}. Lukituksen jälkeen paidat painetaan ja toimitetaan vetäjälle.`,
    ],
    osiot: [
      {
        otsikko: "Etupuolen teksti alueen mukaan",
        teksti: [
          `Ryhmän nimeen mahtuu ${RYHMA_NIMI_MAX} merkkiä, joten Abit Tapiola tai Leppävaaran abit sopii sellaisenaan. Nimen alle tulee vuosiluku ja halutessa oma tekstirivi, esimerkiksi sisäpiirin vitsi tai lause, jonka koko vuosikurssi tunnistaa. Esikatselu näyttää etu- ja selkäpuolen ennen kuin kukaan maksaa mitään, joten vaihtoehtoja voi kokeilla rauhassa.`,
        ],
      },
      {
        otsikko: "Jokainen maksaa oman paitansa",
        teksti: [
          "Kun vetäjä valitsee maksutavaksi jäsenten maksun, kenenkään ei tarvitse kerätä rahaa omalle tililleen eikä muistutella velasta viikkokausia. Jäsen avaa linkin, kirjoittaa nimensä ja koon ja maksaa kortilla Stripen suojatulla kassalla.",
          "Tilaus lähtee painoon itsestään, kun viimeinenkin paikka on maksettu. Vetäjä seuraa hallintasivulta, montako riviä on vielä maksamatta, ja tietää, keitä pitää muistuttaa.",
        ],
      },
      {
        otsikko: "Yhteiskuva ennen lähtöä",
        teksti: [
          "Penkkariajelun reitti sovitaan koulun ja kuljettajan kanssa. Samanväriset paidat näyttävät yhteiskuvassa yhdeltä porukalta, otettiin kuva sitten koulun portailla, pihalla tai lava-auton vieressä juuri ennen lähtöä. Kuva jää talteen pidemmäksi aikaa kuin karkkipussit, joita lavalta heitetään.",
        ],
      },
      {
        otsikko: "Numero, joka kertoo jotain",
        teksti: [
          `Selkään tulee jokaisen nimi tai lempinimi ja halutessa numero 0-99. Numeroksi käy vaikka bussilinja, jolla kulki kouluun kolme vuotta, tai oma pelinumero harrastuksesta. Kun numero kertoo jotain omasta arjesta, se herättää kysymyksiä ja naurua vielä vuosien päästä, kun kuvia katsotaan uudelleen.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Voiko abipaitaan kirjoittaa kaupunginosan nimen?",
        a: `Voi. Kirjoittakaa ryhmän nimeksi esimerkiksi Abit Tapiola, enintään ${RYHMA_NIMI_MAX} merkkiä. Vuosiluku tulee omalle rivilleen nimen alle.`,
      },
    ],
    lahella: ["helsinki", "vantaa", "salo"],
    esimerkki: { nimi: "Abit Tapiola", teksti: "Kaikki kurssit suoritettu", jasenet: ["Oona", "Leo", "Siiri"] },
  },
  {
    slug: "tampere",
    kaupunki: "Tampere",
    inessiivi: "Tampereella",
    otsikko: "Abipaidat Tampere: Manse-abit penkkareihin",
    kuvaus: "Abipaidat tamperelaisille abeille: Manse tai porukan nimi eteen, oma nimi selkään. Kokotaulukko jaetusta linkistä ja määräalennus.",
    h1: "Abipaidat Tampereen penkkareihin",
    intro: [
      "Tamperelaisen abiporukan paitaan sopii sana, jonka koko Suomi tunnistaa: Manse. Etupuolelle voi kirjoittaa Manse abit tai porukan oman tunnuksen, ja jokaisen selkään tulee abin oma nimi tai lempinimi.",
      `Penkkarit ovat ${P}. Tilauksen viimeinen lukituspäivä on ${T}, joten kokotaulukko kannattaa avata jo ennen joululomaa.`,
    ],
    osiot: [
      {
        otsikko: "Ajelu Hämeenkadulla",
        teksti: [
          "Hämeenkatu kulkee rautatieasemalta Hämeensillan yli kohti Hämeenpuistoa, ja Keskustori on aivan sen vieressä Tammerkosken rannalla. Lavalla seisovan abin paita näkyy kadulla kauas, joten selkänimi kannattaa pitää lyhyenä ja selkeänä. Näsinneula näkyy monesta kohdasta keskustaa, ja sekin sopii yhteiskuvan taustaksi.",
        ],
      },
      {
        otsikko: "Aikataulu joululoman yli",
        teksti: [
          `Joululoma katkaisee kouluviikot juuri silloin, kun tilaus pitäisi saada valmiiksi. Avatkaa kokotaulukko joulukuussa, antakaa kaikille aikaa täyttää rivinsä loman aikana ja lukitkaa tilaus tammikuun alussa. Ehdoton raja on ${T}. Paidat painetaan vasta lukituksen jälkeen, ja ne ovat perillä ${RYHMA_TOIMITUSAIKA} arkipäivässä.`,
        ],
      },
      {
        otsikko: "Hinta laskee, kun porukka kasvaa",
        teksti: [
          "Jokainen jäsen maksaa ensin pienen ryhmän hinnan. Kun tilaus lähtee painoon, hinta lasketaan lopullisesta paitamäärästä, ja erotus palautetaan maksukortille. Isossa vuosikurssissa jokainen uusi ilmoittautuja siis keventää kaikkien laskua.",
          "Tämän takia jäsenlinkki kannattaa jakaa laajasti heti alussa, myös niille, jotka eivät vielä tiedä, tulevatko ajelulle.",
        ],
      },
      {
        otsikko: "Tamperelainen tekstirivi",
        teksti: [
          `Tekstiriville sopii lause, joka kuulostaa Tampereelta: mustamakkaraan, Tammerkoskeen tai Näsijärveen viittaava sanaleikki toimii, kun se mahtuu yhdelle riville. Kokeilkaa esikatselussa kahta tai kolmea versiota ja kysykää porukalta, mikä niistä naurattaa eniten. Mitä lyhyempi lause, sitä isommalla se painetaan.`,
          `Kun lause on päätetty, kirjoittakaa se työkaluun täsmälleen siinä muodossa, jonka porukka hyväksyi. Painossa teksti tulee versaaleilla, joten kirjoitusasun voi jättää tavalliseksi, eikä isoja kirjaimia tarvitse näppäillä itse.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Saako abipaitaan kirjoittaa Manse?",
        a: "Saa. Kirjoittakaa se ryhmän nimeen, esimerkiksi Manse abit, tai etupuolen tekstiriville.",
      },
    ],
    lahella: ["hameenlinna", "pori", "jyvaskyla"],
    esimerkki: { nimi: "Manse abit", teksti: "Hämeenkadun kautta kotiin", jasenet: ["Pinja", "Onni", "Iida"] },
  },
  {
    slug: "vantaa",
    kaupunki: "Vantaa",
    inessiivi: "Vantaalla",
    otsikko: "Abipaidat Vantaa: penkkaripaidat nimillä",
    kuvaus: "Abipaidat Vantaan abeille Tikkurilasta Myyrmäkeen: suunnitelkaa paita, jakakaa kokotaulukko ja painattakaa jokaisen nimi selkään.",
    h1: "Abipaidat Vantaalle",
    intro: [
      "Helsinki-Vantaan lentoasema on Vantaalla, ja kiitoteiden naapurista saa aiheen penkkaripaidan etupuoleen: Lähtöselvitys tehty, Laskeutuminen aikuisuuteen tai porukan oma lentokenttävitsi. Tällä sivulla vantaalainen vuosikurssi suunnittelee paidan ja kokoaa jokaisen nimen ja koon samaan taulukkoon.",
      `Penkkareita vietetään ${P}. Lukitkaa ryhmän tilaus viimeistään ${T}, niin paidat ovat vetäjällä hyvissä ajoin ennen ajelua.`,
    ],
    osiot: [
      {
        otsikko: "Kolme riviä etupuolelle",
        teksti: [
          "Etupuolelle tulee kolme asiaa: ryhmän nimi, vuosiluku ja vapaa tekstirivi. Nimi saa olla yksinkertainen, kuten Vantaan abit, sillä hauskuus syntyy tekstirivillä. Siihen mahtuu lyhyt lause, joten valitkaa sellainen, jonka koko vuosikurssi ymmärtää ilman selitystä.",
          "Lukion logon voi ladata PNG- tai SVG-tiedostona. Kysykää koululta lupa ennen kuin logo painetaan.",
        ],
      },
      {
        otsikko: "Tikkurilasta Myyrmäkeen",
        teksti: [
          "Vantaalla on useita aluekeskuksia, ja Tikkurila ja Myyrmäki ovat niistä kaksi. Kun penkkariajelu kulkee jommankumman keskustan läpi, valkoinen paita erottuu talvisesta asfaltista ja harmaista seinistä. Musta ja tummansininen näyttävät tyylikkäiltä läheltä, valkoinen näkyy kauas.",
        ],
      },
      {
        otsikko: "Kun joku unohtaa maksaa",
        teksti: [
          "Vetäjä näkee hallintasivulta, kuka on maksanut ja kuka ei. Kun takaraja lähestyy ja muutama rivi on yhä maksamatta, vetäjä voi lukita tilauksen. Silloin maksamattomat rivit jäävät pois, tai vetäjä maksaa niiden paidat itse ja perii rahat myöhemmin. Kumpikin tapa pitää aikataulun kasassa, eikä yksi myöhästelijä pysäytä koko porukan tilausta.",
        ],
      },
      {
        otsikko: "Kokotaulukko puhelimella",
        teksti: [
          `Jäsenlinkki toimii puhelimen selaimessa, joten rivin voi täyttää bussissa matkalla Tikkurilaan tai välitunnilla. Jokainen näkee oman rivinsä ja voi korjata sitä, kunnes tilaus lukitaan. Vetäjän ei tarvitse kopioida kokoja mihinkään, sillä ne siirtyvät tilaukseen sellaisinaan.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Mitä tapahtuu, jos joku ei maksa abipaitaansa ajoissa?",
        a: "Vetäjä lukitsee tilauksen, kun on valmis. Maksamattomat rivit jäävät pois, tai vetäjä maksaa niiden paidat lukituksen yhteydessä.",
      },
    ],
    lahella: ["helsinki", "espoo", "porvoo"],
    esimerkki: { nimi: "Vantaan abit", teksti: "Lähtöselvitys tehty", jasenet: ["Emma", "Aleksi", "Ronja"] },
  },
  {
    slug: "oulu",
    kaupunki: "Oulu",
    inessiivi: "Oulussa",
    otsikko: "Abipaidat Oulu: penkkareihin pakkasellakin",
    kuvaus: "Abipaidat oululaisille abeille: kokotaulukko jaetusta linkistä, nimi selkään ja koko, joka mahtuu talvitakin päälle penkkariajelulla.",
    h1: "Abipaidat Oulun penkkareihin",
    intro: [
      "Oulussa helmikuu on kylmää aikaa, ja penkkariajelulla abipaita puetaan takin tai haalarin päälle. Siksi kokovalinta kannattaa tehdä talvivaatteet mielessä. Tällä sivulla oululainen vuosikurssi suunnittelee paidan, ja jokainen abi valitsee itse kokonsa ja selkänimensä.",
      `Penkkarit ovat ${P}. Lukitkaa tilaus viimeistään ${T}, niin jokaisella on aikaa sovittaa paita ennen ajelua.`,
    ],
    osiot: [
      {
        otsikko: "Koko talvivaatteiden päälle",
        teksti: [
          "Kokotaulukossa jokainen valitsee oman kokonsa. Kun paita menee toppatakin päälle, valitse yksi tai kaksi kokoa isompi kuin tavallisesti. Väljässä paidassa selkänimi näkyy kokonaan eikä veny takin saumojen kohdalla, ja paita mahtuu päälle myös paksun villapaidan kanssa.",
          "Koot 3XL-5XL maksavat hieman enemmän kuin pienemmät.",
        ],
      },
      {
        otsikko: "Kuva Toripolliisin vieressä",
        teksti: [
          "Oulun Kauppatorilla seisova Toripolliisin patsas on kaupungin tunnettu hahmo, ja sen vierestä saa yhteiskuvan, jonka jokainen oululainen tunnistaa. Torinranta ja meri ovat aivan vieressä, joten talvinen maisema tulee kuvaan mukaan. Samanväriset paidat kokoavat porukan, vaikka takit alla olisivat kaikki erilaisia.",
        ],
      },
      {
        otsikko: "Selkään lempinimi",
        teksti: [
          `Selkänimeen mahtuu ${SELKA_NIMI_MAX} merkkiä. Monella abilla on lempinimi, jota kaverit käyttävät enemmän kuin oikeaa nimeä, ja juuri se kuuluu selkään. Jos samassa porukassa on kolme Ellaa, lempinimi tai sukunimi erottaa heidät toisistaan myös paitalaatikkoa purettaessa.`,
        ],
      },
      {
        otsikko: "Kulttuuripääkaupungin abit",
        teksti: [
          `Oulu on Euroopan kulttuuripääkaupunki vuonna 2026, ja teidän abisyksynne osui samaan vuoteen. Etupuolelle sopii teksti, joka kertoo jotain omasta kaupungista: Oulun abit, Pohjoisen porukka tai sanaleikki, jonka ymmärtävät vain oululaiset. Esikatselu näyttää heti, mahtuuko teksti riville, ja lyhyt muotoilu painetaan isommalla.`,
          `Ryhmän nimi ja tekstirivi painetaan eri kokoisina, joten pidempi ajatus kannattaa jakaa kahteen osaan: kaupungin nimi ryhmän nimeen ja vitsi tekstiriville. Näin molemmat näkyvät, eikä kumpikaan pienene liikaa.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Minkä koon abipaita kannattaa valita talvitakin päälle?",
        a: "Valitkaa yksi tai kaksi kokoa isompi kuin tavallisesti. Jokainen valitsee oman kokonsa kokotaulukossa, joten kokoa ei tarvitse sopia yhdessä.",
      },
    ],
    lahella: ["rovaniemi", "kuopio"],
    esimerkki: { nimi: "Oulun abit", teksti: "Pakkasesta viis", jasenet: ["Saana", "Eino", "Lotta"] },
  },
  {
    slug: "turku",
    kaupunki: "Turku",
    inessiivi: "Turussa",
    otsikko: "Turun abipaidat omilla nimillä",
    kuvaus: "Abipaidat turkulaiselle vuosikurssille: vetäjä luo ryhmän, jokainen valitsee koon ja nimen, ja paidat tulevat yhteen osoitteeseen.",
    h1: "Turun abipaidat penkkareihin",
    intro: [
      "Turku on Suomen vanhin kaupunki, mutta teidän abivuotenne on vain kerran. Tällä sivulla suunnittelette turkulaisen vuosikurssin paidan, jaatte linkin ja kokoatte jokaisen nimen ja koon samaan taulukkoon ilman yhtään taulukkolaskentatiedostoa.",
      `Penkkarit ovat ${P}, ja tilaus pitää lukita viimeistään ${T}.`,
    ],
    osiot: [
      {
        otsikko: "Vetäjän tehtävät",
        teksti: [
          "Yksi abi toimii vetäjänä. Hän suunnittelee etupuolen yhdessä muiden kanssa, valitsee värin ja maksutavan ja antaa toimitusosoitteen, johon kaikki paidat tulevat. Vetäjällä on oma hallintasivu, jonka linkki on eri kuin jäsenten linkki, joten kukaan muu ei voi lukita tilausta vahingossa.",
          "Abitoimikunnan puheenjohtaja tai rahastonhoitaja sopii tehtävään luontevasti, koska he hoitavat vuosikurssin yhteisiä asioita muutenkin.",
        ],
      },
      {
        otsikko: "Aurajoen rannalta tuomiokirkolle",
        teksti: [
          "Kun ajelu kulkee Turun keskustassa, Kauppatorin, Aurajoen rantojen ja tuomiokirkon tienoilla paidan väri näkyy pitkälle. Yhteiskuva tuomiokirkon edustalla tai jokirannassa jää muistoksi, ja samat paidat tekevät siitä vuosikurssin kuvan eikä vain joukon ihmisiä talvitakeissa.",
        ],
      },
      {
        otsikko: "Maksaako abitoimikunta vai jokainen itse",
        teksti: [
          "Vetäjä voi maksaa kaikki paidat kerralla, kun abitoimikunta on kerännyt rahaa esimerkiksi kahvion myynnillä tai tanssiaisten lipuilla. Silloin jäsenet kirjoittavat vain nimensä ja kokonsa. Kun yhteistä kassaa ei ole, jokainen maksaa oman paitansa jaetusta linkistä, eikä vetäjän tarvitse olla kenenkään pankki.",
        ],
      },
      {
        otsikko: "Yksi kiinnitetty viesti",
        teksti: [
          `Kertokaa jo ensimmäisessä viestissä kolme asiaa: mistä linkistä paita täytetään, mihin mennessä ja kuka on vetäjä. Kun samat tiedot ovat ryhmächatin kiinnitetyssä viestissä, kenenkään ei tarvitse kysyä niitä uudelleen. Viimeinen lukituspäivä on ${T}, joten jäsenten oma raja kannattaa asettaa muutamaa päivää aiemmin.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Voiko abitoimikunta maksaa kaikki paidat kerralla?",
        a: "Voi. Valitkaa maksutavaksi vetäjä maksaa, jolloin jäsenet täyttävät nimen ja koon ja vetäjä maksaa kaikki paidat lukituksen yhteydessä.",
      },
    ],
    lahella: ["salo", "pori"],
    esimerkki: { nimi: "Turun abit", teksti: "Aurajoen rannalta maailmalle", jasenet: ["Elli", "Niilo", "Aada"] },
  },
  {
    slug: "jyvaskyla",
    kaupunki: "Jyväskylä",
    inessiivi: "Jyväskylässä",
    otsikko: "Abipaidat Jyväskylä: oma logo ja nimet",
    kuvaus: "Abipaidat jyväskyläläiselle vuosikurssille: lukion logo tai oma tunnus eteen, nimet selkään ja jokainen maksaa oman paitansa.",
    h1: "Abipaidat Jyväskylän abeille",
    intro: [
      "Jyväskylää kutsutaan Suomen Ateenaksi, koulujen ja opiskelun kaupungiksi. Tälle sivulle on koottu abipaidan suunnittelu jyväskyläläiselle vuosikurssille: etupuoli tehdään yhdessä, ja selkänimen kirjoittaa jokainen itse.",
      `Penkkarit ovat ${P}. Tilaus lukitaan viimeistään ${T}, ja sen jälkeen paidat lähtevät painoon.`,
    ],
    osiot: [
      {
        otsikko: "Lukion logo etupuolelle",
        teksti: [
          "Monella lukiolla on oma logo, ja sen voi ladata suunnittelutyökaluun PNG- tai SVG-tiedostona. Läpinäkyvä tausta näyttää paidalla siistimmältä kuin valkoinen laatikko logon ympärillä. Kysykää rehtorilta tai koulusihteeriltä lupa logon käyttöön ennen kuin tilaus lukitaan.",
          "Kun logoa ei ole tai lupaa ei tule, porukan oma tunnus toimii yhtä hyvin: Jyväskylän abit, vuosiluku ja lyhyt tekstirivi.",
        ],
      },
      {
        otsikko: "Kompassilta Harjun portaille",
        teksti: [
          "Kauppakadun Kompassi on keskustan tuttu kohtaamispaikka, ja Harjun portaat nousevat keskustan laidalta kohti vesitornia. Portaat ovat luonteva paikka koko vuosikurssin yhteiskuvalle, koska jokainen mahtuu kuvaan omalle askelmalleen. Samat paidat näyttävät kuvassa yhdeltä porukalta, vaikka toiset seisovat ylempänä kuin toiset.",
        ],
      },
      {
        otsikko: "Opiskelijan budjetilla",
        teksti: [
          "Kun jokainen maksaa oman paitansa, kenenkään ei tarvitse lainata rahaa muille eikä odotella, että kaverit maksavat takaisin. Määräalennus lasketaan koko ryhmän paitamäärästä, ja erotus palautetaan kortille silloin, kun tilaus lähtee painoon.",
        ],
      },
      {
        otsikko: "Kokeilkaa pisintä nimeä",
        teksti: [
          `Ennen jäsenlinkin jakamista vetäjä voi kirjoittaa esikatseluun muutaman oikean selkänimen ja katsoa, miltä pisin nimi näyttää. Pitkä nimi painetaan pienemmällä, ja liian pitkä nimi ei mahdu selkään lainkaan, joten kaksiosainen nimi kannattaa lyhentää tai korvata lempinimellä. Näin kukaan ei yllätä itseään paitalaatikkoa avatessa.`,
          `Esikatselu näyttää myös numeron paikan nimen alla. Kun nimi ja numero mahtuvat selkään yhdessä, rivi hyväksytään heti, ja muuten työkalu pyytää lyhentämään nimeä ennen tallennusta.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Pitääkö lukion logon käyttöön kysyä lupa?",
        a: "Kyllä. Painakaa logoa vain, kun koulu on antanut siihen luvan. Ilman logoa etupuolelle sopii ryhmän nimi, vuosiluku ja oma tekstirivi.",
      },
    ],
    lahella: ["tampere", "kuopio", "seinajoki"],
    esimerkki: { nimi: "Jyväskylän abit", teksti: "Suomen Ateenasta maailmalle", jasenet: ["Veeti", "Helmi", "Alisa"] },
  },
  {
    slug: "kuopio",
    kaupunki: "Kuopio",
    inessiivi: "Kuopiossa",
    otsikko: "Abipaidat Kuopio: nimet ja numerot selkään",
    kuvaus: "Abipaidat kuopiolaisille abeille: etupuolelle porukan nimi, selkään nimi ja numero 0-99. Kokotaulukko jaetusta linkistä.",
    h1: "Abipaidat Kuopion penkkareihin",
    intro: [
      "Kuopion toria kutsutaan maailman navaksi, ja sama ajatus sopii abipaitaan: tänä keväänä vuosikurssi on oman maailmansa keskipiste. Etupuolelle tulee porukan nimi ja vuosiluku, selkään jokaisen nimi ja halutessa numero.",
      `Penkkarit ovat ${P}. Lukitkaa tilaus viimeistään ${T}, jotta paidat ehtivät perille.`,
    ],
    osiot: [
      {
        otsikko: "Numero nimen alle",
        teksti: [
          "Selkänumero on hauska lisä, vaikka kukaan ei pelaisi samassa joukkueessa. Numeroksi käy syntymäpäivä, kotitalon numero tai luku, joka liittyy porukan omaan juttuun. Numero painetaan isona nimen alle, ja se on valinnainen: kun rivi jää tyhjäksi, selkään tulee pelkkä nimi.",
          "Jokainen päättää numerostaan itse, joten kahdella abilla voi olla sama numero.",
        ],
      },
      {
        otsikko: "Puijolta torille",
        teksti: [
          "Puijon torni näkyy kauas Kallaveden yli, ja Kuopion Kauppatori on kaupungin keskipiste. Kun penkkariajelu kulkee torin laidalta, selkeä väri ja iso selkänimi erottuvat lavalta myös kauempana seisoville. Yhteiskuvan voi ottaa torilla ennen lähtöä, kun kaikki ovat vielä koolla.",
        ],
      },
      {
        otsikko: "Murre tekstiriville",
        teksti: [
          "Etupuolen tekstiriville sopii lause omalla murteella, kunhan se mahtuu riville ja koko porukka ymmärtää sen. Kokeilkaa muutamaa vaihtoehtoa esikatselussa ennen ryhmän luomista. Teksti painetaan versaaleilla, joten pitkä lause pienenee, ja lyhyt sanonta näkyy parhaiten kauempaa.",
        ],
      },
      {
        otsikko: "Vetäjän muistilista",
        teksti: [
          `Vetäjän muistilistalle riittää viisi kohtaa: etupuoli valmis, väri valittu, ryhmä luotu, linkki jaettu ja lukitus tehty viimeistään ${T}. Kun jokin kohta venyy, seuraava siirtyy, joten aloittakaa ensimmäisestä hyvissä ajoin ennen joulua. Hallintasivulla näkyvät rivit, koot ja maksut yhdessä paikassa.`,
          `Jokaisen kohdan voi hoitaa puhelimella, joten vetäjän ei tarvitse istua tietokoneen ääressä. Kirjoittakaa muistilista ryhmächattiin, niin muutkin näkevät, mitä on jo tehty ja mitä on vielä jäljellä.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Onko selkänumero pakollinen?",
        a: "Ei ole. Numero 0-99 on valinnainen, ja ilman sitä selkään painetaan pelkkä nimi tai lempinimi.",
      },
    ],
    lahella: ["jyvaskyla", "joensuu", "mikkeli"],
    esimerkki: { nimi: "Kuopion abit", teksti: "Maailman navalta eteenpäin", jasenet: ["Neea", "Topias", "Sofia"] },
  },
  {
    slug: "lahti",
    kaupunki: "Lahti",
    inessiivi: "Lahdessa",
    otsikko: "Abipaidat Lahti penkkareihin 2027",
    kuvaus: "Abipaidat lahtelaiselle vuosikurssille: aloittakaa ennen joulua, kerätkää koot linkillä ja lukitkaa tilaus ajoissa ennen penkkareita.",
    h1: "Lahden abipaidat",
    intro: [
      "Lahden hyppyrimäet ja radiomastot näkyvät kaupungin siluetissa kauas, ja samaa ajatusta kannattaa käyttää abipaidassa: iso ja selkeä teksti erottuu. Lahtelainen vuosikurssi suunnittelee paidan tällä sivulla, ja jokainen abi lisää selkänimensä itse.",
      `Penkkaripäivä on ${P} ja lukituksen takaraja ${T}.`,
    ],
    osiot: [
      {
        otsikko: "Aikataulu taaksepäin penkkareista",
        teksti: [
          `Laskekaa aikataulu lopusta alkuun. Paidat painetaan ja toimitetaan ${RYHMA_TOIMITUSAIKA} arkipäivässä lukituksesta, joten viimeinen lukituspäivä on ${T}. Sitä ennen kaikkien pitää ehtiä täyttää rivinsä, joten antakaa jäsenille oma takaraja viikkoa aiemmin. Etupuolen suunnittelu ja värin valinta mahtuvat hyvin joulukuuhun.`,
        ],
      },
      {
        otsikko: "Vesijärven rannalla",
        teksti: [
          "Lahden satama ja Vesijärven ranta ovat kuvauspaikkoja, joissa talvinen järvimaisema näkyy taustalla. Koko vuosikurssin kuva onnistuu ennen ajelun alkua, kun kaikilla on sama paita päällä ja kukaan ei ole vielä ehtinyt kadota karkkien perään.",
        ],
      },
      {
        otsikko: "Kun joku jää pois",
        teksti: [
          "Suunnitelmat muuttuvat, ja joskus abi jättää penkkarit väliin. Vetäjä poistaa hänen rivinsä hallintasivulta ennen lukitusta, ja jo maksettu paita palautetaan maksukortille. Paikkojen määrää voi myös muuttaa, jotta tilaus lähtee painoon heti, kun loput ovat maksaneet.",
          "Tämä pitää kokotaulukon ajan tasalla ilman, että kenenkään tarvitsee selitellä viestiketjussa.",
        ],
      },
      {
        otsikko: "Hiihtokaupungin sanaleikit",
        teksti: [
          `Lahti tunnetaan hiihdon ja mäkihypyn kaupunkina, ja urheiluteema sopii etupuoleen: Lähtöviiva ylitetty, Viimeinen hyppy lukiosta tai Maaliin asti. Urheilusanasto on kaikille tuttua, joten vitsi aukeaa myös niille, jotka eivät itse hiihdä. Tunnettujen seurojen tai kisojen nimiä ja logoja ei paineta, joten kirjoittakaa oma versio.`,
          `Urheiluvitsi toimii myös selässä: jäsen voi valita numeroksi oman ennätysmatkansa kilometrit hiihtoladulla tai muun luvun harrastuksestaan, kunhan se on välillä 0-99.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Mihin mennessä jäsenten pitää täyttää kokotaulukko?",
        a: `Ennen kuin vetäjä lukitsee tilauksen. Viimeinen lukituspäivä on ${T}, joten sopikaa jäsenille oma takaraja noin viikkoa aiemmin.`,
      },
    ],
    lahella: ["hameenlinna", "porvoo", "kotka"],
    esimerkki: { nimi: "Lahden abit", teksti: "Hypätään kohti kevättä", jasenet: ["Julia", "Eemeli", "Kerttu"] },
  },
  {
    slug: "pori",
    kaupunki: "Pori",
    inessiivi: "Porissa",
    otsikko: "Abipaidat Pori: porukan oma teksti eteen",
    kuvaus: "Abipaidat porilaisille abeille: oma teksti etupuolelle, nimi selkään ja kokotaulukko jaetusta linkistä. Katso, mitä paitaan voi painaa.",
    h1: "Abipaidat Porin penkkareihin",
    intro: [
      "Porin abit voivat tuoda kotikaupungin paitaan monella tavalla: Kokemäenjoki, Yyterin hiekkarannat tai porukan oma sisäpiirin vitsi sopivat etupuolelle, ja selkään tulee jokaisen nimi. Tällä sivulla porilainen vuosikurssi suunnittelee paidan ja kerää koot yhteen taulukkoon.",
      `Penkkarit ovat ${P}, ja tilaus lukitaan viimeistään ${T}.`,
    ],
    osiot: [
      {
        otsikko: "Mitä paitaan voi painaa",
        teksti: [
          "Etupuolelle ja selkään painetaan omaa tekstiä. Kirosanoja, tuotemerkkejä ja tunnettujen joukkueiden nimiä tai logoja ei paineta, joten paikallisen jääkiekkojoukkueen nimi tai tunnus ei käy, vaikka se olisi koko porukan yhteinen juttu. Oma sanaleikki on teidän omanne, eikä sitä ole kenelläkään muulla.",
          "Tarkistus tehdään jo suunnitteluvaiheessa, joten kielletty sana näkyy heti ilmoituksena eikä vasta tilauksen jälkeen.",
        ],
      },
      {
        otsikko: "Ajelu Porin keskustassa",
        teksti: [
          "Porin keskusta on tiivis, ja Kauppatori ja Kokemäenjoen ranta ovat lähellä toisiaan. Kun penkkariajelu kulkee keskustassa, lava liikkuu hitaasti, ja selkänimet ehtii lukea jalkakäytävältä. Lyhyt nimi isolla painettuna toimii paremmin kuin pitkä nimi pienellä.",
        ],
      },
      {
        otsikko: "Värin valinta",
        teksti: [
          "Valitkaa väri, joka näkyy talvisessa kaupungissa. Esikatselu näyttää, miltä etupuolen teksti ja selkänimi näyttävät valitulla värillä, ja tummalla paidalla teksti painetaan valkoisena, vaalealla mustana. Ottakaa esikatselusta kuva ryhmälle ennen kuin vetäjä luo ryhmän.",
        ],
      },
      {
        otsikko: "Kaikki koot samaan tilaukseen",
        teksti: [
          `Samaan tilaukseen mahtuvat kaikki koot, ja jokainen maksaa oman kokonsa hinnan. Koot 3XL-5XL maksavat hieman enemmän, mutta se ei muuta muiden hintaa. Väri on kaikille sama, ja koko valitaan vasta omalle riville, joten kenenkään ei tarvitse kertoa kokoaan ryhmächatissa.`,
          `Määräalennus koskee kaikkia kokoja. Kun ryhmä kasvaa seuraavaan portaaseen, myös isoimpien kokojen hinta laskee yhtä paljon kuin muiden, ja erotus palautetaan samalla tavalla maksukortille.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Voiko abipaitaan painaa jääkiekkojoukkueen logon?",
        a: "Ei voi. Tunnettujen joukkueiden nimiä, logoja ja muita tuotemerkkejä ei paineta. Kirjoittakaa tilalle porukan oma teksti.",
      },
    ],
    lahella: ["turku", "tampere"],
    esimerkki: { nimi: "Porin abit", teksti: "Yyteristä ylioppilaiksi", jasenet: ["Milla", "Joona", "Anni"] },
  },
];
