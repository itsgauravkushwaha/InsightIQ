import { Route, Routes } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import UploadPage from "@/pages/Upload";
import Analytics from "@/pages/Analytics";
import Insights from "@/pages/Insights";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import { ThemeProvider } from "@/hooks/useTheme";
import { SettingsProvider } from "@/hooks/useSettings";

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <Routes>
          {/* Public marketing page */}
          <Route path="/" element={<Landing />} />

          {/* Authenticated (no auth in scope) app shell with sidebar */}
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </SettingsProvider>
    </ThemeProvider>
  );
}
