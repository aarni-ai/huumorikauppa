#!/usr/bin/env python3
"""
promptaa.py — Printify-tuotteiden massaluonti
Huumorikauppa.fi / Aarni AI

Asennus:
  pip install pillow requests

Komennot:
  python promptaa.py shops                          # Listaa kaupat + Shop ID:t
  python promptaa.py blueprints                     # Listaa blueprint-tyypit (muki, paita, huppari)
  python promptaa.py providers --bp 68              # Listaa tietyn blueprintin tulostajat
  python promptaa.py variants --bp 68 --pv 99       # Listaa variantit
  python promptaa.py create                         # Luo kaikki 100 tuotetta tuotedata.json:sta
  python promptaa.py create --limit 5               # Luo vain 5 ensimmäistä (testi)
  python promptaa.py create --dry-run               # Testaa kuvat ilman Printify-kutsuja
  python promptaa.py create --category ammattihuumori  # Vain yksi kategoria

Pakollinen .env-konfiguraatio:
  PRINTIFY_TOKEN=eyJ...
  PRINTIFY_SHOP_ID=12345678

Valinnainen .env-konfiguraatio (blueprint + provider yhdistelmät):
  BLUEPRINT_MUKI=68
  PROVIDER_MUKI=99
  BLUEPRINT_TPAITA=6
  PROVIDER_TPAITA=99
  BLUEPRINT_HUPPARI=77
  PROVIDER_HUPPARI=99

  Hinnat (senttiä, esim. 2490 = 24,90 €):
  HINTA_MUKI=1990
  HINTA_TPAITA=2490
  HINTA_HUPPARI=3990
"""

import os
import sys
import json
import time
import base64
import argparse
import textwrap
from io import BytesIO
from pathlib import Path

# ---------------------------------------------------------------------------
# .env -lataus (ei vaadi python-dotenv:ia)
# ---------------------------------------------------------------------------

def load_env():
    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        return
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            val = val.strip().strip('"').strip("'")
            os.environ.setdefault(key.strip(), val)

load_env()

PRINTIFY_TOKEN = os.environ.get("PRINTIFY_TOKEN", "")
SHOP_ID        = os.environ.get("PRINTIFY_SHOP_ID", "")
BASE_URL       = "https://api.printify.com/v1"

# Blueprint / provider oletukset (voi ylikirjoittaa .env:ssä)
BLUEPRINT_MUKI    = int(os.environ.get("BLUEPRINT_MUKI",    68))
PROVIDER_MUKI     = int(os.environ.get("PROVIDER_MUKI",     99))
BLUEPRINT_TPAITA  = int(os.environ.get("BLUEPRINT_TPAITA",   6))
PROVIDER_TPAITA   = int(os.environ.get("PROVIDER_TPAITA",   99))
BLUEPRINT_HUPPARI = int(os.environ.get("BLUEPRINT_HUPPARI", 77))
PROVIDER_HUPPARI  = int(os.environ.get("PROVIDER_HUPPARI",  99))

HINTA_MUKI    = int(os.environ.get("HINTA_MUKI",    1990))
HINTA_TPAITA  = int(os.environ.get("HINTA_TPAITA",  2790))
HINTA_HUPPARI = int(os.environ.get("HINTA_HUPPARI", 5290))

KATEGORIA_TAGS = {
    "ammattihuumori": "Ammattihuumori",
    "harrastukset":   "Harrastukset",
    "tyopaikka":      "Toimisto",
    "personoitavat":  "Personoitavat",
}

# ---------------------------------------------------------------------------
# HTTP-apufunktiot (käyttää vain stdlib:ia)
# ---------------------------------------------------------------------------

def api_get(path: str) -> dict:
    import urllib.request, urllib.error
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {PRINTIFY_TOKEN}",
            "User-Agent": "HuumorikauppaBot/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  HTTP {e.code} GET {path}: {body[:300]}")
        raise

