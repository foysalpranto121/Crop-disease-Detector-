/*
 * Provider-independent chat logic: request validation, system prompt, diagnosis context.
 * Used by the dev-server chat endpoint now; the FastAPI backend should implement the same contract later:
 *
 *   POST /api/chat   { messages: [{role:"user"|"assistant", content}], lang: "en"|"bn", context?: DiagnosisContext }
 *   200  application/x-ndjson, one JSON event per line:
 *        {"type":"text","text":"..."}  …  {"type":"done","finish_reason":"stop"|"length"|null}
 *        {"type":"error","code":"STREAM_FAILED","message":"..."}   (if the upstream stream breaks)
 *   4xx/5xx  {"detail":{"reason":"AI_NOT_CONFIGURED"|"INVALID_REQUEST"|"AI_BUSY"|"AI_UNAVAILABLE", "message":"..."}}
 */

export type ChatRole = "user" | "assistant";

export interface ChatMessageIn {
  role: ChatRole;
  content: string;
}

export interface DiagnosisContextIn {
  crop: string;
  disease: string;
  status: string;
  confidence: number;
  symptoms?: string;
  causes?: string;
  treatments?: { type: string; remedy: string; dosage?: string | null }[];
}

export interface ChatRequestIn {
  messages: ChatMessageIn[];
  lang: "en" | "bn";
  context: DiagnosisContextIn | null;
}

export interface ProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const CHAT_LIMITS = { maxMessages: 24, maxMessageChars: 2000, maxContextChars: 4000 };

type Result<T> = { ok: true; value: T } | { ok: false; message: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);

function validateContext(raw: unknown): DiagnosisContextIn | null {
  if (!isObj(raw)) return null;
  const crop = str(raw.crop, 80);
  const disease = str(raw.disease, 120);
  if (!crop || !disease) return null;
  const treatments = Array.isArray(raw.treatments)
    ? raw.treatments
        .filter(isObj)
        .slice(0, 12)
        .map((t) => ({ type: str(t.type, 20) ?? "", remedy: str(t.remedy, 600) ?? "", dosage: str(t.dosage, 120) ?? null }))
        .filter((t) => t.remedy)
    : [];
  const confidence = typeof raw.confidence === "number" && Number.isFinite(raw.confidence) ? Math.max(0, Math.min(1, raw.confidence)) : 0;
  return {
    crop,
    disease,
    status: str(raw.status, 30) ?? "ok",
    confidence,
    symptoms: str(raw.symptoms, 800),
    causes: str(raw.causes, 800),
    treatments,
  };
}

/** Validate an untrusted request body from the browser. */
export function validateChatRequest(body: unknown): Result<ChatRequestIn> {
  if (!isObj(body)) return { ok: false, message: "Body must be a JSON object" };
  const { messages, lang } = body;
  if (!Array.isArray(messages) || messages.length === 0) return { ok: false, message: "messages must be a non-empty array" };
  if (messages.length > CHAT_LIMITS.maxMessages) return { ok: false, message: `At most ${CHAT_LIMITS.maxMessages} messages` };

  const clean: ChatMessageIn[] = [];
  for (const m of messages) {
    if (!isObj(m) || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") {
      return { ok: false, message: "Each message needs role 'user'|'assistant' and string content" };
    }
    const content = m.content.trim();
    if (!content) return { ok: false, message: "Messages cannot be empty" };
    if (content.length > CHAT_LIMITS.maxMessageChars) return { ok: false, message: `Messages are limited to ${CHAT_LIMITS.maxMessageChars} characters` };
    clean.push({ role: m.role, content });
  }
  if (clean[0].role !== "user" || clean[clean.length - 1].role !== "user") {
    return { ok: false, message: "Conversation must start and end with a user message" };
  }

  return { ok: true, value: { messages: clean, lang: lang === "bn" ? "bn" : "en", context: validateContext(body.context) } };
}

const BASE_PROMPT = `You are "Krishi AI", the farming assistant inside Crop Disease Detector — a web app that identifies crop diseases from leaf photos.

Who you help: mostly smallholder farmers and agriculture officers in Bangladesh, often on a phone with slow internet. Use simple everyday words, short paragraphs and short bullet lists. Keep answers under about 150 words unless the user asks for more detail.

What you help with: crop diseases and pests, their symptoms and causes, treatment (chemical, organic, cultural), prevention, and general crop care (fertiliser, irrigation, seed, weather risks). If a question is unrelated to crops, plants or farming, say briefly that you can only help with crops and farming.

Advice rules:
- For chemicals, name the active ingredient (for example "Mancozeb 75 WP") with a typical rate per litre of water.
- Whenever your answer recommends any chemical, end it with one short safety line: follow the product label and local regulations, and wear gloves and a mask while spraying.
- Do not invent brand names. Viral diseases have no chemical cure — say so and focus on removing infected plants and controlling the insects that spread them.
- You cannot see the plant. When symptoms are unclear, or the problem is severe or spreading fast, suggest scanning a clear leaf photo on the app's Scan page, calling the Krishi Call Center 16123 (Bangladesh), or visiting the local Upazila Agriculture Officer.
- If a photo diagnosis from the app is provided, use it as helpful context, but remember it can be wrong.

The app's photo scan supports 14 crops: apple, blueberry, cherry, corn (maize), grape, orange, peach, bell pepper, potato, raspberry, soybean, squash, strawberry and tomato. Rice, jute and wheat are not supported by the photo scan yet, but you can still answer general questions about them.

Format: plain text with light markdown only — **bold**, "- " bullet lists and "1." numbered lists. No tables, headings, links or emojis.`;

const LANG_RULE = {
  bn: "Language: always reply in Bangla (বাংলা) using simple words a farmer uses every day. Keep chemical product names in English letters.",
  en: "Language: reply in English. If the user writes in Bangla, reply in Bangla instead.",
} as const;

export function buildSystemPrompt(lang: "en" | "bn"): string {
  return `${BASE_PROMPT}\n\n${LANG_RULE[lang]}`;
}

/** Turn the app's diagnosis into a compact data block for the model. */
export function formatContext(ctx: DiagnosisContextIn): string {
  const lines = [
    "Photo diagnosis currently shown in the app (data from the image model — it may be wrong):",
    `- Crop: ${ctx.crop}`,
    `- Result: ${ctx.disease}`,
    `- Status: ${ctx.status === "ok" ? "confident" : ctx.status === "low_confidence" ? "uncertain (low confidence)" : ctx.status}`,
    `- Model confidence: ${Math.round(ctx.confidence * 100)}%`,
  ];
  if (ctx.symptoms) lines.push(`- Typical symptoms: ${ctx.symptoms}`);
  if (ctx.causes) lines.push(`- Cause: ${ctx.causes}`);
  for (const t of ctx.treatments ?? []) {
    lines.push(`- App's ${t.type} advice: ${t.remedy}${t.dosage ? ` (dose: ${t.dosage})` : ""}`);
  }
  return lines.join("\n").slice(0, CHAT_LIMITS.maxContextChars);
}

/** Build the OpenAI-style message list sent to the model provider. */
export function toProviderMessages(req: ChatRequestIn): ProviderMessage[] {
  const out: ProviderMessage[] = [{ role: "system", content: buildSystemPrompt(req.lang) }];
  if (req.context) out.push({ role: "system", content: formatContext(req.context) });
  for (const m of req.messages) out.push({ role: m.role, content: m.content });
  return out;
}
