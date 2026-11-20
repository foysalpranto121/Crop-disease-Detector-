import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { normalizeLang, toBnDigits } from "../lib/format";

/** Fade + slide wrapper used for route transitions. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Rise-and-fade when scrolled into view. */
export function Reveal({ children, delay = 0, className, y = 28 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Number that counts up when it becomes visible. */
export function CountUp({ to, decimals = 0, prefix = "", suffix = "", duration = 1.8 }: { to: number; decimals?: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setValue(to);
      return;
    }
    const controls = animate(0, to, { duration, ease: "easeOut", onUpdate: setValue });
    return () => controls.stop();
  }, [inView, to, duration, reduce]);

  const text = value.toFixed(decimals);
  return (
    <span ref={ref}>
      {prefix}
      {normalizeLang(i18n.language) === "bn" ? toBnDigits(text) : text}
      {suffix}
    </span>
  );
}
