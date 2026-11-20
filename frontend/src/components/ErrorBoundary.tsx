import { Component, type ErrorInfo, type ReactNode } from "react";
import { House, RotateCcw, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { container } from "../lib/cn";
import { Button, ButtonLink } from "./ui";

/** Friendly screen instead of a blank white page when something crashes. */
export function CrashScreen({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className={`${container} flex flex-col items-center py-20 text-center`} role="alert">
      <span className="grid size-16 place-items-center rounded-full bg-wheat-200 text-soil-600">
        <TriangleAlert className="size-8" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-bold">{t("crash.title")}</h1>
      <p className="mt-2 max-w-md text-leaf-900/70">{t("crash.desc")}</p>
      <div className="mt-8 flex gap-3">
        <Button onClick={onRetry}>
          <RotateCcw className="size-4" /> {t("crash.retry")}
        </Button>
        <ButtonLink to="/" variant="secondary">
          <House className="size-4" /> {t("crash.home")}
        </ButtonLink>
      </div>
    </div>
  );
}

interface Props {
  children: ReactNode;
  /** Changing this value (e.g. the route) clears the error. */
  resetKey?: string;
  /** Custom fallback (e.g. the 2D hero when a 3D scene fails). Defaults to CrashScreen. */
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    // `fallback={null}` is valid (render nothing), so check for undefined rather than using ??.
    return this.props.fallback !== undefined ? this.props.fallback : <CrashScreen onRetry={() => this.setState({ error: null })} />;
  }
}
