#!/usr/bin/env python3
"""
paivita_kaupunkituotteet.py — Päivittää olemassa olevat kaupunkituotteet
oikeinkielisillä teksteillä ja luo puuttuvat tuotteet.

Käyttö:
  python3 paivita_kaupunkituotteet.py           # dry-run
  python3 paivita_kaupunkituotteet.py --run     # aja oikeasti
"""

import os, sys, json, time, base64, argparse
from io import BytesIO
from pathlib import Path

# ---------------------------------------------------------------------------
# Ympäristömuuttujat
# ---------------------------------------------------------------------------

def load_env():
    env_path = Path(__file__).parent / ".env"
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line: continue
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

load_env()
TOKEN   = os.environ["PRINTIFY_TOKEN"]
SHOP_ID = os.environ["PRINTIFY_SHOP_ID"]
BASE    = "https://api.printify.com/v1"

BLUEPRINT_MUKI    = int(os.environ.get("BLUEPRINT_MUKI",    68))
PROVIDER_MUKI     = int(os.environ.get("PROVIDER_MUKI",     1))
BLUEPRINT_TPAITA  = int(os.environ.get("BLUEPRINT_TPAITA",  145))
PROVIDER_TPAITA   = int(os.environ.get("PROVIDER_TPAITA",   99))
BLUEPRINT_HUPPARI = int(os.environ.get("BLUEPRINT_HUPPARI", 77))
PROVIDER_HUPPARI  = int(os.environ.get("PROVIDER_HUPPARI",  99))

HINTA_MUKI    = int(os.environ.get("HINTA_MUKI",    1990))
HINTA_TPAITA  = int(os.environ.get("HINTA_TPAITA",  2790))
HINTA_HUPPARI = int(os.environ.get("HINTA_HUPPARI", 5290))

# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------

import urllib.request, urllib.error

