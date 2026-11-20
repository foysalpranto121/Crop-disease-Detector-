"""Download 3 reference photos per disease class from the PlantVillage dataset (the model's own training source).

    backend/.venv/Scripts/python backend/scripts/fetch_disease_images.py

Writes frontend/public/diseases/<slug>-<n>.jpg (re-encoded, metadata stripped) and manifest.json.
Photos: PlantVillage dataset — Hughes, D. P. & Salathé, M. (2015), arXiv:1511.08060
(github.com/spMohanty/PlantVillage-Dataset). The repository has no license file; it asks users to cite the paper.
"""

from __future__ import annotations

import io
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "frontend" / "public" / "diseases"
LABELS = json.loads((ROOT / "backend" / "model" / "labels.json").read_text(encoding="utf-8"))
REPO = "spMohanty/PlantVillage-Dataset"
API = f"https://api.github.com/repos/{REPO}"
RAW = f"https://raw.githubusercontent.com/{REPO}/master/raw/color"
PER_CLASS = 3

# Model label (index order) -> PlantVillage folder name
FOLDERS = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_", "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy", "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy", "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy", "Potato___Early_blight", "Potato___Late_blight",
    "Potato___healthy", "Raspberry___healthy", "Soybean___healthy", "Squash___Powdery_mildew", "Strawberry___Leaf_scorch",
    "Strawberry___healthy", "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight", "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus", "Tomato___healthy",
]


def slugify(label: str) -> str:
    """Must match slugify() in frontend/src/lib/diseaseImages.ts and backend/app/serializers.py."""
    return re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")


def get_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "crop-disease-detector-setup", "Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def main() -> None:
    assert len(FOLDERS) == len(LABELS) == 38
    OUT.mkdir(parents=True, exist_ok=True)

    files: dict[str, list[str]] = {}
    if len(sys.argv) > 2 and sys.argv[1] == "--listing":
        # No API needed: a file list made with
        #   git clone --filter=blob:none --no-checkout --depth 1 https://github.com/spMohanty/PlantVillage-Dataset.git pv
        #   git -C pv ls-tree -r --name-only HEAD raw/color > listing.txt
        for line in Path(sys.argv[2]).read_text(encoding="utf-8-sig").splitlines():
            parts = line.strip().split("/")
            if len(parts) == 4 and parts[:2] == ["raw", "color"]:
                files.setdefault(parts[2], []).append(parts[3])
    else:
        # ~40 API calls (unauthenticated limit is 60/hour): raw/ -> color/ -> one listing per class folder.
        # (A single recursive listing of all ~54k files makes GitHub return HTTP 500.)
        raw_dir = get_json(f"{API}/contents/raw")
        color_sha = next(e["sha"] for e in raw_dir if e["name"] == "color")
        folder_sha = {e["path"]: e["sha"] for e in get_json(f"{API}/git/trees/{color_sha}")["tree"] if e["type"] == "tree"}
        for folder in FOLDERS:
            if folder not in folder_sha:
                sys.exit(f"Folder not found in dataset: {folder}")
            files[folder] = [e["path"] for e in get_json(f"{API}/git/trees/{folder_sha[folder]}")["tree"] if e["type"] == "blob"]

    manifest: dict[str, list[str]] = {}
    for label, folder in zip(LABELS, FOLDERS):
        names = sorted(n for n in files.get(folder, []) if n.lower().endswith((".jpg", ".jpeg", ".png")))
        if len(names) < PER_CLASS:
            sys.exit(f"Not enough images for {folder}")
        # Spread across the folder for variety, never the first file (tests/fixtures uses the first file of
        # each folder — a reference photo identical to the uploaded test photo would look like copying).
        picks = [names[int((i + 0.5) * len(names) / PER_CLASS)] for i in range(PER_CLASS)]
        slug = slugify(label)
        manifest[slug] = []
        for n, name in enumerate(picks, 1):
            url = f"{RAW}/{urllib.parse.quote(folder)}/{urllib.parse.quote(name)}"
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "crop-disease-detector-setup"}), timeout=60) as r:
                img = Image.open(io.BytesIO(r.read())).convert("RGB")
            img.thumbnail((320, 320))
            out_name = f"{slug}-{n}.jpg"
            img.save(OUT / out_name, "JPEG", quality=82, optimize=True, progressive=True)  # re-encode drops metadata
            manifest[slug].append(f"/diseases/{out_name}")
        print(f"{label:52s} {len(files[folder]):5d} photos in dataset -> {', '.join(manifest[slug])}")

    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    total = sum(p.stat().st_size for p in OUT.glob("*.jpg"))
    print(f"\nSaved {sum(len(v) for v in manifest.values())} photos ({total / 1e6:.2f} MB) to {OUT}")


if __name__ == "__main__":
    main()
