/**
 * Sivujen UKK-sisällöt. Yhteinen lähde React-sivuille ja build-vaiheen esirenderöinnille
 * (scripts/prerender.mjs), jotta staattinen HTML ja selaimessa näkyvä sivu pysyvät samoina.
 *
 * Faktalähteet: Terms.tsx (toimitusehdot), ReturnsPolicy.tsx (palautusehdot), src/seo/site.ts,
 * create-checkout (toimituskulut, oma teksti), ProductPage (oma teksti, kokoapu).
 * Säännöt: jokainen vastaus alkaa yhdellä suoralla vastauslauseella (enintään noin 25 sanaa),
 * sen jälkeen tarkennus. Ei ajatusviivoja, ei todistamattomia superlatiiveja, ei arvailevia ilmaisuja.
 */
import { PRODUCT_TYPE_LABEL, cleanProductName } from "@/lib/productNames";
import { ILMAINEN_RAJA_TEKSTI, TOIMITUSAIKA_TEKSTI, TOIMITUSMAKSU_TEKSTI } from "@/config/toimitus";
import { ORGANIZATION } from "./site";
import { jouluLaskentaLause, jouluLause, jouluVastaus } from "@/data/tilauspaivat";

export interface FaqItem {
  q: string;
  a: string;
}

/** Ainoa jouluna annettava toimituslupaus (seo/toimitusajat.md). */
export const CHRISTMAS_DEADLINE_TEXT =
  `${jouluLause()}`;

const DELIVERY_SHORT = `Toimitusaika on ${TOIMITUSAIKA_TEKSTI} arkipäivää tilauksesta.`;
const SHIPPING_COST = `Toimitus maksaa ${TOIMITUSMAKSU_TEKSTI} €, ja ${ILMAINEN_RAJA_TEKSTI} euron tilauksista alkaen toimitus on ilmainen.`;

