import { describe, it, expect } from "vitest";
import { nimiIlmanAjatusviivoja as f } from "../../api/_lib/tuotenimi.js";

describe("tuotenimet ilman ajatusviivoja", () => {
  it("tyyppiliite pystyviivalla, muut kaksoispisteellä", () => {
    expect(f("100 % Lahtelaista verta – hauska t-paita")).toBe("100 % Lahtelaista verta | Hauska t-paita");
    expect(f("Forssa – parempi kuin Helsinki – hauska t-paita Forssalaiselle")).toBe("Forssa: parempi kuin Helsinki | Hauska t-paita Forssalaiselle");
    expect(f("60v – kokenut, ei vanha | T-Paita")).toBe("60v: kokenut, ei vanha | T-Paita");
    expect(f("Hauska T-Paita Avantouijalle – -20°C Sopiva Uimakeli")).toBe("Hauska T-Paita Avantouijalle: -20°C Sopiva Uimakeli");
    expect(f("Syntymäkaupunki: Tornio – hauska t-paita")).toBe("Syntymäkaupunki: Tornio | Hauska t-paita");
  });
  it("ei kahta kaksoispistettä peräkkäin", () => {
    expect(f("Helsinki: parempi kuin kaikki muut – itse sanoo – hauska t-paita Helsinkiläiselle"))
      .toBe("Helsinki: parempi kuin kaikki muut, itse sanoo | Hauska t-paita Helsinkiläiselle");
  });
  it("nimi ilman ajatusviivaa ja yhdysmerkit säilyvät", () => {
    expect(f("Joulusaunan löylymestari | T-paita jouluun")).toBe("Joulusaunan löylymestari | T-paita jouluun");
    expect(f("40v – ei keski-ikä, klassikko | Huppari")).toBe("40v: ei keski-ikä, klassikko | Huppari");
  });
});
