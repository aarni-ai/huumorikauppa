import { describe, expect, it } from "vitest";
import { isClothingCategory, parseSizeTable } from "./sizeChart";
import fixture from "@/test/fixtures/products-snapshot.json";

describe("parseSizeTable", () => {
  it("lukee Printify-muotoisen taulukon sellaisenaan", () => {
    const t = parseSizeTable("Pehmeä paita.\nS M L XL\nWidth, in 18.00 20.00 22.00 24.00\nLength, in 28.00 29.00 30.00 31.00\nHoito-ohjeet");
    expect(t).toEqual({
      sizes: ["S", "M", "L", "XL"],
      rows: [
        { label: "Width, in", values: ["18.00", "20.00", "22.00", "24.00"] },
        { label: "Length, in", values: ["28.00", "29.00", "30.00", "31.00"] },
      ],
      unit: "in",
    });
  });

  it("lukee suomenkielisen taulukon senttimetreinä", () => {
    const t = parseSizeTable("Koko: S M L 2XL\nLeveys (cm) 46 51 56 61\nPituus (cm) 71 74 76 79");
    expect(t?.unit).toBe("cm");
    expect(t?.rows[1]).toEqual({ label: "Pituus (cm)", values: ["71", "74", "76", "79"] });
  });

  it("ei keksi taulukkoa ilman mittarivejä", () => {
    expect(parseSizeTable("Koot S M L XL. 100 % puuvillaa.")).toBeNull();
    expect(parseSizeTable("S M L XL\nPehmeä ja kestävä")).toBeNull();
    expect(parseSizeTable("")).toBeNull();
    expect(parseSizeTable(null)).toBeNull();
  });

  it("vaatekategoriat", () => {
    expect(["t-paidat", "hupparit", "pitkahihaiset", "bodyt"].every(isClothingCategory)).toBe(true);
    expect(isClothingCategory("mukit")).toBe(false);
  });

  it("fixture-tuotteiden kuvauksista ei löydy virheellisiä taulukoita", () => {
    for (const p of fixture as Array<{ description: string }>) {
      const t = parseSizeTable(p.description);
      if (t) for (const r of t.rows) expect(r.values.length).toBe(t.sizes.length);
    }
  });
});
