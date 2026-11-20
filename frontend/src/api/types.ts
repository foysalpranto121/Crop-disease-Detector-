// API contract shared by the mock layer (MSW) and the future FastAPI backend.
// See FRONTEND_PLAN.md §7.

export type Lang = "en" | "bn";

/** A bilingual text value. */
export interface L {
  en: string;
  bn: string;
}

export interface Crop {
  key: string;
  name: L;
  emoji: string;
  supported: boolean;
  disease_count?: number;
}

export type DiseaseType = "fungus" | "bacteria" | "virus" | "pest" | "oomycete" | "healthy";
export type TreatmentType = "chemical" | "organic" | "preventive";

export interface Treatment {
  id: number;
  type: TreatmentType;
  remedy: L;
  dosage?: L | null;
  precautions?: L | null;
}

export interface DiseaseSummary {
  id: number;
  class_label: string;
  crop: Crop;
  name: L;
  type: DiseaseType;
  is_healthy: boolean;
  pathogen?: string | null;
  /** Real reference photos of this class (PlantVillage dataset). */
  images: string[];
}

export interface Disease extends DiseaseSummary {
  symptoms: L;
  causes: L;
  treatments: Treatment[];
}

export type PredictionStatus = "ok" | "low_confidence" | "not_a_leaf";
export type ConfidenceBand = "high" | "medium" | "low";

export interface TopK {
  disease_id: number;
  name: L;
  crop: L;
  confidence: number;
  /** One reference photo of this class, for side-by-side comparison. */
  image?: string | null;
}

export interface PredictionResult {
  id: number;
  status: PredictionStatus;
  confidence: number;
  confidence_band: ConfidenceBand;
  image_url: string | null;
  created_at: string;
  disease: Disease | null;
  top_k: TopK[];
  latency_ms?: number;
  feedback?: { is_correct: boolean } | null;
}

export interface HistoryItem {
  id: number;
  created_at: string;
  image_url: string | null;
  status: PredictionStatus;
  confidence: number;
  confidence_band: ConfidenceBand;
  disease: DiseaseSummary | null;
}

export type Role = "farmer" | "agronomist" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  country: string;
  district?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: "farmer" | "agronomist";
  country: string;
  district?: string | null;
}

export interface AdminStats {
  scans_today: number;
  total_scans: number;
  total_users: number;
  low_confidence_rate: number;
  negative_feedback: number;
  scans_per_day: { date: string; count: number }[];
  top_diseases: { disease_id: number; name: L; crop: L; count: number }[];
  crops: { crop: L; emoji: string; count: number }[];
}

export interface AdminPredictionRow extends HistoryItem {
  user: { id: number; name: string; email: string } | null;
  feedback: { is_correct: boolean; comment?: string | null } | null;
}

export interface FeedbackRow {
  id: number;
  prediction_id: number;
  is_correct: boolean;
  comment: string | null;
  created_at: string;
  user_name: string | null;
  image_url: string | null;
  disease: DiseaseSummary | null;
}

export interface DiseaseUpdate {
  name?: L;
  symptoms?: L;
  causes?: L;
}

export interface TreatmentInput {
  type: TreatmentType;
  remedy: L;
  dosage?: L | null;
  precautions?: L | null;
}
