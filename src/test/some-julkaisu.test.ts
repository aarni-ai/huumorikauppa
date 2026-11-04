import { describe, expect, it } from "vitest";
// @ts-expect-error js-moduuli ilman tyyppejä
import { seuraava, osiin, ajoikkuna } from "../../scripts/some-julkaisu.mjs";

const lista = [
  { nro: "21", paiva: "2026-11-02", nimi: "21-a" },
  { nro: "01", paiva: "2026-11-02", nimi: "01-b-v3" },
  { nro: "22", paiva: "2026-11-03", nimi: "22-c-v2" },
  { nro: "46", paiva: "2026-11-23", nimi: "46-bf-v2" },
];
const videot = new Set(["21-a.mp4", "01-b-v3.mp4", "22-c-v2.mp4", "46-bf-v2.mp4"]);

describe("somejulkaisu koneelta", () => {
  it("valitsee vanhimman kanavalta puuttuvan, ei tulevia päiviä eikä puuttuvia tiedostoja", () => {
    const julkaistut = [{ nro: "21", kanava: "instagram" }, { nro: "01", kanava: "instagram" }];
    expect(seuraava(lista, julkaistut, "instagram", { paiva: "2026-11-05", videot }).nro).toBe("22");
    expect(seuraava(lista, julkaistut, "tiktok", { paiva: "2026-11-05", videot }).nro).toBe("21");
    expect(seuraava(lista, [...julkaistut, { nro: "22", kanava: "instagram" }], "instagram", { paiva: "2026-11-05", videot })).toBeNull();
    expect(seuraava(lista, [], "tiktok", { paiva: "2026-11-05", videot: new Set(["01-b-v3.mp4"]) }).nro).toBe("01");
  });
  it("pakotettu numero ei ohita jo julkaistua", () => {
    expect(seuraava(lista, [{ nro: "01", kanava: "instagram" }], "instagram", { videot, nro: "01" })).toBeNull();
    expect(seuraava(lista, [], "instagram", { videot, nro: "46", paiva: "2026-11-05" }).nro).toBe("46");
  });
  it("kuvateksti ja hashtagit erikseen", () => {
    expect(osiin("Kuka koski termostaattiin? Linkki biossa. #isänpäivä #pov", ["#isänpäivä", "#pov"])).toEqual({ teksti: "Kuka koski termostaattiin? Linkki biossa.", tagit: ["isänpäivä", "pov"] });
  });
  it("ajoikkunat Helsingin ajassa", () => {
    expect(ajoikkuna(new Date("2026-11-05T09:29:00Z"))).toBeNull();
    expect(ajoikkuna(new Date("2026-11-05T09:30:00Z"))).toBe("2026-11-05 aamu");
    expect(ajoikkuna(new Date("2026-11-05T16:30:00Z"))).toBe("2026-11-05 ilta");
    expect(ajoikkuna(new Date("2026-11-05T21:30:00Z"))).toBeNull();
  });
});
