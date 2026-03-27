"use client";

import { useState, useEffect } from "react";
import { type ReactNode } from "react";
import { Plus } from "lucide-react";
import clsx from "clsx";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Header } from "./Header";
import { PageTransition } from "./PageTransition";
import { AddTransactionModal } from "@/components/modals/AddTransactionModal";
import { useAppStore } from "@/store";
import { DEFAULT_CATEGORIES } from "@/lib/defaultCategories";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { categories, addCategory } = useAppStore();

  // Seed default categories on first load
  useEffect(() => {
    if (categories.length === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        addCategory({
          ...cat,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }, [categories.length, addCategory]);

  return (
    <div className="min-h-screen bg-warm-100">
      <Sidebar onAddTransaction={() => setIsAddOpen(true)} />
      <MobileNav />
      <Header />
      <main className="lg:ml-[240px] pt-[56px] pb-[72px] lg:pb-4">
        <div className="px-4 py-4 lg:px-5 lg:py-4">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      {/* Mobile FAB */}
      <button
        onClick={() => setIsAddOpen(true)}
        className={clsx(
          "lg:hidden fixed bottom-[68px] right-4 z-40",
          "w-[52px] h-[52px] rounded-full",
          "bg-burnt text-white shadow-elevated",
          "flex items-center justify-center",
          "hover:bg-burnt-light active:scale-95",
          "transition-all duration-200 ease-out",
          "hover:shadow-[0_6px_20px_rgba(204,85,0,0.3)]",
        )}
        aria-label="Add transaction"
      >
        <Plus size={24} strokeWidth={2} />
      </button>

      <AddTransactionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
    </div>
  );
}
