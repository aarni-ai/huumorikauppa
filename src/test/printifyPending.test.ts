// @vitest-environment node
/**
 * Printifyn pending-tila (18.11.2026, #0A0EB579): send_to_production 8502 "status pending" ei ole virhe. Tilaus odottaa,
 * uusi yritys 15 min päästä (cron ?tehtava=odottavat), ei hälytystä alle 24 h; sen jälkeen tavallinen virhe ja hälytys.
 */
import { describe, expect, it, vi } from "vitest";

process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_testi_salainen";
process.env.CRON_SECRET = "testi";
process.env.PRINTIFY_API_KEY = "x";
process.env.PRINTIFY_SHOP_ID = "1";
const blob = new Map<string, string>();
vi.mock("@vercel/blob", () => ({
  put: async (p: string, s: string) => { blob.set(p, s); return { url: `mem://${p}` }; },
  head: async (p: string) => { if (!blob.has(p)) throw new Error("BlobNotFoundError"); return { url: `mem://${p}` }; },
}));

const sahkopostit: string[] = [];
vi.stubGlobal("fetch", vi.fn(async (url: string, init: { method?: string; body?: string } = {}) => {
  const u = String(url);
  if (u.startsWith("mem://")) { const p = u.slice(6).split("?")[0]; return blob.has(p) ? new Response(blob.get(p)) : new Response("", { status: 404 }); }
  if (u.includes("resend.com")) { sahkopostit.push(JSON.parse(init.body || "{}").subject); return new Response('{"id":"e"}'); }
  if (u.endsWith("/send_to_production.json")) return new Response('{"code":8502,"error":"not allowed to send order to production with status pending"}', { status: 400 });
  if (u.includes("/orders/pf-1.json")) return new Response(JSON.stringify({ id: "pf-1", status: "pending", total_price: 890, total_shipping: 849, total_tax: 0,
    line_items: [{ product_id: "p", quantity: 1, print_provider_id: 30, metadata: { title: "T", country: "Czech Republic" } }] }));
  if (/print_providers\/30\.json$/.test(u)) return new Response(JSON.stringify({ id: 30, location: { country: "CZ" } }));
  return new Response("{}", { status: 404 });
}));

describe("Printify pending", () => {
  it("odottaa 15 min ilman hälytystä, hälyttää vasta 24 h jälkeen", async () => {
    process.env.RESEND_API_KEY = "re_testi";
    const { blobTilausVarasto, lahetaPrintifyyn } = await import("../../api/_lib/tilaus.js");
    const O = await import("../../api/_lib/odottavat.js");
    const muisti = new Map<string, Record<string, unknown>>();
    const v = blobTilausVarasto({ lue: async (p: string) => muisti.get(p) ?? null, kirjoita: async (p: string, t: Record<string, unknown>) => { muisti.set(p, t); } });
    const id = "0a0eb579-0000-0000-0000-000000000000";
    muisti.set(`puskuri/tilaukset/${id}.json`, { id, status: "maksettu", printify_status: "luotu", printify_order_id: "pf-1", customer_email: "a@b.fi",
      items: [{ name: "T", quantity: 1, unit_price: 34.9, printify_product_id: "p", variant_id: 1 }], total: 34.9, shipping: 0, tapahtumat: [] });
    const r = await lahetaPrintifyyn(id, v);
    expect(r).toMatchObject({ ok: false, vaihe: "odottaa" });
    const t = muisti.get(`puskuri/tilaukset/${id}.json`)!;
    expect(t.printify_status).toBe("luotu");
    expect(Date.parse(String(t.next_retry_at)) - Date.now()).toBeGreaterThan(14 * 60000);
    expect(sahkopostit).toEqual([]);
    expect((await O.odottavat()).map((e) => e.id)).toEqual([id]);
    // 24 h myöhemmin: virhe ja hälytys, lista tyhjenee.
    const vanha = await O.odottavat();
    const { kirjoitaBlob } = await import("../../api/_lib/puskuri.js");
    await kirjoitaBlob("puskuri/odottavat.json", { tilaukset: vanha.map((e) => ({ ...e, alkaen: new Date(Date.now() - 25 * 3600e3).toISOString() })) });
    const r2 = await lahetaPrintifyyn(id, v);
    expect(r2).toMatchObject({ ok: false, vaihe: "send_to_production" });
    expect(sahkopostit.some((s) => /ei mennyt Printifyn tuotantoon/.test(s))).toBe(true);
    expect(await O.odottavat()).toEqual([]);
  });
});
