import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { CircleCheck, CircleX, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn, container } from "../lib/cn";
import type { ApiError } from "../api/client";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./buttonClasses";

// ---------- Button ----------
type Variant = ButtonVariant;
type Size = ButtonSize;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean };

export function Button({ variant, size, loading, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} disabled={loading || disabled} {...rest}>
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({ variant, size, className, ...rest }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClasses(variant, size, className)} {...rest} />;
}

// ---------- Card ----------
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  // Only add the default white background when the caller doesn't set its own bg-* class
  // (Tailwind can't reliably override one bg utility with another of the same kind).
  const hasBg = /(^|\s)bg-/.test(className ?? "");
  return <div className={cn("rounded-3xl shadow-sm ring-1 ring-leaf-900/5", !hasBg && "bg-white", className)} {...rest} />;
}

// ---------- Badge ----------
type Tone = "green" | "wheat" | "danger" | "sky" | "neutral" | "soil" | "dark";
const toneClasses: Record<Tone, string> = {
  green: "bg-leaf-100 text-leaf-800 ring-leaf-200",
  wheat: "bg-wheat-200/70 text-soil-600 ring-wheat-400/50",
  danger: "bg-danger-100 text-danger-700 ring-danger-500/30",
  sky: "bg-sky-200 text-leaf-900 ring-sky-300",
  neutral: "bg-stone-100 text-stone-700 ring-stone-200",
  soil: "bg-soil-400/15 text-soil-600 ring-soil-400/30",
  dark: "bg-leaf-900/80 text-white ring-white/10",
};

export function Badge({ tone = "green", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", toneClasses[tone], className)}>
      {children}
    </span>
  );
}

// ---------- Alert ----------
type AlertTone = "info" | "success" | "warning" | "danger";
const alertStyles: Record<AlertTone, { box: string; Icon: typeof Info }> = {
  info: { box: "bg-sky-200/60 text-leaf-900 ring-sky-300", Icon: Info },
  success: { box: "bg-leaf-100 text-leaf-900 ring-leaf-300", Icon: CircleCheck },
  warning: { box: "bg-wheat-200/70 text-soil-600 ring-wheat-400", Icon: TriangleAlert },
  danger: { box: "bg-danger-100 text-danger-700 ring-danger-500/40", Icon: CircleX },
};

export function Alert({ tone = "info", title, children, className }: { tone?: AlertTone; title?: ReactNode; children?: ReactNode; className?: string }) {
  const { box, Icon } = alertStyles[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-2xl p-4 ring-1", box, className)}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn("text-sm", title && "mt-1 opacity-90")}>{children}</div>}
      </div>
    </div>
  );
}

// ---------- Loading / empty / error ----------
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-leaf-100", className)} aria-hidden />;
}

export function LoadingState({ rows = 3 }: { rows?: number }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3" aria-busy="true" aria-label={t("common.loading")}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, desc, action }: { icon: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-leaf-200 bg-white/60 px-6 py-14 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-leaf-100 text-leaf-600">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {desc && <p className="mt-1 max-w-sm text-leaf-900/70">{desc}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error?: ApiError; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <Alert tone="danger" title={t("common.error_title")}>
      <p>{error?.code === "NETWORK" ? t("diagnose.err_NETWORK") : error?.message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </Alert>
  );
}

// ---------- Page header ----------
export function PageHeader({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-leaf-100 via-leaf-50 to-cream-50">
      <svg className="pointer-events-none absolute -end-16 -top-10 size-72 text-leaf-200/70" viewBox="0 0 200 200" aria-hidden>
        <path fill="currentColor" d="M100 190C60 150 20 120 30 70 40 20 100 10 150 20c40 40 40 100 10 140-20 20-40 30-60 30Z" />
      </svg>
      <div className={cn(container, "relative py-10 sm:py-14")}>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-leaf-900/70 sm:text-lg">{subtitle}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}
