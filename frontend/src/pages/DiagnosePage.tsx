import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Hand, Leaf, Maximize, RotateCcw, ScanLine, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, toApiError, USE_MOCKS } from "../api/client";
import { ImagePicker } from "../components/ImagePicker";
import { AnalyzingStatus, ScanOverlay } from "../components/ScanOverlay";
import { Alert, Badge, Button, Card, PageHeader } from "../components/ui";
import { cn, container } from "../lib/cn";
import { pickL } from "../lib/format";
import { compressImage } from "../lib/image";
import { COMING_SOON_CROPS, SUPPORTED_CROPS } from "../mocks/data/crops";

export default function DiagnosePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const pick = (f: File) => {
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };

  const analyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    try {
      const small = await compressImage(file);
      const result = await api.predict(small, file.name);
      navigate(`/result/${result.id}`, { state: { result } });
    } catch (e) {
      const err = toApiError(e);
      setError(t(`diagnose.err_${err.code}`, { defaultValue: t("diagnose.err_generic") }));
      setAnalyzing(false);
    }
  };

  const tips = [
    { Icon: Leaf, text: t("diagnose.tip_one_leaf") },
    { Icon: Sun, text: t("diagnose.tip_daylight") },
    { Icon: Maximize, text: t("diagnose.tip_fill") },
    { Icon: Hand, text: t("diagnose.tip_steady") },
  ];

  return (
    <>
      <PageHeader title={t("diagnose.title")} subtitle={t("diagnose.subtitle")} />
      <div className={cn(container, "grid gap-8 pb-8 lg:grid-cols-[minmax(0,1fr)_340px]")}>
        <div className="min-w-0 space-y-4">
          {USE_MOCKS && <Alert tone="info">{t("common.demo_mode")}</Alert>}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Alert tone="danger">{error}</Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div key="picker" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
                <ImagePicker onPick={pick} onError={(reason) => setError(t(`diagnose.err_${reason}`))} />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.92, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="space-y-5"
              >
                <ScanOverlay src={preview} active={analyzing} alt={t("result.your_photo")} />
                {analyzing ? (
                  <AnalyzingStatus />
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button variant="secondary" size="lg" onClick={reset}>
                      <RotateCcw className="size-5" /> {t("diagnose.retake")}
                    </Button>
                    <Button size="lg" onClick={() => void analyze()}>
                      <ScanLine className="size-5" /> {t("diagnose.analyze")}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 font-semibold">{t("diagnose.tips_title")}</h2>
            <ul className="grid grid-cols-2 gap-3">
              {tips.map(({ Icon, text }) => (
                <li key={text} className="flex flex-col items-center gap-2 rounded-2xl bg-leaf-50 p-3 text-center text-sm">
                  <span className="grid size-10 place-items-center rounded-full bg-white text-leaf-600 shadow-sm">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">{t("diagnose.supported_title")}</h2>
            <div className="flex flex-wrap gap-1.5">
              {SUPPORTED_CROPS.map((c) => (
                <Badge key={c.key} tone="green">
                  <span aria-hidden>{c.emoji}</span> {pickL(c.name, lang)}
                </Badge>
              ))}
              {COMING_SOON_CROPS.map((c) => (
                <Badge key={c.key} tone="neutral" className="opacity-70">
                  <span aria-hidden>{c.emoji}</span> {pickL(c.name, lang)} · {t("landing.coming_soon")}
                </Badge>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
