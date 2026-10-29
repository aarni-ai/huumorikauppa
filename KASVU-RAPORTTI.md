# Huumorikauppa: kasvuraportti

Tavoite 3 000 €/kk nettokate, alkaen joulusesongista 2026. Sisältö- ja SEO-muutokset `main`-haarassa (tuotanto),
kassa-, tilaus-, maksu- ja tietokantamuutokset vain `oma-tausta`-haarassa. Päivitetty 27.10.2026 (uusi tausta valmiina, joulumyynti, syöte, yritysvaihto MYYJA-muuttujalla).

## Tilanne lyhyesti

**Tuotannossa (huumorikauppa.fi), tarkistettu curlilla tavallisella, Googlebot- ja tyhjällä User-Agentilla:**
- Jokainen indeksoitava sivu palauttaa ilman JavaScriptiä oman titlen, kuvauksen, canonicalin, H1:n, sisällön ja
  rakenteisen datan (730 esirenderöityä sivua, 487 tuotesivua). Ennen kaikki sivut antoivat etusivun canonicalin.
- 42 laskeutumissivua (joululahjat vastaanottajan, budjetin ja tilanteen mukaan), Joululahjat-valikko, joulun
  viimeisten tilauspäivien sivu ja banneri (20.11.2026), 10 opasartikkelia, 100 tuotteen omat kuvaukset ja UKK:t.
- Virheelliset väitteet korjattu (ei "painettu Suomessa", ei 14.12.-lupausta, ehtojen mukaiset toimitus-, palautus-
  ja maksutiedot), mukit poissa myynnistä kaikkialla (myös kolme väärään kategoriaan kirjattua).
- Merchant-syöte: oikea toimitushinta, product_type, identifier_exists, sesonki; 484 tuotetta, kaikki linkit 200.
- Sivukartta 652 osoitetta, kaikki 200 ilman ohjauksia. Tuntematon tuote palauttaa oikean 404:n (noindex).
- robots.txt sallii tekoälybotit, llms.txt ja llms-full.txt generoituvat buildissa.
- Kuvat WebP-muodossa (pääkuva -60 %, korttikuva -92 %).

**Odottaa `oma-tausta`-haarassa (käyttöön KAYTTOONOTTO.md:n mukaan, kun avaimet on luotu):**
- Oma kassa, Stripe-webhook, tilaukset ja Printify-siirto Vercelissä; ei maksua tuotteesta ilman Printify-varianttia;
  on hold -tilaukset yritetään uudelleen ja omistaja saa hälytyksen heti.
- Katesääntö: myynti estetään alle 40 %:n nettokatteella (Printify-kulut + Stripe + ALV 25,5 %).
- Ostoskorin "X € ilmaiseen toimitukseen" ja suositukset, paketit (10 % etu vain, jos kate pysyy 40 %:ssa),
  digitaalinen lahjakortti, tuotesivun toimitusarvio ja "Ehtii jouluksi" -merkki (Printifyn takarajojen mukaan).
- GitHub Actions: tuntivalvonta, viikoittainen linkki- ja sivukarttatarkistus, viikoittainen katetarkistus,
  päivittäinen saatavuustarkistus. EU-painotalosiirron skripti (ei ajettu).

## 29.10.2026 myöhäisilta: kumppanuusohjelma käytössä

**Hyväksytty ehto:** kauppaan jää jokaisesta kumppanitilauksesta vähintään 5,00 € katetta provision jälkeen.
Provisio on enintään 10 % tuotteiden arvosta (ilman ALV:tä ja toimitusta) ja enintään summa, joka jättää kauppaan
5 €; jos tilauksen kate on 5 € tai alle, provisio on 0 (KATTEET.md "Kumppanuusohjelma: provisio").

- **Kumppaneille näytettävä sääntö** (/kumppanit, raportti ja viestipohjat): "Provisio on 10 % tilauksen tuotteiden
  arvosta (ilman arvonlisäveroa ja toimituskuluja) tilauksista, joista kaupalle jää provision jälkeen vähintään
  5,00 € katetta. Jos kate ei riitä täyteen 10 %:iin, provisio on pienempi, ja jos tilauksen kate on 5,00 € tai
  alle, provisiota ei makseta."
- Esimerkit: t-paita 1,98 €, kaksi t-paitaa 3,77 €, huppari 2,86 €, 25 paidan yritystilaus 43,65 €. Ensimmäisen
  oikean tilauksen kaltaisesta korista (kate 4,94 €) provisio olisi 0 €.
- **Käyttöön:** `KUMPPANUUS.kaytossa: true`, `minKateEuroa: 5`. Kumppanit taulussa `kumppanit`, hallinta
  `?tehtava=kumppani-lisaa&koodi=..&nimi=..&email=..` (palauttaa linkin) ja `?tehtava=kumppani-poista&koodi=..`.
- **Seuranta:** linkki `https://huumorikauppa.fi/?ref=<koodi>` (mikä tahansa sivu) ja kassan uusi kenttä
  "Kumppanikoodi (valinnainen)", joka täyttyy linkistä. Kenttä varmistaa kirjauksen myös ilman evästeitä (linkin koodi
  säilyy välilehden istunnon yli vain markkinointisuostumuksella). Palvelin hyväksyy vain aktiiviset koodit ja
  kirjaa tilaukselle tapahtuman "kumppani".
- **Raportti:** `?tehtava=kumppanit&kuukausi=YYYY-MM`: kumppaneittain tilaukset, myynti, kate Printifyn todellisilla
  kuluilla, provisio ja peruste (täysi, rajattu, ei, kate-tuntematon). Tilitys kerran kuussa edellisen kuukauden
  tilauksista, kun 14 päivän palautusaika on päättynyt.
- **Sivu /kumppanit:** miten toimii, provisio ja esimerkit, tilitys, mainonnan merkintä, yhteys
  huumorikauppa@gmail.com; esirenderöity, sivukartassa, alatunnisteessa "Kumppaneille".
- **Coworkille:** KUMPPANIT-VIESTIPOHJA.md: 1) yhteydenotto, 2) tervetuloa ja koodi, 3) kuukausiraportti.
- **Tarkistus tuotannossa:** testikumppani lisätty ja poistettu käytöstä, virheellinen koodi hylätty, raportti
  palauttaa säännön; /kumppanit, /kassa ja /?ref= 200 kolmella User-Agentilla. Testit 1 446 läpi.
- **Arvioitu vaikutus:** 10 kumppanin tuomaa lisätilausta kuukaudessa: kate noin +55-75 €/kk, provisiot noin
  20-30 €/kk. Kaikki riippuu kumppanien määrästä ja yleisöstä.
- **Aarnille:** sovi tilitystapa kumppanin kanssa (lasku tai muu) ja lähetä kuukausiraportti viestipohjan 3 mukaan.

## 29.10.2026 ilta: yritykset, personoitu paita, Black Friday, SEO, Shopping-syöte, canonical, nopeus

### Black Friday ajastettu (hyväksytty)
- **30 päivän alin hinta todennettu:** kaikki 401 aktiivista t-paitaa 24,90 € (Neon 29.10.), tuotetaulussa ei ole
  ennen-hintoja (ei original_price-saraketta), ja toteutuneet t-paitatilaukset 29.6.-26.10. on myyty 24,90 €:lla
  (KATTEET.md tilauskohtaiset katteet, myös 17.10., 24.10., 25.10. ja 26.10.).
- **Uusi päivittäinen hintatarkistus** (`?tehtava=hintatarkistus`, cron 03.30 UTC): tallentaa t-paitojen hinnat
  tauluun `hintahistoria` (ensimmäinen rivi 29.10.: 401 tuotetta, 24,90-24,90 €) ja hälyttää, jos hinta poikkeaa
  28.10.-1.12. Näin 30 päivän alin hinta on todennettavissa koko kampanjaa edeltävältä ajalta.
- `TPAITAPARI_KAMPANJA.kaytossa: true`, voimassa 27.11. klo 00.00 - 1.12. klo 23.59 Suomen aikaa (päivärajaus
  palvelimella ja selaimessa). Kampanjateksti kertoo aina t-paidan hinnan ja 30 päivän alimman hinnan (24,90 €).
- **/black-friday**: laskeutumissivu (title, H1, intro, 6 UKK:ta, meemi-t-paidat ensin), tila selaimessa (alkaa /
  voimassa / päättyi). Etusivun nosto näkyy vain 27.11.-1.12. Päivät lasketaan kampanja-asetuksista.

### Yritysten joululahjat ja määräalennus
- **Portaat** (KATTEET.md "Määräalennus yrityksille"): 10+ t-paitaa -10 %, 25+ -12 %, 50+ -14 %. Kate vähintään
  5 € paitaa kohden heikoimmallakin koolla ja varovaisella 3,25 %:n korttimaksulla (5,25 / 5,33 / 5,10 €).
- **Kassa** laskee alennuksen automaattisesti (`MAARAALENNUS`), valitsee suurimman katevahdin läpäisevän
  alennuksen (määrä, t-paitapari tai kahden tuotteen -5 %) ja näyttää korissa seuraavan portaan.
- **Korjattu katevahdin piilovika:** 304/391 t-paidan tuoteriviltä puuttui lisäkappaleen toimitus ja painotalo,
  jolloin jokainen paita laskettiin omana lähetyksenään. Nyt `PRINTIFY_TOIMITUS_FI` täydentää ne pohjatuotteen ja
  painotalon mukaan (Printifyn katalogi 29.10.). Ilman korjausta määräalennus ei olisi koskaan toteutunut.
- **/yritykset**: edut, portaat ja esimerkit (10 kpl 224,10 €, 25 kpl 547,80 €, 50 kpl 1 070,70 €), toimitus
  yhteen osoitteeseen, myyjä ja laskutus Uusiku Oy, joulun viimeinen tilauspäivä (laskettu), esimerkkituotteet, UKK ja
  **tarjouspyyntölomake**: tallennus tauluun `tarjouspyynnot` ja ilmoitus omistajalle (OMISTAJA_EMAIL; nyt
  flyapeg@gmail.com, Resendin vahvistuksen jälkeen huumorikauppa@gmail.com). Roskapostisuoja piilokentällä.
  Tuotantotesti tehty: lomake hyväksytty (`{"ok":true}`), testirivi "TESTI Claude (ei oikea)".
