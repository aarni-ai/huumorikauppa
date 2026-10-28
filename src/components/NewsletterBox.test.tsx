import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "fs";
import path from "path";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NewsletterBox } from "./NewsletterBox";
import { NewsletterBoxLazy } from "./NewsletterBoxLazy";
import { UUTISKIRJE_OTSIKKO, UUTISKIRJE_TEKSTI } from "./newsletterBoxShell";
import { SUOSTUMUS_UUTISKIRJE } from "../../api/_lib/vakiot.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

const lue = (rel: string) => fs.readFileSync(path.resolve(__dirname, rel), "utf8");

describe("Uutiskirjelaatikko (etusivu ja blogi)", () => {
  it("otsikko ja teksti: ei alennuskoodia, ei ajatusviivoja", () => {
    expect(UUTISKIRJE_OTSIKKO).toBe("Saat ensimmäisenä uudet hauskat paidat ja joulun takarajat");
    for (const t of [UUTISKIRJE_OTSIKKO, UUTISKIRJE_TEKSTI]) {
      expect(t).not.toMatch(/[–—]/);
      expect(t).not.toMatch(/alennus|koodi|%/i);
    }
  });

  it("suostumus erillisellä valintaruudulla (ei valmiiksi valittu), sama teksti kuin popupissa, tilaus /api/sahkoposti", async () => {
    const kutsut: Array<{ url: string; body: Record<string, unknown> }> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: { body: string }) => {
      kutsut.push({ url, body: JSON.parse(init.body) });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }));
    render(<MemoryRouter><NewsletterBox lahde="blogi" /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: UUTISKIRJE_OTSIKKO })).toBeInTheDocument();
    const ruutu = screen.getByRole("checkbox") as HTMLInputElement;
    expect(ruutu.checked).toBe(false);
    expect(screen.getByText((_, el) => el?.tagName === "LABEL" && el.textContent!.includes(SUOSTUMUS_UUTISKIRJE))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tietosuojakäytäntö" })).toHaveAttribute("href", "/tietosuojakaytanto");
    const nappi = screen.getByRole("button", { name: "Tilaa uutiskirje" });
    expect(nappi).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Sähköpostiosoite"), { target: { value: " Anna@Esimerkki.fi " } });
    fireEvent.click(ruutu);
    expect(nappi).not.toBeDisabled();
    fireEvent.click(nappi);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Kiitos!"));
    expect(kutsut).toEqual([
      { url: "/api/sahkoposti", body: { action: "tilaa", email: "anna@esimerkki.fi", suostumus: true, lahde: "blogi" } },
    ]);
  });

  it("virheellinen osoite ei lähetä pyyntöä, palvelimen virhe näytetään", async () => {
    const haku = vi.fn(async () => new Response(JSON.stringify({ ok: false, error: "Tilaus epäonnistui." }), { status: 400 }));
    vi.stubGlobal("fetch", haku);
    render(<MemoryRouter><NewsletterBox lahde="etusivu" /></MemoryRouter>);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText("Sähköpostiosoite"), { target: { value: "ei-osoite" } });
    fireEvent.click(screen.getByRole("button", { name: "Tilaa uutiskirje" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Tarkista sähköpostiosoite.");
    expect(haku).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Sähköpostiosoite"), { target: { value: "a@b.fi" } });
    fireEvent.click(screen.getByRole("button", { name: "Tilaa uutiskirje" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Tilaus epäonnistui."));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("laiska versio: varapaikka varaa saman korkeuden, sitten lomake latautuu", async () => {
    const { container } = render(<MemoryRouter><NewsletterBoxLazy lahde="blogi" /></MemoryRouter>);
    const varapaikka = container.firstElementChild as HTMLElement;
    expect(varapaikka.className).toMatch(/min-h-\[/);
    await waitFor(() => expect(screen.getByRole("heading", { name: UUTISKIRJE_OTSIKKO })).toBeInTheDocument());
    expect((container.querySelector("section") as HTMLElement).className).toBe(varapaikka.className);
  });

  it("etusivu ja blogiartikkeli käyttävät laatikkoa laiskasti, etusivulla ei toista lomaketta", () => {
    const etusivu = lue("../pages/Index.tsx");
    const blogi = lue("../pages/BlogPost.tsx");
    expect(etusivu).toMatch(/<NewsletterBoxLazy lahde="etusivu" \/>/);
    expect(blogi).toMatch(/<NewsletterBoxLazy lahde="blogi" \/>/);
    expect(etusivu).not.toMatch(/handleNewsletterSubmit/);
    // Ei raskaita riippuvuuksia: ei Radix-valintaruutua eikä dialogia.
    const laatikko = lue("./NewsletterBox.tsx");
    expect(laatikko).not.toMatch(/@radix-ui|components\/ui\/(checkbox|dialog)/);
  });
});
