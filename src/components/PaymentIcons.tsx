/**
 * Maksutapakuvakkeet. Näytetään vain maksutavat, jotka kassa varmasti tukee: kassa
 * (supabase/functions/create-checkout) luo Stripe Checkoutin ilman payment_method_types-listaa,
 * joten taattuja ovat vain korttimaksut. Toimitusehdot (Terms.tsx) nimeävät Visan ja Mastercardin.
 * Älä lisää Klarnaa, MobilePayta, Apple Payta tai Google Payta ennen kuin kassan koodi takaa ne.
 */
export const PAYMENT_METHODS_TEXT = "Visa ja Mastercard";

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

/** Visa- ja Mastercard-kuvakkeet rivissä. */
export function PaymentIcons({ className = "", iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="bg-white border border-border rounded-md px-1.5 py-1 flex items-center">
        <VisaIcon className={iconClassName} />
      </span>
      <span className="bg-white border border-border rounded-md px-1.5 py-1 flex items-center">
        <MastercardIcon className={iconClassName} />
      </span>
    </div>
  );
}
