// @vitest-environment node
/**
 * Koodit ilman tietokantaa (5.11.2026): kumppanikoodit (ERAMAANKULKIJAT ja hallinnassa kannan ollessa kiinni luotu
 * kierroksen 3 koodi), uutiskirjeen TERVE-koodi ja lahjakortti kassalla, kun DATABASE_URL osoittaa suljettuun porttiin.
 * Määrittelyt data/koodit.json ja Blob (api/_lib/koodit.js), käytöt Blobiin. Lahjakorttia ei voi käyttää kahdesti,
 * eikä kertakäyttöistä koodia kahteen tilaukseen. Julkaisu ajaa tämän ennen tuotantoversiota.
 */
import { beforeAll, describe, expect, it, vi } from "vitest";

process.env.DATABASE_URL = "postgres://x:y@127.0.0.1:1/x";
process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_testi_salainen";
process.env.CRON_SECRET = "testi-salaisuus";
process.env.STRIPE_SECRET_KEY = "sk_test_x";
process.env.SAHKOPOSTI_SALAISUUS = process.env.SAHKOPOSTI_SALAISUUS || "testi-allekirjoitus";

// Blob muistissa; put ilman allowOverwritea epäonnistuu, jos polku on jo olemassa (kuten Vercel Blob).
const blob = new Map<string, string>();
vi.mock("@vercel/blob", () => ({
  put: async (polku: string, sisalto: string, o: { allowOverwrite?: boolean } = {}) => {
    if (!o.allowOverwrite && blob.has(polku)) throw new Error("BlobError: This blob already exists");
    blob.set(polku, sisalto);
    return { url: `mem://${polku}`, pathname: polku };
  },
  head: async (polku: string) => { if (!blob.has(polku)) throw new Error("BlobNotFoundError: not found"); return { url: `mem://${polku}` }; },
  list: async ({ prefix }: { prefix: string }) => ({ blobs: [...blob.keys()].filter((k) => k.startsWith(prefix)).map((k) => ({ pathname: k, url: `mem://${k}` })), hasMore: false }),
  del: async (urlit: string[]) => { for (const u of urlit) blob.delete(u.replace("mem://", "")); },
}));

const sessiot: { id: string; params: Record<string, unknown> }[] = [];
vi.mock("../../api/_lib/stripe.js", () => ({
  onStripe: () => true,
  stripe: () => ({
    checkout: { sessions: {
      create: async (p: Record<string, unknown>) => { const id = `cs_test_${sessiot.length + 1}`; sessiot.push({ id, params: p }); return { id, url: `https://checkout.stripe.test/${id}` }; },
      expire: async () => ({}),
      retrieve: async (id: string) => ({ id, payment_status: "unpaid", status: "open" }),
    } },
  }),
}));

beforeAll(async () => {
  // Listaus suoraan muistista (sama Map kuin put/head/del).
  const K = await import("../../api/_lib/koodit.js");
  const P = await import("../../api/_lib/puskuri.js");
  const lue = (polku: string) => (blob.has(polku) ? P.pura(JSON.parse(blob.get(polku)!)) : null);
  K.asetaBlob({
    listaa: async (prefix: string) => [...blob.keys()].filter((k) => k.startsWith(prefix)).map((k) => ({ pathname: k, url: `mem://${k}` })),
    lue: async (polku: string) => lue(polku),
    lueUrl: async (url: string) => lue(url.replace("mem://", "")),
    kirjoita: async (polku: string, arvo: unknown) => { blob.set(polku, JSON.stringify(P.salaa(arvo))); },
    luo: async (polku: string, arvo: unknown) => { if (blob.has(polku)) return false; blob.set(polku, JSON.stringify(P.salaa(arvo))); return true; },
    poista: async (urlit: string[]) => { for (const u of urlit) blob.delete(u.replace("mem://", "")); },
  });
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const u = String(url);
    if (u.startsWith("mem://")) {
      const polku = u.slice(6).split("?")[0];
      return blob.has(polku) ? new Response(blob.get(polku), { status: 200 }) : new Response("", { status: 404 });
    }
    return new Response("{}", { status: 503 });
  }));
});

