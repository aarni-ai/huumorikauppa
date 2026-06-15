#!/usr/bin/env python3
"""
generoi_kaupungit.py — Luo kaupunkiteemaisia tuotteita
Tallentaa kaupunkituotedata.json -tiedostoon.
Aja: python3 generoi_kaupungit.py
"""

import json
from pathlib import Path

# ---------------------------------------------------------------------------
# Kaupungit: (nimi, adjektiivi, alue, paikallisvitsi, sijaintimuoto)
#
# Sijaintimuoto = inessiivi tai adessiivi sen mukaan kumpi on kaupungille
# luonteva ("Helsingissä", "Tampereella" jne.)
# ---------------------------------------------------------------------------
CITIES = [
    ("Helsinki",       "Helsinkiläinen",      "Uusimaa",           "täynnä rakennustyömaita ja startup-firmoja",    "Helsingissä"),
    ("Espoo",          "Espoolainen",         "Uusimaa",           "Helsinki ilman Helsinkiä",                       "Espoossa"),
    ("Tampere",        "Tamperelainen",       "Pirkanmaa",         "Suomen paras kaupunki – itse sanoo",             "Tampereella"),
    ("Vantaa",         "Vantaalainen",        "Uusimaa",           "lentokenttä ja ylpeys",                          "Vantaalla"),
    ("Oulu",           "Oululainen",          "Pohjois-Pohjanmaa", "teknologian pääkaupunki – pakkasessa",           "Oulussa"),
    ("Turku",          "Turkulainen",         "Varsinais-Suomi",   "Suomen vanhin kaupunki – muistaa sen",           "Turussa"),
    ("Jyväskylä",      "Jyväskyläläinen",     "Keski-Suomi",       "opiskelija joka ei koskaan valmistunut",         "Jyväskylässä"),
    ("Lahti",          "Lahtelainen",         "Päijät-Häme",       "MM-hiihtäjien ja säästöjen kaupunki",            "Lahdessa"),
    ("Kuopio",         "Kuopiolainen",        "Pohjois-Savo",      "savon sydän – kaikki tietää sen",                "Kuopiossa"),
    ("Pori",           "Porilainen",          "Satakunta",         "Jazz ja joki – ei tarvita muuta",                "Porissa"),
    ("Joensuu",        "Joensuulainen",       "Pohjois-Karjala",   "Karjalan sydän ja ylpeys",                       "Joensuussa"),
    ("Lappeenranta",   "Lappeenrantalainen",  "Etelä-Karjala",     "Saimaan rannalla, Venäjän naapurina",            "Lappeenrannassa"),
    ("Hämeenlinna",    "Hämeenlinnalainen",   "Kanta-Häme",        "Sibeliuksen kotipaikka",                         "Hämeenlinnassa"),
    ("Vaasa",          "Vaasalainen",         "Pohjanmaa",         "kaksikielinen ja ylpeä",                         "Vaasassa"),
    ("Seinäjoki",      "Seinäjokelainen",     "Etelä-Pohjanmaa",   "Provinssirock ja tasainen maasto",               "Seinäjoella"),
    ("Rovaniemi",      "Rovaniemeläinen",     "Lappi",             "Joulupukin naapuri",                             "Rovaniemellä"),
    ("Mikkeli",        "Mikkeliläinen",       "Etelä-Savo",        "Saimaan portilla",                               "Mikkelissä"),
    ("Kotka",          "Kotkalainen",         "Kymenlaakso",       "merikaupunki ja kotkia",                         "Kotkassa"),
    ("Kouvola",        "Kouvolalainen",       "Kymenlaakso",       "Suomen keskilapsi – kaikki tuntee",              "Kouvolassa"),
    ("Salo",           "Salolainen",          "Varsinais-Suomi",   "entinen Nokian kaupunki – selviytyi",            "Salossa"),
    ("Porvoo",         "Porvoolainen",        "Uusimaa",           "vanhakaupunki ja turistit",                      "Porvoossa"),
    ("Kokkola",        "Kokkolalainen",       "Keski-Pohjanmaa",   "Pohjanmaan helmi",                               "Kokkolassa"),
    ("Hyvinkää",       "Hyvinkääläinen",      "Uusimaa",           "junanradan varrella",                            "Hyvinkäällä"),
    ("Järvenpää",      "Järvenpääläinen",     "Uusimaa",           "Sibeliuksen Ainolassa",                          "Järvenpäässä"),
    ("Rauma",          "Raumalainen",         "Satakunta",         "Raumanmurre ja UNESCO",                          "Raumalla"),
    ("Kajaani",        "Kajaanilainen",       "Kainuu",            "kaukana mutta ei unohdettu",                     "Kajaanissa"),
    ("Imatra",         "Imatralainen",        "Etelä-Karjala",     "kosken kaupunki",                                "Imatralla"),
    ("Savonlinna",     "Savonlinnalainen",    "Etelä-Savo",        "oopperajuhlien ja linnan kaupunki",              "Savonlinnassa"),
    ("Kerava",         "Keravainen",          "Uusimaa",           "nopein juna Helsinkiin",                         "Keravalla"),
    ("Lohja",          "Lohjalainen",         "Uusimaa",           "omenat ja järvet",                               "Lohjalla"),
    ("Tornio",         "Torniolainen",        "Lappi",             "Ruotsin naapuri – käy ostoksilla",               "Torniossa"),
    ("Kemi",           "Kemiläinen",          "Lappi",             "Lumen kaupunki – kirjaimellisesti",              "Kemissä"),
    ("Nokia",          "Nokialainen",         "Pirkanmaa",         "ei se puhelin – kaupunki",                       "Nokialla"),
    ("Valkeakoski",    "Valkeakoskelainen",   "Pirkanmaa",         "teollisuuskaupunki ja kosket",                   "Valkeakoskella"),
    ("Riihimäki",      "Riihimäkeläinen",     "Kanta-Häme",        "rautatiekaupunki",                               "Riihimäellä"),
    ("Kaarina",        "Kaarinalainen",       "Varsinais-Suomi",   "Turun naapuri – ylpeästi oma",                   "Kaarinassa"),
    ("Raisio",         "Raisiolainen",        "Varsinais-Suomi",   "Raisio ja Benecol",                              "Raisiossa"),
    ("Forssa",         "Forssalainen",        "Kanta-Häme",        "tekstiiliteollisuuden henki",                    "Forssassa"),
    ("Iisalmi",        "Iisalmelainen",       "Pohjois-Savo",      "salmi ja savolaishuumori",                       "Iisalmessa"),
    ("Varkaus",        "Varkaalainen",        "Pohjois-Savo",      "teollisuuskaupunki Savossa",                     "Varkaudessa"),
    ("Lieksa",         "Lieksalainen",        "Pohjois-Karjala",   "Pielisen rannalla",                              "Lieksassa"),
    ("Ylöjärvi",       "Ylöjärveläinen",      "Pirkanmaa",         "Tampereen naapuri",                              "Ylöjärvellä"),
    ("Kangasala",      "Kangasalalainen",     "Pirkanmaa",         "järvien kaupunki",                               "Kangasalla"),
    ("Naantali",       "Naantalilainen",      "Varsinais-Suomi",   "Muumimaailma ja kesäloma",                       "Naantalissa"),
    ("Heinola",        "Heinolalainen",       "Päijät-Häme",       "Kymijoen kaupunki",                              "Heinolassa"),
    ("Lempäälä",       "Lempääläläinen",      "Pirkanmaa",         "moottoritien varrella",                          "Lempäälässä"),
    ("Pirkkala",       "Pirkkalalainen",      "Pirkanmaa",         "lentoaseman kaupunki",                           "Pirkkalassa"),
    ("Akaa",           "Akaalainen",          "Pirkanmaa",         "pieni mutta ylpeä",                              "Akaassa"),
    ("Orimattila",     "Orimattilalainen",    "Päijät-Häme",       "marjat ja maaseutu",                             "Orimattilassa"),
    ("Harjavalta",     "Harjavaltalainen",    "Satakunta",         "kuparin kaupunki",                               "Harjavallassa"),
    ("Nummela",        "Nummelalainen",       "Uusimaa",           "Vihdin sydän",                                   "Nummelassa"),
]

