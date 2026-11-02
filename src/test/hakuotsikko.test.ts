import { describe, it, expect } from "vitest";
import { hakuotsikko, OTSIKKO_MAX } from "../../api/_lib/hakuotsikko.js";
import { syoteOtsikko, sisallotaItem } from "../../api/_lib/syote-sisalto.js";
import snapshot from "./fixtures/products-snapshot.json";

type Rivi = { id: string; slug: string; name: string; category: string; description: string };
const tuotteet = snapshot as Rivi[];

const tuote = (o: Partial<Rivi> = {}): Rivi => ({ id: "p1", slug: "testi", category: "t-paidat", name: "Tonnin Seteli | T-Paita", description: "", ...o });

const LYHENTEET = new Set(["IT", "EU", "USA", "XL", "OK", "GPS", "HIFK", "HJK", "TPS", "KPS", "HPK"]);
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/u;

/** Ensimmäinen sana (vähintään 3 kirjainta) painotekstistä, normalisoituna vertailua varten. */
const norm = (s: string) => s.toLowerCase().replace(/❤️?/gu, "love").replace(/lll/g, "ll").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();

describe("hakuotsikko: esimerkit", () => {
  it("hakulause ensin, painoteksti perässä", () => {
    expect(hakuotsikko(tuote({ name: "Ei ole kantava seinä. Oli | T-paita miehelle" }))).toMatch(/^Hauska t-paita[^:]*: Ei ole kantava seinä\. Oli$/);
    expect(hakuotsikko(tuote({ name: "En nuku. Lepuutan silmiä | T-paita isälle" }))).toBe("Hauska t-paita isälle: En nuku. Lepuutan silmiä");
    expect(hakuotsikko(tuote({ category: "hupparit", name: "Eläkkeellä. Kello on vain koru | Huppari eläkeläiselle" }))).toBe(
      "Hauska huppari eläkeläiselle: Eläkkeellä. Kello on vain koru",
    );
  });

  it("sauna ja joulu saavat oman tuotenimen", () => {
    expect(hakuotsikko(tuote({ name: "Ylälauteilla syntyvät päätökset | T-paita saunojalle", slug: "ylalauteilla-syntyvat-paatokset-t-paita-saunojalle" }))).toBe(
      "Saunapaita: Ylälauteilla syntyvät päätökset",
    );
    expect(hakuotsikko(tuote({ category: "hupparit", name: "Löylyä ja lämpöä | Huppari saunojalle", slug: "loylya-ja-lampoa-huppari-saunojalle" }))).toBe(
      "Saunahuppari: Löylyä ja lämpöä",
    );
    expect(hakuotsikko(tuote({ name: "Tonttu koeajalla | T-paita jouluun" }))).toBe("Joulupaita: Tonttu koeajalla");
    expect(hakuotsikko(tuote({ category: "hupparit", name: "Glögi virtaa | Huppari jouluun" }))).toBe("Jouluhuppari: Glögi virtaa");
  });

  it("pitkä otsikko lyhenee: ensin kenelle-osa pois, sitten painoteksti sanarajalta ilman kolmea pistettä", () => {
    const keskipitka = hakuotsikko(tuote({ name: "Sukulaisten IT-tuki. Ei palkkaa. Ei kiitosta | T-paita IT-ihmiselle" }));
    expect(keskipitka.length).toBeLessThanOrEqual(OTSIKKO_MAX);
    const pitka = hakuotsikko(tuote({ name: `${"Pitkä sana ".repeat(20)}| T-Paita eläkeläiselle` }));
    expect(pitka.length).toBeLessThanOrEqual(OTSIKKO_MAX);
    expect(pitka).toMatch(/^Hauska t-paita: Pitkä sana(?: pitkä(?: sana)?)*$/i);
    expect(pitka).not.toMatch(/\.\.\.|…/);
  });

  it("Merchant-syötteen g:title on sama kuin sivun title", () => {
    const p = tuote({ name: "En nuku. Lepuutan silmiä | T-paita isälle" });
    expect(syoteOtsikko(p)).toBe(hakuotsikko(p));
    const item = "<item>\n      <g:id>p1</g:id>\n      <g:title>vanha</g:title>\n    </item>";
    expect(sisallotaItem(item, p)).toContain(`<g:title>${hakuotsikko(p)}</g:title>`);
  });
});

describe("hakuotsikko: tilannekuvan kaikki tuotteet", () => {
  const otsikot = tuotteet.map((p) => ({ p, t: hakuotsikko(p) }));

  it("tilannekuvassa on tuotteita", () => {
    expect(otsikot.length).toBeGreaterThan(500);
  });

  it("alle 70 merkkiä, alkaa isolla kirjaimella, ei ajatusviivoja, emojeja, versaaleja eikä kolmea pistettä", () => {
    for (const { p, t } of otsikot) {
      expect(t.length, `${p.slug}: ${t}`).toBeLessThan(70);
      expect(t.length, p.slug).toBeGreaterThan(5);
      expect(t.charAt(0), `${p.slug}: ${t}`).toBe(t.charAt(0).toUpperCase());
      expect(t.charAt(0), `${p.slug}: ${t}`).toMatch(/\p{Lu}|\d/u);
      expect(t, p.slug).not.toMatch(/[–—]/);
      expect(t, p.slug).not.toMatch(EMOJI);
      expect(t, p.slug).not.toMatch(/\.\.\.|…|\[|\]/);
      expect(t, p.slug).not.toMatch(/\s{2,}|\s[,.:;]/);
      for (const sana of t.match(/\p{Lu}{2,}/gu) ?? []) expect(LYHENTEET.has(sana), `${p.slug}: ${t}`).toBe(true);
    }
  });

  it("sisältää painotekstin alun", () => {
    for (const { p, t } of otsikot) {
      const runko = norm(t.slice(t.indexOf(": ") + 2));
      const alku = runko.split(" ").slice(0, 2).join(" ");
      expect(t.includes(": "), `${p.slug}: ${t}`).toBe(true);
      expect(alku.length, `${p.slug}: ${t}`).toBeGreaterThan(1);
      expect(norm(p.name), `${p.slug}: ${t}`).toContain(alku);
    }
  });

  it("kaksi eri nimeä ei saa samaa otsikkoa (samannimiset kopiot sallitaan)", () => {
    const nimet = new Map<string, Set<string>>();
    for (const { p, t } of otsikot) nimet.set(t, (nimet.get(t) ?? new Set()).add(norm(p.name)));
    const toistot = [...nimet].filter(([, n]) => n.size > 1).map(([t, n]) => `${t} <= ${[...n].join(" / ")}`);
    // Tunnettu tietovirhe: "... | Muki" -niminen tuote on tilannekuvassa kategoriassa t-paidat (sama otsikko kuin t-paidalla).
    expect(toistot.filter((x) => !x.includes("30 ja liian vanha tyhmyyksiin"))).toEqual([]);
  });
});
