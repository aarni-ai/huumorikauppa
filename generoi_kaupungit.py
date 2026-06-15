#!/usr/bin/env python3
"""
generoi_kaupungit.py — Luo 500 kaupunkiteemaista tuotetta
Tallentaa kaupunkituotedata.json -tiedostoon.
Aja: python3 generoi_kaupungit.py
"""

import json
from pathlib import Path

# 50 suurinta/tunnetuinta suomalaista kaupunkia
# (nimi, adjektiivi, aluetag, paikallisvitsi)
CITIES = [
    ("Helsinki",       "Helsinkiläinen",      "Uusimaa",         "täynnä rakennustyömaita ja startup-firmoja"),
    ("Espoo",          "Espoolainen",         "Uusimaa",         "Helsinki ilman Helsinkiä"),
    ("Tampere",        "Tamperelainen",       "Pirkanmaa",       "Suomen paras kaupunki – itse sanoo"),
    ("Vantaa",         "Vantaalainen",        "Uusimaa",         "lentokenttä ja ylpeys"),
    ("Oulu",           "Oululainen",          "Pohjois-Pohjanmaa", "teknologian pääkaupunki – pakkasessa"),
    ("Turku",          "Turkulainen",         "Varsinais-Suomi", "Suomen vanhin kaupunki – muistaa sen"),
    ("Jyväskylä",      "Jyväskyläläinen",     "Keski-Suomi",     "opiskelija joka ei koskaan valmistunut"),
    ("Lahti",          "Lahtelainen",         "Päijät-Häme",     "MM-hiihtäjien ja säästöjen kaupunki"),
    ("Kuopio",         "Kuopiolainen",        "Pohjois-Savo",    "savon sydän – kaikki tietää sen"),
    ("Pori",           "Porilainen",          "Satakunta",       "Jazz ja joki – ei tarvita muuta"),
    ("Joensuu",        "Joensuulainen",       "Pohjois-Karjala", "Karjalan sydän ja ylpeys"),
    ("Lappeenranta",   "Lappeenrantalainen",  "Etelä-Karjala",   "Saimaan rannalla, Venäjän naapurina"),
    ("Hämeenlinna",    "Hämeenlinnalainen",   "Kanta-Häme",      "Sibeliuksen kotipaikka"),
    ("Vaasa",          "Vaasalainen",         "Pohjanmaa",       "kaksikielinen ja ylpeä"),
    ("Seinäjoki",      "Seinäjokelainen",     "Etelä-Pohjanmaa", "Provinssirock ja tasainen maasto"),
    ("Rovaniemi",      "Rovaniemeläinen",     "Lappi",           "Joulupukin naapuri"),
    ("Mikkeli",        "Mikkeliläinen",       "Etelä-Savo",      "Saimaan portilla"),
    ("Kotka",          "Kotkainen",           "Kymenlaakso",     "merikaupunki ja kotkia"),
    ("Kouvola",        "Kouvolalainen",       "Kymenlaakso",     "Suomen keskilapsi – kaikki tuntee"),
    ("Salo",           "Salolainen",          "Varsinais-Suomi", "entinen Nokian kaupunki – selviytyi"),
    ("Porvoo",         "Porvoolainen",        "Uusimaa",         "vanhakaupunki ja turistit"),
    ("Kokkola",        "Kokkolalainen",       "Keski-Pohjanmaa", "Pohjanmaan helmi"),
    ("Hyvinkää",       "Hyvinkääläinen",      "Uusimaa",         "junanradan varrella"),
    ("Järvenpää",      "Järvenpääläinen",     "Uusimaa",         "Sibeliuksen Ainolassa"),
    ("Rauma",          "Raumalainen",         "Satakunta",       "Raumanmurre ja UNESCO"),
    ("Kajaani",        "Kajaanilainen",       "Kainuu",          "kaukana mutta ei unohdettu"),
    ("Imatra",         "Imatralainen",        "Etelä-Karjala",   "kosken kaupunki"),
    ("Savonlinna",     "Savonlinnalainen",    "Etelä-Savo",      "oopperajuhlien ja linnan kaupunki"),
    ("Kerava",         "Keravainen",          "Uusimaa",         "nopein juna Helsinkiin"),
    ("Lohja",          "Lohjalalainen",       "Uusimaa",         "omenat ja järvet"),
    ("Tornio",         "Torniolainen",        "Lappi",           "Ruotsin naapuri – käy ostoksilla"),
    ("Kemi",           "Kemiläinen",          "Lappi",           "Lumen kaupunki – kirjaimellisesti"),
    ("Nokia",          "Nokialainen",         "Pirkanmaa",       "ei se puhelin – kaupunki"),
    ("Valkeakoski",    "Valkeakoskelainen",   "Pirkanmaa",       "teollisuuskaupunki ja kosket"),
    ("Riihimäki",      "Riihimäkeläinen",     "Kanta-Häme",      "rautatiekaupunki"),
    ("Kaarina",        "Kaarinalainen",       "Varsinais-Suomi", "Turun naapuri – ylpeästi oma"),
    ("Raisio",         "Raisiolainen",        "Varsinais-Suomi", "Raisio ja Benecol"),
    ("Forssa",         "Forssalainen",        "Kanta-Häme",      "tekstiiliteollisuuden henki"),
    ("Iisalmi",        "Iisalmelainen",       "Pohjois-Savo",    "salmi ja savolaishuumori"),
    ("Varkaus",        "Varkaalainen",        "Pohjois-Savo",    "teollisuuskaupunki Savossa"),
    ("Lieksa",         "Lieksalainen",        "Pohjois-Karjala", "Pielisen rannalla"),
    ("Ylöjärvi",       "Ylöjärveläinen",      "Pirkanmaa",       "Tampereen naapuri"),
    ("Kangasala",      "Kangasalalainen",     "Pirkanmaa",       "järvien kaupunki"),
    ("Naantali",       "Naantalilainen",      "Varsinais-Suomi", "Muumimaailma ja kesäloma"),
    ("Heinola",        "Heinolalainen",       "Päijät-Häme",     "Kymijoen kaupunki"),
    ("Lempäälä",       "Lempääläläinen",      "Pirkanmaa",       "moottoritien varrella"),
    ("Pirkkala",       "Pirkkalalainen",      "Pirkanmaa",       "lentoaseman kaupunki"),
    ("Akaa",           "Akaalalainen",        "Pirkanmaa",       "pieni mutta ylpeä"),
    ("Orimattila",     "Orimattilalainen",    "Päijät-Häme",     "marjat ja maaseutu"),
    ("Harjavalta",     "Harjavaltalainen",    "Satakunta",       "kuparin kaupunki"),
    ("Nummela",        "Nummelalainen",       "Uusimaa",         "Vihdin sydän"),
]

