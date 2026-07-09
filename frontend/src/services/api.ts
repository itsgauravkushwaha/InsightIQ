// Thin API client that centralises fetch calls to the FastAPI backend.
// Uses REACT_APP_BACKEND_URL (preserved via Vite envPrefix) so the same
// value can be reused for deployment on Vercel/Render/Hostinger.

import type {
  AnalyticsResponse,
  DashboardResponse,
  DatasetMeta,
  InsightsResponse,
  UploadResponse,
} from "@/types";

const BASE_URL =
  (import.meta.env.REACT_APP_BACKEND_URL as string | undefined) ??
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ??
  "";

function url(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_URL}${clean}`;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => fetch(url("/api/health")).then((r) => handle<{ status: string }>(r)),

  getDataset: () =>
    fetch(url("/api/dataset")).then((r) => handle<DatasetMeta>(r)),

  getDashboard: () =>
    fetch(url("/api/dashboard")).then((r) => handle<DashboardResponse>(r)),

  getAnalytics: (params: {
    page?: number;
    page_size?: number;
    search?: string;
    sort_by?: string;
    sort_dir?: "asc" | "desc";
  } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    return fetch(url(`/api/analytics?${qs.toString()}`)).then((r) =>
      handle<AnalyticsResponse>(r)
    );
  },

  getInsights: () =>
    fetch(url("/api/insights")).then((r) => handle<InsightsResponse>(r)),

  uploadFile: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return fetch(url("/api/upload"), { method: "POST", body: form }).then((r) =>
      handle<UploadResponse>(r)
    );
  },

  resetToSample: () =>
    fetch(url("/api/dataset/reset"), { method: "POST" }).then((r) =>
      handle<DatasetMeta>(r)
    ),
};
