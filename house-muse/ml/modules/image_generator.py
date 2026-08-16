"""
modules/image_generator.py
Primary  : Pollinations.AI  — completely free, no API key needed
Fallback : Stability AI     — free 25 credits/month (optional)
                              get key at platform.stability.ai
                              add STABILITY_API_KEY=sk-xxx to backend/.env
"""

import os
import time
import base64
import requests
from urllib.parse import quote

# ── Credentials (Pollinations needs none) ─────────────────────────────────────
STABILITY_API_KEY = os.environ.get("STABILITY_API_KEY", "").strip()

if not STABILITY_API_KEY:
    print("[Generator] INFO: STABILITY_API_KEY not set — Stability AI fallback disabled.")
    print("[Generator] INFO: Using Pollinations.AI as sole backend (no key required).")

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
def generate_room_image(positive_prompt: str, negative_prompt: str = "") -> dict:
    """
    1. Try Pollinations.AI first  — free, no key, good quality
    2. Fall back to Stability AI  — free 25 credits/month, needs STABILITY_API_KEY
    """
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
        result    = generate_room_image(extra_pos, negative_prompt)
        result["variant"]       = i + 1
        result["variant_label"] = label
        results.append(result)
        if i < n_variants - 1:
            time.sleep(3)
    return results