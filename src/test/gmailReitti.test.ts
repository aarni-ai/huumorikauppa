// @vitest-environment node
/**
 * Gmailin väliaikainen lähetysreitti (3.11.2026, api/_lib/sahkoposti.js): reitin valinta, automaattinen paluu
 * Resendiin domainin vahvistuttua, liitteet ja markkinoinnin 100 viestin päiväkatto (api/_lib/markkinointi.js).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { laheta, lahetysreitti, markkinointiKaytossa, omaVahvistusKaytossa, onSahkoposti, asetaGmailKuljetin, gmailLiitteet, halytys } from "../../api/_lib/sahkoposti.js";
import { nollaaDomainMuisti, ajaUutiskirje } from "../../api/_lib/uutiskirje.js";
import { lahetysrajat, kvAvain, rajatKatolla, MARKKINOINTI_PAIVAKATTO, peruutusOtsakkeet } from "../../api/_lib/markkinointi.js";

const ENV = { ...process.env };
const alkuFetch = globalThis.fetch;
let kuljetin: { sendMail: ReturnType<typeof vi.fn> };
let resendKutsut: string[];

/** Resendin API: domainin tila ja lähetykset. */
function resend(domainTila: string) {
  resendKutsut = [];
  globalThis.fetch = vi.fn(async (url: string | URL) => {
    const u = String(url);
    resendKutsut.push(u);
    if (u.endsWith("/domains")) return new Response(JSON.stringify({ data: [{ name: "huumorikauppa.fi", status: domainTila }] }), { status: 200 });
    return new Response(JSON.stringify({ id: "x" }), { status: 200 });
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  for (const k of ["GMAIL_APP_PASSWORD", "RESEND_API_KEY", "SAHKOPOSTI_VAHVISTETTU", "MARKKINOINTI_RAJA_PAIVA", "MARKKINOINTI_RAJA_AJO", "EMAIL_FROM"]) delete process.env[k];
  process.env.CRON_SECRET = "testi-salaisuus";
  nollaaDomainMuisti();
  kuljetin = { sendMail: vi.fn(async () => ({ messageId: "1" })) };
  asetaGmailKuljetin(kuljetin);
  resend("not_started");
});
afterEach(() => {
  process.env = { ...ENV };
  globalThis.fetch = alkuFetch;
  asetaGmailKuljetin(null);
  nollaaDomainMuisti();
});

describe("Gmail-reitin valinta", () => {
  it("ilman Gmail-salasanaa kaikki pysyy ennallaan (Resend)", async () => {
    process.env.RESEND_API_KEY = "re_testi";
    expect(await lahetysreitti()).toBe("resend");
    expect(omaVahvistusKaytossa()).toBe(false);
    expect(await markkinointiKaytossa()).toBe(false);
  });

  it("salasana asetettu, domain vahvistamatta: Gmail, oma vahvistus ja markkinointi päälle", async () => {
    process.env.RESEND_API_KEY = "re_testi";
    process.env.GMAIL_APP_PASSWORD = "abcd efgh ijkl mnop";
    expect(await lahetysreitti()).toBe("gmail");
    expect(onSahkoposti()).toBe(true);
    expect(omaVahvistusKaytossa()).toBe(true);
    expect(await markkinointiKaytossa()).toBe(true);
  });

  it("pelkkä Gmail ilman Resend-avainta toimii", async () => {
    process.env.GMAIL_APP_PASSWORD = "abcdefghijklmnop";
    expect(await lahetysreitti()).toBe("gmail");
    const r = await laheta({ to: "a@b.fi", subject: "S", html: "<p>x</p>", text: "x" });
    expect(r).toMatchObject({ ok: true, reitti: "gmail" });
  });

  it("paluu Resendiin: kun Resend kertoo domainin vahvistetuksi, viestit lähtevät Resendillä ilman koodimuutosta", async () => {
    process.env.RESEND_API_KEY = "re_testi";
    process.env.GMAIL_APP_PASSWORD = "abcdefghijklmnop";
    expect((await laheta({ to: "a@b.fi", subject: "Ennen", text: "x" })).reitti).toBe("gmail");
    resend("verified");
    nollaaDomainMuisti(); // tunnin muisti vanhenee
    const r = await laheta({ to: "a@b.fi", subject: "Jälkeen", text: "x" });
    expect(r).toMatchObject({ ok: true, reitti: "resend" });
    expect(resendKutsut.some((u) => u.endsWith("/emails"))).toBe(true);
    expect(kuljetin.sendMail).toHaveBeenCalledTimes(1);
  });

  it("SAHKOPOSTI_VAHVISTETTU=1 palauttaa Resendin heti", async () => {
    process.env.RESEND_API_KEY = "re_testi";
    process.env.GMAIL_APP_PASSWORD = "abcdefghijklmnop";
    process.env.SAHKOPOSTI_VAHVISTETTU = "1";
    expect(await lahetysreitti()).toBe("resend");
    await laheta({ to: "a@b.fi", subject: "S", text: "x" });
    expect(kuljetin.sendMail).not.toHaveBeenCalled();
  });
});

describe("Gmail-lähetys", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_testi";
    process.env.GMAIL_APP_PASSWORD = "abcdefghijklmnop";
  });

  it("lahjakortin PDF liitteenä Bufferina, peruutusotsakkeet ja vastausosoite mukana", async () => {
    const pdf = Buffer.from("%PDF-1.4 testi");
    const otsakkeet = peruutusOtsakkeet("a@b.fi");
    const r = await laheta({ to: "a@b.fi", subject: "Lahjakorttisi", html: "<p>x</p>", text: "x", headers: otsakkeet,
      attachments: [{ filename: "lahjakortti-ABC.pdf", content: pdf.toString("base64") }] });
    expect(r.ok).toBe(true);
    const m = kuljetin.sendMail.mock.calls[0][0];
    expect(m.from).toEqual({ name: "Huumorikauppa", address: "huumorikauppa@gmail.com" });
    expect(m.to).toBe("a@b.fi");
    expect(m.replyTo).toBe("huumorikauppa@gmail.com");
    expect(m.headers["List-Unsubscribe"]).toBe(otsakkeet["List-Unsubscribe"]);
    expect(m.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(m.attachments[0].filename).toBe("lahjakortti-ABC.pdf");
    expect(Buffer.compare(m.attachments[0].content, pdf)).toBe(0);
    expect(gmailLiitteet(undefined)).toEqual([]);
  });

  it("omistajan hälytys menee Gmaililla, ei Resendin testilähettäjälle", async () => {
    const r = await halytys("Testi", ["rivi"]);
    expect(r.ok).toBe(true);
    expect(kuljetin.sendMail.mock.calls[0][0].to).toBe("huumorikauppa@gmail.com");
    expect(resendKutsut.some((u) => u.endsWith("/emails"))).toBe(false);
  });

  it("SMTP-virhe palautetaan, ei heitetä", async () => {
    kuljetin.sendMail.mockRejectedValueOnce(new Error("Invalid login"));
    const r = await laheta({ to: "a@b.fi", subject: "S", text: "x" });
    expect(r).toMatchObject({ ok: false, reitti: "gmail" });
    expect(r.virhe).toMatch(/Gmail: Invalid login/);
  });
});

