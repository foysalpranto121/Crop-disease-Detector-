# Frontend Plan — Plant/Crop Disease Detector

**Build order:** Frontend first → Backend API → Model integration → Deployment (one step at a time)
**Market:** Bangladesh first 🇧🇩, then global 🌍
**Look & feel:** Green, animated agriculture theme, 3D website

| | |
|---|---|
| Project | Plant/Crop Disease Detector (DIU, Dept. of Software Engineering) |
| Model | Existing pre-trained model, no training: MobileNetV2 trained on PlantVillage, 38 classes, ~95% reported accuracy (`linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification`) |
| This document | Requirements and step-by-step build plan for the **frontend only** |
| Version | 0.1, 2026-11-20 |

---

## 1. Goals

1. **Bangladesh first.** The app works fully in **Bangla (বাংলা)** and English. It is designed for low-cost Android phones and slow mobile data, and it uses wording a farmer understands.
2. **Global ready.** Adding a new language or region later needs only a new translation file, not code changes.
3. **Beautiful and memorable.** A green agriculture theme, smooth animations and a **3D hero scene** on the landing page that makes the project stand out at the defence.
4. **Fast where it matters.** The diagnose flow (upload → result) stays light and fast even on a weak phone. The 3D and heavy animations stay on the landing page and switch off automatically on weak devices.
5. **Built before the backend exists.** The frontend runs against **mock data** that follows the real API format. When the backend is ready, one setting switches it over.

---

## 2. Tech stack

| Purpose | Tool | Why |
|---|---|---|
| Framework | **React + Vite + TypeScript** | Fast development and build; type safety |
| Styling | **Tailwind CSS v4** | Quick, consistent styling with a custom green theme |
| Routing | **React Router v7** | Page navigation |
| 3D | **Three.js** via **@react-three/fiber** + **@react-three/drei** | 3D scenes written as React components |
| Animation | **Motion** (formerly Framer Motion) | Page transitions, scroll reveals, hover effects, number count-ups |
| Lightweight animations | **Lottie** (`lottie-react`) | Small vector animations: growing plant loader, scanning leaf, success tick |
| Languages | **react-i18next** | Bangla and English now, more languages later |
| Icons | **lucide-react** | Clean line icons |
| Server data (later) | **TanStack Query** | Caching and loading states once the backend is connected |
| Mock API | **MSW (Mock Service Worker)** | Fakes the backend in the browser while the frontend is built first |
| Testing | Vitest + React Testing Library, Playwright (later) | Component and end-to-end tests |

**Fonts:**
- **Hind Siliguri** or **Noto Sans Bengali** for Bangla text
- **Poppins** for English headings, **Inter** for English body text

Load fonts from Google Fonts with `display=swap`.

---

## 3. Design system: "Green Field" theme

### 3.1 Colours

| Token | Hex | Use |
|---|---|---|
| `leaf-900` | `#0B3D1F` | Dark sections, footer, text on light backgrounds |
| `leaf-700` | `#146C2E` | Primary buttons, links, active navigation |
| `leaf-500` | `#22A447` | Highlights, icons, progress bars |
| `leaf-300` | `#8EDB8F` | Hover states, tags |
| `leaf-100` | `#E8F7EA` | Section backgrounds, cards |
| `soil-600` | `#7A4E2D` | Earth accents, illustrations |
| `wheat-400` | `#E9C46A` | Warm accents, "medium confidence" |
| `sky-300` | `#9ED8F0` | Sky in the 3D scene, info notices |
| `danger-500` | `#D64545` | Disease alerts, errors |
| `cream-50` | `#FBFAF5` | Page background |

**Confidence colours** always come with a text label, never colour alone: High = `leaf-500`, Medium = `wheat-400`, Low = `danger-500`.

**Dark mode:** a later "nice to have". Define every colour as a CSS variable from the start so dark mode is easy to add.

### 3.2 Shape, spacing, motion

