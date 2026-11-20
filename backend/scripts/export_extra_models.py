"""One-time export of the extra crop models (rice, wheat, soybean, jute) to ONNX.

    <python with torch, transformers, timm, ultralytics, onnx, onnxruntime> backend/scripts/export_extra_models.py

Writes backend/model/<key>/{model.onnx, labels.json, model_info.json}. Each model_info.json records the exact
preprocessing the model expects, so the API can prepare photos the same way the model was trained.
"""

from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort
import torch
from huggingface_hub import hf_hub_download

OUT = Path(__file__).resolve().parents[1] / "model"


class LogitsOnly(torch.nn.Module):
    def __init__(self, model: torch.nn.Module) -> None:
        super().__init__()
        self.model = model

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = self.model(x)
        return out.logits if hasattr(out, "logits") else out


def torch_to_onnx(model: torch.nn.Module, path: Path, size: int) -> None:
    dummy = torch.zeros(1, 3, size, size)
    torch.onnx.export(LogitsOnly(model).eval(), (dummy,), str(path), input_names=["pixel_values"], output_names=["logits"], opset_version=17, dynamo=False)


def finish(key: str, onnx_path: Path, labels: list[str], info: dict, quantize: bool, reference: torch.nn.Module | None, size: int) -> None:
    proto = onnx.load(str(onnx_path), load_external_data=True)
    onnx.checker.check_model(proto)
    onnx.save_model(proto, str(onnx_path), save_as_external_data=False)
    for extra in onnx_path.parent.glob("*.data"):
        extra.unlink()

    # Parity on a random input: ONNX (before quantization) vs PyTorch
    if reference is not None:
        x = np.random.default_rng(0).standard_normal((1, 3, size, size)).astype(np.float32)
        with torch.no_grad():
            ref = LogitsOnly(reference).eval()(torch.from_numpy(x)).numpy()
        got = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"]).run(None, {"pixel_values": x})[0]
        print(f"  [{key}] parity fp32: max |diff| {np.abs(ref - got).max():.2e}, same top-1: {ref.argmax() == got.argmax()}")

    if quantize:  # big transformer/convnet -> int8 weights (~4x smaller, CPU friendly)
        from onnxruntime.quantization import QuantType, quantize_dynamic

        q = onnx_path.with_name("model.int8.onnx")
        quantize_dynamic(str(onnx_path), str(q), weight_type=QuantType.QInt8)
        onnx_path.unlink()
        q.rename(onnx_path)

    (onnx_path.parent / "labels.json").write_text(json.dumps(labels, indent=2, ensure_ascii=False), encoding="utf-8")
    info |= {
        "file": "model.onnx",
        "num_classes": len(labels),
        "size_bytes": onnx_path.stat().st_size,
        "sha256": hashlib.sha256(onnx_path.read_bytes()).hexdigest(),
        "quantized": quantize,
    }
    (onnx_path.parent / "model_info.json").write_text(json.dumps(info, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  [{key}] saved {onnx_path.stat().st_size / 1e6:.1f} MB, {len(labels)} labels")


def export_rice() -> None:
    from ultralytics import YOLO

    key, repo = "rice", "Shaq2/chashibhai-rice-disease-cls"
    d = OUT / key
    d.mkdir(parents=True, exist_ok=True)
    pt = Path(hf_hub_download(repo, "best.pt"))
    work = d / "best.pt"
    shutil.copy(pt, work)
    model = YOLO(str(work))
    imgsz = int(model.model.args.get("imgsz", 640)) if hasattr(model.model, "args") else 640
    exported = Path(model.export(format="onnx", imgsz=imgsz, opset=17, dynamic=False, simplify=False))
    onnx_path = d / "model.onnx"
    shutil.move(str(exported), onnx_path)
    work.unlink()
    labels = [model.names[i] for i in range(len(model.names))]
    info = {
        "model_id": repo,
        "version": "rice-yolo26cls-1.0",
        "source": f"https://huggingface.co/{repo}",
        "license": "MIT",
        "reported_metric": "see model card",
        "output": "probs",  # YOLO classification ONNX already outputs softmax probabilities
        "preprocessing": {"mode": "shortest_crop", "resize": imgsz, "crop": imgsz, "mean": [0, 0, 0], "std": [1, 1, 1]},
    }
    finish(key, onnx_path, labels, info, quantize=False, reference=None, size=imgsz)


def export_hf(key: str, repo: str, version: str, license_: str, metric: str, quantize: bool) -> None:
    from transformers import AutoImageProcessor, AutoModelForImageClassification

    d = OUT / key
    d.mkdir(parents=True, exist_ok=True)
    model = AutoModelForImageClassification.from_pretrained(repo).eval()
    try:
        proc = AutoImageProcessor.from_pretrained(repo)
    except ValueError:
        from transformers import MobileNetV2ImageProcessor

        proc = MobileNetV2ImageProcessor.from_pretrained(repo)
    size = proc.size
    crop = getattr(proc, "crop_size", None)
    if "shortest_edge" in size:
        prep = {"mode": "shortest_crop", "resize": size["shortest_edge"], "crop": (crop or {}).get("height", size["shortest_edge"])}
    else:
        prep = {"mode": "square", "resize": size["height"], "crop": size["height"]}
    prep |= {"mean": list(proc.image_mean), "std": list(proc.image_std)}
    onnx_path = d / "model.onnx"
    torch_to_onnx(model, onnx_path, prep["crop"])
    labels = [model.config.id2label[i] for i in range(model.config.num_labels)]
    info = {"model_id": repo, "version": version, "source": f"https://huggingface.co/{repo}", "license": license_, "reported_metric": metric, "output": "logits", "preprocessing": prep}
    finish(key, onnx_path, labels, info, quantize=quantize, reference=model, size=prep["crop"])


def export_soybean() -> None:
    import timm

    key, repo = "soybean", "ixrbhii/soybean-disease-convnext"
    d = OUT / key
    d.mkdir(parents=True, exist_ok=True)
    model = timm.create_model(f"hf-hub:{repo}", pretrained=True).float().eval()
    cfg = timm.data.resolve_data_config({}, model=model)
    size = cfg["input_size"][1]
    prep = {"mode": "shortest_crop", "resize": int(round(size / cfg.get("crop_pct", 1.0))), "crop": size, "mean": list(cfg["mean"]), "std": list(cfg["std"])}
    onnx_path = d / "model.onnx"
    torch_to_onnx(model, onnx_path, size)
    labels = list(model.pretrained_cfg.get("label_names") or json.loads(Path(hf_hub_download(repo, "config.json")).read_text())["label_names"])
    info = {"model_id": repo, "version": "soybean-convnext-1.0", "source": f"https://huggingface.co/{repo}", "license": "CC-BY-4.0", "reported_metric": "91.7% test accuracy, macro-F1 0.881", "output": "logits", "preprocessing": prep}
    finish(key, onnx_path, labels, info, quantize=True, reference=model, size=size)


if __name__ == "__main__":
    print("rice ...")
    export_rice()
    print("wheat (Indian crop model, wheat classes used) ...")
    export_hf("india", "sanjeevani-04/indian-crop-disease-mobilenetv2", "india-crops-mobilenetv2-1.0", "see model card (other)", "97.3% accuracy, macro-F1 0.890", quantize=False)
    print("soybean ...")
    export_soybean()
    print("jute pests ...")
    export_hf("jute", "dimasichsanul/jute_pest_classification", "jute-pest-vit-1.0", "Apache-2.0", "F1 0.982 (Jute Pest dataset, UCI)", quantize=True)
