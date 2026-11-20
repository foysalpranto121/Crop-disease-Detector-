import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Activity, CircleCheck, CircleX, LayoutDashboard, ListChecks, MessageSquare, Pencil, Plus, ScanLine, Search, Trash2, TriangleAlert, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, USE_MOCKS } from "../api/client";
import type { Disease, L, Treatment, TreatmentInput, TreatmentType } from "../api/types";
import { TypeBadge } from "../components/DiseaseCard";
import { SelectField, TextAreaField, TextField } from "../components/Field";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader } from "../components/ui";
import { cn, container } from "../lib/cn";
import { formatDate, formatNumber, formatPercent, formatWeekday, pickL } from "../lib/format";
import { useApi } from "../lib/useApi";

type Tab = "overview" | "logs" | "feedback" | "diseases";

export default function AdminPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("overview");
  const tabs: { id: Tab; label: string; Icon: typeof Activity }[] = [
    { id: "overview", label: t("admin.tab_overview"), Icon: LayoutDashboard },
    { id: "logs", label: t("admin.tab_logs"), Icon: ListChecks },
    { id: "feedback", label: t("admin.tab_feedback"), Icon: MessageSquare },
    { id: "diseases", label: t("admin.tab_diseases"), Icon: Pencil },
  ];

  return (
    <>
      <PageHeader title={<span className="flex items-center gap-3">{t("admin.title")} {USE_MOCKS && <Badge tone="wheat">{t("admin.demo_data")}</Badge>}</span>} />
      <div className={container}>
        <div role="tablist" className="-mx-4 mb-6 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn("relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors", tab === id ? "text-white" : "text-leaf-800 hover:bg-leaf-100")}
            >
              {tab === id && <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-full bg-leaf-700" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <Icon className="relative size-4" aria-hidden />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {tab === "overview" && <Overview />}
            {tab === "logs" && <Logs />}
            {tab === "feedback" && <FeedbackList />}
            {tab === "diseases" && <DiseaseEditor />}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

// ---------------- Overview ----------------
function Stat({ Icon, label, value, tone }: { Icon: typeof Activity; label: string; value: ReactNode; tone: string }) {
  return (
    <Card className="p-5">
      <span className={cn("grid size-10 place-items-center rounded-2xl", tone)}>
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="mt-3 font-display text-3xl font-bold tabular-nums">{value}</p>
      <p className="text-sm text-leaf-900/60">{label}</p>
    </Card>
  );
}

function Overview() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data, error, loading, reload } = useApi(() => api.adminStats(), []);
  if (loading) return <LoadingState rows={3} />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  const maxDay = Math.max(1, ...data.scans_per_day.map((d) => d.count));
  const maxDisease = Math.max(1, ...data.top_diseases.map((d) => d.count));
  const maxCrop = Math.max(1, ...data.crops.map((c) => c.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat Icon={ScanLine} label={t("admin.scans_today")} value={formatNumber(data.scans_today, lang)} tone="bg-leaf-100 text-leaf-700" />
        <Stat Icon={Activity} label={t("admin.total_scans")} value={formatNumber(data.total_scans, lang)} tone="bg-sky-200 text-leaf-900" />
        <Stat Icon={Users} label={t("admin.total_users")} value={formatNumber(data.total_users, lang)} tone="bg-wheat-200 text-soil-600" />
        <Stat Icon={TriangleAlert} label={t("admin.low_rate")} value={formatPercent(data.low_confidence_rate, lang)} tone="bg-danger-100 text-danger-700" />
        <Stat Icon={CircleX} label={t("admin.negative_feedback")} value={formatNumber(data.negative_feedback, lang)} tone="bg-soil-400/20 text-soil-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">{t("admin.scans_7days")}</h2>
          <div className="flex h-48 items-end gap-2" role="img" aria-label={t("admin.scans_7days")}>
            {data.scans_per_day.map((d, i) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-semibold tabular-nums text-leaf-900/70">{formatNumber(d.count, lang)}</span>
                <motion.div
                  className="w-full rounded-t-xl bg-gradient-to-t from-leaf-600 to-leaf-400"
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.count / maxDay) * 140 + 4}px` }}
                  transition={{ duration: 0.7, delay: i * 0.06 }}
                />
                <span className="text-[11px] text-leaf-900/50">{formatWeekday(d.date, lang)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold">{t("admin.top_diseases")}</h2>
          <ul className="space-y-3">
            {data.top_diseases.map((d, i) => (
              <li key={d.disease_id}>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="truncate">
                    {pickL(d.crop, lang)} · {pickL(d.name, lang)}
                  </span>
                  <span className="font-semibold tabular-nums">{formatNumber(d.count, lang)}</span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-leaf-100">
                  <motion.div className="h-full rounded-full bg-soil-400" initial={{ width: 0 }} animate={{ width: `${(d.count / maxDisease) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.08 }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold">{t("admin.by_crop")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.crops.map((c, i) => (
            <div key={c.crop.en} className="flex items-center gap-3 rounded-2xl bg-leaf-50 p-3">
              <span className="text-2xl" aria-hidden>
                {c.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate">{pickL(c.crop, lang)}</span>
                  <span className="font-semibold tabular-nums">{formatNumber(c.count, lang)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white">
                  <motion.div className="h-full rounded-full bg-leaf-500" initial={{ width: 0 }} animate={{ width: `${(c.count / maxCrop) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.04 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------------- Logs ----------------
function Logs() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data, error, loading, reload } = useApi(() => api.adminPredictions(), []);
  if (loading) return <LoadingState rows={5} />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-leaf-50 text-start text-xs tracking-wide text-leaf-900/60 uppercase">
            <tr>
              {["col_image", "col_result", "col_confidence", "col_user", "col_date", "col_feedback"].map((k) => (
                <th key={k} className="px-4 py-3 text-start font-semibold">
                  {t(`admin.${k}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-leaf-100">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-leaf-50/50">
                <td className="px-4 py-2">
                  <div className="size-11 overflow-hidden rounded-xl bg-leaf-100">
                    {row.image_url ? (
                      <img src={row.image_url} alt="" className="size-full object-cover" loading="lazy" />
                    ) : (
                      <span className="grid size-full place-items-center text-xl" aria-hidden>
                        {row.disease?.crop.emoji ?? "🍃"}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  {row.disease ? (
                    <>
                      <p className="font-medium">{pickL(row.disease.name, lang)}</p>
                      <p className="text-xs text-leaf-900/50">{pickL(row.disease.crop.name, lang)}</p>
                    </>
                  ) : (
                    <Badge tone="danger">{t("history.not_leaf")}</Badge>
                  )}
                </td>
                <td className="px-4 py-2">
                  <Badge tone={row.confidence_band === "high" ? "green" : row.confidence_band === "medium" ? "wheat" : "danger"}>{formatPercent(row.confidence, lang)}</Badge>
                </td>
                <td className="px-4 py-2 text-leaf-900/70">{row.user?.name ?? t("common.guest")}</td>
                <td className="px-4 py-2 whitespace-nowrap text-leaf-900/60">{formatDate(row.created_at, lang)}</td>
                <td className="px-4 py-2">
                  {row.feedback ? (
                    row.feedback.is_correct ? (
                      <CircleCheck className="size-5 text-leaf-500" aria-label={t("admin.correct")} />
                    ) : (
                      <CircleX className="size-5 text-danger-500" aria-label={t("admin.wrong")} />
                    )
                  ) : (
                    <span className="text-leaf-900/30">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ---------------- Feedback ----------------
function FeedbackList() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data, error, loading, reload } = useApi(() => api.adminFeedback(), []);
  if (loading) return <LoadingState rows={3} />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;
  if (!data.length) return <EmptyState icon={<MessageSquare className="size-8" />} title={t("admin.feedback_empty")} />;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.map((f) => (
        <Card key={f.id} className="flex gap-4 p-4">
          <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-leaf-100">
            {f.image_url ? (
              <img src={f.image_url} alt="" className="size-full object-cover" />
            ) : (
              <span className="grid size-full place-items-center text-3xl" aria-hidden>
                {f.disease?.crop.emoji ?? "🍃"}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={f.is_correct ? "green" : "danger"}>{f.is_correct ? t("admin.correct") : t("admin.wrong")}</Badge>
              <span className="text-xs text-leaf-900/50">{formatDate(f.created_at, lang)}</span>
            </div>
            <p className="mt-1 font-medium">{f.disease ? `${pickL(f.disease.crop.name, lang)} · ${pickL(f.disease.name, lang)}` : "—"}</p>
            {f.comment && <p className="mt-1 text-sm text-leaf-900/70 italic">“{f.comment}”</p>}
            <p className="mt-1 text-xs text-leaf-900/50">{f.user_name ?? t("common.guest")}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------------- Disease & treatment editor ----------------
const emptyL = (): L => ({ en: "", bn: "" });

function LFields({ label, value, onChange, textarea = false }: { label: [string, string]; value: L; onChange: (v: L) => void; textarea?: boolean }) {
  const Comp = textarea ? TextAreaField : TextField;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Comp label={label[0]} value={value.en} lang="en" onChange={(e: { target: { value: string } }) => onChange({ ...value, en: e.target.value })} />
      <Comp label={label[1]} value={value.bn} lang="bn" onChange={(e: { target: { value: string } }) => onChange({ ...value, bn: e.target.value })} />
    </div>
  );
}

function DiseaseEditor() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const list = useApi(() => api.getDiseases(), []);
  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (list.data ?? []).filter((d) => !q || [d.name.en, d.name.bn, d.crop.name.en, d.crop.name.bn].some((s) => s.toLowerCase().includes(q)));
  }, [list.data, query]);

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <Card className="p-3">
        <label className="relative mb-2 block">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-leaf-900/40" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("library.search")}
            className="h-10 w-full rounded-xl border border-leaf-200 ps-9 pe-3 text-sm outline-none focus:border-leaf-500"
          />
        </label>
        {list.loading ? (
          <LoadingState rows={4} />
        ) : (
          <ul className="max-h-[560px] space-y-1 overflow-y-auto">
            {filtered.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => setSelected(d.id)}
                  className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm transition", selected === d.id ? "bg-leaf-700 text-white" : "hover:bg-leaf-50")}
                >
                  <span aria-hidden>{d.crop.emoji}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {pickL(d.crop.name, lang)} · {pickL(d.name, lang)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <div className="min-w-0">
        {selected ? <DiseaseForm key={selected} id={selected} onSaved={list.reload} /> : <EmptyState icon={<Pencil className="size-8" />} title={t("admin.select_disease")} />}
      </div>
    </div>
  );
}

function DiseaseForm({ id, onSaved }: { id: number; onSaved: () => void }) {
  const { t } = useTranslation();
  const { data, error, loading, reload } = useApi(() => api.getDisease(id), [id]);
  const [draft, setDraft] = useState<Pick<Disease, "name" | "symptoms" | "causes"> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<number | "new" | null>(null);

  useEffect(() => {
    if (data) setDraft({ name: data.name, symptoms: data.symptoms, causes: data.causes });
  }, [data]);

  if (loading || !draft) return <LoadingState rows={3} />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await api.updateDisease(id, draft);
    setSaving(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
    onSaved();
  };

  const saveTreatment = async (input: TreatmentInput, treatmentId: number | "new") => {
    if (treatmentId === "new") await api.addTreatment(id, input);
    else await api.updateTreatment(treatmentId, input);
    setEditing(null);
    reload();
  };

  const removeTreatment = async (tr: Treatment) => {
    if (!window.confirm(t("admin.delete_confirm"))) return;
    await api.deleteTreatment(tr.id);
    reload();
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <form onSubmit={(e) => void save(e)} className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-3xl" aria-hidden>
              {data.crop.emoji}
            </span>
            <TypeBadge type={data.type} />
            <code className="rounded-lg bg-leaf-50 px-2 py-1 text-xs text-leaf-900/60">{data.class_label}</code>
          </div>
          <LFields label={[t("admin.name_en"), t("admin.name_bn")]} value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
          <LFields label={[t("admin.symptoms_en"), t("admin.symptoms_bn")]} value={draft.symptoms} onChange={(symptoms) => setDraft({ ...draft, symptoms })} textarea />
          <LFields label={[t("admin.causes_en"), t("admin.causes_bn")]} value={draft.causes} onChange={(causes) => setDraft({ ...draft, causes })} textarea />
          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving}>
              {t("common.save")}
            </Button>
            <AnimatePresence>
              {saved && (
                <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-sm font-semibold text-leaf-600">
                  {t("admin.saved")}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </form>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t("admin.treatments")}</h3>
          <Button size="sm" variant="secondary" onClick={() => setEditing("new")}>
            <Plus className="size-4" /> {t("admin.add_treatment")}
          </Button>
        </div>
        <div className="space-y-3">
          {editing === "new" && <TreatmentForm onCancel={() => setEditing(null)} onSave={(input) => saveTreatment(input, "new")} />}
          {data.treatments.map((tr) =>
            editing === tr.id ? (
              <TreatmentForm key={tr.id} initial={tr} onCancel={() => setEditing(null)} onSave={(input) => saveTreatment(input, tr.id)} />
            ) : (
              <div key={tr.id} className="flex gap-3 rounded-2xl bg-leaf-50/70 p-4 ring-1 ring-leaf-100">
                <div className="min-w-0 flex-1">
                  <Badge tone={tr.type === "chemical" ? "soil" : tr.type === "organic" ? "green" : "sky"}>{t(`treatment_types.${tr.type}`)}</Badge>
                  <p className="mt-2 text-sm">{tr.remedy.en}</p>
                  <p className="mt-1 text-sm text-leaf-900/60" lang="bn">
                    {tr.remedy.bn}
                  </p>
                  {tr.dosage && <p className="mt-1 text-xs font-semibold text-leaf-800">{tr.dosage.en}</p>}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button type="button" onClick={() => setEditing(tr.id)} className="rounded-full p-2 hover:bg-white" aria-label={t("common.edit")}>
                    <Pencil className="size-4" />
                  </button>
                  <button type="button" onClick={() => void removeTreatment(tr)} className="rounded-full p-2 text-danger-700 hover:bg-danger-100" aria-label={t("common.delete")}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      </Card>
    </div>
  );
}

function TreatmentForm({ initial, onSave, onCancel }: { initial?: Treatment; onSave: (input: TreatmentInput) => Promise<void>; onCancel: () => void }) {
  const { t } = useTranslation();
  const [type, setType] = useState<TreatmentType>(initial?.type ?? "organic");
  const [remedy, setRemedy] = useState<L>(initial?.remedy ?? emptyL());
  const [dosage, setDosage] = useState<L>(initial?.dosage ?? emptyL());
  const [precautions, setPrecautions] = useState<L>(initial?.precautions ?? emptyL());
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const hasText = (l: L) => !!(l.en.trim() || l.bn.trim());
    await onSave({ type, remedy, dosage: hasText(dosage) ? dosage : null, precautions: hasText(precautions) ? precautions : null });
    setBusy(false);
  };

  return (
    <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} onSubmit={(e) => void submit(e)} className="space-y-3 overflow-hidden rounded-2xl bg-white p-4 ring-2 ring-leaf-300">
      <SelectField label={t("admin.type")} value={type} onChange={(e) => setType(e.target.value as TreatmentType)}>
        {(["chemical", "organic", "preventive"] as const).map((x) => (
          <option key={x} value={x}>
            {t(`treatment_types.${x}`)}
          </option>
        ))}
      </SelectField>
      <LFields label={[t("admin.remedy_en"), t("admin.remedy_bn")]} value={remedy} onChange={setRemedy} textarea />
      <LFields label={[t("admin.dosage_en"), t("admin.dosage_bn")]} value={dosage} onChange={setDosage} />
      <LFields label={[t("admin.precautions_en"), t("admin.precautions_bn")]} value={precautions} onChange={setPrecautions} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={busy} disabled={!remedy.en.trim() && !remedy.bn.trim()}>
          {t("common.save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </motion.form>
  );
}
