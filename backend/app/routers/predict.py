import re
import uuid
from time import perf_counter

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse
from PIL import Image
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import api_error, optional_user
from app.ml.image_checks import ImageRejected, check_quality, load_image, looks_like_plant
from app.ml.registry import PEST_CROPS, ModelRegistry, Route
from app.models import Feedback, Prediction, User
from app.ratelimit import RateLimiter, client_ip
from app.schemas import FeedbackIn, PredictionOut
from app.serializers import prediction_out

router = APIRouter(prefix="/api", tags=["diagnosis"])
_predict_limiter = RateLimiter(max_requests=30, window_seconds=60)
_IMAGE_NAME = re.compile(r"^[0-9a-f]{32}\.jpg$")


def _save_image(img: Image.Image) -> str:
    """Store a downsized copy. Re-encoding drops all EXIF metadata (incl. GPS location)."""
    copy = img.copy()
    copy.thumbnail((1024, 1024))
    name = f"{uuid.uuid4().hex}.jpg"
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    copy.save(settings.upload_dir / name, "JPEG", quality=85, optimize=True)
    return name


def _analyse(models: ModelRegistry, route: Route, img: Image.Image, crop: str | None):
    check_quality(img)
    version, scores = models.predict(img, route, top_k=3)
    # Pest photos show insects (often not green), so the leaf-colour check would wrongly reject them.
    is_plant = crop in PEST_CROPS or looks_like_plant(img, settings.min_plant_ratio)
    return version, scores, is_plant


@router.post("/predict", response_model=PredictionOut)
async def predict(
    request: Request,
    file: UploadFile = File(...),
    crop: str | None = Form(None, max_length=30, description="Crop key, e.g. rice. Empty = detect among all PlantVillage crops."),
    user: User | None = Depends(optional_user),
    db: Session = Depends(get_db),
) -> PredictionOut:
    if not _predict_limiter.allow(client_ip(request)):
        raise api_error(429, "TOO_MANY_REQUESTS", "Too many scans — please wait a minute.")
    started = perf_counter()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    data = await file.read(max_bytes + 1)
    models: ModelRegistry = request.app.state.models
    crop = (crop or "").strip().lower() or None
    route = models.route(crop)
    if route is None:
        raise api_error(422, "UNSUPPORTED_CROP", f"No model is available for the crop '{crop}'.")
    try:
        img = await run_in_threadpool(load_image, data, max_bytes)
        version, scores, is_plant = await run_in_threadpool(_analyse, models, route, img, crop)
    except ImageRejected as e:
        raise api_error(e.status, e.reason, e.message) from None

    top = scores[0]
    if not is_plant:
        status, disease_id, top_k = "not_a_leaf", None, []
    else:
        status = "ok" if top.probability >= settings.low_confidence_threshold else "low_confidence"
        disease_id = top.disease_id
        top_k = [{"disease_id": s.disease_id, "confidence": round(s.probability, 4)} for s in scores]

    image_name = await run_in_threadpool(_save_image, img)
    p = Prediction(
        user_id=user.id if user else None,
        image_name=image_name,
        status=status,
        confidence=round(top.probability, 4),
        disease_id=disease_id,
        top_k=top_k,
        latency_ms=round((perf_counter() - started) * 1000),
        model_version=version,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return prediction_out(p, db)


@router.post("/predictions/{prediction_id}/feedback")
def feedback(prediction_id: int, body: FeedbackIn, user: User | None = Depends(optional_user), db: Session = Depends(get_db)) -> dict:
    p = db.get(Prediction, prediction_id)
    allowed = p and (p.user_id is None or (user and (user.id == p.user_id or user.role == "admin")))
    if not allowed:
        raise api_error(404, "NOT_FOUND", "Prediction not found")
    comment = (body.comment or "").strip() or None
    if p.feedback:
        p.feedback.is_correct, p.feedback.comment, p.feedback.user_id = body.is_correct, comment, user.id if user else None
    else:
        db.add(Feedback(prediction_id=p.id, user_id=user.id if user else None, is_correct=body.is_correct, comment=comment))
    db.commit()
    return {"ok": True}


@router.get("/images/{name}")
def image(name: str) -> FileResponse:
    # Names are random 128-bit ids, so they can't be guessed; the strict pattern blocks path traversal.
    path = settings.upload_dir / name
    if not _IMAGE_NAME.match(name) or not path.is_file():
        raise api_error(404, "NOT_FOUND", "Image not found")
    return FileResponse(path, media_type="image/jpeg", headers={"Cache-Control": "private, max-age=86400"})
