import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildPurchaseParams, trackPurchaseOnce, _resetPurchaseTracking, isPaymentReferrer, type PurchaseOrder } from "./analytics";
import { CONSENT_KEY, saveConsent } from "./consent";
import { redirectWithQuery } from "@/data/landingRoutes";

const tilaus: PurchaseOrder = {
  id: "11111111-2222-3333-4444-555555555555",
  status: "paid",
  total: 41.9,
  shipping: 4.9,
  items: [{ name: "Paita", quantity: 2, price: 18.5, slug: "paita-a", product_id: "p1" }],
};

describe("buildPurchaseParams", () => {
  it("rakentaa payloadin palvelimen tiedoista (slug item_id:ksi, toimitus, loppusumma)", () => {
    expect(buildPurchaseParams(tilaus)).toEqual({
      transaction_id: tilaus.id,
      value: 41.9,
      shipping: 4.9,
      items: [{ item_id: "paita-a", item_name: "Paita", price: 18.5, quantity: 2 }],
    });
  });
  it("ei lähetä maksamattomasta tilauksesta", () => {
    expect(buildPurchaseParams({ ...tilaus, status: "odottaa_maksua" })).toBeNull();
    expect(buildPurchaseParams(null)).toBeNull();
  });
});

describe("trackPurchaseOnce", () => {
  let gtag: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    _resetPurchaseTracking();
    gtag = vi.fn();
    (window as unknown as { gtag: unknown }).gtag = gtag;
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  const purchases = () => gtag.mock.calls.filter((c) => c[0] === "event" && c[1] === "purchase");
  const params = () => buildPurchaseParams(tilaus)!;
  const suostumus = JSON.stringify({ v: 2, analytics: true, marketing: false });

  it("lähettää kerran suostumuksella, EUR ja shipping mukana", () => {
    localStorage.setItem(CONSENT_KEY, suostumus);
    trackPurchaseOnce(params());
    trackPurchaseOnce(params()); // StrictMode / uudelleenrenderöinti
    _resetPurchaseTracking(); // uusi sivulataus: localStorage-merkintä estää
    trackPurchaseOnce(params());
    expect(purchases()).toHaveLength(1);
    expect(purchases()[0][2]).toMatchObject({ transaction_id: tilaus.id, value: 41.9, currency: "EUR", shipping: 4.9 });
  });

  it("ei lähetä ilman suostumusta, mutta lähettää kerran kun suostumus annetaan", () => {
    trackPurchaseOnce(params());
    expect(purchases()).toHaveLength(0);
    saveConsent({ analytics: true, marketing: false });
    expect(purchases()).toHaveLength(1);
    saveConsent({ analytics: true, marketing: true });
    expect(purchases()).toHaveLength(1);
  });

  it("toimii vaikka localStorage on estetty (muistinvarainen suoja)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((k) => {
      if (k === CONSENT_KEY) return suostumus;
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    trackPurchaseOnce(params());
    trackPurchaseOnce(params());
    expect(purchases()).toHaveLength(1);
  });
});

describe("liikennelähteet", () => {
  it("tunnistaa Stripe-paluun referrerin", () => {
    expect(isPaymentReferrer("https://checkout.stripe.com/c/pay/cs_live_x")).toBe(true);
    expect(isPaymentReferrer("https://www.google.com/")).toBe(false);
    expect(isPaymentReferrer("")).toBe(false);
  });
  it("uudelleenohjaus säilyttää utm-parametrit ja hashin", () => {
    expect(redirectWithQuery("/lahjat/harrastajalle", "?utm_source=fb&utm_medium=cpc")).toBe("/lahjat/harrastajalle?utm_source=fb&utm_medium=cpc");
    expect(redirectWithQuery("/a", "", "#x")).toBe("/a#x");
    expect(redirectWithQuery("/a", "")).toBe("/a");
    expect(redirectWithQuery("/a?x=1", "?utm_source=fb")).toBe("/a?x=1&utm_source=fb");
  });
});
