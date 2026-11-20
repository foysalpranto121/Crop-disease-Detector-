"""ONNX Runtime wrapper around the exported MobileNetV2 plant-disease model."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image

from app.ml.preprocess import preprocess


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
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 2  # small model: more threads add overhead on a shared server
        self.session = ort.InferenceSession(str(model_dir / info["file"]), sess_options=opts, providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name

    def predict(self, img: Image.Image, top_k: int = 3) -> list[ClassScore]:
        logits = self.session.run(None, {self.input_name: preprocess(img)})[0][0]
        exp = np.exp(logits - logits.max())
        probs = exp / exp.sum()
        order = np.argsort(probs)[::-1][:top_k]
        return [ClassScore(index=int(i), label=self.labels[int(i)], probability=float(probs[i])) for i in order]
