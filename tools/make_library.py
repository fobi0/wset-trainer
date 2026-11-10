#!/usr/bin/env python3
"""Generate library.json: grape and wine profiles for the WSET Level 2 syllabus.

Scope follows the WSET Level 2 Award in Wines specification, Issue 2 (2023):
LO3 principal grapes, LO4 regionally important grapes, LO5 sparkling and fortified wines.
Regions listed per grape are exactly the GIs the spec names for that grape.

Run from the repo root: python3 tools/make_library.py
Structure scales are 1-5 ranges: 1 low, 2 medium(-), 3 medium, 4 medium(+), 5 high
(body: light..full, sweetness: dry, off-dry, medium, sweet, luscious; colour: pale..deep).
"""
import json
from pathlib import Path

AROMAS = {
    # fruit (primary)
    "blackcurrant": "schwarze Johannisbeere", "black cherry": "Schwarzkirsche", "red cherry": "rote Kirsche",
    "blackberry": "Brombeere", "blueberry": "Heidelbeere", "black plum": "schwarze Pflaume", "red plum": "rote Pflaume",
    "plum": "Pflaume", "strawberry": "Erdbeere", "raspberry": "Himbeere", "fruitcake": "Früchtekuchen",
    "raisin": "Rosine", "fig": "Feige", "date": "Dattel", "dried fruit": "Trockenfrüchte", "dried cherry": "getrocknete Kirsche",
    "green apple": "grüner Apfel", "red apple": "roter Apfel", "apple": "Apfel", "pear": "Birne", "quince": "Quitte",
    "lemon": "Zitrone", "lime": "Limette", "grapefruit": "Grapefruit", "peach": "Pfirsich", "apricot": "Aprikose",
    "melon": "Melone", "pineapple": "Ananas", "mango": "Mango", "banana": "Banane", "passion fruit": "Passionsfrucht",
    "gooseberry": "Stachelbeere", "lychee": "Litschi", "grape": "Traube", "marmalade": "Orangenmarmelade",
    # floral, herbal, spice (primary)
    "violet": "Veilchen", "rose": "Rose", "blossom": "Blüten", "orange blossom": "Orangenblüte", "elderflower": "Holunderblüte",
    "grass": "Gras", "green bell pepper": "grüne Paprika", "asparagus": "Spargel", "mint": "Minze", "dried herbs": "getrocknete Kräuter",
    "black pepper": "schwarzer Pfeffer", "white pepper": "weißer Pfeffer", "liquorice": "Lakritz", "ginger": "Ingwer",
    "almond": "Mandel", "chocolate": "Schokolade", "bubblegum": "Kaugummi",
    # winemaking (secondary)
    "vanilla": "Vanille", "coconut": "Kokos", "toast": "Röstaromen", "smoke": "Rauch", "cedar": "Zedernholz",
    "clove": "Nelke", "coffee": "Kaffee", "butter": "Butter", "bread": "Brot", "biscuit": "Keks", "brioche": "Brioche", "yeast": "Hefe",
    # ageing (tertiary)
    "leather": "Leder", "earth": "Erde", "forest floor": "Waldboden", "mushroom": "Pilz", "game": "Wild", "meat": "Fleisch",
    "tobacco": "Tabak", "tar": "Teer", "truffle": "Trüffel", "honey": "Honig", "hazelnut": "Haselnuss", "nuts": "Nüsse",
    "walnut": "Walnuss", "toffee": "Toffee", "caramel": "Karamell", "petrol": "Petrol",
}

