import { afterEach, describe, expect, it, vi } from "vitest";
import { headlessMerkki, lahetaKunLuokiteltu, aitousLuokka, ihminen, _nollaaAitous } from "@/lib/aitous";

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36";

describe("headless-merkit", () => {
  const tavallinen = { webdriver: false, userAgent: CHROME, languages: ["fi-FI"], plugins: { length: 5 }, outerWidth: 1280, outerHeight: 800 };
  it("tavallinen selain ei ole headless", () => {
    expect(headlessMerkki(tavallinen)).toBeNull();
    expect(headlessMerkki({ ...tavallinen, userAgent: ANDROID, plugins: { length: 0 } })).toBeNull();
  });
  it("webdriver, UA, kielet, ikkuna ja liitännäiset", () => {
    expect(headlessMerkki({ ...tavallinen, webdriver: true })).toBe("webdriver");
    expect(headlessMerkki({ ...tavallinen, userAgent: CHROME.replace("Chrome/", "HeadlessChrome/") })).toBe("ua");
    expect(headlessMerkki({ ...tavallinen, languages: [] })).toBe("kielet");
    expect(headlessMerkki({ ...tavallinen, outerWidth: 0, outerHeight: 0 })).toBe("ikkuna");
    expect(headlessMerkki({ ...tavallinen, plugins: { length: 0 } })).toBe("liitannaiset");
  });
});

describe("luokitus ennen lähetystä", () => {
  afterEach(() => _nollaaAitous());
  // jsdom: outerWidth/outerHeight 0 ja navigator.webdriver puuttuu; ikkunan mitat asetetaan tavallisiksi.
  const tavallinenIkkuna = () => {
    Object.defineProperty(window, "outerWidth", { value: 390, configurable: true });
    Object.defineProperty(window, "outerHeight", { value: 844, configurable: true });
    Object.defineProperty(navigator, "userAgent", { value: ANDROID, configurable: true }); // jsdom-UA on headless-merkki
  };

  it("odottaa vuorovaikutusta ja lähtee luokalla aito", () => {
    tavallinenIkkuna();
    const laheta = vi.fn();
    lahetaKunLuokiteltu(laheta);
    expect(laheta).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("scroll")); // pelkkä vieritys ei riitä (eikä isTrusted)
    expect(laheta).not.toHaveBeenCalled();
    ihminen({ isTrusted: true }); // selaimen tuottama kosketus (jsdom ei salli isTrusted-tapahtumia)
    expect(laheta).toHaveBeenCalledWith("aito");
    expect(aitousLuokka()).toBe("aito");
    const toinen = vi.fn();
    lahetaKunLuokiteltu(toinen);
    expect(toinen).toHaveBeenCalledWith("aito");
  });

  it("ohjelmallinen tapahtuma ei ole vuorovaikutus; piilotus lähettää passiivisena", () => {
    tavallinenIkkuna();
    const laheta = vi.fn();
    lahetaKunLuokiteltu(laheta);
    window.dispatchEvent(new Event("pointerdown"));
    expect(laheta).not.toHaveBeenCalled();
    window.dispatchEvent(new Event("pagehide"));
    expect(laheta).toHaveBeenCalledWith("passiivinen");
  });
});
