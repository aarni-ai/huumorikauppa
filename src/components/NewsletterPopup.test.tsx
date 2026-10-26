import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NewsletterPopup } from "./NewsletterPopup";
import { SUOSTUMUS_UUTISKIRJE } from "../../api/_lib/vakiot.js";

// Radixin valintaruutu mittaa kokoaan; jsdomissa ei ole ResizeObserveria.
if (!("ResizeObserver" in globalThis)) {
  (globalThis as Record<string, unknown>).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("Uutiskirjeen tilaus", () => {
  it("suostumus valintaruudulla (ei valmiiksi valittu), tietosuojalinkki, ei luvattua koodia kun alennus pois käytöstä", async () => {
    const kutsut: Array<{ url: string; body: Record<string, unknown> }> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: { body: string }) => {
      kutsut.push({ url, body: JSON.parse(init.body) });
      return new Response(JSON.stringify({ ok: true, koodiLahetetty: false }), { status: 200 });
    }));
    render(<MemoryRouter><NewsletterPopup viive={0} /></MemoryRouter>);
    await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
    expect(screen.getByText("Tilaa Huumorikaupan uutiskirje")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/HUUMORI5|alennus/i);
    const ruutu = screen.getByRole("checkbox");
    expect(ruutu).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText(/Voin perua tilauksen milloin tahansa/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tietosuojakäytäntö" })).toHaveAttribute("href", "/tietosuojakaytanto");
    const nappi = screen.getByRole("button", { name: "Tilaa uutiskirje" });
    expect(nappi).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Sähköpostiosoite"), { target: { value: "Anna@Esimerkki.fi" } });
    fireEvent.click(ruutu);
    expect(nappi).not.toBeDisabled();
    fireEvent.click(nappi);
    await waitFor(() => expect(screen.getByText("Kiitos!")).toBeInTheDocument());
    expect(kutsut).toEqual([{ url: "/api/sahkoposti", body: { action: "tilaa", email: "anna@esimerkki.fi", suostumus: true, lahde: "popup" } }]);
    expect(SUOSTUMUS_UUTISKIRJE).toMatch(/peruutus|perua/);
  });
});