# One-line "how to recognise it" cue per entry (EN, DE). Shown in the library profile and used
# as the hint in the trainer's spot-the-difference feedback. Keep them short and distinctive.
SIGNATURES = {
    "cabernet-sauvignon": ("Deep colour, high tannin AND high acidity, blackcurrant, often mint or green bell pepper.",
                           "Tiefe Farbe, viel Tannin UND hohe Säure, schwarze Johannisbeere, oft Minze oder grüne Paprika."),
    "merlot": ("Like a softer Cabernet: medium acidity, medium tannin, plum and red/black fruit.",
               "Wie ein weicherer Cabernet: mittlere Säure, mittleres Tannin, Pflaume und rote/schwarze Frucht."),
    "syrah": ("Deep colour, blackberry and black pepper; very ripe with chocolate when hot (Shiraz).",
              "Tiefe Farbe, Brombeere und schwarzer Pfeffer; in heißem Klima sehr reif mit Schokolade (Shiraz)."),
    "pinot-noir": ("Pale colour, low tannin, high acidity, red fruit (strawberry, raspberry, cherry).",
                   "Helle Farbe, wenig Tannin, hohe Säure, rote Frucht (Erdbeere, Himbeere, Kirsche)."),
    "chardonnay": ("Neutral grape shaped by climate and winemaking: green apple to tropical, butter and toast if oaked.",
                   "Neutrale Rebsorte, geprägt von Klima und Ausbau: grüner Apfel bis tropisch, Butter und Toast mit Holz."),
    "sauvignon-blanc": ("High acidity, pungent green aromas (grass, gooseberry, green bell pepper), usually unoaked.",
                        "Hohe Säure, intensive grüne Aromen (Gras, Stachelbeere, grüne Paprika), meist ohne Holz."),
    "riesling": ("Very high acidity at ANY sweetness level; lime, apple, blossom; petrol with age.",
                 "Sehr hohe Säure bei JEDER Süßestufe; Limette, Apfel, Blüten; Petrol mit dem Alter."),
    "pinot-grigio": ("Two styles: light, neutral Grigio or rich, full Alsace Gris; only medium acidity.",
                     "Zwei Stile: leichter, neutraler Grigio oder üppiger, voller Gris aus dem Elsass; nur mittlere Säure."),
    "gamay": ("Light, pale, high acidity, very low tannin; red fruit plus banana and bubblegum.",
              "Leicht, hell, hohe Säure, sehr wenig Tannin; rote Frucht plus Banane und Kaugummi."),
    "grenache": ("High alcohol and full body but fairly pale and soft; ripe strawberry, spice, dried herbs.",
                 "Viel Alkohol und voller Körper, aber eher hell und weich; reife Erdbeere, Würze, getrocknete Kräuter."),
    "tempranillo": ("Medium in everything; red fruit plus vanilla and coconut from American oak, leather with age.",
                    "Überall mittel; rote Frucht plus Vanille und Kokos aus amerikanischer Eiche, Leder mit dem Alter."),
    "nebbiolo": ("PALE but very high tannin and acidity; rose and tar.",
                 "HELL, aber sehr viel Tannin und Säure; Rose und Teer."),
    "barbera": ("Deep colour, HIGH acidity, LOW tannin; red cherry.",
                "Tiefe Farbe, HOHE Säure, WENIG Tannin; rote Kirsche."),
    "sangiovese": ("High acidity, medium(+) tannin, red cherry and dried herbs.",
                   "Hohe Säure, mittleres bis hohes Tannin, rote Kirsche und getrocknete Kräuter."),
    "corvina": ("Light and fresh with sour cherry; dried grapes give dry Amarone or sweet Recioto.",
                "Leicht und frisch mit Sauerkirsche; getrocknete Trauben ergeben trockenen Amarone oder süßen Recioto."),
    "montepulciano": ("Deep colour with lots of SOFT, ripe tannin and black fruit; only medium acidity.",
                      "Tiefe Farbe mit viel WEICHEM, reifem Tannin und schwarzer Frucht; nur mittlere Säure."),
    "zinfandel": ("Very high alcohol, jammy black fruit mixed with raisins (uneven ripening).",
                  "Sehr viel Alkohol, marmeladige schwarze Frucht gemischt mit Rosinen (ungleichmäßige Reife)."),
    "pinotage": ("Deep and tannic despite its Pinot parent; dark fruit with smoky, earthy notes.",
                 "Dunkel und tanninreich trotz Pinot-Elternteil; dunkle Frucht mit rauchigen, erdigen Noten."),
    "carmenere": ("Deep colour, soft tannins, black fruit with a green bell pepper note.",
                  "Tiefe Farbe, weiche Tannine, schwarze Frucht mit einer Note von grüner Paprika."),
    "malbec": ("Deep purple, full body, plush black fruit and violet, soft ripe tannins.",
               "Tiefviolett, voller Körper, üppige schwarze Frucht und Veilchen, weiche reife Tannine."),
    "chenin-blanc": ("High acidity in every style from dry to sweet; apple, quince, honey with age.",
                     "Hohe Säure in jedem Stil von trocken bis süß; Apfel, Quitte, Honig mit dem Alter."),
    "semillon": ("Two extremes: lean, low-alcohol Hunter Semillon or luscious, botrytised Sauternes.",
                 "Zwei Extreme: schlanker, alkoholarmer Hunter Semillon oder edelsüßer, botrytisierter Sauternes."),
    "viognier": ("Full body, high alcohol, LOW-medium acidity; apricot and peach.",
                 "Voller Körper, viel Alkohol, NIEDRIGE bis mittlere Säure; Aprikose und Pfirsich."),
    "gewurztraminer": ("Lychee and rose, deep colour, full body, LOW acidity.",
                       "Litschi und Rose, tiefe Farbe, voller Körper, NIEDRIGE Säure."),
    "verdicchio": ("High acidity, citrus and green apple, bitter-almond finish.",
                   "Hohe Säure, Zitrus und grüner Apfel, Bittermandel im Abgang."),
    "cortese": ("Light, crisp and high in acidity; green apple and lemon (Gavi).",
                "Leicht, frisch und säurebetont; grüner Apfel und Zitrone (Gavi)."),
    "garganega": ("Medium body, pear, apple and almond (Soave); dried grapes for sweet Recioto di Soave.",
                  "Mittlerer Körper, Birne, Apfel und Mandel (Soave); getrocknet für süßen Recioto di Soave."),
    "fiano": ("Medium-full body, medium acidity, ripe stone fruit and melon; honey and nuts with age.",
              "Mittlerer bis voller Körper, mittlere Säure, reifes Steinobst und Melone; Honig und Nüsse mit dem Alter."),
    "albarino": ("High acidity, citrus and peach, light and fresh (Atlantic Spain).",
                 "Hohe Säure, Zitrus und Pfirsich, leicht und frisch (atlantisches Spanien)."),
    "furmint": ("Searing acidity; famous for sweet Tokaji Aszú with apricot, marmalade and honey.",
                "Sehr hohe Säure; berühmt für süßen Tokaji Aszú mit Aprikose, Orangenmarmelade und Honig."),
    "meunier": ("The fruity, early-maturing third Champagne grape; a black grape made into white sparkling wine.",
                "Die fruchtige, früh reifende dritte Champagner-Rebsorte; rote Traube für weißen Schaumwein."),
    "moscato": ("Smells of fresh grapes and orange blossom; sweet, low alcohol (Asti).",
                "Duftet nach frischen Trauben und Orangenblüte; süß, alkoholarm (Asti)."),
    "glera": ("Pear, apple and blossom, no bready notes: the Prosecco grape.",
              "Birne, Apfel und Blüten, keine Brotnoten: die Prosecco-Rebsorte."),
    "champagne": ("High acidity with bread, biscuit and toast from long lees ageing.",
                  "Hohe Säure mit Brot, Keks und Toast aus langer Hefelagerung."),
    "cava": ("Traditional method like Champagne, but usually fruitier with less toast.",
             "Traditionelle Methode wie Champagner, aber meist fruchtiger mit weniger Röstnoten."),
    "prosecco": ("Tank method: fresh pear and blossom, no autolytic notes.",
                 "Tankgärung: frische Birne und Blüten, keine Autolysenoten."),
    "asti": ("Sweet, grapey, about 7 % abv, from Moscato.",
             "Süß, traubig, etwa 7 % vol, aus Moscato."),
    "new-world-sparkling": ("Traditional method from Chardonnay and Pinot Noir in cool sites; Cap Classique in South Africa.",
                            "Traditionelle Methode aus Chardonnay und Pinot Noir in kühlen Lagen; Cap Classique in Südafrika."),
    "sherry": ("Fortified AFTER fermentation, so naturally dry; flor (bready) or oxidative (nutty).",
               "NACH der Gärung aufgespritet, daher von Natur aus trocken; Flor (brotig) oder oxidativ (nussig)."),
    "port": ("Fortified DURING fermentation, so sweet and red; Ruby fruity, Tawny nutty.",
             "WÄHREND der Gärung aufgespritet, daher süß und rot; Ruby fruchtig, Tawny nussig."),
}

ITEMS = []

def item(id, name, kind, group, structure, primary, secondary, tertiary, notes_en, notes_de, regions,
         synonyms=(), terms=(), grapes=()):
    sig_en, sig_de = SIGNATURES[id]
    ITEMS.append({
        "id": id, "name": name, "synonyms": list(synonyms), "kind": kind, "group": group,
        "signature": {"en": sig_en, "de": sig_de},
        "structure": {k: list(v) if v else None for k, v in structure.items()},
        "aromas": {"primary": primary, "secondary": secondary, "tertiary": tertiary},
        "notes": {"en": notes_en, "de": notes_de},
        "regions": [{"country": c, "gis": g} for c, g in regions],
        "terms": list(terms), "grapes": list(grapes),
    })

def S(colour, sweetness, acidity, tannin, alcohol, body):
    return {"colour": colour, "sweetness": sweetness, "acidity": acidity, "tannin": tannin, "alcohol": alcohol, "body": body}

# ===================== LO3: principal black grapes =====================
item("cabernet-sauvignon", "Cabernet Sauvignon", "black", "principal",
     S((4, 5), (1, 1), (4, 5), (5, 5), (3, 5), (4, 5)),
     ["blackcurrant", "black cherry", "mint", "green bell pepper"], ["vanilla", "cedar", "smoke", "toast"], ["leather", "tobacco", "earth", "dried fruit"],
     ["Thick-skinned and late-ripening: needs a moderate or warm climate (e.g. warm gravel soils of the Left Bank).",
      "Moderate climates: blackcurrant, mint, green bell pepper notes; warm climates: riper black cherry and black fruit.",
      "Often blended with Merlot, which fills out its firm tannins. Responds very well to new French oak; top wines age for decades."],
     ["Dickschalig und spät reifend: braucht ein gemäßigtes oder warmes Klima (z. B. die warmen Kiesböden des linken Ufers).",
      "Gemäßigtes Klima: schwarze Johannisbeere, Minze, grüne Paprika; warmes Klima: reifere Schwarzkirsche und schwarze Frucht.",
      "Oft mit Merlot verschnitten, der die festen Tannine abrundet. Verträgt neue französische Eiche sehr gut; Spitzenweine reifen jahrzehntelang."],
     [("France", ["Pays d'Oc (IGP)", "Bordeaux", "Haut-Médoc", "Pauillac", "Margaux", "Graves", "Pessac-Léognan"]),
      ("USA", ["California", "Napa Valley", "Oakville", "Rutherford", "Calistoga", "Sonoma"]),
      ("Chile", ["Central Valley", "Maipo Valley", "Colchagua Valley"]),
      ("South Africa", ["Stellenbosch"]),
      ("Australia", ["Coonawarra", "Margaret River"]),
      ("New Zealand", ["Hawke's Bay"])],
     terms=["Bordeaux Supérieur", "Cru Bourgeois", "Grand Cru Classé"])

