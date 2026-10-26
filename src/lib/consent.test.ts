import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { CONSENT_KEY, getStoredConsent, hasAnalyticsConsent, onMarketingConsent, parseConsent, saveConsent } from "./consent";

afterEach(() => {
  localStorage.clear();
  delete (window as unknown as { hkApplyConsent?: unknown }).hkApplyConsent;
});

describe("parseConsent", () => {
  it("tulkitsee vanhat ja uudet arvot", () => {
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent("accepted")).toEqual({ analytics: true, marketing: false });
    expect(parseConsent("necessary")).toEqual({ analytics: false, marketing: false });
    expect(parseConsent('{"v":2,"analytics":false,"marketing":true}')).toEqual({ analytics: false, marketing: true });
    expect(parseConsent("{rikki")).toBeNull();
  });
});

describe("saveConsent", () => {
  it("tallentaa valinnan, päivittää Consent Moden ja kertoo markkinointisuostumuksesta", () => {
    const apply = vi.fn();
    (window as unknown as { hkApplyConsent: typeof apply }).hkApplyConsent = apply;
    const marketing = vi.fn();
    onMarketingConsent(marketing);
    expect(marketing).not.toHaveBeenCalled();
    saveConsent({ analytics: true, marketing: true });
    expect(apply).toHaveBeenCalledWith({ analytics: true, marketing: true });
    expect(JSON.parse(localStorage.getItem(CONSENT_KEY)!)).toMatchObject({ v: 2, analytics: true, marketing: true });
    expect(hasAnalyticsConsent()).toBe(true);
    expect(marketing).toHaveBeenCalledTimes(1);
  });

  it("peruminen poistaa GA-evästeet", () => {
    saveConsent({ analytics: true, marketing: false });
    document.cookie = "_ga=GA1.1.1.1; path=/";
    saveConsent({ analytics: false, marketing: false });
    expect(document.cookie).not.toContain("_ga=");
    expect(getStoredConsent()).toEqual({ analytics: false, marketing: false });
  });
});

describe("index.html", () => {
  const html = fs.readFileSync(path.resolve(__dirname, "../../index.html"), "utf8");
  it("asettaa Consent Mode -oletuksen ennen Google-tageja eikä lataa gtag.js:ää suoraan", () => {
    const def = html.indexOf("gtag('consent', 'default'");
    expect(def).toBeGreaterThan(-1);
    expect(html).not.toMatch(/<script[^>]+src="https:\/\/www\.googletagmanager\.com/);
    for (const k of ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"]) {
      expect(html.slice(def, def + 300)).toContain(`${k}: 'denied'`);
    }
    expect(html.slice(def, def + 300)).toContain("wait_for_update: 500");
    expect(html.indexOf("googletagmanager.com")).toBeGreaterThan(def);
  });
});
