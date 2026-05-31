/**
 * Vercel Edge Middleware — Bot SEO injector
 *
 * Detects search engine and AI crawler requests and injects per-page
 * title, description, canonical and OG tags into the HTML response.
 * Falls through transparently for human visitors.
 *
 * Phase 0 (2026-05-21): Added /tuote/:slug product page coverage — all 82
 * products now get correct title, description, canonical and Product+Breadcrumb
 * JSON-LD instead of the generic homepage meta that was causing Google Search
 * Console "Alternate page with proper canonical tag" errors.
 */

export const config = {
  matcher: [
    '/((?!favicon.ico|robots.txt|sitemap.xml|product-feed.xml|llms.txt|_vercel|.*\\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf|map|json|xml|txt)).*)',
  ],
};

const BOT_REGEX =
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|gptbot|chatgpt-user|oai-searchbot|claudebot|claude-web|anthropic-ai|perplexitybot|perplexity-user|google-extended|applebot|applebot-extended|ccbot|bytespider|cohere-ai|amazonbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|semrushbot|ahrefsbot|mj12bot|rogerbot/i;

interface PageMeta {
  title: string;
  description: string;
}

interface ProductMeta {
  title: string;
  description: string;
  image: string;
  price: number;
  category: string;
  categoryName: string;
}

