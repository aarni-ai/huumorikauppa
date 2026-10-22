import { describe, it, expect, vi } from "vitest";
import {
  buildSaatavuus,
  computeUnavailable,
  copyOfProducts,
  createPrintifyClient,
  mapRowToShopProduct,
  renderJsModule,
  variantCombos,
} from "../../scripts/printify-saatavuus.mjs";

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  ({ ok: status >= 200 && status < 300, status, headers: { get: (k: string) => headers[k.toLowerCase()] ?? null }, json: async () => body }) as unknown as Response;

const rivi = (slug: string, ppid: string | null, colors: string[], sizes: string[], map: Record<string, number>, name = slug) => ({
  slug, name, is_active: true, printify_product_id: ppid, variants: { colors, sizes, variant_map: map },
});

function mockPrintify(routes: Record<string, unknown | number>) {
  return vi.fn(async (url: string, _init?: RequestInit) => {
    const p = url.replace("https://api.printify.com/v1", "");
    if (!(p in routes)) return json(404, {});
    const v = routes[p];
    return typeof v === "number" ? json(v, {}) : json(200, v);
  });
}

describe("printify-saatavuus: yhdistelmät ja valmistamattomuus", () => {
  it("värit × koot, puuttuva puoli tyhjänä", () => {
    expect(variantCombos({ colors: ["Musta"], sizes: ["S", "M"] })).toEqual(["Musta|S", "Musta|M"]);
    expect(variantCombos({ sizes: ["10cm"] })).toEqual(["|10cm"]);
    expect(variantCombos({ colors: ["Valkoinen"] })).toEqual(["Valkoinen|"]);
  });

  it("puuttuu kartasta, ei käytössä, ei saatavilla, ei katalogissa", () => {
    const r = rivi("p", "pp1", ["Musta"], ["S", "M", "L", "XL", "2XL", "3XL"], {
      "Musta|S": 1, "Musta|M": 2, "Musta|L": 3, "Musta|XL": 4, "Musta|2XL": 5,
    });
    const product = { variants: [
      { id: 1, is_enabled: true, is_available: true },
      { id: 2, is_enabled: false, is_available: true },
      { id: 3, is_enabled: true, is_available: false },
      { id: 4, is_enabled: true, is_available: true },
    ] };
    const catalog = new Map([[1, { id: 1 }], [4, { id: 4, status: "discontinued" }]]);
    const { unavailable, syyt } = computeUnavailable(r, product, catalog);
    expect(unavailable).toEqual(["Musta|M", "Musta|L", "Musta|XL", "Musta|2XL", "Musta|3XL"]);
    expect(syyt).toEqual({
      "Musta|M": "ei_kaytossa",
      "Musta|L": "ei_saatavilla",
      "Musta|XL": "katalogi_ei_saatavilla",
      "Musta|2XL": "ei_printify_tuotteessa",
      "Musta|3XL": "ei_kartassa",
    });
    // Ilman katalogia vain tuotteen oma signaali
    expect(computeUnavailable(r, product, null).unavailable).toEqual(["Musta|M", "Musta|L", "Musta|2XL", "Musta|3XL"]);
  });

  it("variant-id-kohdistus: yksiselitteinen osuma tai nimi ratkaisee", () => {
    const shop = [
      { id: "a", title: "Eka paita", variants: [{ id: 1 }, { id: 2 }, { id: 3 }] },
      { id: "b", title: "Toka paita", variants: [{ id: 1 }, { id: 2 }] },
      { id: "c", title: "Muki", variants: [{ id: 9 }] },
    ];
    expect(mapRowToShopProduct(rivi("x", null, [], ["S"], { "|S": 9 }), shop)?.id).toBe("c");
    expect(mapRowToShopProduct(rivi("x", null, [], ["S", "M"], { "|S": 1, "|M": 2 }, "Toka paita"), shop)?.id).toBe("b");
    expect(mapRowToShopProduct(rivi("x", null, [], ["S", "M"], { "|S": 1, "|M": 2 }, "Muu"), shop)).toBeNull();
    expect(mapRowToShopProduct(rivi("x", null, [], ["S"], { "|S": 3 }), shop)?.id).toBe("a");
  });

  it("Copy of -listaus ei poista mitään ja kertoo linkityksen", () => {
    const list = copyOfProducts(
      [
        { id: "1", title: "Copy of Paita", visible: true, external: { id: "x" } },
        { id: "2", title: "copy of Huppari", visible: false },
        { id: "3", title: "Paita" },
      ],
      new Set(["2"]),
    );
    expect(list).toEqual([
      { id: "1", title: "Copy of Paita", visible: true, published: true, linked: false },
      { id: "2", title: "copy of Huppari", visible: false, published: false, linked: true },
    ]);
  });
});

