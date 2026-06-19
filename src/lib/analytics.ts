// GA4 helper — uses the gtag already loaded in index.html (G-8FJ58JNKGK).
// All calls are safe no-ops if gtag is not available (SSR, prerender, blocked).

type GtagFn = (...args: unknown[]) => void;

function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: GtagFn };
  if (typeof w.gtag === "function") {
    w.gtag(...args);
  }
}

export interface GAItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_variant?: string;
  item_category?: string;
}

export function trackAddToCart(item: GAItem) {
  gtag("event", "add_to_cart", {
    currency: "EUR",
    value: +(item.price * item.quantity).toFixed(2),
    items: [item],
  });
}

export function trackBeginCheckout(items: GAItem[], value: number) {
  gtag("event", "begin_checkout", {
    currency: "EUR",
    value: +value.toFixed(2),
    items,
  });
}

const PURCHASE_KEY = "huumorikauppa-ga-purchase";

export function trackPurchaseOnce(params: {
  transaction_id: string;
  value: number;
  items: GAItem[];
}) {
  if (typeof window === "undefined") return;
  if (!params.transaction_id) return;
  try {
    const sent = JSON.parse(localStorage.getItem(PURCHASE_KEY) || "[]") as string[];
    if (sent.includes(params.transaction_id)) return;
    sent.push(params.transaction_id);
    // Cap stored ids to avoid unbounded growth
    const trimmed = sent.slice(-50);
    localStorage.setItem(PURCHASE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore — still send the event
  }
  gtag("event", "purchase", {
    transaction_id: params.transaction_id,
    value: +params.value.toFixed(2),
    currency: "EUR",
    items: params.items,
  });
}