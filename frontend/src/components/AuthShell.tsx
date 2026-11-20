import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { CircleCheck, Languages, Sprout } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn, container } from "../lib/cn";
import { DriftingLeaves } from "./DriftingLeaves";
import { LeafMark } from "./Logo";

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } };
const rise: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };

/** One row of the auth form; rows fade up one after another. */
export function AuthItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={rise} className={className}>
      {children}
    </motion.div>
  );
}

/** A small card that floats gently (static when the user prefers reduced motion). */
function FloatingChip({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={reduce ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, y: [0, -10, 0] }}
      transition={{ opacity: { delay: 0.5 + delay, duration: 0.4 }, scale: { delay: 0.5 + delay, duration: 0.4 }, y: { delay, duration: 5, repeat: Infinity, ease: "easeInOut" } }}
      className={cn("absolute rounded-2xl bg-white/95 px-3.5 py-2.5 text-leaf-900 shadow-xl shadow-leaf-900/25 ring-1 ring-white", className)}
    >
      {children}
    </motion.div>
  );
}

/** Leaf with disease spots and a scanning line — the product in one picture. */
function ScanningLeaf() {
  return (
    <div className="relative grid size-64 place-items-center">
      <span className="animate-pulse-ring absolute inset-6 rounded-full border-2 border-white/30" aria-hidden />
      <span className="animate-pulse-ring absolute inset-6 rounded-full border-2 border-white/20 [animation-delay:1s]" aria-hidden />
      <div className="absolute inset-4 rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm" />
      <div className="animate-float relative h-52 w-44 overflow-hidden">
        <svg viewBox="0 0 200 240" className="size-full drop-shadow-2xl" aria-hidden>
          <defs>
            <linearGradient id="auth-leaf" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8EDB8F" />
              <stop offset="0.55" stopColor="#22A447" />
              <stop offset="1" stopColor="#146C2E" />
            </linearGradient>
          </defs>
          <path d="M100 8C38 52 18 122 48 182c20 38 52 50 52 50s32-12 52-50c30-60 10-130-52-174Z" fill="url(#auth-leaf)" />
          <path d="M100 22v206" stroke="#0E5223" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
          {[60, 95, 130, 165].map((y) => (
            <g key={y} stroke="#0E5223" strokeWidth="2" strokeLinecap="round" opacity="0.35" fill="none">
              <path d={`M100 ${y}c-18-6-32-16-42-30`} />
              <path d={`M100 ${y}c18-6 32-16 42-30`} />
            </g>
          ))}
          {[
            [72, 96, 9],
            [128, 118, 12],
            [86, 150, 7],
            [120, 172, 9],
            [110, 78, 6],
          ].map(([cx, cy, r]) => (
            <g key={`${cx}-${cy}`}>
              <circle cx={cx} cy={cy} r={r + 4} fill="#E9C46A" opacity="0.55" />
              <circle cx={cx} cy={cy} r={r} fill="#6B3E1F" />
            </g>
          ))}
        </svg>
        <div className="decorative-motion animate-scan absolute inset-x-2 h-1 rounded-full bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_18px_4px_rgba(255,255,255,0.75)]" />
      </div>
    </div>
  );
}

function VisualPanel() {
  const { t } = useTranslation();
  const perks = [t("auth.perk1"), t("auth.perk2"), t("auth.perk3")];
  return (
    <div className="relative hidden min-h-[680px] flex-col overflow-hidden bg-gradient-to-br from-leaf-900 via-leaf-700 to-leaf-500 p-10 text-white lg:flex">
      {/* moving glows + dotted texture */}
      <div className="animate-blob absolute -top-24 -left-24 size-80 rounded-full bg-leaf-300/30 blur-3xl" aria-hidden />
      <div className="animate-blob absolute -right-20 -bottom-28 size-96 rounded-full bg-wheat-400/25 blur-3xl [animation-delay:-6s]" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden />
      <DriftingLeaves count={6} />

      <div className="relative flex items-center gap-3">
        <LeafMark className="size-11 drop-shadow" />
        <span className="font-display text-lg font-bold">{t("app.name")}</span>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative mt-10">
        <h2 className="text-3xl leading-tight font-bold text-balance">{t("auth.panel_title")}</h2>
        <p className="mt-3 max-w-sm text-white/80">{t("auth.panel_sub")}</p>
      </motion.div>

      <div className="relative grid flex-1 place-items-center py-6">
        <ScanningLeaf />
        <FloatingChip className="top-6 left-0" delay={0}>
          <p className="text-xs font-semibold text-leaf-900/60">🍅 {t("auth.chip_result")}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-2 w-28 overflow-hidden rounded-full bg-leaf-100">
              <motion.div initial={{ width: 0 }} animate={{ width: "94%" }} transition={{ delay: 1, duration: 1.4, ease: "easeOut" }} className="h-full rounded-full bg-gradient-to-r from-leaf-400 to-leaf-600" />
            </div>
            <span className="text-sm font-bold text-leaf-700">94%</span>
          </div>
        </FloatingChip>
        <FloatingChip className="top-24 right-0" delay={1.2}>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Languages className="size-4 text-leaf-600" aria-hidden /> বাংলা · English
          </p>
        </FloatingChip>
        <FloatingChip className="bottom-4 left-6" delay={2.2}>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Sprout className="size-4 text-leaf-600" aria-hidden /> {t("auth.chip_crops")}
          </p>
        </FloatingChip>
      </div>

      <motion.ul variants={stagger} initial="hidden" animate="show" className="relative space-y-2.5">
        {perks.map((p) => (
          <motion.li key={p} variants={rise} className="flex items-center gap-2.5 text-[15px] text-white/90">
            <CircleCheck className="size-5 shrink-0 text-wheat-400" aria-hidden /> {p}
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

/** Login / register layout: animated product panel + form, on a softly moving background. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="animate-blob absolute top-10 -left-32 size-96 rounded-full bg-leaf-200/60 blur-3xl" />
        <div className="animate-blob absolute top-40 -right-24 size-[28rem] rounded-full bg-wheat-200/70 blur-3xl [animation-delay:-5s]" />
        <div className="animate-blob absolute -bottom-32 left-1/3 size-96 rounded-full bg-sky-200/50 blur-3xl [animation-delay:-10s]" />
      </div>
      <DriftingLeaves count={8} />

      <div className={cn(container, "py-8 sm:py-14")}>
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto grid max-w-5xl grid-cols-1 overflow-hidden rounded-[2rem] bg-white/90 shadow-2xl shadow-leaf-900/10 ring-1 ring-white backdrop-blur-xl lg:grid-cols-[1.05fr_1fr]"
        >
          <VisualPanel />

          <div className="min-w-0 p-6 sm:p-10">
            {/* Compact animated banner on phones and tablets */}
            <div className="relative mb-7 flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-leaf-800 to-leaf-500 p-4 text-white lg:hidden">
              <span className="animate-shine absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" aria-hidden />
              <LeafMark className="animate-float size-11 shrink-0" />
              <div className="relative min-w-0">
                <p className="font-display font-bold">{t("app.name")}</p>
                <p className="truncate text-sm text-white/80">{t("auth.panel_title")}</p>
              </div>
            </div>

            <motion.div variants={stagger} initial="hidden" animate="show">
              <AuthItem>
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                <p className="mt-1.5 text-leaf-900/65">{subtitle}</p>
              </AuthItem>
              <div className="mt-8">{children}</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
