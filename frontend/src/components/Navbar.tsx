import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, History, LayoutDashboard, LogOut, Menu, ScanLine, X } from "lucide-react";
import type { User } from "../api/types";
import { useTranslation } from "react-i18next";
import { useAuth } from "../features/AuthContext";
import { cn, container } from "../lib/cn";
import { LanguageSwitch } from "./LanguageSwitch";
import { Logo } from "./Logo";
import { Button, ButtonLink } from "./ui";

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

/** Avatar button with a dropdown: who is signed in, quick links and a clearly labelled "Log out". */
function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { t } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const roleLabel = user.role === "admin" ? t("nav.admin") : user.role === "agronomist" ? t("auth.agronomist") : t("auth.farmer");
  const item = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t("nav.account")}: ${user.name}`}
        className="flex items-center gap-2 rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-leaf-900/10 transition hover:bg-white hover:ring-leaf-300 sm:pe-3"
      >
        <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-leaf-500 to-leaf-700 text-xs font-bold text-white">{initials(user.name)}</span>
        <span className="hidden max-w-28 truncate text-sm font-semibold text-leaf-900 sm:inline">{user.name.split(" ")[0]}</span>
        <ChevronDown className={cn("hidden size-4 text-leaf-900/50 transition-transform sm:block", open && "rotate-180")} aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="absolute end-0 top-full z-50 mt-2 w-64 origin-top-right rounded-2xl bg-white p-2 shadow-xl ring-1 ring-leaf-900/10"
          >
            <div className="flex items-center gap-3 rounded-xl bg-leaf-50 p-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-leaf-500 to-leaf-700 text-sm font-bold text-white">{initials(user.name)}</span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="truncate text-xs text-leaf-900/60">{user.email}</p>
                <span className="mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-leaf-700 ring-1 ring-leaf-200">{roleLabel}</span>
              </div>
            </div>
            <div className="mt-1">
              <NavLink to="/history" role="menuitem" className={cn(item, "hover:bg-leaf-50")}>
                <History className="size-4 text-leaf-600" aria-hidden /> {t("nav.history")}
              </NavLink>
              {user.role === "admin" && (
                <NavLink to="/admin" role="menuitem" className={cn(item, "hover:bg-leaf-50")}>
                  <LayoutDashboard className="size-4 text-leaf-600" aria-hidden /> {t("nav.admin")}
                </NavLink>
              )}
            </div>
            <div className="my-1 border-t border-leaf-100" />
            <button type="button" role="menuitem" onClick={onLogout} className={cn(item, "text-danger-700 hover:bg-danger-100")}>
              <LogOut className="size-4" aria-hidden /> {t("nav.logout")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
            <UserMenu user={user} onLogout={logout} />
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
