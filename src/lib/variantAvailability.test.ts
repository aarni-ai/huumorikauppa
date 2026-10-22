import { describe, it, expect } from "vitest";
import { createAvailability, variantKey } from "./variantAvailability";
import data from "../data/printify-saatavuus.json";
import { KOKONAAN_EI_SAATAVILLA, SAATAVUUS_GENERATED_AT } from "../../api/_lib/printify-saatavuus.js";

const a = createAvailability({
  generated_at: "2026-10-22T00:00:00Z",
  products: {
    paita: { unavailable: ["Musta|5XL", "Keltainen|3XL", "Keltainen|4XL", "Keltainen|5XL", "Valkoinen|S", "Valkoinen|M", "Valkoinen|L"] },
    tarra: { unavailable: ["|10cm"] },
  },
  kokonaan_ei_saatavilla: ["loppu"],
  summary: null,
});
const koot = ["S", "M", "L", "3XL", "4XL", "5XL"];

describe("variantAvailability", () => {
  it("avain samassa muodossa kuin variant_map", () => {
    expect(variantKey("Musta", "L")).toBe("Musta|L");
    expect(variantKey(undefined, "L")).toBe("|L");
  });
  it("yksittäinen yhdistelmä", () => {
    expect(a.isVariantAvailable("paita", "Musta", "5XL")).toBe(false);
    expect(a.isVariantAvailable("paita", "Musta", "4XL")).toBe(true);
    expect(a.isVariantAvailable("tuntematon", "Musta", "5XL")).toBe(true);
    expect(a.isVariantAvailable("tarra", undefined, "10cm")).toBe(false);
    expect(a.isVariantAvailable("loppu", "Musta", "M")).toBe(false);
  });
  it("koot värin mukaan ja värit, joilla on koko", () => {
    expect(a.availableSizes("paita", "Keltainen", koot)).toEqual(["S", "M", "L"]);
    expect(a.availableSizes("paita", "Musta", koot)).toEqual(["S", "M", "L", "3XL", "4XL"]);
    expect(a.availableColors("paita", ["Musta", "Valkoinen", "Keltainen"], ["S", "M", "L"])).toEqual(["Musta", "Keltainen"]);
    expect(a.availableColors("paita", ["Musta"], [])).toEqual(["Musta"]);
  });
  it("kokonaan valmistamaton tuote", () => {
    expect(a.isFullyUnavailable("loppu")).toBe(true);
    expect(a.isFullyUnavailable("paita")).toBe(false);
    expect(a.hasAvailableVariant("paita", ["Valkoinen"], ["S", "M", "L"])).toBe(false);
    expect(a.hasAvailableVariant("paita", ["Valkoinen", "Musta"], ["S"])).toBe(true);
  });
  it("syötteen moduuli vastaa JSON-dataa (generaattori kirjoittaa molemmat)", () => {
    expect([...KOKONAAN_EI_SAATAVILLA].sort()).toEqual([...(data.kokonaan_ei_saatavilla ?? [])].sort());
    expect(SAATAVUUS_GENERATED_AT).toBe(data.generated_at);
  });
});
