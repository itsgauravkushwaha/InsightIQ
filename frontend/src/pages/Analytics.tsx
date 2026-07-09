import { TableProperties } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

/**
 * Analytics — placeholder. TanStack Table with sort/filter/search/pagination
 * will be wired to /api/analytics next.
 */
export default function Analytics() {
  return (
    <div className="space-y-6" data-testid="analytics-page">
      <EmptyState
        icon={<TableProperties size={22} />}
        title="Analytics scaffolded"
        hint="Sortable, filterable, searchable and paginated data table (TanStack) will be wired to /api/analytics next."
      />
    </div>
  );
}