def api_post(path: str, payload: dict) -> dict:
    import urllib.request, urllib.error
    url = f"{BASE_URL}{path}"
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {PRINTIFY_TOKEN}",
            "Content-Type": "application/json",
            "User-Agent": "HuumorikauppaBot/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  HTTP {e.code} POST {path}: {body[:500]}")
        raise

# ---------------------------------------------------------------------------
# Kuvien generointi PIL:llä
# ---------------------------------------------------------------------------

FONT_CACHE: dict = {}

def download_google_font(font_name: str = "Anton") -> str:
    """
    Lataa Google-fontin TTF-tiedoston levylle ja palauttaa polun.
    Fontti haetaan kerran ja välimuistetaan .cache_<nimi>.ttf -tiedostoon.
    """
    import urllib.request

    urls = {
        "Anton":   "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf",
        "Oswald":  "https://github.com/google/fonts/raw/main/ofl/oswald/static/Oswald-Bold.ttf",
        "Montserrat": "https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-Black.ttf",
    }
    url        = urls.get(font_name, urls["Anton"])
    cache_path = Path(__file__).parent / f".font_cache_{font_name}.ttf"

    if cache_path.exists() and cache_path.stat().st_size > 10_000:
        return str(cache_path)

    print(f"  Ladataan {font_name}-fontti Google Fontsista...")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            cache_path.write_bytes(resp.read())
        print(f"  Fontti ladattu: {cache_path.name}")
        return str(cache_path)
    except Exception as e:
        print(f"  VAROITUS: Fontin lataus epäonnistui ({e}) — käytetään system-fonttia.")
        return ""


