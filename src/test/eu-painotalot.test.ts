import { describe, it, expect } from "vitest";
import {
  EU_MAAT, onEU, painotalonMaa, valitseSaanto, valitsePainotalo, valitseBlueprint, tuotteenKoko, variantinOsat,
  yhdistaVariantit, uudetPrintAreat, uusiTuoteRunko, suomenToimitus, uudetDbVariantit, SIIRTOSAANNOT,
} from "../../scripts/lib/eu-painotalot.mjs";

const painotalot = [
  { id: 29, title: "Monster Digital" },
  { id: 30, title: "OPT OnDemand" },
  { id: 26, title: "Textildruck Europa" },
  { id: 255, title: "Harrier" },
  { id: 6, title: "MWW On Demand" },
  { id: 7, title: "Jondo" },
  { id: 8, title: "Jondo Europe" },
  { id: 9, title: "Print Geek" },
  { id: 10, title: "Print Geek US" },
];

const mukiBlueprintit = [
  { id: 1, title: "Ceramic Mug (EU)", brand: "Generic brand", model: "11oz" },
  { id: 2, title: "Ceramic Mug 15oz (EU)", brand: "Generic brand", model: "15oz" },
  { id: 3, title: "Accent Coffee Mug", brand: "Generic", model: "11oz" },
];

describe("EU-maat", () => {
  it("27 jäsenvaltiota, ei UK/US/CH/NO", () => {
    expect(new Set([...EU_MAAT].filter((m) => m !== "EL")).size).toBe(27);
    expect(onEU("de")).toBe(true);
    expect(onEU("CZ")).toBe(true);
    for (const m of ["US", "GB", "UK", "CH", "NO", "CN", "", null]) expect(onEU(m)).toBe(false);
  });
  it("maa painotalon location-kentästä", () => {
    expect(painotalonMaa({ location: { country: "es" } })).toBe("ES");
    expect(painotalonMaa({})).toBeNull();
  });
});