/** /usein-kysytyt-kysymykset (näkyvä UKK ja FAQPage-JSON-LD samasta listasta). */
export const SITE_FAQS: FaqItem[] = [
  {
    q: "Mistä saa hauskan joululahjan nopeasti?",
    a: `Huumorikauppa.fi:stä saat hauskan joululahjan kotiovelle ${TOIMITUSAIKA_TEKSTI} arkipäivässä tilauksesta. ${CHRISTMAS_DEADLINE_TEXT} Valikoimassa on t-paitoja ja huppareita esimerkiksi ammatti-, harrastus-, eläke- ja ikävuositeemoilla sekä tuotteita, joihin voit tilata oman tekstin.`,
  },
  {
    q: "Ehtiikö tilaus jouluksi?",
    a: `${jouluVastaus()} ${jouluLaskentaLause()}`,
  },
  {
    q: "Mikä on hyvä lahja miehelle, jolla on kaikki?",
    a: "Hyvä lahja miehelle, jolla on kaikki, on hauska paita tai huppari, jonka teksti osuu hänen harrastukseensa, ammattiinsa tai ikäänsä. Kalastajalle sopii \"Huonokin päivä kalassa on parempi kuin hyvä päivä töissä\", eläkkeelle jäävälle \"Olen eläkkeellä\" ja kaljuuntuvalle kaverille \"Kalju\". Jos mikään valmis teksti ei osu, tilaa paita omalla tekstillä.",
  },
  {
    q: "Voiko tuotteeseen tilata oman tekstin?",
    a: "Voi: Oma teksti/kuva -tuotteisiin kirjoitat haluamasi tekstin tai kuvatoiveen tuotesivun kenttään ennen kuin lisäät tuotteen koriin. Kenttään mahtuu 200 merkkiä, ja toive kulkee tilauksen mukana painoon asti. Personoitavia tuotteita ovat esimerkiksi t-paita, huppari, pitkähihainen paita, lippis ja koriste. Asiakkaan toiveiden mukaan valmistetuilla tuotteilla ei ole 14 päivän peruutusoikeutta, mutta virheellisen tuotteen korvaamme uudella tai hyvitämme.",
  },
  {
    q: "Paljonko toimitus maksaa?",
    a: `${SHIPPING_COST} Hinnat sisältävät arvonlisäveron (ALV 25,5 %), ja toimituskulut näet kassalla ennen maksamista.`,
  },
  {
    q: "Kuinka nopeasti tilaus toimitetaan?",
    a: `${DELIVERY_SHORT} Jokainen tuote painetaan tilauksesta, minkä jälkeen paketti toimitetaan Postin tai Matkahuollon kautta. Saat sähköpostiisi seurantakoodin, kun paketti on lähetetty.`,
  },
  {
    q: "Miten palautus toimii?",
    a: "Sinulla on 14 päivän peruutusoikeus tuotteen vastaanottamisesta. Ilmoita peruutuksesta sähköpostitse osoitteeseen huumorikauppa@gmail.com ja kerro tilausnumero, palautettavat tuotteet ja yhteystietosi, niin saat palautusohjeet ja palautusosoitteen. Lähetä tuote 14 päivän kuluessa ilmoituksesta käyttämättömänä. Palautuksen postikulut maksaa asiakas, ellei tuote ole virheellinen tai väärin toimitettu.",
  },
  {
    q: "Milloin saan rahat takaisin palautuksesta?",
    a: "Hyvitys maksetaan alkuperäisellä maksutavalla 14 päivän kuluessa siitä, kun olemme saaneet palautetun tuotteen tai todisteen sen lähettämisestä. Hyvitys sisältää tuotteen hinnan ja alkuperäiset toimituskulut edullisimman toimitustavan mukaan.",
  },
  {
    q: "Voinko vaihtaa väärän koon?",
    a: "Erillistä vaihtoa ei ole, mutta voit palauttaa tuotteen 14 päivän peruutusoikeudella ja tilata oikean koon uutena tilauksena. Palautus tehdään palautusehtojen mukaan sähköpostilla huumorikauppa@gmail.com. Tarkista ennen tilausta tuotesivun kokoapu, niin vaihtoa ei tarvita.",
  },
  {
    q: "Mitä maksutapoja voin käyttää?",
    a: "Voit maksaa Visalla, Mastercardilla, Apple Paylla, Google Paylla, Klarnalla ja MobilePaylla. Maksu tehdään tilauksen yhteydessä suojatulla maksusivulla, jolle kassa ohjaa sinut. Tilaus on sitova, kun maksu on suoritettu, ja tilausvahvistus tulee sähköpostiisi.",
  },
  {
    q: "Miten otan yhteyttä asiakaspalveluun?",
    a: "Tavoitat asiakaspalvelun sähköpostilla huumorikauppa@gmail.com. Vastaamme 1-2 arkipäivän kuluessa. Jos tuotteessa on vika, liitä viestiin tilausnumero, kuvaus virheestä ja valokuva tuotteesta.",
  },
  {
    q: "Voinko tilata ilman tiliä?",
    a: "Voit: tilaus tehdään kassalla ilman rekisteröitymistä. Täytä toimitustiedot ja maksa tilaus, niin tilausvahvistus tulee sähköpostiisi.",
  },
  {
    q: "Voiko lahjan lähettää suoraan saajalle?",
    a: "Voi: valitse kassalla \"Toimitetaan eri vastaanottajalle kuin maksaja\" ja kirjoita vastaanottajan nimi ja osoite. Tilausvahvistus ja seurantakoodi tulevat sinun sähköpostiisi.",
  },
  {
    q: "Missä Huumorikaupan tuotteet painetaan?",
    a: "Tuotteet painetaan tilauksesta painokumppaneiden painotaloissa ulkomailla, ei Suomessa. Jokainen tuote valmistetaan vasta tilauksen jälkeen, joten varastoon ei painata tuotteita etukäteen.",
  },
  {
    q: "Mikä on Huumorikauppa?",
    a: `Huumorikauppa on helsinkiläinen verkkokauppa, joka myy hauskoja t-paitoja, huppareita ja muita tuotteita suomalaisella huumorilla. Kauppaa pitää ${ORGANIZATION.legalName} (Y-tunnus ${ORGANIZATION.legalId}), ja asiakaspalvelu toimii suomeksi sähköpostilla ${ORGANIZATION.email}.`,
  },
  {
    q: "Miten tiedän, mikä koko sopii?",
    a: "Mittaa hyvin istuvan paidan leveys kainaloiden kohdalta ja pituus olkasaumasta helmaan, ja kysy tuotteen mitat sähköpostilla huumorikauppa@gmail.com. Tuotteen saatavilla olevat koot ja värit näet tuotesivulla.",
  },
  {
    q: "Miten paita tai huppari pestään?",
    a: "Pese tuote tuotesivun hoito-ohjeen mukaan. T-paitojen ja huppareiden ohjeissa on tyypillisesti konepesu enintään 30 °C eikä kemiallista pesua. Kun käännät tuotteen nurin ennen pesua, painatus on suojassa hankaukselta.",
  },
  {
    q: "Toimitatteko ulkomaille?",
    a: "Emme: toimitamme tilauksia vain Suomeen. Paketit kulkevat Postin tai Matkahuollon kautta.",
  },
  {
    q: "Voiko tilauksen noutaa?",
    a: "Noutoa ei ole, vaan kaikki tilaukset toimitetaan Postin tai Matkahuollon kautta. Saat seurantakoodin sähköpostiisi, kun paketti on lähetetty.",
  },
  {
    q: "Miten alennuskoodi käytetään?",
    a: "Syötä alennuskoodi kassasivun alennuskoodikenttään ennen maksamista. Hyväksytty alennus näkyy loppusummassa ennen kuin siirryt maksamaan.",
  },
  {
    q: "Mikä on hauska lahja naiselle?",
    a: "Hauska lahja naiselle on t-paita tai huppari, jonka teksti osuu hänen arkeensa, kuten \"Maailman paras äiti\" tai \"Super äiskä\". Ikävuosille löytyy omat tekstinsä, esimerkiksi \"40 ja fabulous\", ja oman tekstin voi tilata personoitavaan tuotteeseen.",
  },
  {
    q: "Mikä on hauska lahja työkaverille?",
    a: "Työkaverille sopii t-paita tai huppari, jossa on työpaikkahuumoria, esimerkiksi \"Tämäkin olisi voinut olla sähköposti\". Eläkkeelle jäävälle työkaverille sopivat eläketeemat, kuten \"Olen eläkkeellä\" tai \"Eläkkeellä, kiireinen tekemään ei mitään\".",
  },
  {
    q: "Voiko samaa paitaa tilata koko porukalle?",
    a: "Voi: lisää koriin samaa tuotetta eri kokoina, niin koko porukan paidat tulevat samalla tilauksella. Isommista tilauksista voit kysyä etukäteen sähköpostilla huumorikauppa@gmail.com.",
  },
];