- Linkit: /ryhmatilaukset, alatunniste ("Yrityksille") ja kaikki 8 sarjasivua ("Tiimipaidat ja yritysten
  joululahjat"). Esirenderöity, sivukartassa.

### Personoitu paita nimellä ja iällä (/personoitu-paita)
- **Mallit** (ikävuositeemat ja Amatimies, etusivun suosituimmuus): Kokenut, ei vanha; Vuotta nuori; Paras vasta
  tulossa; Takuu mennyt, toimii silti; Amatimies. Esimerkki: "MARJA 50V / KOKENUT, EI VANHA".
- **Tarkistus selaimessa ja palvelimella:** nimi enintään 14 merkkiä (kirjaimet, välilyönti, väliviiva), ikä
  18-110, estetyt sanat (kirosanat, solvaukset, väkivalta, ääriliikkeet, myös numeromuunnelmat kuten P3rkele),
  ei osoitteita. Tavalliset nimet (Tapani, Panu, Marja-Liisa) menevät läpi.
- **Esikatselu** tuotesivulla samalla SVG:llä kuin painokuva, 4 väriä (tekstin väri paidan mukaan), koot S-5XL,
  kokotaulukko cm. Hinta 29,90 €, ei 14 päivän palautusoikeutta (personoitu), kerrottu sivulla.
- **Maksun jälkeen automaattisesti:** Printify-tilaus lennosta luotavalla tuotteella (Gildan 64000, OPT OnDemand,
  Tšekki, `print_areas.front`) ja tilauskohtainen painokuva `/api/painokuva` (3461 x 3955 px PNG, Anton-fontti,
  allekirjoitettu osoite, teksti tarkistetaan uudelleen). Tilausvahti hyväksyy EU-painotalon kuten muutkin.
- **Kate positiivinen jokaisessa koossa:** S-2XL 11,13 € (38,0 %), 3XL-5XL 10,10 € (34,4 %).
- **Testitilaus:** `?tehtava=personointitesti` (kassan laskenta, tilausrunko, painokuva 200 image/png, Printify
  hyväksyi tilauksen 26630629.37: tuote 8,90 €, toimitus 8,49 €, OPT pp 30). Peruttu ennen tuotantoa (canceled).
  Peruutus onnistuu vasta, kun Printify on käsitellyt painokuvan (pending -> on-hold); testitehtävä odottaa nyt sen.
- Mobiilitesti: nimi ja ikä, koko, Lisää koriin ja korissa "Personoitu ikäpaita, Koko L, Musta" toimivat.
- Linkit: ikävuosiblogit (50v miehelle ja naiselle) ja kuusi ikävuosisivua.

### SEO: kyselyt sijainneilla 5-20 (Search Console 28 pv, 844 klikkausta, 21 900 näyttöä)
| Kysely (näytöt, sijainti) | Sivu Googlessa | Muutos |
|---|---|---|
| tonnin seteli paita (287, 6,3) | /tuote/tonnin-seteli-t-paita | title "Tonnin seteli paita: Tonnin Seteli t-paita", meta (uusi seoTitle/metaDescription) |
| hauskat lahjat (180, 9,3) | jakautuu kolmelle sivulle | linkitys koontisivuille (ks. alla) |
| 50v lahja naiselle (175, 9,5), hauska lahja 50-vuotiaalle naiselle (171, 6,4), 60-vuotiaalle naiselle (141, 6,0), mitä lahjaksi 60/50 vuotiaalle naiselle (124 + 92) | /blogi/lahja-naiselle-30v-40v-50v-60v | kirjoitettu uudelleen oikeilla tuotteilla, title/meta/H1/UKK kyselyn mukaan |
| 50v lahja miehelle (156, 6,8), mitä lahjaksi 60 v miehelle (128, 10,3), 30v lahja miehelle (112, 9,1), lahja 50 v miehelle (96, 5,5) | /blogi/lahja-miehelle-30v-40v-50v-60v | sama |
| hauskat lahjat miehelle (108, 12,1) | /blogi/parhaat-hauskat-lahjat-miehelle | title/meta, UKK, linkki koontisivulle |
| lahja eläkkeelle jäävälle (84, 7,6), eläkelahja (70, 13,4) | /blogi/hauskimmat-elakelahjat-selviytymisopas | title "Eläkelahja: hauskat lahjat eläkkeelle jäävälle", UKK, tuotelinkit |
| hauska lahja 40-vuotiaalle miehelle (62, 8,2) | /lahjat/40-vuotiaalle-miehelle | UKK hinta ja koko, linkki oppaaseen |
| hauskat isänpäivälahjat (60, 9,2) | /blogi/hauskat-isanpaivalahjat-opas | title 2026, UKK |
- Ikävuosiblogeissa mainittiin tuotteita, joita ei ole ("Museo-kappale", "Legendaarinen"-huppari, kangaskassi);
  nyt jokainen mainittu tuote on linkki oikeaan tuotesivuun (tarkistettu valikoimasta).
- Sisäiset linkit: ikävuosisivut -> oppaat, oppaat -> koontisivut, eläkeblogi -> /elakelahjat.
- Tuotekuvausten "Tarkat mitat saat kysymällä sähköpostilla" (26 kpl) -> "Tarkat mitat senttimetreinä ovat
  tuotesivun kokotaulukossa".
- Havainto: neljä jouluaiheista blogia linkittää tuotteeseen /tuote/oma-tekstikuva-koriste, joka ohjautuu 301:llä.

### Canonical
- /lahjat/kalastajalle, /lahjat/metsastajalle ja muut sarjasivut viittaavat itseensä; /harrastus/kalastus ja
  /harrastus/metsastys ohjautuvat 301:llä. Kaikki 223 sivukartan sivua (tuotesivuja lukuun ottamatta) vastaavat 200
  ilman ohjausta ja canonical on sivu itse, paitsi 22 sivua, joita ei esirenderöity:
- /lahjakortti ja /paketit esirenderöity (oma canonical staattisessa HTML:ssä). 20 yksittäistä pakettisivua
  poistettu sivukartasta ja merkitty noindexiksi: ilman alennusta ne toistavat tuotesivut.
- Tuntemattomat osoitteet (esim. /kalastajalle) palauttivat SPA-kuoren robots index ja etusivun otsikko (pehmeä
  404). Boteille nyt noindex (`x-robots-tag: noindex`, tarkistettu uudesta projektista). huumorikauppa.fi välittää
  vielä vanhan projektin kautta, jonka välimuisti palauttaa vanhan version; korjaus näkyy siellä domainin siirron
  jälkeen.

### Google Shopping -syöte
- Otsikot "Aihe | Hauska t-paita kenelle | Huumorikauppa" (esim. "Sukulaisten IT-tuki. Ei palkkaa | Hauska t-paita
  IT-ihmiselle | Huumorikauppa").
- Toimitusajat (valmistus 2-5 + kuljetus 1-5 arkipäivää = 3-10) ja ilmaisen toimituksen raja 79 €.
- Pääkuva selkeä etukuva, lisäkuvissa lifestyle-kuvat ensin (47 tuotteella lifestyle-kuva).
- custom_label_3 teema (joulu, eläkeläiselle, isälle, naiselle, ikävuosi, harrastus-ammatti, meemi, muut),
  custom_label_4 "top50" 50 tuotteelle: myydyimmät, etusivun suosituimmuussäännöt ja Search Consolen ikävuosihaut.
  Myyntidataa on alle 20 tilausta, joten pelkkä myynti ei riitä 50 tuotteen valintaan.
- identifier_exists=no oli jo kaikilla. Validointi: 571 tuotetta, 0 virhettä (varoituksena koko tuotetasolla).

### Kumppanuusohjelma (valmis, pois päältä)
- `?ref=<koodi>` (säilyy välilehden istunnon ajan vain markkinointisuostumuksella) ja kassan kirjaus tilauksen
  tapahtumaksi, raportti `?tehtava=kumppanit`. Provisio 10 % tuotteista ilman ALV:tä, tilauksen katteesta jää aina
  vähintään 2 € (KATTEET.md). Käyttöönotto: kumppani KUMPPANIT-listaan ja kaytossa: true.

### Kiitosviesti: Seuraava tilaus
- Vahvistusviestiin sama aihe muina tuotetyyppeinä (enintään 3, esim. Amatimies-hupparin ostajalle t-paita ja
  juliste), ei alennuskoodia (ensitilauksen koodi on pois käytöstä katesäännön vuoksi). Lähtee, kun Resend toimii.

### Nopeus: blogit hydratoidaan
- Blogiartikkeli renderöidään esirenderöinnissä koko sovelluksena ja selain hydratoi sen (ei esikatselun vaihtoa).
  Joulubannerin teema luetaan HTML:stä, jottei se hyppää. Lighthouse mobiili (hidastettu selain):

| Sivu | Ennen | Jälkeen |
|---|---|---|
| /blogi/lahja-miehelle-30v-40v-50v-60v | 83, LCP 4,6 s | **99, LCP 1,7 s**, CLS 0,002 |
| /blogi/lahja-naiselle-30v-40v-50v-60v | 83, LCP 4,5 s | **99, LCP 1,7 s**, CLS 0,002 |
| /blogi/mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea | 99, LCP 1,6 s | 98, LCP 1,8 s |
- Oikeassa selaimessa (4x hidas CPU) yksi LCP-ehdokas 0,7-1,7 s, ei hydratointivirheitä. Palaavalla ostajalla
  (kori ei tyhjä) sivu toimii, kori näyttää tuotteen.

### Arvioitu vaikutus euroina kuukaudessa (arvio, ei mitattua dataa)
| Muutos | Oletus | Kate €/kk |
|---|---|--:|
| Yritystilaukset ja määräalennus | 1-3 tilausta (10-25 paitaa) marras-joulukuussa | 125-475 |
| Personoitu paita | 4-10 tilausta ikävuosihauista (noin 250 klikkausta/kk, 1,5-4 %) | 45-110 |
| SEO-nousut | kyselyt 5.-20. sijalta 3. sijan tuntumaan: noin +140 klikkausta, 1,5 % | 15-30 |
| Shopping-syöte | Organic Shopping 4 -> 40-80 käyntiä | 5-10 |
| Black Friday | koko kampanja 5 pv | 1-17 (kertaluonteinen) |
| Kumppanuusohjelma | pois päältä | 0 |
| **Yhteensä** | | **noin 190-640 €/kk marras-joulukuussa** |

Tavoite 3 000 €/kk vaatii noin 400 tilausta kuukaudessa nykyisellä 7 €:n keskikatteella tai isompia yritystilauksia.
Suurin yksittäinen vipu on yritystilausten myynti (yksi 50 paidan tilaus = noin 306 € katetta).

### Mitä odottaa Aarnia
1. **Printify-maksutapa tai saldo heti** (tilaus 26630629.36 payment-not-received, ei tuotannossa).
2. Cowork: uudet Cloudflare-nimipalvelimet ja tietueet (TXT kahden vanhan rinnalle, A, www), Resend-tietueet.
3. Cowork 31.10. tai myöhemmin: vanhan Stripe-tilin webhook Disable.
4. Kumppanuusohjelman hyväksyntä ja ensimmäiset kumppanit (jos halutaan).
5. Search Console > Tuotekatkelmat > Vahvista korjaus; GA4 Data API -avaimet suppiloa varten.

## 29.10.2026 iltapäivä: ensimmäinen oikea tilaus uuden kassan kautta

**TOIMENPIDE AARNILLE HETI: Printify ei ole veloittanut tilausta, eikä se ole tuotannossa.** Printify-tilauksen
26630629.36 tila on `payment-not-received`, ja rivi (Amatimies | Huppari, Black / L, Textildruck Europa, pp 26) on
on-hold. Kassan automaattinen tuotantoon lähetys epäonnistui samasta syystä: "It is not allowed to send order
26630629.36 to production with status pending". Lisää Printifyyn maksutapa tai saldoa (Printify > Billing) ja paina
tilaukselle Send to production, tai anna tuntiajon yrittää uudelleen.

| Tarkistus | Tulos |
|---|---|
| Stripe (Uusiku Oy, acct_1UVAUMPNXkES1q9G) | Checkout-sessio paid, PaymentIntent succeeded, 54,39 € (tilaus 2ed0a626) |
| Summa | 49,99 € -5 % alennuskoodilla (47,49 €) + toimitus 6,90 € = 54,39 €, sama Neonissa ja Stripessä |
| Neon | tilaus 2ED0A626 maksettu 29.10. klo 9.43 (Suomen aika), tapahtumat kassa, maksettu, printify_luotu, omistaja_ilmoitettu |
| Stripen kuitti | receipt_email asetettu, kuitti nro 1658-8795 muodostettu (Stripe lähettää kuitin live-tilassa) |
| Oma tilausvahvistus | ei lähtenyt (vahvistus_virhe), koska Resend-domain ei ole vahvistettu; Stripen kuitti korvaa sen |
| Omistajailmoitus | lähti (omistaja_ilmoitettu = Resend hyväksyi lähetyksen) |
| Printify | 26630629.36 payment-not-received, on-hold (ks. yllä) |

**Kate:** myynti alv 0 = 54,39 / 1,255 = 43,34 €; Printify huppari 25,48 € + toimitus 10,89 € = 36,37 € (ilman
ALV:tä); Stripen todellinen maksu 2,03 € (laskelmien 1,5 % + 0,25 € = 1,07 €; korttityyppi oli kalliimpi). Nettokate
**4,94 € (11,4 %)**. Alennuskoodi (-2,50 €) ja hupparin Saksan toimitus pitävät katteen pienenä.

**Omistajailmoitusten osoite.** Vaihdoin aamupäivällä OMISTAJA_EMAIL-arvoksi huumorikauppa@gmail.com. Ennen
Resend-domainin vahvistusta Resend toimittaa vain tilin omaan osoitteeseen, joten muutos olisi estänyt seuraavat
ilmoitukset (tämä tilaus tuli ennen muutoksen julkaisua). Palautettu arvoon flyapeg@gmail.com ja testattu
(`?tehtava=ilmoitustesti`: ok, vastaanottaja flyapeg@gmail.com). Vaihto huumorikauppa@gmail.comiin tehdään vasta,
kun domain on vahvistettu.

**Vanhan Stripe-tilin webhook:** ensimmäinen oikea tilaus on mennyt uuden kassan läpi, joten ennakkoehto täyttyy.
Webhookin poisto käytöstä (Disable, ei poistoa) kuuluu tehdä 31.10.2026 tai myöhemmin. Claudella ei ole pääsyä
vanhaan tiliin. **Coworkin tehtävä 31.10. tai myöhemmin:** KAYTTOONOTTO.md "Vanhan kassan webhookin sulkeminen".

## 29.10.2026 aamupäivä: nimipalvelinvaihto, domainin siirron valmistelu, Black Friday, lahjakortit, nopeus

**Nimipalvelinvaihdon seuranta** (dig NS ja A 1.1.1.1:stä sekä HTTPS-tila 15 minuutin välein; vahti pysähtyy ja
kirjaus tehdään tähän ylimmäksi, jos sivusto ei vastaa kahdesti peräkkäin):

| Aika | NS | Juuren A | www | huumorikauppa.fi |
|---|---|---|---|---|
| 29.10. 08.46 | aria, huxley | 216.198.79.1, 64.29.17.1 | 529bd05f3b0cb29b.vercel-dns-017.com | 200 |
| 29.10. 09.01 | aria, huxley | 216.198.79.65, 64.29.17.65 | sama | 200 |
| 29.10. 09.17 | (tämän koneen DNS-aikakatkaisu, kaikki kyselyt) | | | 000, toistettu 09.32: 200 |
| 29.10. 09.47 | aria, huxley | 216.198.79.65, 64.29.17.65 | sama | 200 |

Vaihto annabel/vick ei ollut vielä näkynyt klo 09.47. Sivusto on vastannut koko ajan.

**Vercelin odottamat tietueet.** `npx vercel domains inspect huumorikauppa.fi` vastaa "You don't have access to the
domain huumorikauppa.fi under flyapeg-2135s-projects": domain on vanhan projektin tiimissä, eikä CLI ole kirjautunut
siihen. Tiedot luettiin Vercelin rajapinnasta uuden tiimin oikeuksilla:
- Juuren A: **216.150.1.1 ja 216.150.16.1** (suositus 1; varalla 76.76.21.21). Nyt 216.198.79.65 ja 64.29.17.65.
- www CNAME: **bffaf7b5fcbd90db.vercel-dns-016.com** (varalla cname.vercel-dns.com). Nyt
  529bd05f3b0cb29b.vercel-dns-017.com.
- Uudessa projektissa on jo `huumorikauppa.fi` ja `www.huumorikauppa.fi` (www ohjaa 308:lla juureen), tila
  pending_domain_verification. Vahvistukseen tarvitaan `_vercel`-TXT:t (KAYTTOONOTTO.md).
- Siirto-ohje Coworkille: KAYTTOONOTTO.md "Domain suoraan uuteen Vercel-projektiin". **TXT-tietue on itse
  siirtohetki**, koska molemmat IP-sarjat ovat Vercelin reunaa ja reititys seuraa domainin omistavaa tiimiä. Siirtoa
  ei ole tehty.

**Resend.** Tila pending, DKIM-tietuetta ei vielä näy (nimipalvelinvaihto kesken). Tarkistus jatkuu 30 minuutin
välein 24 tuntia. Kun domain vahvistuu: SAHKOPOSTI_VAHVISTETTU=1, julkaisu, testivahvistus osoitteeseen
huumorikauppa@gmail.com, isänpäiväartikkeli (ODOTTAA_SAHKOPOSTIA-suodatin pois), ja tervetuloviesti,
ostoskorimuistutus ja lahjakortit käynnistyvät. Tervetuloviesti ja muistutukset eivät tarvitse erillistä kytkintä:
ne lähtevät heti, kun Resend hyväksyy lähettäjän.
- **Omistajailmoitukset:** OMISTAJA_EMAIL asetettu Verceliin arvoon huumorikauppa@gmail.com (29.10. klo 10).

**Lahjakortit** (`/lahjakortti`): arvot 25, 50 ja 75 € (100 € poistettu). Myynti avautuu itsestään samalla ehdolla
kuin kassa (`SAHKOPOSTI_VAHVISTETTU=1`): sivu kysyy tilan `/api/sahkoposti?tila=1`. Siihen asti sivu kertoo, ettei
lahjakortteja ole vielä myynnissä, ja Lisää koriin -painike on pois käytöstä. Alatunnisteen linkki ja tuotesivun
Sopii lahjaksi -rivi näkyvät vasta myynnin avauduttua. Joulun viimeisen tilauspäivän jälkeen jouluaattoon asti
yläbanneri: "Joulupaketit eivät enää ehdi, mutta lahjakortti tulee sähköpostilla heti maksun jälkeen" (vain kun
lahjakortit ovat myynnissä). Tila nyt: `{"lahjakortit":false}`.

**Black Friday ja joulu: "Kaksi t-paitaa 44,90 €" 27.11.-1.12.** valmiina, pois päältä (`TPAITAPARI_KAMPANJA`,
`kaytossa: false`). Laskelma KATTEET.md "Black Friday ja joulu 2026". Vertailu: ilmainen toimitus 49 €:sta laskee
katetta kaikissa skenaarioissa (-0,69...-10,45 € kampanja-aikana), -10 % kahdesta tuotteesta heikentää hupparikoreja,
lahjapakettia Printify ei tarjoa. Pari: heikoin kori 10,71 €, odotettu vaikutus 5 päivän kampanjassa +0,84...+6,30 €
(3 tilausta) ja +2,25...+16,80 € (8 tilausta); kannattaa, kun vähintään 7,8 % yhden t-paidan tilauksista muuttuu
pariksi. Kuluttajansuojalaki: ei ennen-hintoja, kampanjateksti kertoo t-paidan hinnan ja 30 päivän alimman hinnan
(24,90 €). Käyttöönotto Aarnin hyväksynnällä; ennen sitä tarkistetaan, että t-paidan hinta on ollut 24,90 € 30 päivää.

**Nopeus (mobiili).** PageSpeed Insightsin avoimen rajapinnan päiväkiintiö oli käytetty (429), joten mittaus tehtiin
samalla Lighthouse 12.6 -mobiiliprofiililla paikallisesti. Löydökset:
1. **Blogiartikkeleissa ei ollut näkyvää esikatselua.** Esirenderöity teksti oli piilotettu, ja artikkeli tuli
   näkyviin vasta, kun sovellus ja blogidata (124 kt) oli ajettu. Lisäksi alatunniste siirtyi (CLS 0,16).
   Korjaus: 82 blogiartikkelille sama näkyvä esikatselu kuin tuote- ja etusivulla (`renderBlogPreview`).
2. Esikatselu siirrettiin selaimessa #rootin eteen, jolloin se piirtyi uudelleen. Nyt esirenderöinti kirjoittaa sen
   valmiiksi oikealle paikalle.
3. Otsikko- ja leipätekstifontit (Anton 12 kt, Inter 47 kt) saapuivat hitaalla 4G:llä vasta 1,7-3,7 s. Nyt ne
   esiladataan ja määritellään kriittisessä CSS:ssä.

| Sivu | Ennen (Lighthouse, simuloitu) | Jälkeen (Lighthouse, hidastettu selain) | Oikea selain 4x hidas CPU, LCP |
|---|---|---|---|
| Etusivu | 69, LCP 4,3 s | 97, LCP 1,7-1,9 s | |
| /blogi/lahja-miehelle-30v-40v-50v-60v | 71, LCP 5,2 s | 83, LCP 4,6 s | 1,2 s (esikatselu 0,7 s) |
| /blogi/mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea | 73, LCP 4,9 s, CLS 0,162 | 99, LCP 1,6 s, CLS 0,002 | 0,6-1,5 s |
| /blogi/lahja-naiselle-30v-40v-50v-60v | 71, LCP 5,2 s, CLS 0,162 | 83, LCP 4,5 s, CLS 0,005 | 1,2 s (esikatselu 0,7 s) |
| /tuote/amatimies-t-paita | 89, LCP 3,7 s | 99, LCP 1,6-1,7 s | |

Mittaustavat eroavat (ennen simuloitu, jälkeen hidastettu selain), ja tämän koneen verkko vaihteli: sama sivu antoi
FCP:n 1,2-4,2 s. Selvä muutos: blogien teksti näkyy ensimmäisessä piirrossa ja CLS on poissa. Kahdessa
ikävuosiblogissa Lighthouse kirjaa LCP:n vielä silloin, kun sovellus korvaa esikatselun, koska varafontilla
piirretty kappale on hieman pienempi kuin sovelluksen Inter-kappale. **Seuraava korjaus:** hydratoi esikatselu
sovellukseksi sen sijaan, että se vaihdetaan.

**Tarkistus tuotannossa** kolmella User-Agentilla (Googlebot, iPhone Safari, Windows Chrome): etusivu, kolme blogia,
tuotesivu, /lahjakortti, /kassa ja /api/sahkoposti?tila=1 palauttavat 200. Sisältösivuilla on näkyvä esikatselu ja
yksi H1. Mobiilin ostopolku (blogi > Osta > koko palkista > kori > kassa) toimii iPhone 13 -koossa kuten ennen.
Testit 1 427 läpi.

## 29.-30.10.2026 yö: mobiilin ostopolku ja konversio

**Lähtötilanne.** GA4: 28 päivässä 1 036 kävijää ja 6 tilausta, konversio 0,58 %, tavoite vähintään 1,5 %.
Search Console 28 pv (29.9.-26.10.): 830 klikkausta, 21 400 näyttöä, CTR 3,9 %, keskisijoitus 11,5. Klikkauksista
**657 mobiilista (79 %)**, 154 tietokoneelta ja 19 tabletista. Supermetricsin kokeilu on päättynyt, joten luvut
luettiin Search Consolesta selaimella (ei maksullista käyttöönottoa).

Kymmenen tärkeintä laskeutumissivua (klikkaukset 28 pv): etusivu 83, /blogi/lahja-miehelle-30v-40v-50v-60v 81,
/blogi/mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea 71, /blogi/lahja-naiselle-30v-40v-50v-60v 58,
/blogi/hauskimmat-elakelahjat-selviytymisopas 58, /blogi/hauskat-isanpaivalahjat-opas 25,
/blogi/hauska-lahja-kaverille 22, /blogi/parhaat-hauskat-tarrat-lappariin 18, /blogi/parhaat-hauskat-lahjat-miehelle 17,
/blogi/hauskat-lahjat-tyokavereille-opas 17. Yhdeksän kymmenestä on blogiartikkeleita, joten tärkein polku on
blogi > tuotesivu > kori > kassa > Stripe. Kaikki muutokset koskevat näitä sivuja (blogin tuotekortit,
etusivun tuoteruudukot ja kaikki tuotesivut).

**Mittaus mobiilissa (Playwright, iPhone 13 390x664 ja Pixel 5 393x727, tuotanto ennen muutoksia):**

| Kohta | Ennen | Jälkeen |
|---|---|---|
| Kassa ennen Stripeä | 3 vaihetta (Tiedot, Toimitus, Maksu), 3 painallusta, 8 kenttää ilman automaattista täyttöä (vain puhelimessa autocomplete) | 1 lomake, 1 painallus "Siirry maksamaan X €", 7 kenttää autocomplete-tiedoilla (nimi, sähköposti, puhelin, osoite, postinumero numeronäppäimistöllä, postitoimipaikka) |
| Ostoskorin Jatka kassalle | yhteenvedon lopussa lisämyyntikorttien alla, mobiilissa noin kahden ruudun päässä | kiinteä palkki ruudun alareunassa: loppusumma toimituksineen ja Jatka kassalle; yhteenveto ennen lisämyyntiä |
| Ostoskorin alennuskoodikenttä | näkyi, mutta ei tehnyt mitään | poistettu; koodi ja lahjakortti syötetään kassalla, jossa ne tarkistetaan |
| Tuotesivun Lisää koriin | y=761 (iPhone) ja y=776 (Pixel), ensinäkymän alapuolella; kiinteä palkki pyysi vierittämään ("Valitse koko ↓") | koot ja Lisää koriin kiinteässä palkissa, valittavissa ilman vieritystä molemmilla laitteilla; sivun oma painike y=665 / y=682 |
| Blogin tuotekortit | "Katso tuote", ensimmäinen tuote y=1211 | "Osta", ensimmäinen tuote y=1107 (avainsanat pois mobiilin ensinäkymästä) |
| Sarja-, laskeutumis- ja etusivun tuotekortit | ei ostopainiketta mobiilissa (hover-painike vain hiirelle) | näkyvä Osta-painike |
| Tuotesivun JavaScript | blogidata (126 kt pakattuna) ladattiin ennen ensinäkymää lahjaoppaiden linkkejä varten | ladataan ensinäkymän jälkeen |
| Kuvat | tuotesivulla 11 kuvaa yhteensä 98 kt, blogissa 5 kuvaa 25 kt (WebP, srcset) | ennallaan, ei kitkaa |

Hakukävijän polku blogista koriin: Osta (1) > koko palkista > Lisää koriin (2). Kassalla yksi painallus Stripeen.

**Suurin kitkakohta: kolmivaiheinen kassa ilman automaattista täyttöä.** Mobiilissa ostaja kirjoitti nimen,
sähköpostin, osoitteen, postinumeron ja kaupungin käsin ja painoi kolme kertaa Jatka ennen kuin pääsi Stripen
maksusivulle. Kolmas vaihe ("Maksu") ei kysynyt mitään, vaan kertoi siirtymisestä Stripeen. Nyt selain täyttää
tiedot yhdellä napautuksella ja maksupainike näyttää loppusumman.

**Tuotesivu (kaikki 573 tuotetta):**
- **Kokotaulukko senttimetreinä** pohjatuotteen mukaan: leveys, pituus ja hiha Gildanin mittalomakkeista
  (Softstyle 64000, Heavy Cotton 5000, Heavy Blend 18500; tuumat muunnettu, 1 in = 2,54 cm). Taulukko näkyy
  tuotesivulla ja Kokotaulukko (cm) -ikkunassa vain myytävillä koilla. Pohja tulee tuotekohtaisesti Printifystä
  (`api/_lib/tuotepohjat.generated.js`), joten mittoja ei lainata toisesta tuotteesta. Koskee 559 vaatetta.
- **"Painetaan tilauksesta EU:ssa, toimitus 3-10 arkipäivää"** vain EU-painotalon tuotteille: OPT OnDemand
  (Tšekki), Textildruck Europa (Saksa), Atelier Katanga (Ranska). Keraaminen koriste painetaan Yhdysvalloissa
  (Imagine Your Photos), joten siinä riviä ei ole. Maat Printifyn rajapinnasta 29.10.2026.
- **"Ehtii jouluksi, kun tilaat viimeistään X"**: sama lähde kuin ennen (t-paidat ti 1.12., muut ma 30.11.),
  näkyy hinnan alla, ostoskorissa ja Sopii lahjaksi -osiossa vain ennen takarajaa.
- **Sopii lahjaksi**: toimitus suoraan saajalle (kassan valinta), 14 päivän palautusoikeus (personoiduilla ei),
  lahjakortti 25-100 €. Vain olemassa olevia ominaisuuksia.
- **Sama huumori, eri tuote**: enintään 4 korttia heti ostoalueen alla, ensin sama design muina tuotetyyppeinä,
  sitten sama teema toisessa kategoriassa (aiemmin sivun lopussa).
- Toimitusarvio ja Sama design myös -linkit siirtyivät ostopainikkeen alle, jotta koko ja painike mahtuvat ylemmäs.
- Luottamustiedot ennen koria: toimitushinta ja -aika, takaraja ja 14 päivän palautus hinnan alla; maksutavat
  (Visa, Mastercard, Apple Pay, Google Pay, Klarna, MobilePay) painikkeen alla; kotimainen kauppa ja Y-tunnus
  yläpalkissa ja alatunnisteessa (ennallaan).

**Materiaalit tarkentuivat** samoista Gildanin mittalomakkeista: Gildan 5000 Sport Grey 90/10, Ash 99/1 ja
meleeratut 50/50 (aiemmin ei riviä), Softstyle 64000 Heather Oatmeal 99/1 (aiemmin 35/65). Materiaalirivi on edelleen
561 tuotteella 573:sta, ja kolmen Gildan 5000 -tuotteen rivi kattaa nyt kaikki värit.

**Arvostelut:**
- Arviopyyntö lähtee vain varmistetun perillemenon jälkeen (Printifyn `delivered_at` + 7 pv). Aiempi varasääntö
  "10 pv lähetyksestä" poistettu.
- Viestissä on jokaiselle tuotteelle oma "Arvioi tämä tuote" -linkki (`/arvostele?token=...&t=<rivi>`), ja
  arviosivu avaa sen tuotteen ensimmäisenä.
- Tuotesivu näyttää vain julkaistut arviot maksetuista tilauksista, joissa arvioitu rivi on juuri tämä tuote
  (`/api/sahkoposti?arviot=<slug>`), merkinnällä "Varmistettu ostaja". Keksittyjä tai kovakoodattuja arvioita ei ole.
  Tällä hetkellä arvioita on 0, joten osiota ei näy.
- Moderointi: `?tehtava=arviot` listaa odottavat, `&julkaise=<id>` tai `&hylkaa=<id>` vaihtaa tilan.

**Mittaus (GA4):**
- Uusi `view_item` tuotesivulla. `add_to_cart` ja `begin_checkout` olivat jo käytössä.
- `item_id` on nyt tuotteen slug kaikissa vaiheissa, kuten `purchase`-tapahtumassa (ennen tietokannan id), joten
  vaiheet yhdistyvät samaan tuotteeseen.
- `viikkomittarit` palauttaa suppilon (`ga4Suppilo`: view_item, add_to_cart, begin_checkout, purchase) viikoittain,
  kun GA4 Data API -avaimet on asetettu. Viikkotaulukossa on uusi Suppilo-sarake.
- Tapahtumat lähtevät vain analytiikkasuostumuksella, joten suppilo kuvaa suostumuksen antaneita kävijöitä.

**Tarkistus tuotannossa** (curl kolmella User-Agentilla: Googlebot, iPhone Safari, Windows Chrome):
- Tuotesivu, blogi, /lahjat/kalastajalle, etusivu, /ostoskori, /kassa ja arvioiden rajapinta palauttavat 200.
- "Painetaan tilauksesta EU:ssa" on tuotesivun esirenderöidyssä HTML:ssä.
- Merchant-syöte: 571 tuotetta, materiaalit 90 puuvilla, 168 puuvilla/polyesteri ja 12 paperi.
- Playwright-läpikulku molemmilla laitteilla: 21 Osta-painiketta blogissa, kokotaulukko, Sama huumori ja Sopii
  lahjaksi tuotesivulla, koko valittu palkista ja tuote lisätty koriin, kassapalkki näkyvissä (31,80 € sis.
  toimitus 6,90 €), alennuskenttä poissa korista, kassassa 7 autocomplete-kenttää ja "Siirry maksamaan 31,80 €".
- Testit 1 423 läpi, tsc puhdas.

**Vanha Stripe-tili.** Salainen avain kierrettiin 29.10.2026 klo 01.43 Pakistanin aikaa (22.43 Suomen aikaa 28.10.),
joten vanha Lovable-kassa ei voi luoda maksuja. Webhook pysyy päällä, kunnes ennen kiertoa luodut sessiot ovat
vanhentuneet (enintään 24 h). Poisto käytöstä 31.10.2026 tai myöhemmin: KAYTTOONOTTO.md, "Vanhan kassan webhookin
sulkeminen". Tiliä ei suljeta.

**Resend.** huumorikauppa.fi on tuntemattoman Cloudflare-tilin alla, ja Cowork valmistelee siirtoa uudelle tilille.
Resend vahvistuu nimipalvelinvaihdon jälkeen. Vahvistuksen tarkistus jatkuu 30 minuutin välein; DNS:ään ei
kosketa.

**Arvioitu vaikutus.** Mobiili tuo 79 % hakuklikkauksista, ja kassa oli siellä raskain vaihe. Kassan
yksivaiheisuus ja automaattinen täyttö sekä ostopainikkeet blogin ja laskeutumissivujen korteissa kohdistuvat
juuri niihin kävijöihin, jotka tuovat lähes kaiken myynnin. Vaikutus näkyy suppilossa ensimmäisen täyden viikon
(W45) jälkeen: begin_checkout / add_to_cart ja purchase / begin_checkout.

**Seuraavaksi:**
1. GA4 Data API -avaimet (KAYTTOONOTTO.md "GA4 Data API"), jotta suppilo täyttyy automaattisesti.
2. Ensimmäisten arvioiden julkaisu, kun toimitettujen tilausten pyynnöt alkavat palata.
3. Vanhan Stripe-webhookin poisto 31.10.2026 tai myöhemmin.

## 29.10.2026 ilta: joulun takaraja painotaloittain, materiaalit Printifystä, Search Console, GA4 Data API

**Joulun takaraja.** Yläpalkki näytti 30.11. ja t-paitojen tuotesivut 1.12. Laskettu uudelleen painotaloittain
(toteutuneet toimitukset Suomeen, tilauksesta perille arkipäivinä, `printify-tilaukset`):

| Painotalo | Tuotteet nyt | Toteutuneet | Sääntö | Viimeinen tilauspäivä |
|---|---|---|---|---|
| OPT OnDemand (CZ) | 391 t-paitaa (kaikki), 12 julistetta, 1 tarra | t-paidat 5, 7, 9 | t-paitojen 8 toimitusta kaikilta painotaloilta P90 13,2 -> 14 + 2 = 16; OPT jää alle | t-paidat ti 1.12.2026 |
| Textildruck Europa (DE) | 163 hupparia | hupparit 11, 13, 14 | alle 5 havaintoa: Printify 5-15 + 2 = 17 | ma 30.11.2026 |
| Atelier Katanga (FR) | 5 hupparia | ei | Printify 15 + 2 = 17 | ma 30.11.2026 |
| OPT julisteet ja tarrat, koriste (59) | 14 | ei | Printify 15 + 2 = 17 | ma 30.11.2026 |

Yksi lähde (`src/data/campaignSchedule.ts` + `tilauspaivat.ts`): yläpalkki "Joulutilaukset: tilaa t-paidat viimeistään
ti 1.12. ja muut tuotteet ma 30.11.", sama kaksiosainen lause artikkeleissa, laskeutumissivuilla, /media-sivulla,
UKK:ssa ja /joulun-viimeiset-tilauspaivat-sivulla. Tuotesivu ja ostoskori näyttävät tuotteen oman päivän painotalon
mukaan (`jouluAvain`): t-paita saa 1.12. vain, jos sen painotalo on OPT, muuten varhaisimman päivän. Sarjasivut
(pelkkiä t-paitoja) 1.12. Metakuvaukset pitävät lyhyyden vuoksi varhaisimman päivän (30.11.), joka pätee kaikkiin.
Merchant-syötteessä ei ole päivämäärää (vain sesonkitunniste). TM Rakennusmaailman `tuotetiedot.txt` päivitetty
(1.12., painotalo Tšekissä, musta L saatavilla).

**Materiaali.** Lause "tarkka materiaali ja paino ovat tuotekuvauksessa" poistettu kaikkialta (tuotesivu, esirenderöinti,
syötteen kuvaus, UKK:t, kategoria-UKK, lahjaoppaat, Tietoa meistä). Uusi `scripts/tuotemateriaalit.mjs` hakee jokaisen
tuotteen Printify-pohjan, painotalon ja myytävien värien koostumuksen Printifyn katalogikuvauksesta
(`api/_lib/tuotepohjat.generated.js`, `api/_lib/materiaali.js`):
- Gildan Softstyle 64000 (388 t-paitaa), 153 g/m²: yksiväriset 100 % rengaskehrättyä puuvillaa, meleeratut 35/65,
  Sport Grey (vaaleanharmaa) 90/10, Graphite Heather 50/50. Rivi kertoo koostumuksen värikohtaisesti.
- Gildan 5000 (3), 180 g/m²: 100 % puuvillaa; meleerattujen ja Sport Greyn koostumusta katalogi ei kerro, joten ne
  jätetään rivistä pois.
- Gildan Heavy Blend 18500 (168 hupparia), 271 g/m²: 50 % puuvillaa ja 50 % polyesteriä.
- Tarra (vinyyli) ja keraaminen koriste katalogin mukaan. Julisteet (12): katalogi ei kerro paperia, ei materiaaliriviä.

Tulos: 561/573 tuotteella materiaalirivi, 12 julistetta ilman. Käsin kirjoitetuissa kuvauksissa 20 virheellistä
väitettä korjattu ("100 % puuvillaa, 180 g/m2" Softstyle-paidoissa, joissa vaaleanharmaa ja meleeratut ovat
sekoitetta ja paino 153 g/m²; hupparien "ei sivusaumoja", jota katalogi ei kerro). Syötteen `material`: 90 puuvilla,
168 puuvilla/polyesteri, 12 paperi (kuvauksesta); värikohtaisesti vaihtelevilta jätetty pois. Aja skripti uusien
tuotteiden jälkeen.

**Search Console: 17 virheellistä Product snippet -merkintää joululahjaoppaassa.** Syy korjattiin jo 26.10.
(a4ae7a1): blogin tuotekorteissa oli mikrodata `itemtype=Product` ilman offersia; nyt tuotteet ovat ItemListinä
(ListItem: position + url). Validoitu tuotannosta 29.10.: sivukartan 223 muuta kuin tuotesivua (kaikki artikkelit,
oppaat, laskeutumis- ja sarjasivut) ilman yhtään Product-merkintää tai mikrodataa ja ilman rikkinäistä JSON-LD:tä;
39 tuotesivun otos: jokaisella Product + offers (price, priceCurrency, availability, url) ja kuva. Search Consolen
raportti on vanhasta indeksoinnista. **Aarni:** Search Console > Tuotekatkelmat > Vahvista korjaus.

**GA4 Data API.** Mahdollinen ilman uutta tiliä ja maksua (palvelutili omassa Cloud-projektissa, ei laskutusta).
Ohje KAYTTOONOTTO.md "GA4 Data API". Tehtävä `viikkomittarit` hakee kävijät, istunnot ja ostot ISO-viikoittain, kun
`GA4_PROPERTY_ID` ja `GA4_PALVELUTILI` on asetettu (nyt `ga4Lahde: "ei asetettu"`). Jos avaimen luonti estyy,
Cowork kirjaa luvut ja lähteeksi "Cowork GA4".

**Resend.** DKIM ja SPF yhä pending 29.10. klo 20.51 asti (12 tunnin vahti, 24 tarkistusta). resend._domainkey.huumorikauppa.fi ei palauta TXT-tietuetta, eli DNS-tietueita ei ole lisätty. Uusi 12 tunnin vahti käynnistetty; vahvistuksen jälkeen SAHKOPOSTI_VAHVISTETTU=1, uudelleenjulkaisu ja isänpäiväartikkeli.

Tarkistettu tuotannosta tavallisella, Googlebot- ja tyhjällä User-Agentilla: tuotesivut (t-paita, huppari, juliste),
/joulun-viimeiset-tilauspaivat, /lahjat/kalastajalle, /media ja /tietoa-meista 200; päivät ja materiaalit kuten yllä,
"tuotekuvauksessa" 0 osumaa. Syötevalidaattori: 571 tuotetta, virheellisiä 0.

**Huomio seuraavaan ajoon.** Käsin kirjoitetuissa kuvauksissa (100 tuotetta) on värimääriä ja kokoja, jotka eivät
enää vastaa tuotteita EU-siirtojen jälkeen (esim. "Värejä on yhdeksän", kun värejä on kolme). Korjataan samalla
tavalla tuotedatasta.

## 29.10.2026: harrastus- ja ammattisarjat, /media, GA4-ostot, musta L, viikkomittarit

Strategia: TM Rakennusmaailman joululahjajutun jälkeen harrastus- ja ammattilehdet sekä niiden lukijoille osuvat
paidat. Lehdelle pitchataan sarjasivu + /media-sivun zip.

**Harrastussarjat (48 uutta t-paitaa, kaupassa näkyvissä).** 8 sarjaa x 6 paitaa, lista
`data/uudet-tuotteet/harrastussarjat-2026-10-29.json`, tuonti `data/uudet-tuotteet-2026-10-29.json`.
- OPT OnDemand (Tšekki), Gildan Softstyle 64000, S, M, L, XL, 2XL, 24,90 €. Kulu 8,90 € kaikissa koissa,
  toimitus Suomeen 8,49 €, nettokate 7,22 € (28,5 %) yhden paidan tilauksessa. Kaikki 15 varianttia saatavilla,
  myös musta L. Mustan mockupin teksti tarkistettu jokaisesta (valkoinen). Ei tavaramerkkejä eikä henkilöitä.
- Laskeutumissivut (oma johdanto, 4 UKK:ta + FAQPage, joulun t-paitapäivä apufunktiosta, linkit muihin sarjoihin,
  /joululahjat ja /lahjat/harrastajalle): /lahjat/remontoijalle, /lahjat/kalastajalle, /lahjat/metsastajalle,
  /lahjat/autoilijalle, /lahjat/golfaajalle, /lahjat/mokkeilijalle, /lahjat/maanviljelijalle, /lahjat/it-ihmiselle.
- Canonical: päällekkäiset sivut 301:llä sarjasivuille (ei ketjuja, utm säilyy): /harrastus/kalastus, /metsastys,
  /golf, /sauna, /ammatti/rakennusmies, /maanviljelija, /koodari, /lahjat/rakennusmiehelle, /koodaajalle, /saunaan,
  /autoharrastajalle. Ohjatut pois esirenderöinnistä, sisäiset linkit päivitetty.
- Merchant-syöte: sarjoille otsikko "Hauska t-paita kalastajalle: Kalastan, siis valehtelen, lahja kalastajalle" ja
  product_type "Vaatteet > T-paidat > Hauskat t-paidat > Kalastajat". Korjattu samalla: nimen kaksoispiste-erotin ei
  enää toista tuotetyyppiä, IT-lyhenne säilyy.

**Medialle-sivu /media** (alatunnisteessa "Medialle", ei päävalikossa, indeksoitava, sivukartassa): kaupan kuvaus
(kotimainen huumoripaitakauppa, myyjä Uusiku Oy, painetaan tilauksesta EU:ssa), huumorikauppa@gmail.com, 20
myydyintä ja joulun kärkituotetta (tuotekuva + lifestyle 2048 px, hinta, linkki), teemavinkit (remontoijat, sauna,
kalastus, autot, eläkeläiset, isät ja äidit) ja 8 sarjaa. Zipit `public/media/` (13,7 Mt): kärkituotteet 11,6 Mt
(40 kuvaa), sarjat 0,3 Mt kukin (tuotekuvat). Zipit eivät ole gitissä; `scripts/julkaise-uusi.sh` luo puuttuvat
(`node scripts/media-zip.mjs`).

**GA4 (G-8FJ58JNKGK).** purchase lähtee tilausvahvistussivulta vain maksetusta tilauksesta palvelimen tiedoilla
(transaction_id, value = tilauksen summa, shipping, items: slug, nimi, hinta, määrä), kerran per tilaus (muistissa +
localStorage, GA4 deduplikoi transaction_id:llä), suostumusta kunnioittaen. Paluu checkout.stripe.comista:
ignore_referrer, joten alkuperäinen lähde ja utm säilyvät. Uudelleenohjaukset (middleware, asiakaspuolen ohjaukset)
säilyttävät kyselyparametrit. Server-side Measurement Protocol ei käytössä (API-salaisuutta ei ole).

**Musta L.** Textildruck Europalta (DE) musta L on loppu. 35 t-paitaa (Sammuta valot, 15 joulupaitaa, pikkujoulu-,
isänpäivä- ja eläkepaidat) siirretty OPT OnDemandille samalla designilla (`data/eu-siirto-2026-10-29.json`,
tehtävä eu-siirrot): 15 varianttia, musta L mukana, kulu 8,90 € (oli 9,28 €), toimitus 8,49 € (oli 7,29 €), kate
yhden paidan tilauksessa 7,22 € (oli 8,04 €). Slug, nimi ja hinta ennallaan. Myydyimmät muut: Tonnin seteli -paita,
Eläkeläinen, Maailman paras äiti -paita ja Saatanan Tunarit ovat jo OPT:lla, kaikki S-2XL saatavilla. Hupparit
(Tonnin seteli, Maailman paras äiti, Textildruck) jätetty: puuttuvat vain muutama 3XL-5XL; Atelier Katangalla olisi
musta 4XL, mutta siirto pudottaisi muita värejä.

**Tuotenimet.** Luonnoton kaksoispiste pois 90 nimestä ("60v kokenut, ei vanha", "Eläkkeellä kiireinen tekemään ei
mitään", "Forssa parempi kuin Helsinki"). Otsikkomaiset jäävät ("Syntymäkaupunki: Tornio", "Hauska T-Paita
Palomiehelle: Sankari Savussa", "Eläkeläinen: aamuherätys vapaaehtoinen"). URL:t ennallaan.

**Viikkomittarit.** Tehtävä `viikkomittarit&alku=YYYY-MM-DD`: uuden kassan maksetut tilaukset (ilman kassatestejä),
myynti, keskiostos ja kate alv 0 Printifyn todellisilla kuluilla. Kävijät ja konversio GA4:stä. Huumorikaupan
GA4-propertya ei ole liitetty raportointityökaluun, joten ne puuttuvat taulukosta, kunnes property on liitetty.

| Viikko | Kävijät | Konversio | Lähde (kävijät) | Suppilo (tuote > kori > kassa > osto) | Tilaukset (Printify) | Keskiostos | Kate | Huom. |
|---|---|---|---|---|---|---|---|---|
| 2026-W40 | ei mitattu | ei mitattu | ei mitattu | ei mitattu | 1 | ei tiedossa | ei tiedossa | vanha kassa |
| 2026-W41 | ei mitattu | ei mitattu | ei mitattu | ei mitattu | 1 | ei tiedossa | ei tiedossa | vanha kassa |
| 2026-W42 | ei mitattu | ei mitattu | ei mitattu | ei mitattu | 1 | ei tiedossa | ei tiedossa | vanha kassa |
| 2026-W43 | ei mitattu | ei mitattu | ei mitattu | ei mitattu | 4 | ei tiedossa | ei tiedossa | vanha kassa |
| 2026-W44 | ei mitattu | ei mitattu | ei mitattu | view_item 29.10. alkaen | 2 | ei tiedossa | ei tiedossa | uusi kassa 27.10. alkaen, 0 maksettua |

Täytetään maanantaisin: tilaukset, keskiostos ja kate tehtävästä `viikkomittarit`, kävijät ja konversio GA4:stä
(lähde "GA4 Data API", kun avaimet on asetettu, muuten "Cowork GA4")
Suppilo: tapahtumamäärät view_item > add_to_cart > begin_checkout > purchase (`viikkomittarit`-tehtävän `suppilo`,
tai Cowork GA4: Raportit > Kaupankäynti > Ostospolku).
(Raportit > Hankinta > Liikenteen hankinta, lähde/media). Vanhan kassan tilausten myyntisummat ovat vanhassa
Lovable-taustassa, joten niiden keskiostos ja kate puuttuvat.

**Resend.** DKIM ja SPF yhä pending (DNS-tietueita ei lisätty), vahti tarkistaa 30 min välein.

## 28.10.2026 ilta: TM Rakennusmaailman media-aineisto, mustan paidan mockup-vika, tuotenimet ilman ajatusviivoja

**Media-aineisto (Otavamedia, TM Rakennusmaailma, joululahjajuttu).** Kansio `media/rakennusmaailma/` (ei gitissä,
4,7 MB): kummastakin paidasta kolme 2048 x 2048 px kuvaa Printifyn mockupeista (`&s=2048`) ja `tuotetiedot.txt`.
Toimittajan "Sammuta valo, sähkö maksaa" on kaupassa "Sammuta valot. Sähkö maksaa".
- Molemmat myynnissä Textildruck Europalla (Saksa, provider 26), Gildan Softstyle 64000, 24,90 €.
  14 varianttia kummassakin, kaikki `is_available`. Koot S, M, L, XL ja 2XL. Musta L (38192) on painotalolla loppu,
  joten mustana S, M, XL ja 2XL. Sammuta: musta, tummansininen, vaaleanharmaa. Löylymestari: punainen, musta,
  armeijanvihreä.
- Kate, yksi paita + toimitus, alv 0: 25,34 € myynti, 16,57 € Printify (9,28 + 7,29), 0,73 € Stripe = 8,04 €.
- Joulun päivä tiedostossa 30.11.2026, sama kuin tuotesivun UKK:ssa (t-paitojen oma päivä on 1.12.).

**Mockup-vika, musta teksti mustalla paidalla (20 tuotetta korjattu).** Generaattori (scripts/lib/uudet-tuotteet.mjs)
antoi Printifylle vain valitut variantit. Printify sijoitti valitsematta jääneet (musta L, 3XL, 4XL) viimeiseen
eli mustan tekstin ryhmään, ja mustan värin mockupit renderöidään juuri variantista 38192 (musta L). Kaupan
"Musta"-kuvissa teksti ei näkynyt. Painatus oli oikein (myytävät mustat variantit valkoisella tekstillä).
- Korjattu Printifyssä: poistetut variantit siirretty saman värin myytävien varianttien ryhmään 17 paidassa ja
  3 hupparissa (erät 26.10. ja 27.10.). Myytävät variantit ja hinnat ennallaan. Tarkistettu kuvasta ja sivuston
  kuvavälityksestä (kaikki leveydet valkoinen teksti).
- Generaattori: `taydennaRyhmat` lisää katalogin muut variantit oman värinsä ryhmään (testi uudet-tuotteet.test.ts).

**Tuotenimet ilman ajatusviivoja.** `api/_lib/tuotenimi.js`: tuotetyyppiliite pystyviivalla kuten muissa nimissä
("100 % Lahtelaista verta | Hauska t-paita"), muut ajatusviivat kaksoispisteellä ("60v: kokenut, ei vanha | T-Paita"),
kolmas osa pilkulla. Slug ei muutu, joten ohjauksia ei tarvittu.
- Tehtävä `tuotenimet-viivat` (kuiva oletuksena, `&kuiva=0` tallentaa): 659 riviä korjattu (386 myynnissä,
  loput piilotettuja). Kannassa 0 jäljellä. Printify-tuonti (tuo-aktiiviset, eu-siirrot) siistii nimen samalla
  funktiolla, joten viivat eivät palaa Printifyn otsikoista.
- Tarkistettu tuotannosta kolmella User-Agentilla: title ja H1 ilman ajatusviivaa, `/api/products` 0/525.
  Esirenderöinti lukee nimet kannasta buildissa, joten julkaistu uudelleen nimien päivityksen jälkeen.

**Resend.** DNS-tietueita ei vielä ole (`resend._domainkey` tyhjä, tila pending 15.21). Vahti jatkaa 30 min välein.

## 28.10.2026 päivä: vanha kassa, joulun takaraja tuotetyypeittäin, maksutavat, Pikkujoulut-huppari, CPA

**Vanha kassa: kysytty Printify-tilaus.**
- Tilaus luotiin 27.10. klo 18.38 Suomen aikaa. Ilmoitettu klo 21.38 on koneen UTC+5-aikaa. Tilaus tuli siis
  ennen uuden kassan käyttöönottoa (noin klo 20.30).
- Toimitusmaksu 3,90 € on vanhan Lovable-kassan hinta (uusi kassa: 6,90 €), joten maksu meni vanhalle tilille
  `acct_1THtN1AhUyocG7PO`.
- Uuden tilin `acct_1UVAUMPNXkES1q9G` kaikki 39 sessiota 27.-28.10. ovat kassatestejä, eikä yksikään ole maksettu.
- Tilaus lähti tuotantoon 28.10. klo 8.54 EU-painotalossa (#30, OPT OnDemand CZ).

**Vanha kassa: reitti on yhä auki.**
- Vanhan Lovable-kassan create-checkout loi 28.10. live-session vanhalle tilille (testi, maksamaton, vanhenee
  24 tunnissa). Sitä kutsuu vain ennen 27.10. klo 20.30 avattu sivu.
- Vanhat osoitteet ohjaavat jo huumorikauppa.fi:hin:
  - huumorikauppa.lovable.app 302
  - vanhat Vercel-aliakset 307
  - www 307
- Wayback Machinessa ei ole kassasivua.
- Sulkeminen vaatii Lovable- tai vanhan Stripe-tilin pääsyn: ohje KAYTTOONOTTO.md "Vanhan kassan reitti". Vanha
  webhook pidetään päällä, kunnes reitti on suljettu ja ensimmäinen oikea tilaus on mennyt uuden kassan läpi. Muuten
  vanhan kassan kautta maksettu tilaus ei menisi Printifyyn.
- Uudet palvelintehtävät (ilman henkilötietoja):
  - lukevat: `printify-tilaukset`, `stripe-sessiot`, `toimitusajat`, `maksutavat`
  - kirjoittava: `tuotenimi` (vain nimi, oletuksena kuiva)

**Joulun takaraja tuotetyypeittäin** (toteutuneet toimitukset tilauksesta perille, arkipäivinä, Printify 3-10/2026):
- T-paidat: 8 toimitusta (4, 4, 5, 7, 7, 9, 12, 16). P90 (lineaarinen) 13,2, eli 14 arkipäivää. Lisäksi
  2 arkipäivää, yhteensä 16. Viimeinen tilauspäivä on ti 1.12.2026.
- Muut tyypit ma 30.11.2026. Niillä on alle 5 havaintoa:
  - hupparit 11, 13, 14
  - mukit 7, 10, 13
  - koriste 13
  - julisteet ja tarrat: ei toimituksia
  
  Siksi käytetään Printifyn ilmoittamaa aikaa Suomeen: catalog v2 shipping/standard, FI 5-15 arkipäivää kaikilla
  käytetyillä pareilla. Laskelma 15 + 2 = 17 arkipäivää.
- Printifyn 2025-sesongin 20.11.-katto poistettu.
- Missä päivä näkyy:
  - tuotesivu: tuotteen oma päivä ("Tilaa viimeistään X, niin ehtii jouluksi" ja "Ehtii jouluksi" samasta lähteestä)
  - ostoskori: korin varhaisin päivä
  - banneri, UKK ja etusivu: 30.11.
  - /joulun-viimeiset-tilauspaivat: molemmat päivät ja laskentaperuste
- Joulumyyntiä tulee 10-11 päivää lisää.

**Maksutavat.**
- Stripen oletuskonfiguraatiossa ovat päällä kortti, Apple Pay, Google Pay, Klarna ja MobilePay. Capabilityt
  card, klarna ja mobilepay ovat aktiivisia.
- Alatunnisteessa ne olivat jo. "Visa, Mastercard ja muut yleisimmät maksutavat" on korjattu kuudella maksutavalla
  näihin kohtiin: toimitusehdot, UKK, Tietoa meistä, llms.txt, oppaat ja blogit.

**Pikkujoulut-huppari.**
- Painatus oli "Pikkujoulut 2025: muistetaan 2035", ja ylin rivi jäi nyörien alle.
- Uusi painatus on "Pikkujoulut 2026: muistetaan 2036" pienempänä ja alempana (Printify 6adf634a10aa455cb00a0d9e).
  Mockup tarkistettu: koko teksti näkyy.
- Nimi on nyt "Pikkujoulut 2026: muistetaan 2036 | Huppari pikkujouluihin". Kuvaus ja linkkitekstit päivitetty.
- Havainto: 386 tuotteen nimessä on ajatusviiva (tietokanta). Merchant-otsikot ovat ilman viivaa. Sivuston nimet
  ovat seuraava korjattava.

**Mainonnan kynnys** (KATTEET.md):
- Keskikate on noin 7,00 € tilausta kohden (toteutunut 9,02 €).
- Suurin kannattava CPA on 7 €.
- Nollatulos vaatii keskiostoksen noin 51 € (CPA 15 €), 68 € (CPA 20 €) tai 100 € (Meta, CPA 30 €).
- Mainontaa ei käynnistetty.

**Merchant-syöte julkaistu.** Kanavan kuvauksesta poistettiin "Suomen hauskin verkkokauppa".

**Resend:** domain on pending (DNS-tietueita ei ole Cloudflaressa 28.10. klo 12.30). Tarkistus 30 minuutin välein.

## 28.10.2026: Merchant-syöte

**Mitä muuttui.** Googlen maksuttomien listausten syöte (api/product-feed.js) saa uuden viimeisen vaiheen
api/_lib/syote-sisalto.js. Se kirjoittaa jokaiselle tuotteelle otsikon, kuvauksen, product_typen, numeerisen
Google-kategorian ja materiaalin tuoterivistä. Hinta, saatavuus, toimitus (6,90 €, ilmainen 79 €:sta, kassan
vakioista) ja identifier_exists=no pysyvät ennallaan.

- **Otsikot** hakujen mukaan (Googlen ehdotukset 28.10.: "hauska t paita isälle", "lahja eläkeläiselle",
  "pikkujoululahja", "hauska joulupaita", "40v lahja"): `{tyyppi} {kenelle}: {painoteksti}, {lahjahaku}`, esim.
  "Hauska t-paita isälle: En nuku. Lepuutan silmiä, isänpäivälahja" ja "Hauska huppari akaalaiselle: Akaalainen
  selviää mistä vain, Akaa-lahja". Emojit, versaalit ja [NIMI]-paikkamerkit poistetaan. Pituus on enintään 150 merkkiä.
- **Kuvaukset** ovat 500-1500 merkkiä (aiemmin mediaani 130). Mukana ovat painoteksti, kenelle tuote sopii,
  tuotteen oma kuvaus, saatavat koot ja värit, materiaali (jos tiedossa) ja tieto EU-valmistuksesta. Ajatusviivat
  ja toimitus-, hinta- ja palautusmaininnat jätetään pois. Live-syötteessä oli 48 kuvausta, joissa luki
  "ilmainen toimitus yli 60 €" (väärä raja ja mainosteksti), sekä 8 otsikkoa, joissa oli ❤️.
- **Kategoria** on nyt numeerinen ID (taxonomy-with-ids, versio 2021-09-21). T-paidat ja hupparit saavat ID:n 212
  (Shirts & Tops). Hupparit olivat aiemmin Coats & Jackets, mikä ei sovi vetoketjuttomalle hupparille. Julisteet
  saavat ID:n 500044 ja tarrat 4054.
- **product_type** on muotoa "Vaatteet > T-paidat > Hauskat t-paidat > Eläkeläiset". Aiheita ovat esimerkiksi
  Paikkakunnat, Syntymäpäivät, Isät ja isoisät, Pikkujoulut ja Joulu. Niillä voi rajata kampanjoita.
- **material** tulee vain tuotteen omasta kuvauksesta, ja sen saa 44 tuotetta. Printifyn katalogi ei ollut
  ajoympäristöstä saatavilla, joten muille tuotteille materiaalia ei arvattu.

**Validaattori** (scripts/validoi-syote.mjs) hakee nyt taksonomian ID:t ja tarkistaa numeerisen kategorian. Se
tunnistaa myös emojit ja mainostekstin otsikosta ja kuvauksesta, kuvauksen pituuden, product_typen ja materiaalin.
Lisäksi se vertaa syötteen hintaa sivuston /api/products-hintaan (`--api URL` paikalliselle tiedostolle). Ajo
tuotannon 523 tuotteella uudella koodilla (`--otos 60 --api https://huumorikauppa.fi`) antoi 0 virhettä. Sivut,
kuvat (200 ja mitat) ja canonical tarkistettiin 60 tuotteen otoksesta, hinnat kaikista tuotteista.

**Jäi ennalleen:** syöte on yhä tuotetasoinen, ja koko on muotoa "S/M/L/XL/2XL" (510 varoitusta). Variantteihin
siirtyminen tarkoittaisi noin 523 × 5-8 kokoa × 3-9 väriä eli kymmeniätuhansia rivejä. Se ylittäisi Vercelin
4,5 Mt:n vastausrajan, ja tuotesivun pitäisi osata esivalita variantti osoitteesta. Hupparin 3XL+ maksaa 55,00 €,
mutta syötteessä on perushinta 49,99 € kuten tuotesivullakin.
## 28.10.2026: 10 joulun ja pikkujoulun hakuopasta, uutiskirjelaatikko (haara `seo-joulu-2810`)

Hakusanat Googlen hakuehdotuksista 28.10.2026 (suggestqueries, hl=fi, gl=fi). Valittu vain aikomuksia, joille ei
ollut artikkelia eikä laskeutumissivua. Data `src/data/blogJouluHaut2026.ts` (HAKUSANAT), 600-900 sanaa, 4-8
tuotelinkkiä, UKK + FAQPage, joulun tilauspäivä `tilauspaivat.ts`:n funktioista, ei lahjakortteja, ei hintoja tekstissä.

| Slug | Hakusana |
| --- | --- |
| `/blogi/hauska-joulupaita` | hauska joulupaita miehelle |
| `/blogi/pikkujouluasu-2026` | pikkujouluasu |
| `/blogi/pikkujoulu-teema-ideat` | pikkujoulu teema ideoita |
| `/blogi/pikkujouluohjelma-tyopaikalle` | pikkujouluohjelmaa työpaikalle |
| `/blogi/pikkujoululahja-miehelle` | pikkujoululahja miehelle |
| `/blogi/joululahja-tyttoystavalle` | joululahja tyttöystävälle |
| `/blogi/joululahja-vanhemmille` | joululahja vanhemmille |
| `/blogi/hauska-joululahja-ystavalle` | hauska joululahja ystävälle |
| `/blogi/joululahja-tyontekijoille` | joululahja työntekijöille |
| `/blogi/joululahja-opiskelijalle` | joululahja opiskelijalle |

- Tuotenostot: omat teemat `src/data/blogProducts.ts`:ssä. Sisäänlinkit: /joululahjat, /lahjat/pikkujouluihin,
  /joululahja-tyokaverille, /lahjat/puolisolle (extraLinks) ja /ryhmatilaukset. Sivukartta (api/sitemap.js) ja
  llms.txt (oma lista) päivitetty, llms-full.txt saa artikkelit blogidatasta.
- Testifixtuuriin (productSlugs.json) lisätty 12 /api/products-listan joulu- ja pikkujoulupaitaa.
- Uutiskirjelaatikko etusivulle ja blogiartikkelien loppuun (`NewsletterBox`, laiska lataus, varattu korkeus):
  "Saat ensimmäisenä uudet hauskat paidat ja joulun takarajat". Sama /api/sahkoposti ja suostumusteksti kuin
  popupissa, ei alennuskoodia. Etusivun vanha lomake (ilman suostumusruutua) korvattu.
## 28.10.2026: Canonical-korjaus

Search Console: 57 sivua "Kaksoiskappale, Google valitsi eri kanonisen sivun kuin käyttäjä" (/lahjat/..., /kategoria/...).
GSC-listaa ei ollut, joten kaksoiskappaleet etsittiin vertaamalla esirenderöityjen sivujen otsikkoa, H1:tä, johdantoa,
UKK:ta ja tuoteruudukkoa (tuotedatan tilannekuva). Löydökset: 20 /lahjat/-tilannesivua oli samaa templaattia (sama
pohjateksti ja UKK, avainsanahaku "it"/"ai" osui lähes kaikkiin tuotteisiin, joten ruudukot olivat samat), 14
kategoriasivua oli tyhjiä (alle 8 myynnissä olevaa tuotetta) ja /hauskat-t-paidat, /hauskat-hupparit ja /lahja-miehelle
olivat kategoria- tai laskeutumissivun kopioita (sama H1 ja tuotteet).

Yhdistetty 301:llä (vercel.json + LANDING_REDIRECTS, pois sivukartasta, llms.txt:stä ja sisäisistä linkeistä):
- /lahjat/miehelle, /lahja-miehelle -> /hauskat-lahjat-miehelle
- /lahjat/naiselle -> /hauskat-lahjat-naiselle
- /lahjat/aitienpaiva -> /aitienpaiva
- /lahjat/kollegalle -> /lahjat/tyokaverille
- /lahjat/syntymapaivasankarille -> /syntymapaivalahjat
- /lahjat/ystavalle, /lahjat/ystavanpaiva, /lahjat/muutoiset -> /lahja-kaverille
- /lahjat/polttareihin -> /polttari-lahjat
- /lahjat/huumorilahjat -> /kaikki-tuotteet
- /lahjat/koodaajalle -> /ammatti/koodari, /lahjat/rakennusmiehelle -> /ammatti/rakennusmies, /lahjat/yrittajalle -> /ammatti/yrittaja
- /lahjat/golfaajalle, /lahjat/autoharrastajalle -> /lahjat/harrastajalle
- /lahjat/lapselle -> /joululahja-teinille
- /lahjat/valmistujaisiin -> /blogi/hauskat-valmistujaislahjat-2026, /lahjat/juhannus -> /blogi/hauska-lahja-juhannukseen-2026
- /hauskat-t-paidat -> /kategoria/t-paidat, /hauskat-hupparit -> /kategoria/hupparit (johdanto ja UKK siirtyivät kategoriasivulle)
- /opiskelijan-haalarimerkit, /kategoria/haalarimerkit -> /haalarimerkit
- /kategoria/pitkahihaiset -> /kategoria/t-paidat, /kategoria/bodyt -> /lahjat/vauvalle
- /kategoria/tarrat, peitot, pipot, laukut, seinataulut, koristeet, lippikset, sukat, avaimenperat, asut, naamiot -> /kaikki-tuotteet
  (src/lib/hiddenCategories.ts YHDISTETYT_KATEGORIAT; tuotteet pysyvät myynnissä, murupolku osoittaa kohdesivuun)

Eriytetty omalla sisällöllä:
- /kategoria/t-paidat ja /kategoria/hupparit: oma otsikko, johdanto ja UKK (FAQPage), ei enää "Suomen hauskimmat" -väitettä.
- /lahjat/30-vuotiaalle-miehelle ja /lahjat/vauvalle (nyt "lahjat tuoreille vanhemmille"): laskeutumissivuiksi omalla
  johdannolla, UKK:lla ja tuotesuodattimella.
- Oma tuotejärjestys tai -valinta: /lahjat/alle-30-euroa, /lahjat/60-vuotiaalle-miehelle, /lahjat/60-vuotiaalle-naiselle,
  /lahjat/70-vuotiaalle, /joululahja-mummolle, /joululahja-tyokaverille, /joululahja-kaverille, /joululahja-alle-50-euroa,
  /polttari-lahjat (ennen kaikki paidat).

Testi src/seo/canonical.test.ts: /lahjat/- ja /kategoria/-sivuilla ei samaa otsikkoa, H1:tä, johdantoa, UKK:ta eikä
samaa 12 tuotteen ruudukkoa; ohjatut polut eivät ole esirenderöityjä eivätkä linkitettyjä.

Avoinna: /ammatti/-, /harrastus/- ja /murre/-sivuilla on yhä osin sama varatuotelista (sisältö on sivukohtainen),
ja /haalarimerkit on ilman tuotteita (haalarimerkkejä ei ole valikoimassa).
Tarkista GSC:stä 2-4 viikon päästä, mitkä 57:stä jäävät listalle.

## 27.-28.10. pitkä ajo: joulu- ja isänpäivämyynti, konversio, keskiostos

**Resend ja ilmoitukset.** RESEND_API_KEY on Vercelissä (ilmainen suunnitelma), OMISTAJA_EMAIL on nyt
huumorikauppa@gmail.com. Resend-domain huumorikauppa.fi on vahvistamatta, koska DNS-tietueet puuttuvat (DKIM ja muut
KAYTTOONOTTO.md:n riveillä 11-13). Siihen asti Resend lähettää vain tilin omaan osoitteeseen flyapeg@gmail.com, joten
omistajan ilmoitukset menevät sinne. Asiakas saa Stripen kuitin (receipt_email), kunnes SAHKOPOSTI_VAHVISTETTU=1.

**Ensimmäisen oikean tilauksen valvonta.** Jokaisesta maksetusta tilauksesta lähtee heti ilmoitus omistajalle
(tilaus.js ilmoitaOmistajalle): summa, tuotteet, toimitus ja Printify-tila. Jos tilaus ei ole tuotannossa, viestissä
lukee "POIKKEAMA". Ilmoitustesti meni perille. `?tehtava=maksetut` näyttää maksetut tilaukset painotaloineen ilman
henkilötietoja. Oikeita maksettuja tilauksia ei vielä ole (28.10. klo 0).

**Etusivu.** Kesän ALE-kuva on korvattu joulun pääkuvalla, jossa ovat oikeat hinnat suoraan rajapinnasta (t-paidat
24,90 €, hupparit alkaen 49,99 €) eikä päivämääriä tai alennuksia. Kuva tehdään skriptillä `scripts/etusivun-kuva.py`.
Sivustolla ei ole yliviivattuja hintoja (original_price tyhjä kaikilla), eikä ALE-merkintöjä ole.

**Automaattiset tilauspäivät.** Päivät lasketaan toteutuneista toimitusajoista (src/data/campaignSchedule.ts):
pahin tuotanto 2 + kuljetus 13 + puskuri 2 = 17 arkipäivää. Laskennassa pyhät ohitetaan.
- Isänpäivä: lahjan pitää olla perillä pe 6.11., joten viimeinen tilauspäivä oli ke 14.10.2026. Isänpäiväsivut sanovat
  nyt "Painettu lahja ei enää ehdi perille isänpäiväksi", eikä vanhaa 28.10.-lupausta näy.
- Joulu: laskettu päivä on 30.11., mutta Printifyn sesonkiraja rajaa sen pe 20.11.2026:een.
- Palkki vaihtuu itsestään (isänpäivästä jouluun 15.10.) ja katoaa joulun tilausajan jälkeen.
- Kaikki 129 käsin kirjoitettua joulupäivää käyttävät nyt samaa lähdettä. Tilausajan jälkeen tekstit muuttuvat
  päivämäärättömiksi seuraavassa julkaisussa (selaimessa heti).

**Konversio.**
- Mobiilin latausaika (Lighthouse, mediaani 3 ajosta):
  - Tuotesivun LCP on livenä 1,9 s.
  - Ostoskorin ja kassan LCP oli 3,6-3,9 s.
  - Korjaukset: etusivu pois pääpaketista (640 kt -> 257 kt), ostoskorin ja kassan esilataus ja CLS-korjaus (0,047 -> 0,001).
  - Paikallisesti mitattuna kassan LCP 3,20 -> 2,96 s.
- Stripe-kassassa ovat päällä kortti, Apple Pay, Google Pay, MobilePay, Klarna ja Link. Testisessiossa näkyivät
  kortti, MobilePay, Apple Pay, Google Pay ja Link. Klarna näytetään ostajan sijainnin mukaan, eikä sitä tarjottu
  Suomen ulkopuolelta tehdyssä testissä.
- Tuotesivulla ja ostoskorissa näkyvät nyt maksutapakuvakkeet (yksi lista, src/config/maksutavat.ts) ja teksti
  "Toimitus 6,90 €, ilmainen 79 eurosta".

**Keskiostos.** Ostoskorin mittari "Lisää X € ilmaiseen toimitukseen" ehdottaa tarraa tai julistetta (mukeja ei
ehdoteta, koska ne eivät ole myynnissä) vain, jos koko korin kate pysyy positiivisena. Kate lasketaan samoin kuin
kassalla. Laskelma on KATTEET.md:ssä ("Ilmaisen toimituksen mittari ja lisätuote 28.10.2026").
- Arvio: +1,2...+6,6 €/kk oletetulla 3-8 %:n tarttumisella.
- Varaus: huppari- ja t-paita+huppari-korissa julisteen lisääminen laskee nykyisillä kulutiedoilla katetta
  (1,32-4,76 €), vaikka kate pysyy positiivisena. Syy: tuoteriveiltä puuttuu painotalo- ja lisäkappaletieto.

**Uudet tuotteet.** Printifyssä on 20 uutta paitaa (Textildruck Europa DE) ja 5 hupparia (Atelier Katanga FR).
Teemat: joulu 6, pikkujoulu 4, isänpäivä 5 ja eläkeläiset 5.
- Paidat 24,90 €, kate 8,04 € (31,7 %) jokaisessa koossa.
- Hupparit 49,99 € / 3XL 55,00 €, kate vähintään 6,08 € (12,3 %).
- Kaikki 25 on kaupassa ja oikeilla lahjasivuilla (joululahjat, isänpäivä, eläkeläiset, pikkujoulut).
- Lisäksi palautettiin 15 Lovablen synkronoimaa paitaa, 12 julistetta ja tarra. Kaupassa on nyt 525 tuotetta.

**Uudet sivut.**
- /ryhmatilaukset: 5+ kpl, yhteydenotto huumorikauppa@gmail.com, ei hintalupauksia.
- 8 uutta artikkelia: isänpäivälahja isoisälle, lahja ensimmäiseksi isänpäiväksi, pikkujoulujen lahjapeli,
  pikkujoulupaidat porukalle, joululahja poikaystävälle, joululahja anopille ja appiukolle, joululahja siskolle ja
  isänpäivälahja viime hetkellä.
- Viimeinen (viime hetken isänpäivälahja) odottaa julkaisua, koska se suosittelee sähköpostilla heti tulevaa
  lahjakorttia. Lahjakorttien myynti on suljettu kassalla, kunnes oma sähköposti toimii; muuten ostaja ei saisi koodia.
- Ehdotetut aiheet pikkujoululahja alle 20 €, joululahja eläkkeelle jäävälle, lahja isoisälle ja salainen joulupukki
  olivat jo olemassa.

**Uutiskirje.** Tervetuloviesti on olemassa (ei alennuskoodia, ensitilausalennus 0 %). Ostoskorimuistutus on nyt yksi
viesti 24 tunnin kuluttua, ilman alennuskoodia. Tietosuojaseloste on päivitetty. Viestit lähtevät, kun Resend-domain
on vahvistettu.

**Vanha kassa.** KAYTTOONOTTO.md:ssä on ohje vanhan tilin `acct_1THtN1AhUyocG7PO` webhookin poistamiseksi käytöstä
(Disable). Sen saa tehdä vasta ensimmäisen oikean uuden kassan tilauksen jälkeen. Tiliä ei suljeta eikä avaimia
kierretä avoimen riita-asian (3.11.) vuoksi.

**Poikkeamat.**
1. Sivusto oli alhaalla 23.13-23.16 (MIDDLEWARE_INVOCATION_FAILED). Syy: middleware tuotiin ilman tiedostopäätteitä
   (Vercel ajaa middlewaren ilman niputusta). Korjattu .js-päätteillä, ja korjaus testattiin preview-julkaisulla
   ennen tuotantoa.
2. Joululahjasivujen metakuvauksissa näkyi hetken `${JOULU_META}`. Korjattu, ja testi estää toistumisen.
3. Kassatesti tunnisti väärin Stripen uuden `/g/pay/`-osoitteen. Korjattu (kassa toimi koko ajan).
Jokainen julkaisu tarkistettiin kolmella User-Agentilla.

**Arvio katevaikutuksesta.** Historia: 22 tilausta 3-10/2026 (noin 4 kk:ssa), nettokate keskimäärin 3,57 € tilaukselta.
- Uusi kassa ja hinnat nostavat katetta tilausta kohden: t-paitatilaus +1,52 € (5,70 -> 7,22 €), hupparitilaus
  +2,42 € (7,13 -> 9,55 €).
- Tappiolliset korit poistuvat, ja kassa estää alle rajan jäävät variantit.
- Joulusesongin oletuksella 10-20 tilausta/kk vaikutus on noin +15...+50 €/kk tilausta kohden nousseesta katteesta.
- Jos uudet tuotteet, artikkelit ja konversiokorjaukset tuovat 3-8 lisätilausta/kk, se tuo noin +25...+65 €/kk.
- Yhteensä noin +40...+115 €/kk sesongin aikana. Tämä on oletuksiin perustuva arvio, ei mittaus.
- 3 000 €/kk tavoite vaatii noin 350-400 tilausta kuukaudessa nykyisellä katteella. Ratkaiseva tekijä on liikenne
  (mainonta, haku), ei enää kassa.

## 28.10. yö: Resend asennettu, etusivun kesän ALE-kuva pois

**Resend:** asennettu CLI:llä Vercelin integraatiosta projektiin huumorikauppa (Production), ilmainen suunnitelma
(3 000 viestiä/kk, ei maksutapaa), alue eu-west-1. RESEND_API_KEY on Vercelissä. Resend loi domainin
huumorikauppa.fi, mutta se on vahvistamatta (`not_started`), koska DNS-tietueet puuttuvat. Testivahvistus osoitteeseen
huumorikauppa@gmail.com palautti Resendiltä 403 "domain is not verified". DKIM-arvo ja muut tietueet ovat
KAYTTOONOTTO.md:n taulukon riveillä 11-13. Kassa pyytää Stripen kuitin, kunnes domain on vahvistettu ja Vercelissä on
SAHKOPOSTI_VAHVISTETTU=1. Ilman tätä muutosta asiakas ei olisi saanut kuittia eikä vahvistusta, koska kassa lopetti
Stripen kuitin heti, kun avain ilmestyi. Kassa, webhook ja Printify-testitilaus (peruttu) tarkistettiin uudelleen.

**Etusivu:** pääkuvassa luki "KESÄHYÖKKÄYS! -50-70 % JUST NYT!", ja siinä oli ALE-hinnat (esim. 39 € -> 24,90 €,
95 € -> 49,90 €), joita kaupassa ei ole. Kuva korvattiin samankokoisella kuvalla ilman hintoja ja kampanjaa: kaupan
vihreä tausta, "Hauskat paidat ja hupparit lahjaksi", neljä oikeaa tuotekuvaa ja "Katso tuotteet". Uudet nimet
`etusivu-hero-*.webp` ja `etusivu-hero.png` (myös jakokuva), koska vanhoilla kuvilla oli 30 päivän välimuisti. Vanhat
tiedostot poistettiin. Kuvatiedosto on pienempi (800 px: 86 kt -> 27 kt). "Kesän suosituimmat" -> "Suosituimmat
nyt", bannerin aurinkokuvake -> lahjakuvake, ja avainsanatekstistä poistettiin "tarjous, alennus, kampanja". Tuotteilla
ei ole yliviivattuja hintoja (original_price tyhjä kaikilla 500 tuotteella). Tarkistettu kolmella User-Agentilla:
etusivu 200, uusi kuva, ei vanhaa kuvaa eikä kesätekstiä.

## 27.10. klo 20.30-21.00: uusi kassa käyttöön huumorikauppa.fi:ssä

**Uusi tausta ja Uusiku Oy:n kassa ovat käytössä osoitteessa huumorikauppa.fi.** oma-tausta on yhdistetty mainiin
(b52fd31). DNS:ää ei muutettu. Vanha Vercel-projekti, jossa domain on, rakentaa mainin ja välittää jokaisen pyynnön
uuteen projektiin (`middleware.ts`, KAYTTOONOTTO.md "Tilanne 27.10.2026 klo 21").

Testit uudella Stripe-avaimella (Full access except sensitive operations):
- Live-kassa luo sessiot Uusiku Oy:n tilille `acct_1UVAUMPNXkES1q9G` huumorikauppa.fi:n kautta. Summat: 1 t-paita
  31,80 €, 4 t-paitaa 94,64 € (ilmainen toimitus, kahden tuotteen alennus), huppari 3XL 61,90 €, tarra 18,80 €.
  Paluuosoitteet ovat `https://huumorikauppa.fi/tilaus-vahvistettu` ja `/kassa`.
- Tilaukset tallentuvat Neoniin. Webhook toimii: sessiot vanhennettiin Stripen API:lla, Stripe lähetti
  `checkout.session.expired` ja tilaukset muuttuivat tilaan peruttu.
- Printify-testitilaukset EU-painotaloille (Textildruck Europa DE, OPT OnDemand CZ) pitoon, tilausvahti ok, ja
  peruutus ennen tuotantoa (tila canceled).
- Kuitti: ilman Resendiä kassa asettaa `receipt_email`, jolloin Stripe lähettää kuitin live-tilassa
  sähköpostiasetuksista riippumatta. Stripen asetusta (Customer emails > Successful payments) ei tarvitse kytkeä.
- Tuotanto tarkistettiin kolmella User-Agentilla: etusivu, tuotesivut, tarra, kassa ja ostoskori 200, Uusiku Oy
  näkyy, ei noindexiä, canonical huumorikauppa.fi. Tuotannon JavaScriptissä ei ole Lovablen kassakutsuja.
- Palautuneet: koot 3XL-5XL ja lisämyynnin tarra (tappiolista tyhjä), MYYJA=uusiku (Uusiku Oy kaikilla sivuilla).

**Kassakatko 20.34-20.53.** Ensimmäinen välitysversio käytti vain Vercelin rewriteä, joka ei vie POST-pyynnön runkoa.
Kassa vastasi "Ostoskori on tyhjä", eikä maksua voinut aloittaa noin 20 minuuttiin. Korjaus (185100b): rajapinta ja
POST-pyynnöt välitetään fetchillä. Tarkistettu huumorikauppa.fi:n kautta kaikilla neljällä korilla.

**Puuttuneet tuotteet tuotu.** Uudesta kaupasta puuttui 28 Lovablessa myynnissä ollutta tuotetta: 15 tänään
synkronoitua joulu- ja eläkeläispaitaa (eivät olleet Neonissa), 12 julistetta ja tarra (passiivisia, julisteet
väärällä hinnalla 49,90 €). Ne tuotiin Printifystä kuluineen ja aktivoitiin Lovablen slugilla ja hinnalla
(`?tehtava=tuo-aktiiviset`, data/lovable-aktiiviset-2026-10-27.json). Kaupassa on nyt 500 tuotetta: 323 t-paitaa,
163 hupparia, 12 julistetta, tarra ja koriste. Mukit, EU-testikopiot ja kaksoiskappaleet pysyvät piilossa.

**Muut muutokset:** ajastukset `vercel.crons.json`-tiedostossa ja uuden projektin julkaisu `scripts/julkaise-uusi.sh`.
Syy: vanha projekti rakentaa saman vercel.json-tiedoston, eikä sen tasoa tiedetä. Käyttöönottotesti
`?tehtava=kayttoonottotesti` ja kassatesti ovat ajettavissa milloin tahansa.

**Resend:** Vercel CLI on kirjautunut käyttäjänä flyapeg@gmail.com (flyapeg-2135). Integraation lisäys CLI:llä vaatii
ehtojen hyväksynnän selaimessa. Ohje on KAYTTOONOTTO.md:ssä.

**Domain:** nimipalvelimet ovat Cloudflaressa, eikä tilin omistajaa voi päätellä DNS:stä, Vercelistä tai
sähköpostista. Välitys toimii, joten siirto ei ole kiireellinen. Vaihtoehdot ovat KAYTTOONOTTO.md:ssä.

## 27.10. myöhäisilta: hupparien hinta, DNS Domainhotelliin, vanhan kassan Stripe-tili

**Hupparien hinta (oma tausta, haara oma-tausta, commitit bc0dd60 ja 85835ed).** Päätös oli S-2XL 52,90 € ja
3XL+ 59,90 €, mutta korkeintaan kilpailijoiden taso. Stuntmanin ja Meemirotan tuotesyötteet tarkistettiin
27.10.2026. Painettujen huppareiden korkein hinta on S-2XL 49,99 € (Meemirotta) ja 3XL+ 55,00 € (Stuntman, Speed
Kings). Päätetyt hinnat ylittäisivät nämä, joten uudessa taustassa on käytössä 49,99 € ja 55,00 €
(api/_lib/kokohinnat.js). Hinta vaihtuu koon mukaan tuotesivulla, korissa ja kassalla, ja palvelin laskee sen
itse. Hupparien katesääntö on 10 %, muiden tuotteiden 20 %. Alle rajan jäävä koko piilotetaan ja muut koot jäävät
myyntiin. Kaikkien 2 988 hupparivariantin kate on positiivinen: S-2XL mediaani 17,3 % (7,86 €), 3XL+ 14,3 %
(7,06 €). Ainoastaan ICE AATANA -hupparin 3XL-5XL (8,7 %) piilotetaan. Testisivulla on nyt myynnissä 163 hupparia
(aiemmin 0), myös molemmat Tonnin seteli -hupparit kaikissa koissa S-5XL. Laskelma: KATTEET.md, "Hupparien hinta
27.10.2026". Testit 1143 ok. Testisivu tarkistettiin kolmella User-Agentilla: 200, hinta ja Uusiku Oy näkyvät.
Tuotantoon (huumorikauppa.fi, Lovablen kassa) muutos tulee vasta käyttöönotossa.

**DNS (KAYTTOONOTTO.md, "DNS: Domainhotelli").** Domain on rekisteröity Domainhotellissa (Planeetta Internet Oy),
mutta nimipalvelimet ovat Cloudflaressa. Siksi Domainhotellin paneelin tietueet tulevat käyttöön vasta, kun
nimipalvelimet vaihdetaan Domainhotellin omiin (ns1/ns2.domainhotelli.fi, ns3.domainhotelli.com). Ohjeessa on koko
tietuelista julkisesta DNS:stä: Vercel A ja www CNAME, Zoho MX, SPF, DKIM, Google- ja Trustpilot-vahvistukset,
DMARC raporttiosoitteella huumorikauppa@gmail.com, Resendin MX, SPF ja DKIM sekä Vercelin `_vercel`-vahvistus.

**Domain uuteen Vercel-projektiin.** huumorikauppa.fi ja www.huumorikauppa.fi on lisätty projektiin huumorikauppa;
www ohjaa juureen (308). Domainit odottavat vahvistusta. Ne siirtyvät uuteen projektiin vasta, kun `_vercel`-TXT on
DNS:ssä, joten tietue lisätään käyttöönoton hetkellä. huumorikauppa.fi palvelee edelleen vanhasta projektista.

**Vanhan kassan Stripe-tili.** Lovablen create-checkout loi live-session (ei maksettu, vanhenee 24 tunnissa), ja
Stripen kassasivu kertoo tilin: `acct_1THtN1AhUyocG7PO`, "Huumorikauppa", huumorikauppa@gmail.com, tiliotemerkintä
HUUMORIKAUPPA. Tili ei ole inteller.info. Valmis sulkuohje on KAYTTOONOTTO.md:ssä ("Vanhan kassan sulkeminen"):
vanha webhook pois päältä ja salaisen avaimen kierto tällä tilillä, kun uusi kassa vastaa domainissa. Sulkemista ei
ole tehty.

**Avaimet ja kassatesti (klo 20.15).** STRIPE_SECRET_KEY ja STRIPE_WEBHOOK_SECRET tulivat Verceliin klo 20.10, ja
RESEND_API_KEY puuttuu vielä. Uusi tausta julkaistiin testiosoitteeseen, ja tulokset ovat:
- Kassa (scripts/kassatesti.mjs) loi live-sessiot kolmelle korille. 1 t-paita: 24,90 € + 6,90 € = 31,80 €.
  4 t-paitaa: ilmainen toimitus ja kahden tuotteen alennus, 94,64 €. Huppari 3XL: 55,00 € + 6,90 € = 61,90 €.
- Sessiot syntyvät Stripe-tilille `acct_1UVAUMPNXkES1q9G` ("Huumorikauppa", tiliotemerkintä Huumorikauppa). Se on eri
  tili kuin Lovablen kassan `acct_1THtN1AhUyocG7PO`.
- Tilaukset tallentuvat Neoniin (tila odottaa_maksua, rivit, hinnat ja Printify-variantit).
- Webhook toimii: käyttöönottotesti (`?tehtava=kayttoonottotesti`) vanhensi sessiot Stripen API:lla. Stripe lähetti
  `checkout.session.expired`-tapahtumat osoitteeseen /api/stripe-webhook, allekirjoitus hyväksyttiin, ja kaikki
  testitilaukset muuttuivat tilaan peruttu ("session vanheni").
- Printify-testitilaukset tehtiin kahdelle EU-painotalolle, OPT OnDemand (CZ) ja Textildruck Europa (DE, huppari
  3XL, kulu 41,08 € ilman ALV:tä). Tilausvahti hyväksyi molemmat, ja molemmat peruttiin ennen tuotantoa (tila
  canceled). Ensimmäinen peruutus epäonnistui, koska Printify ei peru tilausta, jonka kuluja se vielä laskee.
  Testi odottaa nyt tilaa on-hold, yrittää uudelleen ja hälyttää, jos peruutus ei onnistu (commit a36002a).
- Rajatun avaimen oikeudet (Checkout Sessions Write, Payment Intents Read) riittävät session luontiin, hakuun ja
  vanhennukseen. Lisäoikeuksia ei tarvita.
- Tilausvahvistus Resendillä on testaamatta, koska RESEND_API_KEY puuttuu. Tarkistus jatkuu 10 minuutin välein.
- Maksua ei tehty. Maksettu tilaus menee automaattisesti Printifyn tuotantoon, joten ensimmäinen oikea maksu on
  ensimmäinen oikea tilaus.

Huomioita Stripen hallintaan: kassasivun maksutavat ovat kortti, Link, Bancontact, EPS, MB Way ja Satispay.
MobilePay ja Klarna eivät ole käytössä (Settings > Payment methods). Julkinen tukisähköposti puuttuu (Settings >
Public details).

Uutta kassaa ei ole julkaistu huumorikauppa.fi:hin. Julkaisu odottaa Resendin testiä ja Stripe-tilin aktivointia,
jota rajattu avain ei pysty tarkistamaan.

## 27.10. ilta: Lovablen kassan tappioesto, Vercel Cron, EU-kopiot, käyttöönoton valmistelu

Lovableen ei ole enää pääsyä, joten Lovablen kassaa (3,90 €, ilmainen toimitus 60 eurosta) ei voi julkaista.
Uusi tausta on ainoa tie korjata kassa.

**Väliaikainen tappioesto (main, commit 5b3a66c):**
- Hintojen nosto ei onnistu ilman Lovablea. Lovablen kassa lukee hinnat Supabasen products-taulusta (ei Printifystä).
  Kirjoitus vaatii Supabasen ylläpitäjän oikeudet. Lovablen yöllinen synkronointi päivittää joka rivin joka yö ja
  asettaa vaatteille kiinteän kategoriahinnan (t-paidat 24,90 €, hupparit 49,90 €, bodyt 24,90 €, pitkähihaiset
  39,90 €; 438 riviä poikkeaa Printifyn hinnasta, vaikka rivi on päivitetty Printifyn muutoksen jälkeen). Printifyn
  hinta siirtyy kassalle vain muissa kategorioissa, ja niissä yksikään tuote ei ole tappiollinen yksinään.
- `scripts/live-kassa-tappiot.ts` laski kaikki 468 näkyvää tuotetta nykyisellä kassalla: kaikki yksittäiset, kaikki
  parit ja heikoimpien kolmikot. Tappiollisia koreja oli 7 901, ja heikoin -5,64 € (ICE AATANA -huppari 3XL ja
  4XL-paita). Yksinään tappiollisia variantteja oli 13. Syynä ovat 3XL-5XL-koot: ilmaisen toimituksen korissa niiden
  osuus jää negatiiviseksi.
- Korjaus: sivusto ja ostoskori piilottavat variantit, joiden osuus ilmaisen toimituksen korissa jää alle Stripen
  kiinteän maksun 0,25 €. Ne ovat 344 kokoa 3XL-5XL (31 tuotetta) ja lisämyynnin tarra (se-oli-tonnin-seteli-tarra,
  301 kaikkiin tuotteisiin). Tavallisia kokoja S-2XL ei piilotettu. Tulos: 0 tappiollista koria, heikoin osuus
  0,56 €. Lista: `api/_lib/lovable-kassa-tappio.js`. Ostoskorin "Lisää tarra" -ehdotus on poissa niin kauan kuin
  Lovablen kassa on käytössä.
- Palautus: oma-tausta-haarassa lista on tyhjä, joten koot ja tarra palaavat itsestään, kun haara yhdistetään mainiin
  käyttöönotossa.
- Tarkistettu curlilla kolmella User-Agentilla: etusivu, tuotesivu ja ostoskori 200, tarra 301; lista on
  tuotannon JS:ssä.

**Ajastetut työt Vercel Croniin (oma-tausta, 6c6de64):**
- GitHubin CRON_SECRETiä ei tarvita.
- `vercel.json` (projekti Pro-tasolla):
  - valvonta tunnin välein (:17)
  - päivän yhteenveto 04 ja 05 UTC
  - varianttien saatavuus viiden minuutin välein klo 05-06 UTC
  - katetarkistus maanantaisin (`?tehtava=katetarkistus`, logiikka `api/_lib/katevalvonta.js`)
- Poistettu työnkulut tilausvalvonta, paivayhteenveto ja katetarkistus sekä saatavuus.yml:n varianttityö.
  GitHubiin jäivät vain salaisuuksia vaatimattomat (linkit, sivujen saatavuus).
- CRON_SECRET oli jo Vercelissä ja `.env.cron.local`:ssa (600).
- Testiosoitteessa tarkistettu: ilman avainta 401, valvonnan kuiva-ajo ok, katetarkistus ok.

**EU-kopiot (oma-tausta, 91b7f5b ja d1b7b78):**
- 8 uutta EU-kopiota 11:stä Printifyyn (ei julkaistu, vanhoja ei muutettu eikä poistettu). Tekstitasot piirrettiin
  kuviksi.
  - t-paidat OPT OnDemand CZ: ois-viisaampi, slay-queen, super-aiska, maailman-paras-aiti. Heikoin kate 24,4 %.
  - hupparit Textildruck DE: slay-queen, super-aiska, maailman-paras-aiti, saatanan-tunarit.
- Ei tehty: maailman-paras-ystava-koriste, oma-tekstikuva-koriste ja oma-tekstikuva-lippis. Printifyssä ei ole
  EU-painotaloa keraamisille koristeille eikä lippiksille.
- Kanta päivitetty funktiolla `?tehtava=eu-siirrot`: 8 päivitetty, 692 jo valmiina, 0 virhettä. 35 piilotetusta
  32 osoittaa EU-kopioon.
- Lahjasivujen testiraja palautettu 8:aan oma-tausta-haarassa. Staattisessa HTML:ssä sivuilla on 9-13 tuotetta.
- Mainissa uudet Printify-tuotteet tulevat Lovablen synkronoinnissa kaksoiskappaleina (`slug-xxxxxx`), jotka
  piilotetaan ja ohjataan 301:llä kuten ennenkin.

**Käyttöönoton valmistelu (oma-tausta):**
- MYYJA=uusiku asetettu Vercelin production-ympäristöön. Testiosoitteessa Uusiku Oy ja Y-tunnus 3653666-7
  kaikilla sivuilla.
- `scripts/kayttoonotto.sh` tekee kaiken yhdellä komennolla:
  - tarkistaa avaimet ja ajaa testit
  - julkaisee
  - curlaa sivut kolmella User-Agentilla ja tarkistaa tuotelähteen
  - ajaa `scripts/kassatesti.mjs`:n (Stripe-sessio molemmille toimitussäännöille, ei maksa), valvonnan ja
    Resend-domainin
- `?tehtava=resend-domain` lisää huumorikauppa.fi:n Resendiin (EU) ja palauttaa tarkat DNS-tietueet.
  KAYTTOONOTTO.md:ssä on tietueiden taulukko Cloudflarea varten:
  - MX ja SPF `send`-alitunnukselle
  - DKIM `resend._domainkey`
  - DMARC-raporttiosoite vaihdettava pois lovable.dev:stä
- Vanha kassa:
  - oman taustan koodi ei kutsu Lovablen kassaa missään (testi)
  - vanhan Vercel-projektin `*.aarni-ais-projects.vercel.app`-osoitteet ohjautuvat huumorikauppa.fi:hin
  - Intellerin Stripe-avaimen kierto ja vanhan webhookin poisto sulkevat Lovablen kassan lopullisesti
- Löydetty ja korjattu käyttöönoton este: testiosoitteessa sovellus kaatui latauksessa (`supabaseUrl is
  required`), eikä ostoskoriin voinut lisätä tuotteita. Nyt selaintesti on 4/4 ilman virheitä.
- Alatunnisteen ja etusivun uutiskirje tallentuu omaan tauluun. HUUMORI5-lupaus poistettu: oma kassa hyväksyy
  alennuksen vain, jos kate pysyy vähintään 30 %:ssa.
- Kassaa ei voitu testata testiavaimilla: Vercelissä ei vielä ole STRIPE_SECRET_KEY:tä,
  STRIPE_WEBHOOK_SECRET:iä eikä RESEND_API_KEY:tä (tarkistettu 27.10. illalla).

**Käyttöönotosta puuttuu:**
1. Stripe-avain ja webhook-salaisuus (Uusiku Oy) sekä Resend Vercelin Marketplacesta (`RESEND_API_KEY`).
2. Päätös huppareiden hinnasta. Uudessa taustassa katesääntö (20 %) piilottaa 49,90 eurolla kaikki hupparit:
   testiosoitteessa näkyy 306 tuotetta (305 paitaa ja 1 koriste), ja selaimessa lahjasivuilla on 5-7 tuotetta.
   20 % vaatii S-2XL noin 52,90 € ja 3XL+ noin 59,50 €.
3. `scripts/kayttoonotto.sh`, Resendin DNS-tietueet Cloudflareen, domain projektiin (KAYTTOONOTTO.md kohta 9), vanhan
   webhookin poisto ja Intellerin Stripe-avaimen kierto, sitten oma-tausta mainiin.

## 27.10. päivä: toimitushinta, esikatselu, rakenteinen data, EU-reititys, lisämyynti

**Edellisen yön kohtien tila:** uusi tausta (taulut, tuonti EU-kopioineen, kulut, tilattavuus) tehty; CRON_SECRET
Vercelissä ja .env.cron.local-tiedostossa, GitHub-secret puuttuu (gh-työkalua ei ole); Resend ja Uusiku Oy:n Stripe
puuttuvat. Yritysvaihto: ajastettu vaihto poistettu (työnkulkua ei ole, raw-osoite 404, ei paikallista ajastinta),
vaihto vain Vercel-muuttujalla MYYJA=uusiku, sivuilla näkyy Inteller (curl kolmella User-Agentilla). Joulu:
takaraja, /joululahjat ja alasivut (miehelle, naiselle, työkaverille, isälle, äidille, eläkeläiselle, alle 30 €
= /lahjat/alle-30-euroa), 6 blogia, sivukartta ja llms.txt tehty. Syöte 0 virhettä. ef099df tuotannossa
(uusi saatavuusdata löytyy tuotannon index-chunkista).

**Toimitushinta.** Sivusto, toimitusehdot, rakenteinen data ja syöte: 6,90 €, ilmainen 79 eurosta. Live-kassa
(Lovablen create-checkout) veloittaa yhä 3,90 € ja ilmainen 60 eurosta: repossa muutos 29.9.2026 (ca193d1), mutta
funktiota ei ole julkaistu Lovablessa (tilaus 26630629.21: 19,90 + 3,90 = 23,80 €). Oikea arvo on 6,90 € / 79 €:
vanhalla säännöllä t-paita + Textildruck-huppari on tappiollinen (-1,27 €), uudella jokainen kori on positiivinen
(KATTEET.md). Korjaus vaatii create-checkout-funktion julkaisun Lovablessa (omistaja). Sivustolla toimitusmaksu nyt
näkyvissä etusivun luottamuspalkissa ja jokaisen sivun yläpalkissa ("Toimitus 6,90 €, ilmainen 79 eurosta"),
tuotesivulla hinnan alla ja ostoskorissa kuten ennen. "Yli 79 €" korjattu muotoon "79 eurosta" / "vähintään 79 euron"
(kassa antaa ilmaisen toimituksen myös tasan 79 eurosta). Commit 80750b8.

**Tuotesivun esikatselun jumi.** Juurisyy: julkaisun jälkeen välimuistista tullut vanha HTML viittasi poistuneisiin
/assets/-tiedostoihin, ja SPA-rewrite palautti niiden tilalle HTML:n tilalla 200, joten sovellus ei käynnistynyt
eikä esikatselu poistunut. Korjaus 019b9ef: rewrite ei koske .js/.css/assets-polkuja (vanha chunk nyt 404),
sovelluksesta riippumaton käynnistysvahti lataa sivun kerran uudelleen tai näyttää staattisen sivun, esikatselun
aikaraja 2 s. Selaintesti tuotannossa 7/7 OK kahden julkaisun jälkeen.

**Rakenteinen data.** Tarkistettu 28 tuotesivua ja 12 muuta sivua. Ainoa virhe: ajatusviivat tuotenimissä ja
-kuvauksissa JSON-LD:ssä (20/28 tuotesivulla ja listasivuilla). Korjattu (5a71b72). Product, Offer, shippingDetails
(6,90 € / 79 € konfiguraatiosta), hasMerchantReturnPolicy (14 pv, personoiduille ei palautusta) olivat kunnossa.
aggregateRatingia ei ole millään sivulla, koska vahvistettuja tuotearvosteluja ei ole. Pyydä indeksointi
Search Consolessa: /joululahjat, /joululahja-elakelaiselle, /joulun-viimeiset-tilauspaivat,
/joululahja-miehelle-jolla-on-kaikki, /joululahja-isalle, /joululahja-tyokaverille, /lahjat/pikkujouluihin,
/salainen-joulupukki-lahja, /blogi/hauska-joululahja-naiselle, /blogi/joululahja-aidille-hauskat-ideat,
/blogi/joululahja-papalle-ja-ukille, /blogi/joululahja-elakelaiselle, /blogi/joululahja-kaverille-alle-30-euroa,
/blogi/joululahja-veljelle, /blogi/hauskat-joululahjaideat-miehelle-2026,
/blogi/joululahjan-viimeiset-tilauspaivat-2026, /tonnin-seteli-paita, /hauskat-t-paidat, /kategoria/hupparit,
/isanpaivalahja, /tuote/tonnin-seteli-t-paita, /tuote/se-oli-tonnin-seteli-t-paita, /tuote/tonnin-seteli-huppari,
/tuote/joulupukin-virallinen-testaaja-t-paita-jouluun, /tuote/tonttu-koeajalla-t-paita-jouluun.

**Myydyimmät designit 1.6. alkaen** (Printify-tilaukset, korvaukset ja testit pois): Tonnin seteli 5 kpl (kate 30,6 %),
40 vuotta töitä, nyt ikuinen viikonloppu 2 mukia (US, -48,8 %), Maailman paras ÄITI 1, 60v kokenut, ei vanha 1,
ICE AATANA 1. Puuttuvia tuotetyyppejä ei luotu: yksikään ei yllä 30 %:iin EU-painotalolla kilpailijahinnalla
(muki vaatisi 26,90 € vs Stuntman 12,90 / Meemirotta 14,99; juliste 24,90 € vs 15,00; lasten paita 24,90 € vs
18,95; tarralle ei ole kilpailijahintaa, 30 % vaatisi 14,90 €). Kaikilla viidellä on jo huppari. Laskelma ja
kilpailijoiden osoitteet: data/uudet-tuotteet/myydyimmat-2026-10-27.json. Tuotesivuilla nyt "Sama design myös:
Huppari · Tarra · Juliste" -linkit (b3fcdc0), jotka poimivat uudet tuotteet nimestä automaattisesti.

**Keskiostos.** Vaihtoehdot: ilmaisen toimituksen rajan lasku ja "2 tuotetta -10 %" tekevät korista tappiollisen,
hylätty. "Lisää tarra 11,90 €" pitää jokaisen korin positiivisena, kun sitä ei ehdoteta hupparikoriin. Toteutettu
ostoskoriin (80750b8), laskelma KATTEET.md:ssä (oma-tausta bc642cf). Arvio +0,45 ... +1,12 €/kk nykyliikenteellä.
Isompi alennusvipu "2 tuotetta -5 %" on valmiina oman taustan kassassa.

**EU-reititys (tilaus 26630629.21 painettiin Yhdysvalloissa).** Näkyviä tuotteita 502 (8050 varianttia), joista EU:ssa
painetaan 467 (OPT OnDemand CZ 292, Textildruck Europa DE 175). EU:n ulkopuolella 35 (949 varianttia): 32 Printify
Choicella (sijainti Miami, Suomen tilaukset kansainvälisellä toimituksella) ja 3 yhdysvaltalaisella painotalolla.
Kaikki 35 piilotettu (301 /kaikki-tuotteet, pois sivukartasta ja syötteestä), ohjattu 0, koska yhdenkään EU-kopio ei
ole kaupassa näkyvänä rivinä. 24:llä on EU-kopio Printifyssä (lähinnä 30-60v ikäpaidat): kun Lovablen rivi osoittaa
kopioon, tuote palaa näkyviin itsestään. 11:lle (esim. Super äiskä, Slay queen, Maailman paras äiti -palkinto) pitää
tehdä EU-kopio. Seitsemällä laskeutumissivulla on nyt alle 8 tuotetta (äidille, vaimolle, 40-60-vuotiaille).
Uudelleenajo yön synkronoinnin jälkeen: `npx tsx scripts/eu-reititys.mjs` (ympäristömuuttujat kuten muissa
Printify-skripteissä), sitten `npx vitest run` ja commit. Commit 9bf84e0.

**Tarkistukset:** jokainen julkaisu curlilla kolmella User-Agentilla (selain, Googlebot, facebookexternalhit), kaikki
sivut 200, piilotetut 301, vanha chunk 404. Testit 896/896.

## 27.10. yön synkronoinnin tarkistus (03.40 UTC)

- Lovablen synkronointi 03.17 UTC toi kauppaan 15 uutta joulu- ja eläkeläispaitaa (t-paidat, 24,90 €), 12 julistetta (seinataulut, 22,90 €) ja Se oli tonnin seteli -tarran (tarrat, 11,90 €). Kaikki ovat aktiivisia oikeassa kategoriassa.
- Tarrat-kategoria: /kategoria/tarrat vastaa 200 kolmella User-Agentilla, ja uusi tarra on myynnissä (/tuote/se-oli-tonnin-seteli-tarra 200).
- Printifyn hintavertailukopiot (copy-of-eu-hintavertailu-*, myös 99,90 €:n rivit) tulivat kauppaan aktiivisina, mutta ne ohjautuvat 301:llä /kaikki-tuotteet-sivulle eivätkä näy listoissa eivätkä syötteessä.
- Tappiotarkistus (scripts/tappiotarkistus.mjs, Printify-kulu ilman ALV:tä): 108 tuotetta, 279 tappiollista varianttia. Uusina vain kaksi hintavertailukopiota (jo piilossa). Uudet paidat, julisteet ja tarra ovat voitollisia kaikissa varianteissa. Kuusi riviä poistui listalta: viisi mukiriviä, jotka synkronointi osoitti uusiin tuotteisiin (piilossa mukeina, 301), ja ice-aatanahuppari, jonka kaikki variantit ovat nyt voitollisia.
- Saatavuusdata päivitetty (printify-saatavuus --vain-tappio): jokaisella näkyvällä variantilla on positiivinen kate.

## 27.10.: uusi tausta valmis Stripeä vaille, joulumyynti, syöte

**Uusi tausta (testisivu huumorikauppa-five.vercel.app, tietokanta Neon Frankfurt):**
- Taulut luotu (11), 781 tuotetta tuotu ja aktiivisina, kaikki 692 EU-siirtoa kytketty (0 riviä vanhoissa
  tuotteissa), Printify-kulut kaikilla riveillä, tilattavuus tarkistettu: 162 varianttia, joita Printify ei nyt
  valmista, piilotettu. Tuotesivut ja /api/products lukevat tietokantaa. Ajettiin kertaluontoisella, CRON_SECRETillä
  suojatulla tehtävällä, joka poistettiin käytön jälkeen.
- Korjattu: päivittäinen saatavuustarkistus kaatui oikeaa tietokantaa vasten (JSON koodattiin kahdesti).
- CRON_SECRET luotu Verceliin ja tiedostoon .env.cron.local. RESEND_API_KEY ei ole Vercelissä (Resend-integraatio
  ei ole lisännyt sitä). Puuttuvat avaimet: STRIPE_SECRET_KEY ja STRIPE_WEBHOOK_SECRET (Uusiku Oy:n uusi Stripe),
  RESEND_API_KEY. Tarkka go-live-lista KAYTTOONOTTO.md:ssä.

**Yritysvaihto (korjaus):** 1.11. ajastettu vaihto poistettu (GitHub Actions -työnkulku ja paikallinen ajastin).
Myyjä vaihtuu Uusiku Oy:ksi vain ympäristömuuttujalla MYYJA=uusiku, joka asetetaan samassa julkaisussa kuin Uusiku Oy:n
Stripe ja uusi tausta. Tuotannossa näkyy Inteller (tarkistettu), eikä mikään vaihdu 1.11.

**Joulu (tuotannossa):**
- Viimeinen tilauspäivä tilaushistoriasta (22 tilausta): pahin havaittu tuotanto + kuljetus + 2 arkipäivän puskuri
  antaisi t-paidoille ja hupparille 30.11., mutta kaikille painotaloille ei ole toimitusdataa ja data on sesongin
  ulkopuolelta, joten kaikki tuotetyypit pysyvät 20.11.2026:ssa (ei lupausta, jota data ei tue).
  "Tilaa viimeistään pe 20.11.2026, niin ehtii jouluksi" tuotesivulla hinnan alla, ostoskorissa ja etusivulla;
  poistuu automaattisesti 20.11. klo 23.59. Havainto: yksi kesän tilaus kesti ovelle noin 16 arkipäivää, yli
  sivuston lupauksen 3-10 arkipäivää.
- Joululahjasivut: uusi /joululahja-elakelaiselle; /joululahjat linkittää kaikkiin alasivuihin (miehelle, naiselle,
  työkaverille, isälle, äidille, eläkeläiselle, alle 30 €) ja takaisin. Sivukartta ja llms.txt päivitetty.
- 6 uutta blogiartikkelia: /blogi/hauska-joululahja-naiselle, /blogi/joululahja-aidille-hauskat-ideat,
  /blogi/joululahja-papalle-ja-ukille, /blogi/joululahja-elakelaiselle, /blogi/joululahja-kaverille-alle-30-euroa,
  /blogi/joululahja-veljelle (tuotekortit, UKK + FAQPage). Vanhojen URLien aiheet ennallaan.

**Merchant-syöte (tuotannossa):** 2197 virhettä -> 0 (vaatteilta puuttui color, size, gender ja age_group
maksuttomia listauksia varten; 309 virheellistä Google-kategoriaa). Lisäksi otsikoiden ajatusviivat ja kuvausten
sisäiset #kaupunki-tagit siivottu. Validaattori: scripts/validoi-syote.mjs. Jäljellä varoitus: syöte on
tuotetasoinen (koko "S/M/L/XL/2XL"); varianttitasoinen syöte vaatisi Lovable-lähteen muutoksen.

**Keskiostos (laskelma KATTEET.md, toteutus uuteen taustaan):** paras katteen kannalta on "2 tuotetta -5 %" nykyisellä
toimituksella 6,90 € / ilmainen 79 €:sta: jokainen ostoskorityyppi pysyy plussalla (heikoin 0,21 €). Ilmaisen
toimituksen raja 50-69 € tai 5,90 € / 60 € ja -10 % tekisivät osasta koreja tappiollisia (paita + huppari). Arvioitu
vaikutus +2-5 €/kk nykyisellä ja +4-10 €/kk tuplaliikenteellä. Uuden taustan toimitusehdot palautettiin 6,90 € / 79 €.

**Uudet tuotteet:** 15 joulu- ja eläkeläispaitaa Printifyyn Textildruck Europalle (Saksa), 24,90 €, kate 31,7 %
(Kinkkukooma alkaa klo 14, Joulupukin virallinen testaaja, Eläkkeellä. Kiireinen silti jne.). Hupparit ja mukit eivät
yllä 30 %:iin kilpailijoiden hintakaton alla (paras huppari Atelier Katanga 23,6 % 51,90 €:lla, muki 20,8 %), joten
niitä ei luotu. Havainto: Textildruckin paita (31,7 %) on katteeltaan parempi kuin nykyinen OPT-paita (28,5 %).

## 27.10.: kauppa siirtyy Uusiku Oy:lle 1.11.2026

- Yritystiedot yhdestä lähteestä (api/_lib/yritys.js, src/config/yritys.ts): Uusiku Oy, Y-tunnus 3653666-7,
  ALV-numero FI36536667, Capellan puistotie 21, 00580 Helsinki (YTJ, avoindata.prh.fi, haettu 27.10.2026),
  huumorikauppa@gmail.com. Vaihto tapahtuu 1.11.2026 klo 00.00 Suomen aikaa: selaimessa heti, esirenderöidyssä
  HTML:ssä ajastetulla uudelleenrakennuksella (GitHub Actions .github/workflows/yritysvaihto.yml 31.10. klo 22.05 UTC
  ja varalla paikallinen ajastus 22.15 UTC). KORJATTU 27.10.: ajastus poistettu, vaihto MYYJA-muuttujalla (yllä).
- Päivitetyt kohdat: alatunniste (myös ALV-numero ja osoite), toimitusehdot (myyjä ja myyjän yhteystiedot),
  tietosuojaseloste (rekisterinpitäjä), Tietoa meistä, yhteystiedot, UKK, rakenteinen data (Organization: legalName,
  taxID, vatID, osoite), llms.txt. Oman taustan tilausvahvistus ja kaikki sähköpostit: myyjän tiedot alatunnisteessa ja
  ALV-erittely (sisältää ALV 25,5 %).
- Seniorituki: mainos poistettu eläkelahja-artikkelista; testi estää maininnat sivustolla. Oman taustan
  hälytysosoite siirretty koodista Vercelin ympäristömuuttujaan OMISTAJA_EMAIL (hälytykset menevät samaan osoitteeseen).
- Ei vaihdettavissa tästä repositoriosta (omistaja): Stripen yritysnimi ja kuitit, Lovablen tilausviestit,
  Google Merchant Center ja Business Profile, Printifyn laskutustiedot, Wikidata (Q139915256).
- KATTEET.md: Printify perii ALV:n EU:ssa myös yritysasiakkailta, joten ALV-tunnuksella ei saa käännettyä
  verovelvollisuutta (Printifyn ohjekeskus). Uusiku Oy vähentää Printifyn ALV:n; katteet ovat samat kuin
  käännetyllä verovelvollisuudella, ero on kassavirrassa (ALV maksetaan ensin, noin 18 €/kk nykyisellä myynnillä).
  Vähennysoikeus Printifyn laskuista kannattaa varmistaa tilitoimistolta.

## 26.-27.10.: tilauskatteet, tappioesto, EU-painotalot, blogit

**27.10. lisäksi:**
- Blogit: peitto-, seinätaulu- ja vauvabody-artikkelit palautettu alkuperäisiin aiheisiinsa samoihin osoitteisiin
  (myyntilupaukset piilotetuista tuotteista poistettu, ostokehotukset ohjaavat myytäviin tuotteisiin). Uudet aiheet
  omissa osoitteissaan: /blogi/hauskat-hupparit-lahjaksi, /blogi/hauskat-koristeet-lahjaksi,
  /blogi/lahja-tuoreille-vanhemmille, "Lue myös" -linkit molempiin suuntiin. Tarra-artikkelin aihe ei ollut vaihtunut.
- Sivukartta: 16 blogiartikkelia puuttui sivukartasta (esim. hauska-lahja-pomolle, hauskat-valmistujaislahjat-2026).
  Nyt kaikki 59, ja testi vertaa sivukarttaa blogidataan.
- Vanhoja Printify-tuotteita ei poisteta (omistajan linjaus): tappioesto ja piilotukset riittävät, kunnes oma tausta on
  tuotannossa.
- Havainto: heti julkaisun jälkeen selaintesti on kahdesti seitsemästä jäänyt tuotesivun esikatseluun yli 5 s
  (kylmä välimuisti). Selvitetään.

**Katteen laskentaperuste:** Tmi Inteller on ALV-rekisterissä (FI35836772), joten Printifyn veloittama ALV
vähennetään eikä ole kulu. Kaikki katteet (KATTEET.md, tilausvahti, aamuyhteenveto) lasketaan Printify-kululla
ilman ALV:tä. T-paidat 24,90 €: kate 28,5 % (7,22 €), hupparit 49,90 €: 10,6 % (4,80 €). Kumpikaan ei ylitä 30 %:a.

**Tuotannossa (tarkistettu curlilla kolmella User-Agentilla ja selaimella, ostoskoriin lisäys toimii):**
- Tappioesto: 301 varianttia, joissa Printify-kulu toimitettuna on suurempi kuin myynti ilman ALV:tä miinus Stripe,
  piilotettu valitsimista. Kokonaan pois myynnistä (301-ohjaus, ei syötteessä eikä sivukartassa): oma teksti -peitto,
  -seinätaulu, -tarra ja -body sekä kaksi tappiollista paitaa. Merchant-syötteessä 474 tuotetta. Sivujen, UKK:n ja
  blogien tekstit päivitetty, ettei niissä luvata piilotettuja tuotteita.
- Blogit: 56 artikkeliin aiheeseen sopivat tuotekortit tekstin keskelle ja loppuun, "Katso tuotteet" -painike ja
  linkit laskeutumissivuille, myös esirenderöityyn HTML:ään (571 tuotelinkkiä). Search Consolen blogien
  tuotelistavirhe korjattu: kortit olivat Product-mikrodataa ilman offers-kenttää; nyt ItemList, validaattori 56/56.
- Nopeus: tuotesivun LCP 7,1 s -> 3,5 s (Mumbain reunalta mitattuna). Riski: heti julkaisun jälkeen kylmällä
  välimuistilla sivun vaihto esikatselusta oikeaksi sivuksi voi kestää yli 5 s (havaittu kerran neljästä).

**Tilaukset (Printify):** Niinan tilaus lähetetty tuotantoon 26.10. (6adf04009ca30bc3fe08c777, kulu 10,10 + 3,49
toimitus + 3,47 ALV, painotalo 417 Liettua, arvio lähtö 27.-29.10.). Tilauskohtaiset katteet 1.6.2026 alkaen
(17 tilausta): myynti alv 0 454,58 €, Printify ilman ALV:tä 381,00 €, nettokate 60,76 € (13,4 %), keskimäärin
3,57 € tilausta kohden. Liisan muki (9.10.) painettiin Yhdysvalloissa, koska tuote oli kiinteästi SPOKE (US)
-painotalolla; kolme samanlaista mukitilausta tekivät tappiota. Printify Premium ei kannata nyt (30 pv
bruttoalennus 21,30 €, maksu 34,99 €).

**EU-painotalot:** lisäksi 132 hupparia Printify Choicelta Textildruck Europalle (heikoimman koon kate 9,0 % -> 15,8 %)
ja 3 mukia OPT:lle. Lovablen yösynkronointi kuitenkin palauttaa kaupan rivit vanhoihin tuotteisiin (virhe
printify-sync.ts:ssä: tunnus-kartta luetaan kerran ennen silmukkaa), joten elävän kaupan tilaukset menevät yhä
vanhoille painotaloille (156 näkyvää riviä, Choice voi reitittää myös Yhdysvaltoihin). Korjaus vaatii Lovablen
tietokannan muutoksen tai vanhojen Printify-tuotteiden poiston (omistajan päätös). Oma tausta tuo EU-kopiot oikein.

**Oma tausta (oma-tausta-haara):** tilausvahti ennen tuotantoa: EU:n ulkopuolinen painotalo tai kulu yli myynnin
ilman ALV:tä pysäyttää tilauksen ja hälyttää heti. Aamuyhteenvedossa toteutunut kate ja Premium-laskuri.

**Gelato:** hintoja ei saatu (sivut palauttavat 403, katalogi vaatii tilin). KATTEET.md:ssä rajahinnat, joilla
Gelato olisi Printifyä parempi.

## 26.10.: keskiostos, Tonnin seteli, rakenteinen data, evästeet, uudet tuotteet

**Tuotannossa (tarkistettu curlilla kolmella User-Agentilla):**
- /tonnin-seteli-paita: laskeutumissivu (15 tuotetta, Tonnin Seteli -tuotteet ensin, UKK, BreadcrumbList + ItemList +
  FAQPage), etusivun nosto heti karusellin jälkeen ja linkkilohkot sivuilla /joululahjat, /joululahja-isalle ja
  /joululahja-miehelle-jolla-on-kaikki.
- "Sopii yhteen" -suositukset tuotesivulle, ostoskoriin ja ostoskorin sivupaneeliin (sama teksti toisessa
  kategoriassa ensin, esim. paita -> samanteemainen huppari). Otsikko ei väitä yhteisostoja, koska ostodataa ei ole.
  Sivupaneelin aiempi "Muut ostivat myös" poistettu samasta syystä.
- Korjattu virhe: ostoskorin sivupaneeli ja poistumisikkuna lupasivat ilmaisen toimituksen 60 €:sta, vaikka kassa
  veloittaa 79 €:iin asti. Nyt kaikki lukevat src/config/toimitus.ts:n ja paneelissa on "X € ilmaiseen toimitukseen".
- Rakenteinen data: jokaisella tuotteella priceValidUntil, handlingTime + transitTime (yhteensä 3-10 arkipäivää),
  tyypitetty seller, shippingDetails ja hasMerchantReturnPolicy; personoiduilla tuotteilla MerchantReturnNotPermitted.
  Validointiskripti (npm run validoi:tuotedata): 481/481 tuotesivua kunnossa (ennen 0/481).
- Evästeet, Consent Mode v2: Google Analytics, mainossignaalit ja Google-asiakasarviot latautuvat vasta suostumuksen
  jälkeen (ennen GA latautui heti). Valinnat: hyväksy kaikki, vain välttämättömät, valitse itse (analytiikka /
  markkinointi). "Evästeasetukset" alatunnisteessa, suostumuksen peruminen poistaa _ga-evästeet. Tarkistettu
  headless-Chromella: ensikäynnillä ei yhtään pyyntöä Googlen seurantapalveluihin.
- Merchant-syöte: custom_label_0 kateluokka (kate-20-30: 301, kate-alle-20: 179), custom_label_2 myydyin (Tonnin Seteli
  -paita ja -huppari, Maailman paras äiti -huppari) / muut. Kampanjaa ei käynnistetty.
- Asiakastekstit: "Saatat myös tykätä" -> "Lisää samasta kategoriasta", 404-sivun epävarma lause korjattu.

**Nopeus:** ensimmäinen versio (esirenderöity tuotesivu näkyviin heti) jäi tuotannossa esikatselutilaan, koska sivu
odotti tuotetietoja selaimen Supabase-haulta; se peruttiin heti. Korjattu versio upottaa tuoterivin sivuun ja vaihtaa
oikean sivun esiin heti, testattu Vercel-esikatselussa ja tuotannossa (ostoskoriin lisäys toimii, 4 sivua, tuoreet
selaimet). Lighthouse mobiili tuotannossa, 3 ajon mediaani:

| Sivu | Suorituskyky | LCP | FCP | TBT | CLS |
|---|---|---|---|---|---|
| Etusivu ennen | 78 | 4,0 s | 3,6 s | 62 ms | 0 |
| Etusivu jälkeen | 80 | 3,7 s | 3,7 s | 20 ms | 0 |
| Tuotesivu ennen | 69 | 7,1 s | 3,2 s | 59 ms | 0,039 |
| Tuotesivu jälkeen | 83 | 3,5 s | 3,5 s | 14 ms | 0 |

Tavoite alle 2,5 s ei vielä täyty. Mittauskoneen Vercel-reuna on Mumbai (TTFB noin 0,7 s), joten luku ei vastaa
suomalaista käyttäjää. Seuraavat askeleet: pääkuvan leveydet staattisiksi tiedostoiksi buildissa (kuvaproxyn
välimuistin ohilyönti noin 1,8 s), middlewaren kylmäkäynnistys (4,3 s kylmänä) ja pääpaketin blogidata (210 kt) erilleen.

**Uudet tuotteet Printifyyn (OPT OnDemand, Tšekki), tulevat kauppaan Lovablen yösynkronoinnissa:** 12 A3-julistetta
22,90 € (kate 31,5 %, Printifyn ALV:n kanssa 14,7 %): Se oli tonnin seteli, Tonnin seteli, Olen eläkkeellä, 60v kokenut
ei vanha, 100 % helsinkiläistä / tamperelaista / turkulaista / oululaista verta, 100 % eläkeläinen, Eläkkeellä
aamuherätys vapaaehtoinen, 40 vuotta töitä, 60v takuu mennyt; sekä Se oli tonnin seteli -tarra 11,90 € (33,2 %).
Paidat, hupparit, mukit, koristeet ja kassit eivät täytä 30 %:n katetta tai EU-vaatimusta nykyhinnoilla
(data/uudet-tuotteet/raportti-2026-10-26.md, haara oma-tausta).

**Oma tausta (haara oma-tausta, testisivu huumorikauppa-five.vercel.app):** katesääntö estää myynnin alle 20 %:n
katteella; paketit ja ensitilauskoodi vain, jos kate pysyy 30 %:ssa (nykyhinnoilla ei yksikään, joten molemmat
rakennettu mutta pois päältä). Sähköposti: uutiskirje suostumuksella, hylätyn ostoskorin muistutus 1 h ja 24 h
(vain suostumuksella), arviopyyntö 7 päivää toimituksesta, peruutuslinkki ja List-Unsubscribe kaikissa. Valvonta:
on hold -tilaukset uudelleen tuotantoon, hälytys info@seniorituki.fi:hin heti ja jos tilaus ei ole tuotannossa 2 h
jälkeen, seurantalinkki asiakkaalle, päivän yhteenveto klo 7 Suomen aikaa (eilinen myynti, kate euroina, jumissa
olevat, kuukauden kate vs 3 000 €).

**Hinnat:** ehdotus KATTEET.md:ssä (haara oma-tausta): kilpailijoiden korkein vastaava hinta t-paita 24,99 €, huppari
51,90 €. T-paita 24,90 €: kate 28,5 % ilman Printifyn ALV:tä, 11,0 % ALV:n kanssa. Huppari 51,90 €: 13,6 % / -7,8 %.
ALV-tunnus Printifyyn on suurin yksittäinen katteen parannus.

**Niinan tilaus:** luotu Printifyyn (6adf04009ca30bc3fe08c777, 60v kokenut ei vanha T-Paita, M / Graphite Heather),
ei lähetetty tuotantoon: tuote 10,10 € + toimitus 10,39 € + Printifyn ALV 25,5 % = noin 25,71 € > 25 €:n raja.

## 22.-25.10.: Printify-avain, saatavuus, EU-siirto ja tilaukset

Printify-avain toimii (kauppa 26630629), Vercelissä ja paikallisesti tiedostossa .env.printify.local.

**Saatavuus (tuotannossa, tarkistettu curlilla kolmella User-Agentilla):**
- 22.10.: kaupan valitsimista piilotettu 8 342 väri- ja kokoyhdistelmää 421 tuotteessa, joille ei ollut Printify-
  varianttia (kassa ei olisi voinut lähettää tilausta Printifyyn). Eniten kaupunkipaidoissa (28 kpl/tuote:
  heather-värit, joista Printifyssä oli käytössä vain S-koko).
- 25.10.: lisäksi 164 yhdistelmää 32 tuotteessa, joita Printify ei tällä hetkellä valmista (eniten "Maailman paras
  äiti" -paita 7, hupparit 6/tuote). Yhteensä tarkistettu 812 riviä ja 15 369 yhdistelmää; jokainen tilaamaton
  yhdistelmä on piilossa (5 542 kartan aukon perusteella, 164 Printifyn saatavuuden perusteella). Kokonaan
  valmistamattomia tuotteita 0, joten syöte ja sivukartta pysyivät ennallaan.
- "Lisää koriin" ei lisää yhdistelmää, jota ei valmisteta. Skripti: scripts/printify-saatavuus.mjs.

**EU-siirto (Printify, 23.-25.10.):** 557 tuotetta EU-painotaloihin: 279 t-paitaa (Printify Choice ja Monster
Digital -> OPT OnDemand, Tšekki, sama blueprint, kuvan asettelu säilyy) ja 278 mukia (-> OPT OnDemand Ceramic Mug EU).
Vanhat tuotteet jäävät Printifyyn. Ei siirretty: 136 Printify Choice -hupparia (Textildruck Europalla kate heikompi),
10 tuotetta, joiden alkuperäinen kuva on poistettu Printifystä, sekä tuotteet, joiden kohdepainotalo ei ole EU:ssa
(Harrier GB, MWW On Demand US, Jondo US).

**Lovable-synkronoinnin kaksoiskappaleet:** Lovablen yöllinen Printify-synkronointi (03.16 UTC) yhdistää samannimiset
Printify-tuotteet: kaupan perusrivi alkaa osoittaa EU-kopioon (varianttikartta rakennetaan siitä, joten tilattavuus
säilyy), ja toinen tuote saa uuden aktiivisen rivin slug-päätteellä (esim. ...-t-paita-0d6670). Lisäksi Coworkin
testikopiot (copy-of-olen-elakkeella-t-paita, ceramic-mug-eu) olivat kaupassa aktiivisina. Korjattu (29c2b69):
kaksoiskappaleet ja testikopiot piiloon kaikkialta (listat, syöte, sivukartta), 301 perusriviin. Oma tausta: tuonti
ohittaa vanhat tuotteet ja päivittää perusrivin EU-kopioon (ei kaksoiskappaleita).

**Tilaukset, jotka eivät menneet Printifyyn (selvitetty Printify API:sta):**
- Satu Valli (Tonnin Seteli T-Paita, 3XL / Musta, tilattu 25.10. klo 21.30 Suomen aikaa): tilaus on Printifyssä,
  mutta tilassa on-hold eikä sitä ole lähetetty tuotantoon. Tuote (69acb40b, OPT OnDemand) ja variantti 42122 ovat
  oikein, käytössä ja saatavilla, eikä tuotetta siirretty EU-siirrossa. Syy: Lovable-taustan tunnettu vika
  (submitPrintifyOrder luo tilauksen ja send_to_production epäonnistuu hiljaa, ILMAN-SUPABASEA.md juurisyy 1).
- Noora Saira (Tonnin Seteli T-Paita, S / Musta, 24.10.): tilaus on Printifyssä ja toimitettu (lähetetty tuotantoon
  25.10., seurantakoodi olemassa). Tilaus on tehty erilliseen kopiotuotteeseen (sittemmin poistettu), eli käsin
  (Cowork). Kaupan variantti (Musta|S = 38164) oli oikein.
- Niina Yläoutinen (22.10.): tilausta ei löydy Printifystä lainkaan. Lovable-tausta ei luonut sitä; syytä ei näe
  ilman Lovablen lokeja tai tilaustaulua (anon-avaimella ei pääsyä). Tilaus oli ennen EU-siirtoa, joten siirto ei
  vaikuttanut siihen.
- Johtopäätös: vika on Lovable-taustassa, ei main-haaran frontendissä (tuote- ja varianttitunnukset oikein) eikä
  EU-siirrossa. Pysyvä korjaus on oma tausta (kassa tarkistaa variantin, Printify-siirto uusii epäonnistuneet ja
  hälyttää). Cowork hoitaa nämä kolme tilausta.

**Katteet (oma-tausta: KATTEET.md, scripts/katteet.mjs):** T-paidat 24,90 €: kate 11,2 % -> 27,1 % EU-siirrossa
(nettokate 2,82 € -> 6,88 €). Hupparit 49,90 €: 9,8 %. Kaikki myynnissä olevat: 10,3 % -> 20,6 %. Yksikään tuote ei
yllä 40 %:iin nykyhinnoilla; kalleimmalla koolla 40 % vaatii t-paidalle 38,90 € ja hupparille 89,90 €. Printify
veloittaa lisäksi arvonlisäveron, jos tilillä ei ole ALV-tunnusta.

**Mukit:** EU-painotalolla (OPT OnDemand, kulu 5,88 € + toimitus 10,39 €) hinnalla 16,90 € ja toimitusmaksulla
6,90 € kate on 11,0 % (nettokate 2,09 €). Alle 40 %, joten mukit pysyvät piilossa. 40 % vaatisi hinnan 28,90 €.

## 21.10. ilta: konversio, isänpäivä ja toimituslinja

Tavoite: konversio 0,2 %:sta vähintään 1 %:iin ja isänpäivän myynti.

**Tuotannossa (tarkistettu curlilla tavallisella, Googlebot- ja tyhjällä User-Agentilla):**
- Isänpäivä: /isanpaivalahja (44 tuotetta, ideat isän tyypin mukaan) ja /hauska-isanpaivalahja (21 tuotetta,
  isävitsit). Päällekkäiset /isanpaiva-lahjat ja /lahjat/isanpaiva ohjataan 301:llä /hauska-isanpaivalahja-sivulle.
  Isänpäivä-valikko työpöydällä ja mobiilissa.
- Kausibanneri (src/data/campaignSchedule.ts, Suomen aika): isänpäivä 28.10.2026 klo 23.59.59 asti ("Tilaa
  viimeistään keskiviikkona 28.10.2026"), 29.10. alkaen joulun viimeinen tilauspäivä 20.11.2026, 21.11. alkaen piilossa.
  Vaihtuu itsestään myös avoimella sivulla. Testattu vaihtohetket.
- Tuotesivu: toimitusaika ja -hinta suoraan hinnan alla, 14 päivän palautusoikeus (personoiduille tuotteille oikea
  poikkeusteksti), "Lisää koriin" ensinäkymässä 360x740 ja 390x844, täysleveä pääkuva (srcset 480/800/1200),
  kiinteä ostopalkki mobiilissa, evästeilmoitus ohut palkki eikä koko ruudun ikkuna.
- Maksutavat: vain Visa ja Mastercard. Kassa (create-checkout) ei rajaa maksutapoja, joten muita ei luvata;
  Klarna, MobilePay, Apple Pay ja Google Pay poistettu alatunnisteesta, tuotesivulta ja kassasta.
- Alatunniste: Huumorikauppa (Inteller), Y-tunnus 3583677-2, Helsinki, huumorikauppa@gmail.com, ehdot.
- Kokoapu jokaiselle vaatteelle: keksityt senttimitat poistettu. Mittataulukko näytetään vain, jos tuotteen omassa
  kuvauksessa on mitat; muuten koot ja mittausohje. Yhdelläkään 484 vaatteesta ei ole mittoja kuvauksessa.
- Arviot: kaikki ennen ensimmäistä tilausta (25.3.2026) päivätyt ja päiväämättömät arviot piilotettu (64 tuotearviota,
  59 karusellin arviota, 3 äitienpäiväsivun arviota) ja siirretty tiedostoon src/data/arvostelut-arkisto.ts
  palautusohjeineen. Väitteet "4.8/5 (200+ arvostelua)" ja "Tuhansia tyytyväisiä asiakkaita" poistettu. Rakenteisessa
  datassa ei ole aggregateRatingia eikä Review-objekteja (testi valvoo).
- Toimitusehdot yhdessä tiedostossa src/config/toimitus.ts (noin 390 tekstiä 40 tiedostossa lukee sen). Testi
  estää kovakoodatut toimitushinnat. Mainissa 6,90 € / ilmainen 79 €:sta, koska nykyinen kassa veloittaa niin.
- Tarrat-kategoria: tosiasiaan perustuva teksti (oma teksti- tai kuvatarra, koot), /tarrat ja /hupparit 301.
- Suorituskyky: hero-kuva 2,6 Mt PNG -> WebP 37-258 kt (srcset), fontit eivät estä renderöintiä, tuotekuvan preload,
  tuotesivu hakee oman tuotteensa ennen koko luetteloa.

**Lighthouse mobiili, tuotanto, 3 ajon mediaani:**

| Sivu | Suorituskyky | Saavutettavuus | Parhaat käytännöt | SEO | LCP | FCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| Etusivu ennen | 56 | 87 | 79 | 100 | 25,8 s | 6,3 s | 74 ms | 0 |
| Etusivu jälkeen | 81 | 90 | 100 | 100 | 3,8 s | 3,4 s | 119 ms | 0 |
| Tuotesivu ennen | 58 | 85 | 79 | 100 | 12,3 s | 7,5 s | 0 ms | 0 |
| Tuotesivu jälkeen | 68 | 89 | 100 | 100 | 7,3 s | 4,1 s | 70 ms | 0,035 |

Tuotesivu: /tuote/saatanan-tunarit-t-paita. Tuotesivun LCP on yhä Printifyn kuva kuvaproxyn kautta; seuraava askel on
näyttää esirenderöity sisältö heti (nyt piilossa JavaScriptin latautumiseen asti).

**Miksi tarrat ja hupparit puuttuivat Googlesta:**
1. 21.10. asti jokaisen osoitteen HTML:ssä oli etusivun canonical (`https://huumorikauppa.fi/`) ja etusivun title.
   Google tulkitsi kategoriasivut etusivun kaksoiskappaleiksi. Korjattu esirenderöinnillä (5fb0063): sivuilla on
   nyt oma canonical, title ja sisältö kaikille käyttäjäagenteille, ja ne ovat sivukartassa.
2. Tarrat-kategoriassa on vain yksi myynnissä oleva tuote (oma teksti/kuva -tarra), ja sivun teksti lupasi
   valikoimaa ja kestoväitteitä, joita ei ollut. Ohut sivu ei nouse. Teksti korjattu; uudet tarrat tulevat
   skriptillä scripts/printify-uudet-tuotteet.mjs (oma-tausta, 10 tarraa alle 20 €).
3. Hupparit (164 tuotetta) kilpaili samasta hausta laskeutumissivun /hauskat-hupparit kanssa; molemmilla on nyt oma
   canonical ja ne linkittävät toisiinsa.
Omistaja: Search Consolessa URL-tarkistus ja indeksointipyyntö /kategoria/tarrat ja /kategoria/hupparit.

**oma-tausta-haarassa (testisivu https://huumorikauppa-five.vercel.app, noindex):**
- Kaikki yllä oleva yhdistetty, 449 testiä läpi, tarkistettu curlilla.
- Toimitus 5,90 €, ilmainen 60 €:sta: kassa (api/_lib/vakiot.js), sivuston tekstit, rakenteinen data ja
  Merchant-syöte (testisivun syötteessä 5.90 EUR). Testi varmistaa, että kassa, syöte ja tekstit ovat samat.
- Uusien tuotteiden skripti scripts/printify-uudet-tuotteet.mjs: tekstilistasta Printify-tuotteet EU-painotaloille
  (10 joulupaitaa ja -hupparia, 10 tarraa alle 20 €), hinta 40 %:n katesäännöllä, tuodaan kauppaan piilotettuina.
  Ei ajettu (Printify-avain puuttuu). Ohje KAYTTOONOTTO.md kohta 11.
- Huomio katteesta: 5,90 € / 60 € laskee katetta. 34,90 € t-paidan nettokate 15,93 € -> 15,15 € (46,6 %); noin
  50 € hinnoiteltu tuote, jonka Printify-kulut ovat noin 26 €, putoaa alle 40 %:n ja katesääntö estää sen myynnin.
  Katetarkistus (GitHub Actions) näyttää nämä, kun Printify-kulut on tuotu.

**Isänpäivän toimituslupaus:** 28.10. viimeinen tilauspäivä on omistajan päätös. Printifyn tuotanto (2-5 arkipäivää)
ja kuljetus Suomeen (Yhdysvaltain painotaloista 7-12 arkipäivää) eivät aina ehdi 8.11. mennessä. EU-painotalojen
tuotteilla ehtii. Päivä on yhdessä paikassa (src/data/campaignSchedule.ts), jos sitä halutaan aikaistaa.

## inteller.info (sähköposti aarni@inteller.info)

Selvitetty RDAP:lla ja dig:llä 21.10.2026:
- Rekisteröijä GoDaddy.com, LLC. Rekisteröity 4.12.2025, **voimassa 4.12.2026 asti**. Tila: siirto-, poisto-,
  päivitys- ja uusimislukko (clientRenewProhibited: uusiminen vaatii GoDaddyn tilin).
- Nimipalvelimet Cloudflare (weston.ns.cloudflare.com, gracie.ns.cloudflare.com).
- MX: Google Workspace (aspmx.l.google.com + alt1-4), SPF include:_spf.google.com. Posti oli Google Workspacessa;
  aiemmin Zoho (TXT-vahvistus jäljellä).
- Lovable-, Vercel- ja Cloudflare-tilit ovat todennäköisesti tällä osoitteella, joten osoitteen palautus on kiireellinen.

Omistajan seuraava askel (maksuton reitti):
1. Kirjaudu GoDaddyyn (salasanan palautus puhelinnumerolla tai varasähköpostilla). Uusi domain ennen 4.12.2026.
2. Jos Cloudflare-tili aukeaa toista kautta: Cloudflare Email Routing (ilmainen) -> lähetä aarni@inteller.info
   Gmailiin. Cloudflare vaihtaa MX-tietueet itse.
3. Jos Cloudflare ei aukea: vaihda GoDaddyssa nimipalvelimet GoDaddyn omiin ja käytä GoDaddyn ilmaista
   sähköpostin edelleenlähetystä. Huom: tämä katkaisee Cloudflaren kautta kulkevat tietueet (A-tietueet
   tarkistettava ensin).
4. Kun posti kulkee: palauta Lovable-, Vercel- ja Cloudflare-tilien salasanat ja vaihda tilien sähköposti
   osoitteeseen, joka ei riipu yhdestä domainista.
5. Google Workspace (jos tilaus jäi maksamatta): palautus vaatii DNS-pääsyn TXT-vahvistukseen.

## Uudet ja uudistetut sivut

Joululahjat: /joululahjat, /joululahja-miehelle-jolla-on-kaikki, /joululahja-isalle, /joululahja-aidille,
/joululahja-vaimolle, /joululahja-kaverille, /joululahja-tyokaverille, /joululahja-mummolle, /joululahja-papalle,
/joululahja-teinille, /joululahja-alle-50-euroa, /salainen-joulupukki-lahja, /lahjat/joululahjaksi-miehelle,
/lahjat/joululahjaksi-naiselle, /lahjat/pomolle, /lahjat/alle-30-euroa, /lahjat/pikkujouluihin,
/joulun-viimeiset-tilauspaivat.
Tuotteet ja teemat: /meemipaidat, /suomalainen-huumori-paidat, /setamiespaidat, /ammattipaidat, /hauskat-t-paidat,
/hauskat-hupparit.
Lahjat: /lahjat/isoaidille, /lahjat/harrastajalle, /lahjat/40-vuotiaalle-miehelle, /lahjat/50-vuotiaalle-miehelle,
/lahjat/60-vuotiaalle-miehelle, /lahjat/70-vuotiaalle, /lahjat/50-vuotiaalle-naiselle, /lahjat/60-vuotiaalle-naiselle,
/elakelahjat, /lahjat/isoisalle, /lahjat/siskolle, /lahjat/veljelle, /lahjat/puolisolle, /lahja-kaverille,
/lahjat/tyokaverille, /isanpaivalahja, /hauska-isanpaivalahja, /hauskat-lahjat-miehelle, /hauskat-lahjat-naiselle, /syntymapaivalahjat.
Blogi: /blogi/hauskat-joululahjaideat-miehelle-2026, /blogi/pikkujoululahja-alle-20-euroa,
/blogi/lahja-miehelle-jolla-on-kaikki, /blogi/elakelahja-joka-naurattaa, /blogi/mita-ostaa-tyokaverille-jouluksi,
/blogi/joululahja-isalle-hauskat-ideat, /blogi/salaisen-joulupukin-lahja-10-20-30-euroa,
/blogi/hauska-lahja-teinille-jouluksi, /blogi/lahja-kalastajalle-metsastajalle-mokkeilijalle,
/blogi/joululahjan-viimeiset-tilauspaivat-2026.
Yhdistetyt (301): alle 20 € -> alle 30 €, kalastus/metsästys/videopelit -> harrastajalle, opettaja/hoitaja ->
ammattipaidat, sauna -> suomalainen huumori, /lahja-tyokaverille -> /lahjat/tyokaverille. Ei luotu (alle 8 tuotetta):
alle 10 €, joulupaidat, jouluhupparit, vauvan ensimmäinen joulu, saunapaidat, mökkeilijälle.

## Vaikutusarvio

Lähtötietoja (Search Consolen liikenne, Stripen myynti) ei ollut käytettävissä, joten arvio on suuntaa antava.
- Indeksoitavuuskorjaus on suurin yksittäinen muutos: aiemmin Google näki sivujen sisällön vain renderöinnin jälkeen
  ja muut hakukoneet ja tekoälybotit eivät lainkaan. Vaikutus näkyy 2-6 viikossa, eli joulusesonkiin.
- 42 laskeutumissivua kattavat ostoaikeiset joulu- ja vastaanottajahaut, joissa kilpailijoilla ei ole sivuja
  (seo/kilpailijat.md: vastaanottaja-, budjetti- ja salaisen joulupukin sivut puuttuvat kaikilta).
- Laskelma tavoitteeseen: keskiostos noin 35-45 €, nettokate 40-50 % -> 15-20 € per tilaus. 3 000 €/kk vaatii noin
  150-200 tilausta kuukaudessa. Joulukuun alun konversiolla 1,5-2 % se tarkoittaa noin 8 000-13 000 kävijää
  kuukaudessa.

## Seuraavaksi (prioriteettijärjestys)

1. **Omistaja: KAYTTOONOTTO.md kohdat 1-7** (Printify-, Stripe- ja Resend-avaimet). Printify-kulujen tuonti avaa
   katesäännön, Shopping-kampanjan kateluokat (custom_label_0) ja tarkemmat jouluajat. Tavoite: domain uuteen
   taustaan ennen 27.11. (Black Friday), koska vanhan taustan on hold -ongelma kaataa tilauksia.
2. **Search Console ja Merchant Center:** lähetä sivukartta uudelleen, pyydä indeksointi joulusivuille, tarkista
   syötteen hylkäykset (toimitushinta korjattu).
3. **Shopping-kampanja** jaettuna custom_label_1 = joulu ja product_type mukaan, budjetti katteen mukaan.
4. **Joulutuotteet:** joulupaidat, jouluhupparit ja vauvan joulubody EU-painotaloihin (kysyntä ilman tarjontaa).
5. **Alle 20 € tuotteet** pikkujouluihin ja salaiseen joulupukkiin (nyt vain tarrat ja koristeet).
6. **Maksutavat:** nyt vain Visa ja Mastercard. Jos Stripen Dashboardissa on päällä muita (MobilePay, Klarna), lisää ne ehtoihin ja PaymentIcons-komponenttiin.
7. **Tuotenimet:** tietokannan nimissä on ajatusviivoja (393 titleä); korjaus oman taustan tietokannassa.
8. **Middleware-metat** yhdestä lähteestä (osa ei-esirenderöityjen sivujen bottimetoista on kömpelöitä).
9. Blogiartikkeleihin kuvat. Tuotteiden kuvauksiin mittataulukot (tai blueprint-tieto tietokantaan), jotta kokoapu näyttää mitat.
10. **Esirenderöity sisältö näkyviin heti** (nyt piilossa JS:n latautumiseen asti): tuotesivun LCP 7,3 s -> tavoite alle 2,5 s.
11. **Arviot:** kerää todelliset arviot tilausten jälkeen (Google-asiakasarviot ovat käytössä); palauta arkistosta vain todennettavat.

## Muutokset

| Pvm | Muutos | Haara / commit | Vaikutus | Seuraavaksi |
|---|---|---|---|---|
| 21.10. | Merchant-syöte: toimitushinta kassan säännöllä (6,90 €, ilmainen 79 €:sta; ennen syötteessä aina 0,00 €), shipping_label, product_type, identifier_exists=no, custom_label_1 sesonki. Syötteen hinnat tarkistettu: 490/490 täsmää tietokannan hintoihin. | main | Poistaa Merchant Centerin toimitushintaristiriidan (hylkäysriski), mahdollistaa Shopping-kampanjan jaon sesongin ja tuotetyypin mukaan | custom_label_0 (kate) kun Printify-kulut tunnetaan (oma tausta) |
| 21.10. | Joulun viimeinen tilauspäivä 14.12. -> 20.11.2026 (UKK ja botin UKK). 14.12. ei olisi pitänyt: Printifyn 2025 Eurooppa-takarajat olivat 27.11.-9.12. ja Suomeen kuljetus lisää päiviä (seo/toimitusajat.md). | main | Ei lupausta, jota ei voi pitää; vähentää jouluviikon reklamaatioita | Painotalokohtainen päivä tuotesivulle, kun Printify-tiedot saatavilla; tarkista Printifyn 2026-takarajat (julkaistaan lokakuussa) |
| 21.10. | Staattinen esirenderöinti: 712 sivua (490 tuotesivua, kategoriat, lahjasivut, blogi, UKK) palauttavat ilman JavaScriptiä oman titlen, kuvauksen, canonicalin, H1:n, sisällön ja JSON-LD:n kaikille käyttäjäagenteille. Ennen jokainen sivu antoi tavalliselle selaimelle ja tyhjälle agentille etusivun titlen ja canonicalin `https://huumorikauppa.fi/`. Rakenteinen data: Organization, WebSite + SearchAction, Product + Offer (toimitus 6,90 €/ilmainen 79 €:sta, palautus 14 pv), BreadcrumbList, FAQPage. robots.txt: tekoälybotit sallittu samoilla rajauksilla. llms.txt ja llms-full.txt generoidaan buildissa. Keksitty aggregateRating poistettu (Googlen ohjeiden vastainen). | main 5fb0063 | Indeksoitavuus: Google ja muut hakukoneet näkevät jokaisen sivun oman sisällön; tekoälyhaut saavat faktat llms.txt:stä | Tuntematon tuote palauttaa 200 (soft 404); ä/ö-osoitteet; yli 60 merkin titlet |
| 21.10. | 10 joulun opasartikkelia (1040-1141 sanaa, Article + FAQPage, sisäiset linkit laskeutumissivuille ja tuotteisiin), esim. /blogi/lahja-miehelle-jolla-on-kaikki, /blogi/joululahjan-viimeiset-tilauspaivat-2026, /blogi/pikkujoululahja-alle-20-euroa | main ad17882 | Pitkän hännän joulu- ja lahjahaut, sisäinen linkitys rahasivuille | Lisää kuvat artikkeleihin |
| 21.10. | Sisältökorjaukset: virheellinen väite "painettu Suomessa" poistettu kaikkialta (tuotteet painetaan tilauksesta painokumppaneilla ulkomailla), noin 900 mukimainintaa poistettu, UKK:n ristiriidat korjattu ehtojen mukaisiksi (PostNord -> Posti tai Matkahuolto, hyvitys 14 pv, ei erillistä vaihtoa, toimitus 3-10 arkipäivää, maksutavat ehtojen mukaan), 92 yli 60 merkin titleä lyhennetty, UKK uudelleen (suora vastaus ensimmäisessä virkkeessä, tekoälyhakujen kysymykset), 100 tuotteen uniikit kuvaukset ja FAQ:t (src/data/productContent.ts), kuvaavat alt-tekstit kaikille tuotekuville. | main c5cc99c | Kuluttajansuojariski pienenee (harhaanjohtava alkuperäväite), parempi osuvuus ja CTR, rikkaampi tuotesivu | Tuotteiden nimissä yhä ajatusviivoja (tietokannassa); Footer ja kassa listaavat Klarna/MobilePay, joita ehdot eivät mainitse: tarkista Stripestä |
| 21.10. | Kolme mukia oli tietokannassa t-paidat-kategoriassa (koko 11oz) ja näkyi myynnissä ja syötteessä t-paitoina: piilotettu tuotetasoisella säännöllä (src/lib/hiddenCategories.ts onPiilotettuTuote), 301-ohjaukset. Syötteessä 487 tuotetta. | main 291d93e | Ei myydä tuotetta, jota ei tarjota; syöte ei näytä mukia t-paitana | |
| 21.10. | Kuvat: kuvaproxy palauttaa WebP:n tukeville selaimille (Vary: Accept), korttikuvat 480 px, CDN-välimuisti 7 pv. Mitattu tuotannossa: pääkuva 53,4 kt -> 21,5 kt (WebP), korttikuva 53,4 kt -> 4,1 kt. Ilman WebP-tukea ja Googlebot-Imagelle JPEG kuten ennen. | main 23bc65d | Nopeampi LCP ja vähemmän siirrettävää listasivuilla (Core Web Vitals) | srcset tuotesivun pääkuvalle |
| 21.10. | 42 laskeutumissivua, Joululahjat-valikko, /joulun-viimeiset-tilauspaivat + banneri (näkyy 20.11.2026 asti), oikea 404 tuntemattomille tuotteille, ASCII-osoitteet ä/ö-sivuille (301), sivukarttaan laskeutumis- ja kaupunkisivut. | main 31c7c81 | Ostoaikeiset joulu- ja vastaanottajahaut | Lisää joulutuotteita, alle 20 € valikoima |
| 21.10. | Bottien metatiedoista pois ajatusviivat, superlatiivit ja virheväitteet; sivukartta ja syöte ilman ohjautuvia tuotekaksoiskappaleita (652 + 484 linkkiä, kaikki 200). | main 5ce880e | Siistit hakutulokset, ei 308-linkkejä Merchantissa | |
| 21.10. | Isänpäivä: /isanpaivalahja ja /hauska-isanpaivalahja, 301 vanhoilta, valikko, kausibanneri (isänpäivä 28.10. asti, joulu 29.10.-20.11.). | main 66e8881, c1d12e4 | Isänpäivän ostoaikeiset haut, banneri ohjaa ostamaan ennen takarajaa | Isänpäivän jälkeen sivut jäävät (ikivihreä sisältö) |
| 21.10. | Tarrat-kategorian teksti tosiasioiden mukaan, /tarrat ja /hupparit 301. | main 36d552d | Ohut ja virheellinen sivu korjattu | Lisää tarroja (skripti valmis) |
| 21.10. | Konversio: toimitusehdot yhdestä tiedostosta, arviot arkistoon, tuotesivu mobiili edellä, kokoapu, alatunnisteen kauppiastiedot, vain taatut maksutavat, suorituskyky (Lighthouse etusivu 56 -> 81, tuotesivu 58 -> 68). | main d794550-7c6c523, 026e0b4 | Ostopolku lyhyempi ja luotettavampi; LCP 25,8 s -> 3,8 s etusivulla | Esirenderöity sisältö näkyviin heti |
| 21.10. | oma-tausta: toimitus 5,90 € / ilmainen 60 €:sta (kassa, syöte, tekstit), uusien tuotteiden Printify-skripti (ei ajettu). | oma-tausta 10d6a11, cf9f98c | Valmis domainin siirtoon | Printify-avain, sitten skripti --toteuta --raja 1 |
| 22.10. | Printify-saatavuus: 8 342 kartattomat yhdistelmää piiloon, lisää koriin estää valmistamattoman. | main 3259ac3, c140559, 63ea96a | Ei tilauksia, joita Printify ei voi valmistaa | Päivittäinen tarkistus omassa taustassa |
| 23.-25.10. | EU-siirto: 557 tuotetta (279 t-paitaa, 278 mukia) OPT OnDemandille. | oma-tausta (data/eu-siirto-*.json) | T-paitojen kate 11 % -> 27 %, nopeampi toimitus | Hinnoittelu 40 %:n katteeseen (omistaja) |
| 25.10. | Lovable-synkronoinnin kaksoiskappaleet ja testikopiot piiloon, 301 perusriviin. | main 29c2b69 | Ei kaksoislistauksia eikä testituotteita kaupassa | |
| 25.10. | Saatavuus Printifyn mukaan: 164 yhdistelmää 32 tuotteessa piiloon. | main 6d4a543 | Kaikki näkyvät yhdistelmät tilattavissa | Uusi ajo Lovable-synkronoinnin jälkeen |
| 26.10. | Tonnin seteli -laskeutumissivu, etusivun ja joulusivujen nostot, Sopii yhteen -suositukset, ilmaisen toimituksen palkki sivupaneeliin (60 €-virhe korjattu). | main 2982658 | Keskiostos, myydyimmän teeman näkyvyys | Seuraa keskiostosta |
| 26.10. | Rakenteinen data (481/481 validi), Consent Mode v2, syötteen kateluokat ja myydyimmät. | main ba19d66-815c007 | Search Consolen tuotevirheet, GDPR | Search Consolen tarkistus 1-2 viikon päästä |
| 26.10. | Nopeus: tuotesivun esirenderöity sisältö näkyviin heti, tuoterivi upotettuna (ensimmäinen versio peruttiin). | main 593dd04 | Tuotesivu LCP 7,1 s -> 3,5 s, suorituskyky 69 -> 83 | Staattiset pääkuvat, middleware |
| 26.10. | 13 uutta tuotetta Printifyyn (12 julistetta, 1 tarra), kate 31-33 %. | oma-tausta 4800fae | Uusia tuotteita yli 30 %:n katteella | Tarkista hinnat ja kategoria synkronoinnin jälkeen |
| 26.10. | Blogit: tuotekortit, Katso tuotteet, laskeutumissivulinkit; blogien tuotelistojen rakenteinen data korjattu. | main 0edaf37 | 950 klikkausta/kk blogeista ostopolulle | Seuraa blogien konversiota |
| 26.10. | Nopeus uudelleen (korjattu esikatselu). | main 593dd04 | Tuotesivu LCP 7,1 -> 3,5 s, perf 69 -> 83 | Staattiset pääkuvat |
| 27.10. | Tappioesto: 301 tappiollista varianttia ja 6 tuotetta piiloon, tekstit päivitetty. | main 029e2dc, 35db534 | Ei tappiollisia myyntejä | Hinnat ja EU-kopioiden käyttöönotto Lovablessa |
| 27.10. | Katteet ilman Printifyn ALV:tä (ALV-rekisteri). | oma-tausta | Oikea katekuva | |
| 27.10. | Yritystiedot Uusiku Oy:lle 1.11.2026 (ajastettu), Seniorituki-mainos pois, ALV-erittely sähköposteihin. | main cd97f18-32b7da2, yritys-js; oma-tausta | Oikeat myyjän tiedot 1.11. alkaen | Stripe, Merchant Center ja Lovable-viestit omistajalta |
| 27.10. | Yritysvaihto MYYJA-muuttujalla, 1.11. ajastus poistettu. | main fb12077 | Ei vaihtoa ennen Uusiku Oy:n Stripeä | MYYJA=uusiku go-livessä |
| 27.10. | Merchant-syöte 2197 -> 0 virhettä. | main 049d3b6 | Maksuttomat Google-listaukset | Seuraa Merchant Centeriä |
| 27.10. | 6 joulublogia, /joululahja-elakelaiselle, jouluaikataulu tuotesivulle, koriin ja etusivulle. | main b25f9e8, 4ea1967 | Joulun hakuliikenne ja konversio | |
| 27.10. | Uusi tausta: kanta täytetty, korialennus -5 %, 15 uutta paitaa (31,7 %). | oma-tausta | Valmis go-liveen Stripeä vaille | Stripe-avaimet |

- 28.10.2026: Ensimmäisen maksetun tilauksen vahti (10 min välein, 6 h) päättyi: ei maksettuja tilauksia uudessa kassassa. Vanhan kassan webhook pysyy päällä, kunnes ensimmäinen oikea tilaus on tarkistettu.
