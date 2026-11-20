import { ApiError, BASE_URL } from "./client";
import type { Lang, PredictionResult } from "./types";
import { pickL } from "../lib/format";

// Client for POST /api/chat (contract documented in server/chatCore.ts).

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** The scan the user is looking at — lets the AI answer "how do I treat this?". */
export interface DiagnosisContext {
  diseaseId: number;
  /** Localized label for the UI, e.g. "টমেটো · আগাম ধসা রোগ". */
  label: string;
  crop: string;
  disease: string;
  status: string;
  confidence: number;
  symptoms?: string;
  causes?: string;
  treatments?: { type: string; remedy: string; dosage?: string | null }[];
}

export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "done"; finish_reason: string | null }
  | { type: "error"; code: string; message?: string };


export function diagnosisFromResult(result: PredictionResult, lang: string): DiagnosisContext | null {
  const d = result.disease;
  if (!d || result.status === "not_a_leaf") return null;
  return {
    diseaseId: d.id,
    label: `${pickL(d.crop.name, lang)} · ${pickL(d.name, lang)}`,
    // English text goes to the model; it answers in the user's language.
    crop: d.crop.name.en,
    disease: d.is_healthy ? "Healthy (no disease found)" : d.name.en,
    status: result.status,
    confidence: result.confidence,
    symptoms: d.symptoms.en,
    causes: d.causes.en,
    treatments: d.treatments.map((t) => ({ type: t.type, remedy: t.remedy.en, dosage: t.dosage?.en ?? null })),
  };
}

/** Read a newline-delimited JSON stream, calling onEvent for every complete line. */
export async function readNdjson(body: ReadableStream<Uint8Array>, onEvent: (e: ChatEvent) => void): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const flush = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      onEvent(JSON.parse(trimmed) as ChatEvent);
    } catch {
      /* ignore malformed line */
    }
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      flush(buffer.slice(0, nl));
      buffer = buffer.slice(nl + 1);
    }
  }
  flush(buffer + decoder.decode());
}

function wireContext(c: DiagnosisContext | null) {
  if (!c) return null;
  return { crop: c.crop, disease: c.disease, status: c.status, confidence: c.confidence, symptoms: c.symptoms, causes: c.causes, treatments: c.treatments };
}

/** Stream an AI answer. Calls onText for each piece of text as it arrives. */
export async function streamChat(
  input: { messages: ChatTurn[]; lang: Lang; context: DiagnosisContext | null },
  onText: (delta: string) => void,
  signal?: AbortSignal,
): Promise<{ finishReason: string | null }> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: input.messages, lang: input.lang, context: wireContext(input.context) }),
      signal,
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new ApiError(0, "NETWORK", "Network error");
  }

  if (!res.ok) {
    let reason = `HTTP_${res.status}`;
    let message = res.statusText;
    try {
      const detail = (await res.json())?.detail;
      if (detail?.reason) reason = detail.reason;
      if (detail?.message) message = detail.message;
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(res.status, reason, message);
  }
  // A static host may answer with index.html — treat anything that isn't our stream as "AI not available".
  if (!res.body || !(res.headers.get("content-type") ?? "").includes("ndjson")) {
    throw new ApiError(503, "AI_UNAVAILABLE", "Chat endpoint not available");
  }

  const state: { finish: string | null; error: ApiError | null } = { finish: null, error: null };
  await readNdjson(res.body, (event) => {
    if (event.type === "text") onText(event.text);
    else if (event.type === "done") state.finish = event.finish_reason;
    else if (event.type === "error") state.error = new ApiError(502, event.code, event.message ?? "Stream failed");
  });
  if (state.error) throw state.error;
  return { finishReason: state.finish };
}
