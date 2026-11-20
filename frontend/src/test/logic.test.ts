import { describe, expect, it } from "vitest";
import { formatPercent, pickL, toBnDigits } from "../lib/format";
import { checkImageFile } from "../lib/image";
import { buildDiseases } from "../mocks/data/diseases";
import { bandOf, simulatePrediction } from "../mocks/db";

describe("format helpers", () => {
  it("converts digits to Bangla", () => {
    expect(toBnDigits("2026 / 95%")).toBe("২০২৬ / ৯৫%");
  });
  it("formats percentages per language", () => {
    expect(formatPercent(0.943, "en")).toBe("94%");
    expect(formatPercent(0.943, "bn")).toBe("৯৪%");
    expect(formatPercent(1.4, "en")).toBe("100%");
  });
  it("picks the right language with English fallback", () => {
    expect(pickL({ en: "Tomato", bn: "টমেটো" }, "bn")).toBe("টমেটো");
    expect(pickL({ en: "Tomato", bn: "" }, "bn")).toBe("Tomato");
  });
});

describe("image checks", () => {
  it("rejects unsupported types and huge files", () => {
    expect(checkImageFile(new File(["x"], "a.gif", { type: "image/gif" }))).toEqual({ ok: false, reason: "UNSUPPORTED_FORMAT" });
    const big = new File([new Uint8Array(11 * 1024 * 1024)], "a.jpg", { type: "image/jpeg" });
    expect(checkImageFile(big)).toEqual({ ok: false, reason: "FILE_TOO_LARGE" });
    expect(checkImageFile(new File(["x"], "a.jpg", { type: "image/jpeg" }))).toEqual({ ok: true });
  });
});

describe("mock model", () => {
  const diseases = buildDiseases();

  it("maps confidence to bands", () => {
    expect(bandOf(0.9)).toBe("high");
    expect(bandOf(0.7)).toBe("medium");
    expect(bandOf(0.4)).toBe("low");
  });

  it("uses the file name as a hint for demos", () => {
    const sim = simulatePrediction("tomato_late_blight.jpg", diseases);
    const d = diseases.find((x) => x.id === sim.disease_id);
    expect(d?.class_label).toBe("Tomato with Late Blight");
    expect(sim.status).toBe("ok");
    expect(sim.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("returns top-3 with probabilities that sum to at most 1", () => {
    const sim = simulatePrediction("photo.jpg", diseases, () => 0.5);
    expect(sim.top_k).toHaveLength(3);
    const sum = sim.top_k.reduce((s, k) => s + k.confidence, 0);
    expect(sum).toBeLessThanOrEqual(1.0001);
    expect(sim.top_k[0].disease_id).toBe(sim.disease_id);
  });
});
