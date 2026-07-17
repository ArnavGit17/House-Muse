"""
modules/recommendation_engine.py
════════════════════════════════════════════════════════════════════════════════
Style-driven recommendation engine.
Each style (Vintage Indian, Bohemian, Art Deco etc.) has:
  - Its own colour palette (wall/accent/ceiling)
  - Its own wallpaper patterns
  - Its own decor items
  - Its own budget distribution
  - Its own image generation prompt keywords

Changing the style chip NOW produces completely different output.
════════════════════════════════════════════════════════════════════════════════
"""

import numpy as np
from dataclasses import dataclass
from sklearn.metrics.pairwise import cosine_similarity

try:
    import torch
    CLIP_AVAILABLE = True
except ImportError:
    CLIP_AVAILABLE = False


# ══════════════════════════════════════════════════════════════════════════════
#  STYLE DNA — every style has its own colour palette, feel, and budget weights
# ══════════════════════════════════════════════════════════════════════════════

STYLE_DNA = {
    "Vintage Indian": {
        "palette": {
            "wall":    "#C4803A",   # deep ochre / turmeric
            "accent":  "#6B2737",   # deep maroon / sindoor red
            "ceiling": "#F5E6C8",   # aged parchment
            "floor":   "#8B5E3C",   # dark teak wood
            "note":    "Earthy ochres, deep maroons, and aged parchment — evoking haveli warmth.",
        },
        "colour_mood":    "terracotta, ochre, deep maroon, indigo, saffron, aged brass",
        "wallpaper_tags": ["jaali", "mughal", "kalamkari", "block print", "indigo", "lotus", "ancient"],
        "decor_tags":     ["murti", "wooden swing", "brass diya", "jharokha", "handloom", "terracotta pot", "carved wood"],
        "budget_weights": {"wallpaper":0.20,"furniture":0.30,"curtains":0.10,"rugs":0.15,"lamps":0.08,"wall_art":0.10,"accent":0.07},
    },
    "Contemporary Indian": {
        "palette": {
            "wall":    "#E8D5A3",   # warm linen
            "accent":  "#B87333",   # copper
            "ceiling": "#FAF7F0",   # clean white
            "floor":   "#A0784A",   # medium wood
            "note":    "Modern Indian sensibility — clean lines, warm neutrals with brass and copper accents.",
        },
        "colour_mood":    "warm linen, copper, brass, terracotta, sage, clean white",
        "wallpaper_tags": ["geometric", "contemporary", "block print", "abstract", "brass", "minimal indian"],
        "decor_tags":     ["brass vase", "block print cushion", "sheesham table", "copper lamp", "cane chair", "dhurrie"],
        "budget_weights": {"wallpaper":0.15,"furniture":0.38,"curtains":0.08,"rugs":0.12,"lamps":0.10,"wall_art":0.08,"accent":0.09},
    },
    "Japandi": {
        "palette": {
            "wall":    "#E8E2D5",   # warm off-white
            "accent":  "#7A9E7E",   # sage green
            "ceiling": "#F5F2EC",   # pure off-white
            "floor":   "#C4A882",   # pale oak
            "note":    "Wabi-sabi meets Scandinavian calm — muted, minimal, purposeful.",
        },
        "colour_mood":    "warm off-white, sage green, pale oak, charcoal, linen",
        "wallpaper_tags": ["minimal", "linen texture", "plain", "subtle stripe", "natural", "wabi-sabi"],
        "decor_tags":     ["linen sofa", "rattan lamp", "ceramic vase", "jute rug", "wooden shelf", "bonsai"],
        "budget_weights": {"wallpaper":0.12,"furniture":0.42,"curtains":0.08,"rugs":0.12,"lamps":0.10,"wall_art":0.08,"accent":0.08},
    },
    "Bohemian": {
        "palette": {
            "wall":    "#D4956A",   # warm terracotta orange
            "accent":  "#6B4E8A",   # jewel purple
            "ceiling": "#F0E6D3",   # warm cream
            "floor":   "#8B5E3C",   # dark wood
            "note":    "Layered jewel tones, global textiles, maximalist warmth.",
        },
        "colour_mood":    "terracotta, jewel purple, teal, saffron, magenta, warm cream",
        "wallpaper_tags": ["floral", "botanical", "maximalist", "pattern", "eclectic", "global", "mandala"],
        "decor_tags":     ["macrame", "rattan chair", "kilim rug", "pendant lamp", "wall tapestry", "plants", "colourful cushions"],
        "budget_weights": {"wallpaper":0.18,"furniture":0.28,"curtains":0.10,"rugs":0.15,"lamps":0.08,"wall_art":0.12,"accent":0.09},
    },
    "Mid-Century": {
        "palette": {
            "wall":    "#D4A843",   # mustard yellow
            "accent":  "#8B4513",   # burnt sienna
            "ceiling": "#F5F0E0",   # cream
            "floor":   "#7A5230",   # walnut
            "note":    "Retro optimism — warm wood tones, mustard, burnt orange, clean lines.",
        },
        "colour_mood":    "mustard yellow, burnt orange, walnut brown, avocado green, cream",
        "wallpaper_tags": ["geometric", "retro", "atomic", "stripe", "mid century", "sunburst"],
        "decor_tags":     ["walnut coffee table", "tulip chair", "arc floor lamp", "geometric rug", "abstract art", "credenza"],
        "budget_weights": {"wallpaper":0.15,"furniture":0.42,"curtains":0.07,"rugs":0.12,"lamps":0.10,"wall_art":0.08,"accent":0.06},
    },
    "Art Deco": {
        "palette": {
            "wall":    "#1A2F3A",   # deep teal/navy
            "accent":  "#C9A84C",   # gold
            "ceiling": "#2A3F4A",   # slightly lighter navy
            "floor":   "#1C1C1C",   # black marble
            "note":    "Geometric opulence — gold, black, emerald. Glamour and symmetry.",
        },
        "colour_mood":    "gold, navy, black marble, emerald green, champagne",
        "wallpaper_tags": ["geometric", "art deco", "gold", "chevron", "sunburst", "diamond", "gatsby"],
        "decor_tags":     ["gold lamp", "velvet sofa", "geometric mirror", "marble table", "art deco vase", "brass sculpture"],
        "budget_weights": {"wallpaper":0.20,"furniture":0.35,"curtains":0.10,"rugs":0.10,"lamps":0.12,"wall_art":0.08,"accent":0.05},
    },
    "Coastal": {
        "palette": {
            "wall":    "#D4EAF0",   # sea glass blue
            "accent":  "#8FA88B",   # sea grass green
            "ceiling": "#FFFFFF",   # bright white
            "floor":   "#D4C5A0",   # driftwood
            "note":    "Bleached whites, sea blues, rattan — breezy and light.",
        },
        "colour_mood":    "sea glass blue, white, driftwood, coral, sea grass",
        "wallpaper_tags": ["stripe", "nautical", "seagrass", "linen", "coastal", "white", "shell"],
        "decor_tags":     ["rattan sofa", "white curtains", "jute rug", "coral accent", "driftwood shelf", "sea glass vase"],
        "budget_weights": {"wallpaper":0.12,"furniture":0.38,"curtains":0.12,"rugs":0.12,"lamps":0.10,"wall_art":0.08,"accent":0.08},
    },
    "Dark Academia": {
        "palette": {
            "wall":    "#4A3728",   # dark walnut brown
            "accent":  "#8B1A2F",   # deep burgundy
            "ceiling": "#3A2A1A",   # near-black brown
            "floor":   "#2C1810",   # dark mahogany
            "note":    "Ink, mahogany, candlelight — moody intellectualism meets library aesthetics.",
        },
        "colour_mood":    "dark walnut, deep burgundy, aged gold, forest green, near-black",
        "wallpaper_tags": ["damask", "dark", "moody", "botanical", "library", "tartan", "vintage print"],
        "decor_tags":     ["leather armchair", "mahogany shelf", "globe lamp", "Persian rug", "antique map", "candlestick"],
        "budget_weights": {"wallpaper":0.18,"furniture":0.38,"curtains":0.08,"rugs":0.15,"lamps":0.10,"wall_art":0.08,"accent":0.03},
    },
    "Cottagecore": {
        "palette": {
            "wall":    "#C8D8B0",   # sage green
            "accent":  "#E8B4A0",   # blush pink
            "ceiling": "#F5F0E8",   # warm cream
            "floor":   "#C4A882",   # honey oak
            "note":    "Floral prints, sage greens, buttery creams — pastoral romanticism.",
        },
        "colour_mood":    "sage green, blush pink, buttercup yellow, lavender, warm cream",
        "wallpaper_tags": ["floral", "ditsy print", "botanical", "gingham", "toile", "vintage floral", "rose"],
        "decor_tags":     ["floral cushions", "rattan armchair", "dried flower wreath", "china plates", "lace curtains", "herb pots"],
        "budget_weights": {"wallpaper":0.20,"furniture":0.30,"curtains":0.12,"rugs":0.10,"lamps":0.10,"wall_art":0.10,"accent":0.08},
    },
    "Industrial": {
        "palette": {
            "wall":    "#6B6560",   # concrete grey
            "accent":  "#B87333",   # copper
            "ceiling": "#4A4540",   # dark steel
            "floor":   "#2C2825",   # dark concrete
            "note":    "Raw concrete, exposed steel, charcoal — urban loft energy.",
        },
        "colour_mood":    "concrete grey, copper, steel, charcoal, matte black",
        "wallpaper_tags": ["brick", "concrete", "metal", "geometric", "dark", "exposed", "minimal"],
        "decor_tags":     ["steel shelf", "Edison bulb lamp", "leather sofa", "metal stool", "concrete planter", "geometric rug"],
        "budget_weights": {"wallpaper":0.12,"furniture":0.45,"curtains":0.05,"rugs":0.10,"lamps":0.15,"wall_art":0.08,"accent":0.05},
    },
}


