import type {
  AdminPredictionRow,
  AdminStats,
  ConfidenceBand,
  Disease,
  DiseaseSummary,
  DiseaseUpdate,
  FeedbackRow,
  HistoryItem,
  PredictionResult,
  PredictionStatus,
  RegisterInput,
  Treatment,
  TreatmentInput,
  User,
} from "../api/types";
import { CROPS } from "./data/crops";
import { buildDiseases } from "./data/diseases";

/*
 * In-browser fake database used while the real backend is not built yet.
 * Persists to localStorage so history, accounts and admin edits survive reloads.
 * Demo accounts below are mock-only test data (never used by the real backend).
 */

interface MockUser extends User {
  password: string;
  created_at: string;
}

interface MockPrediction {
  id: number;
  user_id: number | null;
  created_at: string;
  image_url: string | null;
  status: PredictionStatus;
  confidence: number;
  disease_id: number | null;
  top_k: { disease_id: number; confidence: number }[];
  latency_ms: number;
}

interface MockFeedback {
  id: number;
  prediction_id: number;
  user_id: number | null;
  is_correct: boolean;
  comment: string | null;
  created_at: string;
}

interface State {
  version: 1;
  seq: number;
  users: MockUser[];
  predictions: MockPrediction[];
  feedback: MockFeedback[];
  diseases: Disease[];
}

const STORAGE_KEY = "cdd.mock.v2"; // v2: diseases carry reference photos
const MAX_PREDICTIONS = 60;
let state: State | null = null;

// ---------- helpers ----------
export function bandOf(confidence: number): ConfidenceBand {
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.6) return "medium";
  return "low";
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number) => Math.round(n * 1000) / 1000;

// ---------- prediction simulation ----------
export interface SimulatedPrediction {
  status: PredictionStatus;
  disease_id: number | null;
  confidence: number;
  top_k: { disease_id: number; confidence: number }[];
}

/**
 * Simulate the model. If the file name mentions a crop + disease (e.g. "tomato_early_blight.jpg"),
 * that class is returned with high confidence — handy for demos. Otherwise a random class.
 */
export function simulatePrediction(fileName: string, diseases: Disease[], rand: () => number = Math.random): SimulatedPrediction {
  const words = new Set(
    fileName
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, "")
      .split(/[^a-z]+/)
      .filter((w) => w.length > 2),
  );

  let best: Disease | null = null;
  let bestScore = 0;
  for (const d of diseases) {
    const tokens = d.class_label
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length > 2 && !["with", "and", "plant"].includes(w));
    const score = tokens.filter((t) => words.has(t)).length;
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }

  const matched = best !== null && bestScore >= 2;
  let status: PredictionStatus = "ok";
  let disease: Disease;
  let confidence: number;

  if (matched && best) {
    disease = best;
    confidence = 0.9 + rand() * 0.09;
  } else {
    const r = rand();
    if (r < 0.05) {
      return { status: "not_a_leaf", disease_id: null, confidence: round(0.2 + rand() * 0.2), top_k: [] };
    }
    const pool = rand() < 0.75 ? diseases.filter((d) => !d.is_healthy) : diseases.filter((d) => d.is_healthy);
    disease = pool[Math.floor(rand() * pool.length)];
    if (r < 0.17) {
      status = "low_confidence";
      confidence = 0.35 + rand() * 0.2;
    } else {
      confidence = 0.78 + rand() * 0.21;
    }
  }

  const sameCrop = diseases.filter((d) => d.id !== disease.id && d.crop.key === disease.crop.key);
  const others = (sameCrop.length >= 2 ? sameCrop : diseases.filter((d) => d.id !== disease.id))
    .map((d) => ({ d, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .slice(0, 2)
    .map((x) => x.d);
  const rest = 1 - confidence;
  const top_k = [
    { disease_id: disease.id, confidence: round(confidence) },
    ...others.map((d, i) => ({ disease_id: d.id, confidence: round(rest * (i === 0 ? 0.6 : 0.25)) })),
  ];

  return { status, disease_id: disease.id, confidence: round(confidence), top_k };
}

// ---------- state ----------
function seedState(): State {
  const diseases = buildDiseases();
  const now = Date.now();
  const users: MockUser[] = [
    {
      id: 1,
      name: "Admin",
      email: "admin@demo.com",
      password: "admin123",
      role: "admin",
      country: "Bangladesh",
      district: "Dhaka",
      created_at: new Date(now - 30 * 86400000).toISOString(),
    },
    {
      id: 2,
      name: "Rahim Uddin",
      email: "farmer@demo.com",
      password: "farmer123",
      role: "farmer",
      country: "Bangladesh",
      district: "Bogura",
      created_at: new Date(now - 20 * 86400000).toISOString(),
    },
  ];

  const rand = mulberry32(42);
  const predictions: MockPrediction[] = [];
  const feedback: MockFeedback[] = [];
  let seq = 100;
  for (let i = 0; i < 26; i++) {
    const sim = simulatePrediction("seed", diseases, rand);
    const ageMs = Math.floor(rand() * 7 * 86400000);
    const id = ++seq;
    const userId = rand() < 0.45 ? 2 : null;
    predictions.push({
      id,
      user_id: userId,
      created_at: new Date(now - ageMs).toISOString(),
      image_url: null,
      latency_ms: Math.round(250 + rand() * 900),
      ...sim,
    });
    if (rand() < 0.3) {
      feedback.push({
        id: ++seq,
        prediction_id: id,
        user_id: userId,
        is_correct: rand() < 0.7,
        comment: rand() < 0.4 ? "Spots look different from the photo in the library." : null,
        created_at: new Date(now - ageMs + 60000).toISOString(),
      });
    }
  }
  predictions.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { version: 1, seq, users, predictions, feedback, diseases };
}

function load(): State {
  if (state) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === 1 && Array.isArray(parsed.diseases) && parsed.diseases.length === 38) {
        state = parsed;
        return state;
      }
    }
  } catch {
    /* corrupted or unavailable storage — reseed */
  }
  state = seedState();
  save();
  return state;
}

