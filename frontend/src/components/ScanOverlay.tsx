import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/cn";

/** The user's photo with a green scanning beam while the AI analyses it. */
export function ScanOverlay({ src, active, alt }: { src: string; active: boolean; alt: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-leaf-900 shadow-xl">
      <img src={src} alt={alt} className={cn("mx-auto max-h-[440px] w-full object-contain transition duration-700", active && "scale-[1.03] saturate-75")} />
      {active && (
        <>
          <div className="scan-grid absolute inset-0" aria-hidden />
          <div
            className="animate-scan absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-leaf-300 to-transparent shadow-[0_0_28px_8px_rgba(142,219,143,0.65)]"
            aria-hidden
          />
          {(["start-4 top-4 border-s-4 border-t-4", "end-4 top-4 border-e-4 border-t-4", "start-4 bottom-4 border-s-4 border-b-4", "end-4 bottom-4 border-e-4 border-b-4"] as const).map((pos) => (
            <span key={pos} className={cn("absolute size-10 rounded-md border-leaf-300", pos)} aria-hidden />
          ))}
        </>
      )}
    </div>
  );
}

/** A seedling that grows out of the soil — used as the analysing loader. */
export function SeedlingLoader({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={cn("size-16", className)} aria-hidden>
      <ellipse cx="40" cy="68" rx="26" ry="6" fill="var(--color-soil-400)" opacity="0.5" />
      <path d="M40 68 C40 55 40 45 40 34" stroke="var(--color-leaf-600)" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="60" className="animate-grow" />
      <motion.path
        d="M40 44 C30 44 22 38 20 28 C31 27 38 33 40 44Z"
        fill="var(--color-leaf-400)"
        style={{ transformBox: "fill-box", transformOrigin: "100% 100%" }}
        animate={{ scale: [0, 0, 1, 1] }}
        transition={{ duration: 1.6, times: [0, 0.35, 0.6, 1], repeat: Infinity }}
      />
      <motion.path
        d="M40 38 C50 38 58 32 60 22 C49 21 42 27 40 38Z"
        fill="var(--color-leaf-500)"
        style={{ transformBox: "fill-box", transformOrigin: "0% 100%" }}
        animate={{ scale: [0, 0, 1, 1] }}
        transition={{ duration: 1.6, times: [0, 0.45, 0.7, 1], repeat: Infinity }}
      />
    </svg>
  );
}

/** Rotating status text shown while analysing. */
export function AnalyzingStatus() {
  const { t } = useTranslation();
  const steps = [t("diagnose.step_checking"), t("diagnose.step_finding"), t("diagnose.step_preparing")];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((x) => Math.min(x + 1, steps.length - 1)), 1100);
    return () => window.clearInterval(id);
  }, [steps.length]);

  return (
    <div className="flex items-center justify-center gap-3" role="status" aria-live="polite">
      <SeedlingLoader className="size-12" />
      <AnimatePresence mode="wait">
        <motion.p key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="font-semibold text-leaf-800">
          {steps[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