type Vastaus = { status: number; body: Record<string, unknown> };
function vastaus() {
  const out: Vastaus = { status: 0, body: {} };
  const res = {
    status: (c: number) => { out.status = c; return res; },
    json: (b: Record<string, unknown>) => { out.body = b; return res; },
    send: () => res, setHeader: () => res, redirect: () => res,
  };
  return { out, res };
}

async function tuoteJaVariantti(slug = "tonnin-seteli-t-paita") {
  const { kaikkiTuotteet } = await import("../../api/_lib/tuotteet.js");
  const p = (await kaikkiTuotteet()).find((x) => x.slug === slug)!;
  const pois = new Set(p.unavailable_variants || []);
  const [color, size] = Object.keys(p.variants.variant_map).find((k) => !pois.has(k) && /\|M$/.test(k))!.split("|");
  return { id: p.id, slug: p.slug, quantity: 1, color, size };
}

async function kassa(lisa: Record<string, unknown>, email = "ostaja@example.com", slug = "tonnin-seteli-t-paita") {
  const { default: checkout } = await import("../../api/checkout.js");
  const a = vastaus();
  await checkout({ method: "POST", headers: { origin: "https://huumorikauppa.fi", "user-agent": "Mozilla/5.0" }, body: {
    items: [await tuoteJaVariantti(slug)], customerEmail: email, customerName: "Testi Ostaja",
    shippingAddress: { address: "Katu 1", zip: "00100", city: "Helsinki", phone: "0401234567" }, ...lisa,
  } } as never, a.res as never);
  return a.out.body;
}

async function puskuritilaus(sessio: string) {
  const s = sessiot.find((x) => x.id === sessio)!;
  const { lueBlob } = await import("../../api/_lib/puskuri.js");
  return lueBlob(`puskuri/tilaukset/${s.params.client_reference_id}.json`) as Promise<Record<string, unknown>>;
}

describe("kumppanikoodit ilman tietokantaa", () => {
  it("ERAMAANKULKIJAT: kassa antaa mallin 2 alennuksen ja kirjaa kumppanin tilaukselle", async () => {
    const { default: checkout } = await import("../../api/checkout.js");
    const t = vastaus();
    await checkout({ method: "POST", headers: {}, body: { action: "kumppanikoodi", code: "ERAMAANKULKIJAT", items: [await tuoteJaVariantti()] } } as never, t.res as never);
    expect(t.out.body).toMatchObject({ ok: true, koodi: "eramaankulkijat", malli: "alennus" });
    const r = await kassa({ kumppani: "ERAMAANKULKIJAT" });
    expect(r).toMatchObject({ ok: true });
    const tilaus = await puskuritilaus(sessiot.at(-1)!.id);
    // Alennus toteutuu, jos 7 €:n kate riittää (sama sääntö kuin kannan kanssa); muuten 0 % ja provisio ilman alennusta.
    if (Number(t.out.body.prosentti) > 0) {
      expect(String(tilaus.discount_code)).toMatch(/^ERAMAANKULKIJAT \(kumppani -\d %\)$/);
      expect(Number(tilaus.discount)).toBeGreaterThan(0);
    } else expect(t.out.body.syy).toBeTruthy();
    expect((tilaus.tapahtumat as { kind: string; details: { koodi: string } }[]).find((e) => e.kind === "kumppani")?.details.koodi).toBe("eramaankulkijat");
  });

  it("kierroksen 3 koodi luotuna hallinnassa kannan ollessa kiinni: /k/-sivu ja kassa toimivat heti", async () => {
    const { kasittele } = await import("../../api/sahkoposti.js");
    const { allekirjoita } = await import("../../api/_lib/markkinointi.js");
    const avain = allekirjoita("hallinta", "kaikki");
    const luo = vastaus();
    await kasittele({ method: "POST", query: {}, headers: {}, body: { action: "kumppani-luo", avain, teksti: "Retkeilijät Testi ry; 2" } } as never, luo.res as never, {} as never);
    expect(luo.out.body).toMatchObject({ ok: true });
    const koodi = (luo.out.body.tulokset as { koodi: string }[])[0].koodi;
    expect(koodi).toBe("retkeilijat-testi-ry");
    const sivu = vastaus();
    await kasittele({ method: "GET", query: { kumppanisivu: koodi }, headers: { "user-agent": "Mozilla/5.0" }, body: {} } as never, sivu.res as never, {} as never);
    expect(sivu.out.body).toMatchObject({ ok: true, koodi, malli: "alennus" });
    expect(await kassa({ kumppani: koodi })).toMatchObject({ ok: true });
    // Poisto käytöstä: koodi ei enää kelpaa.
    const pois = vastaus();
    await kasittele({ method: "POST", query: {}, headers: {}, body: { action: "kumppani-tila", avain, koodi, aktiivinen: false } } as never, pois.res as never, {} as never);
    expect(pois.out.body).toMatchObject({ ok: true });
    const { kumppaninTiedot } = await import("../../api/_lib/kumppani.js");
    const { nollaaMuisti } = await import("../../api/_lib/koodit.js");
    nollaaMuisti();
    expect(await kumppaninTiedot(null, koodi)).toBeNull();
  });
});

