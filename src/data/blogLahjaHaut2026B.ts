import { BlogPost } from "@/types/blog";
import { TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_LAUSE } from "@/config/toimitus";
import { jouluLause, jouluVastaus } from "./tilauspaivat";

/**
 * Lahjahakujen artikkelit (julkaistu 2.11.2026), osa B. Säännöt kuten blogJouluHaut2026.ts. Pituus 800-1200 sanaa,
 * linkit lahjasivuille ja sivulle /joulu. Tarkistus: src/data/blog.test.ts ("lahjahaut 2.11.2026").
 */
const TOIMITUS = `${TOIMITUSMAKSU_LAUSE} Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta.`;
const JOULU_FAQ = {
  q: "Ehtiikö tilaus vielä jouluksi?",
  a: `${jouluVastaus()} Tuotteet painetaan tilauksesta painokumppaneillamme.`,
};
const AIKATAULU = `${jouluLause()} Katso tarkempi aikataulu sivulta [joulun viimeiset tilauspäivät](/joulun-viimeiset-tilauspaivat).`;

/** Artikkelin slug -> pääavainsana. */
export const LAHJAHAKUSANAT_B: Record<string, string> = {
  "lahjaideat-elakelaiselle": "lahjaideat eläkeläiselle",
  "saunojan-lahjaopas": "lahja saunojalle",
  "mita-ostaa-tyokaverille-pikkujouluihin": "lahja työkaverille pikkujouluihin",
};

/** Artikkelin slug -> tuoteteema (src/data/blogProducts.ts BLOG_PRODUCT_THEMES-avain). */
export const LAHJAHAKU_TEEMAT_B: Record<string, string> = {
  "lahjaideat-elakelaiselle": "elake",
  "saunojan-lahjaopas": "sauna",
  "mita-ostaa-tyokaverille-pikkujouluihin": "pikkujouluTyokaveri",
};

