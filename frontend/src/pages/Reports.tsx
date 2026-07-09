import { FileText, Printer } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

/**
 * Reports — placeholder. A printable one-page executive report will
 * be composed here in the next iteration.
 */
export default function Reports() {
  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="no-print flex items-center justify-end">
        <Button
          variant="outline"
          onClick={() => window.print()}
          data-testid="reports-print-btn"
        >
          <Printer size={14} /> Print report
        </Button>
      </div>
      <EmptyState
        icon={<FileText size={22} />}
        title="Report scaffolded"
        hint="A printable, board-ready one-page executive report will be composed here in the next iteration."
      />
    </div>
  );
}
