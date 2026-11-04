#!/usr/bin/env node
/**
 * Nimipalvelinvaihdon tarkistus (4.11.2026, KAYTTOONOTTO.md kohta 24): kysyy samat tietueet suoraan vanhalta
 * Cloudflare-vyöhykkeeltä (aria/huxley) ja uudelta (annabel/vick) ja näyttää erot. Cloudflare vastaa uuden vyöhykkeen
 * nimipalvelimista jo ennen kuin Domainhotelli vaihtaa nimipalvelimet, joten tämän voi ajaa ennen vaihtoa.
 *
 * Ajo: node scripts/dns-vertailu.mjs [--vaihe 1|2]
 *   vaihe 1 (oletus): ennen nimipalvelinvaihtoa. Kaikki vanhan vyöhykkeen tietueet pitää löytyä uudesta samoina;
 *                     sallitut erot: Resendin kolme tietuetta, DMARC ja Cloudflaren oma _domainconnect.
 *   vaihe 2: Vercel-siirron jälkeen. Juuren A = 216.150.1.1 ja 216.150.16.1, www CNAME bffaf7b5fcbd90db.vercel-dns-016.com
 *            ja _vercel-TXT:ssä uuden projektin arvot.
 * Poistumiskoodi 0 = ei estäviä eroja, 2 = estävä ero, 1 = virhe.
 */
import { Resolver } from "node:dns/promises";

const DOMAIN = "huumorikauppa.fi";
const VANHA = ["aria.ns.cloudflare.com", "huxley.ns.cloudflare.com"];
const UUSI = ["annabel.ns.cloudflare.com", "vick.ns.cloudflare.com"];
const vaihe = process.argv.includes("--vaihe") ? Number(process.argv[process.argv.indexOf("--vaihe") + 1]) : 1;

const KYSELYT = [
  ["@", "A"], ["@", "AAAA"], ["@", "MX"], ["@", "TXT"], ["@", "CAA"],
  ["www", "CNAME"], ["_dmarc", "TXT"], ["_vercel", "TXT"], ["default._domainkey", "TXT"], ["_acme-challenge", "TXT"],
  ["resend._domainkey", "TXT"], ["send", "MX"], ["send", "TXT"],
];
/** Uudessa saa (ja pitää) olla eri: Resend ja DMARC lisätään ennen vaihtoa. */
const SALLITUT_EROT = new Set(["_dmarc TXT", "resend._domainkey TXT", "send MX", "send TXT"]);
const VERCEL_IP = /^(216\.198\.79\.\d+|64\.29\.17\.\d+|216\.150\.(1|16)\.1|76\.76\.21\.21)$/;
const VAIHE2 = {
  "@ A": ["216.150.1.1", "216.150.16.1"],
  "www CNAME": ["bffaf7b5fcbd90db.vercel-dns-016.com"],
};
const VAIHE2_VERCEL_TXT = ["vc-domain-verify=huumorikauppa.fi,f6db53b10f680ae452fe", "vc-domain-verify=www.huumorikauppa.fi,795afe3a11413258ab01"];

const yleinen = new Resolver({ timeout: 4000, tries: 3 });
yleinen.setServers(["1.1.1.1", "8.8.8.8"]);

async function resolveri(nimipalvelimet) {
  const ipt = [];
  for (const n of nimipalvelimet) ipt.push(...(await yleinen.resolve4(n).catch(() => [])));
  if (!ipt.length) throw new Error(`Nimipalvelinten ${nimipalvelimet.join(", ")} osoitteita ei saatu`);
  const r = new Resolver({ timeout: 4000, tries: 3 });
  r.setServers(ipt);
  return r;
}

const nimi = (h) => (h === "@" ? DOMAIN : `${h}.${DOMAIN}`);
async function kysy(r, h, tyyppi) {
  try {
    const v = await r.resolve(nimi(h), tyyppi);
    const arvot = v.map((x) => {
      if (tyyppi === "MX") return `${x.priority} ${String(x.exchange).toLowerCase()}`;
      if (tyyppi === "TXT") return x.join("");
      if (tyyppi === "CAA") return `${x.critical} ${Object.entries(x).filter(([k]) => k !== "critical").map(([k, a]) => `${k} ${a}`).join(" ")}`;
      return String(x).toLowerCase().replace(/\.$/, "");
    });
    // Cloudflaren automaattinen _domainconnect ja TXT-arvojen järjestys eivät ole eroja.
    return arvot.sort();
  } catch (e) {
    if (["ENODATA", "ENOTFOUND"].includes(e.code)) return [];
    return [`VIRHE ${e.code || e.message}`];
  }
}

let vanha, uusi;
try {
  [vanha, uusi] = await Promise.all([resolveri(VANHA), resolveri(UUSI)]);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

let estavia = 0;
const rivit = [];
for (const [h, t] of KYSELYT) {
  const avain = `${h} ${t}`;
  const [a, b] = await Promise.all([kysy(vanha, h, t), kysy(uusi, h, t)]);
  const sama = JSON.stringify(a) === JSON.stringify(b);
  // Juuren A: kaikki Vercelin reunaosoitteet ohjaavat samaan projektiin (domainin omistaja ratkaisee, ei IP).
  const vercelA = avain === "@ A" && a.length && b.length && [...a, ...b].every((ip) => VERCEL_IP.test(ip));
  let tila = sama ? "sama" : vercelA ? "ero (sallittu, Vercel)" : SALLITUT_EROT.has(avain) ? "ero (sallittu)" : "ERO";
  if (vaihe === 2 && VAIHE2[avain]) {
    const ok = JSON.stringify(b) === JSON.stringify([...VAIHE2[avain]].sort());
    tila = ok ? "uusi projekti ok" : "EI UUDEN PROJEKTIN ARVO";
  } else if (vaihe === 2 && avain === "_vercel TXT") {
    tila = VAIHE2_VERCEL_TXT.every((x) => b.includes(x)) ? "uuden projektin TXT ok" : "UUDEN PROJEKTIN TXT PUUTTUU";
  }
  if (/^[A-ZÄÖ]/.test(tila) && !tila.startsWith("ero")) {
    if (tila === "ERO" || tila.startsWith("EI") || tila.includes("PUUTTUU")) estavia++;
  }
  if (b.some((x) => x.startsWith("VIRHE"))) estavia++;
  rivit.push(`${tila.padEnd(26)} ${avain.padEnd(24)} vanha: ${a.join(" | ") || "-"}\n${"".padEnd(51)} uusi:  ${b.join(" | ") || "-"}`);
}
if (vaihe === 1) {
  const dm = (await kysy(uusi, "_dmarc", "TXT")).join("");
  if (/lovable\.dev/i.test(dm)) rivit.push("HUOM: uuden vyöhykkeen DMARC raportoi yhä lovable.dev-osoitteeseen; vaihda Cloudflaren DMARC Managementin osoitteeseen.");
  for (const [h, t] of [["resend._domainkey", "TXT"], ["send", "MX"], ["send", "TXT"]]) {
    if (!(await kysy(uusi, h, t)).length) { rivit.push(`PUUTTUU uudesta vyöhykkeestä: ${h} ${t} (Resend)`); estavia++; }
  }
}
console.log(`Vertailu vaihe ${vaihe}: vanha ${VANHA.join("/")} vs uusi ${UUSI.join("/")}\n`);
console.log(rivit.join("\n"));
console.log(`\n${estavia ? `${estavia} estävää eroa: älä vaihda vielä.` : "Ei estäviä eroja."}`);
process.exit(estavia ? 2 : 0);
