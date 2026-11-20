"""Download reference photos for the specialist crop classes (rice, soybean) from public Hugging Face datasets.

    python backend/scripts/fetch_extra_photos.py

Writes frontend/public/diseases/<slug>-<n>.jpg (re-encoded, metadata stripped) and merges the entries into
manifest.json. Classes without a public photo source are skipped (the UI then shows an icon instead).
"""

from __future__ import annotations

import io
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "frontend" / "public" / "diseases"
API = "https://datasets-server.huggingface.co"
HEADERS = {"User-Agent": "crop-disease-detector-setup"}
PER_CLASS = 3

# dataset -> {dataset label name: our class_label}
SOURCES = {
    "Project-AgML/rice_leaf_disease_classification": {
        "Bacterial_Leaf_Blight": "rice:Rice__Bacterial_Leaf_Blight",
        "Brown_Spot": "rice:Rice__Brown_Spot",
        "Healthy_Rice_Leaf": "rice:Rice__Healthy_Leaf",
        "Leaf_Blast": "rice:Rice__Leaf_Blast",
        "Leaf_Scald": "rice:Rice__Leaf_Scald",
        "Sheath_Blight": "rice:Rice__Sheath_Blight",
    },
    "Project-AgML/rice_leaf_disease_classification_bd": {"narrow_brown_spot": "rice:Rice__Narrow_Brown_Leaf_Spot"},
    "anandvermagmailcom/soybean-leaf-diseases": {
        "Frogeye": "soybean:Frogeye Leaf Spot",
        "Healthy": "soybean:Healthy",
        "Soyabean_rust": "soybean:Rust",
    },
    "Project-AgML/soybean_leaf_disease_classification": {"Septoria_Brown_Spot": "soybean:Septoria Brown Spot"},
}


def slugify(label: str) -> str:
    """Must match backend/app/serializers.py and frontend/src/lib/diseaseImages.ts."""
    return re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")


def get(url: str) -> bytes:
    for attempt in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=60) as r:
                return r.read()
        except Exception:  # noqa: BLE001 — the dataset server is flaky (502s)
            if attempt == 4:
                raise
            time.sleep(3 * (attempt + 1))
    raise AssertionError


def rows(dataset: str, offset: int, length: int) -> list[dict]:
    q = urllib.parse.urlencode({"dataset": dataset, "config": "default", "split": "train", "offset": offset, "length": length})
    return json.loads(get(f"{API}/rows?{q}"))["rows"]


def fetch(dataset: str, wanted: dict[str, str], manifest: dict[str, list[str]]) -> None:
    info = json.loads(get(f"{API}/info?{urllib.parse.urlencode({'dataset': dataset})}"))["dataset_info"]
    info = info.get("default", info)
    feats = info["features"]
    label_key = next(k for k, v in feats.items() if v.get("_type") == "ClassLabel")
    image_key = next(k for k, v in feats.items() if v.get("_type") == "Image")
    names = feats[label_key]["names"]
    n = info["splits"]["train"]["num_examples"]

    # Sample the whole split evenly; spread the picks so the 3 photos are not near-duplicates.
    found: dict[str, list[str]] = {name: [] for name in wanted}
    step = max(4, n // 60)
    for off in range(0, n, step):
        for r in rows(dataset, off, 4):
            name = names[r["row"][label_key]]
            if name in found:
                found[name].append(r["row"][image_key]["src"])
    for name, class_label in wanted.items():
        srcs = found[name]
        if not srcs:
            print(f"  {class_label}: no photos found")
            continue
        picks = [srcs[int((i + 0.5) * len(srcs) / PER_CLASS)] for i in range(min(PER_CLASS, len(srcs)))]
        slug = slugify(class_label)
        manifest[slug] = []
        for i, src in enumerate(picks, start=1):
            img = Image.open(io.BytesIO(get(src))).convert("RGB")
            img.thumbnail((320, 320))
            out = f"{slug}-{i}.jpg"
            img.save(OUT / out, "JPEG", quality=82, optimize=True, progressive=True)  # re-encode drops metadata
            manifest[slug].append(f"/diseases/{out}")
        print(f"  {class_label:40s} <- {dataset} '{name}': {len(manifest[slug])} photos")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest_path = OUT / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.is_file() else {}
    for dataset, wanted in SOURCES.items():
        print(dataset)
        fetch(dataset, wanted, manifest)
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
