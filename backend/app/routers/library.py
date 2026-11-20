from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import api_error
from app.models import Crop, Disease
from app.schemas import CropOut, DiseaseOut, DiseaseSummaryOut
from app.serializers import crop_out, disease_out, disease_summary

router = APIRouter(prefix="/api", tags=["library"])


@router.get("/crops", response_model=list[CropOut])
def crops(db: Session = Depends(get_db)) -> list[CropOut]:
    counts: dict[str, int] = {}
    for d in db.scalars(select(Disease).where(Disease.is_healthy.is_(False))):
        counts[d.crop_key] = counts.get(d.crop_key, 0) + 1
    return [crop_out(c, counts.get(c.key, 0)) for c in db.scalars(select(Crop).order_by(Crop.sort_order))]


@router.get("/diseases", response_model=list[DiseaseSummaryOut])
def diseases(crop: str | None = None, db: Session = Depends(get_db)) -> list[DiseaseSummaryOut]:
    q = select(Disease).order_by(Disease.id)
    if crop:
        q = q.where(Disease.crop_key == crop)
    return [disease_summary(d) for d in db.scalars(q)]


@router.get("/diseases/{disease_id}", response_model=DiseaseOut)
def disease(disease_id: int, db: Session = Depends(get_db)) -> DiseaseOut:
    d = db.scalar(select(Disease).where(Disease.id == disease_id).options(selectinload(Disease.treatments)))
    if not d:
        raise api_error(404, "NOT_FOUND", "Disease not found")
    return disease_out(d)
