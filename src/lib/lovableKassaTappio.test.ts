import { describe, expect, it } from "vitest";
import { LOVABLE_KASSA_TAPPIO as DATA } from "../../api/_lib/lovable-kassa-tappio.js";
import { isVariantAvailable, lisaaPoissuljetut, createAvailability } from "./variantAvailability";

const LOVABLE_KASSA_TAPPIO = DATA as Record<string, string[]>;

/**
 * Lovablen kassan tappioesto (scripts/live-kassa-tappiot.ts): listan variantit eivät näy sivustolla, joten niitä ei voi
 * lisätä koriin. Lista koskee vain mainia; oma-tausta-haarassa se on tyhjä.
 */
describe("Lovablen kassan tappiolliset variantit", () => {
  const rivit = Object.entries(LOVABLE_KASSA_TAPPIO);

  it("jokainen listan variantti on piilossa", () => {
    for (const [slug, avaimet] of rivit) {
      for (const avain of avaimet) {
        const [vari, koko] = avain.split("|");
        expect(isVariantAvailable({ slug }, vari, koko), `${slug} ${avain}`).toBe(false);
      }
    }
  });

  it("piilottaa vain isot koot (3XL-5XL) ja lisämyynnin tarran, ei tavallisia kokoja", () => {
    for (const [slug, avaimet] of rivit) {
      for (const avain of avaimet) expect(/\|[3-5]XL$/.test(avain) || slug.endsWith("-tarra"), `${slug} ${avain}`).toBe(true);
    }
  });

  it("lisaaPoissuljetut yhdistää olemassa olevaan saatavuuteen", () => {
    const a = createAvailability(lisaaPoissuljetut({ generated_at: null, products: { x: { unavailable: ["Musta|S"] } } }, { x: ["Musta|3XL"], y: ["|"] }));
    expect(a.isVariantAvailable({ slug: "x" }, "Musta", "S")).toBe(false);
    expect(a.isVariantAvailable({ slug: "x" }, "Musta", "3XL")).toBe(false);
    expect(a.isVariantAvailable({ slug: "x" }, "Musta", "M")).toBe(true);
    expect(a.isVariantAvailable({ slug: "y" }, "", "")).toBe(false);
  });
});

describe("ostoskori", () => {
  it("tunnistaa tappiollisen koon, ei muita", async () => {
    const { onTappioVariantti } = await import("@/hooks/use-cart");
    const [slug, avaimet] = Object.entries(LOVABLE_KASSA_TAPPIO).find(([, a]) => a.some((x) => x.includes("XL")))!;
    const [vari, koko] = avaimet.find((x) => x.includes("XL"))!.split("|");
    expect(onTappioVariantti({ slug }, koko, vari)).toBe(true);
    expect(onTappioVariantti({ slug }, "M", vari)).toBe(false);
    expect(onTappioVariantti({ slug: "ei-listalla" }, koko, vari)).toBe(false);
  });
});