export const lahjaHakuOppaat2026B: BlogPost[] = [
  // 1 Lahjaideat eläkeläiselle ─────────────────────────────────────────────────
  {
    slug: "lahjaideat-elakelaiselle",
    title: "Lahjaideat eläkeläiselle: hauskat paidat vapaille päiville",
    metaTitle: "Lahjaideat eläkeläiselle | Huumorikauppa",
    metaDescription: "Lahjaideat eläkeläiselle: näin valitset hauskan paidan tuoreelle eläkeläiselle, mökkeilijälle tai isovanhemmalle synttäreille ja jouluun.",
    excerpt: "Eläkeläisellä on aikaa, mutta tavaraa on jo kertynyt. Hauska tekstipaita on lahja, joka kertoo uuden elämänvaiheen parhaat puolet ja on käytössä joka päivä.",
    publishedAt: "2026-11-02",
    updatedAt: "2026-11-02",
    category: "lahjaideat",
    tags: ["lahjaideat eläkeläiselle", "lahja eläkeläiselle", "eläkeläisen lahja", "hauska lahja eläkeläiselle"],
    relatedCategories: ["t-paidat", "hupparit"],
    content: `## Miksi eläkeläiselle on vaikea keksiä lahjaa

Kun etsit lahjaideat eläkeläiselle, törmäät nopeasti samaan ongelmaan: hänellä on jo kaikki. Kodissa on astiat, työkalut ja koriste-esineet, ja kaapit ovat täynnä vuosikymmenten aikana saatuja lahjoja. Uusi tavara tuntuu helposti turhalta.

Hyvä eläkeläisen lahja ei siksi lisää tavaraa vaan kertoo jotain. Hauska tekstipaita tekee juuri sen. Se nauraa uudelle elämänvaiheelle yhdessä saajan kanssa, ja sitä käytetään oikeasti: aamukahvilla, mökillä, lastenlasten kanssa ja kauppareissulla. Samalla se on helppo antaa, koska koko ja vitsi ratkaisevat kaiken.

## Mieti ensin, millainen eläkeläinen on

Eläkeläisiä on monenlaisia. Ennen kuin valitset, mieti, mikä kuvaa saajaa parhaiten.

**Tuore eläkeläinen** juhlii vapautta. Hänelle sopii vitsi siitä, että herätyskello on vihdoin hiljaa ja maanantai on vain yksi päivä muiden joukossa.

**Kiireinen eläkeläinen** ei ole jäänyt lepäämään. Hänellä on yhdistyksiä, talkoita, matkoja ja harrastuksia, ja kalenteri on täydempi kuin työvuosina.

**Mökkeilijä** viettää kesät ja usein myös syksyt mökillä. Työt loppuivat, mutta mökin työt eivät lopu koskaan.

**Isovanhempi** hoitaa lastenlapsia useammin kuin kukaan ehti suunnitella. Hänelle vitsi omasta roolistaan on paras lahja.

## Lahjaideat eläkeläiselle tyypin mukaan

- **Vapautta juhlivalle:** [Eläkkeellä. Kello on vain koru](/tuote/elakkeella-kello-on-vain-koru-t-paita-elakelaiselle) kertoo, että aikataulut jäivät työpaikalle.
- **Aamu-unisen lahjaksi:** [Eläkeläinen. Älä soita ennen kymmentä](/tuote/elakelainen-ala-soita-ennen-kymmenta-t-paita-elakelaiselle) on selkeä ohje koko suvulle.
- **Arjen nautiskelijalle:** [Eläkeläisen työpäivä: kahvi, lehti, päikkärit](/tuote/elakelaisen-tyopaiva-kahvi-lehti-paikkarit-t-paita-elakelaiselle) kuvaa täydellisen päivän kolmella sanalla.
- **Kiireiselle eläkeläiselle:** [Eläkkeellä. Kiireinen silti](/tuote/elakkeella-kiireinen-silti-t-paita-elakelaiselle) sopii sille, joka ei ehdi koskaan kotiin.
- **Mökkeilijälle:** [Työt loppui. Mökki ei](/tuote/tyot-loppui-mokki-ei-t-paita-elakelaiselle) on rehellinen kuvaus mökkikesästä.
- **Isovanhemmalle:** [Täysipäiväinen isovanhempi](/tuote/taysipaivainen-isovanhempi-t-paita-elakelaiselle) kiittää mummoa tai vaaria, joka on aina valmiina hoitovuoroon.
- **Neuvojen antajalle:** [Kokenut eläkeläinen. Neuvoja ilmaiseksi](/tuote/kokenut-elakelainen-neuvoja-ilmaiseksi-t-paita-elakelaiselle) sopii sille, joka tietää, miten asiat kuuluu tehdä.
- **Päiväunien ystävälle:** [Palkka loppui. Päikkärit jatkuu](/tuote/palkka-loppui-paikkarit-jatkuu-t-paita-elakelaiselle) muistuttaa eläkkeen parhaasta edusta.

Kaikki eläkeaiheiset tuotteet löydät sivulta [eläkelahjat](/elakelahjat).

## T-paita vai huppari

T-paita on hyvä valinta, jos saaja liikkuu paljon tai viettää aikaa sisällä. Huppari taas on parempi syksyllä ja talvella, mökin terassilla ja aamukävelyllä. Monesta mallista on saatavilla molemmat. Esimerkiksi [Eläkkeellä. Kello on vain koru -huppari](/tuote/elakkeella-kello-on-vain-koru-huppari-elakelaiselle) lämmittää pihatöissä, ja [Olen eläkkeellä -huppari](/tuote/olen-elakkeella-huppari) on yksinkertainen ja helposti luettava viesti.

Jos et tiedä saajan kokoa, valitse huppari. Se on väljempi ja antaa enemmän anteeksi kuin t-paita.

## Mitä huomioida, kun vitsi koskee eläkettä

Eläkevitsi on hauska, kun se kertoo vapaudesta eikä iästä. Paras paita juhlii sitä, mitä eläkeläinen on odottanut: omaa aikaa, pitkiä aamuja, mökkiä ja lastenlapsia. Vältä vitsejä, jotka koskevat muistia, terveyttä tai vanhenemista, ellei saaja itse vitsaile niistä mielellään. Silloin lahja tuntuu kiitokselta eikä piikittelyltä.

Mieti myös, missä saaja paitaa käyttää. Jos hän käy kuntosalilla, uimahallissa tai kansalaisopiston kursseilla, lyhyt ja selkeä teksti avaa keskustelun uusien tuttavien kanssa. Jos hän viettää aikaa lähinnä kotona ja mökillä, vitsi saa olla pidempi ja henkilökohtaisempi, koska sen lukevat lähinnä perhe ja naapurit.

Monelle tuoreelle eläkeläiselle ensimmäinen vapaa syksy on iso muutos. Työyhteisö jää taakse, ja päivät saavat uuden rytmin. Hauska paita muistuttaa, että muutos on hyvä asia, ja antaa luvan nauttia vapaudesta ilman syyllisyyttä. Siksi lahja kannattaa antaa juuri ensimmäisen eläkevuoden aikana, kun aihe on vielä tuore ja vitsi osuu parhaiten.

Jos saajalla on puoliso, joka jää eläkkeelle samaan aikaan, valitse paidat pariksi. Toiselle Eläkeläinen. Älä soita ennen kymmentä ja toiselle Eläkkeellä. Kiireinen silti. Yhdessä ne kertovat, miten erilaisia eläkeläisiä samassa kodissa voi asua.

## Lahja eri tilanteisiin

**Eläkejuhlat.** Työpaikan läksiäisissä paita on hauska yhteislahja. Työkaverit voivat kirjoittaa kortin, jossa jokainen kertoo, mitä lähtijä tekee ensimmäisenä vapaana maanantaina. Lisää ideoita on oppaassa [eläkelahja, joka naurattaa](/blogi/elakelahja-joka-naurattaa).

**Joulu.** Eläkeläinen avaa joulupaketin mielellään, kun sisältä löytyy jotain, mitä hän käyttää. Lue lisää oppaasta [joululahja eläkeläiselle](/blogi/joululahja-elakelaiselle) ja katso kaikki jouluideat sivulta [joulu](/joulu).

**Syntymäpäivät.** Pyöreät vuodet ovat hyvä hetki muistaa eläkeläistä. Ikäkohtaisia ideoita löydät sivuilta [lahjat 60-vuotiaalle miehelle](/lahjat/60-vuotiaalle-miehelle), [lahjat 60-vuotiaalle naiselle](/lahjat/60-vuotiaalle-naiselle) ja [lahjat 70-vuotiaalle](/lahjat/70-vuotiaalle).

**Isovanhemmat.** Lastenlapset voivat antaa paidan yhdessä. Katso myös sivut [lahjat isoisälle](/lahjat/isoisalle) ja [lahjat isoäidille](/lahjat/isoaidille).

## Näin lahjasta tulee henkilökohtainen

Paita on yksinkertainen lahja, mutta sen voi tehdä harkituksi. Kolme vinkkiä:

1. **Valitse vitsi, joka osuu.** Jos saaja nukkuu pitkään, aamuvitsi on oikea valinta. Jos hän on aina mökillä, mökkivitsi kertoo, että tunnet hänet.
2. **Kirjoita mukaan kortti.** Kerro, miksi valitsit juuri tämän paidan: "Sinä olet ainoa, jonka kalenteri on täydempi eläkkeellä kuin töissä."
3. **Yhdistä paita tekemiseen.** Anna paita yhdessä mökkiviikonlopun, teatteri-illan tai yhteisen kalaretken kanssa. Silloin lahjasta tulee muisto.

Jos eläkeläinen harrastaa ulkoilua, katso myös sivu [retkeily](/paidat/retkeilija). Mökkeilijälle sopivat myös sivun [lahjat mökkeilijälle](/lahjat/mokkeilijalle) tuotteet.

## Lahja, joka ei vie tilaa

Moni eläkeläinen on alkanut karsia tavaroitaan, ja jotkut ovat muuttaneet pienempään asuntoon. Silloin isot lahjat tuntuvat taakalta. Paita mahtuu laatikkoon, ja sitä käytetään niin usein, ettei se jää nurkkaan pölyttymään.

## Koko ja hoito

Katso saajan eniten käyttämästä paidasta leveys kainaloiden alta ja pituus olkasaumasta helmaan, ja vertaa niitä tuotesivun mittoihin. Pese paita nurinpäin ja vältä kuivausrumpua, niin painatus pysyy siistinä pitkään. Jos lahja on yllätys, kysy kokoa puolisolta tai katso pyykkinarulta.

## Tilaa ajoissa

Tuotteemme painetaan tilauksesta painokumppaneillamme, joten jokainen paita tehdään juuri sinun tilaustasi varten. ${AIKATAULU} ${TOIMITUS}`,
    faq: [
      { q: "Mikä on hyvä lahja eläkeläiselle, jolla on jo kaikki?", a: "Hyvä lahja on sellainen, joka ei lisää turhaa tavaraa. Hauska tekstipaita kertoo uuden elämänvaiheen parhaat puolet ja on käytössä joka päivä." },
      { q: "Kumpi on parempi lahja eläkeläiselle, t-paita vai huppari?", a: "Huppari on parempi, jos et tiedä kokoa tai saaja viettää aikaa ulkona. T-paita sopii sisäkäyttöön ja kesään." },
      { q: "Sopiiko paita eläkejuhlien yhteislahjaksi?", a: "Sopii hyvin. Työkaverit voivat antaa paidan yhdessä ja kirjoittaa mukaan kortin, jossa jokainen kertoo oman terveisensä." },
      JOULU_FAQ,
    ],
  },

  // 2 Saunojan lahjaopas ────────────────────────────────────────────────────────
  {
    slug: "saunojan-lahjaopas",
    title: "Saunojan lahjaopas: hauska lahja saunojalle löylyjen ystävälle",
    metaTitle: "Saunojan lahjaopas: lahja saunojalle | Huumorikauppa",
    metaDescription: "Lahja saunojalle: hauskat sauna- ja löylypaidat mökkisaunojalle, avantouimarille ja joulusaunan lämmittäjälle. Vinkit valintaan.",
    excerpt: "Saunojalla on jo kauha, kiulu ja pefletti. Hauska löylypaita on lahja, jonka hän pukee päälle saunan jälkeen ja jolla hän kertoo kaikille, kuka mökillä lämmittää kiukaan.",
    publishedAt: "2026-11-02",
    updatedAt: "2026-11-02",
    category: "lahjaideat",
    tags: ["lahja saunojalle", "saunojan lahja", "saunalahja", "löylypaita"],
    relatedCategories: ["t-paidat", "hupparit"],
    content: `## Saunoja on helppo ilahduttaa, kun tietää miten

Lahja saunojalle tuntuu ensin helpolta. Sitten muistat, että innokkaalla saunojalla on jo kaikki saunatarvikkeet: kauha, kiulu, saunatyyny, pefletti ja lämpömittari. Toinen kiulu ei tunnu lahjalta.

Siksi kannattaa ajatella saunaa laajemmin. Saunominen on suomalaiselle elämäntapa, ja saunoja haluaa kertoa siitä myös saunan ulkopuolella. Hauska löylypaita tekee sen. Se puetaan päälle saunan jälkeen, kun istutaan terassilla tai laiturilla, ja sen vitsi avautuu jokaiselle, joka on joskus heittänyt löylyä.

## Millainen saunoja on

Ennen kuin valitset, mieti saajan tapaa saunoa. Jokaiselle löytyy oma vitsinsä.

**Löylymestari** heittää kiukaalle niin paljon vettä, että muut lähtevät alalauteille. Hän ei koskaan myönnä, että saunassa on kuuma.

**Mökkisaunoja** lämmittää puusaunan heti, kun mökille päästään. Kaikki muu odottaa siihen asti, kunnes sauna on valmis.

**Avantouimari** käy talvella järvessä ja kertoo siitä mielellään. Hänelle kylmä vesi on yhtä tärkeä kuin kuumat löylyt.

**Joulusaunoja** pitää joulusaunaa aaton tärkeimpänä hetkenä. Hänelle sopii lahja, joka liittyy juuri siihen.

## Lahja saunojalle: ideat tyypin mukaan

- **Löylymestarille:** [Löylyä lisää. Ei ole kuuma](/tuote/loylya-lisaa-ei-ole-kuuma-t-paita-mokkeilijalle) on paita sille, joka nostaa lämpöä vielä kerran, kun muut jo lähtevät.
- **Mökkisaunojalle:** [Sauna lämpiää. Muut asiat odottaa](/tuote/sauna-lampiaa-muut-asiat-odottaa-t-paita-mokkeilijalle) kertoo, mikä mökillä on tärkeintä.
- **Joulusaunan lämmittäjälle:** [Joulusaunan löylymestari](/tuote/joulusaunan-loylymestari-t-paita-jouluun) on hauska joululahja sille, joka hoitaa aaton saunan.
- **Avantouimarille:** [-20°C sopiva uimakeli](/tuote/hauska-t-paita-avantouijalle-20c-sopiva-uimakeli) sopii sille, joka hakee avannosta virtaa talven aamuihin.
- **Mökkiterassin lepääjälle:** [Mökki on terapiaa -huppari](/tuote/hauska-huppari-mokkeilijalle-mokki-on-terapiaa) lämmittää, kun saunan jälkeen istutaan ulkona.
- **Eläkkeellä olevalle saunojalle:** [Työt loppui. Mökki ei](/tuote/tyot-loppui-mokki-ei-t-paita-elakelaiselle) sopii sille, joka viettää kesät mökin saunaa lämmittäen.

Lisää ideoita löydät sivuilta [lahjat mökkeilijälle](/lahjat/mokkeilijalle) ja [suomalainen huumori](/suomalainen-huumori-paidat).

## Miksi paita on hyvä saunalahja

Saunatarvikkeet ovat usein jo hankittu, ja jokaisella saunojalla on omat mieltymyksensä. Joku haluaa puukauhan, toinen metallisen. Paita taas on lahja, jossa ei voi valita väärin, kun vitsi osuu.

Paita on myös lahja, joka näkyy. Kun saunoja pukee sen päälle saunan jälkeen, koko seurue tietää, kuka on illan löylymestari. Se tuo saunailtaan hauskan perinteen: paita kuuluu sille, joka lämmittää kiukaan.

Lisäksi paita on helppo paketoida ja lähettää. Se mahtuu kirjekuoreen, eikä sitä tarvitse kantaa mökille asti.

## T-paita vai huppari saunojalle

Saunan jälkeen keho on lämmin, ja moni haluaa pukea päälle jotain kevyttä. Silloin t-paita on paras valinta. Syksyllä ja talvella tilanne muuttuu. Kun saunan jälkeen istutaan terassilla tai kävellään mökkipolkua pitkin, huppari pitää lämpimänä. Avantouimarille huppari on käytännöllinen, koska sen saa päälle nopeasti uinnin jälkeen.

Jos et tiedä kokoa, valitse huppari, koska se on väljempi ja sopii useammalle.

## Saunaperinteet lahjan taustalla

Saunominen on suomalaisten yhteinen perinne, ja lähes jokaisella perheellä on omat saunatapansa. Joku saunoo joka lauantai, toinen vain mökillä, kolmas joka ilta kerrostalon saunavuorolla. Kun tunnet saajan tavat, löydät myös oikean vitsin.

Kysy itseltäsi muutama kysymys. Saunooko hän puusaunassa vai sähkösaunassa? Käykö hän uimassa saunan välissä? Onko hän se, joka lämmittää saunan, vai se, joka tulee valmiiseen saunaan? Viihtyykö hän ylälauteella pisimpään? Vastaukset kertovat, kumpi paita sopii paremmin: löylymestarin vitsi vai mökkisaunojan vitsi.

Saunaan liittyy myös paljon pieniä rituaaleja. Moni juo saunan jälkeen kylmän juoman laiturilla, paistaa makkaraa tai istuu hetken hiljaa katsomassa järveä. Paita sopii näihin hetkiin luontevasti, koska se on se vaate, joka puetaan ensimmäisenä saunan jälkeen. Siksi saunalahjan arvo näkyy juuri siinä hetkessä, kun saunoja tulee ulos ja istuu alas.

Jos saunoja on myös kova liikkuja, sauna on hänelle palautumisen paikka. Silloin lahja voi yhdistää kaksi asiaa, jotka hänelle ovat tärkeitä: liikunnan ja löylyt. Mieti, kumpi on saajalle tärkeämpi, ja valitse vitsi sen mukaan.

## Lahja eri tilanteisiin

**Joululahja.** Joulusauna on monelle aaton kohokohta. Joulusaunan löylymestari on lahja, jonka saaja voi pukea päälle jo aattona. Kaikki jouluideat löydät sivulta [joulu](/joulu), ja lisää vaihtoehtoja on sivulla [hauskat joululahjat](/joululahjat).

**Isän tai papan lahja.** Monessa perheessä isä tai pappa on saunan lämmittäjä. Paita kiittää häntä vuosien löylyistä. Lisää ideoita on sivuilla [lahjat isoisälle](/lahjat/isoisalle) ja [hauskat lahjat miehelle](/hauskat-lahjat-miehelle).

**Mökin tuliaiset.** Kun menet kylään toisen mökille, saunapaita on hauskempi tuliainen kuin kukkakimppu.

**Harrastajan lahja.** Jos saunoja liikkuu myös luonnossa, katso sivut [lahjat harrastajalle](/lahjat/harrastajalle) ja [retkeily](/paidat/retkeilija).

## Näin saunalahjasta tulee muistettava

1. **Anna lahja saunan jälkeen.** Kun saunoja istuu terassilla, paidan voi ojentaa suoraan pukeutumista varten.
2. **Yhdistä paita saunailtaan.** Kutsu saaja saunomaan ja anna paita illan päätteeksi.
3. **Hanki koko porukalle.** Jos teillä on yhteinen mökki tai saunaseura, jokainen voi saada oman vitsinsä. Samasta tilauksesta saa eri koot ja eri paidat. Katso ohjeet sivulta [ryhmätilaukset](/ryhmatilaukset).

## Saunalahja koko perheeltä

Jos perheessä on yksi selvä saunan lämmittäjä, lahjan voi antaa koko perheen nimissä. Lapset voivat piirtää korttiin kuvan saunasta ja kirjoittaa siihen, mitä he arvostavat isän, äidin tai papan saunailloissa eniten. Paita ja kortti yhdessä kertovat, että saunavuorot ovat perheelle tärkeitä hetkiä.

## Koko ja hoito

Vertaa saajan eniten käyttämän paidan mittoja tuotesivun mittoihin. Paitaa ei kannata käyttää itse saunassa, koska kuuma ja kostea ilma kuluttaa painatusta. Pese paita nurinpäin ja kuivata se narulla, niin vitsi pysyy luettavana monta saunakautta.

## Tilaa ajoissa

Tuotteemme painetaan tilauksesta painokumppaneillamme. ${AIKATAULU} ${TOIMITUS}`,
    faq: [
      { q: "Mikä on hyvä lahja saunojalle, jolla on jo kaikki saunatarvikkeet?", a: "Hauska löylypaita on hyvä valinta, koska sitä ei ole saunojalla valmiina. Se puetaan saunan jälkeen ja kertoo, kuka on mökin löylymestari." },
      { q: "Voiko paitaa käyttää saunassa?", a: "Paitaa ei kannata käyttää itse saunassa, koska kuuma ja kostea ilma kuluttaa painatusta. Se on tarkoitettu saunan jälkeiseen oleiluun." },
      { q: "Sopiiko saunapaita joululahjaksi?", a: "Sopii. Joulusaunan löylymestari on tehty juuri joulusaunan lämmittäjälle, ja sen voi pukea päälle jo aattona." },
      JOULU_FAQ,
    ],
  },

  // 3 Mitä ostaa työkaverille pikkujouluihin ─────────────────────────────────────
  {
    slug: "mita-ostaa-tyokaverille-pikkujouluihin",
    title: "Mitä ostaa työkaverille pikkujouluihin: lahja, joka naurattaa koko tiimiä",
    metaTitle: "Lahja työkaverille pikkujouluihin | Huumorikauppa",
    metaDescription: "Lahja työkaverille pikkujouluihin: näin valitset hauskan pikkujoululahjan työkaverille, lahjapeliin tai salaiselle joulupukille.",
    excerpt: "Pikkujoulujen lahjapeli, salainen joulupukki tai kiitos hyvästä vuodesta. Hauska paita on lahja työkaverille, joka sopii kaikkiin näihin ja jota käytetään vielä joulun jälkeenkin.",
    publishedAt: "2026-11-02",
    updatedAt: "2026-11-02",
    category: "lahjaideat",
    tags: ["lahja työkaverille pikkujouluihin", "pikkujoululahja työkaverille", "pikkujoululahja", "salainen joulupukki"],
    relatedCategories: ["t-paidat", "hupparit"],
    content: `## Pikkujoululahja työkaverille ilman päänvaivaa

Pikkujoulut lähestyvät, ja kutsussa lukee: tuo mukanasi pieni lahja. Moni miettii silloin, mitä ostaa. Lahja työkaverille pikkujouluihin on erilainen kuin lahja perheenjäsenelle. Sen pitää olla hauska, sopia kenelle tahansa ja pysyä sovitussa hintarajassa. Lisäksi sen pitää olla sellainen, ettei kukaan joudu kiusalliseen tilanteeseen.

Hauska tekstipaita täyttää nämä ehdot. Sen vitsi naurattaa, kun paketti avataan, ja sitä käytetään myöhemmin perjantaina toimistolla tai seuraavissa pikkujouluissa.

## Selvitä ensin, millainen lahjajako on

Pikkujoulujen lahjat annetaan monella tavalla. Tapa vaikuttaa siihen, millainen lahja kannattaa valita.

**Lahjapeli.** Kaikki tuovat paketin, ja lahjat vaihtavat omistajaa nopan tai arvonnan mukaan. Lahjan pitää sopia kenelle tahansa, joten valitse yleinen vitsi ja väljä koko. Säännöt ja ideat löydät oppaasta [pikkujoulujen lahjapeli](/blogi/pikkujoulujen-lahjapeli).

**Salainen joulupukki.** Arvot yhden työkaverin, jolle ostat lahjan. Silloin voit valita vitsin juuri hänen mukaansa. Lisää ideoita on sivulla [salaisen joulupukin lahja](/salainen-joulupukki-lahja).

**Kiitos lähimmälle työkaverille.** Haluat muistaa työparia tai tiimikaveria hyvästä vuodesta. Tällöin lahja saa olla henkilökohtaisempi.

Tarkista myös hintaraja. Usein se on alle 30 €, ja sopivia vaihtoehtoja löydät sivulta [pikkujoululahja alle 30 euroa](/pikkujoululahja-alle-30-euroa).

## Ideat pikkujouluihin

Pikkujouluaiheinen paita on varma valinta, koska sen vitsi liittyy juuri iltaan, jossa lahja annetaan.

- **Tanssilattian ystävälle:** [Tänään tanssin. Huomenna kadun](/tuote/tanaan-tanssin-huomenna-kadun-t-paita-pikkujouluihin) kertoo illan suunnitelman rehellisesti.
- **Karaoken kuninkaalle:** [Karaokevuoro varattu jo syyskuussa](/tuote/karaokevuoro-varattu-jo-syyskuussa-t-paita-pikkujouluihin) sopii sille, joka on harjoitellut kappaletta koko syksyn.
- **Illan kuljettajalle:** [Pikkujoulujen nimetty kuski](/tuote/pikkujoulujen-nimetty-kuski-t-paita-pikkujouluihin) kiittää sitä, joka vie kaikki kotiin.
- **Lahjapeliin:** [Pikkujoulut. Muistan osittain](/tuote/pikkujoulut-muistan-osittain-t-paita-pikkujouluihin) on yleinen vitsi, joka sopii kenelle tahansa.
- **Vilunkiselle:** [Pikkujoulut 2026: muistetaan 2036 -huppari](/tuote/hauska-huppari-pikkujouluihin-pikkujoulut-muistetaan-vuosia) lämmittää, kun pikkujoulut jatkuvat ulkona.

## Ideat työelämän vitseillä

Jos haluat lahjan, joka on käytössä koko vuoden, valitse työelämään liittyvä vitsi. Se osuu, koska kaikki tunnistavat arjen tilanteet.

- **Palaverien kriitikolle:** [Tämäkin olisi voinut olla sähköposti](/tuote/hauska-t-paita-palaverien-kritisoijalle-tamakin-olisi-voinut-olla-sahkoposti) on paita sille, jonka kalenteri on täynnä kokouksia.
- **Lounastauon vartijalle:** [Tärkeintä työssä on lounastauko](/tuote/hauska-t-paita-lounastaukoa-rakastaville-tarkeinta-tyossa-on-lounastauko) sopii sille, joka on aina ensimmäisenä ovella.
- **Tiimin henkiselle tuelle:** [Selviän. Työkaverit auttaa](/tuote/hauska-t-paita-tyokaverillle-selvian-tyokaverit-auttaa) kiittää työkaveria, joka auttaa aina.
- **Tiimipelaajalle:** [Tiimipelaaja vaikka tiimi ei pelaa](/tuote/hauska-t-paita-tiimipelaajalle-tiimipelaaja-vaikka-tiimi-ei-pelaa) on hauska kiitos sille, joka pitää porukan koossa.

Lisää ideoita löydät sivuilta [lahjat työkaverille](/lahjat/tyokaverille) ja [pikkujoululahjat](/lahjat/pikkujouluihin).

## Mikä vitsi sopii työpaikalle

Työpaikan lahjassa vitsin pitää naurattaa kaikkia, myös saajaa. Kolme nyrkkisääntöä:

1. **Vitsaile tilanteesta, älä ihmisestä.** Palaverit, lounastauot ja pikkujoulujen karaoke ovat yhteisiä kokemuksia. Ulkonäkö ja ikä eivät ole.
2. **Jätä parisuhde ja alkoholi kotiin.** Lahjapelissä paketti voi päätyä kenelle tahansa, myös esihenkilölle.
3. **Mieti, voiko paitaa käyttää töissä.** Paras lahja on sellainen, jonka saaja pukee päälle perjantaina toimistolla.

## Näin lahjasta tulee onnistunut

**Paketoi huolella.** Paita on pehmeä paketti, joten lahjapelissä sitä ei arvaa etukäteen. Se tekee avaamisesta jännittävää.

**Valitse väljä koko.** Kun et tiedä, kuka lahjan saa, valitse koko, joka sopii useimmille, tai huppari, joka on väljempi. Jos lahja on salaiselle joulupukille, kysy kokoa huomaamatta saajan lähimmältä työkaverilta tai vertaa hänen tavallisiin työvaatteisiinsa.

**Lisää kortti.** Salaiselle joulupukille kirjoita lyhyt vihje siitä, miksi valitsit juuri tämän vitsin. Se tekee lahjasta henkilökohtaisen.

## Lahja eri työkavereille

Kaikki työkaverit eivät ole samanlaisia, ja salaisen joulupukin lahjassa tämä kannattaa hyödyntää. Mieti, millainen rooli työkaverilla on työyhteisössä.

**Uusi työkaveri** on ollut talossa vasta vähän aikaa. Hänelle sopii lempeä ja yleinen vitsi, joka toivottaa hänet tervetulleeksi porukkaan. Pikkujouluaiheinen paita on turvallinen valinta, koska se liittyy yhteiseen iltaan eikä kenenkään persoonaan.

**Pitkäaikainen työkaveri** tuntee kaikki talon tavat. Hänelle voit valita vitsin, joka viittaa yhteisiin muistoihin: loputtomiin palavereihin, kahvihuoneen keskusteluihin tai viime vuoden pikkujoulujen karaokeen.

**Etätyöläinen** näkee työkaverit lähinnä näytöllä. Hänelle paita on hauska tapa näkyä seuraavassa videopalaverissa, ja vitsi avaa keskustelun ennen kuin varsinainen asia alkaa.

**Esihenkilö** on lahjapelissä erityistapaus. Jos paketti päätyy hänelle, vitsin pitää olla sellainen, jota hän voi käyttää ilman, että kukaan joutuu hämilleen. Ideoita esihenkilölle löydät sivulta [lahjat pomolle](/lahjat/pomolle).

## Pikkujoululahja muualle kuin töihin

Samat ohjeet sopivat myös harrastusporukan, urheiluseuran tai kaveriporukan pikkujouluihin. Kun lahjajako on yhteinen, valitse yleinen vitsi. Kun tiedät saajan, valitse vitsi hänen harrastuksensa mukaan. Kuntoilijalle sopivia ideoita on esimerkiksi sivulla [kuntosali](/paidat/kuntosali).

## Pikkujoulujen jälkeen

Hyvä pikkujoululahja ei unohdu kaappiin juhlan jälkeen, vaan se otetaan käyttöön heti seuraavalla viikolla. Kun valitset paidan, jota voi käyttää myös arkena, lahja muistuttaa yhteisestä illasta pitkään. Työelämän vitsit toimivat tässä erityisen hyvin, koska palaverit ja lounastauot jatkuvat myös tammikuussa. Pikkujouluaiheinen paita taas saa uuden elämän seuraavana vuonna, kun juhlakausi alkaa uudelleen ja sama porukka kokoontuu taas yhteen. Moni työyhteisö tekee siitä perinteen: viime vuoden paidat puetaan päälle, ja uudet tulokkaat saavat omansa lahjapelistä.

## Koko tiimille samasta tilauksesta

Jos haluat yllättää koko tiimin, tilatkaa jokaiselle oma paita. Kun kaikki pukeutuvat pikkujouluihin omaan vitsiinsä, yhteiskuvasta tulee illan paras muisto. Samaan tilaukseen saa eri koot ja eri vitsit, ja toimitusmaksu maksetaan kerran. Ohjeet ovat sivulla [ryhmätilaukset](/ryhmatilaukset), ja lisää ideoita on oppaassa [pikkujoulupaidat tiimille](/blogi/pikkujoulupaidat-tiimille).

Jos etsit lahjaa myöhemmin jouluksi, lue opas [mitä ostaa työkaverille jouluksi](/blogi/mita-ostaa-tyokaverille-jouluksi) ja katso kaikki jouluideat sivulta [joulu](/joulu).

## Tilaa ajoissa ennen pikkujouluja

Pikkujoulut ovat usein marras- ja joulukuun vaihteessa, joten tilaa lahja hyvissä ajoin ennen juhlaa. Tuotteemme painetaan tilauksesta painokumppaneillamme. ${TOIMITUS} ${AIKATAULU}`,
    faq: [
      { q: "Mitä ostaa työkaverille pikkujouluihin?", a: "Hauska tekstipaita on hyvä valinta, koska se sopii lahjapeliin, salaiselle joulupukille ja kiitokseksi työkaverille. Valitse vitsi, joka liittyy pikkujouluihin tai työelämään." },
      { q: "Millainen lahja sopii pikkujoulujen lahjapeliin?", a: "Lahjapeliin sopii lahja, joka käy kenelle tahansa. Valitse yleinen vitsi ja väljä koko, tai huppari, joka sopii useimmille." },
      { q: "Mikä vitsi sopii työpaikan lahjaan?", a: "Työpaikalla toimii vitsi, joka koskee yhteisiä tilanteita, kuten palavereja, lounastaukoja tai pikkujoulujen karaokea. Parisuhde- ja alkoholivitsit kannattaa jättää pois." },
      { q: "Voiko koko tiimille tilata paidat samasta tilauksesta?", a: "Voi. Samaan tilaukseen saa eri koot ja eri vitsit, ja toimitusmaksu maksetaan kerran." },
      JOULU_FAQ,
    ],
  },
];
