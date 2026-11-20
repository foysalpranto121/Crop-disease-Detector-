/*
 * Export the frontend's disease knowledge base as the backend database seed.
 * One source of truth: edit src/mocks/data/*.ts, then re-run:
 *
 *   npx esbuild scripts/export-seed.ts --bundle --platform=node --format=esm --outfile=scripts/.export-seed.mjs && node scripts/.export-seed.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CROPS } from "../src/mocks/data/crops";
import { buildDiseases, MODEL_LABELS } from "../src/mocks/data/diseases";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../../backend/app/seed");
mkdirSync(outDir, { recursive: true });

const diseases = buildDiseases().map((d) => ({
  model_index: d.id - 1,
  class_label: d.class_label,
  crop_key: d.crop.key,
  name: d.name,
  type: d.type,
  is_healthy: d.is_healthy,
  pathogen: d.pathogen ?? null,
  symptoms: d.symptoms,
  causes: d.causes,
  treatments: d.treatments.map((t) => ({ type: t.type, remedy: t.remedy, dosage: t.dosage ?? null, precautions: t.precautions ?? null })),
}));

writeFileSync(resolve(outDir, "crops.json"), JSON.stringify(CROPS, null, 2) + "\n", "utf8");
writeFileSync(resolve(outDir, "diseases.json"), JSON.stringify(diseases, null, 2) + "\n", "utf8");
console.log(`Wrote ${CROPS.length} crops and ${diseases.length} diseases (${MODEL_LABELS.length} model labels) to ${outDir}`);
