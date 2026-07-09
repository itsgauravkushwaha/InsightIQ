import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Sparkles,
  UploadCloud,
  ShieldCheck,
  LineChart,
  FileText,
} from "lucide-react";

/**
 * Landing page — marketing surface. Sections: Hero, Features, About, CTA, Footer.
 * No shell/sidebar. Uses standalone glass topbar.
 */
export default function Landing() {
  return (
    <div className="min-h-full bg-white text-ink dark:bg-[#0a0b0f] dark:text-white">
      {/* Top nav */}
      <header className="iq-glass sticky top-0 z-20 border-b border-black/5 dark:border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2" data-testid="landing-logo">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
              <BarChart3 size={16} strokeWidth={2.5} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">InsightIQ</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm iq-muted md:flex">
            <a href="#features" className="hover:text-ink dark:hover:text-white">Features</a>
            <a href="#about" className="hover:text-ink dark:hover:text-white">About</a>
            <a href="#cta" className="hover:text-ink dark:hover:text-white">Get started</a>
          </nav>
          <Link
            to="/dashboard"
            data-testid="landing-open-app-btn"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition-colors hover:bg-brand-700"
          >
            Open app <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.08),transparent_60%)]" />
        </div>

        <div className="mx-auto grid max-w-6xl gap-14 px-6 pb-24 pt-20 md:grid-cols-12 md:pt-28">
          <div className="md:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-300">
              <Sparkles size={12} /> No database. Just your files.
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Turn spreadsheets<br />
              into board-ready<br />
              <span className="text-brand-600 dark:text-brand-400">insight.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed iq-muted">
              InsightIQ is a lightweight analytics workspace. Drop a CSV or Excel file and instantly get dashboards, drill-down tables, and executive-grade narratives — all computed locally on your uploads.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard"
                data-testid="hero-primary-cta"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
              >
                Explore the demo <ArrowRight size={14} />
              </Link>
              <Link
                to="/upload"
                data-testid="hero-secondary-cta"
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
              >
                <UploadCloud size={14} /> Upload your file
              </Link>
            </div>
          </div>

          {/* Hero visual — CSS mock of dashboard */}
          <div className="md:col-span-5">
            <div className="iq-card relative overflow-hidden p-4 shadow-lift">
              <div className="mb-3 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
              </div>
              <div className="grid gap-3">
                <div className="grid grid-cols-3 gap-3">
                  {["Revenue", "Profit", "Orders"].map((k, i) => (
                    <div key={k} className="rounded-lg border border-black/5 p-3 dark:border-white/10">
                      <p className="text-[10px] uppercase tracking-[0.18em] iq-muted">{k}</p>
                      <p className="mt-1 font-display text-base font-semibold">${[482, 128, 32][i]}K</p>
                      <p className="text-[10px] text-emerald-500">+{[12, 8, 6][i]}.4%</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-black/5 p-3 dark:border-white/10">
                  <p className="text-[10px] uppercase tracking-[0.18em] iq-muted">Sales trend</p>
                  <svg viewBox="0 0 300 90" className="mt-2 w-full">
                    <defs>
                      <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,70 L30,55 L60,60 L90,42 L120,48 L150,30 L180,38 L210,22 L240,30 L270,14 L300,20 L300,90 L0,90 Z" fill="url(#lg)" />
                    <path d="M0,70 L30,55 L60,60 L90,42 L120,48 L150,30 L180,38 L210,22 L240,30 L270,14 L300,20" fill="none" stroke="#2563eb" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-black/5 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
            Built for speed
          </p>
          <h2 className="mt-2 max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything a stakeholder needs. Nothing they don&apos;t.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: <LineChart size={18} />,
                title: "Instant dashboards",
                body: "Revenue, profit, orders and customer trends visualised the moment you upload.",
              },
              {
                icon: <BarChart3 size={18} />,
                title: "Drill-down analytics",
                body: "TanStack-powered table with server-side sort, filter, search and pagination.",
              },
              {
                icon: <Sparkles size={18} />,
                title: "AI-style narratives",
                body: "Executive summary, risks, opportunities and recommendations — computed, not chatted.",
              },
              {
                icon: <ShieldCheck size={18} />,
                title: "No database. Ever.",
                body: "Your data lives in a single uploads/ folder. Nothing to configure, nothing to leak.",
              },
              {
                icon: <FileText size={18} />,
                title: "Printable reports",
                body: "One-page executive report designed for board decks and PDF export.",
              },
              {
                icon: <UploadCloud size={18} />,
                title: "Drag & drop upload",
                body: "CSV and Excel supported. Preview and validate before analysing.",
              },
            ].map((f) => (
              <div key={f.title} className="iq-card p-5 shadow-soft transition-transform duration-150 hover:-translate-y-0.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-display text-base font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-1.5 text-sm iq-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-black/5 dark:border-white/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
              About InsightIQ
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              A portfolio-grade analytics stack, kept intentionally lean.
            </h2>
          </div>
          <div className="md:col-span-7">
            <p className="text-base leading-relaxed iq-muted">
              InsightIQ was built to demonstrate what a modern BI experience looks like when
              you strip away the heavy infrastructure. It runs on React, TypeScript and Vite
              on the frontend, and FastAPI + Pandas on the backend. Uploads are the source of
              truth — no PostgreSQL, no MongoDB, no Docker required.
            </p>
            <ul className="mt-6 grid gap-3 text-sm">
              {[
                "Deploy to Vercel + Render, Hostinger VPS, or any Node/Python host.",
                "TypeScript everywhere on the frontend — strict types, predictable UI.",
                "Backend calculates analytics live from the active file on each request.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="border-t border-black/5 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="iq-card flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Ready to see your data speak?
              </h2>
              <p className="mt-1.5 text-sm iq-muted">
                Jump into the sample retail dataset, or upload your own in under 10 seconds.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                data-testid="cta-open-dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
              >
                Open dashboard <ArrowRight size={14} />
              </Link>
              <Link
                to="/upload"
                data-testid="cta-upload"
                className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
              >
                <UploadCloud size={14} /> Upload a file
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-8 text-sm iq-muted md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} InsightIQ. Portfolio project.</p>
          <p>Built with React, Vite, FastAPI &amp; Pandas.</p>
        </div>
      </footer>
    </div>
  );
}
