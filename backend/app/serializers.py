"""ORM rows -> API shapes (same JSON as the frontend's mock layer produced)."""

from __future__ import annotations

import re

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Crop, Disease, Prediction, Treatment, User
from app.schemas import (
    CropOut,
    DiseaseOut,
    DiseaseSummaryOut,
    FeedbackState,
    HistoryItemOut,
    PredictionOut,
    TopKOut,
    TreatmentOut,
    UserOut,
)


IMAGES_PER_DISEASE = 3


def slugify(label: str) -> str:
    """Must match frontend/src/lib/diseaseImages.ts and backend/scripts/fetch_disease_images.py."""
    return re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")


def disease_images(class_label: str) -> list[str]:
    slug = slugify(class_label)
    return [f"/diseases/{slug}-{i}.jpg" for i in range(1, IMAGES_PER_DISEASE + 1)]


def band_of(confidence: float) -> str:
    if confidence >= 0.85:
        return "high"
    if confidence >= settings.low_confidence_threshold:
        return "medium"
    return "low"


def image_url(name: str | None) -> str | None:
    return f"/api/images/{name}" if name else None


def crop_out(c: Crop, disease_count: int | None = None) -> CropOut:
    return CropOut(key=c.key, name=c.name, emoji=c.emoji, supported=c.supported, disease_count=disease_count)


def treatment_out(t: Treatment) -> TreatmentOut:
    return TreatmentOut(id=t.id, type=t.type, remedy=t.remedy, dosage=t.dosage, precautions=t.precautions)


def disease_summary(d: Disease) -> DiseaseSummaryOut:
    return DiseaseSummaryOut(
        id=d.id,
        class_label=d.class_label,
        crop=crop_out(d.crop),
        name=d.name,
        type=d.type,
        is_healthy=d.is_healthy,
        pathogen=d.pathogen,
        images=disease_images(d.class_label),
    )


def disease_out(d: Disease) -> DiseaseOut:
    return DiseaseOut(
        **disease_summary(d).model_dump(),
        symptoms=d.symptoms,
        causes=d.causes,
        treatments=[treatment_out(t) for t in d.treatments],
    )


def prediction_out(p: Prediction, db: Session) -> PredictionOut:
    top_k: list[TopKOut] = []
    for k in p.top_k or []:
        d = db.get(Disease, k["disease_id"])
        if d:
            top_k.append(TopKOut(disease_id=d.id, name=d.name, crop=d.crop.name, confidence=k["confidence"], image=disease_images(d.class_label)[0]))
    return PredictionOut(
        id=p.id,
        status=p.status,
        confidence=p.confidence,
        confidence_band=band_of(p.confidence),
        image_url=image_url(p.image_name),
        created_at=p.created_at,
        disease=disease_out(p.disease) if p.disease else None,
        top_k=top_k,
        latency_ms=p.latency_ms,
        feedback=FeedbackState(is_correct=p.feedback.is_correct) if p.feedback else None,
    )


def history_item(p: Prediction) -> HistoryItemOut:
    return HistoryItemOut(
        id=p.id,
        created_at=p.created_at,
        image_url=image_url(p.image_name),
        status=p.status,
        confidence=p.confidence,
        confidence_band=band_of(p.confidence),
        disease=disease_summary(p.disease) if p.disease else None,
    )


def user_out(u: User) -> UserOut:
    return UserOut(id=u.id, name=u.name, email=u.email, role=u.role, country=u.country, district=u.district)
