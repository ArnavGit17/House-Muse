"""
modules/hf_space_client.py — Programmatic Client for Hugging Face ZeroGPU Space

Usage in Flask / image_generator.py:
    from modules.hf_space_client import call_hf_space_redesign

    result = call_hf_space_redesign(
        space_id="your-username/house-muse-interior-sdxl",
        image_input="path/to/room.jpg", # or PIL.Image, or bytes
        style="contemporary_indian",
        hf_token=os.getenv("HF_API_TOKEN"),
    )
    # result["image_b64"], result["image_path"], result["success"]
"""

import os
import io
import base64
import tempfile
from typing import Optional, Dict, Any, Union
from PIL import Image

try:
    from gradio_client import Client, handle_file
except ImportError:
    Client = None
    handle_file = None


def call_hf_space_redesign(
    space_id: str,
    image_input: Union[str, bytes, Image.Image],
    style: str = "contemporary_indian",
    prompt: str = "",
    negative_prompt: str = "",
    controlnet_scale: float = 0.70,
    lora_scale: float = 0.80,
    num_inference_steps: int = 30,
    guidance_scale: float = 7.5,
    seed: int = -1,
    hf_token: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Calls the Hugging Face Space via gradio_client.

    IMPORTANT FOR ZEROGPU QUOTA:
    Passing `hf_token` (Hugging Face User Access Token) charges the ZeroGPU compute
    to the CALLER'S Hugging Face account quota, rather than the Space owner's quota.
    """
    if Client is None:
        raise ImportError(
            "gradio_client is not installed. Install it with: pip install gradio_client"
        )

    # 1. Resolve HF Token
    token = hf_token or os.environ.get("HF_API_TOKEN") or os.environ.get("HF_TOKEN")

    # 2. Convert input into a local file path that handle_file() can upload
    temp_file_path = None
    try:
        if isinstance(image_input, str) and os.path.exists(image_input):
            target_path = image_input
        else:
            if isinstance(image_input, str):
                # Assume base64 string
                if "," in image_input:
                    image_input = image_input.split(",", 1)[1]
                img_bytes = base64.b64decode(image_input)
                pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            elif isinstance(image_input, bytes):
                pil_img = Image.open(io.BytesIO(image_input)).convert("RGB")
            elif isinstance(image_input, Image.Image):
                pil_img = image_input.convert("RGB")
            else:
                raise ValueError(f"Unsupported image input type: {type(image_input)}")

            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                pil_img.save(tmp.name, format="JPEG", quality=92)
                target_path = tmp.name
                temp_file_path = tmp.name

        # 3. Instantiate Gradio Client (passing token authenticates caller with ZeroGPU)
        try:
            client = Client(space_id, token=token, httpx_kwargs={"timeout": 300.0})
        except TypeError:
            try:
                client = Client(space_id, token=token)
            except TypeError:
                client = Client(space_id, hf_token=token)

        # 4. Invoke the /redesign API
        result = client.predict(
            image=handle_file(target_path),
            style=style,
            prompt=prompt,
            negative_prompt=negative_prompt,
            controlnet_scale=float(controlnet_scale),
            lora_scale=float(lora_scale),
            num_inference_steps=int(num_inference_steps),
            guidance_scale=float(guidance_scale),
            seed=int(seed),
            api_name="/redesign",
        )

        output_image_path, status_text = result

        # 5. Read resulting image and convert to base64 for Flask / frontend
        with open(output_image_path, "rb") as f:
            out_bytes = f.read()
        out_b64 = base64.b64encode(out_bytes).decode("utf-8")

        return {
            "success": True,
            "image_path": output_image_path,
            "image_b64": out_b64,
            "style": style,
            "status": status_text,
            "error": None,
        }

    except Exception as e:
        return {
            "success": False,
            "image_path": None,
            "image_b64": None,
            "style": style,
            "status": None,
            "error": str(e),
        }
    finally:
        # Cleanup temporary input file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except OSError:
                pass
