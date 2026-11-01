import { describe, expect, it } from "vitest";
import { kaynninLahde, sivunOsio, onBotti, koostaKaynnit } from "../../api/_lib/kaynnit.js";
import { tavoitelaskelma, tilausSummat, mittaririvit, KONVERSIO_VARA } from "../../api/_lib/mittarit.js";
import { kaynninTiedot } from "@/lib/kaynti";
import { linkitSivulla, utmPerään } from "@/data/linkit";

describe("käyntilaskuri", () => {
  it("lähde: utm ensin, sitten kumppani, Google Ads ja viittaaja; oma sivusto ja tyhjä = suora", () => {
    expect(kaynninLahde({ utm: "TikTok", viittaaja: "www.google.com" })).toBe("tiktok");
    expect(kaynninLahde({ utm: "ig" })).toBe("instagram");
    expect(kaynninLahde({ ref: "keisarit" })).toBe("kumppani");
    expect(kaynninLahde({ gclid: true, viittaaja: "www.google.fi" })).toBe("google-ads");
    expect(kaynninLahde({ viittaaja: "www.google.fi" })).toBe("google");
    expect(kaynninLahde({ viittaaja: "l.facebook.com" })).toBe("facebook");
    expect(kaynninLahde({ viittaaja: "m.youtube.com" })).toBe("youtube");
    expect(kaynninLahde({ viittaaja: "huumorikauppa.fi" })).toBe("suora");
    expect(kaynninLahde({ viittaaja: "esimerkki.fi" })).toBe("muu");
    expect(kaynninLahde({})).toBe("suora");
  });

  it("osio, botit ja koonti", () => {
    expect(sivunOsio("/")).toBe("etusivu");
    expect(sivunOsio("/tuote/tonnin-seteli-t-paita?x=1")).toBe("tuote");
    expect(onBotti("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(onBotti("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1")).toBe(false);
    const k = koostaKaynnit([{ paiva: "2026-11-01", lahde: "google", osio: "tuote", kaynnit: 3 }, { paiva: "2026-11-02", lahde: "tiktok", osio: "linkit", kaynnit: 1 }]);
    expect(k).toMatchObject({ yhteensa: 4, paivia: 2, ensimmainen: "2026-11-01" });
    expect(k.lahteet[0]).toEqual({ nimi: "google", kaynnit: 3, osuus: 75 });
  });

  it("selain: vain sivuston ulkopuolelta saapuminen, ei uudelleenlatausta eikä hallintaa", () => {
    const loc = (pathname: string, search = "") => ({ pathname, search, host: "huumorikauppa.fi" });
    expect(kaynninTiedot(loc("/linkit", "?utm_source=tiktok"), "")).toMatchObject({ action: "kaynti", polku: "/linkit", utm: "tiktok", viittaaja: "" });
    expect(kaynninTiedot(loc("/tuote/x"), "https://www.google.com/")).toMatchObject({ viittaaja: "www.google.com" });
    expect(kaynninTiedot(loc("/tuote/x"), "https://www.huumorikauppa.fi/")).toBeNull();
    expect(kaynninTiedot(loc("/"), "", "reload")).toBeNull();
    expect(kaynninTiedot(loc("/hallinta/mittarit"), "")).toBeNull();
  });
});

describe("tavoitemittari", () => {
  it("tarve: tilauksia ja käyntejä päivässä katteella ja konversiolla", () => {
    const t = tavoitelaskelma({ kate: 300, tavoite: 3000, paivia: 30, kulunut: 10, jaljella: 20, katePerTilaus: 10, konversio: 1 });
    expect(t).toMatchObject({ prosentti: 10, matka: 2700, ennuste: 900, ennusteTapa: "kuukauden oma tahti" });
    expect(t.tarve).toMatchObject({ katePaivassa: 100, tilauksiaPaivassa: 10, kaynteja_paivassa: 1000, jaljellaKatePaivassa: 135, jaljellaTilauksiaPaivassa: 13.5, jaljellaKaynteja_paivassa: 1350 });
  });

  it("kuun alussa ennuste käyttää 30 päivän tahtia, ja ilman tilauksia tarve on tuntematon", () => {
    const t = tavoitelaskelma({ kate: 0, tavoite: 3000, paivia: 30, kulunut: 0.5, jaljella: 29.5, katePerTilaus: null, konversio: KONVERSIO_VARA.prosentti, kateTahti30: 10 });
    expect(t.ennuste).toBe(295);
    expect(t.tarve.tilauksiaPaivassa).toBeNull();
    expect(t.tarve.kaynteja_paivassa).toBeNull();
  });

  it("summat: provisio vähennetään katteesta, testitilaus ei kuulu summiin kutsujan suodatuksen jälkeen", () => {
    const t = { id: "a", total: 30, shipping: 0, amount_paid: 30, printify_cost: 12, items: [] };
    const s = tilausSummat([t], new Map([["a", { provisio: 1.2 }]]));
    expect(s.tilauksia).toBe(1);
    expect(s.kate).toBeCloseTo(s.kateEnnenProvisioita - 1.2, 2);
    expect(s.keskiostos).toBe(30);
  });

  it("viestin rivit", () => {
    const tyhja = { yhteensa: 0, paivia: 0, ensimmainen: null, lahteet: [], osiot: [] };
    const m = { kuukausi: "11/2026", tavoite: tavoitelaskelma({ kate: 0, tavoite: 3000, paivia: 30, kulunut: 0.5, jaljella: 29.5, katePerTilaus: 12, konversio: 0.58, kateTahti30: 5 }),
      kk: { tilauksia: 0, keskiostos: 0 }, p30: { tilauksia: 6, katePerTilaus: 12 }, kaynnit: { kk: tyhja, p30: tyhja },
      konversio: { prosentti: 0.58, lahde: "GA4", oma: null }, tarjoukset: { kk: 0, arvoKk: 0, p30: 1 }, kumppanit: [], edellinen: { kuukausi: "2026-10", tilauksia: 6, kate: 70 } };
    const r = mittaririvit(m as never, "https://huumorikauppa.fi/hallinta/mittarit?avain=x").join("\n");
    expect(r).toContain("TAVOITEMITTARI 11/2026");
    expect(r).toContain("Tarve 3000 €:oon: 8,3 tilausta ja 1437 käyntiä päivässä");
    expect(r).toContain("Mittarisivu:");
  });
});

describe("/linkit", () => {
  const kampanja = { alku: "2026-11-27", loppu: "2026-12-01", kaytossa: true };
  it("viisi linkkiä ennen Black Fridayta, kuusi kampanjan aikana, utm kulkee mukana", () => {
    expect(linkitSivulla("2026-11-01", kampanja)).toHaveLength(5);
    const bf = linkitSivulla("2026-11-27", kampanja, "?utm_source=tiktok&utm_medium=social&x=1");
    expect(bf).toHaveLength(6);
    expect(bf[0]).toMatchObject({ otsikko: "Black Friday", href: "/black-friday?utm_source=tiktok&utm_medium=social" });
    expect(linkitSivulla("2026-12-02", kampanja)).toHaveLength(5);
    expect(utmPerään("/yritykset", "")).toBe("/yritykset");
  });
});

describe("käyntilaskurin testiajot", () => {
  it("lähde testi ei näy luvuissa", () => {
    expect(koostaKaynnit([{ paiva: "2026-11-01", lahde: "testi", osio: "linkit", kaynnit: 1 }]).yhteensa).toBe(0);
  });
});

describe("yritysmyynnin päiväluvut", () => {
  it("tarkistus: kokonaisluvut, ei tulevaisuutta, oletuspäivä tänään", async () => {
    const { tarkistaYritysluvut, summaaYritysluvut } = await import("../../api/_lib/yritysluvut.js");
    expect(tarkistaYritysluvut({ viestit: 20, vastaukset: 3, tarjouspyynnot: 1, tilaukset: 0 }, "2026-11-01")).toMatchObject({ ok: true, rivi: { paiva: "2026-11-01", viestit: 20, vastaukset: 3 } });
    expect(tarkistaYritysluvut({ paiva: "2026-11-02", viestit: 1 }, "2026-11-01").ok).toBe(false);
    expect(tarkistaYritysluvut({ viestit: -1 }, "2026-11-01").ok).toBe(false);
    expect(tarkistaYritysluvut({ viestit: 1.5 }, "2026-11-01").ok).toBe(false);
    expect(summaaYritysluvut([{ viestit: 10, vastaukset: 2, tarjouspyynnot: 1, tilaukset: 0 }, { viestit: 10, vastaukset: 1, tarjouspyynnot: 0, tilaukset: 1 }]))
      .toMatchObject({ viestit: 20, vastaukset: 3, tarjouspyynnot: 1, tilaukset: 1, vastausprosentti: 15, paivia: 2 });
  });
});

describe("Merchant-syötteen sisustuskuvat", () => {
  it("suosituimmalla tuotteella oma kuva on ensimmäinen lisäkuva, muilla ei", async () => {
    const { merchantSyote } = await import("../../api/_lib/syote.js");
    const { default: LISAKUVAT } = await import("../../api/_lib/lisakuvat.generated.js");
    const slug = Object.keys(LISAKUVAT)[0];
    const tuote = (s: string) => ({ id: s, slug: s, name: "Testi | T-Paita", description: "x", price: 27.9, stock: 10, category: "t-paidat",
      images: ["https://images-api.printify.com/mockup/a/1/2/x.jpg?camera_label=front", "https://images-api.printify.com/mockup/a/1/3/x.jpg?camera_label=back"], variants: {} });
    const xml = merchantSyote([tuote(slug), tuote("ei-suosittu")]);
    const [eka, toka] = xml.split("</item>");
    expect(eka.match(/<g:additional_image_link>([^<]*)</)![1]).toBe(LISAKUVAT[slug]);
    expect(toka).not.toContain("blob.vercel-storage.com");
    // 50 suosituinta (2 vaihdettu) ja joulumallisto 2026 (80), scripts/some-blob.mjs --lisakuvat.
    expect(Object.keys(LISAKUVAT).length).toBeGreaterThanOrEqual(130);
  });
});

describe("somevideoiden julkaisulista", () => {
  it("35 videota, isävideot ennen isänpäivää 8.11., äänestyksissä kaksi tuotetta", async () => {
    const { julkaisulista, VIDEOT } = await import("../../scripts/some-videot.mjs");
    const l = julkaisulista();
    expect(l).toHaveLength(35);
    expect(new Set(l.map((v) => v.nro)).size).toBe(35);
    for (const v of l.filter((x) => x.tagit.includes("#isänpäivä"))) expect(v.paiva < "2026-11-08").toBe(true);
    for (const v of VIDEOT.filter((x) => x.muoto === "aanestys")) expect(v.slugit).toHaveLength(2);
    for (const v of l) {
      expect(v.tagit.length).toBeGreaterThanOrEqual(3);
      expect(v.tagit.length).toBeLessThanOrEqual(5);
      expect(v.kuvateksti).not.toMatch(/[–—]/);
      expect(v.utm.tiktok).toContain("utm_source=tiktok");
    }
  });
});