# ══════════════════════════════════════════════════════════════════════════════
#  EXPANDED CATALOGUE — every item tagged to specific styles
# ══════════════════════════════════════════════════════════════════════════════

WALLPAPER_CATALOGUE = [
    # ── Vintage Indian ────────────────────────────────────────────────────────
    {"id":"W101","name":"Mughal Arch Repeat",        "style":["Vintage Indian"],               "scale":"large", "base_color":[139,71,55], "price_sqft":580,"pattern_type":"mughal",    "suitable_rooms":["living_room","dining_room","bedroom"]},
    {"id":"W102","name":"Indigo Jaali Lattice",      "style":["Vintage Indian","Art Deco"],    "scale":"small", "base_color":[60,70,140],  "price_sqft":560,"pattern_type":"geometric","suitable_rooms":["living_room","bedroom"]},
    {"id":"W103","name":"Kalamkari Floral Panel",    "style":["Vintage Indian","Contemporary Indian"],"scale":"large","base_color":[180,90,50],"price_sqft":680,"pattern_type":"handprint","suitable_rooms":["living_room","dining_room","bedroom"]},
    {"id":"W104","name":"Saffron Block Print",       "style":["Vintage Indian"],               "scale":"medium","base_color":[220,120,30],  "price_sqft":420,"pattern_type":"handprint","suitable_rooms":["bedroom","dining_room"]},
    {"id":"W105","name":"Terracotta Lotus Motif",    "style":["Vintage Indian","Contemporary Indian"],"scale":"medium","base_color":[196,100,78],"price_sqft":460,"pattern_type":"floral","suitable_rooms":["living_room","bedroom","bathroom"]},
    # ── Contemporary Indian ───────────────────────────────────────────────────
    {"id":"W201","name":"Modern Block Print Geo",    "style":["Contemporary Indian"],          "scale":"medium","base_color":[200,168,76],  "price_sqft":480,"pattern_type":"geometric","suitable_rooms":["living_room","study_room","bedroom"]},
    {"id":"W202","name":"Copper Trellis on Linen",   "style":["Contemporary Indian","Japandi"],"scale":"small", "base_color":[184,115,51],  "price_sqft":520,"pattern_type":"geometric","suitable_rooms":["living_room","dining_room"]},
    # ── Japandi ───────────────────────────────────────────────────────────────
    {"id":"W301","name":"Ivory Grasscloth Texture",  "style":["Japandi","Coastal"],            "scale":"plain", "base_color":[235,225,205],"price_sqft":640,"pattern_type":"texture",   "suitable_rooms":["living_room","bedroom","study_room"]},
    {"id":"W302","name":"Pale Oak Linen Plain",      "style":["Japandi"],                      "scale":"plain", "base_color":[210,195,170],"price_sqft":280,"pattern_type":"plain",     "suitable_rooms":["bedroom","bathroom","study_room"]},
    {"id":"W303","name":"Sage Micro-Weave",          "style":["Japandi","Cottagecore"],        "scale":"small", "base_color":[138,162,130],"price_sqft":320,"pattern_type":"texture",   "suitable_rooms":["bedroom","study_room"]},
    # ── Bohemian ──────────────────────────────────────────────────────────────
    {"id":"W401","name":"Jewel Mandala Mural",       "style":["Bohemian"],                     "scale":"large", "base_color":[107,78,138], "price_sqft":760,"pattern_type":"mural",     "suitable_rooms":["living_room","bedroom"]},
    {"id":"W402","name":"Tropical Maximalist Leaf",  "style":["Bohemian","Cottagecore"],       "scale":"large", "base_color":[60,110,80],  "price_sqft":680,"pattern_type":"botanical", "suitable_rooms":["living_room","bedroom","study_room"]},
    {"id":"W403","name":"Global Kilim Stripe",       "style":["Bohemian"],                     "scale":"medium","base_color":[190,70,50],  "price_sqft":420,"pattern_type":"geometric","suitable_rooms":["living_room","study_room"]},
    # ── Mid-Century ───────────────────────────────────────────────────────────
    {"id":"W501","name":"Mustard Atomic Burst",      "style":["Mid-Century"],                  "scale":"large", "base_color":[212,168,60],  "price_sqft":380,"pattern_type":"geometric","suitable_rooms":["living_room","study_room"]},
    {"id":"W502","name":"Retro Chevron",             "style":["Mid-Century","Industrial"],     "scale":"medium","base_color":[150,100,60],  "price_sqft":310,"pattern_type":"geometric","suitable_rooms":["study_room","living_room"]},
    # ── Art Deco ──────────────────────────────────────────────────────────────
    {"id":"W601","name":"Gold Sunburst Art Deco",    "style":["Art Deco"],                     "scale":"large", "base_color":[200,168,76],  "price_sqft":720,"pattern_type":"geometric","suitable_rooms":["living_room","dining_room"]},
    {"id":"W602","name":"Midnight Chevron Gold",     "style":["Art Deco"],                     "scale":"medium","base_color":[26,47,58],    "price_sqft":680,"pattern_type":"geometric","suitable_rooms":["dining_room","bedroom"]},
    {"id":"W603","name":"Emerald Diamond Lattice",   "style":["Art Deco"],                     "scale":"small", "base_color":[20,100,80],   "price_sqft":640,"pattern_type":"geometric","suitable_rooms":["living_room","study_room"]},
    # ── Coastal ───────────────────────────────────────────────────────────────
    {"id":"W701","name":"Sea Glass Linen Stripe",    "style":["Coastal"],                      "scale":"medium","base_color":[180,210,215],"price_sqft":280,"pattern_type":"stripe",    "suitable_rooms":["bedroom","bathroom","living_room"]},
    {"id":"W702","name":"White Shiplap Texture",     "style":["Coastal","Japandi"],            "scale":"plain", "base_color":[245,245,240],"price_sqft":240,"pattern_type":"texture",   "suitable_rooms":["bathroom","kitchen","bedroom"]},
    # ── Dark Academia ─────────────────────────────────────────────────────────
    {"id":"W801","name":"Deep Burgundy Damask",      "style":["Dark Academia","Vintage Indian"],"scale":"large","base_color":[107,39,55],  "price_sqft":580,"pattern_type":"damask",    "suitable_rooms":["study_room","living_room","dining_room"]},
    {"id":"W802","name":"Dark Botanical Fern",       "style":["Dark Academia"],                "scale":"large", "base_color":[30,60,40],   "price_sqft":520,"pattern_type":"botanical", "suitable_rooms":["study_room","bedroom"]},
    # ── Cottagecore ───────────────────────────────────────────────────────────
    {"id":"W901","name":"Vintage Rose Trellis",      "style":["Cottagecore"],                  "scale":"medium","base_color":[220,160,155],"price_sqft":320,"pattern_type":"floral",    "suitable_rooms":["bedroom","bathroom"]},
    {"id":"W902","name":"Sage Ditsy Floral",         "style":["Cottagecore","Japandi"],        "scale":"small", "base_color":[155,185,148],"price_sqft":280,"pattern_type":"floral",    "suitable_rooms":["bedroom","kitchen","bathroom"]},
    # ── Industrial ────────────────────────────────────────────────────────────
    {"id":"W1001","name":"Raw Brick Effect",         "style":["Industrial"],                   "scale":"large", "base_color":[150,100,80],  "price_sqft":360,"pattern_type":"texture",   "suitable_rooms":["living_room","study_room"]},
    {"id":"W1002","name":"Concrete Poured Effect",   "style":["Industrial"],                   "scale":"plain", "base_color":[110,105,100],"price_sqft":290,"pattern_type":"texture",   "suitable_rooms":["living_room","study_room","kitchen"]},
]

