import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { Lock, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toApiError } from "../api/client";
import { AuthShell } from "../components/AuthShell";
import { TextField } from "../components/Field";
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
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        {loginRequired && <Alert tone="info">{t("auth.login_required")}</Alert>}
        {error && <Alert tone="danger">{error}</Alert>}
        <TextField label={t("auth.email")} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail className="size-4" />} />
        <TextField
          label={t("auth.password")}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="size-4" />}
        />
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          {t("auth.submit_login")}
        </Button>
        <p className="text-center text-sm text-leaf-900/70">
          {t("auth.no_account")}{" "}
          <Link to="/register" className="font-semibold text-leaf-700 hover:underline">
            {t("nav.register")}
          </Link>
        </p>
        <p className="text-center text-xs text-leaf-900/50">{t("auth.guest_note")}</p>
      </form>
    </AuthShell>
  );
}
