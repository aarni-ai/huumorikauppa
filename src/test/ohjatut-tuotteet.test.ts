import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { OHJATUT_TUOTESLUGIT } from "../../api/_lib/ohjatut-tuotteet.js";

describe("ohjatut tuoteslugit", () => {
  it("vastaavat vercel.json:n /tuote/-ohjauksia", () => {
    const d = JSON.parse(readFileSync("vercel.json", "utf8"));
    const lahteet = new Set<string>(
      d.redirects.map((r: { source: string }) => r.source).filter((s: string) => s.startsWith("/tuote/") && !s.includes(":") && !s.includes("(")).map((s: string) => s.slice(7)),
    );
    expect([...OHJATUT_TUOTESLUGIT].sort()).toEqual([...lahteet].sort());
  });
});
