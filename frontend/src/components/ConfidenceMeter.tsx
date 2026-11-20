import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import type { ConfidenceBand } from "../api/types";
import { formatPercent } from "../lib/format";
import { Badge } from "./ui";

const BAND_COLOR: Record<ConfidenceBand, string> = {
  high: "var(--color-leaf-500)",
  medium: "var(--color-wheat-400)",
  low: "var(--color-danger-500)",
};

/** Animated ring that fills to the confidence value; always paired with a text label. */
export function ConfidenceMeter({ value, band, size = 132 }: { value: number; band: ConfidenceBand; size?: number }) {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    const controls = animate(0, value, { duration: 1.4, ease: [0.16, 1, 0.3, 1], onUpdate: setShown });
    return () => controls.stop();
  }, [value, reduce]);

  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative"
        style={{ width: size, height: size }}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-label={t(`bands.${band}`)}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-leaf-100)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={BAND_COLOR[band]}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - shown)}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-display text-3xl font-bold tabular-nums">{formatPercent(shown, i18n.language)}</span>
        </div>
      </div>
      <Badge tone={band === "high" ? "green" : band === "medium" ? "wheat" : "danger"}>{t(`bands.${band}`)}</Badge>
    </div>
  );
}
