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
