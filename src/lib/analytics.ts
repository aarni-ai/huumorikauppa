// GA4 helper — uses the direct gtag.js snippet already loaded in index.html (G-8FJ58JNKGK).

type GtagFn = (...args: unknown[]) => void;
interface GAWindow {
  gtag?: GtagFn;
  dataLayer?: unknown[];
}

function sendEvent(name: string, params: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as GAWindow;
  const gtagType = typeof w.gtag;
  const hasDataLayer = !!w.dataLayer;
  try {
    // eslint-disable-next-line no-console
    console.log("GA event sent:", name, params);
  } catch { /* ignore */ }
  try {
    if (typeof w.gtag === "function") {
      w.gtag("event", name, params);
      return;
    }
    // eslint-disable-next-line no-console
    console.warn("GA event not sent: window.gtag missing", name, params);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("GA event failed:", name, error);
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
  sendEvent("add_to_cart", {
    currency: "EUR",
    value: +(item.price * item.quantity).toFixed(2),
    items: [item],
  });
}

export function trackBeginCheckout(items: GAItem[], value: number) {
  sendEvent("begin_checkout", {
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
  sendEvent("purchase", {
    transaction_id: params.transaction_id,
    value: +params.value.toFixed(2),
    currency: "EUR",
    items: params.items,
  });
}