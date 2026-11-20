import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { History as HistoryIcon, ScanLine, Search, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import type { HistoryItem } from "../api/types";
import { Badge, ButtonLink, EmptyState, ErrorState, LoadingState, PageHeader } from "../components/ui";
import { cn, container } from "../lib/cn";
import { formatDate, formatPercent, pickL } from "../lib/format";
import { useApi } from "../lib/useApi";

export default function HistoryPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data, error, loading, reload, setData } = useApi(() => api.getHistory(), []);
  const [crop, setCrop] = useState("");
  const [query, setQuery] = useState("");

  const crops = useMemo(() => {
    const map = new Map<string, HistoryItem["disease"]>();
    data?.forEach((h) => h.disease && map.set(h.disease.crop.key, h.disease));
    return [...map.values()].flatMap((d) => (d ? [d.crop] : []));
  }, [data]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((h) => {
      if (crop && h.disease?.crop.key !== crop) return false;
      if (!q) return true;
      const d = h.disease;
      return !!d && [d.name.en, d.name.bn, d.crop.name.en, d.crop.name.bn].some((s) => s.toLowerCase().includes(q));
    });
  }, [data, crop, query]);

  const remove = async (id: number) => {
    if (!window.confirm(t("history.delete_confirm"))) return;
    await api.deleteHistoryItem(id);
    setData((prev) => prev?.filter((h) => h.id !== id));
  };

  return (
    <>
      <PageHeader title={t("history.title")} subtitle={t("history.subtitle")} />
      <div className={container}>
        {loading ? (
          <LoadingState rows={4} />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data?.length ? (
          <EmptyState
            icon={<HistoryIcon className="size-8" />}
            title={t("history.empty_title")}
            desc={t("history.empty_desc")}
            action={
              <ButtonLink to="/diagnose">
                <ScanLine className="size-4" /> {t("history.scan_first")}
              </ButtonLink>
            }
          />
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-leaf-900/40" aria-hidden />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("history.search")}
                  aria-label={t("history.search")}
                  className="h-11 w-full rounded-full border border-leaf-200 bg-white ps-11 pe-4 outline-none focus:border-leaf-500"
                />
              </label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                aria-label={t("history.all_crops")}
                className="h-11 rounded-full border border-leaf-200 bg-white px-4 outline-none focus:border-leaf-500"
              >
                <option value="">{t("history.all_crops")}</option>
                {crops.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.emoji} {pickL(c.name, lang)}
                  </option>
                ))}
              </select>
            </div>

            {items.length === 0 ? (
              <p className="py-10 text-center text-leaf-900/60">{t("history.no_match")}</p>
            ) : (
              <motion.ul layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {items.map((h, i) => (
                    <motion.li
                      key={h.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04 } }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-leaf-900/5 transition-shadow hover:shadow-lg"
                    >
                      <Link to={`/result/${h.id}`} className="flex gap-4 p-4">
                        <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-leaf-100">
                          {h.image_url ? (
                            <img src={h.image_url} alt="" className="size-full object-cover" loading="lazy" />
                          ) : (
                            <div className="grid size-full place-items-center text-4xl" aria-hidden>
                              {h.disease?.crop.emoji ?? "🍃"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          {h.disease && <Badge tone="neutral">{pickL(h.disease.crop.name, lang)}</Badge>}
                          <p className="mt-1 truncate font-semibold">
                            {h.status === "not_a_leaf" ? t("history.not_leaf") : h.disease ? pickL(h.disease.name, lang) : "—"}
                          </p>
                          <p className="mt-1 flex items-center gap-2 text-sm text-leaf-900/60">
                            <span
                              className={cn(
                                "inline-block size-2 rounded-full",
                                h.confidence_band === "high" ? "bg-leaf-500" : h.confidence_band === "medium" ? "bg-wheat-400" : "bg-danger-500",
                              )}
                              aria-hidden
                            />
                            {h.status === "low_confidence" ? t("history.uncertain") : formatPercent(h.confidence, lang)}
                          </p>
                          <p className="mt-1 text-xs text-leaf-900/50">{formatDate(h.created_at, lang)}</p>
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={() => void remove(h.id)}
                        className="absolute end-3 top-3 rounded-full p-2 text-leaf-900/40 transition hover:bg-danger-100 hover:text-danger-700 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                        aria-label={t("common.delete")}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
          </>
        )}
      </div>
    </>
  );
}