def make_products(city_name, adjective, region, vitsi):
    """Luo 10 tuotetta yhdelle kaupungille."""
    city_slug = city_name.lower().replace("ä", "a").replace("ö", "o").replace("å", "a").replace(" ", "-")
    adj_lower = adjective.lower()

    # Parempi kuin Helsinki -versio (Helsinki saa oman tekstin)
    if city_name == "Helsinki":
        vs_helsinki = f"Helsinki: parempi kuin kaikki muut – itse sanoo"
    else:
        vs_helsinki = f"{city_name} – parempi kuin Helsinki"

    products = [
        # 1 — vs Helsinki
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": vs_helsinki,
            "title": f"Hauska T-Paita {adjective}lle – {vs_helsinki}",
            "description": f"Kaupunkiylpeys paidassa. Hauska t-paita {adj_lower}lle tai {city_name}ssa vierailleelle. Laadukas painatus Huumorikauppa.fi:stä.",
            "tags": ["Kaupunkituotteet", "T-paita", city_name, adjective, region, "kaupunkihuumori"],
            "type": "tpaita",
        },
        # 2 — Made in
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"Made in {city_name}",
            "title": f"Hauska T-Paita – Made in {city_name}",
            "description": f"Kotiseutusydän paidassa. Made in {city_name} – alkuperäinen {adjective} tuote. Täydellinen lahja {city_name}laiselle.",
            "tags": ["Kaupunkituotteet", "T-paita", city_name, f"Made in {city_name}", region, "kotiseutu"],
            "type": "tpaita",
        },
        # 3 — Ylpeästi
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"{adjective}: ylpeästi",
            "title": f"Hauska Kahvimuki {adjective}lle – Ylpeästi",
            "description": f"Kotiseutupöytä täydennettynä. Hauska muki {adj_lower}lle, joka rakastaa kotiseutuaan. Lahjaidea {city_name}laiselle.",
            "tags": ["Kaupunkituotteet", "Kahvimuki", city_name, adjective, region, "kotiseutuylpeys"],
            "type": "muki",
        },
        # 4 — 100% verta
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"100 % {adjective}a verta",
            "title": f"Hauska T-Paita – 100% {adjective}a Verta",
            "description": f"Aitous paidassa. {city_name}lainen syntymästä asti – tämä paita sen todistaa. Hauska lahja {adj_lower}lle.",
            "tags": ["Kaupunkituotteet", "T-paita", city_name, adjective, region, "100prosenttia"],
            "type": "tpaita",
        },
        # 5 — Paras paikka
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"{city_name}: paras paikka maailmassa",
            "title": f"Hauska Kahvimuki – {city_name} Paras Paikka Maailmassa",
            "description": f"Kotiseutusydän mukissa. {city_name} on paras paikka maailmassa – ainakin {adj_lower}n mielestä. Hauska lahjaidea.",
            "tags": ["Kaupunkituotteet", "Kahvimuki", city_name, adjective, region, "parhaat-paikat"],
            "type": "muki",
        },
        # 6 — Syntynyt, ei pahoitteluja
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"Syntynyt {city_name}ssa – ei pahoitteluja",
            "title": f"Hauska T-Paita – Syntynyt {city_name}ssa Ei Pahoitteluja",
            "description": f"Syntymäpaikkahuumori paidassa. {city_name}ssa syntynyt – se on lahja, ei vaiva. Hauska t-paita kotiseutunsa rakastajalle.",
            "tags": ["Kaupunkituotteet", "T-paita", city_name, adjective, region, "syntymäpaikka"],
            "type": "tpaita",
        },
        # 7 — Selviää
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"{adjective} selviää mistä vain",
            "title": f"Hauska Huppari {adjective}lle – Selviää Mistä Vain",
            "description": f"{city_name}laisen sisukkuus hupparissa. {adjective} selviää mistä vain – sisu on kotimainen tuonti. Laadukas unisex-huppari.",
            "tags": ["Kaupunkituotteet", "Huppari", city_name, adjective, region, "sisu"],
            "type": "huppari",
        },
        # 8 — Vahva, sisukas, hieman outo
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"{adjective}: vahva, sisukas, hieman outo",
            "title": f"Hauska Kahvimuki – {adjective} Vahva Sisukas Hieman Outo",
            "description": f"Rehellinen kuvaus {adj_lower}sta. Vahva, sisukas ja hieman outo – niin kuin {city_name}laisen kuuluukin olla. Hauska muki.",
            "tags": ["Kaupunkituotteet", "Kahvimuki", city_name, adjective, region, "persoonallisuus"],
            "type": "muki",
        },
        # 9 — Kotiseutuylpeys
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"{city_name} – {vitsi}",
            "title": f"Hauska Muki – {city_name} Paikallinen Vitsi",
            "description": f"Paikallinen huumori mukissa. {city_name} – {vitsi}. Täydellinen muki {adj_lower}lle tai {city_name}ssa vierailleelle.",
            "tags": ["Kaupunkituotteet", "Kahvimuki", city_name, adjective, region, "paikallishuumori"],
            "type": "muki",
        },
        # 10 — Kotona vain
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"Kotona vain {city_name}ssa",
            "title": f"Hauska Huppari – Kotona Vain {city_name}ssa",
            "description": f"Kotiseutukaipaus hupparissa. Maailmaa voi kiertää, mutta kotona on vain {city_name}ssa. Lämmin unisex-huppari {adj_lower}lle.",
            "tags": ["Kaupunkituotteet", "Huppari", city_name, adjective, region, "kotiseutu"],
            "type": "huppari",
        },
    ]
    return products


def main():
    all_products = []
    for city_name, adjective, region, vitsi in CITIES:
        products = make_products(city_name, adjective, region, vitsi)
        all_products.extend(products)

    print(f"Generoitu {len(all_products)} tuotetta {len(CITIES)} kaupungille")

    # Tarkista jakauma
    types = {}
    for p in all_products:
        t = p["type"]
        types[t] = types.get(t, 0) + 1
    for t, n in types.items():
        print(f"  {t}: {n}")

    out_path = Path(__file__).parent / "kaupunkituotedata.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)
    print(f"Tallennettu: {out_path}")


if __name__ == "__main__":
    main()
