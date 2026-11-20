from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import admin_user, api_error
from app.models import Crop, Disease, Feedback, Prediction, Treatment, User
from app.schemas import (
    AdminFeedbackRef,
    AdminPredictionOut,
    AdminStatsOut,
    AdminUserRef,
    CropCount,
    DayCount,
    DiseaseOut,
    DiseaseUpdateIn,
    FeedbackRowOut,
    TopDisease,
    TreatmentIn,
    TreatmentOut,
)
from app.serializers import disease_out, disease_summary, history_item, image_url, treatment_out

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(admin_user)])


def _as_utc(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)  # SQLite returns naive datetimes


@router.get("/stats", response_model=AdminStatsOut)
def stats(db: Session = Depends(get_db)) -> AdminStatsOut:
    preds = list(db.scalars(select(Prediction)))
    today = datetime.now(timezone.utc).date()
    per_day = Counter(_as_utc(p.created_at).date() for p in preds)
    disease_counts: Counter[int] = Counter()
    crop_counts: Counter[str] = Counter()
    for p in preds:
        if p.disease:
            crop_counts[p.disease.crop_key] += 1
            if not p.disease.is_healthy:
                disease_counts[p.disease_id] += 1

    top = []
    for disease_id, count in disease_counts.most_common(5):
        d = db.get(Disease, disease_id)
        top.append(TopDisease(disease_id=d.id, name=d.name, crop=d.crop.name, count=count))
    crops = []
    for key, count in crop_counts.most_common():
        c = db.get(Crop, key)
        crops.append(CropCount(crop=c.name, emoji=c.emoji, count=count))

    total = len(preds)
    return AdminStatsOut(
        scans_today=per_day.get(today, 0),
        total_scans=total,
        total_users=db.scalar(select(func.count()).select_from(User)) or 0,
        low_confidence_rate=(sum(p.status != "ok" for p in preds) / total) if total else 0.0,
        negative_feedback=db.scalar(select(func.count()).select_from(Feedback).where(Feedback.is_correct.is_(False))) or 0,
        scans_per_day=[DayCount(date=(today - timedelta(days=i)).isoformat(), count=per_day.get(today - timedelta(days=i), 0)) for i in range(6, -1, -1)],
        top_diseases=top,
        crops=crops,
    )


@router.get("/predictions", response_model=list[AdminPredictionOut])
def predictions(db: Session = Depends(get_db)) -> list[AdminPredictionOut]:
    rows = db.scalars(select(Prediction).order_by(Prediction.created_at.desc()).limit(200))
    return [
        AdminPredictionOut(
            **history_item(p).model_dump(),
            user=AdminUserRef(id=p.user.id, name=p.user.name, email=p.user.email) if p.user else None,
            feedback=AdminFeedbackRef(is_correct=p.feedback.is_correct, comment=p.feedback.comment) if p.feedback else None,
        )
        for p in rows
    ]


@router.get("/feedback", response_model=list[FeedbackRowOut])
def feedback(db: Session = Depends(get_db)) -> list[FeedbackRowOut]:
    rows = db.scalars(select(Feedback).order_by(Feedback.created_at.desc()).limit(200))
    return [
        FeedbackRowOut(
            id=f.id,
            prediction_id=f.prediction_id,
            is_correct=f.is_correct,
            comment=f.comment,
            created_at=f.created_at,
            user_name=f.user.name if f.user else None,
            image_url=image_url(f.prediction.image_name),
            disease=disease_summary(f.prediction.disease) if f.prediction.disease else None,
        )
        for f in rows
    ]


@router.put("/diseases/{disease_id}", response_model=DiseaseOut)
def update_disease(disease_id: int, body: DiseaseUpdateIn, db: Session = Depends(get_db)) -> DiseaseOut:
    d = db.get(Disease, disease_id)
    if not d:
        raise api_error(404, "NOT_FOUND", "Disease not found")
    for field in ("name", "symptoms", "causes"):
        value = getattr(body, field)
        if value is not None:
            setattr(d, field, value.model_dump())
    db.commit()
    return disease_out(d)


@router.post("/diseases/{disease_id}/treatments", response_model=TreatmentOut, status_code=201)
def add_treatment(disease_id: int, body: TreatmentIn, db: Session = Depends(get_db)) -> TreatmentOut:
    if not db.get(Disease, disease_id):
        raise api_error(404, "NOT_FOUND", "Disease not found")
    t = Treatment(disease_id=disease_id, **_treatment_fields(body))
    db.add(t)
    db.commit()
    return treatment_out(t)


@router.put("/treatments/{treatment_id}", response_model=TreatmentOut)
def update_treatment(treatment_id: int, body: TreatmentIn, db: Session = Depends(get_db)) -> TreatmentOut:
    t = db.get(Treatment, treatment_id)
    if not t:
        raise api_error(404, "NOT_FOUND", "Treatment not found")
    for key, value in _treatment_fields(body).items():
        setattr(t, key, value)
    db.commit()
    return treatment_out(t)


@router.delete("/treatments/{treatment_id}", status_code=204)
def delete_treatment(treatment_id: int, db: Session = Depends(get_db)) -> Response:
    t = db.get(Treatment, treatment_id)
    if not t:
        raise api_error(404, "NOT_FOUND", "Treatment not found")
    db.delete(t)
    db.commit()
    return Response(status_code=204)


def _treatment_fields(body: TreatmentIn) -> dict:
    return {
        "type": body.type,
        "remedy": body.remedy.model_dump(),
        "dosage": body.dosage.model_dump() if body.dosage else None,
        "precautions": body.precautions.model_dump() if body.precautions else None,
    }
