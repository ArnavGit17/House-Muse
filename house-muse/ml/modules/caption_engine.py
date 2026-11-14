"""
modules/caption_engine.py
════════════════════════════════════════════════════════════════════════════════
BLIP Encoder-Decoder — Room Image → Semantic Caption → Diffusion Prompt

Pipeline:
    User Room Image
         ↓
    BLIP Encoder  (ViT — Vision Transformer)
         ↓         reads visual features from image
    BLIP Decoder  (Language Model)
         ↓         generates natural language description
    Caption       "a living room with a beige sofa and wooden coffee table"
         ↓
    Prompt Builder (combines caption + style + palette)
         ↓
    Stable Diffusion API → Final Styled Image

Why BLIP over raw prompt engineering:
    - Captures actual objects/colours FROM the photo automatically
    - Decoder output is grounded in real visual content
    - Much more accurate than guessing from class labels alone
    - Free via HuggingFace Inference API (no GPU, no cost)

Setup:
    1. Sign up free at https://huggingface.co
    2. Get token: https://huggingface.co/settings/tokens
    3. Add to backend/.env:
       HF_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxx

Model used: Salesforce/blip-image-captioning-large
    - Free on HuggingFace
    - Runs on their servers (no local GPU needed)
    - Response time: 3–8 seconds
════════════════════════════════════════════════════════════════════════════════
"""

import os
import base64
import requests
import time
from pathlib import Path


# ── HuggingFace Inference API config ─────────────────────────────────────────
BLIP_MODEL_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large"
HF_TOKEN       = os.getenv("HF_API_TOKEN", "")


# ── Style descriptors (same as image_generator.py) ───────────────────────────
STYLE_PROMPT_MAP = {
    "Japandi":             "japandi interior design, wabi-sabi aesthetic, natural wood textures, linen textiles, zen minimalism, muted warm tones, handcrafted details",
    "Bohemian":            "bohemian eclectic interior, layered textiles, macrame wall hangings, rattan furniture, jewel tones, global decor accents, lush plants",
    "Mid-Century":         "mid century modern interior design, walnut wood furniture, mustard yellow and burnt orange accents, tapered legs, retro geometric patterns",
    "Contemporary Indian": "contemporary Indian interior design, brass and copper accents, terracotta tones, block print textiles, modern Indian craftsmanship, clean lines",
    "Vintage Indian":      "vintage Indian haveli interior, intricate jaali woodwork, indigo and magenta colours, antique brass vessels, ornate carved furniture, heritage textiles",
    "Art Deco":            "art deco interior design, gold geometric patterns, emerald green velvet, black marble surfaces, glamorous and opulent, symmetrical composition",
    "Coastal":             "coastal beach house interior, white walls, natural rattan furniture, sea blue accent pieces, driftwood textures, breezy natural light",
    "Dark Academia":       "dark academia interior design, mahogany bookshelves, leather armchair, candlelight warmth, moody burgundy tones, stacked books, intellectual atmosphere",
    "Cottagecore":         "cottagecore interior design, vintage floral wallpaper, sage green cabinetry, dried flowers, lace curtains, antique china, cosy pastoral warmth",
    "Industrial":          "industrial loft interior design, exposed brick walls, steel and iron accents, concrete flooring, Edison bulb pendant lights, dark metal shelving",
}

LIGHTING_MAP = {
    "bright": "flooded with natural daylight, bright and airy, sunlit",
    "dim":    "warm ambient lighting, soft lamp glow, intimate atmosphere",
}

SIZE_MAP = {
    "small":  "compact and cosy room, clever use of space",
    "medium": "well-proportioned room, balanced and comfortable",
    "large":  "spacious and grand room, generous proportions",
}

# ── Room-type furniture requirements ──────────────────────────────────────────
ROOM_FURNITURE_REQUIREMENTS = {
    "living_room": "a sofa or couch as the central seating piece, a coffee table, accent chairs",
    "bedroom":     "a bed with headboard, nightstands, a dresser",
    "kitchen":     "cabinetry, countertop, bar stools if space allows",
    "dining_room": "a dining table with chairs",
    "bathroom":    "vanity, mirror, fixtures",
    "study_room":  "a desk, chair, bookshelf",
}


