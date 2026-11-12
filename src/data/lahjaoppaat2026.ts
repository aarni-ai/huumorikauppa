/**
 * Lahjahakujen oppaat (2.11.2026): 15 laskeutumissivun pidempi teksti (intro + opas 320-480 sanaa), lisä-UKK ja
 * uusien sivujen tuotteet. Yhdistetään src/data/landingPages.ts:n ja landingPagesSarjat.ts:n sivuihin
 * (lisaaOppaat). Teksteissä vain todennetut faktat; ei ajatusviivoja (src/seo/landing.test.ts).
 */
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "@/config/toimitus";

export interface LahjaOpas {
  title?: string;
  description?: string;
  h1?: string;
  intro: string[];
  opas: { otsikko: string; teksti: string[] }[];
  /** Uusilla sivuilla koko UKK, laajennetuilla lisäkysymykset. */
  faqs: { q: string; a: string }[];
  /** Uusien sivujen tuotteet slugeina (järjestyksessä). */
  tuotteet?: string[];
}

const RAAKA: Record<string, LahjaOpas> = {
  // Hakudatan aukot 5.11.2026 (Search Console 28 pv): läksiäislahjat ja joululahja opettajalle.
  "/laksiaislahja": {
    "title": "Läksiäislahja työkaverille: hauskat ideat | Huumorikauppa",
    "description": "Läksiäislahja työkaverille huumorilla: eläkeläisen paidat, Alalla X vuotta ja nimellä personoitava työsankari. Toimitus Suomeen.",
    "h1": "Hauska läksiäislahja työkaverille",
    "intro": [
      "Hyvä läksiäislahja työkaverille on paita, jonka teksti kertoo, mitä hän jättää taakseen tai mitä hänellä on edessä: eläkeläiselle vapaus, alanvaihtajalle vuodet talossa ja jokaiselle lähtijälle muisto yhteisistä kahvitauoista.",
      "Läksiäislahja ostetaan usein koko työporukan yhteislahjaksi. Paita on silloin helppo valinta, koska se on henkilökohtainen mutta ei liian kallis jaettavaksi, ja sen voi antaa yhdessä kortin kanssa, johon jokainen kirjoittaa oman terveisensä."
    ],
    "opas": [
      {
        "otsikko": "Eläkkeelle jäävälle",
        "teksti": [
          "Kun lähtijä jää eläkkeelle, vitsi kannattaa rakentaa vapauden ympärille. \"Vapautunut virallisesti\" ja \"Eläkkeellä. Kello on vain koru\" kertovat sen, mistä hän on puhunut kahvihuoneessa viimeiset kuukaudet. \"Eläkeläinen. Älä soita ennen kymmentä\" on varoitus entisille työkavereille, jotka kaipaavat vielä neuvoja.",
          "Eläkeläisen paitoja on sekä t-paitoina että huppareina. Huppari on hyvä valinta, jos eläkepäivät aiotaan viettää mökillä tai pihatöissä, ja t-paita, jos lahja on osa isompaa pakettia."
        ]
      },
      {
        "otsikko": "Kun työkaveri vaihtaa työpaikkaa",
        "teksti": [
          "Alanvaihtajalle tai uuteen firmaan siirtyvälle sopii personoitava paita. \"Alalla X vuotta\" -paitaan kirjoitetaan omat vuodet, ja \"[NIMI] Legendaarinen työsankari\" -paitaan lähtijän nimi. Molemmat kertovat, että hänen panoksensa huomattiin.",
          "Jos lähtijä on opettaja, \"Lukuvuosi ohi. Ääni palaa elokuussa\" sopii kevään viimeiseen kahvitaukoon. Ammattipaitoja löytyy myös muille aloille, ja ne on koottu ammattisivuille."
        ]
      },
      {
        "otsikko": "Yhteislahja ja aikataulu",
        "teksti": [
          "Paidat painetaan tilauksesta EU:ssa, joten tilaa lahja hyvissä ajoin ennen läksiäispäivää. Toimitusaika kerrotaan kassalla ja toimitusehdoissa. Jos aikaa ei ole, digitaalinen lahjakortti toimitetaan heti PDF-tiedostona, ja lähtijä valitsee paidan itse.",
          "Kun koko tiimi tilaa samaan aikaan esimerkiksi läksiäis- ja pikkujoululahjat, toimitus on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Mikä on hyvä läksiäislahja työkaverille?",
        "a": "Paita, jonka teksti liittyy lähtöön: eläkeläiselle esimerkiksi \"Vapautunut virallisesti\" ja alanvaihtajalle personoitava \"Alalla X vuotta\" omilla vuosilla."
      },
      {
        "q": "Sopiiko paita yhteislahjaksi?",
        "a": "Sopii. Paidan voi antaa kortin kanssa, johon jokainen työkaveri kirjoittaa terveisensä, ja kustannus jaetaan porukan kesken."
      },
      {
        "q": "Entä jos lähtijän koko ei ole tiedossa?",
        "a": "Valitse huppari, jossa väljä istuvuus haittaa vähemmän, tai digitaalinen lahjakortti, jonka arvo on 25, 35 tai 50 €."
      },
      {
        "q": "Paljonko toimitus maksaa?",
        "a": "Toimitus Suomeen maksaa {TOIMITUSMAKSU} €. Toimitus on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta."
      }
    ],
    "tuotteet": [
      "hauska-t-paita-elakelaiselle-vapautunut-virallisesti",
      "elakkeella-kello-on-vain-koru-t-paita-elakelaiselle",
      "elakkeella-kello-on-vain-koru-huppari-elakelaiselle",
      "elakelainen-ala-soita-ennen-kymmenta-t-paita-elakelaiselle",
      "personoitava-t-paita-alalla-x-vuotta",
      "personoitava-t-paita-nimi-legendaarinen-tyosankari",
      "olen-elakkeella-t-paita",
      "olen-elakkeella-huppari",
      "lukuvuosi-ohi-aani-palaa-elokuussa-t-paita-opettajalle",
      "lukuvuosi-ohi-aani-palaa-elokuussa-huppari-opettajalle"
    ]
  },
  "/joululahja-opettajalle": {
    "title": "Joululahja opettajalle: hauskat paidat | Huumorikauppa",
    "description": "Joululahja opettajalle ja varhaiskasvattajalle koulun omalla huumorilla: kokeet, välitunnin kahvi ja kopiokone. T-paidat ja hupparit.",
    "h1": "Hauska joululahja opettajalle",
    "intro": [
      "Opettajalle osuva joululahja on paita, jonka vitsin hän tunnistaa omasta työpäivästään: kokeet, välitunnilla kylmenevä kahvi, kopiokoneen jono ja käsiala, jota kukaan ei saa selville.",
      "Lahjan voi antaa yksi perhe, mutta usein se on luokan tai kollegoiden yhteislahja ennen joululomaa. Silloin paita on hyvä valinta, koska se on henkilökohtainen ja sen hinta jakautuu monelle."
    ],
    "opas": [
      {
        "otsikko": "Tekstit koulun arjesta",
        "teksti": [
          "\"Opettaja. Kahvi kylmeni välitunnilla\" sopii jokaiselle, joka on joskus juonut kahvinsa kylmänä valvontavuoron jälkeen. \"Tämä tulee kokeeseen. Kaikki tulee\" on lause, jonka jokainen oppilas on kuullut, ja \"Opettaja. Kyllä, näin sen\" muistuttaa, ettei luokan takarivi ole näkymätön.",
          "Äidinkielen opettajalle tai kenelle tahansa esseitä korjaavalle sopii \"Luen käsialaa, jota kirjoittaja ei itsekään lue\". Opettajainhuoneen kestosuosikki on \"Kopiokone ja minä olemme tauolla\"."
        ]
      },
      {
        "otsikko": "Varhaiskasvattajalle",
        "teksti": [
          "Päiväkodin väelle on oma paitansa: \"Varhaiskasvattaja. Selviän välipalalla\". Se on hyvä kiitos ryhmän aikuisille, jotka ovat pukeneet ja riisuneet lapsia koko syksyn.",
          "Jos lahja annetaan koko tiimille, samaa tekstiä voi tilata useamman, jolloin paidoista tulee ryhmän yhteinen vitsi. Toimitus on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta."
        ]
      },
      {
        "otsikko": "Hyvissä ajoin ennen joululomaa",
        "teksti": [
          "Paidat painetaan tilauksesta EU:ssa ja toimitetaan Suomeen, joten joulutilauksilla on takaraja. Viimeinen tilauspäivä on kerrottu joulun tilauspäivien sivulla. Jos lahja pitää antaa viimeisenä koulupäivänä, tilaa se ajoissa.",
          "Jos aika loppuu, digitaalinen lahjakortti toimitetaan heti PDF-tiedostona. Sen voi tulostaa joulukortin väliin, ja opettaja valitsee paidan itse."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Mikä on hauska joululahja opettajalle?",
        "a": "Paita, jonka vitsi tulee koulun arjesta, esimerkiksi \"Tämä tulee kokeeseen. Kaikki tulee\" tai \"Opettaja. Kahvi kylmeni välitunnilla\"."
      },
      {
        "q": "Sopiiko paita luokan yhteislahjaksi?",
        "a": "Sopii. Paidan voi antaa kortin kanssa, johon oppilaat kirjoittavat terveisensä, ja hinta jakautuu perheiden kesken."
      },
      {
        "q": "Onko lahja myös varhaiskasvattajalle?",
        "a": "On. \"Varhaiskasvattaja. Selviän välipalalla\" on saatavilla t-paitana ja hupparina."
      },
      {
        "q": "Ehtiikö lahja ennen joululomaa?",
        "a": "Joulun viimeinen tilauspäivä on kerrottu sivustolla. Digitaalinen lahjakortti toimitetaan heti PDF-tiedostona, joten se ehtii aina."
      }
    ],
    "tuotteet": [
      "tama-tulee-kokeeseen-kaikki-tulee-t-paita-opettajalle",
      "tama-tulee-kokeeseen-kaikki-tulee-huppari-opettajalle",
      "opettaja-kahvi-kylmeni-valitunnilla-t-paita-opettajalle",
      "opettaja-kahvi-kylmeni-valitunnilla-huppari-opettajalle",
      "opettaja-kylla-nain-sen-t-paita-opettajalle",
      "opettaja-kylla-nain-sen-huppari-opettajalle",
      "luen-kasialaa-jota-kirjoittaja-ei-itsekaan-lue-t-paita-opettajalle",
      "luen-kasialaa-jota-kirjoittaja-ei-itsekaan-lue-huppari-opettajalle",
      "kopiokone-ja-mina-olemme-tauolla-t-paita-opettajalle",
      "kopiokone-ja-mina-olemme-tauolla-huppari-opettajalle",
      "varhaiskasvattaja-selvian-valipalalla-t-paita-varhaiskasvattajalle",
      "varhaiskasvattaja-selvian-valipalalla-huppari-varhaiskasvattajalle"
    ]
  },
  "/lahjat/joululahjaksi-miehelle": {
    "title": "Joululahja miehelle: hupparit ja t-paidat | Huumorikauppa",
    "description": "Joululahja miehelle huumorilla: kalastus-, sauna- ja kinkkuaiheiset t-paidat ja hupparit. Painettu tilauksesta EU:ssa ja toimitettu Suomeen.",
    "h1": "Joululahja miehelle, joka nauraa itselleen",
    "intro": [
      "Miehelle osuva joululahja on huppari tai t-paita, jonka teksti tuntuu hänestä omalta: pilkkiretki, joulusauna tai kinkkuvahdin vuoro joulupöydässä. Kun teksti on tuttu, lahja otetaan käyttöön jo tapaninpäivänä eikä se jää kaapin perälle.",
      "T-paidat maksavat 24,90 eurosta 27,90 euroon ja hupparit 52,90 €. Joulumallisto 2026 tuo valikoimaan uusia tekstejä kinkusta, glögistä ja kaamoksesta, joten tuttujen harrastuspaitojen rinnalle löytyy myös puhtaasti jouluun sopivia vaihtoehtoja."
    ],
    "opas": [
      {
        "otsikko": "Harrastus ratkaisee tekstin",
        "teksti": [
          "Kalastajalle sopivat \"Pilkillä. Älä soita\" ja \"Kala oli tätäkin isompi\", jotka toimivat yhtä hyvin jäällä kuin kahvipöydässä. Saunan lämmittäjälle on \"Joulusaunan löylymestari\" ja omakotitalon pihaa kolaavalle \"Isäntä\".",
          "Jos miehen tunnusmerkki on kalju, \"Kalju\"-huppari kertoo sen ilman selityksiä. Mitä tarkemmin teksti osuu, sitä varmemmin paita päätyy arkikäyttöön. Mieti siis ensin, mistä hän puhuu kahvipöydässä eniten, ja valitse teksti sen perusteella."
        ]
      },
      {
        "otsikko": "Uutta joulumallistosta 2026",
        "teksti": [
          "Joulupöydän puolustajalle sopivat \"Kinkkuvahti. Älä koske.\" ja \"Joulukinkun suojelija.\". Glögikauden kestomaistaja saa paidan \"Glögin virallinen maistaja.\" ja pimeyttä vastaan taisteleva paidan \"Kaamos. Nukun kevääseen.\". Uutuuksissa t-paita maksaa 27,90 € ja huppari 52,90 €.",
          "Pikkujouluissa viihtyvälle miehelle sopii \"Pikkujoulut. Lauloin vain yhden laulun.\", ja lahjojen ostamista viimeiseen iltaan lykkäävälle \"Lahjapaniikki. Perinteinen joulutapa.\". Tällainen paita on lahja, jonka saaja tunnistaa itsestään ennen kuin paketti on kokonaan auki, ja juuri siksi se jää mieleen. Huppari on näistä talven käytännöllisin, koska sitä pidetään niin sisällä takan ääressä kuin pihalla lunta luodessa."
        ]
      },
      {
        "otsikko": "Huppari antaa koossa joustoa",
        "teksti": [
          "Jos koko on arvoitus, huppari on turvallisempi valinta, koska väljä malli istuu useammalle. Vilkaise hänen kaappiaan tai kysy puolisolta, mitä kokoa hän yleensä käyttää. Tilauksella on 14 päivän palautusoikeus, joka ei kuitenkaan koske personoituja tuotteita.",
          "Jokainen tuote painetaan tilauksesta EU:ssa, Tšekissä, Saksassa tai Ranskassa, ja toimitetaan Suomeen. Joulun viimeiset tilauspäivät näet sivustolta, joten tarkista ne ennen kuin lahjalista venyy."
        ]
      },
      {
        "otsikko": "Kaksi lahjaa samalla tilauksella",
        "teksti": [
          "Kun samaan tilaukseen tulee kaksi tuotetta, useimmista yhdistelmistä saa 5 % alennuksen. Samaan pakettiin mahtuu vaikkapa huppari miehelle ja t-paita hänen kalakaverilleen. Toimitus maksaa {TOIMITUSMAKSU} €, ja se on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta, joten kaksi hupparia kulkee perille ilman toimituskuluja.",
          "Jos lahjan saaja ja sen maksaja asuvat eri puolilla Suomea, tilauksen voi osoittaa suoraan saajalle. Silloin paketti odottaa häntä valmiina, ja sinä hoidat vain kortin. Muista kuitenkin tarkistaa osoite ja koko ennen maksamista, niin lahja osuu kohdalleen ensimmäisellä kerralla."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Missä paidat ja hupparit painetaan?",
        "a": "Tuotteet painetaan tilauksesta EU:ssa, Tšekissä, Saksassa tai Ranskassa. Valmis tuote toimitetaan suoraan Suomeen."
      },
      {
        "q": "Saako kahden tuotteen tilauksesta alennusta?",
        "a": "Saa. Kun tilaat kaksi tuotetta samalla kertaa, useimmista yhdistelmistä vähennetään 5 %. Toimitus on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta."
      }
    ]
  },
  "/joululahja-isalle": {
    "title": "Joululahja isälle: iskäpaidat ja hupparit | Huumorikauppa",
    "description": "Joululahja isälle, joka vahtii termostaattia ja kertoo isävitsejä: hauskat t-paidat ja hupparit, painettu tilauksesta EU:ssa ja toimitettu Suomeen.",
    "h1": "Joululahja isälle, joka tietää aina oikotien",
    "intro": [
      "Isän joulupakettiin sopii paita tai huppari, jonka teksti koko perhe tunnistaa heti: termostaatin vartija, sohvalla silmiään lepuuttava iskä tai mies, joka tietää oikotien joka paikkaan. Hyvä isälahja naurattaa ensin lapsia ja sitten isää itseään.",
      "Isäaiheiset t-paidat maksavat 27,90 € ja hupparit 52,90 €. Valmiiden tekstien lisäksi valikoimassa on personoitava paita, johon perhe lisää oman terveisensä."
    ],
    "opas": [
      {
        "otsikko": "Tekstit, jotka isä tunnistaa",
        "teksti": [
          "\"Kuka koski termostaattiin?\" on saatavilla sekä t-paitana että hupparina, ja sama pätee tekstiin \"En nuku. Lepuutan silmiä\". Autoilevalle isälle sopii \"Isä tietää oikotien. Aina\" ja sähkölaskua vahtivalle \"Sammuta valot. Sähkö maksaa\".",
          "Huonoista vitseistään ylpeä isä ansaitsee paidan \"Isävitsien ammattilainen\". Kodin korjausmiehelle on huppari \"Jos iskä ei osaa korjata sitä...\", ja kotitalon omistajalle t-paita \"Isäntä\". Paras teksti löytyy usein perheen omista sanonnoista. Jos lapset matkivat isän lausetta joka joulu, valitse paita, joka lainaa sitä. Isä ymmärtää vihjeen heti, ja muu perhe saa naurun kaupan päälle. Yksi sopiva lause riittää, eikä paitaan tarvita pitkää tarinaa."
        ]
      },
      {
        "otsikko": "Joulun omat isäpaidat",
        "teksti": [
          "Joulumallisto 2026 tuntee isän jouluroolit. \"Joulusiivouksen päällikkö. Komennan vain.\" sopii isälle, joka johtaa siivousta sohvalta, ja \"Joulurauha alkaa kun kaikki nukkuu.\" isälle, joka odottaa koko päivän iltaa. Kinkun ystävälle on \"Sinappia riittää. Kinkkua ei.\".",
          "Joulusaunan lämmittäjälle sopii \"Joulusaunan löylymestari\" ja kalastavalle isälle \"Kala oli tätäkin isompi\". Kun paita liittyy isän omaan joulurutiiniin, se otetaan käyttöön jo aattona. Huppari lämmittää myös saunan jälkeen kuistilla, kun isä vilvoittelee ja kertoo, miten ennen oli kylmempää."
        ]
      },
      {
        "otsikko": "Oma teksti isälle, jolla on kaikki",
        "teksti": [
          "Personoitava isäpaita Maailman Paras Isä on pohja, johon perhe kirjoittaa oman terveisensä tai isän lempinimen. Sellaista paitaa isällä ei vielä ole, koska se tehdään vasta tilauksesta.",
          "Huomaa, että 14 päivän palautusoikeus koskee valmiilla tekstillä painettuja tuotteita. Personoitua paitaa se ei koske, joten tarkista teksti ennen tilaamista. Kirjoitusvirhe paidassa on hauska vain silloin, kun se on tahallinen."
        ]
      },
      {
        "otsikko": "Lahjakortti, kun aika loppuu",
        "teksti": [
          "Jos isän toiveet selviävät vasta aattoviikolla, digitaalinen lahjakortti hoitaa asian. Sen arvo on 25, 35 tai 50 €, ja se toimitetaan heti tulostettavana PDF:nä, joten sen voi taittaa joulukortin väliin vielä aattoaamuna. Paitojen ja huppareiden viimeiset tilauspäivät löydät sivustolta.",
          "Kun tilaat ajoissa, toimitus maksaa {TOIMITUSMAKSU} € ja on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta. Tuotteet painetaan tilauksesta EU:ssa, Tšekissä, Saksassa tai Ranskassa, ja paketti toimitetaan perille Suomeen."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Mitä annan isälle, jos joulu on jo ovella?",
        "a": "Digitaalisen lahjakortin. Se toimitetaan heti tulostettavana PDF-tiedostona, ja arvoksi valitaan 25, 35 tai 50 €."
      },
      {
        "q": "Paljonko toimitus maksaa?",
        "a": "Toimitus Suomeen maksaa {TOIMITUSMAKSU} €. Toimitus on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta, ja kahdesta tuotteesta samassa tilauksessa saa useimmissa yhdistelmissä 5 % alennuksen."
      }
    ]
  },
  "/lahjat/joululahjaksi-naiselle": {
    "title": "Joululahja naiselle huumorilla | Huumorikauppa",
    "description": "Joululahja naiselle: Super äiskä, slay queen sekä joulumalliston glögi-, siivous- ja kaamospaidat. T-paidat ja hupparit painetaan tilauksesta EU:ssa.",
    "h1": "Joululahja naiselle, jolla on huumorintajua",
    "intro": [
      "Naiselle osuu jouluna parhaiten vaate, jonka teksti sanoo ääneen sen, mitä hän ajattelee joulukiireen keskellä: glögi ilman rusinoita, kaapit kiinni ennen vieraita tai hiljaisuus lahjatoiveena. Tällainen paita on lahja ja vitsi samassa paketissa.",
      "Valikoimassa ovat tutut Super äiskä- ja slay queen -mallit sekä joulumallisto 2026, jonka t-paidat maksavat 27,90 € ja hupparit 52,90 €. Talvella huppari on lämmin valinta, sillä sitä käytetään sisällä ja ulkona."
    ],
    "opas": [
      {
        "otsikko": "Äidille ja ystävälle",
        "teksti": [
          "Äidille sopivat \"Super äiskä\" hupparina tai t-paitana sekä \"maailman paras ÄITI\". Ystävälle, joka kantaa itsensä kuin kuningatar, on \"slay queen\" niin ikään molempina malleina.",
          "Pyöreitä vuosia juhlivalle löytyy paita \"30v paranen iän myötä kuin viini\", joka toimii syntymäpäivän lisäksi myös joulupaketissa. Kun teksti kertoo saajan omasta roolista, lahja tuntuu valitulta eikä hätäostokselta. Mieti siis, missä roolissa hän itse viihtyy parhaiten, ja anna tekstin kehua sitä."
        ]
      },
      {
        "otsikko": "Joulumalliston naurattavimmat tekstit",
        "teksti": [
          "\"Joulusiivous tarkoittaa kaapit kiinni.\" ja \"Pöly on osa joulutunnelmaa.\" sopivat naiselle, joka ei aio viettää aattoa pölyrätin kanssa. Kotitöiden näkymättömälle johtajalle on \"Kotitonttu. Ei palkkaa. Ei lomaa.\".",
          "Glögin ystävä saa paidan \"Glögi. Ilman rusinoita.\" ja joulukiireestä uupunut paidan \"Lahjatoive: Hiljaisuus.\". Työpaikan pikkujoulujen sielulle sopii \"Pikkujouluissa kaikki on salaista.\", ja lahjat aina ajoissa hankkivalle siskolle tai ystävälle \"Ostin itselleni lahjan. Varmuuden vuoksi.\". Jokaista joulumalliston tekstiä saa sekä t-paitana että hupparina, joten saman vitsin voi valita saajan tyylin mukaan."
        ]
      },
      {
        "otsikko": "Talven pimeyteen",
        "teksti": [
          "\"Marraskuussa en ole aamuihminen.\" ja \"D-vitamiinia ja kahvia. Kaamosdieetti.\" ovat lahjoja, joita käytetään joulun jälkeenkin koko pimeän kauden ajan. Huppari on näille teksteille luonteva pohja, koska tammikuussa lämpö ratkaisee.",
          "Jos saaja rakastaa talvea, valitse mieluummin \"Kuuma glögi. Kylmä talvi. Täydellistä.\". Se on yhtä lailla talven kunnianosoitus kuin vitsi, ja sopii hyvin naiselle, joka hiihtää mieluummin kuin valittaa pakkasesta."
        ]
      },
      {
        "otsikko": "Palautus ja toimitus",
        "teksti": [
          "Valmiilla tekstillä painetulla tuotteella on 14 päivän palautusoikeus. Personoidut tuotteet tehdään saajan omalla tekstillä, joten palautusoikeus ei koske niitä. Jos et ole varma tekstistä, valmis malli on siksi joustavampi lahja.",
          "Tuotteet painetaan EU:ssa ja toimitetaan Suomeen. Toimitus maksaa {TOIMITUSMAKSU} € ja on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta, ja kahden tuotteen tilauksesta saa useimmissa yhdistelmissä 5 % alennuksen. Jos toiveet ovat hukassa, digitaalinen lahjakortti on saatavilla 25, 35 tai 50 euron arvoisena, ja se toimitetaan heti tulostettavana PDF:nä."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Voiko personoidun lahjan palauttaa?",
        "a": "Ei voi. 14 päivän palautusoikeus koskee valmiilla tekstillä painettuja tuotteita, mutta saajan omalla tekstillä tehty tuote valmistetaan vain häntä varten."
      },
      {
        "q": "Onko joulumallistossa naiselle sopivia malleja?",
        "a": "On. Esimerkiksi \"Glögi. Ilman rusinoita.\", \"Kotitonttu. Ei palkkaa. Ei lomaa.\" ja \"Marraskuussa en ole aamuihminen.\" ovat saatavilla sekä t-paitana että hupparina."
      }
    ]
  },
  "/joululahja-anopille": {
    "title": "Joululahja anopille: hauskat anoppipaidat | Huumorikauppa",
    "description": "Joululahja anopille huumorilla: anopin joulukinkku, anopin arvio ja muut joulumalliston 2026 t-paidat ja hupparit. Toimitus Suomeen.",
    "h1": "Hauska joululahja anopille",
    "intro": [
      "Anopille sopii jouluksi paita tai huppari, joka kehuu häntä pilke silmäkulmassa, kuten \"Anopin joulukinkku on parempi.\". Kehu ja vitsi samassa lahjassa toimivat, kun anopilla on huumorintajua ja välit ovat lämpimät.",
      "Anoppiaiheiset mallit kuuluvat joulumallistoon 2026. Jokaista saa t-paitana hintaan 27,90 € ja hupparina hintaan 52,90 €, joten lahjan voi mitoittaa sekä budjetin että anopin pakkasherkkyyden mukaan. Valitse teksti sen mukaan, kenen kustannuksella joulupöydässä yleensä nauretaan: anopin, vävyn vai kinkun."
    ],
    "opas": [
      {
        "otsikko": "Tekstit anopille itselleen",
        "teksti": [
          "Kun anoppi on joulun keskipiste, \"Maailman paras anoppi. Sanoi anoppi.\" antaa hänelle tittelin, jonka hän olisi ottanut itselleen muutenkin. Jos hänen kinkkunsa on suvun mittapuu, \"Anopin joulukinkku on parempi.\" sanoo sen ääneen koko pöydälle.",
          "Molemmat tekstit kehuvat anoppia, joten ne sopivat myös silloin, kun olette viettäneet yhteisiä jouluja vasta muutaman. Kehu on turvallinen alku, ja vitsi kertoo, että uskallatte nauraa yhdessä."
        ]
      },
      {
        "otsikko": "Paidat vävylle ja miniälle",
        "teksti": [
          "\"Anoppi tulee jouluksi. Pysy rauhallisena.\" ja \"Anoppi arvioi. Minä hymyilen.\" on kirjoitettu toisesta näkökulmasta. Ne ovat lahja vävylle, miniälle tai itselle, ja parhaimmillaan anoppi nauraa niille itse kovimmin.",
          "Ne toimivat myös parina: anoppi saa kinkkupaidan ja vävy paidan \"Anoppi arvioi. Minä hymyilen.\". Yhteiskuva joulupöydästä on taattu, ja tarina kerrotaan seuraavanakin jouluna. Kahdesta tuotteesta samassa tilauksessa saa lisäksi useimmissa yhdistelmissä 5 % alennuksen."
        ]
      },
      {
        "otsikko": "Kun anopin huumori on arvoitus",
        "teksti": [
          "Jos et vielä tunne anopin huumorintajua, valitse teksti, joka ei koske häntä lainkaan. Silloin vitsi kohdistuu jouluun eikä häneen. Glögin ystävälle sopii \"Glögi. Ilman rusinoita.\" ja joulupöydän emännälle \"Kinkku on minun rakkauskieleni.\". Tonttujen keräilijä ilahtuu paidasta \"Tonttu näkee. Ole kiltti.\", joka sopii myös lastenlasten muistutukseksi aattoiltana.",
          "Varmin vaihtoehto on digitaalinen lahjakortti, jonka arvo on 25, 35 tai 50 €. Se toimitetaan heti tulostettavana PDF:nä, ja anoppi valitsee mieleisensä itse. Sen voi antaa yksinään tai pienen paketin rinnalla, jolloin kuusen alla on silti jotain avattavaa."
        ]
      },
      {
        "otsikko": "Tilaus ja toimitus",
        "teksti": [
          "Tuotteet painetaan tilauksesta EU:ssa ja toimitetaan Suomeen. Toimitus maksaa {TOIMITUSMAKSU} €, ja se on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta. Joulun viimeiset tilauspäivät näet sivustolta.",
          "Valmiilla tekstillä painetulla tuotteella on 14 päivän palautusoikeus, joten väärän koon voi palauttaa. Personoituja tuotteita palautusoikeus ei koske. Jos anoppi asuu toisella paikkakunnalla, paketti kannattaa tilata suoraan hänelle, jolloin lahja odottaa häntä kotona jo ennen joulua."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Millainen lahja ilahduttaa anoppia jouluna?",
        "a": "Paita tai huppari, joka kehuu häntä huumorilla, esimerkiksi \"Anopin joulukinkku on parempi.\" tai \"Anoppi arvioi. Minä hymyilen.\"."
      },
      {
        "q": "Entä jos anoppi ei pidä anoppivitseistä?",
        "a": "Valitse joulumalliston yleisempi teksti, kuten glögi- tai kinkkupaita, tai anna digitaalinen lahjakortti. Lahjakortin arvo on 25, 35 tai 50 €."
      },
      {
        "q": "Huppari vai t-paita anopille?",
        "a": "Huppari maksaa 52,90 € ja on lämmin talvilahja, jota käytetään myös mökillä ja pihatöissä. T-paita maksaa 27,90 € ja sopii, jos lahja on osa isompaa pakettia."
      },
      {
        "q": "Ehtiikö lahja perille jouluksi?",
        "a": "Joulun viimeiset tilauspäivät on kerrottu sivustolla. Lahjakortti toimitetaan heti PDF-tiedostona, joten se ehtii aina."
      }
    ],
    "tuotteet": [
      "maailman-paras-anoppi-sanoi-anoppi-t-paita-jouluun",
      "maailman-paras-anoppi-sanoi-anoppi-huppari-jouluun",
      "anopin-joulukinkku-on-parempi-t-paita-jouluun",
      "anopin-joulukinkku-on-parempi-huppari-jouluun",
      "anoppi-tulee-jouluksi-pysy-rauhallisena-t-paita-jouluun",
      "anoppi-tulee-jouluksi-pysy-rauhallisena-huppari-jouluun",
      "anoppi-arvioi-mina-hymyilen-t-paita-jouluun",
      "anoppi-arvioi-mina-hymyilen-huppari-jouluun",
      "kinkku-on-minun-rakkauskieleni-t-paita-jouluun",
      "kinkku-on-minun-rakkauskieleni-huppari-jouluun",
      "joulukinkun-suojelija-t-paita-jouluun",
      "joulukinkun-suojelija-huppari-jouluun",
      "kuuma-glogi-kylma-talvi-taydellista-t-paita-jouluun",
      "kuuma-glogi-kylma-talvi-taydellista-huppari-jouluun",
      "glogi-ilman-rusinoita-t-paita-jouluun",
      "glogi-ilman-rusinoita-huppari-jouluun",
      "joulusiivouksen-paallikko-komennan-vain-t-paita-jouluun",
      "joulusiivouksen-paallikko-komennan-vain-huppari-jouluun",
      "tonttu-nakee-ole-kiltti-t-paita-jouluun",
      "tonttu-nakee-ole-kiltti-huppari-jouluun",
      "joulurauha-alkaa-kun-kaikki-nukkuu-t-paita-jouluun",
      "joulurauha-alkaa-kun-kaikki-nukkuu-huppari-jouluun",
      "lahjatoive-hiljaisuus-t-paita-jouluun",
      "lahjatoive-hiljaisuus-huppari-jouluun",
      "rauhallista-joulua-paitsi-meilla-t-paita-jouluun",
      "kiltti-enimmakseen-huppari-jouluun",
      "riisipuurosta-loysin-vain-riisia-t-paita-jouluun",
      "joulukortit-lahtevat-ensi-vuonna-t-paita-jouluun"
    ]
  },
  "/hauska-joululahja": {
    "title": "Hauska joululahja: paidat ja hupparit 2026 | Huumorikauppa",
    "description": "Hauska joululahja kinkun ystävälle, glögin maistajalle tai lahjapaniikin uhrille: joulumalliston 2026 t-paidat, hupparit ja digitaaliset lahjakortit.",
    "h1": "Hauska joululahja, joka naurattaa jo paketista",
    "intro": [
      "Hauskaksi joululahjaksi sopii t-paita tai huppari, jonka teksti tunnistaa saajan jouluperinteen: kinkkukooman, kolmannen glögin tai viime hetken lahjaostajan paidan. Kun vitsi on saajan oma, paketin avaamisesta tulee illan kohokohta, ja paita muistuttaa siitä vielä seuraavanakin jouluna.",
      "Joulumallisto 2026 kokoaa yhteen kinkun, glögin, tontut, joulusiivouksen, lahjapaniikin ja kaamoksen, eli juuri ne aiheet, joista joulupöydässä puhutaan joka vuosi. Uutuuksien t-paidat maksavat 27,90 € ja hupparit 52,90 €, ja kaikki tuotteet painetaan tilauksesta EU:ssa."
    ],
    "opas": [
      {
        "otsikko": "Valitse vitsi saajan jouluroolin mukaan",
        "teksti": [
          "Joulupöydän vartijalle sopivat \"Kinkkuvahti. Älä koske.\" ja \"Kinkkukooma alkaa klo 14\". Glögistä lauluintoa saava ansaitsee paidan \"Kolmas glögi. Nyt laulan.\" ja kiltteydestään epävarma paidan \"Olin kiltti. Todisteet hävisivät.\".",
          "Joulua viimeiseen asti lykkäävälle on \"Joulu tulee. Olen valmis ensi vuonna.\" ja lahjapaperin kanssa painivalle \"Paketointi ei ole vahvuuteni\". Jos saaja ostaa lahjat aina myöhään, \"Lahjapaniikki. Perinteinen joulutapa.\" osuu kohdalleen, ja hän tunnistaa itsensä viimeistään aaton aamupäivänä. Lokakuussa kaikki lahjansa paketoinut järjestelmällinen ystävä puolestaan saa paidan \"Ostin itselleni lahjan. Varmuuden vuoksi.\"."
        ]
      },
      {
        "otsikko": "Tontut, siivous ja pimeä marraskuu",
        "teksti": [
          "Kodin näkymättömille ahertajille eli kotitontuille on omat tekstinsä: \"Tontun työsopimus päättyy 24.12.\" ja \"Tonttu. Valvoo. Aina.\". Siivouksen oikotiestä innostunut saa paidan \"Siivosin jouluksi. Tuolin päältä.\".",
          "Pimeän kauden lahjat \"Otsalamppu on muotia marraskuussa.\" ja \"Kaamoksen selviytyjä 2026.\" pysyvät ajankohtaisina koko talven, joten niitä käytetään vielä tammikuussakin."
        ]
      },
      {
        "otsikko": "Pikkujouluihin ja työkaverille",
        "teksti": [
          "Työpaikan pikkujouluihin sopivat \"Pikkujoulut. Nyt sinuttelen esimiestä.\" ja \"Tanssilattian kuningas. Pikkujoulut 2026.\". Illan vastuunkantajalle on \"Pikkujoulujen nimetty kuski\", joka on samalla kohtelias kiitos kyydistä.",
          "Jos salaisen joulupukin summaksi on sovittu 30 euroa, joulumalliston t-paita mahtuu siihen. Valitse teksti, joka naurattaa koko porukkaa eikä vain yhtä ihmistä, sillä lahja avataan yleensä kaikkien nähden."
        ]
      },
      {
        "otsikko": "Kun aika tai idea loppuu",
        "teksti": [
          "Digitaalinen lahjakortti on 25, 35 tai 50 euron arvoinen, ja se toimitetaan heti tulostettavana PDF:nä. Sen rinnalle sopii paita \"Lahjakortti on myös lahja.\", jolloin pakettiin tulee myös jotain avattavaa. Yhdistelmä on samalla vitsi, jonka saaja ymmärtää heti. Lahjakortilla hän voi valita itse mallin ja koon, joten kokoa ei tarvitse arvata.",
          "Kahden tuotteen tilauksesta saa useimmissa yhdistelmissä 5 % alennuksen. Toimitus Suomeen maksaa {TOIMITUSMAKSU} € ja on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta. Fyysisten lahjojen viimeiset tilauspäivät on kerrottu sivustolla, ja niiden jälkeenkin lahjakortti ehtii perille samana päivänä."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Mikä tekee joululahjasta hauskan?",
        "a": "Teksti, joka liittyy saajan omaan jouluun: hänen kinkkuunsa, glögiinsä tai tapaansa ostaa lahjat viime hetkellä. Yleinen vitsi naurattaa hetken, osuva vitsi koko joulun."
      },
      {
        "q": "Mitä annan, jos en tiedä saajan kokoa?",
        "a": "Huppari on väljän mallinsa ansiosta turvallisempi valinta. Toinen vaihtoehto on digitaalinen lahjakortti, jonka arvo on 25, 35 tai 50 €."
      },
      {
        "q": "Miten lahjakortti toimitetaan?",
        "a": "Lahjakortti toimitetaan heti tulostettavana PDF-tiedostona. Sen voi tulostaa joulukortin väliin tai antaa sellaisenaan."
      },
      {
        "q": "Saako useamman lahjan tilauksesta etua?",
        "a": "Kahden tuotteen tilauksesta saa useimmissa yhdistelmissä 5 % alennuksen, ja toimitus on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta. Muuten toimitus maksaa {TOIMITUSMAKSU} €."
      }
    ],
    "tuotteet": [
      "kinkkuvahti-ala-koske-t-paita-jouluun",
      "kinkkuvahti-ala-koske-huppari-jouluun",
      "kolmas-glogi-nyt-laulan-t-paita-jouluun",
      "kolmas-glogi-nyt-laulan-huppari-jouluun",
      "olin-kiltti-todisteet-havisivat-t-paita-jouluun",
      "olin-kiltti-todisteet-havisivat-huppari-jouluun",
      "joulu-tulee-olen-valmis-ensi-vuonna-t-paita-jouluun",
      "joulu-tulee-olen-valmis-ensi-vuonna-huppari-jouluun",
      "tontun-tyosopimus-paattyy-24-12-t-paita-jouluun",
      "tontun-tyosopimus-paattyy-24-12-huppari-jouluun",
      "tonttu-valvoo-aina-t-paita-jouluun",
      "tonttu-valvoo-aina-huppari-jouluun",
      "siivosin-jouluksi-tuolin-paalta-t-paita-jouluun",
      "siivosin-jouluksi-tuolin-paalta-huppari-jouluun",
      "otsalamppu-on-muotia-marraskuussa-t-paita-talveen",
      "otsalamppu-on-muotia-marraskuussa-huppari-talveen",
      "kaamoksen-selviytyja-2026-t-paita-talveen",
      "kaamoksen-selviytyja-2026-huppari-talveen",
      "pikkujoulut-nyt-sinuttelen-esimiesta-t-paita-jouluun",
      "pikkujoulut-nyt-sinuttelen-esimiesta-huppari-jouluun",
      "tanssilattian-kuningas-pikkujoulut-2026-t-paita-jouluun",
      "tanssilattian-kuningas-pikkujoulut-2026-huppari-jouluun",
      "lahjakortti-on-myos-lahja-t-paita-jouluun",
      "lahjakortti-on-myos-lahja-huppari-jouluun",
      "ostin-itselleni-lahjan-varmuuden-vuoksi-t-paita-jouluun",
      "ostin-itselleni-lahjan-varmuuden-vuoksi-huppari-jouluun",
      "lahjat-ostettu-23-12-klo-17-58-t-paita-jouluun",
      "kinkkukooma-alkaa-klo-14-t-paita-jouluun",
      "paketointi-ei-ole-vahvuuteni-t-paita-jouluun",
      "pikkujoulujen-nimetty-kuski-t-paita-pikkujouluihin",
      "kiltti-enimmakseen-huppari-jouluun"
    ]
  },
  "/pikkujoululahja-alle-30-euroa": {
    "title": "Pikkujoululahja alle 30 € | Huumorikauppa",
    "description": "Hauska lahja pikkujouluihin alle 30 eurolla: t-paidat 24,90 ja 27,90 € sekä heti tulostettava lahjakortti 25 €. Paidat painetaan tilauksesta EU:ssa.",
    "h1": "Hauska pikkujoululahja alle 30 euroa",
    "intro": [
      "Pikkujoululahja alle 30 euroa löytyy Huumorikaupasta helposti: t-paidat maksavat 24,90 tai 27,90 euroa ja digitaalinen lahjakortti 25 euroa. Näin lahjanvaihdon sovittu summa pitää, eikä kenenkään tarvitse laskea senttejä paketin vieressä.",
      "Painettu paita sopii lahjanvaihtoon, koska nauru alkaa jo silloin, kun paketti avataan. Valitse teksti juhlan hengen mukaan: karaokeillan tähdelle, illan kuskille tai sille kollegalle, joka muistaa juhlista vain osan. Toisin kuin moni pikkutavara, paita jää käyttöön vielä juhlien jälkeenkin."
    ],
    "opas": [
      {
        "otsikko": "Paidat juhlien hengessä",
        "teksti": [
          "Pikkujouluja varten tehdyissä paidoissa juhlan tutut tilanteet ovat valmiina tekstinä: \"Tänään tanssin. Huomenna kadun\", \"Karaokevuoro varattu jo syyskuussa\" ja \"Pikkujoulut. Muistan osittain\". Illan vastuunkantajalle sopii \"Pikkujoulujen nimetty kuski\".",
          "Vuoden 2026 joulumallistossa on lisää 27,90 euron paitoja samasta aiheesta, esimerkiksi \"Pikkujoulut. Lauloin vain yhden laulun.\", \"Pikkujoulut. Nyt sinuttelen esimiestä.\" ja \"Tanssilattian kuningas. Pikkujoulut 2026.\" Edullisimmat paidat maksavat 24,90 euroa, esimerkiksi meemiklassikko \"se oli tonnin seteli.\", jolloin budjettiin jää vielä hieman pelivaraa."
        ]
      },
      {
        "otsikko": "Lahjanvaihtoon tuntemattomalle",
        "teksti": [
          "Arvonnassa lahja päätyy helposti ihmiselle, jonka huumorintajua et tunne. Silloin joulun yleiset aiheet ovat turvallinen valinta, sillä \"Kiltti. Enimmäkseen\", \"Piparivaras. Ei todisteita\" ja \"Glögi ensin. Sitten joulu\" naurattavat ilman sisäpiirin vitsejä. Myös \"Tonttu koeajalla\" ja \"Joulustressi? En tunne\" toimivat, olipa saaja nuori harjoittelija tai talon kokenein konkari.",
          "Kun koko ei ole tiedossa, digitaalinen lahjakortti 25 euroa ratkaisee asian. Se toimitetaan heti tulostettavana PDF-tiedostona, joten sen ehtii hankkia vielä juhlapäivän aamuna. Tulostetun kortin voi pakata pieneen rasiaan, jolloin lahjassa on silti jotain avattavaa."
        ]
      },
      {
        "otsikko": "Oma teksti työporukan vitsille",
        "teksti": [
          "Jokaisella työyhteisöllä on oma sisäpiirin juttunsa, ja sen saa painettua paitaan. Tekstiksi käy vaikka illan teema, tiimin nimi tai lausahdus, jonka koko osasto tunnistaa. Omalla tekstillä tehty t-paita maksaa 27,90 euroa, joten sekin mahtuu kolmenkympin budjettiin. Personoidulla tuotteella ei ole palautusoikeutta, joten tarkista kirjoitusasu ennen tilausta. Valmiin tekstin paita on varmempi valinta silloin, kun et tunne saajaa."
        ]
      },
      {
        "otsikko": "Tilaus ja toimitus",
        "teksti": [
          "Paidat painetaan tilauksesta EU:ssa, Tšekissä, Saksassa tai Ranskassa, ja toimitetaan Suomeen. Toimitus maksaa {TOIMITUSMAKSU} euroa ja on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta, joten porukan kannattaa koota lahjat yhteen tilaukseen. Kahdesta tuotteesta samassa tilauksessa saa useimmissa yhdistelmissä 5 % alennuksen, ja muilla kuin personoiduilla tuotteilla on 14 päivän palautusoikeus.",
          "Koska paita valmistetaan vasta tilauksen jälkeen, tee tilaus hyvissä ajoin ennen juhlia. Jos aikaa ei enää ole, lahjakortti pelastaa tilanteen, sillä PDF on käytettävissä heti."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Mitä pikkujouluihin saa alle 30 eurolla?",
        "a": "Hauskan t-paidan hintaan 24,90 tai 27,90 €, omalla tekstillä painetun t-paidan hintaan 27,90 € tai digitaalisen lahjakortin, jonka arvo on 25 €."
      },
      {
        "q": "Ehtiikö lahjakortti, jos juhlat ovat jo huomenna?",
        "a": "Ehtii. Lahjakortti toimitetaan heti PDF-tiedostona, jonka tulostat ja pakkaat itse."
      },
      {
        "q": "Voiko pikkujoulupaidan palauttaa?",
        "a": "Valmiilla painatuksella tehdyllä paidalla on 14 päivän palautusoikeus. Omalla tekstillä personoitua paitaa se ei koske."
      },
      {
        "q": "Mitä toimitus maksaa?",
        "a": "Toimitus Suomeen maksaa {TOIMITUSMAKSU} €. Toimitus on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta, joten yhteistilaus säästää toimituskuluissa."
      }
    ],
    "tuotteet": [
      "tanaan-tanssin-huomenna-kadun-t-paita-pikkujouluihin",
      "karaokevuoro-varattu-jo-syyskuussa-t-paita-pikkujouluihin",
      "pikkujoulujen-nimetty-kuski-t-paita-pikkujouluihin",
      "pikkujoulut-muistan-osittain-t-paita-pikkujouluihin",
      "kiltti-enimmakseen-t-paita-jouluun",
      "piparivaras-ei-todisteita-t-paita-jouluun",
      "glogi-ensin-sitten-joulu-t-paita-jouluun",
      "tonttu-koeajalla-t-paita-jouluun",
      "joulustressi-en-tunne-t-paita-jouluun",
      "paketointi-ei-ole-vahvuuteni-t-paita-jouluun",
      "kinkkukooma-alkaa-klo-14-t-paita-jouluun",
      "lahjat-ostettu-23-12-klo-17-58-t-paita-jouluun",
      "joulukortit-lahtevat-ensi-vuonna-t-paita-jouluun",
      "rauhallista-joulua-paitsi-meilla-t-paita-jouluun",
      "se-oli-tonnin-seteli-t-paita",
      "oma-tekstikuva-t-paita"
    ]
  },
  "/joululahja-elakelaiselle": {
    "title": "Hauska lahja eläkeläiselle jouluksi | Huumorikauppa",
    "description": "Eläkeläishuumoria jouluksi: Eläkkeellä. Kello on vain koru, Maanantai on nyt vain sana ja muut paidat. T-paidat alkaen 24,90 €, hupparit 52,90 €.",
    "h1": "Hauska joululahja eläkeläiselle",
    "intro": [
      "Hyvä lahja eläkeläiselle on paita tai huppari, jonka teksti nauraa vapaille päiville eikä iälle, kuten \"Eläkeläinen. Kaikki päivät ovat lauantaita\" tai \"Maanantai on nyt vain sana\". Jouluna tällainen paketti saa koko perheen nauramaan ennen kuin kahvit on kaadettu.",
      "Eläkkeellä arki saa uuden rytmin: herätyskello on hiljaa, lehti luetaan kannesta kanteen ja päiväunet kuuluvat ohjelmaan. Sivun tekstit on poimittu juuri tuosta arjesta, ja ne sopivat yhtä hyvin tuoreelle eläkeläiselle kuin vuosia vapaasta nauttineelle. Teksteissä ei pilkata ikää, vaan juhlitaan sitä, että aikaa on vihdoin omille asioille."
    ],
    "opas": [
      {
        "otsikko": "Kahvia, lehteä ja päiväunia",
        "teksti": [
          "Rauhallisen arjen ystävälle sopivat \"Eläkeläisen työpäivä: kahvi, lehti, päikkärit\" ja \"Palkka loppui. Päikkärit jatkuu\". Myöhään nukkuvalle osuu \"Eläkeläinen. Älä soita ennen kymmentä\", ja \"Herätyskello eläkkeellä myös\" kertoo saman asian lyhyemmin.",
          "Nämä tekstit sopivat saajalle, joka odotti eläkepäiviä pitkään ja nauttii nyt jokaisesta kiireettömästä aamusta. Lahjana ne ovat helppoja, koska aihe on tuttu jokaiselle eläkkeellä olevalle ja vitsi aukeaa ilman selityksiä."
        ]
      },
      {
        "otsikko": "Touhukkaalle eläkeläiselle",
        "teksti": [
          "Kaikille eläkepäivät eivät ole lepoa, sillä yhdistykset, kurssit ja matkat täyttävät kalenterin. Tälle saajalle sopivat \"Eläkkeellä. Kiireinen silti\" ja \"Suunnitelma tälle päivälle: ei suunnitelmaa\", joista jälkimmäinen ilahduttaa myös sitä, joka on oppinut ottamaan rennosti. Paita muistuttaa hauskasti siitä, että kiire on nyt omaa valintaa.",
          "Kesät mökillä viettävälle sopii \"Työt loppui. Mökki ei\", ja lastenlapsia hoitavalle \"Täysipäiväinen isovanhempi\", jonka voi antaa lastenlasten nimissä. Neuvoja mielellään jakava saaja tunnistaa itsensä paidasta \"Kokenut eläkeläinen. Neuvoja ilmaiseksi\". Kun teksti osuu saajan omaan elämään, paita päätyy päälle jo joulupäivän kahvipöytään."
        ]
      },
      {
        "otsikko": "Huppari pakkasiin, lahjakortti varalle",
        "teksti": [
          "Talvikäyttöön teksti \"Eläkkeellä. Kello on vain koru\" löytyy sekä hupparina 52,90 eurolla että t-paitana 27,90 eurolla. Kun samaan tilaukseen tulee kaksi tuotetta, useimmista yhdistelmistä saa 5 % alennuksen, ja toimitus on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta.",
          "Jos saajan koko on arvoitus, digitaalinen lahjakortti 25, 35 tai 50 euroa on varma valinta. Se saapuu heti tulostettavana PDF-tiedostona, jonka voit taittaa joulukortin väliin. Lahjakortin ja paidan voi myös yhdistää, jos haluat antaa jotain konkreettista avattavaksi."
        ]
      },
      {
        "otsikko": "Edullisemmat vaihtoehdot ja toimitus",
        "teksti": [
          "Edullisimmat eläkepaidat maksavat 24,90 euroa, kuten \"100% Eläkeläinen\" ja \"Olen eläkkeellä\". Edullisempi paita sopii myös lisälahjaksi hupparin rinnalle. Jokainen paita ja huppari painetaan vasta tilauksen jälkeen Tšekissä, Saksassa tai Ranskassa, joten joulupaketit kannattaa tilata hyvissä ajoin ennen aattoa. Toimitus Suomeen maksaa {TOIMITUSMAKSU} euroa."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Mitä eläkeläiselle, jonka vaatekokoa et tiedä?",
        "a": "Digitaalisen lahjakortin, jonka arvo on 25, 35 tai 50 €. Saat sen heti PDF-tiedostona, ja saaja valitsee itse paidan tai hupparin sopivassa koossa."
      },
      {
        "q": "Voiko lahjan palauttaa, jos koko ei sovi?",
        "a": "Voi. Tuotteilla on 14 päivän palautusoikeus, mutta se ei koske personoituja tuotteita, joihin on painettu oma teksti."
      }
    ]
  },
  "/50-vuotislahja": {
    "title": "Hauska 50-vuotislahja: paidat ja hupparit | Huumorikauppa",
    "description": "Lahja 50-vuotiaalle huumorilla: 50 vuotta nuori, 50 ja hopeanhohtoinen ja muut ikätekstit. T-paidat 27,90 €, hupparit 52,90 €, painetaan EU:ssa.",
    "h1": "Hauska 50-vuotislahja",
    "intro": [
      "Hauska 50-vuotislahja on t-paita tai huppari, jonka teksti kääntää puolen vuosisadan iän kehuksi, kuten \"50 vuotta nuori\". Tällainen lahja juhlii saajaa eikä muistuta häntä vuosista ikävällä tavalla. Juhlapöydässä tällainen paketti herättää naurun jo ennen kakkukahveja.",
      "Tekstit eivät ole sidottuja sukupuoleen, joten sama paita käy siskolle, naapurille tai pitkäaikaiselle työkaverille. Jos haluat rajata valinnan, miehelle ja naiselle on koottu omat lahjasivunsa. Hyvä vitsi kantaa vielä vuosia, ja paidasta saa myös juhlijan oman asun itse juhlapäivään."
    ],
    "opas": [
      {
        "otsikko": "Neljä tekstiä viisikymppiselle",
        "teksti": [
          "\"50v puoli vuosisataa, ei naarmuakaan\" sopii juhlijalle, joka on selvinnyt vuosikymmenistä hyvässä kunnossa. Harmaantuvalle hiuspehkolle on oma vitsinsä \"50 ja hopeanhohtoinen (vain hiukset)\", kun taas optimistille sopivat \"50 vuotta nuori\" ja \"50 ja paras vasta tulossa\". Valitse teksti sen mukaan, nauraako juhlija mieluummin ulkonäölleen vai iälleen.",
          "Jokainen näistä teksteistä on saatavilla sekä t-paitana 27,90 eurolla että hupparina 52,90 eurolla. T-paita on kevyt muistaminen ystävältä tai sukulaiselta, kun taas huppari sopii työkavereiden tai harrastusporukan yhteislahjaksi, kun kustannus jaetaan useamman kesken."
        ]
      },
      {
        "otsikko": "Paketti onnittelupuheen kohokohdaksi",
        "teksti": [
          "Paita on helppo nostaa esiin onnittelupuheessa: pidä paketti piilossa puheen alkuun asti ja lue teksti ääneen vasta, kun juhlija on avannut sen vieraiden edessä. \"50 ja hopeanhohtoinen (vain hiukset)\" toimii tässä hyvin, koska sulkeissa oleva tarkennus tuo naurun pienellä viiveellä.",
          "Talvella syntyneelle huppari on lisäksi käytännöllinen, sillä se lämmittää vielä pitkään juhlien jälkeen. Kesällä juhlivalle t-paita on luonteva valinta, koska sen voi pukea päälle saman tien."
        ]
      },
      {
        "otsikko": "Itseironiaa ja omia tekstejä",
        "teksti": [
          "Juhlija, joka kutsuu itseään mielellään vanhaksi malliksi, ilahtuu paidasta \"Museokamaa\", joka löytyy myös hupparina. Jos lahjaan halutaan saajan nimi tai porukan oma vitsi, omalla tekstillä painettu t-paita maksaa 27,90 euroa. Tekstiin sopii esimerkiksi juhlijan lempinimi ja syntymävuosi. Personoitua tuotetta ei voi palauttaa, joten tarkista teksti huolella."
        ]
      },
      {
        "otsikko": "Ajoissa juhliin",
        "teksti": [
          "Tuotteet painetaan vasta tilauksen jälkeen EU:ssa, joten tilaa hyvissä ajoin ennen juhlapäivää. Painopaikka on Tšekissä, Saksassa tai Ranskassa, ja paketti saapuu sieltä suoraan Suomeen. Toimitus Suomeen maksaa {TOIMITUSMAKSU} euroa, ja se on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta. Jos aika loppuu kesken, digitaalinen lahjakortti tulee perille heti PDF-muodossa.",
          "Kahdesta tuotteesta samassa tilauksessa saat useimmissa yhdistelmissä 5 % alennuksen, mikä kannattaa, jos samalle vuodelle osuu useampi merkkipäivä."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Mitä antaa 50-vuotiaalle, joka ei halua muistutusta iästään?",
        "a": "Myönteisen tekstin, kuten \"50 vuotta nuori\". Ne puhuvat tulevista vuosista eivätkä ryppyjen määrästä."
      },
      {
        "q": "Paljonko lahja 50-vuotiaalle maksaa?",
        "a": "T-paidat maksavat 27,90 €, hupparit 52,90 € ja oma teksti t-paitaan 27,90 €. Digitaalisen lahjakortin arvo on 25, 35 tai 50 €."
      },
      {
        "q": "Mitä teen, jos juhlat ovat jo huomenna?",
        "a": "Valitse digitaalinen lahjakortti. Se tulee heti tulostettavana PDF-tiedostona, ja juhlija valitsee itse mieleisensä paidan."
      },
      {
        "q": "Voiko paidan palauttaa, jos koko ei sovi?",
        "a": "Kyllä. Palautusaikaa on 14 päivää, paitsi omalla tekstillä painetuissa tuotteissa."
      }
    ],
    "tuotteet": [
      "50v-puoli-vuosisataa-ei-naarmuakaan-t-paita",
      "50v-puoli-vuosisataa-ei-naarmuakaan-huppari",
      "50-ja-hopeanhohtoinen-vain-hiukset-t-paita",
      "50-ja-hopeanhohtoinen-vain-hiukset-huppari",
      "50-vuotta-nuori-t-paita",
      "50-vuotta-nuori-huppari",
      "50-ja-paras-vasta-tulossa-t-paita",
      "50-ja-paras-vasta-tulossa-huppari",
      "museokamaa-t-paita",
      "museokamaa-huppari",
      "oma-tekstikuva-t-paita",
      "oma-tekstikuva-huppari",
      "personoitava-t-paita-elava-legenda"
    ]
  },
  "/60-vuotislahja": {
    "title": "60-vuotislahja huumorilla | Huumorikauppa",
    "description": "Lahjaksi 60-vuotiaalle hauska paita, huppari tai juliste, kuten 60v takuu mennyt, toimii silti tai 60v kokenut, ei vanha. Painetaan tilauksesta EU:ssa.",
    "h1": "Hauska lahja 60-vuotiaalle",
    "intro": [
      "Sopiva 60-vuotislahja on t-paita, huppari tai juliste, jonka teksti tekee kuudesta vuosikymmenestä hyväntuulisen vitsin, kuten \"60v takuu mennyt, toimii silti\". Lahjapöydällä painettu teksti erottuu kukista ja kahvipaketeista. Kuusikymppinen on ehtinyt kerätä kaapit täyteen tavaraa, joten hauska vaate tai seinälle ripustettava teksti on tervetullut vaihtelu.",
      "Mallit sopivat kaikille sukupuolille, joten valinnan voi tehdä pelkän huumorin perusteella. Hyvä nyrkkisääntö on valita teksti, jonka juhlija sanoisi itsestään. Erikseen miehelle ja naiselle rajatut valikoimat löytyvät omilta sivuiltaan. Valikoiman tekstit keskittyvät kokemukseen ja virkeyteen, eivät eläkepäivien laskemiseen."
    ],
    "opas": [
      {
        "otsikko": "Kokemus kunniaan",
        "teksti": [
          "Kuusikymppinen tietää jo, mitä tekee, ja sen kertoo \"60v kokenut, ei vanha\". Kokemus on tässä iässä vahvuus, ja nämä tekstit sanovat sen ääneen juhlijan puolesta. Sanavalmiille juhlijalle sopii \"60 vuotta nuori ja nokkela\", ja lyhyempää tekstiä arvostavalle \"60 vuotta nuori\".",
          "\"60v takuu mennyt, toimii silti\" osuu erityisen hyvin insinööriin, mekaanikkoon tai kehen tahansa, joka korjaa vanhat laitteensa itse. Sama vitsi on tarjolla t-paitana, hupparina ja julisteena, joten lahjan voi valita budjetin mukaan."
        ]
      },
      {
        "otsikko": "Kunto ja sydän pysyvät nuorina",
        "teksti": [
          "Liikunnallinen saaja, joka hiihtää, pyöräilee tai juoksee yhä, saa paidasta \"60v mutta fyysinen kunto kuin 20v\" ansaitun tunnustuksen. Iloiselle seuraihmiselle sopii \"60v mutta sydän kuin 20v\". Kumpikin on saatavilla t-paitana 27,90 eurolla ja hupparina 52,90 eurolla.",
          "Hupparin lämpö on plussaa, jos syntymäpäivä osuu talveen, ja t-paita taas sopii kesäjuhliin sellaisenaan."
        ]
      },
      {
        "otsikko": "Juliste seinälle",
        "teksti": [
          "Kaikki eivät käytä painettuja vaatteita, ja heille sopii juliste. Tekstit \"60v kokenut, ei vanha\" ja \"60v takuu mennyt, toimii silti\" löytyvät myös julisteina, jotka juhlija voi kehystää muistoksi merkkipäivästä. Juliste maksaa 24,90 euroa, ja sen hankkiminen onnistuu ilman vaatekoon arvailua. Kumpikin juliste sopii myös työpaikan kahvihuoneen seinälle, jos lahja tulee työkavereilta."
        ]
      },
      {
        "otsikko": "Suvun yhteislahja",
        "teksti": [
          "Kun lahja hankitaan koko suvun nimissä, digitaalinen lahjakortti 35 tai 50 euroa jättää valinnan juhlijalle, ja kortin arvo jakautuu helposti useamman sukulaisen kesken. Kortti toimitetaan heti PDF-tiedostona, jonka voi tulostaa onnittelukortin sisään. Oman tekstin, esimerkiksi juhlijan nimen, saa t-paitaan 27,90 eurolla. Personoitua paitaa ei voi palauttaa, joten varmista nimen kirjoitusasu ennen tilaamista.",
          "Tuotteet painetaan tilauksesta Tšekissä, Saksassa tai Ranskassa. Toimitus maksaa {TOIMITUSMAKSU} euroa, ja se on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta. Palautusoikeus on 14 päivää kaikille muille kuin personoiduille tuotteille. Kun samaan tilaukseen lisää paidan ja julisteen, useimmissa yhdistelmissä hinnasta lähtee 5 %."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Mikä on hauska lahja 60-vuotiaalle?",
        "a": "Ikäteksti, joka kehuu kokemusta, kuten \"60v kokenut, ei vanha\" tai \"60v mutta sydän kuin 20v\". Valittavana on t-paita, huppari tai juliste."
      },
      {
        "q": "Sopiiko sama lahja 60-vuotiaalle naiselle ja miehelle?",
        "a": "Sopii. Sivun tekstit eivät ole sukupuolisidonnaisia, ja ne toimivat kenelle tahansa kuusikymppiselle."
      },
      {
        "q": "Saako 60-vuotislahjaan oman tekstin?",
        "a": "Saa. Omalla tekstillä painettu t-paita maksaa 27,90 €, ja siihen kirjoitetaan esimerkiksi juhlijan nimi. Personoitua tuotetta ei voi palauttaa."
      },
      {
        "q": "Mitä toimitus maksaa?",
        "a": "Toimitus Suomeen on {TOIMITUSMAKSU} €. Toimitus on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta."
      }
    ],
    "tuotteet": [
      "60v-takuu-mennyt-toimii-silti-t-paita",
      "60v-takuu-mennyt-toimii-silti-huppari",
      "60v-takuu-mennyt-toimii-silti-juliste-poster",
      "60v-kokenut-ei-vanha-t-paita",
      "60v-kokenut-ei-vanha-huppari",
      "60v-kokenut-ei-vanha-juliste-poster",
      "60-vuotta-nuori-ja-nokkela-t-paita",
      "60-vuotta-nuori-ja-nokkela-huppari",
      "60-vuotta-nuori-t-paita",
      "60-vuotta-nuori-huppari",
      "60v-mutta-sydan-kuin-20v-t-paita",
      "60v-mutta-sydan-kuin-20v-huppari",
      "60v-mutta-fyysinen-kunto-kuin-20v-t-paita",
      "60v-mutta-fyysinen-kunto-kuin-20v-huppari",
      "hauska-t-paita-60-vuotiaalle-60-vuotta-kokemusta-loytyy"
    ]
  },
  "/40-vuotislahja": {
    "title": "40-vuotislahja: hauskat paidat ja hupparit | Huumorikauppa",
    "description": "Neljäkymppisille paidat ja hupparit, kuten 40v ei vanha, vintage ja 40v kunnossa niinku 20v. T-paidat 27,90 €, hupparit 52,90 €, painetaan EU:ssa.",
    "h1": "Lahja 40-vuotiaalle huumorilla",
    "intro": [
      "Toimiva 40-vuotislahja on paita tai huppari, joka kuittaa keski-iän puheet vitsillä, kuten \"40v ei keski-ikä, klassikko\" tai \"40v ei vanha, vintage\". Juhlija saa hymyillä ikävuosilleen ilman, että teksti piikittelee. Neljäkymppiset ovat juhlat, joissa vitsit lentävät, joten lahjankin saa naurattaa.",
      "Neljänkympin kohdalla mieli tuntuu usein nuoremmalta kuin passi väittää, ja juuri siitä valikoiman tekstit vitsailevat. Ne käyvät kaikille sukupuolille, ja miehille on lisäksi oma lahjasivunsa. Ikävitsi toimii parhaiten, kun se kehuu."
    ],
    "opas": [
      {
        "otsikko": "Henkisesti yhä nuori",
        "teksti": [
          "\"40 vuotta, henkisesti 18\" sopii juhlijalle, jonka mieli ei ole vanhentunut päivääkään. Se kertoo, että juhlija on yhä sama ihminen kuin parikymppisenä, vain vähän viisaampi. Pidemmässä versiossa \"40v henkisesti 18, tyylillä 40\" mukana on silmänisku omaan tyyliin, ja treenaavalle ystävälle sopii \"40v kunnossa niinku 20v\". Nämä tekstit pääsevät oikeuksiinsa juhlissa, joissa kaverit muistelevat yhteisiä nuoruusvuosia.",
          "Jos neljäkymppisiä vietetään vintage-, retro- tai klassikkoteemalla, sopiva paita kannattaa antaa jo ennen juhlia. Silloin juhlija ehtii pukea sen päälleen illaksi."
        ]
      },
      {
        "otsikko": "Klassikko, vintage vai fabulous",
        "teksti": [
          "Vanhan hyvän mallin ystävä valitsee joko \"40v ei keski-ikä, klassikko\" tai \"40v ei vanha, vintage\". Juhlien keskipisteenä viihtyvälle sopii \"40 ja fabulous\", joka on tehty esiintymistä varten. Klassikko- ja vintage-paita sopivat myös sille, joka kerää vanhoja levyjä tai ajaa museoautolla.",
          "Kaikki kuusi tekstiä ovat saatavilla t-paitana 27,90 eurolla ja hupparina 52,90 eurolla. Huppari on talvijuhlissa lämmin, ja t-paita sopii kesän grillijuhliin."
        ]
      },
      {
        "otsikko": "Kaveriporukan yhteislahja",
        "teksti": [
          "Kun lahja kootaan porukalla, huppari on tuntuva valinta, ja ison porukan kesken jokaisen osuus jää pieneksi. Jos ostatte samalla kertaa sekä paidan että hupparin, kahden tuotteen tilauksesta saa useimmissa yhdistelmissä 5 % alennuksen, ja toimitus on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta. Pakettiin kannattaa liittää kortti, johon jokainen osallistuja kirjoittaa oman onnittelunsa. Toinen tapa on antaa huppari juhlijalle ja tilata samalla paita itselle muistoksi illasta."
        ]
      },
      {
        "otsikko": "Oma vitsi tai lahjakortti",
        "teksti": [
          "Kaveriporukan sisäpiirin jutun saa painettua paitaan omana tekstinä hintaan 27,90 euroa, esimerkiksi vanhan lempinimen tai yhteisen matkamuiston. Jos et tiedä juhlijan kokoa, digitaalinen lahjakortti 25, 35 tai 50 euroa toimitetaan heti tulostettavana PDF:nä. Sen tulostat kotona ja ojennat juhlissa kirjekuoressa.",
          "Paidat painetaan tilauksesta EU:ssa ja toimitetaan Suomeen, joten varaa aikaa ennen juhlapäivää. Toimitus maksaa {TOIMITUSMAKSU} euroa. Muilla kuin personoiduilla tuotteilla on 14 päivän palautusoikeus."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Mitä lahjaksi 40-vuotiaalle, joka ei halua juhlia ikäänsä?",
        "a": "Tekstin, joka kääntää iän eduksi, kuten \"40v ei vanha, vintage\" tai \"40 vuotta, henkisesti 18\"."
      },
      {
        "q": "Kumpi on parempi 40-vuotislahjaksi, huppari vai t-paita?",
        "a": "Huppari on näyttävämpi ja sopii yhteislahjaksi, kun taas t-paita on edullisempi muistaminen. Molemmista löytyvät samat kuusi tekstiä."
      },
      {
        "q": "Painetaanko tuotteet Suomessa?",
        "a": "Eivät. Tuotteet painetaan tilauksesta EU:ssa, Tšekissä, Saksassa tai Ranskassa, ja toimitetaan sieltä Suomeen."
      },
      {
        "q": "Onko tuotteilla palautusoikeus?",
        "a": "On, 14 päivää. Poikkeuksena ovat personoidut tuotteet, joihin on painettu oma teksti."
      }
    ],
    "tuotteet": [
      "40v-ei-keski-ika-klassikko-t-paita",
      "40v-ei-keski-ika-klassikko-huppari",
      "40v-ei-vanha-vintage-t-paita",
      "40v-ei-vanha-vintage-huppari",
      "40-vuotta-henkisesti-18-t-paita",
      "40-vuotta-henkisesti-18-huppari",
      "40v-henkisesti-18-tyylilla-40-t-paita",
      "40v-henkisesti-18-tyylilla-40-huppari",
      "40v-kunnossa-niinku-20v-t-paita",
      "40v-kunnossa-niinku-20v-huppari",
      "40-ja-fabulous-t-paita",
      "40-ja-fabulous-huppari"
    ]
  },
  "/lahjat/kalastajalle": {
    "title": "Hauska lahja kalastajalle: t-paidat | Huumorikauppa",
    "description": "Hauska lahja kalastajalle ja pilkkijälle: t-paidat ja hupparit kuten Kalastan, siis valehtelen ja Pilkillä. Älä soita. Painettu tilauksesta EU:ssa.",
    "intro": [
      "Hyvä lahja kalastajalle on t-paita, jonka teksti on tuttu jokaiselle nykäisyä tuntikausia odottaneelle: Kala oli tätäkin isompi, Kalastan, siis valehtelen tai Syötti loppui. Kahvi ei. Vitsi osuu, koska se on totta, ja kalakaveri tunnistaa siitä itsensä heti.",
      "Valikoimassa on paitoja kesän uistelijalle, talven pilkkijälle ja sille, jonka varastossa vieheitä on enemmän kuin hyllytilaa. Jokainen paita painetaan vasta tilauksen jälkeen EU:ssa ja lähetetään Suomeen, joten saat juuri valitsemasi koon ja mallin. Paita sopii syntymäpäiville, isänpäivään ja joulupakettiin, ja se on mieluinen myös sille, joka käy kalassa vain kesälomalla."
    ],
    "opas": [
      {
        "otsikko": "Kesäkalastajalle vai pilkkijälle?",
        "teksti": [
          "Avovesikauden kalamiehelle sopivat Kala pääsi tällä kertaa ja Tänään ei tullut. Huomenna tulee, jotka kertovat saalista enemmän itse reissusta. Jäällä viihtyvälle kannattaa valita Pilkillä. Älä soita tai Jää kantaa, pilkki tulee. Kumpikin sopii pilkkikelkan viereen ja kalakopin kahvihetkeen.",
          "Pilkkijän paita on helppo valita, kun tiedät, missä hän viettää talven viikonloput. Jos kairaa käytetään heti jäiden tultua, Jää kantaa, pilkki tulee osuu kohdalleen. Jos taas puhelin jää jäällä tarkoituksella taskuun, Pilkillä. Älä soita sanoo asian puolestasi."
        ]
      },
      {
        "otsikko": "Paita vai huppari",
        "teksti": [
          "Huonokin päivä kalassa on parempi kuin hyvä päivä töissä on saatavana sekä t-paitana että hupparina. Huppari lämmittää syysillan laiturilla ja veneessä, t-paita taas kulkee mukana kesän kalareissuilla. Lyhyt ja selkeä KALAMIES sopii sille, joka ei kaipaa pitkää tekstiä rintaansa.",
          "Hupparin hyvä puoli on, että se toimii myös kalareissun jälkeen saunan pukuhuoneessa ja kotisohvalla. Kun antaa lahjaksi saman tekstin kahtena eri vaatteena, kalastaja saa paidan kesälle ja hupparin syksylle."
        ]
      },
      {
        "otsikko": "Vieheiden keräilijälle",
        "teksti": [
          "Viehelaatikko on sijoitus on tehty ihmiselle, joka tulee kalastustarvikeliikkeestä aina uuden uistimen kanssa. Paita kertoo harrastuksesta suoraan, ja saaja ymmärtää heti, että antaja tuntee hänet.",
          "Saman ajatuksen jatkoksi sopii Kalastan, siis valehtelen, sillä jokainen vieheiden hamstraaja kertoo mielellään myös tarinoita karanneista järkäleistä. Kahden paidan paketti kattaa sekä varusteet että kalajutut."
        ]
      },
      {
        "otsikko": "Joulupaketti kalakaverille",
        "teksti": [
          "Jouluksi 2026 kalastajan paketti on helppo koota. Kaksi tuotetta samassa tilauksessa saa useimmissa yhdistelmissä 5 % alennuksen, ja toimitus on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta. Muuten toimitus maksaa {TOIMITUSMAKSU} €. Näin samaan pakettiin mahtuu esimerkiksi t-paita ja huppari kalaveljelle.",
          "Jos koko on epävarma, valitse digitaalinen lahjakortti. Se on saatavana 25, 35 tai 50 euron arvoisena, saapuu heti tulostettavana PDF:nä, ja kalastaja valitsee mieleisensä paidan itse."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Voiko kalastajalle ostetun paidan palauttaa, jos koko ei sovi?",
        "a": "Voi. Paidoilla on 14 päivän palautusoikeus, joten väärän koon saa palautettua. Palautusoikeus ei koske personoituja tuotteita."
      },
      {
        "q": "Missä kalastajan paidat painetaan?",
        "a": "Paidat painetaan tilauksesta EU:ssa, Tšekissä, Saksassa tai Ranskassa, ja toimitetaan sieltä Suomeen."
      }
    ]
  },
  "/lahjat/mokkeilijalle": {
    "title": "Hauska lahja saunojalle ja mökkeilijälle | Huumorikauppa",
    "description": "Hauska lahja saunojalle ja mökkeilijälle: t-paidat kuten Löylyä lisää. Ei ole kuuma ja Sauna lämpiää. Muut asiat odottaa. Painettu tilauksesta EU:ssa.",
    "intro": [
      "Hauska lahja saunojalle on paita, jonka teksti ymmärretään lauteilla ilman selityksiä: Löylyä lisää. Ei ole kuuma tai Sauna lämpiää. Muut asiat odottaa. Ne sopivat ihmiselle, jolle kiuas on viikon kohokohta ja vihta tärkeämpi kuin kalenteri.",
      "Samasta sarjasta löytyvät myös mökkielämän klassikot laiturista huussiin. Siksi sivulla on sopiva paita yhtä hyvin kaupunkisaunan vakiokävijälle kuin järvenrannan mökkisaunan lämmittäjälle. Saunapaita kulkee mukana pukuhuoneessa, laiturilla ja kuistilla, joten se on käytössä koko kesän eikä vain yhtenä iltana."
    ],
    "opas": [
      {
        "otsikko": "Paidat löylyjen ystävälle",
        "teksti": [
          "Löylyä lisää. Ei ole kuuma on tehty saunojalle, joka heittää vielä yhden kauhallisen, kun muut jo pakenevat pukuhuoneeseen. Sauna lämpiää. Muut asiat odottaa puolestaan sopii ihmiselle, jonka lauantai rakentuu saunavuoron ympärille. Kumpikin paita on hauska tuliainen saunailtaan. Teksti on lyhyt ja selkeä, joten se toimii yhtä hyvin pihasaunan lämmittäjälle kuin uimahallin saunan vakiokävijälle.",
          "Saunapaita on luonteva valinta tupaantuliaisiin, syntymäpäiville ja kesän ensimmäiseen mökkiviikonloppuun. Sen ojentaa mielellään isännälle, joka lämmittää kiukaan jo ennen kuin vieraat ehtivät pihaan."
        ]
      },
      {
        "otsikko": "Joulusauna ja avanto",
        "teksti": [
          "Joulun perinteitä vaaliva saa paketista Joulusaunan löylymestari -paidan, joka kuuluu aattoillan saunavuoroon. Talviuimarille on oma tekstinsä, -20°C sopiva uimakeli, sillä avanto ja kuuma löyly kulkevat monella käsi kädessä.",
          "Avantouinnin ystävälle paita on hauska muistutus siitä, että kylmä vesi ja kuuma kiuas kuuluvat samaan iltaan. Joulusaunan löylymestari taas tuo saunaan juhlatunnelman ilman koristeita."
        ]
      },
      {
        "otsikko": "Mökkisaunojalle laiturilta huussiin",
        "teksti": [
          "Jos saunominen tapahtuu mökillä, valikoimaa laajentavat Laiturilla istuminen on harrastus, Kantovesi pitää kunnossa, Mökillä ei ole kiire. Eikä kenttää ja Huussi on paras lukunurkkaus. Viileisiin kesäiltoihin sopii Mökki on terapiaa -huppari, ja eläkkeellä mökkeilevälle Työt loppui. Mökki ei.",
          "Mökkipaidat ovat hyvä lisä saunapaidan rinnalle, kun lahja menee perheelle, jonka kesä kuluu järven rannalla. Jokaiselle löytyy oma tekstinsä, ja koko sarja muodostaa yhdessä kunnon mökkiviikonlopun."
        ]
      },
      {
        "otsikko": "Tilaaminen ja toimitus",
        "teksti": [
          "Paidat painetaan tilauksesta EU:n alueella Tšekissä, Saksassa tai Ranskassa, ja paketti tulee kotiin Suomeen. Kun samaan tilaukseen otetaan kaksi tuotetta, useimmista yhdistelmistä saa 5 % alennusta, joten saunaparin lahjat kannattaa tilata yhdessä. Toimitusmaksu on {TOIMITUSMAKSU} €, mutta se on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta.",
          "Jos saunojan paitakoko on arvoitus, digitaalinen lahjakortti on toimiva ratkaisu. Sen arvo on 25, 35 tai 50 euroa, ja tulostettava PDF on käytössäsi heti maksun jälkeen. Valmiilla tuotteilla on lisäksi 14 päivän palautusoikeus."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Mikä lahja sopii saunojalle, jonka paitakokoa en tiedä?",
        "a": "Digitaalinen lahjakortti. Valitse arvoksi 25, 35 tai 50 euroa, niin saat sen heti tulostettavana PDF-tiedostona, ja saunoja valitsee paidan ja koon itse."
      },
      {
        "q": "Sopiiko saunapaita pariskunnalle?",
        "a": "Sopii. Toiselle Löylyä lisää. Ei ole kuuma ja toiselle Sauna lämpiää. Muut asiat odottaa. Kahden tuotteen tilaukseen tulee useimmissa yhdistelmissä 5 % alennus."
      }
    ]
  },
  "/lahjat/metsastajalle": {
    "title": "Hauska lahja metsästäjälle: t-paidat | Huumorikauppa",
    "description": "Hauska lahja metsästäjälle: t-paidat ja huppari kuten Passissa 14 tuntia. Hirvi näki minut ja Koira löysi. Minä en. Painettu tilauksesta EU:ssa.",
    "intro": [
      "Mieluisa lahja metsästäjälle on t-paita, joka kertoo jahtikauden tarinan ennen kuin kukaan ehtii kysyä: Passissa 14 tuntia. Hirvi näki minut tai Koira löysi. Minä en. Jokainen passissa palellut tunnistaa tilanteen ja nauraa itselleen.",
      "Paidat on kirjoitettu suomalaisen metsästysseuran arjesta: aamun kokoontumisesta, nuotiokahvista ja syksyn peijaisista. Ne ovat huumorivaatteita jahtimajalle ja kotiin, eivät metsässä käytettävää turvavarustusta. Lahja sopii syntymäpäiville, isänpäivään ja jouluun, ja se ilahduttaa yhtä lailla nuorta jahtiin lähtijää kuin seuran pitkäaikaista jäsentä."
    ],
    "opas": [
      {
        "otsikko": "Jahtiporukan vitsit",
        "teksti": [
          "Metsästysseuran virallinen kahvinkeittäjä sopii jäsenelle, joka hoitaa termarin ja makkarat ennen kuin muut ovat edes autossa. Peijaiset on kauden tärkein osa puolestaan kuuluu ihmiselle, jolle jahdin paras hetki on yhteinen ateria saaliin jälkeen.",
          "Molemmat paidat sopivat metsästysseuran vuosikokoukseen, peijaisiin ja syksyn ensimmäiseen jahtiviikonloppuun. Ne ovat myös hyvä yhteislahja, kun porukka haluaa kiittää jäsentä, joka on hoitanut kahvit ja nuotion vuodesta toiseen."
        ]
      },
      {
        "otsikko": "Koiramiehelle ja syksyn odottajalle",
        "teksti": [
          "Koiran kanssa liikkuvalle osuu Koira löysi. Minä en, koska se kertoo rehellisesti, kuka porukasta oikeasti tekee työt. Syksy alkaa, kun jahti alkaa on valinta niille, joille kalenterin tärkein päivä on kauden avaus. Maastopuku on myös juhlapuku sopii sille, joka ei vaihda vaatteita juhliin. Kaikki kolme ovat t-paitoja, joten ne kulkevat mukana metsästysmatkoilla ja kotona.",
          "Hyvä paita naurattaa ilman, että ketään nolataan. Jahtiporukan vitsit perustuvat asioihin, jotka jokainen on kokenut itse: pitkiin odotuksiin, väärään suuntaan katsomiseen ja koiraan, joka hoitaa homman paremmin kuin isäntänsä."
        ]
      },
      {
        "otsikko": "Huppari kylmiin iltoihin",
        "teksti": [
          "Ei ole kiire, olen metsässä on huppari, joka lämmittää jahtimajan kuistilla ja nuotiolla. Se sopii myös erätaitoilijalle ja jokaiselle, joka hakee metsästä rauhaa enemmän kuin saalista. Kun huppari ja t-paita tilataan yhdessä, useimmille yhdistelmille tulee 5 % alennus.",
          "Hupparin teksti on rauhallisempi kuin passipaitojen, joten se sopii myös arkikäyttöön kaupunkiin. Sen voi antaa metsästäjälle, joka arvostaa hiljaisuutta ja aamun ensimmäistä kahvia nuotiolla."
        ]
      },
      {
        "otsikko": "Jahtikaverin joululahja 2026",
        "teksti": [
          "Paidat painetaan tilauksesta EU:ssa ja toimitetaan Suomeen. Toimitus maksaa {TOIMITUSMAKSU} €, ja toimitus on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta.",
          "Jos et tiedä, mikä teksti naurattaa häntä eniten, anna digitaalinen lahjakortti. Arvoltaan 25, 35 tai 50 euron kortti tulee heti tulostettavana PDF:nä, ja metsämies valitsee paitansa itse. Lahjakortti sopii myös tilanteeseen, jossa haluat jättää valinnan paidan ja hupparin välillä saajalle."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Voiko metsästäjän paidan palauttaa, jos teksti ei osu?",
        "a": "Kyllä. Tuotteilla on 14 päivän palautusoikeus. Poikkeuksena ovat personoidut tuotteet, joita ei oteta palautuksena vastaan."
      },
      {
        "q": "Mikä sopii metsästäjälle, joka viihtyy myös kalassa?",
        "a": "Huonokin päivä kalassa on parempi kuin hyvä päivä töissä on saatavana t-paitana ja hupparina. Lisää kalapaitoja on sivulla Lahjat kalastajalle."
      }
    ]
  },
  "/lahjat/tyokaverille": {
    "intro": [
      "Sopiva lahja työkaverille on toimistohuumorin paita, joka nauraa työpäivän kommelluksille eikä kenellekään henkilönä, esimerkiksi Tämäkin olisi voinut olla sähköposti tai Tärkeintä työssä on lounastauko. Teksti toimii, kun koko tiimi tunnistaa siitä oman arkensa.",
      "Paidalla kiität kollegaa, juhlistat syntymäpäivää tai lähetät hänet lomalle hymyillen. Jokainen tuote painetaan vasta tilauksen jälkeen EU:ssa ja toimitetaan Suomeen. Hyvä työpaikkalahja ei vaadi suurta budjettia, ja t-paita on kooltaan ja hinnaltaan helppo valinta myös silloin, kun lahja ostetaan yhteiskeräyksellä."
    ],
    "opas": [
      {
        "otsikko": "Toimiston arjesta",
        "teksti": [
          "Tiimipelaaja vaikka tiimi ei pelaa sopii kollegalle, joka jaksaa yrittää, vaikka projektin muut osapuolet lepäävät. Selviän työkaverit auttaa kertoo päinvastaista: hyvä porukka kantaa vaikeankin viikon yli. Kotitoimistossa työskentelevälle on huppari Konttori 3 metriä sängystä. Etätyöläinen saa hupparista vaatteen, joka sopii sekä videopalaveriin että kahvinkeittoon kotikeittiössä.",
          "Toimistohuumorissa kannattaa valita teksti, joka sopii myös palaveriin: se naurattaa koko tiimiä eikä nolaa ketään. Tämäkin olisi voinut olla sähköposti on helppo valinta, koska jokainen on istunut kokouksessa, jonka asia olisi hoitunut yhdellä viestillä."
        ]
      },
      {
        "otsikko": "Ammatin mukaan",
        "teksti": [
          "Asiakaspalvelijalle sopii Asiakas on aina oikeassa lähes ja myyjälle Kaupat klousattu. Lomalle lähtevä saa Kesäloma ansaittu -paidan viimeisenä työpäivänään. Muut ammatit löytyvät ammattipaidoista. Asiakastyötä tekevä tunnistaa ensimmäisen tekstin heti, ja myyjälle Kaupat klousattu on pieni voitonmerkki kvartaalin päätteeksi.",
          "Ammattiin osuva paita tuntuu henkilökohtaiselta, vaikka teksti on yleinen. Se kertoo, että olet kuunnellut kollegan juttuja kahvihuoneessa ja tiedät, millaista hänen työnsä on."
        ]
      },
      {
        "otsikko": "Personoitu lahja pitkästä urasta",
        "teksti": [
          "Alalla X vuotta ja [NIMI] Legendaarinen työsankari ovat personoitavia paitoja, joihin lisätään vuodet tai nimi. Ne sopivat merkkipäivään ja läksiäisiin. Eläkkeelle jäävälle tai alan konkarille personoitu paita kertoo, että hänen työvuotensa on huomattu.",
          "Personoiduilla tuotteilla ei ole 14 päivän palautusoikeutta, joten tarkista nimen ja vuosien kirjoitusasu ennen tilausta."
        ]
      },
      {
        "otsikko": "Pikkujoulut ja yhteistilaus",
        "teksti": [
          "Pikkujouluihin on oma paitansa, Pikkujoulut. Muistan osittain, joka on saatavana myös hupparina. Kun tilaatte lahjat koko porukalle kerralla, {TOIMITUSMAKSU} euron toimitusmaksu jää pois kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta, ja kahden tuotteen tilauksissa useimmat yhdistelmät saavat 5 % alennuksen.",
          "Yhteistilaus säästää myös vaivaa, kun kaikki lahjat tulevat samassa toimituksessa. Jos joku toivoo erilaista paitaa, digitaalinen lahjakortti toimii pikkujoulujen arvontapalkintona yhtä hyvin kuin paketti."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Mitä ostaa kollegalle, jota en tunne kovin hyvin?",
        "a": "Digitaalisen lahjakortin, jonka arvo on 25, 35 tai 50 euroa. Se toimitetaan heti tulostettavana PDF:nä, ja saaja valitsee tuotteen itse."
      },
      {
        "q": "Sopiiko toimistohuumori työpaikan joululahjaksi 2026?",
        "a": "Sopii. Valitse teksti, joka koskee työtä yleisesti, kuten palavereja tai lounastaukoa, niin kukaan ei koe sitä henkilökohtaiseksi piikiksi."
      }
    ]
  },
  "/lahja-kaverille": {
    "intro": [
      "Hauska lahja ystävälle on sellainen, jonka vitsin ymmärrätte vain te kaksi: meemi, jota olette toistaneet vuosia, tai lausahdus, joka saa teidät nauramaan yhä uudelleen. Paita tai pieni koriste tekee yhteisestä jutusta esineen, joka muistuttaa ystävyydestä arjessa.",
      "Valikoimassa on suomalaisia meemipaitoja, keraaminen ystävän joulukoriste ja tuotteita, joihin painetaan oma teksti tai kuva. Kaikki valmistetaan tilauksesta EU:ssa ja lähetetään Suomeen. Lahjan sopii antaa syntymäpäivänä, tupaantuliaisissa tai ilman mitään syytä, kun haluat muistuttaa kaveria siitä, että hän on tärkeä."
    ],
    "opas": [
      {
        "otsikko": "Meemit kaveriporukalle",
        "teksti": [
          "Se oli tonnin seteli, Saatanan Tunarit ja ICE AATANA ovat paitoja ystävälle, joka tuntee suomalaisen nettihuumorin. Ois viisaampi häipyy täält sopii kaverille, joka lähtee bileistä aina ensimmäisenä. Tonnin seteli -meemistä on paitojen lisäksi myös A3-juliste ja tarra.",
          "Meemipaita on hyvä valinta, kun vitsi on syntynyt yhteisessä illanvietossa tai porukan viestiketjussa. Ystävä tunnistaa sen heti, eikä lahjaa tarvitse selittää."
        ]
      },
      {
        "otsikko": "Aikuisten huumoria",
        "teksti": [
          "Aikuisten porukassa naurattavat oispa kaljaa ja Alkoholi tappaa hitaasti, jotka löytyvät sekä t-paitana että hupparina. Nuoremmalle lahjansaajalle kannattaa valita meemi, jossa ei puhuta alkoholista. Paita sopii kaveriporukan mökkireissulle, polttareihin ja syntymäpäiväjuhliin, joissa kaikki tuntevat vitsin taustan.",
          "Kun lahja annetaan synttäreillä tai mökkiviikonloppuna, huppari on käytännöllinen valinta: se lämmittää kesäillan nuotiolla ja muistuttaa illan vitsistä vielä seuraavana päivänä."
        ]
      },
      {
        "otsikko": "Oma teksti tai kuva",
        "teksti": [
          "Kun valmis teksti ei riitä, Oma Teksti/Kuva -tuotteeseen painetaan juuri teidän sisäpiirivitsinne tai yhteinen valokuva, t-paitaan tai huppariin. Personoitu tuote tehdään vain teille, minkä vuoksi 14 päivän palautusoikeus ei koske sitä. Valmiit meemipaidat saa palauttaa 14 päivän kuluessa.",
          "Oma teksti on paras vaihtoehto silloin, kun teidän juttunne ei löydy mistään valmiista paidasta. Tarkista painettava teksti huolella, sillä se tulee paitaan juuri sellaisena kuin sen kirjoitat."
        ]
      },
      {
        "otsikko": "Pieni lahja ja lahjakortti",
        "teksti": [
          "Maailman Paras Ystävä -koriste maksaa 22,90 € ja sopii joulukuuseen tai ikkunalle. Jos ystävän maku on vaikea arvata, digitaalinen lahjakortti 25, 35 tai 50 euron arvoisena on valmis heti, koska se toimitetaan tulostettavana PDF:nä. Jouluna 2026 kaksi tuotetta samassa tilauksessa saa useimmissa yhdistelmissä 5 % alennuksen. Koriste on t-paitaa edullisempi ja kulkee helposti postikortin rinnalla."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Paljonko toimitus maksaa?",
        "a": "Toimitus Suomeen maksaa {TOIMITUSMAKSU} €. Toimitus on ilmainen kahdesta tuotteesta tai {ILMAINEN_RAJA} eurosta, joten kahden ystävän lahjat kannattaa tilata samalla kertaa."
      },
      {
        "q": "Mitä ystävälle, joka pitää julisteista enemmän kuin vaatteista?",
        "a": "Se oli tonnin seteli ja Tonnin seteli ovat A3-kokoisia julisteita (29,7 x 42 cm). Meemistä on myös tarra läppärin kanteen."
      }
    ]
  }
};

/** Toimitusehdot konfiguraatiosta (src/config/toimitus.ts), ei kovakoodattuina teksteihin. */
const korvaa = (t: string) => t.replace(/\{TOIMITUSMAKSU\}/g, TOIMITUSMAKSU_TEKSTI).replace(/\{ILMAINEN_RAJA\}/g, ILMAINEN_RAJA_TEKSTI);
export const LAHJAOPPAAT: Record<string, LahjaOpas> = Object.fromEntries(Object.entries(RAAKA).map(([polku, o]) => [polku, {
  ...o,
  title: o.title && korvaa(o.title), description: o.description && korvaa(o.description), h1: o.h1 && korvaa(o.h1),
  intro: o.intro.map(korvaa), opas: o.opas.map((x) => ({ otsikko: korvaa(x.otsikko), teksti: x.teksti.map(korvaa) })),
  faqs: o.faqs.map((f) => ({ q: korvaa(f.q), a: korvaa(f.a) })),
}]));
