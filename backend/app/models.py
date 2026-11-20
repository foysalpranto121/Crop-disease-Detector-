"""Database tables: USER, LEAF_IMAGE→PREDICTION, DISEASE, TREATMENT, CROP and FEEDBACK.

Bilingual text fields are stored as JSON objects: {"en": "...", "bn": "..."}.
The leaf image is stored as a file; PREDICTION.image_name points to it (merges the ERD's LEAF_IMAGE 1:1 row).
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(20), default="farmer")  # farmer | agronomist | admin
    country: Mapped[str] = mapped_column(String(60), default="Bangladesh")
    district: Mapped[str | None] = mapped_column(String(60), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Crop(Base):
    __tablename__ = "crops"

    key: Mapped[str] = mapped_column(String(30), primary_key=True)
    name: Mapped[dict] = mapped_column(JSON)
    emoji: Mapped[str] = mapped_column(String(16))
    supported: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Disease(Base):
    __tablename__ = "diseases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)  # = model output index + 1
    class_label: Mapped[str] = mapped_column(String(120), unique=True)  # exact model label
    crop_key: Mapped[str] = mapped_column(ForeignKey("crops.key"))
    name: Mapped[dict] = mapped_column(JSON)
    type: Mapped[str] = mapped_column(String(20))  # fungus | bacteria | virus | pest | oomycete | healthy
    is_healthy: Mapped[bool] = mapped_column(Boolean, default=False)
    pathogen: Mapped[str | None] = mapped_column(String(120), nullable=True)
    symptoms: Mapped[dict] = mapped_column(JSON)
    causes: Mapped[dict] = mapped_column(JSON)

    crop: Mapped[Crop] = relationship(lazy="joined")
    treatments: Mapped[list[Treatment]] = relationship(back_populates="disease", cascade="all, delete-orphan", order_by="Treatment.id")


class Treatment(Base):
    __tablename__ = "treatments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    disease_id: Mapped[int] = mapped_column(ForeignKey("diseases.id", ondelete="CASCADE"), index=True)
    type: Mapped[str] = mapped_column(String(20))  # chemical | organic | preventive
    remedy: Mapped[dict] = mapped_column(JSON)
    dosage: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    precautions: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    disease: Mapped[Disease] = relationship(back_populates="treatments")


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    image_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(20))  # ok | low_confidence | not_a_leaf
    confidence: Mapped[float] = mapped_column(Float)
    disease_id: Mapped[int | None] = mapped_column(ForeignKey("diseases.id"), nullable=True)
    top_k: Mapped[list] = mapped_column(JSON, default=list)  # [{"disease_id": int, "confidence": float}]
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    model_version: Mapped[str] = mapped_column(String(60))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    user: Mapped[User | None] = relationship()
    disease: Mapped[Disease | None] = relationship()
    feedback: Mapped[Feedback | None] = relationship(back_populates="prediction", uselist=False, cascade="all, delete-orphan")


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    prediction_id: Mapped[int] = mapped_column(ForeignKey("predictions.id", ondelete="CASCADE"), unique=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_correct: Mapped[bool] = mapped_column(Boolean)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    prediction: Mapped[Prediction] = relationship(back_populates="feedback")
    user: Mapped[User | None] = relationship()