- Rounded, organic shapes: `rounded-2xl` cards, pill-shaped buttons, soft shadows.
- Leaf and wave dividers (SVG) between landing-page sections.
- Spacing on an 8 px scale. Mobile-first layout with a 16 px side margin on phones.
- **Motion rules:**
  - Normal transitions take 200–400 ms with a gentle ease-out.
  - Never animate something that blocks the user's next tap.
  - Respect the phone's **reduced-motion** setting (`prefers-reduced-motion`); when it is on, everything becomes static.

### 3.3 Core components

These are built once and reused everywhere:

- `Button` (primary / secondary / ghost)
- `Card`
- `Badge` (crop, status)
- `ConfidenceMeter` (animated ring + %)
- `TreatmentTabs` (Chemical / Organic / Prevention)
- `ImagePicker` (drag-and-drop + gallery + camera)
- `CameraCapture`
- `ScanOverlay` (scanning-beam animation)
- `LanguageSwitch` (বাং / EN)
- `Navbar`
- `Footer`
- `Alert`
- `EmptyState`
- `Skeleton` loaders
- `PageTransition` wrapper

---

## 4. 3D and animation requirements

### 4.1 Landing page 3D hero: "Living Field"

A low-poly 3D farm scene behind the hero text:

- **Rolling green field** with rows of crops (rice, tomato and potato plants) **swaying in the wind**, done with a simple vertex animation.
- A **large floating leaf** in the centre that slowly rotates. Every few seconds a **green scanning beam** passes over it, and disease spots light up and then turn healthy, telling the app's story without words.
- **Floating particles** like pollen or small leaves drifting in the air.
- A **sun and sky gradient**. Optional: the time of day shifts slightly as the user scrolls.
- **Mouse / tilt parallax:** the camera moves a little with the mouse on desktop, or with device tilt on phones if allowed.
- A **"Scan a Leaf" button** on top of the scene that leads to the Diagnose page.

### 4.2 "Bangladesh to the World" 3D globe section

- A rotating 3D globe with **Bangladesh highlighted in green** and a glowing pin.
- As the user scrolls, green dots spread from Bangladesh to other countries, illustrating the "Bangladesh first, global next" vision.
- Next to it, animated counters: **38 diseases · 14 crops · < 2 sec result · বাংলা + English**.

### 4.3 Other animations across the site

| Where | Animation |
|---|---|
| Page changes | Fade and slide transition |
| Landing sections | Scroll-reveal: cards rise and fade in, leaves drift in from the sides |
| "How it works" (3 steps) | Steps draw in one after another: 📷 Take photo → 🔍 AI scans → 💊 Get treatment |
| Image upload | Picked photo drops into the frame with a small bounce |
| While analyzing | **Scanning beam** moves over the user's photo plus a "growing seedling" loader (Lottie) |
| Result appears | Disease card slides up; confidence ring fills and the % **counts up** |
| Healthy result | Small celebration: leaves burst outward and a green tick appears |
| Disease library cards | Lift and 3D tilt on hover (desktop only) |
| Buttons | Gentle scale on press, ripple in leaf green |
| Background (subtle) | A few slow drifting leaves on the landing page only, never on working pages |

### 4.4 3D assets

- Use **low-poly GLB models** with free licences (CC0 or CC-BY), from Poly Pizza, Kenney or Quaternius, or build simple shapes in code.
- Credit every asset on the About page.
- Compress models with **Draco / gltf-transform**. Target: **all 3D assets together under 2 MB**.

### 4.5 Performance and fallback rules (important for Bangladesh)

The 3D scene is a bonus, not a requirement for using the app:

1. Load the 3D scene **lazily**, after the hero text and buttons have already appeared.
2. Show a **static image or 2D animated fallback** instead of 3D when any of these is true:
   - the user turned on reduced motion
   - **Data Saver** is on (`navigator.connection.saveData`)
   - the network is 2G/3G (`effectiveType`)
   - the device has ≤ 2 GB memory (`navigator.deviceMemory`)
   - WebGL is not available
