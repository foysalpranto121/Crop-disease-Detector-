import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, ScanLine } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import { TypeBadge } from "../components/DiseaseCard";
import { PhotoGallery } from "../components/DiseasePhoto";
import { TYPE_META } from "../components/diseaseMeta";
import { TreatmentTabs } from "../components/TreatmentTabs";
import { Badge, ButtonLink, Card, ErrorState, LoadingState } from "../components/ui";
import { cn, container } from "../lib/cn";
import { pickL } from "../lib/format";
import { useApi } from "../lib/useApi";

export default function DiseasePage() {
  const { id = "" } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: d, error, loading, reload } = useApi(() => api.getDisease(id), [id]);

  return (
    <div className={cn(container, "py-8")}>
      <Link to="/library" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-leaf-700 hover:text-leaf-900">
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("library.back")}
      </Link>

      {loading ? (
        <LoadingState rows={3} />
      ) : error || !d ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={cn("overflow-hidden bg-gradient-to-br p-6 sm:p-8", TYPE_META[d.type].gradient)}>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <PhotoGallery images={d.images} alt={`${pickL(d.crop.name, lang)} — ${pickL(d.name, lang)}`} emoji={d.crop.emoji} />
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="neutral">{pickL(d.crop.name, lang)}</Badge>
                    <TypeBadge type={d.type} />
                  </div>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{pickL(d.name, lang)}</h1>
                  {d.pathogen && <p className="mt-1 text-leaf-900/60 italic">{d.pathogen}</p>}
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
              <Card className="p-6">
                <h2 className="mb-2 font-semibold text-leaf-700">{t("result.symptoms")}</h2>
                <p className="leading-relaxed">{pickL(d.symptoms, lang)}</p>
              </Card>
              <Card className="p-6">
                <h2 className="mb-2 font-semibold text-soil-600">{t("result.causes")}</h2>
                <p className="leading-relaxed">{pickL(d.causes, lang)}</p>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold">{d.is_healthy ? t("result.care_title") : t("result.treatment")}</h2>
                <TreatmentTabs treatments={d.treatments} healthy={d.is_healthy} />
                <p className="mt-5 text-xs text-leaf-900/50">{t("result.disclaimer")}</p>
              </Card>
            </motion.div>
          </div>

          <div className="flex justify-center pt-4">
            {/* Long label (esp. Bangla): allow wrapping so it never overflows a phone screen */}
            <ButtonLink to="/diagnose" size="lg" className="h-auto! min-h-13 max-w-full py-3 text-center whitespace-normal!">
              <ScanLine className="size-5 shrink-0" /> {t("library.scan_cta")}
            </ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