const PRODUCT_META: Record<string, ProductMeta> = {
  '-jos-iska-ei-osaa-korjata-sita-t-paita': {
    title: "Jos iskä ei osaa korjata – T-paidat | Huumorikauppa.fi",
    description: "Jos iskä ei osaa korjata sitä... – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a7f50a3fb434716503427b/38191/97992/jos-iska-ei-osaa-korjata-sita-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  '100-elakelainen-t-paita': {
    title: "100% Eläkeläinen – T-paidat | Huumorikauppa.fi",
    description: "100% Eläkeläinen – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a9c88c51c06fd6aa0533ef/38191/97992/100-elakelainen-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'ala-kosketa-sahkomiesta-kun-olet-marka-t-paita': {
    title: "Älä Kosketa Sähkömiestä Kun – T-paidat | Huumorikauppa.fi",
    description: "Älä Kosketa Sähkömiestä Kun Olet Märkä – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a9cc2ee886ad43ae0d0dc5/38191/97992/ala-kosketa-sahkomiesta-kun-olet-marka-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'alkoholi-tappaa-hitaasti-t-paita': {
    title: "Alkoholi tappaa hitaasti – T-paidat | Huumorikauppa.fi",
    description: "Alkoholi tappaa hitaasti – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a70dc87bf5db4cd70d34d6/38191/97992/alkoholi-tappaa-hitaasti-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'amatimies-t-paita': {
    title: "Amatimies – T-paidat | Huumorikauppa.fi",
    description: "Amatimies – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69ab26cad959867b0506f526/38191/97992/amatimies-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'amatimies-t-paita-02f10a': {
    title: "Amatimies – T-paidat | Huumorikauppa.fi",
    description: "Amatimies – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a740d8fb8ede503402f10a/38191/97992/amatimies-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'elakelainen-t-paita': {
    title: "Eläkeläinen – T-paidat | Huumorikauppa.fi",
    description: "Eläkeläinen – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a5db5001cc8e4cbe0b581f/38191/97992/elakelainen-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'huonokin-paiva-kalassa-on-parempi-kuin-hyva-paiva-toissa-t-paita': {
    title: "Huonokin päivä kalassa on – T-paidat | Huumorikauppa.fi",
    description: "Huonokin päivä kalassa on parempi kuin hyvä päivä töissä – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69acbbd5a028393ce202d85e/38191/97992/huonokin-paiva-kalassa-on-parempi-kuin-hyva-paiva-toissa-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'hustle-more-less-coffee-circle-design-tee-take-a-sip': {
    title: "Hustle More Less Coffee – T-paidat | Huumorikauppa.fi",
    description: "Lightweight tri-blend crew tee with a calm, minimal design that reads as a quiet manifesto: “More coffee, less hustle” arranged in a circular mark above a ",
    image: "https://images-api.printify.com/mockup/6a09d5b12a48e38e050216cd/37202/102230/hustle-more-less-coffee-circle-design-tee-take-a-sip.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'i-my-boyfriend-t-paita': {
    title: "I ❤️ My Boyfriend – T-paidat | Huumorikauppa.fi",
    description: "I ❤️ My Boyfriend – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a9c254e9c1bfb00d0ed110/38191/97992/i-my-boyfriend-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'i-my-girlfriend-t-paita': {
    title: "I ❤️ My Girlfriend – T-paidat | Huumorikauppa.fi",
    description: "I ❤️ My Girlfriend – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a945278ed0096ada0ce8da/38191/97992/i-my-girlfriend-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'i-swedish-boys-t-paita': {
    title: "I ❤️ Swedish Boys – T-paidat | Huumorikauppa.fi",
    description: "I ❤️ Swedish Boys – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69ab08c80ba0c0e0e70e4783/38191/97992/i-swedish-boys-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'i-swedish-girls-t-paita': {
    title: "I ❤️ Swedish Girls – T-paidat | Huumorikauppa.fi",
    description: "I ❤️ Swedish Girls – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69ab0830bc2c1ab2400c9d03/38191/97992/i-swedish-girls-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'ice-aatanat-paita': {
    title: "ICE AATANA – T-paidat | Huumorikauppa.fi",
    description: "Klassinen puuvillapaita, jossa hassu, käsinpiirretty hahmo ja teksti tuo hymyn huulille. Pehmeä kangas korostaa lämpimiä ruskeita ja hillittyjä sävyjä. Kes",
    image: "https://images-api.printify.com/mockup/69a48d1394ca9fbf1d0216e2/12100/92570/ice-aatanat-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'isanta-t-paita': {
    title: "Isäntä – T-paidat | Huumorikauppa.fi",
    description: "Isäntä – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69ab1d3e89c492772e0739e9/38191/97992/isanta-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'kalamies-t-paita': {
    title: "KALAMIES – T-paidat | Huumorikauppa.fi",
    description: "Klassinen puuvillapaita, jossa hassu teksti. Pehmeä kangas korostaa lämpimiä ruskeita ja hillittyjä sävyjä. Keskivahva puuvilla tuntuu heti mukavalta ja el",
    image: "https://images-api.printify.com/mockup/69a55dc9e4fb931025030dee/12100/92570/kalamies-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'kalju-t-paita': {
    title: "Kalju – T-paidat | Huumorikauppa.fi",
    description: "Kalju – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a9400c62ee189316052dcc/38191/97992/kalju-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'maailman-paras-aiti-palkinnon-voittaja-t-shirt-t-paita': {
    title: "\"Maailman paras äiti\" – T-paidat | Huumorikauppa.fi",
    description: "\"Maailman paras äiti\" palkinnon voittaja T-Shirt – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69e40aa79ab6f6d65e003297/38191/97992/maailman-paras-aiti-palkinnon-voittaja-t-shirt-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'maailman-paras-aiti-t-paita': {
    title: "maailman paras ÄITI – T-paidat | Huumorikauppa.fi",
    description: "Klassinen puuvillapaita, jossa teksti tuo hymyn huulille. Pehmeä kangas korostaa lämpimiä ruskeita ja hillittyjä sävyjä. Keskivahva puuvilla tuntuu heti mu",
    image: "https://images-api.printify.com/mockup/69a55963c04ae898a505cc2a/38191/97992/maailman-paras-aiti-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'maailman-paras-pappa-t-paita': {
    title: "Maailman Paras Pappa – T-paidat | Huumorikauppa.fi",
    description: "Maailman Paras Pappa – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69ab20fcd959867b0506f433/38191/97992/maailman-paras-pappa-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'maailman-paras-ukki-t-paita': {
    title: "Maailman Paras Ukki – T-paidat | Huumorikauppa.fi",
    description: "Maailman Paras Ukki – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69ab22cc5ef4eca23b035184/38191/97992/maailman-paras-ukki-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'minulla-ei-ole-alkoholiongelmaa-t-paita': {
    title: "minulla ei ole alkoholiongelma – T-paidat | Huumorikauppa.fi",
    description: "Klassinen puuvillapaita, jossa teksti tuo hymyn huulille. Pehmeä kangas korostaa lämpimiä ruskeita ja hillittyjä sävyjä. Keskivahva puuvilla tuntuu heti mu",
    image: "https://images-api.printify.com/mockup/69a5cbd4067030d819064d20/38191/97992/minulla-ei-ole-alkoholiongelmaa-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'museokamaa-t-paita': {
    title: "Museokamaa – T-paidat | Huumorikauppa.fi",
    description: "Museokamaa – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a7f257f9139afd2303949e/38191/97992/museokamaa-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'oispa-kaljaa-t-paita': {
    title: "oispa kaljaa – T-paidat | Huumorikauppa.fi",
    description: "oispa kaljaa – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69ab0d264bf22e47280d77e9/38191/97992/oispa-kaljaa-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'olen-elakkeella-t-paita': {
    title: "Olen eläkkeellä – T-paidat | Huumorikauppa.fi",
    description: "Olen eläkkeellä – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a7474cdfcf29443f0f8be0/38191/97992/olen-elakkeella-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'oma-tekstikuva-t-paita': {
    title: "Oma Teksti/Kuva – T-paidat | Huumorikauppa.fi",
    description: "Haluatko täysin uniikin paidan juuri sinun tyylilläsi? Lähetä oma kuvasi tai ideasi meille sähköpostilla: info@huumoripaita.fiJos haluat oman tekstin paita",
    image: "https://images-api.printify.com/mockup/69ab561eee0d13a41b04d648/38191/97992/oma-tekstikuva-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'progress-over-perfection-t-shirt-inspirational-script-tee': {
    title: "Progress Over Perfection – T-paidat | Huumorikauppa.fi",
    description: "This relaxed-fit garment-dyed tee brings quiet confidence to everyday wear. Made from heavyweight, ring-spun cotton, it has a soft, worn-in feel from the p",
    image: "https://images-api.printify.com/mockup/6a09d4de5ad54e2a9503fbbe/73207/98445/progress-over-perfection-t-shirt-inspirational-script-tee.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'saatanan-tunarit-t-paita': {
    title: "Saatanan Tunarit – T-paidat | Huumorikauppa.fi",
    description: "Klassinen puuvillapaita, jossa hassu, käsinpiirretty hahmo ja teksti tuo hymyn huulille. Pehmeä kangas korostaa lämpimiä ruskeita ja hillittyjä sävyjä. Kes",
    image: "https://images-api.printify.com/mockup/69a495c5e2c6888b040e01b2/12100/92570/saatanan-tunarit-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'se-oli-tonnin-seteli-t-paita': {
    title: "se oli tonnin seteli. – T-paidat | Huumorikauppa.fi",
    description: "se oli tonnin seteli. – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69acb60d581a48c85001b2e4/38191/97992/se-oli-tonnin-seteli-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'slay-queen-t-paita': {
    title: "slay queen – T-paidat | Huumorikauppa.fi",
    description: "slay queen – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69e411752457f280ea0214f9/38191/97992/slay-queen-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'super-aiska-t-paita': {
    title: "Super äiskä – T-paidat | Huumorikauppa.fi",
    description: "Super äiskä – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69e40e5a9ab6f6d65e0033ff/38191/97992/super-aiska-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'tonnin-seteli-t-paita': {
    title: "Tonnin Seteli – T-paidat | Huumorikauppa.fi",
    description: "Tonnin Seteli – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69acb40b5ef4eca23b039dd6/38191/97992/tonnin-seteli-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'valmentajani-on-vaarallinen-ihminen-t-shirt-skull-and-roses-back-graphic': {
    title: "Valmentajani on vaarallinen – T-paidat | Huumorikauppa.fi",
    description: "This heavyweight garment-dyed tee carries an unapologetic edge — bold Finnish text across the chest and a vivid skull-and-roses emblem on the back. Built t",
    image: "https://images-api.printify.com/mockup/69fe5551dcc633b1360bc417/73207/98445/valmentajani-on-vaarallinen-ihminen-t-shirt-skull-and-roses-back-graphic.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'yksi-kerta-viela-text-t-shirt-back-skulls-and-roses-graphic': {
    title: "Yksi Kerta Vielä text, T-Shirt – T-paidat | Huumorikauppa.fi",
    description: "A heavyweight, garment-dyed tee with bold front text and a striking back graphic — made for people who favor statement style with a lived-in feel. The rela",
    image: "https://images-api.printify.com/mockup/69fe56d54ba2ff981a0178c1/73207/98445/yksi-kerta-viela-text-t-shirt-back-skulls-and-roses-graphic.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  '100-elakalainen-kahvikuppi': {
    title: "100% eläkäläinen – Mukit | Huumorikauppa.fi",
    description: "100% eläkäläinen – hauska muki lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 14,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69dfb8be6f80f8275f0821b2/65216/6311/100-elakalainen-kahvikuppi.jpg?camera_label=right",
    price: 14.9,
    category: "mukit",
    categoryName: "Mukit",
  },
  'audimies-kahvikuppi': {
    title: "Audimies – Mukit | Huumorikauppa.fi",
    description: "Aloita aamu anteeksi pyytelemättä tällä kaksivärisellä keraamisella mukilla. Rohkea, isot kirjaimet kiiltävällä valkoisella pinnalla, musta sisus ja kahva ",
    image: "https://images-api.printify.com/mockup/69a5d49fd1ff0c1d4f027d7d/72180/102752/audimies-kahvikuppi.jpg?camera_label=front",
    price: 14.9,
    category: "mukit",
    categoryName: "Mukit",
  },
  'bemarimies-kahvikuppi': {
    title: "Bemarimies – Mukit | Huumorikauppa.fi",
    description: "Aloita aamu anteeksi pyytelemättä tällä kaksivärisellä keraamisella mukilla. Rohkea, isot kirjaimet kiiltävällä valkoisella pinnalla, musta sisus ja kahva ",
    image: "https://images-api.printify.com/mockup/69a5d32fea19219275012fa9/72180/102752/bemarimies-kahvikuppi.jpg?camera_label=front",
    price: 14.9,
    category: "mukit",
    categoryName: "Mukit",
  },
  'ceramic-mug-11oz-15oz': {
    title: "Ceramic Mug, (11oz, 15oz) – Mukit | Huumorikauppa.fi",
    description: "Warm-up with a nice cuppa out of this customized ceramic coffee mug. Personalize it with cool designs, photos or logos to make that \"aaahhh!\" moment even b",
    image: "https://images-api.printify.com/mockup/6a09d6605ad54e2a9503fcca/65216/6310/ceramic-mug-11oz-15oz.jpg?camera_label=front",
    price: 8.21,
    category: "mukit",
    categoryName: "Mukit",
  },
  'mersumies-kahvikuppi': {
    title: "Mersumies – Mukit | Huumorikauppa.fi",
    description: "Aloita aamu anteeksi pyytelemättä tällä kaksivärisellä keraamisella mukilla. Rohkea, isot kirjaimet kiiltävällä valkoisella pinnalla, musta sisus ja kahva ",
    image: "https://images-api.printify.com/mockup/69a5d676e5d49a7da50e2670/72180/102752/mersumies-kahvikuppi.jpg?camera_label=front",
    price: 14.9,
    category: "mukit",
    categoryName: "Mukit",
  },
  'no-niin-kahvikuppi': {
    title: "No niin – Mukit | Huumorikauppa.fi",
    description: "No niin – hauska muki lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 14,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69dfb718eec838289b0364e8/65216/6311/no-niin-kahvikuppi.jpg?camera_label=right",
    price: 14.9,
    category: "mukit",
    categoryName: "Mukit",
  },
  '1995-nevo-foget-kahvikuppi': {
    title: "1995 nevö foget – Mukit | Huumorikauppa.fi",
    description: "1995 nevö foget – hauska muki lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 14,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/6a09d6605ad54e2a9503fcca/65216/6311/1995-nevo-foget-kahvikuppi.jpg?camera_label=right",
    price: 14.9,
    category: "mukit",
    categoryName: "Mukit",
  },
  'ei-perkele-kahvikuppi': {
    title: "Ei perkele – Mukit | Huumorikauppa.fi",
    description: "Ei perkele – hauska muki lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 14,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/6a09d5726c4b0feb8008119b/65216/6311/ei-perkele-kahvikuppi.jpg?camera_label=right",
    price: 14.9,
    category: "mukit",
    categoryName: "Mukit",
  },
  'ois-viisaampi-haipyy-taalt-kahvikuppi': {
    title: "Ois viisaampi häipyy täält – Mukit | Huumorikauppa.fi",
    description: "Ois viisaampi häipyy täält – hauska muki lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 14,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/6a09d5e069ddd35f850e9f0a/65216/6312/ois-viisaampi-haipyy-taalt-kahvikuppi.jpg?camera_label=left",
    price: 14.9,
    category: "mukit",
    categoryName: "Mukit",
  },
  'ois-viisaampi-haipyy-taalt-t-paita': {
    title: "Ois viisaampi häipyy täält – T-paidat | Huumorikauppa.fi",
    description: "Ois viisaampi häipyy täält – hauska t-paita lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/6a09d4de5ad54e2a9503fbbe/73207/98445/ois-viisaampi-haipyy-taalt-t-paita.jpg?camera_label=front",
    price: 24.9,
    category: "t-paidat",
    categoryName: "T-paidat",
  },
  'oma-tekstikuva-kahvikuppi': {
    title: "Oma Teksti/Kuva – Mukit | Huumorikauppa.fi",
    description: "Haluatko täysin uniikin kahvikupin juuri sinulle? Lähetä oma kuvasi tai ideasi meille sähköpostilla: info@huumoripaita.fiJos haluat oman tekstin paitaan, k",
    image: "https://images-api.printify.com/mockup/69ab5be0b360648baa01bb47/72180/102756/oma-tekstikuva-kahvikuppi.jpg?camera_label=left",
    price: 24.9,
    category: "mukit",
    categoryName: "Mukit",
  },
  'progress-over-perfection-mug-inspirational-script-ceramic-coffee-cup': {
    title: "Progress Over Perfection Mug – Mukit | Huumorikauppa.fi",
    description: "A glossy white ceramic mug that speaks to growth-minded mornings and honest hustle. The bold, black script wrapping the mug reads like a private reminder: ",
    image: "https://images-api.printify.com/mockup/6a09d5726c4b0feb8008119b/65216/6310/progress-over-perfection-mug-inspirational-script-ceramic-coffee-cup.jpg?camera_label=front",
    price: 10.99,
    category: "mukit",
    categoryName: "Mukit",
  },
  'tonnin-seteli-kahvikuppi': {
    title: "tonnin seteli – Mukit | Huumorikauppa.fi",
    description: "tonnin seteli – hauska muki lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 14,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69dfba8d2d234fca16038da6/65216/6311/tonnin-seteli-kahvikuppi.jpg?camera_label=right",
    price: 14.9,
    category: "mukit",
    categoryName: "Mukit",
  },
  'tya-ukko-kahvikuppi': {
    title: "tyä ukko – Mukit | Huumorikauppa.fi",
    description: "tyä ukko – hauska muki lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 14,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69dfb9ab85e6a15e9b04b167/65216/6311/tya-ukko-kahvikuppi.jpg?camera_label=right",
    price: 14.9,
    category: "mukit",
    categoryName: "Mukit",
  },
  'varo-myrkyllista-kahvikuppi': {
    title: "Varo myrkyllistä – Mukit | Huumorikauppa.fi",
    description: "Varo myrkyllistä – hauska muki lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 14,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69dfb4e2f9ce2c2b480cfc8f/65216/6311/varo-myrkyllista-kahvikuppi.jpg?camera_label=right",
    price: 14.9,
    category: "mukit",
    categoryName: "Mukit",
  },
  'oma-tekstikuva-tarra': {
    title: "Oma Teksti/Kuva – Tarrat | Huumorikauppa.fi",
    description: "Haluatko täysin uniikin tarran juuri sinun tyylilläsi? Lähetä oma kuvasi tai ideasi meille sähköpostilla: info@huumoripaita.fiJos haluat oman tekstin tarro",
    image: "https://images-api.printify.com/mockup/69ab5f22d9d11928ed0861e2/45747/16654/oma-tekstikuva-tarra.jpg?camera_label=front",
    price: 4.99,
    category: "tarrat",
    categoryName: "Tarrat",
  },
  '100-elakelainen-huppari': {
    title: "100% Eläkeläinen – Hupparit | Huumorikauppa.fi",
    description: "100% Eläkeläinen – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a9ca1d88d883716501244b/32912/98424/100-elakelainen-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'ala-kosketa-sahkomiesta-kun-olet-marka-huppari': {
    title: "Älä Kosketa Sähkömiestä Kun – Hupparit | Huumorikauppa.fi",
    description: "Älä Kosketa Sähkömiestä Kun Olet Märkä – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69aabecd3f15a244340fe7f7/32912/98424/ala-kosketa-sahkomiesta-kun-olet-marka-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'alkoholi-tappaa-hitaasti-huppari': {
    title: "Alkoholi tappaa hitaasti – Hupparit | Huumorikauppa.fi",
    description: "Alkoholi tappaa hitaasti – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a73c5dabab7ac5fd077023/32912/98424/alkoholi-tappaa-hitaasti-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'amatimies-huppari': {
    title: "Amatimies – Hupparit | Huumorikauppa.fi",
    description: "Amatimies – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69ab27e0d9d11928ed085814/32912/98424/amatimies-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'amatimies-huppari-0e3e76': {
    title: "Amatimies – Hupparit | Huumorikauppa.fi",
    description: "Amatimies – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a73f50c9f930f63b0e3e76/32912/98424/amatimies-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'elakelainen-huppari': {
    title: "Eläkeläinen – Hupparit | Huumorikauppa.fi",
    description: "Eläkeläinen – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a5dc5422264a158f08a3f2/32912/98424/elakelainen-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'huonokin-paiva-kalassa-on-parempi-kuin-hyva-paiva-toissa-huppari': {
    title: "Huonokin päivä kalassa on – Hupparit | Huumorikauppa.fi",
    description: "Huonokin päivä kalassa on parempi kuin hyvä päivä töissä – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69acbcc73ecc67f65e0d3458/32880/98424/huonokin-paiva-kalassa-on-parempi-kuin-hyva-paiva-toissa-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'i-my-boyfriend-huppari': {
    title: "I ❤️ My Boyfriend – Hupparit | Huumorikauppa.fi",
    description: "I ❤️ My Boyfriend – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a9c64d44b4aac87e0d99ea/32912/98424/i-my-boyfriend-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'i-my-girlfriend-huppari': {
    title: "I ❤️ My Girlfriend – Hupparit | Huumorikauppa.fi",
    description: "I ❤️ My Girlfriend – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a9c4ada3d5918a9e088a95/32912/98424/i-my-girlfriend-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'i-swedish-boys-huppari': {
    title: "I ❤️ Swedish Boys – Hupparit | Huumorikauppa.fi",
    description: "I ❤️ Swedish Boys – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69ab0b5645f0735ead09bc57/32912/98424/i-swedish-boys-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'i-swedish-girls-huppari': {
    title: "I ❤️ Swedish Girls – Hupparit | Huumorikauppa.fi",
    description: "I ❤️ Swedish Girls – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69ab0b5465fbf6bfa500e78a/32912/98424/i-swedish-girls-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'ice-aatanahuppari': {
    title: "ICE AATANA – Hupparit | Huumorikauppa.fi",
    description: "Pehmeä ja lämmin huppari hauskalla tekstillä ja kuvalla. Keskiraskas 50/50 puuvilla-polyesterikangas tuntuu mukavalta viileinä päivinä ja pitää muotonsa pi",
    image: "https://images-api.printify.com/mockup/69a485977ab6ca0074091988/32912/98424/ice-aatanahuppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'isanta-huppari': {
    title: "Isäntä – Hupparit | Huumorikauppa.fi",
    description: "Isäntä – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69ab1e37e2fffdf4eb074239/32912/98424/isanta-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'jos-iska-ei-osaa-korjata-sita-huppari': {
    title: "Jos iskä ei osaa korjata – Hupparit | Huumorikauppa.fi",
    description: "Jos iskä ei osaa korjata sitä... – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a7f5beb824e8c75004d3d0/32912/98424/jos-iska-ei-osaa-korjata-sita-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'kalju-huppari': {
    title: "Kalju – Hupparit | Huumorikauppa.fi",
    description: "Kalju – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a941dff144caf1210545dd/32912/98424/kalju-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'maailman-paras-aiti-huppari': {
    title: "maailman paras ÄITI – Hupparit | Huumorikauppa.fi",
    description: "Pehmeä ja lämmin huppari hauskalla tekstillä ja kuvalla. Keskiraskas 50/50 puuvilla-polyesterikangas tuntuu mukavalta viileinä päivinä ja pitää muotonsa pi",
    image: "https://images-api.printify.com/mockup/69a555a9cbd6c9d4db0b9a0e/32912/98424/maailman-paras-aiti-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'maailman-paras-aiti-palkinnon-voittaja-huppari': {
    title: "\"Maailman paras äiti\" – Hupparit | Huumorikauppa.fi",
    description: "\"Maailman paras äiti\" palkinnon voittaja – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69e40bf1471a01f8f504ce48/32912/98424/maailman-paras-aiti-palkinnon-voittaja-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'maailman-paras-pappa-huppari': {
    title: "Maailman Paras Pappa – Hupparit | Huumorikauppa.fi",
    description: "Maailman Paras Pappa – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69ab21fe00d4b2b4af03ba1d/32912/98424/maailman-paras-pappa-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'maailman-paras-ukki-huppari': {
    title: "Maailman Paras Ukki – Hupparit | Huumorikauppa.fi",
    description: "Maailman Paras Ukki – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69ab240fc22eeedecc029fc7/32912/98424/maailman-paras-ukki-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'minulla-ei-ole-alkoholiongelmaa-huppari': {
    title: "minulla ei ole alkoholiongelma – Hupparit | Huumorikauppa.fi",
    description: "A soft, midweight hoodie that reads like a small, dry laugh you can wear. The clean white fleece and minimal black text create a quietly bold look — the ki",
    image: "https://images-api.printify.com/mockup/69a5d0312239920f7802d75b/32912/98424/minulla-ei-ole-alkoholiongelmaa-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'museokamaa-huppari': {
    title: "Museokamaa – Hupparit | Huumorikauppa.fi",
    description: "Museokamaa – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a7f36199a8c235a2018b01/32912/98424/museokamaa-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'oispa-kaljaa-huppari': {
    title: "oispa kaljaa – Hupparit | Huumorikauppa.fi",
    description: "oispa kaljaa – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69ab0e72cef6e6104b0e2110/32912/98424/oispa-kaljaa-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'olen-elakkeella-huppari': {
    title: "Olen eläkkeellä – Hupparit | Huumorikauppa.fi",
    description: "Olen eläkkeellä – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69a7ef7eb824e8c75004d232/32912/98424/olen-elakkeella-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'oma-tekstikuva-huppari': {
    title: "Oma Teksti/Kuva – Hupparit | Huumorikauppa.fi",
    description: "Haluatko täysin uniikin paidan juuri sinun tyylilläsi? Lähetä oma kuvasi tai ideasi meille sähköpostilla: info@huumoripaita.fiJos haluat oman tekstin paita",
    image: "https://images-api.printify.com/mockup/69ab59382571c7daeb003a06/32912/98424/oma-tekstikuva-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'saatanan-tunarit-huppari': {
    title: "Saatanan Tunarit – Hupparit | Huumorikauppa.fi",
    description: "Pehmeä ja lämmin huppari hauskalla tekstillä ja kuvalla. Keskiraskas 50/50 puuvilla-polyesterikangas tuntuu mukavalta viileinä päivinä ja pitää muotonsa pi",
    image: "https://images-api.printify.com/mockup/69a1b2b9a654c3b5510b6203/32912/98424/saatanan-tunarit-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'se-oli-tonnin-seteli-huppari': {
    title: "se oli tonnin seteli. – Hupparit | Huumorikauppa.fi",
    description: "se oli tonnin seteli. – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69acb70811b15c29da02127a/32912/98424/se-oli-tonnin-seteli-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'slay-queen-huppari': {
    title: "slay queen – Hupparit | Huumorikauppa.fi",
    description: "slay queen – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69e4123ca5a43c3bd804da80/32912/98424/slay-queen-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'super-aiska-huppari': {
    title: "Super äiskä – Hupparit | Huumorikauppa.fi",
    description: "Super äiskä – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69e40ee5a5a43c3bd804d884/32912/98424/super-aiska-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'tonnin-seteli-huppari': {
    title: "Tonnin Seteli – Hupparit | Huumorikauppa.fi",
    description: "Tonnin Seteli – hauska huppari lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 49,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69acb50bd9d11928ed08a235/32912/98424/tonnin-seteli-huppari.jpg?camera_label=front",
    price: 49.9,
    category: "hupparit",
    categoryName: "Hupparit",
  },
  'oma-tekstikuva-vauvantaaperon-body': {
    title: "Oma Teksti/Kuva – Bodyt | Huumorikauppa.fi",
    description: "Oma Teksti/Kuva – hauska body lahjaksi tai itselle. Korkealaatuinen, painettu Suomessa. Hinta 24,90 €. Tilaa nyt Huumorikauppa.fi:stä.",
    image: "https://images-api.printify.com/mockup/69ab67f4d4f97cb0100740b8/70839/108571/oma-tekstikuva-vauvantaaperon-body.jpg?camera_label=front",
    price: 24.9,
    category: "bodyt",
    categoryName: "Bodyt",
  },
  'oma-tekstikuva-peitto': {
    title: "Oma Teksti/Kuva – Peitot | Huumorikauppa.fi",
    description: "Haluatko täysin uniikin peiton juuri sinun tyylilläsi? Lähetä oma kuvasi tai ideasi meille sähköpostilla: info@huumorikauppa.fiJos haluat oman tekstin peit",
    image: "https://images-api.printify.com/mockup/69ab65909fe8d9aff8072a3a/68322/8862/oma-tekstikuva-peitto.jpg?camera_label=front",
    price: 34.9,
    category: "peitot",
    categoryName: "Peitot",
  },
  'oma-tekstikuva-lippis': {
    title: "Oma Teksti/Kuva – Pipot | Huumorikauppa.fi",
    description: "Haluatko täysin uniikin lippiksen juuri sinun tyylilläsi? Lähetä oma kuvasi tai ideasi meille sähköpostilla: info@huumorikauppa.fiJos haluat oman tekstin l",
    image: "https://images-api.printify.com/mockup/69ab629a373eb1c66b018506/105381/102307/oma-tekstikuva-lippis.jpg?camera_label=front",
    price: 39.9,
    category: "pipot",
    categoryName: "Pipot",
  },
  'oma-tekstikuva-seinataulu': {
    title: "Oma Teksti/Kuva – Seinätaulut | Huumorikauppa.fi",
    description: "Haluatko täysin uniikin taulun juuri sinun tyylilläsi? Lähetä oma kuvasi tai ideasi meille sähköpostilla: info@huumoripaita.fiJos haluat oman tekstin taulu",
    image: "https://images-api.printify.com/mockup/69ab5d2b979ac0562e002ded/91624/60162/oma-tekstikuva-seinataulu.jpg?camera_label=front",
    price: 39.9,
    category: "seinataulut",
    categoryName: "Seinätaulut",
  },
  'oma-tekstikuva-pitkahihainen': {
    title: "Oma teksti/Kuva – Pitkähihaiset | Huumorikauppa.fi",
    description: "Haluatko täysin uniikin paidan juuri sinun tyylilläsi? Lähetä oma kuvasi tai ideasi meille sähköpostilla: info@huumoripaita.fiJos haluat oman tekstin paita",
    image: "https://images-api.printify.com/mockup/69ab5a4f65fbf6bfa500f3b1/25458/98502/oma-tekstikuva-pitkahihainen.jpg?camera_label=front",
    price: 39.9,
    category: "pitkahihaiset",
    categoryName: "Pitkähihaiset",
  },
  'oma-tekstikuva-koriste': {
    title: "Oma Teksti/Kuva – Koristeet | Huumorikauppa.fi",
    description: "Haluatko täysin uniikin koristeen juuri sinun tyylilläsi? Lähetä oma kuvasi tai ideasi meille sähköpostilla: info@huumoripaita.fiJos haluat oman tekstin ko",
    image: "https://images-api.printify.com/mockup/69ab64c3b360648baa01bc9d/112959/110283/oma-tekstikuva-koriste.jpg?camera_label=front",
    price: 19.9,
    category: "koristeet",
    categoryName: "Koristeet",
  },
};

