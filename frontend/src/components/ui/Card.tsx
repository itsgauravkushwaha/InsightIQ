import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className, ...rest }: CardProps) {
  return (
    <div className={cn("iq-card shadow-soft", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...rest }: CardProps) {
  return (
    <div className={cn("border-b border-black/5 dark:border-white/10 px-5 py-4", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardBody({ children, className, ...rest }: CardProps) {
  return (
    <div className={cn("px-5 py-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("font-display text-sm font-semibold tracking-tight", className)} {...rest}>
      {children}
    </h3>
  );
}
