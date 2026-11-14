"""
modules/image_generator.py
Photo redesign : Hugging Face img2img — requires a configured Space; no text-only fallback
Text-only      : Pollinations.AI, then optional Stability AI fallback
                 Stability requires STABILITY_API_KEY in the ML service environment
"""

import os
import time
import base64
import requests
from urllib.parse import quote

# ── Credentials ───────────────────────────────────────────────────────────────
STABILITY_API_KEY = os.environ.get("STABILITY_API_KEY", "").strip()
HF_SPACE_ID       = os.environ.get("HF_SPACE_ID", "").strip()
HF_API_TOKEN      = os.environ.get("HF_API_TOKEN") or os.environ.get("HF_TOKEN")

if not STABILITY_API_KEY:
    print("[Generator] INFO: STABILITY_API_KEY not set — Stability AI fallback disabled.")
if not HF_SPACE_ID:
    print("[Generator] INFO: HF_SPACE_ID not set — HF Space generation disabled.")

# ── Room visual style map (imported by caption_engine) ────────────────────────
ROOM_VISUAL_MAP = {
    "living_room":  "a cosy living room with sofa, coffee table and ambient lighting",
    "bedroom":      "a serene bedroom with bed, soft furnishings and warm lighting",
    "kitchen":      "a modern kitchen with clean countertops and natural light",
    "dining_room":  "an elegant dining room with table, chairs and pendant lighting",
    "bathroom":     "a fresh bathroom with clean fixtures and soft lighting",
    "study_room":   "a focused study room with desk, bookshelves and task lighting",
    "hallway":      "a welcoming hallway with console table and wall art",
    "balcony":      "a relaxing balcony with outdoor seating and plants",
    "home_office":  "a productive home office with desk, monitor and clean shelving",
    "kids_room":    "a playful kids room with bright colours and fun furniture",
}


# ── Pollinations.AI backend (FREE — no key needed) ────────────────────────────
def _generate_via_pollinations(positive_prompt: str, negative_prompt: str) -> dict:
    full_prompt = positive_prompt
    if negative_prompt:
        full_prompt = f"{positive_prompt} | avoid: {negative_prompt}"

    params = {
        "width":  1024,
        "height": 1024,
        "seed":   int(time.time()) % 99999,
        "model":  "flux",
        "nologo": "true",
    }

    url = f"https://image.pollinations.ai/prompt/{quote(full_prompt)}"

    print(f"[Pollinations] Requesting image ...")
    for attempt in range(3):
        try:
            resp = requests.get(url, params=params, timeout=90)
            if resp.status_code == 200 and "image" in resp.headers.get("content-type", ""):
                image_b64 = base64.b64encode(resp.content).decode("utf-8")
                print("[Pollinations] Image generated successfully.")
                return {
                    "success":   True,
                    "image_url": resp.url,
                    "image_b64": image_b64,
                    "error":     None,
                }
            print(f"[Pollinations] Attempt {attempt+1} failed -> HTTP {resp.status_code}")
            time.sleep(5)
        except requests.exceptions.Timeout:
            print(f"[Pollinations] Timeout on attempt {attempt+1}/3")
            time.sleep(5)
        except Exception as e:
            print(f"[Pollinations] Error: {e}")
            time.sleep(5)

    return {"success": False, "image_url": None, "image_b64": None,
            "error": "Pollinations.AI failed after 3 attempts."}


