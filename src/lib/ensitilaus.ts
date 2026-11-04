/**
 * "Ensimmäinen tilaus: −5 %" A/B-testi selaimessa (5.11.2026). Säännöt ja laskenta: api/_lib/ensitilaus.js (sama koodi
 * kuin kassalla). Versio: src/lib/abTestit.ts (istuntoeväste hk_ab_ensitilaus). Kassa tarkistaa ensimmäisyyden
 * sähköpostiosoitteesta ja laskee lopullisen hinnan; selain näyttää merkin vain, kun alennus koskee tuotetta tai koria
 * katesäännöllä (7 € kappaleelta).
 *
 * Mittaus kuten hintatestissä (src/lib/toimitustesti.ts): käynti, tuotesivu, kori, kassa. Vain koostemäärät, botit
 * ohitetaan.
 */
import { abVersio, ensitilausKayntiAlkoi } from "./abTestit";
import { ensitilausAlennus, ENSITILAUS_PROSENTTI, ENSITILAUSTESTI_ALKAEN } from "../../api/_lib/ensitilaus.js";
import { rivinHinta } from "../../api/_lib/kokohinnat.js";
import { myytavatVariantit } from "../../api/_lib/kate.js";
import { kalleinVariantti } from "../../api/_lib/korialennus.js";
import { onLahjakortti } from "../../api/_lib/lahjakortti.js";
import { LISATUOTE_KATEGORIAT } from "../../api/_lib/vakiot.js";
import type { CartItem, Product } from "@/types/product";
import { naytettavaHinta, toimitusVersio } from "./toimitustesti";
import { toimitusTila } from "./ostoskori";
import { lahetaKunLuokiteltu } from "./aitous";

export { ENSITILAUS_PROSENTTI };
export type EnsitilaustestiTapahtuma = "kaynti" | "tuotesivu" | "kori" | "kassa";

export const ensitilausVersio = (): "a" | "b" => abVersio("ensitilaus");
export const onEnsitilausB = (): boolean => ensitilausVersio() === "b";

/** Merkin teksti (tuotesivu, kori, kassa). */
export const ENSITILAUS_MERKKI = `Ensimmäinen tilaus: −${ENSITILAUS_PROSENTTI} %`;

/**
 * Tuotesivun merkki: koskeeko alennus tätä tuotetta yksin tilattuna (versio B). Jokaisen valintaan sopivan myytävän
 * variantin (valittu koko ja väri, muuten kaikki) on täytettävä katesääntö, jotta merkkiä ei näytetä koolle tai värille,
 * jolle alennusta ei anneta. toimitusVersio: hintatestin versio (B: toimitus sisältyy hintaan, toimitus 0 €).
 */
export function tuotteenEnsitilaus(product: Product, { koko, vari, versio = ensitilausVersio(), toimitus = toimitusVersio() }: { koko?: string | null; vari?: string | null; versio?: "a" | "b"; toimitus?: "a" | "b" } = {}): boolean {
  if (versio !== "b" || product.type === "giftcard" || LISATUOTE_KATEGORIAT.includes(product.category)) return false;
  const variantit = (myytavatVariantit(product) as [string, number][]).filter(([avain]) => {
    const [c, s] = avain.split("|");
    return (!koko || s === koko) && (!vari || c === vari);
  });
  if (variantit.length === 0) return false;
  return variantit.every(([avain, id]) => {
    const size = avain.split("|")[1] || null;
    const perus = Number(rivinHinta(product, size));
    const hinta = naytettavaHinta(product, size, toimitus);
    const sisaltyy = hinta !== perus;
    // Yhden tuotteen tilaus: toimitusmaksu (vakiot.js), ilmaisen toimituksen rajasta 0 €, hintatestin B:ssä 0 €.
    const maksu = sisaltyy ? 0 : toimitusTila([{ product, quantity: 1, selectedSize: size ?? undefined, selectedColor: avain.split("|")[0] }]).toimitus;
    return ensitilausAlennus([{ tuote: product, varianttiId: id, maara: 1, yksikkohinta: hinta, pohja: perus }], maksu).kaytossa;
  });
}

