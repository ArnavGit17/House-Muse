import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from modules.hf_space_client import call_hf_space_redesign

BASE_DIR = Path(__file__).resolve().parent
test_image = BASE_DIR / ".." / "frontend" / "public" / "manus-storage" / "p1.jpeg"
if not test_image.exists():
    test_image = BASE_DIR / "path" / "to" / "unfurnished-room.jpg"

space_id = os.getenv("HF_SPACE_ID", "arnav1711/house-muse-interior-sdxl")
hf_token = os.getenv("HF_API_TOKEN")

print(f"Testing HF Space: {space_id}")
print(f"Using image: {test_image}")

response = call_hf_space_redesign(
    space_id=space_id,
    image_input=str(test_image),
    style="coastal",
    controlnet_scale=0.70,
    lora_scale=0.80,
    num_inference_steps=30,
    hf_token=hf_token,
)

if response["success"]:
    image_base64 = response["image_b64"]
    output_path = response["image_path"]
    print(f"Room redesigned in {response['style']}!")
    print(f"Output saved to: {output_path}")
else:
    print(f"Generation failed: {response['error']}")
