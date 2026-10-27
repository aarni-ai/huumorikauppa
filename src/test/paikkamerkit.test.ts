import { describe, expect, it } from "vitest";
import { landingPages } from "@/data/landingPages";
import { christmasDeadlinePage } from "@/data/christmasDeadlinePage";

// Tavallisissa lainausmerkeissä "${X}" ei interpoloidu ja näkyisi sivulla sellaisenaan (28.10.2026 /joululahjat).
describe("ei interpoloimattomia paikkamerkkejä sivujen datassa", () => {
  it("laskeutumissivut ja joulun tilauspäiväsivu", () => {
    expect(JSON.stringify(landingPages)).not.toContain("${");
    expect(JSON.stringify(christmasDeadlinePage)).not.toContain("${");
  });
});
