/**
 * Sivujen UKK-sisällöt. Yhteinen lähde React-sivuille ja build-vaiheen esirenderöinnille
 * (scripts/prerender.mjs), jotta staattinen HTML ja selaimessa näkyvä sivu pysyvät samoina.
 */
export interface FaqItem {
  q: string;
  a: string;
}

/** /usein-kysytyt-kysymykset */
export const SITE_FAQS: FaqItem[] = [
  {
    q: "Kuinka nopeasti tilaus toimitetaan?",
    a: "Toimitamme tilaukset PostNordin kautta. Toimitusaika on tyypillisesti 3–10 arkipäivää tilauksesta. Saat sähköpostiisi toimitusseurantakoodin kun paketti on lähetetty."
  },
  {
    q: "Onko toimitus ilmainen?",
    a: "Toimitus on ilmainen yli 79 euron tilauksille. Alle 79 euron tilauksille toimitusmaksu on 6,90 €."
  },
  {
    q: "Miten palautusoikeus toimii?",
    a: "Sinulla on 14 päivää aikaa palauttaa tuotteet ilman syytä. Palautuskulut ovat asiakkaan vastuulla. Rahat palautetaan 5–7 arkipäivässä."
  },
  {
    q: "Mitä maksutapoja teillä on?",
    a: "Hyväksymme Visa, Mastercard, Apple Pay, Google Pay ja Klarna. Klarnalla voit ostaa nyt ja maksaa myöhemmin."
  },
  {
    q: "Voinko tilata ilman tiliä?",
    a: "Kyllä, voit tilata vieraana ilman rekisteröitymistä."
  },
  {
    q: "Toimittaako Huumorikauppa ulkomaille?",
    a: "Tällä hetkellä toimitamme vain Suomeen, mukaan lukien Ahvenanmaa."
  },
  {
    q: "Miten otan yhteyttä asiakaspalveluun?",
    a: "Tavoitat meidät sähköpostilla huumorikauppa@gmail.com. Vastaamme 1–2 arkipäivässä."
  },
  {
    q: "Ovatko tuotteet suomalaista käsialaa?",
    a: "Kaikki designit ovat suomalaista käsialaa. Huumorikauppa on 100% suomalainen verkkokauppa, joka toimii Helsingistä."
  },
  {
    q: "Sopiiko tuote lahjaksi?",
    a: "Ehdottomasti. Monet tuotteemme on merkitty 'Lahjaidea'-badgella ja sopivat lahjaksi syntymäpäiviin, jouluun, polttareihin, valmistujaisiin, eläkejuhliin ja työkavereille."
  },
  {
    q: "Miten tiedän mikä koko sopii?",
    a: "Jokaisella vaatetuotesivulla on koko-opas senttimetreinä. Jos olet epävarma, suosittelemme tilaamaan yhden koon isomman."
  },
  {
    q: "Teettekö custom-painatuksia?",
    a: "Kyllä! Teemme custom-painatuksia paitoihin, huppareihin ja mukeihin. Ota yhteyttä sähköpostilla (huumorikauppa@gmail.com) ja kerro mitä haluat – suunnitellaan yhdessä!"
  },
  {
    q: "Mikä on Huumorikauppa?",
    a: "Huumorikauppa on suomalainen verkkokauppa, joka myy hauskoja t-paitoja, huppareita, mukeja, tarroja, kangaskasseja ja muita huumorituotteita. Designit suunnitellaan Suomessa ja jokainen tuote painetaan tilauksesta."
  },
  {
    q: "Mistä Huumorikaupan tuotteet painetaan?",
    a: "Tuotteet painetaan tilauksesta print-on-demand-menetelmällä, joten ylituotantoa ei synny. Painopalvelu on EU-alueelta ja täyttää eurooppalaiset laatuvaatimukset."
  },
  {
    q: "Millaiset materiaalit tuotteissa on käytössä?",
    a: "T-paidat ja hupparit ovat 100 % puuvillaa tai puuvilla–polyesteri-sekoitteita. Mukit ovat keraamisia, tarrat säänkestävää vinyyliä ja kangaskassit kestävää puuvillaa."
  },
  {
    q: "Mikä on hauska lahja miehelle?",
    a: "Suosituimmat hauskat lahjat miehelle ovat huumorit-paidat, isänpäivä- ja syntymäpäivähupparit, kahvimukit toimistoon ja meemiaiheiset tarrat. Katso valikoima kategoriasta /hauskat-lahjat-miehelle."
  },
  {
    q: "Mikä on hauska lahja naiselle?",
    a: "Naisille suosituimpia ovat hauskat tekstihupparit, kahvimukit, kangaskassit ja meemipaidat. Katso lahjaideoita kategoriasta /hauskat-lahjat-naiselle."
  },
  {
    q: "Mitkä ovat parhaat lahjat työkaverille?",
    a: "Toimistolahjoiksi sopivat hauskat kahvimukit, työpaikkahuumoria sisältävät t-paidat ja toimistotarrat. Suositut tuotteet löytyvät /lahja-tyokaverille-sivulta."
  },
  {
    q: "Onko teillä polttarilahjoja?",
    a: "Kyllä – polttareihin sopivat hauskat ryhmäpaidat ja personoidut hupparit. Katso /polttari-lahjat-kategoria tai pyydä custom-printti sähköpostilla."
  },
  {
    q: "Miten löydän lahjan ihmiselle, jolla on jo kaikkea?",
    a: "Hauska lahja toimii silloin kun mikään muu ei tunnu sopivalta. Suosittelemme henkilön persoonaan sopivaa huumoripaitaa, mukia tai tekstitaulua – kategoriasta /lahjaideat-jolla-jo-kaikkea löydät listan testattuja vinkkejä."
  },
  {
    q: "Voiko tilauksen noutaa?",
    a: "Emme tarjoa noutoa tällä hetkellä. Kaikki tilaukset toimitetaan PostNordin kautta lähimpään pakettiautomaattiin tai Postin pisteeseen Suomessa."
  },
  {
    q: "Miten alennuskoodi käytetään?",
    a: "Syötä alennuskoodi (esim. HUUMORI10) ostoskorin Yhteenveto-osioon ennen kassalle siirtymistä. Alennus näkyy heti loppusummassa."
  },
  {
    q: "Voinko vaihtaa väärän koon?",
    a: "Kyllä. Lähetä tuote takaisin 30 päivän sisällä ja tilaa uusi koko erillisellä tilauksella – näin saat sen nopeammin kuin vaihdolla."
  },
  {
    q: "Säilyvätkö painatukset pesussa?",
    a: "Kyllä. Painatukset on tehty kestopainomenetelmällä, ja oikein hoidettuna (käännä nurin ennen pesua, max 40 °C, ei kuivurin korkeinta lämpöä) ne säilyvät vuosia ennallaan."
  },
  {
    q: "Onko tuotteet eettisesti tuotettu?",
    a: "Käyttämämme tukkutoimittajat (mm. Stanley/Stella ja Bella+Canvas) on sertifioitu Fair Wear- tai vastaavilla työehtosertifikaateilla. Print-on-demand-tuotanto vähentää myös ylituotantoa ja jätettä."
  },
  {
    q: "Tarjoatteko yrityslahjoja tai tukkuhintoja?",
    a: "Kyllä, teemme yrityslahjoja, kausituotteita ja tiimipaitoja. Pyydä tarjous: huumorikauppa@gmail.com – kerro määrä, tuote ja toivottu painatus."
  },
];

