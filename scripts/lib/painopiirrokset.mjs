// Omat vektoripiirrokset matalaresoluutioisten painokuvien tilalle (3.11.2026, scripts/painotiedostot-uudelleenpiirto.mjs).
// Jokainen piirros tehdään alkuperäisen kuvan kuvasuhteeseen ja sen näkyvän alueen sisään, joten Printifyn x, y ja
// scale pysyvät ennallaan. Ei valokuvia oikeista ihmisistä, ei kolmansien osapuolten logoja, hahmoja tai emojeja, ei
// setelin jäljitelmää. Suomen leijona: valtion vaakuna (Wikimedia Commons, julkinen), kilpi ja ruusut poistettu.
import { readFileSync } from "node:fs";
const D = new URL(".", import.meta.url).pathname;

const leijona = readFileSync(D + "leijona-suomi.svg", "utf8")
  .replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "")
  .replaceAll('fill="#fff"', 'fill="#d5dae0"');

function kaari(id, cx, cy, r, alku, loppu, ylos = true) {
  // ympyränkaari kulmasta alku kulmaan loppu (asteina, 0 = oikea, myötäpäivään y alas)
  const p = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x1, y1] = p(alku), [x2, y2] = p(loppu);
  return `<path id="${id}" d="M${x1},${y1} A${r},${r} 0 0 ${ylos ? 1 : 0} ${x2},${y2}" fill="none"/>`;
}

