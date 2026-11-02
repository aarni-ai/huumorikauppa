# Ammatti- ja harrastussivut /paidat/[slug] (2.11.2026)

40 laskeutumissivua ammateille ja harrastuksille. Sisältö: `src/data/ammattisivut/` (osaA-osaD), kokoaminen
laskeutumissivuiksi `src/data/ammattisivut/index.ts`, testit `src/test/ammattisivut.test.ts`.

## Valintaperuste

Hakumäärä arvioitiin vain ilmaisilla lähteillä:

1. **seo/avainsanat.csv**: ammatti- ja harrastushaut, joilla on prioriteetti (esim. "lahja opettajalle" ja
   "lahja sairaanhoitajalle" prioriteetti 2, "lahja insinöörille", "lahja poliisille", "lahja palomiehelle",
   "lahja kokille", "lahja pyöräilijälle", "lahja juoksijalle", "lahja kuntosalille", "lahja koiraihmiselle",
   "lahja kissaihmiselle" prioriteetti 3, "lahja kahvinjuojalle" ja "lahja pelaajalle" prioriteetti 2).
2. **Googlen hakuehdotukset** (suggestqueries.google.com, hl=fi, gl=fi, haettu 2.11.2026): 120 ammattia ja harrastusta,
   kustakin kahdeksan hakua: "[x] paita", "[x] t-paita", "[x] huppari", "lahja [x:lle]", "hauska lahja [x:lle]",
   "joululahja [x:lle]", "[x] lahja" ja "[x] vitsi". Pisteet = Googlen palauttamien ehdotusten määrä yhteensä (0-80).
   Google näyttää ehdotuksen vain haulle, jolla on hakijoita, joten luku on ilmainen suhteellinen mittari, ei
   hakumäärä.
3. **Search Console**: repossa ei ole Search Consolen lukutapaa (ei API-avainta eikä skriptiä), joten sitä ei käytetty.

Mukaan otettiin aiheet, joilla on paita- tai lahjahakuja (ei pelkkiä lahjakorttihakuja, kuten hieroja ja
kosmetologi) ja joista syntyy hyvää huumoria. Aiheet, joilla on jo kanoninen sivu, jätettiin pois (alla).

| Sivu | Hakutermit | Pisteet | Esimerkkiehdotuksia |
|---|---|---|---|
| /paidat/opettaja | opettaja | 14 | opettaja paita; lahja opettajalle; lahja opettajalle keväällä |
| /paidat/insinoori | insinööri | 8 | insinööri paita; insinööri huppari; lahja insinöörille |
| /paidat/laakari | lääkäri | 8 | lääkäri paita; lahja lääkärille; hauska lahja lääkärille |
| /paidat/sairaanhoitaja | sairaanhoitaja | 7 | sairaanhoitaja paita; sairaanhoitaja huppari; lahja sairaanhoitajalle |
| /paidat/poliisi | poliisi | 7 | poliisi paita; poliisi paita lapselle; poliisi paita naiset |
| /paidat/kampaaja | kampaaja, parturi | 10 | joululahja kampaajalle; kampaaja lahjakortti; kampaaja vitsi |
| /paidat/palomies | palomies | 6 | palomies paita; palomies paita lapselle; palomies huppari |
| /paidat/lahihoitaja | lähihoitaja | 5 | lähihoitaja paita; lähihoitaja huppari; lahja lähihoitajalle |
| /paidat/metsuri | metsuri | 5 | metsuri paita; metsuri huppari; lahja metsurille |
| /paidat/fysioterapeutti | fysioterapeutti | 5 | fysioterapeutti paita; fysioterapeutti huppari; lahja fysioterapeutille |
| /paidat/ensihoitaja | ensihoitaja | 5 | ensihoitaja paita; ensihoitaja huppari; lahja ensihoitajalle |
| /paidat/sahkomies | sähkömies, sähköasentaja | 8 | sähkömies paita; sähkömies lahja; sähkömies vitsi |
| /paidat/kokki | kokki | 4 | kokki paita; lahja kokille; kokki lahja |
| /paidat/hammaslaakari | hammaslääkäri | 4 | lahja hammaslääkärille; hammaslääkäri lahja |
| /paidat/yrittaja | yrittäjä | 4 | lahja yrittäjälle; joululahja yrittäjälle; yrittäjä lahja itselle |
| /paidat/siivooja | siivooja | 4 | siivooja paita; lahja siivoojalle |
| /paidat/katilo | kätilö | 4 | kätilö huppari; lahja kätilölle; kätilö lahja |
| /paidat/lentaja | lentäjä | 4 | lentäjä paita; lahja lentäjälle; lentäjä lahja |
| /paidat/putkimies | putkimies | 3 | putkimies paita; putkimies lahja; putkimies vitsit |
| /paidat/rekkakuski | rekkakuski, kuorma-autonkuljettaja | 3 | rekkakuski paita; joululahja rekkakuskille; rekkakuski vitsit |
| /paidat/elainlaakari | eläinlääkäri | 3 | lahja eläinlääkärille; eläinlääkäri vitsit |
| /paidat/mekaanikko | mekaanikko, automekaanikko | 3 | mekaanikko paita; lahja mekaanikolle; mekaanikko vitsi |
| /paidat/arkkitehti | arkkitehti | 3 | lahja arkkitehdille; arkkitehti lahja; arkkitehti vitsi |
| /paidat/juristi | juristi | 3 | lahja juristille; juristi lahja; juristi vitsi |
| /paidat/kissaihminen | kissa | 15 | kissa paita; kissa paita naiselle (csv: lahja kissaihmiselle) |
| /paidat/koiraihminen | koira, koiranomistaja | 14 | koira paita; lahja koiranomistajalle (csv: lahja koiraihmiselle) |
| /paidat/kahvinjuoja | kahvi, kahvinjuoja | 8 | kahvi paita; kahvi huppari (csv: lahja kahvinjuojalle) |
| /paidat/kuntosali | kuntosali | 7 | kuntosali paita; kuntosali paita miehet (csv: lahja kuntosalille) |
| /paidat/padel | padel | 14 | padel paita; padel lahja |
| /paidat/jalkapallo | jalkapallo | 23 | jalkapallo paita; jalkapallo lahja (8 ehdotusta) |
| /paidat/jaakiekko | jääkiekko | 16 | jääkiekko paita; jääkiekko lahja |
| /paidat/hiihtaja | hiihtäjä | 4 | hiihtäjä paita; lahja hiihtäjälle; joululahja hiihtäjälle |
| /paidat/salibandy | salibandy | 4 | salibandy paita; joululahja salibandyn pelaajalle |
| /paidat/muusikko | muusikko, kitaristi | 7 | lahja muusikolle; joululahja muusikolle; muusikko vitsit |
| /paidat/pyorailija | pyöräilijä | 3 | lahja pyöräilijälle; joululahja pyöräilijälle (csv) |
| /paidat/juoksija | juoksija | 3 | lahja juoksijalle; joululahja juoksijalle (csv) |
| /paidat/puutarhuri | puutarhuri | 3 | lahja puutarhurille; joululahja puutarhurille |
| /paidat/hevosihminen | ratsastaja, hevostyttö | 5 | ratsastaja huppari; lahja ratsastajalle |
| /paidat/retkeilija | retkeilijä | 3 | lahja retkeilijälle; joululahja retkeilijälle |
| /paidat/pelaaja | pelaaja, gamer | 4 | lahja pelaajalle; gamer paita (csv prioriteetti 2) |

