---
title: House Muse Interior Redesign
emoji: 🏠
colorFrom: blue
colorTo: purple
sdk: gradio
sdk_version: 5.20.0
app_file: app.py
pinned: false
license: apache-2.0
hardware: zerogpu
---

# House Muse — AI Interior Redesign (SDXL + Depth ControlNet + LoRA)

A high-fidelity interior redesign service powered by:
- **Stable Diffusion XL (SDXL 1.0)** base model
- **ControlNet Depth** with Depth-Anything geometry extraction to preserve walls, floor, windows, and spatial proportions
- **9 Custom Style LoRA Adapters** for targeted interior aesthetics (Coastal, Contemporary Indian, Eclectic, Industrial, Mid-Century Modern, Scandinavian, Shabby Chic, Victorian, and Vintage Indian)
- **Hugging Face ZeroGPU** serverless acceleration (A100 dynamic allocation)

## API Usage via `gradio_client`

You can call this Space programmatically from any Python backend (e.g. Flask, FastAPI, Django):

```python
from gradio_client import Client, handle_file

# Pass your Hugging Face User Access Token so ZeroGPU quota is debited to your account
client = Client("your-username/house-muse-interior-sdxl", hf_token="hf_yourUserTokenHere")

result_image_path, status = client.predict(
    image=handle_file("path/to/user_room.jpg"),
    style="contemporary_indian",
    prompt="",
    negative_prompt="",
    controlnet_scale=0.70,
    lora_scale=0.80,
    num_inference_steps=30,
    guidance_scale=7.5,
    seed=-1,
    api_name="/redesign",
)

print(f"Generated room image saved at: {result_image_path}")
```
