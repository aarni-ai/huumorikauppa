import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "../config/toimitus";

export interface FAQ {
  q: string;
  a: string;
}

/*
 * Huom: middleware.ts sisältää näistä oman kopion (CATEGORY_FAQS, GIFT_FAQS). Faktat:
 * Terms.tsx ja ReturnsPolicy.tsx. Ei ajatusviivoja eikä todistamattomia superlatiiveja.
 */

const DELIVERY = `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta, ja paketti kulkee Postin tai Matkahuollon kautta. Toimitus maksaa ${TOIMITUSMAKSU_TEKSTI} €, ja ${ILMAINEN_RAJA_TEKSTI} euron tilauksista alkaen se on ilmainen.`;
const RETURNS = "Voit: sinulla on 14 päivän peruutusoikeus tuotteen vastaanottamisesta. Ilmoita palautuksesta osoitteeseen huumorikauppa@gmail.com, niin saat palautusohjeet. Personoituja tuotteita peruutusoikeus ei koske.";
const PAYMENT = "Voit maksaa Visalla, Mastercardilla ja muilla yleisimmillä maksutavoilla. Maksu tehdään tilauksen yhteydessä suojatulla maksusivulla.";
const CUSTOM = "Saa niihin tuotteisiin, joiden nimessä on Oma teksti/kuva tai Personoitava. Kirjoitat tekstin tai kuvatoiveen tuotesivun kenttään (enintään 200 merkkiä), ja toive kulkee tilauksen mukana.";
const CHRISTMAS = "Tilaa viimeistään perjantaina 20.11.2026, niin tilaus ehtii perille jouluaattoon mennessä.";

export const CATEGORY_FAQS: Record<string, FAQ[]> = {
  "t-paidat": [
    { q: "Mistä materiaalista hauskat t-paidat on tehty?", a: "Materiaali on kerrottu jokaisen t-paidan tuotekuvauksessa. Esimerkiksi useat t-paidat ovat 100 % puuvillaa, ja tarkka koostumus ja hoito-ohje löytyvät tuotesivulta." },
    { q: "Missä t-paidat painetaan?", a: "T-paidat painetaan tilauksesta painokumppaneiden painotaloissa ulkomailla, ei Suomessa. Jokainen paita valmistetaan vasta tilauksen jälkeen." },
    { q: "Kuinka nopeasti tilaus toimitetaan?", a: `${DELIVERY} Saat seurantakoodin sähköpostiisi, kun paketti on lähetetty.` },
    { q: "Voiko t-paidan palauttaa?", a: RETURNS },
    { q: "Saako t-paidan omalla tekstillä?", a: CUSTOM },
    { q: "Mitä maksutapoja voin käyttää?", a: PAYMENT },
  ],
  "hupparit": [
    { q: "Minkälaisesta materiaalista hauskat hupparit ovat?", a: "Materiaali on kerrottu jokaisen hupparin tuotekuvauksessa. Esimerkiksi useat hupparit ovat 50 % puuvillaa ja 50 % polyesteriä, ja hoito-ohje löytyy tuotesivulta." },
    { q: "Missä hupparit painetaan?", a: "Hupparit painetaan tilauksesta painokumppaneiden painotaloissa ulkomailla, ei Suomessa." },
    { q: "Kuinka nopeasti huppari toimitetaan?", a: DELIVERY },
    { q: "Voiko hupparin palauttaa?", a: RETURNS },
    { q: "Saako hupparin omalla tekstillä?", a: CUSTOM },
    { q: "Mitä maksutapoja voin käyttää?", a: PAYMENT },
  ],
  "tarrat": [
    { q: "Saako tarran omalla tekstillä?", a: CUSTOM },
    { q: "Kuinka nopeasti tarrat toimitetaan?", a: DELIVERY },
    { q: "Voiko tarrat palauttaa?", a: RETURNS },
  ],
  "pipot": [
    { q: "Sopiiko lippis lahjaksi?", a: "Sopii: omalla tekstillä tai kuvalla personoitu lippis on henkilökohtainen lahja syntymäpäiviin, jouluun ja pikkujouluihin." },
    { q: "Kuinka nopeasti lippis toimitetaan?", a: DELIVERY },
    { q: "Voiko lippiksen palauttaa?", a: RETURNS },
  ],
};

