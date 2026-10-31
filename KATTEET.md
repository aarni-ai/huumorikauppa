# Katteet Printifyn todellisilla kuluilla

**Laskentaperuste (27.10.2026, päivitetty):** kauppa siirtyy Tmi Intelleriltä Uusiku Oy:lle 1.11.2026 (Y-tunnus
3653666-7, ALV FI36536667). Uusiku Oy on ALV-rekisterissä, joten Printifyn veloittama arvonlisävero vähennetään
jatkossa Uusiku Oy:n ALV-ilmoituksessa. Kaikki katteet lasketaan Printify-kululla ilman ALV:tä (Printifyn verollinen
summa / 1,255 = tuote + toimitus ilman veroriviä). Katalogin tuote- ja toimituskulut ovat valmiiksi ilman ALV:tä.
Myynnin ALV (25,5 %) vähennetään myyntihinnasta. Oman taustan katesääntö: myynti estetään alle 20 %:n katteella,
paketit ja alennuskoodit vain, jos kate pysyy vähintään 30 %:ssa.

**Poistuuko Printifyn ALV, jos Printifyyn annetaan ALV-tunnus FI36536667 (käännetty verovelvollisuus)?**
Printifyn ohjekeskuksen mukaan ei: Printify perii ALV:n kaikissa EU-maissa, eikä tilauksille myönnetä ALV-vapautusta
yritysasiakkaallekaan; ALV-rekisteröity yritys hakee veron takaisin omassa ALV-ilmoituksessaan Printifyn
ALV-laskuilla (help.printify.com: "Does Printify charge VAT?" ja "Can I claim a VAT exemption on orders from
Printify?", tarkistettu hakutulosten kautta 27.10.2026; sivut eivät avautuneet suoraan). Tilaushistoria vastaa tätä:
Printify on veloittanut 25,5 % Suomen ALV:n. Käännettyä verovelvollisuutta ei siis saa ALV-tunnuksella.
Vaihtoehdot katteessa:

| Vaihtoehto | Printify-kulu katteessa | T-paita 24,90 € | Huppari 49,90 € | Tilaukset 1.6. alkaen (17 kpl) |
|---|---|---|---|---|
| A. Printify perii ALV:n, Uusiku Oy vähentää sen (nykytilanne) | ilman ALV:tä | 28,5 % / 7,22 € | 10,6 % / 4,80 € | 60,76 € (13,4 %) |
| B. Käännetty verovelvollisuus (jos Printify sen tarjoaisi) | ilman ALV:tä | 28,5 % / 7,22 € | 10,6 % / 4,80 € | 60,76 € (13,4 %) |
| Vertailu: ALV ei vähennettävissä | sis. ALV | 11,0 % / 2,79 € | -7,8 % (51,90 €) | -27,06 € (-6,0 %) |

Katteet ovat vaihtoehdoissa A ja B samat; ero on kassavirrassa: vaihtoehdossa A ALV (25,5 % Printify-kuluista,
1.6.-26.10. yhteensä 87,82 €) maksetaan ensin ja saadaan takaisin ALV-ilmoituksessa. Varmista tilitoimistolta, että
Printifyn laskuilla (Suomen ALV, ulkomainen myyjä) ALV on vähennettävissä Uusiku Oy:n ilmoituksessa; jos ei, rivi
"ALV ei vähennettävissä" on todellinen.

**Kate tuoteryhmittäin nykyhinnoilla** (toimitusmaksu 6,90 € alle 79 €, yhden kappaleen tilaus, heikoin koko,
EU-siirron jälkeiset kulut; mediaani tuoteryhmän sisällä):

| Tuoteryhmä | Tuotteita | Hinta | Nettokate € | Kate % | Yli 30 % | Yli 40 % |
|---|---|---|---|---|---|---|
| T-paidat | 310 | 24,90 € | 7,22 € | 28,5 % | ei | ei |
| Hupparit | 163 | 49,90 € | 4,80 € | 10,6 % | ei | ei |
| Koristeet | 2 | 19,90 € | 3,00 € | 14,1 % | ei | ei |
| Pitkähihaiset | 1 | 39,90 € | 1,82 € | 4,9 % | ei | ei |
| Pipot | 1 | 39,90 € | 1,78 € | 4,8 % | ei | ei |
| Bodyt | 1 | 24,90 € | -2,49 € | -9,8 % | ei | ei |
| Seinätaulut | 1 | 39,90 € | -0,47 € | -1,3 % | ei | ei |
| Peitot | 1 | 34,90 € | -23,13 € | -69,4 % | ei | ei |
| Tarrat (oma teksti) | 1 | 4,99 € | -7,84 € | -82,8 % | ei | ei |
| Uudet julisteet (12) | 12 | 22,90 € | 7,47 € | 31,5 % | kyllä | ei |
| Uusi tarra (Se oli tonnin seteli) | 1 | 11,90 € | 4,97 € | 33,2 % | kyllä | ei |
| Kaikki myynnissä olevat (ennen uusia) | 481 | | 5,89 € (ka) | 20,6 % (ka) | | |

Toteutuneet tilaukset 1.6.2026 alkaen (alla): 17 tilausta, nettokate 60,76 € (13,4 %), keskimäärin 3,57 € tilausta kohden.

Päivitetty 2026-10-25 skriptillä `scripts/katteet.mjs` (Printify-kauppa 26630629). Kaava api/_lib/kate.js: myynti alv 0 =
(hinta + toimitusmaksu) / 1,255; nettokate = myynti alv 0 - Printifyn tuotekulu - Suomen toimituskulu (1. kappale) -
Stripe 1,5 % + 0,25 €. Yhden kappaleen tilaus, tuotteen kate = heikoin variantti (yleensä suurin koko). Raja 40 %.

- Myynnissä 481 tuotetta, kulut tiedossa 481, Printify-tuote puuttuu 0.
- Alle 40 %: nykyisellä kassalla (6,90 € / 79 €) 481 tuotetta, omalla taustalla (5,90 € / 60 €) 481.

## Hinnoittelu 29.10.2026: keskikate vähintään 10 €, minimi 7 € (käytössä)

**Aarnin päätös 29.10.2026:**
- Keskikate vähintään 10,00 € tilausta kohden.
- Jokaisesta tavallisesta tilauksesta jää kaikkien kulujen jälkeen vähintään 7,00 €. Kuluihin lasketaan Printify ilman
  ALV:tä, Stripe, provisio ja alennukset.
- Yritystilauksissa (10+ t-paitaa) riittää 5,00 € paitaa kohden.

Kaava on api/_lib/kate.js laskeTilauksenNettokate: Stripe 1,5 % + 0,25 €, Printifyn toimitus painotaloittain.

### Uudet hinnat (api/_lib/kokohinnat.js, julkaistu 29.10.2026)

| Tuote | Ennen | Nyt | 3XL-5XL ennen | 3XL-5XL nyt |
|---|---|---|---|---|
| T-paita, suora kilpailijavertailu (14 designia: Saatanan tunarit, Tonnin seteli, I love my girlfriend/boyfriend, Alkoholiongelmaa, Maailman paras äiti, Kalju, Amatimies, Eläkeläinen, 100 % eläkeläinen, Olen eläkkeellä) | 24,90 € | 24,90 € | 24,90 € | 28,90 € |
| Muut t-paidat (304 designia: harrastus- ja ammattisarjat, ikävuodet, joulu, kaupungit ja muut uniikit) | 24,90 € | 27,90 € | 24,90 € | 29,90 € |
| Personoitu t-paita | 29,90 € | 29,90 € | 29,90 € | 29,90 € |
| Huppari | 49,99 € | 52,90 € | 55,00 € | 59,90 € |
| Juliste | 22,90 € | 24,90 € | | |
| Keraaminen koriste | 19,90 € | 22,90 € | | |
| Tarra | 11,90 € | 11,90 € (vain lisätuotteena) | | |

- Toimitus pysyy 6,90 €:ssa ja ilmaisen toimituksen raja 79 €:ssa.
- Toimitusmaksun nosto 7,90 €:oon toisi noin +0,40 € keskikatetta. Se jätettiin varalle, koska suorin kilpailija
  (Hauskatpaidat.fi) perii 4,90 €.
- Personoitu paita pysyy 29,90 €:ssa, koska kilpailijan oma printti maksaa enintään 30 €.

### Kilpailijat (29.10.2026, kaupat avattu Chromella)

| Kilpailija | T-paita | Oma printti / premium | Huppari | Toimitus |
|---|---|---|---|---|
| Hauskatpaidat.fi | 25 € | 25 € / 30 € | 45-69 € (yleensä 50-55 €) | 4,90 €, ilmainen yli 65 € |
| Stuntman | 19,90-22,90 € | | 38,90-44,90 € (erikoismallit 59 €) | noutopiste 6,90 €, koti 12,90 € |
| Meemirotta | | | 49,99 € (27.10.2026) | |
| Huumoripaidat.com | | | | (sivu antoi virhesivun) |

Uudet hinnat pysyvät kilpailijoiden haarukassa:
- t-paidat 24,90-29,90 € (Hauskatpaidat.fi 25-30 €)
- hupparit 52,90-59,90 € (Hauskatpaidat.fi 45-69 €)

### Heikoin kate tuotannon kuluilla (?tehtava=katetaulu 29.10.2026)

Yhden tuotteen tilaus, asiakas maksaa toimituksen 6,90 €. Kaikki myytävät variantit:

| Ryhmä | Hinta | Heikoin | Keskiarvo | Alle 7 € |
|---|---|---|---|---|
| T-paita, suora vertailu | 24,90 € | 7,05 € | 7,21 € | 0 / 495 |
| T-paita, suora vertailu 3XL+ | 28,90 € | 7,77 € | 9,18 € | 0 / 150 |
| T-paita, muut | 27,90 € | 8,66 € | 9,56 € | 0 / 4 743 |
| T-paita, muut 3XL+ | 29,90 € | 7,81 € | 9,88 € | 0 / 233 |
| Huppari | 52,90 € | 7,35 € | 10,29 € | 0 / 2 675 |
| Huppari 3XL+ | 59,90 € | 8,12 € | 10,76 € | 0 / 341 |
| Juliste | 24,90 € | 8,23 € | 8,23 € | 0 / 12 |
| Koriste | 22,90 € | 7,22 € | 7,22 € | 0 / 1 |
| Tarra (yksin) | 11,90 € | 4,97 € | | kassa hylkää pelkän tarran |

**3XL+ -hinnat:** ensimmäinen versio (3XL+ 27,90 € ja huppari 57,90 €) jätti 40 varianttia alle 7 €:n:
- heikoin t-paita 4XL: 6,25 €
- huppari 3XL: 6,55 €

Siksi 3XL+ nostettiin, ja nyt yksikään variantti ei jää alle 7 €:n.

**Alennukset ja 7 €:n raja** (api/_lib/kassa.js ja korialennus.js):
- Alennuskoodi hylätään, jos tilauksen nettokate alennuksen jälkeen jäisi alle 7 €.
- Pakettialennus ja kahden tuotteen -5 % jätetään antamatta samalla ehdolla (katevahti
  KORIALENNUS_MIN_KATE_EUROA = 7).
- Määräalennus koskee kaikkia t-paitoja, raja 5 € paitaa kohden.
  - 10 t-paitaa 27,90 € -10 %: noin 8,8 €/paita.
  - 50 t-paitaa 24,90 € -14 %: noin 6,5 €/paita.
- Black Friday "2 t-paitaa 44,90 €" koskee vain 24,90 €:n t-paitoja (suora vertailu, S-2XL), ja katevahti on 7 €.
  - Parin kate on 12,77 € (heikoin 10,71 €).
  - 30 päivän alin hinta on 24,90 € (KSL 2:6 a §).
  - Näiden paitojen hinta ei muuttunut, ja hintatarkistus hälyttää, jos se muuttuu.

### Alennuskoodit (inventaario 29.10.2026)

| Koodi | Mistä | Missä mainostettu | Käyttö | Päätös |
|---|---|---|---|---|
| HUUMORI5 (-5 %) | kanta discount_codes, koodin varalista OLETUSKOODIT ja kassasivun VALID_CODES | ei missään sivustolla, viesteissä eikä sähköposteissa | 1 tilaus (29.10., alennus 2,50 €) | poistettu käytöstä 29.10. |
| PALAA10 (-10 %) | sama | ei missään (kassasivun kommentti mainitsi palautusviestit, mutta yksikään viesti ei käytä sitä) | 0 | poistettu käytöstä 29.10. |
| TERVE-xxxx (ensitilaus) | api/_lib/markkinointi.js | uutiskirjeen tervetuloviesti | 0 | pois (ENSITILAUS_ALENNUS_PROSENTTI = 0) |
| Stripe promotion codes / coupons | Stripe | | tilillä ei ole yhtään | |

- Kannan rivit säilyvät historiaa varten (is_active = false).
- Hallinta: ?tehtava=alennuskoodit[&poista=KOODI].
- Uusi koodi hyväksytään kassalla vain, jos tilauksen kate pysyy vähintään 7 €:ssa.
- Kumppanikoodi ei ole alennuskoodi.

### Keskikate ennen ja jälkeen

Tuotemix (sama kuin aiemmissa laskelmissa):
- 70 % yksi t-paita
- 5 % kaksi t-paitaa
- 15 % huppari
- 3 % t-paita ja huppari
- 7 % juliste

T-paitatilauksista 30 % on suoran vertailun paitoja (24,90 €) ja 70 % muita (27,90 €). Kumpikin osuus on oletus,
koska oikeita tilauksia on vasta yksi.

| | Yksi t-paita | Kaksi t-paitaa | Huppari | T-paita + huppari | Juliste | Keskikate |
|---|---|---|---|---|---|---|
| Ennen (24,90 / 49,99 / 22,90 €) | 7,22 € | 14,65 € | 7,86 € | 6,95 € | 6,67 € | **7,64 €** |
| Nyt, ilman lisämyyntiä | 8,86 € | 17,8 € | 10,29 € | 9,87 € | 8,23 € | **9,51 €** |
| Nyt, 10 % yhden paidan koreista saa toisen paidan | | | | | | **10,13 €** |

- T-paita ja huppari ylittävät uusilla hinnoilla 79 €:n rajan, joten toimitus on ilmainen. Katevahti ei anna -5 %:a,
  koska kate jäisi 6,71 €:oon.
- Ostoskori ehdottaa toista t-paitaa aina, kun korissa on yksi t-paita (Lisää toinen t-paita). Samalla näytetään
  linkki personoituun paitaan. Etusivulla ja tuotesivuilla nostetaan personoitu paita ja /yritykset.

**Vaikutus kuukausikatteeseen nykyisellä tilausmäärällä (noin 6,5 tilausta/kk):**
- ennen 7,64 € × 6,5 = 49,7 €/kk
- nyt 9,51-10,13 € × 6,5 = 61,8-65,8 €/kk
- muutos noin +12-16 €/kk

3000 €/kk:n tavoite vaatii nykyisellä keskikatteella noin 300 tilausta kuukaudessa.

### Maksutapojen kulut keskiostoksella (yksi t-paita 27,90 € + toimitus 6,90 € = 34,80 €)

| Maksutapa (Stripe, Suomi) | Hinnasto | Kulu | Ero kortin perushintaan |
|---|---|---|---|
| Kortti (ETA, tavallinen), Apple Pay, Google Pay | 1,5 % + 0,25 € | 0,77 € | 0 |
| Kortti (ETA, premium/yritys) | 2,8 % + 0,25 € | 1,22 € | +0,45 € |
| Kortti (UK) | 2,5 % + 0,25 € | 1,12 € | +0,35 € |
| Kortti (kansainvälinen) | 3,15 % + 0,25 € | 1,35 € | +0,58 € |
| MobilePay | 1,5 % + 0,36 € + erillinen MobilePay-maksu (laskutetaan päivittäin) | 0,88 € + MobilePay-maksu | +0,11 € + MobilePay-maksu |
| **Klarna** | 2,99 % + 0,40 € (+1,5 % kansainvälinen) | **1,44 €** | **+0,67 €** |

Klarna vie eniten katetta. Ensimmäinen oikea tilaus maksettiin Klarnalla, ja Stripe-kulu oli 2,03 €.

**Poikkeama 7 €:n minimiin:** kaikki katteet on laskettu kortin perushinnalla (1,5 % + 0,25 €). Klarna maksaa
tilauksen summasta riippuen 0,6-1,0 € enemmän, premium-kortti 0,4-0,8 € enemmän. Klarnalla maksettuna heikoimmat
variantit jäävät alle 7 €:n:

| Variantti | Kortti | Klarna | Premium-kortti |
|---|---|---|---|
| 24,90 € t-paita | 7,05 € | 6,43 € | 6,64 € |
| koriste | 7,22 € | 6,63 € | 6,83 € |
| heikoin huppari | 7,35 € | 6,31 € | 6,64 € |

Ryhmien keskiarvot pysyvät Klarnallakin yli 7 €:n, paitsi 24,90 €:n t-paidoilla (noin 6,6 €).

Aarnin päätettävä:
- (a) Klarna pois alle 60 €:n tilauksista (Stripe Checkoutin maksutavat valitaan tilauksen summan mukaan).
- (b) Hyväksytään poikkeama Klarna- ja premium-korttimaksuille. Klarnan osuus tilauksista seurataan ensin.

24,90 €:n paitojen hintaa ei voi nostaa: 25,90 € ylittäisi suoran kilpailijan 25 €:n hinnan.

### Printify Premium (34,99 €/kk): kannattavuusraja

Premium alentaa tuotekuluja enintään 20 %, toimituskuluihin se ei vaikuta.

| Tilaus | Säästö |
|---|---|
| T-paita | 20 % × 8,90 € = 1,78 € |
| Huppari | 20 % × noin 25 € = 5,0 € |
| Keskiostos (yllä oleva mix) | noin 2,48 € |

- Kannattavuusraja on 34,99 € / 2,48 € = **noin 14 tilausta kuukaudessa**.
- Nykyisellä 6,5 tilauksella kuukaudessa säästö on noin 16 €/kk, mikä on vähemmän kuin 34,99 €. Premium ei kannata
  vielä. Uusi tarkistus kannattaa tehdä, kun tilauksia on yli 15 kuukaudessa.
- Premiumia ei tilattu.

### Painotalot (vertailu 26.10.2026, osio "Halvin EU-vaihtoehto")

| Tuote | Nykyinen painotalo | Vaihtoehto | Miksi ei siirretty |
|---|---|---|---|
| T-paita | OPT CZ (Gildan 64000): 8,90 € + toimitus 8,49 € | Textildruck DE: 9,28 € + 7,29 € | Kate on hiukan parempi (31,7 % vs. 28,5 %), mutta Black L puuttuu ja 3XL maksaa 10,68 €. |
| Huppari | Textildruck DE: 24,77-25,48 € + 10,89 € | Atelier Katanga FR: 23,79 € + 10,89 € | Ash, Heather Navy ja Graphite Heather puuttuvat, ja 3XL+ on heikompi. |

Molemmissa siirto pudottaisi värejä tai kokoja. Lisäksi 20 tuotteen tekstitasot pitäisi siirtää käsin. Siksi tuotteita
ei siirretty. Toimitusaika Suomeen on kaikilla EU-painotaloilla sama (3-10 arkipäivää).

### Printifyn ALV: päätös 31.10.2026

Kirjanpitäjä vahvisti, että Printifyn laskuttama Suomen ALV (25,5 %) on Uusiku Oy:lle vähennettävissä.
- Hinnat pysyvät ennallaan, eli korotusta ei tehdä.
- `PRINTIFY_ALV_VAHENNETTAVA` pysyy arvossa true (api/_lib/vakiot.js), joten katteet lasketaan Printify-kuluilla
  ilman ALV:tä.
- ALV-varasuunnitelma (alla) jää koodiin käyttämättömänä. Se otetaan käyttöön vain, jos verotilanne muuttuu.
- Printifyn laskut menevät kirjanpitoon ostolaskuina (ALV vähennetään), ja maksu tapahtuu Huumorikaupan omalla
  Holvi-kortilla (KAYTTOONOTTO.md "Raha- ja kirjanpitovirta").

### 7 €:n minimi maksutavoittain (31.10.2026, tuotannon kulut, ALV vähennettävissä)

?tehtava=katetaulu&maksutapa=...: yhden tuotteen tilaus, asiakas maksaa toimituksen, kaikki myytävät variantit
(tarra on vain lisätuote). Stripen hinnasto Suomessa.

| Maksutapa | Kulu | Variantteja alle 7 € | Mitkä | Heikoin |
|---|---|---|---|---|
| ETA-kortti, Apple Pay, Google Pay | 1,5 % + 0,25 € | 0 | | 7,05 € |
| MobilePay | 1,5 % + 0,36 € (+ MobilePayn erillinen maksu) | 25 | 24,90 €:n t-paidat, kalleimmat variantit | 6,94 € |
| UK-kortti | 2,5 % + 0,25 € | 542 | 24,90 €:n t-paidat 491/495, hupparit 50/2 675, koriste | 6,73 € |
| Premium- tai yrityskortti (ETA) | 2,8 % + 0,25 € | 542 | 24,90 €:n t-paidat 491/495, hupparit 50/2 675, koriste | 6,58 € |
| Kansainvälinen kortti | 3,15 % + 0,25 € | 546 | 24,90 €:n t-paidat 495/495, hupparit 50/2 675, koriste | 6,37 € |
| **Klarna** | 2,99 % + 0,40 € | 557 | 24,90 €:n t-paidat 495/495, hupparit 61, koriste | 6,31 € |
| Klarna, ulkomainen | 4,49 % + 0,40 € | 583 | edellisten lisäksi 3XL+ t-paidat 20 | 5,41 € |

- Kaikki 27,90 €:n t-paidat (S-2XL), julisteet ja Black Friday -pari (heikoin 10,73-12,43 €) pysyvät yli 7 €:n
  kaikilla maksutavoilla.
- Kahden tuotteen tilaukset ylittävät 7 €:n kaikilla maksutavoilla (heikoin noin 13 €).
- **Alle 7 €:n jäävät yhden tuotteen tilaukset:**
  - 24,90 €:n t-paidat (14 meemi- ja klassikkodesignia S-2XL) kaikilla maksutavoilla paitsi ETA-kortilla
  - heikoimmat hupparit (50-61 varianttia, kalleimmat koot ja värit, 6,31-6,75 €)
  - keraaminen koriste (6,62-6,92 €)
  - Ero on 0,06-0,69 € tilausta kohden.
- **Vaihtoehdot (Aarnin päätös):**
  - (a) Klarna ja MobilePay vain yli 60 €:n tilauksiin.
  - (b) Hyväksytään poikkeama, koska ensimmäinen ja ainoa Uusiku Oy:n tilaus maksettiin Klarnalla ja Klarna voi
    nostaa konversiota.
  - (c) 24,90 €:n paitojen hintaa ei voi nostaa ylittämättä kilpailijan 25 €:a.

### ALV-varasuunnitelma 30.10.2026 (valmis, pois päältä)

**Kytkin:** api/_lib/vakiot.js `PRINTIFY_ALV_VAHENNETTAVA`. Oletus on true. Kun kirjanpitäjä toteaa, ettei Printifyn
ALV ole vähennettävissä, kytkin asetetaan arvoon false ja sivusto julkaistaan. Silloin:
- Katteet lasketaan Printify-kulu × 1,255 (api/_lib/kate.js PRINTIFY_KULUKERROIN). Tämä koskee katevahtia,
  alennuskoodien 7 €:n rajaa, kumppaniprovisiota ja tuotteiden katesääntöä.
- Hinnasto vaihtuu `HINNASTOT.alvKulu`:un. Tämä koskee tuotesivuja, kassaa, syötettä ja sivukarttaa.
- Sisältöjen hintamaininnat tulevat src/data/hintatekstit.ts:stä ja päivittyvät samalla. Tämä koskee blogeja,
  laskeutumissivuja, UKK:ita ja mediakittiä.

| Tuote | Nyt | ALV kuluna | Heikoin kate (ALV kuluna, uusi hinta) |
|---|---|---|---|
| T-paita, suora vertailu | 24,90 € | 30,90 € | 7,26 € |
| T-paita, suora vertailu 3XL+ | 28,90 € | 34,90 € | 7,37 € |
| T-paita, muut | 27,90 € | 31,90 € | 7,12 € |
| T-paita, muut 3XL+ | 29,90 € | 35,90 € | 7,22 € |
| Huppari | 52,90 € | 65,90 € | 7,53 € |
| Huppari 3XL+ | 59,90 € | 72,90 € | 7,09 € |
| Juliste | 24,90 € | 28,90 € | 7,18 € |
| Koriste | 22,90 € | 27,90 € | 7,09 € |
| Personoitu t-paita | 29,90 € | 32,90 € | noin 7,9 € (arvio, kulu noin 18,4 €) |
| Black Friday -pari | 44,90 € | 49,90 € | 9,24 € |

- Tuotannon kuluilla laskettiin ensin hinnat 30,90/33,90/59,90/66,90 € (?tehtava=katetaulu&alv=1). Heikoimmat
  variantit jäivät alle 7 €:n (huppari 2,84 €, juliste 6,40 €, koriste 5,53 €), joten hinnat nostettiin
  taulukon mukaisiksi. Tarkistettu tuotannossa 30.10.2026 (?tehtava=katetaulu&alv=1): 0 / 8 649 varianttia alle 7 €.
- **Kilpailijat:** ALV kuluna t-paidat ylittävät Hauskatpaidat.fi:n 25-30 €:n haarukan ja hupparit 3XL+ sen 69 €:n
  ylärajan. Tämä on väistämätöntä, jos 7 €:n minimi pidetään.
- **Black Friday ja 30 päivän alin hinta (KSL 2:6 a §):**
  - Kampanjan kappalehinta ja parihinta seuraavat hinnastoa.
  - TPAITAPARI_KAMPANJA.alinHinta30pv pysyy 24,90 €:ssa. Kampanjaa edeltäneiden 30 päivän aikana (28.10.-26.11.)
    paita on maksanut 24,90 €, joten se on laillinen alin hinta, vaikka kytkin käännettäisiin ennen kampanjaa.
  - Markkinointi näyttää silloin "T-paidan hinta 30,90 €, alin hinta 30 päivän aikana 24,90 €" ja parihinnan 49,90 €.
  - Ennen-hintoja ei käytetä.
- **Käsin päivitettävät kohdat, kun kytkin käännetään:**
  - etusivun pääkuva (`python3 scripts/etusivun-kuva.py` julkaisun jälkeen)
  - /kumppanit-sivun esimerkit (src/data/kumppanitPage.ts kate-luvut)
  - KUMPPANIT-VIESTIPOHJA.md:n ja kumppanien omien viestien esimerkit
  - Google Merchant -syöte päivittyy itsestään

### Printifyn ALV: vähennettävissä vai ei

Printify perii Suomen ALV:n (25,5 %), eikä käännettyä verovelvollisuutta saa (ks. alku). Katteet yllä olettavat, että
Uusiku Oy vähentää Printifyn ALV:n. Jos ALV ei ole vähennettävissä, Printify-kulut ovat 25,5 % suuremmat:

| Tuote | Kate, ALV vähennettävissä | Kate, ALV ei vähennettävissä | Hinta, jolla kate on 7 € ilman vähennystä |
|---|---|---|---|
| T-paita, suora vertailu (OPT) | 7,05-7,22 € | noin 2,8 € | 30,90 € |
| T-paita, muut (OPT) | 9,56 € (ka) | noin 5,1 € | 30,90 € |
| Huppari (Textildruck) | 10,29 € (ka) | noin 1,2 € | 59,90 € (3XL+ noin 66,90 €) |

Jos tilitoimisto toteaa, ettei ALV ole vähennettävissä, kaikkien t-paitojen ja huppareiden hintoja on nostettava.
Silloin t-paidat ylittävät kilpailijoiden 25-30 €:n haarukan. Tilitoimiston vahvistus on siksi tärkeä ennen
1.11.2026 (Uusiku Oy).

## Personoitu t-paita 29,90 € (29.10.2026)

Gildan Softstyle 64000, OPT OnDemand (Tšekki, pp 30), lennosta luotava Printify-tuote tilauskohtaisella
painokuvalla. Yhden kappaleen tilaus, asiakas maksaa toimituksen 6,90 € (myynti 36,80 €, alv 0 29,32 €), Printifyn
toimitus 8,49 €, Stripe 1,5 % + 0,25 €. Testitilaus 26630629.37 (luotu ja peruttu 29.10.2026): Printify veloittaisi
tuotteen 8,90 € ja toimituksen 8,49 €, eli samat kulut kuin valmiilla t-paidalla.

| Koko | Printify-tuotekulu | Nettokate | Kate % |
|---|--:|--:|--:|
| S-2XL | 8,90 € | 11,13 € | 38,0 % |
| 3XL-5XL | 9,93 € | 10,10 € | 34,4 % |

Kate on positiivinen jokaisessa koossa ja värissä (testi `src/test/personoitu.test.ts`). Valmiiseen 24,90 €:n
t-paitaan verrattuna kate on noin 3,90 € suurempi. Personoitu paita ei kuulu t-paitaparin eikä määräalennuksen piiriin
(kappalehinta ei ole 24,90 €), mutta kahden tuotteen -5 % koskee sitä kuten muitakin.

## Kumppanuusohjelma: provisio (hyväksytty 29.10.2026, käytössä)

**Päivitys 29.10.2026 illalla:** raja nostettu 5,00 €:sta **7,00 €:oon** (KUMPPANUUS.minKateEuroa = 7). Uusilla
hinnoilla provisio esimerkkitilauksissa:

| Tilaus | Provisio |
|---|---|
| t-paita 27,90 € (kate 9,57 €) | 2,22 € (täysi 10 %) |
| t-paita 24,90 € (kate 7,22 €) | 0,22 € |
| kaksi t-paitaa 27,90 € | 4,22 € |
| huppari 52,90 € (kate 10,14 €) | 3,14 € |
| 25 t-paitaa | 43,65 € |

Sivu /kumppanit, PROVISIOSAANTO ja KUMPPANIT-VIESTIPOHJA.md on päivitetty. Alla oleva 5 €:n laskelma on historiaa.

**Sääntö (hyväksytty):** provisio on enintään 10 % tilauksen tuotteiden arvosta ilman ALV:tä ja toimitusta, ja
enintään summa, joka jättää kauppaan provision jälkeen **vähintään 5,00 € nettokatetta**. Jos tilauksen kate on
5,00 € tai alle, provisio on 0. Kate lasketaan Printifyn todellisilla kuluilla (Stripe 1,5 % + 0,25 €); kun
Printify-kulu ei vielä ole tiedossa, provisio odottaa ("kate-tuntematon").

| Kori | Kate ennen provisiota | Provisio | Peruste | Kauppaan jää |
|---|--:|--:|---|--:|
| 1 t-paita (24,90 €) | 7,22 € | 1,98 € | täysi 10 % | 5,24 € |
| 2 t-paitaa (-5 %, 47,31 €) | 14,65 € | 3,77 € | täysi 10 % | 10,88 € |
| 1 huppari (49,99 €) | 7,86 € | 2,86 € | rajattu | 5,00 € |
| t-paita + huppari (-5 %, 71,15 €) | 7,01 € | 2,01 € | rajattu | 5,00 € |
| Black Friday -pari (44,90 €) | 12,77 € | 3,58 € | täysi 10 % | 9,19 € |
| Personoitu paita (29,90 €) | 11,13 € | 2,38 € | täysi 10 % | 8,75 € |
| 25 t-paitaa, määräalennus -12 % (547,80 €) | 158,89 € | 43,65 € | täysi 10 % | 115,24 € |
| Ensimmäinen oikea tilaus (huppari koodilla, 47,49 €) | 4,94 € | 0,00 € | ei | 4,94 € |

**Kannattavuus:** provisio maksetaan vain kumppanin tuomista tilauksista, ja kauppaan jää jokaisesta vähintään 5 €.
Jos kumppanit tuovat 10 lisätilausta kuukaudessa (keskikate noin 7-11 € ennen provisiota), kate kasvaa noin
55-75 €/kk ja provisiot ovat noin 20-30 €/kk.

**Toteutus:** `api/_lib/vakiot.js` KUMPPANUUS (kaytossa: true, 10 %, minKateEuroa 5), `api/_lib/kumppani.js`
(provisioJaTila, tarkistaKumppani), kumppanit taulussa `kumppanit` (`?tehtava=kumppani-lisaa` /
`kumppani-poista`), linkki `?ref=<koodi>` ja kassan kenttä Kumppanikoodi, tilauksen tapahtuma "kumppani",
kuukausiraportti `?tehtava=kumppanit&kuukausi=YYYY-MM`. Sivu /kumppanit, viestipohjat KUMPPANIT-VIESTIPOHJA.md.

## Määräalennus yrityksille ja ryhmille (29.10.2026)

**Ehto:** kate vähintään 5 € t-paitaa kohden heikoimmallakin koolla (tuotekulu 9,93 €). Printify toimittaa tilauksen
yhteen osoitteeseen, joten samaan tilaukseen kuuluvat t-paidat (OPT OnDemand, pp 30) maksavat toimituksen
8,49 € + 1,19 € jokaisesta lisäkappaleesta. Asiakkaan toimitus on ilmainen, koska 10 t-paitaa ylittää 79 €:n rajan.
Korttimaksu varovaisesti 3,25 % + 0,25 € (ensimmäisen oikean tilauksen todellinen maksu oli 3,7 %; EU-kortti 1,5 %).

| Tilaus | Suurin alennus, jolla kate >= 5 €/paita | Valittu porras | Kate/paita heikoin | Kate/paita tavallinen koko | Tilaus | Kate yhteensä (tavallinen) |
|---|--:|--:|--:|--:|--:|--:|
| 10 t-paitaa | 11,0 % | **-10 %** | 5,25 € | 6,28 € | 224,10 € | 62,83 € |
| 25 t-paitaa | 13,5 % | **-12 %** | 5,33 € | 6,36 € | 547,80 € | 158,89 € |
| 50 t-paitaa | 14,5 % | **-14 %** | 5,10 € | 6,13 € | 1 070,70 € | 306,30 € |

-15 % 50 paidalle antaisi heikoimmalla koolla 4,91 €/paita, joten porras on -14 %. Hupparit eivät kuulu
määräalennukseen (kate yhden hupparin tilauksessa 3,08-7,86 €).

**Toteutus** (`api/_lib/vakiot.js` MAARAALENNUS, `api/_lib/korialennus.js`): kassa laskee alennuksen automaattisesti
24,90 €:n t-paidoista, kun niitä on samassa tilauksessa 10, 25 tai 50; alennus korvaa kahden tuotteen -5 %:n ja
t-paitaparin, kun se on suurempi. Katevahti vaatii nettokatteen vähintään 5 € kelpaavaa t-paitaa kohden.
Katevahti täydentää nyt puuttuvat Printify-toimitustiedot pohjatuotteen ja painotalon taulukosta
(`PRINTIFY_TOIMITUS_FI`, `api/_lib/kate.js`): 304/391 t-paidan tuoteriviltä puuttui lisäkappaleen toimitus, ja
ilman täydennystä jokainen paita olisi laskettu omana lähetyksenään (määräalennus ei olisi koskaan toteutunut).

**Odotettu vaikutus (arvio, ei mitattua dataa):** yksi 25 paidan yritystilaus kuukaudessa tuo noin 159 € katetta,
kaksi 10 paidan tilausta noin 126 €. Marras-joulukuussa 1-3 yritystilausta kuukaudessa: noin 125-475 €/kk.

## Black Friday ja joulu 2026: kampanjavertailu (29.10.2026)

**Ajankohta:** Black Friday pe 27.11. - joulun takaraja (t-paidat ti 1.12., muut ma 30.11.). Kampanja-aika 5 päivää.

**Laskentaperuste:** sama kaava kuin "Keskiostoksen nosto: laskelma" (myynti alv 0 = maksettu / 1,255; nettokate =
myynti alv 0 - Printifyn tuotekulu - Printifyn toimitus painotaloittain - Stripe 1,5 % + 0,25 €). T-paita 24,90 €
(kulu 8,90 €, heikoin koko 9,93 €, OPT OnDemand, toimitus 8,49 € / lisäkpl 1,19 €), huppari 49,99 € (Textildruck,
25,48 € + 10,89 € / lisäkpl 2,39 €). Nykyinen kahden tuotteen -5 % ja toimitus 6,90 € alle 79 € ovat vertailukohta.

**Vaihtoehdot:**
- **A. Kaksi t-paitaa 44,90 €** (pari 49,80 € -> 44,90 €; korvaa -5 %:n, kun pari on asiakkaalle edullisempi).
- **B. Ilmainen toimitus 49 €:sta** (nyt 79 €).
- **C. Kaksi tuotetta -10 %** (nyt -5 %).
- **D. Lahjapaketti:** Printify ei tarjoa lahjapaketointia. Saatavilla on vain lahjaviestikortti (gift message,
  Etsy- ja käsin luodut tilaukset) ja painotalon pakkausliite (insert). Ei toteutettavissa omassa kassassa
  kauppiaan tilauksena, joten jätetään pois. Lähteet: help.printify.com "What are gift messages?" ja "How can I
  brand my products?" (tarkistettu hakutuloksista 29.10.2026).

**Korin nettokate € (asiakkaan maksama summa suluissa):**

| Kori | Nyky -5 % | A: 2 t-paitaa 44,90 € | B: ilmainen toimitus 49 €:sta | C: 2 tuotetta -10 % |
|---|--:|--:|--:|--:|
| 1 t-paita | 7,22 (31,80) | 7,22 (31,80) | 7,22 (31,80) | 7,22 (31,80) |
| 2 t-paitaa | 14,65 (54,21) | 12,77 (51,80) | 9,26 (47,31) | 12,71 (51,72) |
| 2 t-paitaa, heikoin koko | 12,59 | 10,71 (51,80) | 7,20 | 10,65 |
| 3 t-paitaa | 23,06 (77,86) | 22,15 (76,70) | 17,66 (70,96) | 20,14 (74,13) |
| 4 t-paitaa | 26,07 (94,62) | 22,30 (89,80) | 26,07 (94,62) | 22,17 (89,64) |
| 1 huppari | 7,86 (56,89) | 7,86 (56,89) | 2,46 (49,99) | 7,86 (56,89) |
| t-paita + huppari | 7,01 (78,05) | 7,01 (78,05) | 1,61 (71,15) | 4,08 (74,30) |
| 2 hupparia | 9,77 (94,98) | 9,77 (94,98) | 9,77 (94,98) | 5,86 (89,98) |

B menettää toimitusmaksun (6,90 € = 5,50 € alv 0) jokaisesta 49-79 €:n korista, myös hupparin ostajilta, jotka
ostaisivat ilman kampanjaakin (15 % tilauksista). C laskee hupparikorien katetta eikä kohdistu t-paitoihin. A koskee
vain t-paitapareja, eikä yksikään kori jää tappiolle (heikoin 10,71 €).

**Odotettu vaikutus kampanja-aikana (arvio, ei mitattua dataa).** Oletukset:
- Korijakauma nykyisistä tilauksista: 1 t-paita 70 %, 2 t-paitaa 5 %, 1 huppari 15 %, t-paita + huppari 3 %, muut 7 %
  (ennallaan, ei mukana).
- Nyky: 4 % yhden t-paidan tilauksista muuttuu kahden t-paidan tilauksiksi (-5 %).
- A: 15 % (varovainen) / 30 % (optimistinen) muuttuu pariksi; optimistisessa lisäksi +15 % tilauksia kampanjasta.
- B: 10 % / 20 % muuttuu pariksi; optimistisessa +15 % tilauksia.
- Tilauksia 5 päivässä: 3 (nykyinen 6 / 28 pv x joulusesonki noin 3x) ja 8 (Black Friday -liikenne).

| Vaihtoehto | Kate/tilaus | 3 tilausta | Muutos | 8 tilausta | Muutos |
|---|--:|--:|--:|--:|--:|
| Nyky -5 % | 7,38 € | 22,15 € | 0 € | 59,07 € | 0 € |
| A varovainen | 7,66 € | 22,99 € | +0,84 € | 61,32 € | +2,25 € |
| A optimistinen | 9,48 € | 28,45 € | +6,30 € | 75,88 € | +16,80 € |
| B varovainen | 6,08 € | 18,23 € | -3,92 € | 48,62 € | -10,45 € |
| B optimistinen | 7,15 € | 21,46 € | -0,69 € | 57,22 € | -1,85 € |

Myynti tilausta kohden: nyky 36,47 €, A varovainen 37,82 €, A optimistinen 45,91 € (sis. lisätilaukset).

**Kannattavuuden kynnys A:** jokainen yhden t-paidan tilaus, josta tulee pari, tuo +5,55 € (12,77 - 7,22); jokainen
pari, joka olisi tullut -5 %:lla ilman kampanjaa, maksaa 1,88 € (14,65 - 12,77). A on nykyistä parempi, kun
vähintään 7,8 % yhden t-paidan tilauksista muuttuu pariksi. B ei ole nykyistä parempi millään oletuksella.

**Kuluttajansuojalaki (2 luku 6 a §, KKV):** alennusmarkkinoinnissa on kerrottava tuotteen alin hinta edeltävän
30 päivän ajalta, ja kuluttaja-asiamiehen mukaan sääntö koskee myös ilmaisuja, jotka luovat mielikuvan alennuksesta
(esim. "Black Friday"). Siksi:
- Ei ennen-hintoja eikä yliviivattuja hintoja. T-paidan kappalehinta pysyy 24,90 €:ssa.
- Kampanjateksti kertoo aina myös t-paidan hinnan ja 30 päivän alimman hinnan: "Kaksi t-paitaa 44,90 € (kun korissa
  on kaksi t-paitaa). T-paidan hinta 24,90 €, alin hinta 30 päivän aikana 24,90 €."
