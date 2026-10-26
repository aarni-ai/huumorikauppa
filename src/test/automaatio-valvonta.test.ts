// @vitest-environment node
/**
 * Maksettu tilaus -> Printify (luonti + send_to_production) päästä päähän: tietokanta on muistissa (pieni tulkki
 * api/_lib/tilaus.js:n SQL-lauseille), Stripe-sessio on valmis olio ja Printify sekä Resend ovat mockattu fetch.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type Rivi = Record<string, unknown>;
const kanta = { orders: [] as Rivi[], events: [] as Rivi[], carts: [] as Rivi[], puuttuvat: [] as string[] };

/** postgres.js-tyylinen tagged template: sisäkkäiset fragmentit, sql.json, ja ne lauseet, joita tilaus.js käyttää. */
function teeSql() {
  type Frag = { __frag: true; osat: string[]; arvot: unknown[] };
  const litistä = (osat: TemplateStringsArray | string[], arvot: unknown[]) => {
    let teksti = "";
    const parametrit: unknown[] = [];
    osat.forEach((o, i) => {
      teksti += o;
      if (i < arvot.length) {
        const a = arvot[i] as Frag;
        if (a && a.__frag) {
          const sis = litistä(a.osat, a.arvot);
          teksti += sis.teksti.replace(/\$(\d+)/g, (_m, n) => `$${Number(n) + parametrit.length}`);
          parametrit.push(...sis.parametrit);
        } else {
          parametrit.push(a);
          teksti += `$${parametrit.length}`;
        }
      }
    });
    return { teksti: teksti.replace(/\s+/g, " ").trim(), parametrit };
  };
  const arvo = (x: string, p: unknown[]) => {
    x = x.trim();
    if (x === "now()") return new Date();
    if (x === "null") return null;
    const m = x.match(/^\$(\d+)$/);
    if (m) return p[Number(m[1]) - 1];
    const l = x.match(/^'(.*)'$/);
    if (l) return l[1];
    if (/^\d+$/.test(x)) return Number(x);
    throw new Error(`tuntematon arvo ${x}`);
  };
  const aja = (teksti: string, p: unknown[]): Rivi[] => {
    let m = teksti.match(/^select \* from orders where id = \$1$/);
    if (m) return kanta.orders.filter((o) => o.id === p[0]).map((o) => ({ ...o }));
    m = teksti.match(/^update orders set (.+?) where id = (\$\d+)(?: and status = '(\w+)')?( returning id)?$/);
    if (m) {
      const id = arvo(m[2], p);
      const rivit = kanta.orders.filter((o) => o.id === id && (!m![3] || o.status === m![3]));
      for (const o of rivit) {
        for (const pari of m[1].split(/,(?![^(]*\))/)) {
          const [k, v] = pari.split(/ = (.+)/);
          if (kanta.puuttuvat.includes(k.trim())) throw new Error(`column "${k.trim()}" does not exist`);
          o[k.trim()] = arvo(v, p);
        }
      }
      return m[4] ? rivit.map((o) => ({ id: o.id })) : [];
    }
    if (teksti.startsWith("insert into order_events")) {
      kanta.events.push({ order_id: p[0], kind: p[1], details: p[2] });
      return [];
    }
    if (teksti.startsWith("update abandoned_carts set recovered_order_id")) {
      for (const c of kanta.carts) if (c.email === p[1] && !c.recovered_order_id) c.recovered_order_id = p[0];
      return [];
    }
    throw new Error(`tuntematon lause: ${teksti}`);
  };
  const sql = (osat: TemplateStringsArray, ...arvot: unknown[]) => {
    const suorita = () => {
      try {
        const { teksti, parametrit } = litistä(osat, arvot);
        return Promise.resolve(aja(teksti, parametrit));
      } catch (e) {
        return Promise.reject(e);
      }
    };
    const frag = {
      __frag: true as const, osat: [...osat], arvot,
      then: <A, B>(ok?: (r: Rivi[]) => A, virhe?: (e: unknown) => B) => suorita().then(ok, virhe),
      catch: <B>(virhe: (e: unknown) => B) => suorita().catch(virhe),
    };
    return frag;
  };
  sql.json = (x: unknown) => x;
  return sql;
}
const fakeSql = teeSql();

vi.mock("../../api/_lib/db.js", () => ({
  onTietokanta: () => true,
  sql: () => fakeSql,
  kirjaaTapahtuma: async (orderId: string, laji: string, tiedot = {}) => void kanta.events.push({ order_id: orderId, kind: laji, details: tiedot }),
}));

