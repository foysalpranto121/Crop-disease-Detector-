import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";
import { toProviderMessages, validateChatRequest } from "./chatCore";

/*
 * Vite dev/preview-server middleware for POST /api/chat.
 * Calls the EURI API (OpenAI-compatible, https://api.euron.one/api/v1/euri) with the key from .env.local
 * and streams the answer back to the browser as NDJSON. The key never reaches the browser.
 * The FastAPI backend will replace this with the same contract (see chatCore.ts).
 */

interface Options {
  apiKey?: string;
  model: string;
  baseUrl: string;
}

const MAX_BODY_BYTES = 64 * 1024;
const RATE_LIMIT = { windowMs: 60_000, max: 20 };
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT.max;
}

function sendError(res: ServerResponse, status: number, reason: string, message: string) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ detail: { reason, message } }));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("TOO_LARGE"));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function euriChatPlugin(opts: Options): Plugin {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    if ((req.url ?? "").split("?")[0] !== "/api/chat") return next();
    void handleChat(req, res, opts);
  };
  return {
    name: "euri-chat",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

async function handleChat(req: IncomingMessage, res: ServerResponse, opts: Options) {
  if (req.method !== "POST") return sendError(res, 405, "METHOD_NOT_ALLOWED", "Use POST");
  if (!opts.apiKey) return sendError(res, 503, "AI_NOT_CONFIGURED", "Set EURI_API_KEY in frontend/.env.local and restart the dev server.");
  if (rateLimited(req.socket.remoteAddress ?? "unknown")) return sendError(res, 429, "AI_BUSY", "Too many questions — please wait a minute.");

  let body: unknown;
  try {
    body = JSON.parse(await readBody(req));
  } catch (e) {
    return e instanceof Error && e.message === "TOO_LARGE"
      ? sendError(res, 413, "INVALID_REQUEST", "Request too large")
      : sendError(res, 400, "INVALID_REQUEST", "Body must be valid JSON");
  }
  const parsed = validateChatRequest(body);
  if (!parsed.ok) return sendError(res, 422, "INVALID_REQUEST", parsed.message);

  // Stop the upstream call if the user closes the chat / presses Stop.
  const abort = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) abort.abort();
  });

  let upstream: Response;
  try {
    upstream = await fetch(`${opts.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${opts.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: opts.model,
        messages: toProviderMessages(parsed.value),
        max_tokens: 2000,
        temperature: 0.4,
        stream: true,
      }),
      signal: abort.signal,
    });
  } catch {
    if (abort.signal.aborted) return;
    return sendError(res, 502, "AI_UNAVAILABLE", "Could not reach the AI service.");
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.warn(`[euri-chat] upstream ${upstream.status}: ${detail.slice(0, 300)}`);
    if (upstream.status === 401 || upstream.status === 403) return sendError(res, 503, "AI_NOT_CONFIGURED", "The AI key was rejected.");
    if (upstream.status === 429) return sendError(res, 429, "AI_BUSY", "The AI service is busy — please try again shortly.");
    return sendError(res, 502, "AI_UNAVAILABLE", "The AI service returned an error.");
  }

  res.writeHead(200, {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  });
  const send = (event: object) => res.write(`${JSON.stringify(event)}\n`);

  // Parse the OpenAI-style SSE stream: lines of `data: {...}` ending with `data: [DONE]`.
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finish: string | null = null;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        let chunk: { choices?: { delta?: { content?: unknown }; finish_reason?: unknown }[]; error?: { message?: string } };
        try {
          chunk = JSON.parse(data);
        } catch {
          continue; // ignore keep-alives / partial garbage
        }
        if (chunk.error) {
          send({ type: "error", code: "STREAM_FAILED", message: chunk.error.message ?? "AI error" });
          continue;
        }
        const choice = chunk.choices?.[0];
        if (typeof choice?.delta?.content === "string" && choice.delta.content) send({ type: "text", text: choice.delta.content });
        if (typeof choice?.finish_reason === "string") finish = choice.finish_reason;
      }
    }
    send({ type: "done", finish_reason: finish });
  } catch {
    if (!abort.signal.aborted) send({ type: "error", code: "STREAM_FAILED", message: "The answer was interrupted." });
  } finally {
    res.end();
  }
}
