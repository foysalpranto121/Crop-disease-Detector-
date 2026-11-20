import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import { DiseaseCard } from "../components/DiseaseCard";
import { ErrorState, PageHeader, Skeleton } from "../components/ui";
import { cn, container } from "../lib/cn";
import { formatNumber, pickL } from "../lib/format";
import { useApi } from "../lib/useApi";

export default function LibraryPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [params, setParams] = useSearchParams();
  const crop = params.get("crop") ?? "";
  const [query, setQuery] = useState("");

  const crops = useApi(() => api.getCrops(), []);
  const diseases = useApi(() => api.getDiseases(), []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (diseases.data ?? [])
      .filter((d) => !d.is_healthy)
      .filter((d) => !crop || d.crop.key === crop)
      .filter((d) => !q || [d.name.en, d.name.bn, d.crop.name.en, d.crop.name.bn, d.pathogen ?? ""].some((s) => s.toLowerCase().includes(q)));
  }, [diseases.data, crop, query]);

  const setCrop = (key: string) => setParams(key ? { crop: key } : {}, { replace: true });

  return (
    <>
      <PageHeader title={t("library.title")} subtitle={t("library.subtitle")}>
        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-leaf-900/40" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("library.search")}
            aria-label={t("library.search")}
            className="h-12 w-full rounded-full border border-leaf-200 bg-white ps-11 pe-4 shadow-sm outline-none focus:border-leaf-500"
          />
        </label>
      </PageHeader>

      <div className={container}>
        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label={t("history.all_crops")}>
          <Chip active={!crop} onClick={() => setCrop("")}>
            {t("library.all")}
          </Chip>
          {(crops.data ?? [])
            .filter((c) => c.supported && (c.disease_count ?? 0) > 0)
            .map((c) => (
              <Chip key={c.key} active={crop === c.key} onClick={() => setCrop(c.key)}>
                <span aria-hidden>{c.emoji}</span> {pickL(c.name, lang)}
              </Chip>
            ))}
        </div>

        {diseases.error ? (
          <ErrorState error={diseases.error} onRetry={diseases.reload} />
        ) : diseases.loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-leaf-900/60">{t("library.count", { n: formatNumber(visible.length, lang) })}</p>
            {visible.length === 0 ? (
              <p className="py-12 text-center text-leaf-900/60">{t("library.empty")}</p>
            ) : (
              <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <AnimatePresence mode="popLayout">
                  {visible.map((d) => (
                    <motion.div key={d.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <DiseaseCard disease={d} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition",
        active ? "bg-leaf-700 text-white shadow-md shadow-leaf-700/25" : "bg-white text-leaf-800 ring-1 ring-leaf-200 hover:bg-leaf-50",
      )}
    >
      {children}
    </button>
  );
}