const { kasitteleMaksu, lahetaPrintifyyn } = await import("../../api/_lib/tilaus.js");
const { printifyTila, onTuotannossa, jumissaYli, tilauksenKate, yhteenveto, ajaYhteenveto, helsinki, paivanAlku } = await import("../../api/_lib/valvonta.js");

type Kutsu = { url: string; method: string; body: Rivi | null };
/** Printify ja Resend mockattuna. tuotanto: send_to_production-vastausten jono. */
function verkko({ tuotanto = [200], printifyTilaus = "on-hold" }: { tuotanto?: number[]; printifyTilaus?: string } = {}) {
  const kutsut: Kutsu[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: { method?: string; body?: string } = {}) => {
    const body = init.body ? JSON.parse(init.body) : null;
    kutsut.push({ url, method: init.method || "GET", body });
    if (url === "https://api.resend.com/emails") return new Response('{"id":"e1"}', { status: 200 });
    if (url.endsWith("/orders.json") && init.method === "POST") return new Response(JSON.stringify({ id: "pf-tilaus-1" }), { status: 200 });
    if (url.endsWith("/send_to_production.json")) {
      const s = tuotanto.length > 1 ? tuotanto.shift()! : tuotanto[0];
      return new Response(s === 200 ? "{}" : '{"error":"Order is on hold"}', { status: s });
    }
    if (url.includes("/orders/pf-tilaus-1.json")) return new Response(JSON.stringify({ id: "pf-tilaus-1", status: printifyTilaus }), { status: 200 });
    return new Response("ei löydy", { status: 404 });
  }));
  return kutsut;
}

const tilaus = (extra: Rivi = {}): Rivi => ({
  id: "11111111-2222-3333-4444-555555555555", status: "odottaa_maksua", customer_email: "asiakas@esimerkki.fi", customer_name: "Anna Aho",
  shipping_address: { address: "Katu 1", zip: "00100", city: "Helsinki", country: "FI" },
  items: [{ name: "Tonnin seteli | T-paita", slug: "tonnin-seteli-t-paita", quantity: 1, unit_price: 24.9, printify_product_id: "pf-p1", variant_id: 101, kulu_sentit: 993, toimitus_sentit: 849 }],
  subtotal: 24.9, shipping: 5.9, discount: 0, total: 30.8, printify_status: "ei_lahetetty", printify_attempts: 0, ...extra,
});
const session = { id: "cs_test_1", payment_status: "paid", metadata: { order_id: "11111111-2222-3333-4444-555555555555" }, amount_total: 3080, payment_intent: "pi_1" };