DECOR_CATALOGUE = [
    # ══ VINTAGE INDIAN ════════════════════════════════════════════════════════
    {"id":"VI001","name":"Carved Wooden Jhoola (Swing)","category":"furniture","style":["Vintage Indian"],"color":[139,90,43],"price":28000,"room":["living_room","bedroom"]},
    {"id":"VI002","name":"Brass Ganesha Murti",         "category":"accent",   "style":["Vintage Indian"],"color":[200,168,76],"price":3200, "room":["living_room","study_room","bedroom"]},
    {"id":"VI003","name":"Terracotta Diya Set",         "category":"accent",   "style":["Vintage Indian"],"color":[196,100,78],"price":680,  "room":["living_room","dining_room","bedroom"]},
    {"id":"VI004","name":"Handwoven Ikat Curtains",     "category":"curtains", "style":["Vintage Indian"],"color":[160,80,100],"price":4200, "room":["living_room","bedroom","dining_room"]},
    {"id":"VI005","name":"Dhurrie Block-Print Rug",     "category":"rugs",     "style":["Vintage Indian","Contemporary Indian"],"color":[180,130,90],"price":4800,"room":["living_room","bedroom","dining_room"]},
    {"id":"VI006","name":"Antique Brass Lantern",       "category":"lamps",    "style":["Vintage Indian"],"color":[200,168,76],"price":2600, "room":["living_room","bedroom","dining_room"]},
    {"id":"VI007","name":"Madhubani Wall Painting",     "category":"wall_art", "style":["Vintage Indian"],"color":[180,90,50], "price":2200, "room":["living_room","bedroom","study_room"]},
    {"id":"VI008","name":"Carved Sheesham Almirah",     "category":"furniture","style":["Vintage Indian"],"color":[100,60,30], "price":42000,"room":["bedroom","living_room"]},
    {"id":"VI009","name":"Handloom Silk Cushion Set",   "category":"textiles", "style":["Vintage Indian"],"color":[140,40,60], "price":2800, "room":["living_room","bedroom"]},
    {"id":"VI010","name":"Tanjore Painting Print",      "category":"wall_art", "style":["Vintage Indian"],"color":[200,168,76],"price":3600, "room":["living_room","dining_room"]},
    # ══ CONTEMPORARY INDIAN ════════════════════════════════════════════════════
    {"id":"CI001","name":"Sheesham Wood Coffee Table",  "category":"furniture","style":["Contemporary Indian","Mid-Century"],"color":[100,60,30],"price":18000,"room":["living_room"]},
    {"id":"CI002","name":"Hammered Brass Vase",         "category":"accent",   "style":["Contemporary Indian","Vintage Indian"],"color":[200,168,76],"price":1600,"room":["living_room","dining_room","bedroom"]},
    {"id":"CI003","name":"Block Print Cotton Curtains", "category":"curtains", "style":["Contemporary Indian","Bohemian"],"color":[196,120,80],"price":3400,"room":["living_room","bedroom","dining_room"]},
    {"id":"CI004","name":"Terracotta Planter Set",      "category":"accent",   "style":["Contemporary Indian","Cottagecore"],"color":[196,100,78],"price":850,"room":["living_room","bedroom","bathroom"]},
    {"id":"CI005","name":"Copper Pendant Lamp",         "category":"lamps",    "style":["Contemporary Indian","Mid-Century"],"color":[184,115,51],"price":3800,"room":["living_room","dining_room","bedroom"]},
    {"id":"CI006","name":"Ikat Print Cushion Covers",   "category":"textiles", "style":["Contemporary Indian","Vintage Indian"],"color":[160,80,100],"price":1100,"room":["living_room","bedroom"]},
    # ══ JAPANDI ════════════════════════════════════════════════════════════════
    {"id":"JP001","name":"Linen Japandi Sofa",          "category":"furniture","style":["Japandi"],        "color":[196,168,130],"price":28000,"room":["living_room"]},
    {"id":"JP002","name":"Minimalist Oak Shelf",        "category":"furniture","style":["Japandi"],        "color":[200,175,140],"price":8500, "room":["living_room","study_room","bedroom"]},
    {"id":"JP003","name":"Rattan Pendant Lamp",         "category":"lamps",    "style":["Japandi","Bohemian","Coastal"],"color":[190,165,120],"price":2200,"room":["living_room","dining_room","bedroom"]},
    {"id":"JP004","name":"Sage Velvet Cushion Set",     "category":"textiles", "style":["Japandi","Cottagecore"],"color":[110,160,115],"price":1400,"room":["living_room","bedroom"]},
    {"id":"JP005","name":"Jute Natural Weave Rug",      "category":"rugs",     "style":["Japandi","Coastal","Cottagecore"],"color":[200,185,155],"price":2600,"room":["living_room","study_room","bedroom"]},
    {"id":"JP006","name":"Ceramic Bud Vase Set",        "category":"accent",   "style":["Japandi"],        "color":[210,200,185],"price":980,  "room":["living_room","bedroom","bathroom"]},
    {"id":"JP007","name":"Ivory Linen Curtains",        "category":"curtains", "style":["Japandi","Coastal"],"color":[240,230,210],"price":2800,"room":["living_room","bedroom"]},
    # ══ BOHEMIAN ════════════════════════════════════════════════════════════════
    {"id":"BO001","name":"Rattan & Cane Peacock Chair", "category":"furniture","style":["Bohemian","Coastal"],"color":[185,155,110],"price":14000,"room":["living_room","bedroom"]},
    {"id":"BO002","name":"Handwoven Macramé Wall Hanging","category":"wall_art","style":["Bohemian","Cottagecore"],"color":[220,210,190],"price":1800,"room":["living_room","bedroom"]},
    {"id":"BO003","name":"Kilim Patchwork Rug",         "category":"rugs",     "style":["Bohemian"],       "color":[160,80,60],  "price":6200, "room":["living_room","bedroom","study_room"]},
    {"id":"BO004","name":"Layered Jewel Cushion Set",   "category":"textiles", "style":["Bohemian"],       "color":[107,78,138], "price":1800, "room":["living_room","bedroom"]},
    {"id":"BO005","name":"Rattan Pendant Cluster",      "category":"lamps",    "style":["Bohemian"],       "color":[190,165,120],"price":3400, "room":["living_room","dining_room"]},
    {"id":"BO006","name":"Global Textile Wall Art",     "category":"wall_art", "style":["Bohemian"],       "color":[180,100,60], "price":2400, "room":["living_room","bedroom"]},
    {"id":"BO007","name":"Embroidered Boho Curtains",   "category":"curtains", "style":["Bohemian"],       "color":[190,70,50],  "price":3800, "room":["living_room","bedroom"]},
    # ══ MID-CENTURY ════════════════════════════════════════════════════════════
    {"id":"MC001","name":"Walnut Credenza Sideboard",   "category":"furniture","style":["Mid-Century"],    "color":[100,65,35],  "price":32000,"room":["living_room","dining_room"]},
    {"id":"MC002","name":"Tulip-Style Accent Chair",    "category":"furniture","style":["Mid-Century"],    "color":[212,168,60], "price":16000,"room":["living_room","study_room"]},
    {"id":"MC003","name":"Arc Brass Floor Lamp",        "category":"lamps",    "style":["Mid-Century"],    "color":[200,168,76], "price":6500, "room":["living_room","study_room","bedroom"]},
    {"id":"MC004","name":"Abstract Earth-Tone Triptych","category":"wall_art", "style":["Mid-Century","Japandi"],"color":[165,130,90],"price":3200,"room":["living_room","dining_room"]},
    {"id":"MC005","name":"Avocado Boucle Cushions",     "category":"textiles", "style":["Mid-Century"],    "color":[100,130,80], "price":1600, "room":["living_room","bedroom"]},
    # ══ ART DECO ════════════════════════════════════════════════════════════════
    {"id":"AD001","name":"Velvet Emerald Tuxedo Sofa",  "category":"furniture","style":["Art Deco"],       "color":[20,100,80],  "price":58000,"room":["living_room"]},
    {"id":"AD002","name":"Gold Geometric Table Lamp",   "category":"lamps",    "style":["Art Deco"],       "color":[200,168,76], "price":5800, "room":["living_room","bedroom","study_room"]},
    {"id":"AD003","name":"Oval Sunburst Mirror",        "category":"accent",   "style":["Art Deco"],       "color":[200,168,76], "price":8200, "room":["living_room","bedroom","dining_room"]},
    {"id":"AD004","name":"Black Marble Side Table",     "category":"furniture","style":["Art Deco"],       "color":[28,28,28],   "price":22000,"room":["living_room","bedroom"]},
    {"id":"AD005","name":"Gold Foil Geometric Art Print","category":"wall_art","style":["Art Deco"],       "color":[200,168,76], "price":3800, "room":["dining_room","living_room"]},
    {"id":"AD006","name":"Velvet Navy Drapes",          "category":"curtains", "style":["Art Deco"],       "color":[26,47,80],   "price":7200, "room":["living_room","dining_room","bedroom"]},
    {"id":"AD007","name":"Champagne Chevron Rug",       "category":"rugs",     "style":["Art Deco"],       "color":[220,200,160],"price":9500, "room":["living_room","dining_room"]},
    # ══ COASTAL ════════════════════════════════════════════════════════════════
    {"id":"CO001","name":"White Rattan Daybed",         "category":"furniture","style":["Coastal"],        "color":[245,242,235],"price":24000,"room":["bedroom","living_room"]},
    {"id":"CO002","name":"Driftwood Wall Art",          "category":"wall_art", "style":["Coastal"],        "color":[180,160,130],"price":2800, "room":["living_room","bedroom","bathroom"]},
    {"id":"CO003","name":"Sea Glass Bead Pendant",      "category":"lamps",    "style":["Coastal"],        "color":[180,210,215],"price":3200, "room":["dining_room","bedroom","living_room"]},
    {"id":"CO004","name":"White Linen Sheer Curtains",  "category":"curtains", "style":["Coastal","Japandi"],"color":[245,245,240],"price":2200,"room":["living_room","bedroom"]},
    {"id":"CO005","name":"Jute Seagrass Area Rug",      "category":"rugs",     "style":["Coastal","Cottagecore"],"color":[190,170,140],"price":3200,"room":["living_room","bedroom"]},
    # ══ DARK ACADEMIA ════════════════════════════════════════════════════════════
    {"id":"DA001","name":"Chesterfield Leather Sofa",   "category":"furniture","style":["Dark Academia"],  "color":[80,45,25],   "price":52000,"room":["living_room","study_room"]},
    {"id":"DA002","name":"Mahogany Ladder Bookshelf",   "category":"furniture","style":["Dark Academia"],  "color":[60,30,15],   "price":18000,"room":["study_room","living_room"]},
    {"id":"DA003","name":"Antique Globe Floor Lamp",    "category":"lamps",    "style":["Dark Academia"],  "color":[80,60,30],   "price":7200, "room":["study_room","living_room","bedroom"]},
    {"id":"DA004","name":"Persian Wool Runner",         "category":"rugs",     "style":["Dark Academia","Vintage Indian"],"color":[120,40,50],"price":12000,"room":["study_room","living_room","dining_room"]},
    {"id":"DA005","name":"Antique World Map Print",     "category":"wall_art", "style":["Dark Academia"],  "color":[180,155,100],"price":2400, "room":["study_room","living_room"]},
    {"id":"DA006","name":"Burgundy Velvet Curtains",    "category":"curtains", "style":["Dark Academia"],  "color":[107,39,55],  "price":5800, "room":["living_room","study_room","bedroom"]},
    # ══ COTTAGECORE ════════════════════════════════════════════════════════════
    {"id":"CC001","name":"Vintage Floral Armchair",     "category":"furniture","style":["Cottagecore"],    "color":[220,160,155],"price":18000,"room":["living_room","bedroom","study_room"]},
    {"id":"CC002","name":"Dried Wildflower Wreath",     "category":"accent",   "style":["Cottagecore"],    "color":[180,140,100],"price":680,  "room":["living_room","bedroom","bathroom"]},
    {"id":"CC003","name":"Vintage China Plate Set",     "category":"wall_art", "style":["Cottagecore"],    "color":[220,200,180],"price":1800, "room":["dining_room","kitchen","living_room"]},
    {"id":"CC004","name":"Floral Lace Curtains",        "category":"curtains", "style":["Cottagecore"],    "color":[245,240,230],"price":2400, "room":["bedroom","kitchen","living_room"]},
    {"id":"CC005","name":"Sage Herb Pot Cluster",       "category":"accent",   "style":["Cottagecore"],    "color":[138,162,130],"price":850,  "room":["kitchen","bathroom","bedroom"]},
    {"id":"CC006","name":"Chunky Knit Throw Blanket",   "category":"textiles", "style":["Cottagecore","Japandi","Coastal"],"color":[230,220,205],"price":1800,"room":["living_room","bedroom"]},
    # ══ INDUSTRIAL ════════════════════════════════════════════════════════════════
    {"id":"IN001","name":"Steel & Mango Wood Shelf",    "category":"furniture","style":["Industrial"],     "color":[80,80,80],   "price":14000,"room":["study_room","living_room"]},
    {"id":"IN002","name":"Matte Black Arc Floor Lamp",  "category":"lamps",    "style":["Industrial"],     "color":[30,30,30],   "price":4500, "room":["living_room","study_room"]},
    {"id":"IN003","name":"Reclaimed Wood Coffee Table", "category":"furniture","style":["Industrial"],     "color":[90,65,40],   "price":16000,"room":["living_room"]},
    {"id":"IN004","name":"Concrete Geometric Planter",  "category":"accent",   "style":["Industrial"],     "color":[110,105,100],"price":950,  "room":["living_room","study_room","bedroom"]},
    {"id":"IN005","name":"Dark Geometric Wool Rug",     "category":"rugs",     "style":["Industrial","Mid-Century"],"color":[60,60,60],"price":4200,"room":["living_room","study_room"]},
]


