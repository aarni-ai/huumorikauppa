// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  JOULUKAMPANJA, JOULU_TILAUSPAIVA, JOULU_TPAITA_TILAUSPAIVA, joulukampanjaViesti, avoinKampanjaviesti, ajaUutiskirje,
  domainVahvistettu, nollaaDomainMuisti, lyhytPaiva,
} from "../../api/_lib/uutiskirje.js";
import { TPAITAPARI_KAMPANJA } from "../../api/_lib/vakiot.js";
import { JOULU_TILAUSPAIVA_ISO, joulunTilauspaivaTyypille } from "@/data/campaignSchedule";
import productSlugs from "@/test/fixtures/productSlugs.json";
import { JOULUMALLISTO_SLUGIT } from "@/data/joulumallisto2026";
import { LISTA_OTSIKKO } from "@/components/NewsletterLista";

type Rivi = Record<string, unknown>;
const ENV = { ...process.env };
beforeEach(() => {
  process.env.CRON_SECRET = "testi-salaisuus";
  delete process.env.SAHKOPOSTI_VAHVISTETTU;
  delete process.env.RESEND_API_KEY;
  nollaaDomainMuisti();
});
afterEach(() => { process.env = { ...ENV }; });

function varasto(tilaajat: Rivi[], kiellot: string[] = []) {
  const kv = new Map<string, string>();
  const loki = new Set<string>();
  const t = new Map(tilaajat.map((x) => [x.email as string, { ...x }]));
  return {
    t, loki,
    lueKv: async (k: string) => kv.get(k) ?? null,
    kirjoitaKv: async (k: string, v: string) => void kv.set(k, v),
    haeTilaaja: async (e: string) => t.get(e) ?? null,
    merkitseTervetulo: async (e: string, aika: Date) => void (t.get(e)!.welcome_sent_at = aika),
    maksettujaTilauksia: async () => 0,
    koodiKaytetty: async () => false,
    tervetulojono: async (raja: number) => [...t.values()].filter((x) => !x.welcome_sent_at && !kiellot.includes(x.email as string)).slice(0, raja),
    kampanjanVastaanottajat: async (v: string, raja: number) => [...t.values()].filter((x) => !kiellot.includes(x.email as string) && !loki.has(`${v}|${x.email}`)).slice(0, raja),
    varaaLahetys: async (v: string, e: string) => (loki.has(`${v}|${e}`) ? false : (loki.add(`${v}|${e}`), true)),
    vapautaLahetys: async (v: string, e: string) => void loki.delete(`${v}|${e}`),
  };
}
const ok = () => vi.fn(async () => ({ ok: true }));

