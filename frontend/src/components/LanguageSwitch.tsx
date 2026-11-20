import { useId } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { cn } from "../lib/cn";
import { normalizeLang } from "../lib/format";

const LANGS = [
  { code: "bn", label: "বাং" },
  { code: "en", label: "EN" },
] as const;

export function LanguageSwitch({ className, dark = false }: { className?: string; dark?: boolean }) {
  const { i18n, t } = useTranslation();
  const pillId = useId(); // unique per instance — navbar and footer both render a switch
  const current = normalizeLang(i18n.resolvedLanguage ?? i18n.language);
  return (
    <div role="group" aria-label={t("nav.language")} className={cn("relative flex rounded-full bg-leaf-100 p-1 ring-1 ring-leaf-200", className)}>
      {LANGS.map((l) => {
        const active = current === l.code;
        return (
          <button
            key={l.code}
            type="button"
            lang={l.code}
            aria-pressed={active}
            onClick={() => void i18n.changeLanguage(l.code)}
            className={cn(
              "relative z-10 rounded-full px-3 py-1 text-sm font-semibold transition-colors",
              active ? "text-white" : dark ? "text-leaf-100 hover:text-white" : "text-leaf-800 hover:text-leaf-600",
            )}
          >
            {active && (
              <motion.span
                layoutId={pillId}
                className="absolute inset-0 -z-10 rounded-full bg-leaf-700"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