- Prosenttia (esim. "-10 %") ei käytetä markkinoinnissa. Jos sitä käytetään, se lasketaan 30 päivän alimmasta hinnasta.
- **Ennen käyttöönottoa tarkistettava:** t-paitojen hinta on ollut 24,90 € koko 30 päivää ennen 27.11. (28.10.-26.11.).
  Jos hinta on muuttunut, päivitä `alinHinta30pv`.

**Suositus: A, "Kaksi t-paitaa 44,90 €", 27.11.-1.12.** Toteutettu valmiiksi, pois päältä:
- `api/_lib/vakiot.js` `TPAITAPARI_KAMPANJA` (`kaytossa: false`, alku 2026-11-27, loppu 2026-12-01, parihinta 44,90 €,
  alinHinta30pv 24,90 €).
- Kassa (`api/_lib/korialennus.js`): pari korvaa -5 %:n, kun se on suurempi; katevahti kuten ennen. Alennus jaetaan
  t-paitakappaleille ja pyöristetään sentin asiakkaan hyväksi (3 t-paitaa: 4,92 €).
- Ostoskori ja kassa näyttävät "Kaksi t-paitaa 44,90 €", korissa yhden t-paidan kanssa "Lisää toinen t-paita".
  T-paitojen tuotesivulla kampanjarivi 30 päivän alimman hinnan kanssa. Näkyy vain kampanja-aikana.