/** Etusivun "Usein kysyttyä" -osio. */
export const HOME_FAQS: FaqItem[] = [
  SITE_FAQS[0],
  SITE_FAQS[3],
  SITE_FAQS[5],
  SITE_FAQS[4],
  {
    q: "Mikä on hauska lahja miehelle?",
    a: "Hauska lahja miehelle on t-paita tai huppari, jonka teksti liittyy hänen harrastukseensa, ammattiinsa tai ikäänsä. Valikoimassa on esimerkiksi kalastus-, eläke-, ammatti- ja syntymäpäiväteemoja.",
  },
];

/** Blogiartikkelin oletus-UKK, kun artikkelilla ei ole omaa. */
export const DEFAULT_BLOG_FAQS: FaqItem[] = [
  {
    q: "Mistä löydän hauskoja lahjaideoita?",
    a: "Huumorikauppa.fi:n kategorioista ja lahjaoppaista löydät hauskoja t-paitoja, huppareita ja muita lahjoja. Blogin muut artikkelit antavat lisää ideoita eri juhliin ja saajille.",
  },
  {
    q: "Kuinka nopeasti tilaus toimitetaan?",
    a: `${DELIVERY_SHORT} ${SHIPPING_COST}`,
  },
  {
    q: "Voinko palauttaa tuotteen?",
    a: "Voit: tuotteilla on 14 päivän peruutusoikeus tuotteen vastaanottamisesta. Asiakkaan toiveiden mukaan personoituja tuotteita peruutusoikeus ei koske.",
  },
  {
    q: "Onko Huumorikauppa suomalainen yritys?",
    a: `Kyllä. Huumorikauppa on helsinkiläinen verkkokauppa, jota pitää ${ORGANIZATION.legalName} (Y-tunnus ${ORGANIZATION.legalId}). Asiakaspalvelu toimii suomeksi.`,
  },
];

