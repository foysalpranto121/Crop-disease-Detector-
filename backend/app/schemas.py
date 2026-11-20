"""API response/request models — mirror frontend/src/api/types.ts exactly."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class L(BaseModel):
    """Bilingual text."""

    en: str = ""
    bn: str = ""


DiseaseType = Literal["fungus", "bacteria", "virus", "pest", "oomycete", "healthy"]
TreatmentType = Literal["chemical", "organic", "preventive"]
Status = Literal["ok", "low_confidence", "not_a_leaf"]
Band = Literal["high", "medium", "low"]
Role = Literal["farmer", "agronomist", "admin"]


class CropOut(BaseModel):
    key: str
    name: L
    emoji: str
    supported: bool
    disease_count: int | None = None


class TreatmentOut(BaseModel):
    id: int
    type: TreatmentType
    remedy: L
    dosage: L | None = None
    precautions: L | None = None


class DiseaseSummaryOut(BaseModel):
    id: int
    class_label: str
    crop: CropOut
    name: L
    type: DiseaseType
    is_healthy: bool
    pathogen: str | None = None
    images: list[str] = []  # real reference photos (PlantVillage), served by the frontend at /diseases/...


class DiseaseOut(DiseaseSummaryOut):
    symptoms: L
    causes: L
    treatments: list[TreatmentOut]


class TopKOut(BaseModel):
    disease_id: int
    name: L
    crop: L
    confidence: float
    image: str | None = None


class FeedbackState(BaseModel):
    is_correct: bool


class PredictionOut(BaseModel):
    id: int
    status: Status
    confidence: float
    confidence_band: Band
    image_url: str | None
    created_at: datetime
    disease: DiseaseOut | None
    top_k: list[TopKOut]
    latency_ms: int | None = None
    feedback: FeedbackState | None = None


class HistoryItemOut(BaseModel):
    id: int
    created_at: datetime
    image_url: str | None
    status: Status
    confidence: float
    confidence_band: Band
    disease: DiseaseSummaryOut | None


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: Role
    country: str
    district: str | None = None


class AuthOut(BaseModel):
    token: str
    user: UserOut


class LoginIn(BaseModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=200)


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=6, max_length=200)
    role: Literal["farmer", "agronomist"] = "farmer"
    country: str = Field(default="Bangladesh", max_length=60)
    district: str | None = Field(default=None, max_length=60)


class FeedbackIn(BaseModel):
    is_correct: bool
    comment: str | None = Field(default=None, max_length=1000)


class DiseaseUpdateIn(BaseModel):
    name: L | None = None
    symptoms: L | None = None
    causes: L | None = None


class TreatmentIn(BaseModel):
    type: TreatmentType
    remedy: L
    dosage: L | None = None
    precautions: L | None = None


class DayCount(BaseModel):
    date: str
    count: int


class TopDisease(BaseModel):
    disease_id: int
    name: L
    crop: L
    count: int


class CropCount(BaseModel):
    crop: L
    emoji: str
    count: int


class AdminStatsOut(BaseModel):
    scans_today: int
    total_scans: int
    total_users: int
    low_confidence_rate: float
    negative_feedback: int
    scans_per_day: list[DayCount]
    top_diseases: list[TopDisease]
    crops: list[CropCount]


class AdminUserRef(BaseModel):
    id: int
    name: str
    email: str


class AdminFeedbackRef(BaseModel):
    is_correct: bool
    comment: str | None = None


class AdminPredictionOut(HistoryItemOut):
    user: AdminUserRef | None
    feedback: AdminFeedbackRef | None


class FeedbackRowOut(BaseModel):
    id: int
    prediction_id: int
    is_correct: bool
    comment: str | None
    created_at: datetime
    user_name: str | None
    image_url: str | None
    disease: DiseaseSummaryOut | None
