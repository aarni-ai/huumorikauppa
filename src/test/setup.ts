import "@testing-library/jest-dom";

if (typeof window !== "undefined") Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Laskeutumissivujen A/B-testit (src/lib/abTestit.ts): testeissä aina versio a, ettei arvonta tee testeistä satunnaisia.
import { asetaAbVersio } from "@/lib/abTestit";
asetaAbVersio("koko", "a");
asetaAbVersio("blogi", "a");
asetaAbVersio("toimitus", "a");