3. Limit render resolution (`dpr` max 1.5) and pause rendering when the scene is off-screen or the tab is hidden.
4. **No 3D on the Diagnose, Result, History or Admin pages.** They must stay fast.
5. A footer toggle, "Lite mode / হালকা মোড", lets users turn off 3D and heavy animations manually. The choice is remembered.

---

## 5. Bangladesh-first and global requirements

| Requirement | Detail |
|---|---|
| Language | Bangla and English with a toggle in the navbar. **Default:** Bangla if the browser language is `bn`, otherwise English. The choice is remembered. |
| Translations | Every visible text, including disease names, symptoms and treatments, comes from translation files (`locales/bn/*.json`, `locales/en/*.json`). No hard-coded text. |
| Numbers | Option to show Bangla digits (৯৫%) in Bangla mode. Dates formatted per language (`Intl.DateTimeFormat`). |
| Simple wording | Plain words: "রোগ" (disease), "চিকিৎসা" (treatment), "নিশ্চয়তা" (confidence). Avoid technical terms like "class" or "inference". |
| Local help | Result page shows a "Need expert help?" box with Bangladesh's **Krishi Call Center 16123**, and advice to contact the local Upazila Agriculture Officer. |
| Low bandwidth | Photos are shrunk in the phone before upload (max 640 px, about 50–80 KB). Diagnose page JavaScript under ~200 KB gzipped. |
| Low-end phones | Target devices: 2–3 GB RAM Android phones with Chrome. Large tap targets (min 44 px), big readable text (min 16 px). |
| Honest crop coverage | The model covers **14 crops**: Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Bell Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato. Show this list clearly. Mark **rice, jute and wheat** as "Coming soon" so farmers don't upload unsupported crops and get wrong answers. |
| Global later | Adding a language means adding one folder of JSON files. Layout uses logical CSS (`ms-`/`me-` instead of `ml-`/`mr-`) so right-to-left languages like Arabic or Urdu can be added later. |

---

## 6. Pages and what each one contains

### 6.1 Landing page `/`

1. **Hero:**
   - 3D "Living Field" scene (§4.1)
   - headline: *"Scan a leaf. Save your crop." / "পাতা স্ক্যান করুন, ফসল বাঁচান।"*
   - buttons: **Scan a Leaf** (primary) and **How it works**
2. **How it works:** three animated steps (photo → AI scan → treatment).
3. **Supported crops:** a grid of 14 crop cards with icons, plus "Coming soon" cards for rice, jute and wheat.
4. **Why use it:** cards for **Fast (< 2 s)**, **Free**, **Bangla support**, **Treatment advice** and **Works on any phone**.
5. **Bangladesh to the World:** 3D globe and counters (§4.2).
6. **Call to action:** a large green band with a "Start scanning" button.
7. **Footer:**
   - project info: DIU, student, supervisor
   - links, language switch
   - Lite-mode toggle
   - disclaimer

### 6.2 Diagnose page `/diagnose` (core of the app, FR-01)

- `ImagePicker` with three ways to add a photo:
  - **Take Photo** (opens the rear camera on phones)
  - **Choose from Gallery**
  - **Drag & drop** (desktop)
- **Photo tips** with small illustrations: one leaf, good daylight, fill the frame, keep the camera still.
- Preview of the chosen photo, with **Retake** and **Analyze** buttons.
- Checks before upload (FR-02, frontend part):
  - file type JPEG/PNG/WebP
  - max 10 MB before compression
  - show a friendly error message in the selected language
- While analyzing: `ScanOverlay` beam over the photo plus a seedling loader, with rotating status text ("Checking leaf…", "Finding disease…").

### 6.3 Result view `/result/:id` (FR-03, FR-04)

- **Top card:**
  - crop name + disease name (Bangla/English)
  - the user's photo
  - **ConfidenceMeter** (animated ring) with a High / Medium / Low label
