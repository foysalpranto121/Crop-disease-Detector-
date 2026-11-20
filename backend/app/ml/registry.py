"""All crop models behind one interface: pick the right model for a crop and map its classes to disease rows.

    main      PlantVillage MobileNetV2, 38 classes (14 crops) — used when no crop is chosen
    rice      YOLO classifier for 8 rice classes
    india     Indian-crops MobileNetV2 — only its Wheat___ classes are used (wheat)
    soybean   ConvNeXt, 6 soybean classes
    jute      ViT, 17 jute pests

Disease rows of the main model have id = class index + 1 and class_label = model label.
Rows of a specialist model have class_label = "<model key>:<model label>".
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

from PIL import Image
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ml.inference import Classifier
from app.models import Disease

log = logging.getLogger("app.models")

MAIN = "main"
SPECIALISTS = ("rice", "india", "soybean", "jute")
# crop key -> model key for crops a specialist model covers (takes priority over the main model)
CROP_MODEL = {"rice": "rice", "wheat": "india", "soybean": "soybean", "jute": "jute"}
# Crops whose model looks at insects, not leaf colour: skip the "is this a plant?" colour check.
PEST_CROPS = {"jute"}


@dataclass(frozen=True)
class Scored:
    disease_id: int
    probability: float


@dataclass(frozen=True)
class Route:
    model: str
    allowed: list[int]  # model class indices of this crop (empty = every class of the model)
    to_disease: dict[int, int]  # model class index -> disease id


class ModelRegistry:
    def __init__(self, model_dir: Path) -> None:
        self.models: dict[str, Classifier] = {MAIN: Classifier(model_dir)}
        for key in SPECIALISTS:
            if (model_dir / key / "model_info.json").is_file():
                self.models[key] = Classifier(model_dir / key)
            else:
                log.warning("Crop model '%s' not found in %s — that crop falls back to the main model", key, model_dir / key)
        self.routes: dict[str, Route] = {}
        self._main_route = Route(MAIN, [], {})

    @property
    def main(self) -> Classifier:
        return self.models[MAIN]

    def bind(self, db: Session) -> None:
        """Build crop -> (model, allowed classes, class -> disease id) from the disease table."""
        by_label = {d.class_label: (d.id, d.crop_key) for d in db.scalars(select(Disease))}
        per_model: dict[str, dict[int, tuple[int, str]]] = {}
        for key, clf in self.models.items():
            per_model[key] = {
                i: by_label[name]
                for i, label in enumerate(clf.labels)
                if (name := label if key == MAIN else f"{key}:{label}") in by_label
            }

        self._main_route = Route(MAIN, [], {i: did for i, (did, _) in per_model[MAIN].items()})
        routes: dict[str, Route] = {}
        for crop in sorted({c for _, c in by_label.values()}):
            source = CROP_MODEL.get(crop, MAIN)
            if source not in self.models:
                source = MAIN
            mapping = per_model[source]
            allowed = sorted(i for i, (_, c) in mapping.items() if c == crop)
            if allowed:
                routes[crop] = Route(source, allowed, {i: did for i, (did, _) in mapping.items()})
        self.routes = routes
        log.info("Crop routing: %s", ", ".join(f"{c}->{r.model}({len(r.allowed)})" for c, r in routes.items()))

    def route(self, crop: str | None) -> Route | None:
        """No crop = main model over all its classes. A crop without a model -> None."""
        if not crop:
            return self._main_route
        return self.routes.get(crop)

    def predict(self, img: Image.Image, route: Route, top_k: int = 3) -> tuple[str, list[Scored]]:
        clf = self.models[route.model]
        scores = clf.predict(img, top_k=top_k, allowed=route.allowed or None)
        return clf.version, [Scored(route.to_disease[s.index], s.probability) for s in scores if s.index in route.to_disease]
