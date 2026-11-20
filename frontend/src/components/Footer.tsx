import { Link } from "react-router";
import { Feather, Languages, MessageCircleQuestion, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChat } from "../features/ChatContext";
import { useSettings, type LiteSetting } from "../features/SettingsContext";
import { cn, container } from "../lib/cn";
import { formatNumber } from "../lib/format";
import { LanguageSwitch } from "./LanguageSwitch";
import { LeafMark } from "./Logo";

const HELPLINE = "16123";

function FooterLinks({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-4 text-xs font-semibold tracking-widest text-white uppercase">{title}</h2>
      <ul className="space-y-3 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-leaf-200/75 transition hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  const { t, i18n } = useTranslation();
  const { liteSetting, setLiteSetting } = useSettings();
  const { setOpen } = useChat();
  const year = formatNumber(new Date().getFullYear(), i18n.language).replace(/,/g, "");
  const liteOptions: LiteSetting[] = ["auto", "on", "off"];

  return (
    <footer className="no-print relative mt-24 bg-leaf-900 text-leaf-100">
      <div className="wave-divider absolute inset-x-0 -top-10 h-10 bg-leaf-900" aria-hidden />

      <div className={cn(container, "grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8")}>
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-4">
          <Link to="/" className="inline-flex items-center gap-3">
            <LeafMark className="size-10" />
            <span className="font-display text-lg font-bold text-white">{t("app.name")}</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-leaf-200/75">{t("footer.about")}</p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-leaf-200 ring-1 ring-white/10">
            <Languages className="size-3.5" aria-hidden /> {t("footer.languages")}
          </p>
        </div>

        <div className="lg:col-span-2">
          <FooterLinks
            title={t("footer.product")}
            links={[
              { to: "/diagnose", label: t("nav.diagnose") },
              { to: "/library", label: t("nav.library") },
              { to: "/history", label: t("nav.history") },
            ]}
          />
        </div>

        <div className="lg:col-span-2">
          <FooterLinks
            title={t("footer.resources")}
            links={[
              { to: "/#how", label: t("footer.how_it_works") },
              { to: "/library", label: t("footer.supported_crops") },
              { to: "/about", label: t("nav.about") },
            ]}
          />
        </div>

        {/* Help */}
        <div className="sm:col-span-2 lg:col-span-4">
          <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
            <h2 className="font-semibold text-white">{t("footer.help_title")}</h2>
            <p className="mt-1 text-sm text-leaf-200/70">{t("footer.help_desc")}</p>
            <a href={`tel:${HELPLINE}`} className="mt-4 flex items-center gap-3 rounded-2xl bg-white/5 p-3 transition hover:bg-white/10">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-leaf-500 text-white">
                <Phone className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-xs text-leaf-200/80">{t("footer.call")}</span>
                <span className="font-display text-xl font-bold tracking-wider text-white">{formatNumber(Number(HELPLINE), i18n.language).replace(/,/g, "")}</span>
              </span>
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-leaf-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-leaf-400"
            >
              <MessageCircleQuestion className="size-4" aria-hidden /> {t("footer.ask_ai")}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        {/* Extra bottom padding keeps the floating "Ask Krishi AI" button from covering these controls */}
        <div className={cn(container, "flex flex-col gap-4 pt-6 pb-28 text-xs text-leaf-300/80 lg:flex-row lg:items-center lg:justify-between")}>
          <p className="leading-relaxed">
            © {year} {t("app.name")} · {t("footer.rights")}
            <span className="mx-2 hidden text-white/20 sm:inline" aria-hidden>
              |
            </span>
            <span className="block sm:inline">{t("footer.disclaimer")}</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2" title={t("lite.hint")}>
              <Feather className="size-3.5" aria-hidden />
              <span className="font-medium text-leaf-200">{t("lite.title")}</span>
              <div role="radiogroup" aria-label={t("lite.title")} className="inline-flex rounded-full bg-white/10 p-0.5">
                {liteOptions.map((o) => (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={liteSetting === o}
                    onClick={() => setLiteSetting(o)}
                    className={cn("rounded-full px-2.5 py-1 transition", liteSetting === o ? "bg-leaf-500 font-semibold text-white" : "text-leaf-200 hover:text-white")}
                  >
                    {t(`lite.${o}`)}
                  </button>
                ))}
              </div>
            </div>
            <LanguageSwitch dark className="bg-white/10 ring-white/10" />
          </div>
        </div>
      </div>
    </footer>
  );
}
