from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import api_error, current_user, optional_user
from app.models import Prediction, User
from app.schemas import HistoryItemOut, PredictionOut
from app.serializers import history_item, prediction_out

router = APIRouter(prefix="/api/history", tags=["history"])


def _can_view(p: Prediction, user: User | None) -> bool:
    # Guest scans have no owner and are reachable by id (the result page link); owned scans are private.
    return p.user_id is None or (user is not None and (user.id == p.user_id or user.role == "admin"))


@router.get("", response_model=list[HistoryItemOut])
def history(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[HistoryItemOut]:
    rows = db.scalars(select(Prediction).where(Prediction.user_id == user.id).order_by(Prediction.created_at.desc()).limit(200))
    return [history_item(p) for p in rows]


@router.get("/{prediction_id}", response_model=PredictionOut)
def history_item_detail(prediction_id: int, user: User | None = Depends(optional_user), db: Session = Depends(get_db)) -> PredictionOut:
    p = db.get(Prediction, prediction_id)
    if not p or not _can_view(p, user):
        raise api_error(404, "NOT_FOUND", "Result not found")
    return prediction_out(p, db)


@router.delete("/{prediction_id}", status_code=204)
def delete(prediction_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> Response:
    p = db.get(Prediction, prediction_id)
    if not p or not (p.user_id == user.id or user.role == "admin"):
        raise api_error(404, "NOT_FOUND", "Result not found")
    if p.image_name:
        (settings.upload_dir / p.image_name).unlink(missing_ok=True)
    db.delete(p)
    db.commit()
    return Response(status_code=204)
