// GA4 helper: gtag-funktio määritellään index.html:ssä (Consent Mode v2). gtag.js (G-8FJ58JNKGK) ladataan
// vasta analytiikkasuostumuksen jälkeen, ja tapahtumat lähetetään vain suostumuksella (src/lib/consent.ts).
import { CONSENT_CHANGED_EVENT, hasAnalyticsConsent } from "./consent";
// Oma suppilo kirjataan suostumuksesta riippumatta (koostemäärä ilman tunnisteita, src/lib/suppilo.ts).
import { kirjaaVaihe } from "./suppilo";
import { kirjaaToimitustesti } from "./toimitustesti";
import { kirjaaEnsitilaustesti } from "./ensitilaus";

type GtagFn = (...args: unknown[]) => void;
interface GAWindow {
  gtag?: GtagFn;
  dataLayer?: unknown[];
}

function sendEvent(name: string, params: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;
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

/**
 * Ostosuppilo GA4:ssä: view_item (tuotesivu) -> add_to_cart -> begin_checkout (kassasivu) -> purchase.
 * item_id on kaikissa tuotteen slug, jotta vaiheet yhdistyvät samaan tuotteeseen.
 */
export function trackViewItem(item: GAItem) {
  kirjaaVaihe("tuotesivu");
  kirjaaToimitustesti("tuotesivu");
  kirjaaEnsitilaustesti("tuotesivu");
  const params = { currency: "EUR", value: +item.price.toFixed(2), items: [item] };
  if (typeof window !== "undefined" && !hasAnalyticsConsent()) {
    odotaSuostumusta("view_item", params);
    return;
  }
  sendEvent("view_item", params);
}

/**
 * Tuotesivu avautuu yleensä ennen evästebannerin hyväksyntää, jolloin view_item jäi lähettämättä ja GA4:n suppilossa
 * oli koriin lisäyksiä ilman tuotenäyttöä (2.11.2026). Viimeisin näyttö lähetetään kerran, jos suostumus annetaan
 * samalla sivulatauksella.
 */
let odottavaNaytto: { name: string; params: Record<string, unknown> } | null = null;
let naytonKuuntelija: (() => void) | null = null;
function odotaSuostumusta(name: string, params: Record<string, unknown>) {
  odottavaNaytto = { name, params };
  if (naytonKuuntelija) return;
  naytonKuuntelija = () => {
    if (!hasAnalyticsConsent() || !odottavaNaytto) return;
    window.removeEventListener(CONSENT_CHANGED_EVENT, naytonKuuntelija!);
    naytonKuuntelija = null;
    const n = odottavaNaytto;
    odottavaNaytto = null;
    sendEvent(n.name, n.params);
  };
  window.addEventListener(CONSENT_CHANGED_EVENT, naytonKuuntelija);
}

export function trackAddToCart(item: GAItem) {
  kirjaaVaihe("kori");
  kirjaaToimitustesti("kori");
  kirjaaEnsitilaustesti("kori");
  sendEvent("add_to_cart", {
    currency: "EUR",
    value: +(item.price * item.quantity).toFixed(2),
    items: [item],
  });
}

export function trackBeginCheckout(items: GAItem[], value: number) {
  kirjaaVaihe("kassa");
  kirjaaToimitustesti("kassa");
  kirjaaEnsitilaustesti("kassa");
  sendEvent("begin_checkout", {
    currency: "EUR",
    value: +value.toFixed(2),
    items,
  });
}

const PURCHASE_KEY = "huumorikauppa-ga-purchase";

/** Palvelimen (/api/order) palauttama tilaus siltä osin kuin GA4 purchase tarvitsee. */
export interface PurchaseOrder {
  id: string;
  status: string;
  total: number;
  shipping?: number;
  amount_paid?: number | null;
  items: Array<{ name: string; quantity: number; price: number; slug?: string; product_id?: string; id?: string }>;
}

export interface PurchaseParams {
  transaction_id: string;
  value: number;
  shipping: number;
  items: GAItem[];
}

/**
 * Rakentaa GA4 purchase -tapahtuman palvelimen vahvistamasta tilauksesta. Palauttaa null, jos tilaus ei ole maksettu.
 * value = tilauksen loppusumma (tuotteet + toimitus, alennukset vähennettynä) palvelimelta, ei selaimen korista;
 * item_id = tuotteen slug.
 */
export function buildPurchaseParams(order: PurchaseOrder | null | undefined): PurchaseParams | null {
  if (!order || order.status !== "paid" || !order.id) return null;
  const value = Number(order.total);
  if (!Number.isFinite(value)) return null;
  return {
    transaction_id: order.id,
    value,
    shipping: Number(order.shipping) || 0,
    items: (order.items || []).map((it, idx) => ({
      item_id: String(it.slug || it.product_id || it.id || `${order.id}-${idx}`),
      item_name: it.name,
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
    })),
  };
}

// Muistinvarainen suoja (React StrictMode, localStorage estetty) + odottavat suostumuskuuntelijat
const sentInMemory = new Set<string>();
const waiting = new Map<string, () => void>();

function alreadySent(id: string): boolean {
  if (sentInMemory.has(id)) return true;
  try {
    const sent = JSON.parse(localStorage.getItem(PURCHASE_KEY) || "[]") as string[];
    return sent.includes(id);
  } catch {
    return false;
  }
}

function markSent(id: string) {
  sentInMemory.add(id);
  try {
    const sent = JSON.parse(localStorage.getItem(PURCHASE_KEY) || "[]") as string[];
    if (!sent.includes(id)) sent.push(id);
    // Rajataan tallennettujen tunnisteiden määrä
    localStorage.setItem(PURCHASE_KEY, JSON.stringify(sent.slice(-50)));
  } catch {
    // ei estä lähetystä
  }
}

/**
 * Lähettää GA4 purchase -tapahtuman kerran tilausta kohden. Ilman analytiikkasuostumusta tapahtumaa ei lähetetä;
 * jos suostumus annetaan vielä samalla sivulatauksella, se lähetetään silloin. Merkintä tehdään vasta lähetyksessä,
 * joten suostumukseton käynti ei "kuluta" tilausta. GA4 deduplikoi lisäksi transaction_id:n perusteella.
 */
export function trackPurchaseOnce(params: PurchaseParams) {
  if (typeof window === "undefined") return;
  if (!params.transaction_id) return;
  const id = params.transaction_id;
  if (alreadySent(id)) return;
  if (!hasAnalyticsConsent()) {
    if (waiting.has(id)) return;
    const handler = () => {
      if (!hasAnalyticsConsent()) return;
      window.removeEventListener(CONSENT_CHANGED_EVENT, handler);
      waiting.delete(id);
      trackPurchaseOnce(params);
    };
    waiting.set(id, handler);
    window.addEventListener(CONSENT_CHANGED_EVENT, handler);
    return;
  }
  markSent(id);
  sendEvent("purchase", {
    transaction_id: id,
    value: +params.value.toFixed(2),
    currency: "EUR",
    shipping: +params.shipping.toFixed(2),
    items: params.items,
  });
}

/** Testikäyttöön: tyhjentää muistinvaraisen tilan. */
export function _resetPurchaseTracking() {
  sentInMemory.clear();
  if (naytonKuuntelija) window.removeEventListener(CONSENT_CHANGED_EVENT, naytonKuuntelija);
  naytonKuuntelija = null;
  odottavaNaytto = null;
  for (const h of waiting.values()) window.removeEventListener(CONSENT_CHANGED_EVENT, h);
  waiting.clear();
}

/**
 * Stripe Checkoutista palaava kävijä tulisi GA4:ssä referral-liikenteenä (checkout.stripe.com) ja voisi ylikirjoittaa
 * alkuperäisen lähteen. Tällöin config-kutsuun annetaan ignore_referrer (sama logiikka on index.html:ssä).
 */
export function isPaymentReferrer(referrer: string): boolean {
  try {
    const host = new URL(referrer).hostname;
    return host === "stripe.com" || host.endsWith(".stripe.com");
  } catch {
    return false;
  }
}
