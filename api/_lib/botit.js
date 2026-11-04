/**
 * Bottiliikenteen tunnistus ja aitousluokan kooste (3.11.2026). 70 % uusista tuotesivun katseluista pysyi sivulla
 * 10-30 s ilman yhtään klikkausta: automaattinen liikenne (JavaScriptiä ajavat indeksoijat, linkkien tarkistajat,
 * headless-selaimet) vääristi mittarit, suppilon ja A/B-testit.
 *
 * Käynti on aito vain, kun
 *   1. User-Agent on tavallinen selain (ei botti, ei kirjasto, ei headless, ei vanhentunut Chrome/Firefox),
 *   2. pyyntö ei tule tunnetulta datakeskuksen/pilvipalvelun IP-alueelta (IP:tä ei tallenneta, vain tarkistetaan),
 *   3. selain ei näytä headless-merkkejä (navigator.webdriver, HeadlessChrome, ei kieliä, ikkuna 0 x 0, ...) ja
 *   4. käynnillä on havaittu ihmisen vuorovaikutus: kosketus, hiiren liike tai painallus, rulla tai näppäin
 *      (src/lib/aitous.ts; pelkkä ohjelmallinen vieritys ei riitä).
 * Botit eivät mene mittareihin, suppiloon, tuoteseurantaan, laskeutumisiin eivätkä A/B-koosteisiin; ne lasketaan
 * erikseen syittäin tauluun aitous (päivä x mittari x luokka), jotta raportti näyttää aitojen osuuden.
 */

const AITOUS = ["aito", "headless", "passiivinen"];
export const BOTTISYYT = ["ua-botti", "ua-epatavallinen", "datakeskus", "headless", "ei-vuorovaikutusta", "ei-signaalia"];
export const AITOUS_MITTARIT = ["kaynti", "laskeutuminen", "tuotesivu", "suppilo", "lisamyynti", "toimitustesti", "ensitilaus", "joulukalenteri"];

