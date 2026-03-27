import { type ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
  none: "",
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
};

export function Card({ children, className, padding = "md" }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-white border border-warm-200 rounded shadow-card",
        paddingStyles[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="text-sm font-sans font-semibold text-warm-800">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-warm-500 mt-[2px]">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
