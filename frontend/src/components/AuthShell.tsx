import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { cn, container } from "../lib/cn";
import { DriftingLeaves } from "./DriftingLeaves";
import { LeafMark } from "./Logo";

/** Two-panel layout for login / register: illustrated green panel + form. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className={cn(container, "py-10")}>
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-leaf-900/5 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-leaf-700 via-leaf-600 to-leaf-500 p-10 text-white lg:block">
          <DriftingLeaves count={7} />
          <LeafMark className="size-14" />
          <h2 className="mt-8 text-3xl font-bold">{t("app.name")}</h2>
          <p className="mt-2 text-leaf-50/85">{t("app.tagline")}</p>
          <motion.svg viewBox="0 0 200 200" className="animate-float absolute -end-6 -bottom-6 size-64 text-white/15" aria-hidden>
            <path fill="currentColor" d="M100 190C60 150 20 120 30 70 40 20 100 10 150 20c40 40 40 100 10 140-20 20-40 30-60 30Z" />
          </motion.svg>
        </div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="p-6 sm:p-10">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1 text-leaf-900/65">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
