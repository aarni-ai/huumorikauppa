#!/usr/bin/env node
/**
 * /hallinta/some-sivun tarkistus (3.11.2026) Blob-latauksen jälkeen (KAYTTOONOTTO.md kohta 22). Ei avaimia: manifesti
 * ja videot ovat julkisia Blob-osoitteita. Sivu näyttää manifestin videot sen järjestyksessä (src/pages/SomeAdminPage.tsx),
 * joten tarkistetaan, että manifesti vastaa julkaisulistaa some/julkaisut.json:
 *   - sama määrä videoita samassa järjestyksessä (nimi, päivä, aika)
 *   - uudelleen tehdyt videot (-v2) ovat mukana
 *   - päivät eivät mene taaksepäin
 *   - jokainen video vastaa 200 ja on video/mp4
 *
 * Käyttö: node scripts/some-tarkistus.mjs
 */
import { readFileSync } from "node:fs";

const HOST = "f9rxc7ndxeb58y5f.public.blob.vercel-storage.com";
const lista = JSON.parse(readFileSync(new URL("../some/julkaisut.json", import.meta.url), "utf8"));
const manifest = await (await fetch(`https://${HOST}/some/manifest.json?t=${Date.now()}`, { cache: "no-store" })).json();
const videot = manifest.videot || [];
const virheet = [];

if (videot.length !== lista.length) virheet.push(`manifestissa ${videot.length} videota, julkaisulistassa ${lista.length}`);
lista.forEach((j, i) => {
  const v = videot[i];
  if (!v) return;
  if (v.nimi !== j.nimi) virheet.push(`kohta ${i + 1}: manifestissa ${v.nimi}, listassa ${j.nimi}`);
  else if (v.paiva !== j.paiva || v.aika !== j.aika) virheet.push(`${j.nimi}: aika ${v.paiva} ${v.aika}, listassa ${j.paiva} ${j.aika}`);
});
for (let i = 1; i < videot.length; i++) if (videot[i].paiva < videot[i - 1].paiva) virheet.push(`järjestys: ${videot[i].nimi} (${videot[i].paiva}) ennen ${videot[i - 1].paiva}`);

const v2Listassa = lista.filter((j) => j.nimi.endsWith("-v2")).length;
const v2Manifestissa = videot.filter((v) => v.nimi.endsWith("-v2")).length;
if (v2Manifestissa !== v2Listassa) virheet.push(`-v2-videoita manifestissa ${v2Manifestissa}, listassa ${v2Listassa}`);

const tilat = await Promise.all(videot.map(async (v) => {
  const r = await fetch(v.video, { method: "HEAD" }).catch(() => null);
  return r?.ok && /video\/mp4/.test(r.headers.get("content-type") || "") ? null : `${v.nimi}: video ${r ? r.status : "ei vastausta"}`;
}));
virheet.push(...tilat.filter(Boolean));

console.log(`Manifesti päivitetty ${manifest.paivitetty}: ${videot.length} videota, joista ${v2Manifestissa} uutta (-v2). Julkaisulistassa ${lista.length}, joista ${v2Listassa} uutta.`);
if (virheet.length) {
  console.log(`EI VALMIS (${virheet.length} eroa):`);
  for (const v of virheet.slice(0, 15)) console.log(`- ${v}`);
  if (virheet.length > 15) console.log(`- ... ja ${virheet.length - 15} muuta`);
  process.exit(1);
}
console.log("OK: /hallinta/some näyttää julkaisulistan videot oikeassa järjestyksessä, ja jokainen video toimii.");
