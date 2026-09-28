"""
app.py — House Muse Backend API
Full stack: YOLOv8 + SAM + CLIP + Places365
"""

import os, json, traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()   # loads REPLICATE_API_TOKEN from .env file

from modules.image_processor        import process_image
from modules.color_palette          import generate_palette
from modules.space_analyzer         import analyse_space
from modules.recommendation_engine  import recommend, recommendation_to_dict, get_style_palette
from modules.image_generator        import generate_room_image, generate_multiple_variants
from modules.caption_engine         import get_generation_prompt
import numpy as np

app = Flask(__name__)
CORS(app, origins=["http://localhost:5500","http://127.0.0.1:5500",
                   "http://localhost:3000","null"])
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024

os.makedirs("uploads", exist_ok=True)


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "service": "House Muse — Full AI Stack"})


@app.route("/api/analyse", methods=["POST"])
def analyse():
    try:
        room_type  = request.form.get("room_type",  "living_room")
        length     = float(request.form.get("length", 12))
        width      = float(request.form.get("width",  10))
        height     = float(request.form.get("height",  9))
        styles_raw = request.form.get("styles", '["Japandi"]')
        styles     = json.loads(styles_raw) if isinstance(styles_raw, str) else styles_raw
        budget     = float(request.form.get("budget", 50000))
        scope      = request.form.get("scope",    "both")
        num_rooms  = int(request.form.get("num_rooms", 1))
        harmony    = request.form.get("harmony",  "analogous")

        # ── 1. Space analysis ──────────────────────────────────────────────
        space = analyse_space(length, width, height, room_type)

        # ── 2. Full image pipeline ─────────────────────────────────────────
        image_file = request.files.get("image")

        if image_file and image_file.filename:
            img_result     = process_image(image_file.read(),
                                           provided_room_type=room_type)
            dominant_colors = img_result["dominant_colors"]
            lighting        = img_result["lighting"]["condition"]
            detected_room   = img_result["room_type"]
            detections      = img_result.get("detections",    [])
            object_colors   = img_result.get("object_colors", [])
            object_palette  = img_result.get("object_palette",{})
            style_sims      = img_result.get("style_similarities", {})
            clip_features   = np.array(img_result.get("cnn_features", []), dtype=np.float32)
            room_method     = img_result.get("room_type_method", "user_provided")
            lighting_full   = img_result["lighting"]
        else:
            dominant_colors = _default_colors(room_type)
            lighting        = "bright"
            detected_room   = room_type
            detections      = []
            object_colors   = []
            object_palette  = {}
            style_sims      = {}
            clip_features   = None
            room_method     = "user_provided"
            lighting_full   = {"condition":"bright","mean_brightness":128,"color_temperature":"neutral"}

        # ── 3. Style-driven palette (style is PRIMARY driver) ──────────────
        # Style selection overrides object-detected palette
        # so Vintage Indian always gives earthy ochres, Art Deco gives gold+navy etc.
        style_palette = get_style_palette(styles, dominant_colors, lighting)

        palette = generate_palette(
            dominant_colors = dominant_colors,
            room_size       = space.size_category,
            ceiling_height  = space.ceiling_class,
            lighting        = lighting,
            style           = styles[0] if styles else "Japandi",
            harmony         = harmony,
        )

        # Override with style-driven colours
        palette.update({
            "wall_color":          style_palette["wall_color"],
            "accent_color":        style_palette["accent_color"],
            "ceiling_color":       style_palette["ceiling_color"],
            "object_palette_note": style_palette["object_palette_note"],
            "anchor_object":       style_palette.get("anchor_object"),
            "palette_strategy":    style_palette["palette_strategy"],
            "detected_style":      style_palette["detected_style"],
            "style_similarities":  style_sims,
            "colour_mood":         style_palette.get("colour_mood",""),
        })

        # ── 4. Recommendations ─────────────────────────────────────────────
        wall_area = 2 * (length + width) * height
        reco = recommend(
            dominant_colors = dominant_colors,
            room_type       = detected_room,
            size_category   = space.size_category,
            styles          = styles,
            total_budget    = budget,
            scope           = scope,
            wall_area_sqft  = wall_area,
            image_features  = clip_features,
            object_colors   = object_colors,
            style_sims      = style_sims,
        )

        # ── 5. Response ────────────────────────────────────────────────────
        return jsonify({
            "success": True,
            "space": {
                "area":                  space.area,
                "volume":                space.volume,
                "size_category":         space.size_category,
                "ceiling_class":         space.ceiling_class,
                "shape_hint":            space.shape_hint,
                "color_guidance":        space.color_guidance,
                "furniture_scale":       space.furniture_scale,
                "pattern_scale":         space.pattern_scale,
                "lighting_suggestions":  space.lighting_suggestions,
                "layout_tips":           space.layout_tips,
                "wallpaper_suitability": space.wallpaper_suitability,
            },
            "palette": {k:v for k,v in palette.items() if k != "cnn_features"},
            "image_analysis": {
                "dominant_colors":   dominant_colors,
                "lighting":          lighting_full,
                "detected_room":     detected_room,
                "room_type_method":  room_method,
                "detections":        detections,
                "object_colors":     object_colors,
                "style_similarities":style_sims,
            },
            "object_palette":  style_palette,
            "recommendations": recommendation_to_dict(reco),
            "meta": {
                "num_rooms": num_rooms, "scope": scope,
                "styles": styles, "budget": budget,
                "wall_area": round(wall_area, 1),
            },
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/palette", methods=["POST"])
def palette_only():
    try:
        data      = request.get_json(force=True)
        room_type = data.get("room_type","living_room")
        length    = float(data.get("length",12))
        width     = float(data.get("width", 10))
        height    = float(data.get("height", 9))
        styles    = data.get("styles",["Japandi"])
        harmony   = data.get("harmony","analogous")

        space   = analyse_space(length, width, height, room_type)
        colors  = _default_colors(room_type)
        palette = generate_palette(colors, space.size_category,
                                   space.ceiling_class, "bright",
                                   styles[0] if styles else "Japandi", harmony)

        return jsonify({"success":True,"palette":palette,"space":{
            "size_category":  space.size_category,
            "ceiling_class":  space.ceiling_class,
            "color_guidance": space.color_guidance,
        }})
    except Exception as e:
        return jsonify({"success":False,"error":str(e)}), 500


@app.route("/api/generate-image", methods=["POST"])
def generate_image():
    """
    Full pipeline:
      1. BLIP encoder-decoder → caption from room image
      2. Prompt builder → rich SD prompt from caption + style + palette
      3. Pollinations.AI (flux model, free/keyless) → styled room image
         Falls back to Stability AI (SDXL) if Pollinations fails and
         STABILITY_API_KEY is set. Text-to-image only — the uploaded
         room photo is used for the BLIP caption in step 1, not as a
         structural/image-to-image input, so layout isn't preserved.

    Accepts multipart/form-data (with optional image) OR JSON.

    Form fields / JSON keys:
        image          : file (optional — enables BLIP captioning)
        room_type      : str
        styles         : JSON array string
        wall_color     : hex string
        accent_color   : hex string
        dominant_colors: JSON array
        size_category  : small | medium | large
        lighting       : bright | dim
        detections     : JSON array of detected objects
        n_variants     : int (1–3)
    """
    try:
        # Parse — supports both JSON and multipart
        is_json = request.content_type and "application/json" in request.content_type

        if is_json:
            data             = request.get_json(force=True)
            image_bytes      = None
            room_type        = data.get("room_type",       "living_room")
            styles           = data.get("styles",          ["Japandi"])
            wall_color       = data.get("wall_color",      "#E2C89A")
            accent_color     = data.get("accent_color",    "#8A9E85")
            dominant_colors  = data.get("dominant_colors", [])
            size_category    = data.get("size_category",   "medium")
            lighting         = data.get("lighting",        "bright")
            detections       = data.get("detections",      [])
            n_variants       = int(data.get("n_variants",  1))
        else:
            image_file       = request.files.get("image")
            image_bytes      = image_file.read() if image_file else None
            room_type        = request.form.get("room_type",       "living_room")
            styles_raw       = request.form.get("styles") or request.form.get("style", '["Japandi"]')
            if isinstance(styles_raw, str):
                try:
                    styles   = json.loads(styles_raw)
                except Exception:
                    styles   = [styles_raw]
            else:
                styles       = styles_raw or ["Japandi"]
            if not isinstance(styles, list):
                styles       = [styles]

            wall_color       = request.form.get("wall_color",      "#E2C89A")
            accent_color     = request.form.get("accent_color",    "#8A9E85")

            dominant_colors_raw = request.form.get("dominant_colors", "[]")
            try:
                dominant_colors = json.loads(dominant_colors_raw) if isinstance(dominant_colors_raw, str) else dominant_colors_raw
            except Exception:
                dominant_colors = []

            size_category    = request.form.get("size_category",   "medium")
            lighting         = request.form.get("lighting",        "bright")

            detections_raw   = request.form.get("detections", "[]")
            try:
                detections   = json.loads(detections_raw) if isinstance(detections_raw, str) else detections_raw
            except Exception:
                detections   = []

            n_variants       = int(request.form.get("n_variants",  1))

        # ── Step 1+2: BLIP caption → prompt ────────────────────────────────
        prompt_data = get_generation_prompt(
            image_bytes      = image_bytes,
            room_type        = room_type,
            styles           = styles,
            wall_color       = wall_color,
            accent_color     = accent_color,
            size_category    = size_category,
            lighting         = lighting,
            detected_objects = detections,
            dominant_colors  = dominant_colors,
        )

        positive = prompt_data["positive_prompt"]
        negative = prompt_data["negative_prompt"]
        caption  = prompt_data["caption"]
        method   = prompt_data["method"]

        print(f"[Generate] Method: {method}")
        if caption:
            print(f"[Generate] BLIP caption: {caption}")

        # ── Step 3: Pollinations.AI (Stability AI fallback) ─────────────────
        chosen_style = styles[0] if styles else "contemporary_indian"
        if n_variants == 1:
            result   = generate_room_image(positive, negative, image_input=image_bytes, style=chosen_style)
            variants = [{
                **result,
                "variant":       1,
                "variant_label": "Styled Room",
                "caption":       caption,
                "prompt_method": method,
            }]
        else:
            labels = ["Full Room View", "Detail View", "Evening Mood"]
            notes  = [
                "wide angle view showing full room",
                "close up corner detail showing furniture",
                "evening warm lighting cosy atmosphere",
            ]
            variants = []
            for i in range(min(n_variants, 3)):
                extra_pos = f"{positive}, {notes[i]}"
                r = generate_room_image(extra_pos, negative, image_input=image_bytes, style=chosen_style)
                variants.append({
                    **r,
                    "variant":       i + 1,
                    "variant_label": labels[i],
                    "caption":       caption,
                    "prompt_method": method,
                })
                import time; time.sleep(1)

        return jsonify({
            "success":  any(v.get("success") for v in variants),
            "caption":  caption,
            "method":   method,
            "variants": [
                {
                    "variant":       v.get("variant", 1),
                    "variant_label": v.get("variant_label", "Room View"),
                    "image_url":     v.get("image_url"),
                    "image_b64":     v.get("image_b64"),
                    "prompt":        v.get("prompt"),
                    "caption":       v.get("caption"),
                    "prompt_method": v.get("prompt_method", "fallback"),
                    "success":       v.get("success"),
                    "error":         v.get("error"),
                }
                for v in variants
            ],
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e), "variants": []}), 500


# ── Default colours when no image uploaded ─────────────────────────────────
_ROOM_DEFAULTS = {
    "living_room":  [{"hex":"#C4A882","rgb":[196,168,130],"percentage":40},{"hex":"#8A9E85","rgb":[138,158,133],"percentage":25},{"hex":"#E8D5A3","rgb":[232,213,163],"percentage":20},{"hex":"#3D2E26","rgb":[61,46,38],"percentage":10},{"hex":"#C67C52","rgb":[198,124,82],"percentage":5}],
    "bedroom":      [{"hex":"#D4C5B0","rgb":[212,197,176],"percentage":40},{"hex":"#8A9E85","rgb":[138,158,133],"percentage":25},{"hex":"#F5EFE0","rgb":[245,239,224],"percentage":20},{"hex":"#6B5344","rgb":[107,83,68],"percentage":10},{"hex":"#C4856A","rgb":[196,133,106],"percentage":5}],
    "kitchen":      [{"hex":"#E8E4D8","rgb":[232,228,216],"percentage":45},{"hex":"#B0A090","rgb":[176,160,144],"percentage":25},{"hex":"#F5F0E8","rgb":[245,240,232],"percentage":20},{"hex":"#6B5344","rgb":[107,83,68],"percentage":8},{"hex":"#C9A84C","rgb":[201,168,76],"percentage":2}],
    "dining_room":  [{"hex":"#B87333","rgb":[184,115,51],"percentage":35},{"hex":"#C4A882","rgb":[196,168,130],"percentage":30},{"hex":"#3D2E26","rgb":[61,46,38],"percentage":20},{"hex":"#E8D5A3","rgb":[232,213,163],"percentage":10},{"hex":"#8C5F6E","rgb":[140,95,110],"percentage":5}],
    "bathroom":     [{"hex":"#E0EEF0","rgb":[224,238,240],"percentage":40},{"hex":"#B0C8CC","rgb":[176,200,204],"percentage":30},{"hex":"#F5F5F0","rgb":[245,245,240],"percentage":20},{"hex":"#6B8A8C","rgb":[107,138,140],"percentage":8},{"hex":"#C4A882","rgb":[196,168,130],"percentage":2}],
    "study_room":   [{"hex":"#4A3728","rgb":[74,55,40],"percentage":35},{"hex":"#8A7A6A","rgb":[138,122,106],"percentage":25},{"hex":"#C4A882","rgb":[196,168,130],"percentage":20},{"hex":"#D4C5B0","rgb":[212,197,176],"percentage":15},{"hex":"#6B2737","rgb":[107,39,55],"percentage":5}],
}
def _default_colors(room_type):
    return _ROOM_DEFAULTS.get(room_type, _ROOM_DEFAULTS["living_room"])


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\n  🏠  House Muse API  →  http://localhost:{port}\n")
    app.run(debug=True, host="0.0.0.0", port=port)
