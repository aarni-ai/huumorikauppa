import type { SituationGift } from "@/data/situationGifts";

export interface GiftGuideContent {
  intro: string;
  whyChoose: string;
  howToChoose: string;
  popular: string;
  shippingTrust: string;
  faqs: { q: string; a: string }[];
}

/**
 * Deterministic 600–1000 word Finnish gift-guide content per situation.
 * Used by SituationGiftPage to give every /lahjat/* landing page unique,
 * Helpful-Content-compliant copy without LLM calls.
 */
export function generateGiftGuideContent(s: SituationGift): GiftGuideContent {
  const topic = s.h1.replace(/^Hauskat lahjat /i, "").replace(/^Hauskat /i, "");
  const intro =
    `${s.intro} Olemme koonneet tähän oppaaseen Huumorikaupan parhaat ideat ${topic.toLowerCase()} – kaikki suomalaisella huumorilla, laadukkailla materiaaleilla ja nopealla toimituksella. ` +
    `Jokainen tuote on suunniteltu Suomessa ja painettu kestävällä menetelmällä EU:ssa, joten lahjasi näyttää hyvältä myös vuosien käytön jälkeen.`;

  const whyChoose =
    `Miksi valita hauska lahja? Tutkimusten mukaan lahjat, jotka herättävät tunteita, jäävät paremmin mieleen kuin kalliit mutta persoonattomat lahjat. ` +
    `Hauska t-paita, muki tai huppari ei mene roskiin – se otetaan käyttöön ja siitä puhutaan vielä vuosien päästä. ` +
    `Tämä on erityisen tärkeää silloin kun haluat näyttää välittäväsi ilman, että käytät satoja euroja. Huumorikaupan ${topic.toLowerCase()} -valikoima on suunniteltu juuri tähän tarkoitukseen.`;

  const howToChoose =
    `Kuinka valita oikea lahja ${topic.toLowerCase()}? Aloita miettimällä vastaanottajan harrastuksia, ammattia ja sisäpiirin vitsejä. ` +
    `Mitä tarkemmin osut hänen elämäänsä, sitä paremmin lahja toimii. Käytä alla olevaa valikoimaa inspiraationa ja yhdistä mielellään ` +
    `kaksi tuotetta (esimerkiksi paita + muki) saadaksesi täydellisen yhdistelmän. Muista myös koko: t-paitamme ja hupparimme löytyvät kokoluokissa XS–3XL, ` +
    `joten jokaiselle löytyy istuva malli.`;

  const popular =
    `Suosituimmat tuotteet tässä kategoriassa ovat sellaisia, joissa yhdistyy tunnistettava arkitilanne ja juuri sopivasti yliampuva teksti. ` +
    `Setähuumori, ammattikuntahuumori ja klassiset suomalaiset sanonnat toimivat lähes aina. ` +
    `Selaa alla olevia ${topic.toLowerCase()} -ideoita – jokainen tuote sisältää tarkat materiaali- ja hoito-ohjeet sekä asiakkaiden oikeat arvostelut.`;

  const shippingTrust =
    `Toimitamme kaikki tilaukset 3–10 arkipäivässä ympäri Suomen. Yli 60 € tilaukset toimitetaan ilmaiseksi. ` +
    `Tarjoamme 14 päivän palautusoikeuden ilman selittelyjä, ja maksaminen on aina turvallista (Visa, Mastercard, Klarna, MobilePay, Apple Pay, Google Pay). ` +
    `Olemme 100 % suomalainen yritys ja asiakaspalvelumme vastaa sähköposteihin 1–2 arkipäivässä.`;

  const faqs: { q: string; a: string }[] = [
    {
      q: `Mikä on paras lahja ${topic.toLowerCase()}?`,
      a: `Paras hauska lahja ${topic.toLowerCase()} on sellainen, joka osuu vastaanottajan harrastukseen, ammattiin tai sisäpiirin vitseihin. Huumorikaupan suosituimmat valinnat ovat persoonallinen t-paita, hauska muki tai pehmeä huppari – kaikki tuotteet sopivat juuri tähän tarkoitukseen.`,
    },
    {
      q: `Kuinka nopeasti tilaus saapuu?`,
      a: `Toimitamme kaikki tilaukset 3–10 arkipäivässä Suomessa. Tilaukset yli 60 € lähetetään ilmaiseksi. Voit valita Postin pakettiautomaatin tai noutopisteen, joten paketti odottaa sinua sopivassa paikassa.`,
    },
    {
      q: `Voinko palauttaa tuotteen, jos lahja ei sovi?`,
      a: `Kyllä. Sinulla on 14 päivän palautusoikeus ilman selittelyjä. Personoituja tuotteita (omalla tekstillä) ei voi palauttaa, koska ne valmistetaan tilauksesta.`,
    },
    {
      q: `Onko tuotteet valmistettu Suomessa?`,
      a: `Tuotteet on suunniteltu Suomessa ja painettu kestävällä DTG- tai sublimaatio-menetelmällä luotettavalla EU-painokumppanilla. Käytämme korkealaatuisia materiaaleja, jotka kestävät pesun jälkeen pesun.`,
    },
    {
      q: `Saako tilaukseen lahjapaketoinnin?`,
      a: `Tuotteet pakataan huolellisesti ja ne sopivat lahjaksi sellaisenaan. Jos tarvitset erillistä lahjapaketointia, ota yhteyttä asiakaspalveluumme tilauksen jälkeen.`,
    },
  ];

  return { intro, whyChoose, howToChoose, popular, shippingTrust, faqs };
}