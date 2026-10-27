/**
 * Maksutavat, joiden kuvakkeet näytetään (tuotesivu, ostoskori, kassa, alatunniste). AINOA paikka: lisää tai poista
 * maksutapa tästä listasta, kun Stripen asetukset muuttuvat.
 *
 * Kassa (api/checkout.js) luo Stripe Checkoutin ilman payment_method_types-listaa, joten Stripe näyttää tilin
 * oletusmaksutapamäärityksen maksutavat. Tarkistettu Stripen API:sta 28.10.2026 (payment_method_configurations,
 * oletusmääritys): card, apple_pay, google_pay, klarna, mobilepay ja link ovat käytössä. Apple Pay ja Google Pay
 * näkyvät Stripen maksusivulla laitteilla, jotka tukevat niitä.
 */
export const MAKSUTAVAT = ["visa", "mastercard", "apple-pay", "google-pay", "klarna", "mobilepay"] as const;

export type Maksutapa = (typeof MAKSUTAVAT)[number];

export const MAKSUTAVAN_NIMI: Record<Maksutapa, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  "apple-pay": "Apple Pay",
  "google-pay": "Google Pay",
  klarna: "Klarna",
  mobilepay: "MobilePay",
};

/** "Visa, Mastercard, Apple Pay, Google Pay, Klarna ja MobilePay" (listan järjestyksessä) */
export function maksutavatTekstina(tavat: readonly Maksutapa[] = MAKSUTAVAT): string {
  const nimet = tavat.map((t) => MAKSUTAVAN_NIMI[t]);
  return nimet.length <= 1 ? nimet.join("") : `${nimet.slice(0, -1).join(", ")} ja ${nimet[nimet.length - 1]}`;
}

/** Maksutavat tekstinä (alatunniste, kassa). */
export const PAYMENT_METHODS_TEXT = maksutavatTekstina();
