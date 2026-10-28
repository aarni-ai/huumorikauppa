/**
 * Uutiskirjelaatikon kuori (NewsletterBox.tsx). Erillään komponentista, jotta laiskan latauksen varapaikka
 * (NewsletterBoxLazy.tsx) varaa saman korkeuden ilman, että lomakkeen koodi tulee pääpakettiin.
 */
export const UUTISKIRJE_OTSIKKO = "Saat ensimmäisenä uudet hauskat paidat ja joulun takarajat";
export const UUTISKIRJE_TEKSTI =
  "Tilaa Huumorikaupan uutiskirje. Kerromme sähköpostilla uusista tuotteista ja siitä, mihin mennessä joululahjat pitää tilata.";
/** Varattu vähimmäiskorkeus: sama lomakkeelle, kiitosviestille ja latauksen varapaikalle. */
export const UUTISKIRJE_LAATIKKO_LUOKKA =
  "bg-card border border-border rounded-2xl p-6 md:p-8 text-center max-w-xl mx-auto min-h-[300px] sm:min-h-[260px]";
