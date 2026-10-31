import { describe, expect, it } from "vitest";
import { csv, pdf, edellinenKuukausi, kuukausiraportti } from "../../api/_lib/kirjanpito.js";

const tilaus = { id: "abcdef12-0000", paid_at: "2026-10-28T10:00:00Z", total: 41.89, shipping: 6.9, discount: 0, bundle_discount: 0,
  amount_paid: 41.89, gift_card_amount: 0, stripe_payment_intent: "pi_1", kumppani: null, lasku: null, items: [{ quantity: 1, unit_price: 34.99 }] };
const db = Object.assign(async () => [tilaus], {});
const stripe = {
  paymentIntents: { retrieve: async () => ({ latest_charge: { payment_method_details: { type: "klarna" }, balance_transaction: { fee: 165 } } }) },
  refunds: { list: () => (async function* () { yield { status: "succeeded", created: 1793200000, amount: 1000, payment_intent: { metadata: { order_id: "zz" } }, reason: "requested_by_customer" }; })() },
  payouts: { list: () => (async function* () { yield { arrival_date: 1793300000, amount: 3000, status: "paid" }; })() },
};

describe("kirjanpidon kuukausiraportti", () => {
  it("edellinen kuukausi alkaa aikaisintaan 27.10.2026", () => {
    expect(edellinenKuukausi(new Date("2026-11-02T08:00:00Z"))).toEqual({ kuukausi: "2026-10", alku: "2026-10-27", loppu: "2026-10-31" });
    expect(edellinenKuukausi(new Date("2027-01-02T08:00:00Z"))).toEqual({ kuukausi: "2026-12", alku: "2026-12-01", loppu: "2026-12-31" });
  });
  it("ALV, Stripen kulu, maksutapa, palautukset ja tilitykset; CSV ja PDF", async () => {
    const r = await kuukausiraportti(db as never, { alku: "2026-10-27", loppu: "2026-10-31", stripe });
    expect(r.rivit[0]).toMatchObject({ maksutapa: "klarna", yhteensa: 41.89, alv0: 33.38, alv: 8.51, stripeKulu: 1.65, toimitus: 6.9 });
    expect(r.yhteenveto).toMatchObject({ tilauksia: 1, palautukset: 10, tilitykset: 30, stripeKulut: 1.65 });
    const c = csv(r);
    expect(c).toContain("ALV 25,5 %;8,51");
    const p = pdf(r);
    expect(p.subarray(0, 8).toString("latin1")).toBe("%PDF-1.4");
    expect(p.toString("latin1")).toContain("%%EOF");
    expect(p.toString("latin1")).toMatch(/startxref\n\d+/);
  });
});
