import { delay, http, HttpResponse } from "msw";
import type { DiseaseUpdate, RegisterInput, TreatmentInput } from "../api/types";
import { blobToDataUrl } from "../lib/image";
import { db } from "./db";

const fail = (status: number, reason: string, message: string) =>
  HttpResponse.json({ detail: { reason, message } }, { status });

const authUser = (request: Request) => db.userFromAuthHeader(request.headers.get("Authorization"));

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export const handlers = [
  // ---------- diagnosis ----------
  http.post("*/api/predict", async ({ request }) => {
    const started = performance.now();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail(422, "NO_FILE", "No image uploaded");
    if (!ACCEPTED.includes(file.type)) return fail(422, "UNSUPPORTED_FORMAT", "Unsupported image type");
    if (file.size > 10 * 1024 * 1024) return fail(413, "FILE_TOO_LARGE", "Image larger than 10 MB");

    await delay(1300 + Math.random() * 700); // feel of a real network + model call
    const imageUrl = await blobToDataUrl(file);
    const result = db.createPrediction(authUser(request)?.id ?? null, imageUrl, file.name, Math.round(performance.now() - started));
    return HttpResponse.json(result);
  }),

  http.post("*/api/predictions/:id/feedback", async ({ request, params }) => {
    const body = (await request.json()) as { is_correct: boolean; comment?: string | null };
    const ok = db.addFeedback(Number(params.id), authUser(request), body.is_correct, body.comment ?? null);
    return ok ? HttpResponse.json({ ok: true }) : fail(404, "NOT_FOUND", "Prediction not found");
  }),

  // ---------- history ----------
  http.get("*/api/history", async ({ request }) => {
    const user = authUser(request);
    if (!user) return fail(401, "UNAUTHORIZED", "Login required");
    await delay(250);
    return HttpResponse.json(db.history(user.id));
  }),
  http.get("*/api/history/:id", async ({ request, params }) => {
    await delay(200);
    const result = db.prediction(Number(params.id), authUser(request));
    return result ? HttpResponse.json(result) : fail(404, "NOT_FOUND", "Result not found");
  }),
  http.delete("*/api/history/:id", ({ request, params }) => {
    const user = authUser(request);
    if (!user) return fail(401, "UNAUTHORIZED", "Login required");
    return db.deletePrediction(Number(params.id), user) ? new HttpResponse(null, { status: 204 }) : fail(404, "NOT_FOUND", "Not found");
  }),

  // ---------- library ----------
  http.get("*/api/crops", () => HttpResponse.json(db.crops())),
  http.get("*/api/diseases", async ({ request }) => {
    await delay(150);
    const crop = new URL(request.url).searchParams.get("crop");
    return HttpResponse.json(db.diseases(crop));
  }),
  http.get("*/api/diseases/:id", async ({ params }) => {
    await delay(150);
    const d = db.disease(Number(params.id));
    return d ? HttpResponse.json(d) : fail(404, "NOT_FOUND", "Disease not found");
  }),

  // ---------- auth ----------
  http.post("*/api/auth/login", async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string };
    await delay(400);
    const res = db.login(email, password);
    return res ? HttpResponse.json(res) : fail(401, "INVALID_CREDENTIALS", "Wrong email or password");
  }),
  http.post("*/api/auth/register", async ({ request }) => {
    const input = (await request.json()) as RegisterInput;
    await delay(400);
    if (!input.name?.trim() || !input.email?.includes("@") || (input.password ?? "").length < 6) {
      return fail(422, "INVALID_INPUT", "Please fill in all fields correctly");
    }
    const res = db.register(input);
    return res ? HttpResponse.json(res) : fail(409, "EMAIL_TAKEN", "Email already registered");
  }),
  http.get("*/api/auth/me", ({ request }) => {
    const user = authUser(request);
    return user ? HttpResponse.json(user) : fail(401, "UNAUTHORIZED", "Login required");
  }),

  // ---------- admin ----------
  http.all("*/api/admin/*", ({ request }) => {
    const user = authUser(request);
    if (!user) return fail(401, "UNAUTHORIZED", "Login required");
    if (user.role !== "admin") return fail(403, "FORBIDDEN", "Admins only");
    return undefined; // fall through to the specific admin handler
  }),
  http.get("*/api/admin/stats", async () => {
    await delay(300);
    return HttpResponse.json(db.stats());
  }),
  http.get("*/api/admin/predictions", async () => {
    await delay(300);
    return HttpResponse.json(db.adminPredictions());
  }),
  http.get("*/api/admin/feedback", async () => {
    await delay(250);
    return HttpResponse.json(db.adminFeedback());
  }),
  http.put("*/api/admin/diseases/:id", async ({ request, params }) => {
    const d = db.updateDisease(Number(params.id), (await request.json()) as DiseaseUpdate);
    return d ? HttpResponse.json(d) : fail(404, "NOT_FOUND", "Disease not found");
  }),
  http.post("*/api/admin/diseases/:id/treatments", async ({ request, params }) => {
    const t = db.addTreatment(Number(params.id), (await request.json()) as TreatmentInput);
    return t ? HttpResponse.json(t, { status: 201 }) : fail(404, "NOT_FOUND", "Disease not found");
  }),
  http.put("*/api/admin/treatments/:id", async ({ request, params }) => {
    const t = db.updateTreatment(Number(params.id), (await request.json()) as TreatmentInput);
    return t ? HttpResponse.json(t) : fail(404, "NOT_FOUND", "Treatment not found");
  }),
  http.delete("*/api/admin/treatments/:id", ({ params }) =>
    db.deleteTreatment(Number(params.id)) ? new HttpResponse(null, { status: 204 }) : fail(404, "NOT_FOUND", "Treatment not found"),
  ),
];
