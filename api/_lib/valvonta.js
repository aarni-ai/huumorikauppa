/**
 * Tilausvalvonnan logiikka (api/cron/tilaukset.js): Printifyn tilan tulkinta, jumissa olevat tilaukset ja päivän
 * yhteenveto katteineen. Puhdas moduuli; tietokantakutsut tietovaraston kautta (pgValvonta), testeissä muistivarasto.
 */
import { ALV, STRIPE_PROSENTTI, STRIPE_KIINTEA } from "./kate.js";
import { tilausnumero } from "./sahkoposti.js";
import { tilauksenMyynti, printifyKulut } from "./tilausvahti.js";
import { premiumSaasto, premiumRivit } from "./premium.js";

export const JUMISSA_TUNTIA = 2;
export const KK_TAVOITE = () => Number(process.env.KATE_TAVOITE_KK || 3000);
export const YHTEENVETO_TUNTI = 7;
export const KV_YHTEENVETO = "yhteenveto_pvm";
const r2 = (x) => Math.round(x * 100) / 100;
const eur = (x) => `${r2(x).toFixed(2).replace(".", ",")} €`;

/** Helsingin päivä ja tunti (kesäaika huomioiden). */
export function helsinki(d = new Date()) {
  const o = Object.fromEntries(new Intl.DateTimeFormat("fi-FI", {
    timeZone: "Europe/Helsinki", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(d)).map((p) => [p.type, p.value]));
  return { paiva: `${o.year}-${o.month}-${o.day}`, tunti: Number(o.hour), vuosi: Number(o.year), kuukausi: Number(o.month), pv: Number(o.day) };
}

/** Helsingin vuorokauden alku UTC-hetkenä ("2026-10-25" -> 2026-10-24T21:00:00Z kesäajalla). */
export function paivanAlku(paiva) {
  const [y, m, d] = paiva.split("-").map(Number);
  for (const tunnit of [3, 2]) {
    const t = new Date(Date.UTC(y, m - 1, d) - tunnit * 3600e3);
    const h = helsinki(t);
    if (h.paiva === paiva && h.tunti === 0) return t;
  }
  throw new Error(`paivanAlku: ${paiva}`);
}

const lisaaPaiva = (paiva, n) => {
  const [y, m, d] = paiva.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const paivaFi = (paiva) => {
  const [y, m, d] = paiva.split("-").map(Number);
  return `${d}.${m}.${y}`;
};

/**
 * Printifyn tilauksen tila tuotannossa olevalle tilaukselle:
 *  "uudelleen"  on-hold tai maksu ei mennyt läpi: send_to_production uudelleen viiveellä ja hälytys heti
 *  "halyta"     has-issues tai peruttu: vain hälytys
 *  null         kaikki hyvin
 */
export function printifyTila(status) {
  if (["on-hold", "payment-not-received"].includes(status)) return "uudelleen";
  if (["has-issues", "had-issues", "canceled", "cancelled"].includes(status)) return "halyta";
  return null;
}

/** Onko Printify jo ottanut tilauksen tuotantoon (send_to_production voi palauttaa virheen, jos se on jo lähetetty). */
export const onTuotannossa = (status) => ["sending-to-production", "in-production", "fulfilled", "partially-fulfilled"].includes(status);

/**
 * Tilausvahdin pysäyttämä tilaus valvonnassa: "tuotannossa", jos omistaja on lähettänyt sen Printifyn hallinnasta
 * tuotantoon (tai se on jo lähetetty), muuten null (ei uudelleenyritystä, ei hälytystä).
 */
export const pysaytetynSeuranta = (status, lahetetty = false) => (lahetetty || onTuotannossa(status) ? "tuotannossa" : null);

/** Maksetut tilaukset, jotka eivät ole päässeet tuotantoon yli JUMISSA_TUNTIA tunnissa ja joista ei ole vielä hälytetty. */
export function jumissaYli(tilaukset, nyt = new Date(), tunnit = JUMISSA_TUNTIA) {
  const raja = new Date(nyt).getTime() - tunnit * 3600e3;
  return tilaukset.filter((t) => t.status === "maksettu" && ["ei_lahetetty", "luotu", "virhe"].includes(t.printify_status)
    && !t.stuck_alert_sent_at && new Date(t.printify_created_at || t.paid_at).getTime() <= raja);
}

/**
 * Tilauksen nettokate euroina (arvio, sama kaava kuin api/_lib/kate.js): myynti alv 0 ilman ostettuja lahjakortteja
 * - Printifyn kulut (tilaushetken kulu riviltä, varalla tuotteen nykyinen kulu) - Stripen maksu.
 * Palauttaa { myynti, kate, tunnettu }.
 */
export function tilauksenKate(tilaus, tuotteetSlugilla = new Map()) {
  const rivit = tilaus.items || [];
  const lahjakortit = rivit.filter((i) => i.type === "giftcard").reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
  const myynti = Number(tilaus.total) - lahjakortit;
  let kulut = 0;
  let tunnettu = true;
  for (const i of rivit) {
    if (i.type === "giftcard") continue;
    let kulu = i.kulu_sentit;
    let toimitus = i.toimitus_sentit;
    if (typeof kulu !== "number" || typeof toimitus !== "number") {
      const p = tuotteetSlugilla.get(i.slug);
      kulu = p?.variants?.costs?.[String(i.variant_id)];
      toimitus = p?.variants?.shipping_cents;
    }
    if (typeof kulu !== "number" || typeof toimitus !== "number") { tunnettu = false; continue; }
    kulut += ((kulu + toimitus) / 100) * i.quantity;
  }
  const maksettu = Number(tilaus.amount_paid) || 0;
  const stripe = maksettu > 0 ? maksettu * STRIPE_PROSENTTI + STRIPE_KIINTEA : 0;
  return { myynti: r2(Number(tilaus.total)), kate: r2(myynti / (1 + ALV) - kulut - stripe), tunnettu };
}

/**
 * Toteutunut kate Printifyn todellisella kululla (orders.printify_cost, tallennetaan tilausvahdissa ennen tuotantoa tai
 * yhteenvedossa jälkikäteen): myynti alv 0 - Printifyn kulu (sis. Printifyn alv) - Stripe. null, jos kulua ei tiedetä.
 */
export function toteutunutKate(tilaus) {
  if (tilaus.printify_cost == null || tilaus.printify_cost === "") return null;
  const kulu = Number(tilaus.printify_cost);
  if (!Number.isFinite(kulu)) return null;
  const { myyntiAlv0 } = tilauksenMyynti(tilaus);
  const maksettu = Number(tilaus.amount_paid) || 0;
  const stripe = maksettu > 0 ? maksettu * STRIPE_PROSENTTI + STRIPE_KIINTEA : 0;
  const ilman = tilaus.printify_cost_ex_tax == null ? null : Number(tilaus.printify_cost_ex_tax);
  return { myyntiAlv0, kulu: r2(kulu), kuluIlmanAlv: Number.isFinite(ilman) ? r2(ilman) : null, kate: r2(myyntiAlv0 - kulu - stripe) };
}

/** Toteutuneet summat listalle: todellinen kulu tiedossa n tilauksesta; yhteensa = toteutunut tai sen puuttuessa arvio. */
export function toteutuneet(lista, tuotteetSlugilla = new Map()) {
  return lista.reduce((a, t) => {
    const tk = toteutunutKate(t);
    const arvio = tilauksenKate(t, tuotteetSlugilla).kate;
    if (!tk) return { ...a, yhteensa: r2(a.yhteensa + arvio) };
    return { n: a.n + 1, myyntiAlv0: r2(a.myyntiAlv0 + tk.myyntiAlv0), kulu: r2(a.kulu + tk.kulu), kate: r2(a.kate + tk.kate), yhteensa: r2(a.yhteensa + tk.kate) };
  }, { n: 0, myyntiAlv0: 0, kulu: 0, kate: 0, yhteensa: 0 });
}

/** Printify Premium -laskelma tilausriveistä: tuotekulu (printify_product_cost) niiltä, joilta se tiedetään. */
export function premiumTilauksista(tilaukset) {
  const tunnetut = tilaukset.filter((t) => t.printify_product_cost != null && Number.isFinite(Number(t.printify_product_cost)));
  const summa = tunnetut.reduce((s, t) => s + Number(t.printify_product_cost), 0);
  return { saasto: premiumSaasto(summa), tunnettu: tunnetut.length, kaikki: tilaukset.length };
}

/**
 * Päivän yhteenvedon sisältö. eilen = maksetut tilaukset eilen (Helsingin aikaa), kk = kuukauden maksetut tähän asti,
 * jumissa = maksetut, jotka eivät ole tuotannossa, hitaat = tuotannossa yli 10 pv ilman lähetystä.
 */
export function yhteenveto({ nyt = new Date(), eilen, kk, jumissa, pysaytetyt = [], paivat30 = null, hitaat = 0, tuotteetSlugilla = new Map(), tavoite = KK_TAVOITE() }) {
  const h = helsinki(nyt);
  const eilenPv = lisaaPaiva(h.paiva, -1);
  const summa = (lista) => lista.reduce((a, t) => {
    const k = tilauksenKate(t, tuotteetSlugilla);
    return { myynti: a.myynti + k.myynti, kate: a.kate + k.kate, tuntematon: a.tuntematon + (k.tunnettu ? 0 : 1) };
  }, { myynti: 0, kate: 0, tuntematon: 0 });
  const e = summa(eilen);
  const m = summa(kk);
  const kkPaivia = new Date(Date.UTC(h.vuosi, h.kuukausi, 0)).getUTCDate();
  const jaljella = kkPaivia - h.pv + 1;
  const puuttuu = Math.max(0, tavoite - m.kate);
  const pros = tavoite > 0 ? (m.kate / tavoite) * 100 : 0;
  const tuntematon = (n) => (n ? ` (kulut puuttuvat ${n} tilauksesta, kate niiltä laskematta)` : "");
  const premium = paivat30 ? premiumTilauksista(paivat30) : null;
  const et = toteutuneet(eilen, tuotteetSlugilla);
  const mt = toteutuneet(kk, tuotteetSlugilla);
  const toteutunutRivi = (t) => {
    const tk = toteutunutKate(t);
    const pys = t.printify_status === "pysaytetty" ? " | PYSÄYTETTY" : "";
    return tk ? ` | toteutunut: Printify ${eur(tk.kulu)}, myynti alv 0 ${eur(tk.myyntiAlv0)}, kate ${eur(tk.kate)}${pys}` : ` | Printify-kulu ei tiedossa${pys}`;
  };
  const toteutunutYhteensa = (alku, lista, x) => {
    if (!lista.length) return `${alku}: ei tilauksia`;
    const perus = `${alku} (Printifyn todellinen kulu ${x.n}/${lista.length} tilauksesta): myynti alv 0 ${eur(x.myyntiAlv0)}, Printify ${eur(x.kulu)} (sis. Printifyn alv), kate ${eur(x.kate)}`;
    return x.n === lista.length ? perus : `${perus}; kaikki tilaukset (muilta arvio) ${eur(x.yhteensa)}`;
  };
  const rivit = [
    `Eilen ${paivaFi(eilenPv)}: ${eilen.length} maksettua tilausta, myynti ${eur(e.myynti)} (sis. alv), kate ${eur(e.kate)}${tuntematon(e.tuntematon)}`,
    ...eilen.map((t) => `  #${tilausnumero(t.id)} ${eur(Number(t.total))}, kate ${eur(tilauksenKate(t, tuotteetSlugilla).kate)}${toteutunutRivi(t)}`),
    toteutunutYhteensa(`Eilen toteutunut`, eilen, et),
    `Pysäytetty ennen tuotantoa (tilausvahti, odottaa päätöstäsi): ${pysaytetyt.length}`,
    ...pysaytetyt.map((t) => `  #${tilausnumero(t.id)} ${eur(Number(t.total))}: ${t.printify_error || "pysäytetty"}`),
    `Jumissa ennen tuotantoa: ${jumissa.length}`,
    ...jumissa.map((t) => `  #${tilausnumero(t.id)} ${t.customer_email}: ${t.printify_status}${t.printify_error ? `, ${t.printify_error}` : ""}`),
    `Tuotannossa yli 10 pv ilman lähetystä: ${hitaat}`,
    ...(premium ? premiumRivit(premium.saasto, premium) : []),
    `Kuukausi ${h.kuukausi}/${h.vuosi} tähän mennessä: kate ${eur(m.kate)} / tavoite ${eur(tavoite)} = ${pros.toFixed(1).replace(".", ",")} %${tuntematon(m.tuntematon)}`,
    toteutunutYhteensa(`Kuukauden toteutunut`, kk, mt),
    puuttuu > 0
      ? `Tavoitteeseen puuttuu ${eur(puuttuu)}: ${eur(puuttuu / jaljella)} katetta päivässä jäljellä olevina ${jaljella} päivänä (tänään mukaan lukien)`
      : "Kuukauden tavoite on saavutettu.",
  ];
  return { otsikko: `[Huumorikauppa] Päivän yhteenveto ${paivaFi(h.paiva)}`, rivit, eilen: e, kk: m, toteutunut: { eilen: et, kk: mt }, premium: premium?.saasto ?? null, pysaytetyt: pysaytetyt.length, jaljella, prosentti: r2(pros) };
}

/**
 * Lähettää päivän yhteenvedon kerran päivässä. Ajastus (GitHub Actions) kutsuu 04:00 ja 05:00 UTC; vain Helsingin
 * kello 7 -ajo lähettää (kesä- ja talviaika), ja kv-avain estää toisen lähetyksen samana päivänä.
 * pakota: ohita kellonaika (käsiajo). Palauttaa { lahetetty, syy }.
 */
export async function ajaYhteenveto(store, { laheta, vastaanottaja, nyt = new Date(), pakota = false, kuiva = false }) {
  const h = helsinki(nyt);
  if (!pakota && h.tunti !== YHTEENVETO_TUNTI) return { lahetetty: false, syy: `Helsingissä kello ${h.tunti}, lähetetään kello ${YHTEENVETO_TUNTI}` };
  if ((await store.lueKv(KV_YHTEENVETO)) === h.paiva) return { lahetetty: false, syy: "jo lähetetty tänään" };
  const tanaan = paivanAlku(h.paiva);
  const eilen = paivanAlku(lisaaPaiva(h.paiva, -1));
  const kuunAlku = paivanAlku(`${h.paiva.slice(0, 8)}01`);
  // Printifyn todelliset kulut tilauksille, joilta ne puuttuvat (ennen tilausvahtia tehdyt): eilisille kaikille, kuukauden
  // muille enintään 20 kerrallaan (tallennetaan, joten seuraavat päivät täydentävät loput).
  const eilisetRivit = await store.maksetutValilla(eilen, tanaan);
  if (store.taydennaKulut) await store.taydennaKulut(eilisetRivit, 50, { kuiva });
  const kkRivit = await store.maksetutValilla(kuunAlku, new Date(nyt));
  if (store.taydennaKulut) await store.taydennaKulut(kkRivit, 20, { kuiva });
  const paivat30 = await store.maksetutValilla(new Date(new Date(nyt).getTime() - 30 * 86400e3), new Date(nyt));
  if (store.taydennaKulut) await store.taydennaKulut(paivat30.filter((t) => t.printify_product_cost == null), 30, { kuiva });
  const sisalto = yhteenveto({
    nyt,
    paivat30,
    eilen: eilisetRivit,
    kk: kkRivit,
    pysaytetyt: store.pysaytetyt ? await store.pysaytetyt() : [],
    jumissa: await store.jumissa(),
    hitaat: await store.hitaat(),
    tuotteetSlugilla: await store.tuotteetSlugilla(),
  });
  if (kuiva) return { lahetetty: false, syy: "kuiva-ajo", sisalto };
  const r = await laheta({ to: vastaanottaja, subject: sisalto.otsikko, html: `<pre style="font-family:Menlo,Consolas,monospace">${sisalto.rivit.map((x) => x.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))).join("\n")}</pre>`, text: sisalto.rivit.join("\n") });
  if (!r.ok) return { lahetetty: false, syy: r.virhe, sisalto };
  await store.kirjoitaKv(KV_YHTEENVETO, h.paiva);
  return { lahetetty: true, sisalto };
}

/**
 * Täydentää tilausriveille Printifyn todellisen kulun (printify_cost, printify_cost_ex_tax) Printify-tilauksesta ja
 * tallentaa sen. haeTilaus(printifyId) -> { ok, data } (api/_lib/printify.js). Muokkaa rivejä paikallaan.
 */
export async function taydennaKulut(tilaukset, { haeTilaus, tallenna, max = 20 }) {
  let haettu = 0;
  for (const t of tilaukset) {
    if (haettu >= max) break;
    if ((t.printify_cost != null && t.printify_product_cost != null) || !t.printify_order_id) continue;
    haettu++;
    const r = await haeTilaus(t.printify_order_id).catch(() => null);
    const k = r?.ok ? printifyKulut(r.data) : null;
    if (!k) continue;
    t.printify_cost = k.kulu;
    t.printify_cost_ex_tax = k.kuluIlmanAlv;
    t.printify_product_cost = k.tuotteet;
    if (tallenna) await Promise.resolve(tallenna(t.id, k)).catch((e) => console.error("printify_cost:", e?.message));
  }
  return haettu;
}

/**
 * Postgres-tietovarasto yhteenvedolle. tuotteet = kaikkiTuotteet (kulut varalle, jos riviltä puuttuu).
 * haeTilaus (valinnainen): Printify-tilauksen haku todellisia kuluja varten.
 */
export function pgValvonta(db, tuotteet, { haeTilaus } = {}) {
  return {
    taydennaKulut: haeTilaus
      ? (lista, max, { kuiva = false } = {}) => taydennaKulut(lista, {
        haeTilaus, max,
        tallenna: kuiva ? null : (id, k) => db`update orders set printify_cost = ${k.kulu}, printify_cost_ex_tax = ${k.kuluIlmanAlv},
          printify_product_cost = ${k.tuotteet} where id = ${id}`,
      })
      : null,
    pysaytetyt: async () => db`select * from orders where status = 'maksettu' and printify_status = 'pysaytetty' order by paid_at limit 50`,
    lueKv: async (k) => (await db`select value from kv where key = ${k}`)[0]?.value ?? null,
    kirjoitaKv: async (k, v) => {
      await db`insert into kv (key, value) values (${k}, ${v}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
    },
    maksetutValilla: async (alku, loppu) => db`select * from orders where status = 'maksettu' and paid_at >= ${alku} and paid_at < ${loppu} order by paid_at`,
    jumissa: async () => db`select * from orders where status = 'maksettu' and printify_status in ('ei_lahetetty', 'luotu', 'virhe') order by paid_at limit 50`,
    hitaat: async () => Number((await db`select count(*)::int as n from orders where status = 'maksettu' and printify_status = 'tuotannossa'
      and sent_to_production_at < now() - interval '10 days'`)[0].n),
    tuotteetSlugilla: async () => new Map((await tuotteet()).map((p) => [p.slug, p])),
  };
}
