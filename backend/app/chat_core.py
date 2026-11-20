"""Krishi AI chatbot: request validation, system prompt and EURI streaming.

Python port of frontend/server/chatCore.ts — keep the two prompts in sync.
Contract: POST /api/chat {messages, lang, context?} -> application/x-ndjson events
  {"type":"text","text":...} ... {"type":"done","finish_reason":...} | {"type":"error","code":...,"message":...}
"""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from typing import Literal

import httpx
from pydantic import BaseModel, Field, field_validator

log = logging.getLogger("chat")

MAX_MESSAGES = 24
MAX_MESSAGE_CHARS = 2000
MAX_CONTEXT_CHARS = 4000


class ChatMessageIn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=MAX_MESSAGE_CHARS)

    @field_validator("content")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Messages cannot be empty")
        return v


class TreatmentCtx(BaseModel):
    type: str = Field(default="", max_length=20)
    remedy: str = Field(default="", max_length=600)
    dosage: str | None = Field(default=None, max_length=120)


class DiagnosisCtx(BaseModel):
    crop: str = Field(max_length=80)
    disease: str = Field(max_length=120)
    status: str = Field(default="ok", max_length=30)
    confidence: float = Field(default=0, ge=0, le=1)
    symptoms: str | None = Field(default=None, max_length=800)
    causes: str | None = Field(default=None, max_length=800)
    treatments: list[TreatmentCtx] = Field(default_factory=list, max_length=12)


class ChatRequest(BaseModel):
    messages: list[ChatMessageIn] = Field(min_length=1, max_length=MAX_MESSAGES)
    lang: Literal["en", "bn"] = "en"
    context: DiagnosisCtx | None = None

    @field_validator("messages")
    @classmethod
    def starts_and_ends_with_user(cls, v: list[ChatMessageIn]) -> list[ChatMessageIn]:
        if v[0].role != "user" or v[-1].role != "user":
            raise ValueError("Conversation must start and end with a user message")
        return v


BASE_PROMPT = """You are "Krishi AI", the farming assistant inside Crop Disease Detector — a web app that identifies crop diseases from leaf photos.

Who you help: mostly smallholder farmers and agriculture officers in Bangladesh, often on a phone with slow internet. Use simple everyday words, short paragraphs and short bullet lists. Keep answers under about 150 words unless the user asks for more detail.

What you help with: crop diseases and pests, their symptoms and causes, treatment (chemical, organic, cultural), prevention, and general crop care (fertiliser, irrigation, seed, weather risks). If a question is unrelated to crops, plants or farming, say briefly that you can only help with crops and farming.

Advice rules:
- For chemicals, name the active ingredient (for example "Mancozeb 75 WP") with a typical rate per litre of water.
- Whenever your answer recommends any chemical, end it with one short safety line: follow the product label and local regulations, and wear gloves and a mask while spraying.
- Do not invent brand names. Viral diseases have no chemical cure — say so and focus on removing infected plants and controlling the insects that spread them.
- You cannot see the plant. When symptoms are unclear, or the problem is severe or spreading fast, suggest scanning a clear leaf photo on the app's Scan page, calling the Krishi Call Center 16123 (Bangladesh), or visiting the local Upazila Agriculture Officer.
- If a photo diagnosis from the app is provided, use it as helpful context, but remember it can be wrong.

The app's photo scan supports 17 crops: rice, wheat, jute (insect pests only, not jute diseases), soybean, apple, blueberry, cherry, corn (maize), grape, orange, peach, bell pepper, potato, raspberry, squash, strawberry and tomato. The rice, wheat, jute and soybean models are new (beta) and less reliable on field photos, so for those crops advise confirming with an agriculture officer. Other crops are not supported by the photo scan, but you can still answer general questions about them.

Format: plain text with light markdown only — **bold**, "- " bullet lists and "1." numbered lists. No tables, headings, links or emojis."""

LANG_RULE = {
    "bn": "Language: always reply in Bangla (বাংলা) using simple words a farmer uses every day. Keep chemical product names in English letters.",
    "en": "Language: reply in English. If the user writes in Bangla, reply in Bangla instead.",
}