# ---------------------------------------------------------------------------
# Taivutusapufunktiot
# ---------------------------------------------------------------------------

FRONT_VOWELS = set("äöy")

def to_allative(adj: str) -> str:
    """Taipuu allatiiviin: Helsinkiläinen → Helsinkiläiselle"""
    if adj.endswith("nen"):
        return adj[:-3] + "selle"
    return adj + "lle"

def to_partitive(adj: str) -> str:
    """Taipuu partitiiviin: Helsinkiläinen → Helsinkiläistä, Tamperelainen → Tamperelaista"""
    if adj.endswith("inen"):
        base = adj[:-4]  # poista "inen"
        has_front = any(c in FRONT_VOWELS for c in base)
        return base + ("istä" if has_front else "ista")
    return adj


def make_products(city_name: str, adjective: str, region: str, vitsi: str, inessive: str) -> list:
    """Luo 10 tuotetta yhdelle kaupungille oikeinkielisillä tekstimuodoilla."""

    adj_alle   = to_allative(adjective)         # Helsinkiläiselle
    adj_part   = to_partitive(adjective)        # Helsinkiläistä
    adj_lower  = adjective.lower()              # helsinkiläinen
    alle_lower = adj_alle.lower()               # helsinkiläiselle

    if city_name == "Helsinki":
        vs_helsinki = "Helsinki: parempi kuin kaikki muut – itse sanoo"
    else:
        vs_helsinki = f"{city_name} – parempi kuin Helsinki"

    BASE_TAGS = ["Kaupunkipaidat", city_name, adjective, region]

    products = [
        # 1 — Vs Helsinki (t-paita)
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": vs_helsinki,
            "title": f"Hauska t-paita {adj_alle} – {vs_helsinki}",
            "description": (
                f"Kaupunkiylpeys paidassa. Hauska t-paita {alle_lower} tai "
                f"{inessive} vierailleelle. Laadukas painatus Huumorikauppa.fi:stä."
            ),
            "tags": BASE_TAGS + ["T-paita", "kaupunkiylpeys"],
            "type": "tpaita",
        },
        # 2 — Made in (t-paita)
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"Made in {city_name}",
            "title": f"Hauska t-paita – Made in {city_name}",
            "description": (
                f"Kotiseutusydän paidassa. Made in {city_name} – alkuperäinen "
                f"{adj_lower} tuote. Täydellinen lahja {alle_lower}."
            ),
            "tags": BASE_TAGS + ["T-paita", f"Made in {city_name}", "kotiseutu"],
            "type": "tpaita",
        },
        # 3 — Ylpeästi (kahvimuki)
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"{adjective}: ylpeästi",
            "title": f"Hauska kahvimuki {adj_alle} – ylpeästi",
            "description": (
                f"Kotiseutupöytä täydennettynä. Hauska muki {alle_lower}, "
                f"joka rakastaa kotiseutuaan. Lahjaidea {alle_lower}."
            ),
            "tags": BASE_TAGS + ["Kahvimuki", "kotiseutuylpeys"],
            "type": "muki",
        },
        # 4 — 100 % verta (t-paita)
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"100 % {adj_part} verta",
            "title": f"Hauska t-paita – 100 % {adj_part} verta",
            "description": (
                f"Aitous paidassa. {adjective} syntymästä asti – "
                f"tämä paita sen todistaa. Hauska lahja {alle_lower}."
            ),
            "tags": BASE_TAGS + ["T-paita", "100prosenttia"],
            "type": "tpaita",
        },
        # 5 — Paras paikka maailmassa (kahvimuki)
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"{city_name}: paras paikka maailmassa",
            "title": f"Hauska kahvimuki – {city_name}: paras paikka maailmassa",
            "description": (
                f"Kotiseutusydän mukissa. {city_name} on paras paikka maailmassa – "
                f"ainakin {adj_lower}n mielestä. Hauska lahjaidea."
            ),
            "tags": BASE_TAGS + ["Kahvimuki", "parhaat-paikat"],
            "type": "muki",
        },
        # 6 — Syntynyt (t-paita)
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"Syntynyt {inessive} – ei pahoitteluja",
            "title": f"Hauska t-paita – syntynyt {inessive}, ei pahoitteluja",
            "description": (
                f"Syntymäpaikkahuumori paidassa. {inessive} syntynyt – "
                f"se on lahja, ei vaiva. Hauska t-paita kotiseutunsa rakastajalle."
            ),
            "tags": BASE_TAGS + ["T-paita", "syntymäpaikka"],
            "type": "tpaita",
        },
        # 7 — Selviää mistä vain (huppari)
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"{adjective} selviää mistä vain",
            "title": f"Hauska huppari {adj_alle} – selviää mistä vain",
            "description": (
                f"{city_name}laisen sisukkuus hupparissa. {adjective} selviää mistä vain – "
                f"sisu on kotimainen tuonti. Laadukas unisex-huppari."
            ),
            "tags": BASE_TAGS + ["Huppari", "sisu"],
            "type": "huppari",
        },
        # 8 — Vahva sisukas hieman outo (kahvimuki)
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"{adjective}: vahva, sisukas, hieman outo",
            "title": f"Hauska kahvimuki – {adjective}: vahva, sisukas, hieman outo",
            "description": (
                f"Rehellinen kuvaus {adj_lower}sta. Vahva, sisukas ja hieman outo – "
                f"niin kuin {adj_lower}n kuuluukin olla. Hauska muki."
            ),
            "tags": BASE_TAGS + ["Kahvimuki", "persoonallisuus"],
            "type": "muki",
        },
        # 9 — Paikallinen vitsi (kahvimuki)
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"{city_name} – {vitsi}",
            "title": f"Hauska kahvimuki – {city_name}: {vitsi}",
            "description": (
                f"Paikallinen huumori mukissa. {city_name} – {vitsi}. "
                f"Täydellinen muki {alle_lower} tai {inessive} vierailleelle."
            ),
            "tags": BASE_TAGS + ["Kahvimuki", "paikallishuumori"],
            "type": "muki",
        },
        # 10 — Kotona vain (huppari)
        {
            "kategoria": "kaupunkituotteet",
            "vitsin_teksti": f"Kotona vain {inessive}",
            "title": f"Hauska huppari – kotona vain {inessive}",
            "description": (
                f"Kotiseutukaipaus hupparissa. Maailmaa voi kiertää, "
                f"mutta kotona on vain {inessive}. Lämmin unisex-huppari {alle_lower}."
            ),
            "tags": BASE_TAGS + ["Huppari", "kotiseutu"],
            "type": "huppari",
        },
    ]
    return products


def main():
    all_products = []
    for city_name, adjective, region, vitsi, inessive in CITIES:
        products = make_products(city_name, adjective, region, vitsi, inessive)
        all_products.extend(products)

    print(f"Generoitu {len(all_products)} tuotetta {len(CITIES)} kaupungille")

    types = {}
    for p in all_products:
        t = p["type"]
        types[t] = types.get(t, 0) + 1
    for t, n in types.items():
        print(f"  {t}: {n}")

    # Pikavarmistus muutamasta kriittisestä tekstistä
    samples = [(p["vitsin_teksti"], p["title"]) for p in all_products if "%" in p["vitsin_teksti"]][:3]
    print("\nEsimerkkejä 100%-tuotteista:")
    for vt, title in samples:
        print(f"  vitsin_teksti: {vt}")
        print(f"  title:         {title}")

    out_path = Path(__file__).parent / "kaupunkituotedata.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)
    print(f"\nTallennettu: {out_path}")


if __name__ == "__main__":
    main()
