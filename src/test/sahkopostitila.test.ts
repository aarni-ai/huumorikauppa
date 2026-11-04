import { describe, it, expect, vi } from "vitest";
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({}) } }));
// @ts-expect-error JS-moduuli
import { puutteet, sahkopostiRivit, dnsTila, testiviestit } from "../../api/_lib/sahkopostitila.js";

const valmisDns = { nimipalvelimet: ["annabel.ns.cloudflare.com", "vick.ns.cloudflare.com"], uusiCloudflare: true, vanhaCloudflare: false, dkim: true, sendMx: true, sendSpf: true, dmarc: "v=DMARC1; p=none; rua=mailto:huumorikauppa@gmail.com", dmarcLovable: false };

describe("sähköpostin valmiustila", () => {
  it("valmis, kun DNS, Resend ja reitti ovat kunnossa", () => {
    const p = puutteet({ dns: valmisDns, resend: { avain: true, status: "verified" }, reitti: "resend", omaVahvistus: true });
    expect(p).toEqual([]);
    expect(sahkopostiRivit({ valmis: true, puuttuu: [], vahvistukset: { maksettu: 2, vahvistettu: 2, virheet: 0 } }).join(" ")).toContain("Resend vahvistettu");
  });
  it("nykytila: vanhat nimipalvelimet, ei Resend-tietueita, DMARC lovable.dev", () => {
    const dns = { ...valmisDns, nimipalvelimet: ["aria.ns.cloudflare.com", "huxley.ns.cloudflare.com"], uusiCloudflare: false, vanhaCloudflare: true, dkim: false, sendMx: false, sendSpf: false, dmarc: "v=DMARC1; p=none; rua=mailto:dmarcreports@lovable.dev", dmarcLovable: true };
    const p = puutteet({ dns, resend: { avain: true, status: "failed" }, reitti: "resend", omaVahvistus: false });
    expect(p.join("\n")).toMatch(/nimipalvelimet/);
    expect(p.join("\n")).toMatch(/lovable\.dev/);
    expect(p.join("\n")).toMatch(/Resendin domainin tila failed/);
    expect(p.length).toBe(7);
  });
  it("lukee DNS-vastaukset", async () => {
    const resolver = {
      resolveNs: async () => ["vick.ns.cloudflare.com", "annabel.ns.cloudflare.com"],
      resolveTxt: async (n: string) => n.startsWith("resend.") ? [["p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCUF9+bjHNQ5hAgzDsFGX1wp7BSE29aR3LATlC5vLJ4LSzDc408WZTQ9uZOyZFFSoVhOLXzz0", "/rest"]] : n.startsWith("send.") ? [["v=spf1 include:amazonses.com ~all"]] : [["v=DMARC1; p=none"]],
      resolveMx: async () => [{ exchange: "feedback-smtp.eu-west-1.amazonses.com", priority: 10 }],
    };
    const t = await dnsTila(resolver);
    expect(t).toMatchObject({ uusiCloudflare: true, dkim: true, sendMx: true, sendSpf: true, dmarcLovable: false });
  });
  it("testiviestit kattavat kaikki viestityypit TESTI-otsikolla", async () => {
    process.env.MARKKINOINTI_SALAISUUS ||= "testi";
    const v = await testiviestit("omistaja@example.com");
    const tyypit = v.map((x: { tyyppi: string }) => x.tyyppi);
    for (const t of ["tilausvahvistus", "lahjakortti", "korimuistutus", "uutiskirje", "arvostelupyyntö", "hallinta"]) expect(tyypit).toContain(t);
    for (const x of v) { expect(x.viesti.subject).toMatch(/^TESTI/); expect(x.viesti.to).toBe("omistaja@example.com"); }
  });
});