def get_room_furniture_requirements(room_type: str) -> str:
    """Return required furniture clause for room_type, normalizing common aliases."""
    if not room_type:
        return ""
    key = room_type.lower().strip().replace(" ", "_").replace("-", "_")
    alias_map = {
        "living": "living_room",
        "bed": "bedroom",
        "bath": "bathroom",
        "dining": "dining_room",
        "study": "study_room",
        "office": "study_room",
        "home_office": "study_room",
    }
    key = alias_map.get(key, key)
    return ROOM_FURNITURE_REQUIREMENTS.get(key, "")


def inject_room_furniture_into_prompt(prompt: str, room_type: str = "living_room") -> str:
    """
    Inject matching room furniture requirement into prompt right after the refurnishing line,
    ensuring room_type directly drives priority furniture in generated images.
    """
    req = get_room_furniture_requirements(room_type)
    if not req or req in prompt:
        return prompt

    # Locate common refurnishing line endings
    patterns = [
        "new lighting fixtures,",
        "new lighting fixtures",
        "new seating,",
        "new seating",
        "new retro seating,",
        "new retro seating",
        "new designer seating,",
        "new designer seating",
        "new leather seating,",
        "new leather seating",
        "completely refurnished with new furniture,",
        "completely refurnished with",
    ]
    for pat in patterns:
        if pat in prompt:
            idx = prompt.find(pat) + len(pat)
            prefix = prompt[:idx].rstrip()
            suffix = prompt[idx:].lstrip()
            # If prefix didn't end with a comma, add one
            sep = "" if prefix.endswith(",") else ","
            return f"{prefix}{sep} {req}, {suffix}".strip()

    # Fallback if no specific refurnishing line pattern is found
    return f"{prompt}, {req}"



# ══════════════════════════════════════════════════════════════════════════════
#  STEP 1 — BLIP ENCODER-DECODER: Image → Caption
# ══════════════════════════════════════════════════════════════════════════════

def generate_caption(image_bytes: bytes, max_retries: int = 3) -> dict:
    """
    Send room image to BLIP via HuggingFace Inference API.
    BLIP encoder reads image features, decoder generates a natural description.

    Args:
        image_bytes : raw image bytes (JPG/PNG)
        max_retries : retry if model is loading (cold start ~20s)

    Returns:
        {
            "success":  bool,
            "caption":  str,    # e.g. "a living room with grey sofa and wooden floor"
            "error":    str | None,
            "method":   str,    # "blip_api" | "fallback"
        }
    """
    if not HF_TOKEN:
        return {
            "success": False,
            "caption": "",
            "error":   "HF_API_TOKEN not set in .env file",
            "method":  "none",
        }

    headers = {"Authorization": f"Bearer {HF_TOKEN}"}

    for attempt in range(max_retries):
        try:
            print(f"[BLIP] Generating caption (attempt {attempt + 1}/{max_retries})...")

            response = requests.post(
                BLIP_MODEL_URL,
                headers=headers,
                data=image_bytes,       # send raw image bytes directly
                timeout=45,
            )

            if response.status_code == 503:
                # Model is loading (cold start) — wait and retry
                wait_time = 20 if attempt == 0 else 10
                print(f"[BLIP] Model loading, waiting {wait_time}s...")
                time.sleep(wait_time)
                continue

            if response.status_code == 200:
                result  = response.json()
                caption = ""

                # HF returns list of dicts: [{"generated_text": "..."}]
                if isinstance(result, list) and result:
                    caption = result[0].get("generated_text", "")
                elif isinstance(result, dict):
                    caption = result.get("generated_text", "")

                if caption:
                    print("[BLIP] Caption generated.")
                    return {
                        "success": True,
                        "caption": caption,
                        "error":   None,
                        "method":  "blip_api",
                    }

            print(f"[BLIP] HTTP {response.status_code}")

        except requests.Timeout:
            print(f"[BLIP] Timeout on attempt {attempt + 1}")
        except Exception as e:
            print(f"[BLIP] Error: {type(e).__name__}")

        if attempt < max_retries - 1:
            time.sleep(5)

    return {
        "success": False,
        "caption": "",
        "error":   "BLIP API failed after retries",
        "method":  "none",
    }


