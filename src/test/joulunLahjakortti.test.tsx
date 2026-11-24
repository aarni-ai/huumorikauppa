/**
 * Joulun lahjakorttiaika kiinnitetyllä kellolla (24.11.2026): ke 2.12. klo 23.59 jälkeen yläpalkki, etusivu, blogien
 * Top 3 ja tuotesivut kertovat, että lahjakortti ehtii jouluksi sähköpostilla, ja lahjakortti on etusivun ensimmäinen
 * tuote. 27.12. alkaen kaikki on normaalia. Vain kun lahjakortit ovat myynnissä ja oma sähköposti on käytössä.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { helsinkiTimeToUtcMs } from "@/data/campaignSchedule";
import { JOULU_LAHJAKORTTI_TEKSTI, joulunLahjakorttiAika } from "@/data/tilauspaivat";
import { SeasonalBanner } from "@/components/SeasonalBanner";
import { EtusivunSuosituimmat } from "@/components/EtusivunSuosituimmat";
import { JoulunLahjakorttiRivi } from "@/components/JoulunLahjakortti";
import { PurchaseFacts } from "@/components/PurchaseFacts";
import type { Product } from "@/types/product";

vi.mock("@/components/ProductCard", () => ({ ProductCard: ({ product }: { product: Product }) => <div data-testid="tuote">{product.slug}</div> }));

const fi = (y: number, m: number, d: number, h = 0, mi = 0, s = 0, ms = 0) => helsinkiTimeToUtcMs(y, m, d, h, mi, s, ms);
const tuote = (slug: string, category: string) => ({ id: slug, slug, category, name: slug }) as unknown as Product;
const TUOTTEET = [tuote("tonnin-seteli-huppari", "hupparit"), tuote("maailman-paras-aiti-huppari", "hupparit"), tuote("saatanan-tunarit-t-paita", "t-paidat")];

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ lahjakortit: true, sahkoposti: true }), { status: 200 })));
  vi.useFakeTimers({ toFake: ["Date"] });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("joulunLahjakorttiAika", () => {
  it("alkaa ke 2.12. klo 23.59.59 jälkeen ja päättyy 27.12. klo 0.00", () => {
    expect(joulunLahjakorttiAika(fi(2026, 12, 2, 23, 59, 59, 999))).toBe(false);
    expect(joulunLahjakorttiAika(fi(2026, 12, 3))).toBe(true);
    expect(joulunLahjakorttiAika(fi(2026, 12, 24, 18))).toBe(true);
    expect(joulunLahjakorttiAika(fi(2026, 12, 26, 23, 59, 59, 999))).toBe(true);
    expect(joulunLahjakorttiAika(fi(2026, 12, 27))).toBe(false);
    expect(joulunLahjakorttiAika(fi(2026, 11, 24))).toBe(false);
  });

  it("viesti on täsmälleen pyydetty eikä siinä ole ajatusviivoja", () => {
    expect(JOULU_LAHJAKORTTI_TEKSTI).toBe("Ehtii vielä jouluksi: lahjakortti perille heti sähköpostilla");
    expect(JOULU_LAHJAKORTTI_TEKSTI).not.toMatch(/[–—]/);
  });
});

const yla = () => render(<MemoryRouter><SeasonalBanner /></MemoryRouter>);
const etusivu = () => render(<MemoryRouter><EtusivunSuosituimmat tuotteet={TUOTTEET} lataa={false} /></MemoryRouter>);
const tuotesivu = () => render(<MemoryRouter><PurchaseFacts isCustom={false} euPaino jouluKategoriat={["t-paidat"]} kategoria="t-paidat" /></MemoryRouter>);

describe("joulupalkki, etusivu ja tuotesivu kiinnitetyllä kellolla", () => {
  it("ke 2.12. klo 23.59: ei lahjakorttiviestiä, joulun tilauspäivä näkyy", async () => {
    vi.setSystemTime(fi(2026, 12, 2, 23, 59));
    const r = yla();
    await Promise.resolve();
    expect(r.container.querySelector('[data-banner="joulu"]')).not.toBeNull();
    expect(r.container.textContent).not.toContain(JOULU_LAHJAKORTTI_TEKSTI);
    r.unmount();
    const e = etusivu();
    expect(e.container.textContent).not.toContain("Osta lahjakortti");
    expect(screen.getAllByTestId("tuote")[0].previousElementSibling).toBeNull();
  });

  it("to 3.12.: palkki, etusivun ensimmäinen tuote ja tuotesivu kertovat lahjakortista", async () => {
    vi.setSystemTime(fi(2026, 12, 3, 9));
    const r = yla();
    expect(await screen.findByText(new RegExp(JOULU_LAHJAKORTTI_TEKSTI))).toBeInTheDocument();
    expect(r.container.querySelector('[data-banner="lahjakortti"]')).not.toBeNull();
    expect(screen.getByRole("link", { name: "Osta lahjakortti" })).toHaveAttribute("href", "/lahjakortti");
    r.unmount();

    const e = etusivu();
    const kortti = await screen.findByRole("link", { name: /Lahjakortti/ });
    const grid = kortti.parentElement!;
    expect(grid.firstElementChild).toBe(kortti);
    expect(kortti).toHaveAttribute("href", "/lahjakortti");
    expect(e.container.textContent).toContain(JOULU_LAHJAKORTTI_TEKSTI);
    e.unmount();

    const t = tuotesivu();
    expect(await screen.findByText(new RegExp(JOULU_LAHJAKORTTI_TEKSTI))).toBeInTheDocument();
    // Fyysisten tuotteiden toimitusarvio näkyy edelleen sellaisenaan.
    expect(t.container.textContent).toMatch(/Painetaan tilauksesta EU:ssa, perillä \d+-\d+ arkipäivässä/);
  });

  it("la 26.12. klo 23.59 viesti näkyy, su 27.12. kaikki normaalia", async () => {
    vi.setSystemTime(fi(2026, 12, 26, 23, 59));
    let r = yla();
    expect(await screen.findByText(new RegExp(JOULU_LAHJAKORTTI_TEKSTI))).toBeInTheDocument();
    r.unmount();
    vi.setSystemTime(fi(2026, 12, 27));
    r = yla();
    await new Promise((ok) => setTimeout(ok, 0));
    expect(r.container.textContent).not.toContain(JOULU_LAHJAKORTTI_TEKSTI);
    r.unmount();
    const e = etusivu();
    await new Promise((ok) => setTimeout(ok, 0));
    expect(e.container.textContent).not.toContain("Osta lahjakortti");
    expect(screen.getAllByTestId("tuote")).toHaveLength(3);
    e.unmount();
    const t = tuotesivu();
    await new Promise((ok) => setTimeout(ok, 0));
    expect(t.container.textContent).not.toContain(JOULU_LAHJAKORTTI_TEKSTI);
  });

  it("palvelin- ja esirenderöinnissä ei lahjakorttiviestiä (staattinen HTML ei vanhene)", () => {
    vi.setSystemTime(fi(2026, 12, 10));
    expect(renderToString(<MemoryRouter><JoulunLahjakorttiRivi /></MemoryRouter>)).toBe("");
  });
});