beforeEach(() => {
  kanta.orders = [];
  kanta.events = [];
  kanta.puuttuvat = [];
  kanta.carts = [{ email: "asiakas@esimerkki.fi", recovered_order_id: null }];
  vi.stubEnv("PRINTIFY_API_KEY", "pf_testi");
  vi.stubEnv("PRINTIFY_SHOP_ID", "777");
  vi.stubEnv("RESEND_API_KEY", "re_testi");
  vi.stubEnv("OMISTAJA_EMAIL", "");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Maksettu tilaus menee Printifyyn ja tuotantoon", () => {
  it("Stripe-maksu: maksettu, vahvistus, Printify-tilaus ja send_to_production, muistutukset loppuvat", async () => {
    kanta.orders.push(tilaus());
    const kutsut = verkko();
    expect(await kasitteleMaksu(session)).toBe(session.metadata.order_id);
    const o = kanta.orders[0];
    expect(o).toMatchObject({ status: "maksettu", amount_paid: 30.8, printify_order_id: "pf-tilaus-1", printify_status: "tuotannossa", printify_error: null });
    expect(o.sent_to_production_at).toBeInstanceOf(Date);
    expect(o.printify_created_at).toBeInstanceOf(Date);
    const luonti = kutsut.find((k) => k.url === "https://api.printify.com/v1/shops/777/orders.json")!;
    expect(luonti.body).toMatchObject({ external_id: o.id, line_items: [{ product_id: "pf-p1", variant_id: 101, quantity: 1 }], address_to: { city: "Helsinki", email: "asiakas@esimerkki.fi" } });
    expect(kutsut.some((k) => k.url === "https://api.printify.com/v1/shops/777/orders/pf-tilaus-1/send_to_production.json")).toBe(true);
    expect(kutsut.filter((k) => k.url === "https://api.resend.com/emails").map((k) => (k.body!.to as string[])[0])).toEqual(["asiakas@esimerkki.fi"]);
    expect(kanta.carts[0].recovered_order_id).toBe(o.id);
    // Webhook ja paikkaus samalle sessiolle: ei uutta Printify-tilausta.
    await kasitteleMaksu(session);
    expect(kutsut.filter((k) => k.url.endsWith("/orders.json")).length).toBe(1);
  });

  it("on-hold: send_to_production epäonnistuu, hälytys heti osoitteeseen info@seniorituki.fi, uusinta viiveellä onnistuu", async () => {
    kanta.orders.push(tilaus());
    let kutsut = verkko({ tuotanto: [500] });
    await kasitteleMaksu(session);
    const o = kanta.orders[0];
    expect(o).toMatchObject({ status: "maksettu", printify_status: "luotu", printify_order_id: "pf-tilaus-1", printify_attempts: 1 });
    expect(String(o.printify_error)).toMatch(/^send_to_production: Printify 500/);
    expect((o.next_retry_at as Date).getTime()).toBeGreaterThan(Date.now() + 14 * 60000);
    const halytykset = kutsut.filter((k) => k.url === "https://api.resend.com/emails" && (k.body!.to as string[])[0] === "info@seniorituki.fi");
    expect(halytykset).toHaveLength(1);
    expect(halytykset[0].body!.subject).toMatch(/ei mennyt Printifyn tuotantoon/);
    // Uusinta (valvonta): sama Printify-tilaus, ei uutta luontia.
    kutsut = verkko({ tuotanto: [200] });
    expect(await lahetaPrintifyyn(o.id)).toEqual({ ok: true });
    expect(kanta.orders[0].printify_status).toBe("tuotannossa");
    expect(kutsut.filter((k) => k.url.endsWith("/orders.json"))).toHaveLength(0);
  });

  it("uusi sarake puuttuu (schema.sql ajamatta): Printify-tunnus tallessa, ei kaksoistilausta", async () => {
    kanta.puuttuvat = ["printify_created_at"];
    kanta.orders.push(tilaus({ status: "maksettu" }));
    const kutsut = verkko({ tuotanto: [500] });
    await lahetaPrintifyyn(kanta.orders[0].id);
    expect(kanta.orders[0]).toMatchObject({ printify_order_id: "pf-tilaus-1", printify_status: "luotu" });
    const toinen = verkko({ tuotanto: [200] });
    await lahetaPrintifyyn(kanta.orders[0].id);
    expect(kanta.orders[0].printify_status).toBe("tuotannossa");
    expect(kutsut.filter((k) => k.url.endsWith("/orders.json"))).toHaveLength(1);
    expect(toinen.filter((k) => k.url.endsWith("/orders.json"))).toHaveLength(0);
  });

  it("toinen virhe samana päivänä ei lähetä uutta hälytystä", async () => {
    kanta.orders.push(tilaus({ status: "maksettu", printify_order_id: "pf-tilaus-1", printify_status: "luotu", printify_attempts: 1, alert_sent_at: new Date() }));
    const kutsut = verkko({ tuotanto: [500] });
    await lahetaPrintifyyn(kanta.orders[0].id);
    expect(kanta.orders[0].printify_attempts).toBe(2);
    expect(kutsut.filter((k) => k.url === "https://api.resend.com/emails")).toHaveLength(0);
  });

  it("send_to_production palauttaa virheen, mutta Printify on jo tuotannossa: merkitään tuotantoon", async () => {
    kanta.orders.push(tilaus({ status: "maksettu", printify_order_id: "pf-tilaus-1", printify_status: "luotu" }));
    verkko({ tuotanto: [400], printifyTilaus: "in-production" });
    expect(await lahetaPrintifyyn(kanta.orders[0].id)).toEqual({ ok: true });
    expect(kanta.orders[0].printify_status).toBe("tuotannossa");
  });

  it("puuttuva variantti: ei Printify-kutsua, hälytys", async () => {
    kanta.orders.push(tilaus({ status: "maksettu", items: [{ name: "Rikki", quantity: 1, printify_product_id: "pf-p1", variant_id: null }] }));
    const kutsut = verkko();
    const r = await lahetaPrintifyyn(kanta.orders[0].id);
    expect(r).toMatchObject({ ok: false, vaihe: "variantti" });
    expect(kutsut.filter((k) => k.url.includes("printify"))).toHaveLength(0);
    expect(kutsut.filter((k) => k.url === "https://api.resend.com/emails")).toHaveLength(1);
  });
});