Jalkapallo-, jääkiekko- ja padel-hauissa osa ehdotuksista on pelipaitoja ("jalkapallo paita lapselle"). Sivut on
kirjoitettu lahjahakuun ("jalkapallo lahja", "padel lahja") ilman joukkueita ja tavaramerkkejä.

## Canonical-ratkaisut

**Ei omaa /paidat/-sivua, olemassa oleva sivu on kanoninen** (sama hakuaikomus, omat sarjat ja oppaat):

| Aihe (esimerkkilistasta) | Kanoninen sivu |
|---|---|
| kalastaja (pilkkijä) | /lahjat/kalastajalle |
| metsästäjä | /lahjat/metsastajalle |
| golffari | /lahjat/golfaajalle |
| mökkeilijä | /lahjat/mokkeilijalle |
| saunoja (avantouimari) | /sauna |
| maanviljelijä | /lahjat/maanviljelijalle |
| koodari | /lahjat/it-ihmiselle |
| moottoripyöräilijä | /lahjat/autoilijalle (H1 "autoilijalle ja motoristille") |
| rakennusmies, remontoija | /lahjat/remontoijalle |
| oluen ystävä | /olut |

Lähimmät /paidat/-sivut linkittävät näihin ja kertovat eron tekstissä: mekaanikko (ammatti) vs. /lahjat/autoilijalle
(harrastaja), metsuri vs. maanviljelijä- ja metsästäjäsivut, pelaaja vs. /lahjat/it-ihmiselle, retkeilijä vs.
mökkeilijä- ja kalastajasivut, insinööri vs. /lahjat/it-ihmiselle. Hoitoalan sivut (sairaanhoitaja, lähihoitaja,
ensihoitaja, kätilö) linkittävät toisiinsa ja kertovat työn erot.

**301-ohjaukset uudelle sivulle** (ohuempi sivu samalla hakuaikomuksella; `LANDING_REDIRECTS` ja `vercel.json`):

- /ammatti/sahkoasentaja, putkimies, sairaanhoitaja, lahihoitaja, laakari, opettaja, kokki, poliisi, palomies,
  yrittaja, fysioterapeutti, hammaslaakari, insinoori, siivoja, rekkakuljettaja -> /paidat/<vastaava>
