import { memo } from "react";
import { AlertTriangle, ClipboardList, FileText, Sparkles, type LucideIcon } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ExecutiveInsights } from "@/types";
import { cn } from "@/utils/cn";

type Tone = "brand" | "amber" | "emerald" | "violet";

interface Panel {
  key: keyof ExecutiveInsights;
  title: string;
  tone: Tone;
  icon: LucideIcon;
  emptyLabel: string;
  testId: string;
}

const PANELS: Panel[] = [
  {
    key: "executive_summary",
    title: "Executive Summary",
    tone: "brand",
    icon: FileText,
    emptyLabel: "Not enough data to summarise.",
    testId: "insight-summary",
  },
  {
    key: "risks",
    title: "Business Risks",
    tone: "amber",
    icon: AlertTriangle,
    emptyLabel: "No material risks detected.",
    testId: "insight-risks",
  },
  {
    key: "opportunities",
    title: "Growth Opportunities",
    tone: "emerald",
    icon: Sparkles,
    emptyLabel: "No standout opportunities right now.",
    testId: "insight-opportunities",
  },
  {
    key: "recommendations",
    title: "Recommendations",
    tone: "violet",
    icon: ClipboardList,
    emptyLabel: "No recommendations available.",
    testId: "insight-recommendations",
  },
];

// Soft-accent palettes per card. Kept declarative so themes stay consistent
// and Tailwind's JIT can see the full class strings.
const TONE_STYLES: Record<Tone, { icon: string; bullet: string; ring: string }> = {
  brand: {
    icon: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
    bullet: "bg-brand-500",
    ring: "ring-1 ring-inset ring-brand-500/10 dark:ring-brand-400/15",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    bullet: "bg-amber-500",
    ring: "ring-1 ring-inset ring-amber-500/15 dark:ring-amber-400/20",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    bullet: "bg-emerald-500",
    ring: "ring-1 ring-inset ring-emerald-500/15 dark:ring-emerald-400/20",
  },
  violet: {
    icon: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    bullet: "bg-violet-500",
    ring: "ring-1 ring-inset ring-violet-500/15 dark:ring-violet-400/20",
  },
};

export interface InsightsSectionProps {
  insights: ExecutiveInsights;
}

function InsightsSectionInner({ insights }: InsightsSectionProps) {
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6"
      data-testid="insights-section"
    >
      {PANELS.map((panel) => {
        const items = insights[panel.key] ?? [];
        const styles = TONE_STYLES[panel.tone];
        const Icon = panel.icon;
        return (
          <Card
            key={panel.key}
            className={cn("h-full", styles.ring)}
            data-testid={panel.testId}
          >
            <CardHeader className="flex items-center gap-3">
              <span className={cn("grid h-9 w-9 place-items-center rounded-lg", styles.icon)}>
                <Icon size={16} strokeWidth={2.2} />
              </span>
              <div>
                <CardTitle>{panel.title}</CardTitle>
                <p className="mt-0.5 text-xs iq-muted">
                  Auto-generated from the active dataset.
                </p>
              </div>
            </CardHeader>
            <CardBody>
              {items.length === 0 ? (
                <p className="text-sm iq-muted" data-testid={`${panel.testId}-empty`}>
                  {panel.emptyLabel}
                </p>
              ) : (
                <ul className="space-y-3">
                  {items.map((line, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm leading-relaxed"
                      data-testid={`${panel.testId}-item-${i}`}
                    >
                      <span
                        className={cn(
                          "mt-2 h-1.5 w-1.5 shrink-0 rounded-full",
                          styles.bullet
                        )}
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

// Memoised so re-rendering the parent (filter refresh, chart hover, etc.)
// doesn't re-render the entire insights grid unless the insights change.
export default memo(InsightsSectionInner);
