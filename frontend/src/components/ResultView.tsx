import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Phone, Printer, RotateCcw, ScanLine, Share2, Sparkles, ThumbsDown, ThumbsUp, Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";
import { diagnosisFromResult } from "../api/chat";
import { api } from "../api/client";
import { useChat } from "../features/ChatContext";
import type { PredictionResult } from "../api/types";
import { cn } from "../lib/cn";
import { BETA_CROPS } from "../mocks/data/crops";
import { formatDate, formatNumber, formatPercent, pickL } from "../lib/format";
import { DiseasePhoto } from "./DiseasePhoto";
import { Celebration } from "./Celebration";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { TypeBadge } from "./DiseaseCard";
import { TreatmentTabs } from "./TreatmentTabs";
import { Alert, Badge, Button, ButtonLink, Card } from "./ui";

const HELPLINE = "16123"; // Krishi Call Center (Department of Agricultural Extension, Bangladesh)

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export function ResultView({ result }: { result: PredictionResult }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const d = result.disease;
  const isHealthy = result.status === "ok" && !!d?.is_healthy;
  const notLeaf = result.status === "not_a_leaf" || !d;
  const lowConf = result.status === "low_confidence";
  const { setDiagnosis, ask } = useChat();

  // Let Krishi AI know which scan the user is looking at, so "how do I treat this?" just works.
  useEffect(() => {
    setDiagnosis(diagnosisFromResult(result, lang));
    return () => setDiagnosis(null);
  }, [result, lang, setDiagnosis]);

  const title = notLeaf ? t("result.not_leaf_title") : isHealthy ? t("result.healthy_title") : pickL(d.name, lang);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-6">
        {/* Summary card */}
        <motion.div {...rise(0)}>
          <Card className="relative overflow-hidden p-5 sm:p-6">
            {isHealthy && <Celebration />}
            <div className="grid gap-5 sm:grid-cols-[160px_minmax(0,1fr)_auto] sm:items-center">
              <div className="overflow-hidden rounded-2xl bg-leaf-100">
                {result.image_url ? (
                  <img src={result.image_url} alt={t("result.your_photo")} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="grid aspect-square place-items-center text-6xl" aria-hidden>
                    {d?.crop.emoji ?? "🍃"}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                {d && !notLeaf && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <Badge tone="neutral">
                      <span aria-hidden>{d.crop.emoji}</span> {pickL(d.crop.name, lang)}
                    </Badge>
                    <TypeBadge type={d.type} />
                  </div>
                )}
                {!notLeaf && !isHealthy && <p className="text-sm font-medium text-leaf-900/60">{t("result.likely")}</p>}
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
                {d?.pathogen && !notLeaf && (
                  <p className="mt-1 text-sm text-leaf-900/60">
                    {t("result.pathogen")}: <span className="italic">{d.pathogen}</span>
                  </p>
                )}
                <p className="mt-2 text-xs text-leaf-900/50">
                  {t("result.scanned_at")}: {formatDate(result.created_at, lang)}
                </p>
              </div>
              {!notLeaf && (
                <div className="justify-self-center">
                  <ConfidenceMeter value={result.confidence} band={result.confidence_band} />
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Status banner */}
        <motion.div {...rise(0.1)}>
          {isHealthy && <Alert tone="success" title={t("result.healthy_title")}>{t("result.healthy_desc")}</Alert>}
          {lowConf && <Alert tone="warning" title={t("result.low_title")}>{t("result.low_desc")}</Alert>}
          {d && !notLeaf && BETA_CROPS.has(d.crop.key) && (
            <Alert tone="info" title={t("result.beta_title")}>
              {t("result.beta_desc")}
            </Alert>
          )}
          {notLeaf && (
            <Alert tone="danger" title={t("result.not_leaf_title")}>
              <p>{t("result.not_leaf_desc")}</p>
              <ButtonLink to="/diagnose" size="sm" variant="secondary" className="mt-3">
                <RotateCcw className="size-4" /> {t("result.retake")}
              </ButtonLink>
            </Alert>
          )}
        </motion.div>

        {/* Compare the user's leaf with real reference photos of the predicted class */}
        {d && !notLeaf && d.images.length > 0 && (
          <motion.div {...rise(0.14)}>
            <Card className="p-5 sm:p-6">
              <h3 className="text-lg font-semibold">{t("result.compare_title")}</h3>
              <p className="mt-1 text-sm text-leaf-900/65">
                {isHealthy ? t("result.compare_healthy_desc", { crop: pickL(d.crop.name, lang) }) : t("result.compare_desc", { disease: pickL(d.name, lang) })}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <figure>
                  <DiseasePhoto src={result.image_url} alt={t("result.your_photo")} emoji={d.crop.emoji} className="aspect-square w-full rounded-2xl ring-3 ring-leaf-500" />
                  <figcaption className="mt-1.5 text-center text-xs font-semibold text-leaf-700">{t("result.your_leaf")}</figcaption>
                </figure>
                {d.images.map((src, i) => (
                  <figure key={src}>
                    <DiseasePhoto src={src} alt={`${pickL(d.name, lang)} — ${t("result.example", { n: i + 1 })}`} emoji={d.crop.emoji} className="aspect-square w-full rounded-2xl" />
                    <figcaption className="mt-1.5 text-center text-xs text-leaf-900/55">{t("result.example", { n: formatNumber(i + 1, lang) })}</figcaption>
                  </figure>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-leaf-900/45">{t("library.photo_credit")}</p>
            </Card>
          </motion.div>
        )}

        {/* About */}
        {d && !notLeaf && !isHealthy && (
          <motion.div {...rise(0.18)}>
            <Card className="p-5 sm:p-6">
              <h3 className="mb-4 text-lg font-semibold">{t("result.about")}</h3>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-leaf-50 p-4">
                  <dt className="mb-1 text-sm font-semibold text-leaf-700">{t("result.symptoms")}</dt>
                  <dd className="leading-relaxed">{pickL(d.symptoms, lang)}</dd>
                </div>
                <div className="rounded-2xl bg-wheat-200/40 p-4">
                  <dt className="mb-1 text-sm font-semibold text-soil-600">{t("result.causes")}</dt>
                  <dd className="leading-relaxed">{pickL(d.causes, lang)}</dd>
                </div>
              </dl>
            </Card>
          </motion.div>
        )}

        {/* Treatment */}
        {d && !notLeaf && (
          <motion.div {...rise(0.26)}>
            <Card className="p-5 sm:p-6">
              <h3 className="mb-4 text-lg font-semibold">{isHealthy ? t("result.care_title") : t("result.treatment")}</h3>
              <TreatmentTabs treatments={d.treatments} hideChemical={lowConf} healthy={d.is_healthy} />
            </Card>
          </motion.div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-6">
        {result.top_k.length > 1 && (
          <motion.div {...rise(0.15)}>
            <Card className="p-5">
              <h3 className="mb-4 font-semibold">{lowConf ? t("result.likely") : t("result.other_possibilities")}</h3>
              <ul className="space-y-3">
                {result.top_k.map((k, i) => (
                  <li key={k.disease_id} className="flex items-center gap-3">
                    <Link to={`/library/${k.disease_id}`} className="shrink-0 overflow-hidden rounded-xl ring-1 ring-leaf-900/10 transition hover:ring-leaf-500" aria-label={pickL(k.name, lang)}>
                      <DiseasePhoto src={k.image} alt="" className="size-12" />
                    </Link>
                    <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className={cn("min-w-0 truncate", i === 0 && "font-semibold")}>
                        {pickL(k.crop, lang)} · {pickL(k.name, lang)}
                      </span>
                      <span className="tabular-nums text-leaf-900/70">{formatPercent(k.confidence, lang)}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-leaf-100">
                      <motion.div
                        className={cn("h-full rounded-full", i === 0 ? "bg-leaf-500" : "bg-leaf-300")}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(2, k.confidence * 100)}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                      />
                    </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}

        {d && !notLeaf && (
          <motion.div {...rise(0.18)}>
            <button
              type="button"
              onClick={() => ask(t("chat.ask_about_prompt", { crop: pickL(d.crop.name, lang), disease: pickL(d.name, lang) }))}
              className="no-print group flex w-full items-center gap-3 rounded-3xl bg-gradient-to-r from-leaf-600 to-leaf-500 p-4 text-start text-white shadow-lg shadow-leaf-700/20 transition hover:shadow-xl"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/15 transition group-hover:scale-110">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <span className="font-semibold">{t("chat.ask_about")}</span>
            </button>
          </motion.div>
        )}

        {!notLeaf && (
          <motion.div {...rise(0.22)}>
            <FeedbackBox predictionId={result.id} initial={result.feedback?.is_correct} />
          </motion.div>
        )}

        <motion.div {...rise(0.3)}>
          <Card className="bg-leaf-900 p-5 text-leaf-50">
            <div className="flex items-center gap-2">
              <Stethoscope className="size-5 text-leaf-300" aria-hidden />
              <h3 className="font-semibold">{t("result.help_title")}</h3>
            </div>
            <a href={`tel:${HELPLINE}`} className="mt-4 flex items-center gap-3 rounded-2xl bg-white/10 p-3 transition hover:bg-white/15">
              <span className="grid size-10 place-items-center rounded-full bg-leaf-500 text-white">
                <Phone className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm text-leaf-200">{t("result.help_call")}</span>
                <span className="font-display text-xl font-bold tracking-wider">{HELPLINE}</span>
              </span>
            </a>
            <p className="mt-3 text-sm text-leaf-200/80">{t("result.help_officer")}</p>
          </Card>
        </motion.div>

        <ResultActions result={result} />

        <p className="rounded-2xl bg-white/70 p-4 text-xs leading-relaxed text-leaf-900/60 ring-1 ring-leaf-900/5">{t("result.disclaimer")}</p>
      </aside>
    </div>
  );
}

function FeedbackBox({ predictionId, initial }: { predictionId: number; initial?: boolean }) {
  const { t } = useTranslation();
  const [choice, setChoice] = useState<boolean | null>(initial ?? null);
  const [sent, setSent] = useState(initial !== undefined && initial !== null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (isCorrect: boolean, text?: string) => {
    setBusy(true);
    try {
      await api.sendFeedback(predictionId, isCorrect, text);
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      {sent ? (
        <motion.p initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-medium text-leaf-700">
          {t("result.feedback_thanks")}
        </motion.p>
      ) : (
        <>
          <h3 className="font-semibold">{t("result.feedback_q")}</h3>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant={choice === true ? "primary" : "secondary"} loading={busy && choice === true} onClick={() => (setChoice(true), void send(true))}>
              <ThumbsUp className="size-4" /> {t("result.yes")}
            </Button>
            <Button size="sm" variant={choice === false ? "danger" : "secondary"} onClick={() => setChoice(false)}>
              <ThumbsDown className="size-4" /> {t("result.no")}
            </Button>
          </div>
          {choice === false && (
            <form
              className="mt-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send(false, comment);
              }}
            >
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder={t("result.feedback_comment")}
                className="w-full rounded-xl border border-leaf-200 bg-leaf-50/50 p-3 text-sm outline-none focus:border-leaf-500"
              />
              <Button type="submit" size="sm" loading={busy}>
                {t("result.send")}
              </Button>
            </form>
          )}
        </>
      )}
    </Card>
  );
}

function ResultActions({ result }: { result: PredictionResult }) {
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/result/${result.id}`;
    const text = result.disease ? `${pickL(result.disease.crop.name, i18n.language)}: ${pickL(result.disease.name, i18n.language)}` : t("app.name");
    if (navigator.share) {
      await navigator.share({ title: t("app.name"), text, url }).catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="no-print grid grid-cols-2 gap-2">
      <ButtonLink to="/diagnose" className="col-span-2">
        <ScanLine className="size-4" /> {t("result.scan_another")}
      </ButtonLink>
      <Button variant="secondary" onClick={() => void share()}>
        <Share2 className="size-4" /> {copied ? t("result.copied") : t("result.share")}
      </Button>
      <Button variant="secondary" onClick={() => window.print()}>
        <Printer className="size-4" /> {t("result.print")}
      </Button>
    </div>
  );
}
