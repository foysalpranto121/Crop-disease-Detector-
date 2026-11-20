import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, MessageCircleQuestion, RotateCcw, Sparkles, Square, SquarePen, WifiOff, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChat, type UiMessage } from "../features/ChatContext";
import { cn } from "../lib/cn";
import { ChatMarkdown } from "./ChatMarkdown";
import { LeafMark } from "./Logo";

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-leaf-500"
          animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

function Bubble({ m, onRetry }: { m: UiMessage; onRetry: () => void }) {
  const { t } = useTranslation();
  if (m.role === "user") {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-ee-md bg-leaf-700 px-4 py-2.5 whitespace-pre-wrap text-white shadow-sm">{m.content}</p>
      </motion.div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
      <LeafMark className="mt-1 size-7 shrink-0" />
      <div className="min-w-0 max-w-[88%]">
        <div className="rounded-2xl rounded-es-md bg-white px-4 py-3 text-[15px] leading-relaxed shadow-sm ring-1 ring-leaf-900/5">
          {m.status === "streaming" && !m.content ? (
            <span className="flex items-center gap-2 text-sm text-leaf-900/60">
              <TypingDots /> {t("chat.thinking")}
            </span>
          ) : (
            <>
              <ChatMarkdown text={m.content} />
              {m.status === "streaming" && <span className="ms-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-leaf-500 align-middle" aria-hidden />}
            </>
          )}
          {m.status === "error" && (
            <div className={cn("text-sm text-danger-700", m.content && "mt-2 border-t border-leaf-100 pt-2")}>
              <p>{t(m.errorKey ?? "chat.error")}</p>
              <button type="button" onClick={onRetry} className="mt-1 inline-flex items-center gap-1 font-semibold text-leaf-700 hover:underline">
                <RotateCcw className="size-3.5" /> {t("chat.retry")}
              </button>
            </div>
          )}
        </div>
        {m.status === "offline" && (
          <p className="mt-1 flex items-center gap-1 ps-1 text-[11px] text-leaf-900/50">
            <WifiOff className="size-3" aria-hidden /> {t("chat.offline_note")}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function ChatWidget() {
  const { t } = useTranslation();
  const chat = useChat();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keep the newest message in view while answers stream in.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [chat.messages, chat.open]);

  useEffect(() => {
    if (!chat.open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 250);
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && chat.setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [chat.open, chat.setOpen]);

  // Auto-grow the textarea up to ~5 lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [input]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chat.streaming) return;
    chat.send(input);
    setInput("");
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const suggestions = chat.diagnosis ? [t("chat.c1"), t("chat.c2"), t("chat.c3")] : [t("chat.s1"), t("chat.s2"), t("chat.s3"), t("chat.s4")];

  return (
    <div className="no-print">
      <AnimatePresence>
        {!chat.open && (
          <motion.button
            type="button"
            onClick={() => chat.setOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={t("chat.open")}
            className="fixed end-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-leaf-500 to-leaf-700 p-4 text-white shadow-xl shadow-leaf-900/25 sm:end-6 sm:bottom-6 sm:px-5"
          >
            <span className="animate-pulse-ring absolute inset-0 rounded-full bg-leaf-400/40 decorative-motion" aria-hidden />
            <MessageCircleQuestion className="relative size-6" aria-hidden />
            <span className="relative hidden font-semibold sm:inline">{t("chat.open")}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chat.open && (
          <motion.section
            role="dialog"
            aria-label={t("chat.title")}
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-cream-50 shadow-2xl ring-1 ring-leaf-900/10 sm:inset-auto sm:end-6 sm:bottom-6 sm:h-[min(640px,calc(100dvh-3rem))] sm:w-[400px] sm:rounded-3xl"
          >
            {/* Header */}
            <header className="flex items-center gap-3 bg-gradient-to-r from-leaf-700 to-leaf-500 px-4 py-3 text-white">
              <span className="grid size-10 place-items-center rounded-2xl bg-white/15">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="leading-tight font-semibold">{t("chat.title")}</h2>
                <p className="truncate text-xs text-leaf-50/85">{t("chat.subtitle")}</p>
              </div>
              <button type="button" onClick={chat.clear} className="rounded-full p-2 hover:bg-white/15" aria-label={t("chat.clear")} title={t("chat.clear")}>
                <SquarePen className="size-5" />
              </button>
              <button type="button" onClick={() => chat.setOpen(false)} className="rounded-full p-2 hover:bg-white/15" aria-label={t("chat.close")} title={t("chat.close")}>
                <X className="size-5" />
              </button>
            </header>

            {chat.diagnosis && (
              <p className="flex items-center gap-2 border-b border-leaf-100 bg-leaf-50 px-4 py-2 text-xs text-leaf-800">
                <span className="font-semibold">{t("chat.about_scan")}:</span>
                <span className="truncate">{chat.diagnosis.label}</span>
              </p>
            )}

            {/* Messages */}
            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
              <div className="flex gap-2">
                <LeafMark className="mt-1 size-7 shrink-0" />
                <p className="max-w-[88%] rounded-2xl rounded-es-md bg-white px-4 py-3 text-[15px] leading-relaxed shadow-sm ring-1 ring-leaf-900/5">{t("chat.welcome")}</p>
              </div>

              {chat.messages.length === 0 && (
                <div className="ps-9">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-leaf-900/50 uppercase">{t("chat.suggestions_title")}</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => chat.send(s)}
                        className="rounded-2xl bg-white px-3 py-2 text-start text-sm text-leaf-800 ring-1 ring-leaf-200 transition hover:bg-leaf-50 hover:ring-leaf-400"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chat.messages.map((m) => (
                <Bubble key={m.id} m={m} onRetry={() => chat.retry(m.id)} />
              ))}
            </div>

            {/* Composer */}
            <form onSubmit={submit} className="border-t border-leaf-100 bg-white px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex items-end gap-2 rounded-2xl bg-leaf-50 p-1.5 ring-1 ring-leaf-200 focus-within:ring-2 focus-within:ring-leaf-400">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  maxLength={2000}
                  placeholder={t("chat.placeholder")}
                  aria-label={t("chat.placeholder")}
                  className="max-h-[132px] min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] outline-none placeholder:text-leaf-900/40 focus-visible:outline-none"
                />
                {chat.streaming ? (
                  <button type="button" onClick={chat.stop} className="grid size-10 shrink-0 place-items-center rounded-xl bg-leaf-900 text-white" aria-label={t("chat.stop")} title={t("chat.stop")}>
                    <Square className="size-4 fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="grid size-10 shrink-0 place-items-center rounded-xl bg-leaf-700 text-white transition disabled:opacity-40"
                    aria-label={t("chat.send")}
                    title={t("chat.send")}
                  >
                    <ArrowUp className="size-5" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-center text-[11px] text-leaf-900/45">{t("chat.disclaimer")}</p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
