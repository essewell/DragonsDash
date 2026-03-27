"use client";

import { usePathname } from "next/navigation";
import { DragonLogo } from "./DragonLogo";
import { Lock } from "lucide-react";
import clsx from "clsx";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/accounts": "Accounts",
  "/spending": "Spending",
  "/markets": "Markets",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "DragonsDash";

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 h-[56px] bg-white border-b border-warm-200",
        "flex items-center justify-between px-4",
        "lg:ml-[240px]",
      )}
    >
      {/* Mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <DragonLogo size={24} />
        <span className="font-display text-sm font-bold text-navy-900">
          DragonsDash
        </span>
      </div>

      {/* Page title (desktop) */}
      <h1 className="hidden lg:block text-lg font-display font-bold text-navy-900">
        {title}
      </h1>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          className={clsx(
            "flex items-center gap-1 h-[32px] px-2 rounded",
            "text-xs text-warm-600 hover:bg-warm-100",
            "transition-colors",
          )}
          aria-label="Lock dashboard"
        >
          <Lock size={14} strokeWidth={1.5} />
          <span className="hidden sm:inline">Lock</span>
        </button>
      </div>
    </header>
  );
}