# ── Stability AI backend (FREE 25 credits/month) ──────────────────────────────
def _generate_via_stability(positive_prompt: str, negative_prompt: str) -> dict:
    headers = {
        "Authorization": f"Bearer {STABILITY_API_KEY}",
        "Content-Type":  "application/json",
        "Accept":        "application/json",
    }
    payload = {
        "text_prompts": [
            {"text": positive_prompt, "weight": 1.0},
            {"text": negative_prompt, "weight": -1.0},
        ],
        "width":        1024,
        "height":       1024,
        "steps":        30,
        "samples":      1,
        "cfg_scale":    7.5,
        "style_preset": "photographic",
    }

    print("[Stability] Requesting image ...")
    try:
        resp = requests.post(
            "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
            headers=headers, json=payload, timeout=60,
        )
        if resp.status_code == 200:
            artifacts = resp.json().get("artifacts", [])
            if artifacts:
                print("[Stability] Image generated successfully.")
                return {"success": True, "image_url": None,
                        "image_b64": artifacts[0]["base64"], "error": None}
            return {"success": False, "image_url": None, "image_b64": None,
                    "error": "Stability AI returned no artifacts."}
        elif resp.status_code == 401:
            return {"success": False, "image_url": None, "image_b64": None,
                    "error": "Invalid STABILITY_API_KEY (401). Check backend/.env"}
        elif resp.status_code == 402:
            return {"success": False, "image_url": None, "image_b64": None,
                    "error": "Stability AI credits exhausted. Top up at platform.stability.ai"}
        else:
            return {"success": False, "image_url": None, "image_b64": None,
                    "error": f"Stability AI error {resp.status_code}: {resp.text[:200]}"}
    except requests.exceptions.Timeout:
        return {"success": False, "image_url": None, "image_b64": None,
                "error": "Stability AI request timed out."}
    except Exception as e:
        return {"success": False, "image_url": None, "image_b64": None,
                "error": f"Stability AI exception: {e}"}


# ── Public API ─────────────────────────────────────────────────────────────────
def generate_room_image(
    positive_prompt: str,
    negative_prompt: str = "",
    image_input=None,
    style: str = "contemporary_indian",
    room_type: str = "living_room",
) -> dict:
    """
    With an input photo, use Hugging Face's img2img refinement endpoint and fail
    clearly if it is unavailable. Text-to-image providers cannot preserve the
    uploaded room's architecture and are only used when there is no input photo.
    """
    try:
        from modules.caption_engine import inject_room_furniture_into_prompt
        positive_prompt = inject_room_furniture_into_prompt(positive_prompt, room_type)
    except Exception:
        pass

    if image_input:
        if not HF_SPACE_ID:
            return {
                "success": False,
                "image_url": None,
                "image_b64": None,
                "error": "Photo-based redesign is unavailable because HF_SPACE_ID is not configured.",
            }

        try:
            from modules.hf_space_client import call_hf_space_refine
            preservation_prompt = (
                "Preserve the exact original camera viewpoint, room proportions, wall and ceiling geometry, "
                "and the position, shape, and size of every existing window, door, and opening. "
                "Do not add, remove, cover, resize, or relocate architectural features. "
                "Change only furniture, finishes, lighting, textiles, and decor."
            )
            preservation_negative = (
                "different camera angle, changed room proportions, moved or missing window, "
                "new or removed door, blocked opening, changed wall layout"
            )
            positive_prompt = f"{positive_prompt}, {preservation_prompt}"
            negative_prompt = f"{negative_prompt}, {preservation_negative}" if negative_prompt else preservation_negative
            hf_res = call_hf_space_refine(
                space_id=HF_SPACE_ID,
                image_input=image_input,
                original_image_input=image_input,
                style=style,
                instruction=preservation_prompt,
                prompt=positive_prompt,
                negative_prompt=negative_prompt,
                strength=0.55,
                controlnet_scale=1.0,
                lora_scale=0.8,
                num_inference_steps=30,
                hf_token=HF_API_TOKEN,
            )
            if hf_res.get("success"):
                return {
                    "success":    True,
                    "image_url":  None,
                    "image_b64":  hf_res.get("image_b64"),
                    "image_mime_type": hf_res.get("image_mime_type"),
                    "image_path": hf_res.get("image_path"),
                    "prompt":     positive_prompt,
                    "error":      None,
                }
            return {
                "success": False,
                "image_url": None,
                "image_b64": None,
                "error": hf_res.get("error") or "Hugging Face image-to-image generation failed.",
            }
        except Exception as e:
            return {
                "success": False,
                "image_url": None,
                "image_b64": None,
                "error": f"Hugging Face image-to-image generation failed: {e}",
            }

    print("[Generator] Trying Pollinations.AI ...")
    result = _generate_via_pollinations(positive_prompt, negative_prompt)
    if result["success"]:
        result["prompt"] = positive_prompt
        return result

    print(f"[Generator] Pollinations failed: {result['error']}")

    if STABILITY_API_KEY:
        print("[Generator] Falling back to Stability AI ...")
        result = _generate_via_stability(positive_prompt, negative_prompt)
        result["prompt"] = positive_prompt
        return result

    return {
        "success":   False,
        "image_url": None,
        "image_b64": None,
        "prompt":    positive_prompt,
        "error":     (
            "Pollinations.AI failed and no STABILITY_API_KEY set. "
            "Check your internet connection or add STABILITY_API_KEY to backend/.env "
            "(free at platform.stability.ai)."
        ),
    }


