import { describe, expect, it } from "vitest";
import { LOVABLE_KASSA_TAPPIO as DATA } from "../../api/_lib/lovable-kassa-tappio.js";
import { isVariantAvailable, lisaaPoissuljetut, createAvailability } from "./variantAvailability";

const LOVABLE_KASSA_TAPPIO = DATA as Record<string, string[]>;

/**
 * Lovablen kassan tappioesto (scripts/live-kassa-tappiot.ts): listan variantit eivät näy sivustolla, joten niitä ei voi
 * lisätä koriin. Lista koskee vain mainia; oma-tausta-haarassa se on tyhjä.
 */
describe("Lovablen kassan tappiolliset variantit", () => {
  it("oma tausta: lista on tyhjä (oma kassa ja katesääntö)", () => {
    expect(Object.keys(LOVABLE_KASSA_TAPPIO)).toEqual([]);
  });

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
  it("ei poista mitään koosta", async () => {
    const { onTappioVariantti } = await import("@/hooks/use-cart");
    expect(onTappioVariantti({ slug: "ice-aatanahuppari" }, "3XL", "Musta")).toBe(false);
  });
});
