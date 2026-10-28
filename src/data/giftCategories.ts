/**
 * Lahjasivujen (GiftCategoryPage) data. Siirretty sivukomponentista, jotta myös build-vaiheen
 * esirenderöinti (scripts/prerender.mjs) voi käyttää samaa lähdettä.
 */
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI } from "../config/toimitus";
import { jouluLause } from "./tilauspaivat";
export interface GiftCategory {
  slug: string;
  name: string;
  emoji: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  filterFn: (product: { name: string; description: string; category: string }) => boolean;
  seoText: string;
  relatedBlogSlugs: string[];
}

export const TLDR_TEXTS: Record<string, string> = {
  "hauskat-lahjat-miehelle": `Hauska lahja miehelle on huumoripaita tai -huppari joka liittyy hänen harrastukseensa tai ammattiinsa. Valikoimassa on esimerkiksi kalamies- ja ammattimiesteemoja. Kaikki tuotteet painetaan tilauksesta, ja toimitus tapahtuu ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
  "hauskat-lahjat-naiselle": `Hauska lahja naiselle on 'Maailman paras äiti' -huppari, hauska t-paita tai söpö huumoriaiheinen tuote. Kaikki tuotteet painetaan tilauksesta, toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
  "lahja-miehelle": "Lahjaideat miehelle: huumoripaita tai -huppari ammatista, harrastuksesta tai luonteenpiirteestä. Valikoimassa on myös 50-vuotis- ja eläkkeellelähtöteemoja. Huumorikaupasta löydät yli 75 hauskaa lahjaideaa miehille kaikkiin tilanteisiin.",
  "hauskat-t-paidat": `Hauskat t-paidat ovat 100 % puuvillaa, ja ne painetaan tilauksesta. Valikoimassa yli 30 vitsipainatusta: ammattihuumoria, kalamies- ja äijäteemoja. Hinta 24,90 €. Tilaa nyt, toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
  "hauskat-hupparit": `Hauskat hupparit ovat lämpimiä ja korkealaatuisia, ja ne painetaan tilauksesta. Valikoimassa yli 25 huumoripainatusta. Hinta alkaen 49,90 €. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
  "isanpaiva-lahjat": "Hauska isänpäivälahja on huumoripaita tai -huppari joka liittyy isän harrastukseen tai ammattiin. Valikoimassa on esimerkiksi kalamies- ja 'Maailman paras pappa' -teemoja. Tilaa hyvissä ajoin ennen marraskuun toista sunnuntaita.",
  "joululahjat": `Hauska joululahja huumorin ystävälle: t-paita, huppari tai pipo suomalaisesta ammattihuumorista. Teemoina esimerkiksi kalamies, äijä ja eläkeläinen. ${jouluLause()}`,
  "syntymapaivaLahjat": `Syntymäpäivälahja huumorin ystävälle: huumoripaita tai -huppari ikääntyvälle juhlijalle. Valikoimassa on esimerkiksi '100 % eläkeläinen'- ja '50v'-teemoja sekä ammattihuumoria. Tilaa nopeasti, toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
  "syntymapaivalahjat": `Syntymäpäivälahja huumorin ystävälle: huumoripaita tai -huppari ikääntyvälle juhlijalle. Valikoimassa on esimerkiksi '100 % eläkeläinen'- ja '50v'-teemoja sekä ammattihuumoria. Tilaa nopeasti, toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
  "polttari-lahjat": "Polttarilahja ja ryhmäpaidat: hauskat t-paidat polttariporukalle naimisiin menevälle. Räätälöitäviä tekstipaitoja ja yhteishenkipainatuksia. Tilaa hyvissä ajoin koko ryhmälle.",
  "elakelahjat": "Hauska eläkelahja eläkkeelle jäävälle työkaverille tai läheiselle. Valikoimassa on esimerkiksi 'Olen eläkkeellä'- ja '100 % eläkeläinen' -teemoja. T-paitoja ja huppareita. Tilaa nyt.",
  "lahja-kaverille": "Hauska lahja kaverille: huumoripaita tai -huppari kaverin harrastuksesta tai persoonallisuudesta. Sopii synttäreille, kihlauksiin tai vain piristämään arkea.",
  "lahja-tyokaverille": "Hauska lahja työkaverille: huumoripaita tai -huppari suomalaisesta työpaikkahuumorista. Esimerkiksi '100 % eläkeläinen' -paita on hauska valinta. Sopii työkaverin lähtöön tai syntymäpäivään.",
  "haalarimerkit": `Haalarimerkit opiskelijalle: räätälöitäviä ja valmiita malleja kaikkiin haalareihin, reppuihin ja laukkuihin. Sopivat kiltajuhliin ja haalaripäiviin. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
  "opiskelijan-haalarimerkit": `Opiskelijan haalarimerkit personoivat haalarit persoonallisiksi. Valmiita malleja ja räätälöitäviä vaihtoehtoja kiltajärjestöille. Toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
};

