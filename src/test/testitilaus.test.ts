// @vitest-environment node
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { testitilaus, siivoaTestitilaukset, onTestitilaus, testiNimi } from "../../api/_lib/printify.js";

type Kutsu = { url: string; method: string; body: Record<string, unknown> | null };
let kutsut: Kutsu[];
let tilat: Record<string, string>;
let peruutusEpaonnistuu = 0;
const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status });

beforeEach(() => {
  process.env.PRINTIFY_API_KEY = "testi";
  process.env.PRINTIFY_SHOP_ID = "777";
  kutsut = [];
  tilat = {};
  peruutusEpaonnistuu = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit = {}) => {
    const method = init.method || "GET";
    kutsut.push({ url, method, body: init.body ? JSON.parse(String(init.body)) : null });
    if (url.endsWith("/orders.json") && method === "POST") { tilat.uusi = "pending"; return json({ id: "uusi" }); }
    const m = url.match(/\/orders\/([^/]+)(\/cancel)?\.json$/);
    if (m && m[2]) {
      if (peruutusEpaonnistuu-- > 0) return json({ error: "ei vielä" }, 400);
      tilat[m[1]] = "canceled";
      return json({ id: m[1], status: "canceled" });
    }
    if (m) {
      if (tilat[m[1]] === "pending") { tilat[m[1]] = "on-hold"; return json({ id: m[1], status: "pending" }); }
      return json({ id: m[1], status: tilat[m[1]], total_price: 8900, total_shipping: 1920, line_items: [] });
    }
    if (url.includes("/orders.json?page=1")) {
      return json({ data: [
        { id: "a", status: "on-hold", metadata: { shop_order_label: "Huumorikauppa #TESTI-MV" }, address_to: {} },
        { id: "b", status: "on-hold", label: "Huumorikauppa #2ED0A626", address_to: { email: "asiakas@x.fi" } },
        { id: "c", status: "in-production", metadata: { shop_order_label: "KAYTTOONOTTOTESTI (perutaan)" }, address_to: {} },
        { id: "d", status: "pending", label: "Huumorikauppa #ABCDEF12", address_to: { email: "kassatesti@huumorikauppa.fi" } },
      ] });
    }
    return json({}, 404);
  }));
});
afterEach(() => vi.unstubAllGlobals());

const odota = async () => {};

describe("Printify-testitilaus", () => {
  it("nimessä lukee TESTI, ei lähetysilmoitusta, ja tilaus perutaan samassa ajossa", async () => {
    const r = await testitilaus({ external_id: "abc", line_items: [] }, "Oma logo", { odota });
    const luonti = kutsut.find((k) => k.method === "POST" && k.url.endsWith("/orders.json"))!;
    expect(luonti.body).toMatchObject({ label: "TESTI Oma logo (perutaan)", external_id: "testi-abc", send_shipping_notification: false });
    expect(r).toMatchObject({ luotu: true, id: "uusi", peruttu: true, tilaJalkeen: "canceled" });
    expect(r.ennen?.status).toBe("on-hold");
    expect(testiNimi("TESTI Käyttöönotto")).toBe("TESTI Käyttöönotto (perutaan)");
  });

  it("peruutusta yritetään uudelleen, ja peruttu on true vain, kun tila on canceled", async () => {
    peruutusEpaonnistuu = 2;
    expect(await testitilaus({ line_items: [] }, "X", { odota })).toMatchObject({ peruttu: true });
    peruutusEpaonnistuu = 99;
    expect(await testitilaus({ line_items: [] }, "X", { odota })).toMatchObject({ luotu: true, peruttu: false });
  });

  it("siivous perii vain perumattomat testitilaukset, ei asiakastilauksia eikä tuotannossa olevia", async () => {
    expect(onTestitilaus({ label: "Huumorikauppa #2ED0A626" })).toBe(false);
    const r = await siivoaTestitilaukset();
    expect(r).toEqual({ peruttu: ["a", "d"], jai: [] });
    expect(kutsut.filter((k) => k.url.endsWith("/cancel.json")).map((k) => k.url.match(/orders\/(\w+)/)![1])).toEqual(["a", "d"]);
  });
});