function save() {
  if (!state) return;
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return;
    } catch {
      // Probably over quota: drop the oldest stored photo and retry.
      const withImage = [...state.predictions].reverse().find((p) => p.image_url);
      if (!withImage) return;
      withImage.image_url = null;
    }
  }
}

const nextId = () => {
  const s = load();
  s.seq += 1;
  return s.seq;
};

// ---------- mappers ----------
function summary(d: Disease): DiseaseSummary {
  return { id: d.id, class_label: d.class_label, crop: d.crop, name: d.name, type: d.type, is_healthy: d.is_healthy, pathogen: d.pathogen, images: d.images };
}

function diseaseById(id: number | null): Disease | null {
  if (id === null) return null;
  return load().diseases.find((d) => d.id === id) ?? null;
}

function expand(p: MockPrediction): PredictionResult {
  const s = load();
  const fb = s.feedback.find((f) => f.prediction_id === p.id);
  return {
    id: p.id,
    status: p.status,
    confidence: p.confidence,
    confidence_band: bandOf(p.confidence),
    image_url: p.image_url,
    created_at: p.created_at,
    latency_ms: p.latency_ms,
    disease: diseaseById(p.disease_id),
    top_k: p.top_k.flatMap((k) => {
      const d = diseaseById(k.disease_id);
      return d ? [{ disease_id: d.id, name: d.name, crop: d.crop.name, confidence: k.confidence, image: d.images[0] ?? null }] : [];
    }),
    feedback: fb ? { is_correct: fb.is_correct } : null,
  };
}

function historyItem(p: MockPrediction): HistoryItem {
  const d = diseaseById(p.disease_id);
  return {
    id: p.id,
    created_at: p.created_at,
    image_url: p.image_url,
    status: p.status,
    confidence: p.confidence,
    confidence_band: bandOf(p.confidence),
    disease: d ? summary(d) : null,
  };
}

function publicUser(u: MockUser): User {
  return { id: u.id, name: u.name, email: u.email, role: u.role, country: u.country, district: u.district ?? null };
}

