import { UploadCloud } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

/**
 * Upload — placeholder. Drag-and-drop, preview, and validation will
 * be wired to POST /api/upload in the next iteration.
 */
export default function UploadPage() {
  return (
    <div className="space-y-6" data-testid="upload-page">
      <EmptyState
        icon={<UploadCloud size={22} />}
        title="Upload scaffolded"
        hint="Drag-and-drop, CSV/Excel preview and validation UI will be implemented next and posted to /api/upload."
      />
    </div>
  );
}