# ══════════════════════════════════════════════════════════════════════════════
#  STYLE-DRIVEN PALETTE OVERRIDE
# ══════════════════════════════════════════════════════════════════════════════

def get_style_palette(styles: list[str], dominant_colors: list[dict], lighting: str) -> dict:
    """
    Returns wall/accent/ceiling colours driven PRIMARILY by selected style.
    Blends with extracted dominant colour for personalisation.
    """
    # Primary style drives the palette
    primary = styles[0] if styles else "Japandi"
    dna     = STYLE_DNA.get(primary, STYLE_DNA["Japandi"])
    pal     = dna["palette"]

    # Slight blend with dominant extracted colour (10% influence)
    wall_hex = pal["wall"]
    if dominant_colors:
        dom_rgb  = dominant_colors[0]["rgb"]
        w_rgb    = [int(wall_hex[i:i+2],16) for i in (1,3,5)]
        blended  = [int(w*0.90 + d*0.10) for w, d in zip(w_rgb, dom_rgb)]
        wall_hex = "#{:02X}{:02X}{:02X}".format(*blended)

    # Dim lighting pushes wall slightly warmer
    if lighting == "dim":
        r, g, b  = [int(wall_hex[i:i+2],16) for i in (1,3,5)]
        wall_hex = "#{:02X}{:02X}{:02X}".format(min(255,r+10), g, max(0,b-8))

    return {
        "wall_color":          wall_hex,
        "accent_color":        pal["accent"],
        "ceiling_color":       pal["ceiling"],
        "object_driven":       True,
        "anchor_object":       None,
        "anchor_color":        dominant_colors[0]["hex"] if dominant_colors else "#C4A882",
        "palette_strategy":    "style_driven",
        "object_palette_note": pal["note"],
        "detected_style":      primary,
        "style_similarities":  {s: 1.0 if s == primary else 0.3 for s in styles},
        "colour_mood":         dna["colour_mood"],
    }