- Käyttöönotto Aarnin hyväksynnällä: `kaytossa: true`, testit, julkaisu.

## Hupparien hinta 27.10.2026 (oma tausta)

**Päätös:** S-2XL 52,90 € ja 3XL+ 59,90 €, mutta korkeintaan kilpailijoiden korkein hinta, jos kate pysyy
positiivisena. Hupparien katesääntö silloin 10 %.

**Kilpailijat** (Shopify-tuotesyötteet products.json, haettu 27.10.2026, painetut hupparit; tyhjät merkkituotteet,
bändituotteet, vetoketjuhupparit ja hupparimekot pois):

| Kauppa | Hupparit | S-2XL | 3XL+ |
|---|---|---|---|
| Meemirotta | 173 | 49,99 € (kaikki) | 49,99 € (kaikki) |
| Stuntman, huumorihupparit ("HUPPARI - ...") | 105 | 42,90-44,90 € | 44,90-49,90 € |
| Stuntman, Speed Kings -sarja (oma painatus) | 8 | 49,00 € | 55,00 € |
| Stuntman, Moto-hupparit | 9 | | 53,90 € |
| **Korkein** | | **49,99 € (Meemirotta)** | **55,00 € (Stuntman)** |

Päätetyt hinnat ylittäisivät kilpailijoiden tason, joten käytössä korkein kilpailijan hinta: **S-2XL 49,99 €,
3XL+ 55,00 €** (api/_lib/kokohinnat.js). Hinta riippuu koosta: tuotesivu näyttää valitun koon hinnan, kori ja kassa
veloittavat saman (palvelin laskee hinnan itse). Katesääntö hupparille 10 % (api/_lib/kate.js KATE_RAJAT), muille 20 %.
Alle rajan jäävä koko piilotetaan, muut koot jäävät myyntiin.

**Kate** (kaikki 164 hupparia, 2 988 varianttia Printifyn kuluilla ilman ALV:tä, yhden kappaleen tilaus, toimitusmaksu
6,90 €, Stripe 1,5 % + 0,25 €):

| Hinnat | S-2XL kate (min / mediaani) | 3XL+ kate (min / mediaani) | Alle 10 % | Alle 0 % | Tuotteita kaikki koot >= 10 % |
|---|---|---|---|---|---|
| Nykyinen 49,90 € kaikille | 11,1 % / 17,2 % (5,01 € / 7,79 €) | 0,7 % / 6,8 % (0,30 € / 3,08 €) | 338 | 0 | 132 |
| **Käytössä 49,99 € / 55,00 €** | **11,2 % / 17,3 % (5,08 € / 7,86 €)** | **8,7 % / 14,3 % (4,28 € / 7,06 €)** | **11** | **0** | **163** |
| Päätös 52,90 € / 59,90 € | 15,4 % / 21,3 % (7,35 € / 10,13 €) | 15,2 % / 20,5 % (8,12 € / 10,90 €) | 0 | 0 | 164 |

Kate on positiivinen kaikissa varianteissa. Alle 10 %: vain ICE AATANA -hupparin 11 kokoa 3XL-5XL (kulu 32,97 €, kate
8,7 %), jotka piilotetaan; tuote on myynnissä koissa S-2XL. Testisivulla myynnissä 163 hupparia (oli 0), molemmat
Tonnin seteli -hupparit (tonnin-seteli-huppari, se-oli-tonnin-seteli-huppari) kaikissa saatavissa koissa S-5XL.
Ero päätökseen: mediaanikate noin 2,30-3,80 € pienempi hupparia kohden, hinta kilpailijoiden tasolla.

## Tilauskohtaiset katteet (Printify, 1.6.2026 alkaen)

Päivitetty 2026-10-26 skriptillä `scripts/tilauskatteet.mjs` (Printify-kaupan kaikki tilaukset 1.6.2026 alkaen, perutut pois).
Myynti = kaupan nykyinen hinta (Supabase, printify_product_id; EU-kopiolle siirtokirjauksen kautta; varalla nimellä) x kpl +
toimitusmaksu 6,90 €, jos tuotteet alle 79 €. Myynti alv 0 = / 1,255. Nettokate = myynti alv 0 - Printifyn kulu ilman
alv:tä (total_price + total_shipping) - Stripe 1,5 % + 0,25 €. Printifyn veloittama alv (total_tax, 25,5 %) vähennetään
ALV-ilmoituksessa (kaupan pitäjä on ALV-rekisterissä, 1.11.2026 alkaen Uusiku Oy, FI36536667), joten se ei ole kulu; sarake vain tiedoksi.
Oletus: Printifyn summat ovat tilin valuutassa ja ne luetaan euroina (kuten muualla tässä tiedostossa). Jos tili on dollareissa, kulut ovat noin 13 % euromääriä suurempia (ajo `--kurssi 0.87`).
Asiakkaasta vain etunimi ja sukunimen alkukirjain. Hinta (P) = kaupasta ei löytynyt tuotetta, käytetty Printifyn
vähittäishintaa (metadata.price). Tyyppi manual = luotu Printifyn hallinnassa (voi olla korvaus tai uudelleenlähetys,
jolloin todellista myyntiä ei ole).

| Pvm | Asiakas | Tuotteet | Painotalo | Hinta sis. toimitus | Myynti alv 0 | Printify ilman alv | Printifyn alv (vähennetään) | Nettokate | Kate % |
|---|---|---|---|--:|--:|--:|--:|--:|--:|
| 4.6.2026 | (poistettu) | 1 x Mersumies \| Kahvikuppi (11oz / Black), 14,90 € | #274 CZ | 21,80 € | 17,37 € | 17,68 € | 4,50 € | -0,89 € | -5,1 % |
| 12.6.2026 (manual) | (poistettu) | 1 x Maailman Paras Ystävä ornament \| Ceramic Ornament (Circle / One Size), 19,90 € | Imagine Your Photos US **EI EU** | 26,80 € | 21,35 € | 15,71 € | 4,01 € | 4,99 € | 23,4 % |
| 29.6.2026 | (poistettu) | 1 x Olen eläkkeellä \| T-Paita (Dark Heather / XL), 24,90 € | #417 LV | 31,80 € | 25,34 € | 16,07 € | 4,09 € | 8,54 € | 33,7 % |
| 29.6.2026 | (poistettu) | 1 x Saatanan Tunarit \| T-Paita (Sport Grey / M), 24,90 € | #417 LV | 31,80 € | 25,34 € | 15,69 € | 3,99 € | 8,92 € | 35,2 % |
| 20.7.2026 | (poistettu) | 1 x maailman paras ÄITI \| Huppari (Light Pink / L), 49,90 € | Textildruck Europa DE | 56,80 € | 45,26 € | 35,39 € | 9,02 € | 8,77 € | 19,4 % |
| 28.7.2026 | (poistettu) | 1 x ICE AATANA｜T-Paita (White / XL), 24,90 € | #417 LV | 31,80 € | 25,34 € | 16,45 € | 4,19 € | 8,16 € | 32,2 % |
| 5.8.2026 | (poistettu) | 1 x Tonnin Seteli \| T-Paita (Black / 5XL), 24,90 € | OPT OnDemand CZ | 31,80 € | 25,34 € | 17,82 € | 4,54 € | 6,79 € | 26,8 % |
| 20.8.2026 | (poistettu) | 1 x 40 vuotta töitä, nyt ikuinen viikonloppu \| Muki (11oz), 19,90 € | SPOKE Custom Products US **EI EU** | 26,80 € | 21,35 € | 31,13 € | 7,93 € | -10,43 € | -48,8 % |
| 8.9.2026 | Johanna L. | 1 x 40v – henkisesti 18, tyylillä 40 \| Muki (11oz), 19,90 € | SPOKE Custom Products US **EI EU** | 26,80 € | 21,35 € | 31,13 € | 7,93 € | -10,43 € | -48,8 % |
| 28.9.2026 | Johanna H. | 1 x Tonnin Seteli \| Huppari (Black / L), 49,90 € | Textildruck Europa DE | 56,80 € | 45,26 € | 36,37 € | 9,27 € | 7,79 € | 17,2 % |
| 9.10.2026 | Liisa K. | 1 x 40 vuotta töitä, nyt ikuinen viikonloppu \| Muki (11oz), 19,90 € | SPOKE Custom Products US **EI EU** | 26,80 € | 21,35 € | 31,13 € | 7,93 € | -10,43 € | -48,8 % |
| 17.10.2026 | Tero H. | 1 x Tonnin Seteli \| T-Paita (S / White), 24,90 € | #417 LV | 31,80 € | 25,34 € | 13,59 € | 3,47 € | 11,02 € | 43,5 % |
| 21.10.2026 (manual) | Johanna H. | 1 x Tonnin Seteli \| Huppari (Black / L), 49,90 € | Textildruck Europa DE | 56,80 € | 45,26 € | 36,37 € | 0,00 € | 7,79 € | 17,2 % |
| 21.10.2026 (manual) | Tiina K. | 1 x Ceramic Mug (EU) (11oz), 9,80 € | OPT OnDemand CZ | 16,70 € | 13,31 € | 22,88 € | 5,83 € | -10,07 € | -75,7 % |
| 24.10.2026 | Noora S. | 1 x Tonnin Seteli \| T-Paita (S / Black), 24,90 € | #417 LV | 31,80 € | 25,34 € | 13,59 € | 3,47 € | 11,02 € | 43,5 % |
| 25.10.2026 | Satu V. | 1 x Tonnin Seteli \| T-Paita (3XL / Black), 24,90 € | #417 LV | 31,80 € | 25,34 € | 16,41 € | 4,18 € | 8,20 € | 32,4 % |
| 26.10.2026 | Niina Y. | 1 x 60v – kokenut, ei vanha \| T-Paita (M / Graphite Heather), 24,90 € | #417 LV | 31,80 € | 25,34 € | 13,59 € | 3,47 € | 11,02 € | 43,5 % |
| 29.10.2026 (uusi kassa) | Jaana V. | 1 x Amatimies \| Huppari (Black / L), 49,99 € -5 % koodi | Textildruck Europa DE | 54,39 € | 43,34 € | 36,37 € | 0,00 € | 4,94 € (Stripe 2,03 €) | 11,4 % |
| **Yhteensä** | 17 tilausta | | | 570,50 € | 454,58 € | 381,00 € | 87,82 € | 60,76 € | 13,4 % |

- Tilauksia 17, myynti sis. alv 570,50 €, ilman alv:tä 454,58 €, Stripe 12,82 €.
- Printifyn kulut ilman alv:tä 381,00 €: nettokate 60,76 € (13,4 %), keskimäärin 3,57 € tilausta kohden.
- Printifyn veloittama alv 87,82 € vähennetään ALV-ilmoituksessa (ei kulu).

Huomiot:

- 4.6.2026 (poistettu): tappiollinen (nettokate -0,89 €).
- 12.6.2026 (poistettu): Maailman Paras Ystävä ornament | Ceramic Ornament painettiin EU:n ulkopuolella (Imagine Your Photos, US).
- 20.8.2026 (poistettu): 40 vuotta töitä, nyt ikuinen viikonloppu | Muki painettiin EU:n ulkopuolella (SPOKE Custom Products, US).
- 20.8.2026 (poistettu): tappiollinen (nettokate -10,43 €).
- 8.9.2026 Johanna L.: 40v – henkisesti 18, tyylillä 40 | Muki painettiin EU:n ulkopuolella (SPOKE Custom Products, US).
- 8.9.2026 Johanna L.: tappiollinen (nettokate -10,43 €).
- 9.10.2026 Liisa K.: 40 vuotta töitä, nyt ikuinen viikonloppu | Muki painettiin EU:n ulkopuolella (SPOKE Custom Products, US).
- 9.10.2026 Liisa K.: tappiollinen (nettokate -10,43 €).
- 21.10.2026 Tiina K.: tappiollinen (nettokate -10,07 €).
- Kaupan tuotteista 125/820 osoittaa yhä EU-siirron vanhaan (EU:n ulkopuoliseen) Printify-tuotteeseen (printify_product_id = siirtokirjauksen vanhaId), esim. 100-akaalaista-verta-hauska-t-paita-0d6670, 100-harjavaltalaista-verta-hauska-t-paita-0d673b, 100-nummelalaista-verta-hauska-t-paita-0e8b16. Näiden tilaukset painetaan edelleen vanhalla painotalolla, kunnes kaupan rivi vaihdetaan EU-kopioon.

Printify Premium (34,99 €/kk, -20 % vain tuotekulusta, ei toimituksesta eikä verosta):

- Edelliset 30 pv (8 tilausta): tuotekulut 106,50 €, alennus brutto 21,30 €, nettosäästö -13,69 € (ei kannata, raja 35 € bruttoalennusta / 30 pv).
- 1.6.2026 alkaen (17 tilausta, noin 4,9 x 30 pv): tuotekulut 197,66 €, alennus brutto 39,53 €, maksut 174,95 € (5 kk), nettosäästö -135,42 €.

<!-- käsin: alku (skripti säilyttää) -->
### Liisan muki (9.10.2026): miksi tappiollinen ja miksi painettu Yhdysvalloissa

- Tilaus: Liisa K., 9.10.2026, Printify-tilaus kaupan API:n kautta (Huumorikauppa-label), yksi rivi:
  "40 vuotta töitä, nyt ikuinen viikonloppu | Muki" (11oz), Printify-tuote `6a40cc43d97be4f10b11b463`, blueprint 68
  (Mug 11oz, Generic brand), print_provider_id 1 = **SPOKE Custom Products, Norcross GA, US**.
- Painotalo ei ollut Printify Choice (id 99, reititysverkko, joka valitsee painotalon tilauskohtaisesti), vaan kiinteä
  yhdysvaltalainen painotalo: sekä tuotteen print_provider_id (nyt edelleen 1, tuote luotu 28.6.2026) että tilausrivin
  print_provider_id (1, metadata.country "United States") osoittavat SPOKEen. Printify ei siis reitittänyt tilausta
  väärin: tuote itse oli US-painotalolla.
- Kulut: tuote 6,44 + toimitus Yhdysvalloista Suomeen 24,69 + Printifyn alv 7,93 = **39,06** (tilin valuutassa).
  Ilmoitettu 33,98 € = 39,06 x 0,87, eli Printify-tili on todennäköisesti dollareissa ja tämän osion eurot ovat
  yläarvioita (ajo `--kurssi 0.87` antaa euromäärät). Myynti kaupan nykyhinnalla 19,90 + 6,90 = 26,80 € (alv 0
  21,35 €); ilmoitettu 23,80 € viittaa alennukseen tai vanhaan hintaan (Stripeä ei voitu tarkistaa). Kummallakin
  luvulla Printifyn kulu ylittää koko myynnin.
- Miksi US: EU-siirtoa ei ollut tilaushetkellä. Ensimmäinen siirto tehtiin 23.10.2026 (data/eu-siirto-2026-10-23.json):
  siinä mukista luotiin EU-kopio `6adac408e4dd88219a0b0b7a` (OPT OnDemand, CZ, blueprint 441), mutta kirjauksessa
  `julkaistu: false` ja `kanta: null`. Elävän kaupan (Lovable/Supabase) rivi osoittaa **yhä** vanhaan US-tuotteeseen,
  joten seuraava mukitilaus painettaisiin taas Yhdysvalloissa. Sama koskee 125/820 kaupan tuotetta (Huomiot yllä).
- Sama tuote ja sisartuote ("40v – henkisesti 18, tyylillä 40 | Muki", sama SPOKE-blueprint) tuottivat 20.8., 8.9. ja
  9.10. kolme tappiota, kukin noin -18,36 € (euroiksi luettuna).
