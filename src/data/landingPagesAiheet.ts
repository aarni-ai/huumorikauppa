/**
 * Aihesivut /olut, /sauna ja /ammatit (2.11.2026): Coworkin kilpailijatutkimuksen suurimmat aukot. Uusi mallisto
 * (src/data/aukkomallisto2026.ts, 15 mallia kustakin aiheesta t-paitoina ja huppareina) näytetään ensin, sitten
 * samaan aiheeseen kuuluvat aiemmat tuotteet.
 *
 * /ammatit on ammattikohtainen kategoriasivu (valmiit mallit ammatin mukaan); /ammattipaidat kokoaa kaikki
 * ammattipaidat personoitavineen ja työpaikan yhteispaitoineen. Sivut linkittävät toisiinsa.
 *
 * Tekstisäännöt kuten landingPages.ts: ei ajatusviivoja, ei todistamattomia väitteitä, hinnat ja toimitus
 * konfiguraatiosta, joulun tilauspäivä apureista.
 */
import type { LandingPageDef, LandingProduct } from "./landingPages";
import { theme } from "./themes";
import { AMMATTI } from "./themes";
import { AUKOT_AMMATTI_SLUGIT, AUKOT_OLUT_SLUGIT, AUKOT_SAUNA_SLUGIT } from "./aukkomallisto2026";
import { jouluVastaus } from "./tilauspaivat";
import { HINTA } from "./hintatekstit";
import { TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_LAUSE } from "@/config/toimitus";

const joukko = (slugit: readonly string[]) => {
  const s = new Set(slugit);
  return (p: LandingProduct) => s.has(p.slug);
};

export const UUSI_OLUT = joukko(AUKOT_OLUT_SLUGIT);
export const UUSI_SAUNA = joukko(AUKOT_SAUNA_SLUGIT);
export const UUSI_AMMATTI = joukko(AUKOT_AMMATTI_SLUGIT);

/** Olut- ja kaljahuumori: uusi mallisto ja aiemmat (oispa kaljaa, alkoholivitsit). */
export const OLUT = (p: LandingProduct) =>
  UUSI_OLUT(p) || theme(/oluen ystävälle/, /oispa kaljaa/, /(?<![a-zåäö])(olut|oluen|kalja)/, /alkoholi/)(p);
/** Sauna, löylyt ja avanto: uusi mallisto ja aiemmat saunapaidat. */
export const SAUNA = (p: LandingProduct) =>
  UUSI_SAUNA(p) || theme(/saunojalle/, /sauna/, /löyly/, /avanto/, /kiuas/)(p);
/** Ammatit: uusi mallisto ja kaikki ammattipaidat. */
export const AMMATIT = (p: LandingProduct) => UUSI_AMMATTI(p) || AMMATTI(p);

const HINNAT = `Uudet t-paidat maksavat ${HINTA.tpaitaUniikki} ja hupparit alkaen ${HINTA.huppariAlkaen}. ${TOIMITUSMAKSU_LAUSE}`;
const KOOT = "T-paidat ovat unisex-mallia koot S-2XL ja hupparit S-3XL. Tummilla paidoilla teksti on valkoinen ja vaaleilla musta, joten teksti erottuu.";

