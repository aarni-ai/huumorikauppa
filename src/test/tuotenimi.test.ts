import { describe, it, expect } from "vitest";
import { nimiIlmanAjatusviivoja as f, korjaaNimi, nimiKorjattava } from "../../api/_lib/tuotenimi.js";

describe("tuotenimet ilman ajatusviivoja", () => {
  it("tyyppiliite pystyviivalla, muut kaksoispisteellä", () => {
    expect(f("100 % Lahtelaista verta – hauska t-paita")).toBe("100 % Lahtelaista verta | Hauska t-paita");
    expect(f("Forssa – parempi kuin Helsinki – hauska t-paita Forssalaiselle")).toBe("Forssa parempi kuin Helsinki | Hauska t-paita Forssalaiselle");
    expect(f("60v – kokenut, ei vanha | T-Paita")).toBe("60v kokenut, ei vanha | T-Paita");
    expect(f("Hauska T-Paita Avantouijalle – -20°C Sopiva Uimakeli")).toBe("Hauska T-Paita Avantouijalle: -20°C Sopiva Uimakeli");
    expect(f("Syntymäkaupunki: Tornio – hauska t-paita")).toBe("Syntymäkaupunki: Tornio | Hauska t-paita");
  });
  it("ei kahta kaksoispistettä peräkkäin", () => {
    expect(f("Helsinki: parempi kuin kaikki muut – itse sanoo – hauska t-paita Helsinkiläiselle"))
      .toBe("Helsinki parempi kuin kaikki muut, itse sanoo | Hauska t-paita Helsinkiläiselle");
  });
  it("nimi ilman ajatusviivaa ja yhdysmerkit säilyvät", () => {
    expect(f("Joulusaunan löylymestari | T-paita jouluun")).toBe("Joulusaunan löylymestari | T-paita jouluun");
    expect(f("40v – ei keski-ikä, klassikko | Huppari")).toBe("40v ei keski-ikä, klassikko | Huppari");
  });
  it("luonnoton kaksoispiste pois, otsikkomainen jää", () => {
    expect(korjaaNimi("60v: kokenut, ei vanha | T-Paita")).toBe("60v kokenut, ei vanha | T-Paita");
    expect(korjaaNimi("30: nuori, villi ja jo väsynyt | Huppari")).toBe("30 nuori, villi ja jo väsynyt | Huppari");
    expect(korjaaNimi("Eläkkeellä: kiireinen tekemään ei mitään | T-Paita")).toBe("Eläkkeellä kiireinen tekemään ei mitään | T-Paita");
    expect(korjaaNimi("Kuopio: parempi kuin Helsinki | Hauska t-paita Kuopiolaiselle")).toBe("Kuopio parempi kuin Helsinki | Hauska t-paita Kuopiolaiselle");
    for (const n of ["Syntymäkaupunki: Tornio | Hauska t-paita", "Eläkeläinen: aamuherätys vapaaehtoinen | Huppari",
      "Hauska T-Paita Palomiehelle: Sankari Savussa", "Personoitava T-Paita: Harrastusmestari"]) {
      expect(korjaaNimi(n)).toBe(n);
      expect(nimiKorjattava(n)).toBe(false);
    }
  });
});