- Korjaus: (1) kaupan printify_product_id EU-kopioihin (scripts/printify-eu-painotalot.mjs --paivita-kanta, vaatii
  kannan kirjoitusoikeuden; Lovable-kaupassa käsin) tai US-tuotteet pois myynnistä; (2) omassa taustassa tilausvahti
  (api/_lib/tilausvahti.js) pysäyttää ennen send_to_productionia jokaisen tilauksen, jonka painotalo on EU:n
  ulkopuolella (Printify Choice vain, jos tilausrivi kertoo EU-maan) tai jonka Printify-kulu ylittää myynnin alv 0,
  ja hälyttää omistajalle heti.
<!-- käsin: loppu -->

## EU-siirto: ennen ja jälkeen (25.10.2026)

Ennen = 22.10.2026, kaikki tuotteet vanhoilla painotaloilla. Jälkeen = EU-siirron kopioiden todelliset kulut
(`node scripts/katteet.mjs --eu`). Kate = heikoin variantti, yhden kappaleen tilaus, nykyiset hinnat.

| Kategoria | Tuotteita | Kate ennen (6,90/79) | Kate jälkeen (6,90/79) | Kate jälkeen (5,90/60) | Nettokate ennen | Nettokate jälkeen |
|---|---|---|---|---|---|---|
| T-paidat (24,90 €) | 310 | 11,2 % | 27,1 % | 24,8 % | 2,82 € | 6,88 € |
| Hupparit (49,90 €) | 163 | 9,8 % | 9,8 % | 8,2 % | 4,44 € | 4,45 € |
| Kaikki myynnissä | 481 | 10,3 % | 20,6 % | 18,4 % | 3,27 € | 5,89 € |

- Siirretty 557 tuotetta: 279 t-paitaa (Printify Choice ja Monster Digital -> OPT OnDemand, Tšekki) ja 278 mukia
  (-> OPT OnDemand Ceramic Mug EU). Kuvan paikka, koko ja kulma säilyvät; vanhat tuotteet jäävät Printifyyn.
- Ei siirretty: 136 Printify Choice -hupparia (Textildruck Europalla kate 6,8 % vs nykyinen 10,6 %), 10 tuotetta,
  joiden alkuperäinen kuva on poistettu Printifystä, ja tuotteet, joiden kohdepainotalo ei ole EU:ssa (Harrier GB,
  MWW On Demand US, Jondo US).
- Yksikään tuote ei yllä 40 %:iin nykyhinnoilla. Kalleimmalla koolla (kulu + toimitus suurin) 40 % vaatii
  t-paidalle 38,90 € (OPT OnDemand, kulu 12,22 € + toimitus 8,49 €) ja hupparille 89,90 € (Printify Choice,
  25,66 € + 15,59 €; yli 79 €:n tilaus on toimitusmaksuton). Hinnoittelu on omistajan päätös; oman taustan katesääntö estää myynnin
  alle 20 %:n katteella.
- Printify veloittaa tilauksista arvonlisäveron (25,5 %). Se vähennetään ALV-ilmoituksessa (1.11.2026
  alkaen Uusiku Oy, FI36536667), joten kulut yllä ovat ilman sitä.

## EU-kiinteät painotalot (26.10.2026)

Tavoite: yhtään tilausta ei paineta Yhdysvalloissa. Printify Choice (id 99) on reititysverkko (sijainti Miami US;
API ei kerro reititystä; toteutuneita tilauksia on mennyt sekä US- että LT-painotalolle). Kulut mitattu luomalla
Printifyyn testituotteet (otsikko "Copy of EU-hintavertailu <bp>-<pp>", yksi variantti käytössä; kaupan synkka tuo ne
copy-of-riveinä, jotka main piilottaa). Kate = api/_lib/kate.js laskeKate, hinta 49,90 €, toimitusmaksu 6,90 €.

**Hupparit** (Gildan 18500, blueprint 77, Choice: kulu 21,58 € S-XL / 23,77 € 2XL / 25,09-25,66 € 3XL-5XL, toimitus 15,59 €):

| Vaihtoehto (EU) | Kulu (etupaino) | Toimitus FI | Kate S-XL | Kate 2XL | Kate 3XL+ |
|---|---|---|---|---|---|
| Printify Choice (nykyinen) | 21,58-25,66 € | 15,59 € | 14,0 % | 9,0 % | 4,8-6,1 % |
| **Textildruck Europa (DE), 18500** | 24,77-25,48 € (3XL+ 29,49-30,19 €) | 10,89 € | 15,8-17,4 % | 15,8-17,4 % | 5,2 % |
| Atelier Katanga (FR), 18500 | 23,79 € (3XL+ 31,17 €) | 10,89 € | 19,6 % | 19,6 % | 3,0 % |
| OPT OnDemand (CZ), AWDis JH001 | 25,93 € (vain S-2XL) | 10,89 € | 14,7 % | 14,7 % | - |
| Textildruck Europa, AWDis JH001 | 25,73-26,39 € | 10,89 € | 13,7 % | 13,7 % | alle 0 % |
| OPT OnDemand, Gildan SF500 | 26,49 € (3XL+ 31,76 €) | 10,89 € | 13,5 % | 13,5 % | 1,6 % |
| Textildruck Europa, B&C WUI24 | 28,88 € | 10,89 € | 8,1 % | 8,1 % | alle 0 % |
| OPT OnDemand, B&C King / Stanley Stella Cruiser | 34,42 € / 47,04 € | 10,89 € | alle 0 % | alle 0 % | alle 0 % |

- Päätös: **Textildruck Europa** samalla blueprintilla. Jokainen yhdistetty variantti on vähintään yhtä kannattava
  kuin Choicella tai enintään 0,9 %-yks. heikompi (3XL värillinen 5,2 % vs 6,1 %). Atelier Katangalta puuttuvat Ash,
  Heather Navy ja Graphite Heather, ja sen 3XL-5XL on 1,8-3,1 %-yks. heikompi. Aiempi mittaus (6,8 %) sisälsi
  kaulapainon, joka maksaa Textildruckilla 2,78 € lisää (Choicella ei mitään).
- Siirretty 132 hupparia (data/eu-siirto-2026-10-26.json). Pudotettu 5 varianttia/tuote, joita Textildruckilla ei ole:
  Heather Navy S/M, Graphite Heather S/M, Heather Sport Royal S. Heikoimman variantin kate keskimäärin 9,0 % -> 15,8 %.
- Ei siirretty 4 hupparia, joissa on kaulapaino (slay-queen-huppari, super-aiska-huppari,
  maailman-paras-aiti-palkinnon-voittaja-huppari, saatanan-tunarit-huppari): Textildruckilla heikoin kate -1,1 % vs
  Choicen 4,8 % (yli 1 %-yks. heikompi).

**Muut:**

| Tuote | Nyt | EU-vaihtoehto | Kate nyt -> EU | Päätös |
|---|---|---|---|---|
| 3 SPOKE-mukia (luokka t-paidat, nimessä "teen") | SPOKE (US) 6,44 + 24,69 € | OPT Ceramic Mug EU 5,88 + 10,39 € | -29,7 % -> 30,8 % (24,90 €) | siirretty |
| 4 Harrier Accent -mukia (14,90-24,90 €) | Harrier (GB) 7,91 + 10,39 € | Textildruck Two-Tone 11oz 6,90 + 10,39 € | parempi 1,01 € | sääntö lisätty, ei siirtynyt (tekstitaso) |
| Body (Oma Teksti/Kuva) | SwiftPOD (US) 13,61 + 13,49 € | Textildruck BZ10 16,57 + 7,29 € | -13,3 % -> -0,1 % | sääntö (koot 6M->3-6M jne.), ei siirtynyt (tekstitaso) |
| Choice-/Monster Digital -paidat (6) | 10,10-21,40 + 10,39-13,49 € | OPT Softstyle 64000 | parempi | sääntö, ei siirtynyt (tekstitaso) |
| District Photo/Choice/Monster Digital -mukit (9) | 5,03-6,08 + 18,49-22,09 € | OPT Ceramic Mug EU | parempi | ei siirtynyt (tekstitaso) |
| Tarra (Oma Teksti/Kuva, 4,99 €) | SPOKE kiss-cut 1,50 + 14,49 € | OPT Square Vinyl 3,89 + 5,59 € | -89 % -> -14 % | ei siirretty: eri tuote (neliö, ei läpinäkyvää), tappiollinen kummallakin |
| Koristeet (2), lippis, peitto, seinätaulu | US | ei EU-painotaloa katalogissa (ornament, cap, velveteen blanket, canvas) | - | ei siirretty |

- Tekstitaso: 20 tuotteen kuvassa on Printifyn editorin tekstikerros (layerType "text"). API ei luo niitä
  ("Provided images do not exist"; kokeiltu myös tekstikentillä), joten siirto tehdään käsin Printifyssä (Duplicate,
  vaihda painotalo). Siirtoskripti ohittaa ne nyt selkeällä syyllä.
- Lovablen yösynkka EI osoita perusriviä uuteen kopioon: Printify listaa uusimman ensin, joten EU-kopio saa perusslugin
  ja päivittää perusrivin, mutta heti perään vanha tuote osuu samaan riviin printify_product_id:llä (kartta luetaan
  ennen silmukkaa) ja palauttaa sen. Siksi 24 näkyvää t-paitaa osoittaa yhä Choiceen, ja samoin käy 132 hupparille.

## Tappiotarkistus (variantit, joissa kulu > myynti ilman ALV:tä - Stripe)

Ajettu 2026-10-26 EU-siirron jälkeen: `npx tsx scripts/tappiotarkistus.mjs` (ympäristö kuten katteet.mjs). Jokainen aktiivinen
kauppatuote (Supabase) ja jokainen variant_map-variantti: tappio = laskeKate-nettokate < 0 (tuotekulu + Suomen toimitus,
1. kappale, vs (hinta + toimitusmaksu) / 1,255 - Stripe). Rivit, joilla on EU-kopio, arvioidaan myös kopion kuluilla ja
kopion omilla "Väri|Koko"-avaimilla; tulos on yhdiste (varovainen, pätee kumpaan tahansa tuotteeseen rivi yön jälkeen osoittaa).
Tulos `data/tappio-variantit.json` muodossa { slug: ["Väri|Koko", ...] } (main:n saatavuusdataan).

- Tuotteita 820, variantteja tarkistettu 9426 (nykyinen Printify-tuote) + 1814 (EU-kopio, 260 riviä), kulu tuntematon 0.
- Tappiollisia variantteja 307, 112 tuotteessa: nykyisellä tuotteella 307, EU-kopiolla 0.
- EU-kopioissa ei ole 858 rivin nykyistä avainta (pudotetut variantit, esim. hupparien Heather Navy S/M); ne poistuvat rivistä, kun synkka osoittaa kopioon.

| Kategoria | Tuotteita | Variantteja | Tappiollisia variantteja | Tuotteita, joissa tappiollinen variantti |
|---|---|---|---|---|
| t-paidat | 337 | 5083 | 104 | 9 |
| mukit | 311 | 343 | 122 | 98 |
| hupparit | 164 | 3865 | 17 | 1 |
| koristeet | 2 | 2 | 0 | 0 |
| pipot | 1 | 8 | 0 | 0 |
| peitot | 1 | 3 | 3 | 1 |
| pitkahihaiset | 1 | 61 | 0 | 0 |
| seinataulut | 1 | 1 | 1 | 1 |
| tarrat | 1 | 5 | 5 | 1 |
| bodyt | 1 | 55 | 55 | 1 |

Tappiolliset muut kuin mukit (mukit ovat piilossa: 98 mukia, kaikki tappiolliset nykyisellä tuotteella, EU-kopiolla 0):

| Tuote | Kategoria | Hinta | Variantteja | Tappiollisia |
|---|---|---|---|---|
| oma-tekstikuva-vauvantaaperon-body | bodyt | 24,90 € | 55 | 55 |
| ice-aatanahuppari | hupparit | 49,90 € | 73 | 17 |
| oma-tekstikuva-peitto | peitot | 34,90 € | 3 | 3 |
| oma-tekstikuva-seinataulu | seinataulut | 39,90 € | 1 | 1 |
| 30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-muki | t-paidat | 24,90 € | 1 | 1 |
| hauska-kahvimuki-baristalle-teen-taidetta-joka-paiva | t-paidat | 24,90 € | 1 | 1 |
| kouvola-suomen-keskilapsi-kaikki-tuntee-hauska-kahvimuki | t-paidat | 24,90 € | 1 | 1 |
| maailman-paras-aiti-palkinnon-voittaja-t-shirt-t-paita | t-paidat | 24,90 € | 62 | 10 |
| ois-viisaampi-haipyy-taalt-t-paita | t-paidat | 24,90 € | 56 | 24 |
| slay-queen-t-paita | t-paidat | 24,90 € | 72 | 13 |
| super-aiska-t-paita | t-paidat | 24,90 € | 71 | 12 |
| valmentajani-on-vaarallinen-ihminen-t-paita | t-paidat | 24,90 € | 28 | 28 |
| yksi-kerta-viela-t-paita | t-paidat | 24,90 € | 14 | 14 |
| oma-tekstikuva-tarra | tarrat | 4,99 € | 5 | 5 |

- Hupparit: EU-kopioilla (Textildruck Europa) ei yhtään tappiollista varianttia; ice-aatanahuppari (jo ennestään Textildruck Europalla, ei tämän siirron tuote) 3XL-5XL tappiollisia.
- T-paidat: kolme "t-paidat"-luokan riviä ovat mukeja (SPOKE, piilossa nimen perusteella). Muut tappiolliset ovat tekstitasollisia Choice- ja Monster Digital -paitoja (4XL-5XL tai kaikki Garment-Dyed-variantit), joita ei voitu siirtää API:lla.
- Oma tausta estää nämä jo: api/_lib/kate.js KATE_RAJA 20 % (myynnissa() piilottaa tuotteen, jonka heikoin variantti on alle rajan, ja kassa hylkää; testi src/test/oma-tausta.test.ts).


## Mukit EU-painotalolla

OPT OnDemand Ceramic Mug (EU): tuotekulu 5,88 €, toimitus Suomeen 10,39 €. Hinnalla 16,90 €:
- nykyisellä toimitusmaksulla 6,90 € (ilmainen 79 €:sta): nettokate 2,09 €, kate 11,0 %
- 5,90 € / 60 €: nettokate 1,31 €, kate 7,2 %

Alle 40 %, joten mukit pysyvät piilossa. 40 %:n kate vaatisi hinnan 28,90 € (toimitus 6,90 €).

## Keskiostoksen nosto: laskelma

Laskettu 27.10.2026. Tavoite: nostaa keskiostosta (nyt 28,80 € tuotteita tilausta kohden, lähes kaikki tilaukset
yksi tuote: 17/17 tilausta 1.6.2026 alkaen) niin, että jokaisen korin kate pysyy positiivisena.

**Kaava** (sama kuin muualla tässä tiedostossa): maksettu = tuotteet alennuksen jälkeen + asiakkaan toimitusmaksu;
myynti alv 0 = maksettu / 1,255; nettokate = myynti alv 0 - Printifyn tuotekulu (ilman ALV:tä) - Printifyn toimitus -
Stripe (1,5 % + 0,25 €). Ilmaisen toimituksen raja lasketaan alennusta edeltävästä summasta (kuten kassa).

**Kulut** (scratchpad katteet-jalkeen.json, EU-siirron jälkeen; heikoin variantti erikseen):

| Tuote | Hinta | Tuotekulu | Painotalo | Printify-toimitus Suomeen: 1. kpl / lisäkpl |
|---|--:|--:|---|--:|
| T-paita (275 tuotetta) | 24,90 € | 8,90 € (heikoin 9,93 €) | OPT OnDemand (pp 30, bp 145) | 8,49 / 1,19 |
| Huppari (132) | 49,90 € | 23,77 € | Printify Choice (pp 99, bp 77) | 15,59 / 10,00 |
| Huppari (26) | 49,90 € | 30,19 € | Textildruck Europa (pp 26, bp 77) | 10,89 / 2,39 |
| Juliste A3 (12) | 22,90 € | 7,09 € | OPT OnDemand (pp 30, bp 443) | 8,49 / 1,99 |

Toimitukset haettu 27.10.2026 Printifyn katalogista (GET catalog/blueprints/.../print_providers/.../shipping.json,
Suomen profiili; Printify Choice: REST_OF_THE_WORLD). Katalogi ilmoittaa summat dollareina; ne luetaan euroina kuten
muualla tässä tiedostossa (jos tili on dollareissa, todelliset kulut ovat pienemmät). Printify veloittaa toimituksen
painotaloittain: saman painotalon toinen kappale maksaa lisäkappaleen hinnan, eri painotalojen tuotteet lähtevät
erikseen (t-paita + huppari = kaksi ensimmäistä kappaletta).

### Korien kate (nettokate € tilausta kohden)

Ilmaisen toimituksen raja ja toimitusmaksu (B):

| Kori (tuotteet €) | A nyky 6,90 / 79 | B 6,90 / 50 | B 6,90 / 60 | B 6,90 / 69 | B 5,90 / 50 | B 5,90 / 60 | B 5,90 / 69 | B 5,90 / 79 |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| 1 t-paita (24,90) | 7,22 | 7,22 | 7,22 | 7,22 | 6,44 | 6,44 | 6,44 | 6,44 |
| 1 t-paita (heikoin) (24,90) | 6,19 | 6,19 | 6,19 | 6,19 | 5,41 | 5,41 | 5,41 | 5,41 |
| 2 t-paitaa (49,80) | 16,60 | 16,60 | 16,60 | 16,60 | 15,82 | 15,82 | 15,82 | 15,82 |
| 3 t-paitaa (74,70) | 25,98 | 20,58 | 20,58 | 20,58 | 20,58 | 20,58 | 20,58 | 25,19 |
| 1 huppari (Choice) (49,90) | 4,80 | 4,80 | 4,80 | 4,80 | 4,02 | 4,02 | 4,02 | 4,02 |
| 1 huppari (Textildruck) (49,90) | 3,08 | 3,08 | 3,08 | 3,08 | 2,30 | 2,30 | 2,30 | 2,30 |
| t-paita + huppari (Choice) (74,80) | 6,87 | 1,48 | 1,48 | 1,48 | 1,48 | 1,48 | 1,48 | 6,09 |
| t-paita + huppari (Textildruck) (74,80) | 5,15 | -0,24 | -0,24 | -0,24 | -0,24 | -0,24 | -0,24 | 4,37 |
| 2 huppari (Choice) (99,80) | 4,64 | 4,64 | 4,64 | 4,64 | 4,64 | 4,64 | 4,64 | 4,64 |
| 2 huppari (Textildruck) (99,80) | 4,11 | 4,11 | 4,11 | 4,11 | 4,11 | 4,11 | 4,11 | 4,11 |
| t-paita + juliste (47,80) | 16,05 | 16,05 | 16,05 | 16,05 | 15,26 | 15,26 | 15,26 | 15,26 |
| 1 juliste (22,90) | 7,47 | 7,47 | 7,47 | 7,47 | 6,69 | 6,69 | 6,69 | 6,69 |
| 2 julistetta (45,80) | 16,29 | 16,29 | 16,29 | 16,29 | 15,51 | 15,51 | 15,51 | 15,51 |
| huppari (Choice) + juliste (72,80) | 7,12 | 1,73 | 1,73 | 1,73 | 1,73 | 1,73 | 1,73 | 6,34 |
| 2 t-paitaa + huppari (Choice) (99,70) | 10,86 | 10,86 | 10,86 | 10,86 | 10,86 | 10,86 | 10,86 | 10,86 |

Kahden tuotteen alennus (C, koko tilaus, kun korissa on vähintään 2 tuotetta) ja yhdistelmät (D):

