import { describe, expect, it } from "vitest";
import { lisaaLahikuva, onLahikuvaTuote } from "@/lib/lahikuva";
import { painatuksenRajaus } from "../../api/_lib/lahikuva.js";

const M = "https://images-api.printify.com/mockup/abc/123/456/x.jpg?camera_label=front";

describe("lähikuva painatuksesta", () => {
  it("lisätään ensimmäiseksi vain lähikuvatuotteille", () => {
    expect(onLahikuvaTuote("saatanan-tunarit-t-paita")).toBe(true);
    expect(lisaaLahikuva({ slug: "saatanan-tunarit-t-paita", category: "t-paidat" }, [M])).toEqual([`${M}&hk_lahi=paita`, M]);
    expect(lisaaLahikuva({ slug: "saatanan-tunarit-huppari", category: "hupparit" }, [M])[0]).toContain("hk_lahi=huppari");
    expect(lisaaLahikuva({ slug: "ei-listalla-t-paita", category: "t-paidat" }, [M])).toEqual([M]);
    expect(lisaaLahikuva({ slug: "saatanan-tunarit-t-paita" }, ["/placeholder.svg"])).toEqual(["/placeholder.svg"]);
  });
  it("rajaus löytää painatuksen valkoiselta paidalta", () => {
    const L = 256, data = new Uint8Array(L * L * 3).fill(245);
    // Musta teksti-alue x 100-160, y 80-110.
    for (let y = 80; y < 110; y++) for (let x = 100; x < 160; x++) { const i = (y * L + x) * 3; data[i] = data[i + 1] = data[i + 2] = 20; }
    const r = painatuksenRajaus(data, L, L);
    expect(r.left * L).toBeLessThan(100);
    expect((r.left + r.size) * L).toBeGreaterThan(160);
    expect(r.top * L).toBeLessThan(80);
    expect((r.top + r.size) * L).toBeGreaterThan(110);
    expect(r.size).toBeLessThan(0.45);
  });
});
