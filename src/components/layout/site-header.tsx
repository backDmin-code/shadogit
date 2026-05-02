"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, BookOpen, LogIn, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CommandPaletteTrigger } from "@/components/search/command-palette";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  siteName: string;
  logoEmoji: string;
  onMenuClick?: () => void;
}

export function SiteHeader({
  siteName,
  logoEmoji,
  onMenuClick,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { href: "/", label: "Главная" },
    { href: "/docs", label: "Документация" },
    { href: "/docs/changelog", label: "Что нового" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "border-b bg-background/70 backdrop-blur-xl backdrop-saturate-150"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="container flex h-16 max-w-7xl items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link href="/" className="flex items-center gap-2.5 group">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl bg-[linear-gradient(135deg,#7c5cff_0%,#22d3ee_100%)] text-lg shadow-glow transition-transform group-hover:scale-105"
            aria-hidden
          >
            {logoEmoji}
          </span>
          <span className="hidden font-semibold tracking-tight sm:inline-block">
            {siteName}
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <CommandPaletteTrigger />
          <ThemeToggle />
          {session?.user ? (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/admin">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Админка</span>
              </Link>
            </Button>
          ) : (
            <Button asChild variant="gradient" size="sm" className="gap-1.5">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Войти</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function HeaderBookOpenIcon() {
  return <BookOpen className="h-4 w-4" />;
}
