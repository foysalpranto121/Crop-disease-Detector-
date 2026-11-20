import { motion } from "motion/react";
import { House } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ButtonLink } from "../components/ui";
import { container } from "../lib/cn";

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className={`${container} flex flex-col items-center py-20 text-center`}>
      <svg viewBox="0 0 120 120" className="size-40" aria-hidden>
        <ellipse cx="60" cy="108" rx="34" ry="7" fill="var(--color-soil-400)" opacity="0.45" />
        <rect x="40" y="86" width="40" height="22" rx="4" fill="var(--color-soil-600)" />
        <motion.g style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }} initial={{ rotate: 0 }} animate={{ rotate: [0, 18, 14] }} transition={{ duration: 1.6, ease: "easeInOut" }}>
          <path d="M60 86 C60 70 60 56 62 42" stroke="var(--color-leaf-700)" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M61 56 C48 56 40 50 37 40 C50 39 58 45 61 56Z" fill="var(--color-wheat-400)" />
          <path d="M62 46 C74 46 82 40 85 30 C72 29 64 35 62 46Z" fill="var(--color-soil-400)" />
        </motion.g>
      </svg>
      <p className="mt-4 font-display text-6xl font-extrabold text-leaf-200">404</p>
      <h1 className="mt-2 text-2xl font-bold">{t("notfound.title")}</h1>
      <p className="mt-2 text-leaf-900/70">{t("notfound.desc")}</p>
      <ButtonLink to="/" className="mt-8">
        <House className="size-4" /> {t("notfound.home")}
      </ButtonLink>
    </div>
  );
}