const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'Hauskat lahjat ja huumorituotteet | Huumorikauppa.fi',
    description: 'Suomen hauskin verkkokauppa – t-paitoja, huppareita, mukeja ja tarroja hauskalla tekstillä. Yli 200 tuotetta, nopea toimitus, ilmainen yli 60 €.',
  },
  '/kaikki-tuotteet': {
    title: 'Kaikki hauskat tuotteet | Huumorikauppa.fi',
    description: 'Selaa kaikki hauskat tuotteet: t-paidat, hupparit, mukit, tarrat, bodyt ja paljon muuta. Löydä täydellinen hauska lahja!',
  },
  '/blogi': {
    title: 'Blogi – Lahjaideat ja vinkit | Huumorikauppa.fi',
    description: 'Lahjaideoita, hauskan ostajan oppaita ja inspiraatiota jokaiseen tilaisuuteen. Löydä paras hauska lahja blogin avulla.',
  },
  '/yhteystiedot': {
    title: 'Yhteystiedot | Huumorikauppa.fi',
    description: 'Ota yhteyttä Huumorikauppaan. Vastaamme nopeasti asiakaspalvelukysymyksiin.',
  },
  '/tietoa-meista': {
    title: 'Tietoa meistä | Huumorikauppa.fi',
    description: 'Huumorikauppa on suomalainen verkkokauppa hauskoille lahjoille ja huumorituotteille. Hauskat t-paidat, hupparit, mukit ja tarrat.',
  },
  '/usein-kysytyt-kysymykset': {
    title: 'Usein kysytyt kysymykset | Huumorikauppa.fi',
    description: 'Vastaukset yleisimpiin kysymyksiin toimituksesta, palautusoikeudesta, koosta ja tilaamisesta.',
  },
  '/toimitusehdot': {
    title: 'Toimitusehdot | Huumorikauppa.fi',
    description: 'Huumorikaupan toimitusehdot. Toimitus 3–10 arkipäivässä, ilmainen toimitus yli 60 € tilauksiin.',
  },
  '/palautusehdot': {
    title: 'Palautusehdot | Huumorikauppa.fi',
    description: 'Huumorikaupan palautusehdot ja -ohjeet. 14 päivän palautusoikeus kaikille tuotteille.',
  },
  '/tietosuojakaytanto': {
    title: 'Tietosuojakäytäntö | Huumorikauppa.fi',
    description: 'Huumorikaupan tietosuojakäytäntö ja henkilötietojen käsittely.',
  },
  '/saavutettavuusseloste': {
    title: 'Saavutettavuusseloste | Huumorikauppa.fi',
    description: 'Huumorikaupan saavutettavuusseloste.',
  },
  // Gift category pages — existing
  '/hauskat-lahjat-miehelle': {
    title: 'Hauskat lahjat miehelle – Parhaat ideat | Huumorikauppa.fi',
    description: 'Hauskat lahjat miehelle – Ideat joita hän ei odota! T-paidat, mukit ja paljon muuta. Nopea toimitus koko Suomeen.',
  },
  '/hauskat-lahjat-naiselle': {
    title: 'Hauskat lahjat naiselle – Ideat joita hän ei odota | Huumorikauppa.fi',
    description: 'Hauskat lahjat naiselle – Persoonalliset ideat kaikille naisille. T-paidat, mukit, tarrat. Nopea toimitus.',
  },
  '/polttari-lahjat': {
    title: 'Polttarilahjat – Hauskat ideat morsiamelle ja sulhaselle | Huumorikauppa.fi',
    description: 'Parhaat polttarilahjat morsiamelle ja sulhaselle! Hauskat ja muistamattomat ideat. Toimitus nopeasti.',
  },
  '/isanpaiva-lahjat': {
    title: 'Isänpäivälahjat – 20 hauskaa lahjaa isälle | Huumorikauppa.fi',
    description: 'Mitä antaa isälle? 20+ hauskaa ideaa isänpäivään. T-paidat, mukit ja paljon muuta. Tilaa nyt!',
  },
  '/aitienpaiva-lahjat': {
    title: 'Äitienpäivälahjat – Hauskat lahjat äidille | Huumorikauppa.fi',
    description: 'Hae inspiraatiota äitienpäivälahjaan! Hauskat ideat äidille. Tilaa helposti verkosta.',
  },
  '/joululahjat': {
    title: 'Joululahjat 2026 – Parhaat hauskat ideat | Huumorikauppa.fi',
    description: 'Parhaat joululahjat 2026! Hauskat ja yllättävät ideat koko perheelle. Osta ajoissa – nopea toimitus.',
  },
  '/syntymapaivaLahjat': {
    title: 'Syntymäpäivälahjat – Hauskat ja unohtumattomat ideat | Huumorikauppa.fi',
    description: 'Hauska syntymäpäivälahja? Löydä täydellinen idea kaikille. Nopea toimitus koko Suomeen.',
  },
  '/elakelahjat': {
    title: 'Eläkeläislahjat – Hauskat muistot eläkkeelle siirtyvälle | Huumorikauppa.fi',
    description: 'Eläkeläislahja joka muistetaan! Parhaat hauskat ideat eläkkeelle jäävälle. Tilaa verkosta helposti.',
  },
  '/lahja-kaverille': {
    title: 'Hauska lahja kaverille – Parhaat ideat | Huumorikauppa.fi',
    description: 'Hauska lahja kaverille – 15+ ideaa jotka varmasti toimii. Nopea toimitus koko Suomeen.',
  },
  '/lahja-tyokaverille': {
    title: 'Lahjat työkavereille – Hauskat toimistolahjat | Huumorikauppa.fi',
    description: 'Hauska toimistolahja työkavereille – Ideat, jotka saavat kaikki nauramaan. Tilaa nyt!',
  },
  // Gift category pages — new keyword routes (Phase 0)
  '/hauskat-t-paidat': {
    title: 'Hauskat T-paidat – Suomen parhaat huumoripaidat | Huumorikauppa.fi',
    description: 'Hauskat t-paidat lahjaksi tai itselle. Huumoripaitoja kalamiehille, isille, äijille ja kaikille hauskan ystäville. Tilaa nyt.',
  },
  '/hauskat-hupparit': {
    title: 'Hauskat Hupparit – Huumorihuppareita Suomessa | Huumorikauppa.fi',
    description: 'Hauskat hupparit lahjaksi tai itselle. Lämpimiä huumorihuppareita ammattihuumorilla. Painettu Suomessa, nopea toimitus.',
  },
  '/lahja-miehelle': {
    title: 'Lahja Miehelle – Hauskat lahjaideat | Huumorikauppa.fi',
    description: 'Hauska lahja miehelle — isälle, ukille, kaverille tai puolisolle. Huumoripaidat ja -hupparit ammattihuumorilla. Tilaa Huumorikauppa.fi:stä.',
  },
  '/syntymapaivalahjat': {
    title: 'Syntymäpäivälahjat – Hauskat synttärilahjat | Huumorikauppa.fi',
    description: 'Hauskat syntymäpäivälahjat kaikkiin ikiin. Huumorituotteita pyöreille vuosille ja arkisille synttäreille. Tilaa Huumorikauppa.fi:stä.',
  },
  // Special content pages
  '/suomalaiset-tyopaikkameemit-top-50': {
    title: 'Suomalaiset Työpaikkameemit Top 50 – 2026 | Huumorikauppa.fi',
    description: 'Parhaat suomalaiset työpaikkameemit koottuna! 50 hauskinta toimistomeemin kokoelma. Tunnista oma työpaikkasi!',
  },
  '/hauskimmat-tyopaikkalaput-2026': {
    title: 'Hauskimmat Työpaikkalaput 2026 | Huumorikauppa.fi',
    description: 'Hauskimmat toimistoon jätetyt laput 2026 – 30 parasta suomalaista työpaikkahuumoria. Kerää talteen!',
  },
  // Category pages
  '/kategoria/t-paidat': {
    title: 'Hauskat T-paidat – Huumoripaidat | Huumorikauppa.fi',
    description: 'Hauskat t-paidat lahjaksi isälle, kaverille tai äidille. Yli 100 mallia, koot XS–3XL. Nopea toimitus koko Suomeen.',
  },
  '/kategoria/hupparit': {
    title: 'Hauskat Hupparit – Huumorihupparit | Huumorikauppa.fi',
    description: 'Hauskat hupparit lahjaksi tai itsellesi. Pehmeät, lämpimät ja hauskat – tilaa helposti verkosta.',
  },
  '/kategoria/pitkahihaiset': {
    title: 'Hauskat pitkähihaiset paidat | Huumorikauppa.fi',
    description: 'Hauskat pitkähihaiset paidat huumorilla ja asenteella. Täydellinen valinta viileisiin päiviin. Ilmainen toimitus yli 60 €.',
  },
  '/kategoria/mukit': {
    title: 'Hauskat Mukit ja Kahvikupit – Huumorimukit lahjaksi | Huumorikauppa.fi',
    description: 'Hauskat kahvikupit ja mukit lahjaksi tai omaan käyttöön. Huumorimukit ammattihuumorilla, setäteemalla ja sarkasmilla. Nopea toimitus koko Suomeen.',
  },
  '/kategoria/tarrat': {
    title: 'Hauskat Tarrat – Huumoritarrat | Huumorikauppa.fi',
    description: 'Hauskat tarrat läppäriin, vesipulloon ja autoon. Edullinen lisä lahjaksi – alle 10 €. Nopea toimitus koko Suomeen.',
  },
  '/kategoria/bodyt': {
    title: 'Hauskat vauvan bodyt – Vauvalahjat | Huumorikauppa.fi',
    description: 'Hauskat bodyt pienimmille! Täydellinen vauvalahja. Pehmeä materiaali, turvallinen. Nopea toimitus.',
  },
  '/kategoria/peitot': {
    title: 'Hauskat peitot – Huumoripeitot | Huumorikauppa.fi',
    description: 'Hauska peitto lahjaksi tai itselle! Laadukas ja hauska – pitää lämpimänä ja hymyilyttää. Tilaa nyt.',
  },
  '/kategoria/pipot': {
    title: 'Hauskat pipot – Humoristiset päähineet | Huumorikauppa.fi',
    description: 'Hauskat pipot kaikkiin seikkailuihin! Lämmin ja hauska – paras talvilahja kaverille tai itselle.',
  },
  '/kategoria/laukut': {
    title: 'Hauskat laukut ja kangaskassit | Huumorikauppa.fi',
    description: 'Hauskat laukut ja kangaskassit suomalaisella huumorilla. Arkikäyttöön tai lahjaksi. Tilaa helposti!',
  },
  '/kategoria/seinataulut': {
    title: 'Hauskat seinätaulut – Huumorisisustus | Huumorikauppa.fi',
    description: 'Hauskat seinätaulut kodin sisustukseen! Piristä seinät suomalaisella huumorilla. Nopea toimitus koko Suomeen.',
  },
  '/kategoria/koristeet': {
    title: 'Hauskat koristeet kotiin | Huumorikauppa.fi',
    description: 'Hauskat koristeet kotiin – Huumoria joka nurkkaan. Lahjana tai itselle. Nopea toimitus.',
  },
  '/aitienpaiva': {
    title: 'Äitienpäivälahjat 2026 – Hauskat ideat äidille | Huumorikauppa.fi',
    description: 'Parhaat hauskat äitienpäivälahjat! T-paidat, mukit ja hupparit äidille. Nopea toimitus koko Suomeen.',
  },
  // New categories — Phase 1
  '/kategoria/haalarimerkit': {
    title: 'Haalarimerkit – Opiskelijan haalarimerkit | Huumorikauppa.fi',
    description: 'Hauskat haalarimerkit opiskelijoille. Räätälöitäviä ja valmiita merkkejä — sopivat haalareille, repuille ja jakkareille. Tilaa nyt.',
  },
  '/kategoria/lippikset': {
    title: 'Hauskat Lippikset – Huumorilippikset | Huumorikauppa.fi',
    description: 'Hauskat lippikset huumorin ystäville. Räätälöitäviä lippiksiä ja valmiita malleja. Tilaa nyt Huumorikauppa.fi:stä.',
  },
  '/haalarimerkit': {
    title: 'Haalarimerkit Opiskelijalle – Hauskat merkit haalareihin | Huumorikauppa.fi',
    description: 'Haalarimerkit opiskelijoille — räätälöitäviä ja valmiita malleja. Toimitamme nopeasti Suomeen. Tilaa Huumorikauppa.fi:stä.',
  },
  '/opiskelijan-haalarimerkit': {
    title: 'Opiskelijan haalarimerkit – Hauskat merkit | Huumorikauppa.fi',
    description: 'Opiskelijan haalarimerkit kaikille kiltojen ja ainejärjestöjen jäsenille. Räätälöitävät merkit ja valmiit mallit.',
  },
};

