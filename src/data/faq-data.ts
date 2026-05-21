export interface FAQ {
  q: string;
  a: string;
}

export const CATEGORY_FAQS: Record<string, FAQ[]> = {
  "t-paidat": [
    { q: "Mistä materiaalista hauskat t-paidat on tehty?", a: "T-paitamme ovat 100 % puuvillaa tai puuvilla-polyesteri-sekoitteita. Materiaali on pehmeä ihoa vasten ja kestää useita pesuja muuttumatta. Koot XS–3XL." },
    { q: "Onko t-paidat painettu Suomessa?", a: "Kyllä, kaikki t-paitamme painetaan Suomessa tai EU:ssa tilauksesta DTG-tekniikalla (Direct-to-Garment), joka tuottaa kirkkaan ja kestävän painatuksen." },
    { q: "Kuinka nopeasti tilaus toimitetaan?", a: "Tilaukset toimitetaan 3–7 arkipäivässä koko Suomeen PostNordin kautta. Ilmainen toimitus yli 60 € tilauksiin. Saat sähköpostiisi seurantakoodin heti kun paketti lähtee." },
    { q: "Voiko t-paidan palauttaa?", a: "Kyllä, standardituotteilla on 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme, saat ohjeet sähköpostitse." },
    { q: "Saako t-paidan omalla tekstillä?", a: "Kyllä! Osasta tuotteitamme löytyy custom-vaihtoehto oman tekstin kirjoittamiseen. Tilaa myös räätälöityjä painatuksia — kysy tarjous asiakaspalvelusta." },
    { q: "Voiko maksaa Klarnalla tai Apple Paylla?", a: "Kyllä. Hyväksymme Visa, Mastercard, Apple Pay, Google Pay ja Klarna. Klarnalla voit myös ostaa nyt ja maksaa myöhemmin." },
  ],
  "hupparit": [
    { q: "Minkälaisesta materiaalista hauskat hupparit ovat?", a: "Hupparimme ovat pehmeää puuvilla-polyesteri-sekoitetta (80/20). Materiaali on lämmin, pehmeä ja kestää useita pesuja. Koot S–3XL." },
    { q: "Onko hupparit painettu Suomessa?", a: "Kyllä, kaikki hupparimme painetaan Suomessa tai EU:ssa tilauksesta DTG-tekniikalla." },
    { q: "Kuinka nopeasti huppari toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää koko Suomeen. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Voiko hupparin palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme saadaksesi palautusohjeet." },
    { q: "Saako hupparin omalla tekstillä?", a: "Kyllä! Osasta tuotteista löytyy custom-vaihtoehto. Kysy räätälöidyistä tilauksista asiakaspalvelusta." },
    { q: "Voiko maksaa Klarnalla?", a: "Kyllä. Hyväksymme Visa, Mastercard, Apple Pay, Google Pay ja Klarna." },
  ],
  "mukit": [
    { q: "Onko mukit konepesun kestäviä?", a: "Kyllä, kaikki mukimme kestävät konepesua. Suosittelemme pesemään matalalla lämpötilalla (40°C) painatuksen säilymiseksi pidempään." },
    { q: "Minkä kokoisia mukit ovat?", a: "Mukimme ovat standardi 11 oz (noin 325 ml) -kokoisia. Sopivat aamukahviin tai teehen." },
    { q: "Kuinka nopeasti muki toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Voiko mukin palauttaa?", a: "Kyllä, 14 päivän palautusoikeus kaikille tuotteille. Ota yhteyttä asiakaspalveluumme." },
    { q: "Saako mukin omalla tekstillä?", a: "Kyllä! Osasta mukeista löytyy custom-vaihtoehto. Kysy räätälöidyistä tilauksista asiakaspalvelusta." },
    { q: "Voiko maksaa Klarnalla?", a: "Kyllä. Hyväksymme Visa, Mastercard, Apple Pay, Google Pay ja Klarna." },
  ],
  "tarrat": [
    { q: "Onko tarrat ulkokäyttöön sopivia?", a: "Kyllä, tarramme ovat laadukasta vinyyliä joka kestää kosteutta, UV-valoa ja lämpötilavaihteluita. Sopivat autoon, vesipulloon, läppäriin ja ulkokäyttöön." },
    { q: "Kuinka kauan tarrat kestävät?", a: "Ulkokäytössä laadukkaiden tarramme elinikä on 2–5 vuotta olosuhteista riippuen. Sisäkäytössä huomattavasti pidempään." },
    { q: "Kuinka nopeasti tarrat toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Voiko tarrat palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  "pipot": [
    { q: "Minkälaisesta materiaalista pipot ovat?", a: "Pipomme ovat pehmeää akryyli-materiaalia, joka on lämmin, joustava ja helppohoitoinen. Brodeeraus kestää pesua." },
    { q: "Sopiiko pipo lahjaksi?", a: "Ehdottomasti! Hauska pipo on loistava joululahja, syntymäpäivälahja tai pikkujoululahja työkavereille." },
    { q: "Kuinka nopeasti pipo toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Voiko pipon palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  "lippikset": [
    { q: "Minkälaisesta materiaalista lippikset ovat?", a: "Lippiksemme ovat laadukkaasta puuvilla- tai polyesteri-materiaalista. Brodeeraus on kestävä ja pysyy siistinä." },
    { q: "Sopiiko lippis lahjaksi?", a: "Kyllä, hauska lippis on erinomainen lahja erityisesti kesällä. Sopii syntymäpäiviin, polttareihin ja muihin juhliin." },
    { q: "Kuinka nopeasti lippis toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Voiko lippiksen palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  "haalarimerkit": [
    { q: "Sopivatko haalarimerkit kaikille haalareille?", a: "Kyllä, haalarimerkkimme sopivat kaikkiin haalareihin, laukkuihin ja reppuihin. Kiinnitys tapahtuu turvallisesti neulalla." },
    { q: "Voiko haalarimerkkejä tilata omalla tekstillä?", a: "Kyllä, tarjoamme myös räätälöityjä haalarimerkkejä. Ota yhteyttä asiakaspalveluumme tilausta varten." },
    { q: "Kuinka nopeasti haalarimerkit toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Sopivatko haalarimerkit lahjaksi?", a: "Ehdottomasti! Haalarimerkit ovat loistava lahja opiskelijalle kiltajuhliin tai tupaantuliaisiin." },
  ],
};

export const GIFT_FAQS: Record<string, FAQ[]> = {
  "hauskat-lahjat-miehelle": [
    { q: "Mikä on paras hauska lahja miehelle?", a: "Suosituimpia hauskoja lahjoja miehelle ovat huumoripaita, -huppari tai -muki joka liittyy hänen harrastukseensa tai ammattiinsa. Suosituimpia ovat kalamies-, ammattimies- ja Mersumies-teemat." },
    { q: "Sopiiko huumoripaita lahjaksi 50-vuotiaalle miehelle?", a: "'100 % eläkeläinen' ja 'Museo-kappale' -teemat ovat erityisen suosittuja 50-vuotiaiden lahjoina. Myös ammattihuumoriaiheet toimivat hyvin." },
    { q: "Miten valitsen oikean koon lahjaksi?", a: "L on miesten yleisin koko. Kokoopas löytyy jokaisen tuotteen sivulta. Epävarma? Valitse XL — löysä istuvuus on turvallisempi kuin liian pieni." },
    { q: "Voiko tuotteen paketoida lahjapakettiin?", a: "Tällä hetkellä emme tarjoa lahjapakettia, mutta tilausvahvistus toimii mukavana lahjasaatteena digitaalisesti." },
  ],
  "hauskat-lahjat-naiselle": [
    { q: "Mikä on paras hauska lahja naiselle?", a: "Suosituimpia lahjoja naiselle ovat 'Maailman paras äiti' -hupparit, hauskat kahvimukit ja söpöt huumoriaiheeiset tuotteet. Myös kangaskassit ovat suosittuja." },
    { q: "Sopiiko huumoripaita lahjaksi naiselle?", a: "Kyllä, erityisesti äitiaiheeiset ja arjen huumori- ja viiniaiheeiset tuotteet ovat naisten suosiossa." },
    { q: "Miten valitsen oikean koon lahjaksi naiselle?", a: "M tai L on yleisimmät naisten koot. Ylisuuri (oversized) tyyli on tällä hetkellä trendikäs." },
    { q: "Voiko tuotteen paketoida lahjapakettiin?", a: "Emme tällä hetkellä tarjoa lahjapakettia, mutta tilausvahvistus soveltuu digitaaliseksi lahjasaatteeksi." },
  ],
  "lahja-miehelle": [
    { q: "Mikä on hyvä lahja miehelle joka tykkää huumorista?", a: "Paras hauska lahja miehelle on tuote joka liittyy hänen harrastukseensa tai ammattiinsa — kalamies, sähkömies, eläkeläinen, Mersumies. Valikoimastamme löydät yli 75 hauskaa ideaa." },
    { q: "Sopiiko huumoripaita lahjaksi 50-vuotiaalle?", a: "Ehdottomasti. Suosituimpia ovat '100 % Eläkeläinen', 'Museo-kappale' ja ammattihuumori. Hauska paita on aina yllättävä ja muistettava lahja." },
    { q: "Miten valitsen oikean koon lahjaksi?", a: "L on miesten yleisin koko. Epävarma? Valitse yksi koko ylöspäin — löysä istuvuus on turvallisempi." },
    { q: "Voiko tuotteen paketoida lahjapakettiin?", a: "Lahjapakettia ei tarjota tällä hetkellä, mutta tilausvahvistus sopii lahjasaatteeksi." },
  ],
  "isanpaiva-lahjat": [
    { q: "Mikä on hauska isänpäivälahja?", a: "Hauska isänpäivälahja on t-paita, huppari tai muki joka liittyy isän harrastukseen tai ammattiin. Suosituimpia ovat kalamies-, Mersumies- ja 'Maailman paras isä' -teemat." },
    { q: "Milloin viimeistään pitää tilata isänpäivälahja?", a: "Tilaa viimeistään 2 viikkoa ennen isänpäivää (marraskuun toinen sunnuntai). Toimitusaika on 3–7 arkipäivää." },
    { q: "Miten valitsen oikean koon isänpäivälahjaan?", a: "L on miesten yleisin koko. Jos isä on isokokoinen, valitse XL tai XXL. Kokoopas on jokaisen tuotteen sivulla." },
    { q: "Voiko isänpäivälahjan palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Palautus on helppo — ota yhteyttä asiakaspalveluumme." },
  ],
  "joululahjat": [
    { q: "Mikä on hauska joululahja huumorin ystävälle?", a: "Hauska joululahja on t-paita, huppari tai muki suomalaisesta ammattihuumorista. Suosituimpia ovat kalamies-, äijä- ja eläkeläisteemat." },
    { q: "Milloin viimeistään tilata joululahja?", a: "Tilaa viimeistään 14.12. saadaksesi tuotteen ennen joulua. Toimitusaika on 3–7 arkipäivää." },
    { q: "Miten valitsen oikean koon joululahjaksi?", a: "L on yleisimmin sopiva koko miehille. Epävarma? Valitse yksi koko ylöspäin. Kokoopas löytyy jokaiselta tuotesivulta." },
    { q: "Voiko joululahjan palauttaa?", a: "Kyllä, 14 päivän palautusoikeus." },
  ],
  "syntymapaivalahjat": [
    { q: "Mikä on hauska syntymäpäivälahja huumorin ystävälle?", a: "Huumoripaita, -huppari tai -muki on täydellinen syntymäpäivälahja. Suosituimpia ovat '100 % Eläkeläinen' ja ammattihuumori ikääntyvälle juhlijalle." },
    { q: "Sopiiko huumoripaita syntymäpäivälahjaan?", a: "Ehdottomasti! Hauska paita on yllättävä, persoonallinen ja tulee oikeasti käyttöön." },
    { q: "Miten valitsen oikean koon syntymäpäivälahjaan?", a: "L on yleisin koko miehille, M naisille. Epävarma? Yksi koko ylöspäin on turvallisempi." },
    { q: "Kuinka nopeasti syntymäpäivälahja toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Tilaa hyvissä ajoin jos synttäripäivä lähestyy." },
  ],
  "polttari-lahjat": [
    { q: "Mitkä ovat suosituimmat polttaripaidat?", a: "Suosituimpia ovat 'Game Over', 'Viimeinen vapaa ilta' ja personoidut polttaripaidat koko porukalle." },
    { q: "Sopiiko huumoripaita polttarilahjana?", a: "Ehdottomasti — polttaripaita on perinteinen ja hauska tapa juhlistaa tapahtumaa. Yhtenäiset paidat ryhmälle tekevät illan unohtumattomaksi." },
    { q: "Miten valitsen oikean koon polttaripaidoille?", a: "Kerää ryhmältä koot etukäteen. Epävarma? Unisex-koot hieman suuremmiksi. Kokoopas löytyy tuotesivulta." },
    { q: "Voiko polttaripaitoja tilata isomman erän?", a: "Kyllä! Ryhmätilaukset onnistuvat helposti — lisää eri koot koriin tai ota yhteyttä asiakaspalveluumme." },
  ],
  "elakelahjat": [
    { q: "Mikä on paras hauska eläkelahja?", a: "'Olen eläkkeellä' ja '100 % eläkeläinen' -teemat ovat suosituimpia eläkelahja-ideoita. T-paidat, hupparit ja mukit sopivat hyvin." },
    { q: "Sopiiko huumoripaita eläkkeelle jäävälle tyykavereille?", a: "Kyllä — hauska eläkelahja on työtovereiden perinteinen tapa toivottaa työkaveri hyvää eläkettä." },
    { q: "Miten valitsen oikean koon eläkelahjaan?", a: "L on miesten ja M naisten yleisin koko. Epävarma? Valitse yksi ylöspäin." },
    { q: "Kuinka nopeasti eläkelahja toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Tilaa ajoissa ennen eläkejuhlia." },
  ],
  "lahja-kaverille": [
    { q: "Mikä on hauska lahja kaverille?", a: "Hauska lahja kaverille on huumoripaita, -huppari tai -muki kaverin harrastuksesta tai persoonallisuudesta. Alle 30 € saat loistavan lahjan." },
    { q: "Sopiiko huumoripaita kaverin synttärilahjaksi?", a: "Ehdottomasti! Hauska paita on yllättävä, persoonallinen ja tulee oikeasti käyttöön." },
    { q: "Miten valitsen oikean koon kaverille?", a: "Tiedät kaverin koon parhaiten. Epävarma? Valitse yksi koko ylöspäin." },
    { q: "Kuinka nopeasti lahja toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Tilaa hyvissä ajoin ennen synttäreitä." },
  ],
  "lahja-tyokaverille": [
    { q: "Mikä on hauska lahja työkavereille?", a: "'No niin' -muki ja '100 % eläkeläinen' -paita ovat suosituimpia työkaverilahjoja. Ne sopivat työkaverin lähtöön tai syntymäpäivään." },
    { q: "Sopiiko huumoripaita työkaverin läksiäislahjaksi?", a: "Kyllä — hauska paita tai muki on oivallinen muisto yhteisistä vuosista." },
    { q: "Miten valitsen oikean koon työkaverin lahjaksi?", a: "Jos et tiedä kokoa, L tai M on turvallinen valinta. Muki tai tarra ovat hyviä koottomia vaihtoehtoja." },
    { q: "Kuinka nopeasti lahja toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Tilaa hyvissä ajoin ennen läksiäisiä." },
  ],
  "hauskat-t-paidat": [
    { q: "Mistä materiaalista hauskat t-paidat on tehty?", a: "T-paitamme ovat 100 % puuvillaa, pehmeää ja laadukasta. Painettu Suomessa DTG-tekniikalla." },
    { q: "Sopiiko hauska t-paita lahjaksi?", a: "Ehdottomasti! Hauska t-paita on persoonallinen ja tulee oikeasti käyttöön. Täydellinen syntymäpäivä-, joulu- tai läksiäislahja." },
    { q: "Miten valitsen oikean koon?", a: "L on miesten yleisin koko. Kokoopas löytyy jokaiselta tuotesivulta. Epävarma? Valitse XL." },
    { q: "Voiko t-paidan palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme saadaksesi palautusohjeet." },
  ],
  "hauskat-hupparit": [
    { q: "Minkälaisesta materiaalista hauskat hupparit ovat?", a: "Hupparimme ovat pehmeää puuvilla-polyesteri-sekoitetta. Lämmin, mukava ja kestävä. Koot S–3XL." },
    { q: "Sopiiko hauska huppari lahjaksi?", a: "Ehdottomasti! Huppari on käytännöllinen ja hauska lahja — sitä käytetään vuosia." },
    { q: "Miten valitsen oikean koon?", a: "L on yleisin koko. Kokoopas jokaisella tuotesivulla. Epävarma? Valitse XL." },
    { q: "Voiko hupparin palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  "haalarimerkit": [
    { q: "Sopivatko haalarimerkit kaikille haalareille?", a: "Kyllä, merkkimme sopivat kaikkiin haalareihin, reppuihin ja laukkuihin. Kiinnitys neulalla." },
    { q: "Voiko haalarimerkkejä tilata omalla tekstillä?", a: "Kyllä! Räätälöityjä merkkejä tilauksesta. Ota yhteyttä asiakaspalveluumme." },
    { q: "Kuinka nopeasti haalarimerkit toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Sopivatko haalarimerkit lahjaksi opiskelijalle?", a: "Ehdottomasti! Haalarimerkit ovat loistava lahja opiskelijalle kiltajuhliin tai tupaantuliaisiin." },
  ],
  "opiskelijan-haalarimerkit": [
    { q: "Mitä haalarimerkit ovat?", a: "Haalarimerkit ovat pieniä, brodeerattuja tai painettuja merkkejä jotka kiinnitetään haalariin tai reppuun. Ne ovat perinteinen tapa personoida opiskelijan haalarit." },
    { q: "Voiko haalarimerkkejä tilata omalla tekstillä tai logolla?", a: "Kyllä! Tarjoamme räätälöityjä haalarimerkkejä kiltajärjestöille ja yksityishenkilöille. Kysy tarjous asiakaspalvelusta." },
    { q: "Kuinka nopeasti haalarimerkit toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Suuret ryhmätilaukset voivat kestää pidempään." },
    { q: "Sopivatko haalarimerkit lahjaksi?", a: "Ehdottomasti! Haalarimerkit ovat oivallinen lahja opiskelijalle tai kiltatapahtumaan." },
  ],
};