export interface EnsitilausKori {
  /** Merkki ja arvio näytetään (versio B, ei muita alennuksia, katesääntö täyttyy). */
  kaytossa: boolean;
  /** Arvioitu alennus euroina, jos tilaus on ensimmäinen. */
  alennus: number;
}

/**
 * Kori ja kassa (sama sääntö kuin kassalla): versio B, ei alennuskoodia, kumppani-, paketti-, kahden tuotteen eikä
 * määräalennusta (muuAlennus), ja nettokate alennuksen jälkeen vähintään 7 € kappaleelta. Rivin variantti valitun koon
 * ja värin mukaan, muuten kallein variantti (varovainen arvio).
 */
export function ensitilausKorissa(items: Pick<CartItem, "product" | "quantity" | "selectedSize" | "selectedColor">[], muuAlennus: boolean, versio: "a" | "b" = ensitilausVersio()): EnsitilausKori {
  const ei = { kaytossa: false, alennus: 0 };
  const fyysiset = items.filter((i) => !onLahjakortti(i));
  if (versio !== "b" || muuAlennus || fyysiset.length === 0) return ei;
  if (fyysiset.every((i) => LISATUOTE_KATEGORIAT.includes(i.product.category))) return ei;
  const tila = toimitusTila(items);
  const osat = fyysiset.map((i) => {
    const kartta = (i.product.variants?.variant_map || {}) as Record<string, number>;
    const suora = kartta[`${(i.selectedColor || "").trim()}|${(i.selectedSize || "").trim()}`];
    const perus = Number(rivinHinta(i.product, i.selectedSize ?? null));
    // Hintatestin B: toimitus sisältyy yhden tuotteen hintaan (lisä vain sille riville, alennus perushinnasta).
    const lisa = tila.sisaltyvaTuote === i.product.id ? tila.sisaltyy : 0;
    return { tuote: i.product, varianttiId: typeof suora === "number" ? suora : kalleinVariantti(i.product), maara: i.quantity, yksikkohinta: perus + lisa, pohja: perus };
  });
  const e = ensitilausAlennus(osat, tila.toimitus);
  return e.kaytossa ? { kaytossa: true, alennus: e.alennus } : ei;
}

const onBotti = () => typeof navigator !== "undefined" && (navigator.webdriver || /bot|crawl|spider|slurp|preview|headless|prerender|lighthouse|inspectiontool|googleother/i.test(navigator.userAgent || ""));
const onTesti = () => typeof window !== "undefined" && (window as unknown as { __suppiloTesti?: boolean }).__suppiloTesti === true;
let kassaKirjattu = false;

export function kirjaaEnsitilaustesti(tapahtuma: EnsitilaustestiTapahtuma): void {
  if (typeof window === "undefined" || typeof fetch !== "function" || onBotti() || onTesti()) return;
  if (window.location.pathname.startsWith("/hallinta")) return;
  // Ennen alkupäivää ei kirjauksia (pakotettu ?ab=ensitilaus-b on kuvakaappauksia varten).
  if (new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date()) < ENSITILAUSTESTI_ALKAEN) return;
  if (tapahtuma === "kassa") {
    if (kassaKirjattu) return;
    kassaKirjattu = true;
  }
  // Bottisuodatus (src/lib/aitous.ts): lähtee vasta, kun käynti on luokiteltu; palvelin kirjaa vain aidot.
  const versio = ensitilausVersio();
  lahetaKunLuokiteltu((aitous) => {
    fetch("/api/sahkoposti", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ action: "ensitilaus", versio, tapahtuma, aitous }) }).catch(() => undefined);
  });
}

/** Sivun latauksessa (src/main.tsx): uusi käynti kirjataan, kun versio arvottiin tällä latauksella. */
export function aloitaEnsitilaustesti(): void {
  if (typeof window === "undefined" || onBotti()) return;
  if (ensitilausKayntiAlkoi()) kirjaaEnsitilaustesti("kaynti");
}
