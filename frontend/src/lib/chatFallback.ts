import type { DiagnosisContext } from "../api/chat";
import type { Disease, Lang } from "../api/types";
import i18n from "../i18n";
import { pickL } from "./format";

/*
 * Offline answers for the chatbot, used when the AI service is not configured or unreachable.
 * Searches the app's own disease knowledge base, so the chat is still useful without internet/AI.
 */

const STOP_WORDS = new Set(["with", "and", "the", "plant", "রোগ", "এবং"]);

export function findDisease(question: string, diseases: Disease[]): Disease | null {
  const q = question.toLowerCase();
  let best: Disease | null = null;
  let bestScore = 0;
  for (const d of diseases) {
    let score = 0;
    const cropWords = [d.crop.key, ...d.crop.name.en.toLowerCase().split(/[^a-z]+/), d.crop.name.bn].filter((w) => w.length >= 3);
    if (cropWords.some((w) => q.includes(w))) score += 2;
    const nameWords = [...d.name.en.toLowerCase().split(/[^a-z]+/), ...d.name.bn.split(/[\s()/,—-]+/)].filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
    for (const w of new Set(nameWords)) if (q.includes(w)) score += 1;
    if (d.is_healthy && !/(healthy|সুস্থ)/.test(q)) score -= 2;
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return bestScore >= 2 ? best : null;
}

export async function offlineAnswer(question: string, lang: Lang, context: DiagnosisContext | null): Promise<string> {
  const [{ buildDiseases }, { SUPPORTED_CROPS }] = await Promise.all([import("../mocks/data/diseases"), import("../mocks/data/crops")]);
  const diseases = buildDiseases();
  const t = i18n.getFixedT(lang);

  const d = findDisease(question, diseases) ?? (context ? (diseases.find((x) => x.id === context.diseaseId) ?? null) : null);
  if (!d) {
    return t("chat.offline_generic", { crops: SUPPORTED_CROPS.map((c) => pickL(c.name, lang)).join(", ") });
  }

  const parts = [`**${pickL(d.crop.name, lang)} — ${pickL(d.name, lang)}**`, `**${t("result.symptoms")}:** ${pickL(d.symptoms, lang)}`];
  if (!d.is_healthy) parts.push(`**${t("result.causes")}:** ${pickL(d.causes, lang)}`);
  const lines = d.treatments.map(
    (tr) => `- **${t(`treatment_types.${tr.type}`)}:** ${pickL(tr.remedy, lang)}${tr.dosage ? ` (${t("result.dosage")}: ${pickL(tr.dosage, lang)})` : ""}`,
  );
  parts.push(`**${d.is_healthy ? t("result.care_title") : t("result.treatment")}:**\n${lines.join("\n")}`);
  parts.push(t("chat.offline_help"));
  return parts.join("\n\n");
}
