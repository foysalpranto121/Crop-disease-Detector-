import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/cn";

export function LeafMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="leafmark-g" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#146C2E" />
          <stop offset="1" stopColor="#22A447" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#leafmark-g)" />
      <path d="M32 52c-1-9 0-22 14-34-17 2-26 12-26 24 0 4 2 8 5 10" fill="#8EDB8F" />
      <path d="M32 52c0-10 3-19 10-27" stroke="#0B3D1F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="46" cy="16" r="3" fill="#E9C46A" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  const { t } = useTranslation();
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label={t("app.name")}>
      <LeafMark className="size-9 drop-shadow-sm" />
      <span className={cn("font-display text-[15px] leading-tight font-bold sm:text-base", light ? "text-white" : "text-leaf-900")}>
        {t("app.name")}
      </span>
    </Link>
  );
}