describe("Valvonta: Printifyn tila ja jumissa olevat", () => {
  it("on-hold ja maksu puuttuu: uudelleen; ongelmat: hälytys", () => {
    expect(printifyTila("on-hold")).toBe("uudelleen");
    expect(printifyTila("payment-not-received")).toBe("uudelleen");
    expect(printifyTila("has-issues")).toBe("halyta");
    expect(printifyTila("canceled")).toBe("halyta");
    expect(printifyTila("in-production")).toBeNull();
    expect(onTuotannossa("fulfilled")).toBe(true);
    expect(onTuotannossa("on-hold")).toBe(false);
  });
  it("jumissa yli 2 h: maksettu, ei tuotannossa, ei vielä hälytetty", () => {
    const nyt = new Date("2026-10-26T12:00:00Z");
    const t = (id: string, extra: Rivi) => ({ id, status: "maksettu", printify_status: "luotu", paid_at: "2026-10-26T09:00:00Z", ...extra });
    const r = jumissaYli([
      t("a", {}),
      t("b", { printify_created_at: "2026-10-26T11:00:00Z" }),
      t("c", { printify_status: "tuotannossa" }),
      t("d", { stuck_alert_sent_at: "2026-10-26T11:30:00Z" }),
      t("e", { printify_status: "ei_lahetetty", paid_at: "2026-10-26T09:59:00Z" }),
      t("f", { status: "odottaa_maksua" }),
    ], nyt);
    expect(r.map((x: Rivi) => x.id)).toEqual(["a", "e"]);
  });
});