describe("säännöt ja nimiresoluutio", () => {
  it("t-paita siirtyy vain Monster Digitalilta", () => {
    expect(valitseSaanto("t-paidat", "Monster Digital")?.painotalo).toBe("OPT OnDemand");
    expect(valitseSaanto("t-paidat", "SwiftPOD")).toBeNull();
    expect(valitseSaanto("mukit", "Anything")?.painotalo).toBe("OPT OnDemand");
    expect(valitseSaanto("hupparit", "Monster Digital")).toBeNull();
    expect(SIIRTOSAANNOT.map((s) => s.kategoria)).toEqual(["mukit", "t-paidat", "bodyt", "koristeet", "peitot", "seinataulut"]);
  });
  it("painotalo: osamerkkijono, täsmällinen nimi ratkaisee moniselitteisyyden", () => {
    expect(valitsePainotalo(painotalot, "opt ondemand")).toMatchObject({ ok: true, painotalo: { id: 30 } });
    expect(valitsePainotalo(painotalot, "Jondo")).toMatchObject({ ok: true, painotalo: { id: 7 } });
    expect(valitsePainotalo(painotalot, "Print")).toMatchObject({ ok: false });
    expect(valitsePainotalo(painotalot, "Ei ole")).toMatchObject({ ok: false, syy: expect.stringContaining("ei löydy") });
  });
  it("mukiblueprint: (EU), vanhan koon mukaan, muuten 11oz", () => {
    const saanto = valitseSaanto("mukit", "")!;
    expect(valitseBlueprint(mukiBlueprintit, saanto, { koko: null })).toMatchObject({ ok: true, blueprint: { id: 1 } });
    expect(valitseBlueprint(mukiBlueprintit, saanto, { koko: "15oz" })).toMatchObject({ ok: true, blueprint: { id: 2 } });
    expect(tuotteenKoko([{ title: "15 oz", is_enabled: true }])).toBe("15oz");
  });
  it("t-paita: Gildan 64000 brand+model-kentistä", () => {
    const lista = [
      { id: 145, title: "Unisex Softstyle T-Shirt", brand: "Gildan", model: "64000" },
      { id: 6, title: "Unisex Heavy Cotton Tee", brand: "Gildan", model: "5000" },
    ];
    expect(valitseBlueprint(lista, valitseSaanto("t-paidat", "Monster Digital")!)).toMatchObject({ ok: true, blueprint: { id: 145 } });
  });
  it("moniselitteinen tai puuttuva blueprint ohitetaan syyn kanssa", () => {
    const saanto = valitseSaanto("koristeet", "")!;
    const kaksi = [{ id: 1, title: "Ceramic Ornament" }, { id: 2, title: "Ceramic Ornament, 4 Shapes" }];
    const r = valitseBlueprint(kaksi, saanto);
    expect(r.ok).toBe(false);
    expect(r.syy).toContain("ei yksiselitteinen");
    expect(valitseBlueprint([], saanto)).toMatchObject({ ok: false, syy: expect.stringContaining("ei löydy") });
  });
  it("sama blueprint ensin (peitot, seinätaulut)", () => {
    const lista = [{ id: 522, title: "Velveteen Plush Blanket" }, { id: 600, title: "Sherpa Fleece Blanket" }];
    expect(valitseBlueprint(lista, valitseSaanto("peitot", "")!, { blueprint_id: 600 })).toMatchObject({ ok: true, blueprint: { id: 600 } });
    expect(valitseBlueprint(lista, valitseSaanto("peitot", "")!, { blueprint_id: 1, blueprintTitle: "velveteen plush blanket" }))
      .toMatchObject({ ok: true, blueprint: { id: 522 } });
    expect(valitseBlueprint(lista, valitseSaanto("peitot", "")!, { blueprint_id: 1 }).ok).toBe(false);
    expect(valitseBlueprint([{ id: 282, title: "Matte Vertical Posters" }], valitseSaanto("seinataulut", "")!, { blueprint_id: 99 }).ok).toBe(false);
  });
});

