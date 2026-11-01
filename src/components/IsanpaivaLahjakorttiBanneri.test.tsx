import { describe, expect, it } from "vitest";
import { isanpaivaLahjakorttiAika, ISA_POLUT } from "./IsanpaivaLahjakorttiBanneri";

describe("isänpäivän lahjakorttibanneri", () => {
  it("näkyy isänpäivän loppuun (su 8.11. klo 23.59 Suomen aikaa)", () => {
    expect(isanpaivaLahjakorttiAika(Date.parse("2026-11-01T12:00:00Z"))).toBe(true);
    expect(isanpaivaLahjakorttiAika(Date.parse("2026-11-08T21:59:00Z"))).toBe(true);
    expect(isanpaivaLahjakorttiAika(Date.parse("2026-11-08T22:00:00Z"))).toBe(false);
  });
  it("isä-sivut", () => {
    expect(ISA_POLUT).toContain("/isanpaivalahja");
    expect(ISA_POLUT).toContain("/hauska-isanpaivalahja");
  });
});
