import { describe, it, expect } from "vitest";
import {
  syoteOtsikko,
  syoteKuvaus,
  tuotetyyppi,
  materiaali,
  siistiTeksti,
  puraNimi,
  sisallotaItem,
  sisallotaSyote,
  GOOGLE_KATEGORIA_ID,
  GOOGLE_KATEGORIAT,
} from "../../api/_lib/syote-sisalto.js";
import { validateItem, parseFeed, categoryPath, PROMO } from "../../scripts/syote-validointi.mjs";

const variants = { sizes: ["S", "M", "L", "XL", "2XL"], colors: ["Musta", "Valkoinen"], default_color: "Musta" };
const tuote = (o: Record<string, unknown> = {}) => ({
  id: "p1",
  slug: "testituote-t-paita",
  category: "t-paidat",
  name: "Tonnin Seteli | T-Paita",
  description: "Tonnin seteli – hauska paita. 100 % puuvillaa (180 g/m2). Painettu EU:ssa, ilmainen toimitus yli 60 €, 14 pv palautusoikeus.",
  variants,
  ...o,
});

const DASH = /[–—]/;

describe("syötteen otsikot", () => {
  it("tuotetyyppi + kenelle + painoteksti + lahjahaku", () => {
    expect(syoteOtsikko(tuote({ name: "En nuku. Lepuutan silmiä | T-paita isälle" }))).toBe("Hauska t-paita isälle: En nuku. Lepuutan silmiä, isänpäivälahja");
    expect(syoteOtsikko(tuote({ category: "hupparit", name: "Eläkkeellä. Kello on vain koru | Huppari eläkeläiselle" }))).toBe(
      "Hauska huppari eläkeläiselle: Eläkkeellä. Kello on vain koru, lahja eläkeläiselle",
    );
    expect(syoteOtsikko(tuote({ name: "Pikkujoulut. Muistan osittain | T-paita pikkujouluihin" }))).toBe(
      "Hauska t-paita pikkujouluihin: Pikkujoulut. Muistan osittain, pikkujoululahja",
    );
    expect(syoteOtsikko(tuote({ name: "Tonttu koeajalla | T-paita jouluun" }))).toBe("Hauska joulupaita: Tonttu koeajalla, joululahja");
    expect(syoteOtsikko(tuote({ name: "40v, kunnossa niinku 20v | T-Paita" }))).toBe("Hauska t-paita 40-vuotiaalle: 40v, kunnossa niinku 20v, 40v lahja");
    expect(syoteOtsikko(tuote({ name: "Hauska T-Paita Kalastajalle, Kala Pääsi Tällä Kertaa" }))).toBe(
      "Hauska t-paita kalastajalle: Kala pääsi tällä kertaa, lahja kalastajalle",
    );
  });

  it("harrastus- ja ammattisarjat: kenelle, lahjahaku ja product_type (29.10.2026)", () => {
    const sarjat: [string, string, string][] = [
      ["Mittaa kerran. Sahaa kolme kertaa | T-paita remontoijalle", "Hauska t-paita remontoijalle: Mittaa kerran. Sahaa kolme kertaa, lahja remontoijalle", "Remontoijat ja rakentajat"],
      ["Kala oli tätäkin isompi | T-paita kalastajalle", "Hauska t-paita kalastajalle: Kala oli tätäkin isompi, lahja kalastajalle", "Kalastajat"],
      ["Koira löysi. Minä en | T-paita metsästäjälle", "Hauska t-paita metsästäjälle: Koira löysi. Minä en, lahja metsästäjälle", "Metsästäjät"],
      ["Öljynvaihto on terapiaa | T-paita autoilijalle", "Hauska t-paita autoilijalle: Öljynvaihto on terapiaa, lahja autoilijalle", "Autoilijat ja motoristit"],
      ["Mulligan on ihmisoikeus | T-paita golfaajalle", "Hauska t-paita golfaajalle: Mulligan on ihmisoikeus, lahja golfaajalle", "Golfaajat"],
      ["Kantovesi pitää kunnossa | T-paita mökkeilijälle", "Hauska t-paita mökkeilijälle: Kantovesi pitää kunnossa, lahja mökkeilijälle", "Mökkeilijät ja saunojat"],
      ["Traktori ei kysy vapaapäiviä | T-paita maanviljelijälle", "Hauska t-paita maanviljelijälle: Traktori ei kysy vapaapäiviä, lahja maanviljelijälle", "Maanviljelijät ja metsänomistajat"],
      ["Toimii minun koneellani | T-paita IT-ihmiselle", "Hauska t-paita IT-ihmiselle: Toimii minun koneellani, lahja IT-ihmiselle", "Tekniikka- ja IT-ihmiset"],
    ];
    for (const [name, otsikko, taso] of sarjat) {
      const p = tuote({ name });
      expect(syoteOtsikko(p), name).toBe(otsikko);
      expect(tuotetyyppi(p), name).toBe(`Vaatteet > T-paidat > Hauskat t-paidat > ${taso}`);
      expect(syoteKuvaus(p), name).not.toMatch(DASH);
    }
    // Saman aiheen aiemmat tuotteet saavat saman haun ja tason.
    const vanha = tuote({ name: "Hauska T-Paita Metsästäjälle, Ei Ole Kiire Olen Metsässä" });
    expect(syoteOtsikko(vanha)).toBe("Hauska t-paita metsästäjälle: Ei ole kiire olen metsässä, lahja metsästäjälle");
    expect(tuotetyyppi(vanha)).toBe("Vaatteet > T-paidat > Hauskat t-paidat > Metsästäjät");
    expect(tuotetyyppi(tuote({ name: "Hauska T-Paita Koodarille, Ei Se Ole Bugi Se On Feature" }))).toBe("Vaatteet > T-paidat > Hauskat t-paidat > Tekniikka- ja IT-ihmiset");
    expect(syoteKuvaus(tuote({ name: "Kala oli tätäkin isompi | T-paita kalastajalle" }))).toContain("Hauska lahja kalastajalle tai pilkkijälle");
  });

  it("kaupunkituote: asukasnimi ja kaupunki-lahja", () => {
    const p = tuote({ name: "100 % Lahtelaista verta – hauska t-paita", description: "Aitous paidassa. Hauska lahja lahtelaiselle. #kaupunki:Lahti" });
    expect(syoteOtsikko(p)).toBe("Hauska t-paita lahtelaiselle: 100 % Lahtelaista verta, Lahti-lahja");
    const h = tuote({ category: "hupparit", name: "Akaalainen selviää mistä vain – hauska huppari", description: "Sisukkuus hupparissa. #kaupunki:Akaa" });
    expect(syoteOtsikko(h)).toBe("Hauska huppari akaalaiselle: Akaalainen selviää mistä vain, Akaa-lahja");
  });

  it("ei emojeja, versaaleja, paikkamerkkejä eikä väärää isä-osumaa", () => {
    expect(syoteOtsikko(tuote({ name: "I ❤️ Swedish Girls | T-Paita" }))).toBe("Hauska t-paita: I love Swedish Girls, hauska lahja");
    expect(syoteOtsikko(tuote({ name: "maailman paras ÄITI | T-Paita" }))).toBe("Hauska t-paita äidille: Maailman paras äiti, lahja äidille");
    expect(syoteOtsikko(tuote({ name: "ICE AATANA｜T-Paita" }))).toBe("Hauska t-paita: Ice aatana, hauska lahja");
    expect(syoteOtsikko(tuote({ name: "Isäntä | Huppari", category: "hupparit" }))).toBe("Hauska huppari: Isäntä, hauska lahja");
    const pers = syoteOtsikko(tuote({ name: "Personoitava T-Paita, [NIMI] Legendaarinen Työsankari" }));
    expect(pers).toBe("Personoitava t-paita: Nimi legendaarinen työsankari, personoitu lahja");
    expect(pers).not.toMatch(/\[/);
  });

  it("max 150 merkkiä, ei mainostekstiä, painoteksti 'ilmaiseksi' sallittu", () => {
    const pitka = syoteOtsikko(tuote({ name: `${"Pitkä sana ".repeat(20)}| T-Paita` }));
    expect(pitka.length).toBeLessThanOrEqual(150);
    const ilm = syoteOtsikko(tuote({ name: "Kokenut eläkeläinen. Neuvoja ilmaiseksi | T-paita eläkeläiselle" }));
    expect(PROMO.test(ilm)).toBe(false);
    expect(PROMO.test("Hauska t-paita, ilmainen toimitus")).toBe(true);
    expect(PROMO.test("Hauska t-paita -20 %")).toBe(true);
  });

  it("siistiTeksti ja puraNimi", () => {
    expect(siistiTeksti("Kiltti. Enimmäkseen")).toBe("Kiltti. Enimmäkseen");
    expect(siistiTeksti("Sää Päättää Teen Silti")).toBe("Sää päättää teen silti");
    expect(siistiTeksti("Suomi Finland")).toBe("Suomi Finland");
    expect(siistiTeksti("se oli tonnin seteli.")).toBe("Se oli tonnin seteli");
    expect(puraNimi("Kuka koski termostaattiin? | Huppari isälle")).toEqual({ teksti: "Kuka koski termostaattiin?", kohde: "isälle", personoitava: false });
    expect(puraNimi("Forssa – parempi kuin Helsinki – hauska t-paita Forssalaiselle").kohde).toBe("forssalaiselle");
  });
});

describe("syötteen kuvaukset", () => {
  it("500-1500 merkkiä, ei ajatusviivoja eikä toimitus-, hinta- tai palautusmainintoja", () => {
    const d = syoteKuvaus(tuote());
    expect(d.length).toBeGreaterThanOrEqual(500);
    expect(d.length).toBeLessThanOrEqual(1500);
    expect(d).not.toMatch(DASH);
    expect(d).not.toMatch(/ilmainen|€|palautus/i);
    expect(PROMO.test(d)).toBe(false);
    expect(d).toContain('painatuksena teksti "Tonnin seteli"');
    expect(d).toContain("Saatavilla koot S, M, L, XL ja 2XL.");
    expect(d).toContain("materiaali puuvilla");
  });

  it("pitkä kuvaus katkaistaan virkerajalta, ominaisuusosio jää pois", () => {
    const d = syoteKuvaus(tuote({ description: `${"Pehmeä ja lämmin paita arkeen. ".repeat(80)}Tuotteen ominaisuudet100 % puuvillaa – mukava` }));
    expect(d.length).toBeLessThanOrEqual(1500);
    expect(d).not.toMatch(/Tuotteen ominaisuudet/);
    expect(d).not.toMatch(DASH);
  });

  it("lyhyt lähdekuvaus täydennetään yli 500 merkkiin", () => {
    const d = syoteKuvaus(tuote({ description: "", category: "seinataulut", name: "Tonnin seteli | Juliste (poster)", variants: {} }));
    expect(d.length).toBeGreaterThanOrEqual(500);
  });
});

describe("syötteen attribuutit", () => {
  it("Google-kategoria-ID:t ovat syötteen polkutaulussa ja vastaavat taksonomiaa", () => {
    expect(GOOGLE_KATEGORIA_ID["t-paidat"]).toBe(212);
    expect(GOOGLE_KATEGORIA_ID.hupparit).toBe(212);
    expect(GOOGLE_KATEGORIA_ID.seinataulut).toBe(500044);
    for (const id of Object.values(GOOGLE_KATEGORIA_ID)) expect(GOOGLE_KATEGORIAT[id]).toBeTruthy();
    expect(GOOGLE_KATEGORIAT[212]).toBe("Apparel & Accessories > Clothing > Shirts & Tops");
  });

  it("product_type suomeksi hierarkiana", () => {
    expect(tuotetyyppi(tuote({ name: "Eläkeläinen | T-Paita" }))).toBe("Vaatteet > T-paidat > Hauskat t-paidat > Eläkeläiset");
    expect(tuotetyyppi(tuote({ category: "hupparit", name: "Oispa kaljaa | Huppari" }))).toBe("Vaatteet > Hupparit > Hauskat hupparit > Huumori");
  });

  it("materiaali vain tuotteen omasta kuvauksesta", () => {
    expect(materiaali(tuote())).toBe("puuvilla");
    expect(materiaali(tuote({ description: "50 % puuvillaa / 50 % polyesteriä, keskiraskas" }))).toBe("puuvilla/polyesteri");
    expect(materiaali(tuote({ description: "Lämmin unisex-huppari." }))).toBeNull();
  });

  it("sisallotaItem korvaa otsikon, kuvauksen, product_typen ja kategorian ja lisää materiaalin", () => {
    const item = `<item>
      <g:id>p1</g:id>
      <g:title>Tonnin Seteli | T-Paita</g:title>
      <g:description>vanha &amp; lyhyt</g:description>
      <g:google_product_category>Apparel &amp; Accessories &gt; Clothing &gt; Shirts &amp; Tops</g:google_product_category>
      <g:product_type>Vaatteet &gt; T-paidat</g:product_type>
    </item>`;
    const out = sisallotaItem(item, tuote());
    expect(out).toContain("<g:title>Hauska t-paita: Tonnin seteli, hauska lahja</g:title>");
    expect(out).toContain("<g:google_product_category>212</g:google_product_category>");
    expect(out).toContain("<g:product_type>Vaatteet &gt; T-paidat &gt; Hauskat t-paidat &gt; Huumori</g:product_type>");
    expect(out).toContain("<g:material>puuvilla</g:material>");
    expect(out.match(/<g:title>/g)).toHaveLength(1);
    expect(sisallotaItem(item, null)).toBe(item);
    expect(sisallotaSyote(`<rss>${item}</rss>`, new Map())).toBe(`<rss>${item}</rss>`);
  });
});

describe("validaattori: numeeriset kategoriat, emoji, mainosteksti, hinta", () => {
  const xml = (o: Record<string, string> = {}) => `<item>
${Object.entries({
  id: "a1",
  title: "Hauska t-paita isälle: En nuku, isänpäivälahja",
  description: "Hauska t-paita isälle. ".repeat(25).trim(),
  link: "https://huumorikauppa.fi/tuote/hauska-paita",
  image_link: "https://huumorikauppa.fi/api/img?u=x.jpg&amp;v=2",
  availability: "in_stock",
  price: "24.90 EUR",
  brand: "Huumorikauppa",
  condition: "new",
  google_product_category: "212",
  product_type: "Vaatteet &gt; T-paidat",
  identifier_exists: "no",
  gender: "unisex",
  age_group: "adult",
  color: "Musta",
  size: "M",
  ...o,
})
  .map(([k, v]) => `      <g:${k}>${v}</g:${k}>`)
  .join("\n")}
      <g:shipping><g:country>FI</g:country><g:price>6.90 EUR</g:price></g:shipping>
    </item>`;
  const tyypit = (x: string, opts = {}) => validateItem(parseFeed(x)[0], opts).map((o) => o.tyyppi);

  it("ID 212 puretaan vaatteeksi: vaatekentät vaaditaan", () => {
    expect(categoryPath("212")).toBe("Apparel & Accessories > Clothing > Shirts & Tops");
    expect(tyypit(xml())).toEqual([]);
    const ilman = xml().replace(/\s*<g:(color|size)>[^<]*<\/g:\1>/g, "");
    expect(tyypit(ilman)).toEqual(expect.arrayContaining(["color_puuttuu_vaate", "size_puuttuu_vaate"]));
  });

  it("tuntematon ID on virhe taksonomian kanssa, varoitus ilman", () => {
    const ids = new Map([["212", "Apparel & Accessories > Clothing > Shirts & Tops"]]);
    expect(tyypit(xml(), { taxonomyIds: ids })).toEqual([]);
    expect(tyypit(xml({ google_product_category: "5388" }), { taxonomyIds: ids })).toContain("google_product_category_id_tuntematon");
    expect(tyypit(xml({ google_product_category: "999999" }))).toContain("google_product_category_id_tuntematon");
  });

  it("emoji ja mainosteksti otsikossa ja kuvauksessa", () => {
    expect(tyypit(xml({ title: "I ❤️ My Boyfriend | Huppari" }))).toContain("title_emoji");
    expect(tyypit(xml({ title: "Hauska t-paita, ilmainen toimitus" }))).toContain("title_mainosteksti");
    expect(tyypit(xml({ title: "Hauska t-paita: Neuvoja ilmaiseksi" }))).not.toContain("title_mainosteksti");
    expect(tyypit(xml({ description: `${"Hauska paita. ".repeat(40)}Ilmainen toimitus yli 60 €.` }))).toContain("description_mainosteksti");
    expect(tyypit(xml({ description: "Lyhyt – kuvaus." }))).toEqual(expect.arrayContaining(["description_alle_500", "description_ajatusviiva"]));
  });

  it("hinta verrataan sivuston rajapinnan hintaan", () => {
    expect(tyypit(xml(), { apiHinnat: new Map([["hauska-paita", 24.9]]) })).toEqual([]);
    expect(tyypit(xml(), { apiHinnat: new Map([["hauska-paita", 26.9]]) })).toContain("price_ei_vastaa_sivustoa");
    expect(tyypit(xml(), { apiHinnat: new Map() })).toContain("price_ei_rajapinnassa");
  });
});
