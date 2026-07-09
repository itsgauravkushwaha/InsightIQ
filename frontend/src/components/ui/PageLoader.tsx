import { Loader2 } from "lucide-react";

export default function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex h-full min-h-[240px] items-center justify-center gap-2 iq-muted"
      data-testid="page-loader"
    >
      <Loader2 className="animate-spin" size={18} />
      <span className="text-sm">{label}</span>
    </div>
  );
}
