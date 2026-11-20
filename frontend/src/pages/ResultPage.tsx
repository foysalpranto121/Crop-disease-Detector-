import { useLocation, useParams } from "react-router";
import { SearchX, ScanLine } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, USE_MOCKS } from "../api/client";
import type { PredictionResult } from "../api/types";
import { ResultView } from "../components/ResultView";
import { Alert, ButtonLink, EmptyState, ErrorState, LoadingState, PageHeader } from "../components/ui";
import { cn, container } from "../lib/cn";
import { useApi } from "../lib/useApi";

export default function ResultPage() {
  const { id = "" } = useParams();
  const { t } = useTranslation();
  const location = useLocation();
  const passed = (location.state as { result?: PredictionResult } | null)?.result;

  const { data, error, loading, reload } = useApi(
    () => (passed && String(passed.id) === id ? Promise.resolve(passed) : api.getHistoryItem(id)),
    [id],
  );

  return (
    <>
      <PageHeader title={t("result.title")} />
      <div className={cn(container, "space-y-4")}>
        {USE_MOCKS && <Alert tone="info">{t("common.demo_mode")}</Alert>}
        {loading ? (
          <LoadingState rows={4} />
        ) : error?.status === 404 ? (
          <EmptyState
            icon={<SearchX className="size-8" />}
            title={t("result.not_found")}
            action={
              <ButtonLink to="/diagnose">
                <ScanLine className="size-4" /> {t("result.scan_another")}
              </ButtonLink>
            }
          />
        ) : error || !data ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <ResultView result={data} />
        )}
      </div>
    </>
  );
}