/** Etusivun "Usein kysyttyä" -osio. */
export const HOME_FAQS: FaqItem[] = [
  { q: "Mikä on Huumorikauppa?", a: "Huumorikauppa on suomalainen verkkokauppa, joka myy hauskoja t-paitoja, huppareita, mukeja, tarroja ja muita huumorituotteita. Designit suunnitellaan Suomessa ja jokainen tuote painetaan tilauksesta." },
  { q: "Kuinka nopeasti tilaus toimitetaan?", a: "Toimitamme tilaukset PostNordin kautta. Toimitusaika on tyypillisesti 3–10 arkipäivää. Saat sähköpostiisi seurantakoodin kun paketti on lähetetty." },
  { q: "Mikä on hauska lahja miehelle?", a: "Suosituimmat hauskat lahjat miehelle ovat huumorit-paidat, hupparit, kahvimukit ja meemitarrat. Katso valikoima kategoriasta hauskat lahjat miehelle." },
  { q: "Mikä on hauska lahja naiselle?", a: "Naisille suosituimpia ovat hauskat tekstihupparit, kahvimukit, kangaskassit ja meemipaidat. Katso lahjaideoita kategoriasta hauskat lahjat naiselle." },
  { q: "Onko toimitus ilmainen?", a: "Toimitus on ilmainen yli 79 euron tilauksille. Alle 79 euron tilauksille toimitusmaksu on 6,90 €." },
];

