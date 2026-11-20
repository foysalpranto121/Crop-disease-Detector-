import { useEffect, useState } from "react";
import { useLocation, useOutlet } from "react-router";
import { AnimatePresence } from "motion/react";
import { WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ChatWidget } from "./ChatWidget";
import { ErrorBoundary } from "./ErrorBoundary";
import { Footer } from "./Footer";
import { PageTransition } from "./Motion";
import { Navbar } from "./Navbar";

function OfflineBanner() {
  const { t } = useTranslation();
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  if (online) return null;
  return (
    <div role="status" className="no-print flex items-center justify-center gap-2 bg-wheat-400 px-4 py-2 text-sm font-medium text-leaf-900">
      <WifiOff className="size-4" aria-hidden /> {t("common.offline")}
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const outlet = useOutlet();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <OfflineBanner />
      <Navbar />
      <main id="main" className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            {/* A crash on one page shows a friendly screen instead of a blank site; navigating away resets it. */}
            <ErrorBoundary resetKey={location.pathname}>{outlet}</ErrorBoundary>
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
      <ErrorBoundary fallback={null}>
        <ChatWidget />
      </ErrorBoundary>
    </div>
  );
}
