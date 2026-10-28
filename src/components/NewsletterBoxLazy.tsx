import { lazy, Suspense } from "react";
import { UUTISKIRJE_LAATIKKO_LUOKKA } from "./newsletterBoxShell";

const NewsletterBox = lazy(() => import("./NewsletterBox"));

/** Uutiskirjelaatikko laiskasti (sivun alaosassa). Varapaikka varaa saman korkeuden, joten asettelu ei siirry. */
export function NewsletterBoxLazy({ lahde }: { lahde: string }) {
  return (
    <Suspense fallback={<div aria-hidden="true" className={UUTISKIRJE_LAATIKKO_LUOKKA} />}>
      <NewsletterBox lahde={lahde} />
    </Suspense>
  );
}
