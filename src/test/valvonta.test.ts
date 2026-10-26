import { describe, it, expect } from "vitest";
import { katevalvonta, yhteenveto } from "../../scripts/katetarkistus.mjs";
import { arvioiKassa } from "../../scripts/saatavuus.mjs";

const p = (slug: string, costs: Record<string, number> | null, extra: Record<string, unknown> = {}) => ({
  slug, name: slug, price: 34.9, category: "t-paidat", is_active: true,
  variants: costs ? { variant_map: { "Musta|M": 1 }, costs, shipping_cents: 450 } : { variant_map: { "Musta|M": 1 } },
  ...extra,
});

describe("Katetarkistus", () => {
  it("löytää alle 20 %:n ja tuntemattomat, ohittaa piilotetut", () => {
    const t = katevalvonta([
      p("ok", { "1": 1200 }),
      p("halpa", { "1": 2200 }),
      p("keski", { "1": 1800 }),
      p("uusi", null),
      p("muki", { "1": 1800 }, { category: "mukit" }),
      p("luonnos", null, { is_active: false }),
    ]);
    expect(t.tarkistettu).toBe(4);
    expect(t.alle.map((x: { slug: string }) => x.slug)).toEqual(["halpa"]);
    expect(t.tuntematon.map((x: { slug: string }) => x.slug)).toEqual(["uusi"]);
    expect(yhteenveto(t, "testi")).toMatch(/Alle rajan: 1\. Kulut tuntemattomat \(kassa ei ota maksua\): 1\./);
  });
});

describe("Saatavuus: kassan vastaus", () => {
  it("503 not_configured on dokumentoitu tila, muut 5xx virheitä", () => {
    expect(arvioiKassa(503, "application/json", JSON.stringify({ ok: false, diagnostics: { error_stage: "not_configured" } }))).toMatchObject({ ok: true, varoitus: true });
    expect(arvioiKassa(200, "application/json; charset=utf-8", JSON.stringify({ ok: false, error: "Ostoskori on tyhjä." })).ok).toBe(true);
    expect(arvioiKassa(500, "application/json", "{}").ok).toBe(false);
    expect(arvioiKassa(502, "text/html", "<html>").ok).toBe(false);
    expect(arvioiKassa(405, "", "").ok).toBe(false);
  });
});
