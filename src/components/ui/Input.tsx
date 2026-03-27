import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  monospace?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, monospace, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-[4px]">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-warm-600 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "h-[36px] px-2 text-sm rounded border bg-white",
            "placeholder:text-warm-400",
            "focus:outline-none focus:ring-2 focus:ring-burnt focus:ring-offset-0 focus:border-burnt",
            "disabled:bg-warm-50 disabled:text-warm-400 disabled:cursor-not-allowed",
            error
              ? "border-danger focus:ring-danger focus:border-danger"
              : "border-warm-300",
            monospace && "font-mono tabular-nums",
            className,
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-danger">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-warm-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
