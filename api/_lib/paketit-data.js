/**
 * Generoitu: node scripts/generoi-paketit.mjs --kulut <kulutiedosto> (20 pakettia tilannekuvasta). Älä muokkaa käsin.
 * Alennus valittu kuluista (2026-10-26): suurin 10..5 %, jolla paketin kate >= 30 %. Pois käytöstä: 20/20.
 */
const PAKETIT = [
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -7,4 %, raja 30 %; vaatisi parin hinnaksi vähintään 116,00 € (nyt 74,80 €).
  {
    "slug": "tonnin-seteli-t-paita-ja-huppari",
    "nimi": "Tonnin Seteli: T-paita ja huppari",
    "teema": "tonnin-seteli",
    "tuotteet": [
      "tonnin-seteli-t-paita",
      "tonnin-seteli-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -7,4 %, raja 30 %; vaatisi parin hinnaksi vähintään 116,00 € (nyt 74,80 €).
  {
    "slug": "100-elakelainen-t-paita-ja-huppari",
    "nimi": "100% Eläkeläinen: T-paita ja huppari",
    "teema": "100-elakelainen",
    "tuotteet": [
      "100-elakelainen-t-paita",
      "100-elakelainen-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-t-paita-ja-huppari",
    "nimi": "30 ja liian vanha tyhmyyksiin (teen ne silti): T-paita ja huppari",
    "teema": "30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti",
    "tuotteet": [
      "30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-t-paita",
      "30-ja-liian-vanha-tyhmyyksiin-teen-ne-silti-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "30-nuori-villi-ja-jo-vasynyt-t-paita-ja-huppari",
    "nimi": "30, nuori, villi ja jo väsynyt: T-paita ja huppari",
    "teema": "30-nuori-villi-ja-jo-vasynyt",
    "tuotteet": [
      "30-nuori-villi-ja-jo-vasynyt-t-paita",
      "30-nuori-villi-ja-jo-vasynyt-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "30v-paranen-ian-myota-kuin-viini-t-paita-ja-huppari",
    "nimi": "30v, paranen iän myötä kuin viini: T-paita ja huppari",
    "teema": "30v-paranen-ian-myota-kuin-viini",
    "tuotteet": [
      "30v-paranen-ian-myota-kuin-viini-t-paita",
      "30v-paranen-ian-myota-kuin-viini-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "30v-selka-alkaa-jo-rusahdella-t-paita-ja-huppari",
    "nimi": "30v, selkä alkaa jo rusahdella: T-paita ja huppari",
    "teema": "30v-selka-alkaa-jo-rusahdella",
    "tuotteet": [
      "30v-selka-alkaa-jo-rusahdella-t-paita",
      "30v-selka-alkaa-jo-rusahdella-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "40-ja-fabulous-t-paita-ja-huppari",
    "nimi": "40 ja fabulous: T-paita ja huppari",
    "teema": "40-ja-fabulous",
    "tuotteet": [
      "40-ja-fabulous-t-paita",
      "40-ja-fabulous-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "40-vuotta-henkisesti-18-t-paita-ja-huppari",
    "nimi": "40 vuotta, henkisesti 18: T-paita ja huppari",
    "teema": "40-vuotta-henkisesti-18",
    "tuotteet": [
      "40-vuotta-henkisesti-18-t-paita",
      "40-vuotta-henkisesti-18-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "40-vuotta-toita-nyt-ikuinen-viikonloppu-t-paita-ja-huppari",
    "nimi": "40 vuotta töitä, nyt ikuinen viikonloppu: T-paita ja huppari",
    "teema": "40-vuotta-toita-nyt-ikuinen-viikonloppu",
    "tuotteet": [
      "40-vuotta-toita-nyt-ikuinen-viikonloppu-t-paita",
      "40-vuotta-toita-nyt-ikuinen-viikonloppu-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "40v-ei-keski-ika-klassikko-t-paita-ja-huppari",
    "nimi": "40v, ei keski-ikä, klassikko: T-paita ja huppari",
    "teema": "40v-ei-keski-ika-klassikko",
    "tuotteet": [
      "40v-ei-keski-ika-klassikko-t-paita",
      "40v-ei-keski-ika-klassikko-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "40v-ei-vanha-vintage-t-paita-ja-huppari",
    "nimi": "40v, ei vanha, vintage: T-paita ja huppari",
    "teema": "40v-ei-vanha-vintage",
    "tuotteet": [
      "40v-ei-vanha-vintage-t-paita",
      "40v-ei-vanha-vintage-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "40v-henkisesti-18-tyylilla-40-t-paita-ja-huppari",
    "nimi": "40v, henkisesti 18, tyylillä 40: T-paita ja huppari",
    "teema": "40v-henkisesti-18-tyylilla-40",
    "tuotteet": [
      "40v-henkisesti-18-tyylilla-40-t-paita",
      "40v-henkisesti-18-tyylilla-40-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "40v-kunnossa-niinku-20v-t-paita-ja-huppari",
    "nimi": "40v, kunnossa niinku 20v: T-paita ja huppari",
    "teema": "40v-kunnossa-niinku-20v",
    "tuotteet": [
      "40v-kunnossa-niinku-20v-t-paita",
      "40v-kunnossa-niinku-20v-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "50-ja-hopeanhohtoinen-vain-hiukset-t-paita-ja-huppari",
    "nimi": "50 ja hopeanhohtoinen (vain hiukset): T-paita ja huppari",
    "teema": "50-ja-hopeanhohtoinen-vain-hiukset",
    "tuotteet": [
      "50-ja-hopeanhohtoinen-vain-hiukset-t-paita",
      "50-ja-hopeanhohtoinen-vain-hiukset-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "50-ja-paras-vasta-tulossa-t-paita-ja-huppari",
    "nimi": "50 ja paras vasta tulossa: T-paita ja huppari",
    "teema": "50-ja-paras-vasta-tulossa",
    "tuotteet": [
      "50-ja-paras-vasta-tulossa-t-paita",
      "50-ja-paras-vasta-tulossa-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "50-vuotta-nuori-t-paita-ja-huppari",
    "nimi": "50 vuotta nuori: T-paita ja huppari",
    "teema": "50-vuotta-nuori",
    "tuotteet": [
      "50-vuotta-nuori-t-paita",
      "50-vuotta-nuori-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "50v-puoli-vuosisataa-ei-naarmuakaan-t-paita-ja-huppari",
    "nimi": "50v, puoli vuosisataa, ei naarmuakaan: T-paita ja huppari",
    "teema": "50v-puoli-vuosisataa-ei-naarmuakaan",
    "tuotteet": [
      "50v-puoli-vuosisataa-ei-naarmuakaan-t-paita",
      "50v-puoli-vuosisataa-ei-naarmuakaan-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "60-vuotta-nuori-ja-nokkela-t-paita-ja-huppari",
    "nimi": "60 vuotta nuori ja nokkela: T-paita ja huppari",
    "teema": "60-vuotta-nuori-ja-nokkela",
    "tuotteet": [
      "60-vuotta-nuori-ja-nokkela-t-paita",
      "60-vuotta-nuori-ja-nokkela-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "60-vuotta-nuori-t-paita-ja-huppari",
    "nimi": "60 vuotta nuori: T-paita ja huppari",
    "teema": "60-vuotta-nuori",
    "tuotteet": [
      "60-vuotta-nuori-t-paita",
      "60-vuotta-nuori-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  },
  // Alennus pois käytöstä (2026-10-26): kate 5 %:n alennuksella -2,6 %, raja 30 %; vaatisi parin hinnaksi vähintään 111,00 € (nyt 74,80 €).
  {
    "slug": "60v-kokenut-ei-vanha-t-paita-ja-huppari",
    "nimi": "60v, kokenut, ei vanha: T-paita ja huppari",
    "teema": "60v-kokenut-ei-vanha",
    "tuotteet": [
      "60v-kokenut-ei-vanha-t-paita",
      "60v-kokenut-ei-vanha-huppari"
    ],
    "alennus_prosentti": 5,
    "kaytossa": false
  }
];

export default PAKETIT;
