# deploy_space.py
from huggingface_hub import HfApi
import os, sys

token = os.getenv("HF_API_TOKEN")
if not token:
    sys.exit("HF_API_TOKEN is not set in this window")

api = HfApi(token=token)
print("Logged in as:", api.whoami()["name"])

for f in ["app.py", "requirements.txt", "README.md"]:
    api.upload_file(
        path_or_fileobj=f,
        path_in_repo=f,
        repo_id="arnav1711/house-muse-interior-sdxl",
        repo_type="space",
    )
    print("uploaded", f)