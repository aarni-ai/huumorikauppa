import type { Product } from "@/types/product";

export interface SituationGift {
  slug: string;
  h1: string;
  emoji: string;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  keywords: string[]; // matched against name + description (case-insensitive)
  categories?: string[]; // optional category slugs to include as fallback
}

/**
 * Long-tail "tilanne"-lahjasivut SEO-strategia varten.
 * URL-pohja: /lahjat/:slug
 */
export const situationGifts: SituationGift[] = [
  {
    slug: "50-vuotiaalle-miehelle",
    h1: "Hauskat lahjat 50-vuotiaalle miehelle",
    emoji: "🎂",
    seoTitle: "Hauskat lahjat 50-vuotiaalle miehelle – Ideat | Huumorikauppa.fi",
    seoDescription: "50-vuotiaan miehen hauska syntymäpäivälahja: paidat, mukit ja muut nauruhoidot. Nopea toimitus 🎁",
    intro: "Etsitkö täydellistä lahjaa 50-vuotiaalle miehelle? Hän on kokenut elämänsä parhaat hetket – ja muutaman vähemmän hyvänkin – joten lahjan kannattaa olla muistettava. Setähuumoripaidat, ammattihuumorituotteet ja eläke-aiheiset tuotteet ovat suosituimpia.",
    keywords: ["mies", "isä", "iskä", "setä", "kalamies", "kalastus", "eläke", "museo", "amatimies", "50"],
    categories: ["t-paidat", "hupparit", "mukit"],
  },
  {
    slug: "60-vuotiaalle-miehelle",
    h1: "Hauskat lahjat 60-vuotiaalle miehelle",
    emoji: "🥳",
    seoTitle: "Hauskat lahjat 60-vuotiaalle miehelle – Synttäri-ideat | Huumorikauppa.fi",
    seoDescription: "60-vuotiaan synttärilahja huumorilla – paidat, mukit ja eläkkeelle valmistautumistuotteet 🎁",
    intro: "60 vuotta täyttävälle miehelle hauska eläkeläishuumori on aina osumatarkka valinta. Kokosimme parhaat synttärilahjat 60-vuotiaalle miehelle joka rakastaa nauraa.",
    keywords: ["mies", "isä", "setä", "eläke", "elake", "60", "kalastus"],
    categories: ["t-paidat", "hupparit", "mukit", "peitot"],
  },
  {
    slug: "40-vuotiaalle-miehelle",
    h1: "Hauskat lahjat 40-vuotiaalle miehelle",
    emoji: "🎯",
    seoTitle: "Hauskat lahjat 40-vuotiaalle miehelle | Huumorikauppa.fi",
    seoDescription: "40-vuotiaalle miehelle hauska syntymäpäivälahja – setähuumoria, ammattihuumoria, harrastuspaitoja.",
    intro: "40 on uusi 30 – mutta selkä alkaa muistuttaa toisin. Hauska paita tai muki on aina hyvä lahja 40-vuotiaalle miehelle.",
    keywords: ["mies", "isä", "kalastus", "harrastus", "ammatti", "40", "setä"],
    categories: ["t-paidat", "hupparit", "mukit"],
  },
  {
    slug: "30-vuotiaalle-miehelle",
    h1: "Hauskat lahjat 30-vuotiaalle miehelle",
    emoji: "🚀",
    seoTitle: "Hauskat lahjat 30-vuotiaalle miehelle – Meemi & sarkasmi | Huumorikauppa.fi",
    seoDescription: "30-vuotiaalle miehelle hauskat meemipaidat, sarkasmi-mukit ja kaverille kelpaavat lahjat 🎁",
    intro: "30 vuotta täyttävä mies arvostaa internet-huumoria, sarkasmia ja itseironiaa. Kokosimme suosituimmat nauruhuonepaidat 30-vuotiaalle.",
    keywords: ["mies", "kaveri", "meemi", "sarkasmi", "30", "harrastus"],
    categories: ["t-paidat", "hupparit"],
  },
  {
    slug: "50-vuotiaalle-naiselle",
    h1: "Hauskat lahjat 50-vuotiaalle naiselle",
    emoji: "💃",
    seoTitle: "Hauskat lahjat 50-vuotiaalle naiselle | Huumorikauppa.fi",
    seoDescription: "50-vuotiaan naisen synttärilahja huumorilla – paidat, mukit ja persoonalliset tuotteet 🌸",
    intro: "50-vuotiaalle naiselle hauska lahja on aina mieleenpainuva. Persoonalliset paidat ja mukit naurattavat ja jäävät käyttöön.",
    keywords: ["nainen", "äiti", "aiti", "mummi", "tyttö", "ystävä", "50"],
    categories: ["t-paidat", "mukit", "hupparit"],
  },
  {
    slug: "60-vuotiaalle-naiselle",
    h1: "Hauskat lahjat 60-vuotiaalle naiselle",
    emoji: "👑",
    seoTitle: "Hauskat lahjat 60-vuotiaalle naiselle | Huumorikauppa.fi",
    seoDescription: "60-vuotiaalle naiselle hauska eläkkeelle valmistautumislahja, mummo-paitoja ja persoonallisia mukeja.",
    intro: "60 vuotta täyttävälle naiselle hauska lahja on raikas vaihtoehto. Mummohuumori, eläkkeelle valmistautuminen ja kotoilun ilot ovat suosittuja teemoja.",
    keywords: ["nainen", "äiti", "mummi", "mummo", "eläke", "60"],
    categories: ["t-paidat", "mukit", "peitot"],
  },
  {
    slug: "polttareihin",
    h1: "Hauskat lahjat polttareihin",
    emoji: "🎉",
    seoTitle: "Polttarilahjat – Hauskat ideat polttareihin | Huumorikauppa.fi",
    seoDescription: "Polttarilahjat huumorilla – t-paidat, mukit ja koko porukan ilonpitoon sopivat tuotteet 🎉",
    intro: "Polttareihin tarvitaan jotain hauskaa, persoonallista ja hieman piikikästä. Meidän polttaripaidat ja -mukit takaavat naurut illan ratoksi.",
    keywords: ["polttari", "naimisiin", "mies", "nainen", "kaveri", "ystävä"],
    categories: ["t-paidat", "mukit"],
  },
  {
    slug: "tyokaverille",
    h1: "Hauskat lahjat työkaverille",
    emoji: "💼",
    seoTitle: "Lahja työkaverille – Hauskat ideat toimistoon | Huumorikauppa.fi",
    seoDescription: "Hauska lahja työkaverille: mukit, paidat ja toimistohuumori. Sopii pikkujouluihin ja syntymäpäivään 🎁",
    intro: "Työkaverille lahjan ostaminen voi olla hankalaa – meidän kokoelmastamme löydät turvallisen, hauskan ja persoonallisen lahjan, joka ei loukkaa ketään mutta naurattaa kaikkia.",
    keywords: ["työkaveri", "kollega", "toimisto", "ammatti", "kahvi", "pomo"],
    categories: ["mukit", "t-paidat"],
  },
  {
    slug: "opettajalle",
    h1: "Hauskat lahjat opettajalle",
    emoji: "🍎",
    seoTitle: "Hauskat lahjat opettajalle – Kiitoslahja ideat | Huumorikauppa.fi",
    seoDescription: "Opettajan kiitoslahja huumorilla – mukit, paidat ja persoonalliset tuotteet 🍎",
    intro: "Opettajan kiitoslahjan tulee olla persoonallinen ja muistettava. Hauska muki tai paita on aina hyvä valinta lukukauden päättyessä.",
    keywords: ["opettaja", "ope", "koulu", "kahvi", "ammatti"],
    categories: ["mukit", "t-paidat"],
  },
  {
    slug: "hoitajalle",
    h1: "Hauskat lahjat hoitajalle",
    emoji: "🩺",
    seoTitle: "Hauskat lahjat hoitajalle ja sairaanhoitajalle | Huumorikauppa.fi",
    seoDescription: "Hoitajan kiitoslahja huumorilla – paidat ja mukit hoitajille ja sairaanhoitajille 🩺",
    intro: "Hoitajat ansaitsevat naurua. Kokosimme parhaat hauskat tuotteet, joilla voit kiittää sairaanhoitajaa, lähihoitajaa tai terveydenhoitajaa.",
    keywords: ["hoitaja", "sairaanhoitaja", "lähihoitaja", "ammatti", "sairaala"],
    categories: ["t-paidat", "mukit"],
  },
  {
    slug: "rakennusmiehelle",
    h1: "Hauskat lahjat rakennusmiehelle",
    emoji: "🔨",
    seoTitle: "Hauskat lahjat rakennusmiehelle ja remppamiehelle | Huumorikauppa.fi",
    seoDescription: "Rakennusmiehelle ja remppamiehelle hauskat ammattihuumoripaidat ja -mukit 🔨",
    intro: "Rakennusmies ja remppamies arvostaa rehellistä huumoria. Meiltä löydät ammattikuntahuumoria, joka sopii sekä työpaikalle että vapaa-ajalle.",
    keywords: ["rakennus", "remppa", "kirvesmies", "putki", "sähkö", "ammatti", "työ"],
    categories: ["t-paidat", "hupparit", "mukit"],
  },
  {
    slug: "kalastajalle",
    h1: "Hauskat lahjat kalastajalle",
    emoji: "🎣",
    seoTitle: "Hauskat lahjat kalastajalle – Kalapaidat ja mukit | Huumorikauppa.fi",
    seoDescription: "Kalastajan unelmalahja: hauskat kalapaidat, mukit ja kaikki kalastusaiheiset tuotteet 🎣",
    intro: "Kalastaja ei koskaan saa liikaa kalavehkeitä – paitsi kun ei saa kalaa. Lahja kalastajalle: hauskat kalapaidat ja mukit täydentävät jokaisen reissun.",
    keywords: ["kala", "kalastus", "kalamies", "vene", "järvi"],
    categories: ["t-paidat", "hupparit", "mukit"],
  },
  {
    slug: "metsastajalle",
    h1: "Hauskat lahjat metsästäjälle",
    emoji: "🦌",
    seoTitle: "Hauskat lahjat metsästäjälle | Huumorikauppa.fi",
    seoDescription: "Metsästäjälle huumoripaidat ja -mukit – täydellinen lahja erämieskaverille 🦌",
    intro: "Metsästäjä viihtyy hiljaisuudessa, mutta vapaa-ajalla nauraa kovaa. Hauskat metsästyspaidat ja mukit ilahduttavat jokaista erämiestä.",
    keywords: ["metsä", "metsästys", "erä", "hirvi", "luonto"],
    categories: ["t-paidat", "hupparit", "mukit"],
  },
  {
    slug: "kahvinystavalle",
    h1: "Hauskat lahjat kahvinystävälle",
    emoji: "☕",
    seoTitle: "Hauskat lahjat kahvinystävälle – Mukit ja paidat | Huumorikauppa.fi",
    seoDescription: "Kahvinystävälle hauskat huumorimukit ja paidat. Aamut alkavat hymyssä 😃",
    intro: "Kahvi on suomalaisen polttoaine. Kokosimme parhaat hauskat kahvimukit ja kahviaiheiset paidat lahjaksi kahvinystävälle.",
    keywords: ["kahvi", "muki", "aamu"],
    categories: ["mukit", "t-paidat"],
  },
  {
    slug: "isoäidille",
    h1: "Hauskat lahjat isoäidille",
    emoji: "👵",
    seoTitle: "Hauskat lahjat isoäidille ja mummolle | Huumorikauppa.fi",
    seoDescription: "Isoäidin lahja huumorilla – mummopaidat, mukit ja peitot 👵",
    intro: "Isoäiti on perheen sydän – ja hauska lahja saa hänet hymyilemään päiväkausia. Mummohuumori, peitot ja personoidut mukit ovat suosittuja valintoja.",
    keywords: ["mummi", "mummo", "isoäiti", "isoaiti", "äiti", "lapsenlapsi"],
    categories: ["t-paidat", "mukit", "peitot"],
  },
  {
    slug: "isoisalle",
    h1: "Hauskat lahjat isoisälle",
    emoji: "👴",
    seoTitle: "Hauskat lahjat isoisälle ja vaarille | Huumorikauppa.fi",
    seoDescription: "Isoisän tai vaarin syntymäpäivälahja huumorilla – paidat, mukit ja peitot 👴",
    intro: "Vaarille hauska lahja on aina osuva valinta. Setähuumori, kalastus, eläke ja peitot sohvalle – kaikki suosittuja.",
    keywords: ["vaari", "ukki", "isoisä", "isoisa", "isä", "setä", "eläke"],
    categories: ["t-paidat", "mukit", "peitot"],
  },
  {
    slug: "syntymapaivasankarille",
    h1: "Hauskat lahjat syntymäpäiväsankarille",
    emoji: "🎂",
    seoTitle: "Synttärilahjat huumorilla – Hauskat lahjat sankarille | Huumorikauppa.fi",
    seoDescription: "Syntymäpäivälahjat huumorilla – hauskat paidat, mukit ja koko juhliin sopivat tuotteet 🎂",
    intro: "Syntymäpäiväsankari ansaitsee lahjan, jolla on persoonaa. Hauskat paidat, mukit ja peitot ovat aina suosittuja.",
    keywords: ["synttäri", "syntymäpäivä", "synttarit", "juhla"],
    categories: ["t-paidat", "mukit"],
  },
  {
    slug: "muutoiset",
    h1: "Hauskat lahjat muuttajalle ja tupaantuliaisiin",
    emoji: "🏠",
    seoTitle: "Hauskat tupaantuliaislahjat – Muuttajalle | Huumorikauppa.fi",
    seoDescription: "Tupaantuliaislahja huumorilla – mukit, peitot ja seinätaulut uuteen kotiin 🏠",
    intro: "Tupaantuliaisiin sopii lahja, jolla on persoonaa. Hauskat mukit, peitot ja seinätaulut tekevät uudesta kodista oman näköisen.",
    keywords: ["tupaantuliaiset", "muutto", "koti", "sisustus"],
    categories: ["mukit", "peitot", "seinataulut", "koristeet"],
  },
  {
    slug: "ystavalle",
    h1: "Hauskat lahjat ystävälle",
    emoji: "🤝",
    seoTitle: "Hauskat lahjat ystävälle – Lahjaideat parhaalle kaverille | Huumorikauppa.fi",
    seoDescription: "Ystävälle hauska lahja – kaverin syntymäpäivään, ystävänpäivään tai vain noin vain 🤝",
    intro: "Parhaalle ystävälle hauska, persoonallinen lahja on aina hyvä veto. Sisäpiirin meemit ja sarkasmi toimivat erityisesti.",
    keywords: ["ystävä", "kaveri", "bff", "paras"],
    categories: ["t-paidat", "mukit"],
  },
  {
    slug: "siskolle",
    h1: "Hauskat lahjat siskolle",
    emoji: "👯",
    seoTitle: "Hauskat lahjat siskolle – Synttärilahjat | Huumorikauppa.fi",
    seoDescription: "Siskon syntymäpäivälahja huumorilla – persoonalliset paidat, mukit ja peitot 👯",
    intro: "Siskolle annettu lahja on rakkaudenosoitus – hauska sellainen vielä parempi. Sisäpiirin huumori, mukit ja paidat suosituimpia.",
    keywords: ["sisko", "sisar", "nainen", "tyttö"],
    categories: ["t-paidat", "mukit"],
  },
  {
    slug: "veljelle",
    h1: "Hauskat lahjat veljelle",
    emoji: "🤘",
    seoTitle: "Hauskat lahjat veljelle – Synttärilahjat | Huumorikauppa.fi",
    seoDescription: "Veljen syntymäpäivälahja huumorilla – paidat, hupparit ja mukit 🤘",
    intro: "Veljelle hauska lahja on takuuvarma valinta. Sisäpiirin meemit, harrastuspaidat ja sarkasmimukit ovat suosituimpia.",
    keywords: ["veli", "broidi", "mies", "kaveri"],
    categories: ["t-paidat", "hupparit", "mukit"],
  },
  {
    slug: "vauvalle",
    h1: "Hauskat lahjat vauvalle ja vauvaperheelle",
    emoji: "👶",
    seoTitle: "Hauskat lahjat vauvalle ja vauvaperheelle | Huumorikauppa.fi",
    seoDescription: "Vauvalahjat huumorilla – hauskat bodyt ja vauvaperheen paidat 👶",
    intro: "Vauvalahjat saa olla hauskoja! Meidän bodit ja vauvaperheen paidat naurattavat sekä vanhempia että vieraita.",
    keywords: ["vauva", "lapsi", "äiti", "isä", "perhe"],
    categories: ["bodyt", "t-paidat"],
  },
  {
    slug: "joululahjaksi-miehelle",
    h1: "Hauskat joululahjat miehelle",
    emoji: "🎄",
    seoTitle: "Hauskat joululahjat miehelle – Joulun lahjaideat | Huumorikauppa.fi",
    seoDescription: "Joululahja miehelle huumorilla – paidat, hupparit ja mukit kuusen alle 🎄",
    intro: "Mihin laitat huumorilahjan? Tietysti kuusen alle. Joululahjat miehelle huumorilla – paidat, hupparit ja mukit.",
    keywords: ["mies", "isä", "joulu", "kalastus", "harrastus"],
    categories: ["t-paidat", "hupparit", "mukit"],
  },
  {
    slug: "joululahjaksi-naiselle",
    h1: "Hauskat joululahjat naiselle",
    emoji: "🎁",
    seoTitle: "Hauskat joululahjat naiselle – Joulun lahjaideat | Huumorikauppa.fi",
    seoDescription: "Joululahja naiselle huumorilla – paidat, mukit ja persoonalliset tuotteet 🎁",
    intro: "Naiselle joululahja huumorilla yllättää aina iloisesti. Hauskat mukit ja paidat sopivat sekä äidille, siskolle että ystävälle.",
    keywords: ["nainen", "äiti", "joulu", "ystävä", "sisko"],
    categories: ["t-paidat", "mukit"],
  },
];

export function findSituation(slug: string): SituationGift | undefined {
  return situationGifts.find(s => s.slug === slug);
}

/**
 * Filter products by situation keywords (matching name + description),
 * with a category fallback so the page is never empty.
 */
export function filterProductsForSituation(
  products: Product[],
  situation: SituationGift,
): Product[] {
  const kwLower = situation.keywords.map(k => k.toLowerCase());
  const keywordMatches = products.filter(p => {
    const t = (p.name + " " + p.description).toLowerCase();
    return kwLower.some(k => t.includes(k));
  });

  if (keywordMatches.length >= 8) return keywordMatches;

  const cats = new Set(situation.categories || []);
  const categoryMatches = products.filter(p => cats.has(p.category));
  // Combine, dedupe by id
  const seen = new Set<string>();
  const merged: Product[] = [];
  for (const p of [...keywordMatches, ...categoryMatches]) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      merged.push(p);
    }
  }
  return merged;
}