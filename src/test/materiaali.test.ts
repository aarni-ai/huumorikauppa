import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { materiaaliRivi, syoteMateriaali, POHJAT } from "../../api/_lib/materiaali.js";
import TUOTEPOHJAT from "../../api/_lib/tuotepohjat.generated.js";
import { PRODUCT_CONTENT as productContent } from "@/data/productContent";
import { jouluAvain, jouluTakarajaKategorialle } from "@/data/jouluAikataulu";
import { JOULU_TPAITA_PAINOTALOT } from "@/data/campaignSchedule";

const pohjat = TUOTEPOHJAT as Record<string, { b: number; p: number; v?: Record<string, number>; puuttuu?: number }>;

describe("materiaali Printifyn pohjatuotteesta", () => {
  it("t-paidan rivi kertoo värikohtaisen koostumuksen ja jättää tuntemattomat värit pois", () => {
    const t = Object.entries(pohjat).find(([, x]) => x.b === 145 && x.v && new Set(Object.values(x.v)).size > 1);
    expect(t).toBeTruthy();
    const rivi = materiaaliRivi(t![0])!;
    expect(rivi).toMatch(/^Gildan Softstyle 64000, 153 g\/m²\. /);
    expect(rivi).toMatch(/100 % rengaskehrättyä puuvillaa/);
    expect(syoteMateriaali(t![0])).toBeNull();
    const g5000 = Object.entries(pohjat).find(([, x]) => x.b === 6 && x.puuttuu);
    if (g5000) expect(materiaaliRivi(g5000[0])).toMatch(/^Gildan 5000, 180 g\/m²\. .* 100 % puuvillaa\.$/);
  });

  it("tuote ilman Printifyn materiaalitietoa jää ilman riviä", () => {
    const juliste = Object.keys(pohjat).find((s) => pohjat[s].b === 443);
    if (juliste) expect(materiaaliRivi(juliste)).toBeNull();
    expect(materiaaliRivi("ei-tallaista-tuotetta")).toBeNull();
    expect(POHJAT[443]).toBeUndefined();
  });

  it("käsin kirjoitettujen kuvausten materiaali tulee pohjatuotteesta, ei tyhjiä rivejä", () => {
    for (const [slug, c] of Object.entries(productContent)) {
      const teksti = [c.description, ...c.faqs.flatMap((f) => [f.q, f.a])].join("\n");
      expect(teksti, slug).not.toMatch(/Materiaali: (\n|$|\s*Hoito)|180 g\/m2/);
    }
  });

  it("missään ei luvata materiaalia tuotekuvaukseen", () => {
    const juuri = path.resolve(__dirname, "..");
    const tiedostot = fs.readdirSync(juuri, { recursive: true }).map(String).filter((f) => /\.(ts|tsx)$/.test(f) && !/test/.test(f));
    for (const f of tiedostot) {
      const s = fs.readFileSync(path.join(juuri, f), "utf8");
      expect(s, f).not.toMatch(/(materiaali|koostumus|hoito-ohje)[^."]*(on|ovat) (kerrottu )?(jokaisen )?(tuote)?kuvauksessa/i);
    }
  });
});

describe("joulun takaraja painotaloittain", () => {
  it("t-paitojen päivä vain laskelman painotalolle, muuten varhaisin", () => {
    const opt = Object.keys(pohjat).find((s) => pohjat[s].p === JOULU_TPAITA_PAINOTALOT[0]);
    expect(jouluAvain({ category: "t-paidat", slug: opt })).toBe("t-paidat");
    expect(jouluAvain({ category: "t-paidat", slug: "tuntematon" })).not.toBe("t-paidat");
    expect(jouluTakarajaKategorialle(jouluAvain({ category: "t-paidat", slug: "tuntematon" })).iso).toBe(jouluTakarajaKategorialle("hupparit").iso);
    expect(jouluAvain({ category: "hupparit", slug: opt })).toBe("hupparit");
  });
});

describe("kokotaulukko ja painomaa pohjatuotteesta", async () => {
  const { mittataulukko } = await import("@/data/mittataulukot");
  const { painetaanEUssa, materiaaliluokka } = await import("../../api/_lib/materiaali.js");
  const tpaita = Object.keys(pohjat).find((s) => pohjat[s].b === 145)!;
  const huppari = Object.keys(pohjat).find((s) => pohjat[s].b === 77)!;

  it("Gildan 64000: senttimitat lomakkeen tuumista, vain myytävät koot", () => {
    const t = mittataulukko(tpaita, ["S", "M", "XXL", "6XL"])!;
    expect(t.malli).toBe("Gildan Softstyle 64000");
    expect(t.koot).toEqual(["S", "M", "XXL"]);
    expect(t.rivit.find((r) => r.nimi === "Leveys")!.cm).toEqual([46, 51, 66]);
    expect(t.rivit.find((r) => r.nimi === "Pituus")!.cm).toEqual([71, 74, 81]);
  });
  it("Gildan 18500 ja tuntematon pohja", () => {
    expect(mittataulukko(huppari, ["L"])!.rivit.map((r) => r.cm[0])).toEqual([61, 74, 89]);
    expect(mittataulukko("ei-tuotetta", ["M"])).toBeNull();
  });
  it("EU-painotalot: Tšekki, Saksa ja Ranska kyllä, Yhdysvallat ei", () => {
    expect(painetaanEUssa(tpaita)).toBe(true);
    expect(painetaanEUssa(huppari)).toBe(true);
    const koriste = Object.keys(pohjat).find((s) => pohjat[s].p === 59);
    if (koriste) expect(painetaanEUssa(koriste)).toBe(false);
    expect(painetaanEUssa("ei-tuotetta")).toBeNull();
  });
  it("Gildanin mittalomakkeen sekoitevärit", () => {
    expect(POHJAT[6].luokat[materiaaliluokka(6, "Sport Grey")!]).toBe("90 % puuvillaa ja 10 % polyesteriä");
    expect(POHJAT[6].luokat[materiaaliluokka(6, "Ash")!]).toBe("99 % puuvillaa ja 1 % polyesteriä");
    expect(POHJAT[6].luokat[materiaaliluokka(6, "Dark Heather")!]).toBe("50 % puuvillaa ja 50 % polyesteriä");
    expect(POHJAT[145].luokat[materiaaliluokka(145, "Heather Oatmeal")!]).toBe("99 % rengaskehrättyä puuvillaa ja 1 % polyesteriä");
  });
});
