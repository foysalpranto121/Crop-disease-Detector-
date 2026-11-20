# Crop Disease Detector — Backend (FastAPI)

REST API for the React frontend: real AI diagnosis with a pre-trained model, SQLite database, login, scan history,
admin dashboard and the Krishi AI chatbot. Serves the built frontend too, so one process runs the whole app.

## Run

```powershell
# easiest — from the project root:
.\start.ps1               # http://localhost:8000   (API docs at /docs)

# or manually, from backend/:
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
.\.venv\Scripts\python.exe -m pytest -q       # 26 tests
```

Settings live in `backend/.env` (git-ignored) — see `.env.example`. Demo accounts (development only):
`admin@demo.com / admin123`, `farmer@demo.com / farmer123` (turn off with `SEED_DEMO_USERS=false`).

## The AI model

| | |
|---|---|
| Model | `linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification` (MobileNetV2 fine-tuned on PlantVillage, 38 classes, reported accuracy 95.4%) |
| File | `model/plant_disease_mobilenetv2.onnx` (9.2 MB) + `labels.json` + `model_info.json` |
| Runtime | ONNX Runtime on CPU — no PyTorch needed to run the API |
| Preprocessing | `app/ml/preprocess.py` (resize shortest edge 256 → centre-crop 224 → normalise 0.5/0.5), identical to the model's own config |
| Export | `scripts/export_model.py` (one-time, needs torch + transformers). Parity check vs PyTorch: 8/8 same answers, max logit difference 1.6e-5 |

Decision logic (`app/routers/predict.py`):
1. Validate the upload (`app/ml/image_checks.py`): JPEG/PNG/WebP, ≤10 MB, decodes safely, not too small/dark/bright/blurry.
2. Run the model → top-3 classes.
3. **not_a_leaf** if the photo has almost no leaf colours or no green at all (heuristic — the model has no "not a leaf" class).
4. **low_confidence** if the top probability is below `LOW_CONFIDENCE_THRESHOLD` (0.6) — the UI then hides chemical doses.
5. Otherwise **ok**. The photo is stored re-encoded (EXIF/GPS removed) under a random name.

⚠️ The sample photos in `tests/fixtures` come from PlantVillage and were probably seen in training, so the tests prove the
pipeline works — not real-field accuracy. Field accuracy on phone photos will be lower (see the report's limitations).

## API (all under `/api`, errors are `{"detail": {"reason", "message"}}`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | – | model version, class count, chat on/off |
| POST | `/predict` (multipart `file`) | optional | diagnose a leaf photo |
| POST | `/predictions/{id}/feedback` | owner / guest scan | "was this correct?" |
| GET / DELETE | `/history`, `/history/{id}` | user | scan history (guest scans viewable by id) |
| GET | `/images/{name}` | – | stored photo (random 128-bit names) |
| GET | `/crops`, `/diseases?crop=`, `/diseases/{id}` | – | disease library (bilingual) |
| POST / GET | `/auth/register`, `/auth/login`, `/auth/me` | – / user | JWT login (bcrypt passwords) |
| GET | `/admin/stats`, `/admin/predictions`, `/admin/feedback` | admin | dashboard |
| PUT / POST / DELETE | `/admin/diseases/{id}`, `/admin/diseases/{id}/treatments`, `/admin/treatments/{id}` | admin | edit knowledge base |
| POST | `/chat` | – | Krishi AI, streams NDJSON (EURI API, key stays on the server) |

## Data

- `app/seed/*.json` — the 38-class bilingual knowledge base, exported from the frontend
  (`frontend/scripts/export-seed.ts`). A startup check refuses to run if model labels and disease rows don't match.
- `data/` (git-ignored) — `app.db` (SQLite), `uploads/`, generated `.secret_key`.