describe("Päivän yhteenveto", () => {
  const maksettu = (id: string, paid: string, extra: Rivi = {}) => ({
    id: `${id}0000000-0000`, status: "maksettu", paid_at: paid, total: 30.8, amount_paid: 30.8, customer_email: "a@b.fi",
    items: [{ slug: "paita", quantity: 1, unit_price: 24.9, variant_id: 1, kulu_sentit: 890, toimitus_sentit: 849 }], ...extra,
  });
  it("tilauksen kate: alv 0 - Printify-kulut - Stripe; lahjakortin osto ei ole myyntikatetta; varalla tuotteen kulu", () => {
    // 30,80 / 1,255 = 24,54; kulut 17,39; Stripe 0,71 -> 6,44
    expect(tilauksenKate(maksettu("a", "x"))).toEqual({ myynti: 30.8, kate: 6.44, tunnettu: true });
    const kortti = maksettu("b", "x", { total: 80.8, amount_paid: 80.8, items: [...maksettu("b", "x").items as Rivi[], { type: "giftcard", quantity: 1, unit_price: 50 }] });
    expect(tilauksenKate(kortti).kate).toBe(r2(30.8 / 1.255 - 17.39 - (80.8 * 0.015 + 0.25)));
    const vanha = maksettu("c", "x", { items: [{ slug: "paita", quantity: 2, unit_price: 24.9, variant_id: 1 }] });
    expect(tilauksenKate(vanha).tunnettu).toBe(false);
    const tuotteet = new Map([["paita", { variants: { costs: { "1": 890 }, shipping_cents: 849 } }]]);
    expect(tilauksenKate(vanha, tuotteet)).toMatchObject({ tunnettu: true });
  });
  it("eilinen, kuukausi tavoitteeseen nähden ja tarvittava kate päivässä", () => {
    const nyt = new Date("2026-10-26T04:05:00Z"); // 6.05 Helsingissä (talviaika 25.10. alkaen); yhteenveto() ei rajaa kellonaikaa
    const s = yhteenveto({
      nyt, eilen: [maksettu("a", "2026-10-25T10:00:00Z"), maksettu("b", "2026-10-25T12:00:00Z")],
      kk: [maksettu("a", "2026-10-25T10:00:00Z"), maksettu("b", "2026-10-25T12:00:00Z"), maksettu("c", "2026-10-02T10:00:00Z")],
      jumissa: [{ id: "dddddddd-0000", customer_email: "x@y.fi", printify_status: "luotu", printify_error: "send_to_production: Printify 500" }],
      hitaat: 1, tavoite: 3000,
    });
    expect(s.eilen).toEqual({ myynti: 61.6, kate: 12.88, tuntematon: 0 });
    expect(s.kk.kate).toBeCloseTo(19.32, 2);
    expect(s.jaljella).toBe(6); // 26.-31.10.
    expect(s.rivit[0]).toBe("Eilen 25.10.2026: 2 maksettua tilausta, myynti 61,60 € (sis. alv), kate 12,88 €");
    expect(s.rivit.join("\n")).toMatch(/Jumissa ennen tuotantoa: 1\n  #DDDDDDDD x@y.fi: luotu, send_to_production: Printify 500/);
    expect(s.rivit.join("\n")).toMatch(/kate 19,32 € \/ tavoite 3000,00 € = 0,6 %/);
    expect(s.rivit.at(-1)).toBe("Tavoitteeseen puuttuu 2980,68 €: 496,78 € katetta päivässä jäljellä olevina 6 päivänä (tänään mukaan lukien)");
    expect(s.rivit.join("\n")).not.toMatch(/[–—]/);
  });
  it("Helsingin aika: kello 7 kesällä 04 UTC ja talvella 05 UTC, vuorokauden raja", () => {
    expect(helsinki(new Date("2026-07-01T04:00:00Z")).tunti).toBe(7);
    expect(helsinki(new Date("2026-07-01T05:00:00Z")).tunti).toBe(8);
    expect(helsinki(new Date("2026-12-01T04:00:00Z")).tunti).toBe(6);
    expect(helsinki(new Date("2026-12-01T05:00:00Z")).tunti).toBe(7);
    expect(paivanAlku("2026-07-01").toISOString()).toBe("2026-06-30T21:00:00.000Z");
    expect(paivanAlku("2026-12-01").toISOString()).toBe("2026-11-30T22:00:00.000Z");
    expect(paivanAlku("2026-10-25").toISOString()).toBe("2026-10-24T21:00:00.000Z"); // kesäajan viimeinen päivä
  });
  it("lähettää vain kello 7 ja kerran päivässä (kv), pakota ohittaa kellonajan", async () => {
    const kv = new Map<string, string>();
    const haut: Array<[Date, Date]> = [];
    const store = {
      lueKv: async (k: string) => kv.get(k) ?? null,
      kirjoitaKv: async (k: string, v: string) => void kv.set(k, v),
      maksetutValilla: async (a: Date, b: Date) => { haut.push([a, b]); return []; },
      jumissa: async () => [], hitaat: async () => 0, tuotteetSlugilla: async () => new Map(),
    };
    const laheta = vi.fn(async (_v: Record<string, unknown>) => ({ ok: true }));
    // Talviaika: 04:00 UTC = 6, 05:00 UTC = 7.
    expect((await ajaYhteenveto(store, { laheta, vastaanottaja: "info@seniorituki.fi", nyt: new Date("2026-12-01T04:00:00Z") })).lahetetty).toBe(false);
    expect((await ajaYhteenveto(store, { laheta, vastaanottaja: "info@seniorituki.fi", nyt: new Date("2026-12-01T05:00:00Z") })).lahetetty).toBe(true);
    expect(haut[0].map((d) => d.toISOString())).toEqual(["2026-11-29T22:00:00.000Z", "2026-11-30T22:00:00.000Z"]);
    expect(haut[1][0].toISOString()).toBe("2026-11-30T22:00:00.000Z"); // kuun alku
    expect((await ajaYhteenveto(store, { laheta, vastaanottaja: "info@seniorituki.fi", nyt: new Date("2026-12-01T05:30:00Z") })).syy).toBe("jo lähetetty tänään");
    expect(laheta).toHaveBeenCalledTimes(1);
    expect(laheta.mock.calls[0][0]).toMatchObject({ to: "info@seniorituki.fi", subject: "[Huumorikauppa] Päivän yhteenveto 1.12.2026" });
    expect((await ajaYhteenveto(store, { laheta, vastaanottaja: "x", nyt: new Date("2026-12-02T10:00:00Z"), pakota: true })).lahetetty).toBe(true);
    // Kesäaika: 04:00 UTC = 7.
    kv.clear();
    expect((await ajaYhteenveto(store, { laheta, vastaanottaja: "x", nyt: new Date("2026-07-01T04:10:00Z") })).lahetetty).toBe(true);
  });
});

const r2 = (n: number) => Math.round(n * 100) / 100;
