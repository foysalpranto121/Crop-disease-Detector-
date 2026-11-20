import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FlaskConical, Leaf, ShieldAlert, ShieldCheck, Beaker } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Treatment, TreatmentType } from "../api/types";
import { cn } from "../lib/cn";
import { pickL } from "../lib/format";
import { Alert } from "./ui";

const TYPES: TreatmentType[] = ["chemical", "organic", "preventive"];
const ICONS = { chemical: FlaskConical, organic: Leaf, preventive: ShieldCheck } as const;

export function TreatmentTabs({ treatments, hideChemical = false, healthy = false }: { treatments: Treatment[]; hideChemical?: boolean; healthy?: boolean }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const tabs = healthy ? (["preventive"] as TreatmentType[]) : TYPES;
  const [active, setActive] = useState<TreatmentType>(tabs[0]);
  const pillId = useId();
  const items = treatments.filter((x) => x.type === active);

  return (
    <div>
      {tabs.length > 1 && (
        <div role="tablist" aria-label={t("result.treatment")} className="mb-4 flex gap-1 rounded-2xl bg-leaf-50 p-1 ring-1 ring-leaf-100">
          {tabs.map((type) => {
            const Icon = ICONS[type];
            const selected = type === active;
            return (
              <button
                key={type}
                role="tab"
                type="button"
                aria-selected={selected}
                onClick={() => setActive(type)}
                className={cn(
                  "relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-sm font-semibold transition-colors",
                  selected ? "text-leaf-900" : "text-leaf-800/60 hover:text-leaf-800",
                )}
              >
                {selected && <motion.span layoutId={pillId} className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <Icon className="relative size-4" aria-hidden />
                <span className="relative">{t(`treatment_types.${type}`)}</span>
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          role="tabpanel"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {active === "chemical" && hideChemical ? (
            <Alert tone="warning">{t("result.chemical_hidden")}</Alert>
          ) : items.length === 0 ? (
            <p className="text-leaf-900/60">{t("result.no_treatment")}</p>
          ) : (
            items.map((tr, i) => (
              <motion.div
                key={tr.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl bg-leaf-50/70 p-4 ring-1 ring-leaf-100"
              >
                <p className="leading-relaxed">{pickL(tr.remedy, lang)}</p>
                {tr.dosage && (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-leaf-800 ring-1 ring-leaf-200">
                    <Beaker className="size-4" aria-hidden />
                    {t("result.dosage")}: {pickL(tr.dosage, lang)}
                  </p>
                )}
                {tr.precautions && (
                  <p className="mt-3 flex gap-2 text-sm text-soil-600">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>
                      <strong>{t("result.precautions")}:</strong> {pickL(tr.precautions, lang)}
                    </span>
                  </p>
                )}
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
