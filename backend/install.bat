@echo off
echo ── House Muse Install Script (Windows) ──

python --version

echo.
echo Step 1: Upgrading pip and base tools...
python -m pip install --upgrade pip setuptools wheel

echo.
echo Step 2: Installing core requirements...
pip install -r requirements.txt

echo.
echo Step 3: Installing SAM (Segment Anything)...
pip install git+https://github.com/facebookresearch/segment-anything.git

echo.
echo Step 4: Installing CLIP...
pip install git+https://github.com/openai/CLIP.git

echo.
echo Step 5: Downloading SAM weights...
if not exist models mkdir models
curl -L "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth" -o models/sam_vit_b_01ec64.pth

echo.
echo Done! Run: python app.py
pause
