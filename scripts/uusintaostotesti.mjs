/**
 * Uudelleenostokoodien testi tuotantoa vasten (2.11.2026): maksettu TESTI-tilaus t-paidasta (cron lahjakorttitesti
 * &tuote=1, ei Printifyä) -> kiitossivun koodit (/api/order) -> kassan tarkistus: kiitoskoodi samalla ja eri
 * sähköpostilla, ystäväkoodi ystävällä ja ostajalla itsellään -> siivous (koodit mitätöidään, tilaus perutaan).
 *   node scripts/uusintaostotesti.mjs
 */
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.cron.local", "utf8").split("\n").filter((r) => r.includes("=")).map((r) => [r.slice(0, r.indexOf("=")), r.slice(r.indexOf("=") + 1).replace(/^"|"$/g, "")]));
const K = "https://huumorikauppa.fi";
const cron = (q) => fetch(`${K}/api/cron/tilaukset?${q}`, { headers: { Authorization: `Bearer ${env.CRON_SECRET}` } }).then((r) => r.json());
const koodi = (code, email) => fetch(`${K}/api/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "alennuskoodi", code, email }) }).then((r) => r.json());
const tulos = {};
try {
  const luo = await cron("tehtava=lahjakorttitesti&vaihe=luo&tuote=1");
  const o = await fetch(`${K}/api/order?session_id=${luo.istunto}`).then((r) => r.json());
  const k = o.koodit || {};
  tulos.kiitossivu = { kiitos: k.kiitos ? `${k.kiitos.koodi.slice(0, 7)}*** ${k.kiitos.prosentti} %` : null, voimassa: k.kiitos?.voimassa?.slice(0, 10), ystava: k.ystava ? k.ystava.linkki.replace(/YSTAVA-.*/, "YSTAVA-***") : null };
  tulos.kiitosSamaEmail = await koodi(k.kiitos?.koodi, "kassatesti@huumorikauppa.fi");
  tulos.kiitosEriEmail = await koodi(k.kiitos?.koodi, "joku@example.com");
  tulos.ystavaYstavalla = await koodi(k.ystava?.koodi, "ystava@example.com");
  tulos.ystavaOstajalla = await koodi(k.ystava?.koodi, "kassatesti@huumorikauppa.fi");
} finally {
  tulos.siivous = await cron("tehtava=lahjakorttitesti&vaihe=siivoa");
}
tulos.kiitosSiivouksenJalkeen = "tarkistettu siivouksessa (voimassa = nyt)";
console.log(JSON.stringify(tulos, null, 1));