export const GIFT_FAQS: Record<string, FAQ[]> = {
  "hauskat-lahjat-miehelle": [
    { q: "Mikä on hauska lahja miehelle?", a: "Hauska lahja miehelle on t-paita tai huppari, jonka teksti liittyy hänen harrastukseensa, ammattiinsa tai ikäänsä. Valikoimassa on esimerkiksi kalastus-, eläke- ja ammattiteemoja." },
    { q: "Sopiiko huumoripaita lahjaksi 50-vuotiaalle miehelle?", a: "Sopii: valikoimassa on 50-vuotiaille omia tekstejä, kuten \"50 vuotta nuori\" ja \"50 ja paras vasta tulossa\". Myös ammattihuumori toimii." },
    { q: "Miten valitsen oikean koon lahjaksi?", a: "Mittaa saajan hyvin istuvan paidan leveys kainaloiden kohdalta ja pituus olkasaumasta helmaan, ja kysy tuotteen mitat sähköpostilla huumorikauppa@gmail.com. Jos koko ei osu, tuotteen voi palauttaa 14 päivän peruutusoikeudella." },
    { q: "Saako tuotteen lahjapaketissa?", a: "Lahjapakettia ei ole. Voit kuitenkin lähettää tilauksen suoraan saajalle valitsemalla kassalla toimituksen eri vastaanottajalle." },
  ],
  "hauskat-lahjat-naiselle": [
    { q: "Mikä on hauska lahja naiselle?", a: "Hauska lahja naiselle on t-paita tai huppari, jonka teksti osuu hänen arkeensa, kuten \"Maailman paras äiti\" tai \"Super äiskä\"." },
    { q: "Sopiiko huumoripaita lahjaksi naiselle?", a: "Sopii: äiti-, ikävuosi- ja arjen huumorin tekstit toimivat lahjana, ja oman tekstin voi tilata personoitavaan tuotteeseen." },
    { q: "Miten valitsen oikean koon lahjaksi naiselle?", a: "Mittaa saajan hyvin istuvan paidan leveys kainaloiden kohdalta ja pituus olkasaumasta helmaan, ja kysy tuotteen mitat sähköpostilla huumorikauppa@gmail.com. Väljempää mallia varten valitse koko suuremmaksi." },
    { q: "Saako tuotteen lahjapaketissa?", a: "Lahjapakettia ei ole. Tilauksen voi lähettää suoraan saajalle valitsemalla kassalla toimituksen eri vastaanottajalle." },
  ],
  "lahja-miehelle": [
    { q: "Mikä on hyvä lahja miehelle, joka tykkää huumorista?", a: "Hyvä lahja on t-paita tai huppari, joka liittyy hänen harrastukseensa tai ammattiinsa, esimerkiksi kalastus, sähköala tai eläkeläisyys." },
    { q: "Sopiiko huumoripaita lahjaksi 50-vuotiaalle?", a: "Sopii: tarjolla on 50-vuotisteemoja sekä eläke- ja ammattihuumoria." },
    { q: "Miten valitsen oikean koon lahjaksi?", a: "Mittaa saajan hyvin istuvan paidan leveys kainaloiden kohdalta ja pituus olkasaumasta helmaan, ja kysy tuotteen mitat sähköpostilla huumorikauppa@gmail.com. Väljä koko on varmempi valinta kuin liian pieni." },
    { q: "Saako tuotteen lahjapaketissa?", a: "Lahjapakettia ei ole, mutta tilauksen voi lähettää suoraan saajalle." },
  ],
  "isanpaiva-lahjat": [
    { q: "Mikä on hauska isänpäivälahja?", a: "Hauska isänpäivälahja on t-paita tai huppari, joka liittyy isän harrastukseen tai ammattiin, tai esimerkiksi \"Jos iskä ei osaa korjata sitä...\" -teksti." },
    { q: "Milloin isänpäivälahja pitää tilata?", a: `Tilaa viimeistään kaksi viikkoa ennen isänpäivää (marraskuun toinen sunnuntai), koska toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää.` },
    { q: "Miten valitsen oikean koon isänpäivälahjaan?", a: "Mittaa isän hyvin istuvan paidan leveys kainaloiden kohdalta ja pituus olkasaumasta helmaan, ja kysy tuotteen mitat sähköpostilla huumorikauppa@gmail.com. Väljä koko on varmempi valinta kuin liian pieni." },
    { q: "Voiko isänpäivälahjan palauttaa?", a: RETURNS },
  ],
  "joululahjat": [
    { q: "Mikä on hauska joululahja huumorin ystävälle?", a: "Hauska joululahja on t-paita tai huppari suomalaisella huumorilla, esimerkiksi ammatti-, kalastus-, eläke- tai ikävuositeemalla." },
    { q: "Milloin viimeistään tilata joululahja?", a: `${CHRISTMAS} Tuotteet painetaan tilauksesta painotaloissa, ja päivämäärä on laskettu hitaimman painotalon tuotanto- ja toimitusajan mukaan.` },
    { q: "Miten valitsen oikean koon joululahjaksi?", a: "Mittaa saajan hyvin istuvan paidan leveys kainaloiden kohdalta ja pituus olkasaumasta helmaan, ja kysy tuotteen mitat sähköpostilla huumorikauppa@gmail.com. Väljä koko on varmempi valinta kuin liian pieni." },
    { q: "Voiko joululahjan palauttaa?", a: RETURNS },
  ],
  "syntymapaivalahjat": [
    { q: "Mikä on hauska syntymäpäivälahja huumorin ystävälle?", a: "Hauska syntymäpäivälahja on t-paita tai huppari, jossa on ikävuoteen sopiva teksti, kuten \"40v - ei vanha, vintage\" tai \"60v - takuu mennyt, toimii silti\"." },
    { q: "Sopiiko huumoripaita syntymäpäivälahjaksi?", a: "Sopii: hauska paita on henkilökohtainen lahja, joka päätyy käyttöön." },
    { q: "Miten valitsen oikean koon syntymäpäivälahjaan?", a: "Mittaa saajan hyvin istuvan paidan leveys kainaloiden kohdalta ja pituus olkasaumasta helmaan, ja kysy tuotteen mitat sähköpostilla huumorikauppa@gmail.com. Väljä koko on varmempi valinta kuin liian pieni." },
    { q: "Kuinka nopeasti syntymäpäivälahja toimitetaan?", a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta, joten tilaa viimeistään kaksi viikkoa ennen juhlaa.` },
  ],
  "polttari-lahjat": [
    { q: "Millaisia polttaripaitoja on tarjolla?", a: "Polttareihin sopivat personoitavat t-paidat ja hupparit, joihin kirjoitat porukan oman tekstin tuotesivun kenttään." },
    { q: "Sopiiko huumoripaita polttarilahjaksi?", a: "Sopii: yhteiset paidat tekevät porukasta tunnistettavan ja jäävät muistoksi illasta." },
    { q: "Miten valitsen oikean koon polttaripaidoille?", a: "Kerää porukan koot etukäteen ja tarkista saatavilla olevat koot tuotesivun kokoavusta." },
    { q: "Voiko polttaripaitoja tilata isomman erän?", a: "Voi: lisää koriin sama tuote eri kokoina. Isommista tilauksista voit kysyä etukäteen sähköpostilla huumorikauppa@gmail.com." },
  ],
  "elakelahjat": [
    { q: "Mikä on hauska eläkelahja?", a: "Hauska eläkelahja on t-paita tai huppari eläketeemalla, kuten \"Olen eläkkeellä\" tai \"100% Eläkeläinen\"." },
    { q: "Sopiiko huumoripaita eläkkeelle jäävälle työkaverille?", a: "Sopii: hauska paita on työporukan yhteinen tapa toivottaa hyvää eläkettä." },
    { q: "Miten valitsen oikean koon eläkelahjaan?", a: "Mittaa saajan hyvin istuvan paidan leveys kainaloiden kohdalta ja pituus olkasaumasta helmaan, ja kysy tuotteen mitat sähköpostilla huumorikauppa@gmail.com. Väljä koko on varmempi valinta kuin liian pieni." },
    { q: "Kuinka nopeasti eläkelahja toimitetaan?", a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta, joten tilaa viimeistään kaksi viikkoa ennen eläkejuhlia.` },
  ],
  "lahja-kaverille": [
    { q: "Mikä on hauska lahja kaverille?", a: "Hauska lahja kaverille on t-paita tai huppari, joka liittyy kaverin harrastukseen tai luonteeseen." },
    { q: "Sopiiko huumoripaita kaverin synttärilahjaksi?", a: "Sopii: hauska paita on henkilökohtainen lahja, joka päätyy käyttöön." },
    { q: "Miten valitsen oikean koon kaverille?", a: "Mittaa kaverin hyvin istuvan paidan leveys kainaloiden kohdalta ja pituus olkasaumasta helmaan, ja kysy tuotteen mitat sähköpostilla huumorikauppa@gmail.com." },
    { q: "Kuinka nopeasti lahja toimitetaan?", a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta, joten tilaa viimeistään kaksi viikkoa ennen juhlaa.` },
  ],
  "lahja-tyokaverille": [
    { q: "Mikä on hauska lahja työkaverille?", a: "Hauska lahja työkaverille on t-paita tai huppari työpaikkahuumorilla, esimerkiksi \"Tämäkin olisi voinut olla sähköposti\"." },
    { q: "Sopiiko huumoripaita työkaverin läksiäislahjaksi?", a: "Sopii: hauska paita on muisto yhteisistä vuosista, ja eläkkeelle jäävälle on omia eläketeemoja." },
    { q: "Miten valitsen oikean koon työkaverin lahjaksi?", a: "Jos kokoa ei tiedä, mittaa jonkun hyvin istuvan paidan leveys kainaloiden kohdalta ja pituus olkasaumasta helmaan ja valitse mieluummin väljä koko." },
    { q: "Kuinka nopeasti lahja toimitetaan?", a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta, joten tilaa viimeistään kaksi viikkoa ennen läksiäisiä.` },
  ],
  "hauskat-t-paidat": [
    { q: "Mistä materiaalista hauskat t-paidat on tehty?", a: "Materiaali on kerrottu jokaisen t-paidan tuotekuvauksessa, ja useat t-paidat ovat 100 % puuvillaa." },
    { q: "Sopiiko hauska t-paita lahjaksi?", a: "Sopii: hauska t-paita on henkilökohtainen lahja syntymäpäiviin, jouluun ja läksiäisiin." },
    { q: "Miten valitsen oikean koon?", a: "Mittaa hyvin istuvan paidan leveys kainaloiden kohdalta ja pituus olkasaumasta helmaan, ja kysy tuotteen mitat sähköpostilla huumorikauppa@gmail.com." },
    { q: "Voiko t-paidan palauttaa?", a: RETURNS },
  ],
  "hauskat-hupparit": [
    { q: "Minkälaisesta materiaalista hauskat hupparit ovat?", a: "Materiaali on kerrottu jokaisen hupparin tuotekuvauksessa, ja useat hupparit ovat puuvillan ja polyesterin sekoitetta." },
    { q: "Sopiiko hauska huppari lahjaksi?", a: "Sopii: huppari on käytännöllinen lahja, joka on käytössä koko kylmän kauden." },
    { q: "Miten valitsen oikean koon?", a: "Mittaa hyvin istuvan hupparin tai paidan leveys kainaloiden kohdalta ja pituus olkasaumasta helmaan, ja kysy tuotteen mitat sähköpostilla huumorikauppa@gmail.com." },
    { q: "Voiko hupparin palauttaa?", a: RETURNS },
  ],
};
