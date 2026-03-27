"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Landmark,
  Receipt,
  TrendingUp,
  Settings,
  Plus,
} from "lucide-react";
import clsx from "clsx";
import { DragonLogo } from "./DragonLogo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Landmark },
  { href: "/spending", label: "Spending", icon: Receipt },
  { href: "/markets", label: "Markets", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  onAddTransaction?: () => void;
}

export function Sidebar({ onAddTransaction }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        "hidden lg:flex flex-col w-[240px] h-screen fixed left-0 top-0",
        "bg-navy-900 text-white",
        "border-r border-navy-700",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 h-[56px] px-3 border-b border-navy-700">
        <DragonLogo size={28} />
        <span className="font-display text-base font-bold tracking-tight">
          DragonsDash
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-1">
        <ul className="flex flex-col gap-[2px]">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={clsx(
                    "flex items-center gap-2 h-[36px] px-2 rounded text-sm",
                    "transition-colors duration-150",
                    isActive
                      ? "bg-navy-700 text-white"
                      : "text-navy-300 hover:bg-navy-800 hover:text-white",
                  )}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Add Transaction Button */}
      <div className="p-3 border-t border-navy-700">
        <button
          onClick={onAddTransaction}
          className={clsx(
            "flex items-center justify-center gap-2 w-full h-[40px]",
            "bg-burnt text-white text-sm font-medium rounded",
            "hover:bg-burnt-light active:bg-burnt-dark",
            "transition-colors duration-150",
          )}
        >
          <Plus size={16} strokeWidth={2} />
          <span>Add Transaction</span>
        </button>
      </div>
    </aside>
  );
}
