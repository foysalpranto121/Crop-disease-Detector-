"""Shared FastAPI dependencies and the API error format."""

from __future__ import annotations

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.security import decode_token

_bearer = HTTPBearer(auto_error=False)


def api_error(status: int, reason: str, message: str) -> HTTPException:
    """Errors look like {"detail": {"reason": "...", "message": "..."}} — what the frontend expects."""
    return HTTPException(status_code=status, detail={"reason": reason, "message": message})


def optional_user(creds: HTTPAuthorizationCredentials | None = Depends(_bearer), db: Session = Depends(get_db)) -> User | None:
    if not creds:
        return None
    user_id = decode_token(creds.credentials)
    return db.get(User, user_id) if user_id else None


def current_user(user: User | None = Depends(optional_user)) -> User:
    if not user:
        raise api_error(401, "UNAUTHORIZED", "Login required")
    return user


def admin_user(user: User = Depends(current_user)) -> User:
    if user.role != "admin":
        raise api_error(403, "FORBIDDEN", "Admins only")
    return user
