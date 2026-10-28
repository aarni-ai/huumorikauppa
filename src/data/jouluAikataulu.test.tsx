import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  aktiivinenJouluTakaraja,
  JOULU_MYOHAISIN_END_UTC_MS,
  JOULU_OLETUS_PAIVA,
  JOULU_SIVUSTON_END_UTC_MS,
  JOULU_TILAUSPAIVAT,
  jouluRivi,
  jouluTakaraja,
  jouluTakarajaKategorialle,
} from "./jouluAikataulu";
import { categories } from "./products";
import { christmasDeadlinePage } from "./christmasDeadlinePage";
import { JouluTakarajaRivi } from "@/components/JouluTakaraja";
import { isFiBusinessDay, latestOrderDate, weekdaysBetween } from "../../scripts/joulu-aikataulu.mjs";

/** Suomen aika marraskuussa on UTC+2. */
const fi = (local: string) => Date.parse(`${local}+02:00`);

afterEach(() => {
  vi.useRealTimers();
});

describe("joulun takarajat tuotetyypeittäin", () => {
  it("avaimet ovat kategorioiden slugeja; t-paidat 1.12., muut 30.11., sivuston yhteinen päivä on varhaisin", () => {
    const slugs = new Set<string>(categories.map((c) => c.slug));
    for (const k of Object.keys(JOULU_TILAUSPAIVAT)) expect(slugs.has(k), k).toBe(true);
    expect(JOULU_TILAUSPAIVAT["t-paidat"]).toBe("2026-12-01");
    expect(JOULU_TILAUSPAIVAT.hupparit).toBe("2026-11-30");
    expect(JOULU_SIVUSTON_END_UTC_MS).toBe(Math.min(...Object.values(JOULU_TILAUSPAIVAT).map((iso) => jouluTakaraja(iso).endUtcMs)));
    expect(JOULU_MYOHAISIN_END_UTC_MS).toBe(jouluTakaraja("2026-12-01").endUtcMs);
    for (const iso of Object.values(JOULU_TILAUSPAIVAT)) expect(iso).toMatch(/^2026-1[12]-\d{2}$/);
  });

  it("tilauspäivät-sivu lupaa saman päivän kaikille, joten taulukon päivät ovat samat", () => {
    const text = christmasDeadlinePage.sections.flatMap((s) => s.paragraphs).join(" ");
    if (/sama päivä koskee kaikkia tuotteita/i.test(text)) {
      expect(new Set(Object.values(JOULU_TILAUSPAIVAT)).size).toBe(1);
    }
  });

  it("muotoilee päivän ja rivin", () => {
    const t = jouluTakaraja("2026-11-20");
    expect(t.text).toBe("pe 20.11.2026");
    expect(new Date(t.endUtcMs).toISOString()).toBe("2026-11-20T21:59:59.999Z");
    expect(jouluRivi(t)).toBe("Ehtii jouluksi, kun tilaat viimeistään pe 20.11.2026.");
    expect(jouluRivi(t)).not.toMatch(/[–—]/);
  });

  it("tuntematon kategoria saa varhaisimman päivän", () => {
    expect(jouluTakarajaKategorialle("tuntematon").iso).toBe(JOULU_OLETUS_PAIVA);
    expect(jouluTakarajaKategorialle(undefined).iso).toBe(JOULU_OLETUS_PAIVA);
  });

  it("ostoskori: varhaisin päivä, ja päivän jälkeen ei mitään", () => {
    const cats = ["t-paidat", "hupparit"];
    const end = Math.min(...cats.map((c) => jouluTakarajaKategorialle(c).endUtcMs));
    expect(aktiivinenJouluTakaraja(cats, fi("2026-11-01T12:00:00"))?.endUtcMs).toBe(end);
    expect(aktiivinenJouluTakaraja(cats, end)).not.toBeNull();
    expect(aktiivinenJouluTakaraja(cats, end + 1)).toBeNull();
    expect(aktiivinenJouluTakaraja(cats, fi("2026-12-01T00:00:00"))).toBeNull();
    expect(aktiivinenJouluTakaraja(["t-paidat"], fi("2026-12-01T12:00:00"))?.iso).toBe("2026-12-01");
    expect(aktiivinenJouluTakaraja([], fi("2026-11-01T12:00:00"))).toBeNull();
  });
});

describe("JouluTakarajaRivi", () => {
  it("ei renderöidy palvelimella (esirenderöity HTML ei sisällä lupausta)", () => {
    expect(renderToString(<JouluTakarajaRivi categories={["t-paidat"]} />)).toBe("");
  });

  it("näkyy ennen takarajaa ja katoaa takarajan ylittyessä sivun ollessa auki", () => {
    vi.useFakeTimers();
    vi.setSystemTime(fi("2026-11-30T23:59:58"));
    render(<JouluTakarajaRivi categories={["hupparit"]} />);
    expect(screen.getByText("Ehtii jouluksi, kun tilaat viimeistään ma 30.11.2026.")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.queryByText(/Ehtii jouluksi, kun tilaat/)).toBeNull();
  });

  it("ei näy takarajan jälkeen eikä tyhjällä kategorialistalla", () => {
    vi.useFakeTimers();
    vi.setSystemTime(fi("2026-12-02T00:00:00"));
    const { container } = render(<JouluTakarajaRivi categories={["t-paidat"]} />);
    expect(container.innerHTML).toBe("");
    vi.setSystemTime(fi("2026-11-01T12:00:00"));
    const empty = render(<JouluTakarajaRivi categories={[]} />);
    expect(empty.container.innerHTML).toBe("");
  });
});

describe("scripts/joulu-aikataulu.mjs: arkipäivälaskenta", () => {
  it("itsenäisyyspäivä 6.12.2026 on sunnuntai ja jouluaatto pyhä", () => {
    expect(new Date("2026-12-06T00:00:00Z").getUTCDay()).toBe(0);
    expect(isFiBusinessDay("2026-12-06")).toBe(false);
    expect(isFiBusinessDay("2026-12-24")).toBe(false);
    expect(isFiBusinessDay("2026-12-23")).toBe(true);
  });

  it("laskee arkipäivät ja viimeisen tilauspäivän 23.12.2026 perille", () => {
    expect(weekdaysBetween("2026-08-02", "2026-08-19")).toBe(13);
    expect(latestOrderDate(0)).toBe("2026-12-23");
    expect(latestOrderDate(17)).toBe("2026-11-30");
    expect(latestOrderDate(23)).toBe("2026-11-20");
  });
});