export const AIHE_SIVUT: LandingPageDef[] = [
  {
    path: "/olut",
    name: "Olutpaidat",
    group: "tuotteet",
    title: "Olutpaidat ja kaljapaidat | Huumorikauppa",
    description: `Hauskat olut- ja kaljapaidat: Kaljakoppa on mittayksikkö, Saunakalja ei ole neuvoteltavissa ja muut oluthuumorin paidat. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Olutpaidat ja kaljapaidat",
    intro: [
      "Olutpaita on t-paita tai huppari, jonka vitsin tunnistaa jokainen, joka on joskus lähtenyt yhdelle: Piipahdan yhdelle. Palaan maanantaina, Kaljakoppa on mittayksikkö ja Lämmin olut on kesän suurin rikos.",
      "Mallistossa on 15 uutta oluthuumorin mallia kotipanimon panimomestarista laiturin kesäkaljaan ja saunakaljaan. Sivulla ovat myös aiemmat oispa kaljaa -paidat.",
      `Olutpaita sopii lahjaksi kaverille, veljelle, mökkiseuralle ja oluen harrastajalle. Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää.`,
    ],
    faqs: [
      { q: "Mikä on hauska lahja oluen ystävälle?", a: "T-paita oluthuumorilla, esimerkiksi Kotipanimon panimomestari. Ja ainoa maistaja, Ipa ei ole olut. Se on tunne tai Puolityhjä? Puolitäysi? Haen uuden." },
      { q: "Paljonko olutpaita maksaa?", a: HINNAT },
      { q: "Mikä paita sopii saunailtaan?", a: "Saunakalja ei ole neuvoteltavissa ja Olutta, koska vesi on löylyjä varten. Lisää saunapaitoja on sivulla saunapaidat." },
      { q: "Mitä kokoja ja värejä paidoissa on?", a: KOOT },
      { q: "Ehtiikö paita jouluksi?", a: jouluVastaus() },
    ],
    opas: [
      {
        otsikko: "Näin valitset olutpaidan",
        teksti: [
          "Hyvä olutpaita kertoo jotain kantajastaan. Kotioluen keittäjälle sopii Kotipanimon panimomestari. Ja ainoa maistaja, ja humalan ystävälle Ipa ei ole olut. Se on tunne. Molemmat vitsit avautuvat heti niille, jotka tietävät, mitä vierteen keittäminen tai humalointi tarkoittaa.",
          "Mökkiporukalle ja kesän laituri-iltoihin sopivat Mökkikalja on eri asia kuin kalja, Laituri. Kalja. Ei muuta ja Lämmin olut on kesän suurin rikos. Ne ovat paitoja ihmiselle, jonka kesäsuunnitelma mahtuu kolmeen sanaan.",
        ],
      },
      {
        otsikko: "Juhliin, kaveriporukkaan ja saunaan",
        teksti: [
          "Juhlien huoltopäällikölle on Kaljavahti. Tänään ei lopu kesken, ja perjantain odottajalle Viikonloppu alkaa ensimmäisestä korkista. Panttipullot ovat minun eläkesäästöni on lahja sille, jonka säästöt kilisevät kaapin perällä.",
          "Saunan ja oluen yhdistää kaksi mallia: Saunakalja ei ole neuvoteltavissa ja Olutta, koska vesi on löylyjä varten. Ne sopivat lauantain saunavuoron vaalijalle ja mökin isännälle.",
        ],
      },
      {
        otsikko: "T-paita vai huppari",
        teksti: [
          `Jokainen malli on saatavana sekä t-paitana että hupparina. T-paita maksaa ${HINTA.tpaitaUniikki}, ja kaksi t-paitaa saa yhdellä toimituksella, joka on silloin ilmainen. Huppari on lämmin valinta syksyn mökkireissuun ja talven pilkkiretkelle.`,
          "Jokainen paita painetaan tilauksesta EU:ssa, joten tuote tehdään juuri sinun tilaukseesi.",
        ],
      },
    ],
    related: ["/sauna", "/lahja-kaverille", "/lahjat/veljelle", "/hauskat-lahjat-miehelle", "/suomalainen-huumori-paidat", "/meemipaidat"],
    categories: ["t-paidat", "hupparit"],
    filter: OLUT,
    featured: UUSI_OLUT,
    maxTuotteita: 60,
  },
  {
    path: "/sauna",
    name: "Saunapaidat",
    group: "tuotteet",
    title: "Saunapaidat: hauskat paidat saunojalle | Huumorikauppa",
    description: `Hauskat saunapaidat ja lahjat saunojalle: Löylymestari, Vihta vai vasta? Riippuu murteesta ja muut saunahuumorin paidat. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Saunapaidat ja lahjat saunojalle",
    intro: [
      "Saunapaita on t-paita tai huppari saunojan huumorilla: Löylymestari. Vain yksi kauha lisää, Saunassa ei puhuta töistä. Ei muustakaan ja Kuka heitti tuon löylyn? Minä.",
      "Mallistossa on 15 uutta saunamallia lauantaisaunasta savusaunaan ja avantoon. Sivulla ovat myös aiemmat Löylyä lisää, Sauna lämpiää ja avantouijan paidat.",
      `Saunapaita sopii lahjaksi isälle, mökkeilijälle, avantouimarille ja taloyhtiön saunavuoron haltijalle. Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää.`,
    ],
    faqs: [
      { q: "Mikä on hauska lahja saunojalle?", a: "T-paita saunahuumorilla, esimerkiksi Löylymestari. Vain yksi kauha lisää, Sauna on suomalaisen terapeutti tai Saunavuoro on varattu. Aina." },
      { q: "Onko avantouimarille oma paita?", a: "On. Avanto. Sauna. Avanto. Sama uudestaan kertoo avantouinnin rytmin, ja aiempi avantouijan paita sopii talviuimarille." },
      { q: "Paljonko saunapaita maksaa?", a: HINNAT },
      { q: "Mitä kokoja ja värejä paidoissa on?", a: KOOT },
      { q: "Ehtiikö paita jouluksi?", a: jouluVastaus() },
    ],
    opas: [
      {
        otsikko: "Saunapaita saunojan tyypin mukaan",
        teksti: [
          "Löylyjen heittäjälle sopii Löylymestari. Vain yksi kauha lisää tai Kuka heitti tuon löylyn? Minä. Kuuman saunan ystävälle on 100 astetta. Hyvä alku, ja rauhalliselle saunojalle Kiuas kuumana. Pää kylmänä.",
          "Hiljaisen saunan ystävä tunnistaa itsensä paidasta Saunassa ei puhuta töistä. Ei muustakaan. Lauteiden puheenjohtajalle sopii Ylälauteilla syntyvät päätökset, ja kokeneelle saunojalle Saunominen on urheilua. Olen ammattilainen.",
        ],
      },
      {
        otsikko: "Mökille, taloyhtiöön ja savusaunaan",
        teksti: [
          "Mökkeilijälle on Mökkisauna hoitaa loput ja savusaunan ystävälle Savusaunan tuoksu on minun hajuveteni. Taloyhtiön vakiovuoron haltija saa paidan Saunavuoro on varattu. Aina, ja lauantain perinteiden vaalija paidan Lauantaisauna. Ei neuvotella.",
          "Vihta vai vasta? Riippuu murteesta sopii saunakeskustelun aloittajalle. Sama kysymys jakaa Suomen kahtia joka kesä, ja paita kertoo, että kantaja tietää sen.",
        ],
      },
      {
        otsikko: "Lahjaksi isälle ja saunaseuralle",
        teksti: [
          `Saunapaita on lahja isälle, appiukolle ja saunaseuran jäsenelle. Jokainen malli on saatavana t-paitana (${HINTA.tpaitaUniikki}) ja hupparina, joka on lämmin vaate saunan jälkeiseen iltaan kuistilla.`,
          "Kaksi paitaa samaan tilaukseen tuo ilmaisen toimituksen. Jokainen paita painetaan tilauksesta EU:ssa.",
        ],
      },
    ],
    related: ["/olut", "/lahjat/mokkeilijalle", "/isanpaivalahja", "/joululahja-isalle", "/suomalainen-huumori-paidat", "/lahja-kaverille"],
    categories: ["t-paidat", "hupparit"],
    filter: SAUNA,
    featured: UUSI_SAUNA,
    maxTuotteita: 60,
  },
  {
    path: "/ammatit",
    name: "Paidat ammatin mukaan",
    group: "tuotteet",
    title: "Hauskat paidat ammatin mukaan | Huumorikauppa",
    description: `Hauskat paidat ammatin mukaan: rakentaja, sähkömies, sairaanhoitaja, opettaja, kokki, IT-tuki, insinööri ja muut. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    h1: "Hauskat paidat ammatin mukaan",
    intro: [
      "Ammattipaita on t-paita tai huppari, jonka vitsi tulee työn arjesta: Rakentaja. Aikataulu on arvio, Sairaanhoitaja. Kahvi on ensiapua ja Opettaja. Kyllä, näin sen.",
      "Uudessa mallistossa on 15 ammattia: rakentaja, sähkömies, putkimies, sairaanhoitaja, lähihoitaja, opettaja, varhaiskasvattaja, kuski, rekkakuski, kokki, IT-tuki, insinööri, maanviljelijä, palomies ja poliisi. Paidoissa ei ole virallisia tunnuksia, vain työn huumoria.",
      "Kaikki ammattipaidat personoitavine malleineen ja työpaikan yhteispaitoineen ovat sivulla ammattipaidat.",
    ],
    faqs: [
      { q: "Mikä on hauska lahja työkaverille?", a: "Paita hänen omasta ammatistaan, esimerkiksi Kokki. Maistan vain varmuuden vuoksi tai Insinööri. Toimii teoriassa." },
      { q: "Onko opettajalle tai sairaanhoitajalle oma paita?", a: "On. Opettaja. Kyllä, näin sen, Sairaanhoitaja. Kahvi on ensiapua ja Lähihoitaja. Kiire on toinen nimeni." },
      { q: "Onko paidoissa poliisin tai pelastuslaitoksen tunnuksia?", a: "Ei. Poliisi- ja palomiespaidoissa on vain teksti, ei virallisia tunnuksia, logoja eikä univormun osia." },
      { q: "Voiko koko työpaikalle tilata samat paidat?", a: "Voi. Yritysten sivulla on määräalennus 10 paidasta ja oma logo tai teksti paitaan." },
      { q: "Paljonko ammattipaita maksaa?", a: HINNAT },
    ],
    opas: [
      {
        otsikko: "Rakentajat, asentajat ja maatila",
        teksti: [
          "Työmaalle sopivat Rakentaja. Aikataulu on arvio, Sähkömies. Tiedän, mikä johtaa mihinkin ja Putkimies. Näen asioita, joita et halua nähdä. Jokainen kuvaa työtä, jonka tulokset näkyvät ja jonka aikataulu elää.",
          "Maanviljelijälle on Maanviljelijä. Kesäloma on marraskuussa, joka kertoo, milloin tilalla on aikaa. Lisää maatilan paitoja on sivulla lahjat maanviljelijälle.",
        ],
      },
      {
        otsikko: "Hoitajat, opettajat ja varhaiskasvatus",
        teksti: [
          "Hoitoalalle ovat Sairaanhoitaja. Kahvi on ensiapua ja Lähihoitaja. Kiire on toinen nimeni. Opettajalle sopii Opettaja. Kyllä, näin sen, ja päiväkodin väelle Varhaiskasvattaja. Selviän välipalalla.",
          "Paidat ovat lahja valmistuneelle, työkaverille ja pitkän uran tehneelle. Taukohuoneessa vitsi aukeaa jokaiselle, joka tekee samaa työtä.",
        ],
      },
      {
        otsikko: "Kuljettajat, keittiö, IT ja turvallisuus",
        teksti: [
          "Kuljettajalle on Kuski. Ajan, koska muut eivät osaa ja rekkakuskille Rekkakuski. Minun toimistoni liikkuu. Keittiöön sopii Kokki. Maistan vain varmuuden vuoksi, IT-tukeen IT-tuki. Kokeilitko sammuttaa ja käynnistää? ja suunnittelijalle Insinööri. Toimii teoriassa.",
          "Palomies. Kuumat paikat ovat minun ja Poliisi vapaalla. Näen silti kaiken ovat vapaa-ajan paitoja ilman virallisia tunnuksia. Jokainen malli on saatavana t-paitana ja hupparina, ja jokainen paita painetaan tilauksesta EU:ssa.",
        ],
      },
    ],
    related: ["/ammattipaidat", "/lahjat/tyokaverille", "/joululahja-tyokaverille", "/lahjat/remontoijalle", "/lahjat/it-ihmiselle", "/lahjat/maanviljelijalle"],
    categories: ["t-paidat", "hupparit"],
    filter: AMMATIT,
    featured: UUSI_AMMATTI,
    maxTuotteita: 60,
  },
];