item("merlot", "Merlot", "black", "principal",
     S((3, 5), (1, 1), (3, 3), (3, 3), (3, 5), (3, 5)),
     ["plum", "red cherry", "strawberry", "blackberry", "fruitcake"], ["vanilla", "toast", "coffee", "clove"], ["leather", "earth", "forest floor", "dried fruit"],
     ["Ripens earlier than Cabernet Sauvignon, so it suits cooler clay soils (Right Bank Bordeaux).",
      "Moderate climates: red fruit (strawberry, red plum), more structure; warm climates: blackberry, black plum, fruitcake, full body.",
      "Softer, rounder tannins than Cabernet. Made from inexpensive fruity styles (Pays d'Oc, Central Valley) up to long-lived Pomerol."],
     ["Reift früher als Cabernet Sauvignon und passt daher zu kühleren Lehmböden (rechtes Ufer von Bordeaux).",
      "Gemäßigtes Klima: rote Frucht (Erdbeere, rote Pflaume), mehr Struktur; warmes Klima: Brombeere, schwarze Pflaume, Früchtekuchen, voller Körper.",
      "Weichere, rundere Tannine als Cabernet. Von günstigen, fruchtigen Stilen (Pays d'Oc, Central Valley) bis zu langlebigem Pomerol."],
     [("France", ["Pays d'Oc (IGP)", "Bordeaux", "Saint-Émilion", "Pomerol"]),
      ("USA", ["California", "Napa Valley", "Sonoma"]),
      ("Chile", ["Central Valley"]),
      ("South Africa", ["Stellenbosch"]),
      ("Australia", ["Margaret River"]),
      ("New Zealand", ["Hawke's Bay"])],
     terms=["Bordeaux Supérieur", "Grand Cru Classé"])

item("syrah", "Syrah", "black", "principal",
     S((4, 5), (1, 1), (3, 4), (3, 5), (3, 5), (3, 5)),
     ["blackberry", "black plum", "black pepper", "violet", "liquorice", "chocolate"], ["vanilla", "coconut", "smoke", "toast"], ["leather", "meat", "earth"],
     ["Called Shiraz in Australia. Deep colour, medium-to-high tannin.",
      "Moderate climates (Northern Rhône): blackberry, black pepper, savoury, medium to full body; warm climates (Barossa): very ripe black fruit, liquorice, chocolate, full body, high alcohol.",
      "In Côte Rôtie a little Viognier may be co-fermented. Also blended with Grenache in the Southern Rhône and Australia."],
     ["Heißt in Australien Shiraz. Tiefe Farbe, mittleres bis hohes Tannin.",
      "Gemäßigtes Klima (nördliche Rhône): Brombeere, schwarzer Pfeffer, herzhaft, mittlerer bis voller Körper; warmes Klima (Barossa): sehr reife schwarze Frucht, Lakritz, Schokolade, voller Körper, viel Alkohol.",
      "In der Côte Rôtie darf etwas Viognier mitvergoren werden. Außerdem Verschnittpartner von Grenache an der südlichen Rhône und in Australien."],
     [("France", ["Pays d'Oc (IGP)", "Crozes-Hermitage", "Hermitage", "Côte Rôtie", "Minervois"]),
      ("Australia", ["South Eastern Australia", "Barossa Valley", "Hunter Valley"])],
     synonyms=["Shiraz"])

item("pinot-noir", "Pinot Noir", "black", "principal",
     S((1, 2), (1, 1), (3, 5), (1, 3), (3, 3), (2, 3)),
     ["strawberry", "raspberry", "red cherry", "black cherry"], ["vanilla", "smoke", "clove"], ["mushroom", "forest floor", "game", "earth"],
     ["Thin-skinned: pale colour, low-to-medium tannin. Needs a cool to moderate climate; too hot and the fruit turns jammy.",
      "Cool climates: red fruit (strawberry, raspberry, red cherry); moderate climates: riper black cherry.",
      "Top Burgundy ages well, developing mushroom and forest floor. Also one of the three main Champagne grapes."],
     ["Dünnschalig: helle Farbe, wenig bis mittleres Tannin. Braucht kühles bis gemäßigtes Klima; bei zu viel Hitze wird die Frucht marmeladig.",
      "Kühles Klima: rote Frucht (Erdbeere, Himbeere, rote Kirsche); gemäßigtes Klima: reifere Schwarzkirsche.",
      "Spitzen-Burgunder reifen gut und entwickeln Pilz- und Waldbodennoten. Außerdem eine der drei Hauptrebsorten der Champagne."],
     [("France", ["Bourgogne/Burgundy", "Gevrey-Chambertin", "Nuits-Saint-Georges", "Beaune", "Pommard"]),
      ("USA", ["Sonoma", "Los Carneros", "Santa Barbara County", "Oregon"]),
      ("Chile", ["Casablanca Valley"]),
      ("South Africa", ["Walker Bay"]),
      ("Australia", ["Yarra Valley", "Mornington Peninsula"]),
      ("New Zealand", ["Martinborough", "Marlborough", "Central Otago"])],
     terms=["Premier Cru", "Grand Cru"])

# ===================== LO3: principal white grapes =====================
item("chardonnay", "Chardonnay", "white", "principal",
     S((1, 4), (1, 1), (3, 5), None, (3, 5), (3, 5)),
     ["green apple", "lemon", "peach", "melon", "pineapple", "banana"], ["butter", "vanilla", "toast", "biscuit"], ["hazelnut", "honey", "mushroom"],
     ["A fairly neutral grape that shows its climate and winemaking: cool = green apple, lemon; moderate = peach, melon; warm = pineapple, banana.",
      "Responds well to oak, MLF (butter) and lees (biscuit): from crisp unoaked Chablis to rich, oaked Meursault or Napa.",
      "Also one of the three main grapes of Champagne and many traditional-method wines."],
     ["Eine eher neutrale Rebsorte, die Klima und Weinbereitung zeigt: kühl = grüner Apfel, Zitrone; gemäßigt = Pfirsich, Melone; warm = Ananas, Banane.",
      "Reagiert gut auf Eiche, BSA (Butter) und Hefelager (Keks): vom frischen, holzfreien Chablis bis zum üppigen, holzgereiften Meursault oder Napa.",
      "Außerdem eine der drei Hauptrebsorten der Champagne und vieler Flaschengärungs-Schaumweine."],
     [("France", ["Pays d'Oc (IGP)", "Bourgogne/Burgundy", "Chablis", "Puligny-Montrachet", "Meursault", "Mâcon", "Pouilly-Fuissé"]),
      ("USA", ["California", "Sonoma", "Los Carneros", "Napa Valley", "Santa Barbara County", "Oregon"]),
      ("Chile", ["Central Valley", "Casablanca Valley"]),
      ("South Africa", ["Western Cape", "Walker Bay"]),
      ("Australia", ["South Eastern Australia", "Yarra Valley", "Adelaide Hills", "Margaret River"]),
      ("New Zealand", ["Marlborough", "Hawke's Bay"])],
     terms=["Premier Cru", "Grand Cru"])

