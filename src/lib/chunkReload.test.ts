import { afterEach, describe, expect, it, vi } from "vitest";
import { CHUNK_RELOAD_KEY, CHUNK_RELOAD_MIN_INTERVAL_MS, reloadOnceForStaleChunk } from "./chunkReload";
import { BOOT_GUARD_SCRIPT, deferEntryScripts } from "@/seo/prerender/html";
import vercel from "../../vercel.json";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  };
}

describe("reloadOnceForStaleChunk", () => {
  it("reloads once and records the time", () => {
    const s = memoryStorage();
    const reload = vi.fn();
    expect(reloadOnceForStaleChunk(s, 1_000_000, reload)).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
    expect(s.data[CHUNK_RELOAD_KEY]).toBe("1000000");
  });

  it("does not reload again within the interval (no loop)", () => {
    const s = memoryStorage({ [CHUNK_RELOAD_KEY]: "1000000" });
    const reload = vi.fn();
    expect(reloadOnceForStaleChunk(s, 1_000_000 + CHUNK_RELOAD_MIN_INTERVAL_MS - 1, reload)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
    expect(reloadOnceForStaleChunk(s, 1_000_000 + CHUNK_RELOAD_MIN_INTERVAL_MS, reload)).toBe(true);
  });

  it("does not reload without sessionStorage", () => {
    const reload = vi.fn();
    expect(reloadOnceForStaleChunk(null, 1, reload)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});

describe("BOOT_GUARD_SCRIPT (inline, without the app bundle)", () => {
  const w = window as Window & { __hkMain?: boolean; __hkBootFail?: () => void };

  afterEach(() => {
    delete w.__hkMain;
    delete w.__hkBootFail;
    sessionStorage.clear();
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  function setup() {
    document.head.innerHTML = '<style id="prerender-style">[data-prerender]{position:absolute}</style>';
    document.body.innerHTML =
      '<div data-prerender-visual="true" inert=""><img src="/x.webp"></div>' +
      '<div id="root" style="display: none"><div data-prerender="true"><a href="/">Etusivu</a></div></div>';
    const code = BOOT_GUARD_SCRIPT.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    const reload = vi.fn();
    Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, reload } });
    new Function(code)();
    return reload;
  }

  function failModuleScript() {
    const s = document.createElement("script");
    s.type = "module";
    document.head.appendChild(s);
    s.dispatchEvent(new Event("error"));
  }

  it("reloads once when the entry module fails to load", () => {
    const reload = setup();
    failModuleScript();
    expect(reload).toHaveBeenCalledOnce();
    expect(Number(sessionStorage.getItem(CHUNK_RELOAD_KEY))).toBeGreaterThan(0);
  });

  it("after a recent reload, replaces the inert preview with the static page instead of looping", () => {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
    const reload = setup();
    failModuleScript();
    expect(reload).not.toHaveBeenCalled();
    expect(document.querySelector("[data-prerender-visual]")).toBeNull();
    expect(document.getElementById("prerender-style")).toBeNull();
    expect(document.getElementById("root")!.style.display).toBe("");
  });

  it("does nothing once the app has started", () => {
    const reload = setup();
    w.__hkMain = true;
    failModuleScript();
    expect(reload).not.toHaveBeenCalled();
    expect(document.querySelector("[data-prerender-visual]")).not.toBeNull();
  });

  it("deferred entry loader reports load failures and a missing app start to the guard", () => {
    const out = deferEntryScripts(
      '<head><script type="module" crossorigin src="/assets/index-a.js"></script></head><body></body>',
    );
    expect(out).toContain("s.onerror=function(){w.__hkBootFail&&w.__hkBootFail()}");
    expect(out).toContain("s.onload=function(){if(!w.__hkMain&&w.__hkBootFail)w.__hkBootFail()}");
  });
});

describe("vercel.json SPA rewrite", () => {
  const rewrite = (vercel as { rewrites: { source: string; destination: string }[] }).rewrites.find(
    (r) => r.destination === "/spa-shell.html",
  )!;
  const re = new RegExp(`^${rewrite.source}$`);

  it("does not answer missing JS/CSS chunks with HTML (they must 404 so the load error is detectable)", () => {
    expect(re.test("/assets/index-OLDHASH.js")).toBe(false);
    expect(re.test("/assets/index-OLDHASH.css")).toBe(false);
    expect(re.test("/assets/whatever")).toBe(false);
  });

  it("still rewrites app routes", () => {
    expect(re.test("/tuote/uusi-tuote")).toBe(true);
    expect(re.test("/kategoria/t-paidat")).toBe(true);
  });
});
