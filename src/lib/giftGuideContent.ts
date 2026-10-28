import type { SituationGift } from "@/data/situationGifts";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "@/config/toimitus";
import { jouluLause } from "@/data/tilauspaivat";

export interface GiftGuideContent {
  intro: string;
  whyChoose: string;
  howToChoose: string;
  popular: string;
  shippingTrust: string;
  faqs: { q: string; a: string }[];
}

/**
 * Deterministic Finnish gift-guide content per situation.
 * Used by SituationGiftPage to give every /lahjat/* landing page unique,
 * Helpful-Content-compliant copy without LLM calls.
 */
export function generateGiftGuideContent(s: SituationGift): GiftGuideContent {
  const topic = s.h1.replace(/^Hauskat lahjat /i, "").replace(/^Hauskat /i, "");
  const t = topic.toLowerCase();
  const intro =
    `${s.intro} Tähän oppaaseen on koottu Huumorikaupan ideoita ${t}, kaikki suomalaisella huumorilla. ` +
    `Jokainen tuote painetaan tilauksesta ja toimitetaan koko Suomeen ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`;

  const whyChoose =
    `Miksi valita hauska lahja? Lahja, joka naurattaa, jää mieleen paremmin kuin persoonaton tavara. ` +
    `Hauska t-paita tai huppari otetaan käyttöön, ja sen teksti herättää keskustelua vielä juhlien jälkeenkin. ` +
    `Näin voit näyttää välittäväsi ilman, että käytät satoja euroja.`;

  const howToChoose =
    `Kuinka valita oikea lahja ${t}? Aloita miettimällä vastaanottajan harrastuksia, ammattia ja sisäpiirin vitsejä. ` +
    `Mitä tarkemmin osut hänen elämäänsä, sitä paremmin lahja toimii. Jos mikään valmis teksti ei osu, valitse personoitava tuote ja kirjoita oma teksti. ` +
    `Muista myös koko: tuotesivun kokoavussa näet saatavilla olevat koot ja ohjeen mittojen ottamiseen.`;

  const popular =
    `Toimivimmissa teksteissä yhdistyy tunnistettava arkitilanne ja juuri sopivasti yliampuva sanavalinta. ` +
    `Setähuumori, ammattikuntahuumori ja tutut suomalaiset sanonnat ovat hyviä lähtökohtia. ` +
    `Selaa alla olevia ideoita: jokaisen tuotteen sivulla on materiaali-, koko- ja hoitotiedot.`;

  const shippingTrust =
    `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta, ja paketti kulkee Postin tai Matkahuollon kautta. Toimitus maksaa ${TOIMITUSMAKSU_TEKSTI} €, ja ${ILMAINEN_RAJA_TEKSTI} euron tilauksista alkaen se on ilmainen. ` +
    `Sinulla on 14 päivän peruutusoikeus, ja voit maksaa Visalla, Mastercardilla, Apple Paylla, Google Paylla, Klarnalla ja MobilePaylla. ` +
    `Asiakaspalvelu vastaa sähköposteihin 1-2 arkipäivässä.`;

  const faqs: { q: string; a: string }[] = [
    {
      q: `Mikä on hyvä lahja ${t}?`,
      a: `Hyvä hauska lahja ${t} osuu vastaanottajan harrastukseen, ammattiin tai sisäpiirin vitseihin. Valikoimassa on t-paitoja ja huppareita valmiilla teksteillä sekä personoitavia tuotteita omalle tekstille.`,
    },
    {
      q: `Kuinka nopeasti tilaus saapuu?`,
      a: `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta. Toimitus maksaa ${TOIMITUSMAKSU_TEKSTI} €, ja ${ILMAINEN_RAJA_TEKSTI} euron tilauksista alkaen se on ilmainen. ${jouluLause()}`,
    },
    {
      q: `Voinko palauttaa tuotteen, jos lahja ei sovi?`,
      a: `Voit: sinulla on 14 päivän peruutusoikeus tuotteen vastaanottamisesta. Personoituja tuotteita (omalla tekstillä) peruutusoikeus ei koske, koska ne valmistetaan asiakkaan toiveiden mukaan.`,
    },
    {
      q: `Missä tuotteet painetaan?`,
      a: `Tuotteet painetaan tilauksesta painokumppaneiden painotaloissa ulkomailla, ei Suomessa. Materiaali ja hoito-ohje on kerrottu jokaisen tuotteen kuvauksessa.`,
    },
    {
      q: `Voiko lahjan lähettää suoraan saajalle?`,
      a: `Voi: valitse kassalla "Toimitetaan eri vastaanottajalle kuin maksaja" ja kirjoita vastaanottajan nimi ja osoite. Erillistä lahjapaketointia ei ole.`,
    },
  ];

  return { intro, whyChoose, howToChoose, popular, shippingTrust, faqs };
}