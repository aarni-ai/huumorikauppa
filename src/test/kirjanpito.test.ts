import { describe, expect, it } from "vitest";
import { csv, pdf, edellinenKuukausi, kuukausiraportti, printifyKulut, printifyCsv, stripeTapahtumat, stripeCsv } from "../../api/_lib/kirjanpito.js";

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
  it("lokakuun muut erät: Uusiku Oy:n velka Tmi Intellerille CSV:ssä ja PDF:ssä, marraskuussa ei", async () => {
    const r = await kuukausiraportti(db as never, { alku: "2026-10-27", loppu: "2026-10-31", stripe });
    expect(csv(r)).toContain("Uusiku Oy:n velka Tmi Intellerille;15,28");
    expect(pdf(r).toString("latin1")).toContain("Uusiku Oy:n velka Tmi Intellerille");
    expect((await kuukausiraportti(db as never, { alku: "2026-11-01", loppu: "2026-11-30", stripe })).muut).toEqual([]);
  });
  it("Printifyn veloitukset aikaväliltä ilman peruttuja, Stripen saldotapahtumat", async () => {
    const o = (id: string, created_at: string, status = "fulfilled") => ({ id, external_id: "2ed0a626-x", status, created_at, total_price: 1500, total_shipping: 469, total_tax: 503 });
    const listaa = async () => ({ ok: true, data: { data: [o("a", "2026-11-01 10:00:00+00:00"), o("b", "2026-10-29 10:00:00+00:00"), o("c", "2026-10-29 11:00:00+00:00", "canceled"), o("d", "2026-10-20 10:00:00+00:00")], next_page_url: "x" } });
    const p = await printifyKulut(listaa, { alku: "2026-10-27", loppu: "2026-10-31" });
    expect(p.rivit).toEqual([expect.objectContaining({ printify: "b", oma: "2ED0A626", yhteensa: 24.72, vero: 5.03 })]);
    expect(printifyCsv(p, { alku: "2026-10-27", loppu: "2026-10-31" })).toContain("Yhteensä;;;;15,00;4,69;5,03;24,72");
    const st = { balanceTransactions: { list: () => (async function* () { yield { created: 1793200000, type: "charge", amount: 5439, fee: 203, net: 5236, currency: "eur", available_on: 1793800000, description: "x", id: "txn_1" }; })() } };
    const t = await stripeTapahtumat(st, { alku: "2026-10-27", loppu: "2026-10-31" });
    expect(stripeCsv(t, { alku: "2026-10-27", loppu: "2026-10-31" })).toContain("charge;54,39;2,03;52,36;EUR");
    const virhe = await stripeTapahtumat({ balanceTransactions: { list: () => { throw new Error("ei oikeutta"); } } }, { alku: "2026-10-27", loppu: "2026-10-31" });
    expect(virhe.virhe).toContain("ei oikeutta");
  });
});
