import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Hand, Leaf, Maximize, RotateCcw, ScanLine, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, toApiError, USE_MOCKS } from "../api/client";
import { ImagePicker } from "../components/ImagePicker";
import { AnalyzingStatus, ScanOverlay } from "../components/ScanOverlay";
import { Alert, Button, Card, PageHeader } from "../components/ui";
import { cn, container } from "../lib/cn";
import { pickL } from "../lib/format";
import { compressImage } from "../lib/image";
import { BETA_CROPS, PEST_CROPS, SUPPORTED_CROPS } from "../mocks/data/crops";

const CROP_KEY = "cdd.crop";

function loadCrop(): string {
  try {
    const saved = localStorage.getItem(CROP_KEY) ?? "";
    return SUPPORTED_CROPS.some((c) => c.key === saved) ? saved : "";
  } catch {
    return "";
  }
}

export default function DiagnosePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crop, setCrop] = useState<string>(loadCrop); // "" = detect automatically

  const chooseCrop = (key: string) => {
    setCrop(key);
    try {
      localStorage.setItem(CROP_KEY, key);
    } catch {
      /* storage blocked — the choice just isn't remembered */
    }
  };

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
      const result = await api.predict(small, file.name, crop || null);
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

          <Card className="p-4 sm:p-5">
            <fieldset disabled={analyzing}>
              <legend className="font-semibold">{t("diagnose.crop_title")}</legend>
              <p className="mt-0.5 text-sm text-leaf-900/70">{t("diagnose.crop_hint")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[{ key: "", emoji: "✨", label: t("diagnose.crop_auto") }, ...SUPPORTED_CROPS.map((c) => ({ key: c.key, emoji: c.emoji, label: pickL(c.name, lang) }))].map((c) => {
                  const selected = crop === c.key;
                  return (
                    <label
                      key={c.key || "auto"}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-leaf-600",
                        selected ? "bg-leaf-600 text-white ring-leaf-600" : "bg-white text-leaf-900 ring-leaf-900/15 hover:bg-leaf-50",
                      )}
                    >
                      <input type="radio" name="crop" value={c.key} checked={selected} onChange={() => chooseCrop(c.key)} className="sr-only" />
                      <span aria-hidden>{c.emoji}</span>
                      {c.label}
                      {BETA_CROPS.has(c.key) && (
                        <span className={cn("rounded-full px-1.5 text-[10px] font-bold uppercase", selected ? "bg-white/25" : "bg-wheat-200 text-soil-600")}>
                          {t("diagnose.beta")}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              {(crop === "" || PEST_CROPS.has(crop)) && (
                <p className="mt-3 text-xs text-leaf-900/60">{crop === "" ? t("diagnose.crop_auto_note") : t("diagnose.crop_pest_note")}</p>
              )}
            </fieldset>
          </Card>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Alert tone="danger" className="scroll-mt-24">{error}</Alert>
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
        </aside>
      </div>
    </>
  );
}