def generate_multiple_variants(
    positive_prompt: str,
    negative_prompt: str = "",
    n_variants: int = 3,
    variant_notes=None,
    variant_labels=None,
    image_input=None,
    style: str = "contemporary_indian",
    room_type: str = "living_room",
) -> list:
    default_notes  = [
        "wide angle view showing full room",
        "close up corner detail showing furniture",
        "evening warm lighting cosy atmosphere",
    ]
    default_labels = ["Full Room View", "Detail View", "Evening Mood"]

    notes  = (variant_notes  or default_notes) [:n_variants]
    labels = (variant_labels or default_labels)[:n_variants]

    results = []
    for i in range(n_variants):
        note      = notes[i]  if i < len(notes)  else ""
        label     = labels[i] if i < len(labels) else f"Variant {i + 1}"
        extra_pos = f"{positive_prompt}, {note}" if note else positive_prompt
        result    = generate_room_image(extra_pos, negative_prompt, image_input=image_input, style=style, room_type=room_type)
        result["variant"]       = i + 1
        result["variant_label"] = label
        results.append(result)
    return results


# ── Refinement & Base Style Prompts ───────────────────────────────────────────
DEFAULT_STYLE_PROMPTS = {
    "coastal": (
        "coastal beach house interior design, completely refurnished with new coastal furniture, new seating, "
        "new lighting fixtures, sun-washed white walls, natural rattan chairs and sofa, "
        "sea blue and sandy beige accents, light linen curtains, breezy airy natural lighting, "
        "high end architectural digest photograph"
    ),
    "contemporary_indian": (
        "contemporary Indian interior design, completely refurnished with new contemporary Indian furniture, "
        "new designer seating, modern brass lighting fixtures, warm brass and copper accents, terracotta and warm ochre tones, "
        "modern Indian craftsmanship, handcrafted wood finishes, clean geometric lines, soft warm ambient lighting, "
        "high end architectural digest photograph"
    ),
    "eclectic": (
        "eclectic layered interior design, completely refurnished with new eclectic statement furniture, "
        "curated art wall, new seating, statement lighting fixtures, mix of vintage and contemporary furniture, "
        "rich textures, patterned accent rugs, bold cohesive color harmony, interior magazine photography"
    ),
    "industrial": (
        "industrial loft interior design, completely refurnished with new industrial furniture, new leather seating, "
        "exposed brick accent wall, black steel and iron metalwork, polished concrete floor, "
        "new reclaimed wood dining table, Edison bulb pendant lights, architectural photography"
    ),
    "mid_century": (
        "mid century modern interior design, completely refurnished with new mid-century modern furniture, "
        "new retro seating, iconic walnut credenza, tapered wooden legs, new lighting fixtures, "
        "mustard yellow and burnt orange accents, clean retro lines, large windows, warm diffused daylight"
    ),
    "scandavian": (
        "scandinavian interior design, completely refurnished with new scandinavian furniture, new minimalist seating, "
        "light blonde oak furniture, new modern lighting fixtures, soft neutral tones, minimal wabi-sabi elegance, "
        "cozy wool textiles, bright white walls, soft daylight, clutter free serene room"
    ),
    "shabby_chic_style": (
        "shabby chic interior design, completely refurnished with new shabby chic furniture, new vintage slipcovered seating, "
        "distressed painted vintage wood furniture, new chandeliers and lighting fixtures, soft pastel florals, antique lace, "
        "cozy romantic decor, soft warm lighting, charming lived-in French country aesthetic"
    ),
    "victorian": (
        "victorian interior design, completely refurnished with new victorian furniture, tufted jewel tone velvet seating, "
        "ornate crown moldings, dark mahogany woodwork, crystal chandelier and wall sconces, "
        "rich dramatic heritage atmosphere, professional interior photography"
    ),
    "vintage_indian": (
        "vintage Indian haveli interior, completely refurnished with new vintage Indian furniture, new carved seating, "
        "intricate carved jaali woodwork, antique brass artifacts, new heritage brass lantern lighting fixtures, "
        "rich indigo and terracotta hues, ornate teak furniture, traditional block-printed fabrics, heritage palace warmth"
    ),
}

