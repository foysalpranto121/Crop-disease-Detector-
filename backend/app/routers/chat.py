import httpx
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.chat_core import ChatRequest, UpstreamError, ndjson_events, open_stream
from app.config import settings
from app.deps import api_error
from app.ratelimit import RateLimiter, client_ip

router = APIRouter(prefix="/api", tags=["chat"])
_chat_limiter = RateLimiter(max_requests=20, window_seconds=60)


@router.post("/chat")
async def chat(body: ChatRequest, request: Request) -> StreamingResponse:
    """Krishi AI: streams the answer as NDJSON. The EURI key stays on the server."""
    if not settings.euri_api_key:
        raise api_error(503, "AI_NOT_CONFIGURED", "Set EURI_API_KEY in backend/.env and restart the server.")
    if not _chat_limiter.allow(client_ip(request)):
        raise api_error(429, "AI_BUSY", "Too many questions — please wait a minute.")
    client: httpx.AsyncClient = request.app.state.http
    try:
        upstream = await open_stream(client, base_url=settings.euri_base_url, api_key=settings.euri_api_key, model=settings.euri_model, req=body)
    except UpstreamError as e:
        raise api_error(e.status, e.reason, e.message) from None
    return StreamingResponse(
        ndjson_events(upstream),
        media_type="application/x-ndjson; charset=utf-8",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
    )
