import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MAKSUTAVAT, maksutavatTekstina, PAYMENT_METHODS_TEXT } from "./maksutavat";
import { PaymentIcons } from "@/components/PaymentIcons";
import { TOIMITUSRIVI, TOIMITUSMAKSU_TEKSTI, ILMAINEN_RAJA_TEKSTI } from "./toimitus";
import { routePreloadScript } from "@/seo/prerender/html";

describe("maksutavat yhdestä listasta", () => {
  it("kuvakkeet piirretään vain listan maksutavoille", () => {
    const kaikki = render(<PaymentIcons />).container;
    expect(kaikki.querySelectorAll("li")).toHaveLength(MAKSUTAVAT.length);
    const vain = render(<PaymentIcons tavat={["visa", "klarna"]} />).container;
    expect([...vain.querySelectorAll("svg")].map((i) => i.getAttribute("aria-label"))).toEqual(["Visa", "Klarna"]);
  });

  it("teksti listasta: Visa, Mastercard, Apple Pay, Google Pay, Klarna ja MobilePay", () => {
    expect(PAYMENT_METHODS_TEXT).toBe(maksutavatTekstina());
    expect(PAYMENT_METHODS_TEXT).toBe("Visa, Mastercard, Apple Pay, Google Pay, Klarna ja MobilePay");
    expect(maksutavatTekstina(["visa"])).toBe("Visa");
  });

  it("toimitusrivi rakentuu toimitusehdoista", () => {
    expect(TOIMITUSRIVI).toBe(`Toimitus ${TOIMITUSMAKSU_TEKSTI} €, ilmainen ${ILMAINEN_RAJA_TEKSTI} eurosta`);
  });
});

describe("SPA-kuoren reittiesilataus", () => {
  it("tyhjä kartta: ei skriptiä", () => {
    expect(routePreloadScript({})).toBe("");
    expect(routePreloadScript({ "/kassa": [] })).toBe("");
  });
  it("lisää polun chunkit modulepreloadeiksi", () => {
    const html = routePreloadScript({ "/ostoskori": ["/assets/CartPage-x.js"] });
    expect(html).toContain('"/ostoskori":["/assets/CartPage-x.js"]');
    expect(html).toContain('l.rel="modulepreload"');
    const m = { "/ostoskori": ["/assets/CartPage-x.js"] } as Record<string, string[]>;
    const lisatyt: string[] = [];
    const koodi = html.replace(/^<script>|<\/script>$/g, "");
    new Function("location", "document", koodi)(
      { pathname: "/ostoskori/" },
      { createElement: () => ({}), head: { appendChild: (l: { href: string }) => lisatyt.push(l.href) } },
    );
    expect(lisatyt).toEqual(m["/ostoskori"]);
  });
});
