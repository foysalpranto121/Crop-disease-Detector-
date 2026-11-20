import { BookOpen, BrainCircuit, CircleAlert, Cpu, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Reveal } from "../components/Motion";
import { Card, PageHeader } from "../components/ui";
import { container } from "../lib/cn";

const REFERENCES = [
  "Hughes, D. P., & Salathé, M. (2015). An open access repository of images on plant health to enable the development of mobile disease diagnostics. arXiv:1511.08060.",
  "Mohanty, S. P., Hughes, D. P., & Salathé, M. (2016). Using deep learning for image-based plant disease detection. Frontiers in Plant Science, 7, 1419.",
  "Sandler, M., Howard, A., Zhu, M., Zhmoginov, A., & Chen, L.-C. (2018). MobileNetV2: Inverted residuals and linear bottlenecks. CVPR.",
  "Pre-trained model: linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification (Hugging Face).",
  "Rice model: Shaq2/chashibhai-rice-disease-cls (Hugging Face, MIT).",
  "Wheat model: sanjeevani-04/indian-crop-disease-mobilenetv2 (Hugging Face) — wheat classes.",
  "Soybean model: ixrbhii/soybean-disease-convnext (Hugging Face, CC-BY-4.0).",
  "Jute pest model: dimasichsanul/jute_pest_classification (Hugging Face, Apache-2.0), trained on the UCI Jute Pest dataset.",
  "Validation photos: Dhan-Shomadhan rice leaf dataset (Bangladesh), via Project-AgML.",
];

export default function AboutPage() {
  const { t } = useTranslation();
  const sections = [
    { Icon: Target, title: t("about.problem_title"), body: <p>{t("about.problem")}</p> },
    { Icon: BrainCircuit, title: t("about.how_title"), body: <p>{t("about.how")}</p> },
    {
      Icon: Cpu,
      title: t("about.model_title"),
      body: (
        <ul className="list-disc space-y-1 ps-5">
          <li>{t("about.model_point1")}</li>
          <li>{t("about.model_point2")}</li>
          <li>{t("about.model_point3")}</li>
        </ul>
      ),
    },
    {
      Icon: CircleAlert,
      title: t("about.limits_title"),
      body: (
        <ul className="list-disc space-y-1 ps-5">
          <li>{t("about.limit1")}</li>
          <li>{t("about.limit2")}</li>
          <li>{t("about.limit3")}</li>
          <li>{t("about.limit4")}</li>
        </ul>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={t("about.title")} subtitle={t("about.intro")} />
      <div className={`${container} space-y-6`}>
        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <Card className="h-full p-6">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-leaf-100 text-leaf-700">
                    <s.Icon className="size-5" aria-hidden />
                  </span>
                  <h2 className="text-lg font-semibold">{s.title}</h2>
                </div>
                <div className="leading-relaxed text-leaf-900/80">{s.body}</div>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <Card className="p-6">
            <div className="mb-3 flex items-center gap-3">
              <BookOpen className="size-5 text-leaf-600" aria-hidden />
              <h2 className="text-lg font-semibold">{t("about.references_title")}</h2>
            </div>
            <ol className="list-decimal space-y-2 ps-5 text-sm text-leaf-900/80" lang="en">
              {REFERENCES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
            <h2 className="mt-6 mb-2 text-lg font-semibold">{t("about.credits_title")}</h2>
            <p className="text-sm text-leaf-900/70">{t("about.credits")}</p>
          </Card>
        </Reveal>
      </div>
    </>
  );
}
