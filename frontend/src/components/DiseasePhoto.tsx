import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/cn";

/** A real disease photo; falls back to the crop emoji if the image can't load. */
export function DiseasePhoto({ src, alt, emoji, className }: { src?: string | null; alt: string; emoji?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={cn("grid place-items-center bg-leaf-100 text-4xl", className)} aria-hidden>
        {emoji ?? "🍃"}
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={cn("object-cover", className)} />;
}

/** Large photo with clickable thumbnails (disease detail page). */
export function PhotoGallery({ images, alt, emoji }: { images: string[]; alt: string; emoji?: string }) {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  if (!images.length) return null;
  return (
    <figure className="w-full shrink-0 sm:w-72">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-lg ring-4 ring-white">
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0">
            <DiseasePhoto src={images[active]} alt={alt} emoji={emoji} className="size-full" />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-3 flex gap-2">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={t("library.view_photo", { n: i + 1 })}
            aria-pressed={i === active}
            className={cn("size-16 overflow-hidden rounded-xl ring-2 transition", i === active ? "ring-leaf-600" : "opacity-70 ring-transparent hover:opacity-100")}
          >
            <DiseasePhoto src={src} alt="" emoji={emoji} className="size-full" />
          </button>
        ))}
      </div>
      <figcaption className="mt-2 text-[11px] text-leaf-900/50">{t("library.photo_credit")}</figcaption>
    </figure>
  );
}
