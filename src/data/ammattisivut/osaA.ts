/**
 * Ammattisivut, osa A: sähkö, LVI ja terveydenhuolto (/paidat/<slug>). Muoto: ./tyypit.ts.
 */
import type { AmmattiSivuSisalto } from "./tyypit";

const alallaVuotta = (teksti: string) => `/tuote/personoitava-t-paita-alalla-x-vuotta?teksti=${encodeURIComponent(teksti)}`;
const tyosankari = (teksti: string) => `/tuote/personoitava-t-paita-nimi-legendaarinen-tyosankari?teksti=${encodeURIComponent(teksti)}`;

export const SIVUT_A: AmmattiSivuSisalto[] = [
  {
    slug: "sahkomies",
    nimi: "Sähkömiehen paidat",
    ryhma: "ammatti",
    kohde: "sähkömiehelle",
    otsikko: "Sähkömies paita ja huppari huumorilla",
    kuvaus: "Hauskat sähkömiehen paidat ja hupparit: sokeripala omassa eteisessä, sulake taas ja muut sähköasentajan vitsit.",
    h1: "Sähkömiehen paidat ja lahjat sähköasentajalle",
    intro: [
      "Sähkömies paita on t-paita tai huppari, jonka vitsin ymmärtää jokainen, joka on vetänyt kaapelia kylmällä ullakolla: Sähkömiehen kotona roikkuu yhä sokeripala ja Vika löytyi. Se oli sulake. Taas.",
      "Sivulla on viisi uutta mallia sähköasentajalle sekä aiemmat Älä kosketa sähkömiestä kun olet märkä ja Sähkömies. Tiedän, mikä johtaa mihinkin. Jokainen uusi malli on saatavana t-paitana ja hupparina.",
    ],
    opas: [
      {
        otsikko: "Sähkömiehen huumori syntyy työmaalla",
        teksti: [
          "Sähköasentajan arjessa on asioita, joita muut eivät huomaa. Asiakas kertoo, että valot vilkkuvat vain silloin, kun asentaja ei ole paikalla. Edellinen tekijä on merkinnyt ryhmäkeskukseen kolme johtoa samalla tussilla. Omassa eteisessä roikkuu sokeripala kolmatta vuotta, koska työmaalla riittää kiirettä. Tästä syntyy huumori, jonka alan ihminen tunnistaa ensimmäisestä rivistä.",
          "Nolla ja vaihe. Minä ja kahvi kertoo aamun tärkeimmästä kytkennästä. Johdot kurissa. Ihmiset eivät sopii asentajalle, jonka kaapeloinnit ovat siistejä, vaikka työmaan aikataulu ei pysy. Kaikki on kytketty. Paitsi minä maanantaina on paita viikon ensimmäiseen aamuun. Vika löytyi. Se oli sulake. Taas sopii huoltoasentajalle, joka ajaa samaan osoitteeseen kolmatta kertaa samalla viikolla.",
          "Vitsit avautuvat myös sähkömiehen perheelle: sokeripalan tunnistaa jokainen, joka on asunut talossa, jonka sähköt valmistuvat aina ensi kuussa.",
        ],
      },
      {
        otsikko: "Kenelle ja milloin",
        teksti: [
          "Paita sopii lahjaksi valmistuvalle sähköasentajalle, joka on juuri saanut ensimmäiset työmaakokemukset, ja konkarille, joka on asentanut pistorasioita vuosikymmeniä. Se toimii syntymäpäivillä, pikkujouluissa ja työmaan kahvihuoneessa, jossa sisäpiirin vitsi naurattaa koko porukkaa.",
          "Huppari on lämmin valinta talvityömaan taukokoppiin ja kylmään autotalliin. T-paita kulkee vapaa-ajalla ja kesämökin remonttiviikonloppuna. Putkimiehen, insinöörin ja mekaanikon paidat löydät alla olevista linkeistä, jos lahja menee koko työporukalle.",
        ],
      },
      {
        otsikko: "Oma teksti sähkömiehelle",
        teksti: [
          "Personoitavaan paitaan voit kirjoittaa sähkömiehen nimen, työvuodet tai firman oman vitsin. Linkissä on valmiina ehdotus Sähkömies, alalla 20 vuotta, ja tekstiä voi muokata tuotesivulla ennen kuin lisäät paidan koriin.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja sähkömiehelle?",
        a: "T-paita tai huppari sähköasentajan vitsillä, esimerkiksi Vika löytyi. Se oli sulake. Taas tai Sähkömiehen kotona roikkuu yhä sokeripala.",
      },
      {
        q: "Voiko sähköasentajan paitaan painaa oman tekstin?",
        a: "Voi. Alalla X vuotta -paitaan kirjoitat ammatin ja työvuodet, esimerkiksi Sähkömies, alalla 20 vuotta.",
      },
      {
        q: "Sopiiko paita työvaatteeksi?",
        a: "Paita on tarkoitettu vapaa-ajalle ja kahvihuoneeseen. Se ei ole suojavaate, joten sähkötöissä käytetään määräysten mukaisia työvaatteita.",
      },
    ],
    tuotteet: [/sähkömie/, /sähköasentaja/],
    mallit: [
      ["SÄHKÖMIEHEN KOTONA", "ROIKKUU YHÄ", "SOKERIPALA."],
      ["VIKA LÖYTYI.", "SE OLI SULAKE.", "TAAS."],
      ["NOLLA JA VAIHE.", "MINÄ JA KAHVI."],
      ["JOHDOT KURISSA.", "IHMISET EIVÄT."],
      ["KAIKKI ON KYTKETTY.", "PAITSI MINÄ", "MAANANTAINA."],
    ],
    liittyvat: ["/paidat/putkimies", "/paidat/insinoori", "/paidat/mekaanikko", "/lahjat/remontoijalle", "/ammatit", "/ammattipaidat"],
    lisalinkit: [{ href: "/yritykset/rakennus", label: "Tiimipaidat rakennusalalle" }],
    personoitu: {
      teksti: "Kirjoita paitaan sähkömiehen nimi, työvuodet tai firman sisäpiirin vitsi. Ehdotus on valmiina, ja voit muokata sitä tuotesivulla.",
      href: alallaVuotta("Sähkömies, alalla 20 vuotta"),
      label: "Alalla X vuotta: Sähkömies",
    },
  },
  {
    slug: "putkimies",
    nimi: "Putkimiehen paidat",
    ryhma: "ammatti",
    kohde: "putkimiehelle",
    otsikko: "Putkimies paita: LVI-huumoria",
    kuvaus: "Hauskat putkimiehen paidat ja hupparit: lattiakaivo tietää, mitä teit viime kesänä, ja muut LVI-asentajan vitsit.",
    h1: "Putkimiehen paidat ja lahjat LVI-asentajalle",
    intro: [
      "Putkimies paita on vitsi, jonka LVI-asentaja ymmärtää ennen kuin ehtii lukea loppuun: Lattiakaivo tietää, mitä teit viime kesänä ja Tiiviste pitää. Hermot melkein.",
      "Uusien mallien rinnalla sivulla ovat aiemmat paidat Putkimies. Näen asioita, joita et halua nähdä ja Löytää aina lekkauksen. Valitse t-paita kesäkeikoille tai huppari kylmään kellariin.",
    ],
    opas: [
      {
        otsikko: "Kellareista, kylpyhuoneista ja lattiakaivoista",
        teksti: [
          "Putkiasentajan työpäivä alkaa usein ahtaasta tilasta: tiskipöydän alta, ryömintätilasta tai kerrostalon nousulinjan vierestä. Sieltä hän näkee asioita, joista asukas ei halua kuulla, ja juuri siksi alan huumori on kuivaa ja suoraa. Kun hana tippuu lauantai-iltana, putkimiehestä tulee naapuruston kysytyin henkilö, vaikka hän itse aikoi katsoa jääkiekkoa.",
          "Menen sinne, minne muut eivät on kunnianosoitus kaikille, jotka ovat kurkottaneet kaivon pohjalle taskulampun kanssa. Vesi löytää aina tiensä. Minä löydän veden kertoo vuotoja jäljittävän asentajan ammattiylpeydestä. Kaikki valuu alamäkeen. Myös maanantai sopii jokaiselle, jonka viikko alkaa tukoksella.",
        ],
      },
      {
        otsikko: "Lahja LVI-alan ihmiselle",
        teksti: [
          "Putkimiehen paita on lahja oppisopimuksella valmistuvalle nuorelle, työmaan vanhimmalle kisällille ja yrittäjälle, joka hoitaa päivystyksen itse. Se sopii myös kumppanille, joka on kuunnellut viemärikameran löydöistä illallispöydässä vuosia ja haluaa nyt vastata huumorilla.",
          "Jos lahjan saaja tekee remontteja kokonaisuutena, katso myös remontoijan ja sähkömiehen sivut. Mekaanikon paidat sopivat työkaverille, joka korjaa pakettiauton viikonloppuna. Työporukalle samaan tilaukseen voi koota eri ammattien paidat, ja jokainen saa oman vitsinsä.",
        ],
      },
      {
        otsikko: "Firman oma teksti",
        teksti: [
          "Personoitavaan paitaan kirjoitetaan valmiiksi Putkimies, alalla 15 vuotta. Vaihda vuodet, lisää nimi tai firman sisäpiirin lausahdus tuotesivulla ennen tilaamista.",
          "Teksti voi olla myös pidempi tarina: monessa LVI-firmassa on oma kertomus siitä keikasta, jolla kadonnut sormus löytyi vesilukosta tai kissa jäi jumiin alakaappiin. Sellainen muisto painettuna paitaan naurattaa koko porukkaa vielä vuosien päästä, ja uusi harjoittelija kuulee tarinan ensimmäisellä kahvitauolla.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja putkimiehelle?",
        a: "Paita LVI-vitsillä, esimerkiksi Lattiakaivo tietää, mitä teit viime kesänä tai Menen sinne, minne muut eivät.",
      },
      {
        q: "Onko putkimiehelle huppareita?",
        a: "On. Jokainen uusi putkimiesmalli on myös hupparina, joka on lämmin kellarityömaalla ja talvikeikoilla.",
      },
      {
        q: "Sopiiko paita koko LVI-firman tiimille?",
        a: "Sopii. Samasta mallista voi tilata useita kokoja, ja yrityksille on erikseen tiimipaidat omalla logolla.",
      },
    ],
    tuotteet: [/putkimie/],
    mallit: [
      ["LATTIAKAIVO", "TIETÄÄ, MITÄ", "TEIT VIIME KESÄNÄ."],
      ["TIIVISTE", "PITÄÄ.", "HERMOT MELKEIN."],
      ["PUTKIMIES.", "MENEN SINNE,", "MINNE MUUT EIVÄT."],
      ["VESI LÖYTÄÄ AINA", "TIENSÄ. MINÄ", "LÖYDÄN VEDEN."],
      ["KAIKKI VALUU", "ALAMÄKEEN.", "MYÖS MAANANTAI."],
    ],
    liittyvat: ["/paidat/sahkomies", "/paidat/mekaanikko", "/lahjat/remontoijalle", "/ammatit", "/ammattipaidat"],
    lisalinkit: [{ href: "/yritykset/rakennus", label: "Tiimipaidat rakennusalalle" }],
    personoitu: {
      teksti: "Paitaan voi painaa putkimiehen nimen, työvuodet tai firman oman lausahduksen. Ehdotus on valmiina tuotesivulla.",
      href: alallaVuotta("Putkimies, alalla 15 vuotta"),
      label: "Alalla X vuotta: Putkimies",
    },
  },
  {
    slug: "sairaanhoitaja",
    nimi: "Sairaanhoitajan paidat",
    ryhma: "ammatti",
    kohde: "sairaanhoitajalle",
    otsikko: "Lahja sairaanhoitajalle: hoitajapaidat",
    kuvaus: "Hauska lahja sairaanhoitajalle: paidat ja hupparit yövuoron kahvista, kirjaamisesta ja käsidesistä.",
    h1: "Hauska lahja sairaanhoitajalle",
    intro: [
      "Lahja sairaanhoitajalle on onnistunut, kun hoitaja tunnistaa vitsistä oman vuoronsa: Yövuoron kahvi on jo kolmas tai Kirjaan tämänkin. Myöhemmin.",
      "Sivulla on viisi uutta mallia sairaanhoitajalle ja aiempi Sairaanhoitaja. Kahvi on ensiapua. Lähihoitajan, ensihoitajan ja kätilön paidat ovat omilla sivuillaan, koska jokaisen työn arki ja vitsit ovat erilaisia.",
    ],
    opas: [
      {
        otsikko: "Osastolla nauretaan tauolla",
        teksti: [
          "Sairaanhoitajan vuorossa ehtii tapahtua paljon: lääkejako, uusi potilas päivystyksestä, omainen puhelimessa ja kirjaaminen, joka jää aina viimeiseksi. Tauko kestää neljä minuuttia, ja kahvi jää kesken. Huumori on keino purkaa kiirettä työkavereiden kesken, eikä se kohdistu potilaisiin.",
          "Käsidesi. Pikakahvi. Sankaruus. tiivistää työvälineet kolmeen sanaan. Hoitajan tauko: neljä minuuttia ja kesken jäi on paita jokaiselle, jonka kahvikuppi on jäänyt kansliaan jäähtymään. Täyskuu ja yövuoro. Tiedän jo on vitsi, jonka jokainen osastolla yövuoroa tehnyt tuntee.",
        ],
      },
      {
        otsikko: "Valmistujaisiin, kiitokseksi tai eläkejuhlaan",
        teksti: [
          "Vastavalmistunut sairaanhoitaja saa paidasta muiston ensimmäisestä työpaikasta. Pitkän uran tehnyt hoitaja ilahtuu, kun läksiäisissä muistetaan yövuorot huumorilla. Osaston henkilökunnalle paita on mukava kiitos kiireisen syksyn jälkeen, ja työkaveri voi hankkia sen salaisen joulupukin lahjaksi.",
          "Vuorotyöläinen liikkuu usein kylminä aamuina, joten huppari on käytännöllinen lahja. Erot ammattien välillä kannattaa huomata: ensihoitaja tekee työtään ambulanssissa, lähihoitaja usein kotihoidossa ja kätilö synnytyssalissa.",
        ],
      },
      {
        otsikko: "Vitsi, joka jaksaa kantaa yövuoron yli",
        teksti: [
          "Hoitajat kertovat usein, että raskaimpina öinä auttaa kollega, joka keksii sanoa jotain hassua oikeaan aikaan. Paidan teksti on samanlainen pieni hetki: se muistuttaa, että kiire on yhteinen ja siitä selvitään yhdessä. Kirjaan tämänkin. Myöhemmin on monen osaston sisäpiirin lause, ja Yövuoron kahvi on jo kolmas kertoo, miten aamuneljän väsymys selätetään.",
          "Personoitu vaihtoehto sopii, kun haluat paitaan hoitajan nimen tai osaston oman lempinimen. Esimerkiksi teksti yövuoron sankari ja nimi tekevät lahjasta henkilökohtaisen, ja sen voi antaa kiitoksena perehdyttäjälle, joka opetti uuden hoitajan talon tavoille.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja sairaanhoitajalle?",
        a: "Paita hoitajan arjesta, esimerkiksi Yövuoron kahvi on jo kolmas tai Käsidesi. Pikakahvi. Sankaruus.",
      },
      {
        q: "Mikä lahja sopii valmistuvalle sairaanhoitajalle?",
        a: "Ammattipaita tai personoitu paita, johon painetaan nimi ja teksti, esimerkiksi yövuoron sankari.",
      },
      {
        q: "Onko lähihoitajalle eri paidat?",
        a: "On. Lähihoitajan, ensihoitajan ja kätilön paidat ovat omilla sivuillaan, ja niiden vitsit tulevat kunkin työn arjesta.",
      },
    ],
    tuotteet: [/sairaanhoitaja/],
    mallit: [
      ["YÖVUORON KAHVI", "ON JO KOLMAS."],
      ["KIRJAAN TÄMÄNKIN.", "MYÖHEMMIN."],
      ["HOITAJAN TAUKO:", "NELJÄ MINUUTTIA", "JA KESKEN JÄI."],
      ["KÄSIDESI.", "PIKAKAHVI.", "SANKARUUS."],
      ["TÄYSKUU", "JA YÖVUORO.", "TIEDÄN JO."],
    ],
    liittyvat: ["/paidat/lahihoitaja", "/paidat/ensihoitaja", "/paidat/katilo", "/paidat/laakari", "/ammatit", "/lahjat/tyokaverille"],
    lisalinkit: [{ href: "/yritykset/terveys", label: "Paidat terveysalan työpaikoille" }],
    personoitu: {
      teksti: "Personoitavaan paitaan voi painaa hoitajan nimen ja valmistumisvuoden tai osaston oman sisäpiirin vitsin.",
      href: tyosankari("Sairaanhoitaja Anna, legendaarinen yövuoron sankari"),
      label: "Työsankari: sairaanhoitaja",
    },
  },
  {
    slug: "lahihoitaja",
    nimi: "Lähihoitajan paidat",
    ryhma: "ammatti",
    kohde: "lähihoitajalle",
    otsikko: "Lahja lähihoitajalle: kotihoidon huumori",
    kuvaus: "Hauskat paidat lähihoitajalle: auton takapenkki toimistona, dosetit ja tukisukat. Lahja kotihoitoon ja hoivakotiin.",
    h1: "Paidat ja lahjat lähihoitajalle",
    intro: [
      "Hauska lahja lähihoitajalle kertoo kotihoidon ja hoivakodin arjesta niin, että koko tiimi tunnistaa sen: Auton takapenkki on toimistoni ja Mummot tietää minun nimeni. Pomo ei.",
      "Sivulla ovat uudet mallit ja aiempi Lähihoitaja. Kiire on toinen nimeni. Sairaanhoitajan ja ensihoitajan paidat löytyvät omilta sivuiltaan, sillä niiden vitsit tulevat osastolta ja ambulanssista.",
    ],
    opas: [
      {
        otsikko: "Kotikäynnillä aikataulu elää",
        teksti: [
          "Lähihoitaja ajaa kotikäynniltä toiselle, kantaa mukanaan avaimia, kirjaa tabletilla autossa ja syö eväänsä parkkipaikalla. Asiakkaan luona on aikaa kuulla kuulumiset, vaikka seuraava osoite odottaa. Tukisukkien pukeminen on taito, jota ei opeteta missään kirjassa, ja lääkedosetin täyttö sujuu silmät kiinni.",
          "Lähihoitaja. Kotikäynti nro 14. Ja kello on 11 kertoo aamuvuoron tahdin. Lääkedosetti kunnossa. Oma kalenteri ei on vitsi jokaiselle, joka muistaa muiden lääkeajat mutta unohtaa oman hammaslääkärin. Tukisukkien pukemisen SM-taso on kunniamaininta vuosien kokemuksesta.",
        ],
      },
      {
        otsikko: "Kiitoslahja hoivatyön tekijälle",
        teksti: [
          "Paita sopii lahjaksi lähihoitajaksi valmistuvalle, kesätyöntekijälle, joka jäi taloon, ja kokeneelle hoitajalle syntymäpäivänä. Omaiset antavat sitä kiitokseksi, kun kotihoito on auttanut isää tai äitiä pärjäämään kotona. Työyhteisössä paita on mieluinen pikkujoululahja.",
          "Hoivakodissa ja kotihoidossa vitsit ovat lämpimiä. Mallit nauravat kiireelle, aikatauluille ja omalle jaksamiselle, eivät asiakkaille. Huppari on tervetullut talvella, kun auto ei ehdi lämmetä käyntien välissä.",
        ],
      },
      {
        otsikko: "Avainnippu, tabletti ja termospullo",
        teksti: [
          "Kotihoidon lähihoitajan auton ovitaskusta löytyy käsidesiä, varahanskat, kartta ja termospullo, jonka kahvi on ehtinyt jäähtyä kolmannen asiakkaan kohdalla. Hoivakodissa taas tunnetaan jokaisen asukkaan lempilaulu ja tapa juoda kahvi. Tämä arki on täynnä pieniä hetkiä, joista syntyy tiimin oma huumori.",
          "Mummot tietää minun nimeni. Pomo ei on hellä vitsi siitä, kenelle lähihoitaja oikeasti on tuttu. Personoituun paitaan voit painaa tiimin nimen, esimerkiksi kotihoidon alueen, ja antaa sen koko porukalle yhteiseksi tunnukseksi.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hyvä kiitoslahja lähihoitajalle?",
        a: "Paita, joka nauraa kotihoidon kiireelle, esimerkiksi Auton takapenkki on toimistoni tai Lääkedosetti kunnossa. Oma kalenteri ei.",
      },
      {
        q: "Mitä eroa on lähihoitajan ja sairaanhoitajan paidoilla?",
        a: "Lähihoitajan vitsit tulevat kotikäynneiltä ja hoivakodista, sairaanhoitajan vitsit osastolta, yövuoroista ja kirjaamisesta.",
      },
      {
        q: "Voiko paitaan painaa tiimin nimen?",
        a: "Voi. Personoitavaan paitaan kirjoitat esimerkiksi kotihoidon tiimin nimen ja työvuodet.",
      },
    ],
    tuotteet: [/lähihoitaja/],
    mallit: [
      ["LÄHIHOITAJA.", "KOTIKÄYNTI NRO 14.", "JA KELLO ON 11."],
      ["AUTON TAKAPENKKI", "ON TOIMISTONI."],
      ["LÄÄKEDOSETTI", "KUNNOSSA.", "OMA KALENTERI EI."],
      ["MUMMOT TIETÄÄ", "MINUN NIMENI.", "POMO EI."],
      ["TUKISUKKIEN", "PUKEMISEN", "SM-TASO."],
    ],
    liittyvat: ["/paidat/sairaanhoitaja", "/paidat/ensihoitaja", "/paidat/fysioterapeutti", "/ammatit", "/lahjat/tyokaverille"],
    lisalinkit: [{ href: "/yritykset/terveys", label: "Paidat terveysalan työpaikoille" }],
    personoitu: {
      teksti: "Kirjoita paitaan lähihoitajan nimi ja työvuodet tai kotihoidon tiimin oma tunnuslause.",
      href: alallaVuotta("Lähihoitaja, alalla 10 vuotta"),
      label: "Alalla X vuotta: Lähihoitaja",
    },
  },
  {
    slug: "laakari",
    nimi: "Lääkärin paidat",
    ryhma: "ammatti",
    kohde: "lääkärille",
    otsikko: "Lahja lääkärille: hauskat lääkäripaidat",
    kuvaus: "Hauskat paidat lääkärille: käsiala on tahallinen, ota kaksi ja soita aamulla sekä muut päivystäjän vitsit.",
    h1: "Hauska lahja lääkärille",
    intro: [
      "Hauska lahja lääkärille on paita, joka vastaa juhlien yleisimpään kysymykseen ennen kuin kukaan ehtii esittää sen: Lääkäri. Kyllä, katson sen luomen.",
      "Viisi uutta mallia kertovat käsialasta, päivystyksen unesta ja kahvinpuutteesta. Malleja on t-paitoina ja huppareina, ja ne sopivat terveyskeskukseen, sairaalaan ja yksityiselle vastaanotolle.",
      "Lääkärin huumori on kuivaa ja tarkkaa, ja usein se syntyy pitkän päivystyksen jälkeen, kun kahvihuoneessa on hetki aikaa. Siksi mallit nauravat työn rytmille ja lääkärin omalle maineelle, eivät koskaan potilaille tai heidän vaivoilleen.",
    ],
    opas: [
      {
        otsikko: "Vastaanotolla ja päivystyksessä",
        teksti: [
          "Lääkäri kuulee ammatistaan vitsejä koko uransa. Sukujuhlissa joku kysyy aina ihottumasta, käsialaa pidetään salakirjoituksena ja päivystysvuoron jälkeen nukutaan sohvalla kengät jalassa. Paita kääntää nämä tutut tilanteet lääkärin omiksi vitseiksi.",
          "Käsialani on tahallinen on klassikko, joka naurattaa myös apteekissa. Ota kaksi ja soita aamulla sopii yleislääkärille ja kaikille, jotka ovat joskus antaneet puhelinneuvon kello kolme yöllä. Päivystys. Uni on lääkärin myytti kertoo yövuorosta, ja Diagnoosi: kahvinpuute on helppo tunnistaa jokaisessa kahvihuoneessa.",
        ],
      },
      {
        otsikko: "Lahja kandille, erikoistuvalle ja konkarille",
        teksti: [
          "Lääketieteen kandidaatti saa paidasta muiston opiskeluvuosista ja ensimmäisistä sijaisuuksista. Erikoistuva lääkäri tarvitsee huumoria päivystysten välissä. Eläkkeelle jäävälle lääkärille paita on läksiäislahja, joka muistuttaa vuosikymmenten vastaanotoista.",
          "Sopiva hetki on myös lisensiaatin valmistujaiset, väitöskaronkka tai syntymäpäivä. Jos lahjaa etsitään koko terveysaseman henkilökunnalle, sairaanhoitajan, hammaslääkärin ja fysioterapeutin sivuilla on jokaiselle oma vitsi.",
        ],
      },
      {
        otsikko: "Kun lääkäri on vapaalla",
        teksti: [
          "Vapaapäivänä lääkäri haluaa olla vain ihminen, mutta mökkinaapuri tuo silti näytettäväksi punoittavan sormen. Lääkäri. Kyllä, katson sen luomen on paita juuri näihin hetkiin: se kertoo, että kysyä saa, ja samalla naurattaa koko grilliseuruetta. Diagnoosi: kahvinpuute taas sopii sunnuntaiaamun tilaan ennen ensimmäistä kuppia.",
          "Huppari on mukava valinta lenkille päivystyksen jälkeen, ja t-paita kulkee kesälomalla. Personoitavaan paitaan voi lisätä erikoisalan, esimerkiksi kirurgi, yleislääkäri tai lastenlääkäri, ja tekstin, jota vain kollegat ymmärtävät.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja valmistuvalle lääkärille?",
        a: "Paita lääkärihuumorilla, esimerkiksi Käsialani on tahallinen, tai personoitu paita, jossa on nimi ja valmistumisvuosi.",
      },
      {
        q: "Sopiiko paita lääkärille, joka jää eläkkeelle?",
        a: "Sopii. Ota kaksi ja soita aamulla ja Lääkäri. Kyllä, katson sen luomen ovat hauskoja läksiäislahjoja pitkän uran jälkeen.",
      },
      {
        q: "Voiko paitaa käyttää töissä?",
        a: "Paita on vapaa-ajan vaate. Työssä käytetään työnantajan työvaatteita ja hygieniaohjeita.",
      },
    ],
    tuotteet: [/(?<![a-zåäö])lääkärille/],
    mallit: [
      ["LÄÄKÄRI.", "KYLLÄ, KATSON", "SEN LUOMEN."],
      ["OTA KAKSI", "JA SOITA AAMULLA."],
      ["KÄSIALANI", "ON TAHALLINEN."],
      ["PÄIVYSTYS.", "UNI ON", "LÄÄKÄRIN MYYTTI."],
      ["DIAGNOOSI:", "KAHVINPUUTE."],
    ],
    liittyvat: ["/paidat/sairaanhoitaja", "/paidat/hammaslaakari", "/paidat/elainlaakari", "/paidat/ensihoitaja", "/ammatit"],
    lisalinkit: [{ href: "/yritykset/terveys", label: "Paidat terveysalan työpaikoille" }],
    personoitu: {
      teksti: "Personoitavaan paitaan sopii lääkärin nimi, erikoisala tai valmistumisvuosi. Muokkaa ehdotusta tuotesivulla.",
      href: alallaVuotta("Lääkäri, alalla 25 vuotta"),
      label: "Alalla X vuotta: Lääkäri",
    },
  },
  {
    slug: "hammaslaakari",
    nimi: "Hammaslääkärin paidat",
    ryhma: "ammatti",
    kohde: "hammaslääkärille",
    otsikko: "Lahja hammaslääkärille: hymypaidat",
    kuvaus: "Hauskat paidat hammaslääkärille: muista langata, kerro lisää suu auki ja karkkipäivä, joka tuo töitä.",
    h1: "Hauska lahja hammaslääkärille",
    intro: [
      "Hammaslääkärin lahja voi olla t-paita, jonka vitsi syntyy vastaanottotuolista: Kerro lisää. Suu auki ja Muista langata. Tiedän, jos et.",
      "Mallit sopivat hammaslääkärille, suuhygienistille ja hammashoitajalle. Jokainen on tarjolla t-paitana ja hupparina, joten lahja sopii myös talviseen pyöräilyyn klinikalle.",
      "Hammaslääkärit nauravat mielellään omalle ammatilleen, koska vastaanotolla he kuulevat samat kommentit porasta ja lankaamisesta päivästä toiseen. Mallit kääntävät nämä kommentit hammaslääkärin omiksi vitseiksi.",
    ],
    opas: [
      {
        otsikko: "Suu auki, tarina kesken",
        teksti: [
          "Hammaslääkäri esittää kysymyksiä juuri silloin, kun vastaaminen on mahdotonta. Potilas kertoo lomastaan äännähdyksinä, ja hammaslääkäri nyökkää kuin ymmärtäisi kaiken. Lankaamisesta kysytään joka käynnillä, ja vastaus luetaan ikenistä.",
          "Kerro lisää. Suu auki on tämän tilanteen paita. Muista langata. Tiedän, jos et sopii suuhygienistille, joka näkee totuuden jo ensimmäisestä vilkaisusta. Poran ääni on minulle musiikkia ja Hammaslääkäri. Hymyilen ammatin puolesta ovat kollegoille, jotka nauravat omalle maineelleen. Karkkipäivä tuo minulle töitä on ystävällinen piikki lauantain karkkihyllylle.",
        ],
      },
      {
        otsikko: "Klinikan pikkujouluihin ja valmistujaisiin",
        teksti: [
          "Hammaslääketieteen opiskelija saa paidasta lahjan valmistumiseensa, ja oma klinikka voi tilata tiimille eri mallit pikkujouluihin. Hammashoitaja ja vastaanottovirkailija ansaitsevat myös kiitoksen, kun ajanvaraus on täynnä koko syksyn.",
          "Paita on hauska lahja myös sukulaiselle, joka kuuntelee jokaisena jouluna hampaiden kuulumiset. Eläinlääkärin ja lääkärin paidat löytyvät omilta sivuiltaan, jos samaan pakettiin tarvitaan useamman ammatin vitsejä.",
        ],
      },
      {
        otsikko: "Pelottava maine, hymyilevä ammattilainen",
        teksti: [
          "Moni pelkää hammaslääkäriä, vaikka tuolin vieressä istuu ihminen, joka tekee kaikkensa, ettei satu. Siksi alan huumori nauraa omalle maineelle: poran ääni, lankaamisen kuulustelu ja karkkipäivän jälkiseuraukset ovat aiheita, joille hammaslääkäri itse nauraa ensimmäisenä. Hammaslääkäri. Hymyilen ammatin puolesta tiivistää asenteen.",
          "Personoitavaan paitaan voi kirjoittaa klinikan nimen tai hauskan lauseen, kuten montako hammasta on paikattu uran aikana. Sellainen paita on muisto, kun klinikka viettää vuosijuhlaa tai kokenut hammaslääkäri siirtyy eläkkeelle.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja hammaslääkärille?",
        a: "Paita vastaanoton arjesta, esimerkiksi Kerro lisää. Suu auki tai Poran ääni on minulle musiikkia.",
      },
      {
        q: "Sopivatko paidat suuhygienistille?",
        a: "Sopivat. Muista langata. Tiedän, jos et on kirjoitettu juuri suuhygienistin ja hammashoitajan arkeen.",
      },
      {
        q: "Voiko klinikka tilata paidat koko tiimille?",
        a: "Voi. Valitse jokaiselle oma malli ja koko, ja yritystilauksiin on tarjolla tiimipaidat omalla logolla.",
      },
    ],
    tuotteet: [/hammaslääkär/],
    mallit: [
      ["KERRO LISÄÄ.", "SUU AUKI."],
      ["MUISTA LANGATA.", "TIEDÄN, JOS ET."],
      ["HAMMASLÄÄKÄRI.", "HYMYILEN", "AMMATIN PUOLESTA."],
      ["PORAN ÄÄNI", "ON MINULLE", "MUSIIKKIA."],
      ["KARKKIPÄIVÄ", "TUO MINULLE", "TÖITÄ."],
    ],
    liittyvat: ["/paidat/laakari", "/paidat/sairaanhoitaja", "/paidat/kampaaja", "/ammatit", "/lahjat/tyokaverille"],
    lisalinkit: [{ href: "/yritykset/terveys", label: "Paidat terveysalan työpaikoille" }],
    personoitu: {
      teksti: "Paitaan voi kirjoittaa klinikan nimen, hammaslääkärin nimen tai vaikka paikattujen hampaiden määrän.",
      href: alallaVuotta("Hammaslääkäri, alalla 20 vuotta"),
      label: "Alalla X vuotta: Hammaslääkäri",
    },
  },
  {
    slug: "ensihoitaja",
    nimi: "Ensihoitajan paidat",
    ryhma: "ammatti",
    kohde: "ensihoitajalle",
    otsikko: "Ensihoitaja paita ja lahjat ensihoitajalle",
    kuvaus: "Hauskat ensihoitajan paidat: älä sano rauhallista, eväät kylmenivät taas ja muut ambulanssin vitsit.",
    h1: "Ensihoitajan paidat ja lahjat",
    intro: [
      "Ensihoitaja paita on tehty ambulanssin väelle, joka tietää, ettei vuoron alussa koskaan sanota sitä yhtä sanaa: Älä sano rauhallista.",
      "Uusissa malleissa ovat myös Evääni kylmeni. Taas ja Nukun missä vain. Myös seisaaltaan. Paidat sopivat ensihoitajalle, ensivastetehtäviä hoitavalle palomiehelle ja hätäkeskuksen päivystäjälle.",
      "Ensihoidon huumori syntyy kentältä, tauoilta ja asemalta, ei potilaista. Vitsit kertovat kylmistä eväistä, unesta ja kahvista, sillä ne ovat asioita, joista koko vuoro on samaa mieltä.",
    ],
    opas: [
      {
        otsikko: "Sinivalojen välissä",
        teksti: [
          "Ensihoitajan vuoro on arvaamaton. Lounas lämmitetään mikrossa kolmesti, ja kolmannella kerralla hälytys tulee juuri kun lusikka nousee. Asemalla ei sanota ääneen, että ilta näyttää hiljaiselta, koska kaikki tietävät, mitä siitä seuraa. Tauolla nukutaan tuolissa, autossa tai seisten oven karmia vasten.",
          "Ensihoitaja. Ajan toimistolla sinivaloissa kertoo työpaikasta, jossa on pyörät. Siirtykää. Tämä kahvi on kiireellinen on vitsi asemakahvista. Evääni kylmeni. Taas on kirjoitettu jokaiselle, joka on syönyt lounaan kylmänä useammin kuin lämpimänä.",
        ],
      },
      {
        otsikko: "Ensihoidon opiskelijalle ja kokeneelle kenttäjohtajalle",
        teksti: [
          "Paita on lahja ensihoitajaksi valmistuvalle, joka aloittaa ensimmäiset kenttävuoronsa, ja kokeneelle kollegalle, jonka työvuodet lasketaan hälytyksinä. Se sopii myös ensihoitoyksikön pikkujouluihin ja vaihtokaupaksi, kun joku on tuurannut vuoron.",
          "Ensihoitaja ei ole sama asia kuin sairaanhoitaja tai lähihoitaja, vaikka koulutus on samaa alaa. Osaston ja kotihoidon vitsit löydät heidän omilta sivuiltaan, ja palomiehen paidat sopivat paloaseman väelle.",
        ],
      },
      {
        otsikko: "Asemalla on omat taikauskonsa",
        teksti: [
          "Jokaisella ensihoitoasemalla on tapoja, joita ei selitetä uudelle työntekijälle, ne vain opitaan. Kahvinkeitin käynnistetään heti vuoron alussa, eväät syödään nopeasti ja hiljaisesta illasta ei puhuta. Paita Älä sano rauhallista on näistä tunnetuin, ja sen tunnistavat myös poliisit ja palomiehet, jotka jakavat saman kentän.",
          "Huppari on hyvä valinta vuoron jälkeiseen kotimatkaan, kun ilta on venynyt aamuun. Personoitavaan paitaan voi painaa yksikön kutsutunnuksen tai ensihoitajan nimen, ja lahja muistuttaa koko vuorosta, jonka tiimi teki yhdessä.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja ensihoitajalle?",
        a: "Paita ambulanssin arjesta, esimerkiksi Älä sano rauhallista tai Ensihoitaja. Ajan toimistolla sinivaloissa.",
      },
      {
        q: "Miksi rauhallista ei saa sanoa?",
        a: "Ensihoidossa uskotaan, että hiljaisen vuoron mainitseminen tuo heti hälytyksen. Paita muistuttaa siitä koko asemaa.",
      },
      {
        q: "Sopiiko ensihoitajan paita palomiehelle?",
        a: "Sopii ensivastetehtäviä tekevälle. Palomiehelle on lisäksi omat paidat palomiesten sivulla.",
      },
    ],
    tuotteet: [/ensihoitaja/],
    mallit: [
      ["ÄLÄ SANO", "RAUHALLISTA."],
      ["EVÄÄNI KYLMENI.", "TAAS."],
      ["ENSIHOITAJA.", "AJAN TOIMISTOLLA", "SINIVALOISSA."],
      ["SIIRTYKÄÄ.", "TÄMÄ KAHVI ON", "KIIREELLINEN."],
      ["NUKUN MISSÄ VAIN.", "MYÖS SEISAALTAAN."],
    ],
    liittyvat: ["/paidat/palomies", "/paidat/sairaanhoitaja", "/paidat/lahihoitaja", "/paidat/poliisi", "/ammatit"],
    lisalinkit: [{ href: "/yritykset/vpk", label: "Paidat VPK:lle ja pelastusalalle" }],
    personoitu: {
      teksti: "Kirjoita paitaan ensihoitajan nimi, yksikön kutsutunnus tai valmistumisvuosi. Ehdotus on valmiina, ja sitä voi muokata.",
      href: alallaVuotta("Ensihoitaja, alalla 10 vuotta"),
      label: "Alalla X vuotta: Ensihoitaja",
    },
  },
  {
    slug: "katilo",
    nimi: "Kätilön paidat",
    ryhma: "ammatti",
    kohde: "kätilölle",
    otsikko: "Lahja kätilölle: paidat synnytyssalista",
    kuvaus: "Hauskat ja lämpimät paidat kätilölle: olin paikalla ensimmäisenä, ponnista rauhallisesti ja maailman ensimmäinen syli.",
    h1: "Lahja kätilölle",
    intro: [
      "Kätilön lahjaksi sopii paita, jonka vitsi on yhtä lämmin kuin työ: Kätilö. Olin paikalla ensimmäisenä ja Maailman ensimmäinen syli.",
      "Viisi uutta mallia kertovat synnytyssalin öistä ja kätilön rauhallisuudesta. Malleja saa t-paitoina ja huppareina, ja ne sopivat myös neuvolan terveydenhoitajalle ja doulalle.",
      "Kätilön työ on yhtä aikaa arkista ja juhlavaa. Samassa vuorossa keitetään kahvia, täytetään papereita ja ollaan mukana perheen tärkeimmässä hetkessä. Paidat kertovat molemmista puolista hymyillen.",
    ],
    opas: [
      {
        otsikko: "Yöllä syntyy aina enemmän",
        teksti: [
          "Kätilöt kertovat kahvihuoneessa, että vauvat syntyvät mieluiten yöllä, viikonloppuna ja täydenkuun aikaan. Tilastot ovat eri mieltä, mutta yövuorossa tuntuu siltä. Kätilö on monen ihmisen elämässä ensimmäinen, joka sanoo tervetuloa, ja tästä ammattiylpeydestä mallit kertovat.",
          "Yöllä syntyy aina enemmän. Tiedän sen on kätilön oma havainto. Ponnista. Sanon sen rauhallisesti kuvaa ääntä, joka pysyy tasaisena silloinkin, kun muut hätääntyvät. Vastaanotan uusia asiakkaita ympäri vuorokauden on vitsi päivystyksestä, joka ei tunne viikonpäiviä.",
        ],
      },
      {
        otsikko: "Kiitos perheeltä tai kollegoilta",
        teksti: [
          "Paita on kaunis kiitoslahja kätilölle, joka auttoi perheen esikoisen maailmaan. Kollegat antavat sitä valmistuvalle kätilölle tai eläkkeelle jäävälle konkarille, joka on ottanut vastaan tuhansia vauvoja. Syntymäpäivä ja osaston pikkujoulut ovat myös sopivia hetkiä.",
          "Kätilön työ eroaa sairaanhoitajan ja ensihoitajan työstä, vaikka koulutus alkaa samasta paikasta. Molempien omat paidat löytyvät linkeistä, ja vauvaperheille on lisäksi lahjoja tuoreille vanhemmille.",
        ],
      },
      {
        otsikko: "Rauhallinen ääni ja lämmin syli",
        teksti: [
          "Synnytyssalissa kätilö on se, joka tietää, mitä seuraavaksi tapahtuu, ja sanoo sen niin tasaisesti, että koko huone rauhoittuu. Isät muistavat kätilön nimen vuosikymmeniä, ja äidit kertovat hänestä tarinoita lastenlapsille. Mallit kunnioittavat tätä työtä, ja niiden huumori on lempeää: Maailman ensimmäinen syli on enemmän kiitos kuin vitsi.",
          "Personoitavaan paitaan voi kirjoittaa kätilön nimen ja vastaanotettujen vauvojen määrän, jos se on tiedossa. Sellainen paita on muisto, jota kätilö käyttää vielä eläkkeellä mökkilaiturilla.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hyvä kiitoslahja kätilölle?",
        a: "Lämmin paita kätilön työstä, esimerkiksi Maailman ensimmäinen syli tai Kätilö. Olin paikalla ensimmäisenä.",
      },
      {
        q: "Sopiiko paita valmistuvalle kätilölle?",
        a: "Sopii. Personoituun paitaan voi lisätä nimen ja oman tekstin.",
      },
      {
        q: "Onko vauvan vanhemmille omia lahjoja?",
        a: "On. Tuoreiden vanhempien lahjat ovat omalla sivullaan, ja sieltä löytyy myös uuden isän paitoja.",
      },
    ],
    tuotteet: [/kätilö/],
    mallit: [
      ["KÄTILÖ.", "OLIN PAIKALLA", "ENSIMMÄISENÄ."],
      ["PONNISTA.", "SANON SEN", "RAUHALLISESTI."],
      ["YÖLLÄ SYNTYY", "AINA ENEMMÄN.", "TIEDÄN SEN."],
      ["VASTAANOTAN", "UUSIA ASIAKKAITA", "YMPÄRI VUOROKAUDEN."],
      ["MAAILMAN", "ENSIMMÄINEN", "SYLI."],
    ],
    liittyvat: ["/paidat/sairaanhoitaja", "/paidat/ensihoitaja", "/paidat/laakari", "/lahjat/vauvalle", "/ammatit"],
    lisalinkit: [{ href: "/yritykset/terveys", label: "Paidat terveysalan työpaikoille" }],
    personoitu: {
      teksti: "Personoitavaan paitaan voi painaa kätilön nimen ja vaikkapa vastaanotettujen vauvojen määrän.",
      href: tyosankari("Kätilö Liisa, legendaarinen yövuoron sankari"),
      label: "Työsankari: kätilö",
    },
  },
  {
    slug: "fysioterapeutti",
    nimi: "Fysioterapeutin paidat",
    ryhma: "ammatti",
    kohde: "fysioterapeutille",
    otsikko: "Lahja fysioterapeutille: fysiohuumoria",
    kuvaus: "Hauskat paidat fysioterapeutille: tiedän, ettet tehnyt kotiliikkeitä, kuminauha ja usko sekä sattuu hyvällä tavalla.",
    h1: "Hauska lahja fysioterapeutille",
    intro: [
      "Fysioterapeutin lahja on osuva, kun paita sanoo sen, minkä fysio ajattelee jokaisella kontrollikäynnillä: Fysioterapeutti. Tiedän, ettet tehnyt kotiliikkeitä.",
      "Uudet mallit ovat t-paitoina ja huppareina. Ne sopivat fysioterapeutille, osteopaatille, naprapaatille ja urheiluseuran huoltajalle, joka teippaa nilkkoja kentän laidalla.",
      "Fysion vitsit ovat ystävällisiä muistutuksia: kotiliikkeet, ryhti ja venyttely ovat asioita, joista jokainen asiakas on kuullut, ja jokainen on myös luvannut parantaa tapojaan ensi viikolla. Paita kertoo tämän saman viestin hymyillen.",
    ],
    opas: [
      {
        otsikko: "Kotiliikkeet ja kuminauhat",
        teksti: [
          "Fysioterapeutti antaa jokaiselle asiakkaalle paperin, jossa on kuusi helppoa liikettä. Seuraavalla kerralla paperi on hukassa, ja liikkeet on tehty kerran, sunnuntaina. Fysio tietää tämän jo siitä, miten olkapää nousee. Silti hän jaksaa kannustaa, ja juuri siitä syntyy alan lempeä huumori.",
          "Kuminauha ja usko kertoo fysioterapeutin tärkeimmistä työvälineistä. Ryhti. Minä näin sen on vitsi siitä, että fysio huomaa kumaran selän kauppajonossakin. Sattuu hyvällä tavalla on lause, jonka jokainen hierontapöydällä maannut tuntee. Venyttele. Sitten jutellaan sopii terapeutille, joka aloittaa jokaisen keskustelun liikkeellä.",
        ],
      },
      {
        otsikko: "Valmistuneelle, yrittäjälle ja seuran huoltajalle",
        teksti: [
          "Paita on mieluinen valmistujaislahja fysioterapeuttiopiskelijalle ja onnittelulahja, kun oma vastaanotto avataan. Urheiluseuran fysio saa siitä kiitoksen kauden päätteeksi, ja työkaverit voivat antaa sen syntymäpäivänä.",
          "Jos lahjan saaja ohjaa myös kuntosalilla tai juoksukoulussa, kuntosalin ja juoksijan paidoissa on vitsejä harrastajan näkökulmasta. Terveysalan muiden ammattien paidat löydät alla olevista linkeistä.",
        ],
      },
      {
        otsikko: "Liike on lääke, vitsi on kuntoutusta",
        teksti: [
          "Fysioterapeutin työ on pitkäjänteistä: polven kuntoutus kestää kuukausia, ja jokaista pientä edistysaskelta juhlitaan. Välillä asiakas kysyy, voiko jumpan korvata hieronnalla, ja fysio vastaa samalla hymyllä kuin viimeksi. Ryhti. Minä näin sen syntyi juuri tästä ammattisilmästä, joka ei sammu edes juhlissa.",
          "Personoitavaan paitaan voi painaa fysion nimen ja lauseen, jota hän toistaa vastaanotolla viikosta toiseen. Asiakkaat ja kollegat tunnistavat sen heti, ja paita sopii sekä vastaanoton avajaisiin että kauden päätösjuhlaan.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja fysioterapeutille?",
        a: "Paita fysion arjesta, esimerkiksi Fysioterapeutti. Tiedän, ettet tehnyt kotiliikkeitä tai Kuminauha ja usko.",
      },
      {
        q: "Sopiiko paita urheiluseuran fysiolle?",
        a: "Sopii. Sattuu hyvällä tavalla ja Venyttele. Sitten jutellaan ovat tuttuja myös pukukopissa.",
      },
      {
        q: "Voiko paitaan lisätä vastaanoton nimen?",
        a: "Voi. Personoitavaan paitaan kirjoitat oman tekstin, kuten vastaanoton nimen tai fysion nimen.",
      },
    ],
    tuotteet: [/fysioterapeut/],
    mallit: [
      ["FYSIOTERAPEUTTI.", "TIEDÄN, ETTET", "TEHNYT KOTILIIKKEITÄ."],
      ["RYHTI.", "MINÄ NÄIN SEN."],
      ["KUMINAUHA", "JA USKO."],
      ["SATTUU", "HYVÄLLÄ TAVALLA."],
      ["VENYTTELE.", "SITTEN JUTELLAAN."],
    ],
    liittyvat: ["/paidat/kuntosali", "/paidat/juoksija", "/paidat/lahihoitaja", "/paidat/laakari", "/ammatit"],
    lisalinkit: [{ href: "/yritykset/urheiluseurat", label: "Paidat urheiluseuroille" }],
    personoitu: {
      teksti: "Kirjoita paitaan fysioterapeutin nimi, vastaanoton nimi tai työvuodet. Ehdotusta voi muokata ennen tilausta.",
      href: alallaVuotta("Fysioterapeutti, alalla 12 vuotta"),
      label: "Alalla X vuotta: Fysioterapeutti",
    },
  },
  {
    slug: "elainlaakari",
    nimi: "Eläinlääkärin paidat",
    ryhma: "ammatti",
    kohde: "eläinlääkärille",
    otsikko: "Lahja eläinlääkärille: paidat ja hupparit",
    kuvaus: "Hauskat paidat eläinlääkärille: potilaat eivät puhu, karvaa paidassa ja nami ensin, rokote sitten.",
    h1: "Hauska lahja eläinlääkärille",
    intro: [
      "Eläinlääkärille lahjaksi sopii paita, jossa on vastaanoton totuus: Potilaat eivät puhu. Silti ymmärrän ja Nami ensin. Rokote sitten.",
      "Mallit sopivat pieneläinklinikan eläinlääkärille, navetoita kiertävälle tuotantoeläinlääkärille ja eläinhoitajalle. Saatavana on t-paita ja huppari, joissa karvat eivät haittaa.",
      "Eläinlääkärin huumori on lämmintä, koska työ tehdään eläinten ehdoilla. Mallit nauravat karvoille, makupaloille ja yöpäivystykselle, ja jokainen niistä on kirjoitettu eläimiä kunnioittaen.",
    ],
    opas: [
      {
        otsikko: "Potilaana koira, kissa ja marsu",
        teksti: [
          "Eläinlääkärin potilas ei kerro, missä sattuu, joten oireet luetaan hännästä, korvista ja katseesta. Koira yrittää ystävystyä heti, kissa harkitsee asiaa pöydän alla. Iltapäivällä vastaanotolle tuodaan marsu, ja yöllä puhelin soi navetasta. Työpäivän jäljet näkyvät vaatteissa karvoina, joita ei saa lähtemään.",
          "Koirat rakastaa. Kissat harkitsee kertoo jokaisen klinikan arjesta. Karvaa paidassa. Työpäivä oli hyvä on paita, joka ei pelkää karvoja. Päivystän. Myös marsuille on vitsi viikonlopun päivystyksestä, jossa potilaan koko vaihtelee hevosesta hamsteriin.",
        ],
      },
      {
        otsikko: "Lahjaksi klinikalle tai eläinrakkaalle opiskelijalle",
        teksti: [
          "Paita sopii valmistuvalle eläinlääkärille, joka on opiskellut vuosia, ja eläinhoitajalle kiitokseksi rauhallisista käsistä. Lemmikin omistaja voi antaa sen kiitokseksi, kun koira on toipunut leikkauksesta. Klinikan pikkujouluissa jokainen saa oman mallinsa.",
          "Lemmikkiperheelle sopivat myös koiraihmisen ja kissaihmisen paidat, ja lääkärin sivulla ovat ihmislääkärin vitsit. Hevostallin väelle on oma sivunsa hevosihmisille.",
        ],
      },
      {
        otsikko: "Karvat, namit ja yöpäivystys",
        teksti: [
          "Eläinlääkärin taskut ovat täynnä makupaloja, koska ne avaavat useamman oven kuin mikään tutkimusväline. Koira istuu nätisti vaa'alla vain, jos palkka on näkyvissä. Kissa sen sijaan arvioi tilanteen kantokopan perältä ja tulee ulos omalla aikataulullaan. Nami ensin. Rokote sitten on paita, jonka jokainen klinikalla työskennellyt ymmärtää.",
          "Personoitavaan paitaan voi kirjoittaa klinikan nimen tai eläinlääkärin nimen ja vuodet alalla. Lemmikin omistaja voi myös painaa paitaan oman koiransa tai kissansa nimen kiitokseksi hoidosta.",
        ],
      },
    ],
    ukk: [
      {
        q: "Mikä on hauska lahja eläinlääkärille?",
        a: "Paita klinikan arjesta, esimerkiksi Potilaat eivät puhu. Silti ymmärrän tai Koirat rakastaa. Kissat harkitsee.",
      },
      {
        q: "Mikä on hyvä kiitos eläinlääkärille lemmikin hoidosta?",
        a: "Paita, jossa on lämmin eläinvitsi, kuten Nami ensin. Rokote sitten. Se ilahduttaa koko klinikkaa.",
      },
      {
        q: "Sopivatko paidat eläinhoitajalle?",
        a: "Sopivat. Mallit kertovat klinikan arjesta, joka on eläinlääkärille ja eläinhoitajalle yhteinen.",
      },
    ],
    tuotteet: [/eläinlääkär/],
    mallit: [
      ["POTILAAT", "EIVÄT PUHU.", "SILTI YMMÄRRÄN."],
      ["KARVAA PAIDASSA.", "TYÖPÄIVÄ OLI HYVÄ."],
      ["PÄIVYSTÄN.", "MYÖS MARSUILLE."],
      ["NAMI ENSIN.", "ROKOTE SITTEN."],
      ["KOIRAT RAKASTAA.", "KISSAT HARKITSEE."],
    ],
    liittyvat: ["/paidat/koiraihminen", "/paidat/kissaihminen", "/paidat/hevosihminen", "/paidat/laakari", "/ammatit"],
    personoitu: {
      teksti: "Personoitavaan paitaan voi painaa eläinlääkärin nimen, klinikan nimen tai potilaana olleen lemmikin nimen.",
      href: alallaVuotta("Eläinlääkäri, alalla 15 vuotta"),
      label: "Alalla X vuotta: Eläinlääkäri",
    },
  },
];