# ══════════════════════════════════════════════════════════════════════════════
#  BUDGET ALLOCATION — per style
# ══════════════════════════════════════════════════════════════════════════════

DEFAULT_BUDGET_WEIGHTS = {
    "wallpaper":0.15,"furniture":0.38,"curtains":0.08,
    "rugs":0.12,"lamps":0.10,"wall_art":0.09,"accent":0.08
}

def allocate_budget(total_budget: float, scope: str, styles: list[str]) -> dict[str, float]:
    primary = styles[0] if styles else "Japandi"
    weights = STYLE_DNA.get(primary, {}).get("budget_weights", DEFAULT_BUDGET_WEIGHTS).copy()

    if scope == "decor":
        furniture_w = weights.pop("furniture", 0.38)
        for k in weights:
            weights[k] += furniture_w / len(weights)
    elif scope == "interior":
        weights["furniture"] = 0.55
        weights["wallpaper"] = 0.20
        rest = (1.0 - 0.55 - 0.20) / max(len(weights) - 2, 1)
        for k in weights:
            if k not in ("furniture", "wallpaper"):
                weights[k] = rest

    # Normalise to sum = 1
    total = sum(weights.values())
    weights = {k: v/total for k, v in weights.items()}
    return {cat: round(total_budget * w, 2) for cat, w in weights.items()}


