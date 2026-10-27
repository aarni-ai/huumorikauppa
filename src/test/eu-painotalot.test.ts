import { describe, it, expect } from "vitest";
import {
  EU_MAAT, onEU, painotalonMaa, valitseSaanto, valitsePainotalo, valitseBlueprint, tuotteenKoko, variantinOsat,
  yhdistaVariantit, uudetPrintAreat, uusiTuoteRunko, suomenToimitus, uudetDbVariantit, SIIRTOSAANNOT,
  tekstitasot, korvaaTekstitasot, pudotaPaikat, tekstitasonAvain, TEKSTITASO_FONTIT,
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
  it("t-paita siirtyy Monster Digitalilta ja Printify Choicelta", () => {
    expect(valitseSaanto("t-paidat", "Monster Digital")?.painotalo).toBe("OPT OnDemand");
    expect(valitseSaanto("t-paidat", "Printify Choice")?.blueprint).toMatchObject({ sama: true });
    expect(valitseSaanto("hupparit", "Printify Choice")).toMatchObject({ painotalo: "Textildruck Europa", blueprint: { sama: true }, ohitaPaikat: ["neck"] });
    expect(valitseSaanto("t-paidat", "SPOKE Custom Products")?.blueprint.sisaltaa).toEqual(["ceramic mug", "(eu)"]);
    expect(valitseSaanto("mukit", "Harrier")?.painotalo).toBe("Textildruck Europa");
    expect(valitseSaanto("t-paidat", "SwiftPOD")).toBeNull();
    expect(valitseSaanto("mukit", "Anything")?.painotalo).toBe("OPT OnDemand");
    expect(valitseSaanto("hupparit", "Monster Digital")).toBeNull();
    expect(SIIRTOSAANNOT.map((s) => s.kategoria)).toEqual(["mukit", "mukit", "t-paidat", "t-paidat", "t-paidat", "hupparit", "bodyt", "koristeet", "peitot", "seinataulut"]);
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
  it("kaksi samannimistä väriä (Gildan 18500 Ash): käytössä oleva saa kohteen, sama variant-id ensin", () => {
    const vanhat2 = [
      { id: 33345, title: "Ash / S", price: 4990, is_enabled: false },
      { id: 32870, title: "Ash / S", price: 4990, is_enabled: true },
    ];
    const r = yhdistaVariantit(vanhat2, [{ id: 32870, title: "Ash / S", options: { color: "Ash", size: "S" } }]);
    expect(r.yhdistetyt.map((y) => [y.vanhaId, y.uusiId, y.is_enabled])).toEqual([[32870, 32870, true]]);
    expect(r.pudotetut).toEqual([{ vanhaId: 33345, title: "Ash / S", is_enabled: false }]);
    // Eri blueprint (eri id:t): käytössä oleva nimellä ennen pois käytöstä olevaa.
    const r2 = yhdistaVariantit(vanhat2, [{ id: 900, title: "Ash / S", options: { color: "Ash", size: "S" } }]);
    expect(r2.yhdistetyt.map((y) => [y.vanhaId, y.uusiId])).toEqual([[32870, 900]]);
  });
  it("vauvakoot, Babybugz-värit ja mukin Glossy", () => {
    expect(variantinOsat({ title: "Heather / 6M" })).toEqual(variantinOsat({ options: { size: "3-6M", color: "Heather Grey Melange" } }));
    expect(variantinOsat({ title: "Pink / 18M" })).toEqual(variantinOsat({ options: { size: "12-18M", color: "Powder Pink" } }));
    expect(variantinOsat({ title: "11oz / Black" })).toEqual(variantinOsat({ title: "11oz / Black / Glossy" }));
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

describe("tekstitasot kuviksi ja painopaikkojen pudotus (27.10.2026)", () => {
  const teksti = (vari: string, w: number, h: number, scale = 0.9) => ({
    id: `t-${vari}-${w}`, layerType: "text", input_text: "Super\näiskä", font_family: "Luckiest Guy", font_color: vari,
    font_weight: 400, font_style: "normal", text_align: "center", x: 0.5, y: 0.33, scale, angle: 0, width: w, height: h,
  });
  const kuva = { id: "kuva1", layerType: "image", x: 0.5, y: 0.6, scale: 0.5, angle: 0 };
  const neck = { id: "neck1", layerType: "image", x: 0.5, y: 0.5, scale: 1, angle: 0 };
  const alueet = [
    { variant_ids: [1, 2], placeholders: [{ position: "front", images: [teksti("#ff9999", 579.9, 324.6), kuva] }, { position: "neck", images: [neck] }] },
    // Printify jättää kopioidun tason mitoiksi 1 x 1: mitat saman tekstin toisesta tasosta.
    { variant_ids: [3], placeholders: [{ position: "front", images: [teksti("#DC3131", 1, 1, 0.84)] }, { position: "neck", images: [neck] }] },
  ];

  it("yksilöi tekstitasot värin mukaan ja täyttää puuttuvat mitat", () => {
    const t = tekstitasot(alueet);
    expect(t).toHaveLength(2);
    expect(t.map((x) => x.vari)).toEqual(["#ff9999", "#DC3131"]);
    expect(t[1]).toMatchObject({ leveys: 579.9, korkeus: 324.6, scaleMax: 0.84, paikat: ["front"], fontti: "Luckiest Guy" });
    expect(TEKSTITASO_FONTIT[t[0].fontti]).toBe("LuckiestGuy.ttf");
  });

  it("heittää, jos tekstitason mittoja ei tiedetä", () => {
    expect(() => tekstitasot([{ variant_ids: [1], placeholders: [{ position: "front", images: [teksti("#000000", 1, 1)] }] }])).toThrow(/mittoja/);
  });

  it("korvaa tekstitasot kuvilla samaan kohtaan ja säilyttää tasojen järjestyksen", () => {
    const idt = new Map(tekstitasot(alueet).map((t, i) => [t.avain, `upload-${i}`]));
    const uusi = korvaaTekstitasot(alueet, idt);
    expect(uusi[0].placeholders[0].images).toEqual([{ id: "upload-0", x: 0.5, y: 0.33, scale: 0.9, angle: 0, layerType: "image" }, kuva]);
    expect(uusi[1].placeholders[0].images[0]).toMatchObject({ id: "upload-1", scale: 0.84 });
    expect(() => korvaaTekstitasot(alueet, new Map())).toThrow(/ei ole kuvaa/);
    expect(tekstitasonAvain(alueet[1].placeholders[0].images[0])).toContain("#dc3131");
  });

  it("pudottaa painopaikan, ja uudetPrintAreat siirtää loput", () => {
    const ilman = pudotaPaikat(alueet, ["neck"]);
    expect(ilman.every((a) => a.placeholders.every((ph) => ph.position !== "neck"))).toBe(true);
    const idt = new Map(tekstitasot(ilman).map((t, i) => [t.avain, `upload-${i}`]));
    const yhdistetyt = [{ vanhaId: 1, uusiId: 11 }, { vanhaId: 2, uusiId: 12 }, { vanhaId: 3, uusiId: 13 }];
    const katalogi = [11, 12, 13].map((id) => ({ id, placeholders: [{ position: "front" }, { position: "back" }] }));
    const { print_areas, pudotetutPaikat } = uudetPrintAreat(korvaaTekstitasot(ilman, idt), yhdistetyt as never, katalogi);
    expect(pudotetutPaikat).toEqual([]);
    expect(print_areas.map((a) => a.variant_ids)).toEqual([[11, 12], [13]]);
    expect(print_areas[0].placeholders[0].images.map((k) => k.id)).toEqual(["upload-0", "kuva1"]);
  });
});
