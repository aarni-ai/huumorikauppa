// @vitest-environment node
import { describe, expect, it } from "vitest";
import { epatavallinenUa, onDatakeskus, asiakkaanIp, bottiSyy, koostaAitous, aitousRivit } from "../../api/_lib/botit.js";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const INSTAGRAM = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22B83 Instagram 356.0.0.33.98 (iPhone15,2; iOS 18_1; fi_FI; fi)";

describe("epätavallinen User-Agent", () => {
  it("tavalliset selaimet ja sovellusselaimet hyväksytään", () => {
    for (const ua of [IPHONE, CHROME, INSTAGRAM]) expect(epatavallinenUa(ua)).toBe(false);
  });
  it("kirjastot, headless, lyhyet ja vanhentuneet hylätään", () => {
    for (const ua of ["", "curl/8.4.0", "python-requests/2.31", "Mozilla/5.0",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36",
      "Mozilla/5.0 (Windows NT 6.1; rv:68.0) Gecko/20100101 Firefox/68.0"]) expect(epatavallinenUa(ua)).toBe(true);
  });
});

describe("datakeskusten IP-alueet", () => {
  it("pilvipalvelut tunnistetaan (IPv4 ja IPv6)", () => {
    for (const ip of ["3.120.10.1", "34.88.1.2", "52.28.0.9", "20.50.2.1", "95.216.1.1", "51.75.10.10", "167.99.1.1", "2a01:4f8:c17:1::1", "2600:1f18::5", "::ffff:18.200.1.1"])
      expect(onDatakeskus(ip), ip).toBe(true);
  });
  it("kotiliittymät ja mobiiliverkot eivät ole datakeskuksia", () => {
    for (const ip of ["85.76.10.1", "91.152.3.4", "193.65.1.1", "2001:14ba:1::1", "", "ei-ip"]) expect(onDatakeskus(ip), ip).toBe(false);
  });
});

describe("kävijän IP", () => {
  it("välitetyssä pyynnössä vain välittäjän otsake", () => {
    expect(asiakkaanIp({ "x-huumorikauppa-proxy": "https://huumorikauppa.fi", "x-forwarded-for": "3.1.1.1", "x-huumorikauppa-ip": "85.76.1.1" })).toBe("85.76.1.1");
    expect(asiakkaanIp({ "x-huumorikauppa-proxy": "https://huumorikauppa.fi", "x-forwarded-for": "3.1.1.1" })).toBeNull();
  });
  it("suora pyyntö: x-real-ip tai x-forwarded-for", () => {
    expect(asiakkaanIp({ "x-forwarded-for": "85.76.1.1, 10.0.0.1" })).toBe("85.76.1.1");
    expect(asiakkaanIp({ "x-real-ip": "91.1.1.1" })).toBe("91.1.1.1");
  });
});

describe("botin syy", () => {
  it("aito vain tavallisella UA:lla, ei datakeskuksesta ja vuorovaikutuksella", () => {
    expect(bottiSyy({ ua: IPHONE, ip: "85.76.1.1", aitous: "aito" })).toBeNull();
    expect(bottiSyy({ ua: IPHONE, ip: null, aitous: "aito" })).toBeNull();
  });
  it("syyt järjestyksessä", () => {
    expect(bottiSyy({ ua: "curl/8", ip: "85.76.1.1", aitous: "aito" })).toBe("ua-epatavallinen");
    expect(bottiSyy({ ua: CHROME, ip: "34.88.1.2", aitous: "aito" })).toBe("datakeskus");
    expect(bottiSyy({ ua: CHROME, ip: "85.76.1.1", aitous: "headless" })).toBe("headless");
    expect(bottiSyy({ ua: CHROME, ip: "85.76.1.1", aitous: "passiivinen" })).toBe("ei-vuorovaikutusta");
    expect(bottiSyy({ ua: CHROME, ip: "85.76.1.1" })).toBe("ei-signaalia");
    expect(bottiSyy({ ua: CHROME, ip: "85.76.1.1", vaadiAitous: false })).toBeNull();
  });
});

describe("aitouskooste ja raportti", () => {
  it("kaikki, aidot, botit syittäin ja osuus", () => {
    const k = koostaAitous([
      { mittari: "tuotesivu", luokka: "aito", maara: 30 },
      { mittari: "tuotesivu", luokka: "ei-vuorovaikutusta", maara: 60 },
      { mittari: "tuotesivu", luokka: "datakeskus", maara: 10 },
    ]);
    expect(k.tuotesivu).toEqual({ kaikki: 100, aidot: 30, botit: 70, osuus: 30, syyt: { "ei-vuorovaikutusta": 60, datakeskus: 10 } });
    const rivit = aitousRivit({ alku: "2026-11-04", loppu: "2026-11-04", mittarit: k });
    expect(rivit[1]).toBe("- tuotesivun katselut: kaikki 100, aidot 30 (30 %), botit 70 (ei vuorovaikutusta 60, datakeskus 10)");
  });
  it("tyhjä kooste", () => {
    expect(aitousRivit({ alku: "2026-11-04", mittarit: {} })[0]).toMatch(/ei vielä/);
  });
});