- **Status banners:**
  - ✅ *Healthy*: celebration animation + care tips
  - ⚠️ *Low confidence*: "We're not sure. Please retake the photo." Shows the top-3 possible diseases; **chemical dosage is hidden**.
  - ❌ *Not a leaf / unsupported crop*: explains what went wrong and shows a retake button
- **About this disease:** symptoms, cause, how it spreads.
- **TreatmentTabs:**
  - **Chemical** (medicine name, dosage per litre of water, safety precautions)
  - **Organic**
  - **Prevention**
- **Other possibilities:** top-3 list with small confidence bars.
- **Was this correct?** 👍 / 👎 feedback buttons.
- **Need expert help?** box (16123, Upazila Agriculture Officer).
- **Disclaimer:** "Advisory only. Follow the product label and local regulations."
- Actions: **Scan another leaf**, **Save / Share** (Web Share API on phones), **Print / Download PDF** (browser print styles).

### 6.4 History `/history` (FR-05, logged-in users)

- List or grid of past scans: thumbnail, disease, crop badge, confidence, date.
- Filter by crop, search by disease, sort by newest first.
- Tap an item to open the full Result view. Swipe or click to delete, with confirmation.
- Empty state: a friendly illustration and a "Scan your first leaf" button.

### 6.5 Disease Library `/library` and `/library/:id`

- Browse by crop (tabs or chips) → disease cards with an image, name and type (fungus, bacteria, virus or pest).
- Detail page: symptoms, causes, and the same TreatmentTabs, so farmers can learn without scanning.

### 6.6 About `/about`

- Project purpose, how the AI works in simple words, the model used and its accuracy, limitations (lab images vs real field, supported crops), team / supervisor / DIU, references, 3D asset credits.

### 6.7 Auth: `/login`, `/register`

- Simple forms: name, email or phone, password, role (Farmer / Agronomist), district (Bangladesh district dropdown first, "Other country" option for global users).
- Guests can scan without an account. Logging in is only needed to save history.

### 6.8 Admin `/admin` (admin role only)

- **Overview:** stat cards (scans today, total users, % low-confidence) and simple charts (scans per day, top diseases, top crops).
- **Scan logs:** table of recent predictions with image, result, confidence and feedback.
- **Feedback:** list of 👎 reports to review.
- **Diseases & treatments:** edit disease info and add, edit or delete treatments, in both Bangla and English.
- The admin area uses a clean dashboard style with only light animation.

### 6.9 Other

- **404 page:** a wilted plant animation and a "Go home" button.
- **Offline notice:** a banner saying "You are offline". Full offline diagnosis comes in a later phase.

---

## 7. Working without the backend: API contract and mock data

The frontend calls these endpoints. During the frontend phase, **MSW** answers them with mock data. When the backend is ready, set `VITE_USE_MOCKS=false` in `.env` and nothing else changes.

| Method | Endpoint | Used by |
|---|---|---|
| POST | `/api/predict` (multipart `file`) | Diagnose → Result |
| GET | `/api/history`, `/api/history/:id`; DELETE `/api/history/:id` | History, Result |
| POST | `/api/predictions/:id/feedback` | Result |
| GET | `/api/diseases?crop=`, `/api/diseases/:id`, `/api/crops` | Library |
| POST | `/api/auth/register`, `/api/auth/login`; GET `/api/auth/me` | Auth |
| GET | `/api/admin/stats`, `/api/admin/predictions`, `/api/admin/feedback` | Admin |
| PUT/POST/DELETE | `/api/admin/diseases/:id`, `/api/admin/treatments/:id` | Admin |

**Example `/api/predict` response:** the mock returns this, and the real backend will return the same shape.

