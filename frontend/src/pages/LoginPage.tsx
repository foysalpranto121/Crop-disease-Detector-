import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { ArrowRight, Lock, Mail, ScanLine } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toApiError } from "../api/client";
import { AuthItem, AuthShell } from "../components/AuthShell";
import { PasswordField, TextField } from "../components/Field";
import { Alert, Button } from "../components/ui";
import { useAuth } from "../features/AuthContext";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const loginRequired = (location.state as { reason?: string } | null)?.reason === "login_required";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(email, password);
      navigate(params.get("next") ?? (user.role === "admin" ? "/admin" : "/history"), { replace: true });
    } catch (err) {
      setError(toApiError(err).status === 401 ? t("auth.err_invalid") : t("auth.err_generic"));
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t("auth.login_title")} subtitle={t("auth.login_sub")}>
      <form onSubmit={(e) => void submit(e)} className="space-y-5">
        {loginRequired && <Alert tone="info">{t("auth.login_required")}</Alert>}
        {error && <Alert tone="danger">{error}</Alert>}
        <AuthItem>
          <TextField label={t("auth.email")} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail className="size-4" />} />
        </AuthItem>
        <AuthItem>
          <PasswordField
            label={t("auth.password")}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="size-4" />}
            showLabel={t("auth.show_password")}
            hideLabel={t("auth.hide_password")}
          />
        </AuthItem>
        <AuthItem>
          <Button type="submit" size="lg" className="group w-full" loading={busy}>
            {t("auth.submit_login")} <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
          </Button>
        </AuthItem>
        <AuthItem>
          <p className="text-center text-sm text-leaf-900/70">
            {t("auth.no_account")}{" "}
            <Link to="/register" className="font-semibold text-leaf-700 hover:underline">
              {t("nav.register")}
            </Link>
          </p>
        </AuthItem>
        <AuthItem>
          <div className="flex items-center gap-3 text-xs font-medium tracking-wide text-leaf-900/40 uppercase">
            <span className="h-px flex-1 bg-leaf-900/10" /> {t("auth.or")} <span className="h-px flex-1 bg-leaf-900/10" />
          </div>
        </AuthItem>
        <AuthItem>
          <Link
            to="/diagnose"
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-leaf-200 px-4 py-3 text-sm font-semibold text-leaf-700 transition hover:border-leaf-400 hover:bg-leaf-50"
          >
            <ScanLine className="size-4" aria-hidden /> {t("auth.guest_link")}
          </Link>
        </AuthItem>
      </form>
    </AuthShell>
  );
}
