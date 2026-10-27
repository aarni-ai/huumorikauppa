#!/usr/bin/env python3
"""
Printifyn editorin tekstitaso (layerType "text") PNG-kuvaksi, jotta tuotteen voi luoda API:lla (API ei luo tekstitasoja).
Käyttää scripts/printify-eu-tekstitasot.mjs.

  python3 scripts/lib/tekstitaso-kuvaksi.py --font F.ttf --text "rivi1\\nrivi2" --color "#dc3131" \
      --box-width 2137.1 --box-height 447.0 --align center --width-px 3600 --out kuva.png

Printifyn tekstitason width/height ovat tekstin musteen (ink) mitat fonttikoossa font_size. Kuva rajataan musteeseen,
joten Printifyn x, y ja scale (kuvan leveys suhteessa painoalueeseen) sijoittavat sen samaan kohtaan ja kokoon.
Monirivisessä tekstissä riviväli valitaan niin, että kuvasuhde vastaa tekstitason laatikkoa (box-width : box-height).
"""
import argparse
from PIL import Image, ImageDraw, ImageFont


def hex_rgba(s):
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def renderoi(font, text, align, spacing, size):
    pad = size
    mitta = ImageDraw.Draw(Image.new("L", (1, 1)))
    bb = [int(round(v)) for v in mitta.multiline_textbbox((0, 0), text, font=font, align=align, spacing=spacing)]
    im = Image.new("L", (bb[2] - bb[0] + 2 * pad, bb[3] - bb[1] + 2 * pad))
    ImageDraw.Draw(im).multiline_text((pad - bb[0], pad - bb[1]), text, font=font, fill=255, align=align, spacing=spacing)
    return im.crop(im.getbbox())


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--font", required=True)
    a.add_argument("--text", required=True)
    a.add_argument("--color", required=True)
    a.add_argument("--box-width", type=float, required=True)
    a.add_argument("--box-height", type=float, required=True)
    a.add_argument("--align", default="center")
    a.add_argument("--width-px", type=int, default=3600)
    a.add_argument("--out", required=True)
    o = a.parse_args()
    text = o.text.replace("\\n", "\n")
    rivit = text.count("\n") + 1
    size = 400
    font = ImageFont.truetype(o.font, size)
    spacing = 0
    if rivit > 1:
        # Musteen korkeus kasvaa lineaarisesti rivivälin mukana: ratkaise riviväli, jolla kuvasuhde = laatikon kuvasuhde.
        m0 = renderoi(font, text, o.align, 0, size)
        tavoite_k = m0.width * o.box_height / o.box_width
        spacing = max(-size // 2, round((tavoite_k - m0.height) / (rivit - 1)))
    maski = renderoi(font, text, o.align, spacing, size)
    # Lopullinen leveys painoalueen tarkkuudella: piirretään uudelleen fonttikoossa, jolla muste on noin tämän levyinen,
    # ja hienosäädetään Lanczos-skaalauksella.
    leveys = max(200, o.width_px)
    kerroin = leveys / maski.width
    iso = max(8, round(size * kerroin))
    maski = renderoi(ImageFont.truetype(o.font, iso), text, o.align, round(spacing * iso / size), iso)
    korkeus = max(1, round(maski.height * leveys / maski.width))
    maski = maski.resize((leveys, korkeus), Image.LANCZOS)
    kuva = Image.new("RGBA", maski.size, hex_rgba(o.color)[:3] + (0,))
    vari = Image.new("RGBA", maski.size, hex_rgba(o.color))
    kuva.paste(vari, (0, 0), maski)
    kuva.save(o.out, "PNG", optimize=True)
    print(f"{o.out} {kuva.width}x{kuva.height} riviväli {spacing}")


if __name__ == "__main__":
    main()