// ---------- public API used by the handlers ----------
export const db = {
  reset() {
    state = seedState();
    save();
  },

  // auth
  userFromAuthHeader(header: string | null): User | null {
    const match = header?.match(/^Bearer mock\.(\d+)$/);
    if (!match) return null;
    const u = load().users.find((x) => x.id === Number(match[1]));
    return u ? publicUser(u) : null;
  },
  login(email: string, password: string) {
    const u = load().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password);
    return u ? { token: `mock.${u.id}`, user: publicUser(u) } : null;
  },
  register(input: RegisterInput) {
    const s = load();
    if (s.users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())) return null;
    const u: MockUser = {
      id: nextId(),
      name: input.name.trim(),
      email: input.email.trim(),
      password: input.password,
      role: input.role,
      country: input.country,
      district: input.district ?? null,
      created_at: new Date().toISOString(),
    };
    s.users.push(u);
    save();
    return { token: `mock.${u.id}`, user: publicUser(u) };
  },

  // diseases
  crops() {
    const diseases = load().diseases;
    return CROPS.map((c) => ({ ...c, disease_count: diseases.filter((d) => d.crop.key === c.key && !d.is_healthy).length }));
  },
  diseases(crop?: string | null): DiseaseSummary[] {
    return load()
      .diseases.filter((d) => !crop || d.crop.key === crop)
      .map(summary);
  },
  disease(id: number): Disease | null {
    return diseaseById(id);
  },

  // predictions
  createPrediction(userId: number | null, imageUrl: string, fileName: string, latencyMs: number): PredictionResult {
    const s = load();
    const sim = simulatePrediction(fileName, s.diseases);
    const p: MockPrediction = {
      id: nextId(),
      user_id: userId,
      created_at: new Date().toISOString(),
      image_url: imageUrl,
      latency_ms: latencyMs,
      ...sim,
    };
    s.predictions.unshift(p);
    if (s.predictions.length > MAX_PREDICTIONS) s.predictions.length = MAX_PREDICTIONS;
    save();
    return expand(p);
  },
  prediction(id: number, user: User | null): PredictionResult | null {
    const p = load().predictions.find((x) => x.id === id);
    if (!p) return null;
    const allowed = p.user_id === null || (user && (user.id === p.user_id || user.role === "admin"));
    return allowed ? expand(p) : null;
  },
  history(userId: number): HistoryItem[] {
    return load()
      .predictions.filter((p) => p.user_id === userId)
      .map(historyItem);
  },
  deletePrediction(id: number, user: User): boolean {
    const s = load();
    const idx = s.predictions.findIndex((p) => p.id === id && (p.user_id === user.id || user.role === "admin"));
    if (idx < 0) return false;
    s.predictions.splice(idx, 1);
    s.feedback = s.feedback.filter((f) => f.prediction_id !== id);
    save();
    return true;
  },
  addFeedback(predictionId: number, user: User | null, isCorrect: boolean, comment: string | null): boolean {
    const s = load();
    const p = s.predictions.find((x) => x.id === predictionId);
    if (!p) return false;
    s.feedback = s.feedback.filter((f) => f.prediction_id !== predictionId);
    s.feedback.push({
      id: nextId(),
      prediction_id: predictionId,
      user_id: user?.id ?? null,
      is_correct: isCorrect,
      comment: comment?.trim() || null,
      created_at: new Date().toISOString(),
    });
    save();
    return true;
  },

  // admin
  stats(): AdminStats {
    const s = load();
    const today = new Date().toDateString();
    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      days.push({
        date: d.toISOString().slice(0, 10),
        count: s.predictions.filter((p) => new Date(p.created_at).toDateString() === d.toDateString()).length,
      });
    }
    const diseaseCounts = new Map<number, number>();
    const cropCounts = new Map<string, number>();
    for (const p of s.predictions) {
      const d = diseaseById(p.disease_id);
      if (!d) continue;
      cropCounts.set(d.crop.key, (cropCounts.get(d.crop.key) ?? 0) + 1);
      if (!d.is_healthy) diseaseCounts.set(d.id, (diseaseCounts.get(d.id) ?? 0) + 1);
    }
    const total = s.predictions.length;
    return {
      scans_today: s.predictions.filter((p) => new Date(p.created_at).toDateString() === today).length,
      total_scans: total,
      total_users: s.users.length,
      low_confidence_rate: total ? s.predictions.filter((p) => p.status !== "ok").length / total : 0,
      negative_feedback: s.feedback.filter((f) => !f.is_correct).length,
      scans_per_day: days,
      top_diseases: [...diseaseCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => {
          const d = diseaseById(id)!;
          return { disease_id: id, name: d.name, crop: d.crop.name, count };
        }),
      crops: [...cropCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => {
          const c = CROPS.find((x) => x.key === key)!;
          return { crop: c.name, emoji: c.emoji, count };
        }),
    };
  },
  adminPredictions(): AdminPredictionRow[] {
    const s = load();
    return s.predictions.map((p) => {
      const u = s.users.find((x) => x.id === p.user_id);
      const fb = s.feedback.find((f) => f.prediction_id === p.id);
      return {
        ...historyItem(p),
        user: u ? { id: u.id, name: u.name, email: u.email } : null,
        feedback: fb ? { is_correct: fb.is_correct, comment: fb.comment } : null,
      };
    });
  },
  adminFeedback(): FeedbackRow[] {
    const s = load();
    return [...s.feedback]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((f) => {
        const p = s.predictions.find((x) => x.id === f.prediction_id);
        const d = p ? diseaseById(p.disease_id) : null;
        return {
          id: f.id,
          prediction_id: f.prediction_id,
          is_correct: f.is_correct,
          comment: f.comment,
          created_at: f.created_at,
          user_name: s.users.find((u) => u.id === f.user_id)?.name ?? null,
          image_url: p?.image_url ?? null,
          disease: d ? summary(d) : null,
        };
      });
  },
  updateDisease(id: number, data: DiseaseUpdate): Disease | null {
    const d = diseaseById(id);
    if (!d) return null;
    if (data.name) d.name = data.name;
    if (data.symptoms) d.symptoms = data.symptoms;
    if (data.causes) d.causes = data.causes;
    save();
    return d;
  },
  addTreatment(diseaseId: number, data: TreatmentInput): Treatment | null {
    const d = diseaseById(diseaseId);
    if (!d) return null;
    const t: Treatment = { id: nextId(), ...data };
    d.treatments.push(t);
    save();
    return t;
  },
  updateTreatment(id: number, data: TreatmentInput): Treatment | null {
    for (const d of load().diseases) {
      const t = d.treatments.find((x) => x.id === id);
      if (t) {
        Object.assign(t, data);
        save();
        return t;
      }
    }
    return null;
  },
  deleteTreatment(id: number): boolean {
    for (const d of load().diseases) {
      const idx = d.treatments.findIndex((x) => x.id === id);
      if (idx >= 0) {
        d.treatments.splice(idx, 1);
        save();
        return true;
      }
    }
    return false;
  },
};
