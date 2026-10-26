import { describe, it, expect } from "vitest";
import { lisaaKentat, lisaaKentatSyotteeseen } from "../../api/_lib/syote-lisakentat.js";
import { KATELUOKAT, MYYDYIMMAT } from "../../api/_lib/kateluokat.js";
// Generaattorin puhtaat funktiot (main ajetaan vain komentoriviltä).
import { AINA_MYYDYIMMAT, kateluokka, laskeLuokat, myydytKappaleet } from "../../scripts/generoi-kateluokat.mjs";

const item = (slug: string, hinta = "24.90") => `<item>
      <g:id>${slug}-id</g:id>
      <g:link>https://huumorikauppa.fi/tuote/${slug}</g:link>
      <g:price>${hinta} EUR</g:price>
      <g:shipping>
        <g:country>FI</g:country>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
    </item>`;
const label = (x: string, n: number) => (x.match(new RegExp(`<g:custom_label_${n}>([^<]*)</g:custom_label_${n}>`)) || [])[1];

describe("kateluokka", () => {
  it("rajat 20, 30 ja 40 %", () => {
    expect(kateluokka(0.05)).toBe("kate-alle-20");
    expect(kateluokka(0.199)).toBe("kate-alle-20");
    expect(kateluokka(0.2)).toBe("kate-20-30");
    expect(kateluokka(0.299)).toBe("kate-20-30");
    expect(kateluokka(0.3)).toBe("kate-30-40");
    expect(kateluokka(0.4)).toBe("kate-yli-40");
    expect(kateluokka(undefined)).toBeNull();
  });
});

describe("myydyimmät", () => {
  const tilaukset = [
    { status: "fulfilled", line_items: [{ product_id: "p1", quantity: 1 }, { product_id: "p2", quantity: 1 }] },
    { status: "fulfilled", line_items: [{ product_id: "p1", quantity: 1 }] },
    { status: "canceled", line_items: [{ product_id: "p2", quantity: 5 }] },
  ];
  it("ei laske peruttuja tilauksia ja yhdistää id:t slugeihin", () => {
    const kpl = myydytKappaleet(tilaukset);
    expect(kpl.get("p1")).toBe(2);
    expect(kpl.get("p2")).toBe(1);
    const { luokat, myydyimmat } = laskeLuokat(
      [{ slug: "a", nyky: { kate: 0.25 } }, { slug: "b", nyky: { kate: 0.1 } }],
      kpl,
      new Map([["p1", ["a"]], ["p2", ["b"]]]),
    );
    expect(luokat).toEqual({ a: "kate-20-30", b: "kate-alle-20" });
    expect(myydyimmat).toEqual(["a", ...AINA_MYYDYIMMAT].sort());
  });
});

describe("syötteen custom_label_0 ja custom_label_2", () => {
  it("käyttää tuotteen slugin kateluokkaa ja myydyin-merkintää", () => {
    const opts = { kateluokat: { "kallis-paita": "kate-30-40" }, myydyimmat: new Set(["kallis-paita"]) };
    const x = lisaaKentat(item("kallis-paita"), opts);
    expect(label(x, 0)).toBe("kate-30-40");
    expect(label(x, 2)).toBe("myydyin");
    const y = lisaaKentat(item("tuntematon"), opts);
    expect(label(y, 0)).toBeUndefined();
    expect(label(y, 2)).toBe("muut");
    expect(label(y, 1)).toMatch(/^(joulu|ympari_vuoden)$/);
  });

  it("generoitu data: tonnin seteli -paita on aina myydyin, ja jokaisella tuotteella on sallittu kateluokka", () => {
    expect(MYYDYIMMAT.has("tonnin-seteli-t-paita")).toBe(true);
    const x = lisaaKentat(item("tonnin-seteli-t-paita"));
    expect(label(x, 2)).toBe("myydyin");
    expect(label(x, 0)).toBe(KATELUOKAT["tonnin-seteli-t-paita"]);
    const sallitut = new Set(["kate-alle-20", "kate-20-30", "kate-30-40", "kate-yli-40"]);
    expect(Object.keys(KATELUOKAT).length).toBeGreaterThan(400);
    for (const l of Object.values(KATELUOKAT) as string[]) expect(sallitut.has(l)).toBe(true);
  });

  it("koko syöte: jokainen item saa custom_label_2:n, eikä kenttiä lisätä kahdesti", () => {
    const xml = `<rss><channel>${item("tonnin-seteli-t-paita")}${item("tuntematon")}</channel></rss>`;
    const once = lisaaKentatSyotteeseen(xml, new Date("2026-06-01T00:00:00Z"));
    expect(once.match(/<g:custom_label_2>/g)).toHaveLength(2);
    expect(once.match(/<g:custom_label_1>ympari_vuoden</g)).toHaveLength(2);
    expect(lisaaKentatSyotteeseen(once)).toBe(once);
  });
});
