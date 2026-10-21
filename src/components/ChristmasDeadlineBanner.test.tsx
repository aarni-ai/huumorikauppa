import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { ChristmasDeadlineBanner } from "./ChristmasDeadlineBanner";
import { CHRISTMAS_DEADLINE_END_UTC_MS, isBeforeChristmasDeadline } from "@/data/christmas";

const banner = () => (
  <MemoryRouter>
    <ChristmasDeadlineBanner />
  </MemoryRouter>
);

afterEach(() => {
  vi.useRealTimers();
});

describe("Christmas deadline banner", () => {
  it("ends at 20.11.2026 23:59:59 Finnish time (UTC+2)", () => {
    expect(new Date(CHRISTMAS_DEADLINE_END_UTC_MS).toISOString()).toBe("2026-11-20T21:59:59.999Z");
    expect(isBeforeChristmasDeadline(Date.parse("2026-11-20T21:59:00Z"))).toBe(true);
    expect(isBeforeChristmasDeadline(Date.parse("2026-11-20T22:00:00Z"))).toBe(false);
  });

  it("is not part of server-rendered/static HTML (client-side only)", () => {
    expect(renderToString(banner())).toBe("");
  });

  it("shows before the deadline and links to the deadline page", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-21T10:00:00Z"));
    render(banner());
    expect(screen.getByText(/20\.11\.2026/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lue lisää" })).toHaveAttribute("href", "/joulun-viimeiset-tilauspaivat");
  });

  it("hides itself after the deadline", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-21T06:00:00Z"));
    const { container } = render(banner());
    expect(container.textContent).toBe("");
  });
});