/** Blogiartikkelin oletus-UKK, kun artikkelilla ei ole omaa. */
export const DEFAULT_BLOG_FAQS: FaqItem[] = [
  {
    q: "Mistä löydän hauskoja lahjaideoita?",
    a: "Huumorikauppa.fi tarjoaa yli 200 hauskaa lahjaa: t-paitoja, huppareita, mukeja, tarroja ja sisustustuotteita. Selaa kategorioita tai lue muita blogiartikkeleita lisävinkkejä varten.",
  },
  {
    q: "Kuinka nopeasti tilaus toimitetaan?",
    a: "Toimitamme tilaukset koko Suomeen yleensä 3–10 arkipäivässä. Yli 79 € tilauksiin toimitus on ilmainen.",
  },
  {
    q: "Voinko palauttaa tuotteen?",
    a: "Kyllä. Tuotteilla on 14 päivän palautusoikeus. Personoituja tuotteita ei kuitenkaan voi palauttaa.",
  },
  {
    q: "Onko Huumorikauppa suomalainen yritys?",
    a: "Kyllä, Huumorikauppa.fi on 100 % suomalainen verkkokauppa. Asiakaspalvelu toimii suomeksi.",
  },
];

/** Kategoriasivun (/kategoria/:slug) UKK. */
export function buildCategoryFaqs(categoryName: string): FaqItem[] {
  const lower = categoryName.toLowerCase();
  return [
    {
      q: `Kuinka nopeasti ${lower} toimitetaan?`,
      a: "Toimitamme tilaukset 3–10 arkipäivässä koko Suomeen PostNordin kautta. Ilmainen toimitus yli 79 € tilauksiin. Saat sähköpostiisi seurantakoodin heti kun paketti lähtee.",
    },
    {
      q: `Voiko ${lower} palauttaa?`,
      a: "Kyllä. Sinulla on 14 päivää aikaa palauttaa tuotteet ilman syytä. Palautus tapahtuu omalla kustannuksellasi. Rahat palautetaan 5–7 arkipäivässä.",
    },
    {
      q: `Sopiiko hauska ${lower.replace(/t$/, "")} lahjaksi?`,
      a: `Ehdottomasti. Hauskat ${lower} ovat suosittuja lahjoja syntymäpäiviin, jouluun, isänpäivään, äitienpäivään, polttareihin, valmistujaisiin ja työkavereille.`,
    },
    {
      q: `Minkälaisesta materiaalista ${lower} ovat tehty?`,
      a: "Käytämme laadukkaita materiaaleja — t-paidat ja hupparit 100% puuvillaa tai puuvilla-polyesteri-sekoitteita, mukit keraamia, tarrat kestävää vinyyliä. Kaikki painatetaan EU:ssa.",
    },
    {
      q: `Saako ${lower} omalla tekstillä?`,
      a: "Kyllä! Osasta tuotteitamme löytyy custom-vaihtoehto, johon voit kirjoittaa oman tekstin. Lisäksi teemme custom-painatuksia tilauksesta — ota yhteyttä huumorikauppa@gmail.com.",
    },
    {
      q: "Voiko maksaa Klarnalla tai Apple Paylla?",
      a: "Kyllä. Hyväksymme Visa, Mastercard, Apple Pay, Google Pay ja Klarna. Klarnalla voit myös ostaa nyt ja maksaa myöhemmin.",
    },
  ];
}

/** Lahjasivun (GiftCategoryPage) UKK. */
export function buildGiftCategoryFaqs(name: string, productCount: number): FaqItem[] {
  return [
    {
      q: `Mikä on paras ${name.toLowerCase()}?`,
      a: `Suosituimpia ${name.toLowerCase()} ovat hauskat t-paidat, hupparit ja mukit persoonallisilla teksteillä. Huumorikaupasta löydät ${productCount}+ vaihtoehtoa eri budjettiin.`,
    },
    {
      q: "Kuinka nopeasti tilaus toimitetaan?",
      a: "Toimitamme tilaukset 3–10 arkipäivässä koko Suomeen. Yli 79 € tilauksiin toimitus on ilmainen, ja kaikilla tuotteilla on 14 päivän palautusoikeus.",
    },
    {
      q: "Mihin tilaisuuteen lahja sopii?",
      a: `${name} sopivat syntymäpäiviin, jouluun, äitienpäivään, isänpäivään, polttareihin, eläkejuhliin ja työkavereiden lahjoiksi. Hauska lahja on aina yllättävä ja mieleenpainuva.`,
    },
    {
      q: "Voiko lahjan palauttaa jos se ei sovi?",
      a: "Kyllä. Sinulla on 14 päivän palautusoikeus kaikkiin tuotteisiin. Palautus on helppo: ota yhteyttä huumorikauppa@gmail.com ja saat ohjeet.",
    },
  ];
}

