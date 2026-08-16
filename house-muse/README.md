# House Muse

An interior design app built in collaboration with — wait, no, that's the
other one. **House Muse**: upload a photo of a room, pick a style and a
budget, get back a redesigned version of that same room plus real,
priced décor recommendations.

Three parts, three folders, three separate things you start up:

```
house-muse/
├── frontend/   React + TypeScript (Vite) — the actual app people use
├── backend/    Django REST Framework + PostgreSQL — auth, saved projects, proxies to ml/
└── ml/         Flask — room analysis, colour palette extraction, recommendations, image generation
```

---

## How the pieces talk to each other

```
Browser  →  frontend (:3000)  →  backend (:8000)  →  ml (:5000)
```

The browser never talks to `ml/` directly — every request goes through
Django first. `ml/` has no database access and no auth; it's a pure
compute service that Django calls server-to-server.

---

## Running it locally

You need three terminals open at once — one per service, in this order.

### 1. Backend (Django)

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows — use `source venv/bin/activate` on Mac/Linux
pip install -r requirements.txt
copy .env.example .env         # then fill in real values — see below
python manage.py migrate
python manage.py runserver
```

Runs at `http://localhost:8000`.

**`.env` must exist and be filled in** — copy `.env.example`, then set:
- `DB_NAME` / `DB_USER` / `DB_PASSWORD` — your local Postgres credentials
- `CORS_ALLOWED_ORIGINS` and `FRONTEND_URL` — must match whatever port the
  frontend actually runs on (currently **3000**, not Vite's 5173 default —
  `vite.config.ts` overrides it)
- `GOOGLE_OAUTH_CLIENT_ID` — from Google Cloud Console, only needed if
  you're testing Google Sign-In
- `ML_SERVICE_URL` — where `ml/` is running (`http://localhost:5000` by default)

### 2. ML service (Flask)

```bash
cd ml
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Runs at `http://localhost:5000`. Reads product/pricing data from
`ml/data/catalog_seed.csv` at startup via `modules/catalog_loader.py`.

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:3000` (set explicitly in `vite.config.ts`).

---

## First-time setup checklist

Things that trip people up on a fresh clone:

- [ ] Postgres is running and the database in `DB_NAME` actually exists
      (create it manually first — Django doesn't do this for you)
- [ ] `python manage.py migrate` has been run for **every** app, not just
      one — run it with no app name so it covers `accounts`, `studio`,
      etc. all at once
- [ ] Backend `.env` and frontend port actually agree with each other —
      if you ever change Vite's port, update `CORS_ALLOWED_ORIGINS` and
      `FRONTEND_URL` in the backend `.env` to match, or every
      authenticated request will fail with a CORS error
- [ ] `ml/data/catalog_seed.csv` exists — the ml service won't start
      cleanly without it

---

## Known gaps (as of today)

Things that are stubbed, mocked, or mid-build — worth knowing before you
go looking for a bug that isn't one:

- **Room regeneration (SDXL/LoRA)** is still training. Until it's ready,
  the "after" image shown in the results screen falls back to a generic
  style-preview photo instead of a real generated image.
- **Colour palette** shown in the Studio flow (`ColourPalette.tsx`) is a
  static per-style lookup table, not built from the uploaded photo — even
  though `ml/modules/color_palette.py` already has real K-Means-based
  palette extraction logic that isn't wired to the frontend yet.
- **Mood Board** always shows the same hardcoded furniture picks
  regardless of which style/project you actually generated — it isn't
  connected to a specific saved project yet.
- **Budget breakdown percentages** (`allocate_budget()` in
  `recommendation_engine.py`) are still fixed weights per style, not
  computed from the sum of real recommended item prices — the individual
  recommended *items* are real and catalog-priced, but the category
  totals shown are still an estimate.

---

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind, Framer Motion
- **Backend:** Django 5, Django REST Framework, Django Knox (token auth),
  PostgreSQL
- **ML service:** Flask, scikit-learn (K-Means for colour extraction),
  YOLOv8 (object detection), SDXL via Replicate (image generation,
  in progress)
