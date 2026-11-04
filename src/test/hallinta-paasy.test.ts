// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => { process.env.MARKKINOINTI_SALAISUUS = "testisalaisuus-hallinta"; });

const res = () => {
  const h: Record<string, unknown> = {};
  return { h, setHeader: (k: string, v: unknown) => { h[k.toLowerCase()] = v; }, getHeader: (k: string) => h[k.toLowerCase()] };
};

describe("hallintasivujen pääsy evästeellä", () => {
  it("kelvollinen avain tallentuu evästeeseen 90 päiväksi, eväste riittää ilman avainta", async () => {
    const { hallintaPaasy } = await import("../../api/sahkoposti.js");
    const { allekirjoita } = await import("../../api/_lib/markkinointi.js");
    const avain = allekirjoita("hallinta", "mittarit");
    const r1 = res();
    expect(hallintaPaasy({ headers: {} }, r1, "mittarit", avain)).toBe(true);
    const evaste = String((r1.h["set-cookie"] as string[])[0]);
    expect(evaste).toMatch(/^hk_hallinta_mittarit=.+; Path=\/; Max-Age=7776000; HttpOnly; Secure; SameSite=Lax$/);
    expect(r1.h["cache-control"]).toBe("private, no-store");
    const pari = evaste.split(";")[0];
    expect(hallintaPaasy({ headers: { cookie: `muu=1; ${pari}` } }, res(), "mittarit", "")).toBe(true);
    // Toisen sivun eväste tai avain ei kelpaa, eikä mikään ilman avainta.
    expect(hallintaPaasy({ headers: { cookie: pari.replace("mittarit=", "some=") } }, res(), "some", "")).toBe(false);
    expect(hallintaPaasy({ headers: {} }, res(), "some", avain)).toBe(false);
    expect(hallintaPaasy({ headers: {} }, res(), "mittarit", "")).toBe(false);
    expect(hallintaPaasy({ headers: { cookie: "hk_hallinta_mittarit=vaara.avain" } }, res(), "mittarit", undefined)).toBe(false);
  });

  it("viesti: otsikko, neljä avaimellista linkkiä ja ohjeet", async () => {
    const { hallintaLinkit, hallintalinkkiViesti, yhteenvetoRivit } = await import("../../api/_lib/hallinta.js");
    const l = hallintaLinkit("https://huumorikauppa.fi");
    const v = hallintalinkkiViesti(l);
    expect(v.subject).toBe("Hallintalinkit Coworkille");
    for (const s of ["mittarit", "some", "tarjoukset", "kumppanit"]) expect(v.text).toContain(`https://huumorikauppa.fi/hallinta/${s}?avain=`);
    expect(v.text).toContain('"action":"mainoskulut"');
    expect(v.text).toContain('"action":"yritysluvut"');
    expect(v.text).not.toMatch(/[–—]/);
    expect(yhteenvetoRivit(l)[0]).toContain("/hallinta/tarjoukset?avain=");
  });
});

describe("aktivointikoodi", () => {
  it("muoto, normalisointi ja tiiviste", async () => {
    const { uusiKoodi, normalisoi, tiiviste } = await import("../../api/_lib/aktivointi.js");
    const k = uusiKoodi();
    expect(k).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(normalisoi(` ${k.toLowerCase()} `)).toBe(k.replace("-", ""));
    expect(tiiviste(k.toLowerCase())).toBe(tiiviste(k));
    expect(tiiviste(k)).not.toContain(k.replace("-", ""));
  });
});