const SITUATION_EXTRA_FAQS: FaqItem[] = [
  { q: "Voiko lahjan saada nimettömänä?", a: "Kyllä – emme lähetä lähettäjän tietoja paketin mukana, joten yllätyslahja pysyy yllätyksenä." },
  { q: "Mitä jos koko on väärä?", a: "Vaihdamme tai palautamme tuotteen 14 päivän sisällä – pidä alkuperäinen pakkaus mukana." },
  { q: "Soveltuuko tämä lahjaksi viime hetkellä?", a: "Tilaa arkena ennen klo 12, niin tilaus lähtee yleensä samana päivänä. Toimitus 3–10 arkipäivää." },
];

/** Tilannelahjasivu (/lahjat/:slug): täydennetään UKK viiteen kysymykseen. */
export function mergeSituationFaqs(guideFaqs: FaqItem[]): FaqItem[] {
  return guideFaqs.length < 5
    ? [...guideFaqs, ...SITUATION_EXTRA_FAQS.slice(0, 5 - guideFaqs.length)]
    : guideFaqs;
}

/** Tuotesivun UKK ja "kenelle / mihin / miksi" -tekstit (ProductPage + esirenderöinti). */
export function buildProductFaqs(
  product: { name: string; description?: string | null; category: string },
  categoryName: string,
): { faqs: FaqItem[]; audience: string; occasion: string; whyFunny: string } {
  const productFaqs = [
    { q: "Onko tämä hyvä lahja?", a: `${product.name} on erinomainen lahja syntymäpäiviin, jouluksi tai ihan vaan piristykseksi. Hauskuus taattu!` },
    { q: "Kuinka nopeasti saan tilauksen?", a: "Toimitamme 3–10 arkipäivässä koko Suomeen. Yli 79 € tilaukset toimitetaan ilmaiseksi." },
    { q: "Voinko palauttaa tuotteen?", a: "Kyllä! Sinulla on 14 päivän palautusoikeus." },
  ];

  // GEO/AI: heuristinen "Kenelle sopii / Miksi hauska / Mihin tilanteeseen"
  const _t = (product.name + " " + (product.description ?? "")).toLowerCase();
  const audience = (() => {
    if (_t.includes("äiti") || _t.includes("mamma") || _t.includes("mummi")) return "äidille, mummille tai anopille — kenelle tahansa elämäsi tärkeälle naiselle";
    if (_t.includes("isä") || _t.includes("iskä") || _t.includes("ukki")) return "isälle, ukille tai sedälle — miehelle joka rakastaa sopivan ronskia huumoria";
    if (_t.includes("kala")) return "kalastusta harrastavalle isälle, sedälle tai kaverille";
    if (_t.includes("eläke") || _t.includes("museo")) return "eläkkeelle jäävälle työkaverille tai juuri eläköityneelle läheiselle";
    if (_t.includes("polttari") || _t.includes("morsian") || _t.includes("sulhanen")) return "polttariporukalle, morsiamelle tai sulhaselle";
    if (_t.includes("vauva") || product.category === "bodyt") return "vauvalle ja vanhemmille — turvallinen ja söpö lahja";
    if (product.category === "mukit") return "kahvinjuojalle, työkaverille tai itsellesi aamukahvia varten";
    return "kaverille, perheenjäsenelle tai työkaverille — tai vaikka itsellesi";
  })();
  const occasion = (() => {
    if (_t.includes("äiti")) return "äitienpäivään, äidin syntymäpäiviin ja ihan vaan kiitokseksi";
    if (_t.includes("isä")) return "isänpäivään, isän syntymäpäiviin ja jouluksi";
    if (_t.includes("eläke")) return "eläkejuhliin ja läksiäisiin";
    if (_t.includes("polttari")) return "polttareihin ja häihin";
    if (_t.includes("joulu")) return "jouluksi, pikkujouluihin ja kalenterin täytteeksi";
    if (product.category === "bodyt") return "vauvanristiäisiin, ristiäislahjaksi ja vauvanpäiville";
    return "syntymäpäiviin, jouluun, pikkujouluihin ja yllätyslahjaksi";
  })();
  const whyFunny = `${product.name} on hauska, koska se yhdistää tutun arkitilanteen ja yllättävän tekstin — juuri sellaisen lahjan, joka jää muistiin pidemmäksi aikaa kuin tavallinen lahja.`;

  // Kasvatetaan FAQ:t AI-vastauksia varten
  const faqs: FaqItem[] = [
    ...productFaqs,
    { q: "Kenelle tämä tuote sopii?", a: `Tämä ${categoryName.toLowerCase().replace(/t$/, "")} sopii ${audience}.` },
    { q: "Mihin tilanteeseen tämä on hyvä lahja?", a: `${product.name} sopii ${occasion}.` },
    { q: "Miksi tämä on hauska lahja?", a: whyFunny },
  ];

  return { faqs, audience, occasion, whyFunny };
}
