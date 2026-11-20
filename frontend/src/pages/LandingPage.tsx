import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Camera, FlaskConical, Gift, Languages, Pill, ScanLine, ScanSearch, Smartphone, Sparkles, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DriftingLeaves } from "../components/DriftingLeaves";
import { TiltCard } from "../components/DiseaseCard";
import { CountUp, Reveal } from "../components/Motion";
import { buttonClasses } from "../components/buttonClasses";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Badge, ButtonLink } from "../components/ui";
import { useSettings } from "../features/SettingsContext";
import { cn, container } from "../lib/cn";
import { pickL } from "../lib/format";
import { COMING_SOON_CROPS, SUPPORTED_CROPS } from "../mocks/data/crops";
import { GlobeFallback, HeroFallback } from "../three/Fallbacks";

const HeroScene = lazy(() => import("../three/HeroScene"));
const GlobeScene = lazy(() => import("../three/GlobeScene"));

/** Mount heavy 3D only after the text and buttons have painted. */
function useDeferredMount(delay = 350) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(id);
  }, [delay]);
  return ready;
}

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { liteMode } = useSettings();
  const ready = useDeferredMount();
  const show3D = !liteMode && ready;
  const { hash } = useLocation();

  // Footer links like "/#how" should land on that section.
  useEffect(() => {
    if (!hash) return;
    const id = window.setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }), 350);
    return () => window.clearTimeout(id);
  }, [hash]);

  const steps = [
    { Icon: Camera, title: t("landing.step1_title"), desc: t("landing.step1_desc") },
    { Icon: ScanSearch, title: t("landing.step2_title"), desc: t("landing.step2_desc") },
    { Icon: Pill, title: t("landing.step3_title"), desc: t("landing.step3_desc") },
  ];
  const features = [
    { Icon: Zap, title: t("landing.why_fast_t"), desc: t("landing.why_fast_d"), color: "from-wheat-400 to-wheat-600" },
    { Icon: Gift, title: t("landing.why_free_t"), desc: t("landing.why_free_d"), color: "from-leaf-400 to-leaf-600" },
    { Icon: Languages, title: t("landing.why_bangla_t"), desc: t("landing.why_bangla_d"), color: "from-sky-300 to-leaf-500" },
    { Icon: FlaskConical, title: t("landing.why_treat_t"), desc: t("landing.why_treat_d"), color: "from-soil-400 to-soil-600" },
    { Icon: Smartphone, title: t("landing.why_phone_t"), desc: t("landing.why_phone_d"), color: "from-leaf-500 to-leaf-800" },
  ];

  return (
    <>
      {/* ---------- Hero: 3D Living Field ---------- */}
      <section className="relative -mt-16 overflow-hidden bg-gradient-to-b from-sky-300 via-sky-200 to-leaf-100 pt-16">
        <div className="absolute inset-0">
          {show3D ? (
            // If WebGL fails at runtime, fall back to the 2D scene instead of crashing the page.
            <ErrorBoundary fallback={<HeroFallback />}>
              <Suspense fallback={<HeroFallback />}>
                <HeroScene />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <HeroFallback />
          )}
        </div>
        <DriftingLeaves />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-cream-50 to-transparent" aria-hidden />

        <div className={cn(container, "relative z-10 flex min-h-[calc(100svh-4rem)] items-end pb-20 lg:items-center lg:pb-10")}>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl rounded-[2rem] bg-white/75 p-6 shadow-2xl shadow-leaf-900/10 ring-1 ring-white/60 backdrop-blur-md sm:p-8 lg:bg-white/60"
          >
            <Badge tone="green" className="mb-4">
              <Sparkles className="size-3.5" aria-hidden /> {t("landing.badge")}
            </Badge>
            <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              {t("landing.hero_title_1")}
              <br />
              <span className="bg-gradient-to-r from-leaf-700 via-leaf-500 to-leaf-400 bg-clip-text text-transparent">{t("landing.hero_title_2")}</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-leaf-900/75 sm:text-lg">{t("landing.hero_sub")}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/diagnose" size="lg">
                <ScanLine className="size-5" /> {t("landing.cta_scan")}
              </ButtonLink>
              <a href="#how" className={buttonClasses("secondary", "lg")}>
                {t("landing.cta_how")} <ArrowRight className="size-4 rtl:rotate-180" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className={cn(container, "scroll-mt-20 py-20")}>
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("landing.how_title")}</h2>
          <p className="mt-2 text-leaf-900/70">{t("landing.how_sub")}</p>
        </Reveal>
        <div className="relative mt-12 grid gap-6 md:grid-cols-3">
          <svg className="absolute top-14 left-[16%] hidden h-4 w-[68%] md:block" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden>
            <motion.path
              d="M0 2 H100"
              stroke="var(--color-leaf-300)"
              strokeWidth="0.6"
              strokeDasharray="2 2"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />
          </svg>
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * 0.18}>
              <div className="relative h-full rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-leaf-900/5">
                <div className="relative mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-br from-leaf-400 to-leaf-700 text-white shadow-lg shadow-leaf-700/30">
                  <s.Icon className="size-9" aria-hidden />
                  <span className="absolute -end-1 -top-1 grid size-8 place-items-center rounded-full bg-wheat-400 font-display text-sm font-bold text-leaf-900 ring-4 ring-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-leaf-900/70">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Supported crops ---------- */}
      <section className="bg-gradient-to-b from-leaf-50 to-cream-50 py-20">
        <div className={container}>
          <Reveal className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("landing.crops_title")}</h2>
            <p className="mt-2 text-leaf-900/70">{t("landing.crops_sub")}</p>
          </Reveal>
          <div className="mt-10 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
            {SUPPORTED_CROPS.map((c, i) => (
              <Reveal key={c.key} delay={(i % 7) * 0.05} y={16}>
                <TiltCard>
                  <div className="group flex flex-col items-center rounded-2xl bg-white p-4 shadow-sm ring-1 ring-leaf-900/5 transition-shadow hover:shadow-lg">
                    <span className="text-4xl transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110" aria-hidden>
                      {c.emoji}
                    </span>
                    <span className="mt-2 text-center text-sm font-medium">{pickL(c.name, lang)}</span>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
            {COMING_SOON_CROPS.map((c) => (
              <div key={c.key} className="relative flex flex-col items-center rounded-2xl border-2 border-dashed border-leaf-200 p-4 opacity-80">
                <span className="text-4xl grayscale-[40%]" aria-hidden>
                  {c.emoji}
                </span>
                <span className="mt-2 text-center text-sm font-medium">{pickL(c.name, lang)}</span>
                <Badge tone="wheat" className="mt-1">
                  {t("landing.coming_soon")}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Why ---------- */}
      <section className={cn(container, "py-20")}>
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("landing.why_title")}</h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <TiltCard className="h-full">
                <div className="h-full rounded-3xl bg-white p-5 shadow-sm ring-1 ring-leaf-900/5">
                  <div className={cn("grid size-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md", f.color)}>
                    <f.Icon className="size-6" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-leaf-900/70">{f.desc}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Bangladesh to the World ---------- */}
      <section className={cn(container, "py-6")}>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-leaf-900 via-leaf-800 to-leaf-900 px-6 py-12 text-white sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -start-20 -top-20 size-80 rounded-full bg-leaf-500/20 blur-3xl" aria-hidden />
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="relative">
              <Reveal>
                <Badge tone="dark" className="mb-4">
                  🇧🇩 → 🌍
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("landing.globe_title")}</h2>
                <p className="mt-4 leading-relaxed text-leaf-100/80">{t("landing.globe_sub")}</p>
              </Reveal>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {[
                  { node: <CountUp to={38} />, label: t("landing.stat_diseases") },
                  { node: <CountUp to={14} />, label: t("landing.stat_crops") },
                  { node: <CountUp to={2} prefix="<" />, label: t("landing.stat_seconds") },
                  { node: <CountUp to={2} />, label: t("landing.stat_languages") },
                ].map((s, i) => (
                  <Reveal key={i} delay={i * 0.1} y={16}>
                    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
                      <p className="font-display text-3xl font-extrabold text-leaf-300 sm:text-4xl">{s.node}</p>
                      <p className="mt-1 text-sm text-leaf-100/80">{s.label}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
            <div className="relative mx-auto aspect-square w-full max-w-[460px]">
              {show3D ? (
                <ErrorBoundary fallback={<GlobeFallback />}>
                  <Suspense fallback={<GlobeFallback />}>
                    <GlobeScene />
                  </Suspense>
                </ErrorBoundary>
              ) : (
                <GlobeFallback />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className={cn(container, "pt-20")}>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-leaf-700 to-leaf-500 px-6 py-14 text-center text-white shadow-2xl shadow-leaf-700/30">
            <svg className="animate-sway pointer-events-none absolute -bottom-6 -start-6 size-40 text-white/10" viewBox="0 0 24 24" aria-hidden>
              <path fill="currentColor" d="M12 2C6 6 4 12 6 18c1.5 2.5 4 4 6 4 0-6 2-11 6-15-3 0-5 1-6 2 0-3 1-5 2-7Z" />
            </svg>
            <svg className="animate-float pointer-events-none absolute -end-4 -top-6 size-32 text-white/10" viewBox="0 0 24 24" aria-hidden>
              <path fill="currentColor" d="M12 2C6 6 4 12 6 18c1.5 2.5 4 4 6 4 0-6 2-11 6-15-3 0-5 1-6 2 0-3 1-5 2-7Z" />
            </svg>
            <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">{t("landing.cta_title")}</h2>
            <p className="relative mt-2 text-leaf-50/90">{t("landing.cta_sub")}</p>
            <ButtonLink to="/diagnose" variant="light" size="lg" className="relative mt-7">
              <ScanLine className="size-5" /> {t("landing.cta_button")}
            </ButtonLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
