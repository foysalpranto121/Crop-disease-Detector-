"""One-time export of the pre-trained Hugging Face model to ONNX.

Run with a Python environment that has: torch, transformers, onnx, onnxruntime, pillow, numpy
(the API itself only needs onnxruntime):

    python backend/scripts/export_model.py --samples backend/tests/fixtures

Writes backend/model/plant_disease_mobilenetv2.onnx, labels.json and model_info.json,
then checks that ONNX Runtime + our numpy preprocessing gives the same answers as the
original PyTorch model + Hugging Face image processor.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
from app.ml.preprocess import preprocess  # noqa: E402  (shared with the API)

MODEL_ID = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"
OUT_DIR = BACKEND / "model"
ONNX_NAME = "plant_disease_mobilenetv2.onnx"


class LogitsOnly(torch.nn.Module):
    """Wrap the HF model so the ONNX graph has one plain tensor output."""

    def __init__(self, model: torch.nn.Module) -> None:
        super().__init__()
        self.model = model

    def forward(self, pixel_values: torch.Tensor) -> torch.Tensor:
        return self.model(pixel_values=pixel_values).logits


def export(model: torch.nn.Module, path: Path) -> None:
    wrapped = LogitsOnly(model).eval()
    dummy = torch.zeros(1, 3, 224, 224)
    kwargs = dict(input_names=["pixel_values"], output_names=["logits"], dynamic_axes={"pixel_values": {0: "batch"}, "logits": {0: "batch"}}, opset_version=17)
    try:
        torch.onnx.export(wrapped, (dummy,), str(path), dynamo=False, **kwargs)
    except Exception as e:  # newer torch may only ship the dynamo exporter
        print(f"TorchScript exporter unavailable ({type(e).__name__}); using dynamo exporter")
        torch.onnx.export(wrapped, (dummy,), str(path), dynamo=True, input_names=["pixel_values"], output_names=["logits"], opset_version=18)


def softmax(x: np.ndarray) -> np.ndarray:
    e = np.exp(x - x.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--samples", type=Path, help="folder of sample leaf images for the parity check")
    args = parser.parse_args()

    OUT_DIR.mkdir(exist_ok=True)
    print(f"Downloading {MODEL_ID} …")
    model = AutoModelForImageClassification.from_pretrained(MODEL_ID).eval()
    try:
        processor = AutoImageProcessor.from_pretrained(MODEL_ID)
    except ValueError:
        # The model card uses the old "MobileNetV2FeatureExtractor" name, which transformers v5 no longer maps.
        from transformers import MobileNetV2ImageProcessor

        processor = MobileNetV2ImageProcessor.from_pretrained(MODEL_ID)

    onnx_path = OUT_DIR / ONNX_NAME
    export(model, onnx_path)
    # Some exporters write weights to a side file; fold them back in so the model is one file.
    import onnx

    proto = onnx.load(str(onnx_path), load_external_data=True)
    onnx.checker.check_model(proto)
    onnx.save_model(proto, str(onnx_path), save_as_external_data=False)
    for extra in OUT_DIR.glob(f"{ONNX_NAME}.data"):
        extra.unlink()

    labels = [model.config.id2label[i] for i in range(model.config.num_labels)]
    (OUT_DIR / "labels.json").write_text(json.dumps(labels, indent=2), encoding="utf-8")

    sha256 = hashlib.sha256(onnx_path.read_bytes()).hexdigest()
    info = {
        "model_id": MODEL_ID,
        "version": "mobilenet_v2-plantvillage-1.0",
        "architecture": "MobileNetV2 (1.0, 224) fine-tuned on PlantVillage (38 classes)",
        "reported_accuracy": 0.9541,
        "source": f"https://huggingface.co/{MODEL_ID}",
        "license": "see model card (license: other)",
        "file": ONNX_NAME,
        "sha256": sha256,
        "size_bytes": onnx_path.stat().st_size,
        "num_classes": len(labels),
        "preprocessing": {"resize_shortest_edge": 256, "crop": 224, "mean": [0.5, 0.5, 0.5], "std": [0.5, 0.5, 0.5]},
    }
    (OUT_DIR / "model_info.json").write_text(json.dumps(info, indent=2), encoding="utf-8")
    print(f"Saved {onnx_path.name} ({info['size_bytes'] / 1e6:.1f} MB), {len(labels)} labels")

    # ---- Parity check: ONNX + our preprocessing vs PyTorch + HF processor ----
    session = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
    images = sorted(p for p in (args.samples.glob("*") if args.samples else []) if p.suffix.lower() in {".jpg", ".jpeg", ".png"})
    if not images:
        x = np.random.default_rng(0).standard_normal((1, 3, 224, 224)).astype(np.float32)
        with torch.no_grad():
            ref = model(pixel_values=torch.from_numpy(x)).logits.numpy()
        got = session.run(None, {"pixel_values": x})[0]
        print(f"Random-input check: max |diff| = {np.abs(ref - got).max():.2e}")
        return

    worst_logit, worst_prob, agree = 0.0, 0.0, 0
    for path in images:
        img = Image.open(path).convert("RGB")
        hf = processor(images=img, return_tensors="pt")["pixel_values"]
        with torch.no_grad():
            ref = model(pixel_values=hf).logits.numpy()
        got = session.run(None, {"pixel_values": preprocess(img)})[0]
        p_ref, p_got = softmax(ref)[0], softmax(got)[0]
        worst_logit = max(worst_logit, float(np.abs(ref - got).max()))
        worst_prob = max(worst_prob, float(np.abs(p_ref - p_got).max()))
        same = int(p_ref.argmax()) == int(p_got.argmax())
        agree += same
        print(f"  {path.name:42s} -> {labels[int(p_got.argmax())]:45s} {p_got.max():.3f}  {'OK' if same else 'MISMATCH'}")
    print(f"Parity: top-1 agreement {agree}/{len(images)}, max |logit diff| {worst_logit:.3e}, max |prob diff| {worst_prob:.3e}")
    if agree != len(images):
        sys.exit("Parity check FAILED")


if __name__ == "__main__":
    main()