| Kori (tuotteet €) | A nyky 6,90 / 79 | C 2 tuotetta -10 % (6,90 / 79) | C 2 tuotetta -5 % (6,90 / 79) | D 2 tuotetta -10 % + 5,90 / 79 | D 2 tuotetta -10 % + 6,90 / 69 | D 2 tuotetta -5 % + 6,90 / 69 | D 2 tuotetta -5 % + 5,90 / 60 |
|---|--:|--:|--:|--:|--:|--:|--:|
| 1 t-paita (24,90) | 7,22 | 7,22 | 7,22 | 6,44 | 7,22 | 7,22 | 6,44 |
| 1 t-paita (heikoin) (24,90) | 6,19 | 6,19 | 6,19 | 5,41 | 6,19 | 6,19 | 5,41 |
| 2 t-paitaa (49,80) | 16,60 | 12,71 | 14,65 | 11,92 | 12,71 | 14,65 | 13,87 |
| 3 t-paitaa (74,70) | 25,98 | 20,14 | 23,05 | 19,35 | 14,74 | 17,66 | 17,66 |
| 1 huppari (Choice) (49,90) | 4,80 | 4,80 | 4,80 | 4,02 | 4,80 | 4,80 | 4,02 |
| 1 huppari (Textildruck) (49,90) | 3,08 | 3,08 | 3,08 | 2,30 | 3,08 | 3,08 | 2,30 |
| t-paita + huppari (Choice) (74,80) | 6,87 | 1,03 | 3,95 | 0,24 | -4,37 | -1,44 | -1,44 |
| t-paita + huppari (Textildruck) (74,80) | 5,15 | -0,69 | 2,23 | -1,48 | -6,09 | -3,16 | -3,16 |
| 2 huppari (Choice) (99,80) | 4,64 | -3,16 | 0,74 | -3,16 | -3,16 | 0,74 | 0,74 |
| 2 huppari (Textildruck) (99,80) | 4,11 | -3,69 | 0,21 | -3,69 | -3,69 | 0,21 | 0,21 |
| t-paita + juliste (47,80) | 16,05 | 12,31 | 14,18 | 11,53 | 12,31 | 14,18 | 13,39 |
| 1 juliste (22,90) | 7,47 | 7,47 | 7,47 | 6,69 | 7,47 | 7,47 | 6,69 |
| 2 julistetta (45,80) | 16,29 | 12,71 | 14,50 | 11,93 | 12,71 | 14,50 | 13,72 |
| huppari (Choice) + juliste (72,80) | 7,12 | 1,43 | 4,27 | 0,65 | -3,97 | -1,12 | -1,12 |
| 2 t-paitaa + huppari (Choice) (99,70) | 10,86 | 3,06 | 6,96 | 3,06 | 3,06 | 6,96 | 6,96 |

Huomiot:
- Ilmainen toimitus alle 79 €:n rajalla tekee t-paita + Textildruck-huppari -korista tappiollisen (-0,24 €), koska
  kahden painotalon toimitus (8,49 + 10,89 €) jää kauppiaan maksettavaksi. Kaikki rajat 50-69 € hylätään.
- -10 % kahden tuotteen alennus tekee kahden hupparin korista tappiollisen (-3,16 € ja -3,69 €) ja t-paita +
  Textildruck-huppari -korista tappiollisen (-0,69 €). Hylätään.
- -5 % pitää jokaisen korin positiivisena (heikoin kaksi Textildruck-hupparia 0,21 €).
- Raja 50 € ei vaikuta kahden t-paidan koriin (49,80 €), joten se ei houkuttele lisätuotteeseen t-paidan ostajaa.

### Odotettu kate kuukaudessa

**Oletukset (arvioita, ei mitattua dataa):**
- Lähtöjakauma (yhden tuotteen tilaukset, sopii nykyiseen 28,80 €:n keskiostokseen): t-paita 75 %, huppari 15 %
  (Choice 12 %, Textildruck 3 %), juliste tai muu edullinen tuote 10 %. Kahden tuotteen tilauksia nyt 0 %.
- Tilausten määrä ei muutu tarjouksen takia (vain korin koko).
- Kahden tuotteen alennus, osuus yhden tuotteen tilauksista, jotka muuttuvat kahden tuotteen tilauksiksi:
  -10 %: varovainen 8 %, optimistinen 20 %; -5 %: varovainen 4 %, optimistinen 10 %.
- Ilmaisen toimituksen raja 50-69 €: hupparin ostajista lisää t-paidan varovainen 4 % / optimistinen 10 %, t-paidan
  ostajista t-paita + huppari 1 % / 3 % (kahden t-paidan kori ei ylitä rajaa 50-69 €), julisteen ostajista 0 %.
- Volyymi: nyt noin 8 tilausta / 30 pv, vertailuna 16 (2x).

| Vaihtoehto | Kaikki korit > 0 € | Heikoin kori | Kate €/tilaus (varovainen / optimistinen) | Tuotteet €/tilaus (var. / opt.) | €/kk, 8 tilausta (var. / opt.) | €/kk, 16 tilausta (var. / opt.) | Muutos €/kk nykyiseen, 8 / 16 tilausta (var. / opt.) |
|---|---|---|--:|--:|--:|--:|--:|
| A nyky 6,90 / 79 | kyllä | 1 huppari (Textildruck) 3,08 | 6,83 / 6,83 | 28,45 / 28,45 | 54,65 / 54,65 | 109,30 / 109,30 | 0,00 / 0,00; 0,00 / 0,00 |
| B 5,90 / 50 | ei | t-paita + huppari (Textildruck) -0,24 | 6,00 / 5,90 | 28,97 / 29,95 | 47,97 / 47,20 | 95,95 / 94,39 | -6,67 / -7,45; -13,35 / -14,90 |
| B 5,90 / 60 | ei | t-paita + huppari (Textildruck) -0,24 | 6,00 / 5,90 | 28,97 / 29,95 | 47,97 / 47,20 | 95,95 / 94,39 | -6,67 / -7,45; -13,35 / -14,90 |
| B 5,90 / 69 | ei | t-paita + huppari (Textildruck) -0,24 | 6,00 / 5,90 | 28,97 / 29,95 | 47,97 / 47,20 | 95,95 / 94,39 | -6,67 / -7,45; -13,35 / -14,90 |
| B 5,90 / 79 | kyllä | 1 huppari (Textildruck) 2,30 | 6,05 / 6,05 | 28,45 / 28,45 | 48,39 / 48,39 | 96,79 / 96,79 | -6,25 / -6,25; -12,51 / -12,51 |
| B 6,90 / 50 | ei | t-paita + huppari (Textildruck) -0,24 | 6,77 / 6,65 | 28,97 / 29,95 | 54,14 / 53,22 | 108,29 / 106,43 | -0,50 / -1,43; -1,01 / -2,86 |
| B 6,90 / 60 | ei | t-paita + huppari (Textildruck) -0,24 | 6,77 / 6,65 | 28,97 / 29,95 | 54,14 / 53,22 | 108,29 / 106,43 | -0,50 / -1,43; -1,01 / -2,86 |
| B 6,90 / 69 | ei | t-paita + huppari (Textildruck) -0,24 | 6,77 / 6,65 | 28,97 / 29,95 | 54,14 / 53,22 | 108,29 / 106,43 | -0,50 / -1,43; -1,01 / -2,86 |
| C 2 tuotetta -10 % (6,90 / 79) | ei | 2 huppari (Textildruck) -3,69 | 7,15 / 7,64 | 30,44 / 33,43 | 57,23 / 61,10 | 114,46 / 122,20 | 2,58 / 6,45; 5,16 / 12,90 |
| C 2 tuotetta -5 % (6,90 / 79) | kyllä | 2 huppari (Textildruck) 0,21 | 7,08 / 7,44 | 29,45 / 30,94 | 56,61 / 59,54 | 113,21 / 119,08 | 1,96 / 4,89; 3,91 / 9,79 |
| D 2 tuotetta -10 % + 5,90 / 79 | ei | 2 huppari (Textildruck) -3,69 | 6,37 / 6,86 | 30,44 / 33,43 | 50,97 / 54,84 | 101,95 / 109,69 | -3,67 / 0,20; -7,35 / 0,39 |
| D 2 tuotetta -5 % + 6,90 / 69 | ei | t-paita + huppari (Textildruck) -3,16 | 6,94 / 7,07 | 29,97 / 32,44 | 55,53 / 56,58 | 111,05 / 113,17 | 0,88 / 1,94; 1,76 / 3,87 |
| D 2 tuotetta -5 % + 5,90 / 60 | ei | t-paita + huppari (Textildruck) -3,16 | 6,17 / 6,33 | 29,97 / 32,44 | 49,39 / 50,66 | 98,79 / 101,32 | -5,25 / -3,99; -10,51 / -7,98 |
| D 2 tuotetta -10 % + 6,90 / 69 | ei | t-paita + huppari (Textildruck) -6,09 | 6,95 / 7,08 | 30,97 / 34,93 | 55,57 / 56,62 | 111,15 / 113,23 | 0,93 / 1,97; 1,85 / 3,94 |

Kannattavuuden kynnys kahden tuotteen alennukselle (-5 %): jokainen yhden t-paidan tilaus, joka muuttuu kahden
t-paidan tilaukseksi, tuo 14,65 - 7,22 = 7,43 € lisää; jokainen kahden t-paidan tilaus, joka olisi tullut ilman
tarjousta, maksaa 16,60 - 14,65 = 1,95 €. Tarjous kannattaa, kun vähintään 21 % alennetuista tilauksista on
tarjouksen synnyttämiä (1,95 / (7,43 + 1,95)).

### Suositus

**Kahden tuotteen alennus -5 %, toimitus ennallaan 6,90 € alle 79 €.** Ainoa vertailun tarjous, joka nostaa
odotettua katetta ja pitää jokaisen korin positiivisena:
- 8 tilausta / kk: +1,96 € (varovainen) ... +4,89 € (optimistinen) kuukaudessa, nettokate 54,65 € -> 56,61-59,54 €.
- 16 tilausta / kk: +3,91 € ... +9,79 € kuukaudessa, nettokate 109,30 € -> 113,21-119,08 €.
- Keskiostos (tuotteet) 28,45 € -> 29,45-30,94 €.

Hylätyt: oman taustan aiempi suunnitelma 5,90 € / 60 € (tappiollinen kori, -6,67...-7,45 € / kk 8 tilauksella),
muut rajat 50-69 € (tappiollinen kori, odotettu kate laskee), -10 % (tappiolliset korit), kaikki yhdistelmät
(tappiollinen kori). Oman taustan toimitus palautettiin samaksi kuin live-kaupassa (6,90 € / 79 €).

### Tarran lisämyynti ostoskorissa ("Lisää tarra 11,90 €"), 27.10.2026

Vertailtiin kolmea vaihtoehtoa: ilmaisen toimituksen raja, "2 tuotetta -10 %" ja tarran lisämyynti.

- Raja 50-69 €: tappiollinen kori (t-paita + Textildruck-huppari -0,24 €), hylätty (yllä).
- 2 tuotetta -10 %: tappiolliset korit (2 Textildruck-hupparia -3,69 €), hylätty (yllä). Paras alennusvaihtoehto
  on -5 %, joka on valmiina oman taustan kassassa ja tulee voimaan sen käyttöönotossa.
- Tarra 11,90 € (Se oli tonnin seteli, OPT OnDemand pp 30, bp 476): tuotekulu 3,89 €, toimitus Suomeen 5,59 € (1. kpl),
  0,10 € lisäkappaleena saman painotalon (OPT) tuotteen kanssa. Lisäkate: +5,31 €, kun korissa on OPT-tuote
  (t-paita tai juliste), -0,18 €, kun tarra lähtee erikseen (esim. #417-paita), koska erillinen toimitus 5,59 € syö katteen.

Live-kassa (Lovable) veloittaa yhä 3,90 € ja antaa ilmaisen toimituksen 60 eurosta (tilaus 26630629.21: 19,90 + 3,90 =
23,80 €), vaikka repossa kassa on 6,90 € / 79 € (muutos 29.9.2026 ei ole julkaistu Lovablessa). Siksi korit lasketaan
molemmilla säännöillä:

| Kori | Ilman tarraa 6,90/79 | Tarran kanssa 6,90/79 | Muutos | Ilman tarraa 3,90/60 | Tarran kanssa 3,90/60 |
|---|--:|--:|--:|--:|--:|
| 1 t-paita OPT | 7,22 | 12,54 | 5,31 | 4,88 | 10,19 |
| 1 t-paita OPT heikoin | 6,19 | 11,51 | 5,31 | 3,85 | 9,16 |
| 1 t-paita #417 | 11,02 | 10,85 | -0,18 | 8,68 | 8,50 |
| 2 t-paitaa OPT | 16,60 | 21,91 | 5,31 | 14,25 | 16,52 |
| 3 t-paitaa OPT | 25,98 | 25,89 | -0,08 | 20,58 | 25,89 |
| 1 huppari Choice | 4,80 | 4,62 | -0,18 | 2,45 | -0,77 |
| 1 huppari Textildruck | 3,08 | 2,90 | -0,18 | 0,73 | -2,49 |
| t-paita OPT + huppari Choice | 6,87 | 6,79 | -0,08 | 1,48 | 6,79 |
| t-paita OPT + huppari Textildruck | 4,12 | 4,04 | -0,08 | -1,27 | 4,04 |
| t-paita #417 + huppari Textildruck | 8,95 | 3,38 | -5,57 | 3,56 | 3,38 |
| 2 huppari Choice | 4,64 | 4,47 | -0,18 | 4,64 | 4,47 |
| 2 huppari Textildruck | 4,11 | 3,94 | -0,18 | 4,11 | 3,94 |
| 1 juliste | 7,47 | 12,78 | 5,31 | 5,12 | 10,44 |
| t-paita OPT + juliste | 16,05 | 21,36 | 5,31 | 13,70 | 19,01 |
| huppari Choice + juliste | 7,12 | 7,04 | -0,08 | 1,73 | 7,04 |

Tulos: sivuston säännöllä (6,90 / 79) jokainen kori pysyy positiivisena tarran kanssa. Live-kassan säännöllä (3,90 / 60)
huppari + tarra ylittää 60 €:n rajan ja kori menee tappiolle (-0,77 / -2,49 €). Toteutus: tarraa ehdotetaan vain koriin,
jossa ei ole huppareita eikä tarraa (`src/lib/lisatarra.ts`, ostoskorin `TarraLisamyynti`). Silloin jokainen kori on
positiivinen molemmilla säännöillä. Huom: live-kassan säännöllä t-paita + Textildruck-huppari on tappiollinen jo ilman
tarraa (-1,27 €), mikä korjaantuu, kun kassa julkaistaan 6,90 € / 79 € -säännöllä.

Odotettu vaikutus (arvio, ei mitattua dataa): tarra lisätään 4 % (varovainen) tai 10 % (optimistinen) hupparittomista
koreista (noin 85 % tilauksista). Paidoista noin kolmannes on OPT:llä (lisäkate +5,31 €), loput #417:llä (-0,18 €),
keskimäärin +1,65 € lisättyä tarraa kohden. 8 tilausta / kk: +0,45 ... +1,12 €/kk; 16 tilausta / kk: +0,90 ... +2,24 €/kk.
Pieni, mutta ainoa kolmesta, joka toimii heti live-kassassa ilman tappiollista koria. Kun paidat siirtyvät OPT:lle
(EU-kopiot), lisäkate nousee kohti +5,31 €:a (8 tilausta / kk: +1,44 ... +3,61 €/kk).

### Toteutus (oma tausta, haara keskiostos oma-taustan päällä)

Tarjous tulee voimaan vasta uuden taustan käyttöönotossa. Live-kaupan kassa (Lovable, main) ei muutu.

- Vakiot `api/_lib/vakiot.js`: `TOIMITUS` 6,9, `ILMAINEN_TOIMITUS_RAJA` 79, `KORIALENNUS_PROSENTTI` 5,
  `KORIALENNUS_MIN_KPL` 2, `KORIALENNUS_MIN_KATE_EUROA` 0 (katevahdin raja). Sivuston tekstit (`src/config/toimitus.ts`)
  ja Merchant-syöte (`api/_lib/syote-lisakentat.js`) samat.
- Palvelin laskee alennuksen (`api/_lib/korialennus.js`, kutsu `api/_lib/kassa.js`): hinnat tuotetaulusta, ei
  selaimelta. Ei alennuskoodin kanssa, ei lahjakorteille, pakettiriviä ei alenneta toiseen kertaan.
- Katevahti: alennusta ei anneta, jos tilauksen nettokate alennuksen jälkeen olisi alle 0 € tai alle asetetun rajan.
  Laskenta käyttää Printifyn todellista toimitusta painotaloittain (`api/_lib/kate.js` `laskeTilauksenNettokate`).
  Jos tuotteelta puuttuu lisäkappaleen toimitus tai painotalo, jokainen kappale lasketaan ensimmäisen kappaleen
  hinnalla (varovaisesti). Aja ennen käyttöönottoa `node scripts/printify-tuonti.mjs --kulut`, joka tallentaa
  `variants.shipping_additional_cents` ja `variants.print_provider_id`.
- Ostoskori, minikori ja kassasivu: vihje ja edistymispalkki "Lisää toinen tuote, saat -5 %", alennusrivi "Kahden
  tuotteen alennus (-5 %)" (`src/components/KorialennusVihje.tsx`, `src/lib/ostoskori.ts` `korialennusTila`, sama
  laskenta kuin kassalla).
- Oman taustan 20 %:n myyntiraja estää edelleen 49,90 €:n hupparit (kate 10,6 %), joten huppareita sisältävät korit
  koskevat live-kauppaa; laskelma kattaa ne silti.
- Testit: `src/test/korialennus.test.ts`.

## Ilmaisen toimituksen mittari ja lisätuote 28.10.2026

**Toteutus:** ostoskorin mittari "Lisää X € ilmaiseen toimitukseen" ehdottaa korille, joka jää alle ilmaisen
toimituksen rajan (79 €), yhtä lisätuotetta, joka kuroo puuttuvan summan parhaiten umpeen (`api/_lib/lisatuote.js`,
`src/lib/lisatarra.ts` `valitseMittarinLisa`, `src/components/MittarinLisatuote.tsx`, lisäys yhdellä painalluksella).

- Ehdokkaat: tarrat (Se oli tonnin seteli -tarra 11,90 €, ei personoitavia) ja julisteet (seinataulut, slug päättyy
  `-juliste-poster`, 22,90 €). Mukit eivät ole koskaan ehdokkaita (piilotettu kategoria ja mukin tunniste).
- Järjestys: ensin rajan ylittävät (pienin ylitys), sitten lähimmäs rajaa vievät; tasatilanteessa sama teema kuin
  korissa, sitten suurempi nettokate.
- Katevahti: ehdotus vain, jos koko korin nettokate lisätuotteen kanssa on yli 0 € (`LISATUOTE_MIN_KATE_EUROA`).
  Laskenta kuten kassa: toimitusmaksu alennusta edeltävästä summasta, pakettialennus, kahden tuotteen alennus -5 %
  (lisätuote tekee yhden tuotteen korista kahden tuotteen korin) ja Printifyn toimitus painotaloittain
  (`laskeTilauksenNettokate`). Tuntematon kulu: ei ehdotusta.
- Hupparisääntö säilyy: hupparikoriin ei ehdoteta tarraa. Rajan ylittäneen korin "Lisää tarra" -rivi
  (`TarraLisamyynti`) näytetään vain, kun toimitus on jo ilmainen, ja sekin vain positiivisella katteella.

