/**
 * Abipaitojen kaupunkisivut, osa B: Joensuu, Lappeenranta, Hämeenlinna, Vaasa, Seinäjoki, Rovaniemi, Mikkeli, Kotka,
 * Salo ja Porvoo. Muoto ja tekstisäännöt: ./tyypit.ts.
 */
import type { AbiKaupunkiSisalto } from "./tyypit";
import {
  ABI_TAKARAJA_TEKSTI as T, PENKKARIT_TEKSTI as P, RYHMA_TOIMITUSAIKA, RYHMA_MIN_KPL, RYHMA_MAX_KPL, RYHMA_NIMI_MAX, RYHMA_PORTAAT,
  RYHMA_HINTALAUSE,
} from "../ryhmapaidat";
import { RYHMA_VARIT } from "../../../api/_lib/ryhmatilaus.js";

const [PIENI, ALENNUS] = RYHMA_PORTAAT;
const varit = (RYHMA_VARIT as string[]).map((v) => v.toLocaleLowerCase("fi"));
/** "musta, valkoinen, vaaleanharmaa ja tummansininen" (api/_lib/ryhmatilaus.js RYHMA_VARIT). */
const VARIT = `${varit.slice(0, -1).join(", ")} ja ${varit[varit.length - 1]}`;

export const KAUPUNGIT_B: AbiKaupunkiSisalto[] = [
  {
    slug: "joensuu",
    kaupunki: "Joensuu",
    inessiivi: "Joensuussa",
    otsikko: "Abipaidat Joensuu: vetäjä kokoaa porukan",
    kuvaus: "Abipaidat joensuulaisille abeille: yksi vetäjä luo ryhmän, muut täyttävät nimen ja koon puhelimella. Paidat yhteen osoitteeseen.",
    h1: "Abipaidat Joensuun abeille",
    intro: [
      "Joensuu on opiskelijakaupunki Pielisjoen varrella, ja abikevät on viimeinen kevät lukiossa ennen seuraavaa vaihetta. Abipaita kokoaa vuosikurssin samaan väriin, ja tällä sivulla sen suunnittelee ja tilaa koko porukalle yhdellä linkillä.",
      `Penkkarit ovat ${P}. Viimeinen lukituspäivä on ${T}.`,
    ],
    osiot: [
      {
        otsikko: "Kuka ryhtyy vetäjäksi",
        teksti: [
          "Ryhmällä on yksi vetäjä, ja hänen osoitteeseensa tulevat kaikki paidat. Valitkaa vetäjäksi abi, joka lukee ryhmächattia päivittäin ja ehtii jakaa paidat koululla heti, kun laatikko on tullut. Vetäjän ei tarvitse olla abitoimikunnan jäsen, kunhan hän hoitaa asian loppuun.",
          "Vetäjä antaa nimensä, sähköpostinsa, puhelinnumeronsa ja toimitusosoitteen. Jäsenistä tallennetaan vain selkään painettava nimi, valinnainen numero, koko ja tieto maksusta.",
        ],
      },
      {
        otsikko: "Torilta Pielisjoen rantaan",
        teksti: [
          "Joensuun keskusta on kävelymatkan kokoinen, ja Kauppatorilta pääsee muutamassa minuutissa Pielisjoen rantaan. Siellä vuosikurssin yhteiskuva onnistuu ennen ajelua tai sen jälkeen, ja talvinen joki tuo kuvaan väljyyttä. Tumma paita erottuu lumisesta rannasta selvästi.",
        ],
      },
      {
        otsikko: "Jäsenen näkökulma",
        teksti: [
          "Jäsen ei tarvitse tunnuksia eikä sovellusta. Hän avaa linkin puhelimella, kirjoittaa selkänimen ja valitsee koon, ja kun jokainen maksaa itse, maksu hoituu samassa näkymässä kortilla. Kuitti tulee maksunvälittäjältä sähköpostiin. Nimen, numeron ja koon voi korjata omasta linkistä niin kauan kuin tilaus on auki.",
        ],
      },
      {
        otsikko: "Itäinen murre etupuoleen",
        teksti: [
          `Etupuolen tekstiriville sopii itäinen murre, esimerkiksi Myö valmistutaan, tai porukan oma sanonta, joka kuulostaa Joensuulta. Lyhyt murrelause painetaan isolla, ja sen ymmärtää jokainen, joka on kuullut sitä koulun käytävillä. Kokeilkaa esikatselussa, mahtuuko lause yhdelle riville.`,
          `Murresana toimii paidalla, kun sen ympärillä ei ole paljon muuta tekstiä. Pitäkää ryhmän nimi lyhyenä, niin murrelause saa tilaa ja näkyy kauas.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Tarvitseeko jäsenen luoda tunnukset?",
        a: "Ei tarvitse. Jäsen avaa vetäjän jakaman linkin, kirjoittaa nimensä ja koon ja maksaa tarvittaessa saman näkymän kautta.",
      },
    ],
    lahella: ["kuopio", "mikkeli", "lappeenranta"],
    esimerkki: { nimi: "Joensuun abit", teksti: "Joen varrelta eteenpäin", jasenet: ["Inka", "Valtteri", "Jenna"] },
  },
  {
    slug: "lappeenranta",
    kaupunki: "Lappeenranta",
    inessiivi: "Lappeenrannassa",
    otsikko: "Abipaidat Lappeenranta penkkareihin 2027",
    kuvaus: "Abipaidat lappeenrantalaiselle vuosikurssille: jokainen valitsee koon ja nimen itse, ja vetäjä näkee kaiken yhdeltä sivulta.",
    h1: "Abipaidat Lappeenrannan penkkareihin",
    intro: [
      "Lappeenranta on Saimaan rantakaupunki, ja Linnoituksen vanhat rakennukset sataman vieressä ovat sen tuttua maisemaa. Abipaita sopii siihen kuvaan siinä missä muuallekin: koko vuosikurssi samassa värissä, etupuolella porukan nimi ja selässä jokaisen oma nimi.",
      `Penkkarit ovat ${P}, ja tilauksen viimeinen lukituspäivä on ${T}.`,
    ],
    osiot: [
      {
        otsikko: "Kokotaulukko ilman arvailua",
        teksti: [
          "Kokojen kerääminen on tilauksen hitain osa, kun sitä tehdään viestiketjussa. Kokotaulukossa jokainen valitsee koon itse, ja vetäjä näkee yhdellä silmäyksellä, montako S-, M- ja L-kokoa porukka tarvitsee. Verratkaa kokoa omaan hyvin istuvaan t-paitaan ennen valintaa, niin vaihtoja ei tarvita.",
        ],
      },
      {
        otsikko: "Linnoitukselta satamaan",
        teksti: [
          "Linnoituksen kadut ja sataman ranta ovat Lappeenrannan keskustan kuvauspaikkoja myös talvella. Vanhat puu- ja kivirakennukset antavat yhteiskuvalle taustan, joka näyttää Lappeenrannalta eikä miltä tahansa koulun pihalta. Sopikaa kuvauspaikka etukäteen, niin koko porukka on siellä samaan aikaan.",
        ],
      },
      {
        otsikko: "Kun koko pitää vaihtaa",
        teksti: [
          "Jäsen voi korjata nimensä, numeronsa ja kokonsa niin kauan kuin tilaus on auki. Koon voi vaihtaa ennen maksua. Kun rivi on jo maksettu ja koko on väärä, vetäjä poistaa rivin, maksu palautetaan ja jäsen täyttää uuden rivin oikealla koolla.",
          `Lukituksen jälkeen rivejä ei voi muuttaa, joten tarkistakaa koot viimeistään viikkoa ennen ${T}.`,
        ],
      },
      {
        otsikko: "Väri ja teksti yhteen",
        teksti: [
          `Valittavana on ${VARIT}. Tumma paita saa valkoisen tekstin ja vaalea mustan, joten luettavuus pysyy hyvänä väristä riippumatta. Tummansininen sopii Saimaan rantakaupunkiin, musta näyttää juhlavalta ja valkoinen erottuu talvisesta kadusta. Esikatselu näyttää lopputuloksen ennen kuin ryhmä luodaan.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Voiko abipaidan koon vaihtaa maksun jälkeen?",
        a: "Voi ennen lukitusta. Vetäjä poistaa maksetun rivin, maksu palautetaan kortille, ja jäsen täyttää uuden rivin oikealla koolla.",
      },
    ],
    lahella: ["kotka", "mikkeli", "joensuu"],
    esimerkki: { nimi: "Lappeenrannan abit", teksti: "Linnoituksesta lakkiin", jasenet: ["Aava", "Rasmus", "Ella"] },
  },
  {
    slug: "hameenlinna",
    kaupunki: "Hämeenlinna",
    inessiivi: "Hämeenlinnassa",
    otsikko: "Abipaidat Hämeenlinna: väri ja teksti",
    kuvaus: "Abipaidat hämeenlinnalaisille abeille: valitkaa väri esikatselulla, kirjoittakaa porukan nimi eteen ja jokaisen nimi selkään.",
    h1: "Hämeenlinnan abipaidat",
    intro: [
      "Hämeenlinna on Jean Sibeliuksen syntymäkaupunki, ja Vanajaveden rannalla seisova Hämeen linna on antanut kaupungille nimen. Abivuoden päätteeksi vuosikurssi tarvitsee oman tunnuksen, ja tällä sivulla se suunnitellaan paidaksi, jonka selkään jokainen kirjoittaa oman nimensä.",
      `Penkkarit ovat ${P}. Lukitkaa tilaus viimeistään ${T}.`,
    ],
    osiot: [
      {
        otsikko: "Väri ensin",
        teksti: [
          "Värivalinta herättää porukassa eniten keskustelua, joten tehkää se ensimmäisenä. Suunnittelutyökalu näyttää etu- ja selkäpuolen esikatselun jokaisella värillä. Ottakaa kaksi tai kolme vaihtoehtoa kuvakaappauksina ryhmächattiin ja äänestäkää. Vetäjä valitsee voittaneen värin, kun hän luo ryhmän, ja sama väri tulee kaikille.",
        ],
      },
      {
        otsikko: "Linnan pihalta",
        teksti: [
          "Hämeen linnan ympäristö ja Vanajaveden ranta ovat kuvauspaikkoja, joissa koko vuosikurssi mahtuu samaan kuvaan. Linnan punatiiliset muurit erottuvat talvella lumen keskeltä, ja valkoinen paita erottuu niiden edessä selvästi. Kuva kannattaa ottaa päivänvalossa ennen ajelua.",
        ],
      },
      {
        otsikko: "Teksti, joka kestää",
        teksti: [
          "Etupuolen tekstirivi jää muistoksi vuosiksi. Sisäpiirin vitsi naurattaa vielä luokkakokouksessa, kun taas ajankohtainen meemi on unohtunut jo seuraavana syksynä. Kirjoittakaa siis jotain, mikä kertoo juuri teidän vuosikurssistanne: yhteinen sanonta, opettajan lausahdus tai luokkaretken tapahtuma.",
        ],
      },
      {
        otsikko: "Penkkaripäivän aamu",
        teksti: [
          `Sopikaa, että jokainen pukee paidan päälle jo kotona tai koululla ennen lähtöä. Paidat jaetaan vetäjältä viimeistään edellisellä viikolla, jotta kenenkään ei tarvitse etsiä omaansa aamulla kiireessä. Laatikossa paidat on helppo jakaa selkänimen perusteella, eikä ylimääräisiä tule, koska jokainen paita painetaan kokotaulukon rivistä.`,
          `Varatkaa muutama minuutti yhteiseen pukeutumiseen ja ottakaa ensimmäinen kuva jo koulun pihalla. Kun kaikilla on samat paidat, kuvasta näkee heti, että siinä on teidän vuosikurssinne eikä satunnainen joukko talvitakkeja.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Miten abiporukka valitsee paidan värin?",
        a: "Katsokaa esikatselu eri väreillä ja jakakaa vaihtoehdot ryhmälle. Vetäjä valitsee lopullisen värin, kun hän luo ryhmän, ja sama väri tulee kaikille.",
      },
    ],
    lahella: ["tampere", "lahti", "helsinki"],
    esimerkki: { nimi: "Hämeenlinnan abit", teksti: "Linnan muurien takaa", jasenet: ["Minea", "Akseli", "Peppi"] },
  },
  {
    slug: "vaasa",
    kaupunki: "Vaasa",
    inessiivi: "Vaasassa",
    otsikko: "Abipaidat Vaasa: suomeksi tai ruotsiksi",
    kuvaus: "Abipaidat vaasalaisille abeille: teksti suomeksi tai ruotsiksi, jokaisen nimi selkään ja kokotaulukko jaetusta linkistä.",
    h1: "Abipaidat Vaasan penkkareihin",
    intro: [
      "Vaasa on kaksikielinen kaupunki, jossa suomi ja ruotsi kuuluvat arkeen. Abipaidan etupuolen voi kirjoittaa kummalla kielellä tahansa tai molemmilla: ryhmän nimi suomeksi ja tekstirivi ruotsiksi, tai toisin päin.",
      `Penkkarit ovat ${P}. Tilaus lukitaan viimeistään ${T}, jonka jälkeen paidat painetaan.`,
    ],
    osiot: [
      {
        otsikko: "Kaksi kieltä samassa paidassa",
        teksti: [
          "Tekstirivi painetaan juuri niin kuin sen kirjoitatte, myös å-, ä- ja ö-kirjaimet. Selkänimissä kieli ei ratkaise: jokainen kirjoittaa nimensä niin kuin sitä käyttää, olipa se Saga, Sanni tai Sebastian.",
          "Kokeilkaa esikatselussa, kumpi kieli näyttää etupuolella paremmalta. Lyhyempi teksti painetaan isommalla, joten tiivis muotoilu näkyy kauemmas.",
        ],
      },
      {
        otsikko: "Merenkurkun kaupunki",
        teksti: [
          "Vaasan edustalla on Merenkurkun saaristo, joka kuuluu Unescon maailmanperintöluetteloon. Meri on lähellä keskustaa, ja rannan talvinen maisema sopii vuosikurssin yhteiskuvan taustaksi.",
        ],
      },
      {
        otsikko: "Kaksi lukiota, sama paita",
        teksti: [
          "Kun kahden lukion abit haluavat samanlaiset paidat, kumpikin lukio perustaa oman ryhmänsä samalla etupuolella. Silloin kummallakin on oma vetäjä, oma kokotaulukko ja oma toimitusosoite, eikä yhden porukan myöhästely viivästytä toista. Määräalennus lasketaan kummallekin ryhmälle erikseen sen omasta paitamäärästä.",
        ],
      },
      {
        otsikko: "Viimeinen yhteinen asu",
        teksti: [
          `Vaasassa toimii useita korkeakouluja suomeksi ja ruotsiksi, joten osa abeista jää kaupunkiin opiskelemaan ja osa lähtee muualle. Abipaita on viimeinen yhteinen asu ennen kuin tiet erkanevat, ja selkänimi muistuttaa vuosienkin päästä, kuka kuvassa seisoi kenenkin vieressä.`,
          `Kun osa porukasta lähtee syksyllä muualle, kokotaulukon nimet ovat myös muistilista siitä, ketkä olivat mukana abikeväänä. Vetäjä voi kopioida nimet talteen hallintasivulta ennen kuin kaikki hajaantuvat.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Voiko abipaitaan kirjoittaa ruotsiksi?",
        a: "Voi. Ryhmän nimi, tekstirivi ja selkänimet painetaan sellaisina kuin ne kirjoitetaan, myös å-kirjaimen kanssa.",
      },
    ],
    lahella: ["seinajoki", "pori"],
    esimerkki: { nimi: "Vaasan abit", teksti: "Snart studenter", jasenet: ["Ebba", "Oskari", "Linnea"] },
  },
  {
    slug: "seinajoki",
    kaupunki: "Seinäjoki",
    inessiivi: "Seinäjoella",
    otsikko: "Abipaidat Seinäjoki: pienikin porukka",
    kuvaus: "Abipaidat seinäjokisille abeille: ryhmätilaus alkaa viidestä paidasta, ja määräalennus kasvaa, kun mukaan tulee lisää abeja.",
    h1: "Abipaidat Seinäjoen abeille",
    intro: [
      "Seinäjoen keskustassa Alvar Aallon suunnittelema Aalto-keskus ja Lakeuden Ristin kirkontorni ovat kaupungin tunnettuja maamerkkejä. Abipaidan voi tilata koko vuosikurssille tai pienemmälle porukalle, esimerkiksi omalle luokalle tai kaveriporukalle, ja jokainen saa selkäänsä oman nimensä.",
      `Penkkarit ovat ${P}. Viimeinen lukituspäivä on ${T}.`,
    ],
    osiot: [
      {
        otsikko: "Pienikin ryhmä riittää",
        teksti: [
          `Ryhmätilaus alkaa ${RYHMA_MIN_KPL} paidasta, joten kaveriporukkakin saa omat paidat. ${RYHMA_HINTALAUSE}`,
        ],
      },
      {
        otsikko: "Lakeuden Ristin juurella",
        teksti: [
          "Aalto-keskuksen valkoiset rakennukset ja Lakeuden Ristin korkea torni sopivat yhteiskuvan taustaksi, ja avara aukio tekee kuvasta väljän. Musta tai tummansininen paita erottuu valkoista arkkitehtuuria vasten paremmin kuin valkoinen.",
        ],
      },
      {
        otsikko: "Kaveriporukka vai koko vuosikurssi",
        teksti: [
          `Pienen porukan etu on nopeus: viisi kaveria sopii etupuolen tekstistä yhdessä illassa. Koko vuosikurssin tilaus vaatii enemmän aikaa, mutta yhtenäinen väri näkyy ajelulla. Kun ryhmässä on ${ALENNUS.min} paitaa tai enemmän, jokainen maksaa ${ALENNUS.hintaTeksti} eikä ${PIENI.hintaTeksti}, ja jo maksaneet saavat erotuksen takaisin, kun tilaus lähtee painoon.`,
        ],
      },
      {
        otsikko: "Kun vetäjä maksaa kaikki",
        teksti: [
          `Pienessä porukassa vetäjä voi maksaa kaikki paidat kerralla ja kerätä osuudet kavereilta itse. Silloin jäsenet täyttävät vain nimen ja koon, ja tilaus lukitaan yhdellä maksulla. Isommassa ryhmässä on helpompaa, että jokainen maksaa omansa jaetusta linkistä.`,
          `Kun vetäjä maksaa, tilaus lukitaan maksun yhteydessä, joten kokotaulukon pitää olla valmis ennen sitä. Tarkistakaa nimet ja koot yhdessä, ja maksakaa vasta sitten.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Montako paitaa ryhmätilaukseen tarvitaan?",
        a: `Vähintään ${RYHMA_MIN_KPL} ja enintään ${RYHMA_MAX_KPL} paitaa. Pienikin kaveriporukka voi siis tilata omat abipaidat.`,
      },
    ],
    lahella: ["vaasa", "tampere", "jyvaskyla"],
    esimerkki: { nimi: "Seinäjoen abit", teksti: "Lakeuden kasvatit", jasenet: ["Hilla", "Konsta", "Viivi"] },
  },
  {
    slug: "rovaniemi",
    kaupunki: "Rovaniemi",
    inessiivi: "Rovaniemellä",
    otsikko: "Abipaidat Rovaniemi: penkkarit napapiirillä",
    kuvaus: "Abipaidat rovaniemeläisille abeille: suunnittelu ja kokotaulukko verkossa, ja paidat toimitetaan vetäjän osoitteeseen Rovaniemelle.",
    h1: "Abipaidat Rovaniemen penkkareihin",
    intro: [
      "Napapiiri kulkee Rovaniemen keskustan pohjoispuolelta, ja Ounasjoki ja Kemijoki yhtyvät aivan kaupungin kohdalla. Lappilainen abivuosi ansaitsee paidan, jossa on kotikaupungin tunnus: vaikkapa Napapiirin abit tai porukan oma juttu, ja selässä jokaisen nimi.",
      `Penkkarit ovat ${P}, ja tilaus lukitaan viimeistään ${T}.`,
    ],
    osiot: [
      {
        otsikko: "Toimitus Lappiin",
        teksti: [
          `Paidat painetaan tilauksesta ja toimitetaan vetäjän osoitteeseen ${RYHMA_TOIMITUSAIKA} arkipäivässä lukituksesta. Toimitus sisältyy paidan hintaan, eikä Rovaniemelle tule lisämaksua. Vetäjä jakaa paidat koululla, joten kenenkään ei tarvitse odottaa omaa pakettiaan tai hakea sitä noutopisteestä.`,
        ],
      },
      {
        otsikko: "Jätkänkynttilältä Lordin aukiolle",
        teksti: [
          "Jätkänkynttilä-silta ylittää Kemijoen, ja Lordin aukio on keskustan kävelyalueen sydän. Talvella lumi heijastaa valoa, ja musta tai tummansininen abipaita erottuu valkoista taustaa vasten yhteiskuvassa. Ottakaa kuva päivällä, sillä helmikuussa valoisa aika on vielä lyhyempi kuin etelässä.",
        ],
      },
      {
        otsikko: "Etupuolen ideoita",
        teksti: [
          `Etupuolelle sopii lyhyt ja selkeä teksti: Napapiirin abit, Lapin abit tai Revontulten alta. Ryhmän nimeen mahtuu ${RYHMA_NIMI_MAX} merkkiä ja tekstiriville lyhyt lause. Kokeilkaa esikatselussa, kumpi järjestys näyttää paremmalta, ja valitkaa se, jonka koko porukka hyväksyy.`,
        ],
      },
      {
        otsikko: "Pitkät koulumatkat",
        teksti: [
          `Rovaniemi on pinta-alaltaan laaja kaupunki, ja kaikki abit eivät näe toisiaan joka päivä. Kokotaulukko toimii netissä, joten rivin voi täyttää kotona, bussissa tai harrastuksen jälkeen, eikä kenenkään tarvitse tulla koululle kokoa varten. Vetäjä näkee hallintasivulta, kuka on jo täyttänyt rivinsä, ja muistuttaa vain niitä, joilta se puuttuu.`,
          `Lukitkaa tilaus mieluummin muutama päivä ennen viimeistä päivää, niin aikataulussa on väljyyttä sairastumisen tai kokovaihdon varalle. Takaraja ${T} on viimeinen mahdollinen päivä, ei tavoite.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Toimitetaanko abipaidat Rovaniemelle?",
        a: `Toimitetaan. Kaikki paidat tulevat vetäjän osoitteeseen ${RYHMA_TOIMITUSAIKA} arkipäivässä siitä, kun tilaus lähtee painoon.`,
      },
    ],
    lahella: ["oulu", "kuopio"],
    esimerkki: { nimi: "Napapiirin abit", teksti: "Revontulten alta", jasenet: ["Aili", "Joel", "Senni"] },
  },
  {
    slug: "mikkeli",
    kaupunki: "Mikkeli",
    inessiivi: "Mikkelissä",
    otsikko: "Mikkelin abipaidat omilla nimillä",
    kuvaus: "Abipaidat mikkeliläisille abeille: miten tilaus lukitaan, mitä maksamattomille riveille tapahtuu ja milloin paidat ovat perillä.",
    h1: "Mikkelin abipaidat penkkareihin",
    intro: [
      "Mikkeli on Saimaan kaupunki, ja Naisvuoren näkötornista näkee keskustan yli järvelle. Mikkeliläisen vuosikurssin abipaita suunnitellaan tällä sivulla, ja jokainen abi kirjoittaa siihen oman selkänimensä jaetusta linkistä.",
      `Penkkarit ovat ${P}. Tilauksen viimeinen lukituspäivä on ${T}.`,
    ],
    osiot: [
      {
        otsikko: "Lukitus käytännössä",
        teksti: [
          "Lukitus tarkoittaa, että tilaus lähtee painoon eikä rivejä voi enää muuttaa. Kun jokainen maksaa itse, lukitus tapahtuu automaattisesti viimeisen maksun jälkeen. Vetäjä voi lukita aiemmin, ja silloin hän päättää, jäävätkö maksamattomat rivit pois vai maksaako hän ne itse.",
        ],
      },
      {
        otsikko: "Kauppatori kuvauspaikkana",
        teksti: [
          "Mikkelin keskustassa Kauppatorin ympärillä on tilaa koko vuosikurssin yhteiskuvalle ennen kuin lava lähtee liikkeelle. Naisvuoren rinteeltä näkee kaupungin yli, ja sieltä saa kuvan, jossa taustalla on koko keskusta. Sopikaa kuvaaja etukäteen, jotta jokainen pääsee itse kuvaan.",
        ],
      },
      {
        otsikko: "Palautus ja tarkistus",
        teksti: [
          "Omalla nimellä painetulla paidalla ei ole 14 päivän palautusoikeutta, koska se tehdään yhdelle ihmiselle. Siksi nimien ja kokojen tarkistus kannattaa tehdä yhdessä ennen lukitusta: vetäjä käy kokotaulukon läpi, ja jokainen vahvistaa ryhmächatissa, että oma rivi on oikein.",
        ],
      },
      {
        otsikko: "Keskustasta Ristiinaan",
        teksti: [
          `Mikkeliin kuuluvat myös Ristiina, Haukivuori ja Suomenniemi, joten samassa vuosikurssissa voi olla abeja kaukaakin keskustasta. Jäsenlinkin avulla jokainen täyttää rivinsä kotoa, ja paidat tulevat kaikki vetäjälle. Sopikaa paitojen jakamisesta koululla, niin kenenkään ei tarvitse ajaa erikseen hakemaan omaansa.`,
          `Kun jakopäivä on sovittu, kertokaa se ryhmächatissa samalla viestillä kuin lukitus. Silloin jokainen tietää, milloin oma paita on saatavilla, eikä vetäjän tarvitse vastata samaan kysymykseen kymmeniä kertoja.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Voiko tilauksen lukita ennen kuin kaikki ovat maksaneet?",
        a: "Voi. Vetäjä lukitsee tilauksen hallintasivulta, ja maksamattomat rivit jäävät pois tai vetäjä maksaa ne lukituksen yhteydessä.",
      },
    ],
    lahella: ["kuopio", "lappeenranta", "lahti"],
    esimerkki: { nimi: "Mikkelin abit", teksti: "Saimaalta suoraan kevääseen", jasenet: ["Tuuli", "Lauri", "Eveliina"] },
  },
  {
    slug: "kotka",
    kaupunki: "Kotka",
    inessiivi: "Kotkassa",
    otsikko: "Abipaidat Kotka: satamakaupungin abit",
    kuvaus: "Abipaidat kotkalaisille abeille: määräalennus laskee hintaa porukan kasvaessa, ja jo maksaneet saavat erotuksen takaisin kortilleen.",
    h1: "Abipaidat Kotkan abeille",
    intro: [
      "Kotka on satamakaupunki Kymijoen suulla, ja Sapokan vesipuisto on keskustan tunnettu kohde meren rannalla. Abipaita kotkalaiselle vuosikurssille suunnitellaan tällä sivulla yhdessä, ja jokainen lisää oman nimensä selkään.",
      `Penkkarit ovat ${P}, ja tilaus lukitaan viimeistään ${T}.`,
    ],
    osiot: [
      {
        otsikko: "Näin määräalennus toimii",
        teksti: [
          `Hinta riippuu siitä, montako paitaa tilaukseen lopulta tulee. Jokainen jäsen maksaa aluksi ${PIENI.hintaTeksti}, ja kun tilaus lähtee painoon, hinta lasketaan uudelleen. Kun paitoja on ${ALENNUS.min} tai enemmän, erotus palautetaan jokaisen maksukortille automaattisesti. Kenenkään ei tarvitse laskea mitään itse.`,
        ],
      },
      {
        otsikko: "Merellinen teksti",
        teksti: [
          "Merellinen sanaleikki sopii kotkalaiseen etupuoleen: Ankkuri nostettu, Kohti avomerta tai Satamasta maailmalle. Lyhyt lause painetaan isolla, ja se näkyy lavalta kauas. Kun porukalla on oma sisäpiirin vitsi merestä, satamasta tai koulumatkasta, sekin sopii tekstiriville.",
        ],
      },
      {
        otsikko: "Paidat jakoon koululla",
        teksti: [
          "Kaikki paidat toimitetaan vetäjän osoitteeseen, ja vetäjä jakaa ne koululla tai sovitussa paikassa ennen penkkareita. Selkänimi kertoo heti, kenen paita on kyseessä, joten jakaminen sujuu nopeasti. Varatkaa jakamiselle välitunti, jolloin mahdollisimman moni on paikalla.",
        ],
      },
      {
        otsikko: "Kaksi linkkiä",
        teksti: [
          `Ryhmällä on kaksi linkkiä. Jäsenlinkki jaetaan koko porukalle, ja sillä täytetään omat rivit. Hallintalinkki on vain vetäjälle: sillä muutetaan paikkamäärää, poistetaan rivejä ja lukitaan tilaus. Pitäkää hallintalinkki tallessa älkääkä jakako sitä ryhmächattiin, niin kukaan ei lukitse tilausta vahingossa.`,
          `Hallintalinkki lähetetään vetäjän sähköpostiin ryhmää luotaessa, joten se löytyy sieltä, vaikka selaimen välilehti sulkeutuisi. Jäsenlinkin voi jakaa uudelleen niin monta kertaa kuin tarvitsee.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Saako jo maksanut abi rahaa takaisin, kun ryhmä kasvaa?",
        a: "Saa. Hinta lasketaan lopullisesta paitamäärästä, kun tilaus lähtee painoon, ja erotus palautetaan maksukortille.",
      },
    ],
    lahella: ["lappeenranta", "porvoo", "lahti"],
    esimerkki: { nimi: "Kotkan abit", teksti: "Ankkuri nostettu", jasenet: ["Nella", "Miro", "Pihla"] },
  },
  {
    slug: "salo",
    kaupunki: "Salo",
    inessiivi: "Salossa",
    otsikko: "Abipaidat Salo penkkareihin 2027",
    kuvaus: "Abipaidat salolaisille abeille: suunnitelkaa etupuoli yhdessä, jakakaa linkki ja lisätkää paikkoja, kun mukaan tulee uusia abeja.",
    h1: "Salon abipaidat",
    intro: [
      "Salo sijaitsee Uskelanjoen varrella Varsinais-Suomessa, Turun ja Helsingin välissä. Salolaisen vuosikurssin abipaita kootaan tällä sivulla: yhteinen etupuoli, jokaisen oma nimi selässä ja koot samassa taulukossa.",
      `Penkkarit ovat ${P}. Lukitkaa tilaus viimeistään ${T}.`,
    ],
    osiot: [
      {
        otsikko: "Kun joku ilmoittautuu myöhään",
        teksti: [
          "Vetäjä päättää ryhmää luodessaan, montako paikkaa kokotaulukossa on. Kun taulukko täyttyy ja joku haluaa vielä mukaan, vetäjä lisää paikkoja hallintasivulta, ja uusi jäsen täyttää rivinsä samasta linkistä. Paikkamäärä ratkaisee myös, milloin tilaus lähtee painoon itsestään: heti kun kaikki paikat on maksettu.",
        ],
      },
      {
        otsikko: "Uskelanjoen rannalla",
        teksti: [
          "Uskelanjoen ranta keskustan kohdalla sopii yhteiskuvalle ennen ajelua. Pienemmässä kaupungissa koko vuosikurssi tuntee toisensa, ja samat paidat tekevät kuvasta sellaisen, jonka jokainen haluaa talteen. Sopikaa kuvaushetki ennen lähtöä, kun kaikki ovat vielä paikalla.",
        ],
      },
      {
        otsikko: "Etupuolen suunnittelu yhdessä",
        teksti: [
          "Avatkaa suunnittelutyökalu yhdellä näytöllä välitunnilla ja kokeilkaa tekstejä yhdessä. Esikatselu päivittyy heti, kun tekstiä muuttaa, joten muutama vaihtoehto syntyy minuuteissa. Kun teksti on päätetty, vetäjä luo ryhmän samasta näkymästä ja jakaa jäsenlinkin eteenpäin.",
        ],
      },
      {
        otsikko: "Koot värin mukaan",
        teksti: [
          `Valitkaa väri ensin ja tarkistakaa, että kaikki tarvittavat koot löytyvät. Kokotaulukko näyttää valitulle värille saatavilla olevat koot, joten jäsen ei voi valita kokoa, jota ei ole. Kun porukassa on sekä pieniä että isoja kokoja, katsokaa saatavuus ennen kuin vetäjä luo ryhmän.`,
          `Vaaleanharmaa ja valkoinen näyttävät erilaisilta eri valaistuksessa, joten katsokaa esikatselu myös puhelimen näytöltä ennen päätöstä. Väri on sama koko ryhmälle, joten päätös kannattaa tehdä yhdessä.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Voiko ryhmään liittyä, kun kokotaulukko on jo täynnä?",
        a: "Voi, kun vetäjä lisää paikkoja hallintasivulta. Sen jälkeen uusi jäsen täyttää rivinsä samasta jäsenlinkistä.",
      },
    ],
    lahella: ["turku", "espoo"],
    esimerkki: { nimi: "Salon abit", teksti: "Salosta sinne minne", jasenet: ["Hanna", "Veikko", "Nelli"] },
  },
  {
    slug: "porvoo",
    kaupunki: "Porvoo",
    inessiivi: "Porvoossa",
    otsikko: "Abipaidat Porvoo: kuva Vanhassa Porvoossa",
    kuvaus: "Abipaidat porvoolaisille abeille: teksti suomeksi tai ruotsiksi, nimi selkään ja yhteiskuva punaisten ranta-aittojen edessä.",
    h1: "Abipaidat Porvoon penkkareihin",
    intro: [
      "Vanhan Porvoon punaiset ranta-aitat Porvoonjoen rannalla ovat näkymä, jonka moni tunnistaa Porvoosta. Samanväriset abipaidat aittojen edessä tekevät vuosikurssin kuvasta omanne, ja tällä sivulla paita suunnitellaan ja tilataan koko porukalle.",
      `Penkkarit ovat ${P}, ja tilaus lukitaan viimeistään ${T}.`,
    ],
    osiot: [
      {
        otsikko: "Yhteiskuva vanhassa kaupungissa",
        teksti: [
          "Vanhan Porvoon mukulakivikadut ja tuomiokirkon mäki ovat kävelymatkan päässä joenrannasta. Ottakaa yhteiskuva ennen ajelua, kun kaikki ovat vielä paikalla ja paidat puhtaita. Joen toiselta rannalta aitat näkyvät koko leveydeltään, ja porukka mahtuu kuvaan niiden eteen.",
        ],
      },
      {
        otsikko: "Kaksikielinen porukka",
        teksti: [
          "Porvoo on kaksikielinen, ja etupuolen teksti voi olla suomeksi, ruotsiksi tai molemmilla kielillä. Ryhmän nimi yhdellä kielellä ja tekstirivi toisella toimii hyvin, kun porukassa on kummankin kieliryhmän abeja. Selkänimet kirjoitetaan sellaisina kuin jäsenet itse ne kirjoittavat.",
        ],
      },
      {
        otsikko: "Nimet oikein ennen lukitusta",
        teksti: [
          "Ennen lukitusta vetäjä käy kokotaulukon läpi: onko jokaisen nimi kirjoitettu oikein, ja puuttuuko joltakulta koko. Väärin kirjoitettu nimi painetaan sellaisenaan, joten tarkistus tehdään ennen kuin paidat lähtevät painoon. Jäsen korjaa oman rivinsä itse samasta linkistä, jolla hän sen täytti.",
        ],
      },
      {
        otsikko: "Vanha kaupunki, uusi vuosikurssi",
        teksti: [
          `Porvoota pidetään Suomen toiseksi vanhimpana kaupunkina, mutta teidän vuosikurssinne kirjoittaa siihen oman lukunsa. Etupuolen tekstiriville sopii viittaus vanhaan kaupunkiin, jokeen tai aittoihin, tai porukan oma juttu. Pitkä lause painetaan pienemmällä, joten muutama sana riittää.`,
          `Ruotsinkielinen lause toimii yhtä hyvin kuin suomenkielinen, ja ääkköset sekä å painetaan oikein. Kokeilkaa esikatselussa molempia ja valitkaa se, joka näyttää paremmalta lavalta katsottuna.`,
        ],
      },
    ],
    ukk: [
      {
        q: "Voiko etupuolen tekstin kirjoittaa kahdella kielellä?",
        a: "Voi. Kirjoittakaa ryhmän nimi yhdellä kielellä ja tekstirivi toisella, esimerkiksi suomeksi ja ruotsiksi.",
      },
    ],
    lahella: ["helsinki", "vantaa", "kotka"],
    esimerkki: { nimi: "Porvoon abit", teksti: "Aittojen edestä maailmalle", jasenet: ["Saga", "Anton", "Emilia"] },
  },
];
