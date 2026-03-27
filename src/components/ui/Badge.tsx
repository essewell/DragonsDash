import { type ReactNode } from "react";
import clsx from "clsx";

type BadgeVariant = "default" | "positive" | "negative" | "warning" | "info";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-warm-100 text-warm-700 border-warm-200",
  positive: "bg-green-50 text-forest border-green-200",
  negative: "bg-red-50 text-danger border-red-200",
  warning: "bg-amber-50 text-amber-dark border-amber-200",
  info: "bg-navy-50 text-navy-700 border-navy-200",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center h-[20px] px-[6px] text-2xs font-medium",
        "rounded border uppercase tracking-wider",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
