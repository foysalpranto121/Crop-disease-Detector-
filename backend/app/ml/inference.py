"""ONNX Runtime wrapper for every crop model (main PlantVillage model + specialist crop models)."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

from app.ml.preprocess import preprocess, preprocess_with


@dataclass(frozen=True)
class ClassScore:
    index: int
    label: str
    probability: float


class Classifier:
    def __init__(self, model_dir: Path) -> None:
        info = json.loads((model_dir / "model_info.json").read_text(encoding="utf-8"))
        self.labels: list[str] = json.loads((model_dir / "labels.json").read_text(encoding="utf-8"))
        self.version: str = info["version"]
        self.prep: dict | None = info.get("preprocessing") if "mode" in info.get("preprocessing", {}) else None
        self.outputs_probs = info.get("output") == "probs"
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 2  # small models: more threads add overhead on a shared server
        self.session = ort.InferenceSession(str(model_dir / info["file"]), sess_options=opts, providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name

    def probabilities(self, img: Image.Image) -> np.ndarray:
        x = preprocess_with(img, self.prep) if self.prep else preprocess(img)
        out = self.session.run(None, {self.input_name: x})[0][0].astype(np.float64)
        if self.outputs_probs:
            return out / out.sum()
        exp = np.exp(out - out.max())
        return exp / exp.sum()

    def predict(self, img: Image.Image, top_k: int = 3, allowed: list[int] | None = None) -> list[ClassScore]:
        """Top-k classes. `allowed` restricts the answer to some classes (e.g. one crop) and renormalises."""
        probs = self.probabilities(img)
        if allowed:
            mask = np.zeros_like(probs)
            mask[allowed] = 1.0
            probs = probs * mask
            total = probs.sum()
            probs = probs / total if total > 0 else mask / mask.sum()
        order = [int(i) for i in np.argsort(probs)[::-1] if not allowed or int(i) in allowed][:top_k]
        return [ClassScore(index=i, label=self.labels[i], probability=float(probs[i])) for i in order]