/** Epätavallinen User-Agent: ei selaimen muotoa, kirjasto, headless tai vanhentunut selainversio (bottien vakio-UA). */
export function epatavallinenUa(ua) {
  const s = String(ua || "");
  if (s.length < 40 || !/^Mozilla\/5\.0 \(/.test(s)) return true;
  if (/HeadlessChrome|PhantomJS|Electron\/|jsdom|Cypress|Chrome-Lighthouse|SlimerJS|HtmlUnit|Splash/i.test(s)) return true;
  const chrome = s.match(/(?:Chrome|CriOS)\/(\d+)\./);
  if (chrome && Number(chrome[1]) < 100) return true;
  const firefox = s.match(/(?:Firefox|FxiOS)\/(\d+)\./);
  if (firefox && Number(firefox[1]) < 90) return true;
  return false;
}

// Tunnettuja datakeskusten ja pilvipalveluiden IPv4-alueita (AWS, Google Cloud, Azure, Hetzner, OVH, DigitalOcean,
// Linode, Vultr, Oracle, Contabo, Alibaba). Pieni staattinen lista, ei maksullista palvelua: kattaa tavallisimmat
// indeksoijien ja tarkistajien lähteet, ei kaikkia.
const DATAKESKUKSET_V4 = `
3.0.0.0/9 13.32.0.0/12 13.48.0.0/13 13.64.0.0/11 13.104.0.0/14 15.152.0.0/13 15.160.0.0/12 15.184.0.0/13 16.16.0.0/13
16.24.0.0/14 16.50.0.0/15 16.62.0.0/15 18.128.0.0/9 34.0.0.0/8 35.152.0.0/13 35.160.0.0/11 35.184.0.0/13 35.192.0.0/11
35.224.0.0/12 35.240.0.0/13 44.192.0.0/10 52.0.0.0/10 52.64.0.0/12 52.80.0.0/13 52.88.0.0/13 52.192.0.0/11 54.64.0.0/10
54.144.0.0/12 54.160.0.0/11 54.192.0.0/11 54.224.0.0/11 20.0.0.0/8 40.64.0.0/10 51.104.0.0/14 51.124.0.0/16 51.132.0.0/16
51.136.0.0/15 51.140.0.0/14 52.96.0.0/12 52.112.0.0/12 52.128.0.0/11 104.40.0.0/13 104.208.0.0/13 137.116.0.0/15
168.61.0.0/16 168.62.0.0/15 191.232.0.0/13 5.9.0.0/16 46.4.0.0/16 49.12.0.0/15 65.21.0.0/16 65.108.0.0/15 78.46.0.0/15
88.198.0.0/16 88.99.0.0/16 95.216.0.0/15 116.202.0.0/15 128.140.0.0/17 135.181.0.0/16 136.243.0.0/16 138.201.0.0/16
142.132.128.0/17 144.76.0.0/16 148.251.0.0/16 157.90.0.0/16 159.69.0.0/16 162.55.0.0/16 167.235.0.0/16 168.119.0.0/16
176.9.0.0/16 178.63.0.0/16 188.40.0.0/16 195.201.0.0/16 213.133.96.0/19 5.135.0.0/16 5.196.0.0/16 37.59.0.0/16
37.187.0.0/16 51.38.0.0/16 51.68.0.0/16 51.75.0.0/16 51.77.0.0/16 51.83.0.0/16 51.89.0.0/16 51.91.0.0/16 51.195.0.0/16
51.210.0.0/16 54.36.0.0/14 87.98.128.0/17 91.121.0.0/16 92.222.0.0/16 94.23.0.0/16 137.74.0.0/16 141.94.0.0/15
145.239.0.0/16 147.135.0.0/16 149.202.0.0/16 151.80.0.0/16 164.132.0.0/16 176.31.0.0/16 178.32.0.0/15 188.165.0.0/16
193.70.0.0/17 213.32.0.0/16 217.182.0.0/16 46.101.0.0/16 64.225.0.0/16 68.183.0.0/16 104.131.0.0/16 104.236.0.0/16
128.199.0.0/16 134.122.0.0/16 134.209.0.0/16 137.184.0.0/16 138.68.0.0/16 138.197.0.0/16 139.59.0.0/16 142.93.0.0/16
143.110.128.0/17 143.198.0.0/16 146.190.0.0/16 157.230.0.0/16 157.245.0.0/16 159.65.0.0/16 159.89.0.0/16 159.203.0.0/16
159.223.0.0/16 161.35.0.0/16 164.90.0.0/16 164.92.64.0/18 165.22.0.0/16 165.227.0.0/16 167.71.0.0/16 167.99.0.0/16
167.172.0.0/16 170.64.128.0/17 174.138.0.0/17 178.62.0.0/16 178.128.0.0/16 188.166.0.0/16 192.241.128.0/17
198.199.64.0/18 206.81.0.0/19 206.189.0.0/16 209.97.128.0/18 45.33.0.0/17 45.56.64.0/18 45.79.0.0/16 50.116.0.0/18
66.175.208.0/20 96.126.96.0/19 139.162.0.0/16 172.104.0.0/15 173.255.192.0/18 192.155.80.0/20 198.58.96.0/19
45.32.0.0/16 45.63.0.0/17 45.76.0.0/15 66.42.32.0/19 104.156.224.0/19 104.207.128.0/19 108.61.0.0/16 140.82.0.0/16
144.202.0.0/16 149.28.0.0/16 155.138.128.0/17 207.148.0.0/18 209.250.224.0/19 217.69.0.0/20 129.146.0.0/16
129.213.0.0/16 130.61.0.0/16 132.145.0.0/16 140.238.0.0/16 141.144.0.0/16 150.136.0.0/16 152.67.0.0/16 158.101.0.0/16
193.122.0.0/16 62.171.128.0/17 144.91.64.0/18 161.97.0.0/16 164.68.96.0/19 173.212.192.0/18 207.180.192.0/18
8.208.0.0/12 47.74.0.0/15 47.88.0.0/14 47.240.0.0/14`.trim().split(/\s+/);

// IPv6: AWS, Google Cloud, Azure, Hetzner, OVH, DigitalOcean, Linode, Vultr
const DATAKESKUKSET_V6 = ["2600:1f00::/24", "2600:1900::/28", "2603:1000::/24", "2a01:4f8::/29", "2001:41d0::/32", "2604:a880::/32", "2a03:b0c0::/32", "2600:3c00::/27", "2001:19f0::/32"];

const v4luku = (ip) => {
  const o = ip.split(".").map(Number);
  return o.length === 4 && o.every((x) => Number.isInteger(x) && x >= 0 && x <= 255) ? ((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3] : null;
};
const V4 = DATAKESKUKSET_V4.map((c) => {
  const [ip, b] = c.split("/");
  const maski = Number(b) === 0 ? 0 : (0xffffffff << (32 - Number(b))) >>> 0;
  return { verkko: (v4luku(ip) & maski) >>> 0, maski };
});
function v6luku(ip) {
  const s = ip.toLowerCase().split("%")[0];
  if (!/^[0-9a-f:]+$/.test(s) || !s.includes(":")) return null;
  const [a, b = ""] = s.split("::");
  const vasen = a ? a.split(":") : [], oikea = b ? b.split(":") : [];
  const osat = s.includes("::") ? [...vasen, ...Array(8 - vasen.length - oikea.length).fill("0"), ...oikea] : vasen;
  if (osat.length !== 8) return null;
  return osat.reduce((x, h) => (x << 16n) + BigInt(parseInt(h || "0", 16)), 0n);
}
const V6 = DATAKESKUKSET_V6.map((c) => {
  const [ip, b] = c.split("/");
  const maski = ((1n << 128n) - 1n) ^ ((1n << BigInt(128 - Number(b))) - 1n);
  return { verkko: v6luku(ip) & maski, maski };
});

export function onDatakeskus(ip) {
  const s = String(ip || "").trim();
  if (!s) return false;
  const v4 = v4luku(s.replace(/^::ffff:/i, ""));
  if (v4 != null) return V4.some((r) => ((v4 & r.maski) >>> 0) === r.verkko);
  const v6 = v6luku(s);
  return v6 != null && V6.some((r) => (v6 & r.maski) === r.verkko);
}

export const IP_OTSAKE = "x-huumorikauppa-ip";
/**
 * Kävijän IP vain tarkistukseen (ei tallenneta). huumorikauppa.fi:n välitys (middleware.ts valitaFetch) kutsuu tätä
 * projektia Vercelin palvelimelta, jolloin x-forwarded-for on välittäjän osoite: silloin käytetään välittäjän
 * lisäämää otsaketta x-huumorikauppa-ip. Puuttuessa tarkistus ohitetaan (ei arvata).
 */
export function asiakkaanIp(headers = {}) {
  const h = (n) => String(headers[n] || "").split(",")[0].trim();
  if (headers["x-huumorikauppa-proxy"]) return h(IP_OTSAKE) || null;
  return h("x-real-ip") || h("x-forwarded-for") || null;
}

/**
 * Botin syy tai null (aito). aitous = selaimen luokka (src/lib/aitous.ts): "aito" | "headless" | "passiivinen".
 * vaadiAitous: luokka on pakollinen (puuttuva = vanha tai muokattu skripti, "ei-signaalia").
 */
export function bottiSyy({ ua, ip, aitous, vaadiAitous = true } = {}) {
  if (epatavallinenUa(ua)) return "ua-epatavallinen";
  if (onDatakeskus(ip)) return "datakeskus";
  if (aitous === "headless") return "headless";
  if (aitous === "passiivinen") return "ei-vuorovaikutusta";
  if (aitous !== "aito" && vaadiAitous) return "ei-signaalia";
  return null;
}

export async function varmistaAitousTaulu(db) {
  await db`create table if not exists aitous (paiva date not null, mittari text not null, luokka text not null,
    maara integer not null default 0, primary key (paiva, mittari, luokka))`;
}

/** Kirjaa yhden luokituksen (luokka "aito" tai botin syy) Helsingin päivälle. */
export async function kirjaaAitous(db, mittari, luokka) {
  if (!AITOUS_MITTARIT.includes(mittari) || !(luokka === "aito" || BOTTISYYT.includes(luokka))) return false;
  await varmistaAitousTaulu(db);
  const paiva = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Helsinki" }).format(new Date());
  await db`insert into aitous (paiva, mittari, luokka, maara) values (${paiva}::date, ${mittari}, ${luokka}, 1)
    on conflict (paiva, mittari, luokka) do update set maara = aitous.maara + 1`;
  return true;
}

/** Kooste: { [mittari]: { kaikki, aidot, botit, osuus, syyt: { syy: n } } } */
export function koostaAitous(rivit) {
  const t = {};
  for (const r of rivit || []) {
    const m = (t[r.mittari] ||= { kaikki: 0, aidot: 0, botit: 0, osuus: null, syyt: {} });
    const n = Number(r.maara) || 0;
    m.kaikki += n;
    if (r.luokka === "aito") m.aidot += n;
    else { m.botit += n; m.syyt[r.luokka] = (m.syyt[r.luokka] || 0) + n; }
  }
  for (const m of Object.values(t)) m.osuus = m.kaikki ? Math.round((m.aidot / m.kaikki) * 1000) / 10 : null;
  return t;
}

export async function aitousValilla(db, alku, loppu) {
  await varmistaAitousTaulu(db);
  const rivit = await db`select mittari, luokka, sum(maara)::int as maara from aitous
    where paiva between ${alku}::date and ${loppu}::date group by mittari, luokka`;
  return { alku, loppu, mittarit: koostaAitous(rivit) };
}

const NIMET = { kaynti: "käynnit", laskeutuminen: "laskeutumiset", tuotesivu: "tuotesivun katselut", suppilo: "suppilon kirjaukset", lisamyynti: "lisämyynnin kirjaukset", toimitustesti: "hintatestin kirjaukset", ensitilaus: "ensitilaustestin kirjaukset" };
const SYYT = { "ua-botti": "botti-UA", "ua-epatavallinen": "epätavallinen UA", datakeskus: "datakeskus", headless: "headless", "ei-vuorovaikutusta": "ei vuorovaikutusta", "ei-signaalia": "ei signaalia" };

/** Raporttirivit: kaikki, botit syittäin, aidot ja aitojen osuus. */
export function aitousRivit(kooste) {
  const m = kooste?.mittarit || {};
  const avaimet = AITOUS_MITTARIT.filter((k) => m[k]?.kaikki);
  if (!avaimet.length) return ["Bottisuodatus: ei vielä luokiteltuja käyntejä."];
  return [`Bottisuodatus ${kooste.alku}${kooste.loppu && kooste.loppu !== kooste.alku ? `–${kooste.loppu}` : ""} (luvut mittareissa ovat vain aitoja):`,
    ...avaimet.map((k) => {
      const x = m[k];
      const syyt = Object.entries(x.syyt).sort((a, b) => b[1] - a[1]).map(([s, n]) => `${SYYT[s] || s} ${n}`).join(", ");
      return `- ${NIMET[k]}: kaikki ${x.kaikki}, aidot ${x.aidot} (${String(x.osuus).replace(".", ",")} %), botit ${x.botit}${syyt ? ` (${syyt})` : ""}`;
    })];
}

export { AITOUS };
