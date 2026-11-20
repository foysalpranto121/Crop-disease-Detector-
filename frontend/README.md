# Crop Disease Detector — Frontend

React + Vite + TypeScript web app. Green agriculture theme, 3D landing page, Bangla + English.
Built from `../FRONTEND_PLAN.md`. Runs **without a backend** using built-in mock data.

## Run it

```bash
cd frontend
npm install        # first time only
npm run dev        # open http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Type-check + production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit tests (Vitest) |

## Real backend vs demo mode

`frontend/.env.local` sets `VITE_USE_MOCKS=false`: the app talks to the FastAPI backend (`../backend`, port 8000) —
real AI diagnosis, database, login and chat. Start both with `..\start.ps1 -Dev`, or run everything from the backend
with `..\start.ps1` (http://localhost:8000).

Set `VITE_USE_MOCKS=true` (or delete the line) to run the frontend alone with the built-in mock data below.

## Demo mode (no backend)

The mock layer (`src/mocks/`, MSW) answers every `/api/*` call in the browser and saves data in `localStorage`.

- **Diagnosis results are simulated.** Tip for demos: if the photo's file name contains the crop and disease
  (e.g. `tomato_early_blight.jpg`, `potato_late_blight.png`), the mock returns that disease with high confidence.
  Otherwise it returns a random class (sometimes "low confidence" or "not a leaf", so every screen can be shown).
- **Demo accounts** (mock only): `admin@demo.com / admin123` (admin dashboard), `farmer@demo.com / farmer123`.
- To reset demo data: in the browser console run `localStorage.removeItem("cdd.mock.v1")` and reload.

When the FastAPI backend is ready, create `.env` with `VITE_USE_MOCKS=false`. Nothing else changes —
the mocks follow the same API contract (`src/api/types.ts`, FRONTEND_PLAN §7).

## Krishi AI chatbot

A floating chat button (bottom-right, every page) opens **Krishi AI**, a farming assistant that answers in Bangla or English.
On a result page it knows the current scan, and the "Ask Krishi AI about this" button asks about it directly.

- **AI provider:** EURI API (`https://api.euron.one/api/v1/euri`, OpenAI-compatible), model `gemini-2.5-flash` by default.
- **Key:** put `EURI_API_KEY=...` in `frontend/.env.local` (git-ignored) and restart `npm run dev`. The key is only read by the
  dev server (`server/euriChatPlugin.ts`) and is never sent to the browser. Change the model with `EURI_MODEL=...`.
- **Without a key / offline:** the chat still works, answering from the app's own disease library (marked "offline answer").
- **Production:** the chat endpoint runs inside `npm run dev` / `npm run preview`. When the FastAPI backend is built, it must
  serve the same `POST /api/chat` contract (documented at the top of `server/chatCore.ts`).

## Structure

```
src/
  api/          types.ts (API contract) · client.ts (fetch wrapper)
  components/   UI kit, ImagePicker, CameraCapture, ScanOverlay, ConfidenceMeter, TreatmentTabs, ResultView, Navbar…
  features/     AuthContext, SettingsContext (Lite mode)
  i18n/         en.ts + bn.ts (bn is type-checked against en, so no key can be missing)
  lib/          formatting (Bangla digits), image compression, device checks, districts
  mocks/        data/diseases.ts (38 classes, EN+BN, treatments) · db.ts · handlers.ts
  pages/        Landing, Diagnose, Result, History, Library, Disease, About, Login, Register, Admin, 404
  three/        HeroScene (Living Field) · GlobeScene (Bangladesh → World) · SVG fallbacks
  test/         Vitest tests
```

## Notes

- 3D loads only on the landing page, lazily, and switches off automatically (Lite mode) on reduced motion,
  Data Saver, 2G/3G, ≤ 2 GB RAM or no WebGL. Users can also toggle Lite mode in the footer.
- `mocks/data/diseases.ts` labels match the pre-trained model
  `linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification` exactly (a test enforces this).
