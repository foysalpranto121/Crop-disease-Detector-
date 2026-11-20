import { describe, expect, it } from "vitest";
import { buildSystemPrompt, formatContext, toProviderMessages, validateChatRequest } from "../../server/chatCore";
import { readNdjson, type ChatEvent } from "../api/chat";
import { findDisease, offlineAnswer } from "../lib/chatFallback";
import { buildDiseases } from "../mocks/data/diseases";

describe("chat request validation (server)", () => {
  it("accepts a normal conversation and defaults lang to en", () => {
    const r = validateChatRequest({ messages: [{ role: "user", content: " Hello " }] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.lang).toBe("en");
      expect(r.value.messages[0].content).toBe("Hello");
      expect(r.value.context).toBeNull();
    }
  });

  it("rejects bad shapes, empty and over-long messages", () => {
    expect(validateChatRequest(null).ok).toBe(false);
    expect(validateChatRequest({ messages: [] }).ok).toBe(false);
    expect(validateChatRequest({ messages: [{ role: "system", content: "hi" }] }).ok).toBe(false);
    expect(validateChatRequest({ messages: [{ role: "user", content: "   " }] }).ok).toBe(false);
    expect(validateChatRequest({ messages: [{ role: "user", content: "x".repeat(2001) }] }).ok).toBe(false);
    expect(validateChatRequest({ messages: [{ role: "assistant", content: "hi" }] }).ok).toBe(false);
  });

  it("sanitises the diagnosis context", () => {
    const r = validateChatRequest({
      messages: [{ role: "user", content: "How to treat?" }],
      lang: "bn",
      context: { crop: "Tomato", disease: "Early Blight", status: "ok", confidence: 7, treatments: [{ type: "chemical", remedy: "Mancozeb", dosage: "2 g/L" }, "junk"] },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.lang).toBe("bn");
      expect(r.value.context?.confidence).toBe(1);
      expect(r.value.context?.treatments).toHaveLength(1);
    }
  });

  it("builds provider messages: system prompt, context, then the conversation", () => {
    const r = validateChatRequest({ messages: [{ role: "user", content: "Hi" }], lang: "bn", context: { crop: "Potato", disease: "Late Blight", status: "ok", confidence: 0.9 } });
    if (!r.ok) throw new Error("invalid");
    const msgs = toProviderMessages(r.value);
    expect(msgs.map((m) => m.role)).toEqual(["system", "system", "user"]);
    expect(msgs[0].content).toContain("Bangla");
    expect(msgs[1].content).toContain("Late Blight");
    expect(buildSystemPrompt("en")).toContain("16123");
    expect(formatContext({ crop: "A", disease: "B", status: "low_confidence", confidence: 0.4 })).toContain("uncertain");
  });
});

describe("NDJSON stream reader (browser)", () => {
  it("parses events split across chunks", async () => {
    const enc = new TextEncoder();
    const chunks = ['{"type":"text","te', 'xt":"Hel"}\n{"type":"text","text":"lo"}\n', '{"type":"done","finish_reason":"stop"}'];
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        chunks.forEach((s) => c.enqueue(enc.encode(s)));
        c.close();
      },
    });
    const events: ChatEvent[] = [];
    await readNdjson(body, (e) => events.push(e));
    expect(events).toEqual([
      { type: "text", text: "Hel" },
      { type: "text", text: "lo" },
      { type: "done", finish_reason: "stop" },
    ]);
  });
});

describe("offline chatbot answers", () => {
  const diseases = buildDiseases();

  it("finds diseases from English and Bangla questions", () => {
    expect(findDisease("How can I stop potato late blight?", diseases)?.class_label).toBe("Potato with Late Blight");
    expect(findDisease("আলুর মড়ক রোগ কীভাবে থামাব?", diseases)?.class_label).toBe("Potato with Late Blight");
    expect(findDisease("What is the weather today?", diseases)).toBeNull();
  });

  it("answers with treatments, or a helpful generic message", async () => {
    const answer = await offlineAnswer("tomato early blight treatment", "en", null);
    expect(answer).toContain("Mancozeb");
    expect(answer).toContain("16123");
    const generic = await offlineAnswer("hello", "en", null);
    expect(generic).toContain("Supported crops");
  });
});
