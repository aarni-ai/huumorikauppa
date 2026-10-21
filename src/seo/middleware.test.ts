// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * middleware.ts: tuntematon tuote palauttaa oikean 404:n (noindex), tunnettu tuote ja
 * piilotettu kategoria (mukit) käsitellään kuten ennenkin. fetch on mokattu.
 */
type Handler = (url: string) => Response | Promise<Response>;

let middleware: (req: Request) => Promise<Response | undefined>;

function mockFetch(handler: Handler) {
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => handler(typeof input === "string" ? input : input instanceof URL ? input.href : input.url)));
}

const KNOWN = ["amatimies-t-paita", "kalju-huppari"];

function siteHandler(supabaseRows: Record<string, unknown[]>): Handler {
  return (url) => {
    if (url.endsWith("/product-slugs.json")) return new Response(JSON.stringify(KNOWN), { status: 200 });
    if (url.endsWith("/404.html")) return new Response('<html><head><meta name="robots" content="noindex, follow" /></head><body>404</body></html>', { status: 200 });
    // Oma tausta: middleware tarkistaa tuntemattoman slugin omasta /api/products-funktiosta.
    if (url.includes("/api/products")) {
      const slug = decodeURIComponent(new URL(url).searchParams.get("slug")!);
      const row = (supabaseRows[slug] ?? [])[0];
      return row ? new Response(JSON.stringify(row), { status: 200 }) : new Response("null", { status: 404 });
    }
    return new Response("<html><head></head><body></body></html>", { status: 200 });
  };
}

beforeAll(async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-key");
  middleware = (await import("../../middleware")).default;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const human = { "user-agent": "Mozilla/5.0" };

describe("middleware: product pages", () => {
  it("returns a real 404 with noindex for an unknown product", async () => {
    mockFetch(siteHandler({}));
    const res = await middleware(new Request("https://huumorikauppa.fi/tuote/ei-ole-olemassa", { headers: human }));
    expect(res?.status).toBe(404);
    expect(res?.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(await res!.text()).toContain("noindex");
  });

  it("returns 404 for drafts (is_active false)", async () => {
    mockFetch(siteHandler({ luonnos: [{ slug: "luonnos", category: "t-paidat", is_active: false }] }));
    const res = await middleware(new Request("https://huumorikauppa.fi/tuote/luonnos", { headers: human }));
    expect(res?.status).toBe(404);
  });

  it("lets known products through (prerendered or added after the build)", async () => {
    mockFetch(siteHandler({ "uusi-paita": [{ slug: "uusi-paita", category: "t-paidat", is_active: true }] }));
    expect(await middleware(new Request("https://huumorikauppa.fi/tuote/amatimies-t-paita", { headers: human }))).toBeUndefined();
    expect(await middleware(new Request("https://huumorikauppa.fi/tuote/uusi-paita", { headers: human }))).toBeUndefined();
  });

  it("redirects hidden-category products (mugs) to all products", async () => {
    mockFetch(siteHandler({ kahvimuki: [{ slug: "kahvimuki", category: "mukit", is_active: true }] }));
    const res = await middleware(new Request("https://huumorikauppa.fi/tuote/kahvimuki", { headers: human }));
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://huumorikauppa.fi/kaikki-tuotteet");
  });

  it("does not 404 when the product lookup fails", async () => {
    mockFetch((url) => (url.includes("/api/products") ? new Response("error", { status: 500 }) : siteHandler({})(url)));
    const res = await middleware(new Request("https://huumorikauppa.fi/tuote/jokin-muu", { headers: human }));
    expect(res).toBeUndefined();
  });

  it("does not touch other paths for human visitors", async () => {
    mockFetch(siteHandler({}));
    expect(await middleware(new Request("https://huumorikauppa.fi/joululahjat", { headers: human }))).toBeUndefined();
  });
});