// Blog post metadata (slug without /blogi/ prefix)
const BLOG_META: Record<string, PageMeta> = {
  '20-hauskinta-t-paitaa-2026': {
    title: '20 Hauskinta T-paitaa 2026 – Parhaat Valinnat | Huumorikauppa.fi',
    description: 'Etsitkö hauskaa t-paitaa? Listasimme 20 parasta huumori-t-paitaa 2026! Kaikille sopivat koot. Tilaa nyt, nopea toimitus.',
  },
  'hauskat-lahjat-miehelle-naiselle-syntymapaivaLahjat': {
    title: 'Hauskat Syntymäpäivälahjat – Ideat Miehelle ja Naiselle | Huumorikauppa.fi',
    description: 'Etsitkö hauskaa syntymäpäivälahjaa? Parhaat ideat miehelle ja naiselle! Nopea toimitus koko Suomeen.',
  },
  'hauskat-mukit-toimistoon-ja-lahjaksi': {
    title: 'Hauskat Mukit Toimistoon ja Lahjaksi – 15 Parasta | Huumorikauppa.fi',
    description: 'Parhaat hauskat mukit töihin, kotiin tai lahjaksi! Löydä täydellinen muki suomalaisella huumorilla. Tilaa nyt.',
  },
  'parhaat-polttaripaidat-ja-polttarilahjat-2026': {
    title: 'Parhaat Polttarilahjat 2026 – Hauskat Ideat | Huumorikauppa.fi',
    description: 'Parhaat polttarilahjat morsiamelle ja sulhaselle 2026! Hauskat paidat, mukit ja paljon muuta. Nopea toimitus.',
  },
  'parhaat-joululahjat-ja-pikkujoululahjat-2026': {
    title: 'Parhaat Joululahjat 2026 – Hauskat Ideat Koko Perheelle | Huumorikauppa.fi',
    description: 'Parhaat joululahjaideat 2026! Hauskat ja yllättävät lahjat koko perheelle. Osta ajoissa – nopea toimitus.',
  },
  'parhaat-hauskat-lahjat-miehelle': {
    title: 'Parhaat Hauskat Lahjat Miehelle – 25 Ideaa | Huumorikauppa.fi',
    description: 'Etsitkö hauskaa lahjaa miehelle? 25+ parasta ideaa kaiken ikäisille miehille! Nopea toimitus.',
  },
  'hauskat-lahjat-naiselle-opas': {
    title: 'Hauskat Lahjat Naiselle – Ideat Joita Hän Ei Odota | Huumorikauppa.fi',
    description: 'Hauskat lahjat naiselle! Persoonalliset ja hauskat ideat kaikille naisille. Nopea toimitus koko Suomeen.',
  },
  'mita-antaa-50-vuotiaalle-jolla-on-jo-kaikkea': {
    title: 'Mitä Antaa 50-Vuotiaalle Jolla On Jo Kaikkea? | Huumorikauppa.fi',
    description: '50-vuotiaan lahja on aina hankala! Meillä on ratkaisut – hauskat ja persoonalliset lahjat 50v täyttävälle.',
  },
  'hauskat-isanpaivalahjat-opas': {
    title: 'Hauskat Isänpäivälahjat – Opas Parhaaseen Lahjaan | Huumorikauppa.fi',
    description: 'Mitä antaa isälle isänpäiväksi? Parhaat hauskat ideat kaikenlaisille isille. Nopea toimitus.',
  },
  'hauska-aitienpaivalahja-opas': {
    title: 'Hauska Äitienpäivälahjat – Opas Lahjaan Joka Yllättää | Huumorikauppa.fi',
    description: 'Parhaat hauskat äitienpäivälahjat! Ideat jotka äiti muistaa. Nopea toimitus koko Suomeen.',
  },
  'hauskat-elakelahjat-opas': {
    title: 'Hauskat Eläkeläislahjat – Parhaat Ideat Eläkkeelle Siirtyvälle | Huumorikauppa.fi',
    description: 'Eläkeläislahja joka muistetaan! Parhaat hauskat ideat eläkkeelle jäävälle. Tilaa verkosta helposti.',
  },
  'parhaat-hauskat-tarrat-lappariin': {
    title: 'Parhaat Hauskat Tarrat Läppäriin ja Muualle | Huumorikauppa.fi',
    description: 'Hauskat tarrat läppäriin, puhelimeen, auton takalasiin tai seinälle! Laadukkaat suomalaiset huumoritarrat.',
  },
  'hauska-vauvalahja-parhaat-bodyt': {
    title: 'Hauska Vauvalahja – Parhaat Bodyt ja Muut Ideat | Huumorikauppa.fi',
    description: 'Parhaat hauskat vauvalahjavinkit! Hauska body on täydellinen lahja uudelle perheelle. Tilaa nyt.',
  },
  'parhaat-meemituotteet-2025': {
    title: 'Parhaat Meemituotteet 2025 – Hauskat Meemin Inspiroimat Lahjat | Huumorikauppa.fi',
    description: 'Meemit ja hauskat lahjat – paras yhdistelmä! Löydä parhaat meemituotteet 2025. Tilaa helposti.',
  },
  'hauskat-seinataulut-sisusta-huumorilla': {
    title: 'Hauskat Seinätaulut – Sisusta Koti Huumorilla | Huumorikauppa.fi',
    description: 'Hauskat seinätaulut kodin sisustukseen! Piristä seinät suomalaisella huumorilla. Nopea toimitus.',
  },
  'miksi-hauska-paita-paras-lahja': {
    title: 'Miksi Hauska T-paita On Paras Lahja? – Syyt Selitetty | Huumorikauppa.fi',
    description: 'Hauska t-paita lahjaksi – miksi se toimii aina? Lue parhaat syyt ja vinkit oikean paidan valintaan.',
  },
  'lahja-miehelle-30v-40v-50v-60v': {
    title: 'Lahja Miehelle 30v, 40v, 50v tai 60v – Hauskat Ideat | Huumorikauppa.fi',
    description: 'Miehen pyöreä syntymäpäivä tulossa? Löydä täydellinen hauska lahja 30-, 40-, 50- tai 60-vuotiaalle!',
  },
  'lahja-naiselle-30v-40v-50v-60v': {
    title: 'Lahja Naiselle 30v, 40v, 50v tai 60v – Hauskat Ideat | Huumorikauppa.fi',
    description: 'Naisen pyöreä syntymäpäivä? Hauskat ja persoonalliset lahjaideat 30-, 40-, 50- ja 60-vuotiaalle naiselle!',
  },
  'hauskat-syntymapaivaLahjat-opas': {
    title: 'Hauskat Syntymäpäivälahjat – Täydellinen Opas 2025 | Huumorikauppa.fi',
    description: 'Parhaat hauskat syntymäpäivälahjat 2025! Ideat kaikille – miehelle, naiselle, lapselle. Nopea toimitus.',
  },
  'lahja-henkilolle-jolla-on-jo-kaikkea': {
    title: 'Lahja Henkilölle Jolla On Jo Kaikkea – 20 Ideaa | Huumorikauppa.fi',
    description: 'Kaverilla tai sukulaisella jo kaikki? Meillä on ratkaisut! 20 hauskaa lahjaa henkilölle jolla on jo kaikkea.',
  },
  'hauskat-lahjat-tyokavereille-opas': {
    title: 'Hauskat Lahjat Työkavereille – Toimistolahjat Jotka Toimii | Huumorikauppa.fi',
    description: 'Parhaat hauskat lahjat työkavereille! Toimistolahjat jotka saavat kaikki nauramaan. Tilaa nyt.',
  },
  'hauska-lahja-kalastajalle': {
    title: 'Hauska Lahja Kalastajalle – Parhaat Ideat Kalamiehenlahjaan | Huumorikauppa.fi',
    description: 'Etsitkö hauskaa lahjaa kalastajalle? Löydä parhaat ideat – t-paidat, mukit ja muut hauskuudet!',
  },
  'hauska-lahja-alle-20-euroa': {
    title: 'Hauska Lahja Alle 20 Euroa – Parhaat Edulliset Ideat | Huumorikauppa.fi',
    description: 'Parhaat hauskat lahjat alle 20 €! Edullisia ja hauskoja ideoita kaikkiin tilaisuuksiin. Nopea toimitus.',
  },
  'hauska-lahja-saunojalle': {
    title: 'Hauska Lahja Saunojalle – Parhaat Saunavinkit | Huumorikauppa.fi',
    description: 'Lahja saunojalle? Me tiedämme mitä suomalaiset saunojat haluavat! Hauskat lahjat saunan ystäville.',
  },
  'hauska-lahja-nortille-ja-gamerille': {
    title: 'Hauska Lahja Nortille ja Gamerille – Ideat Jotka Osuvat | Huumorikauppa.fi',
    description: 'Hauska lahja nortille tai gamerille? Löydä parhaat ideat – t-paidat, mukit ja muut geeklahjat!',
  },
  'hauskat-valmistujaislahjat': {
    title: 'Hauskat Valmistujaislahjat – Ideat Ylioppilaalle ja Opiskelijalle | Huumorikauppa.fi',
    description: 'Parhaat hauskat valmistujaislahjat 2026! Ideat ylioppilaalle, opiskelijalle ja ammattilaiselle. Tilaa nyt.',
  },
  'hauskat-pipot-suomi': {
    title: 'Hauskat Pipot – Löydä Paras Humoristinen Pipo | Huumorikauppa.fi',
    description: 'Hauskat pipot suomalaisella huumorilla! Lämmin ja hauska pipo lahjaksi tai itselle. Tilaa nyt.',
  },
  'hauskat-peitot-lahjaksi': {
    title: 'Hauska Peitto Lahjaksi – Parhaat Huumoripeittoideat | Huumorikauppa.fi',
    description: 'Hauska peitto lahjaksi! Laadukas ja hauska peitto – pitää lämpimänä ja hymyilyttää. Tilaa nyt.',
  },
  'hauska-lahja-opettajalle': {
    title: 'Hauska Lahja Opettajalle – Parhaat Opettajanlahjavinkit | Huumorikauppa.fi',
    description: 'Opettajanlahja joka muistetaan! Parhaat hauskat ideat opettajalle. Nopea toimitus.',
  },
  'hauska-lahja-urheilijalle': {
    title: 'Hauska Lahja Urheilijalle – Parhaat Liikuntalahjaideat | Huumorikauppa.fi',
    description: 'Etsitkö hauskaa lahjaa urheilijalle? Parhaat hauskat lahjaideat kuntosali- ja juoksuharrastajille.',
  },
  'hauskat-laukut-kangaskassit': {
    title: 'Hauskat Laukut ja Kangaskassit – Parhaat Valinnat | Huumorikauppa.fi',
    description: 'Hauskat kangaskassit ja laukut suomalaisella huumorilla! Ekologinen ja hauska – erinomainen lahja.',
  },
  'hauskat-lahjat-koiraihmiselle': {
    title: 'Hauska Lahja Koiraihmiselle – Ideat Koiraharrastajalle | Huumorikauppa.fi',
    description: 'Lahja koiran omistajalle? Parhaat hauskat ideat kaikille koiraihmisille! Nopea toimitus.',
  },
  'hauskat-lahjat-kissaihmiselle': {
    title: 'Hauska Lahja Kissaihmiselle – Ideat Kissan Omistajalle | Huumorikauppa.fi',
    description: 'Parhaat hauskat lahjat kissaihmiselle! T-paidat, mukit ja muut kissakeskeiset hauskuudet.',
  },
  'hauskat-valmistujaislahjat-2026': {
    title: 'Hauskat Valmistujaislahjat 2026 – Ylioppilas ja AMK | Huumorikauppa.fi',
    description: 'Parhaat hauskat valmistujaislahjat 2026! Ideat ylioppilaalle, AMK:sta valmistuvalle ja maisterille. Nopea toimitus.',
  },
  'hauska-lahja-juhannukseen-2026': {
    title: 'Hauska Lahja Juhannukseen 2026 – Parhaat Mökkimukit ja Saunapaidat | Huumorikauppa.fi',
    description: 'Parhaat hauskat juhannuslahjat 2026! Mökkimukit, saunapaidat ja tarrat koko juhannusseurueelle. Tilaa ennen 19.6.',
  },
  'hauskat-lahjat-alle-30-euroa': {
    title: 'Hauskat Lahjat Alle 30 Euroa – Top 10 Edullista Ideaa | Huumorikauppa.fi',
    description: 'Top 10 hauskaa lahjaa alle 30 €! Edulliset mutta laadukkaat lahjaideat kaikkiin tilaisuuksiin. Nopea toimitus.',
  },
};

