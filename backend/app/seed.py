"""Create tables, load the disease knowledge base, and (in development) demo accounts."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from sqlalchemy import select
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
    """Insert missing crops/diseases and refresh crop metadata. Existing disease rows (maybe edited by an admin) are kept."""
    crops = {c.key: c for c in db.scalars(select(Crop))}
    for i, c in enumerate(_load("crops.json")):
        row = crops.get(c["key"])
        if row is None:
            db.add(Crop(key=c["key"], name=c["name"], emoji=c["emoji"], supported=c["supported"], sort_order=i))
        else:
            row.name, row.emoji, row.supported, row.sort_order = c["name"], c["emoji"], c["supported"], i
    db.flush()
    existing = set(db.scalars(select(Disease.class_label)))
    added = 0
    for d in _load("diseases.json"):
        if d["class_label"] in existing:
            continue
        disease = Disease(
            id=d["id"],
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
        added += 1
    db.commit()
    if added:
        log.info("Seeded %d diseases", added)


def _ensure_user(db: Session, name: str, email: str, password: str, role: str, district: str) -> bool:
    if db.scalar(select(User).where(User.email == email)):
        return False
    db.add(User(name=name, email=email, password_hash=hash_password(password), role=role, country="Bangladesh", district=district))
    db.commit()
    return True


def seed_admin(db: Session) -> None:
    """The admin account always exists; its login comes from ADMIN_EMAIL / ADMIN_PASSWORD."""
    if _ensure_user(db, "Admin", settings.admin_email, settings.admin_password, "admin", "Dhaka"):
        log.info("Created admin account %s", settings.admin_email)
    if settings.admin_password == "admin123":
        log.warning("ADMIN_PASSWORD is the default — set a strong one before going public")


def seed_demo_users(db: Session) -> None:
    if _ensure_user(db, "Rahim Uddin", "farmer@demo.com", "farmer123", "farmer", "Bogura"):
        log.warning("Created demo farmer account — disable with SEED_DEMO_USERS=false in production")


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
        seed_admin(db)
        if settings.seed_demo_users:
            seed_demo_users(db)
        check_label_contract(db, labels)