item("sauvignon-blanc", "Sauvignon Blanc", "white", "principal",
     S((1, 2), (1, 1), (4, 5), None, (2, 3), (2, 3)),
     ["grass", "green bell pepper", "asparagus", "gooseberry", "elderflower", "passion fruit"], ["vanilla", "toast"], [],
     ["Aromatic, high acidity, usually unoaked and made to be drunk young while the primary aromas are fresh.",
      "Cool sites: grass, green bell pepper, asparagus; riper sites: passion fruit and stone fruit (pronounced in Marlborough).",
      "In Bordeaux (Graves, Pessac-Léognan) often blended with Semillon and sometimes oaked."],
     ["Aromatisch, hohe Säure, meist ohne Holz ausgebaut und jung zu trinken, solange die Primäraromen frisch sind.",
      "Kühle Lagen: Gras, grüne Paprika, Spargel; reifere Lagen: Passionsfrucht und Steinobst (ausgeprägt in Marlborough).",
      "In Bordeaux (Graves, Pessac-Léognan) oft mit Semillon verschnitten und teils im Holz ausgebaut."],
     [("France", ["Pays d'Oc (IGP)", "Sancerre", "Pouilly-Fumé", "Touraine", "Bordeaux", "Graves", "Pessac-Léognan"]),
      ("USA", ["Napa Valley"]),
      ("Chile", ["Central Valley", "Casablanca Valley"]),
      ("South Africa", ["Elgin", "Constantia"]),
      ("Australia", ["Adelaide Hills", "Margaret River"]),
      ("New Zealand", ["Marlborough"])])

item("riesling", "Riesling", "white", "principal",
     S((1, 3), (1, 5), (5, 5), None, (1, 4), (1, 3)),
     ["green apple", "lemon", "lime", "peach", "apricot", "blossom"], [], ["petrol", "honey", "toast"],
     ["Very high acidity, almost never oaked; made in every sweetness level, from bone dry to luscious (incl. noble rot and Eiswein).",
      "Cool: green apple, citrus; warmer or riper: peach, apricot, lime (Clare and Eden Valley).",
      "The acidity lets the best wines age for decades, developing honey, toast and petrol notes."],
     ["Sehr hohe Säure, fast nie im Holz ausgebaut; in jeder Süßestufe erzeugt, von knochentrocken bis edelsüß (inkl. Edelfäule und Eiswein).",
      "Kühl: grüner Apfel, Zitrus; wärmer oder reifer: Pfirsich, Aprikose, Limette (Clare und Eden Valley).",
      "Dank der Säure reifen die besten Weine jahrzehntelang und entwickeln Honig-, Toast- und Petrolnoten."],
     [("France", ["Alsace"]),
      ("Germany", ["Mosel", "Rheingau", "Pfalz"]),
      ("Australia", ["Clare Valley", "Eden Valley"])],
     terms=["Qualitätswein", "Prädikatswein", "Kabinett", "Spätlese", "Auslese", "Beerenauslese (BA)", "Trockenbeerenauslese (TBA)", "Eiswein", "Trocken", "Halbtrocken", "Alsace Grand Cru"])

item("pinot-grigio", "Pinot Grigio / Pinot Gris", "white", "principal",
     S((1, 3), (1, 2), (2, 3), None, (2, 4), (1, 5)),
     ["lemon", "green apple", "pear", "peach", "mango"], [], ["honey", "dried fruit"],
     ["The same grape in two styles: Italian Pinot Grigio is light, neutral and crisp; Alsace Pinot Gris is full-bodied, rich, sometimes off-dry.",
      "Delle Venezie and IGT Veneto make large volumes of simple Pinot Grigio; Friuli gives more concentrated examples.",
      "Usually unoaked; Alsace examples can develop honey and dried-fruit notes with age."],
     ["Dieselbe Rebsorte in zwei Stilen: italienischer Pinot Grigio ist leicht, neutral und frisch; Pinot Gris aus dem Elsass vollmundig, üppig, manchmal halbtrocken.",
      "Delle Venezie und IGT Veneto erzeugen große Mengen einfachen Pinot Grigio; das Friaul liefert konzentriertere Weine.",
      "Meist ohne Holz; Weine aus dem Elsass können mit der Zeit Honig- und Trockenfrüchtenoten entwickeln."],
     [("Italy", ["Veneto (IGT)", "Delle Venezie", "Friuli-Venezia Giulia"]),
      ("France", ["Alsace"])],
     synonyms=["Pinot Gris", "Grauburgunder"])

# ===================== LO4: regionally important black grapes =====================
item("gamay", "Gamay", "black", "regional",
     S((1, 2), (1, 1), (4, 5), (1, 2), (3, 3), (1, 3)),
     ["raspberry", "red cherry", "banana", "bubblegum"], [], ["earth", "mushroom"],
     ["Light, fruity, high-acid and low-tannin red; best served lightly chilled.",
      "Carbonic maceration (whole bunches) adds banana and bubblegum aromas and keeps tannin low.",
      "Quality ladder: Beaujolais → Beaujolais Villages → Beaujolais Cru (e.g. Fleurie). The Crus are more concentrated and some can age."],
     ["Leichter, fruchtiger Rotwein mit hoher Säure und wenig Tannin; am besten leicht gekühlt.",
      "Die Kohlensäuremaischung (ganze Trauben) bringt Bananen- und Kaugummiaromen und hält das Tannin niedrig.",
      "Qualitätsleiter: Beaujolais → Beaujolais Villages → Beaujolais Cru (z. B. Fleurie). Die Crus sind konzentrierter, manche reifen gut."],
     [("France", ["Beaujolais", "Beaujolais Villages", "Beaujolais Cru (Fleurie)"])])

item("grenache", "Grenache", "black", "regional",
     S((2, 3), (1, 1), (2, 3), (2, 3), (4, 5), (4, 5)),
     ["strawberry", "raspberry", "red cherry", "white pepper", "liquorice", "dried herbs"], ["vanilla"], ["dried fruit", "leather", "toffee"],
     ["Thrives in hot, dry climates; ripens to high alcohol with soft-to-medium tannin and fairly pale colour.",
      "Often blended with Syrah (and others) for colour and structure, e.g. Côtes du Rhône, Châteauneuf-du-Pape, Barossa and McLaren Vale.",
      "Also the backbone of many rosés (Côtes de Provence, Navarra). Called Garnacha in Spain."],
     ["Gedeiht in heißem, trockenem Klima; reift zu viel Alkohol bei weichen bis mittleren Tanninen und eher heller Farbe.",
      "Oft mit Syrah (und anderen) für Farbe und Struktur verschnitten, z. B. Côtes du Rhône, Châteauneuf-du-Pape, Barossa und McLaren Vale.",
      "Außerdem Rückgrat vieler Rosés (Côtes de Provence, Navarra). Heißt in Spanien Garnacha."],
     [("France", ["Côtes du Rhône", "Côtes du Rhône Villages", "Châteauneuf-du-Pape", "Minervois", "Côtes de Provence"]),
      ("Spain", ["Rioja", "Navarra", "Priorat"]),
      ("Australia", ["Barossa Valley", "McLaren Vale"])],
     synonyms=["Garnacha"])

