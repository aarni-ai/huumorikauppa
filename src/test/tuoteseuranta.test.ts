import { describe, expect, it } from "vitest";
import { koostaTuoteseuranta, puhdista, tuoteseurantaRivit } from "../../api/_lib/tuoteseuranta.js";
import { onOmaTaiBotti } from "../../api/_lib/kaynnit.js";
import { aikakori, vierityskori } from "@/lib/tuoteseuranta";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

describe("tuotesivun seuranta", () => {
  it("vain sallitut tapahtumat, näyttö aina mukana", () => {
    expect(puhdista({ tapahtumat: ["koko", "hakkerointi", "koko"], vieritys: "75", aika: "10-30" })).toEqual(["koko", "naytto", "vieritys:75", "aika:10-30"]);
    expect(puhdista({ vieritys: "33", aika: "x" })).toEqual(["naytto"]);
  });
  it("korit selaimessa", () => {
    expect([0.1, 0.3, 0.6, 0.8, 0.99].map(vierityskori)).toEqual([null, "25", "50", "75", "100"]);
    expect([3, 20, 45, 120, 500].map(aikakori)).toEqual(["0-10", "10-30", "30-60", "60-180", "180+"]);
  });
  it("kooste: osuudet, kertyvä vieritys ja poistumiskohta", () => {
    const s = koostaTuoteseuranta([{ tapahtuma: "naytto", n: 100 }, { tapahtuma: "koko", n: 20 }, { tapahtuma: "kori", n: 2 },
      { tapahtuma: "vieritys:25", n: 30 }, { tapahtuma: "vieritys:100", n: 10 }, { tapahtuma: "aika:0-10", n: 40 }]);
    expect(s.osuudet.koko).toBe(20);
    expect(s.vieritys["25"]).toBe(40);
    expect(s.vieritys["100"]).toBe(10);
    expect(s.poistuminen).toContain("20 % valitsee koon");
    expect(tuoteseurantaRivit({ alku: "2026-11-02", loppu: "2026-11-03", ...s })[0]).toContain("100 katselua");
  });
});

describe("oma liikenne ja botit pois", () => {
  it("botit, hallintaselain, testi ja ulkoinen kutsu", () => {
    expect(onOmaTaiBotti({ ua: "Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)" })).toBe("botti");
    expect(onOmaTaiBotti({ ua: "node" })).toBe("botti");
    expect(onOmaTaiBotti({ ua: IPHONE, cookie: "x=1; hk_hallinta_mittarit=abc" })).toBe("oma");
    expect(onOmaTaiBotti({ ua: IPHONE, cookie: "hk_oma=1" })).toBe("oma");
    expect(onOmaTaiBotti({ ua: IPHONE, testi: true })).toBe("testi");
    expect(onOmaTaiBotti({ ua: IPHONE, secFetchSite: "cross-site" })).toBe("ulkoinen");
    expect(onOmaTaiBotti({ ua: IPHONE, secFetchSite: "same-origin", cookie: "hk_kumppani=x" })).toBeNull();
  });
});

describe("hallinnan taikalinkki", () => {
  it("viesti: otsikko, linkki ja ohje ilman koodia", async () => {
    const { aktivointilinkkiViesti, LINKKI_VOIMASSA_TUNTIA, EVASTE_PAIVAA } = await import("../../api/_lib/aktivointi.js");
    const v = aktivointilinkkiViesti("https://huumorikauppa.fi/hallinta/aktivoi?t=abc", new Date("2026-11-04T12:00:00Z"));
    expect(v.subject).toBe("Hallinnan aktivointilinkki Coworkille");
    expect(v.text).toContain("https://huumorikauppa.fi/hallinta/aktivoi?t=abc");
    expect(v.text).toContain("Huumorikauppa");
    expect(v.html).not.toMatch(/[–—]/);
    expect([LINKKI_VOIMASSA_TUNTIA, EVASTE_PAIVAA]).toEqual([48, 90]);
  });
});

describe("somekävijät ilman UTM-linkkiä", () => {
  it("sovelluksen selain ja viittaaja", async () => {
    const { kaynninLahde } = await import("../../api/_lib/kaynnit.js");
    expect(kaynninLahde({ ua: "Mozilla/5.0 (iPhone) Mobile/15E148 Instagram 300.0.0.0" })).toBe("instagram");
    expect(kaynninLahde({ ua: "Mozilla/5.0 (Linux; Android 13) musical_ly_2023 BytedanceWebview/d8a21c6" })).toBe("tiktok");
    expect(kaynninLahde({ ua: "Mozilla/5.0 (iPhone) [FBAN/FBIOS;FBAV/440.0]" })).toBe("facebook");
    expect(kaynninLahde({ ua: "Mozilla/5.0 (iPhone) Pinterest for iOS/12.0" })).toBe("pinterest");
    expect(kaynninLahde({ viittaaja: "l.instagram.com" })).toBe("instagram");
    expect(kaynninLahde({ viittaaja: "www.tiktok.com" })).toBe("tiktok");
    expect(kaynninLahde({ utm: "testi", ua: "Instagram" })).toBe("testi");
  });
});
