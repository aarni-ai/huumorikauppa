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

## 1.11.2026 ilta: videot Coworkille (Blob, /hallinta/some), KEISARIT-selitys, 15 trendivideota, Pinterest- ja Shopping-kuvat, yritysmyynnin seuranta

**Videot Coworkin saataville (Vercel Blob, ilmainen taso):**
- Uusi Blob-varasto huumorikauppa-some (fra1, julkinen, kytketty tuotantoon, BLOB_READ_WRITE_TOKEN). Hobby-tason raja 1 Gt; käytössä noin 80 Mt.
- Ladattu (scripts/some-blob.mjs): 35 videota, 35 kansikuvaa, JULKAISUT.md, 50 Pinterest-kuvaa, 50 Shopping-kuvaa ja some/manifest.json. Tiedostoilla on satunnainen pääte.
- Suojattu sivu **/hallinta/some** (allekirjoitettu avain, noindex, robots Disallow /hallinta):
  - videot julkaisupäivän ja kellonajan järjestyksessä: latauslinkki, kansikuva, kuvateksti, hashtagit ja UTM-linkit kopiointipainikkeineen
  - tämän päivän videot korostettuina
  - Pinterest-kuvat otsikon, kuvauksen ja utm_source=pinterest-linkin kanssa
- **Linkit:** avaimellinen linkki on päivän yhteenvetoviestin lopussa (2.11. alkaen), ja cron `?tehtava=hallinta-linkki` palauttaa sen kentässä `some`.
- **Tarkistus tuotannossa:** rajapinta palauttaa 35 videota ja 50 kuvaa, väärä avain 404, video ladattavissa (200).

**KEISARIT-koodi:** tarkistettu tuotannon kassalaskennalla, ja koodi toimii oikein.
- 27,90 €:n paita: -5 %
- Huppari 52,90 €: -3 % (7 €:n kateehto)
- 24,90 €:n paita: 0 % (kate ei riitä)
- Kaksi 27,90 €:n paitaa: 0 %, koska korin oma kahden tuotteen alennus on suurempi. Cowork testasi todennäköisesti 24,90 €:n paidalla tai kahden tuotteen korilla.
- **Kassaan lisätty selitys:** palvelin palauttaa nyt syyn, ja kassa näyttää 0 %:n tilanteessa "Koodilla ei alennusta tähän tuotteeseen." tai, jos korin oma alennus on suurempi, "Korin oma alennus on suurempi, joten se on käytössä koodin sijaan." Kuuluu edelleen: "Koodi KEISARIT hyväksytty".
- Testit: src/components/KumppaniKentta.test.tsx, src/test/kumppani.test.ts.

**15 trendivideota (Coworkin tutkimus):** videot 21–35, 9:16, 10,5–11,4 s, koukku ensimmäisestä ruudusta.
- **POV (8):**
  - isä ja termostaatti
  - isä ja sähkö marraskuussa
  - isä sohvalla klo 20.03
  - marraskuun pimeä aamu
  - se yks kaveri saunassa
  - eläkeläisen menot
  - se yks kaveri pikkujouluissa klo 22
  - se yks kaveri, joka muistaa kaiken
- **Pariskunta (3):** karaokevuoro, riisipuuron manteli ja joulukortit. Ruudussa puhekupla "Hän: ...", vastaus paidan tekstinä.
- **Äänestys "kumman valitsisit?" (4):** isänpäivä, pikkujoulut, eläkeläinen ja joulupaita. Tuotteet A ja B rinnakkain, kehotus kommentoida.
- **Julkaisu:** julkaisulistalla (some/JULKAISUT.md, some/julkaisut.json, /hallinta/some) trendivideot ovat klo 11–13 ja alkuperäiset klo 18–20. Isävideot 2.–5.11., ennen isänpäivää 8.11.
- Kaikkien 35 videon riviväliä kasvatettiin (Ä-pisteet eivät enää osu edelliseen riviin), ja videot renderöitiin uudelleen.

**Pinterest- ja Shopping-kuvat (50 suosituinta, 1000 x 1500, scripts/pinterest-kuvat.mjs):**
- Kun tuotteella on Printifyn lifestyle-mockup oletusvärille (variant_images), sitä käytetään rajattuna 2:3:ksi. Muuten tuote irrotetaan mockupin taustasta ja ripustetaan henkariin seinälle puulattian eteen. Värivaihtoehto valitaan painatuksen kontrastin mukaan.
- **Shopping-versio** on ilman tekstiä (Googlen kuvasääntö) ja on Merchant-syötteen ensimmäinen lisäkuva (api/_lib/lisakuvat.generated.js, api/_lib/syote.js). Tuotannon syötteessä 50 kuvaa.
- **Pinterest-versiossa** on paidan teksti otsikkona ja huumorikauppa.fi.
- **Havainto:** osassa ikävuosipaitoja (esim. 50 vuotta nuori) on tummansininen värivaihtoehto tummalla painatuksella, joten teksti ei erotu. Ehdotus: poista tumma väri niistä tai vaihda painatus vaaleaksi (ei muutettu ilman päätöstä).

**Yritysmyynnin seuranta:**
- Mittariin uusi rivi "viestejä lähetetty / vastauksia / tarjouspyyntöjä / tilauksia" sekä kuukauden ja 30 päivän summat, vastausprosentti ja 14 viimeistä päivää. Mukana myös päivän yhteenvetoviestissä.
- **Coworkin kirjaus:**
  - lomakkeella /hallinta/mittarit-sivulla
  - tai rajapintaan `POST /api/sahkoposti { action: "yritysluvut", avain: <mittarisivun avain>, paiva, viestit, vastaukset, tarjouspyynnot, tilaukset, huom }`
  - Sama päivä uudelleen korvaa luvut, tulevaisuuden päivä hylätään.
- Koodi: api/_lib/yritysluvut.js, taulu `yritysluvut`. 1.11. kirjattu lähtötaso 0.

**Tavoitemittari 1.11.2026 ilta:**
- Kate marraskuussa 0,00 €, matka 3000 €
- Ennuste 5,83 €
- Tilaukset: marraskuu 0, 30 pv 1
- Käynnit tänään 11 (suora 9, google 2)
- Konversio laskelmassa 0,58 % (GA4)
- Tarjouspyynnöt 0, kumppanimyynti 0, yritysmyynti 0/0/0/0
- **Tarve:** 10,5 tilausta ja 1 813 käyntiä päivässä

**Tarkistukset:** 1534 testiä läpi. Kolme User-Agentia: 200 sivuilla /, /linkit, /suosituimmat, /hallinta/some, /hallinta/mittarit, /kassa ja /api/product-feed.

## 1.11.2026: tavoitemittari, oma käyntilaskuri, 20 somevideota, /linkit ja UTM

**Tavoitemittari (totuus päivittäin):**
- Sivu /hallinta/mittarit (allekirjoitettu avain, noindex, robots Disallow /hallinta). Linkki: cron `?tehtava=hallinta-linkki` (kenttä `mittarit`) ja päivän yhteenvetoviestin loppu.
- Päivän yhteenvetoviesti (klo 7, OMISTAJA_EMAIL eli flyapeg@gmail.com) sai lopun osion TAVOITEMITTARI. Kuiva-ajo tarkistettu tuotannossa. Ensimmäinen mittarillinen viesti lähtee 2.11. klo 7.
- **Sisältö:**
  - kuukauden kate tähän mennessä (Printifyn todellinen kulu tai arvio, miinus Stripe ja kumppaniprovisiot)
  - ennuste kuun lopulle (7. päivästä alkaen kuun oma tahti, sitä ennen kertynyt + 30 päivän tahti)
  - matka 3000 €:oon, tilaukset, keskiostos, käynnit, konversio ja liikenteen lähteet (30 pv)
  - saapumissivut, yritysten tarjouspyynnöt tiloittain, kumppanien myynti ja provisio
  - edellisen kuukauden vertailu
  - tarve: tilauksia ja käyntejä päivässä 3000 €:oon sekä tämän kuun loppuun
- Koodi: api/_lib/mittarit.js, api/sahkoposti.js `?mittarit=`, src/pages/MetricsAdminPage.tsx. Testit src/test/mittarit.test.ts.

**Oma käyntilaskuri (GA4 Data API -avaimia ei ole):**
- Kun sivu avataan sivuston ulkopuolelta, kirjataan yksi käynti: päivä, lähde ja saapumissivun osio koosteena. Ei evästeitä, ei selaimen tallennusta, ei IP-osoitetta, joten suostumusta ei tarvita. Tietosuojaselosteeseen lisätty kappale.
- Lähde: utm_source, kumppanilinkki (?ref), Google Ads (gclid) tai viittaava verkkotunnus (google, bing, facebook, instagram, tiktok, youtube, chatgpt ym.), muuten "suora". Botit, uudelleenlataukset, sisäiset siirtymät ja /hallinta eivät ole käyntejä.
- Lähde "testi" (tuotannon tarkistusajot) ei näy luvuissa.
- Koodi: api/_lib/kaynnit.js, src/lib/kaynti.ts, taulu `kaynnit`. Laskuri alkoi 1.11.2026.
- **Konversio laskelmassa:** GA4:n 28 päivän 0,58 % (29.10., 1 036 kävijää, 6 tilausta), kunnes omaa dataa on 7 päivää ja 200 käyntiä.
- **Kate per tilaus laskelmassa:** hinnoittelun laskettu keskikate 9,51 € (29.10.), kunnes 30 päivässä on 5 tilausta uudessa kassassa. Vanhan kassan tilaukset eivät ole Neonissa, ja uudessa kassassa on nyt 1 maksettu tilaus.

**Nykyiset luvut 1.11.2026 klo 12:**

| Mittari | Arvo |
|---|---|
| Marraskuun kate | 0,00 € (0 %), matka 3000 € |
| Ennuste marraskuulle | 5,83 € (kuun alku, 30 päivän tahti) |
| Tilaukset (uusi kassa) | marraskuu 0, 30 pv 1 (54,39 €, kate 5,90 €) |
| Käynnit | 3 (laskuri alkoi tänään: suora 2, google 1) |
| Konversio laskelmassa | 0,58 % (GA4) |
| Yritysten tarjouspyynnöt | marraskuu 0, 30 pv 3 (testejä, hylätty) |
| Kumppanien myynti | 0 |
| Tarve 3000 €:oon | 100 € katetta, 10,5 tilausta ja 1 813 käyntiä päivässä |

Nykytaso GA4:n mukaan on noin 37 kävijää päivässä, joten kuluttajakaupalla tavoite vaatii noin 50-kertaisen liikenteen. Yksi 10 paidan logotilaus päivässä (kate noin 100 €) täyttää saman tavoitteen, joten yritysmyynti on liikenteen rinnalla nopein reitti.

**Somevideot (uusi liikennekanava):**
- 20 pystyvideota some/videot/ (1080 x 1920, 9:16, 10,6 s, H.264, hiljainen äänirata, ei musiikkia). Kansikuvat samannimisinä .jpg-tiedostoina.
- Rakenne: koukku isona tekstinä ensimmäisestä ruudusta, kaksi tuotekuvaa (kaupan Printify-mockupit, hidas zoom), loppuruutu "huumorikauppa.fi".
- Aiheet: Tonnin seteli (2), Saatanan tunarit (2), 60v (2), metsästys (2), kalastus (3), mökki ja sauna (2), golf, joulu (3), pikkujoulut (2) ja personoitu paita. Personoidun paidan kuvat ovat oikeita painokuvia samalla koodilla kuin tilauksessa.
- some/JULKAISUT.md: järjestys 2.-21.11., kuvateksti ja 3-5 hashtagia jokaiselle sekä UTM-linkit kanavittain.
- Generaattori scripts/some-videot.mjs (sharp, resvg, ffmpeg). Videot ja välimuisti ovat .gitignoressa ja .vercelignoressa, koska repo on julkinen ja tiedostot ovat isoja (38 Mt).
- .vercelignore jättää julkaisusta pois myös kirjanpito/- ja KUMPPANIT-*.md-tiedostot, jotka eivät kuulu buildiin.

**UTM ja /linkit:**
- /linkit on bio-linkkisivu (noindex), jossa on 5 linkkiä: Joululahjat, Yrityksille, Personoitu paita, Suosituimmat ja Harrastussarjat. Black Friday tulee ensimmäiseksi linkiksi kampanjan ajaksi 27.11.-1.12. (kampanja-asetuksista), jolloin linkkejä on 6. Saapumisen utm-parametrit kulkevat linkkeihin, jotta GA4 yhdistää ostot somelähteeseen.
- Bio-linkit: huumorikauppa.fi/linkit?utm_source=tiktok|instagram|youtube&utm_medium=social&utm_campaign=bio.
- Uusi laskeutumissivu /suosituimmat (tuotesyötteen top50: myydyimmät ja haetuimmat synttäripaidat). Lisätty sivukarttaan, esirenderöity.

**Tarkistukset:** 1529 testiä läpi. Tuotannossa toimivat käynnin kirjaus (botti hylätty), mittarirajapinta (väärä avain 404) ja sivut /linkit, /suosituimmat ja /hallinta/mittarit selaimessa. Kolme User-Agentia: 200 sivuilla /, /linkit, /suosituimmat, /hallinta/mittarit, /tietosuojakaytanto ja /yritykset.

## 1.11.2026: Printify-testitilausten tarkistus ja pysyvä peruutuskäytäntö

**Tilaus #26630629.38 "TESTI-MV" (Kassa Testi):** oli Oma logo -paidan polkutesti 31.10. klo 21.18 UTC (10 paitaa, Printifyn kulu 89,00 € + toimitus 19,20 €). Se oli jo peruttu samassa ajossa, Printifyn tila canceled, kaikki rivit canceled. Stripessä ei ole maksua, koska testi luodaan suoraan Printifyyn ilman kassaa.

**Kaikki Printify-tilaukset 26.10. alkaen (13 kpl, tarkistettu API:sta 1.11.):**

| Tilaus | Nimi | Tila |
|---|---|---|
| .39 | TESTI Oma logo (perutaan) | canceled (uuden käytännön tarkistusajo 1.11.) |
| .38 | Huumorikauppa #TESTI-MV | canceled |
| .37 | Huumorikauppa #TESTI-MV | canceled |
| .36 | asiakastilaus | in-production |
| .29 to .35 (7 kpl) | KAYTTOONOTTOTESTI (perutaan) | canceled |
| .28 | asiakastilaus | fulfilled |
| .27 | asiakastilaus | fulfilled |

Kaikki 10 testitilausta on peruttu. Yksikään tilaus ei ole On hold -tilassa.

**Uusi käytäntö koodissa (api/_lib/printify.js, api/cron/tilaukset.js):**
- Kaikki testit (logotesti, personointitesti, kayttoonottotesti) käyttävät yhteistä funktiota `testitilaus`.
- Tilauksen nimi Printifyssä on aina "TESTI <testi> (perutaan)" ja external_id alkaa "testi-". Lähetysilmoitus on pois.
- Tilaus perutaan samassa ajossa: käsittelyä odotetaan noin 30 s, peruutusta yritetään 4 kertaa, ja onnistuminen hyväksytään vain, kun Printify palauttaa tilaksi canceled. Jos peruutus ei varmistu, omistajalle lähtee hälytys heti.
- Ennen jokaista uutta testiä aiempien ajojen perumattomat testitilaukset perutaan (`siivoaTestitilaukset`). Testitilaus tunnistetaan sanasta TESTI nimessä tai osoitteesta kassatesti@huumorikauppa.fi. Vain pending- ja on-hold-tilaiset perutaan, tuotannossa oleviin ei kosketa.
- Päivittäinen yhteenvetoajo tekee saman siivouksen ja hälyttää, jos jokin testitilaus jää perumatta.
- Testit: src/test/testitilaus.test.ts (3 testiä). Kaikki 1515 testiä menevät läpi.
- Tarkistusajo tuotannossa: tilaus .39 luotiin nimellä "TESTI Oma logo (perutaan)" ja peruttiin samassa ajossa, tila canceled. Kolme User-Agentia: 200.

## 1.11.2026: Oma logo -paita yrityksille, Erämaankeisarit (malli 2), 5 yritysopasta

- **Oma logo tai teksti** (/yritykset, osio "Oma logo tai teksti"; /yritykset/tilaus; tarjouspyyntö):
  - Yritys lataa logon tai kirjoittaa kaksi tekstiriviä, valitsee halutessaan huumoridesignin ja paidan värin, ja
    esikatselu näyttää saman kuvan, joka painetaan (api/painokuva.js, api/_lib/logopaita.js, logopaita-kuva.js).
  - **Logon tarkistus:** PNG vähintään 1000 px pidemmältä sivulta (huomautus alle 2000 px ja läpinäkymättömästä
    taustasta), enintään 3 Mt (selain pienentää isomman); SVG enintään 1 Mt, skriptit, tapahtumakäsittelijät ja
    ulkoiset viittaukset hylätään. Logot tauluun yrityslogot (sama tiedosto = sama id).
  - **Designit:** 282/318 t-paitaa, joissa etupuolella yksi PNG-kerros (scripts/generoi-logodesignit.mjs).
    Tekstikerroksellisia designeja ei voi yhdistää. Designit on tehty vaaleille paidoille, joten designin kanssa
    värit ovat valkoinen ja vaaleanharmaa (kassa tarkistaa). Pelkkä logo tai teksti: musta, valkoinen,
    vaaleanharmaa ja tummansininen.
  - **Hinta:** 29,90 €/kpl (HINNASTO.personoitu), vähintään 10 kpl, määräalennus kuten t-paidoissa: 10 kpl 26,91 €,
    25 kpl 26,31 €, 50 kpl 25,71 €/kpl, toimitus ilmainen.
  - **Kate (Printifyn todellinen kulu testitilauksesta):** 10 kpl 101,93 € eli 10,19 €/paita, 50 kpl noin
    9,86 €/paita. Raja 5 €/paita täyttyy.
  - **Printify:** maksun tai maksetun laskun jälkeen tilausrivi on lennosta luotu tuote (blueprint 145, OPT OnDemand
    pp 30, Tšekki) ja allekirjoitettu tilauskohtainen painokuva 3461 x 3955 PNG.
  - **Testitilaus 1.11.2026** (cron ?tehtava=logotesti, logo, teksti ja design, 10 kpl): Printify-tilaus
    6ae65b3af5088a7822008676 luotiin. Kulut olivat 89,00 € (8,90 €/kpl) ja toimitus 19,20 €, rivit pp 30 ja tila
    on-hold. Tilaus **peruttiin heti (canceled)**, eikä sitä lähetetty tuotantoon.
  - **Kassa ja lasku:** logon olemassaolo tarkistetaan ennen maksua, alle 10 kpl hylätään (testattu tuotannossa
    9 kpl ja tuntematon logo). Laskun rivillä näkyy "oma logo, teksti ..., design ...". Korissa, kassalla ja
    vahvistuksessa näkyy luettava kuvaus logon id:n sijaan.
  - **Tarjouspyyntö:** mallissa "Oma logo tai teksti" lomakkeessa on sama editori. Logo, teksti, design, väri ja
    esikatselulinkki tallentuvat (sarake logo) ja näkyvät ilmoituksessa ja /hallinta/tarjoukset-sivulla.
  - **Mobiilitesti (390 px):** lataus, esikatselu, designin valinta ja värirajaus, tarjouspyyntö (12 kpl
    322,92 €, ilmoitus lähetetty flyapeg@gmail.com, pyyntö id 3 merkitty hylätyksi) sekä siirtymä tilaussivulle,
    jossa kokotaulukko ja 10 kpl:n minimi toimivat. Ei vaakavieritystä. Testin paidat poistettiin selaimen korista.
- **Erämaankeisarit:** Gmailissa ei ole vielä hyväksyntää. Mallin 2 koodi `keisarit` (KEISARIT) on luotu valmiiksi,
  ja kassa palauttaa malli alennus, -5 %. Tervetuloviesti on paikallisessa tiedostossa KUMPPANIT-KEISARIT.md
  (gitignore). Sähköposti lisätään, kun vastaus tulee.
- **SEO, 5 yritysopasta** (src/data/blogYritysHaut2026.ts): yrityksen joululahja työntekijöille, pikkujoulupaidat
  tiimille, tiimipaidat omalla logolla, joululahja asiakkaille yritys ja hauska tiimipaita.
  - Jokaisessa 600-900 sanaa, 4-8 tuotelinkkiä, linkki /yritykset, FAQ (FAQPage) ja tuotekortit (teemat yritykset
    ja yritysPikkujoulu). Mukana sivukartassa ja /yritykset-sivun osiossa "Oppaat yrityksille".
  - Ei päällekkäisyyttä vanhojen kanssa: joululahja-tyontekijoille on lahjaideat ja pikkujoulupaidat-porukalle
    kaveriporukat; uudet käsittelevät yrityksen hankintaa ja logoa.
  - /yritykset-sivun laskutusteksti korjattu (lasku suoraan sivulla Yritystilaus, ei sähköpostisopimusta).
- **Tarkistukset:** testit 1512 läpi (uusi src/test/logopaita.test.ts ja blogitestit), 3 User-Agentia 200 sivuilla
  /, /yritykset, /yritykset/tilaus, viidellä oppaalla ja /kumppanit. Sivukartta sisältää 5 uutta osoitetta;
  huumorikauppa.fi/sitemap.xml näyttää ne välimuistin (1 h) vanhennuttua.

## 31.10.2026 ilta: Klarna-päätös, kumppanimalli 2, yritysmyynnin mobiilitesti

- **Klarna ja MobilePay pysyvät** kaikissa tilauksissa. Aarni hyväksyi enintään 0,69 €:n poikkeaman 7 €:n minimistä
  näillä maksutavoilla (KATTEET.md "Päätös 31.10.2026").
- **Pois tehtävälistalta:** Holvi-kortti on jo Printifyssä, ja Aarni vaihtaa Stripen tilitystilin itse.
- **Kumppanimalli 2** (KATTEET.md "Kumppanimalli 2"):
  - Kumppanin koodilla ostaja saa -5 % ja kumppani 5 % provision tuotteista alennuksen jälkeen, ilman ALV:tä ja
    toimitusta.
  - Kauppaan jää aina vähintään 7 €. Muuten alennus ja provisio pienenevät 1 %-yksikön askelin tai jäävät pois.
  - Jos kahden tuotteen, määrä- tai pakettialennus on yhtä suuri tai suurempi, kumppanialennusta ei lisätä.
  - Kassa näyttää kumppanikoodin kentässä ja yhteenvedossa "Koodi X: -5 %" (tai korille toteutuvan pienemmän
    prosentin, jonka palvelin laskee).
  - Malli asetetaan: ?tehtava=kumppani-lisaa&koodi=...&malli=alennus. Antsa pysyy mallissa 1.
  - Provisio lasketaan raporteissa (kumppanit, kumppanin oma raportti, kirjanpidon kuukausiraportti) tilauksen
    kumppanitapahtumaan tallennetulla prosentilla.
  - /kumppanit näyttää molemmat mallit sääntöineen ja esimerkkeineen, myös esirenderöitynä:
    - 27,90 €:n paita: ostaja -5 % (1,39 €), provisio 1,06 €
    - 24,90 €:n paita: ei alennusta
    - huppari: -3 %, provisio 1,23 €
  - **Tuotantotesti** väliaikaisella kumppanilla testi-malli2, joka poistettiin heti käytöstä:
    - 27,90 € paita 5 %
    - 24,90 € paita 0 %
    - huppari 3 %
    - antsa (malli 1) 0 %
- **Yritysmyynti mobiilissa** (Chrome, 390 px kehys; 85 yritystä sai muistutuksen):
  - /yritykset: ei vaakavieritystä.
  - Pyydä tarjous vierittää lomakkeeseen, laskuri toimii (12 meemipaitaa = 268,92 €, -10 %), ja toimituspäivä
    näyttää "Ehtii".
  - Testipyyntö tallentui hinnan, katteen (81,62 €) ja toivotun päivän kanssa.
  - /yritykset/tilaus: designin haku, väri, kokotaulukko, summa (10 kpl 249,00 €, -10 %) ja laskun lomake toimivat.
    Kaupparekisteristä puuttuva Y-tunnus hylätään selvällä viestillä ennen laskun luontia (oikeaa laskua ei
    lähetetty).
- **Ilmoitus jokaisesta tarjouspyynnöstä:**
  - Ilmoitus lähtee omistajalle (OMISTAJA_EMAIL = flyapeg@gmail.com). Kun Resend-domainia ei ole vahvistettu, se
    lähtee Resendin testilähettäjältä samaan osoitteeseen.
  - Lähetyksen tulos tallentuu nyt tarjouspyynnön riville (sarake ilmoitus) ja näkyy /hallinta/tarjoukset-sivulla.
    Epäonnistunut ilmoitus näkyy punaisena.
  - Testipyynnössä luki "lähetetty flyapeg@gmail.com". Testipyynnöt merkittiin hylätyiksi.
- **Tarkistus:** Googlebot, Bingbot ja Chrome saavat 200:n (/kumppanit, /yritykset, /yritykset/tilaus, /kassa ja
  etusivu). Testit: 1466 läpi.

## 31.10.2026: ALV-päätös, rahavirta, kirjanpidon kuukausiraportti, maksutapojen katteet, yritysnostot

- **Printifyn ALV:** kirjanpitäjä vahvisti, että ALV on vähennettävissä. Hinnat pysyvät ennallaan, ja
  PRINTIFY_ALV_VAHENNETTAVA = true. Kirjattu KATTEET.md:hen ("Printifyn ALV: päätös 31.10.2026").
- **Rahavirta (KAYTTOONOTTO.md):**
  - Stripe-tilitykset menevät Huumorikaupan Holvi-tilille. IBAN on reposta maskattu, koska repo on julkinen.
  - Printify veloittaa Holvi-kortilta.
  - Ennen 27.10. myynti kuuluu Tmi Intellerille, siitä eteenpäin Uusiku Oy:lle.
- **Kirjanpidon kuukausiraportti (api/_lib/kirjanpito.js):**
  - Sisältö: tilaukset, myynti ALV:n kanssa ja ilman, ALV 25,5 %, toimitukset, myydyt lahjakortit, Stripen kulut
    tilauksittain, palautukset, kumppaniprovisiot ja Stripe-tilitykset. Muodot CSV (Excel, puolipiste) ja PDF.
  - Lähteet: Neon ja Stripe API.
  - Vercel Cron (vercel.crons.json "0 6 2 * *") lähettää edellisen kuun raportin omistajalle liitteinä kuun 2.
    päivä.
  - Käsin: `node scripts/kuukausiraportti.mjs ALKU LOPPU`.
- **Lokakuu (27.-31.10.):** kirjanpito/2026-10/myyntiraportti-huumorikauppa-2026-10-27-2026-10-31.csv ja .pdf.
  - 1 tilaus, myynti 54,39 € sis. ALV, ALV 0 % 43,34 €, ALV 11,05 €
  - Stripen kulu 2,03 € (Klarna), palautukset 0, provisiot 0
  - Tilitykset 0 € aikavälillä
  - Kansio on .gitignoressa, ja Aarni tai Cowork vie tiedostot kirjanpitäjälle.
- **7 €:n minimi maksutavoittain** (KATTEET.md):
  - ETA-kortilla, Apple Paylla ja Google Paylla mikään tavallinen tilaus ei jää alle 7 €:n.
  - Klarnalla, premium-, UK- ja kansainvälisellä kortilla alle 7 €:n jäävät yhden tuotteen tilaukset: 24,90 €:n
    t-paidat, heikoimmat hupparit (50-61 varianttia) ja koriste. Heikoin on 6,31 € Klarnalla ja 5,41 € ulkomaisella
    Klarnalla.
  - MobilePaylla 25 kalleinta 24,90 €:n paitavarianttia jää 6,94 €:oon.
  - Kahden tuotteen tilaukset ja Black Friday -pari ylittävät 7 €:n kaikilla maksutavoilla.
  - Päätös Aarnille: Klarna ja MobilePay vain yli 60 €:n tilauksiin tai poikkeaman hyväksyntä.
