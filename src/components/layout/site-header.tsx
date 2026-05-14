"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogIn, Settings, Search, Sun, Moon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
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
}: SiteHeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const navItems = [
    { href: "/", label: "Главная" },
    { href: "/docs", label: "Документация" },
    { href: "/docs/changelog", label: "Что нового" },
  ];

  return (
    <header className="sq-header">
      <div className="sq-header-inner">
        <button
          type="button"
          className="sq-header-burger"
          onClick={() => {
            setMobileOpen((v) => !v);
            onMenuClick?.();
          }}
          aria-label="Меню"
          aria-expanded={mobileOpen}
        >
          <Menu className="h-4 w-4" strokeWidth={3} />
        </button>

        <Link href="/" className="sq-brand" aria-label={siteName}>
          <span className="sq-brand-mark" aria-hidden>
            {logoEmoji.length === 1 && logoEmoji !== "S" ? logoEmoji : "с"}
          </span>
          <span className="sq-brand-text">{siteName}</span>
        </Link>

        <nav className="sq-header-nav" aria-label="Главное меню">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("sq-nav-link", active && "is-active")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sq-header-actions">
          <button
            type="button"
            className="sq-header-search"
            aria-label="Поиск"
            onClick={() => {
              const e = new KeyboardEvent("keydown", {
                key: "k",
                ctrlKey: true,
                bubbles: true,
              });
              document.dispatchEvent(e);
            }}
          >
            <Search className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span className="sq-header-search-text">Поиск</span>
            <kbd className="sq-header-search-kbd">⌘K</kbd>
          </button>

          <button
            type="button"
            className="sq-header-theme"
            aria-label="Сменить тему"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <Moon className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>

          {session?.user ? (
            <Link
              href="/admin"
              className="sq-header-cta"
              aria-label="Админка"
            >
              <Settings className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>Админка</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="sq-header-cta"
              aria-label="Войти"
            >
              <LogIn className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>Войти</span>
            </Link>
          )}
        </div>

        {/* hidden trigger so ⌘K shortcut keeps working */}
        <div className="sr-only" aria-hidden>
          <CommandPaletteTrigger />
        </div>
      </div>

      {mobileOpen && (
        <div className="sq-header-mobile">
          <nav className="sq-header-mobile-nav">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn("sq-mobile-link", active && "is-active")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