describe("uutiskirjeen koodi ilman tietokantaa", () => {
  it("tilaus antaa TERVE-koodin, joka toimii kerran samalla osoitteella", async () => {
    const { kasittele } = await import("../../api/sahkoposti.js");
    const t = vastaus();
    await kasittele({ method: "POST", query: {}, headers: {}, body: { action: "tilaa", email: "uusi@example.com", suostumus: true, lahde: "testi" } } as never, t.res as never, {} as never);
    const koodi = t.out.body.koodi as string;
    expect(koodi).toMatch(/^TERVE-/);
    // Toisella osoitteella: henkilökohtainen.
    expect(await kassa({ discountCode: koodi }, "muu@example.com", "tonnin-seteli-huppari")).toMatchObject({ ok: false, error: expect.stringMatching(/henkilökohtainen/) });
    // Omalla osoitteella: alennus ja varaus.
    const oma = await kassa({ discountCode: koodi }, "uusi@example.com", "tonnin-seteli-huppari");
    expect(oma, JSON.stringify(oma)).toMatchObject({ ok: true });
    const tilaus = await puskuritilaus(sessiot.at(-1)!.id);
    expect(Number(tilaus.discount)).toBeGreaterThan(0);
    // Sama koodi toiseen tilaukseen samaan aikaan: varattu.
    expect(await kassa({ discountCode: koodi }, "uusi@example.com", "tonnin-seteli-huppari")).toMatchObject({ ok: false, error: expect.stringMatching(/ensimmäiseen|käytetty/) });
    // Ensimmäisen session vanheneminen vapauttaa koodin.
    const { vapautaPuskuriVaraukset } = await import("../../api/_lib/tilaus.js");
    await vapautaPuskuriVaraukset(tilaus as never);
    expect(await kassa({ discountCode: koodi }, "uusi@example.com", "tonnin-seteli-huppari")).toMatchObject({ ok: true });
  });
});