- **Yritystilauksen nosto "Tilaa koko tiimille: 10+ t-paitaa -10 %"** (src/components/YritysNosto.tsx) linkkeineen
  /yritykset/tilaus ja /yritykset:
  - Blogit (Search Console -klikkaukset): lahja-miehelle-30v-40v-50v-60v, mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea
    ja lahja-naiselle-30v-40v-50v-60v.
  - Tuotteet (Printifyn toteutuneet tilaukset): Tonnin seteli -t-paita (4), Saatanan tunarit -t-paita (3), Tonnin
    seteli -huppari (2), Maailman paras äiti -huppari (2) ja Amatimies-huppari (1).
  - Teksti sanoo "t-paitaa", koska määräalennus ei koske huppareita.
- **Tarkistus:** Googlebot, Bingbot ja Chrome saavat 200:n. Nosto näkyy kolmessa blogissa ja tuotesivuilla, myös
  esirenderöidyssä HTML:ssä. Testit: 1462 läpi.

## 30.10.2026 ilta: yritysmyynnin kone, yritystilaus laskulla, kumppanikoodin vahvistus

Tavoite: 3000 €/kk kate. Nopein reitti on yritystilaukset ja joulusesonki. Yksi 25 t-paidan yritystilaus (27,90 €,
-12 %) tuottaa noin 220 € katetta, eli saman verran kuin noin 22 tavallista tilausta.

### Antin koodi ANTSA
- **Kassa:** koodi hyväksytään kirjainkoosta riippumatta (tarkistettu: `kumppanikoodi` palauttaa ok antsalle).
  Tilaukselle kirjataan tapahtuma "kumppani".
- **Uutta:** kassan Kumppanikoodi-kentässä on näkyvä vahvistus "Koodi ANTSA hyväksytty" (src/components/KumppaniKentta.tsx).
  Tuntemattomalle koodille näkyy "Koodia ... ei löytynyt".
- **Miksi Cowork ei nähnyt tallennusta:** ?ref=antsa tallentuu selaimen istuntoon (sessionStorage) vain
  markkinointisuostumuksella. Ilman suostumusta koodi pysyy muistissa sivulatauksen ajan (sivulta toiselle
  siirtyminen säilyttää sen) ja täyttyy kassan kenttään.
- **Korjaus:** jos suostumus annetaan vasta linkin avaamisen jälkeen, koodi tallennetaan istuntoon silloin.
- Linkin avaus kirjautuu lisäksi Antin klikkauslaskuriin palvelimella ilman suostumusta, koska tunnisteita ei
  tallenneta.

### Yritysmyynnin kone (/yritykset)
- **Valmiit paketit:**

  | Paketti | 10 kpl | 25 kpl | 50 kpl |
  |---|---|---|---|
  | Pikkujoulupaita koko tiimille | 251,10 € | 613,80 € | 1 199,70 € |
  | Joululahja asiakkaille ja henkilökunnalle (meemipaidat) | 224,10 € | 547,80 € | 1 070,70 € |
  | Työmaa- tai tiimipaita | 251,10 € | 613,80 € | 1 199,70 € |

  Hinnoissa on määräalennus, ja toimitus on ilmainen. Kortissa on painikkeet "Pyydä tarjous" ja "Tilaa heti".
- **Tarjouslaskuri:** asiakas valitsee mallin (meemipaita, t-paita, huppari) ja syöttää määrät koon mukaan
  (S-5XL). Laskuri näyttää hinnan, kappalehinnan ja määräalennuksen. Kate lasketaan vain palvelimella, eikä asiakas
  näe sitä.
- **Toivottu toimituspäivä:** lomake näyttää heti, ehtiikö tilaus perille (16 arkipäivää, joulun mitoitus) ja
  joulun takarajan.
- **Tallennus:** jokainen tarjouspyyntö tallentuu tauluun tarjouspyynnot (paketti, malli, koot, hinta, kate,
  toivottu päivä, ehtii, Y-tunnus, tila). Omistajalle lähtee ilmoitus.
- **/hallinta/tarjoukset:** suojattu allekirjoitetulla avaimella (linkki: cron ?tehtava=hallinta-linkki). Sivu
  näyttää pyynnöt katteineen, ja tilan voi vaihtaa (uusi, vastattu, tilattu, hylatty). Sivu on noindex, ja
  robots.txt:ssä on Disallow /hallinta.

### Yritystilaus (/yritykset/tilaus)
- Designit, värit ja koot syötetään taulukkona. Designeja voi olla useita.
- **Kortti:** rivit menevät ostoskoriin ja tavalliselle kassalle (kortti, Apple Pay, Google Pay, Klarna,
  MobilePay), jossa määräalennus lasketaan.
- **Lasku (Stripe Invoice, maksuaika 14 pv):**
  - Ehdot: vähintään 10 tuotetta ja Y-tunnus. Tunnuksen tarkiste tarkistetaan, ja yrityksen pitää löytyä PRH:n
    avoimesta YTJ-rajapinnasta eikä olla lopettanut.
  - Tilaus odottaa maksua. Stripe-asiakkaalle tulee ALV-tunniste FI+Y-tunnus.
  - Laskun rivit ovat sis. ALV 25,5 % (inclusive-verokanta luodaan ensimmäisellä laskulla).
  - Alatunnisteessa ovat myyjän Y-tunnus ja ALV-numero. Lasku viimeistellään ja lähetetään asiakkaalle.
- **Printify-tilaus lähtee vasta maksun jälkeen:**
  - webhook invoice.paid (api/stripe-webhook.js)
  - tunnin cron, joka tarkistaa avoimet laskut 45 päivältä
  - mitätöity tai perimätön lasku perii tilauksen
- **Testi:** Stripe-tilillä on vain live-avain. ?tehtava=laskutesti laskee laskun rivit nykyhinnoilla ilman
  Stripeä. Kun STRIPE_TEST_SECRET_KEY on Vercelissä, sama tehtävä tekee testitilassa koko polun (asiakas, ALV,
  lasku, viimeistely, maksu) ilman Printify-tilausta. Yksikkötestit kattavat laskun datan, Y-tunnuksen, aikataulun
  ja laskurin.

### Joulu
- Yritysten joulutakaraja on **to 26.11.2026**: t-paitojen 16 arkipäivää + 3 arkipäivää kokojen keruuseen ja
  maksuun, perillä 23.12.
- Etusivun yläosassa on palkki "Yritysten joululahjat: tilaa viimeistään to 26.11." (näkyy takarajaan asti).
- Samat tiedot näkyvät /yritykset- ja /yritykset/tilaus-sivuilla.

### Aarnin tehtävät (Stripe) (31.10.: Holvi-kortti on Printifyssä ja tilitystili Aarnin hoidossa)
1. Stripe > Settings > Billing > Invoices: oletusmaksutavat laskuille (kortti ja tilisiirto/SEPA). Tarkista,
   että asiakassähköpostit laskuista ovat päällä.
2. Stripe > Settings > Business > Public details: Uusiku Oy, osoite ja ALV-numero laskuille.
3. Stripe > Developers > Webhooks: lisää nykyiseen huumorikauppa-five.vercel.app/api/stripe-webhook-endpointiin
   tapahtumat invoice.paid, invoice.voided ja invoice.marked_uncollectible. Cron tarkistaa laskut tunnin välein
   ilmankin.
4. Testitila: kopioi Stripen testiavain (sk_test_...) Vercelin ympäristömuuttujaksi STRIPE_TEST_SECRET_KEY
   (ei chattiin), ja aja ?tehtava=laskutesti.
5. Stripe Invoicing veloittaa maksetuista laskuista 0,4 %. Kuukausimaksua ei ole.

## 30.10.2026: ensimmäinen kumppani, kumppanin raportti, ALV-varasuunnitelma, laatuvirhe, SEO 10 sivua

### Ensimmäinen kumppani: antsa
- Kumppani Antti "antsa" Heinonen (Instagram @antsa_outdoor) on lisätty kantaan (?tehtava=kumppani-lisaa).
  - koodi ANTSA, järjestelmässä `antsa`
  - linkki https://huumorikauppa.fi/?ref=antsa
- Tervetuloviesti, 5 somejulkaisua ja suorat linkit 5 tuotteeseen ovat tiedostossa **KUMPPANIT-ANTSA.md**. Cowork
  lähettää viestin sieltä.
  - Tuotteet: Kala oli tätäkin isompi, Pilkillä. Älä soita, Passissa 14 tuntia, Ei ole kiire olen metsässä
    -huppari ja Mökillä ei ole kiire.
- KUMPPANIT-ANTSA.md on .gitignoressa, koska repo on julkinen ja tiedostossa on sähköposti ja raportin avain.
  Tiedosto on vain koneella ~/huumorikauppa.

### Kumppanin oma raportti
- Sivu /kumppanit/raportti?koodi=...&avain=... näyttää klikkaukset, tilaukset, tuotteiden arvon ja provision
  kuukausittain.
- Tilauksista näytetään vain päivä, tuotteiden arvo ja provisio. Asiakkaiden tietoja ei näytetä.
- Avain on allekirjoitettu tunniste (MARKKINOINTI_SALAISUUS), jota ei tallenneta. kumppani-lisaa palauttaa linkin.
- Väärä avain tai koodi palauttaa 404. Sivu on noindex ja robots.txt:ssä Disallow.
- Klikkaukset: kumppanilinkin avaus kirjataan päiväkohtaiseen laskuriin (taulu kumppani_klikit, ei tunnisteita
  eikä evästeitä). Botit ohitetaan. Vain hyväksytyt, aktiiviset koodit kirjataan.

### Printifyn ALV-varasuunnitelma (valmis, pois päältä)
- Yksi kytkin: api/_lib/vakiot.js `PRINTIFY_ALV_VAHENNETTAVA = false`. Se vaihtaa kulukertoimen 1,255:een ja
  hinnaston `HINNASTOT.alvKulu`:un. Hinnat:
  - t-paidat 30,90/31,90 €, 3XL+ 34,90/35,90 €
  - hupparit 65,90 €, 3XL+ 72,90 €
  - juliste 28,90 €, koriste 27,90 €
  - personoitu 32,90 €
  - Black Friday -pari 49,90 €
- Tuotannon kuluilla jokainen variantti jää tällöinkin vähintään 7,09 €:oon.
- Sisältöjen hintamaininnat (blogit, laskeutumissivut, UKK, mediakit) tulevat nyt hinnastosta
  (src/data/hintatekstit.ts), joten ne päivittyvät samalla.
- 30 päivän alin hinta pysyy 24,90 €:ssa, mikä on laillinen alin hinta Black Fridayta edeltäviltä 30 päivältä.
- Käsin päivitettävät kohdat on listattu KATTEET.md:ssä ("ALV-varasuunnitelma 30.10.2026").

### Laatuvirhe: Teron Tonnin seteli -paita (26630629.22)
- **Painotalo:** tilaus tehtiin 17.10. vanhan kassan kautta. Printify Choice reititti sen latvialaiselle
  painotalolle (Printifyn painotalo 417, rivin maa Latvia, lähetys UNISEND LI399199132LT, toimitettu 29.10.).
- **Muut tilaukset samalta painotalolta:** 9 t-paitariviä 27.3.-26.10. Niistä Tonnin seteli -paidat ovat .22, .25
  (24.10.) ja .26 (25.10.).
- **Muut valitukset:** kaupan arvioissa ei ole odottavia tai huonoja arvioita. Liitetty Gmail on eri tili kuin
  kaupan postilaatikko, joten sähköpostivalituksia ei voitu tarkistaa.
- **Siirto:** Tonnin seteli -t-paidat siirrettiin jo 25.10. EU-siirrossa OPT OnDemandille (Tšekki), ja uuden kassan
  tilaukset menevät sinne (esim. .28 27.10.).
  - Tonnin seteli -hupparit ovat Textildruckilla (Saksa).
  - Molempien tuotteiden kaikki värit ja koot ovat myynnissä.
  - Kate on vähintään 7 €: heikoin suoran vertailun t-paita 7,05 €.
  - Latvialaiselle painotalolle ei mene enää Tonnin seteli -tilauksia, joten uutta siirtoa ei tarvita.
- **Cowork:**
  - Tee Printifyyn laatureklamaatio tilauksesta 26630629.22 (valokuvat Terolta, homeen haju ja painatus). Printify
    korvaa tai painaa uudelleen virheellisen tuotteen.
  - Seuraa tilauksia .25 ja .26, jotka tulivat samalta painotalolta.

### SEO: seuraavat 10 sivua sijainneilta 5-20 (Search Console 28 pv)
| Sivu (näytöt, sijainti) | Kyselyt | Muutos |
|---|---|---|
| /blogi/mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea (1 411, 9,5) | hauskat 50v lahjat, persoonallinen lahja 50-vuotiaalle | kirjoitettu uudelleen: 10 oikeaa tuotetta linkkeineen (ennen olemattomia "Museo-kappale", "Legendaarinen"-huppari, pipot), title/meta, UKK 5 |
| /blogi/hauska-lahja-kaverille (856, 10,0) | mitä ostaa kaverille synttärilahjaksi, hauska lahja ystävälle | kirjoitettu uudelleen: 12 ideaa oikeilla tuotteilla (ennen pipo ja kangaskassi), UKK 4 |
| /blogi/hauskat-lahjat-tyokavereille-opas (754, 13,3) | läksiäislahja työkaverille, eläkelahja työkaverille, kiitoslahja | kirjoitettu uudelleen: läksiäis-, eläke-, kiitos- ja pikkujoululahjat, tiimin määräalennus, UKK 6 |
| /lahjat/60-vuotiaalle-miehelle (337, 12,8) | mitä lahjaksi 60 vuotiaalle miehelle (128), jolla on jo kaikkea (89) | title, H1, UKK: jolla on jo kaikkea, isälle, hinta |
| /lahjat/50-vuotiaalle-miehelle (247, 18,1) | mitä lahjaksi 50 vuotiaalle miehelle | title, H1, UKK: isälle, personoitu, hinta |
| /lahjat/50-vuotiaalle-naiselle (209, 16,0) | 50v lahja naiselle (175), persoonallinen lahja | title, H1, UKK: persoonallinen, jolla on jo kaikkea, hinta |
| /lahjat/60-vuotiaalle-naiselle (122, 18,9) | mitä lahjaksi 60 vuotiaalle naiselle (124), 60v lahja naiselle (81) | title, H1, kuvaus, UKK |
| /lahjat/30-vuotiaalle-miehelle (184, 9,7) | 30v lahja miehelle (112), lahja 30-vuotiaalle miehelle (67) | title, H1, UKK: mitä lahjaksi, veljelle/kaverille, hinta |
| /elakelahjat (153, 14,4) | eläkelahja (70), mitä lahjaksi eläkkeelle jäävälle (58), mitä eläkeläiselle lahjaksi (54) | title, H1, UKK |
| /hauska-isanpaivalahja (/isanpaiva-lahjat 166, 15,0) | hauska isänpäivälahja, isänpäivä huppari | title 2026, UKK: hupparit, hinta; linkki personoituun paitaan |

Hinnat UKK:issa tulevat hinnastosta. Laskeutumissivuilla ei ole superlatiiveja (testi kieltää sanan "paras").

**Tarkistus:**
- Googlebot, Bingbot ja Chrome: kaikki 10 sivua sekä /kumppanit, /kumppanit/raportti ja etusivu palauttavat 200,
  ja uudet otsikot näkyvät.
- Katetaulu: nykyisellä hinnastolla 0 varianttia alle 7 €:n, varahinnastolla (&alv=1) 0.
- Testit: 1455 läpi.

## 29.10.2026 klo 20: katekorjaus (keskikate vähintään 10 €, minimi 7 €)

Yksityiskohdat ovat KATTEET.md:n osiossa "Hinnoittelu 29.10.2026". Julkaistu ja tarkistettu tuotannossa.

**Hinnat (api/_lib/kokohinnat.js):**
- T-paidat, joilla on suora kilpailijavertailu (14 designia), pysyvät 24,90 €:ssa. 3XL-5XL maksaa 28,90 €.
- Muut 304 t-paitaa maksavat 27,90 €, 3XL-5XL 29,90 €.
- Hupparit 52,90 €, 3XL+ 59,90 €.
- Julisteet 24,90 €, koriste 22,90 €.
- Personoitu paita pysyy 29,90 €:ssa.
- Toimitus pysyy 6,90 €:ssa, ilmainen 79 €:sta.
- Kaikki hinnat ovat kilpailijoiden haarukassa (Hauskatpaidat.fi t-paita 25-30 €, huppari 45-69 €).

**7 €:n minimi:**
- Tuotannon kuluilla (uusi ?tehtava=katetaulu) yksikään myytävä variantti ei jää alle 7 €:n. Heikoin on 24,90 €:n
  t-paita, 7,05 €.
- Tarraa myydään vain lisätuotteena: kassa hylkää pelkän tarran, ja tuotesivu ja ostoskori kertovat ehdon.
- Alennuskoodi hylätään, jos kate jäisi alle 7 €:n. Paketti- ja kahden tuotteen alennus jätetään samalla ehdolla
  antamatta (katevahti 7 €).
- Määräalennus koskee nyt kaikkia t-paitoja, 5 € paitaa kohden.
- Black Friday -pari koskee vain 24,90 €:n paitoja. Niiden hinta ei muuttunut, joten 30 päivän alin hinta 24,90 €
  pitää paikkansa.
- Hintatarkistus kirjaa nyt todelliset myyntihinnat ja hälyttää vain kampanjapaitojen poikkeamasta.

**Alennuskoodit:**
- HUUMORI5 (käytetty kerran, 2,50 €) ja PALAA10 (ei käyttöä) on poistettu kannasta käytöstä sekä koodin
  varalistasta ja kassasivulta. Kumpaakaan ei mainostettu missään.
- Stripessä ei ole koodeja.
- Kassa hylkää nyt HUUMORI5:n (tarkistettu).

**Kumppanit:**
- Kauppaan jää provision jälkeen vähintään 7,00 €.
- /kumppanit-sivun esimerkit, sääntöteksti ja KUMPPANIT-VIESTIPOHJA.md on päivitetty.
- Esimerkiksi t-paita 27,90 € tuo provisiota 2,22 € ja 24,90 €:n paita 0,22 €.

**Myynnin ohjaus:**
- Ostoskori ehdottaa "Lisää toinen t-paita" -rivillä kolmea t-paitaa, kun korissa on yksi t-paita. Samalla näkyy
  linkki personoituun paitaan.
- Etusivulla on nostot personoidulle paidalle ja /yritykset-sivulle.
- Tuotesivuilla (t-paidat ja hupparit) on linkki personoituun paitaan.

**Tekstit:**
- Kaikki hintamaininnat on päivitetty "alkaen"-muotoon tai uuteen haarukkaan: blogit, joulublogit,
  laskeutumissivut, mediakit, yritykset ja meta-kuvaukset.
- Kolme "alle 20 euron" vastausta on kirjoitettu uudelleen, koska koriste maksaa nyt 22,90 €.
- Etusivun pääkuva on generoitu uudelleen ("T-paidat alkaen 24,90 €, hupparit alkaen 52,90 €").

**Keskikate tilausta kohden:**
- ennen 7,64 €
- nyt 9,51 € ilman lisämyyntiä
- 10,13 €, kun 10 % yhden paidan koreista saa toisen paidan

Nykyisellä noin 6,5 tilauksella kuukaudessa vaikutus on noin +12-16 €/kk (49,7 € → 61,8-65,8 €).

**Avoimet päätökset Aarnille:**
- **Klarna:** se maksaa 0,6-1,0 € enemmän kuin kortti. Klarnalla heikoimmat variantit jäävät alle 7 €:n:
  24,90 €:n paita 6,43 €, koriste 6,63 € ja huppari 6,31 €. Vaihtoehdot:
  - Klarna pois alle 60 €:n tilauksista
  - poikkeama hyväksytään
- **Printifyn ALV:** katteet olettavat, että Uusiku Oy vähentää Printifyn ALV:n. Jos ei voi, t-paitojen pitää maksaa
  30,90 € ja hupparien 59,90 €. Tilitoimiston vahvistus tarvitaan ennen 1.11.
- **Printify Premium:** kannattaa noin 14 tilauksesta kuukaudessa alkaen. Nyt se ei kannata, eikä sitä tilattu.
- **Painotalot:** siirto ei kannata. Textildruck ja Atelier Katanga pudottaisivat värejä tai kokoja.

**Tarkistus:**
- Googlebot, Bingbot ja Chrome: etusivu, tuotesivut (24,90 € ja 27,90 € JSON-LD:ssä), /kumppanit, /yritykset,
  /personoitu-paita, blogi, /black-friday, ostoskori ja robots.txt palauttavat 200.
- Rajapinta palauttaa koon mukaiset hinnat (kalamies 27,90/29,90 €, huppari 52,90/59,90 €).
- Testit: 1451 läpi.

## 29.10.2026 klo 18: Search Console "403 Forbidden" (179 osoitetta) korjattu

**Mitkä osoitteet:** Search Consolen Sivujen indeksointi -raportin kaikki 179 osoitetta tilassa "Blocked due to access
forbidden (403)" ovat vanhan sivuston kuvaosoitteita muotoa
`/api/image-proxy?url=https://images-api.printify.com/mockup/.../<tuote>.jpg?camera_label=...`. Google haki ne
23.5.-18.9.2026. Mikään niistä ei ole sivu, eikä yksikään tuote-, sarja-, blogi- tai muu sivu ole 403-tilassa.
Raportin tiedot on päivitetty viimeksi 23.10.2026.

**Syy:** `api/image-proxy.ts` haki kuvan Printifystä User-Agentilla "Googlebot-Image". Printify torjuu Googlebotiksi
esittäytyvän pyynnön, joka tulee Vercelin IP-osoitteesta (väärennetty botti), ja proxy välitti Printifyn 403:n
eteenpäin. Selaimella tai curlilla omalta koneelta kuva latautui, joten vika näkyi vain Googlelle.

Muut epäillyt syyt eivät pidä paikkaansa:
- Vercelin palomuuri ja Bot Protection eivät aiheuta tätä: sama 403 tuli myös uuden projektin omasta osoitteesta
  (huumorikauppa-five.vercel.app), ja sivut palauttavat Googlebot-tunnisteella 200:n.
- Vanhan projektin välitys ja middleware eivät aiheuta tätä: sivut palauttavat 200:n kummankin osoitteen kautta.
- Ohjaukset eivät aiheuta tätä.

**Korjaus:**
- `api/image-proxy.ts` ohjaa nyt vanhan osoitteen pysyvällä 301-ohjauksella nykyiseen kuvaproxyyn
  `/api/img?u=<sama kuva>`. Ohjaus hyväksyy vain Printifyn kuvapalvelimet (https), joten avointa uudelleenohjausta ei
  synny. Muut osoitteet saavat 404:n ja noindexin.
- robots.txt:hen lisättiin kaikkiin kolmeen ryhmään `Allow: /api/image-proxy`, jotta Google näkee ohjauksen.
- Hallinta- ja API-reitit pysyvät estettyinä (Disallow: /admin, /kassa, /api/ ym.).

**Tarkistus 29.10.2026:**
- Googlebot, Bingbot ja Chrome sekä huumorikauppa.fi että huumorikauppa-five.vercel.app:
  `/api/image-proxy?url=...` palauttaa 301 ja sen jälkeen 200 image/jpeg; robots.txt palauttaa 200.
- Vieras isäntä (`?url=https://evil.example/...`) palauttaa 404.
- Kaikki 779 sitemapin osoitetta (tuotteet, sarjat, artikkelit, laskeutumissivut) palauttavat Googlebotille 200:n, ja
  jokaisessa on `<meta name="robots" content="index, follow, ...">`. Yhdessäkään ei ole noindexiä tai
  X-Robots-Tag-estoa.
- robots.txt ei estä yhtään julkista sivua.

**Merchant listings:**
- Tuotesivujen Product-rakenteisessa datassa on jo `priceValidUntil` (seuraavan vuoden 31.12., nyt "2027-12-31").
- Datassa ovat myös availability, shippingDetails ja hasMerchantReturnPolicy.
- Botille tarjoiltu tuotesivu tarkistettiin curlilla.
- Lisäyksiä ei tarvittu.

**Seuraavaksi (Aarni tai Cowork):** Search Consolessa Sivut, sitten "Blocked due to access forbidden (403)" ja sitten
VALIDATE FIX. Google hakee osoitteet uudelleen ja poistaa ne raportista, kun ohjaus on havaittu (yleensä 1-4 viikkoa).

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

## 1.11.2026 ilta 2: tummat värit pois, isänpäivän lahjakortti, Google Shopping valmiiksi, mainoskulut mittariin

### Tumma painatus tummalla pohjalla pois (kauppa, kassa, Merchant-syöte, Printify)

- Kaikki 573 myynnissä olevaa tuotetta tarkistettiin automaattisesti (scripts/tummat-varit.mjs): Printifyn painokuva
  (etupuolen painoalue kyseisellä varianttiryhmällä) verrataan värin hex-arvoon. Painatus on näkymätön, kun pohja on
  tumma (luminanssi alle 0,2), WCAG-kontrasti on alle 3:1 ja värietäisyys ΔE alle 40 (eri sävy, kuten punainen sydän
  harmaalla, erottuu). Väri poistetaan, jos Printifyn tekstikerroksen väri on näkymätön tai vähintään 50 % kuvasta ei
  erotu (valokuvissa ja monivärisissä kuvituksissa 90 %, koska tumma tausta sulautuu paitaan, mutta kuva erottuu).
- Sääntö tarkistettiin silmämääräisesti mockup-koosteilla ennen poistoa. Pelkkä pikselikontrasti olisi poistanut
  väärin esim. Tonnin seteli punaisella ja Maailman paras äiti tummansinisellä (kuviolla on oma tausta), ja pelkkä
  reunamittaus mustan Älä kosketa sähkömiestä (tumma ääriviiva keltaisen tekstin ympärillä).
- **Poistettu 231 väriä 231 tuotteesta** (249 varianttia). Jokaiselle tuotteelle jää muita värejä.
- Kauppa: api/_lib/tummat-varit.js poistaa värin valmisteleRivi-vaiheessa kokonaan (värilista, variant_map, mockupit,
  oletusväri, materiaaliteksti), joten se katoaa tuotesivulta, kassasta ja Merchant-syötteestä. Tarkistettu
  tuotannossa: 0 tuotetta tummansinisellä, syötteessä 0 poistettujen varianttien kuvaa, 571 itemiä.
- Printify: 228 tuotteessa variantit pois käytöstä (is_enabled false, hinnat ja painoalueet ennallaan; tuotteita ei
  poistettu). 3 tuotetta Printify ei salli muokata ("Product is disabled for editing", 8252): maailman-mestarit-2026-
  t-paita, maailman-mestarit-2026-huppari, saatanan-tunarit-t-paita. Niistä väri on poissa kaupasta ja kassasta, joten
  sitä ei voi tilata.
- Uusi ajo säilyttää aiemmat poistot (julkaisun jälkeen /api/products ei enää näytä poistettuja värejä).

Poistetut (slug ja väri):

