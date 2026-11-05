// @vitest-environment node
/**
 * Kauppa ilman tietokantaa (5.11.2026, Neonin ilmaiskiintiö loppui ja tuotelistat, syöte ja sivukartta kaatuivat).
 * DATABASE_URL osoittaa suljettuun porttiin: tuotteet, tuotesivu, sivukartta ja Merchant-syöte vastaavat 200
 * staattisesta katalogista, kassa tallentaa tilauksen Blob-puskuriin ja luo Stripe-maksun, maksu vie tilauksen
 * Printifyn tuotantoon puskurista, ja seurantakirjaukset kertyvät puskuriin ilman kantaa (botteja ei kirjata).
 * Julkaisu ajaa tämän ennen tuotantoversiota (scripts/julkaise-uusi.sh).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

process.env.DATABASE_URL = "postgres://x:y@127.0.0.1:1/x";
process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_testi_salainen";
process.env.CRON_SECRET = "testi-salaisuus";
process.env.STRIPE_SECRET_KEY = "sk_test_x";

// Blob muistissa: put/head/list/del ja julkinen osoite mem://.
const blob = new Map<string, string>();
vi.mock("@vercel/blob", () => ({
  put: async (polku: string, sisalto: string) => { blob.set(polku, sisalto); return { url: `mem://${polku}`, pathname: polku }; },
  head: async (polku: string) => { if (!blob.has(polku)) throw new Error("BlobNotFoundError: not found"); return { url: `mem://${polku}` }; },
  list: async ({ prefix }: { prefix: string }) => ({ blobs: [...blob.keys()].filter((k) => k.startsWith(prefix)).map((k) => ({ pathname: k, url: `mem://${k}` })), hasMore: false }),
  del: async (urlit: string[]) => { for (const u of urlit) blob.delete(u.replace("mem://", "")); },
}));

const sessiot: Record<string, unknown>[] = [];
vi.mock("../../api/_lib/stripe.js", () => ({
  onStripe: () => true,
  stripe: () => ({
    checkout: { sessions: {
      create: async (s: Record<string, unknown>) => { sessiot.push(s); return { id: "cs_test_puskuri", url: "https://checkout.stripe.test/pay" }; },
      expire: async () => ({}),
      retrieve: async () => ({ id: "cs_test_puskuri", payment_status: "unpaid" }),
    } },
  }),
}));

type Vastaus = { status: number; body: unknown; otsakkeet: Record<string, string> };
function vastaus() {
  const out: Vastaus = { status: 0, body: null, otsakkeet: {} };
  const res = {
    status: (c: number) => { out.status = c; return res; },
    json: (b: unknown) => { out.body = b; return res; },
    send: (b: unknown) => { out.body = b; return res; },
    end: (b?: unknown) => { out.body = b ?? out.body; return res; },
    setHeader: (k: string, v: string) => { out.otsakkeet[k.toLowerCase()] = v; return res; },
    write: (b: unknown) => { out.body = `${out.body ?? ""}${b}`; return true; },
  };
  return { out, res };
}

const alkuperainenFetch = globalThis.fetch;
beforeAll(() => {
  // Blobin julkiset osoitteet muistista; muut verkkokutsut epäonnistuvat (ei Printifyä, ei Resendiä tässä osassa).
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const u = String(url);
    if (u.startsWith("mem://")) {
      const polku = u.slice(6).split("?")[0];
      return blob.has(polku) ? new Response(blob.get(polku), { status: 200 }) : new Response("", { status: 404 });
    }
    throw new Error(`verkko estetty testissä: ${u.slice(0, 60)}`);
  }));
});
afterAll(() => { vi.stubGlobal("fetch", alkuperainenFetch); });

describe("tuotteet, sivukartta ja syöte ilman tietokantaa", () => {
  it("/api/products: lista ja yksi tuote staattisesta katalogista", async () => {
    const { default: products } = await import("../../api/products.js");
    const a = vastaus();
    await products({ query: {} } as never, a.res as never);
    expect(a.out.status).toBe(200);
    expect((a.out.body as unknown[]).length).toBeGreaterThan(500);
    expect(a.out.otsakkeet["x-tuotelahde"]).toBe("katalogi");
    const b = vastaus();
    await products({ query: { slug: "tonnin-seteli-t-paita" } } as never, b.res as never);
    expect(b.out.status).toBe(200);
    expect((b.out.body as { slug: string }).slug).toBe("tonnin-seteli-t-paita");
  });

  it("/sitemap.xml ja /product-feed.xml vastaavat 200", async () => {
    for (const polku of ["../../api/sitemap.js", "../../api/product-feed.js"]) {
      const { default: h } = await import(polku);
      const a = vastaus();
      await h({ query: {}, headers: { host: "huumorikauppa.fi" }, method: "GET" } as never, a.res as never);
      expect(a.out.status, polku).toBe(200);
      expect(String(a.out.body).length, polku).toBeGreaterThan(1000);
    }
  });
});

describe("kassa ilman tietokantaa", () => {
  it("tilaus Blob-puskuriin (salattuna) ja Stripe-maksu metadatalla puskuri=1", async () => {
    const { kaikkiTuotteet } = await import("../../api/_lib/tuotteet.js");
    const p = (await kaikkiTuotteet()).find((x) => x.slug === "tonnin-seteli-t-paita")!;
    const pois = new Set(p.unavailable_variants || []);
    const avain = Object.keys(p.variants.variant_map).find((k) => !pois.has(k) && /\|M$/.test(k))!;
    const [color, size] = avain.split("|");
    const { default: checkout } = await import("../../api/checkout.js");
    const a = vastaus();
    await checkout({ method: "POST", headers: { origin: "https://huumorikauppa.fi", "user-agent": "Mozilla/5.0" }, body: {
      items: [{ id: p.id, slug: p.slug, quantity: 1, color, size }], customerEmail: "asiakas@example.com", customerName: "Testi Asiakas",
      shippingAddress: { address: "Katu 1", zip: "00100", city: "Helsinki", phone: "0401234567" },
      abVersio: "a", toimitusVersio: "a", ensitilausVersio: "a", kokoVersio: "b", saapuminen: { utm: "", ref: "", gclid: false, viittaaja: "https://www.google.com/" },
    } } as never, a.res as never);
    expect(a.out.body).toMatchObject({ ok: true, url: "https://checkout.stripe.test/pay" });
    const s = sessiot.at(-1) as { metadata: Record<string, string>; client_reference_id: string };
    expect(s.metadata.puskuri).toBe("1");
    const polku = `puskuri/tilaukset/${s.client_reference_id}.json`;
    expect(blob.has(polku)).toBe(true);
    expect(blob.get(polku)).not.toContain("asiakas@example.com");
    const { lueBlob } = await import("../../api/_lib/puskuri.js");
    const t = await lueBlob(polku) as Record<string, unknown>;
    expect(t).toMatchObject({ status: "odottaa_maksua", customer_email: "asiakas@example.com", stripe_session_id: "cs_test_puskuri",
      toimitus_versio: "a", ensitilaus_versio: "a", koko_versio: "b", lahde: "google", printify_status: "ei_lahetetty" });
  });

  it("kannan alennuskoodi ja lahjakortti antavat selkeän viestin, eivät kaada kassaa", async () => {
    const { default: checkout } = await import("../../api/checkout.js");
    const a = vastaus();
    await checkout({ method: "POST", headers: {}, body: { action: "alennuskoodi", code: "EIOLE123", email: "a@b.fi" } } as never, a.res as never);
    expect(a.out.body).toMatchObject({ ok: false });
  });
});

describe("seuranta ilman tietokantaa", () => {
  it("käynti ja suppilo puskuriin, botti ei mihinkään, erä Blobiin rajalla", async () => {
    const P = await import("../../api/_lib/puskuri.js");
    const { kasittele } = await import("../../api/sahkoposti.js");
    const alku = P.puskurinKoko();
    const kutsu = async (ua: string, body: Record<string, unknown>) => {
      const a = vastaus();
      await kasittele({ method: "POST", query: {}, headers: { "user-agent": ua, "sec-fetch-site": "same-origin", "x-forwarded-for": "84.250.1.2" }, body } as never, a.res as never, {} as never);
      return a.out;
    };
    const ihminen = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
    const aitous = "aito";
    const k = await kutsu(ihminen, { action: "kaynti", polku: "/", viittaaja: "https://www.google.com/", aitous });
    expect(k.status, JSON.stringify(k.body)).toBe(200);
    expect(k.body, JSON.stringify(k.body)).toMatchObject({ ok: true });
    const botti = await kutsu("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", { action: "kaynti", polku: "/", aitous });
    expect(botti.body).toMatchObject({ ok: false });
    const kirjattu = P.puskurinKoko() - alku;
    expect(kirjattu).toBeGreaterThan(0);
    // Botti ei lisännyt yhtään riviä: toinen botti ei muuta kokoa.
    const ennen = P.puskurinKoko();
    await kutsu("Mozilla/5.0 (compatible; bingbot/2.0)", { action: "suppilo", vaihe: "kori", ab: "a" });
    expect(P.puskurinKoko()).toBe(ennen);
  });

  it("tallentava kanta, erän raja ja ajo kantaan samoina kyselyinä (rakennekyselyt kerran)", async () => {
    const P = await import("../../api/_lib/puskuri.js");
    const kohde = { rivit: [] as { q: string[]; v: unknown[] }[], alku: 0 };
    const db = P.tallentavaKanta(kohde);
    await db`create table if not exists suppilo (paiva date)`;
    await db`insert into suppilo (paiva, vaihe, n) values (${"2026-11-05"}::date, ${"kori"}, 1) on conflict do nothing`;
    await db`create table if not exists suppilo (paiva date)`;
    expect(P.kyselyTeksti(kohde.rivit[1])).toEqual({ teksti: "insert into suppilo (paiva, vaihe, n) values ($1::date, $2, 1) on conflict do nothing", arvot: ["2026-11-05", "kori"] });
    const kirjoitetut: { nimi: string; arvo: unknown }[] = [];
    const kirjoita = async (nimi: string, arvo: unknown) => { kirjoitetut.push({ nimi, arvo }); };
    expect((await P.tyhjennaTarvittaessa({ kohde, kirjoita, nyt: kohde.alku + 1000 })).kirjoitettu).toBe(0);
    expect((await P.tyhjennaTarvittaessa({ kohde, kirjoita, nyt: kohde.alku + P.ERA_IKA_MS + 1 })).kirjoitettu).toBe(3);
    expect(kohde.rivit.length).toBe(0);
    const ajetut: string[] = [];
    const poistetut: string[] = [];
    const kanta = { begin: async (f: (tx: unknown) => Promise<void>) => f({ unsafe: async (t: string) => { ajetut.push(t); return []; } }) };
    const r = await P.siirraTapahtumat(kanta as never, {
      listaa: async () => [{ pathname: kirjoitetut[0].nimi, url: "u1" }], lue: async () => kirjoitetut[0].arvo, poista: async (u: string[]) => { poistetut.push(...u); },
    });
    expect(r).toMatchObject({ eria: 1, riveja: 3, virheita: 0 });
    expect(ajetut.filter((t) => t.startsWith("create table")).length).toBe(1);
    expect(poistetut).toEqual(["u1"]);
  });

  it("salaus: vain oikealla avaimella", async () => {
    const P = await import("../../api/_lib/puskuri.js");
    const k = P.salaa({ email: "a@b.fi" });
    expect(JSON.stringify(k)).not.toContain("a@b.fi");
    expect(P.pura(k)).toEqual({ email: "a@b.fi" });
    expect(() => P.pura(k, Buffer.alloc(32, 1))).toThrow();
  });
});

describe("puskuritilauksen maksu ilman tietokantaa", () => {
  it("maksettu, Printify-tilaus luodaan ja lähetetään tuotantoon EU-painotalolle, tila Blobissa", async () => {
    const muisti = new Map<string, Record<string, unknown>>();
    const { blobTilausVarasto, kasittelePuskuriMaksu } = await import("../../api/_lib/tilaus.js");
    const varasto = blobTilausVarasto({ lue: async (p: string) => muisti.get(p) ?? null, kirjoita: async (p: string, t: Record<string, unknown>) => { muisti.set(p, t); } });
    const id = "11111111-2222-3333-4444-555555555555";
    muisti.set(`puskuri/tilaukset/${id}.json`, {
      id, status: "odottaa_maksua", customer_email: "a@b.fi", customer_name: "A B", shipping_address: { address: "K 1", zip: "00100", city: "Hki", country: "FI" },
      items: [{ name: "Tonnin seteli | T-Paita", quantity: 1, unit_price: 24.9, printify_product_id: "pf-p1", variant_id: 123, color: "Black", size: "M" }],
      subtotal: 24.9, shipping: 6.9, total: 31.8, printify_status: "ei_lahetetty", tapahtumat: [],
    });
    process.env.PRINTIFY_API_KEY = "x";
    process.env.PRINTIFY_SHOP_ID = "1";
    const kutsut: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: { method?: string } = {}) => {
      kutsut.push(`${init.method || "GET"} ${url}`);
      if (url.endsWith("/orders.json") && init.method === "POST") return new Response(JSON.stringify({ id: "pf-1" }), { status: 200 });
      if (url.endsWith("/send_to_production.json")) return new Response("{}", { status: 200 });
      if (url.includes("/orders/pf-1.json")) return new Response(JSON.stringify({ id: "pf-1", status: "on-hold", total_price: 890, total_shipping: 849, total_tax: 0,
        line_items: [{ product_id: "pf-p1", quantity: 1, print_provider_id: 30, metadata: { title: "Tonnin seteli | T-Paita", country: "Czech Republic" } }] }), { status: 200 });
      if (/print_providers\/30\.json$/.test(url)) return new Response(JSON.stringify({ id: 30, title: "OPT", location: { country: "CZ" } }), { status: 200 });
      return new Response("{}", { status: 404 });
    }));
    const r = await kasittelePuskuriMaksu({ id: "cs_1", payment_status: "paid", amount_total: 3180, payment_intent: "pi_1" }, id, varasto);
    expect(r).toBe(id);
    const t = muisti.get(`puskuri/tilaukset/${id}.json`)!;
    expect(t, String(t.printify_error)).toMatchObject({ status: "maksettu", amount_paid: 31.8, printify_order_id: "pf-1", printify_status: "tuotannossa" });
    expect((t.tapahtumat as { kind: string }[]).map((e) => e.kind)).toEqual(expect.arrayContaining(["maksettu", "printify_luotu", "printify_tuotannossa"]));
    expect(kutsut.some((k) => k.includes("send_to_production"))).toBe(true);
    // Toinen käsittely ei luo uutta Printify-tilausta.
    const ennen = kutsut.filter((k) => k.startsWith("POST") && k.endsWith("/orders.json")).length;
    await kasittelePuskuriMaksu({ id: "cs_1", payment_status: "paid", amount_total: 3180 }, id, varasto);
    expect(kutsut.filter((k) => k.startsWith("POST") && k.endsWith("/orders.json")).length).toBe(ennen);
  });

  it("Neonin kulutusarvio ja hälytysraja", async () => {
    const { neonArvio, neonHalytys } = await import("../../api/_lib/puskuri-siirto.js");
    const nyt = new Date("2026-11-11T00:00:00Z");
    // 10 päivää, 12 herätystä päivässä, kukin 2 min + 5 min tauko: 10 x 12 x 7 min = 14 h x 0,25 CU = 3,5 CU-h.
    const rivit = [];
    for (let d = 1; d <= 10; d++) for (let h = 1; h < 24; h += 2) {
      const alku = new Date(Date.UTC(2026, 10, d, h, 3));
      rivit.push({ alku, viimeksi: new Date(alku.getTime() + 2 * 60000) });
    }
    const a = neonArvio(rivit, nyt);
    expect(a.cuh).toBeCloseTo(3.5, 1);
    expect(a.ennuste).toBeCloseTo(10.5, 1);
    expect(neonHalytys(a)).toBeNull();
    expect(neonHalytys({ ...a, ennuste: 90 })).toMatch(/HÄLYTYS/);
  });
});
