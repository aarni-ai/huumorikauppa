#!/usr/bin/env python3
"""
Etusivun pääkuva (joulu 2026): oikeat tuotekuvat ja hinnat kaupan rajapinnasta (https://huumorikauppa.fi/api/products).
Ei päivämääriä eikä alennuksia kuvassa (ne vanhenisivat). Aja uudelleen, jos tuotteet tai hinnat muuttuvat:
  python3 scripts/etusivun-kuva.py
Kirjoittaa public/images/etusivu-joulu-{480,800,1200,1672}.webp ja etusivu-joulu.png (jakokuva).
"""
import io, json, os, sys, urllib.request, colorsys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

API = "https://huumorikauppa.fi/api/products?slug="
TUOTTEET = [  # slug, väri (variant_images), kategoria-teksti
    ("tonttu-koeajalla-t-paita-jouluun", "Punainen", "T-paita"),
    ("olen-elakkeella-huppari", "Punainen", "Huppari"),
    ("joulupukin-virallinen-testaaja-t-paita-jouluun", "Musta", "T-paita"),
    ("kalamies-t-paita", "Valkoinen", "T-paita"),
]
EDULLISIN_TPAITA = "saatanan-tunarit-t-paita"
F = "/System/Library/Fonts/Supplemental/"
W, H = 1672, 941
JUURI = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "images")


def hae(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read()


def hinta(x):
    return f"{x:.2f}".replace(".", ",") + " €"


def main():
    tuotteet = []
    for slug, vari, tyyppi in TUOTTEET:
        p = json.loads(hae(API + slug))
        vi = (p.get("variants") or {}).get("variant_images") or {}
        kuva = vi.get(vari) or p["images"][0]
        kuva = kuva[0] if isinstance(kuva, list) else kuva
        tuotteet.append((Image.open(io.BytesIO(hae(kuva))).convert("RGB"), float(p["price"]), tyyppi))

    def hsl(h, s, l):
        r, g, b = colorsys.hls_to_rgb(h / 360, l / 100, s / 100)
        return tuple(int(v * 255) for v in (r, g, b))

    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    a, b = hsl(355, 70, 22), hsl(355, 65, 36)
    for x in range(W):
        t = x / W
        d.line([(x, 0), (x, H)], fill=tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)))
    # Hiutaleet
    import random
    random.seed(7)
    for _ in range(90):
        # Hiutaleet vain tekstialueen ulkopuolelle (luettavuus).
        x, y, r = random.randint(790, W), random.randint(0, H), random.choice([2, 3, 4])
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 120))
    musta = ImageFont.truetype(F + "Arial Black.ttf", 86)
    lihava = ImageFont.truetype(F + "Arial Bold.ttf", 42)
    pieni = ImageFont.truetype(F + "Arial Bold.ttf", 32)
    hintaf = ImageFont.truetype(F + "Arial Black.ttf", 34)
    x0 = 90
    d.text((x0, 100), "HUUMORIKAUPPA.FI", font=pieni, fill=(255, 214, 10))
    y = 160
    for rivi in ["Hauskat", "joululahjat", "paidoista", "huppareihin"]:
        d.text((x0, y), rivi, font=musta, fill="white")
        y += 102
    # Edullisin t-paita (suora kilpailijavertailu 24,90 €, api/_lib/kokohinnat.js), vaikka kuvan paidat olisivat kalliimpia.
    tp = min([p for _, p, t in tuotteet if t == "T-paita"] + [float(json.loads(hae(API + EDULLISIN_TPAITA))["price"])])
    hp = min(p for _, p, t in tuotteet if t == "Huppari")
    keski = ImageFont.truetype(F + "Arial Bold.ttf", 36)
    d.text((x0, y + 30), f"T-paidat alkaen {hinta(tp)}, hupparit alkaen {hinta(hp)}", font=keski, fill=(255, 236, 236))
    d.text((x0, y + 80), "Suomalaista huumoria lahjaksi.", font=lihava, fill=(255, 236, 236))
    bx, by, bw, bh = x0, y + 168, 470, 96
    d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=48, fill=(255, 214, 10))
    tw = d.textlength("Katso joululahjat", font=lihava)
    d.text((bx + (bw - tw) / 2, by + 24), "Katso joululahjat", font=lihava, fill=(60, 10, 15))

    def kortti(k, x, y, s, kulma, hintateksti):
        m = min(k.size)
        k = k.crop(((k.width - m) // 2, (k.height - m) // 2, (k.width + m) // 2, (k.height + m) // 2)).resize((s, s), Image.LANCZOS)
        dd = ImageDraw.Draw(k)
        tw = dd.textlength(hintateksti, font=hintaf)
        dd.rounded_rectangle([s - tw - 52, s - 74, s - 16, s - 18], radius=28, fill=(25, 25, 25))
        dd.text((s - tw - 34, s - 68), hintateksti, font=hintaf, fill="white")
        maski = Image.new("L", (s, s), 0)
        ImageDraw.Draw(maski).rounded_rectangle([0, 0, s, s], radius=36, fill=255)
        varjo = Image.new("RGBA", (s + 60, s + 60), (0, 0, 0, 0))
        ImageDraw.Draw(varjo).rounded_rectangle([30, 40, s + 30, s + 40], radius=36, fill=(0, 0, 0, 100))
        varjo = varjo.filter(ImageFilter.GaussianBlur(14))
        pala = Image.new("RGBA", (s + 60, s + 60), (0, 0, 0, 0))
        pala.alpha_composite(varjo)
        kk = k.convert("RGBA")
        kk.putalpha(maski)
        pala.alpha_composite(kk, (30, 30))
        pala = pala.rotate(kulma, resample=Image.BICUBIC, expand=True)
        img.paste(pala, (x, y), pala)

    paikat = [(850, 60, 390, -4), (1232, 90, 370, 5), (880, 505, 360, 3), (1265, 505, 350, -3)]
    for (k, p, _), (x, yy, s, kulma) in zip(tuotteet, paikat):
        kortti(k, x, yy, s, kulma, hinta(p))
    for w in (480, 800, 1200, 1672):
        img.resize((w, round(H * w / W)), Image.LANCZOS).save(os.path.join(JUURI, f"etusivu-joulu-{w}.webp"), "WEBP", quality=82, method=6)
    img.save(os.path.join(JUURI, "etusivu-joulu.png"), optimize=True)
    print("ok", [hinta(p) for _, p, _ in tuotteet])


if __name__ == "__main__":
    sys.exit(main())