describe("lahjakortti ilman tietokantaa", () => {
  const KOODI = "HK-ABCD-EFGH-JKMN";
  it("saldo tilannekuvasta, varaus kassalla, veloitus maksun jälkeen, ei kaksoiskäyttöä", async () => {
    const P = await import("../../api/_lib/puskuri.js");
    const K = await import("../../api/_lib/koodit.js");
    await P.kirjoitaBlob("koodit/tilannekuva.json", { lahjakortit: [{ code: KOODI, balance: 30, initial_value: 50, expires_at: "2028-01-01T00:00:00Z" }], sovelletut: [] });
    K.nollaaMuisti();
    const { default: checkout } = await import("../../api/checkout.js");
    const tarkistus = vastaus();
    await checkout({ method: "POST", headers: {}, body: { action: "lahjakortti", code: "hk abcd efgh jkmn" } } as never, tarkistus.res as never);
    expect(tarkistus.out.body).toMatchObject({ ok: true, code: KOODI, saldo: 30 });

    // Paita 27,90 + toimitus: kortti kattaa 30 €, loput Stripellä.
    expect(await kassa({ giftCardCode: KOODI })).toMatchObject({ ok: true });
    const s1 = sessiot.at(-1)!;
    const t1 = await puskuritilaus(s1.id);
    expect(Number(t1.gift_card_amount)).toBe(30);
    expect(s1.params.expires_at).toBeGreaterThan(Date.now() / 1000);
    expect((await K.lahjakorttiIlmanKantaa(KOODI))!.balance).toBe(0);
    // Sama kortti toiseen tilaukseen: saldo on varattu.
    expect(await kassa({ giftCardCode: KOODI })).toMatchObject({ ok: false });

    // Maksu: varaus veloitetuksi, saldo pysyy 0:ssa.
    const { kasittelePuskuriMaksu } = await import("../../api/_lib/tilaus.js");
    process.env.PRINTIFY_API_KEY = "";
    await kasittelePuskuriMaksu({ id: s1.id, payment_status: "paid", amount_total: 450, payment_intent: "pi_1" }, String(t1.id));
    expect((await K.lahjakorttiIlmanKantaa(KOODI))!.balance).toBe(0);
    expect(await kassa({ giftCardCode: KOODI })).toMatchObject({ ok: false, error: expect.stringMatching(/saldo/i) });
  });

  it("kaksi samanaikaista käyttöä: vain toinen saa saldon", async () => {
    const P = await import("../../api/_lib/puskuri.js");
    const K = await import("../../api/_lib/koodit.js");
    const k2 = "HK-QRST-UVWX-YZ23";
    await P.kirjoitaBlob("koodit/tilannekuva.json", { lahjakortit: [{ code: k2, balance: 10, initial_value: 25, expires_at: "2028-01-01T00:00:00Z" }], sovelletut: [] });
    K.nollaaMuisti();
    const tulokset = await Promise.all([K.varaaLahjakortti(k2, 8, "t-a"), K.varaaLahjakortti(k2, 8, "t-b"), K.varaaLahjakortti(k2, 8, "t-c")]);
    expect(tulokset.filter((r) => r.ok).length).toBe(1);
    expect((await K.lahjakorttiIlmanKantaa(k2))!.balance).toBe(2);
    // Vapautus palauttaa saldon.
    const voittaja = ["t-a", "t-b", "t-c"][tulokset.findIndex((r) => r.ok)];
    await K.paivitaLahjakortti(k2, voittaja, "vapautettu");
    expect((await K.lahjakorttiIlmanKantaa(k2))!.balance).toBe(10);
  });
});

describe("koodit kantaan, kun kanta vastaa", () => {
  it("veloitettu lahjakorttikäyttö gift_card_redemptions-tauluun kerran, kumppani ja tilaaja kantaan, Blob siivotaan", async () => {
    const K = await import("../../api/_lib/koodit.js");
    const kyselyt: string[] = [];
    const db = Object.assign(async (osat: TemplateStringsArray) => {
      const t = osat.join("?").replace(/\s+/g, " ");
      kyselyt.push(t);
      if (t.includes("insert into gift_card_redemptions")) return [{ id: 1 }];
      return [];
    }, { begin: async (f: (tx: unknown) => Promise<void>) => f(db), json: (x: unknown) => x });
    const r = await K.siirraKoodit(db as never);
    expect(r.lahjakortit).toBeGreaterThanOrEqual(1);
    expect(r.kumppanit).toBeGreaterThanOrEqual(1);
    expect(r.tilaajat).toBeGreaterThanOrEqual(1);
    expect(kyselyt.filter((k) => k.includes("update gift_cards set balance")).length).toBe(r.lahjakortit);
    expect([...blob.keys()].filter((k) => k.startsWith("koodit/kumppanit/") || k.startsWith("koodit/tilaajat/"))).toEqual([]);
    expect([...blob.keys()].some((k) => k === "koodit/tilannekuva.json")).toBe(true);
  });
});