_STYLE_MAP = {
    "scandinavian": "scandavian",
    "scandavian": "scandavian",
    "mid_century_modern": "mid_century",
    "mid-century-modern": "mid_century",
    "mid_century": "mid_century",
    "mid-century": "mid_century",
    "shabby_chic": "shabby_chic_style",
    "shabby-chic": "shabby_chic_style",
    "shabby_chic_style": "shabby_chic_style",
    "contemporary_indian": "contemporary_indian",
    "contemporary-indian": "contemporary_indian",
    "vintage_indian": "vintage_indian",
    "vintage-indian": "vintage_indian",
}


def get_base_style_prompt(style: str = "contemporary_indian", room_type: str = "living_room") -> str:
    """Returns the canonical base style prompt with furniture injection for room_type."""
    norm_style = style.lower().strip().replace(" ", "_") if style else "contemporary_indian"
    resolved_key = _STYLE_MAP.get(norm_style, norm_style)
    base_prompt = DEFAULT_STYLE_PROMPTS.get(
        resolved_key,
        f"high-end interior design photograph of a {norm_style} room, elegant, photorealistic, 8k"
    )
    try:
        from modules.caption_engine import inject_room_furniture_into_prompt
        base_prompt = inject_room_furniture_into_prompt(base_prompt, room_type)
    except Exception:
        pass
    return base_prompt