- **Meleerattu tummansininen** (228): 100-akaalaista-verta-hauska-t-paita, 100-espoolaista-verta-hauska-t-paita, 100-forssalaista-verta-hauska-t-paita, 100-hameenlinnalaista-verta-hauska-t-paita, 100-harjavaltalaista-verta-hauska-t-paita, 100-heinolalaista-verta-hauska-t-paita, 100-helsinkilaista-verta-hauska-t-paita, 100-hyvinkaalaista-verta-hauska-t-paita, 100-iisalmelaista-verta-hauska-t-paita, 100-imatralaista-verta-hauska-t-paita, 100-jarvenpaalaista-verta-hauska-t-paita, 100-joensuulaista-verta-hauska-t-paita, 100-jyvaskylalaista-verta-hauska-t-paita, 100-kaarinalaista-verta-hauska-t-paita, 100-kajaanilaista-verta-hauska-t-paita, 100-kangasalalaista-verta-hauska-t-paita, 100-kemilaista-verta-hauska-t-paita, 100-keravaista-verta-hauska-t-paita, 100-kokkolalaista-verta-hauska-t-paita, 100-kotkalaista-verta-hauska-t-paita, 100-kouvolalaista-verta-hauska-t-paita, 100-kuopiolaista-verta-hauska-t-paita, 100-lahtelaista-verta-hauska-t-paita, 100-lappeenrantalaista-verta-hauska-t-paita, 100-lempaalalaista-verta-hauska-t-paita, 100-lieksalaista-verta-hauska-t-paita, 100-lohjalaista-verta-hauska-t-paita, 100-mikkelilaista-verta-hauska-t-paita, 100-naantalilaista-verta-hauska-t-paita, 100-nokialaista-verta-hauska-t-paita, 100-nummelalaista-verta-hauska-t-paita, 100-orimattilalaista-verta-hauska-t-paita, 100-oululaista-verta-hauska-t-paita, 100-pirkkalalaista-verta-hauska-t-paita, 100-porilaista-verta-hauska-t-paita, 100-porvoolaista-verta-hauska-t-paita, 100-raisiolaista-verta-hauska-t-paita, 100-raumalaista-verta-hauska-t-paita, 100-riihimakelaista-verta-hauska-t-paita, 100-rovaniemelaista-verta-hauska-t-paita, 100-salolaista-verta-hauska-t-paita, 100-savonlinnalaista-verta-hauska-t-paita, 100-seinajokelaista-verta-hauska-t-paita, 100-tamperelaista-verta-hauska-t-paita, 100-torniolaista-verta-hauska-t-paita, 100-turkulaista-verta-hauska-t-paita, 100-vaasalaista-verta-hauska-t-paita, 100-valkeakoskelaista-verta-hauska-t-paita, 100-vantaalaista-verta-hauska-t-paita, 100-varkaalaista-verta-hauska-t-paita, 100-ylojarvelaista-verta-hauska-t-paita, 30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-t-paita, 30-nuori-villi-ja-jo-vasynyt-t-paita, 30v-paranen-ian-myota-kuin-viini-t-paita, 30v-selka-alkaa-jo-rusahdella-t-paita, 40-ja-fabulous-t-paita, 40-vuotta-henkisesti-18-t-paita, 40-vuotta-toita-nyt-ikuinen-viikonloppu-t-paita, 40v-ei-keski-ika-klassikko-t-paita, 40v-ei-vanha-vintage-t-paita, 40v-henkisesti-18-tyylilla-40-t-paita, 40v-kunnossa-niinku-20v-t-paita, 50-ja-hopeanhohtoinen-vain-hiukset-t-paita, 50-ja-paras-vasta-tulossa-t-paita, 50-vuotta-nuori-t-paita, 50v-puoli-vuosisataa-ei-naarmuakaan-t-paita, 60-vuotta-nuori-ja-nokkela-t-paita, 60-vuotta-nuori-t-paita, 60v-kokenut-ei-vanha-t-paita, 60v-mutta-fyysinen-kunto-kuin-20v-t-paita, 60v-mutta-sydan-kuin-20v-t-paita, 60v-takuu-mennyt-toimii-silti-t-paita, akaa-parempi-kuin-helsinki-hauska-t-paita-akaalaiselle, elakelainen-aamuheratys-vapaaehtoinen-t-paita, elakkeella-kiireinen-tekemaan-ei-mitaan-t-paita, espoo-parempi-kuin-helsinki-hauska-t-paita-espoolaiselle, forssa-parempi-kuin-helsinki-hauska-t-paita-forssalaiselle, hameenlinna-parempi-kuin-helsinki-hauska-t-paita-hameenlinnalaiselle, harjavalta-parempi-kuin-helsinki-hauska-t-paita-harjavaltalaiselle, heinola-parempi-kuin-helsinki-hauska-t-paita-heinolalaiselle, helsinki-parempi-kuin-kaikki-muut-itse-sanoo-hauska-t-paita-helsinkilaiselle, hyvinkaa-parempi-kuin-helsinki-hauska-t-paita-hyvinkaalaiselle, iisalmi-parempi-kuin-helsinki-hauska-t-paita-iisalmelaiselle, imatra-parempi-kuin-helsinki-hauska-t-paita-imatralaiselle, jarvenpaa-parempi-kuin-helsinki-hauska-t-paita-jarvenpaalaiselle, joensuu-parempi-kuin-helsinki-hauska-t-paita-joensuulaiselle, jyvaskyla-parempi-kuin-helsinki-hauska-t-paita-jyvaskylalaiselle, kaarina-parempi-kuin-helsinki-hauska-t-paita-kaarinalaiselle, kajaani-parempi-kuin-helsinki-hauska-t-paita-kajaanilaiselle, kangasala-parempi-kuin-helsinki-hauska-t-paita-kangasalalaiselle, kemi-parempi-kuin-helsinki-hauska-t-paita-kemilaiselle, kerava-parempi-kuin-helsinki-hauska-t-paita-keravaiselle, kokkola-parempi-kuin-helsinki-hauska-t-paita-kokkolalaiselle, kotka-parempi-kuin-helsinki-hauska-t-paita-kotkalaiselle, kouvola-parempi-kuin-helsinki-hauska-t-paita-kouvolalaiselle, kuopio-parempi-kuin-helsinki-hauska-t-paita-kuopiolaiselle, lahti-parempi-kuin-helsinki-hauska-t-paita-lahtelaiselle, lappeenranta-parempi-kuin-helsinki-hauska-t-paita-lappeenrantalaiselle, lempaala-parempi-kuin-helsinki-hauska-t-paita-lempaalalaiselle, lieksa-parempi-kuin-helsinki-hauska-t-paita-lieksalaiselle, lohja-parempi-kuin-helsinki-hauska-t-paita-lohjalaiselle, made-in-akaa-hauska-t-paita, made-in-espoo-hauska-t-paita, made-in-forssa-hauska-t-paita, made-in-hameenlinna-hauska-t-paita, made-in-harjavalta-hauska-t-paita, made-in-heinola-hauska-t-paita, made-in-helsinki-hauska-t-paita, made-in-hyvinkaa-hauska-t-paita, made-in-iisalmi-hauska-t-paita, made-in-imatra-hauska-t-paita, made-in-jarvenpaa-hauska-t-paita, made-in-joensuu-hauska-t-paita, made-in-jyvaskyla-hauska-t-paita, made-in-kaarina-hauska-t-paita, made-in-kajaani-hauska-t-paita, made-in-kangasala-hauska-t-paita, made-in-kemi-hauska-t-paita, made-in-kerava-hauska-t-paita, made-in-kokkola-hauska-t-paita, made-in-kotka-hauska-t-paita, made-in-kouvola-hauska-t-paita, made-in-kuopio-hauska-t-paita, made-in-lahti-hauska-t-paita, made-in-lappeenranta-hauska-t-paita, made-in-lempaala-hauska-t-paita, made-in-lieksa-hauska-t-paita, made-in-lohja-hauska-t-paita, made-in-mikkeli-hauska-t-paita, made-in-naantali-hauska-t-paita, made-in-nokia-hauska-t-paita, made-in-nummela-hauska-t-paita, made-in-orimattila-hauska-t-paita, made-in-oulu-hauska-t-paita, made-in-pirkkala-hauska-t-paita, made-in-pori-hauska-t-paita, made-in-porvoo-hauska-t-paita, made-in-raisio-hauska-t-paita, made-in-rauma-hauska-t-paita, made-in-riihimaki-hauska-t-paita, made-in-rovaniemi-hauska-t-paita, made-in-salo-hauska-t-paita, made-in-savonlinna-hauska-t-paita, made-in-seinajoki-hauska-t-paita, made-in-tampere-hauska-t-paita, made-in-tornio-hauska-t-paita, made-in-turku-hauska-t-paita, made-in-vaasa-hauska-t-paita, made-in-valkeakoski-hauska-t-paita, made-in-vantaa-hauska-t-paita, made-in-varkaus-hauska-t-paita, made-in-ylojarvi-hauska-t-paita, mikkeli-parempi-kuin-helsinki-hauska-t-paita-mikkelilaiselle, naantali-parempi-kuin-helsinki-hauska-t-paita-naantalilaiselle, nokia-parempi-kuin-helsinki-hauska-t-paita-nokialaiselle, nummela-parempi-kuin-helsinki-hauska-t-paita-nummelalaiselle, orimattila-parempi-kuin-helsinki-hauska-t-paita-orimattilalaiselle, oulu-parempi-kuin-helsinki-hauska-t-paita-oululaiselle, pirkkala-parempi-kuin-helsinki-hauska-t-paita-pirkkalalaiselle, pori-parempi-kuin-helsinki-hauska-t-paita-porilaiselle, porvoo-parempi-kuin-helsinki-hauska-t-paita-porvoolaiselle, raisio-parempi-kuin-helsinki-hauska-t-paita-raisiolaiselle, rauma-parempi-kuin-helsinki-hauska-t-paita-raumalaiselle, riihimaki-parempi-kuin-helsinki-hauska-t-paita-riihimakelaiselle, rovaniemi-parempi-kuin-helsinki-hauska-t-paita-rovaniemelaiselle, salo-parempi-kuin-helsinki-hauska-t-paita-salolaiselle, savonlinna-parempi-kuin-helsinki-hauska-t-paita-savonlinnalaiselle, seinajoki-parempi-kuin-helsinki-hauska-t-paita-seinajokelaiselle, syntymakaupunki-akaa-hauska-t-paita, syntymakaupunki-espoo-hauska-t-paita, syntymakaupunki-forssa-hauska-t-paita, syntymakaupunki-hameenlinna-hauska-t-paita, syntymakaupunki-harjavalta-hauska-t-paita, syntymakaupunki-heinola-hauska-t-paita, syntymakaupunki-helsinki-hauska-t-paita, syntymakaupunki-hyvinkaa-hauska-t-paita, syntymakaupunki-iisalmi-hauska-t-paita, syntymakaupunki-imatra-hauska-t-paita, syntymakaupunki-jarvenpaa-hauska-t-paita, syntymakaupunki-joensuu-hauska-t-paita, syntymakaupunki-jyvaskyla-hauska-t-paita, syntymakaupunki-kaarina-hauska-t-paita, syntymakaupunki-kajaani-hauska-t-paita, syntymakaupunki-kangasala-hauska-t-paita, syntymakaupunki-kemi-hauska-t-paita, syntymakaupunki-kerava-hauska-t-paita, syntymakaupunki-kokkola-hauska-t-paita, syntymakaupunki-kotka-hauska-t-paita, syntymakaupunki-kouvola-hauska-t-paita, syntymakaupunki-kuopio-hauska-t-paita, syntymakaupunki-lahti-hauska-t-paita, syntymakaupunki-lappeenranta-hauska-t-paita, syntymakaupunki-lempaala-hauska-t-paita, syntymakaupunki-lieksa-hauska-t-paita, syntymakaupunki-lohja-hauska-t-paita, syntymakaupunki-mikkeli-hauska-t-paita, syntymakaupunki-naantali-hauska-t-paita, syntymakaupunki-nokia-hauska-t-paita, syntymakaupunki-nummela-hauska-t-paita, syntymakaupunki-orimattila-hauska-t-paita, syntymakaupunki-oulu-hauska-t-paita, syntymakaupunki-pirkkala-hauska-t-paita, syntymakaupunki-pori-hauska-t-paita, syntymakaupunki-porvoo-hauska-t-paita, syntymakaupunki-raisio-hauska-t-paita, syntymakaupunki-rauma-hauska-t-paita, syntymakaupunki-riihimaki-hauska-t-paita, syntymakaupunki-rovaniemi-hauska-t-paita, syntymakaupunki-salo-hauska-t-paita, syntymakaupunki-savonlinna-hauska-t-paita, syntymakaupunki-seinajoki-hauska-t-paita, syntymakaupunki-tampere-hauska-t-paita, syntymakaupunki-tornio-hauska-t-paita, syntymakaupunki-turku-hauska-t-paita, syntymakaupunki-vaasa-hauska-t-paita, syntymakaupunki-valkeakoski-hauska-t-paita, syntymakaupunki-vantaa-hauska-t-paita, syntymakaupunki-varkaus-hauska-t-paita, syntymakaupunki-ylojarvi-hauska-t-paita, tampere-parempi-kuin-helsinki-hauska-t-paita-tamperelaiselle, tornio-parempi-kuin-helsinki-hauska-t-paita-torniolaiselle, turku-parempi-kuin-helsinki-hauska-t-paita-turkulaiselle, vaasa-parempi-kuin-helsinki-hauska-t-paita-vaasalaiselle, valkeakoski-parempi-kuin-helsinki-hauska-t-paita-valkeakoskelaiselle, vantaa-parempi-kuin-helsinki-hauska-t-paita-vantaalaiselle, varkaus-parempi-kuin-helsinki-hauska-t-paita-varkaalaiselle, virallisesti-tyoton-epavirallisesti-vapaa-t-paita, ylojarvi-parempi-kuin-helsinki-hauska-t-paita-ylojarvelaiselle
- **Tummansininen** (2): maailman-mestarit-2026-huppari, maailman-mestarit-2026-t-paita
- **Tummanharmaa** (1): saatanan-tunarit-t-paita

### Isänpäivän lahjakortti 25, 35 ja 50 €

- Arvot 25/35/50 € (ennen 25/50/75). Myynti on auki, kun tietokanta ja Stripe ovat käytössä; aiemmin se odotti oman
  sähköpostidomainin vahvistusta (SAHKOPOSTI_VAHVISTETTU, ei vielä asetettu).
- Toimitus heti: kiitossivu näyttää maksun jälkeen koodin, arvon, voimassaolon ja **Lataa tulostettava PDF** -painikkeen
  (api/order.js ?lahjakortti=, vain saman tilauksen kortti). Koodi tallentuu tauluun gift_cards ja toimii kassalla
  kentässä "Lahjakortin koodi". PDF (api/_lib/lahjakortti-pdf.js, A4, ilman riippuvuuksia) lähtee myös sähköpostin
  liitteenä, kun Resend toimii; siihen asti saajan sähköpostikenttä on piilossa ja sivu ohjaa tulostamaan PDF:n.
- Banneri "Isänpäivä su 8.11: lahjakortti perille heti" etusivulla ja isä-sivuilla (/isanpaivalahja,
  /hauska-isanpaivalahja, /joululahja-isalle, /lahjat/isoisalle) su 8.11. klo 23.59 asti.
- Testi tuotannossa (scripts/lahjakorttitesti.mjs + cron ?tehtava=lahjakorttitesti): testitilaus TESTI, koodi
  kiitossivulla, PDF 200 application/pdf ja koodi PDF:ssä, väärä koodi 404, koodin tarkistus saldo 35 €, kassa koodilla
  Stripeen loppusummalla 19,22 € (lahjakortti vähennetty), lahjakortin osto 25 € Stripeen. Siivous samassa ajossa:
  testikoodit nollattu, tilaukset peruttu, Stripe-istunnot vanhennettu (maksamatta), Printifyyn ei jäänyt mitään.
  Stripen testiavainta ei ole (vain live-avain), joten maksuja ei tehty; maksun jälkeinen polku testattiin
  testitilauksella.
- Poikkeama ensimmäisessä testiajossa: kassa koodilla korilla, jonka lahjakortti kattoi kokonaan, merkitsi tilauksen
  maksetuksi ja lähetti sen Printifyyn (26630629.40, "TESTI Lahjakortti (perutaan)", on-hold). **Peruttu Printifyssä
  noin minuutissa, tila canceled.** Omistajalle on voinut lähteä ilmoitus tästä testitilauksesta. Korjattu: testi käyttää
  koria, jonka arvo ylittää lahjakortin, ja siivous perii Printifyn testitilaukset samassa ajossa.

### Google Shopping -kampanja valmiiksi (ei käynnistetty)

- KAYTTOONOTTO.md kohta 14: Standard Shopping (ei PMax ennen 30 konversiota/30 pv), 10 €/pv, Suomi, suomi,
  konversio GA4:n purchase-tapahtumasta, tuoteryhmät syötteen tunnisteista (top50, kateluokat), poissulkevat sanat,
  Coworkin vaiheet Chromessa, kampanja jää Keskeytetty-tilaan. Maksutiedot ja käynnistys: Aarni.
- Kannattavuusraja: kate per tilaus 9,51 € × konversio 0,58 % = 0,06 € per klikki. Enimmäis-CPC 0,07-0,12 €, ja
  kampanja keskeytetään, jos kustannus per tilaus ylittää katteen per tilaus.

### Mittari: mainoskulut ja kustannus per tilaus

- /hallinta/mittarit: Mainonta-osio (mainoskulut, kustannus per tilaus, kate mainoskulujen jälkeen, mainoskonversiot)
  ja kirjauslomake; sama rivi päivän yhteenvetoviestissä. Cowork kirjaa päivän kulut lomakkeella tai
  `POST /api/sahkoposti { action: "mainoskulut", avain, paiva, kanava, kulut, klikit, konversiot }`.
- Luvut nyt: mainoskulut 0,00 €, kustannus per tilaus 0,00 €, kate mainoskulujen jälkeen 0,00 €.

### Tavoitemittari 1.11. ilta

Kate 0,00 € (matka 3000 €), ennuste 5,77 €; tilaukset marraskuu 0, 30 pv 1; käynnit marraskuu 70 (suora 54, google 15,
chatgpt 1); konversio laskelmassa 0,58 %; tarve 10,5 tilausta ja 1 813 käyntiä päivässä (loppukuu 10,7 ja 1 852).

Testit 1546 läpi. Kolmen User-Agentin tarkistus (Chrome, iPhone Safari, Googlebot): /, /lahjakortti, /isanpaivalahja,
/tuote/50-vuotta-nuori-t-paita, /tilaus-vahvistettu, /hallinta/mittarit, /api/product-feed kaikki 200.

## 2.11.2026: hallintalinkit Coworkille ja pysyvä kirjautuminen (eväste 90 pv)

- Cowork näki "Ei pääsyä", koska sivut vaativat avaimen osoitteessa joka kerta. Nyt ensimmäinen avaus avaimellisella
  linkillä tallentaa avaimen evästeeseen `hk_hallinta_<sivu>` (HttpOnly, Secure, SameSite=Lax, 90 päivää), ja avain
  poistuu osoiteriviltä. Sivut /hallinta/mittarit, /hallinta/some ja /hallinta/tarjoukset sekä lomakkeet ja
  kirjausrajapinta (yritysluvut, mainoskulut, tarjoustila) hyväksyvät evästeen. Vastaukset `Cache-Control: private, no-store`.
- Tarkistettu tuotannossa (huumorikauppa.fi, välityksen läpi): avaimella 200 ja eväste, evästeellä 200, ilman avainta
  ja väärällä evästeellä 404; lomake evästeellä pääsee tarkistukseen, ilman 404. Headless Chrome tyhjällä profiililla:
  mittarit ja some aukeavat avaimellisella linkillä, sama profiili ilman avainta aukeaa, toinen profiili ilman avainta
  näyttää "Ei pääsyä".
- Viesti "Hallintalinkit Coworkille" (cron `?tehtava=hallintalinkit-viesti`, api/_lib/hallinta.js): avaimelliset
  linkit kolmelle sivulle ja ohje mittarilomakkeisiin ja kirjausrajapintaan. Lähetetty 2.11. heti. Suora lähetys
  huumorikauppa@gmail.comiin ja yhteenvedon reitti (OMISTAJA_EMAIL) kaatuivat: huumorikauppa.fi-domainia ei ole
  vahvistettu Resendissä. Resendin testilähettäjä hyväksyi viestin Resend-tilin omaan osoitteeseen flyapeg@gmail.com
  (otsikkoon lisätään "(huumorikauppa@gmail.com, kunnes domain vahvistetaan)"). Avaimia ei tallennettu repoon,
  Driveen eikä keskusteluun.
- **Korjattu samalla:** päivän yhteenveto käytti suoraa lähetystä ilman varareittiä, joten se kaatui samaan
  domainivirheeseen. Nyt se käyttää samaa varareittiä kuin hälytykset (lahetaVarareitilla).
- Päivän yhteenvedossa jatkossa linkit mittariin, someen ja tarjouspyyntöihin sekä muistutus evästeestä.
- Huumorikauppa@gmail.com saa viestit suoraan vasta, kun domain on vahvistettu Resendissä (DNS, KAYTTOONOTTO.md kohta 5).

## 2.11.2026 (kiireellinen): hallintapääsy Coworkille kertakäyttöisellä aktivointikoodilla

- **Miksi viesti ei tullut:** Resendin loki: "Hallintalinkit Coworkille" lähti 1.11. klo 15.35 ja meni perille, mutta
  vain osoitteeseen flyapeg@gmail.com. huumorikauppa.fi-domainia ei ole vahvistettu Resendissä, ja silloin Resendin
  testilähettäjä toimittaa vain Resend-tilin omaan osoitteeseen. Mikään Resend-reitti ei tavoita huumorikauppa@gmail.comia
  ennen vahvistusta (sama koskee päivän yhteenvetoa ja hälytyksiä, jotka menevät flyapeg@gmail.comiin).
- **Uusi reitti:** kertakäyttöinen aktivointikoodi. Sivu /hallinta/aktivoi; koodi (XXXX-XXXX) toimii kerran ja vanhenee
  24 tunnissa (api/_lib/aktivointi.js, kannassa vain SHA-256-tiiviste, yli 20 väärää yritystä tunnissa lukitsee
  tunniksi). Onnistunut koodi antaa selaimelle 90 päivän evästeet sivuille /hallinta/mittarit, /hallinta/some ja
  /hallinta/tarjoukset. Koodin luo cron `?tehtava=aktivointikoodi`; koodia ei tallenneta repoon.
- **Lähetys:** viesti "Hallintalinkit Coworkille" lähetettiin Gmailista (flyapeg@gmail.com) osoitteeseen
  huumorikauppa@gmail.com: aktivointisivu, koodi ja ohje mittarilomakkeisiin ja kirjausrajapintaan. Pitkäikäisiä
  avaimia viestissä ei ole.
- **Tarkistettu tuotannossa:** väärä koodi 400, oikea koodi 200 ja kolme evästettä (HttpOnly, Secure, 90 pv), toinen
  käyttö 400; evästeillä mittarit, some ja tarjoukset 200, ilman 404. Chromessa erillinen testikoodi: "Aktivoitu",
  mittari ("matka tavoitteeseen") ja some (Pinterest-kuvat) aukeavat ilman avainta. Headless Chrome tyhjällä
  profiililla: molemmat sivut näyttävät "Ei pääsyä. Avaa koko hallintalinkki."

## 2.11.2026: konversioajo (suppilo, mobiilinopeus, tuotesivu, kassa, luottamus, etusivu, A/B, mittari)

### Missä ostajat putoavat
- **GA4-suppiloa ei saatu:** Huumorikaupan GA4-property (G-8FJ58JNKGK) ei näy tällä Google-tilillä, GA4 Data API
  -avaimia (GA4_PROPERTY_ID, GA4_PALVELUTILI) ei ole Vercelissä, eikä Supermetricsin GA4-yhteys näe propertya.
  Suppilo täyttyy automaattisesti, kun avaimet asetetaan (KAYTTOONOTTO.md "GA4 Data API").
- **Oma data (tietokanta, cron `?tehtava=suppilo`):** uudella kassalla 27.10. alkaen 2 kassalta Stripeen siirtynyttä
  tilausta, joista 1 maksettu (maksu-vaihe 50 %). Käyntilaskurin 74 käynnistä 1.11. alkaen 0 eteni kassalle; 1
  tallennettu kori. Pahin mitattu kohta on ennen koria (käynti -> kori/kassa: pudotus 100 % 74 käynnillä); data on
  vielä liian ohutta vaiheittaisiin prosentteihin.
- **Uusi oma suppilolaskuri** (api/_lib/suppilo.js, src/lib/suppilo.ts): etusivu, tuotesivu, kori, kassa, maksu
  (siirto Stripeen) ja ostot maksetuista tilauksista; koostemäärä päivä x vaihe x A/B-versio, ei evästeitä eikä
  tunnisteita. Mittari näyttää 14 päivän taulukon, päivittäisen konversion ja pudotusprosentit vaiheittain.

### Mobiilinopeus (Lighthouse 12.6.1 mobiili; PageSpeed Insightsin päiväkiintiö oli täynnä)
| Sivu | Ennen | Jälkeen |
|---|---|---|
| Kategoria /kategoria/t-paidat | 72, LCP 4,6 s, CLS 0,162 | 97, LCP 1,3 s, CLS 0,001 |
| Tuote /tuote/tonnin-seteli-t-paita | 99, LCP 1,3 s, CLS 0 | 98, LCP 1,4 s, CLS 0 |
| Etusivu | 99, LCP 1,5 s, CLS 0,001 | 6 ajoa: 3 x 99-100 (LCP 1,3-1,5 s), 3 x 62 (LCP 6,8-7,1 s); CLS 0-0,001 |

- Kategoriasivu: React korvasi tyylittömän SEO-rungon vasta laiskan sivukomponentin latauduttua (LCP:n
  renderöintiviive 3,5 s) ja alatunniste siirtyi tuotteiden latautuessa. Nyt kategoriasivut esirenderöidään
  hydratoitavana sovelluksena kuten blogiartikkelit (renderAppHydrated, preloadRoute), ja tuoteruudukon paikka
  varataan latausnäkymällä.
- Etusivun vaihtelu ei johdu tämän ajon muutoksista: edellinen julkaisu käyttäytyy suoraan Vercel-osoitteella
  samoin. Huonoissa ajoissa esikatselua ei piirretä ennen sovelluksen vaihtoa (havaittu FCP noin 2 s =
  PREVIEW_TIMEOUT_MS). Jatkoselvitys: CrUX-kenttädata Search Consolesta ennen muutoksia.

### Tuotesivu
- Jo ennestään taitteen yläpuolella: hinta, toimitusarvio, "Painetaan tilauksesta EU:ssa", 14 päivän
  palautusoikeus, maksutapakuvakkeet ja kokotaulukko. "Perillä 5-8 arkipäivässä" ei vastaa EU-painotalojen aikoja
  (tuotanto 2-5 + kuljetus 4-8 arkipäivää, Printifyn toteutunut P90 pidempi), joten nykyinen laskettu arvio jäi.
- Uusi rivi "Turvallinen maksu Stripellä: Visa, Mastercard, MobilePay ja Klarna" (MobilePay ja Klarna ovat
  Stripen oletusmäärityksessä, src/config/maksutavat.ts).
- "Sopii yhteen" -nosto on nyt "Yhdessä edullisemmin" ja kertoo kahden tuotteen -5 %:n korialennuksen. Otsikko ei
  väitä tuotteita yhdessä ostetuiksi, koska tilausdataa on liian vähän.

### Ostoskori ja kassa
- Korissa oli jo toimituskulu ja "X € ilmaiseen toimitukseen" (raja 79 €).
- Kassa: kumppani-, alennus- ja lahjakorttikoodin kentät avattavien "Onko sinulla kumppanikoodi?" ja "Alennus- tai
  lahjakorttikoodi" -kohtien taakse (auki, jos koodi on jo annettu). Korimuistutuksen suostumusteksti korjattu
  vastaamaan toimintaa (yksi viesti vuorokauden kuluttua, ennen "kaksi viestiä").