# ══════════════════════════════════════════════════════════════════════════════
#  SCORING
# ══════════════════════════════════════════════════════════════════════════════

def _style_match(item_styles: list[str], user_styles: list[str]) -> float:
    """1.0 if exact match, 0.5 if partial, 0.05 if none — makes style decisive."""
    if not user_styles:
        return 0.5
    exact   = len(set(item_styles) & set(user_styles))
    if exact == 0:
        return 0.05   # near-zero so off-style items almost never win
    return min(1.0, exact / len(user_styles) * 1.2)


def _colour_compat(item_rgb: list[int], dominant: list[dict]) -> float:
    if not dominant:
        return 0.5
    dom_rgb = dominant[0]["rgb"]
    dist    = sum((a-b)**2 for a,b in zip(item_rgb, dom_rgb)) ** 0.5
    return round(max(0.0, 1.0 - dist/441.7), 4)


def _score(item_styles, item_rgb, user_styles, dominant_colors):
    """Style is 80% of the score — guarantees different styles = different results."""
    return 0.80 * _style_match(item_styles, user_styles) + \
           0.20 * _colour_compat(item_rgb, dominant_colors)


# ══════════════════════════════════════════════════════════════════════════════
#  DATACLASSES
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class WallpaperRecommendation:
    id:str; name:str; style:list; scale:str; base_color:str
    price_sqft:float; pattern_type:str; similarity:float
    budget_label:str; estimated_total:float