item("tempranillo", "Tempranillo", "black", "regional",
     S((3, 4), (1, 1), (3, 3), (3, 3), (3, 3), (3, 4)),
     ["red cherry", "strawberry", "plum", "blackberry"], ["vanilla", "coconut", "cedar"], ["leather", "dried fruit", "mushroom", "tobacco"],
     ["Spain's leading black grape: medium acidity and tannin, red fruit when young.",
      "Traditionally aged in American oak (vanilla, coconut); long-aged Reserva and Gran Reserva show leather, dried fruit and mushroom.",
      "Ribera del Duero's high, sunny plateau gives deeper, fuller wines than most Rioja."],
     ["Spaniens wichtigste rote Rebsorte: mittlere Säure und mittleres Tannin, jung mit roter Frucht.",
      "Traditionell in amerikanischer Eiche gereift (Vanille, Kokos); lang gereifte Reserva und Gran Reserva zeigen Leder, Trockenfrüchte und Pilz.",
      "Die hohe, sonnige Hochebene von Ribera del Duero ergibt dunklere, vollere Weine als die meisten Riojas."],
     [("Spain", ["Rioja", "Ribera del Duero", "Catalunya"])],
     terms=["Joven / Genérico", "Crianza", "Reserva", "Gran Reserva", "DOCa", "DO"])

item("nebbiolo", "Nebbiolo", "black", "regional",
     S((1, 2), (1, 1), (5, 5), (5, 5), (4, 5), (4, 5)),
     ["red cherry", "red plum", "rose", "dried herbs"], ["vanilla"], ["tar", "leather", "truffle", "dried cherry", "earth"],
     ["Pale in colour (turns garnet early) yet very high in tannin and acidity, a classic exam trap.",
      "Ripens very late, so it gets the warmest south-facing slopes in Piedmont.",
      "Barolo and Barbaresco need years to soften and develop the famous 'tar and roses'."],
     ["Helle Farbe (wird früh granatrot), aber sehr viel Tannin und Säure, eine klassische Prüfungsfalle.",
      "Reift sehr spät und bekommt daher im Piemont die wärmsten Südhänge.",
      "Barolo und Barbaresco brauchen Jahre, um weicher zu werden und die berühmten Noten von 'Teer und Rosen' zu entwickeln."],
     [("Italy", ["Barolo", "Barbaresco"])],
     terms=["DOCG"])

item("barbera", "Barbera", "black", "regional",
     S((4, 5), (1, 1), (5, 5), (1, 3), (3, 4), (3, 4)),
     ["red cherry", "plum", "blackberry"], ["vanilla", "toast"], [],
     ["Deep colour, high acidity, low-to-medium tannin: a very food-friendly red.",
      "Simple styles are unoaked and fruity; top examples are aged in new oak (vanilla, toast).",
      "Grown widely in Piedmont, the everyday partner to Nebbiolo."],
     ["Tiefe Farbe, hohe Säure, wenig bis mittleres Tannin: ein sehr speisenfreundlicher Rotwein.",
      "Einfache Weine sind fruchtig und ohne Holz; Spitzenweine reifen in neuer Eiche (Vanille, Röstnoten).",
      "Im Piemont weit verbreitet, der Alltagspartner des Nebbiolo."],
     [("Italy", ["Barbera d'Asti"])])

item("sangiovese", "Sangiovese", "black", "regional",
     S((3, 3), (1, 1), (5, 5), (4, 5), (3, 4), (3, 4)),
     ["red cherry", "red plum", "dried herbs"], ["vanilla", "toast"], ["leather", "earth", "meat", "dried fruit"],
     ["Tuscany's key grape: high acidity, medium-to-high tannin, red cherry and dried herbs.",
      "Chianti Classico comes from the historic heartland; Riserva means longer ageing.",
      "Brunello di Montalcino (100% Sangiovese) is riper, fuller and long-lived."],
     ["Die wichtigste Rebsorte der Toskana: hohe Säure, mittleres bis hohes Tannin, rote Kirsche und getrocknete Kräuter.",
      "Chianti Classico stammt aus dem historischen Kerngebiet; Riserva bedeutet längere Reifung.",
      "Brunello di Montalcino (100 % Sangiovese) ist reifer, voller und langlebig."],
     [("Italy", ["Chianti", "Chianti Classico", "Brunello di Montalcino"])],
     terms=["Riserva", "Classico", "DOCG"])

item("corvina", "Corvina", "black", "regional",
     S((2, 4), (1, 5), (4, 5), (1, 3), (3, 5), (1, 5)),
     ["red cherry", "dried cherry", "raisin", "plum", "chocolate"], ["vanilla"], ["dried fruit", "leather"],
     ["Naturally light: basic Valpolicella is fresh, light-bodied, high-acid and red-fruited.",
      "Drying the grapes concentrates them: Amarone della Valpolicella is dry, full-bodied and high in alcohol; Recioto della Valpolicella is sweet.",
      "Classico marks the historic heartland."],
     ["Von Natur aus leicht: einfacher Valpolicella ist frisch, leicht, säurebetont und rotfruchtig.",
      "Das Trocknen der Trauben konzentriert sie: Amarone della Valpolicella ist trocken, vollmundig und alkoholreich; Recioto della Valpolicella ist süß.",
      "Classico kennzeichnet das historische Kerngebiet."],
     [("Italy", ["Valpolicella", "Amarone della Valpolicella", "Recioto della Valpolicella"])],
     terms=["Classico"])

item("montepulciano", "Montepulciano", "black", "regional",
     S((4, 5), (1, 1), (3, 3), (4, 5), (3, 4), (3, 4)),
     ["black cherry", "plum", "blackberry"], ["vanilla", "smoke"], ["leather", "earth"],
     ["Deep colour with high levels of soft, ripe tannins and ripe black fruit.",
      "Mostly good-value reds from Abruzzo on the Adriatic coast.",
      "Don't confuse it with Vino Nobile di Montepulciano, a Tuscan town wine made from Sangiovese."],
     ["Tiefe Farbe mit viel weichem, reifem Tannin und reifer schwarzer Frucht.",
      "Meist preiswerte Rotweine aus den Abruzzen an der Adriaküste.",
      "Nicht verwechseln mit Vino Nobile di Montepulciano, einem Wein aus der toskanischen Stadt, gemacht aus Sangiovese."],
     [("Italy", ["Montepulciano d'Abruzzo"])])

item("zinfandel", "Zinfandel / Primitivo", "black", "regional",
     S((3, 4), (1, 3), (3, 3), (2, 4), (4, 5), (4, 5)),
     ["blackberry", "blueberry", "black cherry", "raisin", "strawberry"], ["vanilla", "coconut"], ["dried fruit", "leather"],
     ["Ripens unevenly, so bunches mix fresh, ripe and raisined berries: full body, high alcohol, jammy black fruit.",
      "Also made as White Zinfandel: a pale pink, medium-sweet, low-alcohol rosé.",
      "Called Primitivo in Puglia (southern Italy)."],
     ["Reift ungleichmäßig, sodass frische, reife und rosinierte Beeren gemischt sind: voller Körper, viel Alkohol, marmeladige schwarze Frucht.",
      "Auch als White Zinfandel: ein blassrosa, lieblicher, alkoholarmer Rosé.",
      "Heißt in Apulien (Süditalien) Primitivo."],
     [("USA", ["California"]),
      ("Italy", ["Puglia"])],
     synonyms=["Primitivo"], terms=["White Zinfandel"])

item("pinotage", "Pinotage", "black", "regional",
     S((4, 5), (1, 1), (3, 4), (3, 5), (3, 4), (3, 5)),
     ["blackberry", "plum", "red cherry"], ["vanilla", "coffee", "smoke"], ["earth", "leather"],
     ["South Africa's own crossing of Pinot Noir and Cinsault, but much deeper and more tannic than Pinot Noir.",
      "Styles range from fruity and easy-drinking to oaked and age-worthy, often with smoky, earthy notes.",
      "A 'Cape Blend' is a red blend that includes Pinotage."],
     ["Südafrikas eigene Kreuzung aus Pinot Noir und Cinsault, aber deutlich dunkler und tanninreicher als Pinot Noir.",
      "Die Stile reichen von fruchtig und unkompliziert bis holzgereift und lagerfähig, oft mit rauchigen, erdigen Noten.",
      "Ein 'Cape Blend' ist eine rote Cuvée mit Pinotage."],
     [("South Africa", ["Western Cape"])],
     terms=["Cape Blend"])