```jsonc
{
  "id": 1287,
  "status": "ok",                    // ok | low_confidence | not_a_leaf
  "confidence": 0.94,
  "confidence_band": "high",         // high | medium | low
  "image_url": "/api/images/3f2a….jpg",
  "created_at": "2026-11-20T10:15:00Z",
  "disease": {
    "id": 30,
    "crop": { "en": "Tomato", "bn": "টমেটো" },
    "name": { "en": "Early Blight", "bn": "আগাম ধসা রোগ" },
    "type": "fungus",
    "is_healthy": false,
    "symptoms": { "en": "…", "bn": "…" },
    "causes":   { "en": "…", "bn": "…" },
    "treatments": [
      { "type": "chemical",   "remedy": { "en": "…", "bn": "…" }, "dosage": { "en": "…", "bn": "…" }, "precautions": { "en": "…", "bn": "…" } },
      { "type": "organic",    "remedy": { "en": "…", "bn": "…" } },
      { "type": "preventive", "remedy": { "en": "…", "bn": "…" } }
    ]
  },
  "top_k": [
    { "disease_id": 30, "name": { "en": "Early Blight", "bn": "আগাম ধসা রোগ" }, "confidence": 0.94 },
    { "disease_id": 33, "name": { "en": "Septoria Leaf Spot", "bn": "…" }, "confidence": 0.03 },
    { "disease_id": 35, "name": { "en": "Target Spot", "bn": "…" }, "confidence": 0.01 }
  ]
}
```

The mock data must include **all 38 classes** with Bangla and English text, so the Library and results look real during the demo. This same data later becomes the backend's database seed.

---

## 8. Folder structure

```
frontend/
├── public/
│   ├── models/              # compressed .glb 3D assets
│   ├── lottie/              # seedling-loader.json, scan.json, success.json
│   └── images/              # crop icons, fallback hero image, og-image
├── src/
│   ├── main.tsx
│   ├── App.tsx              # routes + layout + page transitions
│   ├── styles/index.css     # Tailwind + theme tokens + fonts
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/{bn,en}/ # common.json, diseases.json, landing.json…
│   ├── three/               # 3D only (lazy-loaded)
│   │   ├── HeroScene.tsx    # Living Field
│   │   ├── GlobeScene.tsx   # Bangladesh → World
│   │   ├── Field.tsx, Leaf.tsx, Particles.tsx
│   │   └── useCanRender3D.ts  # device/network/reduced-motion check
│   ├── components/          # Button, Card, ConfidenceMeter, ImagePicker, ScanOverlay…
│   ├── pages/               # Landing, Diagnose, Result, History, Library, About, Auth, Admin, NotFound
│   ├── features/
│   │   ├── auth/            # AuthContext, ProtectedRoute
│   │   └── diagnose/        # image compression, upload hook
│   ├── api/                 # client.ts, types.ts, hooks
│   ├── mocks/               # MSW handlers + mock disease data (38 classes)
│   └── lib/                 # utils: formatting, Bangla digits, device checks
├── index.html
├── vite.config.ts
├── package.json
└── .env.example             # VITE_API_URL, VITE_USE_MOCKS
```

---

## 9. Quality targets

| Area | Target |
|---|---|
| Lighthouse (mobile) | Performance ≥ 85 on Diagnose/Result pages, ≥ 70 on the 3D landing page; Accessibility ≥ 90 |
| Load time | Landing text and buttons visible in < 2.5 s on a 4G phone; 3D loads after that |
| Bundle | Main JS < 200 KB gzipped; 3D code in a separate lazy-loaded chunk |
| Animation | Smooth 60 fps on mid-range phones; automatic Lite mode on weak devices |
| Accessibility | Keyboard navigation, visible focus, alt text, colour + text labels, reduced-motion support |
| Responsive | Tested at 360 px (small Android), 768 px (tablet), 1440 px (desktop) |
| Browsers | Chrome Android, Chrome/Edge/Firefox desktop, Safari iOS |

---

## 10. Step-by-step frontend build plan

Each step ends with something you can open in the browser and show.

### Step 1: Project setup and theme
- [ ] Create the Vite + React + TypeScript project and install Tailwind, React Router, Motion, i18next and lucide-react.
- [ ] Add theme colours, fonts (Bangla + English) and base styles.
- [ ] Add the layout: Navbar (logo, links, বাং/EN switch), Footer, page-transition wrapper, empty pages for every route.