@dataclass
class DecorRecommendation:
    id:str; name:str; category:str; style:list; color:str
    price:float; similarity:float; colour_score:float
    budget_label:str; budget_pct:float

@dataclass
class RecommendationResult:
    wallpapers:list; decor_items:list; budget_breakdown:dict
    total_estimated:float; budget_remaining:float; summary:str


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN RECOMMEND
# ══════════════════════════════════════════════════════════════════════════════

def recommend(
    dominant_colors:  list[dict],
    room_type:        str,
    size_category:    str,
    styles:           list[str],
    total_budget:     float,
    scope:            str,
    wall_area_sqft:   float = 200.0,
    top_n_wallpaper:  int   = 6,
    top_n_decor:      int   = 8,
    image_features=None,
    object_colors:    list  = None,
    style_sims:       dict  = None,
) -> RecommendationResult:

    object_colors = object_colors or []
    budget_map    = allocate_budget(total_budget, scope, styles)

    # ── Preferred scale by room size ─────────────────────────────────────────
    preferred_scales = {"small":["plain","small"],"medium":["small","medium"],"large":["large","medium"]}.get(size_category, ["medium"])

    # ── WALLPAPERS ────────────────────────────────────────────────────────────
    wp_budget_sqft = budget_map.get("wallpaper", 0) / max(wall_area_sqft, 1)
    # Filter by style first, relax if too few
    filtered_wp = [w for w in WALLPAPER_CATALOGUE if any(s in styles for s in w["style"])]
    if len(filtered_wp) < 3:
        filtered_wp = WALLPAPER_CATALOGUE   # open up if no matches

    wp_scores = []
    for w in filtered_wp:
        s = _score(w["style"], w["base_color"], styles, dominant_colors)
        s += 0.05 if w["scale"] in preferred_scales else 0.0
        s += 0.03 if room_type in w.get("suitable_rooms", []) else 0.0
        wp_scores.append((w, s))

    wp_scores.sort(key=lambda x: x[1], reverse=True)
    wallpapers = []
    for w, score in wp_scores[:top_n_wallpaper]:
        est     = round(w["price_sqft"] * wall_area_sqft, 2)
        r,g,b   = w["base_color"]
        wallpapers.append(WallpaperRecommendation(
            id=w["id"], name=w["name"], style=w["style"], scale=w["scale"],
            base_color=f"#{r:02X}{g:02X}{b:02X}", price_sqft=w["price_sqft"],
            pattern_type=w["pattern_type"], similarity=round(min(score,0.99),4),
            budget_label="In Budget" if w["price_sqft"]<=wp_budget_sqft else "Over Budget",
            estimated_total=est,
        ))

    # ── DÉCOR ─────────────────────────────────────────────────────────────────
    decor_items = []
    for cat, cat_budget in budget_map.items():
        if cat == "wallpaper":
            continue

        # Filter by category + style, relax if empty
        cat_items = [d for d in DECOR_CATALOGUE
                     if d["category"]==cat and any(s in styles for s in d["style"])
                     and d["price"] <= cat_budget * 1.5]
        if not cat_items:
            cat_items = [d for d in DECOR_CATALOGUE
                         if d["category"]==cat and d["price"] <= cat_budget * 1.5]
        if not cat_items:
            continue

        scored = []
        for d in cat_items:
            s       = _score(d["style"], d["color"], styles, dominant_colors)
            c_score = _colour_compat(d["color"], dominant_colors)
            scored.append((d, s, c_score))

        scored.sort(key=lambda x: x[1], reverse=True)
        d, score, c_score = scored[0]
        r,g,b = d["color"]
        decor_items.append(DecorRecommendation(
            id=d["id"], name=d["name"], category=d["category"],
            style=d["style"], color=f"#{r:02X}{g:02X}{b:02X}",
            price=d["price"], similarity=round(min(score,0.99),4),
            colour_score=round(c_score,4),
            budget_label="In Budget" if d["price"]<=cat_budget else "Over Budget",
            budget_pct=round(d["price"]/max(cat_budget,1)*100,1),
        ))

    decor_items.sort(key=lambda x: x.similarity, reverse=True)
    decor_items = decor_items[:top_n_decor]

    # ── TOTALS ────────────────────────────────────────────────────────────────
    wall_total  = wallpapers[0].estimated_total if wallpapers else 0
    decor_total = sum(d.price for d in decor_items)
    total_est   = round(wall_total + decor_total, 2)
    remaining   = round(total_budget - total_est, 2)

    primary_style = styles[0] if styles else "Japandi"
    summary = (
        f"{primary_style} recommendations for your {size_category} {room_type.replace('_',' ')}: "
        f"{len(wallpapers)} wallpapers, {len(decor_items)} décor items curated. "
        f"Total estimate ₹{total_est:,.0f} "
        f"({'saving ₹'+f'{remaining:,.0f}' if remaining>=0 else 'over by ₹'+f'{abs(remaining):,.0f}'})."
    )

    return RecommendationResult(
        wallpapers=wallpapers, decor_items=decor_items,
        budget_breakdown=budget_map,
        total_estimated=total_est, budget_remaining=remaining,
        summary=summary,
    )


def recommendation_to_dict(result: RecommendationResult) -> dict:
    return {
        "wallpapers": [{"id":w.id,"name":w.name,"style":w.style,"scale":w.scale,"base_color":w.base_color,"price_sqft":w.price_sqft,"pattern_type":w.pattern_type,"similarity_score":w.similarity,"budget_label":w.budget_label,"estimated_total":w.estimated_total} for w in result.wallpapers],
        "decor_items":[{"id":d.id,"name":d.name,"category":d.category,"style":d.style,"color":d.color,"price":d.price,"similarity_score":d.similarity,"colour_score":d.colour_score,"budget_label":d.budget_label,"budget_pct":d.budget_pct} for d in result.decor_items],
        "budget_breakdown":result.budget_breakdown,
        "total_estimated":result.total_estimated,
        "budget_remaining":result.budget_remaining,
        "summary":result.summary,
    }