/** Kategoriasivun (/kategoria/:slug) UKK. */
export function buildCategoryFaqs(categoryName: string): FaqItem[] {
  const lower = categoryName.toLowerCase();
  return [
    {
      q: `Kuinka nopeasti ${lower} toimitetaan?`,
      a: `${DELIVERY_SHORT} Tuotteet painetaan tilauksesta ja toimitetaan Postin tai Matkahuollon kautta. ${SHIPPING_COST}`,
    },
    {
      q: `Voiko ${lower} palauttaa?`,
      a: "Voi: sinulla on 14 päivän peruutusoikeus tuotteen vastaanottamisesta. Palautuksen postikulut maksaa asiakas, ja hyvitys maksetaan 14 päivän kuluessa palautuksen vastaanottamisesta. Personoituja tuotteita peruutusoikeus ei koske.",
    },
    {
      q: `Sopivatko ${lower} lahjaksi?`,
      a: `Sopivat: hauskalla tekstillä ${lower} toimivat lahjana syntymäpäivinä, jouluna, isänpäivänä, äitienpäivänä, polttareissa ja työkavereille. ${CHRISTMAS_DEADLINE_TEXT}`,
    },
    {
      q: `Mistä materiaalista ${lower} on tehty?`,
      a: "Materiaali vaihtelee tuotteittain, ja tarkka koostumus ja hoito-ohje ovat jokaisen tuotteen kuvauksessa. Tuotteet painetaan tilauksesta painokumppaneiden painotaloissa.",
    },
    {
      q: `Saako ${lower} omalla tekstillä?`,
      a: "Saa niihin tuotteisiin, joiden nimessä on Oma teksti/kuva tai Personoitava. Kirjoitat tekstin tai kuvatoiveen tuotesivun kenttään (enintään 200 merkkiä), ja toive kulkee tilauksen mukana.",
    },
    {
      q: "Mitä maksutapoja voin käyttää?",
      a: "Voit maksaa Visalla, Mastercardilla, Apple Paylla, Google Paylla, Klarnalla ja MobilePaylla. Maksu tehdään tilauksen yhteydessä suojatulla maksusivulla.",
    },
  ];
}

/** Lahjasivun (GiftCategoryPage) UKK. */
export function buildGiftCategoryFaqs(name: string, productCount: number): FaqItem[] {
  return [
    {
      q: `Millaisia ${name.toLowerCase()} Huumorikaupasta löytyy?`,
      a: `Valikoimassa on ${productCount} tuotetta, pääosin hauskoja t-paitoja ja huppareita persoonallisilla teksteillä. Tuotesivuilta näet jokaisen tuotteen koot ja värit.`,
    },
    {
      q: "Kuinka nopeasti tilaus toimitetaan?",
      a: `${DELIVERY_SHORT} ${SHIPPING_COST} ${CHRISTMAS_DEADLINE_TEXT}`,
    },
    {
      q: "Mihin tilaisuuteen lahja sopii?",
      a: `${name} sopivat syntymäpäiviin, jouluun, äitienpäivään, isänpäivään, polttareihin, eläkejuhliin ja työkavereiden lahjoiksi. Hauska teksti tekee lahjasta henkilökohtaisen.`,
    },
    {
      q: "Voiko lahjan palauttaa, jos se ei sovi?",
      a: "Voi: sinulla on 14 päivän peruutusoikeus tuotteen vastaanottamisesta. Ilmoita palautuksesta osoitteeseen huumorikauppa@gmail.com, niin saat ohjeet. Personoituja tuotteita peruutusoikeus ei koske.",
    },
  ];
}

const SITUATION_EXTRA_FAQS: FaqItem[] = [
  {
    q: "Voiko lahjan lähettää suoraan saajalle?",
    a: "Voi: valitse kassalla \"Toimitetaan eri vastaanottajalle kuin maksaja\" ja kirjoita vastaanottajan nimi ja osoite. Tilausvahvistus tulee sinun sähköpostiisi.",
  },
  {
    q: "Mitä jos koko on väärä?",
    a: "Voit palauttaa tuotteen 14 päivän peruutusoikeudella ja tilata oikean koon uutena tilauksena. Palautuksen postikulut maksaa asiakas, ellei tuote ole virheellinen.",
  },
  {
    q: "Ehtiikö lahja perille ajoissa?",
    a: `${DELIVERY_SHORT} Tilaa siis viimeistään kaksi viikkoa ennen juhlaa. Jouluksi: ${CHRISTMAS_DEADLINE_TEXT.charAt(0).toLowerCase()}${CHRISTMAS_DEADLINE_TEXT.slice(1)}`,
  },
];

/** Tilannelahjasivu (/lahjat/:slug): täydennetään UKK viiteen kysymykseen. */
export function mergeSituationFaqs(guideFaqs: FaqItem[]): FaqItem[] {
  return guideFaqs.length < 5
    ? [...guideFaqs, ...SITUATION_EXTRA_FAQS.slice(0, 5 - guideFaqs.length)]
    : guideFaqs;
}