item("carmenere", "Carmenère", "black", "regional",
     S((4, 5), (1, 1), (3, 3), (2, 3), (3, 4), (3, 4)),
     ["blackberry", "black plum", "green bell pepper"], ["vanilla"], ["leather"],
     ["Chile's signature grape: deep colour, soft tannins, black fruit.",
      "Ripens late; if picked underripe, the green bell pepper note dominates.",
      "Came from Bordeaux and was long mistaken for Merlot in Chile."],
     ["Chiles Leitrebsorte: tiefe Farbe, weiche Tannine, schwarze Frucht.",
      "Reift spät; unreif gelesen dominiert die Note von grüner Paprika.",
      "Kam aus Bordeaux und wurde in Chile lange für Merlot gehalten."],
     [("Chile", ["Central Valley"])])

item("malbec", "Malbec", "black", "regional",
     S((5, 5), (1, 1), (3, 4), (3, 4), (4, 5), (4, 5)),
     ["blackberry", "plum", "black cherry", "violet"], ["vanilla", "chocolate", "toast"], ["leather", "earth"],
     ["Deep purple, full-bodied, with ripe black fruit and soft, ripe tannins.",
      "High-altitude vineyards in Mendoza give cool nights that keep fresh acidity despite the strong sun.",
      "Often aged in oak, adding vanilla, toast and chocolate notes."],
     ["Tiefviolett, vollmundig, mit reifer schwarzer Frucht und weichen, reifen Tanninen.",
      "Hohe Lagen in Mendoza bringen kühle Nächte, die trotz starker Sonne frische Säure erhalten.",
      "Oft im Holz gereift, mit Vanille-, Röst- und Schokoladennoten."],
     [("Argentina", ["Mendoza"])])

# ===================== LO4: regionally important white grapes =====================
item("chenin-blanc", "Chenin Blanc", "white", "regional",
     S((1, 4), (1, 5), (5, 5), None, (2, 4), (2, 4)),
     ["green apple", "lemon", "quince", "pear", "peach"], ["vanilla", "toast"], ["honey", "toast", "nuts"],
     ["High acidity in any climate, so it is made in every style: dry, off-dry, sweet (incl. noble rot) and sparkling.",
      "Vouvray (Loire) labels can show the style; South Africa makes fresh unoaked and rich oaked versions.",
      "The best wines age for decades, gaining honey and toast."],
     ["Hohe Säure in jedem Klima, daher in jedem Stil erzeugt: trocken, halbtrocken, süß (inkl. Edelfäule) und schäumend.",
      "Vouvray (Loire) gibt den Stil oft auf dem Etikett an; Südafrika erzeugt frische, holzfreie und üppige, holzgereifte Weine.",
      "Die besten Weine reifen jahrzehntelang und gewinnen Honig- und Röstnoten."],
     [("France", ["Vouvray"]),
      ("South Africa", ["Western Cape"])])

item("semillon", "Semillon", "white", "regional",
     S((1, 5), (1, 5), (3, 5), None, (1, 4), (1, 5)),
     ["lemon", "grass", "green apple", "apricot", "marmalade"], ["vanilla", "toast"], ["honey", "toast", "nuts"],
     ["Thin skins make it prone to noble rot: Sauternes (with Sauvignon Blanc) is luscious, with honey, apricot and marmalade.",
      "Hunter Valley Semillon is picked early: light, low in alcohol, unoaked, then develops toast and honey over years in bottle.",
      "In the Barossa Valley it is often riper and sometimes oaked."],
     ["Dünne Schalen machen sie anfällig für Edelfäule: Sauternes (mit Sauvignon Blanc) ist edelsüß, mit Honig, Aprikose und Orangenmarmelade.",
      "Hunter Valley Semillon wird früh gelesen: leicht, alkoholarm, ohne Holz, und entwickelt über Jahre auf der Flasche Toast und Honig.",
      "Im Barossa Valley ist er oft reifer und teils holzgereift."],
     [("France", ["Sauternes"]),
      ("Australia", ["Hunter Valley", "Barossa Valley"])],
     terms=["Botrytis / Noble Rot"])

item("viognier", "Viognier", "white", "regional",
     S((3, 4), (1, 1), (2, 3), None, (4, 5), (4, 5)),
     ["apricot", "peach", "blossom"], ["vanilla"], [],
     ["Full-bodied and perfumed, with low-to-medium acidity and high alcohol.",
      "Its most famous wine is Condrieu in the Northern Rhône.",
      "A little Viognier may be co-fermented with Syrah in Côte Rôtie for perfume."],
     ["Vollmundig und duftig, mit niedriger bis mittlerer Säure und viel Alkohol.",
      "Ihr berühmtester Wein ist Condrieu an der nördlichen Rhône.",
      "Etwas Viognier darf in der Côte Rôtie mit Syrah vergoren werden, für mehr Duft."],
     [("France", ["Condrieu"])])

item("gewurztraminer", "Gewurztraminer", "white", "regional",
     S((3, 4), (1, 4), (1, 2), None, (4, 5), (4, 5)),
     ["lychee", "rose", "ginger"], [], ["honey"],
     ["One of the most aromatic grapes: pronounced lychee and rose, deep colour, full body, low acidity, high alcohol.",
      "In Alsace often made with a touch of sweetness; late-harvest (Vendanges Tardives) styles are sweet.",
      "A high-risk wine with food because of its intense perfume."],
     ["Eine der aromatischsten Rebsorten: ausgeprägt Litschi und Rose, tiefe Farbe, voller Körper, wenig Säure, viel Alkohol.",
      "Im Elsass oft mit etwas Restsüße; Spätlesen (Vendanges Tardives) sind süß.",
      "Wegen ihres intensiven Dufts ein riskanter Speisenbegleiter."],
     [("France", ["Alsace", "Alsace Grand Cru"])],
     terms=["Vendanges Tardives", "Alsace Grand Cru"])

item("verdicchio", "Verdicchio", "white", "regional",
     S((1, 2), (1, 1), (4, 5), None, (3, 3), (2, 3)),
     ["lemon", "green apple", "pear", "almond"], [], ["honey", "nuts"],
     ["Dry, high-acid white from the Marche on Italy's Adriatic coast.",
      "Citrus and green fruit, often with a slightly bitter almond note on the finish.",
      "The best examples can develop honey and nutty notes with age."],
     ["Trockener, säurebetonter Weißwein aus den Marken an Italiens Adriaküste.",
      "Zitrus und grüne Frucht, oft mit einer leicht bitteren Mandelnote im Abgang.",
      "Die besten Weine können mit der Zeit Honig- und Nussnoten entwickeln."],
     [("Italy", ["Verdicchio dei Castelli di Jesi"])])

item("cortese", "Cortese", "white", "regional",
     S((1, 2), (1, 1), (4, 5), None, (2, 3), (1, 3)),
     ["green apple", "lemon", "pear"], [], [],
     ["Light-bodied, crisp, high-acid dry white from Piedmont.",
      "Its best-known wine is Gavi, usually unoaked and drunk young.",
      "One of the few notable white grapes of red-wine-dominated Piedmont."],
     ["Leichter, frischer, säurebetonter trockener Weißwein aus dem Piemont.",
      "Ihr bekanntester Wein ist Gavi, meist ohne Holz und jung getrunken.",
      "Eine der wenigen bedeutenden weißen Rebsorten im rotweingeprägten Piemont."],
     [("Italy", ["Gavi"])])

