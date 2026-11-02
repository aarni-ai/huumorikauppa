/**
 * Tavaramerkkisuodatus personoiduille tuotteille (2.11.2026). Asiakkaan kirjoittamaan tekstiin ei paineta tunnettuja
 * tuotemerkkejä, hahmoja, urheilujoukkueita tai sarjoja (Printifyn sisältösäännöt ja tavaramerkkioikeus).
 *
 * Vertailu normalisoituna: pienet kirjaimet, ääkköset ja tarkkeet perusmuotoon (ä -> a, é -> e), välilyönnit ja
 * välimerkit pois. PITKAT haetaan mistä kohdasta tahansa (myös "Coca Cola", "coca-cola" ja "CocaCola"), LYHYET vain
 * kokonaisena sanana, jottei esimerkiksi nimi Annike esty sanan "nike" takia.
 */
const PITKAT = [
  "adidas", "disney", "marvel", "cocacola", "moomin", "muumi", "fazer", "marimekko", "angrybirds", "pokemon", "pikachu",
  "starwars", "harrypotter", "hogwarts", "leijonat", "jokerit", "karpat", "tappara", "iittala", "nokia", "barbie",
  "hellokitty", "mercedes", "ferrari", "mcdonald", "burgerking", "starbucks", "pepsi", "redbull", "fiskars", "finlayson",
  "arabia finland", "koskenkorva", "lapinkulta", "hartwall", "karhuolut", "spotify", "netflix", "google",
  "facebook", "instagram", "tiktok", "youtube", "playstation", "nintendo", "minecraft", "fortnite", "supermario",
  "simpsons", "spongebob", "batman", "superman", "spiderman", "avengers", "pixar", "frozen elsa", "lamborghini",
  "porsche", "toyota", "volkswagen", "harleydavidson", "rolex", "gucci", "chanel", "louisvuitton", "versace",
  "lacoste", "ralphlauren", "tommyhilfiger", "northface", "reebok", "newbalance", "underarmour", "realmadrid",
  "barcelona", "manchester", "liverpool", "juventus", "arsenal", "bayern", "pelicans", "blues espoo",
  "veikkausliiga", "fifa", "uefa", "formula1", "kalevala koru", "stockmann", "lidl", "veikkaus", "finnair",
  "yleisradio",
].map((s) => s.replace(/[^a-z0-9]/g, ""));
const LYHYET = [
  "nike", "lego", "nhl", "nba", "nfl", "bmw", "audi", "volvo", "tesla", "apple", "iphone", "puma", "hifk", "hjk", "tps",
  "assat", "kookoo", "saipa", "jyp", "hpk", "fiat", "skoda", "opel", "honda", "yamaha", "suzuki", "ducati", "ktm",
  "fanta", "sprite", "oreo", "dior", "prada", "hm", "levis", "vans", "fila", "kappa", "umbro", "asics", "salomon",
  "rapala", "olvi", "sinebrychoff", "zelda", "sonic", "yoda", "vader", "shrek", "nasa", "ufc", "wwe", "alko", "kesko",
  "prisma", "valio", "ikea",
];

const perusmuoto = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Löytyykö tekstistä tavaramerkki. Palauttaa löydetyn merkin (normalisoituna) tai null.
 * Etunimiä (Elsa, Mario, Olaf, Zara, Chelsea, Reima) ei estetä, vaikka sama nimi olisi myös hahmo tai merkki. Mercedes
 * estetään (pyydetty listaan), vaikka se on myös etunimi.
 */
export function tavaramerkki(teksti) {
  const n = perusmuoto(teksti);
  const yhteen = n.replace(/[^a-z0-9]/g, "");
  const pitka = PITKAT.find((t) => t && yhteen.includes(t));
  if (pitka) return pitka;
  const sanat = n.split(/[^a-z0-9]+/).filter(Boolean);
  return LYHYET.find((t) => sanat.includes(t)) ?? null;
}