def _generate_img2img_via_stability(
    init_image,
    positive_prompt: str,
    negative_prompt: str = "",
    image_strength: float = 0.35,
) -> dict:
    if not STABILITY_API_KEY:
        return {"success": False, "image_url": None, "image_b64": None, "error": "No STABILITY_API_KEY set"}

    img_bytes = None
    if isinstance(init_image, bytes):
        img_bytes = init_image
    elif isinstance(init_image, str):
        if os.path.exists(init_image):
            with open(init_image, "rb") as f:
                img_bytes = f.read()
        else:
            try:
                b64_str = init_image.split(",", 1)[1] if "," in init_image else init_image
                img_bytes = base64.b64decode(b64_str)
            except Exception:
                pass
    elif hasattr(init_image, "read"):
        if hasattr(init_image, "seek"):
            init_image.seek(0)
        img_bytes = init_image.read()

    if not img_bytes:
        return {"success": False, "image_url": None, "image_b64": None, "error": "Could not read init_image bytes"}

    headers = {
        "Authorization": f"Bearer {STABILITY_API_KEY}",
        "Accept": "application/json",
    }
    data = {
        "init_image_mode": "IMAGE_STRENGTH",
        "image_strength": float(image_strength),
        "text_prompts[0][text]": positive_prompt,
        "text_prompts[0][weight]": 1.0,
        "cfg_scale": 7.5,
        "samples": 1,
        "steps": 30,
    }
    if negative_prompt:
        data["text_prompts[1][text]"] = negative_prompt
        data["text_prompts[1][weight]"] = -1.0

    files = {"init_image": ("init.jpg", img_bytes, "image/jpeg")}

    try:
        resp = requests.post(
            "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image",
            headers=headers,
            data=data,
            files=files,
            timeout=60,
        )
        if resp.status_code == 200:
            artifacts = resp.json().get("artifacts", [])
            if artifacts:
                return {"success": True, "image_url": None, "image_b64": artifacts[0]["base64"], "error": None}
            return {"success": False, "image_url": None, "image_b64": None, "error": "Stability AI returned no artifacts"}
        else:
            return {"success": False, "image_url": None, "image_b64": None, "error": f"Stability AI error {resp.status_code}: {resp.text[:200]}"}
    except Exception as e:
        return {"success": False, "image_url": None, "image_b64": None, "error": str(e)}


def refine_room_image(
    positive_prompt: str,
    negative_prompt: str = "",
    init_image=None,
    original_image=None,
    instruction: str = "",
    style: str = "contemporary_indian",
    strength: float = 0.35,
    room_type: str = "living_room",
) -> dict:
    """
    Refines a previous generated room image:
    1. Tries Hugging Face Space img2img with strength ~0.3-0.4 (preserves room structure and previous style).
    2. Falls back to Stability AI img2img if STABILITY_API_KEY is available.
    3. Falls back to Pollinations.AI with the refined instruction prompt.
    """
    if init_image and HF_SPACE_ID:
        try:
            from modules.hf_space_client import call_hf_space_refine
            print(f"[Generator] Calling HF Space '{HF_SPACE_ID}' for refinement (strength={strength})...")
            hf_res = call_hf_space_refine(
                space_id=HF_SPACE_ID,
                image_input=init_image,
                style=style,
                instruction=instruction,
                original_image_input=original_image,
                prompt=positive_prompt,
                negative_prompt=negative_prompt,
                strength=strength,
                controlnet_scale=0.45,
                lora_scale=0.80,
                hf_token=HF_API_TOKEN,
            )
            if hf_res.get("success"):
                return {
                    "success": True,
                    "image_url": None,
                    "image_b64": hf_res.get("image_b64"),
                    "image_path": hf_res.get("image_path"),
                    "prompt": positive_prompt,
                    "instruction": instruction,
                    "error": None,
                }
            print(f"[Generator] HF Space refine failed: {hf_res.get('error')}. Trying fallbacks...")
        except Exception as e:
            print(f"[Generator] HF Space refine exception: {e}. Trying fallbacks...")

    if STABILITY_API_KEY and init_image:
        print("[Generator] Trying Stability AI img2img fallback...")
        res = _generate_img2img_via_stability(
            init_image=init_image,
            positive_prompt=positive_prompt,
            negative_prompt=negative_prompt,
            image_strength=strength,
        )
        if res.get("success"):
            res["prompt"] = positive_prompt
            res["instruction"] = instruction
            return res
        print(f"[Generator] Stability AI img2img failed: {res.get('error')}")

    print("[Generator] Trying Pollinations.AI for refinement...")
    result = _generate_via_pollinations(positive_prompt, negative_prompt)
    if result.get("success"):
        result["prompt"] = positive_prompt
        result["instruction"] = instruction
        return result

    return {
        "success": False,
        "image_url": None,
        "image_b64": None,
        "prompt": positive_prompt,
        "instruction": instruction,
        "error": "All refinement generators (HF Space, Stability AI, Pollinations) failed.",
    }