def api_get(path: str) -> dict:
    req = urllib.request.Request(
        f"{BASE}{path}",
        headers={"Authorization": f"Bearer {TOKEN}", "User-Agent": "HK/1.0"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def api_put(path: str, payload: dict) -> dict:
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{BASE}{path}", data=data,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json", "User-Agent": "HK/1.0"},
        method="PUT",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  HTTP {e.code} PUT {path}: {body[:300]}")
        raise

def api_post(path: str, payload: dict) -> dict:
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{BASE}{path}", data=data,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json", "User-Agent": "HK/1.0"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  HTTP {e.code} POST {path}: {body[:500]}")
        raise

# ---------------------------------------------------------------------------
# Kuvien generointi (kopioi promptaa.py:stä)
# ---------------------------------------------------------------------------

FONT_CACHE: dict = {}

def get_font_path() -> str:
    cache = Path(__file__).parent / ".font_cache_Anton.ttf"
    if cache.exists() and cache.stat().st_size > 10_000:
        return str(cache)
    import urllib.request as ur
    url = "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf"
    req = ur.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with ur.urlopen(req, timeout=15) as r:
        cache.write_bytes(r.read())
    return str(cache)

def get_font(size: int, path: str):
    key = (path, size)
    if key in FONT_CACHE: return FONT_CACHE[key]
    from PIL import ImageFont
    if path and os.path.exists(path):
        try:
            f = ImageFont.truetype(path, size)
            FONT_CACHE[key] = f
            return f
        except Exception: pass
    f = ImageFont.load_default()
    FONT_CACHE[key] = f
    return f

def text_w(draw, text, font) -> int:
    try: return draw.textbbox((0,0), text, font=font)[2]
    except AttributeError: return draw.textsize(text, font=font)[0]

def auto_fit(draw, lines, path, target_w) -> tuple:
    from PIL import ImageFont
    lo, hi = 40, 1400
    best_font, best_size = get_font(lo, path), lo
    while lo <= hi:
        mid = (lo + hi) // 2
        font = get_font(mid, path)
        max_w = max(text_w(draw, line, font) for line in lines)
        if max_w <= target_w:
            best_font, best_size = font, mid
            lo = mid + 1
        else:
            hi = mid - 1
    return best_font, best_size

def make_design_image(vitsin_teksti: str, product_type: str) -> bytes:
    from PIL import Image, ImageDraw, ImageFont
    import textwrap

    if product_type == "muki":
        W, H = 2700, 1120
        text_color = "#0c0c23"
        add_logo = False
    else:
        W, H = 4500, 5400
        text_color = "#ffffff"
        add_logo = True

    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    font_path = get_font_path()

    target_w = int(W * 0.80)
    raw_lines = vitsin_teksti.upper().split("\n")
    lines = []
    for raw in raw_lines:
        wrapped = textwrap.wrap(raw, width=20)
        lines.extend(wrapped if wrapped else [raw])

    font, _ = auto_fit(draw, lines, font_path, target_w)
    line_h = max(text_w(draw, l, font) for l in lines)
    try: line_h = draw.textbbox((0,0), "Ag", font=font)[3]
    except AttributeError: pass
    spacing = int(line_h * 0.15)
    total_h = len(lines) * line_h + (len(lines)-1) * spacing

    if add_logo:
        text_zone_h = int(H * 0.72)
        y_start = (text_zone_h - total_h) // 2
    else:
        y_start = (H - total_h) // 2

    for i, line in enumerate(lines):
        x = (W - text_w(draw, line, font)) // 2
        y = y_start + i * (line_h + spacing)
        draw.text((x, y), line, font=font, fill=text_color)

    if add_logo:
        logo_text = "Huumorikauppa.fi"
        logo_size = int(H * 0.022)
        logo_font = get_font(logo_size, font_path)
        lw = text_w(draw, logo_text, logo_font)
        draw.text(((W - lw)//2, int(H*0.82)), logo_text, font=logo_font, fill="#ffffff88")

    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def upload_image(image_bytes: bytes, filename: str) -> str:
    b64 = base64.b64encode(image_bytes).decode()
    resp = api_post("/uploads/images.json", {"file_name": filename, "contents": b64})
    return resp["id"]

# ---------------------------------------------------------------------------
# Variantit
# ---------------------------------------------------------------------------

VARIANT_CACHE: dict = {}

def get_variants(bp: int, pv: int) -> list:
    key = (bp, pv)
    if key in VARIANT_CACHE: return VARIANT_CACHE[key]
    for attempt in range(5):
        try:
            data = api_get(f"/catalog/blueprints/{bp}/print_providers/{pv}/variants.json")
            vs = data.get("variants", [])
            if vs:
                VARIANT_CACHE[key] = vs
                return vs
        except Exception as e:
            wait = (attempt+1)*15
            print(f"  Varianttihaku epäonnistui (yritys {attempt+1}/5): {e} — {wait}s...")
            time.sleep(wait)
    return []

FRONT_VOWELS = set("äöy")

def pick_variants(product_type: str, bp: int, pv: int, hinta: int) -> list:
    all_v = get_variants(bp, pv)
    if not all_v: return []
    if product_type == "muki":
        return [{"id": v["id"], "price": hinta, "is_enabled": True} for v in all_v[:4]]

    target_colors = ["black", "musta", "dark", "jet black", "black heather"]
    target_sizes  = ["s", "m", "l", "xl", "2xl", "xxl"]

    def score(v):
        opts = v.get("options", {})
        vals = [str(x).lower() for x in (opts.values() if isinstance(opts, dict) else [opts])]
        return (2 if any(c in val for c in target_colors for val in vals) else 0) + \
               (1 if any(s == val for s in target_sizes for val in vals) else 0)

    ranked = sorted(all_v, key=score, reverse=True)
    seen, selected = set(), []
    for v in ranked:
        opts = v.get("options", {})
        vals = list(opts.values()) if isinstance(opts, dict) else [opts]
        size = next((str(x).lower() for x in vals if str(x).lower() in target_sizes), None)
        if size and size not in seen:
            seen.add(size)
            selected.append({"id": v["id"], "price": hinta, "is_enabled": True})
        if len(selected) >= 5: break
    if not selected:
        selected = [{"id": v["id"], "price": hinta, "is_enabled": True} for v in all_v[:5]]
    return selected

# ---------------------------------------------------------------------------
# Päälogiikka
# ---------------------------------------------------------------------------

def get_all_city_products() -> list:
    """Hae kaikki Printifyn kaupunkituotteet (tunnistatag: Kaupunkituotteet tai Kaupunkipaidat)."""
    products, page = [], 1
    while True:
        data = api_get(f"/shops/{SHOP_ID}/products.json?limit=50&page={page}")
        batch = data.get("data", [])
        if not batch: break
        for p in batch:
            tags = p.get("tags", [])
            if "Kaupunkituotteet" in tags or "Kaupunkipaidat" in tags:
                products.append(p)
        if page >= data.get("last_page", 1): break
        page += 1
        time.sleep(0.3)
    return products

def update_product(product_id: str, item: dict, dry_run: bool):
    """Päivitä olemassa oleva tuote oikeinkielisillä tiedoilla + uusi kuva."""
    if dry_run:
        print(f"    [DRY-RUN] Päivitys: {item['vitsin_teksti'][:55]}")
        return True

    ptype = item["type"]
    if ptype == "muki":
        bp, pv, hinta = BLUEPRINT_MUKI, PROVIDER_MUKI, HINTA_MUKI
    elif ptype == "tpaita":
        bp, pv, hinta = BLUEPRINT_TPAITA, PROVIDER_TPAITA, HINTA_TPAITA
    else:
        bp, pv, hinta = BLUEPRINT_HUPPARI, PROVIDER_HUPPARI, HINTA_HUPPARI

    variants = pick_variants(ptype, bp, pv, hinta)
    if not variants:
        print(f"    OHITETAAN — ei variantteja")
        return False

    # Generoi uusi design-kuva
    img_bytes = make_design_image(item["vitsin_teksti"], ptype)
    img_id = upload_image(img_bytes, f"kaupunki_{product_id}.png")

    # Printify-aluekoordinaatit
    if ptype == "muki":
        print_areas = [{"variant_ids": [v["id"] for v in variants],
                        "placeholders": [{"position": "front",
                                          "images": [{"id": img_id, "x": 0.5, "y": 0.5, "scale": 0.85, "angle": 0}]}]}]
    else:
        print_areas = [{"variant_ids": [v["id"] for v in variants],
                        "placeholders": [{"position": "front",
                                          "images": [{"id": img_id, "x": 0.5, "y": 0.5, "scale": 0.90, "angle": 0}]}]}]

    payload = {
        "title":       item["title"],
        "description": item["description"],
        "tags":        item["tags"],
        "variants":    variants,
        "print_areas": print_areas,
    }

    # Julkaistu tuote on lukittu — unpublish ensin, päivitä, sitten republish
    try:
        api_post(f"/shops/{SHOP_ID}/products/{product_id}/unpublish.json", {})
        print(f"    Unpublished OK")
        time.sleep(1)
    except urllib.error.HTTPError as e:
        print(f"    Unpublish epäonnistui ({e.code}) — yritetään silti PUT")

    for attempt in range(4):
        try:
            api_put(f"/shops/{SHOP_ID}/products/{product_id}.json", payload)
            # Republish
            for pub_attempt in range(5):
                try:
                    api_post(f"/shops/{SHOP_ID}/products/{product_id}/publish.json",
                             {"title": True, "description": True, "images": True,
                              "variants": True, "tags": True, "keyFeatures": True})
                    return True
                except urllib.error.HTTPError as e:
                    if e.code == 429:
                        time.sleep((pub_attempt+1)*10)
                    else:
                        print(f"    Republish epäonnistui ({e.code})")
                        return True  # PUT onnistui, vaikka republish ei
            return True
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = (attempt+1)*15
                print(f"    429 — odotetaan {wait}s...")
                time.sleep(wait)
            else:
                return False
    return False

def create_product(item: dict, dry_run: bool) -> bool:
    """Luo uusi tuote."""
    if dry_run:
        print(f"    [DRY-RUN] Luonti: {item['vitsin_teksti'][:55]}")
        return True

    ptype = item["type"]
    if ptype == "muki":
        bp, pv, hinta = BLUEPRINT_MUKI, PROVIDER_MUKI, HINTA_MUKI
    elif ptype == "tpaita":
        bp, pv, hinta = BLUEPRINT_TPAITA, PROVIDER_TPAITA, HINTA_TPAITA
    else:
        bp, pv, hinta = BLUEPRINT_HUPPARI, PROVIDER_HUPPARI, HINTA_HUPPARI

    variants = pick_variants(ptype, bp, pv, hinta)
    if not variants: return False

    img_bytes = make_design_image(item["vitsin_teksti"], ptype)
    img_id    = upload_image(img_bytes, f"kaup_{item['vitsin_teksti'][:20]}.png")

    if ptype == "muki":
        print_areas = [{"variant_ids": [v["id"] for v in variants],
                        "placeholders": [{"position": "front",
                                          "images": [{"id": img_id, "x": 0.5, "y": 0.5, "scale": 0.85, "angle": 0}]}]}]
    else:
        print_areas = [{"variant_ids": [v["id"] for v in variants],
                        "placeholders": [{"position": "front",
                                          "images": [{"id": img_id, "x": 0.5, "y": 0.5, "scale": 0.90, "angle": 0}]}]}]

    payload = {
        "title":             item["title"],
        "description":       item["description"],
        "blueprint_id":      bp,
        "print_provider_id": pv,
        "variants":          variants,
        "print_areas":       print_areas,
        "tags":              item["tags"],
    }
    for attempt in range(4):
        try:
            result = api_post(f"/shops/{SHOP_ID}/products.json", payload)
            pid = result.get("id", "")
            # Julkaise
            for pub_attempt in range(5):
                try:
                    api_post(f"/shops/{SHOP_ID}/products/{pid}/publish.json",
                             {"title": True, "description": True, "images": True,
                              "variants": True, "tags": True, "keyFeatures": True})
                    return True
                except urllib.error.HTTPError as e:
                    if e.code == 429:
                        wait = (pub_attempt+1)*10
                        time.sleep(wait)
                    else:
                        break
            return True
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep((attempt+1)*15)
            else:
                return False
    return False


def prefetch_variants():
    """Lataa kaikki variantit etukäteen (välimuistiin) ennen bulk-operaatioita."""
    print("Haetaan variantit etukäteen...")
    for bp, pv, label in [
        (BLUEPRINT_MUKI, PROVIDER_MUKI, "muki"),
        (BLUEPRINT_TPAITA, PROVIDER_TPAITA, "t-paita"),
        (BLUEPRINT_HUPPARI, PROVIDER_HUPPARI, "huppari"),
    ]:
        vs = get_variants(bp, pv)
        print(f"  {label}: {len(vs)} varianttia")
    print()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--run", action="store_true", help="Aja oikeasti (oletuksena dry-run)")
    args = parser.parse_args()
    dry_run = not args.run

    if dry_run:
        print("=== DRY-RUN — ei muutoksia Printifyyn ===")
    else:
        print("=== LIVE — muutokset kirjoitetaan Printifyyn ===")

    # Lataa korjattu data
    data_path = Path(__file__).parent / "kaupunkituotedata.json"
    with open(data_path) as f:
        correct_items = json.load(f)
    print(f"Korjatut tuotteet: {len(correct_items)} kpl")

    # Prefetch variantit ENNEN tuotehakua (vain live-moodissa)
    if not dry_run:
        prefetch_variants()

    # Hae olemassa olevat kaupunkituotteet Printifystä
    print("\nHaetaan olemassa olevat kaupunkituotteet Printifystä...")
    existing = get_all_city_products()
    print(f"Löydetty: {len(existing)} olemassa olevaa kaupunkituotetta")

    # Ryhmittele olemassa olevat kaupungeittain + tyypin mukaan
    # Avain: (city_name, product_type)
    from collections import defaultdict
    existing_by_city: dict = defaultdict(list)
    # Kaupungit jotka CITIES-listassa
    city_names = set()
    from generoi_kaupungit import CITIES
    for city_name, *_ in CITIES:
        city_names.add(city_name)

    for p in existing:
        tags = p.get("tags", [])
        city = next((t for t in tags if t in city_names), None)
        if city:
            existing_by_city[city].append(p)

    # Ryhmittele korjattu data kaupungeittain
    correct_by_city: dict = defaultdict(list)
    for item in correct_items:
        city = next((t for t in item["tags"] if t in city_names), None)
        if city:
            correct_by_city[city].append(item)

    updated, created, skipped = 0, 0, 0

    for city_name, *_ in CITIES:
        existing_for_city = sorted(existing_by_city.get(city_name, []),
                                   key=lambda p: p.get("id", ""))
        correct_for_city  = correct_by_city.get(city_name, [])

        n_existing = len(existing_for_city)
        n_correct  = len(correct_for_city)

        print(f"\n{city_name}: {n_existing} olemassa / {n_correct} tavoite")

        # Päivitä olemassa olevat
        for i, (existing_p, correct_item) in enumerate(
                zip(existing_for_city, correct_for_city)):
            pid   = existing_p["id"]
            ptype = correct_item["type"]
            print(f"  [päivitä {i+1}/{n_existing}] [{ptype}] {correct_item['vitsin_teksti'][:50]}")
            ok = update_product(pid, correct_item, dry_run)
            if ok:
                updated += 1
            else:
                skipped += 1
            if not dry_run:
                time.sleep(1)

        # Luo puuttuvat
        for i, item in enumerate(correct_for_city[n_existing:], start=n_existing+1):
            ptype = item["type"]
            print(f"  [luo {i}/{n_correct}] [{ptype}] {item['vitsin_teksti'][:50]}")
            ok = create_product(item, dry_run)
            if ok:
                created += 1
            else:
                skipped += 1
            if not dry_run:
                time.sleep(1)

    print(f"\n=== Valmis ===")
    print(f"  Päivitetty: {updated}")
    print(f"  Luotu uusia: {created}")
    print(f"  Ohitettu:   {skipped}")


if __name__ == "__main__":
    main()
