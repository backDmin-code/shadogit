"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function AdminSignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-dim hover:border-destructive/40 hover:text-destructive transition-colors"
      aria-label="Выйти"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Выйти</span>
    </button>
  );
}
