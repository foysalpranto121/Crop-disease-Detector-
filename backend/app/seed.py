"""Create tables, load the disease knowledge base, and (in development) demo accounts."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import Crop, Disease, Treatment, User
from app.security import hash_password

log = logging.getLogger("seed")
SEED_DIR = Path(__file__).resolve().parent / "seed"


def _load(name: str):
    return json.loads((SEED_DIR / name).read_text(encoding="utf-8"))


def seed_knowledge_base(db: Session) -> None:
    if db.scalar(select(func.count()).select_from(Disease)):
        return
    for i, c in enumerate(_load("crops.json")):
        db.add(Crop(key=c["key"], name=c["name"], emoji=c["emoji"], supported=c["supported"], sort_order=i))
    db.flush()
    for d in _load("diseases.json"):
        disease = Disease(
            id=d["model_index"] + 1,
            class_label=d["class_label"],
            crop_key=d["crop_key"],
            name=d["name"],
            type=d["type"],
            is_healthy=d["is_healthy"],
            pathogen=d["pathogen"],
            symptoms=d["symptoms"],
            causes=d["causes"],
        )
        disease.treatments = [Treatment(type=t["type"], remedy=t["remedy"], dosage=t["dosage"], precautions=t["precautions"]) for t in d["treatments"]]
        db.add(disease)
    db.commit()
    log.info("Seeded crops and diseases")


def seed_demo_users(db: Session) -> None:
    demo = [
        ("Admin", settings.admin_email, settings.admin_password, "admin", "Dhaka"),
        ("Rahim Uddin", "farmer@demo.com", "farmer123", "farmer", "Bogura"),
    ]
    for name, email, password, role, district in demo:
        if not db.scalar(select(User).where(User.email == email)):
            db.add(User(name=name, email=email, password_hash=hash_password(password), role=role, country="Bangladesh", district=district))
            log.warning("Created demo account %s (%s) — disable with SEED_DEMO_USERS=false in production", email, role)
    db.commit()


def check_label_contract(db: Session, labels: list[str]) -> None:
    """Every model output index must map to the disease row with the same label."""
    rows = {d.id: d.class_label for d in db.scalars(select(Disease))}
    mismatches = [(i, lab, rows.get(i + 1)) for i, lab in enumerate(labels) if rows.get(i + 1) != lab]
    if mismatches:
        raise RuntimeError(f"Model labels do not match the disease table: {mismatches[:3]}")


def init_db(labels: list[str]) -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed_knowledge_base(db)
        if settings.seed_demo_users:
            seed_demo_users(db)
        check_label_contract(db, labels)
