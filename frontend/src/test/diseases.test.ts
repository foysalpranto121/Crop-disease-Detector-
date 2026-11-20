import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { slugify } from "../lib/diseaseImages";
import { buildDiseases, MODEL_LABELS } from "../mocks/data/diseases";

// Exact id2label of linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification (config.json).
const MODEL_ID2LABEL = [
  "Apple Scab",
  "Apple with Black Rot",
  "Cedar Apple Rust",
  "Healthy Apple",
  "Healthy Blueberry Plant",
  "Cherry with Powdery Mildew",
  "Healthy Cherry Plant",
  "Corn (Maize) with Cercospora and Gray Leaf Spot",
  "Corn (Maize) with Common Rust",
  "Corn (Maize) with Northern Leaf Blight",
  "Healthy Corn (Maize) Plant",
  "Grape with Black Rot",
  "Grape with Esca (Black Measles)",
  "Grape with Isariopsis Leaf Spot",
  "Healthy Grape Plant",
  "Orange with Citrus Greening",
  "Peach with Bacterial Spot",
  "Healthy Peach Plant",
  "Bell Pepper with Bacterial Spot",
  "Healthy Bell Pepper Plant",
  "Potato with Early Blight",
  "Potato with Late Blight",
  "Healthy Potato Plant",
  "Healthy Raspberry Plant",
  "Healthy Soybean Plant",
  "Squash with Powdery Mildew",
  "Strawberry with Leaf Scorch",
  "Healthy Strawberry Plant",
  "Tomato with Bacterial Spot",
  "Tomato with Early Blight",
  "Tomato with Late Blight",
  "Tomato with Leaf Mold",
  "Tomato with Septoria Leaf Spot",
  "Tomato with Spider Mites or Two-spotted Spider Mite",
  "Tomato with Target Spot",
  "Tomato Yellow Leaf Curl Virus",
  "Tomato Mosaic Virus",
  "Healthy Tomato Plant",
];

describe("disease knowledge base", () => {
  const diseases = buildDiseases();

  const main = diseases.filter((d) => !d.class_label.includes(":"));

  it("matches the pre-trained model's 38 labels in the same order", () => {
    expect(MODEL_LABELS).toEqual(MODEL_ID2LABEL);
    expect(main.map((d) => d.id)).toEqual(MODEL_ID2LABEL.map((_, i) => i + 1));
    expect(diseases.map((d) => d.id)).toEqual(diseases.map((_, i) => i + 1));
  });

  it.each([
    ["rice", "rice", 8],
    ["india", "wheat", 8],
    ["soybean", "soybean", 6],
    ["jute", "jute", 17],
  ])("has one entry per class of the %s crop model (labels.json)", (model, crop, count) => {
    const labels = JSON.parse(readFileSync(resolve(__dirname, `../../../backend/model/${model}/labels.json`), "utf8")) as string[];
    const rows = diseases.filter((d) => d.class_label.startsWith(`${model}:`));
    expect(rows).toHaveLength(count);
    expect(rows.every((d) => d.crop.key === crop)).toBe(true);
    // listed in model order, and every label really exists in the model
    const idx = rows.map((d) => labels.indexOf(d.class_label.slice(model.length + 1)));
    expect(idx.every((i) => i >= 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  });

  it("has Bangla and English text for every name, symptom and cause", () => {
    for (const d of diseases) {
      for (const field of [d.name, d.symptoms, d.causes]) {
        expect(field.en.trim(), d.class_label).not.toBe("");
        expect(field.bn.trim(), d.class_label).not.toBe("");
      }
    }
  });

  it("gives every disease chemical, organic and preventive advice; healthy classes get care tips", () => {
    for (const d of diseases) {
      const types = new Set(d.treatments.map((t) => t.type));
      if (d.is_healthy) {
        expect(types, d.class_label).toEqual(new Set(["preventive"]));
      } else {
        expect(types, d.class_label).toEqual(new Set(["chemical", "organic", "preventive"]));
      }
      for (const t of d.treatments) {
        expect(t.remedy.en && t.remedy.bn, d.class_label).toBeTruthy();
      }
    }
  });

  it("has 3 real reference photos on disk for every PlantVillage class, matching the download manifest", () => {
    const publicDir = resolve(__dirname, "../../public");
    const manifest = JSON.parse(readFileSync(resolve(publicDir, "diseases/manifest.json"), "utf8")) as Record<string, string[]>;
    for (const d of main) {
      expect(d.images, d.class_label).toHaveLength(3);
      expect(manifest[slugify(d.class_label)], d.class_label).toEqual(d.images);
      for (const url of d.images) expect(existsSync(resolve(publicDir, `.${url}`)), url).toBe(true);
    }
  });

  it("uses unique treatment ids", () => {
    const ids = diseases.flatMap((d) => d.treatments.map((t) => t.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