item("garganega", "Garganega", "white", "regional",
     S((1, 3), (1, 5), (3, 4), None, (2, 3), (2, 3)),
     ["pear", "apple", "peach", "almond"], [], ["honey", "dried fruit"],
     ["The grape of Soave in the Veneto: dry, medium-bodied, with pear, apple and sometimes almond.",
      "The best wines come from the hilly Soave Classico zone.",
      "Recioto di Soave is a sweet wine made from dried Garganega grapes."],
     ["Die Rebsorte des Soave in Venetien: trocken, mittlerer Körper, mit Birne, Apfel und manchmal Mandel.",
      "Die besten Weine kommen aus der hügeligen Zone Soave Classico.",
      "Recioto di Soave ist ein Süßwein aus getrockneten Garganega-Trauben."],
     [("Italy", ["Soave", "Recioto di Soave"])],
     terms=["Classico"])

item("fiano", "Fiano", "white", "regional",
     S((2, 3), (1, 1), (3, 3), None, (3, 4), (3, 4)),
     ["peach", "melon", "pineapple"], [], ["honey", "nuts"],
     ["One of southern Italy's finest white grapes, from Campania.",
      "Dry, medium-to-full body, medium acidity, ripe stone fruit and melon; usually unoaked.",
      "Can age for a few years, developing honey and nutty notes."],
     ["Eine der besten weißen Rebsorten Süditaliens, aus Kampanien.",
      "Trocken, mittlerer bis voller Körper, mittlere Säure, reifes Steinobst und Melone; meist ohne Holz.",
      "Kann einige Jahre reifen und entwickelt dabei Honig- und Nussnoten."],
     [("Italy", ["Fiano di Avellino"])])

item("albarino", "Albariño", "white", "regional",
     S((1, 2), (1, 1), (4, 5), None, (3, 3), (2, 3)),
     ["lemon", "grapefruit", "peach"], [], [],
     ["Fresh, aromatic, high-acid white from Spain's cool, wet, Atlantic north-west.",
      "Citrus and stone fruit; usually unoaked and drunk young.",
      "Rías Baixas in Galicia is its home."],
     ["Frischer, aromatischer, säurebetonter Weißwein aus dem kühlen, feuchten, atlantischen Nordwesten Spaniens.",
      "Zitrus und Steinobst; meist ohne Holz und jung getrunken.",
      "Rías Baixas in Galicien ist seine Heimat."],
     [("Spain", ["Rías Baixas"])])

item("furmint", "Furmint", "white", "regional",
     S((1, 5), (1, 5), (5, 5), None, (2, 4), (3, 4)),
     ["green apple", "lemon", "pear", "apricot", "marmalade"], ["vanilla"], ["honey", "nuts", "dried fruit"],
     ["Very high acidity, which balances the sweetness of Tokaji Aszú, Hungary's famous noble-rot wine.",
      "Aszú berries (noble-rotted) are soaked in a base wine or fermenting must.",
      "Increasingly also made as a dry, crisp white."],
     ["Sehr hohe Säure, die die Süße des Tokaji Aszú ausbalanciert, Ungarns berühmtem edelfaulem Wein.",
      "Aszú-Beeren (edelfaul) werden in einem Grundwein oder gärenden Most eingeweicht.",
      "Zunehmend auch als trockener, frischer Weißwein."],
     [("Hungary", ["Tokaj"])],
     terms=["Aszú", "Botrytis / Noble Rot"])

# ===================== LO5: sparkling grapes =====================
item("meunier", "Meunier", "black", "sparkling",
     S((1, 2), (1, 3), (4, 5), None, (3, 3), (2, 3)),
     ["red apple", "strawberry", "red cherry"], ["bread", "biscuit"], ["toast", "nuts"],
     ["One of the three main Champagne grapes, alongside Chardonnay and Pinot Noir.",
      "A black grape, pressed gently so the juice stays pale; adds fruity, soft character to the blend.",
      "Its wines mature relatively quickly, which suits non-vintage blends."],
     ["Eine der drei Hauptrebsorten der Champagne, neben Chardonnay und Pinot Noir.",
      "Eine rote Rebsorte, die sanft gepresst wird, damit der Saft hell bleibt; bringt fruchtige, weiche Noten in die Cuvée.",
      "Ihre Weine reifen relativ schnell, was gut zu jahrgangslosen Cuvées passt."],
     [("France", ["Champagne"])],
     synonyms=["Pinot Meunier"], grapes=[])

item("moscato", "Moscato (Muscat)", "white", "sparkling",
     S((1, 2), (4, 4), (3, 3), None, (1, 1), (1, 2)),
     ["grape", "orange blossom", "peach", "rose"], [], [],
     ["One of the few grapes whose wine smells of fresh grapes; very floral.",
      "Asti: a single, interrupted tank fermentation keeps it sweet, low in alcohol (about 7% abv) and very fruity.",
      "Drink young and well chilled; a classic match for fruit desserts."],
     ["Eine der wenigen Rebsorten, deren Wein nach frischen Trauben riecht; sehr blumig.",
      "Asti: eine einzige, unterbrochene Tankgärung hält ihn süß, alkoholarm (etwa 7 % vol) und sehr fruchtig.",
      "Jung und gut gekühlt trinken; ein klassischer Partner zu Fruchtdesserts."],
     [("Italy", ["Asti"])],
     synonyms=["Muscat", "Moscatel"])

item("glera", "Glera", "white", "sparkling",
     S((1, 1), (1, 2), (3, 4), None, (2, 3), (1, 2)),
     ["pear", "green apple", "melon", "blossom"], [], [],
     ["The grape of Prosecco in north-east Italy.",
      "Made by the tank method to keep its fresh, fruity and floral primary aromas, with no bready notes.",
      "Light-bodied and best drunk young."],
     ["Die Rebsorte des Prosecco in Nordostitalien.",
      "Im Tankgärverfahren hergestellt, damit die frischen, fruchtigen und blumigen Primäraromen erhalten bleiben, ohne Brotnoten.",
      "Leicht und am besten jung zu trinken."],
     [("Italy", ["Prosecco"])])

# ===================== LO5: sparkling and fortified wines =====================
item("champagne", "Champagne", "sparkling", "wine",
     S((1, 2), (1, 3), (5, 5), None, (3, 3), (2, 3)),
     ["lemon", "green apple"], ["bread", "biscuit", "brioche"], ["toast", "nuts", "honey"],
     ["Traditional method: second fermentation in the bottle, ageing on the lees (autolysis gives bread and biscuit), riddling, disgorgement, dosage.",
      "Cool northern climate gives the high-acid, neutral base wine the method needs.",
      "Non-vintage blends several years for a consistent house style; vintage comes from one good year and is aged longer."],
     ["Traditionelle Methode: zweite Gärung in der Flasche, Hefelagerung (Autolyse bringt Brot und Keks), Rütteln, Degorgieren, Dosage.",
      "Das kühle, nördliche Klima liefert den säurereichen, neutralen Grundwein, den die Methode braucht.",
      "Jahrgangslose Champagner verschneiden mehrere Jahre zu einem gleichbleibenden Hausstil; Jahrgangschampagner stammen aus einem guten Jahr und reifen länger."],
     [("France", ["Champagne"])],
     terms=["Brut", "Demi-Sec", "Vintage", "Non-Vintage", "Traditional Method"], grapes=["chardonnay", "pinot-noir", "meunier"])