// Category slug → display name
const CATEGORY_NAMES: Record<string, string> = {
  't-paidat': 'T-paidat', 'hupparit': 'Hupparit', 'mukit': 'Mukit',
  'tarrat': 'Tarrat', 'pipot': 'Pipot', 'lippikset': 'Lippikset',
  'haalarimerkit': 'Haalarimerkit', 'bodyt': 'Bodyt', 'peitot': 'Peitot',
  'laukut': 'Laukut', 'seinataulut': 'Seinätaulut', 'koristeet': 'Koristeet',
  'pitkahihaiset': 'Pitkähihaiset',
};

// Gift page path → categories to show products from
const GIFT_CATEGORY_CATS: Record<string, string[]> = {
  '/hauskat-lahjat-miehelle': ['t-paidat', 'hupparit', 'mukit'],
  '/hauskat-lahjat-naiselle': ['t-paidat', 'hupparit', 'mukit'],
  '/hauskat-t-paidat':        ['t-paidat'],
  '/hauskat-hupparit':        ['hupparit'],
  '/lahja-miehelle':          ['t-paidat', 'hupparit', 'mukit'],
  '/isanpaiva-lahjat':        ['t-paidat', 'hupparit', 'mukit'],
  '/joululahjat':             ['t-paidat', 'hupparit', 'mukit'],
  '/syntymapaivalahjat':      ['t-paidat', 'hupparit', 'mukit'],
  '/syntymapaivaLahjat':      ['t-paidat', 'hupparit', 'mukit'],
  '/elakelahjat':             ['t-paidat', 'hupparit', 'mukit'],
  '/polttari-lahjat':         ['t-paidat', 'hupparit'],
  '/lahja-kaverille':         ['t-paidat', 'hupparit', 'mukit'],
  '/lahja-tyokaverille':      ['mukit', 'tarrat', 'pipot'],
  '/haalarimerkit':           ['haalarimerkit'],
  '/opiskelijan-haalarimerkit': ['haalarimerkit'],
};