describe("variantit", () => {
  const uudet = [
    { id: 101, title: "Black / M", options: { color: "Black", size: "M" }, placeholders: [{ position: "front" }, { position: "back" }] },
    { id: 102, title: "Black / L", options: { color: "Black", size: "L" }, placeholders: [{ position: "front" }, { position: "back" }] },
    { id: 103, title: "White / M", options: { color: "White", size: "M" }, placeholders: [{ position: "front" }] },
  ];
  const vanhat = [
    { id: 1, title: "Black / M", price: 3490, is_enabled: true },
    { id: 2, title: "black / l", price: 3590, is_enabled: true },
    { id: 3, title: "Sport Grey / M", price: 3490, is_enabled: true },
    { id: 4, title: "White / M", price: 3490, is_enabled: false },
  ];
  it("osat options-objektista tai nimestä", () => {
    expect(variantinOsat({ options: { size: "M", color: "Black" } })).toEqual(["black", "m"]);
    expect(variantinOsat({ title: " M / Black " })).toEqual(["black", "m"]);
    expect(variantinOsat({ title: "White / NB (0-3M)" })).toEqual(variantinOsat({ options: { color: "White", size: "0-3M" } }));
    expect(variantinOsat({ title: "Heather Gray / XXL" })).toEqual(["2xl", "heather grey"]);
  });
  it("yhdistää värin ja koon mukaan, säilyttää hinnan ja is_enabled", () => {
    const { yhdistetyt, pudotetut } = yhdistaVariantit(vanhat, uudet);
    expect(yhdistetyt.map((y) => [y.vanhaId, y.uusiId, y.price, y.is_enabled])).toEqual([[1, 101, 3490, true], [2, 102, 3590, true], [4, 103, 3490, false]]);
    expect(pudotetut).toEqual([{ vanhaId: 3, title: "Sport Grey / M", is_enabled: true }]);
  });
  it("ainoa variantti yhdistetään vaikka nimi eroaa", () => {
    const r = yhdistaVariantit([{ id: 5, title: "Round", price: 2490, is_enabled: true }], [{ id: 77, title: "Circle", options: { shape: "Circle" } }]);
    expect(r.yhdistetyt).toMatchObject([{ vanhaId: 5, uusiId: 77, price: 2490, ainoa: true }]);
    expect(r.pudotetut).toEqual([]);
  });

  it("print_areas: samat kuvat ja koordinaatit uusille varianteille, puuttuva paikka pudotetaan", () => {
    const { yhdistetyt } = yhdistaVariantit(vanhat, uudet);
    const kuva = { id: "img1", name: "x.png", type: "image/png", height: 100, width: 100, x: 0.5, y: 0.42, scale: 0.87, angle: 0 };
    const vanhatAlueet = [
      { variant_ids: [1, 2, 3], placeholders: [{ position: "front", images: [kuva] }, { position: "back", images: [{ ...kuva, id: "img2", angle: 5 }] }] },
      { variant_ids: [4], placeholders: [{ position: "front", images: [kuva] }, { position: "back", images: [{ ...kuva, id: "img2" }] }] },
    ];
    const r = uudetPrintAreat(vanhatAlueet, yhdistetyt, uudet);
    expect(r.print_areas).toEqual([
      { variant_ids: [101, 102], placeholders: [
        { position: "front", images: [{ id: "img1", x: 0.5, y: 0.42, scale: 0.87, angle: 0 }] },
        { position: "back", images: [{ id: "img2", x: 0.5, y: 0.42, scale: 0.87, angle: 5 }] },
      ] },
      { variant_ids: [103], placeholders: [{ position: "front", images: [{ id: "img1", x: 0.5, y: 0.42, scale: 0.87, angle: 0 }] }] },
    ]);
    expect(r.pudotetutPaikat).toEqual(["back"]);

    const runko = uusiTuoteRunko({ title: "T", description: "D", tags: ["a"] }, 145, 30, yhdistetyt, r.print_areas);
    expect(runko).toMatchObject({ title: "T", description: "D", tags: ["a"], blueprint_id: 145, print_provider_id: 30 });
    expect(runko.variants).toEqual([{ id: 101, price: 3490, is_enabled: true }, { id: 102, price: 3590, is_enabled: true }, { id: 103, price: 3490, is_enabled: false }]);
  });
});

describe("kanta", () => {
  it("Suomen toimituskulu, varalla REST_OF_THE_WORLD", () => {
    expect(suomenToimitus({ profiles: [{ countries: ["DE"], first_item: { cost: 300 } }, { countries: ["FI", "SE"], first_item: { cost: 450 } }] })).toBe(450);
    expect(suomenToimitus({ profiles: [{ countries: ["REST_OF_THE_WORLD"], first_item: { cost: 900 } }] })).toBe(900);
    expect(suomenToimitus(null)).toBeNull();
  });
  it("variants: uusi variant_map ja kulut, muut vanhat avaimet säilyvät", () => {
    const vanhat = { variant_map: { "Musta|M": 1 }, colors: ["Musta", "Harmaa"], costs: { "1": 1000 }, shipping_cents: 900, oma: "x" };
    const rakennettu = { variants: { variant_map: { "Musta|M": 101 }, colors: ["Musta"], sizes: ["M"] } };
    const uusi = { variants: [{ id: 101, cost: 1100, is_enabled: true }, { id: 102, cost: 1100, is_enabled: false }] };
    expect(uudetDbVariantit(vanhat, rakennettu, uusi, 450)).toEqual({
      oma: "x", variant_map: { "Musta|M": 101 }, colors: ["Musta"], sizes: ["M"], costs: { "101": 1100 }, shipping_cents: 450,
    });
  });
});
