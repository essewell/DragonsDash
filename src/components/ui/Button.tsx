import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-burnt text-white hover:bg-burnt-light active:bg-burnt-dark border border-burnt",
  secondary:
    "bg-white text-warm-900 border border-warm-300 hover:bg-warm-50 active:bg-warm-100",
  ghost:
    "bg-transparent text-warm-700 hover:bg-warm-100 active:bg-warm-200 border border-transparent",
  danger:
    "bg-danger text-white hover:bg-red-700 active:bg-red-800 border border-danger",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-[32px] px-2 text-xs",
  md: "h-[36px] px-3 text-sm",
  lg: "h-[44px] px-4 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center font-sans font-medium",
          "rounded transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burnt focus-visible:ring-offset-1",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
