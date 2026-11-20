import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import bn from "./locales/bn";

// Bangladesh first: Bangla if the browser/phone language is Bangla, otherwise English.
// The user's choice is remembered in localStorage ("lang").
// To add a language: create locales/<code>.ts typed as Resources and register it here.
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      bn: { translation: bn },
    },
    supportedLngs: ["en", "bn"],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "lang",
      caches: ["localStorage"],
    },
    returnNull: false,
  });

function syncHtmlLang(lng: string) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng.startsWith("bn") ? "bn" : "en";
  }
}
syncHtmlLang(i18n.resolvedLanguage ?? i18n.language ?? "en");
i18n.on("languageChanged", syncHtmlLang);

export default i18n;