describe("Markkinoinnin päiväkatto 100", () => {
  it("ympäristömuuttuja voi vain laskea rajaa", () => {
    expect(lahetysrajat().paiva).toBe(MARKKINOINTI_PAIVAKATTO);
    process.env.MARKKINOINTI_RAJA_PAIVA = "500";
    expect(lahetysrajat().paiva).toBe(100);
    process.env.MARKKINOINTI_RAJA_PAIVA = "40";
    expect(lahetysrajat().paiva).toBe(40);
    expect(rajatKatolla({ ajo: 20, paiva: 1000 }).paiva).toBe(100);
  });

  it("laskuri on Helsingin päivän mukaan", () => {
    expect(kvAvain(new Date("2026-11-03T22:30:00Z"))).toBe("markkinointi_lahetetty_2026-11-04");
    expect(kvAvain(new Date("2026-11-03T21:30:00Z"))).toBe("markkinointi_lahetetty_2026-11-03");
  });

  it("uutiskirje pysähtyy sataan viestiin päivässä, vaikka rajaksi annettaisiin enemmän", async () => {
    const kv = new Map<string, string>([[kvAvain(new Date("2026-11-16T08:00:00Z")), "90"]]);
    const t = new Map(Array.from({ length: 30 }, (_, i) => [`t${i}@b.fi`, { email: `t${i}@b.fi` } as Record<string, unknown>]));
    const store = {
      lueKv: async (k: string) => kv.get(k) ?? null,
      kirjoitaKv: async (k: string, v: string) => void kv.set(k, v),
      haeTilaaja: async (e: string) => t.get(e) ?? null,
      merkitseTervetulo: async (e: string, aika: Date) => void (t.get(e)!.welcome_sent_at = aika),
      maksettujaTilauksia: async () => 0,
      koodiKaytetty: async () => false,
      tervetulojono: async (raja: number) => [...t.values()].filter((x) => !x.welcome_sent_at).slice(0, raja),
      kampanjanVastaanottajat: async () => [],
      varaaLahetys: async () => true,
      vapautaLahetys: async () => undefined,
    };
    const l = vi.fn(async () => ({ ok: true }));
    const r = await ajaUutiskirje(store, { laheta: l, vahvistettu: true, nyt: new Date("2026-11-16T08:00:00Z"), rajat: { ajo: 500, paiva: 500 } });
    expect(r.lahetetty).toBe(10);
    expect(kv.get(kvAvain(new Date("2026-11-16T08:00:00Z")))).toBe("100");
  });
});