item("cava", "Cava", "sparkling", "wine",
     S((1, 2), (1, 3), (4, 5), None, (3, 3), (2, 3)),
     ["lemon", "apple"], ["bread", "biscuit"], ["toast", "nuts"],
     ["Spain's traditional-method sparkling wine, mostly from Catalonia.",
      "Usually shorter lees ageing than Champagne, so more fruit and fewer toasty notes; longer-aged Cavas are more complex.",
      "Often good value."],
     ["Spaniens Schaumwein nach traditioneller Methode, überwiegend aus Katalonien.",
      "Meist kürzere Hefelagerung als Champagner, daher mehr Frucht und weniger Röstnoten; länger gereifte Cavas sind komplexer.",
      "Oft mit gutem Preis-Leistungs-Verhältnis."],
     [("Spain", ["Cava"])],
     terms=["Brut", "Demi-Sec", "Vintage", "Non-Vintage", "Traditional Method"], grapes=["chardonnay", "pinot-noir"])

item("prosecco", "Prosecco", "sparkling", "wine",
     S((1, 1), (1, 2), (3, 4), None, (2, 3), (1, 2)),
     ["pear", "green apple", "melon", "blossom"], [], [],
     ["Tank method: second fermentation in a sealed tank, then filtered and bottled.",
      "Keeps Glera's fresh pear, apple and blossom aromas; no bready autolytic notes.",
      "Made to be drunk young."],
     ["Tankgärverfahren: zweite Gärung in einem geschlossenen Tank, dann filtriert und abgefüllt.",
      "Bewahrt die frischen Birnen-, Apfel- und Blütenaromen des Glera; keine Brot- oder Autolysenoten.",
      "Zum jungen Genuss gemacht."],
     [("Italy", ["Prosecco"])],
     terms=["Brut"], grapes=["glera"])

item("asti", "Asti", "sparkling", "wine",
     S((1, 2), (4, 4), (3, 3), None, (1, 1), (1, 2)),
     ["grape", "orange blossom", "peach"], [], [],
     ["Sweet tank-method sparkling wine from Moscato in Piedmont.",
      "A single fermentation in a pressurised tank is stopped by chilling and filtering, leaving sugar and only about 7% abv.",
      "Intensely grapey and floral; drink young and well chilled."],
     ["Süßer Schaumwein im Tankgärverfahren aus Moscato im Piemont.",
      "Eine einzige Gärung im Drucktank wird durch Kühlen und Filtrieren gestoppt; zurück bleiben Zucker und nur etwa 7 % vol.",
      "Intensiv traubig und blumig; jung und gut gekühlt trinken."],
     [("Italy", ["Asti"])],
     grapes=["moscato"])

item("new-world-sparkling", "New World sparkling", "sparkling", "wine",
     S((1, 2), (1, 2), (4, 5), None, (3, 3), (2, 3)),
     ["lemon", "green apple", "red apple"], ["bread", "biscuit"], ["toast"],
     ["Quality sparkling wines outside Europe are mostly made by the traditional method from Chardonnay and Pinot Noir.",
      "Cool sites keep the high acidity the base wine needs, e.g. fog-cooled Los Carneros or Marlborough.",
      "In South Africa, traditional-method sparkling wine is labelled Cap Classique."],
     ["Hochwertige Schaumweine außerhalb Europas werden meist nach traditioneller Methode aus Chardonnay und Pinot Noir erzeugt.",
      "Kühle Lagen erhalten die hohe Säure, die der Grundwein braucht, z. B. das nebelgekühlte Los Carneros oder Marlborough.",
      "In Südafrika heißt Schaumwein nach traditioneller Methode Cap Classique."],
     [("South Africa", ["Western Cape"]),
      ("USA", ["Los Carneros"]),
      ("Australia", ["Adelaide Hills"]),
      ("New Zealand", ["Marlborough"])],
     terms=["Cap Classique", "Traditional Method"], grapes=["chardonnay", "pinot-noir"])

item("sherry", "Sherry", "fortified", "wine",
     S((1, 5), (1, 5), (3, 3), None, (5, 5), (2, 5)),
     ["raisin", "fig", "date"], ["yeast", "bread", "almond"], ["walnut", "hazelnut", "toffee", "caramel"],
     ["Fortified AFTER fermentation, so it starts dry. Made around Jerez in southern Spain.",
      "Ageing under flor (Fino): pale, dry, bready, served chilled. Ageing with oxygen (Oloroso): brown, nutty. Amontillado has both.",
      "Sweet styles: Pale Cream (sweetened Fino style), Medium, Cream (sweetened Oloroso style) and the naturally very sweet PX."],
     ["NACH der Gärung aufgespritet, daher zunächst trocken. Erzeugt rund um Jerez in Südspanien.",
      "Reifung unter Flor (Fino): hell, trocken, brotig, gekühlt serviert. Reifung mit Sauerstoff (Oloroso): braun, nussig. Amontillado hat beides.",
      "Süße Stile: Pale Cream (gesüßter Fino-Stil), Medium, Cream (gesüßter Oloroso-Stil) und der von Natur aus sehr süße PX."],
     [("Spain", ["Sherry (Jerez)"])],
     terms=["Fino", "Amontillado", "Oloroso", "Pale Cream", "Medium", "Cream", "PX (Pedro Ximénez)"])

item("port", "Port", "fortified", "wine",
     S((3, 5), (4, 5), (3, 3), (3, 5), (5, 5), (4, 5)),
     ["blackberry", "black cherry", "plum"], [], ["walnut", "caramel", "dried fruit", "leather"],
     ["Fortified DURING fermentation: the spirit kills the yeast, leaving a sweet, high-alcohol red. From the Douro Valley in Portugal.",
      "Ruby family (Ruby, Reserve Ruby, LBV, Vintage): limited oxidation, deep colour, fresh black fruit. Vintage Port ages in bottle and needs decanting.",
      "Tawny: long ageing in small casks with some oxygen, giving a brownish colour and nutty, caramel notes."],
     ["WÄHREND der Gärung aufgespritet: der Alkohol tötet die Hefe ab, zurück bleibt ein süßer, alkoholreicher Rotwein. Aus dem Douro-Tal in Portugal.",
      "Ruby-Familie (Ruby, Reserve Ruby, LBV, Vintage): wenig Oxidation, tiefe Farbe, frische schwarze Frucht. Vintage Port reift in der Flasche und muss dekantiert werden.",
      "Tawny: lange Reifung in kleinen Fässern mit etwas Sauerstoff, daher bräunliche Farbe und nussige Karamellnoten."],
     [("Portugal", ["Port (Douro)"])],
     terms=["Ruby", "Reserve Ruby", "Late Bottled Vintage (LBV)", "Vintage", "Tawny"])

# --------------------------------------------------------------------------
used = {a for it in ITEMS for layer in it["aromas"].values() for a in layer}
missing = used - AROMAS.keys()
assert not missing, f"aromas without translation: {missing}"
ids = [it["id"] for it in ITEMS]
assert len(ids) == len(set(ids))
for it in ITEMS:
    for g in it["grapes"]:
        assert g in ids, (it["id"], g)

out = Path(__file__).resolve().parent.parent / "library.json"
doc = {"aromas": {k: AROMAS[k] for k in sorted(used)}, "items": ITEMS}
text = "{\n" + f'"aromas": {json.dumps(doc["aromas"], ensure_ascii=False)},\n"items": [\n'
text += ",\n".join(json.dumps(it, ensure_ascii=False) for it in ITEMS) + "\n]\n}\n"
out.write_text(text, encoding="utf-8")
print(f"wrote {out} with {len(ITEMS)} entries")
