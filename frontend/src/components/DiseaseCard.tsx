import { useRef, type ReactNode, type PointerEvent } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DiseaseSummary, DiseaseType } from "../api/types";
import { cn } from "../lib/cn";
import { isTouchDevice, prefersReducedMotion } from "../lib/device";
import { pickL } from "../lib/format";
import { TYPE_META } from "./diseaseMeta";
import { DiseasePhoto } from "./DiseasePhoto";
import { Badge } from "./ui";

export function TypeBadge({ type }: { type: DiseaseType }) {
  const { t } = useTranslation();
  const { Icon, tone } = TYPE_META[type];
  return (
    <Badge tone={tone}>
      <Icon className="size-3.5" aria-hidden /> {t(`types.${type}`)}
    </Badge>
  );
}

/** Card that tilts slightly in 3D under the mouse (desktop only). */
export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = !isTouchDevice() && !prefersReducedMotion();

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current || document.documentElement.classList.contains("lite")) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(700px) rotateX(${-y * 8}deg) rotateY(${x * 10}deg) translateY(-4px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={reset} className={cn("transition-transform duration-200 ease-out will-change-transform", className)}>
      {children}
    </div>
  );
}

export function DiseaseCard({ disease }: { disease: DiseaseSummary }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const meta = TYPE_META[disease.type];
  return (
    <TiltCard className="h-full">
      <Link
        to={`/library/${disease.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-leaf-900/5 transition-shadow hover:shadow-xl hover:shadow-leaf-900/10"
      >
        <div className={cn("relative h-44 overflow-hidden bg-gradient-to-br", meta.gradient)}>
          <DiseasePhoto
            src={disease.images[0]}
            alt={pickL(disease.name, lang)}
            emoji={disease.crop.emoji}
            className="size-full transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute start-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-lg shadow-sm" aria-hidden>
            {disease.crop.emoji}
          </span>
          <span className="absolute end-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 shadow-sm" aria-hidden>
            <meta.Icon className="size-4 text-leaf-800" />
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="neutral">{pickL(disease.crop.name, lang)}</Badge>
            <TypeBadge type={disease.type} />
          </div>
          <h3 className="font-semibold leading-snug">{pickL(disease.name, lang)}</h3>
          {disease.pathogen && <p className="text-xs text-leaf-900/50 italic">{disease.pathogen}</p>}
          <ChevronRight className="mt-auto ms-auto size-5 text-leaf-500 transition-transform group-hover:translate-x-1 rtl:rotate-180" aria-hidden />
        </div>
      </Link>
    </TiltCard>
  );
}
