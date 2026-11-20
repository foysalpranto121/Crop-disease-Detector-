"""Image preprocessing for the pre-trained MobileNetV2 plant-disease model.

Matches the model's Hugging Face preprocessor_config.json exactly:
  resize so the SHORTEST edge is 256 (bilinear) -> centre-crop 224x224 -> scale to [0,1]
  -> normalise with mean 0.5 / std 0.5 -> NCHW float32.
Used by both the API (app/ml/inference.py) and scripts/export_model.py (parity check),
so training-time and serving-time preprocessing can never drift apart.
"""

from __future__ import annotations

import numpy as np
from PIL import Image

RESIZE_SHORTEST_EDGE = 256
CROP_SIZE = 224
MEAN = np.array([0.5, 0.5, 0.5], dtype=np.float32)
STD = np.array([0.5, 0.5, 0.5], dtype=np.float32)


def resize_and_crop(img: Image.Image) -> Image.Image:
    img = img.convert("RGB")
    w, h = img.size
    if w <= h:
        new_w, new_h = RESIZE_SHORTEST_EDGE, int(RESIZE_SHORTEST_EDGE * h / w)
    else:
        new_w, new_h = int(RESIZE_SHORTEST_EDGE * w / h), RESIZE_SHORTEST_EDGE
    img = img.resize((new_w, new_h), Image.Resampling.BILINEAR)
    left = (new_w - CROP_SIZE) // 2
    top = (new_h - CROP_SIZE) // 2
    return img.crop((left, top, left + CROP_SIZE, top + CROP_SIZE))


def preprocess(img: Image.Image) -> np.ndarray:
    """PIL image -> float32 array of shape [1, 3, 224, 224]."""
    arr = np.asarray(resize_and_crop(img), dtype=np.float32) / 255.0
    arr = (arr - MEAN) / STD
    return np.ascontiguousarray(arr.transpose(2, 0, 1)[None], dtype=np.float32)