**Kulut** (tuoterivit GET /api/products 28.10.2026): t-paita 8,90 € + toimitus 8,49 €, huppari (Tonnin seteli,
49,99 €) 25,48 € + 10,89 €, tarra 3,89 € + 5,59 € (lisäkappale 0,10 €, OPT pp 30), juliste 7,09 € + 9,29 €
(lisäkappale 1,99 €, OPT pp 30). T-paitojen ja huppareiden tuoteriveiltä puuttuvat `print_provider_id` ja
`shipping_additional_cents`, joten katevahti laskee ne varovaisesti erillisinä lähetyksinä (A). Printify laskuttaa
kuitenkin painotaloittain: t-paita (OPT) ja juliste lähtevät samassa lähetyksessä, huppari (Textildruck) erikseen (B).
Varovainen laskenta muuttuu todelliseksi, kun `node scripts/printify-tuonti.mjs --kulut` tallentaa puuttuvat kentät.

**Korin nettokate ilman lisätuotetta ja ehdotetun lisätuotteen kanssa** (toimitus 6,90 € alle 79 €, kahden tuotteen
alennus -5 %, Stripe 1,5 % + 0,25 €):

| Kori (tuotteet €) | Ehdotus | Puuttuu ennen / jälkeen | Kate ilman (A / B) | Kate lisätuotteen kanssa (A / B) | Muutos A | Muutos B |
|---|---|--:|--:|--:|--:|--:|
| 1 t-paita (24,90) | juliste 22,90 € | 54,10 / 31,20 € | 7,22 / 7,22 | 6,88 / 14,18 | -0,34 | +6,96 |
| 2 t-paitaa (49,80) | juliste 22,90 € | 29,20 / 6,30 € | 7,36 / 14,66 | 7,99 / 22,59 | +0,63 | +7,93 |
| 1 huppari (49,99) | juliste 22,90 € | 29,01 / 6,11 € | 7,86 / 7,86 | 6,54 / 6,54 | -1,32 | -1,32 |
| t-paita + huppari (74,89) | juliste 22,90 € (tarra estetty hupparisäännöllä) | 4,11 / 0 € (ilmainen toimitus) | 7,01 / 7,01 | 2,25 / 9,55 | -4,76 | +2,54 |

Vertailuksi tarra samoihin koreihin (A / B): 1 t-paita 5,61 / 11,10, 2 t-paitaa 6,72 / 19,51; hupparikoreihin tarraa
ei ehdoteta (1 huppari 5,27, t-paita + huppari 0,98 / 6,47). Jokainen ehdotettu kori pysyy positiivisena myös
varovaisella laskennalla (heikoin t-paita + huppari + juliste 2,25 €).

Huomiot:
- Lisätuote tekee yhden tuotteen korista kahden tuotteen korin, joten -5 % koskee myös alkuperäistä tuotetta.
- Hupparikorissa juliste laskee katetta 1,32 €, koska juliste lähtee eri painotalosta (9,29 €) ja hupparikin saa -5 %.
  Kate pysyy positiivisena, joten sääntö sallii ehdotuksen. Jos katteen laskua ei haluta, nosta
  `LISATUOTE_MIN_KATE_EUROA` tai lisää ehto "kate ei laske".
- t-paita + huppari: juliste ylittää rajan, kauppa menettää 6,90 €:n toimitusmaksun. Todellisella laskutuksella (B)
  kate silti nousee (+2,54 €), varovaisella laskennalla (A) se laskee (-4,76 €).

**Odotettu vaikutus kuukaudessa (arvio, ei mitattua dataa).** Oletukset:
- **Oletus, ei mitattu:** lisätuotteen lisää koriin 3 % (varovainen) tai 8 % (optimistinen) niistä tilauksista, joiden
  korissa ehdotus näkyy. Tilausten määrä ei muutu ehdotuksen takia.
- Korijakauma (oletus, nykyiseen 28,80 €:n keskiostokseen sopiva): 1 t-paita 70 %, 2 t-paitaa 5 %, 1 huppari 15 %,
  t-paita + huppari 3 %, muut 7 % (ei laskettu mukaan).
- Volyymi: 8 tilausta / 30 pv, vertailuna 16.
- Painotettu katteen muutos lisättyä tuotetta kohden: A -0,55 € (0,70 x -0,34 + 0,05 x 0,63 + 0,15 x -1,32 + 0,03 x -4,76),
  B +5,15 € (0,70 x 6,96 + 0,05 x 7,93 + 0,15 x -1,32 + 0,03 x 2,54).

| Laskenta | 8 tilausta, 3 % | 8 tilausta, 8 % | 16 tilausta, 3 % | 16 tilausta, 8 % |
|---|--:|--:|--:|--:|
| B Printifyn laskutus painotaloittain (odotettu) | +1,24 €/kk | +3,29 €/kk | +2,47 €/kk | +6,59 €/kk |
| A varovainen (katevahdin laskenta nykyisillä tuoteriveillä) | -0,13 €/kk | -0,35 €/kk | -0,26 €/kk | -0,70 €/kk |

Tuotteiden myynti kasvaa 22,90 € lisättyä julistetta kohden ennen alennusta (3 %: +0,64 €, 8 %: +1,70 € tilausta
kohden). Vaikutus on pieni ja riippuu lisäysosuudesta, joka on oletus. Mittaa osuus tilauksista, joissa juliste tai
tarra on t-paidan tai hupparin kanssa (tilaukset-taulu), ja päivitä oletus mitatulla osuudella.

## Halvin EU-vaihtoehto: t-paita, huppari, muki (26.10.2026)

Kaikki Printifyn EU-painotalot, joilla on t-paita-, huppari- tai mukiblueprint (katalogi 26.10.2026: OPT OnDemand CZ,
Textildruck Europa DE, Atelier Katanga FR; Subliminator NL vain AOP-hupparit, toimitus 17,89 € alkaen; muilla
EU-painotaloilla ei näitä). Kulut mitattu testituotteilla "Copy of EU-hintavertailu <bp>-<pp>" (musta, S-2XL).
Kate = api/_lib/kate.js, yksi kappale, toimitusmaksu 6,90 € (live) / 5,90 € (oma tausta).

| Vaihtoehto | Kulu | Toimitus FI | Kate hintakatossa (6,90 / 5,90) | 30 % vaatii (6,90 / 5,90) |
|---|---|---|---|---|
| **T-paita Textildruck, Gildan 64000 (145)** | 9,28 € (3XL 10,68 €) | 7,29 € | 24,90 €: **31,7 %** / 29,6 % | 24,90 € / 25,90 € |
| T-paita Textildruck, Gildan 5000 (6) | 9,90 € | 7,29 € | 29,3 % / 27,1 % | 25,90 € / 26,90 € |
| T-paita OPT, Gildan 64000 (145) | 8,90 € | 8,49 € | 28,5 % / 26,2 % | 25,90 € / 26,90 € |
| T-paita OPT, Gildan 5000 (6) | 9,07 € (valk. 8,97 €) | 8,49 € | 27,8 % / 25,5 % | 25,90 € / 26,90 € |
| T-paita Atelier Katanga, Gildan 5000 (6) | 10,23 € | 7,29 € | 28,0 % / 25,7 % | 25,90 € / 26,90 € |
| T-paita Textildruck, Gildan 2000 (36) | 11,95 € | 7,29 € | 21,2 % / 18,7 % | 29,90 € / 30,90 € |
| T-paita Textildruck, B&C TU03T (454) | 13,96 € | 7,29 € | 13,3 % / 10,5 % | 32,90 € / 33,90 € |
| Huppari Atelier Katanga, Gildan 18500 (77) | 23,79 € | 10,89 € | 51,90 €: 23,6 % / 22,3 % | 57,90 € / 58,90 € |
| Muki Textildruck, Standard 11oz valk. (1016) | 5,91 € | 10,39 € | 19,90 €: 20,6 % / 17,6 % | 23,90 € / 24,90 € |
| Muki OPT, Ceramic Mug EU 11oz (441) | 5,88 € | 10,39 € | 19,90 €: 20,8 % / 17,8 % | 23,90 € / 24,90 € |

- Muut hupparit (EU-kiinteät painotalot -osio): kulu 25,48-46,11 €, toimitus 10,89 €, kaikki heikompia.
- Textildruckin 64000: Natural, Sand ja Heather Navy 9,62 € (30,4 %), 3XL 10,68 € (26,2 %); Black L ei saatavilla
  26.10.2026. Uudet joulu- ja eläkepaidat (data/uudet-tuotteet/joulu-elake-2026.json) tehtiin tälle S-2XL.
- Kulut ovat Printifyn sentteinä (tilin valuutta, ks. yllä); jos tili on dollareissa, katteet ovat varovaisia.

## Hintaehdotus 26.10.2026 (ei julkaistu)

**Kilpailijat** (Shopify-tuotesyötteet 26.10.2026, kaikki tuotteet): Meemirotta t-paidat 24,99 € (256 tuotetta, kaikki
koot samaan hintaan), hupparit 37,99-49,99 € (mediaani 49,99 €), mukit 14,99-18,99 €. Stuntman t-paidat mediaani
22,00 €, 90 % enintään 24,90 € (kalliimmat ovat paita + body -paketteja 41,90 €), hupparit mediaani 44,90 €, 90 %
enintään 51,90 €, mukit enintään 19,90 €. Vastaavan tuotteen korkein tavanomainen hinta: t-paita 24,99 €, huppari
51,90 €, muki 19,90 €.

**Ehdotus:** t-paidat 24,90 € (ennallaan, kilpailijoiden katossa), hupparit 49,90 € -> 51,90 €, muut ennallaan. Mukit
piilossa (16,90-19,90 €:lla kate alle 20 %). Kate = mediaanituote, heikoin koko, yhden kappaleen tilaus,
EU-siirron jälkeiset kulut.

| Kategoria | Hinta | Kate, toimitus 6,90/79 | Kate, toimitus 5,90/60 |
|---|---|---|---|
| T-paidat (310) | 24,90 € | 28,5 % / 7,22 € | 26,2 % / 6,44 € |
| Hupparit (163) | 51,90 € | 13,6 % / 6,36 € | 12,1 % / 5,58 € |
| Koristeet (2) | 19,90 € | 22,8 % / 4,87 € | 19,9 % |
| Pitkähihaiset, pipot (1+1) | 39,90 € | 4,8-4,9 % | alle 5 % |

Johtopäätökset (Printify-kulu ilman ALV:tä, joka vähennetään):
1. 30 %:n tavoite ei täyty t-paidoilla eikä hupparilla kilpailijoiden hintakaton alla, kun tilauksessa on yksi
   tuote. T-paidat ovat lähimpänä (28,5 %, 30 % vaatisi 25,90 €). Usean tuotteen tilauksessa Printifyn
   lisäkappaleen toimitus on halvempi kuin ensimmäisen, joten kate nousee keskiostoksen kasvaessa.
2. Hupparit: Printify Choice kulu 23,77 € + toimitus 15,59 €. 51,90 €:lla kate 13,6 %, joten oman taustan
   katesääntö (alle 20 %) estäisi hupparit. Vaihtoehdot: halvempi EU-painotalo, hinta yli kilpailijakaton, tai
   hupparit pois myynnistä domainin siirrossa.
3. Uudet julisteet (31,5 %) ja tonnin seteli -tarra (33,2 %) ylittävät 30 %.
4. Oman taustan katesääntö muutettu 20 %:iin (haara oma-tausta), paketin ja ensitilausalennuksen raja 30 %.

## Kategorioittain (keskimääräinen heikoimman variantin kate)

| Kategoria | Tuotteita | Kate 6,90/79 | Kate 5,90/60 | Alle 40 % (6,90/79) | Alle 40 % (5,90/60) |
|---|---|---|---|---|---|
| t-paidat | 310 | 27,1 % | 24,8 % | 310 | 310 |
| hupparit | 163 | 9,8 % | 8,2 % | 163 | 163 |
| koristeet | 2 | 14,1 % | 10,8 % | 2 | 2 |
| pipot | 1 | 4,8 % | 2,7 % | 1 | 1 |
| peitot | 1 | -69,4 % | -73,6 % | 1 | 1 |
| pitkahihaiset | 1 | 4,9 % | 2,8 % | 1 | 1 |
| seinataulut | 1 | -1,3 % | -3,4 % | 1 | 1 |
| tarrat | 1 | -82,8 % | -99,4 % | 1 | 1 |
| bodyt | 1 | -9,8 % | -13,3 % | 1 | 1 |

## Painotalot

- OPT OnDemand (CZ): 304 tuotetta
- Printify Choice (US): 140 tuotetta
- Textildruck Europa (DE): 28 tuotetta
- SwiftPOD (US): 2 tuotetta
- Monster Digital (US): 2 tuotetta
- Imagine Your Photos (US): 1 tuotetta
- Fulfill Engine (US): 1 tuotetta
- Miami Sublimation (US): 1 tuotetta
- Jondo (US): 1 tuotetta
- SPOKE Custom Products (US): 1 tuotetta

## Alle 40 %:n tuotteet (5,90 € / 60 €)

