import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export default function EmptyState({
  icon,
  title,
  hint,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "iq-card flex flex-col items-center justify-center gap-3 p-10 text-center",
        className
      )}
      data-testid="empty-state"
    >
      {icon ? <div className="text-brand-600 dark:text-brand-400">{icon}</div> : null}
      <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
      {hint ? <p className="max-w-md text-sm iq-muted">{hint}</p> : null}
      {action}
    </div>
  );
}
