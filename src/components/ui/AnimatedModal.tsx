"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

/**
 * Modal with smooth entrance/exit animations.
 * Desktop: fade + scale from center.
 * Mobile: slide up from bottom.
 */
export function AnimatedModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: AnimatedModalProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [animState, setAnimState] = useState<"enter" | "idle" | "exit">(
    "idle",
  );
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Next frame: trigger enter animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimState("enter");
        });
      });
    } else if (shouldRender) {
      setAnimState("exit");
      const timeout = setTimeout(() => {
        setShouldRender(false);
        setAnimState("idle");
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={clsx(
          "absolute inset-0 bg-navy-900/60 transition-opacity duration-200",
          animState === "enter" || animState === "idle"
            ? "opacity-100"
            : "opacity-0",
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={contentRef}
        className={clsx(
          "relative w-full mx-4 bg-white rounded shadow-elevated overflow-hidden",
          "transition-all duration-200 ease-out",
          sizeClasses[size],
          // Desktop: scale + fade
          "lg:transform lg:origin-center",
          animState === "enter" || animState === "idle"
            ? "lg:opacity-100 lg:scale-100 opacity-100 translate-y-0"
            : "lg:opacity-0 lg:scale-95 opacity-0 translate-y-4",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-[48px] px-4 border-b border-warm-200 bg-warm-50 sticky top-0 z-10">
          <h2 className="text-sm font-sans font-semibold text-warm-800">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-warm-400 hover:text-warm-700 transition-colors p-1 rounded hover:bg-warm-100"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 h-[56px] px-4 border-t border-warm-200 bg-warm-50 sticky bottom-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
