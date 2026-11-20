import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { ShieldOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Role } from "../api/types";
import { useAuth } from "../features/AuthContext";
import { container } from "../lib/cn";
import { EmptyState, LoadingState } from "./ui";

/** Redirects to /login when logged out; shows a message when the role is not allowed. */
export function ProtectedRoute({ children, role }: { children: ReactNode; role?: Role }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (loading) {
    return (
      <div className={`${container} py-16`}>
        <LoadingState />
      </div>
    );
  }
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace state={{ reason: "login_required" }} />;
  }
  if (role && user.role !== role) {
    return (
      <div className={`${container} py-16`}>
        <EmptyState icon={<ShieldOff className="size-8" />} title={t("admin.forbidden")} />
      </div>
    );
  }
  return <>{children}</>;
}