| Tuote | Kategoria | Hinta | Kulu | Toimitus | Nettokate | Kate 5,90/60 | Kate 6,90/79 | Painotalo |
|---|---|---|---|---|---|---|---|---|
| oma-tekstikuva-tarra | tarrat | 4,99 € | 2,40 € | 14,49 € | -8,63 € | -99,4 % | -82,8 % | SPOKE Custom Products (US) |
| oma-tekstikuva-peitto | peitot | 34,90 € | 32,07 € | 23,49 € | -23,91 € | -73,6 % | -69,4 % | Miami Sublimation (US) |
| valmentajani-on-vaarallinen-ihminen-t-paita | t-paidat | 24,90 € | 21,40 € | 13,49 € | -11,06 € | -45,1 % | -40,6 % | Monster Digital (US) |
| yksi-kerta-viela-t-paita | t-paidat | 24,90 € | 21,40 € | 13,49 € | -11,06 € | -45,1 % | -40,6 % | Monster Digital (US) |
| ois-viisaampi-haipyy-taalt-t-paita | t-paidat | 24,90 € | 18,34 € | 10,39 € | -4,90 € | -20,0 % | -16,3 % | Printify Choice (US) |
| oma-tekstikuva-vauvantaaperon-body | bodyt | 24,90 € | 13,61 € | 13,49 € | -3,27 € | -13,3 % | -9,8 % | SwiftPOD (US) |
| maailman-paras-aiti-palkinnon-voittaja-t-shirt-t-paita | t-paidat | 24,90 € | 15,21 € | 10,39 € | -1,77 € | -7,2 % | -3,9 % | Printify Choice (US) |
| slay-queen-t-paita | t-paidat | 24,90 € | 15,21 € | 10,39 € | -1,77 € | -7,2 % | -3,9 % | Printify Choice (US) |
| super-aiska-t-paita | t-paidat | 24,90 € | 15,21 € | 10,39 € | -1,77 € | -7,2 % | -3,9 % | Printify Choice (US) |
| oma-tekstikuva-seinataulu | seinataulut | 39,90 € | 17,42 € | 19,39 € | -1,25 € | -3,4 % | -1,3 % | Jondo (US) |
| ice-aatanahuppari | hupparit | 49,90 € | 32,97 € | 10,89 € | -0,48 € | -1,1 % | 0,7 % | Textildruck Europa (DE) |
| oma-tekstikuva-koriste | koristeet | 19,90 € | 6,57 € | 12,99 € | 0,36 € | 1,8 % | 5,4 % | SwiftPOD (US) |
| oma-tekstikuva-lippis | pipot | 39,90 € | 21,07 € | 13,49 € | 1,00 € | 2,7 % | 4,8 % | Fulfill Engine (US) |
| oma-tekstikuva-pitkahihainen | pitkahihaiset | 39,90 € | 23,63 € | 10,89 € | 1,04 € | 2,8 % | 4,9 % | Textildruck Europa (DE) |
| maailman-paras-aiti-palkinnon-voittaja-huppari | hupparit | 49,90 € | 25,66 € | 15,59 € | 2,13 € | 4,8 % | 6,4 % | Printify Choice (US) |
| saatanan-tunarit-huppari | hupparit | 49,90 € | 25,66 € | 15,59 € | 2,13 € | 4,8 % | 6,4 % | Printify Choice (US) |
| slay-queen-huppari | hupparit | 49,90 € | 25,66 € | 15,59 € | 2,13 € | 4,8 % | 6,4 % | Printify Choice (US) |
| super-aiska-huppari | hupparit | 49,90 € | 25,66 € | 15,59 € | 2,13 € | 4,8 % | 6,4 % | Printify Choice (US) |
| 100-elakelainen-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| ala-kosketa-sahkomiesta-kun-olet-marka-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| alkoholi-tappaa-hitaasti-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| amatimies-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| elakelainen-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| huonokin-paiva-kalassa-on-parempi-kuin-hyva-paiva-toissa-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| i-my-boyfriend-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| i-my-girlfriend-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| i-swedish-boys-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| i-swedish-girls-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| isanta-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| jos-iska-ei-osaa-korjata-sita-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| kalju-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| maailman-mestarit-2026-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| maailman-paras-aiti-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| maailman-paras-pappa-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| maailman-paras-ukki-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| minulla-ei-ole-alkoholiongelmaa-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| museokamaa-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| oispa-kaljaa-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| olen-elakkeella-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| oma-tekstikuva-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| se-oli-tonnin-seteli-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| suomi-finland-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| tassa-talossa-asuu-yksi-pomo-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| tonnin-seteli-huppari | hupparit | 49,90 € | 30,19 € | 10,89 € | 2,30 € | 5,2 % | 6,8 % | Textildruck Europa (DE) |
| 30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 30-nuori-villi-ja-jo-vasynyt-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 30v-paranen-ian-myota-kuin-viini-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 30v-selka-alkaa-jo-rusahdella-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 40-ja-fabulous-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 40-vuotta-henkisesti-18-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 40-vuotta-toita-nyt-ikuinen-viikonloppu-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 40v-ei-keski-ika-klassikko-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 40v-ei-vanha-vintage-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 40v-henkisesti-18-tyylilla-40-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 40v-kunnossa-niinku-20v-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 50-ja-hopeanhohtoinen-vain-hiukset-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 50-ja-paras-vasta-tulossa-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 50-vuotta-nuori-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 50v-puoli-vuosisataa-ei-naarmuakaan-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 60-vuotta-nuori-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 60-vuotta-nuori-ja-nokkela-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 60v-kokenut-ei-vanha-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 60v-mutta-fyysinen-kunto-kuin-20v-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 60v-mutta-sydan-kuin-20v-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| 60v-takuu-mennyt-toimii-silti-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| akaalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| elakelainen-aamuheratys-vapaaehtoinen-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| elakkeella-kiireinen-tekemaan-ei-mitaan-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| espoolainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| forssalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| hameenlinnalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| harjavaltalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| hauska-huppari-etatoita-tekeville-konttori-3-metria-sangysta | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| hauska-huppari-lumilautailijalle-gravity-is-just-a-suggestion | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| hauska-huppari-metsastajalle-ei-ole-kiire-olen-metsassa | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| hauska-huppari-mokkeilijalle-mokki-on-terapiaa | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| hauska-huppari-pikkujouluihin-pikkujoulut-muistetaan-vuosia | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| hauska-huppari-retkeilijalle-gps-ei-tarvita-eksytaan-tarkoituksella | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| heinolalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| helsinkilainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| hyvinkaalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| iisalmelainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| imatralainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| jarvenpaalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| joensuulainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| jyvaskylalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kaarinalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kajaanilainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kangasalalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kemilainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| keravainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kokkolalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotkalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-akaassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-espoossa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-forssassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-hameenlinnassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-harjavallassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-heinolassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-helsingissa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-hyvinkaalla-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-iisalmessa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-imatralla-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-jarvenpaassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-joensuussa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-jyvaskylassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-kaarinassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-kajaanissa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-kangasalla-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-kemissa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-keravalla-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-kokkolassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-kotkassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-kouvolassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-kuopiossa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-lahdessa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-lappeenrannassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-lempaalassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-lieksassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-lohjalla-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-mikkelissa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-naantalissa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-nokialla-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-nummelassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-orimattilassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-oulussa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-pirkkalassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-porissa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-porvoossa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-raisiossa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-raumalla-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-riihimaella-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-rovaniemella-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-salossa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-savonlinnassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-seinajoella-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-tampereella-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-torniossa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-turussa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-vaasassa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-valkeakoskella-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-vantaalla-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-varkaudessa-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kotona-vain-ylojarvella-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kouvolalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| kuopiolainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| lahtelainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| lappeenrantalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| lempaalalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| lieksalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| lohjalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| mikkelilainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| naantalilainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| nokialainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| nummelalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| orimattilalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| oululainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| pirkkalalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| porilainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| porvoolainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| raisiolainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| raumalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| riihimakelainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| rovaniemelainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| salolainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| savonlinnalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| seinajokelainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| tamperelainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| torniolainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| turkulainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| vaasalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| valkeakoskelainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| vantaalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| varkaalainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| virallisesti-tyoton-epavirallisesti-vapaa-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| ylojarvelainen-selviaa-mista-vain-hauska-huppari | hupparit | 49,90 € | 23,77 € | 15,59 € | 4,02 € | 9,0 % | 10,6 % | Printify Choice (US) |
| ice-aatanat-paita | t-paidat | 24,90 € | 12,22 € | 8,49 € | 3,12 € | 12,7 % | 15,4 % | OPT OnDemand (CZ) |
| kalamies-t-paita | t-paidat | 24,90 € | 11,48 € | 8,49 € | 3,86 € | 15,7 % | 18,3 % | OPT OnDemand (CZ) |
| saatanan-tunarit-t-paita | t-paidat | 24,90 € | 11,48 € | 8,49 € | 3,86 € | 15,7 % | 18,3 % | OPT OnDemand (CZ) |
| maailman-paras-ystava-ornament-ceramic-ornament | koristeet | 19,90 € | 6,34 € | 9,49 € | 4,09 € | 19,9 % | 22,8 % | Imagine Your Photos (US) |
| -jos-iska-ei-osaa-korjata-sita-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| 100-elakelainen-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| ala-kosketa-sahkomiesta-kun-olet-marka-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| alkoholi-tappaa-hitaasti-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| amatimies-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| elakelainen-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| huonokin-paiva-kalassa-on-parempi-kuin-hyva-paiva-toissa-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| i-my-boyfriend-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| i-my-girlfriend-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| i-swedish-boys-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| i-swedish-girls-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| isanta-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| kalju-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| maailman-mestarit-2026-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| maailman-paras-aiti-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| maailman-paras-pappa-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| maailman-paras-ukki-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| minulla-ei-ole-alkoholiongelmaa-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| museokamaa-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| oispa-kaljaa-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| olen-elakkeella-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| oma-tekstikuva-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| se-oli-tonnin-seteli-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| suomi-finland-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| tassa-talossa-asuu-yksi-pomo-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| tonnin-seteli-t-paita | t-paidat | 24,90 € | 9,93 € | 8,49 € | 5,41 € | 22,0 % | 24,4 % | OPT OnDemand (CZ) |
| 100-akaalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-espoolaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-forssalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-hameenlinnalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-harjavaltalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-heinolalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-helsinkilaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-hyvinkaalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-iisalmelaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-imatralaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-jarvenpaalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-joensuulaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-jyvaskylalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-kaarinalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-kajaanilaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-kangasalalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-kemilaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-keravaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-kokkolalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-kotkalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-kouvolalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-kuopiolaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-lahtelaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-lappeenrantalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-lempaalalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-lieksalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-lohjalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-mikkelilaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-naantalilaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-nokialaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-nummelalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-orimattilalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-oululaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-pirkkalalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-porilaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-porvoolaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-raisiolaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-raumalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-riihimakelaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-rovaniemelaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-salolaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-savonlinnalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-seinajokelaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-tamperelaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-torniolaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-turkulaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-vaasalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-valkeakoskelaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-vantaalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-varkaalaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 100-ylojarvelaista-verta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 30-nuori-villi-ja-jo-vasynyt-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 30v-paranen-ian-myota-kuin-viini-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 30v-selka-alkaa-jo-rusahdella-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 40-ja-fabulous-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 40-vuotta-henkisesti-18-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 40-vuotta-toita-nyt-ikuinen-viikonloppu-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 40v-ei-keski-ika-klassikko-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 40v-ei-vanha-vintage-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 40v-henkisesti-18-tyylilla-40-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 40v-kunnossa-niinku-20v-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 50-ja-hopeanhohtoinen-vain-hiukset-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 50-ja-paras-vasta-tulossa-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 50-vuotta-nuori-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 50v-puoli-vuosisataa-ei-naarmuakaan-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 60-vuotta-nuori-ja-nokkela-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 60-vuotta-nuori-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 60v-kokenut-ei-vanha-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 60v-mutta-fyysinen-kunto-kuin-20v-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 60v-mutta-sydan-kuin-20v-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| 60v-takuu-mennyt-toimii-silti-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| akaa-parempi-kuin-helsinki-hauska-t-paita-akaalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| elakelainen-aamuheratys-vapaaehtoinen-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| elakkeella-kiireinen-tekemaan-ei-mitaan-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| espoo-parempi-kuin-helsinki-hauska-t-paita-espoolaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| forssa-parempi-kuin-helsinki-hauska-t-paita-forssalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hameenlinna-parempi-kuin-helsinki-hauska-t-paita-hameenlinnalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| harjavalta-parempi-kuin-helsinki-hauska-t-paita-harjavaltalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-30-vuotiaalle-30-vuotta-vasta-alkamassa | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-60-vuotiaalle-60-vuotta-kokemusta-loytyy | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-70-vuotiaalle-70-vuotta-mita-siita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-asiakaspalvelijalle-asiakas-on-aina-oikeassa-lahes | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-autoharrastajalle-ei-myyda-ei-koskaan | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-avantouijalle-20c-sopiva-uimakeli | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-elakelaiselle-vapautunut-virallisesti | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-golfaajalle-bogey-on-elamantapa | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-grillimesterille-grillimestari-saa-ei-esta | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-juoksijalle-jos-naat-minut-juoksemassa-soita-ambulanssi | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-kalastajalle-kala-paasi-talla-kertaa | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-kesalomalle-kesaloma-ansaittu | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-kitaristille-one-more-song-aina-yksi-lisaa | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-koiranomistajalle-koira-on-perhetta-ihminen-on-lisa | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-kokille-keittio-on-valtakuntani | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-koodarille-ei-se-ole-bugi-se-on-feature | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-kuntosaliharrastajalle-jalkapaiva-ohitettu-jalleen | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-linja-autonkuljettajalle-kuljetan-suomen | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-lounastaukoa-rakastaville-tarkeinta-tyossa-on-lounastauko | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-maanviljelijalle-saa-paattaa-teen-silti | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-myyntimiehelle-kaupat-klousattu | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-palaverien-kritisoijalle-tamakin-olisi-voinut-olla-sahkoposti | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-palomiehelle-sankari-savussa | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-parturille-leikkaa-myos-tukkaa | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-pelaajalle-just-one-more-level | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-pilkkijalle-jaa-kantaa-pilkki-tulee | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-poliisille-lain-kasi-myos-kahvitunnilla | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-pomolle-maailman-paras-pomo-itse-sanoo | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-putkimiehelle-loytaa-aina-lekkauksen | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-pyorailijalle-ylamaki-voitettu-toistaiseksi | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-rakennusmiehelle-kadet-tekee-tulos-nakyy | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-rottaharrastajalle-rotta-vaarinymmarretty-nero | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-sahkoasentajalle-ei-kosketa-markana | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-siivoojalle-puhtaus-on-puoli-elamaa | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-tiimipelaajalle-tiimipelaaja-vaikka-tiimi-ei-pelaa | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-tyokaverillle-selvian-tyokaverit-auttaa | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hauska-t-paita-valokuvaajalle-hetki-kiinni-muisti-vapaana | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| heinola-parempi-kuin-helsinki-hauska-t-paita-heinolalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| helsinki-parempi-kuin-kaikki-muut-itse-sanoo-hauska-t-paita-helsinkilaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| hyvinkaa-parempi-kuin-helsinki-hauska-t-paita-hyvinkaalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| iisalmi-parempi-kuin-helsinki-hauska-t-paita-iisalmelaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| imatra-parempi-kuin-helsinki-hauska-t-paita-imatralaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| jarvenpaa-parempi-kuin-helsinki-hauska-t-paita-jarvenpaalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| joensuu-parempi-kuin-helsinki-hauska-t-paita-joensuulaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| jyvaskyla-parempi-kuin-helsinki-hauska-t-paita-jyvaskylalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| kaarina-parempi-kuin-helsinki-hauska-t-paita-kaarinalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| kajaani-parempi-kuin-helsinki-hauska-t-paita-kajaanilaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| kangasala-parempi-kuin-helsinki-hauska-t-paita-kangasalalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| kemi-parempi-kuin-helsinki-hauska-t-paita-kemilaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| kerava-parempi-kuin-helsinki-hauska-t-paita-keravaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| kokkola-parempi-kuin-helsinki-hauska-t-paita-kokkolalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| kotka-parempi-kuin-helsinki-hauska-t-paita-kotkalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| kouvola-parempi-kuin-helsinki-hauska-t-paita-kouvolalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| kuopio-parempi-kuin-helsinki-hauska-t-paita-kuopiolaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| lahti-parempi-kuin-helsinki-hauska-t-paita-lahtelaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| lappeenranta-parempi-kuin-helsinki-hauska-t-paita-lappeenrantalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| lempaala-parempi-kuin-helsinki-hauska-t-paita-lempaalalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| lieksa-parempi-kuin-helsinki-hauska-t-paita-lieksalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| lohja-parempi-kuin-helsinki-hauska-t-paita-lohjalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-akaa-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-espoo-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-forssa-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-hameenlinna-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-harjavalta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-heinola-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-helsinki-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-hyvinkaa-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-iisalmi-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-imatra-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-jarvenpaa-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-joensuu-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-jyvaskyla-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-kaarina-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-kajaani-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-kangasala-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-kemi-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-kerava-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-kokkola-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-kotka-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-kouvola-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-kuopio-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-lahti-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-lappeenranta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-lempaala-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-lieksa-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-lohja-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-mikkeli-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-naantali-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-nokia-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-nummela-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-orimattila-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-oulu-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-pirkkala-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-pori-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-porvoo-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-raisio-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-rauma-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-riihimaki-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-rovaniemi-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-salo-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-savonlinna-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-seinajoki-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-tampere-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-tornio-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-turku-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-vaasa-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-valkeakoski-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-vantaa-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-varkaus-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| made-in-ylojarvi-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| mikkeli-parempi-kuin-helsinki-hauska-t-paita-mikkelilaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| naantali-parempi-kuin-helsinki-hauska-t-paita-naantalilaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| nokia-parempi-kuin-helsinki-hauska-t-paita-nokialaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| nummela-parempi-kuin-helsinki-hauska-t-paita-nummelalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| orimattila-parempi-kuin-helsinki-hauska-t-paita-orimattilalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| oulu-parempi-kuin-helsinki-hauska-t-paita-oululaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| personoitava-t-paita-alalla-x-vuotta | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| personoitava-t-paita-elava-legenda | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| personoitava-t-paita-harrastusmestari | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| personoitava-t-paita-isalle-maailman-paras-isa | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| personoitava-t-paita-kapteeni | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| personoitava-t-paita-kaupunkilaiselle-kaupunki-lainen-ylpeasti | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| personoitava-t-paita-koiranomistajalle-koiran-nimi-herran-paras-ystava | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| personoitava-t-paita-lempinimi | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| personoitava-t-paita-nimi-legendaarinen-tyosankari | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| personoitava-t-paita-ylpea-ammatin-vanhempi | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| pirkkala-parempi-kuin-helsinki-hauska-t-paita-pirkkalalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| pori-parempi-kuin-helsinki-hauska-t-paita-porilaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| porvoo-parempi-kuin-helsinki-hauska-t-paita-porvoolaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| raisio-parempi-kuin-helsinki-hauska-t-paita-raisiolaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| rauma-parempi-kuin-helsinki-hauska-t-paita-raumalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| riihimaki-parempi-kuin-helsinki-hauska-t-paita-riihimakelaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| rovaniemi-parempi-kuin-helsinki-hauska-t-paita-rovaniemelaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| salo-parempi-kuin-helsinki-hauska-t-paita-salolaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| savonlinna-parempi-kuin-helsinki-hauska-t-paita-savonlinnalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| seinajoki-parempi-kuin-helsinki-hauska-t-paita-seinajokelaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-akaa-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-espoo-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-forssa-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-hameenlinna-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-harjavalta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-heinola-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-helsinki-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-hyvinkaa-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-iisalmi-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-imatra-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-jarvenpaa-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-joensuu-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-jyvaskyla-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-kaarina-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-kajaani-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-kangasala-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-kemi-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-kerava-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-kokkola-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-kotka-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-kouvola-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-kuopio-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-lahti-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-lappeenranta-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-lempaala-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-lieksa-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-lohja-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-mikkeli-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-naantali-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-nokia-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-nummela-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-orimattila-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-oulu-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-pirkkala-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-pori-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-porvoo-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-raisio-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-rauma-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-riihimaki-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-rovaniemi-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-salo-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-savonlinna-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-seinajoki-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-tampere-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-tornio-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-turku-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-vaasa-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-valkeakoski-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-vantaa-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-varkaus-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| syntymakaupunki-ylojarvi-hauska-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| tampere-parempi-kuin-helsinki-hauska-t-paita-tamperelaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| tornio-parempi-kuin-helsinki-hauska-t-paita-torniolaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| turku-parempi-kuin-helsinki-hauska-t-paita-turkulaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| vaasa-parempi-kuin-helsinki-hauska-t-paita-vaasalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| valkeakoski-parempi-kuin-helsinki-hauska-t-paita-valkeakoskelaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| vantaa-parempi-kuin-helsinki-hauska-t-paita-vantaalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| varkaus-parempi-kuin-helsinki-hauska-t-paita-varkaalaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| virallisesti-tyoton-epavirallisesti-vapaa-t-paita | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |
| ylojarvi-parempi-kuin-helsinki-hauska-t-paita-ylojarvelaiselle | t-paidat | 24,90 € | 8,90 € | 8,49 € | 6,44 € | 26,2 % | 28,5 % | OPT OnDemand (CZ) |

## Kaikki myynnissä olevat

