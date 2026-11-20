import type {
  AdminPredictionRow,
  AdminStats,
  AuthResponse,
  Crop,
  Disease,
  DiseaseSummary,
  DiseaseUpdate,
  FeedbackRow,
  HistoryItem,
  PredictionResult,
  RegisterInput,
  Treatment,
  TreatmentInput,
  User,
} from "./types";

const BASE_URL: string = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY = "cdd.token";

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  return new ApiError(0, "UNKNOWN", e instanceof Error ? e.message : String(e));
}

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable (private mode) — stay logged in for this tab only */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = tokenStore.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(BASE_URL + path, { ...init, headers });
  } catch {
    throw new ApiError(0, "NETWORK", "Network error");
  }

  if (!res.ok) {
    let code = `HTTP_${res.status}`;
    let message = res.statusText || "Request failed";
    try {
      const body = await res.json();
      const detail = body?.detail;
      if (detail && typeof detail === "object") {
        code = detail.reason ?? detail.code ?? code;
        message = detail.message ?? message;
      } else if (typeof detail === "string") {
        message = detail;
      }
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, code, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const json = (body: unknown) => JSON.stringify(body);

export const api = {
  // Diagnosis
  predict(image: Blob, fileName = "leaf.jpg") {
    const form = new FormData();
    form.append("file", image, fileName);
    return request<PredictionResult>("/api/predict", { method: "POST", body: form });
  },
  sendFeedback(predictionId: number, isCorrect: boolean, comment?: string) {
    return request<{ ok: true }>(`/api/predictions/${predictionId}/feedback`, {
      method: "POST",
      body: json({ is_correct: isCorrect, comment: comment ?? null }),
    });
  },

  // History
  getHistory() {
    return request<HistoryItem[]>("/api/history");
  },
  getHistoryItem(id: number | string) {
    return request<PredictionResult>(`/api/history/${id}`);
  },
  deleteHistoryItem(id: number) {
    return request<void>(`/api/history/${id}`, { method: "DELETE" });
  },

  // Library
  getCrops() {
    return request<Crop[]>("/api/crops");
  },
  getDiseases(crop?: string) {
    const q = crop ? `?crop=${encodeURIComponent(crop)}` : "";
    return request<DiseaseSummary[]>(`/api/diseases${q}`);
  },
  getDisease(id: number | string) {
    return request<Disease>(`/api/diseases/${id}`);
  },

  // Auth
  login(email: string, password: string) {
    return request<AuthResponse>("/api/auth/login", { method: "POST", body: json({ email, password }) });
  },
  register(input: RegisterInput) {
    return request<AuthResponse>("/api/auth/register", { method: "POST", body: json(input) });
  },
  me() {
    return request<User>("/api/auth/me");
  },

  // Admin
  adminStats() {
    return request<AdminStats>("/api/admin/stats");
  },
  adminPredictions() {
    return request<AdminPredictionRow[]>("/api/admin/predictions");
  },
  adminFeedback() {
    return request<FeedbackRow[]>("/api/admin/feedback");
  },
  updateDisease(id: number, data: DiseaseUpdate) {
    return request<Disease>(`/api/admin/diseases/${id}`, { method: "PUT", body: json(data) });
  },
  addTreatment(diseaseId: number, data: TreatmentInput) {
    return request<Treatment>(`/api/admin/diseases/${diseaseId}/treatments`, { method: "POST", body: json(data) });
  },
  updateTreatment(id: number, data: TreatmentInput) {
    return request<Treatment>(`/api/admin/treatments/${id}`, { method: "PUT", body: json(data) });
  },
  deleteTreatment(id: number) {
    return request<void>(`/api/admin/treatments/${id}`, { method: "DELETE" });
  },
};