- Hylätyn ostoskorin muistutus oli jo valmis (suostumus kassalla, yksi viesti 24 h, lopetus maksun jälkeen).
  Muistutukset ja arviopyynnöt kytkeytyvät nyt päälle vasta, kun SAHKOPOSTI_VAHVISTETTU=1 (domain vahvistettu
  Resendissä); ennen tätä ajo yritti lähettää joka tunti turhaan.

### Luottamus
- Arvostelut: tuotesivu näyttää vain aidot arviot (nyt 0). Arviopyyntö lähtee vain, kun Printify näyttää paketin
  toimitetuksi (+7 pv). Uutta: ei koskaan kahdesti samalle asiakkaalle (aiemmin kerran tilausta kohden).
- Tietoa meistä: Uusiku Oy ja Y-tunnus 3653666-7 olivat jo sivulla; teksti "ulkomailla" vaihdettu muotoon
  "Painetaan tilauksesta EU:ssa" (572/573 myytävää tuotetta EU-painotalossa: OPT CZ, Textildruck DE, Atelier FR).

### Etusivu ja A/B-testi
- Heti heron alla 8 suosituinta (TOP50-järjestys, myydyimmät ensin, t-paidat ja hupparit, yksi per malli); paikka
  varattu ennen latausta. Isänpäivän lahjakorttinosto pysyy yläosassa 8.11. asti.
- A/B-testi yläpalkin otsikolla: A "Löydä hauska lahja meiltä. Tilaa nyt.", B "Hauskat paidat suomalaisella
  huumorilla." Versio arvotaan sivulatauksessa ja pidetään vain muistissa; se kulkee suppilon kirjauksiin ja
  tilaukseen (orders.ab_versio). Tulos mittarissa (näytöt, tuotesivu, kori, kassa, ostot versioittain).

Testit 1551 läpi. Kolmen User-Agentin tarkistus: /, /kategoria/t-paidat, /tuote/tonnin-seteli-t-paita, /ostoskori,
/kassa, /tietoa-meista, /hallinta/mittarit, /hallinta/aktivoi kaikki 200.

## 2.11.2026: joulu ilman mainoksia (takarajat, joulumallisto, 15 lahjahakusivua, lahjaopas medialle, kumppanisivut, uudelleenostot)

### Joulun viimeinen tilauspäivä
- Printifyn toteutuneet tilaukset (scripts/joulu-aikataulu.mjs 2.11.): **OPT OnDemand (CZ)** käsittely 1 + tuotanto 1 +
  kuljetus Suomeen 8 arkipäivää (4 toimitusta) = 10; **Textildruck Europa (DE)** 1 + 2 + 11 (3 toimitusta) = 14.
  Varmuudeksi +2 arkipäivää, perillä 23.12. (ennen aattoa).
- T-paidat (OPT): data antaisi ma 7.12., mutta Printifyn oma Europe-takaraja OPT:lle oli 5.12.2025, joten lupaus on
  **pe 4.12.** Hupparit ja muut (Textildruck-taso): **ti 1.12.**
- **Sivuston yhteinen päivä ti 1.12.**: yläpalkki "Tilaa viimeistään ti 1.12., niin ehtii jouluksi", tuotesivu
  (tuotetyypin päivä), ostoskori ja nyt myös kassa (korin tuotteiden varhaisin päivä). Kun päivä on mennyt, palkki
  vaihtuu heti lahjakorttiin ("koodi ja tulostettava PDF maksun jälkeen"); aiemmin vasta viimeisimmän tyyppikohtaisen
  päivän jälkeen. "Ehtii jouluksi" -merkin EU-katto 27.11. -> 1.12. (samassa linjassa).

### Joulumallisto 2026 (/joulu)
- 40 uutta mallia (joulu, pikkujoulut, tonttu, joulusiivous, anoppi jouluna, joulukinkku, glögi, lahjapaniikki,
  marraskuun pimeys, kaamos) bestsellerien tyyliin: t-paidat OPT OnDemand (CZ) 27,90 € ja hupparit Atelier Katanga
  (FR) 52,90 € (3XL 59,90 €). 80 tuotetta Printifyyn ja kauppaan aktiivisina (data/uudet-tuotteet-2026-11-02.json).
- Kontrasti heti luonnissa: tummilla väreillä valkoinen, vaaleilla (Sport Grey) musta teksti; tummat-varit-tarkistus
  ajettu luonnin jälkeen: 0 uutta poistoa.
- Kate: kaikki 1 520 varianttia, pienin nettokate 9,57 € tilaukselta kaikkien kulujen jälkeen (vaatimus 7 €).
- Mukit ovat piilotettu kategoria (ei myydä) eikä putkessa ole collegepaitaa, joten pukeroita ja mukeja ei tehty.
- /joulu-sivu (85 tuotetta, uudet ensin), joulun valikossa "Joulumallisto 2026", sivukartassa.
- Merchant-syöte: jokaiselle 80 tuotteelle pystykuva 1000 x 1500 ensimmäiseksi lisäkuvaksi (yhteensä 132 tuotteella)
  ja Pinterest-kuvat /hallinta/some-sivulle. Samalla korjattu: 12 suosituimman kuvaa näytti poistettua väriä
  (kuvavälimuistin avain oli kuvan järjestysnumero); kuvat tehty uudelleen, ja tuotteen kuvista poistuvat nyt myös
  poistetun värin variant_images-kuvat.

### 15 lahjahakusivua
- Uudet: /joululahja-anopille, /hauska-joululahja, /pikkujoululahja-alle-30-euroa, /40-vuotislahja, /50-vuotislahja,
  /60-vuotislahja. Laajennetut (sama hakuaihe jo olemassa): /lahjat/joululahjaksi-miehelle, /joululahja-isalle,
  /lahjat/joululahjaksi-naiselle, /joululahja-elakelaiselle (lahja eläkeläiselle), /lahjat/kalastajalle,
  /lahjat/mokkeilijalle (lahja saunojalle), /lahjat/metsastajalle, /lahjat/tyokaverille, /lahja-kaverille (ystävälle).
- Jokaisella yksilöllinen teksti (intro + opas 325-354 sanaa), 4-6 UKK:ta FAQPage-schemalla, title ja meta
  description, sisäiset linkit kategorioihin ja muihin lahjasivuihin, enintään 20 tuotetta. Tekstit tarkistettu:
  ei ajatusviivoja, ei superlatiiveja ("paras" pois kuvauksista), ei käsin kirjoitettuja joulupäiviä,
  toimitusehdot konfiguraatiosta. Uudet sivut sivukartassa.
- Tuotemäärät: 13-20 kaikilla paitsi /lahjat/kalastajalle 11 (kaikki kaupan kalastustuotteet).

### Lahjaopas medialle
- /lahjaopas-media: 20 lahjaideaa (10 klassikkoa, 10 joulumalliston teemaa), pysty- ja vaakakuvat ladattavina,
  hinnat, käsin kirjoitetut kuvaukset, yhteystiedot ja PDF (A4, 4,9 Mt, Vercel Blob). Tuotelinkeissä
  utm_source=media. Cowork voi lähettää linkin maanantaina (KAYTTOONOTTO.md kohta 16).

### Search Console
- Vahvistustagi on index.html:ssä. KAYTTOONOTTO.md kohta 15 ja hallintalinkkiviesti: huumorikauppa@gmail.com lisää
  ominaisuuden, vahvistaa HTML-tagilla (tai saa tilin lisättyä omistajaksi) ja lähettää sitemap.xml:n.

### Kumppanisivut /k/KOODI
- Sivu toivottaa "Tervetuloa Antsan kautta" (nimen genetiivi, suluissa oleva lempinimi ensin) ja tallentaa koodin
  evästeeseen hk_kumppani 30 päiväksi; kassa käyttää koodia ilman kirjoittamista. Kumppanilinkki raportissa ja
  kumppani-lisaa-tehtävässä on nyt muotoa huumorikauppa.fi/k/koodi (?ref= toimii edelleen). Tietosuojaseloste
  päivitetty. Tarkistettu: keisarit -> "Erämaankeisarien", antsa -> "Antsan", eväste 30 pv.

### Uudelleenostot
- Kiitossivulla ja tilausvahvistuksessa: KIITOS-koodi 10 % seuraavaan tilaukseen (60 pv, sama sähköposti, kerran) ja
  ystävälinkki huumorikauppa.fi/ystava/YSTAVA-...: ystävä saa 5 %, ja kun hänen tilauksensa on maksettu, ostaja saa
  PALKKIO-koodin 5 % (60 pv, enintään 5). Kaikki koodit vain, jos tilauksen kate jää vähintään 7 €:oon (kassan
  katevahti). Testattu tuotannossa (scripts/uusintaostotesti.mjs): koodit kiitossivulla, kiitoskoodi toimii samalla
  ja hylätään eri sähköpostilla, ystäväkoodi toimii ystävälle ja hylätään ostajalta; testikoodit mitätöity ja
  testitilaus peruttu.

### Mittari
- Uusi liikenne-erittely: hakukoneet, lahjasivut, media (utm_source=media), kumppanisivut (/k/) ja kumppanilinkit,
  myös päivän viestissä.
- Luvut 2.11.: kate 0,00 € (matka 3000 €), ennuste 5,76 €; marraskuun käynnit 85 (suora 66, google 18, chatgpt 1);
  hakukoneet 18, lahjasivut 5, media 0, kumppanisivut 0; konversio laskelmassa 0,58 %; tarve 10,5 tilausta ja 1 813
  käyntiä päivässä; mainoskulut 0,00 €.

Testit 1 578 läpi. Kolmen User-Agentin tarkistus: /, /joulu, kuusi uutta lahjasivua, /lahjat/kalastajalle,
/lahjaopas-media, /k/keisarit, /ystava/..., /kassa, uusi tuotesivu, /sitemap.xml ja /api/product-feed kaikki 200.

## 2.11.2026: kumppanilinkit /k/, palvelinrenderöinti, mobiilin Lisää koriin ja etusivun Lighthouse

### Kumppanilinkit
- /k/KOODI renderöidään nyt palvelimella (vercel.json rewrite -> api/sahkoposti.js, SPA-kuoreen otsikko, noindex,
  canonical ja tervehdys). Eväste hk_kumppani (30 pv) asetetaan samassa vastauksessa, joten tervehdys ja koodi
  toimivat myös ilman JavaScriptiä. Tarkistettu: /k/antsa "Tervetuloa Antsan kautta", /k/keisarit "Tervetuloa
  Erämaankeisarien kautta", tuntematon koodi 404 ja "Tervetuloa Huumorikauppaan".
- Syvälinkki /k/KOODI/polku (esim. /k/antsa/tuote/...) tallentaa koodin ja ohjaa sivulle. /kumppanit-sivulla ja
  kumppanien linkkilistoissa ei enää ?ref=-muotoa; raporttisivun linkki oli jo /k/. ?ref= toimii edelleen.

### Palvelinrenderöinti ja lahjaopas
- /lahjaopas-media esirenderöidään komponentista: oma otsikko, h1, kaikki 20 ideaa ja canonical HTML:ssä.
- Lause "Kuvia saa käyttää vapaasti juttuihin ja lahjaoppaisiin, kunhan lähteenä mainitaan Huumorikauppa.fi."
  sivulla ja PDF:ssä (PDF tehty uudelleen, uusi Blob-osoite).
- Lahjasivut ja /joulu olivat jo palvelimella (h1, opas, UKK-schema, tuotteet). Nyt ne ja /lahjaopas-media
  hydratoidaan samasta merkinnästä kuin kategoriasivut, joten näkyvä sisältö on HTML:ssä heti.

### Ennen koria
- Lisää koriin toimi kolmella mobiili-UA:lla (iPhone Safari, Android Chrome, Samsung Internet) ja värinvaihto vaihtaa
  kuvan ja koot tummien värien poiston jälkeen. Viat ja korjaukset:
  - Painike alkoi 390 x 844 -näytöllä 844 px:n kohdalta eli taitteen alta. Toimitus- ja maksutiedot siirrettiin
    painikkeen alle: väri 583 px, koot 665 px, painike 715 px.
  - Kiinteän alapalkin kokorivi peitti värivalinnan. Palkki on nyt yksi rivi: kuva, nimi, hinta ja Lisää koriin, ja se
    näkyy koko tuotesisällön ajan.
  - Ilman kokoa painettu Lisää koriin antoi punaisen virheilmoituksen. Nyt kokovalitsin korostetaan ja vieritetään
    näkyviin, ja koon valinta lisää tuotteen koriin.
  - Hitaalla mobiiliyhteydellä sivu reagoi napautuksiin vasta 3,5 s:n kuluttua (esikatselu oli inert). Esikatselu
    ottaa nyt koon, värin ja Lisää koriin -napautuksen talteen, ja tuote lisätään, kun sovellus käynnistyy (testattu
    4G-hidastuksella).
  - Ostoskorin ikkunassa, tuotekorteissa ja suosituksissa hinnat näkyivät pisteellä (27.90 €). Nyt pilkulla.

### Etusivun Lighthouse
- Syy: fontit tulivat fonts.gstatic.comista 1,1-2,3 s:ssa, ja ensipiirto osui niiden saapumiseen. Fontit (Anton,
  Inter, Space Grotesk, latin ja latin-ext) ovat nyt omalla palvelimella (public/fonts, vuoden välimuisti).
- Mobiili ennen: 64, 99, 93, 92, 93, 70. Jälkeen kuusi ajoa: 96, 99, 100, 98, 100, 100.
- /joulu 77-87 -> 98-100, /joululahja-anopille 100, /lahjaopas-media 85 -> 92-100 (kuvat pienennettynä
  kuvaproxyn kautta), kategoriasivu 95-100, tuotesivu 99-100. CLS 0 kaikissa.

Testit 1 579 läpi. Kolmen User-Agentin tarkistus: /, /k/antsa, /k/keisarit, /kumppanit, /lahjaopas-media, /joulu,
/joululahja-anopille, /kategoria/t-paidat, tuotesivu, /fonts/inter-latin.woff2 ja /?ref=antsa kaikki 200.

## 2.11.2026 (ilta): evästepalkki, yritysten alasivut, ilmainen toimitus kahdesta tuotteesta, uutiskirje, 6 blogia, Merchant-syöte

**Evästebanneri.** Matala palkki sivun alareunassa (oli mobiilissa ylälaidassa ja peitti ostoskorin sulkemispainikkeen).
"Hyväksy" ja "Vain välttämättömät" ovat samankokoiset ja samannäköiset (175 x 36 px mobiilissa). Palkki on ostoskorin paneelin
ja dialogien alla (z 45 < 50) ja mobiilin kiinteiden ostopalkkien päällä: palkin korkeus menee muuttujaan --hk-evaste, ja
tuotesivun ja ostoskorin palkit nousevat sen yläpuolelle CSS:n translate-ominaisuudella (ei asettelumuutosta). CLS 0
mobiilissa ennen ja jälkeen palkin.

**Yritysmyynnin alakohtaiset sivut (Coworkin seurantaviesteihin):**
- https://huumorikauppa.fi/yritykset/rakennus
- https://huumorikauppa.fi/yritykset/insinoorit
- https://huumorikauppa.fi/yritykset/vpk
- https://huumorikauppa.fi/yritykset/terveys (hammas- ja eläinlääkärit)
- https://huumorikauppa.fi/yritykset/kauneus
- https://huumorikauppa.fi/yritykset/it
- https://huumorikauppa.fi/yritykset/mainos
- https://huumorikauppa.fi/yritykset/tapahtumat
- https://huumorikauppa.fi/yritykset/urheiluseurat

Jokaisella 10-11 alan paitaa, oma logo tai teksti 29,90 €/kpl vähintään 10 kpl, määräalennustaulukko, takaraja to 26.11.
(YRITYS_JOULU_TEKSTI) ja tarjouspyyntölomake, jossa ala on esitäytetty (tallentuu tarjouspyyntöön ja näkyy
/hallinta/tarjoukset-näkymässä). Palvelinrenderöinti, oma title/canonical, FAQPage, sitemap. Data src/data/yritysAlat.ts.

**Ilmainen toimitus kahdesta tuotteesta: otettu käyttöön.** Laskelma KATTEET.md "Ilmainen toimitus kahdesta tuotteesta".
Euroraja ei toimi (55 €:lla isokokoinen huppari jää alle 7 €:n katteen, 60 €:lla kaksi t-paitaa ei täyty). Kahden tuotteen
raja muuttaa vain kahden t-paidan korin katetta (19,11 € -> 13,71 €); jokainen yhden paidan tilaus, joka muuttuu kahdeksi,
tuo +4,14 €. Ei yhdisty alennuskoodiin, kumppani- ja pakettialennukseen eikä t-paitapariin. Korissa, minikorissa ja
poistumisikkunassa "Vielä 1 tuote ilmaiseen toimitukseen" (koodin kanssa "Vielä X € ilmaiseen toimitukseen"). Yläpalkki,
alatunniste, ostotiedot, toimitusehdot ja UKK päivitetty. Merchant-syötteen toimitus (6,90 €, ilmainen 79 €:sta) on edelleen
oikein yhden tuotteen ostolle.

**Uutiskirje.** Kevyt tilauslaatikko tuotesivulla (kuvauksen jälkeen, ei siirrä ostoaluetta) ja alatunnisteessa: "Liity
listalle ja saat 5 % ensimmäisestä tilauksesta". Pakollinen suostumusruutu (ei valmiiksi valittu), suostumuksen aika, teksti
ja lähde (myös polku) tauluun subscribers. Koodi TERVE-XXXXXX näytetään heti: 5 %, kerran, sama osoite, vain jos
osoitteella ei ole maksettua tilausta, ja kassa hylkää koodin, jos kate jäisi alle 7 € (yksi 24,90 €:n paita ja huppari
hylätään, 27,90 €:n paita ja kaksi paitaa käyvät). Resend-viestit valmiina (api/_lib/uutiskirje.js): tervetuloviesti ja
joulukampanja 16.-22.11. joulumallisto, 27.-29.11. Black Friday -pari, 30.11.-1.12. viimeiset tilauspäivät. Lähtevät vain,
kun Resend ilmoittaa lähetysdomainin vahvistetuksi (tai SAHKOPOSTI_VAHVISTETTU=1), vain suostumuksen antaneille ja
peruuttamattomille, kerran per viesti (loki uutiskirje_lahetykset). Tässä ajossa ei lähetetty viestejä.

**Blogi (6 artikkelia, 819-850 sanaa, Article + FAQPage, sitemapissa):** /blogi/35-hauskaa-joululahjaa-miehelle-2026,
/blogi/pikkujoululahja-alle-30-euroa-25-ideaa, /blogi/hauskat-lahjat-isalle-jolla-on-jo-kaikki,
/blogi/lahjaideat-elakelaiselle, /blogi/saunojan-lahjaopas, /blogi/mita-ostaa-tyokaverille-pikkujouluihin. Jokaisessa
tuotelinkit (16-35 ensimmäisessä kolmessa, 6-9 muissa), linkki /joulu ja lahjasivuille. Huom: pituudet ovat lähellä testin
800 sanan alarajaa, ja joulun tilauslause (jouluLause) vaihtuu takarajan jälkeen.

**Merchant-syöte.** Uusi tarkistus scripts/syote-tarkistus.mjs (kentät tuote tuotteelta, poistumiskoodi 1 puutteista).
Lähtötilanne 651 tuotetta: pakolliset kentät kunnossa (identifier_exists=no, brand, color, size, gender, age_group,
shipping, product_type, google_product_category), mutta toimitusajat erosivat sivustosta kaikissa (käsittely 2-5 / kuljetus
1-5 -> 1-4 / 2-6), size_system ja size_type puuttuivat 638 vaatteelta, kokojärjestys väärin 3 tuotteella. Korjattu: 0
puutetta. custom_label "joulu2026" 101 joulutuotteelle (kaikki 80 joulumalliston tuotetta); kaikki viisi custom_labelia olivat
käytössä, joten arvo meni teemalabeliin custom_label_3 aiemman arvon "joulu" paikalle.

**Mittari.** Uudet kortit: uutiskirjeen tilaajat (yhteensä, 7 pv, 28 pv), blogin käynnit ja yritysten alasivujen käynnit
(osio yritykset-<ala>, kk ja 30 pv).

**Julkaisu ja tarkistus 2.11.2026 (ilta).** Commit 0976dd2, julkaistu scripts/julkaise-uusi.sh:lla. Kolme User-Agentia
(Chrome, iPhone, Googlebot): etusivu, /yritykset ja 9 alasivua, 6 uutta blogia, ostoskori, toimitusehdot, tuotesivu ja
sitemap.xml 200. Mobiilissa (390 x 844) evästepalkki 734-844 px ja tuotesivun ostopalkki 660-733 px päällekkäin, CLS 0
(myös 1366 x 800). Ostoskori kolmella mobiili-UA:lla: yksi paita "Vielä 1 tuote ilmaiseen toimitukseen", kaksi paitaa
"Ilmainen toimitus". Tuotannon syöte: 651 tuotetta, ei puutteita, joulu2026 101 tuotteella. Mittarin lukuja ei saatu
luettua tässä ajossa: tietokannan muuttujat ovat Vercelissä suojattuja (eivät lataudu paikallisesti) ja hallintasivu vaatii
aktivoidun selaimen; luvut näkyvät /hallinta/mittarit-sivulla Coworkin aktivoidussa Chromessa.

## 2.11.2026 (myöhäisilta): kilpailija-aukot, hintavertailu, syöte ja mittarin luvut koneelle

### 60 uutta mallia (120 tuotetta)
- Coworkin kilpailijatutkimuksen aukot: 15 olut ja kalja, 15 isä (isänpäivä su 8.11. ja "Isä, joka..." -sarja),
  15 sauna ja 15 ammattia (rakentaja, sähkömies, putkimies, sairaanhoitaja, lähihoitaja, opettaja, varhaiskasvattaja,
  kuski, rekkakuski, kokki, IT-tuki, insinööri, maanviljelijä, palomies, poliisi; ei virallisia tunnuksia). Drivesta ei
  löytynyt tiedostoa nimellä huumorikauppa-kilpailijat, joten aiheet ovat tehtävänannon mukaiset.
- Lista data/uudet-tuotteet/aukot-2026-11-02.json, tuonti data/uudet-tuotteet-2026-11-02-aukot.json. T-paidat OPT OnDemand
  (CZ) 27,90 €, hupparit Atelier Katanga (FR) 52,90 € (3XL 59,90 €). Kaikki 120 Printifyyn ja kauppaan aktiivisina.
- Kate: kaikki 2 280 varianttia tarkistettu tuotannon kuluilla, pienin nettokate 9,57 € tilaukselta (vaatimus 9 €).
- Kontrasti: tummilla väreillä valkoinen, Sport Grey -pohjalla musta teksti; scripts/tummat-varit.mjs koko kaupalle:
  0 uutta poistoa.
- Merchant-syöte: jokaiselle 120 tuotteelle pystykuva 1000 x 1500 lisäkuvaksi (lisäkuvia nyt 252 tuotteella).
- Nimikorjaus: "IPA" ja "IT-tuki" isoilla kirjaimilla kaupassa ja Printifyssä.

### Kategoriasivut ja sijoittelu
- Uudet: /olut, /sauna, /ammatit (otsikko, kuvaus, oma teksti, noin 350 sanan opas, 5 UKK:ta FAQPage-schemalla, uudet
  mallit ensin, aiheen vanhat tuotteet mukana). Valikossa "Muut tuotteet", sivukartassa ja esirenderöinnissä.
- /sauna-t-paidat, /harrastus/sauna ja /lahjat/saunaan ohjaavat 301:llä sivulle /sauna. /ammattipaidat säilyi (yli 20
  sisäistä linkkiä) ja linkittää sivulle /ammatit.
- Lahjasivut: isämallit ensin sivuilla /joululahja-isalle, /isanpaivalahja ja /hauska-isanpaivalahja; olut- ja
  saunamallit kaverin, veljen ja miehen lahjasivuilla; sauna /lahjat/mokkeilijalle; ammatit työkaverin sivuilla,
  /lahjat/remontoijalle, /lahjat/maanviljelijalle, /lahjat/it-ihmiselle, /ammattipaidat ja /ammatti/<ammatti>.
- Yritysten alasivut: rakennus (rakentaja, sähkömies, putkimies), insinoorit (insinööri), vpk (palomies, löylypaita),
  terveys (sairaanhoitaja, lähihoitaja), it (IT-tuki), tapahtumat (Kaljavahti), urheiluseurat (saunominen on urheilua).
  Jokaisella edelleen 8-12 paitaa.

### Hintavertailu (KATTEET.md "25,90 € t-paita vai 4,90 € yhden tuotteen toimitus")
- Kumpikin laskisi yhden paidan tilauksen keskikatetta 9,51 € -> 7,94 € ja jättäisi 229 t-paitavarianttia alle 7 €:n.
  Nollaraja vaatisi 19,8 % enemmän tilauksia. Ei käyttöön; ilmainen toimitus kahdesta tuotteesta pysyy hintaviestinä.

### Syöte
- availability: korjautui viime ajossa. Tuotannon syötteessä kaikilla 651 tuotteella oli g:availability (in_stock) ennen
  tätä ajoa; uudet 120 tulevat samalla logiikalla.
- Toimitus: g:shipping 6,90 € (yhden tuotteen tilaus) ja g:free_shipping_threshold 79 € vastaavat sivustoa. Kahden
  tuotteen sääntöä ei voi ilmaista tuotekohtaisesti, joten se asetetaan Merchant Centerin tilin toimitusasetuksiin:
  ohje Coworkille KAYTTOONOTTO.md kohta 17.

### Mittarin luvut koneelle
- Cron ?tehtava=mittarit (CRON_SECRET) palauttaa koosteen ilman henkilö- ja kumppanitietoja (api/_lib/mittarit.js
  mittariKooste). Paikallisesti: node scripts/mittarit.mjs (lukee .env.cron.local, ei tulosta salaisuutta).
- Luvut 2.11.2026 illalla: kate tässä kuussa 0,00 € / 3000 €, 30 pv 1 tilaus (kate 5,90 €); käynnit 187 (hakukoneet 58,
  lahjasivut 24, blogi 40, yritysten alasivut 1, kumppanisivut 1); uutiskirjeen tilaajat 0; tarjouspyynnöt 30 pv 3;
  suppilo 14 pv: 45 tuotesivua, 0 koriin, 1 osto. Tarve 10,5 tilausta ja 1 813 käyntiä päivässä.

### Julkaisun tarkistus (2.11.2026 myöhäisilta)
- Julkaisu READY. Chrome, iPhone ja Googlebot: 200 etusivulle, /olut, /sauna, /ammatit, /ammattipaidat,
  /joululahja-isalle, /isanpaivalahja, /lahjat/mokkeilijalle, /yritykset/rakennus, /yritykset/terveys, kahdelle uudelle
  tuotesivulle ja sitemap.xml:lle (sisältää /olut, /sauna, /ammatit). /sauna-t-paidat 301 -> /sauna. Palvelimen HTML:ssä
  /olut-sivun oma title ja H1.
- Syöte: 771 tuotetta (ennen 651), kaikilla availability; kaikilla 120 uudella pystykuva lisäkuvana ja toimitus 6,90 €.

## 2.11.2026 (yö): suppilon seuranta, tarjouspyynnöt ja Merchantin 25 tuotetta