def build_system_prompt(lang: str) -> str:
    return f"{BASE_PROMPT}\n\n{LANG_RULE.get(lang, LANG_RULE['en'])}"


def format_context(ctx: DiagnosisCtx) -> str:
    status = {"ok": "confident", "low_confidence": "uncertain (low confidence)"}.get(ctx.status, ctx.status)
    lines = [
        "Photo diagnosis currently shown in the app (data from the image model — it may be wrong):",
        f"- Crop: {ctx.crop}",
        f"- Result: {ctx.disease}",
        f"- Status: {status}",
        f"- Model confidence: {round(ctx.confidence * 100)}%",
    ]
    if ctx.symptoms:
        lines.append(f"- Typical symptoms: {ctx.symptoms}")
    if ctx.causes:
        lines.append(f"- Cause: {ctx.causes}")
    for t in ctx.treatments:
        if t.remedy:
            lines.append(f"- App's {t.type} advice: {t.remedy}" + (f" (dose: {t.dosage})" if t.dosage else ""))
    return "\n".join(lines)[:MAX_CONTEXT_CHARS]


def provider_messages(req: ChatRequest) -> list[dict[str, str]]:
    out = [{"role": "system", "content": build_system_prompt(req.lang)}]
    if req.context:
        out.append({"role": "system", "content": format_context(req.context)})
    out += [{"role": m.role, "content": m.content} for m in req.messages]
    return out


class UpstreamError(Exception):
    def __init__(self, status: int, reason: str, message: str) -> None:
        super().__init__(message)
        self.status, self.reason, self.message = status, reason, message


def _event(obj: dict) -> bytes:
    return (json.dumps(obj, ensure_ascii=False) + "\n").encode("utf-8")


async def open_stream(client: httpx.AsyncClient, *, base_url: str, api_key: str, model: str, req: ChatRequest) -> httpx.Response:
    """Start the upstream request; raises UpstreamError before any bytes are sent to the browser."""
    request = client.build_request(
        "POST",
        f"{base_url}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"model": model, "messages": provider_messages(req), "max_tokens": 2000, "temperature": 0.4, "stream": True},
    )
    try:
        resp = await client.send(request, stream=True)
    except httpx.HTTPError as e:
        raise UpstreamError(502, "AI_UNAVAILABLE", "Could not reach the AI service.") from e
    if resp.status_code != 200:
        body = (await resp.aread())[:300].decode("utf-8", "replace")
        await resp.aclose()
        log.warning("EURI upstream %s: %s", resp.status_code, body)
        if resp.status_code in (401, 403):
            raise UpstreamError(503, "AI_NOT_CONFIGURED", "The AI key was rejected.")
        if resp.status_code == 429:
            raise UpstreamError(429, "AI_BUSY", "The AI service is busy — please try again shortly.")
        raise UpstreamError(502, "AI_UNAVAILABLE", "The AI service returned an error.")
    return resp


async def ndjson_events(resp: httpx.Response) -> AsyncIterator[bytes]:
    """Translate the OpenAI-style SSE stream into our NDJSON events."""
    finish: str | None = None
    try:
        async for line in resp.aiter_lines():
            line = line.strip()
            if not line.startswith("data:"):
                continue
            data = line[5:].strip()
            if not data or data == "[DONE]":
                continue
            try:
                chunk = json.loads(data)
            except json.JSONDecodeError:
                continue
            if chunk.get("error"):
                yield _event({"type": "error", "code": "STREAM_FAILED", "message": str(chunk["error"].get("message", "AI error"))})
                continue
            choice = (chunk.get("choices") or [{}])[0]
            text = (choice.get("delta") or {}).get("content")
            if isinstance(text, str) and text:
                yield _event({"type": "text", "text": text})
            if isinstance(choice.get("finish_reason"), str):
                finish = choice["finish_reason"]
        yield _event({"type": "done", "finish_reason": finish})
    except httpx.HTTPError:
        yield _event({"type": "error", "code": "STREAM_FAILED", "message": "The answer was interrupted."})
    finally:
        await resp.aclose()
