// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { ostetaanYhdessa, valitseSuositukset, puuttuvaSumma } from "../../api/_lib/suositukset.js";
import handler from "../../api/products.js";

type P = Record<string, unknown> & { id: string; slug: string; price: number; category: string };
const t = (slug: string, price: number, category: string, extra: Record<string, unknown> = {}): P => ({
  id: slug, slug, name: slug, category, price, humor_type: "yleinen", is_active: true,
  variants: { variant_map: { "Musta|M": 1, "Musta|L": 2 } }, ...extra,
});

describe("Usein ostetaan yhdessä", () => {
  const paita = t("tonnin-seteli-t-paita", 24.9, "t-paidat");
  const huppari = t("tonnin-seteli-huppari", 49.9, "hupparit");
  const muu = t("saunassa-t-paita", 24.9, "t-paidat");
  const muki = t("tonnin-seteli-muki", 19.9, "mukit");
  const heikko = t("halpa-huppari", 49.9, "hupparit", { variants: { variant_map: { "Musta|M": 7 }, costs: { "7": 4000 }, shipping_cents: 900 } });
  it("saman teeman pari ensin, ei itseä, piilotettuja eikä alle katerajan", () => {
    const s = ostetaanYhdessa(paita, [paita, huppari, muu, muki, heikko]);
    expect(s[0]).toMatchObject({ samaTeema: true });
    expect(s[0].product.slug).toBe("tonnin-seteli-huppari");
    const slugit = s.map((x: { product: P }) => x.product.slug);
    expect(slugit).not.toContain("tonnin-seteli-t-paita");
    expect(slugit).not.toContain("tonnin-seteli-muki");
    expect(slugit).not.toContain("halpa-huppari");
  });
  it("puuttuva summa ilmaiseen toimitukseen", () => {
    expect(puuttuvaSumma([{ product: paita, quantity: 1 }])).toBe(35.1);
    expect(puuttuvaSumma([{ product: huppari, quantity: 2 }])).toBe(0);
    expect(valitseSuositukset([], [paita], 4)).toHaveLength(1);
  });
  it("GET /api/products?suositukset=slug tilannekuvasta", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("POSTGRES_URL", "");
    let status = 0;
    let body: Array<{ product: P; samaTeema: boolean }> = [];
    const res = {
      setHeader: () => res,
      status: (s: number) => { status = s; return res; },
      json: (b: typeof body) => { body = b; return res; },
    };
    await handler({ query: { suositukset: "tonnin-seteli-t-paita", maara: "3" } }, res);
    expect(status).toBe(200);
    expect(body).toHaveLength(3);
    expect(body[0].product.slug).toBe("tonnin-seteli-huppari");
    await handler({ query: { suositukset: "ei-ole-olemassa" } }, res);
    expect(status).toBe(404);
    vi.unstubAllEnvs();
  });
});