### Suppilo: miksi koriin lisäyksiä oli 0 ja ostoja 1
- **Syy 1, mittarin jakso.** Oma laskuri julkaistiin 1.11. iltapäivällä, mutta mittari laski ostot 14 päivältä
  tilauksista. Ainoa osto (29.10.) oli ajalta ennen laskuria, joten suppilossa oli osto ilman yhtään kirjattua vaihetta.
  Korjaus: vaiheet, käynnit ja ostot rajataan samaan jaksoon, aikaisintaan päivästä `SUPPILO_LUOTETTAVA_ALKAEN`
  (api/_lib/suppilo.js). **Suppilon data on luotettavaa 2.11.2026 alkaen.** Päivä näkyy mittarissa
  (`scripts/mittarit.mjs`, /hallinta/mittarit).
- **Syy 2, GA4 view_item.** Tuotesivu avautuu yleensä ennen evästebannerin hyväksyntää, jolloin view_item jäi
  lähettämättä. add_to_cart ja begin_checkout lähtivät normaalisti. GA4:n suppilossa oli siksi koriin lisäyksiä ilman
  tuotenäyttöä. Korjaus: viimeisin view_item lähetetään kerran, jos suostumus annetaan samalla sivulatauksella
  (src/lib/analytics.ts).
- **Koriin lisäys ja kassalle siirtyminen kirjautuvat.** Playwright-testi kulki polun tuotesivu > Lisää koriin >
  Siirry kassalle > Jatka kassalle > Siirry maksamaan työpöydällä (1366 x 900) ja iPhone 13 -näkymällä tuotantoa vasten.
  Tulos molemmissa: oma laskuri tuotesivu 1, kori 1, kassa 1 ja maksu 1, palvelin vastasi ok. GA4: view_item 1,
  add_to_cart 1 ja begin_checkout 1. Ennen korjausta view_item oli 0.
- 2.11. tuotesivuja 116 ja koriin lisäyksiä 0 on siis oikea luku eikä mittausvirhe: tuotesivulta ei lisätty koriin.
- Testi: `PLAYWRIGHT=<polku>/playwright/index.mjs node scripts/suppilo-testi.mjs`. Oma laskuri kirjaa testin
  versioon "testi", joka ei näy summissa. GA4-pyynnöt, käyntilaskuri ja /api/checkout kaapataan, joten testistä ei
  synny tilausta, Stripe-istuntoa eikä GA4-tapahtumia.
- GA4 Data API ei ole asetettu (viikkomittarit: "ei asetettu"), joten GA4:n suppilo luetaan GA4:n omasta näkymästä.

### Tarjouspyynnöt (30 pv)
| Päivä | Yritys | Ala | Määrä | Vastattu | Tila nyt |
|---|---|---|---|---|---|
| 29.10. | TESTI Claude (ei oikea) | - | 25 | ei (testi) | testi |
| 31.10. | TESTI Claude Oy (testipyyntö) | - | 12 (pikkujoulu) | ei (testi) | testi |
| 31.10. | Testi Oy (Claude testi) | - | 12 (oma logo) | ei (testi) | testi |

Kaikki kolme olivat omia tuotantotestejä (osoite @huumorikauppa.fi), eikä aitoja pyyntöjä ollut. Ne on merkitty tilaan
"testi", eikä mittari laske niitä (tarjoukset 30 pv: 3 -> 0). Uusi cron-tehtävä `?tehtava=tarjoukset` listaa pyynnöt
ilman yhteystietoja ja vaihtaa tilan (`&merkitse=<id>&tila=testi`). /hallinta/tarjoukset tuntee tilan "testi".

### Merchant: 25 tuotetta ilman availabilitya
- Merchantin syötelähde "PRODUCTS SOURCE 3" hakee oikean osoitteen /product-feed.xml joka päivä klo 3.00 (2.11.: 651
  tuotetta). Vanhaa osoitetta tai välimuistia ei käytetä. Syötteessä on 771 tuotetta, ja kaikilla on availability.
- Ne 25 tuotetta ovat Merchant Centerissä käsin lisätyn lähteen "Kauppiaskeskus" tuotteita (27.–28.10., englanti,
  vanhat hinnat 24,90 € ja 49,99 €). Niitä ei ole kummassakaan syötteessä.
- **Coworkille:** poista lähteen "Kauppiaskeskus" 25 tuotetta. Ohje on KAYTTOONOTTO.md:n kohdassa 18.
- Vanha Lovable-syöte (Supabase-funktio merchant-feed, 994 tuotetta) vastaa yhä, mutta Merchant ei käytä sitä.

**Tarkistukset:** tsc puhdas, 1 663 testiä läpi (1 ohitettu). Kolme User-Agentia (Chrome, iPhone, Googlebot): /,
tuotesivu, /ostoskori, /kassa, /hallinta/mittarit, /hallinta/tarjoukset, /product-feed.xml ja /sitemap.xml kaikki 200.

**Mittari 2.11.2026:** kate tässä kuussa 0 € / 3 000 € (ennuste 5,60 €). Tilauksia 30 päivässä 1 (kate 5,90 €).
Käyntejä tässä kuussa 349: hakukoneet 68, media 68, blogi 43, lahjasivut 31, yritysten alasivut 1, kumppanisivut 1.
Uutiskirjeen tilaajia 0, tarjouspyyntöjä 0. Suppilo 2.11. alkaen: 198 käyntiä, 116 tuotesivua, 0 koriin, 0 kassalle,
0 ostoa. Tarve: 10,5 tilausta ja 1 813 käyntiä päivässä.

## 2.11.2026 (ilta 2): hallinnan taikalinkki, oma liikenne pois, tuotesivun seuranta, lähikuvat, personoidut lahjat, hakuotsikot, lahjapaketit ja kampanjakalenteri

**Coworkille ja Aarnille ensin**
- **Aktivointilinkki:** Resend lähettää huumorikauppa.fi-domainista vasta vahvistuksen jälkeen, joten viesti "Hallinnan
  aktivointilinkki Coworkille" meni varareittiä osoitteeseen flyapeg@gmail.com. **Aarni:** välitä se osoitteeseen
  huumorikauppa@gmail.com. Linkki toimii kerran ja vanhenee 4.11. klo 13.11. Ohje on KAYTTOONOTTO.md:n kohdassa 20.
- **Clarity:** Aarni luo tilin, ja Cowork lisää tunnisteen. Ohje on KAYTTOONOTTO.md:n kohdassa 19.
- **Merchant Center:** edellisen ajon kohta 18 (25 käsin lisättyä tuotetta pois) on yhä tekemättä.

### Hallinnan taikalinkki
- Osoite on /hallinta/aktivoi?t=<256-bittinen tunniste>. Linkki vanhenee 48 tunnissa ja toimii kerran.
- Avaus antaa evästeet hk_hallinta_mittarit, _some ja _tarjoukset sekä hk_oma, kaikki 90 päiväksi. Tunniste poistuu
  osoiteriviltä.
- Sivu lähettää tunnisteen JavaScriptillä, joten sähköpostin linkkiskannerit eivät kuluta linkkiä.
- Päivän yhteenveto lisää uuden linkin, kun edellisestä aktivoinnista on yli 80 päivää.
- Testi `scripts/aktivointilinkki-testi.mjs` (Playwright, tuotanto), 8/8 OK:
  - skannerin GET ei aktivoi
  - avaus aktivoi
  - tunniste poistuu osoiteriviltä
  - kaikki neljä evästettä asettuvat
  - evästeet ovat voimassa 90 päivää
  - /hallinta/mittarit aukeaa
  - toinen avaus hylätään
  - toinen selain ei saa evästettä

### Oma liikenne ja botit pois mittarista ja suppilosta
- Käyntilaskuri, suppilo ja tuotesivun seuranta ohittavat (api/_lib/kaynnit.js onOmaTaiBotti):
  - bottien User-Agentit; mukaan lisättiin Google-InspectionTool, GoogleOther, Playwright, Puppeteer, Selenium, node,
    undici ja tekoälybotit
  - hallintaselaimet, joilla on eväste hk_oma tai hk_hallinta_* (Coworkin Chrome aktivoinnin jälkeen)
  - testiajot (testi: true)
  - muualta kuin sivustolta tulevat kutsut (Sec-Fetch-Site ei same-origin), eli skriptit ja palvelimen omat pyynnöt
- **Media 68 käyntiä (2.11.):** 62 tuotesivulle ja 6 sivulle /lahjaopas-media, kaikki utm_source=media-parametrilla. Parametri
  on vain lahjaoppaan (sivu ja PDF) tuotelinkeissä, eikä mediaviestejä ole lähetetty. Käynnit olivat siis oppaan linkkien
  tarkistusta oikealla selaimella.
- Samoin pääteltiin tietosuojasivun suorat saapumiset (1.11. 6 ja 2.11. 17) sekä /lahjaopas-media 1.11. ja 2.11. (2 + 2).
- Rivit siirrettiin lähteeseen "oma", jota ei lasketa (cron ?tehtava=kaynnit-oma).
- **Aidot ihmiskäynnit 2.11.: 114.** Suora 92, Google 16, Facebook 2, ChatGPT 2, Bing 1, muu 1.
- 1.11.: 154 - 3 testiä - 8 omaa = 143.
- Suppilon vaiheita ei voi erotella jälkikäteen lähteittäin (2.11. mukana oppaan tarkistuksen 62 tuotesivua), joten
  suppilo on luotettava 3.11.2026 alkaen.

### Somekävijät ilman linkkiä
- Bioissa on pelkkä huumorikauppa.fi. Lähde tunnistetaan sovelluksen selaimesta ja viittaajasta, sekä palvelimella
  (kaynninLahde) että GA4:ssä (index.html, page_location utm_source + utm_medium=social):
  - Instagram: User-Agent "Instagram" tai viittaaja instagram.com / l.instagram.com
  - TikTok: musical_ly, BytedanceWebview, TikTok tai viittaaja tiktok.com
  - Facebook: FBAN/FBAV tai viittaaja l.facebook.com
  - Pinterest
- Kuvatekstit: "Linkki biossa" (35 videota). Pinterest-linkit ovat ilman UTM-parametreja (252), ja manifesti päivitettiin
  Blobiin.
- /hallinta/some: UTM-linkit poistettu, ohjeena "Bio: huumorikauppa.fi".
- Lyhyet osoitteet /ig, /tt, /fb, /pin ja /yt toimivat (sivu /linkit ilman uudelleenohjausta, lähde talteen), mutta niitä
  ei käytetä eikä mainita missään.

### Tuotesivun seuranta (24 h raportti päivän yhteenvetoon)
- Yksi kooste katselua kohden, kun sivu suljetaan tai vaihdetaan. Mukana:
  - vierityssyvyys 25/50/75/100
  - aika sivulla
  - koon valinta
  - värin vaihto
  - kokotaulukon avaus
  - "Lisää koriin" -painike vähintään puoliksi näkyvissä
  - lisäys koriin
- Tallennetaan vain koostemäärä päivä x tapahtuma (api/_lib/tuoteseuranta.js). Ei evästeitä eikä tunnisteita.
- Päivän yhteenvetoon tulee automaattisesti viimeisen vuorokauden luvut ja poistumiskohta. Luvut saa myös cron-tehtävällä
  ?tehtava=tuoteseuranta.
- Ensimmäinen raportti on 3.11. yhteenvedossa.

### 10 suosituimman tuotesivun mobiilitarkistus ja korjaukset
- **Vika:** neljällä kymmenestä (Maailman paras äiti, Saatanan Tunarit t-paita, Tonnin seteli t-paita ja huppari)
  yritysnosto "Tilaa koko tiimille: 10+ t-paitaa -10 %" oli otsikon ja tuotekuvan välissä. Puhelimen ensinäkymässä näkyi
  yritystarjous eikä tuote.
  - **Korjaus:** nosto siirrettiin ostoalueen alle.