describe("printify-saatavuus: koko ajo mockatulla fetchillä", () => {
  it("tuote-endpoint ensisijainen, katalogi toissijainen, 404 = kokonaan, kohdistus id:llä, vain GET-pyynnöt", async () => {
    const rows = [
      rivi("paita", "P1", ["Musta", "Valkoinen"], ["S", "5XL"], { "Musta|S": 11, "Musta|5XL": 12, "Valkoinen|S": 13, "Valkoinen|5XL": 14 }),
      rivi("poistettu", "P404", ["Musta"], ["S"], { "Musta|S": 11 }),
      rivi("ilman-id", null, [], ["10cm"], { "|10cm": 77 }),
      rivi("kunnossa", "P3", ["Musta"], ["S"], { "Musta|S": 11 }),
    ];
    const fetchImpl = mockPrintify({
      "/shops/9/products.json?limit=50&page=1": { current_page: 1, last_page: 2, data: [
        { id: "P1", title: "Paita", variants: [{ id: 11 }, { id: 12 }, { id: 13 }, { id: 14 }] },
        { id: "COPY", title: "Copy of Paita", visible: false, variants: [{ id: 11 }] },
      ] },
      "/shops/9/products.json?limit=50&page=2": { current_page: 2, last_page: 2, data: [
        { id: "P2", title: "Tarra", variants: [{ id: 77 }] },
        { id: "P3", title: "Kunnossa", variants: [{ id: 11 }] },
      ] },
      "/shops/9/products/P1.json": { id: "P1", blueprint_id: 6, print_provider_id: 26, variants: [
        { id: 11, is_enabled: true, is_available: true },
        { id: 12, is_enabled: true, is_available: false },
        { id: 13, is_enabled: true, is_available: true },
        { id: 14, is_enabled: true, is_available: true },
      ] },
      "/catalog/blueprints/6/print_providers/26/variants.json?show-out-of-stock=1": { variants: [{ id: 11 }, { id: 12 }, { id: 13 }] },
      "/shops/9/products/P2.json": { id: "P2", blueprint_id: 7, print_provider_id: 1, variants: [{ id: 77, is_enabled: true, is_available: false }] },
      "/catalog/blueprints/7/print_providers/1/variants.json?show-out-of-stock=1": { variants: [{ id: 77 }] },
      "/shops/9/products/P3.json": { id: "P3", blueprint_id: 6, print_provider_id: 26, variants: [{ id: 11, is_enabled: true, is_available: true }] },
    });
    const printifyGet = createPrintifyClient({ apiKey: "testi", fetchImpl, sleep: async () => {}, minIntervalMs: 0 });
    const { data, raportti } = await buildSaatavuus({ rows, printifyGet, shopId: "9", now: () => new Date("2026-10-22T00:00:00Z") });

    expect(data.products).toEqual({
      "ilman-id": { unavailable: ["|10cm"], printify_product_id: "P2", provider_id: 1 },
      paita: { unavailable: ["Musta|5XL", "Valkoinen|5XL"], printify_product_id: "P1", provider_id: 26 },
      poistettu: { unavailable: ["Musta|S"], printify_product_id: "P404", provider_id: null },
    });
    expect(data.kokonaan_ei_saatavilla).toEqual(["ilman-id", "poistettu"]);
    expect(data.summary).toEqual({ checked_products: 4, checked_variants: 7, unavailable_variants: 4, tila: "printify" });
    expect(raportti.copyOf).toEqual([{ id: "COPY", title: "Copy of Paita", visible: false, published: false, linked: false }]);
    // Katalogi haetaan kerran per blueprint/provider
    const urls = fetchImpl.mock.calls.map((c) => c[0] as string);
    expect(urls.filter((u) => u.includes("/catalog/blueprints/6/")).length).toBe(1);
    // Ei kirjoittavia kutsuja
    for (const c of fetchImpl.mock.calls) expect((c[1] as RequestInit | undefined)?.method ?? "GET").toBe("GET");

    const js = renderJsModule(data);
    expect(js).toContain('export const KOKONAAN_EI_SAATAVILLA = new Set([\n  "ilman-id",\n  "poistettu"\n]);');
  });

  it("429 uusitaan Retry-Afterin mukaan", async () => {
    let n = 0;
    const fetchImpl = vi.fn(async () => (++n === 1 ? json(429, {}, { "retry-after": "2" }) : json(200, { ok: true })));
    const sleep = vi.fn(async () => {});
    const get = createPrintifyClient({ apiKey: "k", fetchImpl, sleep, minIntervalMs: 0 });
    expect((await get("/x")).data).toEqual({ ok: true });
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it("--vain-kartta: ei Printify-kutsuja, vain kartan aukot", async () => {
    const { data } = await buildSaatavuus({
      rows: [rivi("p", "P1", ["Keltainen"], ["S", "3XL"], { "Keltainen|S": 1 })],
      printifyGet: null,
      shopId: "9",
    });
    expect(data.products.p.unavailable).toEqual(["Keltainen|3XL"]);
    expect(data.summary.tila).toBe("vain-kartta");
  });
});
