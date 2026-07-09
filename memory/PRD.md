# InsightIQ — PRD

## Original problem statement
Production-ready web app "InsightIQ" resembling Microsoft Fabric/Power BI/Tableau.
Frontend: React + TypeScript + Vite + Tailwind + React Router + Recharts + TanStack Table + Lucide.
Backend: FastAPI + Pandas. Storage: uploaded CSV/Excel only (no DB, no Docker).
Deployment targets: Hostinger VPS / Hostinger Node / Vercel / Render.
Pages: Landing, Dashboard, Upload, Analytics, AI Insights, Reports, Settings.
User instruction: "First generate the complete project structure only. Wait for next instruction."

## User personas
- **Portfolio reviewer / hiring manager** — wants to see a clean, modern SaaS-quality UI and code structure.
- **Solo analyst** — drops a CSV/Excel and expects instant dashboards + narratives, zero setup.

## Core requirements (static)
- No auth, no payments, no user management.
- No PostgreSQL/MongoDB/Docker. Files only.
- Light theme default, dark toggle, persisted in localStorage.
- Every interactive/informational element must have a data-testid.
- Blue primary accent, WCAG contrast in both themes.

## User choices captured
- Vite + React + TypeScript frontend.
- Design inspired by Microsoft Fabric / Power BI / Linear.
- Sample retail dataset seeded (3,000 rows, 18 cols).
- Backend main.py + server.py shim (keeps supervisor working).

## What's implemented (2026-01-09)
- Frontend scaffolded with Vite + TS + Tailwind and mounted on port 3000 via `yarn start`.
- Sidebar + Topbar + AppShell layout with responsive mobile drawer.
- Theme (light/dark) + Settings (currency, companyName) persisted to localStorage.
- Full landing page (Hero, Features, About, CTA, Footer) with polished CSS-only hero mock.
- Placeholder pages for Dashboard, Upload, Analytics, Insights, Reports.
- Settings page fully functional.
- Backend: FastAPI app factory in main.py, `server.py` shim, routers for health/dataset/upload/dashboard/analytics/insights.
- Data loader service resolves active dataset (latest user upload → sample fallback).
- Sample dataset generator at backend/scripts/generate_sample.py; 3,000-row CSV seeded.
- /api/health, /api/dataset, /api/upload, /api/analytics all responding.

## Prioritized backlog
### P0 (next iteration)
- Wire Dashboard KPI cards, sales trend, category donut, region bar, top-products list to /api/dashboard (compute with Pandas).
- Full Upload UX: drag-drop, preview table, validation report.
- Analytics: TanStack Table with server-side sort/filter/search/pagination consuming /api/analytics.
- AI Insights: replace stub narratives with rule-based Pandas insights.
- Reports: composable printable executive one-pager.

### P1
- CSV column-type detection & smart chart selection.
- Reset-to-sample button in Upload/Settings.
- Export dashboard as PDF.

### P2
- Multi-sheet Excel selection.
- Saved dashboard bookmarks (localStorage).

## Deployment notes
- Backend runs on port 8001 (`uvicorn server:app`). `server.py` re-exports `main.app`.
- Frontend served by Vite on port 3000 via `yarn start` (supervisor-compatible).
- Env vars: `REACT_APP_BACKEND_URL` (frontend), no secrets required backend.
