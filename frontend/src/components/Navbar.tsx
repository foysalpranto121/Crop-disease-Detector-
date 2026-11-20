import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { LogOut, Menu, ScanLine, UserRound, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../features/AuthContext";
import { cn, container } from "../lib/cn";
import { LanguageSwitch } from "./LanguageSwitch";
import { Logo } from "./Logo";
import { Button, ButtonLink } from "./ui";

export function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: "/", label: t("nav.home"), end: true },
    { to: "/diagnose", label: t("nav.diagnose") },
    { to: "/library", label: t("nav.library") },
    { to: "/history", label: t("nav.history") },
    { to: "/about", label: t("nav.about") },
    ...(user?.role === "admin" ? [{ to: "/admin", label: t("nav.admin") }] : []),
  ];

  return (
    <header className={cn("no-print sticky top-0 z-40 transition-all duration-300", scrolled || open ? "bg-white/85 shadow-sm backdrop-blur-md" : "bg-transparent")}>
      <nav className={cn(container, "flex h-16 items-center gap-3")} aria-label="Main">
        <Logo />
        <ul className="ms-4 hidden items-center gap-0.5 xl:ms-8 lg:flex">
          {/* "Scan Leaf" is the green button on the right, so it is not repeated here */}
          {links.filter((l) => l.to !== "/diagnose").map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    isActive ? "bg-leaf-100 text-leaf-800" : "text-leaf-900/70 hover:text-leaf-800",
                  )
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitch />
          {user ? (
            <div className="hidden items-center gap-1 lg:flex">
              <span className="flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1.5 text-sm font-medium">
                <UserRound className="size-4 text-leaf-600" aria-hidden /> {user.name.split(" ")[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={logout} aria-label={t("nav.logout")} title={t("nav.logout")}>
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <ButtonLink to="/login" variant="ghost" size="sm" className="max-lg:hidden">
              {t("nav.login")}
            </ButtonLink>
          )}
          <ButtonLink to="/diagnose" size="sm" className="max-sm:hidden">
            <ScanLine className="size-4" /> {t("nav.diagnose")}
          </ButtonLink>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full text-leaf-900 hover:bg-leaf-100 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? t("nav.close_menu") : t("nav.menu")}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-leaf-100 lg:hidden"
          >
            <div className={cn(container, "space-y-1 py-4")}>
              {links.map((l, i) => (
                <motion.div key={l.to} initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}>
                  <NavLink
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) => cn("block rounded-2xl px-4 py-3 text-lg font-medium", isActive ? "bg-leaf-100 text-leaf-800" : "hover:bg-leaf-50")}
                  >
                    {l.label}
                  </NavLink>
                </motion.div>
              ))}
              <div className="flex gap-2 pt-3">
                {user ? (
                  <Button variant="secondary" className="flex-1" onClick={logout}>
                    <LogOut className="size-4" /> {t("nav.logout")} ({user.name.split(" ")[0]})
                  </Button>
                ) : (
                  <>
                    <ButtonLink to="/login" variant="secondary" className="flex-1">
                      {t("nav.login")}
                    </ButtonLink>
                    <ButtonLink to="/register" className="flex-1">
                      {t("nav.register")}
                    </ButtonLink>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
