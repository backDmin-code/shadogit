"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogIn, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CommandPaletteTrigger } from "@/components/search/command-palette";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  siteName: string;
  logoEmoji: string;
  onMenuClick?: () => void;
  withSidebarBlock?: boolean;
}

export function SiteHeader({
  siteName,
  logoEmoji,
  onMenuClick,
  withSidebarBlock = false,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { href: "/", label: "Главная" },
    { href: "/docs", label: "Документация" },
    { href: "/docs/changelog", label: "Что нового" },
  ];

  return (
    <header className="app-header">
      <div
        className={cn(
          "app-header-logo",
          !withSidebarBlock &&
            "!w-auto !border-r-0 !bg-transparent !pl-4 md:!pl-6"
        )}
      >
        {onMenuClick && (
          <button
            className="md:hidden mr-2 grid h-9 w-9 place-items-center rounded-md border border-border bg-surface-2 text-text-dim hover:border-primary/40 hover:text-primary transition-colors"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="logo-mark" aria-hidden>
            {logoEmoji.length === 1 ? logoEmoji : "S"}
          </span>
          <span className="logo-text">{siteName}</span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-between gap-3 px-4 md:px-6">
        <div className="hidden flex-1 max-w-[280px] md:block">
          <CommandPaletteTrigger />
        </div>

        <nav className="app-header-nav hidden items-center gap-0.5 lg:flex">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  active && "!text-primary !bg-primary/8"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          {session?.user ? (
            <Link
              href="/admin"
              className="btn-cta"
              aria-label="Перейти в админку"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Админка</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="btn-cta"
              aria-label="Войти"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Войти →</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