export const PIIRROKSET = {
  // Amatimies: tietyömerkki (oma piirros), punainen reuna, keltainen pohja, mustat kuviot
  merkki: (W, H) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
    <g transform="translate(75,173) scale(${390 / 400})">
      <path d="M200,8 Q212,8 219,20 L392,318 Q398,330 392,340 Q386,348 372,348 L28,348 Q14,348 8,340 Q2,330 8,318 L181,20 Q188,8 200,8 Z" fill="#e30613"/>
      <path d="M200,62 L350,320 L50,320 Z" fill="#ffc400" stroke="#ffc400" stroke-width="14" stroke-linejoin="round"/>
      <circle cx="176" cy="150" r="20" fill="#111"/>
      <path d="M158,178 Q176,170 196,182 L224,232 L208,240 L192,214 L196,262 L214,300 L196,306 L174,266 L156,306 L138,300 L158,252 L152,206 L128,236 L116,226 Z" fill="#111"/>
      <path d="M190,206 L262,270" stroke="#111" stroke-width="10" stroke-linecap="round"/>
      <path d="M248,262 L284,262 L276,286 L254,286 Z" fill="#111"/>
      <path d="M232,306 Q262,262 300,276 Q322,284 330,306 Z" fill="#111"/>
    </g></svg>`,

  // Kalju: oma kaljupäinen karhu (ei olutmerkin tyyliä) ja teksti KALJU. Valkoisella tekstillä (tummat paidat) vaalea
  // ääriviiva, jotta tumma pää erottuu.
  kalju: (W, H, teksti = "#111") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
    <g transform="translate(${W / 2},${H * 0.4})">
      ${teksti === "#111" ? "" : '<g fill="#f2f2f2"><circle cx="-150" cy="-150" r="72"/><circle cx="150" cy="-150" r="72"/><ellipse rx="210" ry="200"/></g>'}
      <circle cx="-150" cy="-150" r="62" fill="#3b2412"/><circle cx="-150" cy="-150" r="30" fill="#c98b52"/>
      <circle cx="150" cy="-150" r="62" fill="#3b2412"/><circle cx="150" cy="-150" r="30" fill="#c98b52"/>
      <ellipse cx="0" cy="0" rx="200" ry="190" fill="#3b2412"/>
      <ellipse cx="0" cy="-118" rx="128" ry="70" fill="#e8b98a"/>
      <ellipse cx="-44" cy="-140" rx="40" ry="14" fill="#fff" opacity=".8" transform="rotate(-14 -44 -140)"/>
      <path d="M-6,-186 q-6,-26 8,-40 M14,-187 q6,-28 24,-32" stroke="#3b2412" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M-110,-40 l60,14 M110,-40 l-60,14" stroke="#111" stroke-width="14" stroke-linecap="round"/>
      <circle cx="-80" cy="-6" r="16" fill="#111"/><circle cx="80" cy="-6" r="16" fill="#111"/>
      <ellipse cx="0" cy="80" rx="96" ry="72" fill="#c98b52"/>
      <path d="M-34,40 Q0,26 34,40 Q36,70 0,78 Q-36,70 -34,40 Z" fill="#111"/>
      <path d="M-46,108 Q0,150 46,108 Q0,122 -46,108 Z" fill="#c8102e" stroke="#111" stroke-width="6" stroke-linejoin="round"/>
    </g>
    <text x="${W / 2}" y="${H * 0.89}" text-anchor="middle" font-family="Archivo Black" font-size="${W * 0.2}" fill="${teksti}">KALJU</text>
  </svg>`,

  // ICE AATANA: kaareva teksti ja oma tammenterhohahmo, toinen silmä mustana
  ice: (W, H) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <defs>${kaari("k", 512, 560, 400, 205, 335)}
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2b07a"/><stop offset="1" stop-color="#a8723f"/></linearGradient></defs>
    <text font-family="Luckiest Guy" font-size="150" fill="url(#g)" stroke="#4a2c12" stroke-width="10" paint-order="stroke" letter-spacing="6"><textPath href="#k" startOffset="50%" text-anchor="middle">ICE AATANA</textPath></text>
    <g transform="translate(512,640)">
      <path d="M-170,-60 Q-180,170 0,320 Q180,170 170,-60 Z" fill="#b5753a" stroke="#4a2c12" stroke-width="12" stroke-linejoin="round"/>
      <path d="M-120,40 Q-110,180 0,280" stroke="#d99a5b" stroke-width="18" fill="none" stroke-linecap="round"/>
      <path d="M-215,-40 Q-220,-190 0,-200 Q220,-190 215,-40 Q0,-10 -215,-40 Z" fill="#6b4220" stroke="#4a2c12" stroke-width="12" stroke-linejoin="round"/>
      <path d="M-160,-150 L-120,-50 M-100,-180 L-60,-30 M-30,-195 L0,-25 M40,-190 L60,-25 M110,-170 L120,-35 M170,-130 L170,-45 M-190,-90 L190,-150 M-200,-60 L200,-110" stroke="#4a2c12" stroke-width="6" opacity=".55"/>
      <path d="M0,-200 Q-6,-250 28,-280" stroke="#4a2c12" stroke-width="16" fill="none" stroke-linecap="round"/>
      <circle cx="-68" cy="40" r="62" fill="#fff" stroke="#4a2c12" stroke-width="10"/>
      <circle cx="-56" cy="48" r="26" fill="#111"/><circle cx="-48" cy="38" r="8" fill="#fff"/>
      <circle cx="74" cy="44" r="64" fill="#3d2b52" stroke="#4a2c12" stroke-width="8"/>
      <circle cx="74" cy="44" r="44" fill="#1e1428"/>
      <path d="M44,40 Q74,58 104,40" stroke="#b5753a" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M-40,150 Q0,128 40,150" stroke="#4a2c12" stroke-width="12" fill="none" stroke-linecap="round"/>
      <rect x="-26" y="148" width="22" height="34" rx="4" fill="#fff" stroke="#4a2c12" stroke-width="6"/>
      <rect x="4" y="148" width="22" height="34" rx="4" fill="#fff" stroke="#4a2c12" stroke-width="6"/>
    </g></svg>`,

  // Saatanan tunarit: paksusankaiset silmälasit (ei valokuvaa)
  lasit: (W, H) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
    <g transform="translate(${W / 2},${H / 2}) scale(${W / 250})">
      <path d="M-112,-38 Q-112,-50 -100,-50 L-18,-50 Q-8,-50 -8,-40 L-10,10 Q-12,40 -42,42 L-86,42 Q-110,40 -112,12 Z" fill="#d9dee3" fill-opacity=".5" stroke="#111" stroke-width="12" stroke-linejoin="round"/>
      <path d="M112,-38 Q112,-50 100,-50 L18,-50 Q8,-50 8,-40 L10,10 Q12,40 42,42 L86,42 Q110,40 112,12 Z" fill="#d9dee3" fill-opacity=".5" stroke="#111" stroke-width="12" stroke-linejoin="round"/>
      <path d="M-10,-30 Q0,-40 10,-30" stroke="#111" stroke-width="10" fill="none"/>
      <path d="M-112,-36 L-124,-30 M112,-36 L124,-30" stroke="#111" stroke-width="10" stroke-linecap="round"/>
      <path d="M-92,-32 L-64,-32 M30,-32 L58,-32" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".9"/>
    </g></svg>`,

  // Slay queen: oma suukkohymiö (ei Applen emojia)
  slay: (W, H) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
    <defs><radialGradient id="f" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#ffe066"/><stop offset=".7" stop-color="#fbbf24"/><stop offset="1" stop-color="#e8960c"/></radialGradient></defs>
    <g transform="translate(${W / 2},${H / 2}) scale(${H / 210})">
      <circle r="98" fill="url(#f)"/>
      <path d="M-62,-14 Q-40,4 -18,-14" stroke="#5a3a12" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M18,-14 Q40,4 62,-14" stroke="#5a3a12" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M-58,-8 l-8,10 M-48,-2 l-4,12 M-36,0 l0,12 M-24,-4 l4,11 M24,-4 l-4,11 M36,0 l0,12 M48,-2 l4,12 M58,-8 l8,10" stroke="#111" stroke-width="4" stroke-linecap="round"/>
      <path d="M-58,-44 Q-40,-56 -22,-48 M22,-48 Q40,-56 58,-44" stroke="#5a3a12" stroke-width="6" fill="none" stroke-linecap="round"/>
      <ellipse cx="-62" cy="28" rx="18" ry="10" fill="#f9739a" opacity=".55"/><ellipse cx="62" cy="28" rx="18" ry="10" fill="#f9739a" opacity=".55"/>
      <path d="M-30,48 Q-16,30 0,40 Q16,30 30,48 Q16,58 0,52 Q-16,58 -30,48 Z" fill="#ec4899" stroke="#9d174d" stroke-width="4"/>
      <path d="M-30,48 Q-14,72 0,66 Q14,72 30,48 Q16,58 0,52 Q-16,58 -30,48 Z" fill="#f472b6" stroke="#9d174d" stroke-width="4"/>
      <ellipse cx="-10" cy="58" rx="7" ry="3" fill="#fff" opacity=".8"/>
      <path d="M96,-74 c-8,-14 -28,-6 -18,10 l18,18 18,-18 c10,-16 -10,-24 -18,-10 z" fill="#ec4899"/>
    </g></svg>`,

  // Suomi Finland: kaarevat tekstit ja vaakunaleijona ilman kilpeä ja ruusuja (valtion vaakuna, vapaa käyttää)
  suomi: (W, H) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}">
    <defs>${kaari("y", W / 2, H * 0.62, W * 0.62, 238, 302)}${kaari("a", W / 2, H * 0.36, W * 0.62, 142, 38, false)}</defs>
    <text font-family="Rammetto One" font-size="${W * 0.16}" fill="#1f78c1"><textPath href="#y" startOffset="50%" text-anchor="middle">SUOMI</textPath></text>
    <svg x="${W * 0.12}" y="${H * 0.2}" width="${W * 0.76}" height="${H * 0.56}" viewBox="9 6 196 250">${leijona}</svg>
    <text font-family="Rammetto One" font-size="${W * 0.14}" fill="#1f78c1"><textPath href="#a" startOffset="50%" text-anchor="middle">FINLAND</textPath></text>
  </svg>`,

  // Tonnin seteli: oma setelimäinen kehys, ei muotokuvaa, ei virallisia merkintöjä, ei rahayksikköä
  seteli: (W, H) => {
    const r = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      r.push(`<ellipse rx="185" ry="78" transform="rotate(${(a * 180) / Math.PI})" fill="none" stroke="#2e6b55" stroke-width="2.4" opacity=".7"/>`);
    }
    const aalto = (y, amp, vaihe) => {
      let d = `M60,${y}`;
      for (let x = 60; x <= 1080; x += 10) d += ` L${x},${y + amp * Math.sin(x / 22 + vaihe)}`;
      return `<path d="${d}" fill="none" stroke="#2e6b55" stroke-width="2.4" opacity=".75"/>`;
    };
    const reuna = [aalto(78, 9, 0), aalto(78, 9, Math.PI), aalto(758, 9, 0), aalto(758, 9, Math.PI)].join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1140 836">
      <rect x="20" y="20" width="1100" height="796" rx="34" fill="#e6f0e8" stroke="#2e6b55" stroke-width="14"/>
      <rect x="48" y="48" width="1044" height="740" rx="22" fill="none" stroke="#2e6b55" stroke-width="5"/>
      ${reuna}
      <g transform="translate(570,470)">${r.join("")}<circle r="128" fill="#e6f0e8" stroke="#2e6b55" stroke-width="5"/></g>
      <text x="570" y="236" text-anchor="middle" font-family="Alfa Slab One" font-size="66" fill="#2e6b55" letter-spacing="8">TONNIN SETELI</text>
      <text x="570" y="498" text-anchor="middle" font-family="Alfa Slab One" font-size="74" fill="#1d4a3a">1000</text>
      <text x="96" y="176" font-family="Alfa Slab One" font-size="62" fill="#2e6b55">1000</text>
      <text x="1044" y="176" text-anchor="end" font-family="Alfa Slab One" font-size="62" fill="#2e6b55">1000</text>
      <text x="96" y="718" font-family="Alfa Slab One" font-size="62" fill="#2e6b55">1000</text>
      <text x="1044" y="718" text-anchor="end" font-family="Alfa Slab One" font-size="62" fill="#2e6b55">1000</text>
      <text x="570" y="722" text-anchor="middle" font-family="Alfa Slab One" font-size="40" fill="#2e6b55" letter-spacing="6">YKSI TONNI</text>
    </svg>`;
  },

  // Olen eläkkeellä: oma aurinkolasihymiö (ei Applen emojia), alkuperäisen bbox (396,103)-(805,518)
  aurinkolasit: (W, H) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
    <defs><radialGradient id="f" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#ffe066"/><stop offset=".7" stop-color="#fbbf24"/><stop offset="1" stop-color="#e8960c"/></radialGradient></defs>
    <g transform="translate(600,318) scale(1.9)">
      <circle r="104" fill="url(#f)"/>
      <path d="M-52,-84 Q-30,-104 -8,-90 M8,-90 Q30,-104 52,-84" stroke="#5a3a12" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M-104,-46 L104,-46" stroke="#111" stroke-width="12" stroke-linecap="round"/>
      <path d="M-96,-48 L-10,-48 Q-6,-48 -8,-36 Q-14,10 -50,12 Q-90,12 -96,-30 Z" fill="#1f2937" stroke="#111" stroke-width="6"/>
      <path d="M96,-48 L10,-48 Q6,-48 8,-36 Q14,10 50,12 Q90,12 96,-30 Z" fill="#1f2937" stroke="#111" stroke-width="6"/>
      <path d="M-80,-36 L-56,-36 M26,-36 L50,-36" stroke="#9ca3af" stroke-width="5" stroke-linecap="round"/>
      <path d="M-40,46 Q0,74 46,40" stroke="#5a3a12" stroke-width="8" fill="none" stroke-linecap="round"/>
    </g></svg>`,

  // Tässä talossa asuu yksi pomo: kaareva teksti, oma piirretty koira aurinkolaseissa ja rusetissa (POMO). Sisältö
  // alkuperäisen näkyvän alueen sisällä (x 319-883, y 58-592 kuvassa 1200 x 655), koska tuotteissa skaala on yli 1.
  pomo: (W, H) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
    <g transform="translate(${W * 319 / 1200},${H * 58 / 655}) scale(${W / 1200})">
      <defs>${kaari("t1", 282, 330, 300, 212, 328)}${kaari("t2", 282, 330, 246, 217, 323)}</defs>
      <g font-family="Amatic SC" font-weight="700" fill="#111" stroke="#111" stroke-linejoin="round">
        <text font-size="50" stroke-width="2.4" letter-spacing="1"><textPath href="#t1" startOffset="50%" text-anchor="middle">TÄSSÄ TALOSSA ASUU YKSI POMO.</textPath></text>
        <text font-size="42" stroke-width="2" letter-spacing="1"><textPath href="#t2" startOffset="50%" text-anchor="middle">IHMINEN JA YKSI POMO.</textPath></text>
        <text x="282" y="526" text-anchor="middle" font-size="40" stroke-width="2">(ARVAA KUMPI KOMENTAA?)</text>
      </g>
      <g transform="translate(282,300) scale(0.9)">
        <path d="M-70,40 Q-90,150 -60,170 L60,170 Q90,150 70,40 Z" fill="#e0a54a" stroke="#111" stroke-width="6"/>
        <path d="M-40,170 L-40,120 M40,170 L40,120" stroke="#111" stroke-width="5"/>
        <path d="M-86,-70 Q-130,-40 -110,40 Q-90,50 -74,10 Z" fill="#b97a2c" stroke="#111" stroke-width="6"/>
        <path d="M86,-70 Q130,-40 110,40 Q90,50 74,10 Z" fill="#b97a2c" stroke="#111" stroke-width="6"/>
        <path d="M-80,-60 Q-80,-120 0,-120 Q80,-120 80,-60 L74,20 Q60,70 0,74 Q-60,70 -74,20 Z" fill="#e0a54a" stroke="#111" stroke-width="6"/>
        <ellipse cx="0" cy="34" rx="40" ry="30" fill="#f3d39b" stroke="#111" stroke-width="5"/>
        <ellipse cx="0" cy="18" rx="15" ry="10" fill="#111"/>
        <path d="M0,28 L0,44 M-16,48 Q0,58 16,48" stroke="#111" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M-74,-34 L74,-34" stroke="#111" stroke-width="7"/>
        <path d="M-68,-36 L-10,-36 Q-8,-4 -36,0 Q-64,0 -68,-36 Z M68,-36 L10,-36 Q8,-4 36,0 Q64,0 68,-36 Z" fill="#111"/>
        <path d="M-30,80 L0,92 L30,80 L30,110 L0,98 L-30,110 Z" fill="#c8102e" stroke="#111" stroke-width="5"/>
        <rect x="-30" y="118" width="60" height="30" rx="6" fill="#fff" stroke="#111" stroke-width="4"/>
        <text x="0" y="142" text-anchor="middle" font-family="Amatic SC" font-weight="700" font-size="28" fill="#111" stroke="#111" stroke-width="1">POMO</text>
      </g>
    </g>
  </svg>`,
};
