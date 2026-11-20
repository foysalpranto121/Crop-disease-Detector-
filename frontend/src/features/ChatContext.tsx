import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { streamChat, type ChatTurn, type DiagnosisContext } from "../api/chat";
import { toApiError } from "../api/client";
import { offlineAnswer } from "../lib/chatFallback";
import { normalizeLang } from "../lib/format";

export interface UiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "done" | "streaming" | "offline" | "error";
  errorKey?: "chat.error" | "chat.busy";
}

interface ChatValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  messages: UiMessage[];
  streaming: boolean;
  diagnosis: DiagnosisContext | null;
  setDiagnosis: (d: DiagnosisContext | null) => void;
  send: (text: string) => void;
  /** Open the chat, optionally asking a question right away. */
  ask: (text?: string) => void;
  retry: (assistantId: string) => void;
  stop: () => void;
  clear: () => void;
}

const STORAGE_KEY = "cdd.chat";
const MAX_HISTORY = 20;
// Errors that mean "no AI available" → answer from the offline disease library instead.
const OFFLINE_CODES = new Set(["AI_NOT_CONFIGURED", "AI_UNAVAILABLE", "NETWORK", "HTTP_404", "HTTP_502", "HTTP_503"]);

const ChatCtx = createContext<ChatValue | null>(null);
const uid = () => Math.random().toString(36).slice(2, 10);

function loadMessages(): UiMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UiMessage[]).filter((m) => m.status === "done" || m.status === "offline") : [];
  } catch {
    return [];
  }
}

async function typewriter(text: string, onChunk: (s: string) => void, signal: AbortSignal) {
  for (let i = 0; i < text.length; i += 5) {
    if (signal.aborted) return;
    onChunk(text.slice(i, i + 5));
    await new Promise((r) => setTimeout(r, 12));
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>(loadMessages);
  const [streaming, setStreaming] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisContext | null>(null);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const diagnosisRef = useRef(diagnosis);
  diagnosisRef.current = diagnosis;
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.filter((m) => m.status === "done" || m.status === "offline").slice(-30)));
    } catch {
      /* storage unavailable */
    }
  }, [messages]);

  const update = (id: string, fn: (m: UiMessage) => UiMessage) => setMessages((ms) => ms.map((m) => (m.id === id ? fn(m) : m)));

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || abortRef.current) return;
      const lang = normalizeLang(i18n.language);
      const user: UiMessage = { id: uid(), role: "user", content: question, status: "done" };
      const bot: UiMessage = { id: uid(), role: "assistant", content: "", status: "streaming" };

      const history: ChatTurn[] = [
        ...messagesRef.current.filter((m) => m.status === "done" || m.status === "offline").map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: question },
      ].slice(-MAX_HISTORY);
      while (history.length && history[0].role !== "user") history.shift();

      setMessages((ms) => [...ms, user, bot]);
      setStreaming(true);
      const ac = new AbortController();
      abortRef.current = ac;
      const append = (delta: string) => update(bot.id, (m) => ({ ...m, content: m.content + delta }));

      try {
        await streamChat({ messages: history, lang, context: diagnosisRef.current }, append, ac.signal);
        update(bot.id, (m) => ({ ...m, status: "done" }));
      } catch (e) {
        if (ac.signal.aborted) {
          // User pressed Stop: keep what arrived, drop an empty bubble.
          setMessages((ms) => ms.flatMap((m) => (m.id !== bot.id ? [m] : m.content ? [{ ...m, status: "done" as const }] : [])));
        } else {
          const err = toApiError(e);
          const hasText = messagesRef.current.find((m) => m.id === bot.id)?.content;
          if (err.status === 429) {
            update(bot.id, (m) => ({ ...m, status: "error", errorKey: "chat.busy" }));
          } else if (!hasText && (OFFLINE_CODES.has(err.code) || err.status === 0 || err.status >= 500)) {
            const answer = await offlineAnswer(question, lang, diagnosisRef.current);
            await typewriter(answer, append, ac.signal);
            update(bot.id, (m) => ({ ...m, status: "offline" }));
          } else {
            update(bot.id, (m) => ({ ...m, status: "error", errorKey: "chat.error" }));
          }
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
      }
    },
    [i18n],
  );

  const retry = useCallback(
    (assistantId: string) => {
      const list = messagesRef.current;
      const idx = list.findIndex((m) => m.id === assistantId);
      const question = idx > 0 ? list[idx - 1] : null;
      if (!question || question.role !== "user") return;
      const remaining = list.filter((_, i) => i !== idx && i !== idx - 1);
      setMessages(remaining);
      messagesRef.current = remaining;
      void send(question.content);
    },
    [send],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);
  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
  }, []);
  const ask = useCallback(
    (text?: string) => {
      setOpen(true);
      if (text) void send(text);
    },
    [send],
  );

  const value = useMemo<ChatValue>(
    () => ({ open, setOpen, messages, streaming, diagnosis, setDiagnosis, send: (t) => void send(t), ask, retry, stop, clear }),
    [open, messages, streaming, diagnosis, send, ask, retry, stop, clear],
  );
  return <ChatCtx.Provider value={value}>{children}</ChatCtx.Provider>;
}

export function useChat(): ChatValue {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error("useChat must be used inside ChatProvider");
  return ctx;
}
