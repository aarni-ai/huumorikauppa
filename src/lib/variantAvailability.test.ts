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
const P = { slug: "paita" };

describe("variantAvailability", () => {
  it("avain samassa muodossa kuin variant_map", () => {
    expect(variantKey("Musta", "L")).toBe("Musta|L");
    expect(variantKey(undefined, "L")).toBe("|L");
  });
  it("yksittäinen yhdistelmä", () => {
    expect(a.isVariantAvailable(P, "Musta", "5XL")).toBe(false);
    expect(a.isVariantAvailable(P, "Musta", "4XL")).toBe(true);
    expect(a.isVariantAvailable({ slug: "tuntematon" }, "Musta", "5XL")).toBe(true);
    expect(a.isVariantAvailable({ slug: "tarra" }, undefined, "10cm")).toBe(false);
    expect(a.isVariantAvailable({ slug: "loppu" }, "Musta", "M")).toBe(false);
  });
  it("koot värin mukaan ja värit, joilla on koko", () => {
    expect(a.availableSizes(P, "Keltainen", koot)).toEqual(["S", "M", "L"]);
    expect(a.availableSizes(P, "Musta", koot)).toEqual(["S", "M", "L", "3XL", "4XL"]);
    expect(a.availableColors(P, ["Musta", "Valkoinen", "Keltainen"], ["S", "M", "L"])).toEqual(["Musta", "Keltainen"]);
    expect(a.availableColors(P, ["Musta"], [])).toEqual(["Musta"]);
  });
  it("kokonaan valmistamaton tuote", () => {
    expect(a.isFullyUnavailable({ slug: "loppu" })).toBe(true);
    expect(a.isFullyUnavailable(P)).toBe(false);
    expect(a.hasAvailableVariant({ slug: "paita", variants: { colors: ["Valkoinen"], sizes: ["S", "M", "L"] } })).toBe(false);
    expect(a.hasAvailableVariant({ slug: "paita", variants: { colors: ["Valkoinen", "Musta"], sizes: ["S"] } })).toBe(true);
  });
  it("variant_map-aukko on valmistamaton ilman JSON-dataa", () => {
    const vari = { slug: "x", variants: { colors: ["Musta", "Keltainen"], sizes: ["S", "3XL"], variant_map: { "Musta|S": 1, "Musta|3XL": 2, "Keltainen|S": 3 } } };
    expect(a.isVariantAvailable(vari, "Keltainen", "3XL")).toBe(false);
    expect(a.isVariantAvailable(vari, "Musta", "3XL")).toBe(true);
    expect(a.availableSizes(vari, "Keltainen", ["S", "3XL"])).toEqual(["S"]);
    // Ilman väriä "|Koko"
    const tarra = { slug: "t", variants: { sizes: ["5cm", "10cm"], variant_map: { "|5cm": 1 } } };
    expect(a.availableSizes(tarra, undefined, ["5cm", "10cm"])).toEqual(["5cm"]);
    expect(a.isFullyUnavailable(tarra)).toBe(false);
    // Ilman kokoa "Väri|"
    const juliste = { slug: "j", variants: { colors: ["Valkoinen", "Musta"], variant_map: { "Valkoinen|": 1 } } };
    expect(a.availableColors(juliste, ["Valkoinen", "Musta"], [])).toEqual(["Valkoinen"]);
    // Kaikki aukkoja = kokonaan valmistamaton
    expect(a.isFullyUnavailable({ slug: "k", variants: { colors: ["Musta"], sizes: ["S"], variant_map: { "Musta|M": 1 } } })).toBe(true);
    // Tyhjä tai puuttuva kartta ei piilota mitään
    expect(a.isVariantAvailable({ slug: "e", variants: { variant_map: {} } }, "Musta", "S")).toBe(true);
    expect(a.isFullyUnavailable({ slug: "e", variants: { colors: ["Musta"], sizes: ["S"] } })).toBe(false);
  });
  it("syötteen moduuli vastaa JSON-dataa (generaattori kirjoittaa molemmat)", () => {
    expect([...KOKONAAN_EI_SAATAVILLA].sort()).toEqual([...(data.kokonaan_ei_saatavilla ?? [])].sort());
    expect(SAATAVUUS_GENERATED_AT).toBe(data.generated_at);
  });
});