def get_font(size: int, font_path: str = ""):
    """Lataa fontti annetusta polusta tai system-fonteista."""
    cache_key = (font_path, size)
    if cache_key in FONT_CACHE:
        return FONT_CACHE[cache_key]

    from PIL import ImageFont

    if font_path and os.path.exists(font_path):
        try:
            f = ImageFont.truetype(font_path, size)
            FONT_CACHE[cache_key] = f
            return f
        except Exception:
            pass

    # System-fontti fallback
    candidates = [
        "/System/Library/Fonts/Supplemental/Impact.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "C:/Windows/Fonts/impact.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                f = ImageFont.truetype(path, size)
                FONT_CACHE[cache_key] = f
                return f
            except Exception:
                continue

    f = ImageFont.load_default()
    FONT_CACHE[cache_key] = f
    return f


def _text_w(draw, text: str, font) -> int:
    """Palauttaa tekstin pikseli-leveyden."""
    try:
        bb = draw.textbbox((0, 0), text, font=font)
        return bb[2] - bb[0]
    except AttributeError:
        return draw.textsize(text, font=font)[0]


def _text_h(draw, text: str, font) -> int:
    """Palauttaa tekstin pikseli-korkeuden."""
    try:
        bb = draw.textbbox((0, 0), text, font=font)
        return bb[3] - bb[1]
    except AttributeError:
        return draw.textsize(text, font=font)[1]


def auto_fit_font(draw, lines: list, font_path: str, target_width: int) -> tuple:
    """
    Binäärihaku: palauttaa suurimman fonttikoon jossa jokainen rivi
    mahtuu target_width -pikselien sisään. Palauttaa (font, font_size).
    """
    from PIL import ImageFont

    lo, hi, best = 40, 1400, None
    while lo <= hi:
        mid = (lo + hi) // 2
        font = get_font(mid, font_path)
        max_w = max(_text_w(draw, line, font) for line in lines)
        if max_w <= target_width:
            best = (font, mid)
            lo   = mid + 1
        else:
            hi   = mid - 1

    return best if best else (get_font(40, font_path), 40)


def make_design_image(vitsin_teksti: str, product_type: str) -> bytes:
    """
    Generoi 100 % läpinäkyvätaustaisen PNG-kuvan.
    Muki:            2700×1120 px, tumma teksti
    T-paita/huppari: 4500×5400 px, valkoinen teksti

    Teksti skaalataan automaattisesti niin, että se täyttää 80 % kuvan leveydestä.
    Fontti: Anton (ladataan Google Fontsista) → Impact → system fallback.
    """
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("  VAROITUS: pip3 install pillow")
        return _placeholder_png()

    # Lataa Anton-fontti (tai fallback)
    font_path = download_google_font("Anton")

    is_muki = product_type == "muki"

    if is_muki:
        W, H        = 2700, 1120
        text_color  = (12, 12, 35, 255)       # lähes musta
        brand_color = (99, 102, 241, 210)
        brand_size  = 68
        target_w    = int(W * 0.82)
        max_chars   = 24                       # mukissa pidempiä rivejä ok
    else:
        W, H        = 4500, 5400
        text_color  = (255, 255, 255, 255)    # puhdas valkoinen mustalle paidalle
        brand_color = (160, 163, 255, 220)
        brand_size  = 120
        target_w    = int(W * 0.80)
        max_chars   = 14                       # lyhyet rivit → isompi fontti

    # Täysin läpinäkyvä RGBA-tausta — EI JPEG, aina PNG
    img  = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rivitä teksti
    raw_lines = textwrap.wrap(vitsin_teksti, width=max_chars) or [vitsin_teksti]

    # Skaalaa fontti täyttämään 80 % leveydestä
    font, font_size = auto_fit_font(draw, raw_lines, font_path, target_w)

    # Laske rivikorkeus ja kokonaisalueen korkeus
    line_h    = _text_h(draw, "Äg", font)
    spacing   = max(int(font_size * 0.18), 20)
    block_h   = len(raw_lines) * line_h + (len(raw_lines) - 1) * spacing

    # Varaa tila brändille alhaalle (3× brändin korkeus)
    brand_font   = get_font(brand_size, font_path)
    brand_h      = _text_h(draw, "Huumorikauppa.fi", brand_font)
    brand_margin = brand_h * 3

    # Sijoita teksti pystysuunnassa keskelle käyttöaluetta
    usable_h = H - brand_margin
    start_y  = max((usable_h - block_h) // 2, int(H * 0.05))

    for i, line in enumerate(raw_lines):
        tw = _text_w(draw, line, font)
        x  = (W - tw) // 2
        y  = start_y + i * (line_h + spacing)
        draw.text((x, y), line, font=font, fill=text_color)

    # Pieni brändilogo alaosaan — vain paidoissa ja huppareissa, ei mukeissa
    if not is_muki:
        brand_text = "Huumorikauppa.fi"
        bw = _text_w(draw, brand_text, brand_font)
        draw.text(((W - bw) // 2, H - brand_h - int(brand_size * 0.6)),
                  brand_text, font=brand_font, fill=brand_color)

    # Tallenna AINA PNG-muodossa (ei JPEG — JPEG ei tue läpinäkyvyyttä)
    buf = BytesIO()
    img.save(buf, format="PNG")   # optimize=False tarkoituksella: ei muunnosta
    raw = buf.getvalue()

    # Varmistus: tarkista että tausta on läpinäkyvä
    corner = img.getpixel((0, 0))
    if corner[3] != 0:
        print("  VAROITUS: vasemman yläkulman alpha ei ole 0!")
    return raw


def _placeholder_png() -> bytes:
    """Minimaalinen 1×1 läpinäkyvä PNG jos Pillow puuttuu."""
    return base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg=="
    )

# ---------------------------------------------------------------------------
# Printify: varianttien hakeminen
# ---------------------------------------------------------------------------

VARIANT_CACHE: dict = {}

def get_variants(blueprint_id: int, provider_id: int) -> list[dict]:
    """Palauttaa variantit — käyttää välimuistia."""
    key = (blueprint_id, provider_id)
    if key in VARIANT_CACHE:
        return VARIANT_CACHE[key]
    print(f"  Haetaan variantit blueprint={blueprint_id} provider={provider_id}...")
    try:
        data = api_get(f"/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/variants.json")
        variants = data.get("variants", [])
    except Exception:
        variants = []
    VARIANT_CACHE[key] = variants
    return variants


def pick_variants(product_type: str, blueprint_id: int, provider_id: int, hinta_sentit: int) -> list[dict]:
    """
    Valitsee sopivat variantit tuotetyypin mukaan.
    Muki: kaikki valkoinen / one-size variantit.
    T-paita / huppari: S, M, L, XL, XXL mustat tai tummat.
    """
    all_variants = get_variants(blueprint_id, provider_id)
    if not all_variants:
        print("  VAROITUS: Ei variantteja löydetty — tarkista blueprint/provider ID:t.")
        return []

    selected = []

    if product_type == "muki":
        # Ota kaikki tai ensimmäiset 4
        for v in all_variants[:4]:
            selected.append({"id": v["id"], "price": hinta_sentit, "is_enabled": True})
    else:
        # T-paida ja hupparit: suosi mustaa, halutaan koot S–XXL
        target_colors = ["black", "musta", "dark", "jet black", "black heather"]
        target_sizes  = ["s", "m", "l", "xl", "2xl", "xxl"]

        def score(v: dict) -> int:
            opts = v.get("options", {})
            if isinstance(opts, dict):
                vals = [str(val).lower() for val in opts.values()]
            else:
                vals = [str(opts).lower()]
            color_ok = any(any(c in val for c in target_colors) for val in vals)
            size_ok  = any(any(s == val for s in target_sizes) for val in vals)
            return (2 if color_ok else 0) + (1 if size_ok else 0)

        ranked = sorted(all_variants, key=score, reverse=True)
        seen_sizes = set()
        for v in ranked:
            opts = v.get("options", {})
            vals = list(opts.values()) if isinstance(opts, dict) else [opts]
            size = next((str(val).lower() for val in vals if str(val).lower() in target_sizes), None)
            if size and size not in seen_sizes:
                seen_sizes.add(size)
                selected.append({"id": v["id"], "price": hinta_sentit, "is_enabled": True})
            if len(selected) >= 5:
                break

        # Jos ei löytynyt mustia, ota vain ensimmäiset 5 varianttia
        if not selected:
            for v in all_variants[:5]:
                selected.append({"id": v["id"], "price": hinta_sentit, "is_enabled": True})

    return selected

# ---------------------------------------------------------------------------
# Printify: kuvan lataus + tuotteen julkaisu
# ---------------------------------------------------------------------------

def upload_image(image_bytes: bytes, filename: str) -> str:
    """
    Lataa kuva Printify-mediaan.
    Palauttaa image ID:n.
    """
    encoded = base64.b64encode(image_bytes).decode()
    payload = {"file_name": filename, "contents": encoded}
    result = api_post("/uploads/images.json", payload)
    img_id = result.get("id", "")
    if not img_id:
        raise ValueError(f"Kuvan lataus epäonnistui: {result}")
    return img_id

def publish_product(product_id: str) -> bool:
    """Julkaisee tuotteen Printifystä verkkokauppaan — exponential backoff 429:lle."""
    payload = {
        "title": True,
        "description": True,
        "images": True,
        "variants": True,
        "tags": True,
        "keyFeatures": True,
        "shipping_template": True,
    }
    for attempt in range(5):
        try:
            api_post(f"/shops/{SHOP_ID}/products/{product_id}/publish.json", payload)
            print(f"  Julkaistu verkkokauppaan!")
            return True
        except Exception as e:
            if "429" in str(e) and attempt < 4:
                wait = (attempt + 1) * 10
                print(f"  Rate-limit julkaisussa — odotetaan {wait}s...")
                time.sleep(wait)
            else:
                print(f"  VAROITUS: Julkaisu epäonnistui: {e}")
                return False
    return False

# ---------------------------------------------------------------------------
# Printify: tuotteen luonti
# ---------------------------------------------------------------------------

def create_product(item: dict, dry_run: bool = False):
    """
    Luo yhden Printify-tuotteen.
    item: yksi rivi tuotedata.json:sta.
    Palauttaa Printify-vastauksen tai None dry-run:ssa.
    """
    product_type = item["type"]  # muki | tpaita | huppari

    if product_type == "muki":
        blueprint_id = BLUEPRINT_MUKI
        provider_id  = PROVIDER_MUKI
        hinta        = HINTA_MUKI
        position     = "front"
    elif product_type == "tpaita":
        blueprint_id = BLUEPRINT_TPAITA
        provider_id  = PROVIDER_TPAITA
        hinta        = HINTA_TPAITA
        position     = "front"
    else:  # huppari
        blueprint_id = BLUEPRINT_HUPPARI
        provider_id  = PROVIDER_HUPPARI
        hinta        = HINTA_HUPPARI
        position     = "front"

    # 1. Generoi design-kuva
    print(f"  Generoidaan design: \"{item['vitsin_teksti'][:50]}\"")
    img_bytes = make_design_image(item["vitsin_teksti"], product_type)
    safe_name = item["vitsin_teksti"][:30].replace(" ", "_").replace("/", "-")
    filename  = f"{safe_name}.png"

    if dry_run:
        print(f"  [DRY-RUN] Kuva generoitu ({len(img_bytes)/1024:.0f} KB) — ei lähetetä Printifylle.")
        return {"dry_run": True, "title": item["title"]}

    # 2. Lataa kuva Printifylle
    print(f"  Ladataan kuva Printifylle ({len(img_bytes)/1024:.0f} KB)...")
    image_id = upload_image(img_bytes, filename)
    print(f"  Kuva ladattu, image_id={image_id}")

    # 3. Hae variantit
    variants = pick_variants(product_type, blueprint_id, provider_id, hinta)
    if not variants:
        print(f"  OHITETAAN — ei variantteja löydetty tuotteelle: {item['title']}")
        return None

    # 4. Rakenna print_area kaikille varianteille
    variant_ids = [v["id"] for v in variants]
    print_areas = [
        {
            "variant_ids": variant_ids,
            "placeholders": [
                {
                    "position": position,
                    "images": [
                        {
                            "id": image_id,
                            "x": 0.5,
                            "y": 0.5,
                            "scale": 1.0,
                            "angle": 0,
                        }
                    ],
                }
            ],
        }
    ]

    # 5. Rakenna tuote-payload — lisää kategoria-tagi Smart Collections -toimintoa varten
    tags = list(item.get("tags", []))
    kategoria_raw = item.get("kategoria", "")
    kategoria_tag = KATEGORIA_TAGS.get(kategoria_raw, "")
    if kategoria_tag and kategoria_tag not in tags:
        tags.insert(0, kategoria_tag)
    tags = tags[:10]

    type_tag = {"muki": "Kahvimuki", "tpaita": "T-paita", "huppari": "Huppari"}.get(product_type, "")
    if type_tag and type_tag not in tags:
        tags.insert(1, type_tag)
    tags = tags[:10]

    payload = {
        "title": item["title"],
        "description": item["description"],
        "blueprint_id": blueprint_id,
        "print_provider_id": provider_id,
        "variants": variants,
        "print_areas": print_areas,
        "tags": tags,
    }

    # 6. Lähetä Printifylle
    print(f"  Luodaan tuote Printifylle...")
    result = api_post(f"/shops/{SHOP_ID}/products.json", payload)
    product_id = result.get("id", "?")
    print(f"  Tuote luotu! product_id={product_id}")

    # 7. Julkaise heti verkkokauppaan
    publish_product(product_id)

    return result

# ---------------------------------------------------------------------------
# CLI-komennot
# ---------------------------------------------------------------------------

def cmd_shops():
    """python promptaa.py shops — listaa kaupat"""
    require_token()
    data = api_get("/shops.json")
    shops = data if isinstance(data, list) else data.get("data", [data])
    print("\n=== Printify-kaupat ===")
    for s in shops:
        print(f"  ID: {s.get('id')}  |  Nimi: {s.get('title')}  |  Tyyppi: {s.get('sales_channel')}")
    print()
    print("Lisää haluamasi Shop ID .env-tiedostoon:")
    print("  PRINTIFY_SHOP_ID=<id tästä listasta>")


def cmd_blueprints(search: str = ""):
    """python promptaa.py blueprints — listaa blueprint-tyypit"""
    require_token()
    data = api_get("/catalog/blueprints.json")
    blueprints = data if isinstance(data, list) else data.get("data", [])
    print(f"\n=== Blueprint-katalogi ({len(blueprints)} kpl) ===")
    keywords = (search or "mug shirt hoodie paita huppari muki").lower().split()
    matches = [b for b in blueprints if any(k in b.get("title", "").lower() for k in keywords)]
    shown = matches[:30] if matches else blueprints[:30]
    for b in shown:
        print(f"  ID: {b.get('id'):<6} | {b.get('title')}")
    if len(blueprints) > 30 and not search:
        print(f"  ... ja {len(blueprints) - 30} muuta. Käytä --search <hakusana> rajaamiseen.")
    print()
    print("Aseta haluamasi blueprint-ID:t .env-tiedostoon:")
    print("  BLUEPRINT_MUKI=<id>")
    print("  BLUEPRINT_TPAITA=<id>")
    print("  BLUEPRINT_HUPPARI=<id>")


def cmd_providers(blueprint_id: int):
    """python promptaa.py providers --bp <id> — listaa blueprint:n tulostajat"""
    require_token()
    data = api_get(f"/catalog/blueprints/{blueprint_id}/print_providers.json")
    providers = data if isinstance(data, list) else data.get("print_providers", [])
    print(f"\n=== Tulostajat blueprint {blueprint_id} ===")
    for p in providers:
        print(f"  ID: {p.get('id'):<6} | {p.get('title')}")
    print()
    print("Aseta haluamasi provider-ID:t .env-tiedostoon:")
    print("  PROVIDER_MUKI=<id>")
    print("  PROVIDER_TPAITA=<id>")
    print("  PROVIDER_HUPPARI=<id>")


def cmd_variants(blueprint_id: int, provider_id: int):
    """python promptaa.py variants --bp <id> --pv <id> — listaa variantit"""
    require_token()
    data = api_get(f"/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/variants.json")
    variants = data.get("variants", [])
    print(f"\n=== Variantit blueprint={blueprint_id} provider={provider_id} ({len(variants)} kpl) ===")
    for v in variants[:50]:
        raw_opts = v.get("options", {})
        if isinstance(raw_opts, dict):
            opts = " / ".join(f"{k}: {val}" for k, val in raw_opts.items())
        else:
            opts = str(raw_opts)
        print(f"  variant_id: {v.get('id'):<10} | {v.get('title', '')} | {opts}")
    if len(variants) > 50:
        print(f"  ... ja {len(variants) - 50} muuta.")


def cmd_create(limit: int = None, dry_run: bool = False, category: str = None, file: str = None):
    """python promptaa.py create — luo tuotteet tuotedata.json:sta (tai --file)"""
    require_token()
    if not dry_run:
        require_shop()

    # Lataa tuotedata
    data_path = Path(file) if file else Path(__file__).parent / "tuotedata.json"
    if not data_path.exists():
        print(f"Virhe: tuotedata.json ei löydy ({data_path})")
        sys.exit(1)
    with open(data_path, encoding="utf-8") as f:
        items = json.load(f)

    # Suodata kategorian mukaan
    if category:
        items = [i for i in items if i.get("kategoria") == category]
        print(f"Kategoria '{category}': {len(items)} tuotetta")

    # Rajoita määrää
    if limit:
        items = items[:limit]

    total = len(items)
    print(f"\n=== Aloitetaan {total} tuotteen luonti {'[DRY-RUN]' if dry_run else ''} ===")
    print(f"Shop ID: {SHOP_ID or '(dry-run)'}")
    print(f"Blueprintit: muki={BLUEPRINT_MUKI}, tpaita={BLUEPRINT_TPAITA}, huppari={BLUEPRINT_HUPPARI}")
    print(f"Providerit:  muki={PROVIDER_MUKI}, tpaita={PROVIDER_TPAITA}, huppari={PROVIDER_HUPPARI}")
    print()

    results = {"ok": [], "fail": [], "skip": []}

    for idx, item in enumerate(items, 1):
        print(f"[{idx}/{total}] {item['type'].upper()} — {item['title'][:60]}")
        try:
            result = create_product(item, dry_run=dry_run)
            if result is None:
                results["skip"].append(item["title"])
            else:
                results["ok"].append(item["title"])
                if not dry_run:
                    # Printify rate-limit: max ~60 req/min
                    time.sleep(1.2)
        except Exception as e:
            print(f"  VIRHE: {e}")
            results["fail"].append(item["title"])
            time.sleep(2)

    print()
    print("=== Valmis ===")
    print(f"  Onnistui:   {len(results['ok'])} / {total}")
    print(f"  Ohitettu:   {len(results['skip'])}")
    print(f"  Epäonnistui:{len(results['fail'])}")
    if results["fail"]:
        print("\nEpäonnistuneet:")
        for t in results["fail"]:
            print(f"  - {t}")
    if not dry_run and results["ok"]:
        print(f"\nTuotteet näkyvät Printify-kaupassa:")
        print(f"  https://printify.com/app/store/{SHOP_ID}/products")

# ---------------------------------------------------------------------------
# Apufunktiot
# ---------------------------------------------------------------------------

def require_token():
    if not PRINTIFY_TOKEN:
        print("Virhe: PRINTIFY_TOKEN puuttuu .env-tiedostosta.")
        sys.exit(1)

def require_shop():
    if not SHOP_ID:
        print("Virhe: PRINTIFY_SHOP_ID puuttuu .env-tiedostosta.")
        print("Aja ensin: python promptaa.py shops")
        print("Lisää sitten Shop ID .env-tiedostoon: PRINTIFY_SHOP_ID=<id>")
        sys.exit(1)

# ---------------------------------------------------------------------------
# Pääohjelma
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Printify-tuotteiden massaluonti Huumorikauppa.fi:lle",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = parser.add_subparsers(dest="cmd")

    # shops
    sub.add_parser("shops", help="Listaa kaupat ja Shop ID:t")

    # blueprints
    p_bp = sub.add_parser("blueprints", help="Listaa blueprint-tyypit")
    p_bp.add_argument("--search", default="", help="Suodata hakusanalla (esim. mug)")

    # providers
    p_pv = sub.add_parser("providers", help="Listaa blueprint:n tulostajat")
    p_pv.add_argument("--bp", type=int, required=True, help="Blueprint ID")

    # variants
    p_vr = sub.add_parser("variants", help="Listaa variantit")
    p_vr.add_argument("--bp", type=int, required=True, help="Blueprint ID")
    p_vr.add_argument("--pv", type=int, required=True, help="Provider ID")

    # create
    p_cr = sub.add_parser("create", help="Luo tuotteet tuotedata.json:sta")
    p_cr.add_argument("--limit",    type=int, default=None, help="Luo vain N ensimmäistä")
    p_cr.add_argument("--dry-run",  action="store_true",    help="Generoi kuvat, ei Printify-kutsuja")
    p_cr.add_argument("--file",     default=None,           help="Käytettävä JSON-tiedosto (oletus: tuotedata.json)")
    p_cr.add_argument("--category", default=None,
                      help="Vain tietty kategoria: ammattihuumori | harrastukset | tyopaikka | personoitavat | kaupunkituotteet")

    args = parser.parse_args()

    if args.cmd == "shops":
        cmd_shops()
    elif args.cmd == "blueprints":
        cmd_blueprints(search=args.search)
    elif args.cmd == "providers":
        cmd_providers(args.bp)
    elif args.cmd == "variants":
        cmd_variants(args.bp, args.pv)
    elif args.cmd == "create":
        cmd_create(
            limit=args.limit,
            dry_run=args.dry_run,
            category=args.category,
            file=args.file,
        )
    else:
        parser.print_help()
        print()
        print("Esimerkkikomennot:")
        print("  python promptaa.py shops")
        print("  python promptaa.py blueprints")
        print("  python promptaa.py create --dry-run --limit 3")
        print("  python promptaa.py create")


if __name__ == "__main__":
    main()
