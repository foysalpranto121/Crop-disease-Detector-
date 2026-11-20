"""Upload validation (FR-02): file type, size, decode safety, darkness/brightness, blur, and a 'looks like a plant' check."""

from __future__ import annotations

from io import BytesIO

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

ALLOWED_FORMATS = {"JPEG", "MPO", "PNG", "WEBP"}  # MPO = JPEG variant some phone cameras write
MIN_SIDE = 64
MAX_PIXELS = 40_000_000  # decompression-bomb guard (~40 MP)
DARK_MEAN, BRIGHT_MEAN = 22.0, 240.0
# Variance of the Laplacian: heavily blurred leaves score ~2, sharp ones 100-5000, soft-but-usable ~13+.
BLUR_VARIANCE = 6.0
MIN_GREEN_RATIO = 0.03  # skin and bare soil are leaf-coloured but have no green at all


class ImageRejected(Exception):
    def __init__(self, reason: str, message: str, status: int = 422) -> None:
        super().__init__(message)
        self.reason, self.message, self.status = reason, message, status


def load_image(data: bytes, max_bytes: int) -> Image.Image:
    if len(data) > max_bytes:
        raise ImageRejected("FILE_TOO_LARGE", f"Image larger than {max_bytes // (1024 * 1024)} MB", 413)
    try:
        probe = Image.open(BytesIO(data))
        fmt = probe.format
        if probe.width * probe.height > MAX_PIXELS:
            raise ImageRejected("FILE_TOO_LARGE", "Image resolution is too large", 413)
        probe.verify()
    except ImageRejected:
        raise
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError) as e:
        raise ImageRejected("UNSUPPORTED_FORMAT", "The file is not a readable image") from e
    if fmt not in ALLOWED_FORMATS:
        raise ImageRejected("UNSUPPORTED_FORMAT", "Use a JPEG, PNG or WebP photo")

    img = ImageOps.exif_transpose(Image.open(BytesIO(data))).convert("RGB")  # fix phone rotation
    if min(img.size) < MIN_SIDE:
        raise ImageRejected("TOO_SMALL", "The photo is too small")
    return img


def _gray(img: Image.Image) -> np.ndarray:
    small = img.copy()
    small.thumbnail((512, 512))
    return np.asarray(small.convert("L"), dtype=np.float32)


def blur_score(img: Image.Image) -> float:
    g = _gray(img)
    lap = g[:-2, 1:-1] + g[2:, 1:-1] + g[1:-1, :-2] + g[1:-1, 2:] - 4 * g[1:-1, 1:-1]
    return float(lap.var())


def check_quality(img: Image.Image) -> None:
    mean = float(_gray(img).mean())
    if mean < DARK_MEAN:
        raise ImageRejected("TOO_DARK", "The photo is too dark")
    if mean > BRIGHT_MEAN:
        raise ImageRejected("TOO_BRIGHT", "The photo is too bright")
    if blur_score(img) < BLUR_VARIANCE:
        raise ImageRejected("TOO_BLURRY", "The photo is too blurry")


def colour_ratios(img: Image.Image) -> tuple[float, float]:
    """(leafy, green): share of leaf-coloured pixels (green/yellow/brown) and of clearly green pixels."""
    hsv = np.asarray(img.resize((128, 128)).convert("HSV"), dtype=np.float32)
    h, s, v = hsv[..., 0] * (360 / 255), hsv[..., 1], hsv[..., 2]
    saturated = (s >= 40) & (v >= 35)
    leafy = saturated & (h >= 15) & (h <= 170)
    green = saturated & (h >= 50) & (h <= 170)
    return float(leafy.mean()), float(green.mean())


def looks_like_plant(img: Image.Image, min_leafy: float) -> bool:
    """Heuristic only: the model has no 'not a leaf' class, so obvious non-plant photos are caught here."""
    leafy, green = colour_ratios(img)
    return leafy >= min_leafy and green >= MIN_GREEN_RATIO