export const giftCategories: GiftCategory[] = [
  {
    slug: "hauskat-lahjat-miehelle",
    name: "Hauskat Lahjat Miehelle",
    emoji: "🎁",
    h1: "Hauskat Lahjat Miehelle",
    seoTitle: "Hauskat lahjaideat miehelle | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat miehelle: ideat joita hän ei odota! T-paidat, hupparit ja paljon muuta. 🎯",
    filterFn: (p) => {
      const t = (p.name + " " + p.description).toLowerCase();
      return (
        t.includes("isä") || t.includes("iskä") || t.includes("mies") ||
        t.includes("setä") || t.includes("amatimies") || t.includes("kalamies") ||
        t.includes("kalastus") || t.includes("eläke") || t.includes("museo") ||
        t.includes("kalju") || t.includes("paras isä") ||
        p.category === "t-paidat" || p.category === "hupparit" || p.category === "mukit"
      );
    },
    seoText: `## Hauskat lahjat miehelle - lahjaideat isälle, kaverille ja aviomiehelle

Miehelle lahjan ostaminen on tunnetusti vaikeaa - mutta hauska lahja on aina oikea valinta. Se naurattaa, ilahduttaa ja tulee oikeasti käyttöön. Huumorikaupan valikoimasta löydät satoja hauskoja tuotteita miehille: t-paitoja, huppareita ja paljon muuta.

## Hauska lahja miehelle ikävuosittain

**Lahja miehelle 30v**: Meemipaidat, sarkasmipaidat ja hauskat hupparit sopivat 30-vuotiaalle miehelle joka arvostaa internet-huumoria ja itseironiaa.

**Lahja miehelle 40v** - Setähuumoripaidat alkavat puhutella 40-vuotiasta miestä. Kalastuspaidat, ammattihuumoripaidat ja "elämäni parhaassa iässä" -hupparit ovat hyviä valintoja.

**Lahja miehelle 50v**: "Museo-kappale" -paidat, eläkkeelle valmistautumishuumori ja harrastusaiheiset paidat sopivat hyvin 50-vuotiaalle.

**Lahja miehelle 60v**: Eläkeläishuumori osuu tähän ikään. "Eläkkeellä ja nautinnossa" -tuotteet ja mukavat peitot sohvalle ovat hyviä valintoja.

## Lahjaideoita miehelle

Kalastuspaidat, setähuumoripaidat ja eläkeläishuumoripaidat ovat hyviä lahjaideoita miehille. Ne sopivat isälle, kaverille, aviomiehelle, veljelle ja sedälle.

## Lahja miehelle jolla on jo kaikkea

Miehelle jolla on jo kaikkea, hauska paita tai huppari on hyvä lahja: se on jotain mitä hänellä ei varmasti vielä ole. Persoonallinen huumori tekee lahjasta erityisen.

## Miksi tilata Huumorikaupasta?

- Ilmainen toimitus vähintään ${ILMAINEN_RAJA_TEKSTI} € tilauksiin
- 14 päivän palautusoikeus
- ${TOIMITUSAIKA_TEKSTI} arkipäivän toimitus koko Suomeen
- 100% suomalainen yritys`,
    relatedBlogSlugs: ["parhaat-hauskat-lahjat-miehelle", "hauskat-isanpaivalahjat-opas", "mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea", "lahja-miehelle-30v-40v-50v-60v"],
  },
  {
    slug: "hauskat-lahjat-naiselle",
    name: "Hauskat Lahjat Naiselle",
    emoji: "💝",
    h1: "Hauskat Lahjat Naiselle",
    seoTitle: "Hauskat lahjat naiselle | Huumorikauppa.fi",
    seoDescription: "Hauskat lahjat naiselle - Persoonalliset ideat kaikille naisille. Nopea toimitus. 🌸",
    filterFn: (p) => {
      const t = (p.name + " " + p.description).toLowerCase();
      return (
        t.includes("äiti") || t.includes("nainen") || t.includes("naiselle") ||
        t.includes("maailman paras äiti") || t.includes("viini") ||
        p.category === "hupparit" || p.category === "mukit" || p.category === "laukut"
      );
    },
    seoText: `## Hauskat lahjat naiselle - lahjaideat äidille, ystävälle ja puolisolle

Hauska lahja naiselle on raikas vaihtoehto kukille ja suklaalle. Se osoittaa persoonallisuutta ja huumorintajua - ominaisuuksia joita jokainen nainen arvostaa lahjan antajassa.

## Hauska lahja naiselle ikävuosittain

**Lahja naiselle 30v**: Meemihupparit, hauskat kangaskassit ja söpöt t-paidat sopivat 30-vuotiaalle naiselle. Itseironia ja arjen huumori puhuttelevat.

**Lahja naiselle 40v**: "Maailman paras äiti" -tuotteet, viiniaiheiset t-paidat ja rennot huumorihupparit ovat hyviä lahjoja 40-vuotiaalle naiselle.

**Lahja naiselle 50v** - Laadukkaat premium-hupparit ja söpöt huumoripaidat ilahduttavat 50-vuotiasta naista.

**Lahja naiselle 60v**: Eläkeläishuumorituotteet, mukavat pitkähihaiset ja lämpimät hupparit sopivat hyvin 60-vuotiaalle.

## Lahjaideoita naiselle

"Maailman paras äiti" -hupparit, söpöt huumoripaidat ja hauskat kangaskassit ovat hyviä lahjaideoita naisille. Ne sopivat äidille, ystävälle, siskolle, puolisolle ja työkavereille.

## Miksi tilata Huumorikaupasta?

- Ilmainen toimitus vähintään ${ILMAINEN_RAJA_TEKSTI} € tilauksiin
- 14 päivän palautusoikeus
- ${TOIMITUSAIKA_TEKSTI} arkipäivän toimitus koko Suomeen
- Lahjapaketointimahdollisuus`,
    relatedBlogSlugs: ["hauskat-lahjat-naiselle-opas", "hauska-aitienpaivalahja-opas", "lahja-naiselle-30v-40v-50v-60v"],
  },
  {
    slug: "polttari-lahjat",
    name: "Polttarilahjat & Polttaripaidat",
    emoji: "🎉",
    h1: "Polttarilahjat & Polttaripaidat",
    seoTitle: "Polttarilahjat | Huumorikauppa.fi",
    seoDescription: "Polttarilahjat morsiamelle ja sulhaselle! Hauskat ja mieleenpainuvat ideat. Toimitus nopeasti. 🥂",
    filterFn: (p) => {
      const t = (p.name + " " + p.description).toLowerCase();
      // 28.10.2026: ei enää kaikkia paitoja (sama ruudukko kuin muilla lahjasivuilla), vaan polttariaiheet,
      // ryhmälle omalla tekstillä painettavat paidat ja kaveriporukan juhlameemit.
      if (p.category !== "t-paidat" && p.category !== "hupparit") return false;
      return (
        t.includes("polttari") || t.includes("sulhanen") || t.includes("morsian") ||
        t.includes("bride") || t.includes("game over") ||
        t.includes("oma teksti") || t.includes("personoitava") ||
        t.includes("oispa kaljaa") || t.includes("yksi kerta vielä") || t.includes("alkoholi")
      );
    },
    seoText: `## Polttarilahjat ja polttaripaidat - tilaa ryhmälle

Polttarit ovat ikimuistoinen juhla, ja polttaripaidat tekevät niistä vieläkin hauskemmat. Yhtenäiset paidat ryhmälle yhdistävät porukan, naurattavat ohikulkijoita ja jäävät muistoksi.

## Polttaripaidat miesten polttareihin 🤵

Sulhasen paita, bestmanin paita ja ryhmän paidat - tilaa koko porukalle yhtenäiset polttaripaidat. Tekstiehdotuksia: "Game Over", "Viimeinen vapaa ilta" ja "[Nimi]:n polttarit 2026".

## Polttaripaidat naisten polttareihin 👰

Morsiamen paita, kaason paidat ja "Team Bride" -paidat. Morsiamen paita erottuu usein värillä - valkoinen tai kultainen on klassikko.

## Polttarilahjat sulhaselle ja morsiamelle

Polttaripaitojen lisäksi löydät meiltä hauskoja polttarilahjoja: huppareita, koristeita ja pipoja.

## Tilaa polttaripaidat Huumorikaupasta

- Ilmainen toimitus vähintään ${ILMAINEN_RAJA_TEKSTI} € tilauksiin
- ${TOIMITUSAIKA_TEKSTI} arkipäivän toimitus
- Ryhmätilaukset helposti - lisää eri koot koriin`,
    relatedBlogSlugs: ["parhaat-polttaripaidat-ja-polttarilahjat-2026"],
  },
  {
    slug: "isanpaiva-lahjat",
    name: "Isänpäivälahjat",
    emoji: "👨",
    h1: "Hauskat Isänpäivälahjat",
    seoTitle: "Isänpäivälahjat: 20 hauskaa lahjaa isälle | Huumorikauppa",
    seoDescription: "Mitä antaa isälle? 20+ hauskaa ideaa isänpäivään. T-paidat, hupparit ja paljon muuta. Tilaa nyt! 👨",
    filterFn: (p) => {
      const t = (p.name + " " + p.description).toLowerCase();
      return (
        t.includes("isä") || t.includes("iskä") || t.includes("paras isä") ||
        t.includes("kalastus") || t.includes("kalamies") || t.includes("setä") ||
        t.includes("amatimies") || t.includes("eläke") ||
        p.category === "t-paidat" || p.category === "mukit" || p.category === "hupparit"
      );
    },
    seoText: `## Hauskat isänpäivälahjat - lahjoja jotka saavat isän hymyilemään

Isänpäivä on marraskuun toinen sunnuntai. Se on päivä jolloin isä ansaitsee parhaan - ja hauskimman - lahjan. Huumorikaupan valikoimasta löydät satoja hauskoja lahjoja isälle.

## Isänpäivälahjaideoita

**Kalastuspaidat**: Hauska isänpäivälahja kalastusta harrastavalle isälle. Valikoimasta löytyy myös "Kalamies" -paitoja.

**"Maailman paras isä" -tuotteet**: Hupparit ja paidat jotka kertovat isälle hänen olevan paras.

**Setähuumoripaidat**: Hauska paita isän arkeen. Käytännöllinen isänpäivälahja.

## Isänpäivälahja budjetin mukaan

- **Alle 20 €**: Hauska koriste
- **20-30 €** - Hauska t-paita tai pipo
- **30-50 €** - Hauska huppari
- **Yli 50 €**: Huppari + t-paita -combo

## Tilaa isänpäivälahja ajoissa

Tilaa viimeistään 2 viikkoa ennen isänpäivää. Toimitamme ${TOIMITUSAIKA_TEKSTI} arkipäivässä koko Suomeen.`,
    relatedBlogSlugs: ["hauskat-isanpaivalahjat-opas", "parhaat-hauskat-lahjat-miehelle"],
  },
  {
    slug: "aitienpaiva-lahjat",
    name: "Äitienpäivälahjat",
    emoji: "💐",
    h1: "Hauskat Äitienpäivälahjat",
    seoTitle: "Äitienpäivälahjat: hauskat lahjat äidille | Huumorikauppa",
    seoDescription: "Hae inspiraatiota äitienpäivälahjaan! Hauskat ideat äidille. Tilaa helposti verkosta. 💐",
    filterFn: (p) => {
      const t = (p.name + " " + p.description).toLowerCase();
      return (
        t.includes("äiti") || t.includes("maailman paras äiti") || t.includes("nainen") ||
        p.category === "hupparit" || p.category === "mukit" || p.category === "laukut"
      );
    },
    seoText: `## Hauskat äitienpäivälahjat - lahjoja jotka saavat äidin hymyilemään

Äitienpäivä on toukokuun toinen sunnuntai. Äiti ansaitsee lahjan joka naurattaa ja lämmittää sydäntä. Unohda tylsät kukat - anna äidille lahja joka ilahduttaa joka päivä!

## Äitienpäivälahjaideoita

**"Maailman paras äiti" -huppari**: Pehmeä, lämmin ja hauska.

**Hauska pitkähihainen äidille**: Lämmin ja hauska lahja arkeen.

**Söpö huumoripaita** - Hienovaraisen hauska paita jota äiti käyttää oikeasti.

## Äitienpäivälahja budjetin mukaan

- **Alle 20 €**: Hauska koriste
- **20-30 €** - Hauska t-paita
- **30-50 €** - Hauska huppari
- **Yli 50 €**: Huppari + t-paita -combo

## Tilaa äitienpäivälahja ajoissa

Tilaa viimeistään 2 viikkoa ennen äitienpäivää.`,
    relatedBlogSlugs: ["hauska-aitienpaivalahja-opas", "hauskat-lahjat-naiselle-opas"],
  },
  {
    slug: "joululahjat",
    name: "Hauskat Joululahjat",
    emoji: "🎄",
    h1: "Hauskat Joululahjat",
    seoTitle: "Hauskat joululahjat 2026 | Huumorikauppa.fi",
    seoDescription: `Hauskat joululahjat 2026! Yllättävät ideat koko perheelle. Tilaa ajoissa, toimitus ${TOIMITUSAIKA_TEKSTI} arkipäivässä. 🎄`,
    filterFn: (p) => {
      return p.category === "t-paidat" || p.category === "hupparit" || 
             p.category === "mukit" || p.category === "tarrat" || 
             p.category === "pipot" || p.category === "peitot";
    },
    seoText: `## Hauskat joululahjat - naurua joulukuusen alle

Joulu on Suomen suurin lahjanantosesonki. Hauska joululahja on aina oikea valinta - se naurattaa, ilahduttaa ja erottuu muista lahjoista. Huumorikaupasta löydät hauskan joululahjan kaikille.

## Joululahjat miehelle 🎅

Setähuumoripaidat, kalastuspaidat ja meemihupparit ovat hyviä joululahjoja miehelle.

## Joululahjat naiselle 🎄

"Maailman paras äiti" -hupparit, söpöt huumoripaidat ja hauskat kangaskassit ovat hyviä joululahjoja naiselle.

## Pikkujoululahjat alle 20 € 🎉

Hauska koriste tai pipo sopii pikkujoululahjaksi työkavereille.

## Joululahja budjetin mukaan

- **Alle 10 €** - Joulukoristeet
- **Alle 20 €**: Hauska pipo
- **Alle 30 €** - Hauska t-paita
- **Alle 50 €** - Hauska huppari

## Milloin tilata joululahjat?

${jouluLause()} Toimitamme ${TOIMITUSAIKA_TEKSTI} arkipäivässä.`,
    relatedBlogSlugs: ["parhaat-joululahjat-ja-pikkujoululahjat-2026"],
  },
  {
    slug: "syntymapaivaLahjat",
    name: "Hauskat Syntymäpäivälahjat",
    emoji: "🎂",
    h1: "Hauskat Syntymäpäivälahjat",
    seoTitle: "Syntymäpäivälahjat | Huumorikauppa.fi",
    seoDescription: "Hauska syntymäpäivälahja? Löydä sopiva idea kaikille. Nopea toimitus koko Suomeen. 🎂",
    filterFn: (p) => {
      return p.category === "t-paidat" || p.category === "hupparit" || p.category === "mukit";
    },
    seoText: `## Hauskat syntymäpäivälahjat - lahjat jotka naurattavat

Syntymäpäivälahjan pitää olla hauska, persoonallinen ja mieleenpainuva. Huumorikaupasta löydät hauskan syntymäpäivälahjan jokaiselle ikäluokalle.

## Syntymäpäivälahja ikävuosittain

**Lahja 18v** - Meemipaidat ja internet-huumori
**Lahja 25v**: Sarkasmipaidat ja hauskat hupparit
**Lahja 30v** - Ammattihuumori ja meemihupparit
**Lahja 40v** - Setähuumori alkaa puhutella
**Lahja 50v** - "Museo-kappale" ja eläkehuumori
**Lahja 60v** - Eläkeläishuumori ja mukavat peitot

## Syntymäpäivälahja miehelle vs. naiselle

**Miehelle:** Kalastuspaidat, setähuumoripaidat, meemihupparit
**Naiselle:** "Maailman paras äiti" -hupparit, söpöt huumoripaidat, kangaskassit`,
    relatedBlogSlugs: ["mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea", "lahja-miehelle-30v-40v-50v-60v", "hauskat-syntymapaivaLahjat-opas"],
  },
  {
    slug: "elakelahjat",
    name: "Hauskat Eläkelahjat",
    emoji: "🏖️",
    h1: "Hauskat Eläkelahjat",
    seoTitle: "Eläkeläislahjat | Huumorikauppa.fi",
    seoDescription: "Eläkeläislahja joka muistetaan! Hauskat ideat eläkkeelle jäävälle. Tilaa verkosta helposti. 🎉",
    filterFn: (p) => {
      const t = (p.name + " " + p.description).toLowerCase();
      return (
        t.includes("eläke") || t.includes("eläkkeellä") || t.includes("museo") ||
        t.includes("vapaa") || t.includes("legenda") ||
        p.category === "t-paidat" || p.category === "hupparit" || p.category === "mukit"
      );
    },
    seoText: `## Hauskat eläkelahjat - juhli uutta vapautta huumorilla

Eläkkeelle siirtyminen on yksi elämän suurimmista virstanpylväistä. Vuosikymmenten työ on takana ja edessä on vapaus. Hauska eläkelahja juhlistaa tätä hetkeä tyylillä.

## Eläkelahjaideoita

**"Eläkkeellä ja nautinnossa" -paita**: Hauska valinta eläkejuhliin
**"Virallisesti vapaa" -huppari**: Käytännöllinen ja hauska
**Eläkeläishuumoripaita**: Arkinen muistutus vapaudesta

## Kenelle eläkelahja?

- Työkavereille eläkejuhliin
- Isälle tai äidille
- Puolisolle
- Ystävälle`,
    relatedBlogSlugs: ["hauskat-elakelahjat-opas", "mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea"],
  },
  {
    slug: "lahja-kaverille",
    name: "Hauskat Lahjat Kaverille",
    emoji: "🤝",
    h1: "Hauskat Lahjat Kaverille",
    seoTitle: "Hauska lahja kaverille: lahjaideat | Huumorikauppa.fi",
    seoDescription: "Hauska lahja kaverille - 15+ ideaa jotka varmasti toimii. Nopea toimitus. Osta nyt! 🎁",
    filterFn: (p) => {
      return p.category === "t-paidat" || p.category === "mukit" || p.category === "tarrat" || p.category === "hupparit";
    },
    seoText: `## Hauskat lahjat kaverille - lahjaideat parhaalle ystävälle

Kaverin lahja saa olla hauska, typerä ja mieleenpainuva. Sisäpiirin vitsit, meemit ja sarkasmi - kaveri arvostaa lahjaa joka naurattaa. Huumorikaupasta löydät hauskan lahjan parhaalle kaverille.

## Lahjaideoita kaverille

**Meemipaidat**: Internet-huumori puhuu kaverin kieltä
**Sarkasmipaidat**: Osuva teksti kaverin makuun
**Hauska koriste** - Edullinen ja hauska lisälahja
**Hauska huppari** - Käytännöllinen ja hauska combo

## Lahja kaverin synttäreille

Kaverin syntymäpäivälahjan ei tarvitse olla kallis - huumori riittää. Alle 30 eurolla saat loistavan hauskan lahjan.`,
    relatedBlogSlugs: ["hauskat-lahjat-miehelle-naiselle-syntymapaivaLahjat", "parhaat-hauskat-lahjat-miehelle"],
  },
  {
    slug: "lahja-tyokaverille",
    name: "Lahjat Työkavereille",
    emoji: "💼",
    h1: "Hauskat Lahjat Työkavereille",
    seoTitle: "Lahjat työkavereille | Huumorikauppa.fi",
    seoDescription: "Hauska toimistolahja työkavereille - Ideat, jotka saavat kaikki nauramaan. Tilaa nyt! 💼",
    filterFn: (p) => {
      return p.category === "mukit" || p.category === "tarrat" || p.category === "pipot";
    },
    seoText: `## Hauskat lahjat työkavereille - pikkujoululahjat ja toimistolahjat

Työkaverin lahja saa olla hauska mutta sopiva. Pikkujoululahja, syntymäpäivälahja tai läksiäislahja - Huumorikaupasta löydät sopivan hauskan lahjan jokaiselle kollegalle.

## Pikkujoululahjat alle 20 €

**Hauska koriste** - Edullinen lisälahja
**Hauska pipo** - Talvipipo hauskalla tekstillä

## Lahja pomolle ja esimiehelle

Pomollekin voi antaa hauskan lahjan - kunhan huumori on sopivaa. Ammattihuumoripaidat ja neutraalit sarkasmipaidat ovat turvallisia valintoja.

## Lahja eläkkeelle jäävälle työkavereille

Eläkkeelle jäävä työkaveri ansaitsee hauskan eläkelahjan. Hyvä valinta ovat esimerkiksi "Eläkkeellä ja nautinnossa" -tuotteet.`,
    relatedBlogSlugs: ["parhaat-joululahjat-ja-pikkujoululahjat-2026"],
  },
  // Phase 0 + Phase 1 routes that map to GiftCategoryPage
  {
    slug: "hauskat-t-paidat",
    name: "Hauskat T-paidat",
    emoji: "👕",
    h1: "Hauskat T-paidat",
    seoTitle: "Hauskat t-paidat ja huumoripaidat | Huumorikauppa.fi",
    seoDescription: "Hauskat t-paidat lahjaksi tai itselle. Huumoripaitoja kalamiehille, isille, äijille ja kaikille hauskan ystäville. Tilaa nyt.",
    filterFn: (p) => p.category === "t-paidat",
    seoText: "## Hauskat t-paidat: 100 % puuvillaa, painetaan tilauksesta\n\nHauskat t-paitamme ovat laadukasta puuvillaa, ja ne painetaan tilauksesta DTG-tekniikalla. Valikoimassa yli 30 erilaista huumoripainatusta: ammattihuumoria, setäteemoja, kalamiesaiheita ja suomalaista sarkasmia.",
    relatedBlogSlugs: ["20-hauskinta-t-paitaa-2026", "miksi-hauska-paita-paras-lahja"],
  },
  {
    slug: "hauskat-hupparit",
    name: "Hauskat Hupparit",
    emoji: "🧥",
    h1: "Hauskat Hupparit",
    seoTitle: "Hauskat hupparit ja huumorihupparit | Huumorikauppa.fi",
    seoDescription: "Hauskat hupparit lahjaksi tai itselle. Lämpimiä huumorihuppareita ammattihuumorilla. Painetaan tilauksesta, nopea toimitus.",
    filterFn: (p) => p.category === "hupparit",
    seoText: "## Hauskat hupparit - lämmin ja hauska yhdistelmä\n\nHupparimme ovat pehmeää puuvilla-polyesteri-sekoitetta, ja ne painetaan tilauksesta. Koot S-3XL. Sopiva lahja isälle, kaverille tai itsellesi.",
    relatedBlogSlugs: ["hauskat-valmistujaislahjat-2026", "parhaat-hauskat-lahjat-miehelle"],
  },
  {
    slug: "lahja-miehelle",
    name: "Lahja Miehelle",
    emoji: "🎁",
    h1: "Lahja Miehelle - Hauskat Lahjaideat",
    seoTitle: "Lahja Miehelle - Hauskat lahjaideat | Huumorikauppa.fi",
    seoDescription: "Hauska lahja miehelle - isälle, ukille, kaverille tai puolisolle. Huumoripaidat ja -hupparit ammattihuumorilla. Tilaa Huumorikauppa.fi:stä.",
    filterFn: (p) => {
      const t = (p.name + " " + p.description).toLowerCase();
      return t.includes("isä") || t.includes("iskä") || t.includes("mies") ||
        t.includes("kalamies") || t.includes("eläke") || t.includes("amatimies") ||
        p.category === "t-paidat" || p.category === "hupparit" || p.category === "mukit";
    },
    seoText: "## Lahja miehelle - yli 75 hauskaa vaihtoehtoa\n\nMiehelle lahjan ostaminen on tunnetusti vaikeaa. Hauska lahja on aina oikea valinta - se naurattaa, ilahduttaa ja tulee oikeasti käyttöön.",
    relatedBlogSlugs: ["parhaat-hauskat-lahjat-miehelle", "lahja-miehelle-30v-40v-50v-60v"],
  },
  {
    slug: "syntymapaivalahjat",
    name: "Hauskat Syntymäpäivälahjat",
    emoji: "🎂",
    h1: "Hauskat Syntymäpäivälahjat",
    seoTitle: "Syntymäpäivälahjat: hauskat synttärilahjat | Huumorikauppa",
    seoDescription: "Hauskat syntymäpäivälahjat kaikkiin ikiin. Huumorituotteita pyöreille vuosille ja arkisille synttäreille. Tilaa Huumorikauppa.fi:stä.",
    filterFn: (p) => p.category === "t-paidat" || p.category === "hupparit" || p.category === "mukit",
    seoText: "## Hauskat syntymäpäivälahjat - lahjat jotka naurattavat\n\nSyntymäpäivälahjan pitää olla hauska, persoonallinen ja mieleenpainuva. Löydä hauska syntymäpäivälahja jokaiselle ikäluokalle.",
    relatedBlogSlugs: ["mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea", "lahja-miehelle-30v-40v-50v-60v"],
  },
  {
    slug: "haalarimerkit",
    name: "Haalarimerkit",
    emoji: "🎓",
    h1: "Haalarimerkit Opiskelijalle",
    seoTitle: "Haalarimerkit Opiskelijalle | Huumorikauppa.fi",
    seoDescription: "Haalarimerkit opiskelijoille - räätälöitäviä ja valmiita malleja. Toimitamme nopeasti Suomeen.",
    filterFn: (p) => p.category === "haalarimerkit",
    seoText: "## Haalarimerkit - personoi haalarit\n\nHaalarimerkit ovat perinteinen tapa personoida opiskelijan haalarit. Valmiita malleja ja räätälöitäviä vaihtoehtoja kiltajärjestöille.",
    relatedBlogSlugs: [],
  },
  {
    slug: "opiskelijan-haalarimerkit",
    name: "Opiskelijan Haalarimerkit",
    emoji: "🎓",
    h1: "Opiskelijan Haalarimerkit",
    seoTitle: "Opiskelijan haalarimerkit: hauskat merkit | Huumorikauppa",
    seoDescription: "Opiskelijan haalarimerkit kaikille kiltojen ja ainejärjestöjen jäsenille. Räätälöitävät merkit ja valmiit mallit.",
    filterFn: (p) => p.category === "haalarimerkit",
    seoText: "## Opiskelijan haalarimerkit - killoille ja ainejärjestöille\n\nHaalarimerkit sopivat kaikkiin haalareihin neulakiinnityksellä. Tilaa räätälöityjä merkkejä koko ryhmälle.",
    relatedBlogSlugs: [],
  },
];

export function getGiftCategory(slug: string) {
  return giftCategories.find(c => c.slug === slug);
}

