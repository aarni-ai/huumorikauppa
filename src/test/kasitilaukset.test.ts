/**
 * Printifyn käsitilausten vahti (api/_lib/kasitilaukset.js, 3.11.2026): Tiinan korvausmuki 21.10.2026 tilattiin käsin
 * Priority-toimituksella (17,00 €), kauppa tilaa aina tavallisella.
 */
import { describe, expect, it } from "vitest";
import { kasitilausHuomiot, kasitilausRivit } from "../../api/_lib/kasitilaukset.js";

const tilaus = (o: Record<string, unknown>) => ({
  id: "x", created_at: "2026-10-21 21:29:53+00:00", status: "fulfilled", shipping_method: 1, total_price: 588, total_shipping: 999,
  metadata: { order_type: "manual" }, line_items: [{ metadata: { country: "Czech Republic" } }], ...o,
});
const alku = new Date("2026-10-21T00:00:00Z");
const loppu = new Date("2026-10-22T00:00:00Z");

describe("Printifyn käsitilausten vahti", () => {
  it("Tiinan korvausmuki: Priority-toimitus merkitään, kulu 22,88 €", () => {
    const h = kasitilausHuomiot([tilaus({ id: "6ad92ed1", shipping_method: 2, total_shipping: 1700 })], alku, loppu);
    expect(h).toEqual([{ id: "6ad92ed1", luotu: "2026-10-21", syyt: ["toimitus Priority (kauppa käyttää tavallista)"], kulu: 22.88 }]);
    expect(kasitilausRivit(h)[2]).toContain("kulu 22,88 € ilman alv:tä");
  });

  it("kaupan omat, perutut, tavalliset ja välin ulkopuoliset ohitetaan; EU:n ulkopuolinen painotalo merkitään", () => {
    const h = kasitilausHuomiot([
      tilaus({ id: "a" }),
      tilaus({ id: "b", shipping_method: 2, metadata: { order_type: "api" } }),
      tilaus({ id: "c", shipping_method: 2, status: "canceled" }),
      tilaus({ id: "d", shipping_method: 2, created_at: "2026-10-20 10:00:00+00:00" }),
      tilaus({ id: "e", line_items: [{ metadata: { country: "United States" } }] }),
    ], alku, loppu);
    expect(h.map((x) => [x.id, x.syyt])).toEqual([["e", ["painetaan EU:n ulkopuolella (United States)"]]]);
    expect(kasitilausRivit([])).toEqual([]);
  });
});
