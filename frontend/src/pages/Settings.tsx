import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/hooks/useTheme";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"] as const;

/**
 * Settings — theme toggle, currency, company name. Persists to localStorage.
 */
export default function Settings() {
  const { settings, update, reset } = useSettings();
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid gap-6 lg:grid-cols-2" data-testid="settings-page">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] iq-muted">Theme</p>
            <div className="mt-2 inline-flex rounded-lg border border-black/10 p-1 dark:border-white/10">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  data-testid={`theme-option-${t}`}
                  className={
                    "px-3 py-1.5 text-xs font-medium capitalize rounded-md transition-colors " +
                    (theme === t
                      ? "bg-brand-600 text-white"
                      : "iq-muted hover:text-ink dark:hover:text-white")
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-[0.18em] iq-muted">
              Company name
            </span>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => update({ companyName: e.target.value })}
              data-testid="settings-company-input"
              className="mt-2 w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 dark:border-white/10"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-[0.18em] iq-muted">
              Currency
            </span>
            <select
              value={settings.currency}
              onChange={(e) => update({ currency: e.target.value })}
              data-testid="settings-currency-select"
              className="mt-2 w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 dark:border-white/10"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c} className="text-ink">
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={reset} data-testid="settings-reset-btn">
              Reset to defaults
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
