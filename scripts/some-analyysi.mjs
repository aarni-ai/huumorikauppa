#!/usr/bin/env node
/**
 * Somevideoiden tulokset muodoittain (4.11.2026). Cowork kirjaa luvut tiedostoon some/tilastot.csv
 * (yksi rivi per video ja kanava, luvut 7 päivää julkaisusta: Instagram > Reel > Näytä tilastot, TikTok > Analytiikka,
 * YouTube Studio). Skripti yhdistää rivit julkaisulistaan (some/julkaisut.json) ja vertaa:
 *  - muoto (perus, pov, dialogi, aanestys, tarjous)
 *  - versio (v2 = tilanne ensin, v3 = malli paita päällä ja vitsi ensimmäisessä ruudussa)
 *  - julkaisuaika (11-13 / 18-20)
 * Pääluku on keskimääräinen katseluaika; toissijaiset jaot + tallennukset / 1000 katselua ja profiilikäynnit.
 * Suositus 20 seuraavan videon muodoksi tulostuu, kun kahdessa ryhmässä on vähintään 5 videota.
 *
 * Ajo: node scripts/some-analyysi.mjs [--kanava instagram]
 */
import { readFileSync } from "node:fs";

const JUURI = new URL("..", import.meta.url).pathname;
const julkaisut = JSON.parse(readFileSync(`${JUURI}some/julkaisut.json`, "utf8"));
const [otsake, ...rivit] = readFileSync(`${JUURI}some/tilastot.csv`, "utf8").trim().split(/\r?\n/);
const sarakkeet = otsake.split(",");
const kanava = process.argv.includes("--kanava") ? process.argv[process.argv.indexOf("--kanava") + 1].toLowerCase() : null;
const luku = (x) => (x === "" || x == null ? null : Number(String(x).replace(",", ".")));

const tiedot = rivit.filter(Boolean).map((r) => Object.fromEntries(r.split(",").map((v, i) => [sarakkeet[i], v.trim()])))
  .filter((r) => !kanava || r.kanava.toLowerCase() === kanava)
  .map((r) => {
    const j = julkaisut.find((x) => x.nro === r.nro.padStart(2, "0"));
    return j && { ...r, muoto: j.muoto, versio: j.nimi.match(/-(v\d)$/)?.[1] || "v1", aika: j.aika, katselut: luku(r.katselut), aika_s: luku(r.keskikatseluaika_s), loppuun: luku(r.katsottu_loppuun_pct), jaot: (luku(r.jaot) || 0) + (luku(r.tallennukset) || 0), profiili: luku(r.profiilikaynnit) || 0 };
  }).filter(Boolean);

if (!tiedot.length) { console.log("some/tilastot.csv on tyhjä. Cowork kirjaa luvut 7 päivää julkaisun jälkeen."); process.exit(0); }

const ryhmita = (avain) => {
  const r = {};
  for (const t of tiedot) (r[t[avain]] ||= []).push(t);
  return Object.entries(r).map(([nimi, xs]) => {
    const katselut = xs.reduce((s, x) => s + (x.katselut || 0), 0);
    const ajalliset = xs.filter((x) => x.aika_s != null && x.katselut);
    const painotettu = ajalliset.length ? ajalliset.reduce((s, x) => s + x.aika_s * x.katselut, 0) / ajalliset.reduce((s, x) => s + x.katselut, 0) : null;
    return { nimi, videoita: new Set(xs.map((x) => x.nro)).size, katselut, keskikatselu: painotettu, katselutVideo: katselut / xs.length, jaot1000: katselut ? (1000 * xs.reduce((s, x) => s + x.jaot, 0)) / katselut : 0, profiili: xs.reduce((s, x) => s + x.profiili, 0) };
  }).sort((a, b) => (b.keskikatselu ?? -1) - (a.keskikatselu ?? -1));
};
const f = (x, d = 1) => (x == null ? "-" : x.toFixed(d).replace(".", ","));
for (const [avain, otsikko] of [["muoto", "Muoto"], ["versio", "Versio"], ["aika", "Julkaisuaika"]]) {
  console.log(`\n${otsikko}${kanava ? ` (${kanava})` : ""}:`);
  for (const g of ryhmita(avain)) console.log(`  ${g.nimi.padEnd(10)} ${String(g.videoita).padStart(3)} videota, katseluaika ${f(g.keskikatselu)} s, katseluja/video ${f(g.katselutVideo, 0)}, jaot+tallennukset ${f(g.jaot1000)}/1000, profiilikäynnit ${g.profiili}`);
}
const muodot = ryhmita("muoto").filter((g) => g.videoita >= 5 && g.keskikatselu != null);
const versiot = ryhmita("versio").filter((g) => g.videoita >= 5 && g.keskikatselu != null);
console.log(muodot.length >= 2
  ? `\nSuositus: 20 seuraavaa videota muodossa "${muodot[0].nimi}"${versiot.length >= 2 ? ` ja versiolla ${versiot[0].nimi}` : ""} (pisin keskimääräinen katseluaika, ${f(muodot[0].keskikatselu)} s).`
  : "\nEi vielä suositusta: tarvitaan vähintään kaksi muotoa, joissa kussakin vähintään 5 videota.");
