import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Lock, Mail, Sprout, UserRound, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toApiError } from "../api/client";
import type { RegisterInput } from "../api/types";
import { AuthShell } from "../components/AuthShell";
import { SelectField, TextField } from "../components/Field";
import { Alert, Button } from "../components/ui";
import { useAuth } from "../features/AuthContext";
import { cn } from "../lib/cn";
import { BD_DISTRICTS } from "../lib/districts";
import { pickL } from "../lib/format";

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterInput>({ name: "", email: "", password: "", role: "farmer", country: "Bangladesh", district: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof RegisterInput>(key: K, value: RegisterInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({ ...form, district: form.country === "Bangladesh" ? form.district || null : null });
      navigate("/diagnose", { replace: true });
    } catch (err) {
      setError(toApiError(err).status === 409 ? t("auth.err_email_taken") : t("auth.err_generic"));
      setBusy(false);
    }
  };

  const roles = [
    { value: "farmer" as const, label: t("auth.farmer"), Icon: Sprout },
    { value: "agronomist" as const, label: t("auth.agronomist"), Icon: GraduationCap },
  ];

  return (
    <AuthShell title={t("auth.register_title")} subtitle={t("auth.register_sub")}>
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <TextField label={t("auth.name")} required autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} icon={<UserRound className="size-4" />} />
        <TextField label={t("auth.email")} type="email" required autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} icon={<Mail className="size-4" />} />
        <TextField
          label={t("auth.password")}
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          hint={t("auth.password_hint")}
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          icon={<Lock className="size-4" />}
        />

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">{t("auth.role")}</legend>
          <div className="grid grid-cols-2 gap-3">
            {roles.map(({ value, label, Icon }) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-2xl p-4 text-center text-sm font-semibold ring-2 transition",
                  form.role === value ? "bg-leaf-50 ring-leaf-500" : "ring-leaf-100 hover:ring-leaf-300",
                )}
              >
                <input type="radio" name="role" value={value} checked={form.role === value} onChange={() => set("role", value)} className="sr-only" />
                <Icon className={cn("size-7", form.role === value ? "text-leaf-600" : "text-leaf-900/40")} aria-hidden />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label={t("auth.country")} value={form.country} onChange={(e) => set("country", e.target.value)}>
            <option value="Bangladesh">🇧🇩 {t("auth.bangladesh")}</option>
            <option value="Other">🌍 {t("auth.other_country")}</option>
          </SelectField>
          {form.country === "Bangladesh" && (
            <SelectField label={t("auth.district")} value={form.district ?? ""} onChange={(e) => set("district", e.target.value)}>
              <option value="">{t("auth.select_district")}</option>
              {BD_DISTRICTS.map((d) => (
                <option key={d.en} value={d.en}>
                  {pickL(d, i18n.language)}
                </option>
              ))}
            </SelectField>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" loading={busy}>
          {t("auth.submit_register")}
        </Button>
        <p className="text-center text-sm text-leaf-900/70">
          {t("auth.have_account")}{" "}
          <Link to="/login" className="font-semibold text-leaf-700 hover:underline">
            {t("nav.login")}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
