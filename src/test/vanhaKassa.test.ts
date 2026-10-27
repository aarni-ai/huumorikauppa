import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Vanha Lovable-kassa suljettu (27.10.2026): oman taustan sivusto ei kutsu Lovablen create-checkout-funktiota
 * missään, ostopainikkeet vievät omaan kassaan (/api/checkout), ja vanhan Vercel-projektin osoitteet
 * (*.aarni-ais-projects.vercel.app, jotka julkaisevat mainin) ohjautuvat huumorikauppa.fi:hin.
 */
const ROOT = path.resolve(__dirname, "../..");
const tiedostot = (kansio: string): string[] =>
  fs.readdirSync(kansio, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(kansio, e.name);
    if (e.isDirectory()) return tiedostot(p);
    return /\.(tsx?|jsx?)$/.test(e.name) && !/\.test\./.test(e.name) ? [p] : [];
  });

describe("vanha kassa", () => {
  it("sivusto ei kutsu Lovablen kassaa eikä Stripe-sessioita Supabasesta", () => {
    for (const f of [...tiedostot(path.join(ROOT, "src")), path.join(ROOT, "middleware.ts")]) {
      const koodi = fs.readFileSync(f, "utf8");
      expect(koodi, path.relative(ROOT, f)).not.toMatch(/["'`](create-checkout|get-order-by-session|restore-cart)["'`]/);
      expect(koodi, path.relative(ROOT, f)).not.toMatch(/functions\/v1\/(create-checkout|stripe-webhook)/);
    }
  });

  it("kassa maksaa oman taustan kautta", () => {
    expect(fs.readFileSync(path.join(ROOT, "src/pages/CheckoutPage.tsx"), "utf8")).toMatch(/fetch\("\/api\/checkout"/);
  });

  it("vanhan projektin osoitteet ohjautuvat kauppaan", () => {
    const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
    const r = vercel.redirects.find((x: { has?: { value: string }[] }) => x.has?.some((h) => h.value.includes("aarni-ais-projects")));
    expect(r?.destination).toBe("https://huumorikauppa.fi/$1");
    expect(new RegExp(`^${r.has[0].value}$`).test("huumorikauppa-git-main-aarni-ais-projects.vercel.app")).toBe(true);
    expect(new RegExp(`^${r.has[0].value}$`).test("huumorikauppa-five.vercel.app")).toBe(false);
  });

  it("uutiskirjelomakkeet tallentavat omaan tauluun eivätkä lupaa alennuskoodia, jota kassa ei hyväksy", () => {
    for (const f of ["src/components/layout/Footer.tsx", "src/pages/Index.tsx"]) {
      const koodi = fs.readFileSync(path.join(ROOT, f), "utf8");
      expect(koodi, f).toMatch(/fetch\("\/api\/sahkoposti"/);
      expect(koodi, f).not.toMatch(/subscribe-mailerlite|HUUMORI5|5 % alennu/);
    }
  });

  it("Supabase-asiakas ei kaada sivustoa ilman Lovablen muuttujia", () => {
    const koodi = fs.readFileSync(path.join(ROOT, "src/integrations/supabase/client.ts"), "utf8");
    expect(koodi).toMatch(/VITE_SUPABASE_URL \|\| "https:\/\//);
    expect(koodi).toMatch(/VITE_SUPABASE_PUBLISHABLE_KEY \|\| "/);
  });
});
