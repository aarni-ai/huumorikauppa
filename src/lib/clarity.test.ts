import { afterEach, describe, expect, it } from "vitest";
import { lataaClarity, _nollaaClarity } from "./clarity";
import { saveConsent } from "./consent";
import { clarityTunniste } from "@/config/clarity";

const skriptit = () => [...document.querySelectorAll("script")].filter((s) => s.src.includes("clarity.ms"));

describe("Microsoft Clarity", () => {
  afterEach(() => { _nollaaClarity(); localStorage.clear(); document.head.innerHTML = ""; });
  it("on pois päältä ilman tunnistetta", () => {
    expect(clarityTunniste()).toBe("");
    saveConsent({ analytics: true, marketing: false });
    expect(lataaClarity()).toBe(false);
    expect(skriptit()).toHaveLength(0);
  });
  it("ei lataudu ilman analytiikkasuostumusta, latautuu suostumuksella kerran", () => {
    expect(lataaClarity("abc123xyz")).toBe(false);
    saveConsent({ analytics: true, marketing: false });
    expect(lataaClarity("abc123xyz")).toBe(true);
    expect(lataaClarity("abc123xyz")).toBe(false);
    expect(skriptit()).toHaveLength(1);
    expect(skriptit()[0].src).toBe("https://www.clarity.ms/tag/abc123xyz");
  });
});