describe("uutiskirje: joulukampanja", () => {
  it("päivät vastaavat joulun tilauspäiviä ja Black Fridayn kampanjaa", () => {
    expect(JOULU_TILAUSPAIVA).toBe(JOULU_TILAUSPAIVA_ISO);
    expect(JOULU_TPAITA_TILAUSPAIVA).toBe(joulunTilauspaivaTyypille("t-paidat"));
    expect(JOULUKAMPANJA).toHaveLength(3);
    expect(JOULUKAMPANJA[1].alku).toBe(TPAITAPARI_KAMPANJA.alku);
    expect(JOULUKAMPANJA[2].loppu).toBe(JOULU_TILAUSPAIVA);
    for (let i = 1; i < 3; i++) expect(JOULUKAMPANJA[i].alku > JOULUKAMPANJA[i - 1].loppu).toBe(true);
    expect(lyhytPaiva("2026-12-01")).toBe("ti 1.12.");
  });

  it("viestit: HTML ja teksti, utm_source=uutiskirje, peruutuslinkki ja -otsake, olemassa olevat tuotteet, ei ajatusviivoja", () => {
    for (const v of JOULUKAMPANJA) {
      const m = joulukampanjaViesti(v, "a@b.fi");
      const kaikki = `${m.subject} ${m.html} ${m.text}`;
      expect(kaikki).not.toMatch(/[–—]| - /);
      expect(kaikki).not.toMatch(/saattaa|ehkä|todennäköisesti|suosituin|myydyin/i);
      expect(m.html).toContain("utm_source=uutiskirje");
      expect(m.text).toContain("/unsubscribe?token=");
      expect(m.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
      for (const [slug] of v.tuotteet) expect([...(productSlugs as string[]), ...JOULUMALLISTO_SLUGIT]).toContain(slug);
    }
    const bf = joulukampanjaViesti(JOULUKAMPANJA[1], "a@b.fi").text;
    expect(bf).toContain("alin hinta 30 päivän aikana: 24,90 €");
  });

  it("ikkuna: vain kampanjapäivinä klo 9 alkaen Suomen aikaa", () => {
    expect(avoinKampanjaviesti(new Date("2026-11-16T05:00:00Z"))).toBeNull(); // klo 7
    expect(avoinKampanjaviesti(new Date("2026-11-16T06:30:00Z"))).toBeNull();
    expect(avoinKampanjaviesti(new Date("2026-11-16T07:30:00Z"))?.id).toBe("joulu2026-1");
    expect(avoinKampanjaviesti(new Date("2026-11-27T10:00:00Z"))?.id).toBe("joulu2026-2");
    expect(avoinKampanjaviesti(new Date("2026-11-30T10:00:00Z"))?.id).toBe("joulu2026-3");
    expect(avoinKampanjaviesti(new Date("2026-12-02T10:00:00Z"))).toBeNull();
    expect(avoinKampanjaviesti(new Date("2026-11-02T10:00:00Z"))).toBeNull();
  });
});

describe("uutiskirje: lähetys", () => {
  const nyt = new Date("2026-11-16T08:00:00Z");
  it("ei mitään ilman vahvistettua domainia", async () => {
    const s = varasto([{ email: "a@b.fi" }]);
    const l = ok();
    expect((await ajaUutiskirje(s, { laheta: l, vahvistettu: false, nyt })).lahetetty).toBe(0);
    expect(l).not.toHaveBeenCalled();
  });
  it("tervetuloviesti koodilla kerran, kampanjaviesti kerran, ei peruneille, päiväraja", async () => {
    const s = varasto([{ email: "a@b.fi", discount_code: "TERVE-ABCDEF", discount_percent: 5 }, { email: "b@b.fi", welcome_sent_at: nyt }, { email: "c@b.fi" }], ["c@b.fi"]);
    const l = ok();
    const r = await ajaUutiskirje(s, { laheta: l, vahvistettu: true, nyt, rajat: { ajo: 20, paiva: 60 } });
    expect(r.lahetetty).toBe(3); // a tervetulo + a ja b kampanja
    const viestit = l.mock.calls.map((c) => (c as unknown as [Rivi])[0]);
    expect(viestit.filter((v) => String(v.html).includes("TERVE-ABCDEF"))).toHaveLength(1);
    expect(viestit.some((v) => v.to === "c@b.fi")).toBe(false);
    expect((await ajaUutiskirje(s, { laheta: l, vahvistettu: true, nyt })).lahetetty).toBe(0);
    const s2 = varasto([{ email: "x@b.fi", welcome_sent_at: nyt }, { email: "y@b.fi", welcome_sent_at: nyt }]);
    expect((await ajaUutiskirje(s2, { laheta: ok(), vahvistettu: true, nyt, rajat: { ajo: 1, paiva: 60 } })).lahetetty).toBe(1);
  });
  it("epäonnistunut lähetys vapautetaan seuraavaan ajoon", async () => {
    const s = varasto([{ email: "a@b.fi", welcome_sent_at: nyt }]);
    await ajaUutiskirje(s, { laheta: vi.fn(async () => ({ ok: false, virhe: "x" })), vahvistettu: true, nyt });
    expect(s.loki.size).toBe(0);
  });
});

describe("uutiskirje: domainin tila", () => {
  it("SAHKOPOSTI_VAHVISTETTU=1 riittää; ilman avainta pois; Resendin verified-tila muistissa", async () => {
    expect(await domainVahvistettu()).toBe(false);
    process.env.SAHKOPOSTI_VAHVISTETTU = "1";
    expect(await domainVahvistettu()).toBe(true);
    delete process.env.SAHKOPOSTI_VAHVISTETTU;
    process.env.RESEND_API_KEY = "re_testi";
    const hae = vi.fn(async () => new Response(JSON.stringify({ data: [{ name: "huumorikauppa.fi", status: "pending" }] }), { status: 200 }));
    expect(await domainVahvistettu({ hae: hae as unknown as typeof fetch, nyt: 1 })).toBe(false);
    expect(await domainVahvistettu({ hae: hae as unknown as typeof fetch, nyt: 1000 })).toBe(false);
    expect(hae).toHaveBeenCalledTimes(1);
    nollaaDomainMuisti();
    const hae2 = vi.fn(async () => new Response(JSON.stringify({ data: [{ name: "huumorikauppa.fi", status: "verified" }] }), { status: 200 }));
    expect(await domainVahvistettu({ hae: hae2 as unknown as typeof fetch })).toBe(true);
    nollaaDomainMuisti();
    expect(await domainVahvistettu({ hae: (async () => new Response("", { status: 401 })) as unknown as typeof fetch })).toBe(false);
  });
});

describe("uutiskirje: lomakkeen teksti", () => {
  it("otsikko kuten pyydetty", () => {
    expect(LISTA_OTSIKKO).toBe("Liity listalle ja saat 5 % ensimmäisestä tilauksesta");
  });
});