- **Vika:** monessa mockupissa vitsi oli pieni (esim. "minulla ei ole alkoholiongelmaa... hyvin se uppoaa", "se oli tonnin
  seteli").
  - **Korjaus:** ensimmäinen kuva on nyt lähikuva painatuksesta.
- **Kunnossa:** hinta, toimitusraja (yläpalkki "Ilmainen toimitus kahdesta tuotteesta"), joulun tilauspäivä,
  palautusehto ja arviot.

### Ensimmäinen kuva lähikuvana
- api/_lib/lahikuva.js rajaa painatuksen tuotteen omasta Printify-mockupista (2048 px). Paidan väri tunnistetaan, ja
  painatuksen tiheät rivit rajataan neliöksi. Hupparissa haku alkaa hupun alapuolelta.
- api/img.js tekee rajauksen parametrilla hk_lahi, joten lähikuva vaihtuu värin mukana.
- Kohteena 318 tuotetta: 45 TOP50-vaatetta ja 273 uutta mallia (scripts/lahikuva-tuotteet.mjs; aja uudelleen, kun malleja
  tuodaan).
- Tarkistettu silmämääräisesti kuudella tuotteella, myös vaaleansinisellä hupparilla.
- Merchant-syötteen kuvat ennallaan.

### Personoidut lahjat (/personoidut)
- 25 mallia, joista 20 uutta. Esimerkkejä: "Maailman paras isä: [NIMI]", "[NIMI], saunan vanhin", "Eläkkeellä vuodesta
  [VUOSI]", "[NIMI] ja [NIMI], naimisissa [VUOSI] lähtien", "Mökkimestari [NIMI]", Löylymestari, Jahtimestari,
  Synttärisankari, Vuosikerta, Paras työkaveri, Pikkujoulut, Tonttu ja Golfari.
- Hinnat ja pienin kate:

  | Tuote | Hinta | Pienin kate |
  |---|---|---|
  | T-paita | 32,90 € | 12,45 € |
  | Huppari | 57,90 € | 15,73 € |
  | Huppari 3XL+ | 60,90 € | 10,70 € (59,90 €:lla kate olisi ollut 9,91 €) |

- Tuotesivulla on mallikohtaiset kentät, merkkilaskuri ja reaaliaikainen esikatselu valitun värin paidan tai hupparin
  päällä.
- Kirosana- ja tavaramerkkisuodatus sekä mahtumistarkistus (Anton-fontin merkkileveydet, fonttikoon alaraja) ovat samat
  selaimessa, kassassa ja painokuvassa.
- Maksun jälkeen palvelin tekee PNG:n ja Printify-tilauksen uniikilla tuotteella. T-paita: bp 145, OPT OnDemand.
  Huppari: bp 77, Atelier Katanga.
- Nosto on etusivulla, lahjasivuilla ja sivulla /joulu.
- **Testitilaus tuotannossa:**
  - kassa 86,27 €
  - painokuvat: t-paita 3461 x 3955 ja huppari 3709 x 2472
  - Printify-tilaus 6ae87617cc3dc073380fdccb "TESTI Personointi (perutaan)", jonka kulut olivat tuotteet 32,69 € ja
    toimitus 19,38 €
  - tilaus peruttiin samassa ajossa (canceled)
- **Huomio:** Atelier Katangan käsittelyaika on Printifyssä 10 päivää, mutta kauppa lupaa 3–10 arkipäivää. Kaupan
  nykyiset hupparit tehdään samassa painotalossa.

### Hakuotsikot
- Sivun title, og:title, bottimetat ja Merchantin g:title tulevat yhdestä funktiosta (api/_lib/hakuotsikko.js).
- Esimerkit:
  - "Hauska t-paita isälle: Isä, joka on aina auton alla"
  - "Saunapaita: Sauna lämpiää. muut asiat odottaa"
  - "Pikkujouluhuppari: Pikkujoulut muistetaan vuosia"
- Kaikki 969 tilannekuvan tuotetta ovat alle 70 merkkiä (pisin 69).
- H1, JSON-LD:n name ja tuoteosoitteet ovat ennallaan, joten 301-ohjauksia ei tarvittu.
- Tietovirhe: muki `30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-muki` on kategoriassa t-paidat.

### Lahjapaketit (/paketit)
- Kuusi pakettia: Isän, Saunojan, Pikkujoulupari kahdelle, Mökki, Kalastajan ja Eläkeläisen.
- Jokainen on kahden 27,90 €:n t-paidan pari: 55,80 € -> 53,02 € (-5 %), ilmainen toimitus näkyy kortissa ja sivulla.
  Pienin kate on 13,72 € paketilta.
- Paita ja huppari -paketti ei täytä 12 €:n katetta -5 %:lla (3,23–6,01 €), joten sitä ei tehty.
- Kassa myöntää pakettialennuksen vain, jos kate ilmaisella toimituksella on vähintään 12 €.

### Sopii lahjaksi
- Jokaisella tuotesivulla on ostopainikkeen alla rivi siitä, kenelle tuote sopii, ja linkki vastaavalle lahjasivulle
  (src/lib/sopiiLahjaksi.ts). Rivi on myös esirenderöidyssä HTML:ssä.
- Testattu noin 1 000 tuotteella. Jokainen linkki osoittaa olemassa olevaan sivuun, joka ei ole ohjaus.

### Kampanjakalenteri (src/data/kampanjat.ts)

| Jakso | Kampanja |
|---|---|
| 8.11. asti | isänpäivä |
| 9.–22.11. | joulu |
| 23.–30.11. | Black Friday |
| 1.12. | viimeiset tilauspäivät: hupparit ja muut ti 1.12., t-paidat pe 4.12. |
| 2.–4.12. | vain t-paidat ehtivät |
| 5.–24.12. | lahjakortti |

- Bannerit ja etusivun nosto vaihtuvat päivämäärän mukaan.
- **Black Friday:** -10 % kahdesta tuotteesta ei täytä 7 €:n ehtoa (pahin -2,22 €). Suurin ehdon täyttävä alennus olisi
  t-paidat -9 %, mutta sitä ei voi markkinoida, koska 30 päivän alin hinta on 24,90 €.
  - **Valinta:** "kaksi t-paitaa 44,90 €", pienin kate 12,43 €, sama sääntö kassassa 23.–30.11.
  - Laskelma on KATTEET.md:ssä.
- **Huomio:** kahden tuotteen ilmainen toimitus ilman alennusta voi jättää yksittäisen tilauksen alle 7 €:n (pahin 3,73 €,
  t-paita + koriste). Tilanne oli sama jo ennen tätä ajoa.

**Tarkistukset**
- tsc puhdas, 1 733 testiä (1 ohitettu).
- Suppilon selaintesti (työpöytä ja mobiili) OK.
- Kolme User-Agentia (Chrome, iPhone, Googlebot), kaikki 200: /, /personoidut, /personoitu-paita, /paketit, tuotesivu,
  /joulu, /hallinta/aktivoi, /hallinta/mittarit, /ig, /tt, /linkit, /product-feed.xml ja /sitemap.xml.

## 2.11.2026 (ilta 3): toimitusajat tuotetyypeittäin, ilmaisen toimituksen katevahti, Merchantin 651 tuotetta, Resend

### Toimitusajat toteutuneista tilauksista
- Lähteet:
  - kaupan 24 Printify-tilausta 3–10/2026 (`scripts/joulu-aikataulu.mjs`, mitattu Printify-tilauksesta perille)
  - Printifyn API v2 `shipping/standard` Suomeen: EU-painotalot 5–15, US-painotalot 10–30
- Printifyn v1-käsittelyaika "10 päivää" on sama oletus kaikilla painotaloilla, ei Atelier Katangan erityispiirre.

| Tyyppi | Toteutunut | Printify | Lupaus |
|---|---|---|---|
| T-paidat (OPT CZ 5, 7, 9; Choice/Latvia 4, 4, 6, 7, 9, 12, 15) | 4–15 | 5–15 | 4–15 |
| Hupparit (Textildruck DE 11, 13, 14; Katanga FR ei vielä toimituksia) | 11–14 | 5–15 | 5–15 |
| Julisteet ja tarrat (OPT CZ) | ei toimituksia | 5–15 | 5–15 |

- Sääntö: alaraja on pienempi ja yläraja suurempi luvuista "toteutunut" ja "Printify" (src/config/toimitus.ts
  `TOIMITUSAJAT_TYYPEITTAIN`). Kaikki syötteen tuotteet valmistetaan EU:ssa.
- Samat luvut näkyvät:
  - tuotesivulla ("Perillä 4-15 arkipäivässä, viimeistään …")
  - korissa ja kassalla (korin tuotteiden vaihteluväli)
  - toimitusehdoissa (tuotetyypeittäin)
  - Merchant-syötteessä: käsittely 1–3 ja kuljetus 3–12, hupparit 4–12
  - rakenteisessa datassa, llms.txt:ssä ja tilausvahvistuksen arviossa
- "Kaksi viikkoa ennen juhlaa" vaihdettiin muotoon "kolme viikkoa" kaikissa teksteissä. Juhannuksen päivä
  korjattiin 28.5.:ksi.
- **Joulu:** viimeinen tilauspäivä on kaikille tuotetyypeille ke 2.12.2026 (15 arkipäivää ennen 23.12.). Aiemmin
  hupparit olivat 1.12. ja t-paidat 4.12. Samaa päivää käyttävät banneri, kampanjakalenteri, uutiskirje,
  /joulun-viimeiset-tilauspaivat ja "Ehtii jouluksi".
- **Kampanjakalenteri:**

  | Ajanjakso | Kampanja |
  |---|---|
  | 1.–2.12. | viimeiset tilauspäivät |
  | 3.12.–24.12. | lahjakortti |

### Ilmaisen toimituksen katevahti
- Uusi sääntö `api/_lib/kate.js toimitusmaksuKatteella`, sama kassalla ja korissa:
  - Ilmainen toimitus (kaksi tuotetta tai 79 €) on voimassa vain, jos tilauksen nettokate ilman toimitusmaksua on
    vähintään 7 €.
  - Muuten toimitus on pienin porras 2,90 €, 4,90 € tai 6,90 €, jolla raja täyttyy.
- Kori ja kassa kertovat asiakkaalle: "Tälle tuoteyhdistelmälle toimitus on 2,90 € (tavallisesti 6,90 €)."
  Toimitusehdot mainitsevat porrastuksen.
- Testi `src/test/toimituskate.test.ts`:
  - käy läpi kaikki 299 151 kahden tuotteen yhdistelmää jokaisen tuotteen pahimmalla variantilla
  - ajaa kassan läpi tuoteluokkaparit ilman koodia, 5 %:n koodilla ja Black Friday -viikolla
- **Tulos:**
  - Rajaus koskee 4 851:tä paria (1,6 %), eli hupparin tai koristeen yhdistelmiä.
  - Kaksi t-paitaa on aina ilmainen.
  - Pahin kate oli ennen 3,73 € ja on nyt 7,04 €.

### Merchant Center
- Ero 651 vs. 771 johtuu vain klo 3.00 hausta. 120 uutta tuotetta luotiin 2.11. klo 7.35–7.40, ja 651 + 120 = 771.
- Syötteessä ei ole rajausta, joka pudottaisi tuotteita. Syötteen osoite on https://huumorikauppa.fi/product-feed.xml.
- Kauppiaskeskuksen 25 tuotetta Cowork poisti jo, joten KAYTTOONOTTO kohta 18 on merkitty tehdyksi.
- Kohdan 17 tilin toimitusajat päivitettiin (1–3 + 3–12).

### Resend
- Viestejä ei voi vielä lähettää osoitteeseen huumorikauppa@gmail.com:
  - Domain on Resendissä tilassa "failed", koska DNS-tietueet puuttuvat.
  - Testilähettäjä toimittaa vain tilin omaan osoitteeseen.
  - Ilmoitustesti 2.11. meni osoitteeseen flyapeg@gmail.com.
- Koodi vaihtaa vastaanottajan itse, kun domain on vahvistettu.
- Vaiheet Domainhotellin nimipalvelinmuutoksen jälkeen: KAYTTOONOTTO kohta 21.

### Katko 2.11. klo 17.05–17.15
- Ensimmäinen julkaisu kaatui (MIDDLEWARE_INVOCATION_FAILED). Syy oli `src/data/campaignSchedule.ts`:n import
  "../config/toimitus" ilman .js-päätettä: Vercelin Node ESM ei löydä tiedostoa.
- Korjaus julkaistiin noin 10 minuutissa.
- Uusi testi `src/test/ajonaikaisetImportit.test.ts` seuraa middlewaren ja api/-tiedostojen importit ja kaatuu, jos
  päätettä ei ole. Testi tarkistettu: se kaatuu vanhalla koodilla.
- Testit: 1 739 läpi. Kolme User-Agentia ja 12 sivua, kaikki 200.

## 2.11.2026 (yö): ryhmätilaukset, 40 ammatti- ja harrastussivua, somevideot uuteen muotoon, korin lisämyynti

### Ryhmätilaukset: /abipaidat, /polttarit, /joukkueet ja /yhdistykset
- Kaikki sivut ovat tuotannossa (200, kolme User-Agentia). Toimitusaika 4-15 arkipäivää tulee
  src/config/toimitus.ts:stä, ei 3-10.
- Suunnittelutyökalu:
  - ryhmän nimi, vuosiluku, oma teksti tai logo
  - jäsenen nimi selkään
  - esikatselu mockupissa
  - jaettu kokotaulukkolinkki (/ryhma/:tunnus) ja vetäjän hallintasivu (/ryhma/hallinta/:tunnus)
- **Maksaminen:** vetäjä maksaa kerralla, tai jokainen maksaa oman paitansa.
  - Kun kaikki ovat maksaneet, tilaus lukittuu ja lähtee Printifyyn automaattisesti.
  - Vetäjä voi lukita aiemmin. Silloin maksamattomat jäävät pois tai vetäjä maksaa ne.
  - Määräalennuksen erotus palautetaan Stripellä.
- **Hinnat (t-paita, etu ja selkä):**

  | Paitoja | Hinta | Pienin kate/paita |
  |---|---|---|
  | 5-9 | 37,90 € | 11,22 € |
  | 10+ | 35,90 € | 10,36 € |
  | 25+ | 34,90 € | 10,00 € |
  | 50+ | 33,90 € | 9,35 € |

  Koot 3XL-5XL maksavat 2 € enemmän. Testi käy läpi määrät 5-100, kaikki koot ja värit sekä molemmat maksutavat.
- **Selkäpainatuksen kulu:** Printifyn testitilauksen mukaan 6,61 € (arvio oli 6,00 €). Hintoja nostettiin
  eurolla, jotta 9 €:n raja täyttyy.
- **Polkutesti tuotannossa** (`node scripts/ryhmatilaus-testi.mjs`): luonti, 2 jäsentä, maksu, automaattinen
  lukitus, painokuvat (3461 x 3955, etu ja selkä) ja Printify-tilaus 6ae8b247d79d719ff80f4c35 "TESTI Ryhmätilaus
  (perutaan)", joka peruttiin samassa ajossa (canceled). Testidata poistettiin.
- **Abipaidat:** viimeinen tilauspäivä to 14.1.2027. Paidat ovat perillä 4.2. ennen penkkareita 18.2.2027.

### 40 ammatti- ja harrastussivua /paidat/[slug]
- Valinta Googlen hakuehdotuksista ja avainsanat.csv:stä: seo/ammattisivut.md.
  - 24 ammattia, esim. opettaja, insinööri, lääkäri, sairaanhoitaja, poliisi, kampaaja, sähkömies, kokki
  - 16 harrastusta, esim. jalkapallo, jääkiekko, kissaihminen, koiraihminen, padel ja kahvinjuoja
- Aiheet, joille kaupassa oli jo sivu (kalastaja, metsästäjä, golffari, mökkeilijä, saunoja, maanviljelijä,
  koodari), jäivät nykyisille sivuilleen. 21 vanhaa /ammatti/- ja /harrastus/-sivua ohjautuu 301:llä uusille.
- Jokaisella sivulla on:
  - 250-400 sanan oma teksti (testi: 5 sanan jaksoista alle 15 % yhteisiä)
  - 5 kysymyksen UKK ja FAQPage-schema
  - personoitu vaihtoehto esitäytettynä
  - sisäiset linkit, esirenderöinti ja sivukartta (40 osoitetta)
- **Uudet mallit:** jokaisella sivulla oli alle 6 sopivaa tuotetta, joten tehtiin 200 uutta mallia eli 400 tuotetta
  (t-paita OPT 27,90 €, huppari Katanga 52,90 €).
  - Kontrastisääntö: valkoinen teksti tummilla pohjilla, musta teksti Sport Greyllä. Tummat-värit-tarkistus koko
    kaupalle: 0 uutta poistoa.
  - Yhden tuotteen tilauksen nettokate on t-paidalla 9,57 € ja hupparilla 9,92-11,82 €.
  - Vitsit tarkistettiin, ja yksi kielivirhe korjattiin ("En kerro mitään").
  - Kaupassa on nyt 1 173 tuotetta, ja ammattisivuilla on 11-16 tuotetta.
- **Tuonnin korjaus:** tuonti pysähtyi aikarajaan, koska jo tuodut tarkistettiin kannasta yksitellen. Ne haetaan nyt
  yhdellä kyselyllä (api/cron/tilaukset.js tuo-aktiiviset).

### Ostoskorin lisämyynti
- "Lisää toinen paita, niin toimitus on ilmainen" näytetään vain, kun kassa antaa ilmaisen toimituksen jokaisella
  ehdotetun paidan koolla ja värillä ja kate on vähintään 7 € (testi kassan laskennalla, yli 100 paria).
- "Sopii yhteen" näyttää kolme koriin sopivaa suositusta (sama aihe tai sama lahjasivu).
- Seuranta (näytetty ja lisätty) menee mittariin. Botit ja oma liikenne ohitetaan.
- Tarkistettu tuotannossa puhelimella.

### Somevideot
- 20 uutta videota (36-55). Lista riittää 30.11. asti: 22.-30.11. kaksi videota päivässä, joten vanhimman videon
  uusinnat poistuivat.
- **Instagramin data:** pelkät huumorivideot saivat 5 kertaa enemmän katseluja kuin tuotevideot (23: 132, 21: 83).
  Siksi kaikki 3.11. alkaen julkaistavat 53 videota tehtiin uudelleen (nimissä -v2):
  - POV-tilanne ensin, noin 6,5 s
  - paita lopussa noin 2 s otsikolla "Tää on nyt paidassa"
  - lopussa kommentointikysymys, esim. "Kuka teidän porukasta on aina myöhässä?", joka on myös kuvatekstin alussa
  - ei puheääntä eikä ihmishahmoja
- Black Friday -videoissa on hinta ja 30 päivän alin hinta. Joulun tilauspäivä ke 2.12. tulee koodista.
- **Blob-lataus odottaa Aarnia (KAYTTOONOTTO kohta 22):** Claude ei saa hakea Blob-avainta koneelle. Siihen asti
  /hallinta/some näyttää vanhat videot.

### Mittari
- Uudet rivit:
  - ammattisivujen käynnit (oma osio)
  - korin lisämyynti 14 pv
  - ryhmätilaukset (ryhmät, jäsenet, maksetut, paidat ja kate)
- **Tuotesivun seuranta:** dataa on vasta 5 katselua (2.11.), mikä ei riitä poistumiskohdan korjaamiseen.
  Ensimmäinen 24 tunnin raportti tulee 3.11. päivän yhteenvetoon.
- **Aidot ihmiskäynnit 2.11.: 182** (suora 123, Google 49, Bing 4, Facebook 2, ChatGPT 2, muu 2).
  - 0 kassalle siirtymistä ja 0 ostoa.
  - Oma suppilo (koriin, kassalle) on luotettava 3.11. alkaen.

### Jatkoon
- Ammattisivujen odotuslista (src/test/euReititysMinimi.ts AMMATTISIVUT_ODOTTAA) tyhjennetään, kun testien
  tuotetilannekuva päivitetään uusilla tuotteilla.

## 3.11.2026: maksutavat 7 €:n katteella, Product-schema tuotetyypeittäin, 20 abipaitojen kaupunkisivua, aamun tuotesivuraportti, julkaisun esitestaus

### Maksutavat
- Stripen API:n mukaan kassalla ovat jo käytössä kortti, Apple Pay, Google Pay, Klarna ja MobilePay (myös Link).
  Stripen hallintapaneelissa ei tarvita Aarnin hyväksyntää.
- Laskelma on KATTEET.md:ssä ("Maksutavat ja 7 €:n kate 3.11.2026"). Yhden tuotteen tilausten pienin kate:

  | Maksutapa | Pienin kate |
  |---|---|
  | Kortti, Apple Pay, Google Pay | 7,05 € |
  | MobilePay | 6,94 € |
  | Klarna | 6,31 € |

- Kassa tarjoaa nyt Stripe-istunnossa vain maksutavat, joilla kate on vähintään 7 € (api/_lib/maksutavat.js).
  Tarkistettu tuotannossa testi-istunnoilla, jotka vanhennettiin heti:
  - yksi 24,90 €:n t-paita: vain kortti, Apple Pay ja Google Pay
  - kaksi t-paitaa: kaikki maksutavat
- Ryhmätilauksissa ovat kortti ja MobilePay, koska Klarnalla 9 €:n kate paidalta ei täyty.
- Korin maksutapalogot noudattavat samaa sääntöä. Tuotesivulla näkyvät kaikki logot.
- **Jäljelle jäävä poikkeama:** premium-kortteja ei voi rajata ennen maksua, joten kate voi jäädä enintään 0,42 € alle
  7 €:n.

### Googlen tuotetiedot
- Product-schemassa oli jo shippingDetails, hasMerchantReturnPolicy (14 päivää) ja priceValidUntil (2027-12-31).
- Uutta: toimitusaika tuotetyypin mukaan, t-paidat 4-15 ja hupparit 5-15 arkipäivää (käsittely 1-3 ja kuljetus loput).
  Sama tieto tulee middlewaresta, esirenderöinnistä ja tuotesivulta.
- Validointi (scripts/tuotedata-validointi.mjs) hyväksyy tuotetyypin ajan, kun se pysyy kaupan 4-15 arkipäivän
  lupauksen sisällä. Tuotannossa tarkistettu yksi kelvollinen Product sekä t-paidalle että hupparille.

### Abipaidat kaupungeittain
- 20 sivua osoitteessa /abipaidat/[kaupunki]: Helsinki, Espoo, Tampere, Vantaa, Oulu, Turku, Jyväskylä, Kuopio,
  Lahti, Pori, Joensuu, Lappeenranta, Hämeenlinna, Vaasa, Seinäjoki, Rovaniemi, Mikkeli, Kotka, Salo ja Porvoo.
- Jokaisella sivulla on:
  - 209-249 sanan oma teksti. Testi: 5 sanan jaksoista enintään 5,3 % on yhteisiä minkä tahansa kahden sivun
    välillä. Lukioita ei nimetä, ja maamerkit ovat tunnettuja.
  - penkkarit 18.2.2027 ja takaraja to 14.1.2027 vakioista
  - ryhmätyökalu, 4 kysymyksen UKK ja FAQPage-schema
  - linkit lähikaupunkeihin
- /abipaidat linkittää kaupunkisivuihin, ja kaikki 20 ovat sivukartassa.

### Aamun tuotesivuraportti (päivän yhteenveto klo 7)
- Raportti kattaa edellisen päivän (Suomen aika): koon ja värin valinta, kokotaulukko, Lisää koriin näkyvissä,
  koriin, vieritys 25/50/75/100 %, aika sivulla, sekä suppilo katselu -> painike näkyi -> koko valittu -> koriin.
- Kun aitoja katseluja on vähintään 50, raportti merkitsee suurimman pudotuksen ja antaa valmiin korjausehdotuksen.
- Sama raportti koneelle: `node scripts/tuoteseuranta-raportti.mjs [pvm]`.
- **2.11.:** 10 aitoa katselua. Painike näkyi kaikille, mutta kukaan ei valinnut kokoa, ja 60 % poistui alle
  10 sekunnissa. Data on vielä alle 50 katselun rajan.

### Joulukausi
- Uusi testi src/test/joulukausi.test.ts käy läpi jokaisen tunnin 3.11.-25.12. Jokaisena tuntina on kampanjavaihe,
  banneri ja nosto, eikä yhdessäkään näy mennyttä takarajaa.
- Ke 2.12. jälkeen (3.12.-24.12.) näkyy lahjakorttibanneri ja lahjakortin vaihe. Lahjakortit ovat myynnissä
  tuotannossa. 25.12. alkaen ei näy mitään.

### Julkaisun esitestaus
- scripts/julkaise-uusi.sh tekee nyt neljä vaihetta:
  1. ajaa importtitestin ja tyyppitarkistuksen
  2. rakentaa tuotantoversion ilman domainia (`--skip-domain`)
  3. ajaa savutestin 11 sivulle version omaan osoitteeseen (vercel curl)
  4. siirtää version tuotantoon (`vercel promote`) vain, jos kaikki vastaavat 200
- Ensimmäinen ajo pysähtyi turvallisesti: agenttien työpuut nostivat tiedostomäärän yli Vercelin 15 000 tiedoston
  rajan, joten .claude ja .agents lisättiin .vercelignore-tiedostoon. Tuotanto pysyi koko ajan edellisessä versiossa.
- Kaksi esitestattua julkaisua tehty: savutesti 11/11 ja promote onnistuivat.

## 3.11.2026 (aamu): MobilePay aina, kaupunki- ja ammattisivujen osoitteet, somevideoiden tarkistus

### MobilePay näytetään aina
- Aarnin päätös: MobilePay näkyy kassassa ja korissa myös yhden 24,90 €:n t-paidan tilauksessa.
  - Kate on silloin 6,94 €, eli poikkeama on enintään 0,06 €.
  - Muissa tilauksissa MobilePayn kate on vähintään 7 €.
- Klarna pysyy 7 €:n katteen säännössä.
- Muutokset:
  - api/_lib/maksutavat.js: AINA_SALLITUT = kortti ja MobilePay. MOBILEPAY_POIKKEAMA_EUROA = 0,06.
  - Kori (korinMaksutavat) käyttää samaa sääntöä.
  - Testi (src/test/maksutavat-kate.test.ts) kattaa kaikki yli 5 000 yhden tuotteen varianttia:
    - MobilePay ei jää koskaan pois.
    - Sen kate on vähintään 6,94 €.
    - Klarna tarjotaan vain vähintään 7 €:n katteella.
    - Kassa ja kori näyttävät samat maksutavat.
- KATTEET.md päivitetty.
- Tuotannossa tarkistettu Stripe-istunnoilla, jotka vanhennettiin heti:
  - 1 × 24,90 €:n t-paita (31,80 €): kortti ja MobilePay
  - 2 t-paitaa: kortti, Klarna, Link ja MobilePay
- Julkaistu esitestatulla scripts/julkaise-uusi.sh:lla (savutesti 11/11). Kolmen User-Agentin tarkistus: 200.

### Kaupunki- ja ammattisivut tuotannossa (Coworkia varten)
- Tarkistettu huumorikauppa.fi:stä 3.11. klo 6 Googlebot-, Chrome- ja iPhone-User-Agentilla:
  - kaikki 20 abipaitojen kaupunkisivua ja 40 ammatti- ja harrastussivua vastaavat 200
  - jokaisella on oma otsikkonsa
- Cowork näki kaupunkisivut 404:nä yöllä ennen 3.11. julkaisua.
- **Huom. Coworkille:** tuntematon osoite (esim. /abipaidat/olematon) vastaa myös 200, mutta näyttää etusivun
  otsikon "Hauskat lahjat ja huumorituotteet". Sivun olemassaolo tarkistetaan otsikosta, ei pelkästä 200:sta.
- **Metsästäjä ja kalastaja eivät ole /paidat/-sivuja.** Niiden sivut ovat:
  - https://huumorikauppa.fi/lahjat/metsastajalle
  - https://huumorikauppa.fi/lahjat/kalastajalle
- Uudet 301-ohjaukset /paidat/metsastaja ja /paidat/kalastaja vievät näille sivuille (vercel.json, landingRoutes.ts).

**Abipaidat, 20 kaupunkisivua:**

| Osoite | Otsikko |
|---|---|
| https://huumorikauppa.fi/abipaidat/helsinki | Abipaidat Helsinki penkkareihin 2027 |
| https://huumorikauppa.fi/abipaidat/espoo | Abipaidat Espoo: nimet selkään penkkareihin |
| https://huumorikauppa.fi/abipaidat/tampere | Abipaidat Tampere: Manse-abit penkkareihin |
| https://huumorikauppa.fi/abipaidat/vantaa | Abipaidat Vantaa: penkkaripaidat nimillä |
| https://huumorikauppa.fi/abipaidat/oulu | Abipaidat Oulu: penkkareihin pakkasellakin |
| https://huumorikauppa.fi/abipaidat/turku | Turun abipaidat omilla nimillä |
| https://huumorikauppa.fi/abipaidat/jyvaskyla | Abipaidat Jyväskylä: oma logo ja nimet |
| https://huumorikauppa.fi/abipaidat/kuopio | Abipaidat Kuopio: nimet ja numerot selkään |
| https://huumorikauppa.fi/abipaidat/lahti | Abipaidat Lahti penkkareihin 2027 |
| https://huumorikauppa.fi/abipaidat/pori | Abipaidat Pori: porukan oma teksti eteen |
| https://huumorikauppa.fi/abipaidat/joensuu | Abipaidat Joensuu: vetäjä kokoaa porukan |
| https://huumorikauppa.fi/abipaidat/lappeenranta | Abipaidat Lappeenranta penkkareihin 2027 |
| https://huumorikauppa.fi/abipaidat/hameenlinna | Abipaidat Hämeenlinna: väri ja teksti |
| https://huumorikauppa.fi/abipaidat/vaasa | Abipaidat Vaasa: suomeksi tai ruotsiksi |
| https://huumorikauppa.fi/abipaidat/seinajoki | Abipaidat Seinäjoki: pienikin porukka |
| https://huumorikauppa.fi/abipaidat/rovaniemi | Abipaidat Rovaniemi: penkkarit napapiirillä |
| https://huumorikauppa.fi/abipaidat/mikkeli | Mikkelin abipaidat omilla nimillä |
| https://huumorikauppa.fi/abipaidat/kotka | Abipaidat Kotka: satamakaupungin abit |
| https://huumorikauppa.fi/abipaidat/salo | Abipaidat Salo penkkareihin 2027 |
| https://huumorikauppa.fi/abipaidat/porvoo | Abipaidat Porvoo: kuva Vanhassa Porvoossa |

**Ammatti- ja harrastussivut, 40 sivua (24 ammattia, 16 harrastusta):**

| Osoite | Otsikko |
|---|---|
| https://huumorikauppa.fi/paidat/opettaja | Lahja opettajalle: hauskat paidat |
| https://huumorikauppa.fi/paidat/insinoori | Insinööri paita: hauskat lahjat |
| https://huumorikauppa.fi/paidat/laakari | Lahja lääkärille: hauskat lääkäripaidat |
| https://huumorikauppa.fi/paidat/sairaanhoitaja | Lahja sairaanhoitajalle: hoitajapaidat |
| https://huumorikauppa.fi/paidat/poliisi | Lahja poliisille: hauskat paidat |
| https://huumorikauppa.fi/paidat/kampaaja | Lahja kampaajalle ja parturille |
| https://huumorikauppa.fi/paidat/palomies | Lahja palomiehelle: hauskat paidat |
| https://huumorikauppa.fi/paidat/lahihoitaja | Lahja lähihoitajalle: kotihoidon huumori |
| https://huumorikauppa.fi/paidat/metsuri | Metsurin paidat ja hupparit huumorilla |
| https://huumorikauppa.fi/paidat/fysioterapeutti | Lahja fysioterapeutille: fysiohuumoria |
| https://huumorikauppa.fi/paidat/ensihoitaja | Ensihoitaja paita ja lahjat ensihoitajalle |
| https://huumorikauppa.fi/paidat/sahkomies | Sähkömies paita ja huppari huumorilla |
| https://huumorikauppa.fi/paidat/kokki | Kokki paita: hauskat lahjat kokille |
| https://huumorikauppa.fi/paidat/hammaslaakari | Lahja hammaslääkärille: hymypaidat |
| https://huumorikauppa.fi/paidat/yrittaja | Lahja yrittäjälle: hauskat paidat |
| https://huumorikauppa.fi/paidat/siivooja | Lahja siivoojalle: hauskat paidat |
| https://huumorikauppa.fi/paidat/katilo | Lahja kätilölle: paidat synnytyssalista |
| https://huumorikauppa.fi/paidat/lentaja | Lentäjä paita ja lahja lentäjälle |
| https://huumorikauppa.fi/paidat/putkimies | Putkimies paita: LVI-huumoria |
| https://huumorikauppa.fi/paidat/rekkakuski | Rekkakuski paita ja kuljettajan huppari |
| https://huumorikauppa.fi/paidat/elainlaakari | Lahja eläinlääkärille: paidat ja hupparit |
| https://huumorikauppa.fi/paidat/mekaanikko | Mekaanikko paita: hauskat korjaamopaidat |
| https://huumorikauppa.fi/paidat/arkkitehti | Lahja arkkitehdille: hauskat paidat |
| https://huumorikauppa.fi/paidat/juristi | Lahja juristille: hauskat paidat |
| https://huumorikauppa.fi/paidat/kissaihminen | Lahja kissaihmiselle: hauskat kissapaidat |
| https://huumorikauppa.fi/paidat/koiraihminen | Lahja koiraihmiselle: hauskat koirapaidat |
| https://huumorikauppa.fi/paidat/kahvinjuoja | Lahja kahvinjuojalle: hauskat kahvipaidat |
| https://huumorikauppa.fi/paidat/kuntosali | Kuntosalipaita ja lahja salilla kävijälle |
| https://huumorikauppa.fi/paidat/padel | Padel paita ja lahja padelin pelaajalle |
| https://huumorikauppa.fi/paidat/jalkapallo | Jalkapallo lahja: hauskat futispaidat |
| https://huumorikauppa.fi/paidat/jaakiekko | Jääkiekko lahja: hauskat kiekkopaidat |
| https://huumorikauppa.fi/paidat/hiihtaja | Lahja hiihtäjälle: hauskat hiihtopaidat |
| https://huumorikauppa.fi/paidat/salibandy | Salibandy paita ja lahja säbän pelaajalle |
| https://huumorikauppa.fi/paidat/muusikko | Lahja muusikolle: hauskat muusikkopaidat |
| https://huumorikauppa.fi/paidat/pyorailija | Lahja pyöräilijälle: hauskat pyöräilypaidat |
| https://huumorikauppa.fi/paidat/juoksija | Lahja juoksijalle: hauskat juoksupaidat |
| https://huumorikauppa.fi/paidat/puutarhuri | Puutarhurin paidat ja lahjat huumorilla |
| https://huumorikauppa.fi/paidat/hevosihminen | Lahja hevosihmiselle: hauskat tallipaidat |
| https://huumorikauppa.fi/paidat/retkeilija | Lahja retkeilijälle: hauskat retkipaidat |
| https://huumorikauppa.fi/paidat/pelaaja | Lahja pelaajalle: hauskat pelipaidat |

**Metsästäjä ja kalastaja (lahjasivut):**

| Osoite | Otsikko |
|---|---|
| https://huumorikauppa.fi/lahjat/metsastajalle | Hauska lahja metsästäjälle: t-paidat |
| https://huumorikauppa.fi/lahjat/kalastajalle | Hauska lahja kalastajalle: t-paidat |

### Somevideot /hallinta/somessa
- 3.11. klo 6 Blobissa on yhä 2.11. manifesti: 35 vanhaa videota, ei yhtään uudelleen tehtyä (-v2).
  - Aarnin lataus (KAYTTOONOTTO.md kohta 22) on siis tekemättä.
  - /hallinta/some näyttää vanhat videot myös 3.11. julkaisuille.
- Uusi tarkistus ilman avainta: `node scripts/some-tarkistus.mjs`. Se vertaa Blobin manifestia
  some/julkaisut.json-listaan:
  - 55 videota, joista 53 -v2
  - sama järjestys, päivät ja kellonajat
  - jokainen video vastaa video/mp4:nä
- Tulostaa "OK", kun lataus on tehty. Nyt tulos on "EI VALMIS" (35 / 55 videota).

### Tuotesivuraportti
- 2.11.: 11 aitoa katselua.
  - Painike näkyi kaikille, mutta koon valitsi 0 ja koriin lisäsi 0.
  - 64 % poistui alle 10 sekunnissa.
- Data on alle 50 katselun rajan, joten suurinta pudotusta ei vielä merkitä.
- Suppilo kirjasi 3.11. klo 0-6 39 tuotesivua mutta tuoteseuranta ei yhtään. Selitys on tämä:
  - Suppilo kirjaa sivun latauksen.
  - Tuoteseuranta kirjaa vasta, kun sivu suljetaan tai piilotetaan.
  - Yön lataukset ovat todennäköisesti JavaScriptiä ajavia indeksoijia, jotka eivät sulje sivua. Tuoteseurannan
    luvut ovat siksi aitoja ihmisiä.

### Mittari 3.11.
- Kate tässä kuussa 0 € / 3 000 €. 30 päivässä 1 tilaus, kate 5,90 €.
- Käynnit tässä kuussa 413:
  - hakukoneet 121
  - blogi 78
  - lahjasivut 48
  - ammattisivut 0
- Suppilo 3.11. alkaen: 47 käyntiä, 39 tuotesivua, 0 koriin, 0 kassalle, 0 ostoa.
- Lisämyynti 0. Ryhmätilaukset 0. Uutiskirjeen tilaajia 1.
- Tarve: 10,5 tilausta ja 1 813 käyntiä päivässä.

## 3.11.2026 (ilta): asiakaspalautteet, painotiedostot, kassan katevahti, alle 10 s poistujat, A/B-testit, koon esivalinta, Gmail-reitti

### Asiakaspalautteet: juurisyyt ja korjaukset

| Palaute | Juurisyy | Korjaus | Tila |
|---|---|---|---|
| Tero H. 26630629.22, Tonnin seteli -t-paita: painatus ja homeen haju | Painotiedosto on kuvakaappaus (noin 95 DPI). Painotalo 417 (Latvia) | Tonnin seteli -t-paita ja -huppari pienennetty Printifyssä 150 DPI:hin. Painotaloa 417 ei käytä yksikään myynnissä oleva tuote | Korjattu |
| Johanna H., Tonnin seteli -huppari, korvaava tilaus 21.10. | Sama painotiedosto (93 DPI) eri painotalolla (Saksa): vika on tiedostossa | Sama pienennys | Korjattu |
| Tiina K., muki 24.9., Klarna-kiista, korvausmuki -10,07 € | Alkuperäinen muki painettiin Yhdysvalloissa ja peruttiin. Korvausmuki tilattiin käsin Printifyssä Priority-toimituksella (17,00 €, tavallinen 9,99 €) | Mukit pois myynnistä. Kassan lopullinen 7 €:n katevahti. Päivän yhteenveto listaa käsitilaukset, joissa toimitus ei ole tavallinen tai painotalo on EU:n ulkopuolella | Korjattu. Kiista auki vanhalla Stripe-tilillä |
| Auli H., Olen eläkkeellä 27.9., viive | Vanha Lovable-kassa ei lähettänyt tilausta Printifyyn | Uusi kassa ja tilausvahti hälyttävät jumiin jääneistä tilauksista | Korjattu |
| Jaana V., Amatimies-huppari 29.10. | Printifyssä ei ollut maksutapaa (tilaus jumissa), tilausvahvistus ei lähtenyt (Resend), painotiedosto 74 DPI | Tilaus tuotannossa. Gmail-reitti vahvistuksille. Amatimies piilotettu | Painatus voi olla pehmeä |
| Elias L., Saatanan tunarit 27.10. (matkalla) | Painotiedosto 250 x 202 px (noin 18 DPI) | Tuote piilotettu | Laatuvalitus odotettavissa |
| Koristetilaus kesäkuussa painettiin Yhdysvalloissa | EU-reitityksen piilotus puuttui kassalta ja /api/productsista | myynnissa() noudattaa EU-reititystä myös kassalla | Korjattu |
| 53 tuotteen painatus ylitti osan kokojen painoalueen | Tuotegeneraattori otti leveyden ja korkeuden eri varianteista | 52 korjattu Printifyssä (yksi lukittu ja piilotettu), generaattori korjattu ja testattu | Korjattu |

**Painotiedostojen tarkistus (1 173 tuotetta, scripts/painotiedostot-tarkistus.mjs):**
- **Resoluutio:** 22 löydöstä 20 tuotteessa.
  - 2 pienennetty 150 DPI:hin (Tonnin seteli -t-paita ja -huppari).
  - 14 piilotettu, koska ne ovat alle 90 DPI:n eikä pienennys riitä. Piilotetut ovat Amatimies, ICE AATANA, Kalju, Saatanan tunarit, Slay queen, Suomi Finland ja Tässä talossa asuu yksi pomo, kustakin t-paita ja huppari.
  - Printify-tuotteita ei poistettu. Lista on api/_lib/painolaatu-data.js:ssä.
  - 4 jää myyntiin (99-121 DPI), ja ne korjataan käsin Printifyn editorissa.
- **Painoalue:** 53 ylitystä, joista 52 korjattu. Lisäksi 188 löydöstä koski vain läpinäkyvää reunaa, eli ne eivät ole virheitä.
- Piilotus on tietoinen valinta katteen hyväksi, vaikka Kalju ja Amatimies ovat isänpäivän myyntituotteita: yksi reklamaatio tai maksukiista vie useamman tilauksen katteen. Lisäksi Kalju, ICE AATANA ja Saatanan tunarit sisältävät oikeudellisen riskin (olutmerkin logo, elokuvahahmo, todellisen henkilön kuva).

**Tiinan muki -10,07 €:**
- Myynti 16,70 € (ilman alv:tä 13,31 €).
- Printifyn kulu 22,88 €: tuote 5,88 € ja Priority-toimitus 17,00 €.
- Stripe 0,50 €.
- Tulos 13,31 - 22,88 - 0,50 = -10,07 €.
- Syy: käsin tehty korvaustilaus kalliilla toimituksella kassan katevahdin ohi.

**Kassan esto:**
- **Lopputarkistus:** kassa tarkistaa tilauksen katteen kaikkien alennusten ja toimitusmaksun jälkeen. Jos kate jää alle 7 €:n, tilaus estetään (order_low_margin), ja asiakkaalle näytetään ohje lisätä koriin toinen paita tai huppari.
- **Variantit:** variantti piilotetaan, jos se yksin tilattuna jäisi alle 7 €:n. Kaikki 19 801 myynnissä olevaa varianttia jäävät yksin tilattuna vähintään 7,05 €:oon.
- **Testi:** kaikki yhden tuotteen tilaukset ja kaikki kahden tuotteen yhdistelmät tuoteluokittain (src/test/kassaKatevahti.test.ts).
- **Käsitilaukset:** päivän yhteenveto ilmoittaa poikkeavat käsitilaukset (api/_lib/kasitilaukset.js).

### 64 % poistuu alle 10 sekunnissa: mistä he tulevat

**Data ennen tätä ajoa:**
- **Tuoteseuranta:** vain 11 aitoa tuotesivun katselua (2.-3.11.). 64 % poistui alle 10 sekunnissa, eikä kukaan valinnut kokoa.
- **Käyntilaskuri:** 2.11. alkaen tuotesivuille tuli 215 suoraa käyntiä ilman viittaajaa. Ne eivät näy tuoteseurannassa, koska seuranta kirjaa katselun vasta sivun sulkeutuessa. Suurin osa niistä on todennäköisesti JavaScriptiä ajavia indeksoijia ja linkkien tarkistajia, jotka eivät sulje sivua.
- **Puuttuvat tiedot:** omasta datasta puuttuivat lähde, laite, selain ja aika käyntiä kohden. GA4 Data API ei ole käytössä eikä Clarity päällä.

**Uusi laskeutumislaskuri (api/_lib/laskeutumiset.js, src/lib/laskeutuminen.ts):**
- Jokaisesta ulkopuolelta tulleesta käynnistä tallentuu koostemääränä:
  - laskeutumissivu ja lähde
  - laite ja selain, myös Instagramin, TikTokin ja Facebookin sovelluksen selain
  - aika sivustolla (0-3, 3-10, 10-30, 30-60 s ja yli 60 s)
  - jatkoiko kävijä toiselle sivulle
  - LCP-kori ja A/B-versio
- Tietoja tallennetaan ilman evästeitä ja tunnisteita.
- Raportti tulee päivän yhteenvetoon klo 7 ja komennolla `node scripts/tuoteseuranta-raportti.mjs`.

**Mobiilikuvakaappaukset (scripts/mobiilikuvat.mjs):**
- 10 laskeutumissivua ja 10 tuotesivua kuvattiin iPhone 14:llä, Pixel 7:llä ja Pixel 7:llä hitaalla 4G:llä, jossa prosessori on 4x hitaampi.
- Kuvat otettiin 3 sekunnin kohdalla ja latauksen jälkeen.
- Ajoitukset vaihtelivat rinnakkaisajon takia, joten arvio perustuu kuviin.

| Sivutyyppi | Mitä näkyy 3 sekunnissa | Arvio | Korjaus |
|---|---|---|---|
| Tuotesivu | Otsikko, hinta 24,90 €, koot ja Lisää koriin näkyvät heti. Tuotekuva on harmaa laatikko | Hinta on selvä, mutta vitsi (kuva) puuttuu. Kuvafunktion välimuistihuti kestää 1,1-2,5 s (Printifyn 2 048 px:n kuva ja rajaus), ja vähällä liikenteellä huteja on paljon | Kuvan paikalla näkyy tuotteen vitsiteksti isolla, kunnes kuva latautuu |
| Lahja- ja isänpäiväsivut (/lahjat/..., /hauska-isanpaivalahja) | Kaksi palkkia, toimituspalkki, murupolku, otsikko ja 2-3 kappaletta tekstiä. Ei yhtään tuotetta | Ei vastaa hakua: lahjasivulle tuleva haluaa ideoita | Mobiilissa toimituspalkki piiloon (yläpalkki kertoo saman), ennen tuotteita vain 1. kappale, muut kappaleet ja personoitujen nosto tuotteiden jälkeen (CSS order, teksti sivulla kerran) |
| Lahja- ja kategoriasivut | Palkki "Toimitus 6,90 €, ilmainen 79 eurosta" | Ristiriidassa yläpalkin "ilmainen toimitus kahdesta tuotteesta" kanssa | Kaikkialla "Ilmainen toimitus kahdesta tuotteesta tai 79 eurosta" |
| Blogi | Otsikko, päiväykset ja johdanto. Ensimmäinen tuotenosto toisen ruudun jälkeen | Blogista tuleva hakee ideoita | A/B-testi: versio b näyttää tuoteideat heti otsikon alla |
| Etusivu | Yritysten joululahjabanneri, A/B-otsikko ja joulubanneri. Suosituimmat näkymän alla | Yritysbanneri kuluttajalle ensimmäisenä | Yritysbanneri pois mobiilin yläosasta (sama nosto on tuotteiden alla) |

### A/B-testit kahdelle suurimmalle laskeutumissivutyypille

- **Tuotesivu "koko"** (suurin laskeutumisosio):
  - a = koko valitaan itse.
  - b = t-paidoissa ja hupparissa esivalittu L ja teksti "Vaihda kokoa tarvittaessa", joten yksi napautus riittää koriin.
  - Esikatselussa valittu koko menee aina esivalinnan edelle.
  - Tämä on myös "Ensimmäinen ostos helpoksi" -muutoksen mittaus: voittaja otetaan käyttöön kaikille, kun dataa on tarpeeksi.
- **Blogi "blogi"** (toiseksi suurin):
  - a = nykyinen.
  - b = artikkelin tuoteideat heti otsikon alla.
- **Arvonta:** versio arvotaan sivulatauksessa ja pidetään vain muistissa. Pakotus onnistuu osoitteella ?ab=koko-b. Esirenderöinti ja testit käyttävät versiota a.

**Mittarit:**
- Tuoteseuranta kirjaa versiokohtaisesti: poistui alle 10 s, valitsi koon itse, koko valmiina ja lisäsi koriin.
- Laskeutumislaskuri kirjaa poistumisen alle 10 s versioittain.

| Mittari | Ennen (2.-3.11., 11 katselua) | Jälkeen |
|---|---|---|
| Poistuu alle 10 s (tuotesivu) | 64 % | Kertyy 4.11. alkaen versioittain |
| Koon valinta (tuotesivu) | 0 % | Kertyy 4.11. alkaen versioittain |

### Sähköpostit Gmailin kautta

- **Reitin valinta:** Resend-domain vahvistettu, jolloin käytetään Resendiä. Muuten käytetään Gmailia (smtp.gmail.com:465, huumorikauppa@gmail.com, Nodemailer), jos sovellussalasana on asetettu. Valinta tehdään joka lähetyksellä, joten paluu Resendiin tapahtuu ilman koodimuutosta.
- **Mitä Gmail lähettää:** tilausvahvistukset (korvaavat silloin Stripen kuitin), lahjakorttien PDF:t liitteinä, hallinnan viestit, hälytykset ja päivän yhteenveto.
- **Markkinointiviestit:** korimuistutukset, arviopyynnöt ja uutiskirje menevät vain suostumuksen antaneille. Niillä on kova 100 viestin päiväkatto (Helsingin päivä), ja peruutuslinkki sekä List-Unsubscribe säilyvät.
- **Aarnin komento:** `bash ~/huumorikauppa/scripts/gmail-salasana.sh`
  - Kysyy salasanan piilotettuna ja kokeilee kirjautumista.
  - Tallentaa salasanan Verceliin (GMAIL_APP_PASSWORD, production) ja tiedostoon .env.gmail.local.
  - Seuraava julkaisu ottaa reitin käyttöön.
- **Tarkistus:** `?tehtava=sahkopostireitti` ja `?tehtava=ilmoitustesti` (KAYTTOONOTTO.md kohta 23).

### Julkaisu
- Julkaistu esitestatulla scripts/julkaise-uusi.sh:lla (savutesti 11/11, promote onnistui).
- Kolmen User-Agentin tarkistus: 200 sivuille /, tuotesivu, /hauska-isanpaivalahja, /lahjat/60-vuotiaalle-miehelle, blogi, /abipaidat/helsinki, /kassa ja /ostoskori. Piilotetut tuotteet ohjautuvat 301:llä sivulle /kaikki-tuotteet.
- Koon esivalinta tarkistettu tuotantokäännöksellä Playwrightilla:
  - ?ab=koko-b: valittuina Valkoinen ja L sekä "Koko: L Vaihda kokoa tarvittaessa".
  - ?ab=koko-a: kokoa ei ole valittu.
- Jälkikuvat:
  - Lahjasivulla tuotteet alkavat heti ensimmäisen kappaleen jälkeen ensimmäisessä näkymässä.
  - Tuotesivun kuvan paikalla näkyy vitsiteksti.
- Ajoitusmittaukset tältä koneelta eivät ole luotettavia (yhteys noin 26 kt/s, Chromiumin hidas 4G -emulointi on nopeampi kuin itse yhteys). Arvio perustuu kuviin.
- Jatkokehitys: laskeutumissivujen tuoteruudukko odottaa koko luettelon (250 kt pakattuna). Sivukohtainen haku nopeuttaisi tuotteiden näkymistä hitaalla yhteydellä.
- Savutesti sai 300 sekunnin aikarajan, koska tämän koneen yhteys on hidas (noin 26 kt/s; /api/products 4,5 Mt).
- Epäonnistunut pyyntö kirjataan nyt virheeksi, eikä se kaada skriptiä hiljaa.

### Aarnille ja Coworkille
1. **Tiinan Klarna-kiista (kiireellinen):**
   - Kiista on vanhalla Stripe-tilillä acct_1THtN1AhUyocG7PO, ja sen määräpäivä voi olla 3.11.
   - Vastaa Stripen hallintapaneelissa ja liitä näytöksi korvausmukin toimitus: Printify 6ad92ed15d2b6b33ab00d5e7, UPS, toimitettu 28.10.
2. **Gmail-salasana:** aja `bash ~/huumorikauppa/scripts/gmail-salasana.sh`.
3. **Printifyn editorissa käsin** (siirrä tekstiä kuvan alle):

   | Tuote | Skaala nyt | Uusi skaala | Uusi y |
   |---|---|---|---|
   | se-oli-tonnin-seteli-huppari | 0,784 | 0,560 | 0,292 |
   | se-oli-tonnin-seteli-t-paita | 0,790 | 0,536 | 0,251 |
   | olen-elakkeella-huppari | 0,739 | 0,590 | 0,533 |
   | olen-elakkeella-t-paita | 0,864 | 0,564 | 0,364 |

4. **Piilotettujen palautus:** uusi vähintään 150 DPI:n painotiedosto Printifyyn, sitten `node scripts/painotiedostot-tarkistus.mjs`.
5. **Laatuvalitukset:** varaudu Elias L.:n (Saatanan tunarit) ja Jaana V.:n (Amatimies) mahdollisiin laatuvalituksiin.
6. **Blogit:** linkit piilotettuihin tuotteisiin (Kalju, Amatimies, Tässä talossa) ohjautuvat /kaikki-tuotteet-sivulle. Tekstit kannattaa päivittää.

## 3.11.2026 (myöhäisilta): painotiedostot uudelleen, Tonnin seteli ilman henkilön kuvaa, Search Console, somevideot, hintatesti, bottisuodatus, arvostelut, yritysten takaraja

### Piilotetut 14 tuotetta takaisin myyntiin
- **Uudelleenpiirto:** jokainen matala painokuva korvattiin omalla vektoripiirroksella, ja Printifyn tekstitasot muutettiin kuviksi. Kaikki on vähintään 300 DPI:n tarkkuudella painoalueella.
  - Skriptit: scripts/painotiedostot-uudelleenpiirto.mjs ja scripts/lib/painopiirrokset.mjs.
  - Sanamuoto ja sijoittelu ovat ennallaan, koska piirros tehtiin alkuperäisen kuvan kuvasuhteeseen ja näkyvän alueen sisään.
- **Tarkistus Printifyssä (20 tuotetta):**
  - Pienin painokuvan resoluutio on 300 DPI, aiemmin 18-74 DPI.
  - Tekstitasoja ei ole jäljellä, lukitukset on avattu ja tuotteet näkyvät.
  - Vanhat painoalueet on tallessa perumista varten: data/painotiedostot-uudelleenpiirto.json.
- **Oikeudellinen riski pois samalla:**

| Tuote | Ennen | Nyt |
|---|---|---|
| Saatanan tunarit | Valokuva tunnetusta henkilöstä (250 px) | Paksusankaiset silmälasit, teksti ennallaan |
| Kalju | Olutmerkin karhulogo kaljuna | Oma piirretty kaljupäinen karhu ja KALJU |
| ICE AATANA | Elokuvahahmo | Oma tammenterhohahmo, jonka toinen silmä on musta |
| Slay queen, Olen eläkkeellä | Applen emoji | Omat hymiöt |
| Amatimies | Kuvakaappaus tietyömerkistä | Vektorimerkki |
| Suomi Finland | 293 px:n leijona | Valtion vaakunan leijona (Wikimedia, julkinen) ilman kilpeä ja ruusuja |
| Tässä talossa asuu yksi pomo | Tekoälykuva (1200 px) | Oma koira aurinkolaseissa ja POMO-rusetissa, teksti vektorina |

- **Kontrasti tarkistettiin mockupeista valkoisella ja mustalla paidalla.** Löytyi ja korjattiin:
  - Amatimies: valkoisissa väreissä oli keltainen teksti.
  - Olen eläkkeellä: mustassa oli musta teksti.
  - Molemmissa syy oli tekstikuvien välimuistiavaimen törmäys, ja se on korjattu.
  - Saatanan tunarit -t-paita: Monoton-fontti näkyi harmaana kaikilla pohjilla. Fontti vaihdettiin paksuun slab-fonttiin, ja Dark Heatherille tehtiin oma valkoinen painoalue.
- **Neljän tuotteen käsikorjaus Printifyn editorissa tehtiin API:lla, eikä Coworkin tarvitse tehdä mitään.**
  - Kyseessä olivat Se oli tonnin seteli ja Olen eläkkeellä, kummastakin t-paita ja huppari.
  - Tekstitasot ovat nyt kuvia samassa kohdassa, ja painokuvat ovat 300 DPI:ssä.
- **Myynnissä:** api/_lib/painolaatu-data.js on tyhjä, joten 301-ohjaukset /kaikki-tuotteet-sivulle päättyvät.
- **Blogit:**
  - Linkit 14 palautettuun tuotteeseen toimivat taas.
  - Lisäksi blogeissa oli 4 linkkiä tuotteisiin, joita ei ole myynnissä: koristeet, pitkähihainen ja Yksi kerta vielä. Ne vaihdettiin oma teksti/kuva -paitaan ja -huppariin.
  - Myyntiä vastaamattomat koristehinnat poistettiin teksteistä.
  - Artikkeli "hauskat koristeet lahjaksi" jäi ennalleen. Se odottaa päätöstä: ohjataanko, poistetaanko vai kirjoitetaanko se uudelleen.

### Tonnin seteli ilman oikean henkilön kuvaa
- **Suomen Pankin ohje (17.11.2023):**
  - Markkasetelien kuvien kaupallinen käyttö kuuluu Suomen lakiin, myös tekijänoikeuslakiin, eikä pankki vastaa käytöstä.
  - Eurosetelien jäljennöksiin sovelletaan EKP:n päätöstä EKP/2013/10, jonka mukaan jäljennöstä ei saa voida sekoittaa aitoon.
- **Uusi malli:** oma piirretty setelimäinen kehys, jossa on vihreä guillosiruusuke, "TONNIN SETELI", "1000" ja "YKSI TONNI".
  - Ei muotokuvaa, ei pankin nimeä, ei rahayksikköä, ei sarjanumeroita eikä virallisia merkintöjä.
  - Malli on yksivärinen ja selvästi paidan kuva eikä seteli.
  - Se oli tonnin seteli -tuotteissa teksti on ennallaan kehyksen alla.
- **Päivitetty:**
  - Printifyssä Tonnin seteli -t-paita ja -huppari sekä Se oli tonnin seteli -t-paita ja -huppari.
  - Kaupan tuotekuvat uudella cron-tehtävällä `?tehtava=tuotekuvat`, joka päivittää vain kuvat Printifyn uusista mockupeista.
  - 12 tuotteen Shopping- ja Pinterest-lisäkuvat (Merchant-syötteen lisäkuvat) on tehty uudelleen ja ladattu Blobiin (api/_lib/lisakuvat.generated.js).
  - Lahjaoppaan vaakakuva ja PDF on tehty uudelleen, ja tarkistettu kuvasta, ettei kasvoja ole.
  - Mediapaketin zipit (public/media) on tehty uudelleen.
  - Somevideot 01 ja 11 on tehty uudelleen.
- **Tarrat ja julisteet** ovat pelkkää tekstiä, joten niihin ei tarvittu muutosta.

### Search Console (Coworkin havainnot)
- **Hakulausekkeiden kohdesivut:** jokaiselle hakulausekkeelle on nyt yksi kohdesivu.

| Hakulauseke | Kohdesivu | Muutos |
|---|---|---|
| hauskat lahjat, huumorilahjat | Etusivu | Title ja H1 "Hauskat lahjat ja huumorilahjat" |
| hauskat joululahjat | /joululahjat | Title oli jo oikein |

- **Kilpailevat sivut:** hintasivujen ja blogien titlet vaihdettiin omaan kulmaansa:
  - "Lahjat alle 30 euroa: paidat ja koristeet"
  - "Joululahja alle 50 €"
  - "Pikkujoululahjat ja edulliset lahjaideat 2026"
  - "10 lahjaideaa alle 30 euroa"
- **Sisäiset linkit:** hintasivuilta ja blogeista sekä alatunnisteesta linkit kohdesivuille tarkalla ankkuritekstillä.
- **Kaksoiskappaleet:** kaikilla kolmella sivulla oli jo oma canonical, eli syy oli päällekkäinen sisältö.
  - **/lahjat/pikkujouluihin:** 66-69 % samoista tuotteista ja 43-57 % samasta tekstistä kuin salaisen joulupukin ja työkaverin sivuilla. Sivulla on nyt vain juhlan omat mallit, oma intro ja kaksi opasosiota.
  - **/lahjat/pomolle:** ohut sivu. Lisättiin kolme opasosiota ja uusi kuvaus, ja palautetut Tässä talossa asuu yksi pomo -paidat ovat taas sivulla.
  - **/kategoria/hupparit:** kaksi yleistekstiä poistettiin. Tilalle tuli faktoja mittataulukosta (Gildan 18500, 50/50, koot XS-5XL) ja UKK.
- **www:** www.huumorikauppa.fi palauttaa 307:n vanhan Vercel-projektin domain-asetuksesta. Tämän koneen Vercel-tunnus ei näe sitä tiimiä.
  - Koodissa middleware ja vercel.json ohjaavat www:n 301:llä apexiin, jos www päätyy sovellukseen asti.
  - Canonical-, og:url- ja sivukarttaosoitteet ovat aina ilman www:tä.
  - **Coworkille:** katso lista alla.

### Somevideot: ensimmäinen ruutu ihmisen päällä
- **Päivitetyt videot:** 37 julkaisematonta videota (-v3). Ensimmäinen ruutu ja kansikuva on Printifyn oma lifestyle-kuva, jossa oikea malli istuu paita päällä.
  - Vitsi on ruudulla isolla korostusvärillä turva-alueella.
  - Ei tekoälyihmisiä eikä puhuvia hahmoja.
- **Blob ja /hallinta/some:** molemmat päivitetty. `node scripts/some-tarkistus.mjs` antaa OK: 55 videota oikeassa järjestyksessä.
- **Ennalleen jäi:**
  - personoidut 08, 39, 47 ja 50, koska mockupissa ei ole nimeä
  - 30, 46 ja 54, koska niillä ei ole henkilökuvaa
  - jo julkaistut
  - videot 01, 11, 04, 18, 40, 42, 44 ja 48 (Tonnin seteli, Saatanan tunarit, Amatimies ja Kalju) tehtiin uudelleen uusilla malleilla (-v3) ja ladattiin Blobiin. Näillä tuotteilla Printifyssä ei ole henkilömockupia, joten ensimmäinen ruutu on uusi etukuva ja vitsi isolla.
  - jo julkaistussa videossa 01 näkyvät oikean henkilön kasvot: julkaisut.json, JULKAISUT.md ja /hallinta/some neuvovat poistamaan vanhan julkaisun ja korvaamaan sen
- **Hupparivideot:** videossa 06 ja videon 24 B-kohdassa avausruudussa on saman mallin t-paita, koska huppareilla ei ole lifestyle-kuvaa.

### Ilmaisen toimituksen hintatesti (A/B, yhden tuotteen tilaukset)
- **Versiot:**
  - A = nykyinen: tuote ja toimitus 6,90 €.
  - B = hinta sisältää toimituksen ja teksti "Ilmainen toimitus". Hinta on tuote + 6,90 € pyöristettynä ylöspäin ,90:aan.
- **Katelaskelma:** yhden kappaleen tilaukset, kaikki myynnissä olevat variantit, Stripen kulut mukana.

| Tuote | A yhteensä | B | Kate A pienin | Kate B pienin |
|---|---|---|---|---|
| T-paita 24,90 | 31,80 | 31,90 | 7,22 | 7,30 |
| T-paita 27,90 | 34,80 | 34,90 | 9,40 | 9,48 |
| T-paita 29,90 | 36,80 | 36,90 | 8,55 | 8,63 |
| Huppari 52,90 | 59,80 | 59,90 | 10,13 | 10,21 |
| Huppari 59,90 | 66,80 | 66,90 | 9,92 | 9,99 |

- **Ehdot:**
  - B:n kate on aina vähintään A:n tasolla ja vähintään 7 € (testattu kaikilla yhden tuotteen tilauksilla).
  - Kahden tai useamman tuotteen korissa summa on sama kuin A:ssa.
  - Alennuskoodeissa, paketeissa ja alennusmyynnissä B ei ole käytössä.
- **Versio pysyy koko käynnin:** istuntoeväste hk_ab_toimitus (arvo a tai b, ei tunnistetta) on lisätty tietosuojaselosteeseen.
- **Hinta palvelimella:** kassa laskee hinnan versiosta itse eikä luota selaimen hintaan.
- **Google näkee version A:** Merchant-syöte, JSON-LD, metatagit, esirenderöinti ja botit käyttävät aina A:ta, kunnes testi on ratkaistu.
- **Mittarit versioittain** (vain aidot käynnit):
  - käynti, tuotesivu, kori ja kassa
  - osto ja kate tilauksilta (orders.toimitus_versio, toimitus_kate)
  - kate per käynti
- **Päätössääntö:** kun kummassakin versiossa on vähintään 300 aitoa tuotesivun katselua, voittaja on suurempi kate per käynti. Tasapelissä A jää. Raportti nimeää voittajan (`node scripts/tuoteseuranta-raportti.mjs`, päivän yhteenveto).
- **Pakotus tarkistusta varten:** ?ab=toimitus-b.

### Bottiliikenne pois mittareista
- **Käynti on aito vain, kun kaikki ehdot täyttyvät:**
  - tavallinen selaimen User-Agent: ei bottilistaa, ei HeadlessChromea tai PhantomJS:ää, ei ikivanhoja versioita
  - ei datakeskuksen IP-osoitetta: staattinen lista AWS:n, GCP:n, Azuren, Hetznerin, OVH:n, DigitalOceanin ja muiden alueista, eikä IP:tä tallenneta
  - ei headless-merkkejä: webdriver, 0 x 0 -ikkuna, tyhjä kielilista
  - ihmisen vuorovaikutus: kosketus, hiiri, rulla tai näppäin (pelkkä ohjelmallinen vieritys ei riitä)
- **Suodatus koskee:**
  - käyntilaskuria, mittaria ja konversiota
  - suppiloa, tuoteseurantaa ja laskeutumisia
  - kaikkia A/B-testejä: koko, blogi ja toimitus
  - lisämyyntiä
- **Botit omaan laskuriin:** taulu aitous (päivä x mittari x luokka). Raportti näyttää rivin "kaikki / aidot (%) / botit syittäin". Esimerkki muodosta: "tuotesivun katselut: kaikki 100, aidot 30 (30 %), botit 70 (ei vuorovaikutusta 60, datakeskus 10)".
- **Välitetyt pyynnöt:** vanha projekti välittää kävijän IP:n otsakkeessa x-huumorikauppa-ip, koska uusi projekti näkee muuten vain välittäjän osoitteen. Tämä toimii, kun main on julkaistu myös vanhaan projektiin (GitHub-push).
- **Katko aikasarjassa:** ennen tätä julkaisua luvut sisältävät botit, jälkeen vain aidot. Vanhaa dataa ei voi jakaa jälkikäteen.

### Arvostelut aidosti
- **Arvostelupyyntö:**
  - Lähtee vain toimitetuille tilauksille: Printifyn toimituspäivä + 1 päivä (aiemmin 7 päivää lähetyksestä).
  - Lähtee kerran tilausta ja asiakasta kohden, tallennettuna kantaan.
  - Ei lähde kenellekään ennen toimitusta.
  - Lähtee vain, kun Gmail-reitti on päällä tai Resendin domain on vahvistettu.
- **Jaana V.:**
  - Tilaus on Printifyssä tilassa in-production, eikä lähetystä vielä ole.
  - Pyyntö lähtee automaattisesti päivä toimituksen jälkeen, kun Gmail toimii.
- **Tuotesivu ja JSON-LD:**
  - Tuotesivu näyttää vain tilaukseen sidotut, julkaistut arviot.
  - JSON-LD saa aggregateRatingin ja reviewin vain niistä. Ilman aitoja arvioita schemassa ei ole arvosanaa.
  - Keksityt arviot oli poistettu jo 21.10.
  - Arvioiden määrä tiloittain: `?tehtava=arviot`.

### Yritysten joulutilausten takaraja to 26.11.
- **Laskuri:** "Yritysten joulutilaukset: X päivää jäljellä (takaraja to 26.11.)".
  - Näkyy sivuilla /yritykset, yritysten alasivuilla ja /yritykset/tilaus.
  - Helsingin aika, päivittyy selaimessa.
  - Viimeisenä päivänä teksti on "viimeinen tilauspäivä tänään", ja sen jälkeen laskuri piiloutuu.
- **Hinta-arvio:** tarjouspyynnön vastauksessa on automaattinen hinta-arvio määrän mukaan nykyisistä määräalennuksista (ALV mukana, ilmainen toimitus, alle 10 kpl ei arviota). Määräalennus rajataan suurimpaan portaaseen, jolla kate pysyy vähintään 7 €:ssa kappaleelta. Meemipaidalla se tarkoittaa, että 10 kpl on 249 € (aiemmin 224,10 €).

| Malli | 10 kpl | 25 kpl | 50 kpl |
|---|---|---|---|
| Meemipaita | 24,90 € | 22,41 € | 22,41 € |
| T-paita | 25,11 € | 24,55 € | 23,99 € |
| Oma logo | 26,91 € | 26,31 € | 25,71 € |
| Huppari | 52,90 € | 52,90 € | 52,90 € |

- **Huomio:** kassan oma määräalennus antaa meemipaidalle yhä täyden alennuksen. Kassan lopullinen 7 €:n vahti katsoo koko tilauksen katetta, ei kappalekohtaista. Jatkossa samaa porrasrajausta kannattaa käyttää myös kassassa.

### Gmail-reitti
- `?tehtava=sahkopostireitti` palauttaa 3.11. klo 22: reitti resend, gmail false. Aarni ei ole vielä ajanut salasanaskriptiä.
- Testiviesti osoitteeseen huumorikauppa@gmail.com ja tilausvahvistuksen tarkistus tehdään, kun gmail on true. Reitti näyttää sen suoraan, ja tarkistus on `?tehtava=ilmoitustesti`.

### Julkaisu
- **Julkaisut:** esitestatulla scripts/julkaise-uusi.sh:lla kaksi kertaa, savutesti 11/11 ja promote onnistui molemmilla kerroilla.
  - Kaksi muuta yritystä keskeytyi tämän koneen nimipalvelukatkoon (Vercel API `fetch failed`, ohitusavain puuttui ja SSO 302). Silloin tuotanto pysyi edellisessä versiossa, kuten pitää.
- **Tuotekuvat:** päivitetty 20 tuotteelle tehtävällä `?tehtava=tuotekuvat&v=20261103`.
  - Printifyn mockup-osoite pysyy samana, vaikka painokuva vaihtuu, ja kuvafunktio välimuistittaa vuodeksi.
  - Versioparametri vaihtaa osoitteen, jotta uusi kuva näkyy heti.
  - Tarkistettu: tonnin-seteli-t-paidan tuotekuvassa on uusi setelikehys.
- **GitHub:** pushattu haaroihin main ja oma-tausta. Vanha projekti rakentaa mainin, jolloin kävijän IP välittyy bottisuodatukseen.

### Mittari 3.11. (aidot käynnit)
- **Kate ja tilaukset:**
  - Kate marraskuussa 0 € / 3 000 €.
  - 30 päivän ajalta 1 tilaus, kate 5,90 €. Tarjouspyyntöjä 0.
- **Käynnit:** marraskuussa 626, joista hakukoneet 171, blogi 114, lahjasivut 61 ja media 44.
  - Luvut ovat ennen bottisuodatusta, joten mukana on myös automaattista liikennettä.
- **Suppilo 3.11.:** 260 käyntiä, 172 tuotesivua, 0 koriin, 0 ostoa.
- **Bottisuodatus:** ensimmäisen tunnin aikana kaikki 2 kirjausta olivat aitoja (2/2).
  - Suodatus koskee nyt kaikkia mittareita.
  - Aidosti vertailukelpoinen luku saadaan 4.11. alkaen.
- **Arvio vanhasta datasta (2.-3.11., tuotesivun seuranta 69 katselua):**
  - 65 % pysyi sivulla 10-30 s.
  - Koon valintoja 0, ja vain 2,9 % käytti värivalintaa tai kokotaulukkoa.
  - Vieritys pysähtyi 25 %:iin (76,8 % vieritti vähintään 25 %, vain 7,2 % vähintään 50 %).
  - Nämä noin 45 katselua vastaavat automaattisen liikenteen kuvaa. Aitoja katseluja jää arviolta noin 24 eli noin 35 %.
- **Koon esivalinta A/B (pieni otos):**

| Versio | Katseluja | Alle 10 s | Koon valinta | Koriin |
|---|---|---|---|---|
| A, kävijä valitsee koon | 5 | 80 % | 0 % | 0 % |
| B, L esivalittu | 5 | 40 % | koko valmiina 100 % | 0 % |

- **Laskeutumiset (36):**
  - Alle 10 s poistui 38,9 %.
  - Google 24, joista alle 10 s 41,7 %.
  - Mobiili 26, joista alle 10 s 46,2 %.
- **Ilmaisen toimituksen hintatesti** alkaa 4.11. Ratkaisu tehdään, kun kummassakin versiossa on 300 aitoa tuotesivun katselua.

### Aarnille ja Coworkille
1. **Aarni, Gmail:** aja `bash ~/huumorikauppa/scripts/gmail-salasana.sh`.
   - Sen jälkeen seuraava julkaisu ottaa Gmail-reitin käyttöön.
   - Tarkistetaan reitti ja lähetetään testiviesti osoitteeseen huumorikauppa@gmail.com (`?tehtava=ilmoitustesti`).
   - Tilausvahvistukset ja Jaanan arvostelupyyntö lähtevät Gmailin kautta.
2. **Cowork, www-osoite:**
   - Avaa Vercelissä tiimin aarni-ais-projects vanha huumorikauppa-projekti: Settings → Domains → www.huumorikauppa.fi.
   - Vaihda uudelleenohjauksen tilakoodiksi 308 Permanent tai 301 (nyt 307 Temporary).
   - Aja sen jälkeen Search Consolessa www-osoitteen URL-tarkistus ja pyydä indeksointi apex-osoitteelle.
3. **Cowork, some:**
   - Jo julkaistussa Tonnin seteli -videossa (01) on oikean henkilön kasvot. Poista julkaisu ja korvaa se uudella videolla 01 (Blob, /hallinta/some).
   - Tarkista samalla, onko kasvokuvaa käytetty muissa julkaisuissa tai Pinterestissä.
4. **Aarni, päätös:**
   - Artikkeli "hauskat koristeet lahjaksi" esittelee koristeita, joita ei myydä. Vaihtoehdot: uudelleenohjaus, poisto tai uudelleenkirjoitus paidoista.
   - Kassan määräalennus antaa meemipaidalle täyden portaan (kate alle 7 €/kpl yli 25 kappaleen tilauksessa, kokonaiskate silti vahdissa). Ehdotus: sama porrasrajaus kuin tarjouksissa.
5. **Tiinan Klarna-kiista:** edellisen ajon kohta 1 on yhä auki, jos sitä ei ole vastattu.

## 4.11.2026

**Aarnin päätökset toteutettu**
- Blogi: "Hauskat koristeet lahjaksi" on nyt "Hauskat pikkulahjat alle 30 €" (/blogi/hauskat-pikkulahjat-alle-30-euroa).
  - Mukana kuusi myynnissä olevaa t-paitaa (24,90 tai 27,90 €).
  - Vanha osoite ohjaa uuteen 301:llä (vercel.json), ja sivukartassa on vain uusi osoite.
  - Mukeja ei voinut käyttää, koska ne ovat piilossa myynnistä.
- Määräalennus samaan 7 €:n katesääntöön kuin tarjouksissa (api/_lib/katesaanto.js, yhteinen yritysmyynti.js:n kanssa).
  - 24,90 €:n meemipaidoissa portaat ovat nyt: 10 kpl ei porrasta (kahden paidan -5 % jää voimaan), 25 kpl ja 50 kpl
    -10 %.
  - 27,90 €:n paidoissa portaat ovat ennallaan.
  - Yrityssivujen, etusivun, blogien ja korivihjeiden tekstit kertovat nyt vain portaat, jotka kassa oikeasti antaa.
  - TERVE-ensitilauskoodi vaatii nyt myös 7 € katetta kappaleelta.

**Ensimmäinen tilaus -kannustin (A/B, alkaa 5.11.2026)**
- Printify ei tarjoa EU-painotaloille omaa pakkausliitettä tai kiitoskorttia, joten kannustin on -5 % ensimmäisestä
  tilauksesta.
- Versio B näyttää merkin tuotesivulla hinnan vieressä ja korissa erillisenä rivinä.
- Ehdot:
  - Kassa tarkistaa sähköpostiosoitteesta, ettei aiempia maksettuja tilauksia ole.
  - Alennus ei yhdisty muihin alennuksiin.
  - Alennus annetaan vain, jos kate jää vähintään 7 €:oon kappaleelta, myös hintatestin B-version kanssa.
- Käytännössä alennus koskee 27,90 €:n t-paitoja (kate -5 %:n jälkeen 8,48 €) ja huppareita (9,76 €). 24,90 €:n paita
  jää ilman, koska kate jäisi 6,25 €:oon.
- Seuranta:
  - Eväste hk_ab_ensitilaus; testauslinkki ?ab=ensitilaus-b.
  - Botit, syöte ja prerender saavat aina version A.
  - Mittarit: aidot katselut, kori, kassa, ostot ja kate per käynti.
  - Päätös tehdään, kun kummassakin versiossa on 300 aitoa katselua.
  - Tulokset näkyvät tuoteseurantaraportissa ja päivän yhteenvedossa.
- Tietokanta: db/schema.sql (ensitilaustesti ja orders.ensitilaus_*). Taulut luodaan myös ajossa.

**Nimipalvelinvaihto (KAYTTOONOTTO.md kohta 24)**
- Julkinen DNS luettiin 4.11.2026:
  - A: Vercel
  - www: CNAME Verceliin
  - MX: Zoho mx3
  - TXT: SPF, kaksi Google-vahvistusta ja Trustpilot
  - default._domainkey, _vercel (vanha tiimi), _acme-challenge
  - _dmarc: lovable.dev
  - Ei AAAA- eikä CAA-tietueita. DNSSEC on pois päältä.
- Uusi Cloudflare-vyöhyke (annabel/vick) on jo olemassa. `node scripts/dns-vertailu.mjs` vertasi vyöhykkeitä suoraan
  nimipalvelimilta, eikä estäviä eroja ole.
  - Resendin kolme tietuetta ja uusi DMARC ovat jo uudessa vyöhykkeessä.
  - A-tietueet ovat DNS only.
- Kirjattu vaihtosuunnitelma:
  1. Nimipalvelimet.
  2. Resend.
  3. Domain uuteen Vercel-projektiin `_vercel`-TXT:llä, A 216.150.1.1/216.150.16.1 ja www CNAME. www-ohjaus 308 on jo
     valmiina uudessa projektissa.
  Mukana ovat myös tarkistukset, palautus ja Coworkin vaiheet. DMARC-raportit kannattaa ohjata Cloudflaren ilmaiseen
  DMARC Managementiin, koska gmail.com ei vastaanota toisen domainin raportteja.

**Sähköposti Resendiin**
- Vaihto on automaattinen: kun Resend vahvistaa domainin, kaikki viestit lähtevät Resendillä, ja kassa lakkaa
  pyytämästä Stripen kuittia. Tähän ei enää tarvita SAHKOPOSTI_VAHVISTETTU-muuttujaa (omaVahvistusKaytossaNyt).
- `node scripts/sahkoposti-tila.mjs` tulostaa:
  - nimipalvelimet
  - DNS-tietueet
  - DMARC
  - Resendin tilan
  - reitin
  - viikon tilausvahvistukset
- `--testi` lähettää omistajalle TESTI-viestin jokaisesta viestityypistä: tilausvahvistus, lähetysilmoitus,
  lahjakortti, korimuistutus, tervetuloviesti, uutiskirje, arvostelupyyntö ja hallinta.
- Sama tila näkyy päivän yhteenvedossa.
- Nyt: Resend `failed`, koska nimipalvelimet ovat vielä vanhat.

**Somevideot**
- Instagramin lukuja ei ole koneelle saatavilla, ja 37 uutta videota julkaistaan 30.11. mennessä.
- Cowork kirjaa luvut tiedostoon some/tilastot.csv 7 päivää julkaisusta (ohje JULKAISUT.md:ssä).
- `node scripts/some-analyysi.mjs` vertaa muotoja, versioita ja julkaisuaikoja katseluajan mukaan ja suosittelee
  muodon 20 seuraavalle videolle, kun dataa on vähintään 5 videosta kahdessa muodossa.

**Mittari 4.11. klo 12**
- Kate marraskuussa 0 € / 3 000 €, 30 päivässä 1 tilaus.
- Käynnit kuussa 649 (ennen suodatusta).
- Bottisuodatus on ollut päällä 3.11. illasta. Siitä alkaen:
  - käynnit 25/30 aitoja (83 %)
  - laskeutumiset 25/25
  - tuotesivun katselut 3/4
- Hintatesti 4.11.: A 1 tuotesivu, B 0. Raja on 300 + 300.
- Koon esivalinta: A 7, B 5 katselua, kumpikaan ei vielä koriin.

### 4.11.2026 iltapäivä

**Kumppanit, kierros 3: koodit Coworkin omalla hallintasivulla /hallinta/kumppanit (KAYTTOONOTTO.md kohta 25)**
- Yksi kumppani lisätään kirjoittamalla nimi, malli 1 tai 2 ja halutessa oma koodi tai sähköposti.
  - Jos koodia ei anneta, se tehdään nimestä automaattisesti (ä ja å muuttuvat a:ksi, ö o:ksi; jos toisella nimellä on
    jo sama koodi, perään tulee -2).
  - Sivu näyttää /k/-linkin ja raporttilinkin kopiointipainikkeineen.
- Useita kerralla: liitä taulukon rivit muodossa "Nimi; malli", sitten Esikatsele ja Luo kaikki. Tulostaulukon voi
  kopioida takaisin taulukkoon.
- Lista näyttää kaikista kumppaneista:
  - ensimmäisen aidon käynnin /k/-linkissä (kirjataan automaattisesti; botit ja hallintaselaimet eivät lasketa)
  - klikit ja maksetut tilaukset
  - painikkeen, jolla kumppanin voi poistaa käytöstä tai aktivoida
- Driven taulukkoa huumorikauppa-kumppanit-kierros3 ei löytynyt koneen Drive-yhteydestä (se on todennäköisesti
  huumorikauppa@gmail.comin Drivessa), joten Cowork luo 22 koodia sivulla itse.
- Pääsy: uusi hallintalinkki päivän yhteenvedossa. Aktivointilinkki avaa jatkossa kaikki hallintasivut.

**www-ohjaus:** `vercel whoami` = flyapeg-2135, `vercel teams ls` = vain flyapeg-2135s-projects. Vanha
huumorikauppa.fi:tä palveleva projekti on tiimissä aarni-ais-projects, johon tällä tilillä ei ole pääsyä, joten
ohjausta ei voi vaihtaa nyt. Korjaus tulee automaattisesti domainin siirron yhteydessä (KAYTTOONOTTO.md kohta 24,
vaihe 3): uudessa projektissa www ohjaa juureen jo 308:lla.

**Stripen kuitti tilausvahvistukseksi, kunnes Resend toimii**
- Kuitissa näkyvät jo Stripen tilin tiedoista:
  - kaupan nimi Huumorikauppa
  - rivien nimet ja summat
  - yhteystiedot huumorikauppa@gmail.com ja puhelinnumero
  Viimeisimmän kuitin rakenne tarkistettiin ilman henkilötietoja.
- Kuittiin lisättiin viimeisen rivin nimeen tilausnumero ja toimitusaika, esim.
  "Toimitus, Posti kotiinkuljetus (tilaus #ABCD1234, toimitus yleensä 4-15 arkipäivää)". Stripen kuitti näyttää rivien
  nimet, mutta maksun kuvausta ei näkynyt aiemmassa kuitissa.
- Lisäksi maksun kuvaus (näkyy Stripen tiedoissa) ja sama tieto maksusivulla maksupainikkeen alla.
- Kun oma vahvistus on käytössä (Resend), rivin nimeen ei enää lisätä mitään.
- Rajoitus: Stripe kirjoittaa kuitin englanniksi ("Receipt from Huumorikauppa"). Kuitin kieltä tai leipätekstiä ei voi
  muuttaa API:lla. Tilauksen yhteenveto Stripen laskulla (invoice_creation) olisi maksullinen, joten sitä ei otettu
  käyttöön.

### 4.11.2026 ilta

**Coworkin hallintapääsy ilman sähköpostia**
- `node scripts/cowork-aktivointi.mjs` kirjoittaa kertakäyttöisen 48 tunnin aktivointilinkin tiedostoon
  ~/huumorikauppa/.cowork/aktivointi.txt (oikeudet 600). Kansio on .gitignoressa ja .vercelignoressa.
- Linkki kirjoitettiin 4.11. klo 15.16. Se on voimassa 6.11. klo 15.16 asti ja avaa kaikki hallintasivut.
- `--jos-tarvitaan` kirjoittaa uuden linkin vain, kun eväste on vanhenemassa (yli 80 pv viimeisestä aktivoinnista).
  Tilan antaa cron `?tehtava=aktivointi-tila`.
- Aamuajon asentaminen Macin launchd:hen estettiin tämän ajon oikeuksissa. Aarni asentaa sen kerran:
  `bash ~/huumorikauppa/scripts/cowork-aktivointi-asennus.sh`. Ajo on joka aamu noin klo 8.15 Helsingin aikaa.
- Yksi aktivointi kattaa nyt kaikki /hallinta-sivut, myös tulevat. Minkä tahansa hallintasivun kelvollinen eväste
  (myös 2.11. aktivoidut mittarit, some ja tarjoukset) avaa kaikki sivut ja asettaa yleisen evästeen hk_hallinta.
  Coworkin Chrome pääsee siis sivulle /hallinta/kumppanit ilman uutta aktivointia. Testit: src/test/hallinta-paasy.test.ts.

**Kumppanit**
- Tiedostoa ~/huumorikauppa/.cowork/kumppanit-kierros3.txt ei ole, joten 22 koodia ei tehty. Cowork tekee ne sivun
  /hallinta/kumppanit massalisäyksellä ("Nimi; malli" -rivit, Esikatsele, Luo kaikki; KAYTTOONOTTO.md kohta 25).
  Kun tiedosto on olemassa, Claude luo koodit siitä.
- Erämaiden Kulkijat luotiin koodilla ERAMAANKULKIJAT, malli 2 (ostaja -5 %, kumppani 5 %, kaupalle vähintään 7 €
  katetta tilaukselta).
  - Kumppanisivu: https://huumorikauppa.fi/k/eramaankulkijat
  - Tervehdys korjattiin muotoon "Tervetuloa Erämaiden Kulkijoiden kautta" uudella &kautta=-valinnalla.
  - Raporttilinkki on tiedostossa .cowork/kumppanit.txt eikä tässä. Repo on julkinen, ja linkki on allekirjoitettu
    avain, jolla näkee kumppanin myynnin.

**Joulukalenteri /joulukalenteri (1.-24.12.)**
- Joka päivä aukeaa yksi luukku, joka on voimassa vain sen päivän Helsingin aikaa. Palvelin ei paljasta tulevia
  luukkuja, eikä luukkudata ole selaimen koodissa eikä esirenderöidyllä sivulla.
- Hinta on luukun päivänä -3 €: t-paita 27,90 → 24,90 € ja huppari 52,90 → 49,90 €. Kate on huonoimmallakin
  variantilla vähintään 7,22 €.
  - 24,90 €:n paitoja ei voi alentaa 7 €:n säännöllä, joten ne eivät ole luukuissa.
  - Luukkuhinta ei yhdisty muihin alennuksiin. Asiakas maksaa aina pienemmän summan.
- Tuotteet valittiin myydyimmistä (etusivun järjestys) ja katsotuimmista:
  - parittomina päivinä t-paita ja parillisina huppari
  - luukut 10-24 jouluaiheita
- Uusi cron `?tehtava=suosituimmat-tuotteet` (ostot 90 pv × 25 + aidot tuotesivun katselut tuotekohtaisesti) ja
  `scripts/joulukalenteri-valinta.mjs` päivittävät valinnan ennen joulukuuta. Tuotekohtainen katselutaulu
  tuotesivu_katselut on otettu käyttöön.
- Joulun viimeinen tilauspäivä on ke 2.12., joten luukkujen 3.-24. tilaukset tulevat perille joulun jälkeen. Sivu ja
  viesti kertovat sen.
- Nostot:
  - Banneri: 16.-22.11. "Joulukalenteri aukeaa ti 1.12.", 1.-24.12. "päivän luukku auki". Black Friday 23.-30.11.
    on ennallaan.
  - Etusivun osio, joulun valikko, kampanjakalenteri ja sivukartta.
- Uutiskirjeen tilaajat saavat päivän luukun aamulla 1.-24.12. vain, kun lähetys on sallittu (Resend vahvistettu).
  Kukin saa enintään yhden viestin päivässä, ja viestit mahtuvat 100 viestin päivärajaan.
- Seuranta: käynnit, luukun avaukset, koriin ja ostot (botit suodatettu). Päivän yhteenvedossa on rivi joulukuussa.

**Yritysten pikkujoulupaketit /pikkujoulut-yritykset**
- Paketit (eri mallit sekaisin, kokojakauma valittavissa, ilmainen toimitus yhteen osoitteeseen):

  | Paketti | Hinta | Yhteensä | Huonoin kate/paita |
  |---|---|---|---|
  | 10 paitaa | 27,90 €/kpl | 279,00 € | 10,97 € |
  | 25 paitaa | 25,11 €/kpl (-10 %) | 627,75 € | 9,24 € |
  | 50 paitaa | 25,11 €/kpl (-10 %) | 1 255,50 € | 9,39 € |

- 9 €:n katesääntö estää -12 %:n ja -14 %:n portaat.
- Takarajan laskuri näyttää to 26.11.
- Lomake käyttää olemassa olevaa tarjouspyyntöjen putkea (lähde pikkujoulut-yritykset, paketti näkyy sivulla
  /hallinta/tarjoukset ja automaattisessa vastauksessa).
- Linkit ovat sivuilla /yritykset, yritysten alasivuilla ja tilaussivulla. Seuranta mittarissa.

**A/B-testit ja tuotesivu (4.11. klo 19)**
- Tuotesivun suurin poistumiskohta on koon valinta: 0 % valitsi koon, kun 98 % näki Lisää koriin -painikkeen. Tämä
  on 3.11. dataa, joka on pääosin ajalta ennen bottisuodatusta.
- Aidot tuotesivun katselut suodatuksen alusta: 14.
- Testien tilanne:
  - Koon esivalinta: A 7 ja B 5 katselua.
  - Hintatesti: A 6 ja B 6 (raja 300 + 300).
  - Ensitilaus alkaa 5.11.
  - Yksikään ei ole vielä lisännyt koriin.
- Korjausta ei tehty vielä, koska koon esivalinta on itse testi juuri tähän kohtaan. Sivun muuttaminen nyt sotkisi
  testin. Kun koon testissä on vähintään 100 aitoa katselua per versio, voittaja otetaan käyttöön ja koon valinta
  korjataan sen mukaan (koot isoina painikkeina, kokotaulukko näkyviin).

**Mittari 4.11. ilta**
- Kate kuussa 0 € / 3 000 €, 30 päivässä 1 tilaus (5,90 €).
- Suodatuksen alusta aitoja:
  - käynnit 75/88 (85 %)
  - laskeutumiset 75/81
  - tuotesivun katselut 14/16
- Uutiskirjeen tilaajia 1, tarjouspyyntöjä 0.

### 4.11.2026 myöhäisilta: somen julkaisuketju (selvitys, ei tilejä luotu)

**Ongelma:** Coworkin selain ei saa videotiedostoa Instagramin eikä TikTokin latauskenttään Blobista. Ratkaisu on
julkaisu palvelimelta rajapinnan kautta (Vercel-funktio hakee videon Blobista). Molemmat rajapinnat ovat
dokumentaation mukaan maksuttomia; hintaa ei mainita missään (ei vahvistettu erikseen). Lähteet:
developers.facebook.com/docs/instagram-platform/content-publishing ja developers.tiktok.com/doc/content-posting-api-get-started.

**Instagram (Reels): toteutettavissa heti, ei tarkastusta omalle tilille.**
- Vaatimus: Instagramin ammattilaistili (Business tai Creator). Variantti "Instagram API with Instagram Login" ei
  vaadi Facebook-sivua.
- Oikeudet: instagram_business_basic ja instagram_business_content_publish, Standard Access. Kun sovellus julkaisee vain
  omistajan omalle tilille, App Review ja yrityksen vahvistus eivät Metan ohjeen mukaan ole tarpeen (vaaditaan vain
  Advanced Accessille). Varmistetaan ensimmäisellä testijulkaisulla.
- Julkaisu Blob-URL:sta: kyllä. POST /{ig-user-id}/media (media_type=REELS, video_url=Blob-URL, caption), sitten
  status_code-kysely kerran minuutissa, kunnes FINISHED, sitten POST /{ig-user-id}/media_publish. Meta hakee videon
  itse URL:sta, joten julkisen Blob-osoitteen pitäisi kelvata (ei erikseen vahvistettu; jos ei kelpaa, video tarjoillaan
  omasta domainista). Videon vaatimukset: MP4/MOV, H.264 tai HEVC, 3 s - 15 min, enintään 300 Mt, 9:16, 23-60 fps,
  AAC-ääni, moov-atomi alussa.
- Raja: 100 rajapintajulkaisua vuorokaudessa (dokumentaatiossa paikoin 50; tarkistus /content_publishing_limit).
- Avain: pitkäikäinen token 60 päivää, uusitaan palvelimelta (refresh_access_token) ennen vanhenemista. Token
  tallennetaan vain Vercelin ympäristömuuttujaan, ei repoon eikä chattiin.
- Vaiheet:
  1. **AARNI (tili ja hyväksyntä):** Meta-kehittäjätili developers.facebook.com, käyttöehtojen hyväksyntä.
  2. **AARNI:** uusi sovellus, tyyppi Business, käyttötapaus "Instagram API with Instagram login".
  3. **AARNI:** Huumorikaupan Instagram-tili ammattilaistiliksi, jos ei jo ole (Instagram > Asetukset > Tilin tyyppi).
  4. **AARNI:** tili sovelluksen rooliin (Instagram Tester) ja kutsun hyväksyntä Instagramissa.
  5. **AARNI:** API setup > Generate token, kirjautuminen Instagramiin; token Vercelin ympäristömuuttujaksi
     IG_ACCESS_TOKEN (Aarni liittää sen itse Verceliin, ei chattiin).
  6. Claude: reitti /api/cron/some?tehtava=ig-julkaise (CRON_SECRET), tokenin uusinta ajastettuna, testijulkaisu ja
     Coworkin ohje (Cowork antaa vain Blob-URL:n ja tekstin).

**TikTok (Content Posting API): julkinen automaattijulkaisu vasta TikTokin auditin jälkeen.**
- Ilman auditia kaikki julkaisut ovat yksityisiä (SELF_ONLY), enintään 5 käyttäjää vuorokaudessa, ja tilin pitää olla
  yksityinen. Julkiseksi muuttaminen tehdään käsin TikTokin sovelluksessa julkaisu kerrallaan.
- Audit vaatii käyttöliittymän TikTokin ohjeiden mukaan (tekijän nimimerkki, näkyvyysvalinta ilman oletusta,
  musiikin käyttövahvistus, kaupallisen sisällön merkintä, esikatselu) ja edellyttää, että sovellus on tehty laajalle
  käyttäjäjoukolle eikä vain sisäiseen käyttöön. Yhden kaupan sisäinen työkalu voi siksi jäädä hyväksymättä. Kestoa
  TikTok ei kerro.
- Blob-URL suoraan: ei. PULL_FROM_URL vaatii, että URL:n domain tai etuliite on vahvistettu TikTokille (DNS-tietue
  tai tiedosto) eikä URL saa uudelleenohjata. vercel-storage.com-osoitetta ei voi vahvistaa. Vaihtoehdot:
  (a) FILE_UPLOAD: palvelin hakee videon Blobista ja lähettää sen paloina TikTokin upload_url-osoitteeseen (toimii ilman
  domainvahvistusta julkaisussa); (b) huumorikauppa.fi/media/... -rewrite Blobiin ja huumorikauppa.fi:n vahvistus
  DNS-tietueella (tehdään nimipalvelinvaihdon jälkeen, KAYTTOONOTTO.md kohta 24).
- Välivaihe ilman auditia: luonnosjulkaisu (inbox, oikeus video.upload). Video menee Huumorikaupan TikTokin
  saapuneisiin, ja Cowork viimeistelee julkaisun TikTokin sovelluksessa tai selaimessa (ei tiedoston latausta).
  Raja 5 odottavaa luonnosta vuorokaudessa. Toimiiko inbox ennen auditia, ei käy ilmi dokumentaatiosta; testataan.
- Avaimet: access token ja refresh token (dokumentaation esimerkeissä 24 h ja 365 pv, tekstissä 2 h ja 180 pv), uusi
  refresh token tallennetaan joka uusinnassa. Raja 6 pyyntöä minuutissa ja noin 15 julkaisua tekijää kohden päivässä.
- Vaiheet:
  1. **AARNI (tili):** TikTok-kehittäjätili developers.tiktok.com (omistajaksi mieluiten organisaatio Uusiku Oy).
  2. **AARNI:** sovellus (kuvake 1024x1024, nimi, kuvaus, verkkosivu https://huumorikauppa.fi), tuotteet Login Kit ja
     Content Posting API, Direct Post päälle, oikeudet video.upload ja video.publish, Redirect URI
     https://huumorikauppa.fi/api/tiktok/paluu.
  3. **AARNI (hyväksyntä):** käyttöehtojen, tietosuojaselosteen ja sivuston URL-vahvistus (DNS-tietue Cloudflareen, Cowork
     voi lisätä tietueen).
  4. **AARNI:** sovelluksen tarkastukseen lähetys: kuvaus käyttötavasta ja 1-5 demovideota koko ketjusta. Claude tekee
     ensin julkaisusivun ja demon.
  5. **AARNI (hyväksyntä):** Content Posting API -auditin hakemus lomakkeella (julkinen julkaisu).
  6. **AARNI:** kirjautuminen Huumorikaupan TikTok-tilillä kerran sovelluksen OAuth-sivulla.
  7. Claude: palvelinreitit (OAuth-paluu, tokenien uusinta, FILE_UPLOAD- ja inbox-julkaisu), Coworkin ohje.

**Suositus:** Instagram ensin (Aarnin vaiheet 1-5, ei tarkastusta). TikTokissa haetaan tarkastus ja audit rinnakkain.
Siihen asti TikTok-videot julkaistaan inbox-luonnoksina, jos se toimii ilman auditia, ja muuten käsin puhelimesta.
