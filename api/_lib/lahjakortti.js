/**
 * Digitaalinen lahjakortti (puhdas moduuli: selain ja palvelin). Tietokantaosa: api/_lib/lahjakortti-db.js.
 *
 * - Tuotteet "Lahjakortti 25/50/75/100 €": ei Printifyä, ei tuotantokulua, ei toimitusmaksua. Ostetaan samalla
 *   kassalla (rivin type "giftcard"). Katesääntö ei koske lahjakorttia (ei kulua), Stripen maksukulu koskee.
 * - Maksun jälkeen jokaiselle kappaleelle luodaan oma koodi (taulu gift_cards), voimassa 24 kuukautta.
 * - Käyttö kassalla kentällä "Lahjakortin koodi": saldo tarkistetaan palvelimella ja vähennetään maksun jälkeen.
 *   Voi käyttää useaan tilaukseen, ei vaihdeta rahaksi. Lahjakortilla ei voi ostaa lahjakortteja.
 */
export const LAHJAKORTTI_ARVOT = [25, 50, 75];
export const LAHJAKORTTI_KATEGORIA = "lahjakortit";
export const VOIMASSA_KUUKAUTTA = 24;
export const LAHJAKORTTI_EHDOT = [
  "Voimassa 24 kuukautta ostopäivästä.",
  "Voit käyttää lahjakorttia useaan tilaukseen, kunnes saldo on käytetty.",
  "Lahjakorttia ei voi vaihtaa rahaksi.",
];

/** Lahjakortin tuoterivi (sama muoto kuin muilla tuotteilla, jotta ostoskori toimii sellaisenaan). */
export function lahjakorttiTuote(arvo) {
  if (!LAHJAKORTTI_ARVOT.includes(Number(arvo))) return null;
  const a = Number(arvo);
  return {
    id: `lahjakortti-${a}`,
    slug: `lahjakortti-${a}`,
    name: `Lahjakortti ${a} €`,
    category: LAHJAKORTTI_KATEGORIA,
    humor_type: "lahjakortti",
    price: a,
    stock: 999,
    description: `Digitaalinen lahjakortti Huumorikauppaan, arvo ${a} €. Koodi toimitetaan sähköpostilla heti maksun jälkeen.`,
    images: ["/lahjakortti.svg"],
    variants: {},
    is_featured: false,
    is_new: false,
    is_gift_idea: true,
    supplier: "lahjakortti",
    type: "giftcard",
  };
}

/** Onko kori- tai kassarivi lahjakortti. */
export function onLahjakortti(rivi) {
  if (!rivi) return false;
  const p = rivi.product || rivi;
  return rivi.type === "giftcard" || p.type === "giftcard" || p.category === LAHJAKORTTI_KATEGORIA || /^lahjakortti-\d+$/.test(String(p.slug || p.id || ""));
}

// Ei sekoittuvia merkkejä (0/O, 1/I). 32 merkkiä: tavu % 32 on tasajakautunut.
const AAKKOSTO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const KOODI_RE = /^HK-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

function satunnaisetTavut(n) {
  const t = new Uint8Array(n);
  globalThis.crypto.getRandomValues(t);
  return t;
}

/** Uusi koodi muotoa HK-XXXX-XXXX-XXXX (60 bittiä satunnaisuutta). */
export function luoKoodi(tavut = satunnaisetTavut) {
  const b = tavut(12);
  let s = "";
  for (let i = 0; i < 12; i++) s += AAKKOSTO[b[i] % 32];
  return `HK-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

/** Asiakkaan kirjoittama koodi vakiomuotoon: isot kirjaimet, välilyönnit ja väliviivat pois, sitten HK-XXXX-XXXX-XXXX. */
export function normalisoiKoodi(syote) {
  let s = String(syote || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.startsWith("HK")) s = s.slice(2);
  if (s.length !== 12) return null;
  const k = `HK-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
  return KOODI_RE.test(k) ? k : null;
}

export const onKelvollinenKoodi = (koodi) => typeof koodi === "string" && KOODI_RE.test(koodi);

/** Viimeinen voimassaolohetki: ostohetki + 24 kuukautta. */
export function voimassaAsti(luotu = new Date()) {
  const d = new Date(luotu);
  const paiva = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + VOIMASSA_KUUKAUTTA);
  const viimeinen = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(paiva, viimeinen));
  return d;
}

const sentit = (x) => Math.round(Number(x) * 100);

/**
 * Lahjakortin tarkistus (tietokantarivi { code, balance, expires_at }). Palauttaa { ok, saldo, virhe }.
 */
export function tarkistaLahjakortti(kortti, nyt = new Date()) {
  if (!kortti) return { ok: false, saldo: 0, virhe: "Lahjakortin koodia ei löytynyt." };
  if (kortti.expires_at && new Date(kortti.expires_at).getTime() < nyt.getTime()) return { ok: false, saldo: 0, virhe: "Lahjakortti on vanhentunut." };
  const saldo = sentit(kortti.balance) / 100;
  if (!(saldo > 0)) return { ok: false, saldo: 0, virhe: "Lahjakortin saldo on käytetty." };
  return { ok: true, saldo, virhe: null };
}

/** Kuinka paljon lahjakortilla maksetaan tilauksesta (euroina, sentin tarkkuudella). */
export function kaytettavaSumma(saldo, tilausSumma) {
  return Math.max(0, Math.min(sentit(saldo), sentit(tilausSumma))) / 100;
}

/** Saldo käytön jälkeen. Heittää virheen, jos saldo ei riitä (ei koskaan negatiivinen). */
export function vahennaSaldo(saldo, kaytetty) {
  const s = sentit(saldo);
  const k = sentit(kaytetty);
  if (k < 0) throw new Error("Negatiivinen veloitus");
  if (k > s) throw new Error("Lahjakortin saldo ei riitä");
  return (s - k) / 100;
}