// Build category → products lookup from PRODUCT_META at module init
const CATEGORY_PRODUCTS: Record<string, Array<{slug: string; name: string; image: string; price: number}>> = {};
for (const [slug, pm] of Object.entries(PRODUCT_META)) {
  if (!CATEGORY_PRODUCTS[pm.category]) CATEGORY_PRODUCTS[pm.category] = [];
  CATEGORY_PRODUCTS[pm.category].push({
    slug,
    name: pm.title.replace(/ – [^|]+ \| Huumorikauppa\.fi$/, '').replace(/ \| Huumorikauppa\.fi$/, ''),
    image: pm.image,
    price: pm.price,
  });
}

// FAQ data for category pages (mirrors CATEGORY_FAQS in src/data/faq-data.ts)
const CATEGORY_FAQS: Record<string, Array<{q: string; a: string}>> = {
  't-paidat': [
    { q: "Mistä materiaalista hauskat t-paidat on tehty?", a: "T-paitamme ovat 100 % puuvillaa tai puuvilla-polyesteri-sekoitteita. Materiaali on pehmeä ihoa vasten ja kestää useita pesuja muuttumatta. Koot XS–3XL." },
    { q: "Onko t-paidat painettu Suomessa?", a: "Kyllä, kaikki t-paitamme painetaan Suomessa tai EU:ssa tilauksesta DTG-tekniikalla (Direct-to-Garment), joka tuottaa kirkkaan ja kestävän painatuksen." },
    { q: "Kuinka nopeasti tilaus toimitetaan?", a: "Tilaukset toimitetaan 3–7 arkipäivässä koko Suomeen PostNordin kautta. Ilmainen toimitus yli 60 € tilauksiin. Saat sähköpostiisi seurantakoodin heti kun paketti lähtee." },
    { q: "Voiko t-paidan palauttaa?", a: "Kyllä, standardituotteilla on 14 päivän palautusoikeus. Palautus on helppo — ota yhteyttä asiakaspalveluumme, saat ohjeet sähköpostitse." },
  ],
  'hupparit': [
    { q: "Minkälaisesta materiaalista hauskat hupparit ovat?", a: "Hupparimme ovat pehmeää puuvilla-polyesteri-sekoitetta (80/20). Materiaali on lämmin, pehmeä ja kestää useita pesuja. Koot S–3XL." },
    { q: "Onko hupparit painettu Suomessa?", a: "Kyllä, kaikki hupparimme painetaan Suomessa tai EU:ssa tilauksesta DTG-tekniikalla." },
    { q: "Kuinka nopeasti huppari toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää koko Suomeen. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Voiko hupparin palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme saadaksesi palautusohjeet." },
  ],
  'mukit': [
    { q: "Onko mukit konepesun kestäviä?", a: "Kyllä, kaikki mukimme kestävät konepesua. Suosittelemme pesemään matalalla lämpötilalla (40°C) painatuksen säilymiseksi pidempään." },
    { q: "Minkä kokoisia mukit ovat?", a: "Mukimme ovat standardi 11 oz (noin 325 ml) -kokoisia. Sopivat aamukahviin tai teehen." },
    { q: "Kuinka nopeasti muki toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Voiko mukin palauttaa?", a: "Kyllä, 14 päivän palautusoikeus kaikille tuotteille. Ota yhteyttä asiakaspalveluumme." },
  ],
  'tarrat': [
    { q: "Onko tarrat ulkokäyttöön sopivia?", a: "Kyllä, tarramme ovat laadukasta vinyyliä joka kestää kosteutta, UV-valoa ja lämpötilavaihteluita. Sopivat autoon, vesipulloon, läppäriin ja ulkokäyttöön." },
    { q: "Kuinka kauan tarrat kestävät?", a: "Ulkokäytössä laadukkaiden tarramme elinikä on 2–5 vuotta olosuhteista riippuen. Sisäkäytössä huomattavasti pidempään." },
    { q: "Kuinka nopeasti tarrat toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Voiko tarrat palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  'pipot': [
    { q: "Minkälaisesta materiaalista pipot ovat?", a: "Pipomme ovat pehmeää akryyli-materiaalia, joka on lämmin, joustava ja helppohoitoinen. Brodeeraus kestää pesua." },
    { q: "Sopiiko pipo lahjaksi?", a: "Ehdottomasti! Hauska pipo on loistava joululahja, syntymäpäivälahja tai pikkujoululahja työkavereille." },
    { q: "Kuinka nopeasti pipo toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Voiko pipon palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  'lippikset': [
    { q: "Minkälaisesta materiaalista lippikset ovat?", a: "Lippiksemme ovat laadukkaasta puuvilla- tai polyesteri-materiaalista. Brodeeraus on kestävä ja pysyy siistinä." },
    { q: "Sopiiko lippis lahjaksi?", a: "Kyllä, hauska lippis on erinomainen lahja erityisesti kesällä. Sopii syntymäpäiviin, polttareihin ja muihin juhliin." },
    { q: "Kuinka nopeasti lippis toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Voiko lippiksen palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  'haalarimerkit': [
    { q: "Sopivatko haalarimerkit kaikille haalareille?", a: "Kyllä, haalarimerkkimme sopivat kaikkiin haalareihin, laukkuihin ja reppuihin. Kiinnitys tapahtuu turvallisesti neulalla." },
    { q: "Voiko haalarimerkkejä tilata omalla tekstillä?", a: "Kyllä, tarjoamme myös räätälöityjä haalarimerkkejä. Ota yhteyttä asiakaspalveluumme tilausta varten." },
    { q: "Kuinka nopeasti haalarimerkit toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Sopivatko haalarimerkit lahjaksi?", a: "Ehdottomasti! Haalarimerkit ovat loistava lahja opiskelijalle kiltajuhliin tai tupaantuliaisiin." },
  ],
};

// Gift page path → FAQ entries
const GIFT_FAQS: Record<string, Array<{q: string; a: string}>> = {
  '/hauskat-lahjat-miehelle': [
    { q: "Mikä on paras hauska lahja miehelle?", a: "Suosituimpia hauskoja lahjoja miehelle ovat huumoripaita, -huppari tai -muki joka liittyy hänen harrastukseensa tai ammattiinsa. Suosituimpia ovat kalamies-, ammattimies- ja Mersumies-teemat." },
    { q: "Sopiiko huumoripaita lahjaksi 50-vuotiaalle miehelle?", a: "'100 % eläkeläinen' ja 'Museo-kappale' -teemat ovat erityisen suosittuja 50-vuotiaiden lahjoina. Myös ammattihuumoriaiheet toimivat hyvin." },
    { q: "Miten valitsen oikean koon lahjaksi?", a: "L on miesten yleisin koko. Kokoopas löytyy jokaisen tuotteen sivulta. Epävarma? Valitse XL — löysä istuvuus on turvallisempi kuin liian pieni." },
    { q: "Voiko tuotteen paketoida lahjapakettiin?", a: "Tällä hetkellä emme tarjoa lahjapakettia, mutta tilausvahvistus toimii mukavana lahjasaatteena digitaalisesti." },
  ],
  '/hauskat-lahjat-naiselle': [
    { q: "Mikä on paras hauska lahja naiselle?", a: "Suosituimpia lahjoja naiselle ovat 'Maailman paras äiti' -hupparit, hauskat kahvimukit ja söpöt huumoriaiheeiset tuotteet. Myös kangaskassit ovat suosittuja." },
    { q: "Sopiiko huumoripaita lahjaksi naiselle?", a: "Kyllä, erityisesti äitiaiheeiset ja arjen huumori- ja viiniaiheeiset tuotteet ovat naisten suosiossa." },
    { q: "Miten valitsen oikean koon lahjaksi naiselle?", a: "M tai L on yleisimmät naisten koot. Ylisuuri (oversized) tyyli on tällä hetkellä trendikäs." },
    { q: "Voiko tuotteen paketoida lahjapakettiin?", a: "Emme tällä hetkellä tarjoa lahjapakettia, mutta tilausvahvistus soveltuu digitaaliseksi lahjasaatteeksi." },
  ],
  '/lahja-miehelle': [
    { q: "Mikä on hyvä lahja miehelle joka tykkää huumorista?", a: "Paras hauska lahja miehelle on tuote joka liittyy hänen harrastukseensa tai ammattiinsa — kalamies, sähkömies, eläkeläinen, Mersumies. Valikoimastamme löydät yli 75 hauskaa ideaa." },
    { q: "Sopiiko huumoripaita lahjaksi 50-vuotiaalle?", a: "Ehdottomasti. Suosituimpia ovat '100 % Eläkeläinen', 'Museo-kappale' ja ammattihuumori. Hauska paita on aina yllättävä ja muistettava lahja." },
    { q: "Miten valitsen oikean koon lahjaksi?", a: "L on miesten yleisin koko. Epävarma? Valitse yksi koko ylöspäin — löysä istuvuus on turvallisempi." },
    { q: "Voiko tuotteen paketoida lahjapakettiin?", a: "Lahjapakettia ei tarjota tällä hetkellä, mutta tilausvahvistus sopii lahjasaatteeksi." },
  ],
  '/isanpaiva-lahjat': [
    { q: "Mikä on hauska isänpäivälahja?", a: "Hauska isänpäivälahja on t-paita, huppari tai muki joka liittyy isän harrastukseen tai ammattiin. Suosituimpia ovat kalamies-, Mersumies- ja 'Maailman paras isä' -teemat." },
    { q: "Milloin viimeistään pitää tilata isänpäivälahja?", a: "Tilaa viimeistään 2 viikkoa ennen isänpäivää (marraskuun toinen sunnuntai). Toimitusaika on 3–7 arkipäivää." },
    { q: "Miten valitsen oikean koon isänpäivälahjaan?", a: "L on miesten yleisin koko. Jos isä on isokokoinen, valitse XL tai XXL. Kokoopas on jokaisen tuotteen sivulla." },
    { q: "Voiko isänpäivälahjan palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  '/joululahjat': [
    { q: "Mikä on hauska joululahja huumorin ystävälle?", a: "Hauska joululahja on t-paita, huppari tai muki suomalaisesta ammattihuumorista. Suosituimpia ovat kalamies-, äijä- ja eläkeläisteemat." },
    { q: "Milloin viimeistään tilata joululahja?", a: "Tilaa viimeistään 14.12. saadaksesi tuotteen ennen joulua. Toimitusaika on 3–7 arkipäivää." },
    { q: "Miten valitsen oikean koon joululahjaksi?", a: "L on yleisimmin sopiva koko miehille. Epävarma? Valitse yksi koko ylöspäin." },
    { q: "Voiko joululahjan palauttaa?", a: "Kyllä, 14 päivän palautusoikeus." },
  ],
  '/syntymapaivalahjat': [
    { q: "Mikä on hauska syntymäpäivälahja huumorin ystävälle?", a: "Huumoripaita, -huppari tai -muki on täydellinen syntymäpäivälahja. Suosituimpia ovat '100 % Eläkeläinen' ja ammattihuumori ikääntyvälle juhlijalle." },
    { q: "Sopiiko huumoripaita syntymäpäivälahjaan?", a: "Ehdottomasti! Hauska paita on yllättävä, persoonallinen ja tulee oikeasti käyttöön." },
    { q: "Miten valitsen oikean koon syntymäpäivälahjaan?", a: "L on yleisin koko miehille, M naisille. Epävarma? Yksi koko ylöspäin on turvallisempi." },
    { q: "Kuinka nopeasti syntymäpäivälahja toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Tilaa hyvissä ajoin jos synttäripäivä lähestyy." },
  ],
  '/polttari-lahjat': [
    { q: "Mitkä ovat suosituimmat polttaripaidat?", a: "Suosituimpia ovat 'Game Over', 'Viimeinen vapaa ilta' ja personoidut polttaripaidat koko porukalle." },
    { q: "Sopiiko huumoripaita polttarilahjana?", a: "Ehdottomasti — polttaripaita on perinteinen ja hauska tapa juhlistaa tapahtumaa. Yhtenäiset paidat ryhmälle tekevät illan unohtumattomaksi." },
    { q: "Miten valitsen oikean koon polttaripaidoille?", a: "Kerää ryhmältä koot etukäteen. Epävarma? Unisex-koot hieman suuremmiksi." },
    { q: "Voiko polttaripaitoja tilata isomman erän?", a: "Kyllä! Ryhmätilaukset onnistuvat helposti — lisää eri koot koriin tai ota yhteyttä asiakaspalveluumme." },
  ],
  '/elakelahjat': [
    { q: "Mikä on paras hauska eläkelahja?", a: "'Olen eläkkeellä' ja '100 % eläkeläinen' -teemat ovat suosituimpia eläkelahja-ideoita. T-paidat, hupparit ja mukit sopivat hyvin." },
    { q: "Sopiiko huumoripaita eläkkeelle jäävälle työkavereille?", a: "Kyllä — hauska eläkelahja on työtovereiden perinteinen tapa toivottaa työkaveri hyvää eläkettä." },
    { q: "Miten valitsen oikean koon eläkelahjaan?", a: "L on miesten ja M naisten yleisin koko. Epävarma? Valitse yksi ylöspäin." },
    { q: "Kuinka nopeasti eläkelahja toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Tilaa ajoissa ennen eläkejuhlia." },
  ],
  '/lahja-kaverille': [
    { q: "Mikä on hauska lahja kaverille?", a: "Hauska lahja kaverille on huumoripaita, -huppari tai -muki kaverin harrastuksesta tai persoonallisuudesta. Alle 30 € saat loistavan lahjan." },
    { q: "Sopiiko huumoripaita kaverin synttärilahjaksi?", a: "Ehdottomasti! Hauska paita on yllättävä, persoonallinen ja tulee oikeasti käyttöön." },
    { q: "Miten valitsen oikean koon kaverille?", a: "Tiedät kaverin koon parhaiten. Epävarma? Valitse yksi koko ylöspäin." },
    { q: "Kuinka nopeasti lahja toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Tilaa hyvissä ajoin ennen synttäreitä." },
  ],
  '/lahja-tyokaverille': [
    { q: "Mikä on hauska lahja työkavereille?", a: "'No niin' -muki ja '100 % eläkeläinen' -paita ovat suosituimpia työkaverilahjoja. Ne sopivat työkaverin lähtöön tai syntymäpäivään." },
    { q: "Sopiiko huumoripaita työkaverin läksiäislahjaksi?", a: "Kyllä — hauska paita tai muki on oivallinen muisto yhteisistä vuosista." },
    { q: "Miten valitsen oikean koon työkaverin lahjaksi?", a: "Jos et tiedä kokoa, L tai M on turvallinen valinta. Muki tai tarra ovat hyviä koottomia vaihtoehtoja." },
    { q: "Kuinka nopeasti lahja toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Tilaa hyvissä ajoin ennen läksiäisiä." },
  ],
  '/hauskat-t-paidat': [
    { q: "Mistä materiaalista hauskat t-paidat on tehty?", a: "T-paitamme ovat 100 % puuvillaa, painettu Suomessa DTG-tekniikalla." },
    { q: "Sopiiko hauska t-paita lahjaksi?", a: "Ehdottomasti! Hauska t-paita on persoonallinen ja tulee oikeasti käyttöön. Täydellinen syntymäpäivä-, joulu- tai läksiäislahja." },
    { q: "Miten valitsen oikean koon?", a: "L on miesten yleisin koko. Kokoopas löytyy jokaiselta tuotesivulta. Epävarma? Valitse XL." },
    { q: "Voiko t-paidan palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  '/hauskat-hupparit': [
    { q: "Minkälaisesta materiaalista hauskat hupparit ovat?", a: "Hupparimme ovat pehmeää puuvilla-polyesteri-sekoitetta. Lämmin, mukava ja kestävä. Koot S–3XL." },
    { q: "Sopiiko hauska huppari lahjaksi?", a: "Ehdottomasti! Huppari on käytännöllinen ja hauska lahja — sitä käytetään vuosia." },
    { q: "Miten valitsen oikean koon?", a: "L on yleisin koko. Kokoopas jokaisella tuotesivulla. Epävarma? Valitse XL." },
    { q: "Voiko hupparin palauttaa?", a: "Kyllä, 14 päivän palautusoikeus. Ota yhteyttä asiakaspalveluumme." },
  ],
  '/haalarimerkit': [
    { q: "Sopivatko haalarimerkit kaikille haalareille?", a: "Kyllä, merkkimme sopivat kaikkiin haalareihin, reppuihin ja laukkuihin. Kiinnitys neulalla." },
    { q: "Voiko haalarimerkkejä tilata omalla tekstillä?", a: "Kyllä! Räätälöityjä merkkejä tilauksesta. Ota yhteyttä asiakaspalveluumme." },
    { q: "Kuinka nopeasti haalarimerkit toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Ilmainen toimitus yli 60 € tilauksiin." },
    { q: "Sopivatko haalarimerkit lahjaksi opiskelijalle?", a: "Ehdottomasti! Haalarimerkit ovat loistava lahja opiskelijalle kiltajuhliin tai tupaantuliaisiin." },
  ],
  '/opiskelijan-haalarimerkit': [
    { q: "Mitä haalarimerkit ovat?", a: "Haalarimerkit ovat pieniä brodeerattuja tai painettuja merkkejä jotka kiinnitetään haalariin tai reppuun. Ne ovat perinteinen tapa personoida opiskelijan haalarit." },
    { q: "Voiko haalarimerkkejä tilata omalla tekstillä tai logolla?", a: "Kyllä! Tarjoamme räätälöityjä haalarimerkkejä kiltajärjestöille ja yksityishenkilöille. Kysy tarjous asiakaspalvelusta." },
    { q: "Kuinka nopeasti haalarimerkit toimitetaan?", a: "Toimitusaika on 3–7 arkipäivää. Suuret ryhmätilaukset voivat kestää pidempään." },
    { q: "Sopivatko haalarimerkit lahjaksi?", a: "Ehdottomasti! Haalarimerkit ovat oivallinen lahja opiskelijalle tai kiltatapahtumaan." },
  ],
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function injectJsonLd(html: string, ...schemas: object[]): string {
  const tags = schemas
    .map(s => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`)
    .join('\n  ');
  return html.replace('</head>', `  ${tags}\n</head>`);
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  if (request.headers.get('x-bot-inject') === 'true') {
    return undefined;
  }

  const ua = request.headers.get('user-agent') || '';
  if (!BOT_REGEX.test(ua)) {
    return undefined;
  }

  const url = new URL(request.url);
  const path = url.pathname;

  let meta: PageMeta | undefined;
  let productData: (ProductMeta & { slug: string }) | undefined;
  let pageSchemas: object[] = [];

  // Exact match (static pages, category pages, gift pages)
  if (PAGE_META[path]) {
    meta = PAGE_META[path];
  }
  // Blog post: /blogi/:slug
  else if (path.startsWith('/blogi/')) {
    const slug = path.slice('/blogi/'.length).replace(/\/$/,  '');
    meta = BLOG_META[slug];
    if (!meta) {
      meta = {
        title: `${slug.replace(/-/g, ' ')} | Huumorikauppa.fi`,
        description: 'Lahjaideoita ja hauskan ostajan oppaita Huumorikaupasta. Löydä paras hauska lahja!',
      };
    }
  }
  // Product pages: /tuote/:slug
  else if (path.startsWith('/tuote/')) {
    const slug = path.slice('/tuote/'.length).replace(/\/$/, '');
    const pm = PRODUCT_META[slug];
    if (pm) {
      meta = { title: pm.title, description: pm.description };
      productData = { ...pm, slug };
    }
  }
  // Situation gift pages: /lahjat/:slug
  else if (path.startsWith('/lahjat/')) {
    const slug = path.slice('/lahjat/'.length).replace(/\/$/, '');
    meta = {
      title: `${slug.replace(/-/g, ' ')} – Hauska lahja | Huumorikauppa.fi`,
      description: 'Hauskat lahjat ja tuotteet Huumorikaupasta. Nopea toimitus, ilmainen yli 60 €.',
    };
  }

  // Build additional structured data for category and gift pages
  if (meta && path.startsWith('/kategoria/')) {
    const catSlug = path.slice('/kategoria/'.length).replace(/\/$/, '');
    const catName = CATEGORY_NAMES[catSlug] || catSlug;
    const catProds = (CATEGORY_PRODUCTS[catSlug] || []).slice(0, 20);
    const catFaqs = CATEGORY_FAQS[catSlug] || [];
    const itemList = {
      "@context": "https://schema.org/",
      "@type": "ItemList",
      "name": `Hauskat ${catName}`,
      "numberOfItems": catProds.length,
      "itemListElement": catProds.map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://huumorikauppa.fi/tuote/${p.slug}`,
        "name": p.name,
        "image": p.image,
      })),
    };
    const breadcrumb = {
      "@context": "https://schema.org/",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Etusivu", "item": "https://huumorikauppa.fi/" },
        { "@type": "ListItem", "position": 2, "name": catName, "item": `https://huumorikauppa.fi/kategoria/${catSlug}` },
      ],
    };
    const speakable = {
      "@context": "https://schema.org/",
      "@type": "WebPage",
      "speakable": { "@type": "SpeakableSpecification", "cssSelector": [".tldr-box", ".direct-answer", "h1"] },
    };
    pageSchemas = [itemList, breadcrumb, speakable];
    if (catFaqs.length > 0) {
      pageSchemas.push({
        "@context": "https://schema.org/",
        "@type": "FAQPage",
        "mainEntity": catFaqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      });
    }
  } else if (meta && GIFT_CATEGORY_CATS[path]) {
    const cats = GIFT_CATEGORY_CATS[path];
    const giftProds = cats.flatMap(c => CATEGORY_PRODUCTS[c] || []).slice(0, 20);
    const giftFaqs = GIFT_FAQS[path] || [];
    const giftName = (meta.title || '').replace(/ \|.*$/, '').trim();
    if (giftProds.length > 0) {
      pageSchemas.push({
        "@context": "https://schema.org/",
        "@type": "ItemList",
        "name": giftName,
        "numberOfItems": giftProds.length,
        "itemListElement": giftProds.map((p, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "url": `https://huumorikauppa.fi/tuote/${p.slug}`,
          "name": p.name,
          "image": p.image,
        })),
      });
    }
    if (giftFaqs.length > 0) {
      pageSchemas.push({
        "@context": "https://schema.org/",
        "@type": "FAQPage",
        "mainEntity": giftFaqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      });
    }
    pageSchemas.push({
      "@context": "https://schema.org/",
      "@type": "WebPage",
      "speakable": { "@type": "SpeakableSpecification", "cssSelector": [".tldr-box", ".direct-answer", "h1"] },
    });
  } else if (path === '/') {
    pageSchemas = [{
      "@context": "https://schema.org/",
      "@type": "WebPage",
      "speakable": { "@type": "SpeakableSpecification", "cssSelector": [".tldr-box", ".direct-answer", "h1"] },
    }];
  }

  if (!meta) {
    return undefined;
  }

  try {
    const baseRequest = new Request(url.origin + '/', {
      headers: { 'x-bot-inject': 'true' },
    });
    const baseResponse = await fetch(baseRequest);
    if (!baseResponse.ok) return undefined;

    let html = await baseResponse.text();

    const canonical = `https://huumorikauppa.fi${path}`;
    const safeTitle = escapeHtml(meta.title);
    const safeDesc = escapeHtml(meta.description);

    html = html.replace(/<title>[^<]*<\/title>/, `<title>${safeTitle}</title>`);
    html = html.replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${safeDesc}">`
    );

    const canonicalTag = `<link rel="canonical" href="${canonical}">`;
    if (/<link rel="canonical"[^>]*>/.test(html)) {
      html = html.replace(/<link rel="canonical"[^>]*>/, canonicalTag);
    } else {
      html = html.replace('</head>', `  ${canonicalTag}\n</head>`);
    }

    html = html.replace(
      /<meta property="og:title"[^>]*>/,
      `<meta property="og:title" content="${safeTitle}">`
    );
    html = html.replace(
      /<meta property="og:description"[^>]*>/,
      `<meta property="og:description" content="${safeDesc}">`
    );
    html = html.replace(
      /<meta property="og:url"[^>]*>/,
      `<meta property="og:url" content="${canonical}">`
    );
    html = html.replace(
      /<meta name="twitter:title"[^>]*>/,
      `<meta name="twitter:title" content="${safeTitle}">`
    );
    html = html.replace(
      /<meta name="twitter:description"[^>]*>/,
      `<meta name="twitter:description" content="${safeDesc}">`
    );

    // Inject product JSON-LD for /tuote/ pages
    if (productData) {
      const pd = productData;
      const productSchema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": pd.title.replace(/ – [^|]+ \| Huumorikauppa\.fi$/, '').replace(/ \| Huumorikauppa\.fi$/, ''),
        "description": pd.description,
        "image": pd.image,
        "sku": pd.slug,
        "brand": { "@type": "Brand", "name": "Huumorikauppa" },
        "offers": {
          "@type": "Offer",
          "url": `https://huumorikauppa.fi/tuote/${pd.slug}`,
          "priceCurrency": "EUR",
          "price": pd.price.toFixed(2),
          "availability": "https://schema.org/InStock",
          "itemCondition": "https://schema.org/NewCondition",
          "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          "seller": { "@type": "Organization", "name": "Huumorikauppa", "url": "https://huumorikauppa.fi" }
        }
      };
      const breadcrumbSchema = {
        "@context": "https://schema.org/",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Etusivu", "item": "https://huumorikauppa.fi/" },
          { "@type": "ListItem", "position": 2, "name": pd.categoryName, "item": `https://huumorikauppa.fi/kategoria/${pd.category}` },
          { "@type": "ListItem", "position": 3, "name": productSchema.name, "item": `https://huumorikauppa.fi/tuote/${pd.slug}` }
        ]
      };
      html = injectJsonLd(html, productSchema, breadcrumbSchema);

      // Also update og:image, og:image:alt and og:type for product pages
      html = html.replace(
        /<meta property="og:image"[^>]*>/,
        `<meta property="og:image" content="${escapeHtml(pd.image)}">`
      );
      html = html.replace(
        /<meta property="og:image:alt"[^>]*>/,
        `<meta property="og:image:alt" content="${escapeHtml(productSchema.name as string)}">`
      );
      html = html.replace(
        /<meta property="og:type"[^>]*>/,
        `<meta property="og:type" content="product">`
      );
      // Also update twitter:image
      html = html.replace(
        /<meta name="twitter:image"[^>]*>/,
        `<meta name="twitter:image" content="${escapeHtml(pd.image)}">`
      );
    }

    // Inject page-level schemas (ItemList, FAQPage, Speakable) for category/gift pages
    if (pageSchemas.length > 0) {
      html = injectJsonLd(html, ...pageSchemas);
    }

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-Bot-Served': 'true',
        'Vary': 'User-Agent',
      },
    });
  } catch {
    return undefined;
  }
}