**Done when:** you can click through all pages, switch Bangla ↔ English, and see the green theme everywhere.

### Step 2: Component library
- [ ] Build Button, Card, Badge, Alert, Skeleton, EmptyState, ConfidenceMeter (animated), TreatmentTabs and LanguageSwitch.
- [ ] Add a hidden `/dev/components` page that shows all of them, to check how they look.

**Done when:** every component looks right on phone and desktop, in both languages.

### Step 3: Mock API and data
- [ ] Set up MSW, `api/types.ts` (§7) and the API client.
- [ ] Write mock data for all **38 classes** in Bangla and English: name, symptoms, causes, treatments.
- [ ] Add a fake `/api/predict` that waits about 1.5 s and returns a random result, including low-confidence and healthy cases, so every screen can be tested.

**Done when:** the Library page lists real-looking diseases from the mock API.

### Step 4: Diagnose → Result flow (the core)
- [ ] ImagePicker (camera, gallery, drag-drop), photo tips, preview, compression in the browser.
- [ ] ScanOverlay and seedling loader while analyzing.
- [ ] Result view with all three statuses, TreatmentTabs, top-3, feedback, expert-help box, disclaimer, share and print.

**Done when:** on a real phone you can take a photo, watch the scan animation and read a full result in Bangla.

### Step 5: Landing page with 3D and animations
- [ ] Build the hero layout first with the static fallback image.
- [ ] Add the 3D "Living Field" scene: field, swaying crops, scanning leaf, particles, parallax.
- [ ] Add the How it works, Supported crops, Why use it and CTA sections with scroll animations.
- [ ] Add the 3D "Bangladesh to the World" globe and counters.
- [ ] Add `useCanRender3D` automatic fallback and the Lite-mode toggle.

**Done when:** the landing page looks impressive on a laptop, runs smoothly on a mid-range phone, and falls back to Lite mode on a weak phone or with Data Saver on.

### Step 6: Library, History, About, Auth, 404
- [ ] Library list + detail pages.
- [ ] Login and Register forms; mock auth with a saved token; protected routes.
- [ ] History page with filters, delete and empty state.
- [ ] About page and 404 page.

**Done when:** every page in §6 except Admin works with mock data.

### Step 7: Admin dashboard
- [ ] Overview stats + charts, scan logs table, feedback list.
- [ ] Disease and treatment editor (Bangla + English fields).

**Done when:** logged in as a mock admin, you can see the dashboard and edit a treatment, and the change shows up in the Library.

### Step 8: Polish and testing
- [ ] Check every page at 360 / 768 / 1440 px, in both languages.
- [ ] Lighthouse audit and fix to meet §9; reduced-motion and keyboard checks.
- [ ] Component tests for ImagePicker, ConfidenceMeter, Result statuses and language switching.
- [ ] Ask 2–3 people, ideally farmers or agriculture students, to try the Diagnose flow, then fix what confuses them.

**Done when:** all §9 targets are met. The frontend is complete and ready to connect to the real backend.

---

## 11. After the frontend (next phases, one at a time)

1. **Backend API:** FastAPI + database. It uses the same data shape as the mocks, and the mock disease data becomes the database seed.
2. **Model integration:** download the pre-trained MobileNetV2 and convert it to ONNX once. The backend runs it to answer `/api/predict`.
3. **Connect:** set `VITE_USE_MOCKS=false` and test the real flow end to end.
4. **Deployment:** host online with HTTPS, which the phone camera needs.
5. **Later extras:** offline diagnosis in the browser, more languages, rice/jute support.

---

## 12. Decisions to confirm before Step 1

1. **App name and logo:** keep "Crop Disease Detector", or a short brand name (Bangla + English)?
2. **Default language:** Bangla always, or detect from the browser?
3. **3D intensity:** full "Living Field" + globe as described, or only one of them to save time?
4. **Bangla treatment text:** who will check the Bangla translations of disease and treatment info? Ideally an agriculture student or officer.
