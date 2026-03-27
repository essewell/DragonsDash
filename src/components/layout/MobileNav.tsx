"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Landmark,
  Receipt,
  TrendingUp,
  Settings,
} from "lucide-react";
import clsx from "clsx";

const tabs = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Landmark },
  { href: "/spending", label: "Spending", icon: Receipt },
  { href: "/markets", label: "Markets", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className={clsx(
        "lg:hidden fixed bottom-0 left-0 right-0 z-50",
        "bg-navy-900 border-t border-navy-700",
        "flex items-center justify-around h-[56px]",
        "safe-area-bottom",
      )}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex flex-col items-center justify-center gap-[2px] flex-1 h-full",
              "text-2xs transition-colors",
              isActive ? "text-burnt" : "text-navy-400",
            )}
          >
            <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