# ══════════════════════════════════════════════════════════════════════════════
#  STEP 2 — PROMPT BUILDER: Caption + Style + Palette → Diffusion Prompt
# ══════════════════════════════════════════════════════════════════════════════

def build_prompt_from_caption(
    caption:           str,
    styles:            list[str],
    wall_color_name:   str,
    accent_color_name: str,
    size_category:     str,
    lighting:          str,
    dominant_colors:   list[dict] = None,
    room_type:         str = "living_room",
) -> tuple[str, str]:
    """
    Combine BLIP caption with style/palette info to build a rich
    Stable Diffusion prompt.

    Args:
        caption           : BLIP-generated description of the actual room
        styles            : user-selected aesthetic preferences
        wall_color_name   : human-readable wall colour name
        accent_color_name : human-readable accent colour name
        size_category     : small | medium | large
        lighting          : bright | dim
        dominant_colors   : list from K-Means extraction
        room_type         : room category (e.g. living_room, bedroom)

    Returns:
        (positive_prompt, negative_prompt)
    """

    # Style descriptors
    style_descs = [STYLE_PROMPT_MAP.get(s, s.lower()) for s in styles[:2]]
    style_text  = ", ".join(style_descs)

    # Lighting and size
    light_desc = LIGHTING_MAP.get(lighting, "natural lighting")
    size_desc  = SIZE_MAP.get(size_category, "medium sized room")

    # Colour context
    colour_note = f"walls in {wall_color_name}, {accent_color_name} accents"
    if dominant_colors:
        dom = _hex_to_rough_name(dominant_colors[0]["hex"])
        colour_note += f", dominant {dom} colour palette"

    # Room-type core furniture requirement
    req_furniture = get_room_furniture_requirements(room_type)
    furniture_clause = f"{req_furniture}, " if req_furniture else ""

    # The caption is the ANCHOR — it grounds the prompt in the real room
    positive = (
        f"ultra realistic interior design photograph, "
        f"{caption}, "                             # ← BLIP caption = encoder output
        f"completely refurnished with new {style_text} furniture, new seating, new lighting fixtures, "
        f"{furniture_clause}"
        f"redesigned as {style_text}, "
        f"{colour_note}, "
        f"{size_desc}, {light_desc}, "
        f"professional interior photography, "
        f"architectural digest magazine quality, "
        f"8k resolution, photorealistic, "
        f"beautifully styled, soft shadows, depth of field, "
        f"no people, no text"
    )

    negative = (
        "ugly, blurry, low resolution, distorted, cartoon, anime, "
        "sketch, drawing, painting, 2d, flat, people, person, human, "
        "text, watermark, logo, oversaturated, grainy, noise, "
        "bad proportions, deformed furniture, unrealistic, dark, gloomy"
    )

    return positive, negative


def _hex_to_rough_name(hex_color: str) -> str:
    """Convert hex to a rough colour name for prompt use."""
    h = hex_color.lstrip("#")
    r, g, b = int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
    if r > 200 and g > 180 and b > 150: return "warm cream"
    if r > 180 and g > 140 and b <  90: return "caramel"
    if r <  90 and g > 130 and b <  90: return "sage green"
    if r > 160 and g <  90 and b <  70: return "terracotta"
    if r <  70 and g <  70 and b > 140: return "navy blue"
    if r > 160 and g > 130 and b <  70: return "golden"
    if r <  80 and g <  60 and b <  60: return "dark charcoal"
    if r > 180 and g > 180 and b > 180: return "light grey"
    return "neutral"


# ══════════════════════════════════════════════════════════════════════════════
#  STEP 3 — FALLBACK: Build prompt WITHOUT BLIP (if API unavailable)
# ══════════════════════════════════════════════════════════════════════════════

