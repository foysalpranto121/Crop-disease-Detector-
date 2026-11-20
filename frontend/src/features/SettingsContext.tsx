import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { deviceCanRender3D } from "../lib/device";

export type LiteSetting = "auto" | "on" | "off";

interface SettingsValue {
  /** What the user chose. */
  liteSetting: LiteSetting;
  setLiteSetting: (s: LiteSetting) => void;
  /** Effective result: true = no 3D / heavy animation. */
  liteMode: boolean;
}

const STORAGE_KEY = "cdd.lite";
const SettingsContext = createContext<SettingsValue | null>(null);

function readSetting(): LiteSetting {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "on" || v === "off" || v === "auto") return v;
  } catch {
    /* storage unavailable */
  }
  return "auto";
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [liteSetting, setLite] = useState<LiteSetting>(readSetting);
  const [deviceOk] = useState(() => deviceCanRender3D());

  const liteMode = liteSetting === "on" || (liteSetting === "auto" && !deviceOk);

  useEffect(() => {
    document.documentElement.classList.toggle("lite", liteMode);
  }, [liteMode]);

  const value = useMemo<SettingsValue>(
    () => ({
      liteSetting,
      liteMode,
      setLiteSetting: (s) => {
        setLite(s);
        try {
          localStorage.setItem(STORAGE_KEY, s);
        } catch {
          /* ignore */
        }
      },
    }),
    [liteSetting, liteMode],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
