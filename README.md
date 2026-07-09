# InsightIQ

A production-ready, database-free analytics workspace for CSV / Excel files.
Think Microsoft Fabric or Power BI, but lightweight enough to deploy on a
Hostinger VPS, Vercel + Render, or any Node/Python host in minutes.

> ⚡ **No PostgreSQL. No MongoDB. No Docker.**
> All analytics run against files inside `backend/uploads/`.

---

## Tech stack

| Layer     | Stack |
|-----------|-------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts, TanStack Table, Lucide Icons |
| Backend   | FastAPI, Pandas |
| Storage   | Uploaded CSV/Excel files (`backend/uploads/`) |

---

## Project structure

```
insightiq/
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI: layout, ui/, charts, kpi
│   │   ├── pages/               # Landing, Dashboard, Upload, Analytics, Insights, Reports, Settings
│   │   ├── hooks/               # useTheme, useSettings
│   │   ├── services/            # api.ts – single fetch client
│   │   ├── types/               # Shared TypeScript types
│   │   └── utils/               # format.ts, cn.ts
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/
│   ├── routers/                 # health, dataset, upload, dashboard, analytics, insights
│   ├── services/                # data_loader (active-file resolver), analytics_service…
│   ├── models/                  # Pydantic schemas
│   ├── uploads/                 # Active dataset lives here (sample seeded)
│   ├── scripts/generate_sample.py
│   ├── main.py                  # FastAPI app factory
│   ├── server.py                # Thin shim so `uvicorn server:app` keeps working
│   └── requirements.txt
│
└── README.md
```

---

## Getting started (local)

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate           # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python scripts/generate_sample.py   # optional: regenerate the sample dataset
uvicorn main:app --reload --port 8001
```

API becomes available at `http://localhost:8001/api/health`.

### 2. Frontend

```bash
cd frontend
yarn install    # or: npm install
yarn dev        # or: npm run dev
```

Open http://localhost:3000 — the app is ready.

The frontend reads `REACT_APP_BACKEND_URL` (or `VITE_BACKEND_URL`) from
`frontend/.env` to reach the API. Point it to whatever URL your backend
runs on.

---

## Environment variables

### `frontend/.env`
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

### `backend/.env`
No secrets are required by default. CORS is wide open in dev — tighten it
before deploying by setting `CORS_ORIGINS` and updating `main.py`.

---

## Deployment

### Option A — Vercel (frontend) + Render (backend)

**Frontend (Vercel)**
1. Import the `frontend/` folder as a Vercel project.
2. Build command: `yarn build` &nbsp;·&nbsp; Output directory: `dist`
3. Set env var `REACT_APP_BACKEND_URL` to your Render API URL.

**Backend (Render)**
1. New Web Service → connect the repo → root directory `backend/`.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Attach a persistent disk mounted at `backend/uploads/` if you want uploads to survive redeploys.

### Option B — Hostinger VPS (single box)

```bash
# On the VPS
git clone <repo>
cd insightiq

# Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
nohup uvicorn main:app --host 0.0.0.0 --port 8001 &

# Frontend (static build served by Nginx)
cd ../frontend
yarn install && yarn build
sudo cp -r dist/* /var/www/insightiq/
```

Configure Nginx to serve `/var/www/insightiq/` and reverse-proxy
`/api/*` to `http://127.0.0.1:8001`.

### Option C — Hostinger Node Hosting

Deploy `frontend/` as a static site and run `backend/` on any Python
process manager (PM2, systemd). Same reverse-proxy pattern as Option B.

---

## Features (scaffold → next iterations)

| Area           | Scaffold status                       | Next up                                     |
|----------------|----------------------------------------|---------------------------------------------|
| Sidebar + shell | ✅ Done                                | —                                            |
| Landing page   | ✅ Hero, Features, About, CTA, Footer | —                                            |
| Dashboard      | ⏳ Placeholder                         | KPI cards, trend/category/region charts, top products |
| Upload         | ⏳ Placeholder                         | Drag-drop UI + validation preview           |
| Analytics      | ⏳ Placeholder                         | TanStack Table with sort/filter/search       |
| AI Insights    | ⏳ Placeholder                         | Rule-based narratives from Pandas aggregations |
| Reports        | ⏳ Placeholder                         | Printable one-pager                         |
| Settings       | ✅ Theme, currency, company name       | —                                            |

---

## License

Portfolio project. Use it, learn from it, ship your own take.
