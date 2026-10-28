import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { BANNER_CONTENT, SeasonalBanner } from "./SeasonalBanner";
import {
  activeBannerTheme,
  BANNER_SCHEDULE,
  CHRISTMAS_ORDER_END_UTC_MS,
  FATHERS_DAY_ORDER_END_UTC_MS,
  helsinkiTimeToUtcMs,
  nextBannerChangeMs,
} from "@/data/campaignSchedule";
import { CHRISTMAS_DEADLINE_END_UTC_MS, isBeforeChristmasDeadline } from "@/data/christmas";
import { JOULU_PAIVA_TEKSTI } from "@/data/tilauspaivat";

const banner = () => (
  <MemoryRouter>
    <SeasonalBanner />
  </MemoryRouter>
);

/** Suomen aika lokakuun lopussa ja marraskuussa on UTC+2 (kesäaika päättyi 25.10.2026). */
/** Suomen seinäkelloaika (kesä- ja talviaika oikein) -> UTC ms. */
const fi = (local: string) => {
  const [p, t = "00:00:00"] = local.split("T");
  const [y, mo, d] = p.split("-").map(Number);
  const [hh, mm, ss] = t.split(":");
  const [sek, ms = "0"] = ss.split(".");
  return helsinkiTimeToUtcMs(y, mo, d, Number(hh), Number(mm), Number(sek), Number(ms.padEnd(3, "0")));
};

afterEach(() => {
  vi.useRealTimers();
});

describe("banner schedule (Europe/Helsinki)", () => {
  it("converts Helsinki wall time to UTC across DST", () => {
    expect(new Date(helsinkiTimeToUtcMs(2026, 10, 28, 23, 59, 59)).toISOString()).toBe("2026-10-28T21:59:59.000Z");
    expect(new Date(helsinkiTimeToUtcMs(2026, 10, 29)).toISOString()).toBe("2026-10-28T22:00:00.000Z");
    // Kesäaika (UTC+3) ennen 25.10.2026
    expect(new Date(helsinkiTimeToUtcMs(2026, 10, 1)).toISOString()).toBe("2026-09-30T21:00:00.000Z");
    // Toimitusajoista laskettu (17 arkipäivää ennen pe 6.11.2026): ke 14.10.2026.
    expect(new Date(FATHERS_DAY_ORDER_END_UTC_MS).toISOString()).toBe("2026-10-14T20:59:59.999Z");
    expect(new Date(CHRISTMAS_ORDER_END_UTC_MS).toISOString()).toBe("2026-11-30T21:59:59.999Z");
    expect(CHRISTMAS_DEADLINE_END_UTC_MS).toBe(CHRISTMAS_ORDER_END_UTC_MS);
  });

  it("Father's Day until 14.10.2026 23:59:59 (computed), Christmas right after", () => {
    expect(activeBannerTheme(fi("2026-10-10T12:00:00"))).toBe("isanpaiva");
    expect(activeBannerTheme(fi("2026-10-14T23:59:59"))).toBe("isanpaiva");
    expect(activeBannerTheme(fi("2026-10-14T23:59:59.999"))).toBe("isanpaiva");
    expect(activeBannerTheme(fi("2026-10-15T00:00:00"))).toBe("joulu");
    expect(activeBannerTheme(fi("2026-10-28T12:00:00"))).toBe("joulu");
  });

  it("Christmas until 30.11.2026 23:59:59, nothing from 1.12.2026 00:00:00", () => {
    expect(activeBannerTheme(fi("2026-11-30T23:59:59"))).toBe("joulu");
    expect(activeBannerTheme(fi("2026-12-01T00:00:00"))).toBeNull();
    expect(activeBannerTheme(fi("2027-01-01T12:00:00"))).toBeNull();
    expect(isBeforeChristmasDeadline(fi("2026-11-30T23:59:59"))).toBe(true);
    expect(isBeforeChristmasDeadline(fi("2026-12-01T00:00:00"))).toBe(false);
  });

  it("slots are ordered, contiguous at the switch and non-overlapping", () => {
    for (let i = 1; i < BANNER_SCHEDULE.length; i++) {
      expect(BANNER_SCHEDULE[i].fromMs).toBe(BANNER_SCHEDULE[i - 1].untilMs + 1);
    }
    expect(nextBannerChangeMs(fi("2026-10-10T12:00:00"))).toBe(fi("2026-10-15T00:00:00"));
    expect(nextBannerChangeMs(fi("2026-11-01T12:00:00"))).toBe(fi("2026-12-01T00:00:00"));
    expect(nextBannerChangeMs(fi("2026-12-01T00:00:00"))).toBeNull();
  });
});

describe("SeasonalBanner", () => {
  it("is not part of server-rendered/static HTML (client-side only)", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(fi("2026-10-21T12:00:00"));
    expect(renderToString(banner())).toBe("");
  });

  it("14.10 23:59:59 shows the Father's Day banner linking to /isanpaivalahja", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(fi("2026-10-14T23:59:59"));
    render(banner());
    expect(screen.getByText(/8\.11\.2026/)).toBeInTheDocument();
    expect(screen.getByText(/14\.10\.2026/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Katso isänpäivälahjat" })).toHaveAttribute("href", "/isanpaivalahja");
    expect(screen.getByRole("complementary", { name: "Tilausmuistutus" })).toHaveAttribute("data-banner", "isanpaiva");
  });

  it("15.10 00:00:00 shows the Christmas banner with the computed promise", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(fi("2026-10-15T00:00:00"));
    render(banner());
    expect(screen.getByText(new RegExp(JOULU_PAIVA_TEKSTI.replace(/\./g, "\\.")))).toBeInTheDocument();
    expect(screen.queryByText(/isänpäivä/i)).toBeNull();
    expect(screen.getByRole("link", { name: "Joulun viimeiset tilauspäivät" })).toHaveAttribute(
      "href",
      "/joulun-viimeiset-tilauspaivat",
    );
  });

  it("30.11 23:59:59 still shows Christmas, 1.12 00:00:00 shows nothing", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(fi("2026-11-30T23:59:59"));
    const first = render(banner());
    expect(first.container.querySelector('[data-banner="joulu"]')).not.toBeNull();
    first.unmount();
    vi.setSystemTime(fi("2026-12-01T00:00:00"));
    const { container } = render(banner());
    expect(container.textContent).toBe("");
  });

  it("switches theme automatically at midnight while the page is open", () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    vi.setSystemTime(fi("2026-10-14T23:59:58"));
    const { container } = render(banner());
    expect(container.querySelector("[data-banner]")).toHaveAttribute("data-banner", "isanpaiva");
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(container.querySelector("[data-banner]")).toHaveAttribute("data-banner", "joulu");
  });

  it("copy has no dashes, link texts are descriptive and themes use dark backgrounds", () => {
    for (const c of Object.values(BANNER_CONTENT)) {
      expect(c.text).not.toMatch(/[–—]/);
      expect(c.linkText).not.toMatch(/^(lue lisää|tästä|klikkaa)$/i);
      expect(c.className).toMatch(/bg-(blue|red)-9\d0 text-white/);
    }
  });
});
