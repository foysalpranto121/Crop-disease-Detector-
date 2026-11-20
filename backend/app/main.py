"""FastAPI entry point.

    uvicorn app.main:app --reload            (from the backend/ folder)

Serves the REST API under /api and, if frontend/dist exists, the built React app for every other path.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.ml.inference import Classifier
from app.routers import admin, auth, chat, history, library, predict
from app.seed import init_db

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    classifier = Classifier(settings.model_dir)  # load once; reused by every request
    init_db(classifier.labels)
    app.state.classifier = classifier
    app.state.http = httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0))
    logging.getLogger("app").info("Model %s loaded (%d classes); AI chat %s", classifier.version, len(classifier.labels), "on" if settings.euri_api_key else "off (no EURI_API_KEY)")
    yield
    await app.state.http.aclose()


app = FastAPI(title="Crop Disease Detector API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(RequestValidationError)
async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    first = exc.errors()[0] if exc.errors() else {}
    where = ".".join(str(p) for p in first.get("loc", []) if p != "body")
    message = f"{where}: {first.get('msg', 'Invalid input')}" if where else first.get("msg", "Invalid input")
    return JSONResponse(status_code=422, content={"detail": {"reason": "INVALID_INPUT", "message": message}})


for r in (auth.router, library.router, predict.router, history.router, admin.router, chat.router):
    app.include_router(r)


@app.get("/api/health", tags=["health"])
def health(request: Request) -> dict:
    clf: Classifier = request.app.state.classifier
    return {"status": "ok", "model_version": clf.version, "num_classes": len(clf.labels), "chat": bool(settings.euri_api_key)}


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE"], include_in_schema=False)
def api_not_found(path: str) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": {"reason": "NOT_FOUND", "message": f"No API route /api/{path}"}})


# ---------- Built frontend (single-page app) ----------
_dist = settings.frontend_dist.resolve()
if (_dist / "index.html").is_file():
    if (_dist / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=_dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str) -> FileResponse:
        file = (_dist / path).resolve()
        if path and file.is_file() and file.is_relative_to(_dist):
            return FileResponse(file)
        return FileResponse(_dist / "index.html")  # client-side routes like /result/12