def build_prompt_fallback(
    room_type:        str,
    styles:           list[str],
    wall_color_name:  str,
    accent_color_name: str,
    size_category:    str,
    lighting:         str,
    detected_objects: list[dict] = None,
    dominant_colors:  list[dict] = None,
) -> tuple[str, str]:
    """
    Build prompt from structured data (no BLIP caption).
    Used when HF API is unavailable.
    """
    ROOM_VISUAL_MAP = {
        "living_room":  "living room",
        "bedroom":      "bedroom",
        "kitchen":      "kitchen",
        "dining_room":  "dining room",
        "bathroom":     "bathroom",
        "study_room":   "home office study room",
    }
    room_desc  = ROOM_VISUAL_MAP.get(room_type, "living room")
    style_descs = [STYLE_PROMPT_MAP.get(s, s.lower()) for s in styles[:2]]
    style_text  = ", ".join(style_descs)
    light_desc  = LIGHTING_MAP.get(lighting, "natural lighting")
    size_desc   = SIZE_MAP.get(size_category, "medium sized room")
    colour_note = f"walls in {wall_color_name}, {accent_color_name} accent pieces"

    # Add detected objects if available
    obj_note = ""
    if detected_objects:
        obj_names = [d.get("interior","").replace("_"," ")
                     for d in detected_objects[:4]
                     if d.get("interior")]
        if obj_names:
            obj_note = f"featuring {', '.join(obj_names)}, "

    # Room-type core furniture requirement
    req_furniture = get_room_furniture_requirements(room_type)
    furniture_clause = f"{req_furniture}, " if req_furniture else ""

    positive = (
        f"ultra realistic interior design photograph, {room_desc}, "
        f"{obj_note}"
        f"completely refurnished with new {style_text} furniture, new seating, new lighting fixtures, "
        f"{furniture_clause}"
        f"designed in {style_text}, "
        f"{colour_note}, "
        f"{size_desc}, {light_desc}, "
        f"professional interior photography, architectural digest quality, "
        f"8k resolution, photorealistic, beautifully styled, "
        f"soft shadows, depth of field, no people, no text"
    )

    negative = (
        "ugly, blurry, low resolution, distorted, cartoon, anime, "
        "sketch, drawing, people, person, human, text, watermark, "
        "oversaturated, grainy, bad proportions, deformed, dark, gloomy"
    )

    return positive, negative


# ══════════════════════════════════════════════════════════════════════════════
#  MASTER FUNCTION — called from app.py
# ══════════════════════════════════════════════════════════════════════════════

def get_generation_prompt(
    image_bytes:      bytes | None,
    room_type:        str,
    styles:           list[str],
    wall_color:       str,
    accent_color:     str,
    size_category:    str,
    lighting:         str,
    detected_objects: list[dict] = None,
    dominant_colors:  list[dict] = None,
) -> dict:
    """
    Main entry point. Tries BLIP first, falls back to structured prompt.

    Returns:
        {
            "positive_prompt":  str,
            "negative_prompt":  str,
            "caption":          str | None,   # BLIP output if available
            "method":           str,          # "blip" | "fallback"
        }
    """
    # Convert colour hex to names for prompt
    wall_name   = _hex_to_rough_name(wall_color)
    accent_name = _hex_to_rough_name(accent_color)

    caption = None
    method  = "fallback"

    # Try BLIP if image available and token set
    if image_bytes and HF_TOKEN:
        result = generate_caption(image_bytes)
        if result["success"] and result["caption"]:
            caption = result["caption"]
            method  = "blip"
            pos, neg = build_prompt_from_caption(
                caption, styles, wall_name, accent_name,
                size_category, lighting, dominant_colors,
                room_type=room_type,
            )
            return {
                "positive_prompt": pos,
                "negative_prompt": neg,
                "caption":         caption,
                "method":          method,
            }

    # Fallback: structured prompt from analysis data
    pos, neg = build_prompt_fallback(
        room_type, styles, wall_name, accent_name,
        size_category, lighting, detected_objects, dominant_colors
    )

    return {
        "positive_prompt": pos,
        "negative_prompt": neg,
        "caption":         caption,
        "method":          method,
    }
