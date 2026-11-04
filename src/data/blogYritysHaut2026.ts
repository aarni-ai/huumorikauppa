import { BlogPost } from "@/types/blog";
import { TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_LAUSE } from "@/config/toimitus";
import { jouluLause, jouluVastaus } from "./tilauspaivat";
import { YRITYS_JOULU_TEKSTI, YRITYS_PORTAAT } from "./yrityksetPage";
import { LOGO_RAJAT, LOGOPAITA_MIN_KPL } from "../../api/_lib/logopaita.js";
import { LASKU_MAKSUAIKA_PV } from "../../api/_lib/yritysmyynti.js";

/**
 * Yritysten hakuoppaat (julkaistu 1.11.2026): viisi yritysostajan hakuaikomusta, jotka ohjaavat sivulle /yritykset
 * (oma logo tai teksti, määräalennus, lasku). Säännöt kuten blogJouluHaut2026.ts: ei ajatusviivoja, ei
 * epävarmuusilmauksia, ei todistamattomia väitteitä, ei hintoja tekstissä (tuotekortit näyttävät hinnan), joulun
 * päivät vakioista (tilauspaivat.ts, yrityksetPage.ts). Pituus 600-900 sanaa. Tarkistus: src/data/blog.test.ts.
 */
const TOIMITUS = `${TOIMITUSMAKSU_LAUSE} Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta.`;
// Portaat ja niiden ehto (meemipaidoissa pienempi porras, 7 €:n katesääntö 4.11.2026, src/data/yrityksetPage.ts).
const PORTAAT = `${YRITYS_PORTAAT.map((p) => `${p.min} paitaa -${p.prosentti} %`).join(", ")}. Meemipaidoissa porras on pienempi tai sitä ei ole`;
const YRITYS_JOULU = `Yritystilauksessa kokojen keruuseen ja maksuun kuluu muutama päivä, joten tilatkaa ja maksakaa viimeistään ${YRITYS_JOULU_TEKSTI}, niin paidat ovat perillä ennen joulua.`;
const AIKATAULU = `${jouluLause()} ${YRITYS_JOULU} Katso tarkempi aikataulu sivulta [joulun viimeiset tilauspäivät](/joulun-viimeiset-tilauspaivat).`;
const JOULU_FAQ = {
  q: "Ehtiikö yritystilaus vielä jouluksi?",
  a: `${YRITYS_JOULU} ${jouluVastaus()}`,
};

/** Artikkelin slug -> pääavainsana. */
export const YRITYSHAKUSANAT: Record<string, string> = {
  "yrityksen-joululahja-tyontekijoille": "yrityksen joululahja työntekijöille",
  "pikkujoulupaidat-tiimille": "pikkujoulupaidat tiimille",
  "tiimipaidat-omalla-logolla": "tiimipaidat omalla logolla",
  "joululahja-asiakkaille-yritys": "joululahja asiakkaille yritys",
  "hauska-tiimipaita": "hauska tiimipaita",
};

