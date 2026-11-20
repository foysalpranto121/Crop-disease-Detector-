from fastapi import APIRouter, Depends, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import api_error, current_user
from app.models import User
from app.ratelimit import RateLimiter, client_ip
from app.schemas import AuthOut, LoginIn, RegisterIn, UserOut
from app.security import create_token, hash_password, verify_password
from app.serializers import user_out

router = APIRouter(prefix="/api/auth", tags=["auth"])
_auth_limiter = RateLimiter(max_requests=10, window_seconds=60)  # slows down password guessing
_DUMMY_HASH = hash_password("timing-equaliser")


@router.post("/register", response_model=AuthOut)
def register(body: RegisterIn, request: Request, db: Session = Depends(get_db)) -> AuthOut:
    if not _auth_limiter.allow(client_ip(request)):
        raise api_error(429, "TOO_MANY_REQUESTS", "Too many attempts — please wait a minute.")
    email = body.email.strip().lower()
    if db.scalar(select(User).where(func.lower(User.email) == email)):
        raise api_error(409, "EMAIL_TAKEN", "An account with this email already exists")
    user = User(
        name=body.name.strip(),
        email=email,
        password_hash=hash_password(body.password),
        role=body.role,
        country=body.country.strip() or "Bangladesh",
        district=(body.district or "").strip() or None,
    )
    db.add(user)
    db.commit()
    return AuthOut(token=create_token(user.id), user=user_out(user))


@router.post("/login", response_model=AuthOut)
def login(body: LoginIn, request: Request, db: Session = Depends(get_db)) -> AuthOut:
    if not _auth_limiter.allow(client_ip(request)):
        raise api_error(429, "TOO_MANY_REQUESTS", "Too many attempts — please wait a minute.")
    user = db.scalar(select(User).where(func.lower(User.email) == body.email.strip().lower()))
    # Always run bcrypt so response time doesn't reveal whether the email exists.
    ok = verify_password(body.password, user.password_hash if user else _DUMMY_HASH)
    if not user or not ok:
        raise api_error(401, "INVALID_CREDENTIALS", "Wrong email or password")
    return AuthOut(token=create_token(user.id), user=user_out(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)) -> UserOut:
    return user_out(user)
