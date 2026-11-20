import type { L, Lang } from "../api/types";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBnDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export function localeOf(lang: string): string {
  return lang.startsWith("bn") ? "bn-BD" : "en-US";
}

export function normalizeLang(lang: string | undefined): Lang {
  return lang?.startsWith("bn") ? "bn" : "en";
}

/** Pick the right language from a bilingual value, falling back to English. */
export function pickL(value: L | null | undefined, lang: string): string {
  if (!value) return "";
  return (normalizeLang(lang) === "bn" ? value.bn : value.en) || value.en || value.bn;
}

export function formatNumber(n: number, lang: string): string {
  const s = new Intl.NumberFormat("en-US").format(n);
  return normalizeLang(lang) === "bn" ? toBnDigits(s) : s;
}

/** 0.943 -> "94%" (or "৯৪%" in Bangla). */
export function formatPercent(fraction: number, lang: string): string {
  const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
  return normalizeLang(lang) === "bn" ? `${toBnDigits(pct)}%` : `${pct}%`;
}

/** "2026-11-20" -> "Fri" (or "শুক্র" in Bangla). */
export function formatWeekday(isoDate: string, lang: string): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  return new Intl.DateTimeFormat(localeOf(lang), { weekday: "short" }).format(d);
}

export function formatDate(iso: string, lang: string, withTime = true): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const s = new Intl.DateTimeFormat(localeOf(lang), {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(d);
  return normalizeLang(lang) === "bn" ? toBnDigits(s) : s;
}
