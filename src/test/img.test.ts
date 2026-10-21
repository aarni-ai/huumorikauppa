import { describe, it, expect } from "vitest";
import { valitseLeveys, haluaaWebp } from "../../api/img.js";
import { proxiedImage } from "@/lib/imageProxy";

describe("kuvaproxy", () => {
  it("leveys pyöristetään sallittuun ylöspäin, oletus 1600", () => {
    expect(valitseLeveys(undefined)).toBe(1600);
    expect(valitseLeveys("480")).toBe(480);
    expect(valitseLeveys("500")).toBe(640);
    expect(valitseLeveys("99999")).toBe(1600);
    expect(valitseLeveys("abc")).toBe(1600);
  });
  it("WebP vain, kun selain ilmoittaa tuen", () => {
    expect(haluaaWebp("image/avif,image/webp,*/*")).toBe(true);
    expect(haluaaWebp("*/*")).toBe(false);
    expect(haluaaWebp(undefined)).toBe(false);
  });
  it("proxiedImage lisää leveyden tuotantodomainissa, muualla suora osoite", () => {
    // jsdom: localhost -> proxy ei käytössä, suora Printify-osoite.
    expect(proxiedImage("https://images-api.printify.com/a.jpg", { width: 480 })).toBe("https://images-api.printify.com/a.jpg");
    const vanha = window.location;
    Object.defineProperty(window, "location", { value: { hostname: "huumorikauppa.fi" }, configurable: true });
    expect(proxiedImage("https://images-api.printify.com/a.jpg", { absolute: true, width: 480 })).toBe("https://huumorikauppa.fi/api/img?u=https%3A%2F%2Fimages-api.printify.com%2Fa.jpg&w=480");
    Object.defineProperty(window, "location", { value: vanha, configurable: true });
  });
});
