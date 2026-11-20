"""Test setup: a throw-away database and upload folder; the AI chat key is disabled."""

import os
import sys
import tempfile
from pathlib import Path

import pytest

_tmp = Path(tempfile.mkdtemp(prefix="cdd-test-"))
os.environ.update(
    {
        "DATABASE_URL": f"sqlite:///{(_tmp / 'test.db').as_posix()}",
        "UPLOAD_DIR": str(_tmp / "uploads"),
        "FRONTEND_DIST": str(_tmp / "no-dist"),
        "SECRET_KEY": "test-secret-key-for-pytest-only-0123456789",
        "EURI_API_KEY": "",
        "SEED_DEMO_USERS": "true",
    }
)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


_tokens: dict[str, str] = {}


def auth_headers(client: TestClient, email: str, password: str) -> dict[str, str]:
    if email not in _tokens:
        res = client.post("/api/auth/login", json={"email": email, "password": password})
        assert res.status_code == 200, res.text
        _tokens[email] = res.json()["token"]
    return {"Authorization": f"Bearer {_tokens[email]}"}


@pytest.fixture(scope="session")
def admin_headers(client):
    return auth_headers(client, "admin@demo.com", "admin123")


@pytest.fixture(scope="session")
def farmer_headers(client):
    return auth_headers(client, "farmer@demo.com", "farmer123")
