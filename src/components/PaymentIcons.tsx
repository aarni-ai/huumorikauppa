import type { ComponentType } from "react";
import { MAKSUTAVAT, MAKSUTAVAN_NIMI, maksutavatTekstina, type Maksutapa } from "@/config/maksutavat";

/*
 * Maksutapakuvakkeet. Näytettävät maksutavat ovat yhdessä listassa src/config/maksutavat.ts (vastaa Stripe Checkoutin
 * käytössä olevia maksutapoja); kuvake piirretään vain listalla oleville. Teksti: PAYMENT_METHODS_TEXT samasta tiedostosta.
 */

export function VisaIcon({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" className={className} role="img" aria-label="Visa">
      <rect width="48" height="32" rx="4" fill="#fff" />
      <path d="M19.5 21.5h-3.2l2-12.3h3.2l-2 12.3z" fill="#00579F" />
      <path d="M32.3 9.4c-.6-.3-1.6-.5-2.9-.5-3.2 0-5.4 1.7-5.4 4.1 0 1.8 1.6 2.8 2.8 3.4 1.2.6 1.6 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.2 0-1.9-.2-2.9-.6l-.4-.2-.4 2.6c.7.3 2.1.6 3.5.6 3.4 0 5.6-1.7 5.6-4.2 0-1.4-.8-2.5-2.7-3.4-1.1-.6-1.8-.9-1.8-1.5 0-.5.6-1 1.8-1 1 0 1.8.2 2.4.5l.3.1.4-2.6z" fill="#00579F" />
      <path d="M37.3 9.2h-2.5c-.8 0-1.3.2-1.7 1l-4.7 11.3h3.4l.7-1.9h4.1l.4 1.9H40l-2.7-12.3zm-3.9 7.9l1.7-4.6.9 4.6h-2.6z" fill="#00579F" />
      <path d="M15.4 9.2l-3.1 8.4-.3-1.7c-.6-2-2.4-4.1-4.4-5.2l2.9 10.8h3.4l5.1-12.3h-3.6z" fill="#00579F" />
      <path d="M9.6 9.2H4.5l-.1.3c4 1 6.7 3.5 7.8 6.5l-1.1-5.7c-.2-.8-.8-1-1.5-1.1z" fill="#FAA61A" />
    </svg>
  );
}

export function MastercardIcon({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" className={className} role="img" aria-label="Mastercard">
      <rect width="48" height="32" rx="4" fill="#fff" />
      <circle cx="19" cy="16" r="9" fill="#EB001B" />
      <circle cx="29" cy="16" r="9" fill="#F79E1B" />
      <path d="M24 9.2a9 9 0 0 1 3.3 6.8A9 9 0 0 1 24 22.8a9 9 0 0 1-3.3-6.8A9 9 0 0 1 24 9.2z" fill="#FF5F00" />
    </svg>
  );
}

export function ApplePayIcon({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" className={className} role="img" aria-label="Apple Pay">
      <rect width="48" height="32" rx="4" fill="#000" />
      <path
        d="M13.6 11.3c.5-.6.8-1.4.7-2.2-.7 0-1.6.5-2.1 1.1-.5.5-.9 1.3-.8 2.1.8.1 1.6-.4 2.2-1zm.7 1.2c-1.2-.1-2.2.7-2.8.7-.6 0-1.4-.6-2.4-.6-1.2 0-2.3.7-3 1.8-1.3 2.2-.3 5.5.9 7.3.6.9 1.3 1.8 2.3 1.8.9 0 1.2-.6 2.3-.6s1.4.6 2.3.6c1 0 1.6-.9 2.2-1.8.7-1 1-2 1-2.1 0 0-1.9-.7-1.9-2.9 0-1.8 1.5-2.7 1.6-2.8-.9-1.3-2.3-1.4-2.5-1.4z"
        fill="#fff"
      />
      <text x="19" y="20.5" fill="#fff" fontFamily="-apple-system, Helvetica, Arial, sans-serif" fontSize="10" fontWeight="600">Pay</text>
    </svg>
  );
}

export function GooglePayIcon({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" className={className} role="img" aria-label="Google Pay">
      <rect width="48" height="32" rx="4" fill="#fff" />
      <path d="M18 16.2c0-.5 0-.9-.1-1.3h-5.7v2.5h3.3c-.1.8-.6 1.5-1.2 1.9v1.6h2c1.1-1.1 1.7-2.7 1.7-4.7z" fill="#4285F4" />
      <path d="M12.2 22.5c1.6 0 3-.5 4-1.5l-2-1.6c-.5.4-1.2.6-2 .6-1.6 0-2.9-1-3.3-2.4H6.8v1.6c1 2 3.1 3.3 5.4 3.3z" fill="#34A853" />
      <path d="M8.9 17.6c-.2-.7-.2-1.5 0-2.2v-1.6H6.8a6 6 0 0 0 0 5.4l2.1-1.6z" fill="#FBBC04" />
      <path d="M12.2 12.6c.9 0 1.7.3 2.3.9l1.7-1.7c-1.1-1-2.5-1.6-4-1.6-2.3 0-4.4 1.3-5.4 3.3l2.1 1.6c.4-1.4 1.7-2.5 3.3-2.5z" fill="#EA4335" />
      <text x="20.5" y="20.5" fill="#5F6368" fontFamily="Arial, Helvetica, sans-serif" fontSize="10" fontWeight="500">Pay</text>
    </svg>
  );
}

export function KlarnaIcon({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" className={className} role="img" aria-label="Klarna">
      <rect width="48" height="32" rx="4" fill="#FFB3C7" />
      <text x="24" y="20" textAnchor="middle" fill="#0B051D" fontFamily="Arial, Helvetica, sans-serif" fontSize="10.5" fontWeight="700">Klarna</text>
    </svg>
  );
}

export function MobilePayIcon({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" className={className} role="img" aria-label="MobilePay">
      <rect width="48" height="32" rx="4" fill="#5A78FF" />
      <text x="24" y="19.5" textAnchor="middle" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="8" fontWeight="700">MobilePay</text>
    </svg>
  );
}

const KUVAKKEET: Record<Maksutapa, ComponentType<{ className?: string }>> = {
  visa: VisaIcon,
  mastercard: MastercardIcon,
  "apple-pay": ApplePayIcon,
  "google-pay": GooglePayIcon,
  klarna: KlarnaIcon,
  mobilepay: MobilePayIcon,
};

/** Maksutapojen kuvakkeet rivissä (src/config/maksutavat.ts). Rivitys sallittu kapealla näytöllä. */
export function PaymentIcons({
  className = "",
  iconClassName,
  tavat = MAKSUTAVAT,
}: {
  className?: string;
  iconClassName?: string;
  tavat?: readonly Maksutapa[];
}) {
  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`} aria-label={`Maksutavat: ${maksutavatTekstina(tavat)}`}>
      {tavat.map((t) => {
        const Kuvake = KUVAKKEET[t];
        return (
          <li key={t} className="bg-white border border-border rounded-md px-1.5 py-1 flex items-center" title={MAKSUTAVAN_NIMI[t]}>
            <Kuvake className={iconClassName} />
          </li>
        );
      })}
    </ul>
  );
}