export const yritysHakuOppaat2026: BlogPost[] = [
  // 1 Yrityksen joululahja työntekijöille ─────────────────────────────────────
  {
    slug: "yrityksen-joululahja-tyontekijoille",
    title: "Yrityksen joululahja työntekijöille: oma logo, huumoria ja tilaus laskulla",
    metaTitle: "Yrityksen joululahja työntekijöille | Huumorikauppa",
    metaDescription: "Yrityksen joululahja työntekijöille: paita yrityksen logolla ja huumoridesignilla, määräalennus 10 paidasta ja tilaus laskulla Y-tunnuksella.",
    excerpt: "Kun yritys hankkii joululahjat koko henkilöstölle, lahjan pitää olla mieluinen ja hankinnan helppo. Tässä ohje siihen, miten paita yrityksen logolla tilataan laskulla.",
    publishedAt: "2026-11-01",
    updatedAt: "2026-11-01",
    category: "lahjaideat",
    tags: ["yrityksen joululahja työntekijöille", "henkilöstölahja joulu", "joululahja henkilökunnalle", "yrityksen joululahja"],
    relatedCategories: ["t-paidat", "hupparit"],
    content: `## Henkilöstön joululahja on kiitos ja hankinta yhtä aikaa

Yrityksen joululahja työntekijöille on kahden asian summa. Lahjan pitää tuntua kiitokselta, ja samalla sen hankinnan pitää sujua kuten muidenkin yrityksen ostojen: tarjous, lasku ja selvä aikataulu. Tässä oppaassa käydään läpi molemmat.

Hauska paita sopii henkilöstölahjaksi hyvin, koska se on käytössä vielä joulun jälkeen. Kun paidassa on yrityksen logo ja huumoria, lahja kertoo työyhteisön hengestä joka kerta, kun sitä käytetään.

## Kolme tapaa rakentaa lahja

**1. Yrityksen logo tai teksti.** Sivulla [yrityksille](/yritykset) voitte ladata logon tai kirjoittaa tekstin, ja esikatselu näyttää heti, miltä paidan etupuoli näyttää. Paidat painetaan tilauksesta EU:ssa.

**2. Logo ja huumoridesign samassa paidassa.** Valitse valikoimasta huumoridesign, joka painetaan ylös, ja logo tai teksti sen alle. Näin lahja on hauska ja silti yrityksen oma.

**3. Valmis vitsi jokaiselle.** Pienessä tiimissä jokaiselle voi valita oman paidan. [Legendaarinen työsankari](/tuote/personoitava-t-paita-nimi-legendaarinen-tyosankari) painetaan työntekijän nimellä, ja [Alalla X vuotta](/tuote/personoitava-t-paita-alalla-x-vuotta) kiittää pitkästä urasta.

## Mitä logolta vaaditaan

Siistein tulos syntyy läpinäkyvätaustaisesta logosta. Logo voi olla PNG-kuva, jonka leveys on vähintään ${LOGO_RAJAT.minPx} pikseliä, tai SVG-tiedosto. Lataus tarkistaa tarkkuuden heti, joten liian pieni kuva ei päädy painoon asti. Jos logossa on valkoinen tausta, myös tausta painetaan, ja sen näkee esikatselusta.

Huumoridesignit on tehty vaaleille paidoille, joten designin kanssa valitaan valkoinen tai vaaleanharmaa paita. Pelkkä logo tai teksti sopii myös mustaan ja tummansiniseen.

## Määräalennus ja lasku

Logopaitoja tilataan vähintään ${LOGOPAITA_MIN_KPL} kappaletta. Määräalennus lasketaan automaattisesti kaikista saman tilauksen t-paidoista: ${PORTAAT}. Alennuskoodia ei tarvita.

Maksutapoja on kaksi:

- **Lasku.** Yritys, jolla on Y-tunnus, voi maksaa laskulla, jonka maksuaika on ${LASKU_MAKSUAIKA_PV} päivää. Paidat lähtevät painoon, kun lasku on maksettu.
- **Kortti tai mobiilimaksu.** Paidat lisätään ostoskoriin ja maksetaan kassalla, jolloin ne lähtevät painoon heti.

Koot syötetään taulukkoon koko kerrallaan sivulla [yritystilaus](/yritykset/tilaus). Jos haluatte ensin tarjouksen, lähettäkää tarjouspyyntö samalta sivulta, ja liittäkää siihen logo.

## Valmiit vitsit logopaidan rinnalle

Moni yritys tilaa kaikille saman logopaidan ja lisäksi muutaman hauskan paidan palkinnoiksi pikkujouluihin.

- [Tiimipelaaja vaikka tiimi ei pelaa](/tuote/hauska-t-paita-tiimipelaajalle-tiimipelaaja-vaikka-tiimi-ei-pelaa) sopii tiimille, joka on selvinnyt vuoden isoimmasta projektista.
- [Konttori 3 metriä sängystä](/tuote/hauska-huppari-etatoita-tekeville-konttori-3-metria-sangysta) on huppari etätyöntekijälle.
- [Kiltti, enimmäkseen](/tuote/kiltti-enimmakseen-t-paita-jouluun) on joulupaita, jonka voi antaa kenelle tahansa.

Jos haluatte painattaa vapaan tekstin ilman logoa yksittäiseen paitaan, valitse [Oma teksti/kuva -t-paita](/tuote/oma-tekstikuva-t-paita).

## Näin hankinta etenee

1. **Päättäkää malli.** Logo, teksti ja mahdollinen huumoridesign valitaan esikatselussa.
2. **Kerätkää koot.** Lähettäkää henkilöstölle kokotaulukko ja vastausaika. Tuotesivuilla on mitat senttimetreinä.
3. **Tilatkaa yhdellä kertaa.** Samaan tilaukseen saa eri koot, ja koko tilaus toimitetaan yhteen osoitteeseen.
4. **Jakakaa yhdessä.** Lahjojen avaaminen yhtä aikaa pikkujouluissa tai joulukahveilla tekee lahjasta yhteisen hetken.

Logopaidat tehdään juuri teille, joten niillä ei ole 14 päivän palautusoikeutta. Tarkistakaa logo, teksti ja koot esikatselusta ennen tilausta.

## Verotus ja kirjanpito

Henkilöstölahjan verokohtelu kannattaa tarkistaa Verohallinnon ohjeesta ennen hankintaa. Laskulla näkyvät myyjän Y-tunnus, tilausrivit ja arvonlisävero, joten se käy suoraan kirjanpitoon.

## Kokojen kerääminen isossa yrityksessä

Isossa yrityksessä kokojen kerääminen on hankinnan hitain vaihe. Tehkää yksi lomake, jossa on kokotaulukko senttimetreinä ja kaksi kysymystä: koko ja toimipiste. Nimetkää jokaiseen tiimiin yhteyshenkilö, joka muistuttaa vastaamatta jättäneitä. Kun vastausaika on viikko, koot ovat koossa ennen joulun tilauspäivää. Jos joku ei vastaa, tilatkaa hänelle koko L, joka sopii useimmille.

## Kun lahja jaetaan etätyöntekijöille

Jos osa henkilöstöstä tekee töitä toisella paikkakunnalla, tilatkaa paidat toimistolle ja postittakaa ne sieltä tai jakakaa ne seuraavassa yhteisessä tapaamisessa. Sopikaa hetki, jolloin paketit avataan yhtä aikaa videopalaverissa.

Lisää ideoita yksittäisiin lahjoihin löydätte oppaasta [joululahja työntekijöille](/blogi/joululahja-tyontekijoille), ja logopaidan tekemisestä kerrotaan tarkemmin oppaassa [tiimipaidat omalla logolla](/blogi/tiimipaidat-omalla-logolla).

## Aikataulu

${TOIMITUS} ${AIKATAULU}`,
    faq: [
      { q: "Mikä on hyvä yrityksen joululahja työntekijöille?", a: "Paita yrityksen logolla ja halutessa huumoridesignilla. Se on kiitos, joka on käytössä vielä joulun jälkeen." },
      { q: "Voiko yritys maksaa laskulla?", a: `Voi. Yritys, jolla on Y-tunnus, voi maksaa laskulla, jonka maksuaika on ${LASKU_MAKSUAIKA_PV} päivää, ja paidat lähtevät painoon maksun jälkeen.` },
      { q: "Kuinka monta logopaitaa pitää tilata?", a: `Vähintään ${LOGOPAITA_MIN_KPL}. Määräalennus lasketaan automaattisesti: ${PORTAAT}.` },
      JOULU_FAQ,
    ],
  },

  // 2 Pikkujoulupaidat tiimille ───────────────────────────────────────────────
  {
    slug: "pikkujoulupaidat-tiimille",
    title: "Pikkujoulupaidat tiimille: yhteinen paita työpaikan pikkujouluihin",
    metaTitle: "Pikkujoulupaidat tiimille | Huumorikauppa",
    metaDescription: "Pikkujoulupaidat tiimille: samat paidat koko työporukalle tiimin nimellä tai logolla, hauskat pikkujouluvitsit ja määräalennus 10 paidasta.",
    excerpt: "Kun koko tiimi saapuu pikkujouluihin samoissa paidoissa, ilta alkaa naurulla. Tässä ideat tiimin pikkujoulupaitoihin ja ohje tilaukseen.",
    publishedAt: "2026-11-01",
    updatedAt: "2026-11-01",
    category: "lahjaideat",
    tags: ["pikkujoulupaidat tiimille", "pikkujoulupaita", "tiimin pikkujoulut", "pikkujoulut työpaikalla"],
    relatedCategories: ["t-paidat", "hupparit"],
    content: `## Miksi tiimi pukeutuu samaan paitaan

Pikkujoulupaidat tiimille ovat helppo tapa tehdä illasta yhteinen. Kun koko porukka saapuu paikalle samoissa paidoissa, tiimi erottuu muista, yhteiskuvasta tulee hauska ja paita muistuttaa illasta vielä vuosien päästä.

Yhteinen paita sopii erityisesti silloin, kun pikkujoulut järjestetään useamman tiimin kesken. Silloin paita kertoo, mistä porukasta on kyse, ja tiimien välille syntyy leikkimielistä kilpailua.

## Kolme tapaa tehdä tiimin pikkujoulupaita

**Tiimin nimi tai logo.** Sivulla [yrityksille](/yritykset) voitte kirjoittaa tiimin nimen tai ladata logon ja nähdä esikatselun paidan etupuolesta. Tekstiä mahtuu kaksi riviä, esimerkiksi tiimin nimi ja vuosi.

**Logo ja pikkujouluvitsi.** Valitse huumoridesign ylös ja tiimin nimi sen alle. Näin paita on yhtä aikaa hauska ja teidän oma.

**Valmis pikkujouluvitsi.** Jos tiimi haluaa vain hauskan yhteisen paidan, valitkaa yksi valmis vitsi ja tilatkaa se kaikille.

## Valmiit pikkujouluvitsit

- [Pikkujoulut. Muistan osittain](/tuote/pikkujoulut-muistan-osittain-t-paita-pikkujouluihin) on klassikko, joka kertoo seuraavan aamun tunnelman.
- [Pikkujoulujen nimetty kuski](/tuote/pikkujoulujen-nimetty-kuski-t-paita-pikkujouluihin) sopii sille, joka ajaa porukan kotiin.
- [Karaokevuoro varattu jo syyskuussa](/tuote/karaokevuoro-varattu-jo-syyskuussa-t-paita-pikkujouluihin) on paita tiimin laulajalle.
- [Tänään tanssin, huomenna kadun](/tuote/tanaan-tanssin-huomenna-kadun-t-paita-pikkujouluihin) sopii tanssilattian ensimmäiselle.
- [Tonttu koeajalla](/tuote/tonttu-koeajalla-t-paita-jouluun) on hauska paita tiimin uusimmalle jäsenelle.
- [Glögi ensin. Sitten joulu](/tuote/glogi-ensin-sitten-joulu-t-paita-jouluun) sopii tiimille, joka aloittaa pikkujoulut glögillä.

Jos pikkujoulut ovat ulkona tai kylmässä, valitkaa huppari, esimerkiksi [Pikkujoulut muistetaan vuosia](/tuote/hauska-huppari-pikkujouluihin-pikkujoulut-muistetaan-vuosia). Lisää vaihtoehtoja on sivulla [pikkujoululahjat](/lahjat/pikkujouluihin).

## Eri vitsit, sama tilaus

Tiimin ei tarvitse valita yhtä vitsiä. Jokainen voi valita oman paitansa, ja ne tilataan yhdellä kertaa. Määräalennus lasketaan kaikista saman tilauksen t-paidoista designista ja koosta riippumatta: ${PORTAAT}. Hauska tapa on antaa jokaiselle oma rooli: kuski, karaokelaulaja, tanssija ja tonttu.

## Työpaikan huumori pikkujouluissa

Pikkujouluissa on mukana koko työyhteisö, joten valitkaa vitsi, jolle kaikki voivat nauraa. Juhlimiseen ja joulun tapoihin liittyvät vitsit toimivat hyvin, kun taas työkavereiden henkilökohtaiset asiat kannattaa jättää paidoista pois. Ideoita illan ohjelmaan löydätte oppaasta [pikkujouluohjelma työpaikalle](/blogi/pikkujouluohjelma-tyopaikalle), ja kaveriporukan paitoihin oppaasta [pikkujoulupaidat porukalle](/blogi/pikkujoulupaidat-porukalle).

## Näin tilaatte tiimin paidat

1. **Valitkaa paita.** Päättäkää, tuleeko paitaan tiimin nimi, logo, valmis vitsi vai yhdistelmä.
2. **Kerätkää koot.** Laittakaa tiimin kanavalle kokotaulukko ja pyytäkää koot määräpäivään mennessä.
3. **Tilatkaa yhdellä kertaa.** Koot syötetään taulukkoon, ja maksu onnistuu kortilla tai yrityksen laskulla.
4. **Jakakaa paidat ennen iltaa.** Paidat kannattaa jakaa työpäivän aikana, jotta kaikki saapuvat juhliin samassa asussa.

Laskulla tilattaessa paidat lähtevät painoon, kun lasku on maksettu. Jos tilaatte kortilla, paidat lähtevät painoon heti.

## Kun tiimi on pieni

Logopaitoja tilataan vähintään ${LOGOPAITA_MIN_KPL}. Pienemmälle tiimille valmiit pikkujouluvitsit sopivat hyvin, koska niitä voi tilata yhdenkin kappaleen. Määräalennus alkaa kymmenestä t-paidasta, joten kahden tiimin yhteinen tilaus kannattaa.

## Paidan väri ja painatus

Pelkkä tiimin nimi tai logo painetaan mustaan, valkoiseen, vaaleanharmaaseen tai tummansiniseen paitaan. Tummalla paidalla teksti on valkoinen ja vaalealla musta, joten se erottuu myös hämärässä juhlatilassa. Kun mukana on huumoridesign, paita on valkoinen tai vaaleanharmaa, koska designit on tehty vaaleille paidoille. Esikatselu näyttää lopputuloksen ennen tilausta.

## Pikkujoulupaita etätiimille

Jos osa tiimistä osallistuu pikkujouluihin etänä, lähettäkää paidat heille etukäteen. Kun kaikki pukevat saman paidan, myös ruudun toisella puolella istuva on osa porukkaa. Yhteiskuva onnistuu silloinkin, kun osa tiimistä on videopuhelussa.

## Pikkujoulujen palkinnot

Monessa työpaikassa pikkujouluissa jaetaan palkintoja: vuoden tsemppari, karaokekuningas tai kahvinkeittäjä. Hauska paita on hyvä palkinto, koska voittaja voi pukea sen heti. Tilatkaa palkintopaidat samaan tilaukseen tiimin paitojen kanssa, niin ne kasvattavat samalla määräalennusta.

## Muisto illasta

Ottakaa yhteiskuva heti illan alussa, kun kaikki ovat samoissa paidoissa. Kuvasta tulee tiimin oma muisto, ja paita palaa käyttöön seuraavissa pikkujouluissa.

## Aikataulu

Pikkujoulut ovat usein marras- ja joulukuun vaihteessa, joten tilatkaa paidat ajoissa. ${TOIMITUS} ${AIKATAULU}`,
    faq: [
      { q: "Mitä pikkujoulupaitaan kannattaa painaa?", a: "Tiimin nimi ja vuosi, yrityksen logo tai valmis pikkujouluvitsi. Logon ja huumoridesignin voi myös yhdistää." },
      { q: "Pitääkö kaikilla olla sama paita?", a: "Ei tarvitse. Jokainen voi valita oman vitsin, ja määräalennus lasketaan kaikista saman tilauksen t-paidoista." },
      { q: "Kuinka monta logopaitaa pitää tilata?", a: `Vähintään ${LOGOPAITA_MIN_KPL}. Valmiita pikkujouluvitsejä voi tilata yhdenkin kappaleen.` },
      JOULU_FAQ,
    ],
  },

  // 3 Tiimipaidat omalla logolla ──────────────────────────────────────────────
  {
    slug: "tiimipaidat-omalla-logolla",
    title: "Tiimipaidat omalla logolla: näin teette paidat esikatselulla",
    metaTitle: "Tiimipaidat omalla logolla | Huumorikauppa",
    metaDescription: "Tiimipaidat omalla logolla: lataa logo PNG- tai SVG-tiedostona, katso esikatselu, lisää halutessa huumoridesign ja tilaa 10 paitaa tai enemmän.",
    excerpt: "Tiimipaita omalla logolla syntyy muutamassa minuutissa: logo, teksti, väri ja esikatselu. Tässä ohje tiedostoihin, väreihin ja tilaukseen.",
    publishedAt: "2026-11-01",
    updatedAt: "2026-11-01",
    category: "lahjaideat",
    tags: ["tiimipaidat omalla logolla", "t-paita omalla logolla", "logopaita yritykselle", "tiimipaita"],
    relatedCategories: ["t-paidat"],
    content: `## Tiimipaita, joka on teidän näköisenne

Tiimipaidat omalla logolla ovat tuttu näky messuilla, tapahtumissa ja työpaikan juhlissa. Ne kertovat, kuka kuuluu porukkaan, ja tekevät yhteisestä tekemisestä näkyvää. Sivulla [yrityksille](/yritykset) logopaidan voi tehdä itse: lataa logo, kirjoita teksti, valitse väri ja katso esikatselusta, miltä paidan etupuoli näyttää.

## Vaihe 1: logo

Logon voi ladata kahdessa muodossa:

- **PNG.** Kuvan pitää olla vähintään ${LOGO_RAJAT.minPx} pikseliä leveä, ja ${LOGO_RAJAT.suositusPx} pikseliä tai enemmän antaa terävimmän tuloksen. Lataus tarkistaa tarkkuuden heti.
- **SVG.** Vektorilogo skaalautuu mihin kokoon tahansa. Jos SVG:ssä on tekstiä, muuntakaa tekstit poluiksi ennen tallennusta, jotta fontti näkyy oikein.

Käyttäkää logoa, jossa on läpinäkyvä tausta. Jos logon taustalla on valkoinen laatikko, myös laatikko painetaan paitaan. Esikatselu näyttää tämän ennen tilausta.

## Vaihe 2: teksti

Logon alle voi kirjoittaa kaksi riviä tekstiä, esimerkiksi tiimin nimen ja vuoden tai tapahtuman nimen. Tekstin voi painaa myös ilman logoa, jolloin tiimin nimi on paidan ainoa painatus. Teksti painetaan selkeällä ja leveällä fontilla, joka erottuu kauas.

## Vaihe 3: huumoridesign mukaan vai ei

Tiimipaidasta tulee hauskempi, kun logon yläpuolelle valitaan huumoridesign. Valikoimassa on satoja designeja, ja haulla löytää aiheen nopeasti. Design painetaan ylös ja logo tai teksti sen alle. Huumoridesignit on tehty vaaleille paidoille, joten silloin valitaan valkoinen tai vaaleanharmaa paita.

## Vaihe 4: väri ja koot

Pelkkä logo tai teksti painetaan mustaan, valkoiseen, vaaleanharmaaseen tai tummansiniseen paitaan. Tummalla paidalla teksti painetaan valkoisena ja vaalealla mustana. Paita on Gildan Softstyle 64000 -t-paita, ja koot syötetään taulukkoon sivulla [yritystilaus](/yritykset/tilaus).

## Hinta ja määrä

Logopaitoja tilataan vähintään ${LOGOPAITA_MIN_KPL} kappaletta. Määräalennus lasketaan automaattisesti: ${PORTAAT}. Yritys, jolla on Y-tunnus, voi maksaa laskulla, jonka maksuaika on ${LASKU_MAKSUAIKA_PV} päivää. Kortilla maksettaessa paidat lähtevät painoon heti, laskulla maksun jälkeen.

## Kun logoa ei ole

Kaikilla tiimeillä ei ole logoa, eikä sitä tarvita. Tiimin nimi kahdella rivillä toimii yhtä hyvin. Jos haluatte vapaan asettelun yksittäiseen paitaan, valitkaa [Oma teksti/kuva -t-paita](/tuote/oma-tekstikuva-t-paita) tai lämpimämpi [Oma teksti/kuva -huppari](/tuote/oma-tekstikuva-huppari).

## Valmis vitsi tiimipaidaksi

Jos tiimi haluaa logon sijaan yhteisen vitsin, valitkaa valmis paita ja tilatkaa se kaikille.

- [Tiimipelaaja vaikka tiimi ei pelaa](/tuote/hauska-t-paita-tiimipelaajalle-tiimipelaaja-vaikka-tiimi-ei-pelaa) on tiimipaita, joka naurattaa projektin jälkeen.
- [Tämäkin olisi voinut olla sähköposti](/tuote/hauska-t-paita-palaverien-kritisoijalle-tamakin-olisi-voinut-olla-sahkoposti) sopii tiimille, jonka kalenteri on täynnä palavereja.
- [Tärkeintä työssä on lounastauko](/tuote/hauska-t-paita-lounastaukoa-rakastaville-tarkeinta-tyossa-on-lounastauko) on vitsi, johon jokainen samaistuu.

Alakohtaiset vitsit löytyvät sivulta [ammattipaidat](/ammattipaidat), ja lisää tiimipaitaideoita on oppaassa [hauska tiimipaita](/blogi/hauska-tiimipaita).

## Missä tiimipaitaa käytetään

Logopaita on käytössä monessa paikassa: messuosastolla, tiimipäivässä, urheilutapahtumassa ja työpaikan juhlissa. Kun paita on hauska, sitä käytetään myös vapaa-ajalla, ja logo kulkee mukana. Valitkaa siksi teksti ja design, jotka sopivat myös ulkopuolisten silmiin.

## Logon koko paidassa

Ilman designia logo painetaan rinnan yläosaan isona, ja teksti tulee sen alle. Kun mukana on huumoridesign, logo painetaan pienempänä designin alle. Molemmissa tapauksissa esikatselu näyttää koon suhteessa paitaan, joten näette, miltä paita näyttää päällä.

## Yleisimmät virheet logopaidassa

- **Liian pieni logo.** Pieni kuva näyttää esikatselussa sumealta, ja lataus kertoo, jos tarkkuus ei riitä.
- **Valkoinen tausta.** Laatikko logon ympärillä näkyy paidassa. Käyttäkää läpinäkyvää PNG:tä tai SVG:tä.
- **Kirjoitusvirhe.** Lukekaa teksti ääneen ennen tilausta, ja pyytäkää toista tarkistamaan nimet.

## Ennen tilausta

Logopaidat tehdään juuri teille, joten niillä ei ole 14 päivän palautusoikeutta. Tarkistakaa esikatselusta logon terävyys, tekstin kirjoitusasu ja paidan väri. Pyytäkää koot tiimiltä kokotaulukon kanssa, niin jokainen saa sopivan paidan. Lisätietoa palautuksista on sivulla [palautusehdot](/palautusehdot).

## Tarjous ennen tilausta

Jos tilaus on iso tai tarvitsette tarjouksen hankintaa varten, lähettäkää tarjouspyyntö sivulta yrityksille. Tarjouspyyntöön liitetään sama logo, teksti ja design kuin tilaukseen, joten vastaus perustuu juuri teidän paitaanne. Isoja tiimitilauksia käsitellään myös sivulla [ryhmätilaukset](/ryhmatilaukset).

## Aikataulu

${TOIMITUS} ${AIKATAULU}`,
    faq: [
      { q: "Millainen logotiedosto tiimipaitaan tarvitaan?", a: `PNG, joka on vähintään ${LOGO_RAJAT.minPx} pikseliä leveä, tai SVG. Läpinäkyvä tausta antaa siisteimmän tuloksen.` },
      { q: "Näkeekö paidan ennen tilausta?", a: "Näkee. Esikatselu näyttää paidan etupuolen juuri sellaisena kuin se painetaan." },
      { q: "Voiko logon yhdistää huumoridesigniin?", a: "Voi. Design painetaan ylös ja logo tai teksti sen alle valkoiseen tai vaaleanharmaaseen paitaan." },
      { q: "Voiko logopaidan palauttaa?", a: "Ei voi. Logopaidat tehdään juuri tilaajalle, joten tarkistakaa esikatselu ja koot ennen tilausta." },
      JOULU_FAQ,
    ],
  },

  // 4 Joululahja asiakkaille ──────────────────────────────────────────────────
  {
    slug: "joululahja-asiakkaille-yritys",
    title: "Joululahja asiakkaille: yritys jää mieleen hauskasta lahjasta",
    metaTitle: "Joululahja asiakkaille yrityksen nimissä | Huumorikauppa",
    metaDescription: "Joululahja asiakkaille yrityksen nimissä: paita logolla ja huumorilla, ammattivitsit kumppaneille sekä tilaus laskulla Y-tunnuksella.",
    excerpt: "Asiakkaan joululahja kertoo, millainen yritys on. Hauska paita yrityksen logolla jää mieleen paremmin kuin kolmas suklaarasia.",
    publishedAt: "2026-11-01",
    updatedAt: "2026-11-01",
    category: "lahjaideat",
    tags: ["joululahja asiakkaille yritys", "asiakaslahja joulu", "joululahja asiakkaille", "yrityslahja"],
    relatedCategories: ["t-paidat"],
    content: `## Asiakaslahja kertoo yrityksestä

Joululahja asiakkaille on yritykselle tilaisuus kiittää yhteistyöstä ja jäädä mieleen. Joulukuussa asiakkaan pöydälle kertyy suklaata, kalentereita ja kyniä. Hauska paita erottuu niistä, koska se otetaan käyttöön, ja yrityksen nimi kulkee mukana.

Asiakaslahjassa huumori on hyvä valinta, kun vitsi on ystävällinen. Hyvä asiakaslahja naurattaa saajaa itseään, ei ketään hänen kustannuksellaan.

## Paita yrityksen logolla ja huumorilla

Sivulla [yrityksille](/yritykset) voitte ladata logon tai kirjoittaa tekstin ja valita, tuleeko mukaan huumoridesign. Esikatselu näyttää paidan etupuolen ennen tilausta. Kun design on ylhäällä ja logo sen alla, lahja on hauska ja silti selvästi teidän.

Asiakaslahjaan sopii hyvin lyhyt teksti, esimerkiksi kiitos yhteistyöstä ja vuosi. Kirjoittakaa teksti niin, että se toimii myös saajan omassa käytössä.

## Ammattivitsi asiakkaan alalle

Kun asiakkaat ovat samalta alalta, ammattivitsi osuu suoraan. Se kertoo, että tunnette asiakkaan arjen.

- IT-alan asiakkaalle [Kahvi sisään, koodia ulos](/tuote/kahvi-sisaan-koodia-ulos-t-paita-it-ihmiselle) sopii jokaiselle, joka ohjelmoi.
- Asiakaspalvelun ammattilaiselle [Asiakas on aina oikeassa, lähes](/tuote/hauska-t-paita-asiakaspalvelijalle-asiakas-on-aina-oikeassa-lahes) kertoo sen, mitä hän ei voi asiakkaalle sanoa.

Muiden alojen vitsit löydätte sivulta [ammattipaidat](/ammattipaidat).

## Jouluinen vitsi kaikille

Jos asiakkaat ovat eri aloilta, jouluinen vitsi on turvallinen valinta.

- [Kiltti, enimmäkseen](/tuote/kiltti-enimmakseen-t-paita-jouluun) sopii jokaiselle asiakkaalle.
- [Glögi ensin. Sitten joulu](/tuote/glogi-ensin-sitten-joulu-t-paita-jouluun) on lahja asiakkaalle, jonka kanssa on istuttu monessa glögitilaisuudessa.

Lisää joulun vitsejä on sivulla [hauskat joululahjat](/joululahjat).

## Näin valitsette sopivan vitsin

Ennen tilausta käykää asiakaslista läpi ja jakakaa saajat ryhmiin. Läheisille asiakkaille, joiden kanssa on naurettu yhdessä, voi valita rohkeamman vitsin. Uusille ja muodollisemmille asiakkaille sopii jouluinen vitsi tai pelkkä logo ja kiitos. Alkoholi- ja politiikkavitsit jätetään asiakaslahjoista pois.

## Koot ilman kyselyä

Asiakkailta ei aina voi kysyä kokoa. Silloin kannattaa valita yleisimmät koot, M ja L, tai kysyä koko yhteyshenkilöltä lyhyellä viestillä. Kokotaulukko senttimetreinä löytyy jokaiselta tuotesivulta.

## Tilaus ja toimitus

Logopaitoja tilataan vähintään ${LOGOPAITA_MIN_KPL} kappaletta, ja määräalennus lasketaan automaattisesti: ${PORTAAT}. Koko tilaus toimitetaan yhteen osoitteeseen, esimerkiksi toimistolle, josta lahjat jaetaan asiakastapaamisissa tai postitetaan saatekirjeen kanssa.

Yritys, jolla on Y-tunnus, voi maksaa laskulla, jonka maksuaika on ${LASKU_MAKSUAIKA_PV} päivää. Laskulla näkyvät tilausrivit ja arvonlisävero. Asiakaslahjojen kirjanpito- ja verokohtelu kannattaa tarkistaa kirjanpitäjältä ennen hankintaa.

## Lahja kumppaneille ja toimittajille

Asiakkaiden lisäksi moni yritys muistaa joulun alla kumppaneita, alihankkijoita ja toimittajia. Heille sopii sama paita kuin asiakkaille, tai paita, jonka tekstissä kiitetään yhteisestä vuodesta. Kun yhteistyö on tiivistä ja rentoa, voitte valita rohkeamman huumoridesignin. Muodollisempaan suhteeseen sopii pelkkä logo ja lyhyt kiitos.

## Kun asiakkaita on paljon

Jos asiakkaita on kymmeniä, jakakaa lahjat kahteen tasoon. Tärkeimmille asiakkaille valitaan oma paita alan vitsillä tai heidän omalla nimellään, ja muille sama logopaita. Näin budjetti pysyy hallinnassa, ja jokainen saa silti harkitun lahjan. Kirjatkaa saajat taulukkoon samalla, kun keräätte koot, niin paketointi sujuu nopeasti, kun paidat saapuvat.

## Lahja, joka näkyy asiakkaan arjessa

Kalenteri päätyy laatikkoon ja suklaa syödään, mutta paita on käytössä kuukausia. Kun asiakas käyttää paitaa työpaikalla tai vapaa-ajalla, yrityksenne logo on mukana. Siksi asiakaslahjan painatuksen kannattaa olla siisti ja vitsin sellainen, jota saaja kehtaa näyttää.

## Saatekirje tekee lahjasta henkilökohtaisen

Liittäkää jokaiseen pakettiin lyhyt, käsin allekirjoitettu kortti. Kiittäkää konkreettisesta asiasta, esimerkiksi yhteisestä projektista. Kortti ja hauska paita yhdessä kertovat, että asiakas on teille tärkeä.

## Henkilöstö ja asiakkaat samalla tilauksella

Jos yritys tilaa paidat myös omalle henkilöstölle, samaan tilaukseen voi lisätä sekä henkilöstön logopaidat että asiakkaiden paidat. Määräalennus lasketaan kaikista saman tilauksen t-paidoista. Ohjeet henkilöstön lahjaan löydätte oppaasta [yrityksen joululahja työntekijöille](/blogi/yrityksen-joululahja-tyontekijoille).

## Aikataulu

Asiakaslahjat jaetaan yleensä ennen joululomia, joten tilatkaa ajoissa. ${TOIMITUS} ${AIKATAULU}`,
    faq: [
      { q: "Mikä on hyvä joululahja asiakkaille?", a: "Hauska paita yrityksen logolla tai ammattivitsillä. Se otetaan käyttöön, ja yrityksen nimi kulkee mukana." },
      { q: "Millainen vitsi sopii asiakaslahjaan?", a: "Ystävällinen vitsi, joka naurattaa saajaa itseään. Jouluiset ja ammattiin liittyvät vitsit sopivat useimmille asiakkaille." },
      { q: "Voiko asiakaslahjat maksaa laskulla?", a: `Voi. Yritys, jolla on Y-tunnus, voi maksaa laskulla, jonka maksuaika on ${LASKU_MAKSUAIKA_PV} päivää.` },
      JOULU_FAQ,
    ],
  },

  // 5 Hauska tiimipaita ───────────────────────────────────────────────────────
  {
    slug: "hauska-tiimipaita",
    title: "Hauska tiimipaita: ideat toimistolle, työmaalle ja etätiimille",
    metaTitle: "Hauska tiimipaita: ideat työporukalle | Huumorikauppa",
    metaDescription: "Hauska tiimipaita työporukalle: toimistovitsit, ammattivitsit, etätiimin huppari ja tiimin oma paita logolla. Määräalennus 10 paidasta.",
    excerpt: "Hauska tiimipaita yhdistää porukan ja naurattaa vielä projektin jälkeen. Tässä ideat toimistolle, eri aloille ja etätiimille sekä ohje tiimin omaan paitaan.",
    publishedAt: "2026-11-01",
    updatedAt: "2026-11-01",
    category: "lahjaideat",
    tags: ["hauska tiimipaita", "tiimipaita", "hauska paita työporukalle", "tiimin paita"],
    relatedCategories: ["t-paidat", "hupparit"],
    content: `## Mikä tekee tiimipaidasta hauskan

Hauska tiimipaita kertoo vitsin, jonka koko tiimi tunnistaa. Hauskin vitsi syntyy yhteisestä arjesta: palavereista, lounastauoista, kiireestä tai alan omista kommelluksista. Kun vitsi osuu, paitaa käytetään tiimipäivissä, tapahtumissa ja pikkujouluissa vuodesta toiseen.

Valitkaa vitsi, jolle kaikki voivat nauraa. Tiimipaidan huumori kohdistuu työhön ja tiimiin itseensä, ei yksittäiseen työkaveriin.

## Toimiston tiimipaidat

Toimistotyön vitsit ovat tuttuja jokaiselle, joka on istunut palaverissa, jonka asia olisi hoitunut viestillä.

- [Tämäkin olisi voinut olla sähköposti](/tuote/hauska-t-paita-palaverien-kritisoijalle-tamakin-olisi-voinut-olla-sahkoposti) on tiimipaita kalenterin täyttämälle porukalle.
- [Tiimipelaaja vaikka tiimi ei pelaa](/tuote/hauska-t-paita-tiimipelaajalle-tiimipelaaja-vaikka-tiimi-ei-pelaa) sopii tiimille, joka on selvinnyt vaikeasta projektista.
- [Tärkeintä työssä on lounastauko](/tuote/hauska-t-paita-lounastaukoa-rakastaville-tarkeinta-tyossa-on-lounastauko) yhdistää jokaisen, joka katsoo kelloa puoli yhdeltätoista.

## Ammattivitsit eri aloille

Kun tiimi tekee samaa työtä, alan vitsi on hauskin. Se kertoo, että tiimi tuntee työnsä ja osaa nauraa sille.

- IT-tiimille [Kahvi sisään, koodia ulos](/tuote/kahvi-sisaan-koodia-ulos-t-paita-it-ihmiselle).
- Asiakaspalvelun tiimille [Asiakas on aina oikeassa, lähes](/tuote/hauska-t-paita-asiakaspalvelijalle-asiakas-on-aina-oikeassa-lahes).
- Poliisin työporukalle [Lain käsi myös kahvitunnilla](/tuote/hauska-t-paita-poliisille-lain-kasi-myos-kahvitunnilla).

Kymmenien alojen vitsit löydätte sivulta [ammattipaidat](/ammattipaidat).

## Etätiimin paita

Etätiimi tapaa harvoin kasvokkain, joten yhteinen paita tuo porukan yhteen myös videopalaverissa. [Konttori 3 metriä sängystä](/tuote/hauska-huppari-etatoita-tekeville-konttori-3-metria-sangysta) on huppari, joka naurattaa jokaista kotitoimistossa työskentelevää. Sopikaa päivä, jolloin kaikki pukevat paidan palaveriin.

## Tiimin oma paita logolla tai nimellä

Hauskin tiimipaita on usein tiimin oma. Sivulla [yrityksille](/yritykset) voitte ladata logon tai kirjoittaa tiimin nimen ja valita mukaan huumoridesignin. Design painetaan ylös ja logo tai nimi sen alle, ja esikatselu näyttää paidan ennen tilausta. Logopaitoja tilataan vähintään ${LOGOPAITA_MIN_KPL}. Tarkemmat ohjeet tiedostoihin ja väreihin ovat oppaassa [tiimipaidat omalla logolla](/blogi/tiimipaidat-omalla-logolla).

## Kiitos tiimin tähdelle

Jos tiimissä on joku, jota halutaan kiittää erikseen, valitkaa hänelle oma paita. [Legendaarinen työsankari](/tuote/personoitava-t-paita-nimi-legendaarinen-tyosankari) painetaan hänen nimellään, ja se sopii palkinnoksi tiimipäivään tai pikkujouluihin.

## Meemit nuorelle tiimille

Nuoressa tiimissä suomalaiset meemit ovat yhteistä kieltä. Klassikot löytyvät sivulta [meemipaidat](/meemipaidat), ja niistä valitaan helposti yhteinen vitsi koko porukalle.

## Näin tilaatte tiimipaidat

1. **Valitkaa vitsi tai tehkää oma paita.** Valmiin vitsin voi tilata yhdenkin kappaleen, logopaidan vähintään kymmenen.
2. **Kerätkää koot.** Jakakaa kokotaulukko tiimin kanavalla ja sopikaa vastausaika.
3. **Tilatkaa yhdellä kertaa.** Määräalennus lasketaan kaikista saman tilauksen t-paidoista: ${PORTAAT}.
4. **Maksakaa kortilla tai laskulla.** Yritys, jolla on Y-tunnus, voi maksaa laskulla, jonka maksuaika on ${LASKU_MAKSUAIKA_PV} päivää.

Isompiin tilauksiin ja kerhoille on lisää ohjeita sivulla [ryhmätilaukset](/ryhmatilaukset). Yksittäisiä lahjoja työkavereille löydätte sivulta [lahja työkaverille](/lahjat/tyokaverille).

## Valitkaa vitsi yhdessä

Tiimipaidan vitsi kannattaa valita yhdessä. Laittakaa tiimin kanavalle kolme vaihtoehtoa ja äänestäkää. Kun jokainen on saanut vaikuttaa valintaan, paitaa myös käytetään. Äänestys on itsessään hauska tiimihetki, ja hävinneet vaihtoehdot sopivat seuraavaan vuoteen.

## Tiimipaita tapahtumiin

Tiimipaita on hyvä myös silloin, kun tiimi osallistuu yhdessä tapahtumaan, kuten yritysten väliseen juoksuun, salibandyturnaukseen tai messuille. Yhteinen paita auttaa löytämään oman porukan ihmisjoukosta, ja hauska vitsi avaa keskustelun muiden osallistujien kanssa. Kun paidassa on myös yrityksen logo, se toimii samalla näkyvyytenä.

## Kun tiimissä on eri kokoja

Hyvä tiimipaita istuu jokaiselle. Logopaidan koot ovat S:stä 4XL:ään, mustana myös 5XL, ja tuotesivuilla on mitat senttimetreinä. Pyytäkää jokaista mittaamaan oma lempipaitansa, niin oikea koko löytyy helposti.

## Tiimipaita uudelle työntekijälle

Kun tiimiin tulee uusi jäsen, tiimipaita on hauska tervetulolahja. Se kertoo heti ensimmäisenä päivänä, että hän kuuluu porukkaan. Tilatkaa siksi muutama paita varaan yleisimmissä koissa, niin uusi työntekijä saa omansa ilman uutta tilausta.

## Kun paita on valmis

Ottakaa yhteiskuva, kun koko tiimi on samoissa paidoissa. Kuvaa voi käyttää työpaikan sisäisessä viestinnässä ja rekrytoinnissa, koska se kertoo tiimin hengestä enemmän kuin moni teksti.

## Aikataulu

${TOIMITUS} ${AIKATAULU}`,
    faq: [
      { q: "Mikä on hauska tiimipaita?", a: "Paita, jonka vitsi syntyy tiimin yhteisestä arjesta, kuten palavereista, lounastauoista tai alan omista kommelluksista." },
      { q: "Voiko tiimipaitaan painaa tiimin nimen?", a: `Voi. Sivulla yrityksille voi kirjoittaa tiimin nimen tai ladata logon, ja logopaitoja tilataan vähintään ${LOGOPAITA_MIN_KPL}.` },
      { q: "Saako tiimipaidoista määräalennuksen?", a: `Saa. Määräalennus lasketaan automaattisesti kaikista saman tilauksen t-paidoista: ${PORTAAT}.` },
      JOULU_FAQ,
    ],
  },
];
