import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, toApiError } from "../api/client";

interface ApiState<T> {
  data: T | undefined;
  error: ApiError | undefined;
  loading: boolean;
}

/** Run an API call on mount / when deps change. Returns data, error, loading and reload(). */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<ApiState<T>>({ data: undefined, error: undefined, loading: true });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: undefined }));
    fnRef
      .current()
      .then((data) => alive && setState({ data, error: undefined, loading: false }))
      .catch((e) => alive && setState({ data: undefined, error: toApiError(e), loading: false }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((updater: (prev: T | undefined) => T | undefined) => {
    setState((s) => ({ ...s, data: updater(s.data) }));
  }, []);

  return { ...state, reload, setData };
}