/** Yhdistää UKK-listat: ensimmäinen esiintymä voittaa, sama kysymys (kirjainkoosta ja välimerkeistä riippumatta) vain kerran. */
export function mergeFaqs(...lists: FaqItem[][]): FaqItem[] {
  const seen = new Set<string>();
  const out: FaqItem[] = [];
  for (const list of lists) {
    for (const f of list) {
      const key = f.q.toLowerCase().replace(/[^a-z0-9åäö]+/g, " ").trim();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(f);
    }
  }
  return out;
}

/** Tuotesivun UKK ja "kenelle / mihin / miksi" -tekstit (ProductPage + esirenderöinti). */
export function buildProductFaqs(
  product: { name: string; description?: string | null; category: string },
  categoryName: string,
  opts: { isCustom?: boolean } = {},
): { faqs: FaqItem[]; audience: string; occasion: string; whyFunny: string } {
  const productFaqs: FaqItem[] = [
    {
      q: "Kuinka nopeasti saan tilauksen?",
      a: `${DELIVERY_SHORT} Tuote painetaan tilauksesta ja toimitetaan Postin tai Matkahuollon kautta. ${SHIPPING_COST}`,
    },
    opts.isCustom
      ? {
          q: "Voinko palauttaa tuotteen?",
          a: "Personoidulla tuotteella ei ole 14 päivän peruutusoikeutta, koska se valmistetaan toiveidesi mukaan. Jos tuote on virheellinen, korvaamme sen uudella tai hyvitämme kauppahinnan.",
        }
      : {
          q: "Voinko palauttaa tuotteen?",
          a: "Voit: sinulla on 14 päivän peruutusoikeus tuotteen vastaanottamisesta. Palautuksen postikulut maksaa asiakas, ellei tuote ole virheellinen.",
        },
    { q: "Ehtiikö tilaus jouluksi?", a: `Ehtii, kun tilaat ajoissa. ${CHRISTMAS_DEADLINE_TEXT}` },
  ];

  // GEO/AI: heuristinen "Kenelle sopii / Miksi hauska / Mihin tilanteeseen"
  const _t = (product.name + " " + (product.description ?? "")).toLowerCase();
  const audience = (() => {
    if (_t.includes("äiti") || _t.includes("mamma") || _t.includes("mummi")) return "äidille, mummille tai anopille, kenelle tahansa elämäsi tärkeälle naiselle";
    if (_t.includes("isä") || _t.includes("iskä") || _t.includes("ukki")) return "isälle, ukille tai sedälle, miehelle joka arvostaa sopivan ronskia huumoria";
    if (_t.includes("kala")) return "kalastusta harrastavalle isälle, sedälle tai kaverille";
    if (_t.includes("eläke") || _t.includes("museo")) return "eläkkeelle jäävälle työkaverille tai juuri eläköityneelle läheiselle";
    if (_t.includes("polttari") || _t.includes("morsian") || _t.includes("sulhanen")) return "polttariporukalle, morsiamelle tai sulhaselle";
    if (_t.includes("vauva") || product.category === "bodyt") return "vauvalle ja vanhemmille";
    return "kaverille, perheenjäsenelle tai työkaverille, tai vaikka itsellesi";
  })();
  const occasion = (() => {
    if (_t.includes("äiti")) return "äitienpäivään, äidin syntymäpäiviin ja ihan vaan kiitokseksi";
    if (_t.includes("isä")) return "isänpäivään, isän syntymäpäiviin ja jouluksi";
    if (_t.includes("eläke")) return "eläkejuhliin ja läksiäisiin";
    if (_t.includes("polttari")) return "polttareihin ja häihin";
    if (_t.includes("joulu")) return "jouluksi ja pikkujouluihin";
    if (product.category === "bodyt") return "ristiäisiin ja vauvan syntymän kunniaksi";
    return "syntymäpäiviin, jouluun, pikkujouluihin ja yllätyslahjaksi";
  })();
  const whyFunny = `${cleanProductName(product.name)} on hauska, koska se yhdistää tutun arkitilanteen ja yllättävän tekstin. Sellainen lahja jää mieleen ja päätyy oikeasti käyttöön.`;

  const faqs: FaqItem[] = [
    ...productFaqs,
    { q: "Kenelle tämä tuote sopii?", a: `Tämä ${PRODUCT_TYPE_LABEL[product.category] ?? categoryName.toLowerCase()} sopii ${audience}.` },
    { q: "Mihin tilanteeseen tämä on hyvä lahja?", a: `Se sopii ${occasion}.` },
  ];

  return { faqs, audience, occasion, whyFunny };
}