| Tuote | Hinta | Kulu | Toimitus | Kate 6,90/79 | Kate 5,90/60 | Painotalo |
|---|---|---|---|---|---|---|
| -jos-iska-ei-osaa-korjata-sita-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| 100-akaalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-elakelainen-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| 100-elakelainen-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| 100-espoolaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-forssalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-hameenlinnalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-harjavaltalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-heinolalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-helsinkilaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-hyvinkaalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-iisalmelaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-imatralaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-jarvenpaalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-joensuulaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-jyvaskylalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-kaarinalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-kajaanilaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-kangasalalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-kemilaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-keravaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-kokkolalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-kotkalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-kouvolalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-kuopiolaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-lahtelaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-lappeenrantalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-lempaalalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-lieksalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-lohjalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-mikkelilaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-naantalilaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-nokialaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-nummelalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-orimattilalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-oululaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-pirkkalalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-porilaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-porvoolaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-raisiolaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-raumalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-riihimakelaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-rovaniemelaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-salolaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-savonlinnalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-seinajokelaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-tamperelaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-torniolaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-turkulaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-vaasalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-valkeakoskelaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-vantaalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-varkaalaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 100-ylojarvelaista-verta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 30-nuori-villi-ja-jo-vasynyt-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 30-nuori-villi-ja-jo-vasynyt-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 30v-paranen-ian-myota-kuin-viini-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 30v-paranen-ian-myota-kuin-viini-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 30v-selka-alkaa-jo-rusahdella-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 30v-selka-alkaa-jo-rusahdella-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 40-ja-fabulous-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 40-ja-fabulous-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 40-vuotta-henkisesti-18-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 40-vuotta-henkisesti-18-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 40-vuotta-toita-nyt-ikuinen-viikonloppu-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 40-vuotta-toita-nyt-ikuinen-viikonloppu-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 40v-ei-keski-ika-klassikko-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 40v-ei-keski-ika-klassikko-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 40v-ei-vanha-vintage-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 40v-ei-vanha-vintage-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 40v-henkisesti-18-tyylilla-40-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 40v-henkisesti-18-tyylilla-40-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 40v-kunnossa-niinku-20v-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 40v-kunnossa-niinku-20v-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 50-ja-hopeanhohtoinen-vain-hiukset-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 50-ja-hopeanhohtoinen-vain-hiukset-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 50-ja-paras-vasta-tulossa-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 50-ja-paras-vasta-tulossa-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 50-vuotta-nuori-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 50-vuotta-nuori-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 50v-puoli-vuosisataa-ei-naarmuakaan-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 50v-puoli-vuosisataa-ei-naarmuakaan-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 60-vuotta-nuori-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 60-vuotta-nuori-ja-nokkela-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 60-vuotta-nuori-ja-nokkela-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 60-vuotta-nuori-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 60v-kokenut-ei-vanha-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 60v-kokenut-ei-vanha-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 60v-mutta-fyysinen-kunto-kuin-20v-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 60v-mutta-fyysinen-kunto-kuin-20v-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 60v-mutta-sydan-kuin-20v-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 60v-mutta-sydan-kuin-20v-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| 60v-takuu-mennyt-toimii-silti-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| 60v-takuu-mennyt-toimii-silti-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| akaa-parempi-kuin-helsinki-hauska-t-paita-akaalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| akaalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| ala-kosketa-sahkomiesta-kun-olet-marka-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| ala-kosketa-sahkomiesta-kun-olet-marka-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| alkoholi-tappaa-hitaasti-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| alkoholi-tappaa-hitaasti-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| amatimies-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| amatimies-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| elakelainen-aamuheratys-vapaaehtoinen-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| elakelainen-aamuheratys-vapaaehtoinen-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| elakelainen-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| elakelainen-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| elakkeella-kiireinen-tekemaan-ei-mitaan-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| elakkeella-kiireinen-tekemaan-ei-mitaan-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| espoo-parempi-kuin-helsinki-hauska-t-paita-espoolaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| espoolainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| forssa-parempi-kuin-helsinki-hauska-t-paita-forssalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| forssalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| hameenlinna-parempi-kuin-helsinki-hauska-t-paita-hameenlinnalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hameenlinnalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| harjavalta-parempi-kuin-helsinki-hauska-t-paita-harjavaltalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| harjavaltalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| hauska-huppari-etatoita-tekeville-konttori-3-metria-sangysta | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| hauska-huppari-lumilautailijalle-gravity-is-just-a-suggestion | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| hauska-huppari-metsastajalle-ei-ole-kiire-olen-metsassa | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| hauska-huppari-mokkeilijalle-mokki-on-terapiaa | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| hauska-huppari-pikkujouluihin-pikkujoulut-muistetaan-vuosia | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| hauska-huppari-retkeilijalle-gps-ei-tarvita-eksytaan-tarkoituksella | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| hauska-t-paita-30-vuotiaalle-30-vuotta-vasta-alkamassa | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-60-vuotiaalle-60-vuotta-kokemusta-loytyy | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-70-vuotiaalle-70-vuotta-mita-siita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-asiakaspalvelijalle-asiakas-on-aina-oikeassa-lahes | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-autoharrastajalle-ei-myyda-ei-koskaan | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-avantouijalle-20c-sopiva-uimakeli | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-elakelaiselle-vapautunut-virallisesti | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-golfaajalle-bogey-on-elamantapa | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-grillimesterille-grillimestari-saa-ei-esta | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-juoksijalle-jos-naat-minut-juoksemassa-soita-ambulanssi | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-kalastajalle-kala-paasi-talla-kertaa | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-kesalomalle-kesaloma-ansaittu | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-kitaristille-one-more-song-aina-yksi-lisaa | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-koiranomistajalle-koira-on-perhetta-ihminen-on-lisa | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-kokille-keittio-on-valtakuntani | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-koodarille-ei-se-ole-bugi-se-on-feature | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-kuntosaliharrastajalle-jalkapaiva-ohitettu-jalleen | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-linja-autonkuljettajalle-kuljetan-suomen | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-lounastaukoa-rakastaville-tarkeinta-tyossa-on-lounastauko | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-maanviljelijalle-saa-paattaa-teen-silti | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-myyntimiehelle-kaupat-klousattu | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-palaverien-kritisoijalle-tamakin-olisi-voinut-olla-sahkoposti | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-palomiehelle-sankari-savussa | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-parturille-leikkaa-myos-tukkaa | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-pelaajalle-just-one-more-level | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-pilkkijalle-jaa-kantaa-pilkki-tulee | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-poliisille-lain-kasi-myos-kahvitunnilla | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-pomolle-maailman-paras-pomo-itse-sanoo | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-putkimiehelle-loytaa-aina-lekkauksen | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-pyorailijalle-ylamaki-voitettu-toistaiseksi | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-rakennusmiehelle-kadet-tekee-tulos-nakyy | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-rottaharrastajalle-rotta-vaarinymmarretty-nero | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-sahkoasentajalle-ei-kosketa-markana | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-siivoojalle-puhtaus-on-puoli-elamaa | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-tiimipelaajalle-tiimipelaaja-vaikka-tiimi-ei-pelaa | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-tyokaverillle-selvian-tyokaverit-auttaa | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hauska-t-paita-valokuvaajalle-hetki-kiinni-muisti-vapaana | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| heinola-parempi-kuin-helsinki-hauska-t-paita-heinolalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| heinolalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| helsinki-parempi-kuin-kaikki-muut-itse-sanoo-hauska-t-paita-helsinkilaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| helsinkilainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| huonokin-paiva-kalassa-on-parempi-kuin-hyva-paiva-toissa-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| huonokin-paiva-kalassa-on-parempi-kuin-hyva-paiva-toissa-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| hyvinkaa-parempi-kuin-helsinki-hauska-t-paita-hyvinkaalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| hyvinkaalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| i-my-boyfriend-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| i-my-boyfriend-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| i-my-girlfriend-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| i-my-girlfriend-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| i-swedish-boys-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| i-swedish-boys-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| i-swedish-girls-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| i-swedish-girls-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| ice-aatanahuppari | 49,90 € | 32,97 € | 10,89 € | 0,7 % | -1,1 % | Textildruck Europa (DE) |
| ice-aatanat-paita | 24,90 € | 12,22 € | 8,49 € | 15,4 % | 12,7 % | OPT OnDemand (CZ) |
| iisalmelainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| iisalmi-parempi-kuin-helsinki-hauska-t-paita-iisalmelaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| imatra-parempi-kuin-helsinki-hauska-t-paita-imatralaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| imatralainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| isanta-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| isanta-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| jarvenpaa-parempi-kuin-helsinki-hauska-t-paita-jarvenpaalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| jarvenpaalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| joensuu-parempi-kuin-helsinki-hauska-t-paita-joensuulaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| joensuulainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| jos-iska-ei-osaa-korjata-sita-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| jyvaskyla-parempi-kuin-helsinki-hauska-t-paita-jyvaskylalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| jyvaskylalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kaarina-parempi-kuin-helsinki-hauska-t-paita-kaarinalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| kaarinalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kajaani-parempi-kuin-helsinki-hauska-t-paita-kajaanilaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| kajaanilainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kalamies-t-paita | 24,90 € | 11,48 € | 8,49 € | 18,3 % | 15,7 % | OPT OnDemand (CZ) |
| kalju-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| kalju-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| kangasala-parempi-kuin-helsinki-hauska-t-paita-kangasalalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| kangasalalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kemi-parempi-kuin-helsinki-hauska-t-paita-kemilaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| kemilainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kerava-parempi-kuin-helsinki-hauska-t-paita-keravaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| keravainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kokkola-parempi-kuin-helsinki-hauska-t-paita-kokkolalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| kokkolalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotka-parempi-kuin-helsinki-hauska-t-paita-kotkalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| kotkalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-akaassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-espoossa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-forssassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-hameenlinnassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-harjavallassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-heinolassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-helsingissa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-hyvinkaalla-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-iisalmessa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-imatralla-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-jarvenpaassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-joensuussa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-jyvaskylassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-kaarinassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-kajaanissa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-kangasalla-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-kemissa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-keravalla-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-kokkolassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-kotkassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-kouvolassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-kuopiossa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-lahdessa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-lappeenrannassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-lempaalassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-lieksassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-lohjalla-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-mikkelissa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-naantalissa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-nokialla-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-nummelassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-orimattilassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-oulussa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-pirkkalassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-porissa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-porvoossa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-raisiossa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-raumalla-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-riihimaella-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-rovaniemella-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-salossa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-savonlinnassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-seinajoella-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-tampereella-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-torniossa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-turussa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-vaasassa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-valkeakoskella-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-vantaalla-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-varkaudessa-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kotona-vain-ylojarvella-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kouvola-parempi-kuin-helsinki-hauska-t-paita-kouvolalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| kouvolalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| kuopio-parempi-kuin-helsinki-hauska-t-paita-kuopiolaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| kuopiolainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| lahtelainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| lahti-parempi-kuin-helsinki-hauska-t-paita-lahtelaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| lappeenranta-parempi-kuin-helsinki-hauska-t-paita-lappeenrantalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| lappeenrantalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| lempaala-parempi-kuin-helsinki-hauska-t-paita-lempaalalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| lempaalalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| lieksa-parempi-kuin-helsinki-hauska-t-paita-lieksalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| lieksalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| lohja-parempi-kuin-helsinki-hauska-t-paita-lohjalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| lohjalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| maailman-mestarit-2026-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| maailman-mestarit-2026-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| maailman-paras-aiti-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| maailman-paras-aiti-palkinnon-voittaja-huppari | 49,90 € | 25,66 € | 15,59 € | 6,4 % | 4,8 % | Printify Choice (US) |
| maailman-paras-aiti-palkinnon-voittaja-t-shirt-t-paita | 24,90 € | 15,21 € | 10,39 € | -3,9 % | -7,2 % | Printify Choice (US) |
| maailman-paras-aiti-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| maailman-paras-pappa-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| maailman-paras-pappa-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| maailman-paras-ukki-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| maailman-paras-ukki-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| maailman-paras-ystava-ornament-ceramic-ornament | 19,90 € | 6,34 € | 9,49 € | 22,8 % | 19,9 % | Imagine Your Photos (US) |
| made-in-akaa-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-espoo-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-forssa-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-hameenlinna-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-harjavalta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-heinola-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-helsinki-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-hyvinkaa-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-iisalmi-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-imatra-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-jarvenpaa-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-joensuu-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-jyvaskyla-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-kaarina-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-kajaani-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-kangasala-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-kemi-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-kerava-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-kokkola-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-kotka-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-kouvola-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-kuopio-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-lahti-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-lappeenranta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-lempaala-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-lieksa-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-lohja-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-mikkeli-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-naantali-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-nokia-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-nummela-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-orimattila-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-oulu-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-pirkkala-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-pori-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-porvoo-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-raisio-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-rauma-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-riihimaki-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-rovaniemi-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-salo-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-savonlinna-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-seinajoki-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-tampere-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-tornio-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-turku-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-vaasa-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-valkeakoski-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-vantaa-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-varkaus-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| made-in-ylojarvi-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| mikkeli-parempi-kuin-helsinki-hauska-t-paita-mikkelilaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| mikkelilainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| minulla-ei-ole-alkoholiongelmaa-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| minulla-ei-ole-alkoholiongelmaa-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| museokamaa-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| museokamaa-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| naantali-parempi-kuin-helsinki-hauska-t-paita-naantalilaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| naantalilainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| nokia-parempi-kuin-helsinki-hauska-t-paita-nokialaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| nokialainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| nummela-parempi-kuin-helsinki-hauska-t-paita-nummelalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| nummelalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| ois-viisaampi-haipyy-taalt-t-paita | 24,90 € | 18,34 € | 10,39 € | -16,3 % | -20,0 % | Printify Choice (US) |
| oispa-kaljaa-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| oispa-kaljaa-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| olen-elakkeella-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| olen-elakkeella-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| oma-tekstikuva-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| oma-tekstikuva-koriste | 19,90 € | 6,57 € | 12,99 € | 5,4 % | 1,8 % | SwiftPOD (US) |
| oma-tekstikuva-lippis | 39,90 € | 21,07 € | 13,49 € | 4,8 % | 2,7 % | Fulfill Engine (US) |
| oma-tekstikuva-peitto | 34,90 € | 32,07 € | 23,49 € | -69,4 % | -73,6 % | Miami Sublimation (US) |
| oma-tekstikuva-pitkahihainen | 39,90 € | 23,63 € | 10,89 € | 4,9 % | 2,8 % | Textildruck Europa (DE) |
| oma-tekstikuva-seinataulu | 39,90 € | 17,42 € | 19,39 € | -1,3 % | -3,4 % | Jondo (US) |
| oma-tekstikuva-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| oma-tekstikuva-tarra | 4,99 € | 2,40 € | 14,49 € | -82,8 % | -99,4 % | SPOKE Custom Products (US) |
| oma-tekstikuva-vauvantaaperon-body | 24,90 € | 13,61 € | 13,49 € | -9,8 % | -13,3 % | SwiftPOD (US) |
| orimattila-parempi-kuin-helsinki-hauska-t-paita-orimattilalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| orimattilalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| oulu-parempi-kuin-helsinki-hauska-t-paita-oululaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| oululainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| personoitava-t-paita-alalla-x-vuotta | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| personoitava-t-paita-elava-legenda | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| personoitava-t-paita-harrastusmestari | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| personoitava-t-paita-isalle-maailman-paras-isa | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| personoitava-t-paita-kapteeni | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| personoitava-t-paita-kaupunkilaiselle-kaupunki-lainen-ylpeasti | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| personoitava-t-paita-koiranomistajalle-koiran-nimi-herran-paras-ystava | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| personoitava-t-paita-lempinimi | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| personoitava-t-paita-nimi-legendaarinen-tyosankari | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| personoitava-t-paita-ylpea-ammatin-vanhempi | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| pirkkala-parempi-kuin-helsinki-hauska-t-paita-pirkkalalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| pirkkalalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| pori-parempi-kuin-helsinki-hauska-t-paita-porilaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| porilainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| porvoo-parempi-kuin-helsinki-hauska-t-paita-porvoolaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| porvoolainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| raisio-parempi-kuin-helsinki-hauska-t-paita-raisiolaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| raisiolainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| rauma-parempi-kuin-helsinki-hauska-t-paita-raumalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| raumalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| riihimakelainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| riihimaki-parempi-kuin-helsinki-hauska-t-paita-riihimakelaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| rovaniemelainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| rovaniemi-parempi-kuin-helsinki-hauska-t-paita-rovaniemelaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| saatanan-tunarit-huppari | 49,90 € | 25,66 € | 15,59 € | 6,4 % | 4,8 % | Printify Choice (US) |
| saatanan-tunarit-t-paita | 24,90 € | 11,48 € | 8,49 € | 18,3 % | 15,7 % | OPT OnDemand (CZ) |
| salo-parempi-kuin-helsinki-hauska-t-paita-salolaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| salolainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| savonlinna-parempi-kuin-helsinki-hauska-t-paita-savonlinnalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| savonlinnalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| se-oli-tonnin-seteli-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| se-oli-tonnin-seteli-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| seinajokelainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| seinajoki-parempi-kuin-helsinki-hauska-t-paita-seinajokelaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| slay-queen-huppari | 49,90 € | 25,66 € | 15,59 € | 6,4 % | 4,8 % | Printify Choice (US) |
| slay-queen-t-paita | 24,90 € | 15,21 € | 10,39 € | -3,9 % | -7,2 % | Printify Choice (US) |
| suomi-finland-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| suomi-finland-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| super-aiska-huppari | 49,90 € | 25,66 € | 15,59 € | 6,4 % | 4,8 % | Printify Choice (US) |
| super-aiska-t-paita | 24,90 € | 15,21 € | 10,39 € | -3,9 % | -7,2 % | Printify Choice (US) |
| syntymakaupunki-akaa-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-espoo-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-forssa-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-hameenlinna-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-harjavalta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-heinola-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-helsinki-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-hyvinkaa-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-iisalmi-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-imatra-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-jarvenpaa-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-joensuu-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-jyvaskyla-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-kaarina-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-kajaani-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-kangasala-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-kemi-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-kerava-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-kokkola-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-kotka-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-kouvola-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-kuopio-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-lahti-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-lappeenranta-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-lempaala-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-lieksa-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-lohja-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-mikkeli-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-naantali-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-nokia-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-nummela-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-orimattila-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-oulu-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-pirkkala-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-pori-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-porvoo-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-raisio-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-rauma-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-riihimaki-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-rovaniemi-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-salo-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-savonlinna-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-seinajoki-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-tampere-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-tornio-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-turku-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-vaasa-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-valkeakoski-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-vantaa-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-varkaus-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| syntymakaupunki-ylojarvi-hauska-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| tampere-parempi-kuin-helsinki-hauska-t-paita-tamperelaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| tamperelainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| tassa-talossa-asuu-yksi-pomo-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| tassa-talossa-asuu-yksi-pomo-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| tonnin-seteli-huppari | 49,90 € | 30,19 € | 10,89 € | 6,8 % | 5,2 % | Textildruck Europa (DE) |
| tonnin-seteli-t-paita | 24,90 € | 9,93 € | 8,49 € | 24,4 % | 22,0 % | OPT OnDemand (CZ) |
| tornio-parempi-kuin-helsinki-hauska-t-paita-torniolaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| torniolainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| turku-parempi-kuin-helsinki-hauska-t-paita-turkulaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| turkulainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| vaasa-parempi-kuin-helsinki-hauska-t-paita-vaasalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| vaasalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| valkeakoskelainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| valkeakoski-parempi-kuin-helsinki-hauska-t-paita-valkeakoskelaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| valmentajani-on-vaarallinen-ihminen-t-paita | 24,90 € | 21,40 € | 13,49 € | -40,6 % | -45,1 % | Monster Digital (US) |
| vantaa-parempi-kuin-helsinki-hauska-t-paita-vantaalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| vantaalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| varkaalainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| varkaus-parempi-kuin-helsinki-hauska-t-paita-varkaalaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| virallisesti-tyoton-epavirallisesti-vapaa-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| virallisesti-tyoton-epavirallisesti-vapaa-t-paita | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |
| yksi-kerta-viela-t-paita | 24,90 € | 21,40 € | 13,49 € | -40,6 % | -45,1 % | Monster Digital (US) |
| ylojarvelainen-selviaa-mista-vain-hauska-huppari | 49,90 € | 23,77 € | 15,59 € | 10,6 % | 9,0 % | Printify Choice (US) |
| ylojarvi-parempi-kuin-helsinki-hauska-t-paita-ylojarvelaiselle | 24,90 € | 8,90 € | 8,49 € | 28,5 % | 26,2 % | OPT OnDemand (CZ) |

## Mainonnan kannattavuuden kynnys 28.10.2026 (laskelma, mainontaa ei käynnistetty)

Kaava kuten yllä (api/_lib/kate.js): nettokate = myynti alv 0 - Printifyn tuote- ja toimituskulu - Stripe 1,5 % + 0,25 €.
Nettokate ei sisällä mainontaa, joten se on suurin hankintakustannus (CPA), jolla tilaus ei vielä tuota tappiota.

**Nykyinen keskikate tilausta kohden**

| Peruste | Tilauksia | Keskiostos sis. alv | Keskikate € / tilaus |
|---|--:|--:|--:|
| Toteutuneet tilaukset 6-10/2026 tuotteista, jotka ovat yhä myynnissä (8 t-paitaa, 2 hupparia; ei poistettuja US-mukeja eikä manual-korvauksia) | 10 | 36,80 € | 9,02 € |
| Malli nykyhinnoilla ja nykyisillä painotaloilla (oletettu kori: 50 % 1 t-paita 7,22 €, 10 % 2 t-paitaa 14,65 €, 25 % 1 huppari noin 4,00 €, 5 % t-paita + huppari noin 3,10 €, 10 % juliste 7,47 €) | | noin 37 € | 6,98 € |

Laskelmissa käytetään varovaista mallia, **7,00 € / tilaus**. Toteutunut 9,02 € nojaa #417-painotalon halpoihin
t-paitoihin. EU-siirron jälkeen osa paidoista painetaan kalliimmin (OPT, Textildruck), joten luku ei toistu varmasti.

**Suurin kannattava CPA**

| | Google Shopping | Meta |
|---|--:|--:|
| Nollatulos (CPA = keskikate) | 7,00 € | 7,00 € |
| Tavoite, puolet katteesta jää kaupalle | 3,50 € | 3,50 € |
| Tyypillinen CPA vaatehuumorissa (OLETUS: CPC 0,25-0,40 €, konversio 1,5-2 %; Meta CPM 6-9 €, CTR 1 %, konversio 1 %) | noin 12-27 € | noin 25-45 € |

Ostetulla liikenteellä yhden t-paidan tilaus jää siis tappiolliseksi molemmissa kanavissa. Uusintaostoa ei ole laskettu,
koska sitä ei ole vielä mitattu.

**Millä korilla mainonta kannattaa** (nettokate nykyhinnoilla, kahden tuotteen alennus -5 %, toimitus 6,90 €, ilmainen 79 €:sta):

| Kori | Tuotteet € | Nettokate € | Kattaa CPA:n |
|---|--:|--:|---|
| 1 t-paita | 24,90 | 7,22 | ei kumpaakaan |
| 2 t-paitaa | 49,80 | 14,65 | Shopping, kun CPA on noin 12-14 € |
| 3 t-paitaa | 74,70 | 23,05 | Shopping (12-23 €) |
| 4 t-paitaa (ilmainen toimitus) | 99,60 | noin 30 | Shopping, Meta alarajalla (25-30 €) |
| 1 huppari | 49,99 | noin 4 | ei |
| 2 t-paitaa + huppari | 99,70 | 6,96 | ei |

T-paitakorissa nettokate on noin 0,30 € jokaista tuote-euroa kohden. Nollatulos vaatii siis keskiostoksen
(tuotteet) ≈ (CPA + 0,3) / 0,30:
- Google Shopping, CPA 15 €: noin 51 €, eli kaksi t-paitaa.
- Google Shopping, CPA 20 €: noin 68 €, eli kolme t-paitaa.
- Meta, CPA 30 €: noin 100 €, eli neljä t-paitaa.

Hupparit eivät kanna mainoskulua millään korilla, koska niiden kate on 4-5 €.

**Johtopäätös:** nykyisellä keskiostoksella (noin 37 €) maksettu mainonta on tappiollista. Mainonta muuttuu
kannattavaksi seuraavissa tilanteissa:
- Keskiostos nousee noin 68 €:oon, kun mainonnan CPA on 20 €.
- Kampanja kohdistetaan vain t-paitoihin ja ryhmätilauksiin (/ryhmatilaukset, 5+ paitaa).
- CPA pysyy alle 7 €:n, mikä on realistista vain brändihauissa ja uudelleenmarkkinoinnissa.

Ilmaislistaukset (Merchant-syöte) ja SEO ovat ainoa kannattava liikenne nykyisillä katteilla.
