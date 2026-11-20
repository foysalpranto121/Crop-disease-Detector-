import type { ReactNode } from "react";
import {
  ArrowRight,
  Camera,
  ClipboardCheck,
  FlaskConical,
  Gauge,
  Languages,
  MessageCircle,
  Phone,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { CountUp, Reveal } from "../components/Motion";
import { ButtonLink, Card, PageHeader } from "../components/ui";
import { cn, container } from "../lib/cn";
import { pickL } from "../lib/format";
import { BETA_CROPS, SUPPORTED_CROPS } from "../mocks/data/crops";

/** Open models and datasets the product is built on (names stay in English). */
const ACKNOWLEDGEMENTS: { what: string; name: string; href: string; note?: string }[] = [
  { what: "Plant disease model (14 crops)", name: "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification", href: "https://huggingface.co/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification" },
  { what: "Rice model", name: "Shaq2/chashibhai-rice-disease-cls", href: "https://huggingface.co/Shaq2/chashibhai-rice-disease-cls", note: "MIT" },
  { what: "Wheat model", name: "sanjeevani-04/indian-crop-disease-mobilenetv2", href: "https://huggingface.co/sanjeevani-04/indian-crop-disease-mobilenetv2" },
  { what: "Soybean model", name: "ixrbhii/soybean-disease-convnext", href: "https://huggingface.co/ixrbhii/soybean-disease-convnext", note: "CC BY 4.0" },
  { what: "Jute pest model", name: "dimasichsanul/jute_pest_classification", href: "https://huggingface.co/dimasichsanul/jute_pest_classification", note: "Apache 2.0" },
  { what: "Reference photos", name: "PlantVillage dataset — Hughes & Salathé (2015), arXiv:1511.08060", href: "https://arxiv.org/abs/1511.08060" },
  { what: "Field photos & testing", name: "Project-AgML datasets, incl. Dhan-Shomadhan (Bangladesh)", href: "https://huggingface.co/Project-AgML" },
];

function SectionHeading({ kicker, title, sub, center }: { kicker: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      <p className="text-sm font-semibold tracking-wide text-leaf-600 uppercase">{kicker}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance">{title}</h2>
      {sub && <p className="mt-3 text-leaf-900/70">{sub}</p>}
    </div>
  );
}

function IconBadge({ children }: { children: ReactNode }) {
  return <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-leaf-100 text-leaf-700">{children}</span>;
}

export default function AboutPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const stats = [
    { value: <CountUp to={SUPPORTED_CROPS.length} />, label: t("about.stat_crops") },
    { value: <CountUp to={77} />, label: t("about.stat_classes") },
    { value: <>&lt;<CountUp to={2} /></>, label: t("about.stat_seconds") },
    { value: <CountUp to={2} />, label: t("about.stat_languages") },
  ];
  const steps = [
    { Icon: Camera, title: t("about.how1_title"), body: t("about.how1") },
    { Icon: ScanLine, title: t("about.how2_title"), body: t("about.how2") },
    { Icon: ClipboardCheck, title: t("about.how3_title"), body: t("about.how3") },
  ];
  const features = [
    { Icon: Languages, title: t("about.f_bangla_t"), body: t("about.f_bangla") },
    { Icon: FlaskConical, title: t("about.f_treat_t"), body: t("about.f_treat") },
    { Icon: Gauge, title: t("about.f_honest_t"), body: t("about.f_honest") },
    { Icon: MessageCircle, title: t("about.f_chat_t"), body: t("about.f_chat") },
    { Icon: Smartphone, title: t("about.f_phone_t"), body: t("about.f_phone") },
    { Icon: ShieldCheck, title: t("about.f_privacy_t"), body: t("about.f_privacy") },
  ];
  const available = SUPPORTED_CROPS.filter((c) => !BETA_CROPS.has(c.key));
  const beta = SUPPORTED_CROPS.filter((c) => BETA_CROPS.has(c.key));

  return (
    <>
      <PageHeader title={t("about.title")} subtitle={t("about.intro")} />

      <div className={cn(container, "space-y-20 pb-8")}>
        {/* ---------- Mission ---------- */}
        <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <SectionHeading kicker={t("about.mission_kicker")} title={t("about.mission_title")} />
            <p className="mt-4 text-lg leading-relaxed text-leaf-900/80">{t("about.mission")}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <Card key={s.label} className="p-5 text-center">
                  <p className="text-4xl font-bold text-leaf-700">{s.value}</p>
                  <p className="mt-1 text-sm text-leaf-900/70">{s.label}</p>
                </Card>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ---------- How it works ---------- */}
        <section>
          <Reveal>
            <SectionHeading kicker={t("about.how_kicker")} title={t("about.how_title")} center />
          </Reveal>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map(({ Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 0.08}>
                <li className="h-full">
                  <Card className="relative h-full p-6">
                    <span className="absolute top-5 right-6 text-5xl font-bold text-leaf-100" aria-hidden>
                      {i + 1}
                    </span>
                    <IconBadge>
                      <Icon className="size-5" aria-hidden />
                    </IconBadge>
                    <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                    <p className="mt-2 leading-relaxed text-leaf-900/75">{body}</p>
                  </Card>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* ---------- Why ---------- */}
        <section>
          <Reveal>
            <SectionHeading kicker={t("about.features_kicker")} title={t("about.features_title")} center />
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ Icon, title, body }, i) => (
              <Reveal key={title} delay={(i % 3) * 0.06}>
                <div className="flex h-full gap-4 rounded-3xl p-5 transition-colors hover:bg-white">
                  <IconBadge>
                    <Icon className="size-5" aria-hidden />
                  </IconBadge>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-leaf-900/75">{body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- Coverage ---------- */}
        <section>
          <Reveal>
            <Card className="bg-gradient-to-br from-leaf-50 to-white p-6 sm:p-10">
              <SectionHeading kicker={t("about.coverage_kicker")} title={t("about.coverage_title")} sub={t("about.coverage_sub")} />
              {[
                { label: t("about.coverage_stable"), crops: available, isBeta: false },
                { label: t("about.coverage_beta"), crops: beta, isBeta: true },
              ].map((group) => (
                <div key={group.label} className="mt-8">
                  <h3 className="mb-3 text-sm font-semibold text-leaf-900/60">{group.label}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {group.crops.map((c) => (
                      <li
                        key={c.key}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1",
                          group.isBeta ? "bg-wheat-200/60 text-soil-600 ring-wheat-400/50" : "bg-white text-leaf-900 ring-leaf-900/10",
                        )}
                      >
                        <span aria-hidden>{c.emoji}</span> {pickL(c.name, lang)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Card>
          </Reveal>
        </section>

        {/* ---------- Accuracy & responsible use ---------- */}
        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <Card className="h-full p-6 sm:p-8">
              <SectionHeading kicker={t("about.quality_kicker")} title={t("about.quality_title")} />
              <ul className="mt-6 space-y-4">
                {[t("about.quality1"), t("about.quality2"), t("about.quality3")].map((q) => (
                  <li key={q} className="flex gap-3 leading-relaxed text-leaf-900/80">
                    <Sparkles className="mt-1 size-4 shrink-0 text-leaf-500" aria-hidden />
                    {q}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
          <Reveal delay={0.08}>
            <Card className="h-full bg-leaf-900 p-6 text-white sm:p-8">
              <TriangleAlert className="size-7 text-wheat-400" aria-hidden />
              <h2 className="mt-4 text-2xl font-bold">{t("about.responsible_title")}</h2>
              <p className="mt-3 leading-relaxed text-white/80">{t("about.responsible")}</p>
              <a href="tel:16123" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-semibold ring-1 ring-white/20 transition hover:bg-white/20">
                <Phone className="size-4" aria-hidden /> {t("about.call_center")}
              </a>
            </Card>
          </Reveal>
        </section>

        {/* ---------- Technology & acknowledgements ---------- */}
        <section>
          <Reveal>
            <SectionHeading kicker={t("about.tech_kicker")} title={t("about.tech_title")} sub={t("about.tech_intro")} />
            <Card className="mt-6 divide-y divide-leaf-900/5 p-2" lang="en">
              {ACKNOWLEDGEMENTS.map((a) => (
                <div key={a.name} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <span className="w-48 shrink-0 text-sm font-medium text-leaf-900/60">{a.what}</span>
                  <a href={a.href} target="_blank" rel="noreferrer" className="min-w-0 text-sm font-medium break-words text-leaf-700 hover:underline">
                    {a.name}
                  </a>
                  {a.note && <span className="text-xs text-leaf-900/50 sm:ms-auto">{a.note}</span>}
                </div>
              ))}
            </Card>
            <p className="mt-4 text-sm text-leaf-900/60">{t("about.credits")}</p>
          </Reveal>
        </section>

        {/* ---------- CTA ---------- */}
        <Reveal>
          <section className="rounded-[2.5rem] bg-gradient-to-r from-leaf-700 to-leaf-500 px-6 py-12 text-center text-white shadow-xl shadow-leaf-700/20">
            <h2 className="text-3xl font-bold tracking-tight">{t("about.cta_title")}</h2>
            <p className="mt-2 text-white/85">{t("about.cta_sub")}</p>
            <ButtonLink to="/diagnose" variant="light" size="lg" className="mt-6">
              <ScanLine className="size-5" aria-hidden /> {t("about.cta_button")} <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </section>
        </Reveal>
      </div>
    </>
  );
}