- /harrastus/juokseminen, kuntosali, pyoraily, koiraharrastus, kissaharrastus, retkily -> /paidat/<vastaava>
- Aiemmat ohjaukset uuteen kohteeseen: /harrastus/videopelit -> /paidat/pelaaja, /lahjat/opettajalle -> /paidat/opettaja,
  /lahjat/hoitajalle -> /paidat/sairaanhoitaja, /lahjat/kahvinystavalle -> /paidat/kahvinjuoja,
  /lahjat/yrittajalle -> /paidat/yrittaja, /ammatti/insinöori (ääkkösversiot) -> /paidat/insinoori.
- Jäljelle jäävät /ammatti/-sivut (hitsaaja, baarimikko, kirjanpitäjä, myyntimies, psykologi) ja /harrastus/ruoanlaitto
  ovat ennallaan.

Sivujen ja blogien sisäiset linkit päivitettiin osoittamaan uusiin sivuihin (canonical-testit: ei linkkejä ohjattuihin
polkuihin). Hub-sivut /ammatit (ammatit) ja /lahjat/harrastajalle (harrastukset) linkittävät kaikkiin /paidat/-sivuihin.

## Sivun rakenne

- Oma teksti 250-400 sanaa (intro + opas), testattu: 5 sanan jaksoista alle 15 % yhteisiä minkään toisen /paidat/-sivun
  tai aiemman laskeutumissivun kanssa, ei ajatusviivoja, ei superlatiiveja eikä jossittelua, ei käsin kirjoitettuja
  hintoja, toimitusaikoja tai päivämääriä.
- Tuotteet: viisi uutta mallia t-paitana ja hupparina ensin, sitten aiheen aiemmat tuotteet.
- Personoitu vaihtoehto: nosto esitäytetyllä linkillä (Alalla X vuotta, työsankari, harrastusmestari, kapteeni tai
  koiranomistajan paita `?teksti=`, tuotesivu esitäyttää tekstikentän) ja linkki /personoidut.
- UKK: kolme sivun omaa kysymystä sekä hinta- ja toimitusvastaus (src/config/toimitus.ts, src/data/hintatekstit.ts) ja
  joulun tilauspäivä (src/data/tilauspaivat.ts). FAQPage-, BreadcrumbList- ja ItemList-JSON-LD esirenderöinnissä.
- Sivukartta (api/sitemap.js), reitit (LANDING_PATHS), esirenderöinti (src/seo/prerender/pages.ts laskeutumissivuista).

## Uudet mallit (valmisteltu, ei vielä luotu)

200 mallia, jokainen t-paitana (OPT OnDemand CZ, bp 145, S-2XL, 27,90 €) ja hupparina (Atelier Katanga FR, bp 77,
S-3XL, 52,90 €, 3XL 59,90 €): `data/uudet-tuotteet/ammattisivut-2026-11-02.json` (generoidaan:
`npx tsx scripts/generoi-ammattimallisto.mjs`). Värit kuten aukkomallistossa: t-paita Black, Navy, Sport Grey, Red;
huppari Black, Navy, Red. Kontrasti: tummilla valkoinen, Sport Grey -pohjalla musta teksti.

Kate (testi, samat pohjat ja tuotannon kulut kuin 2.11. ammattimallistossa): yhden tuotteen tilauksen nettokate
t-paidalla 9,57 €, hupparilla 9,92-11,82 € (raja 7 €).

Ajojärjestys:

1. Koeajo ja luonti Printifyyn (ei julkaise):
   `set -a && . ./.env.printify.local && set +a && npx tsx scripts/printify-uudet-tuotteet.mjs --lista data/uudet-tuotteet/ammattisivut-2026-11-02.json --hintamalli live --kateraja 1 --toteuta --raja 2`
   ja sitten sama ilman `--raja`.
2. Tuontitiedosto: `npx tsx scripts/ammattimallisto-tuontitiedosto.mjs` -> `data/uudet-tuotteet-2026-11-02-ammatit.json`.
3. Lähikuvat: `node scripts/lahikuva-tuotteet.mjs`.
4. Commit ja julkaisu, sitten kauppaan:
   `/api/cron/tilaukset?tehtava=tuo-aktiiviset&tiedosto=uudet-tuotteet-2026-11-02-ammatit` (CRON_SECRET, toista kunnes
   kaikki on tuotu).
5. Kontrasti koko kaupalle: `node scripts/tummat-varit.mjs` (Printify-avaimet ympäristöstä).
6. Kun uudet tuotteet ovat tilannekuvassa (src/test/fixtures/products-snapshot.json), poista sivut listalta
   `AMMATTISIVUT_ODOTTAA` (src/test/euReititysMinimi.ts). Testi vaatii sen.

## Mittari

Käynnit kirjataan saapumissivun ensimmäisestä polun osasta (api/_lib/kaynnit.js `sivunOsio`), joten /paidat/<slug>
on valmiiksi oma osionsa "paidat". Mittari (api/_lib/mittarit.js `liikenne`) laskee sen omaksi luvukseen
`ammattisivut` eikä lahjasivuihin. Luku näkyy /hallinta/mittarit-sivulla, päivän yhteenvedossa ja
`node scripts/mittarit.mjs` -tulosteessa.
