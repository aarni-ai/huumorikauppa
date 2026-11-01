import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { KumppaniKentta } from "./KumppaniKentta";

afterEach(() => vi.unstubAllGlobals());

const vastaus = (j: unknown) => vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(j), { status: 200 })));

describe("KumppaniKentta", () => {
  it("27,90 €:n paita: näyttää -5 %", async () => {
    vastaus({ ok: true, koodi: "keisarit", malli: "alennus", prosentti: 5, syy: null });
    render(<KumppaniKentta arvo="keisarit" setArvo={() => undefined} items={[{ slug: "a", quantity: 1 }]} />);
    expect(await screen.findByText(/Koodi KEISARIT: -5 %/, {}, { timeout: 2000 })).toBeTruthy();
  });
  it("24,90 €:n paita: koodi hyväksytty ja selitys, kun alennus on 0 %", async () => {
    vastaus({ ok: true, koodi: "keisarit", malli: "alennus", prosentti: 0, syy: "kate" });
    render(<KumppaniKentta arvo="keisarit" setArvo={() => undefined} items={[{ slug: "b", quantity: 1 }]} />);
    expect(await screen.findByText("Koodilla ei alennusta tähän tuotteeseen.", {}, { timeout: 2000 })).toBeTruthy();
    expect(screen.getByText(/Koodi KEISARIT hyväksytty/)).toBeTruthy();
  });
  it("kaksi paitaa: korin oma alennus on suurempi", async () => {
    vastaus({ ok: true, koodi: "keisarit", malli: "alennus", prosentti: 0, syy: "muu_alennus" });
    render(<KumppaniKentta arvo="keisarit" setArvo={() => undefined} items={[{ slug: "a", quantity: 2 }]} />);
    expect(await screen.findByText(/Korin oma alennus on suurempi/, {}, { timeout: 2000 })).toBeTruthy();
  });
});
