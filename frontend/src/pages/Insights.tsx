import { Sparkles } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

/**
 * AI Insights — placeholder. Backend will compute Executive Summary,
 * Business Risks, Growth Opportunities, and Recommendations from the
 * active dataset using rule-based Pandas logic (no LLM in scope).
 */
export default function Insights() {
  return (
    <div className="space-y-6" data-testid="insights-page">
      <EmptyState
        icon={<Sparkles size={22} />}
        title="AI Insights scaffolded"
        hint="Backend-generated Executive Summary, Business Risks, Growth Opportunities and Recommendations will render here from /api/insights."
      />
    </div>
  );
}
