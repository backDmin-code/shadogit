"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Search, Settings, LogIn } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MobileBottomNavProps {
  onSearchClick?: () => void;
  onMenuClick?: () => void;
}

export function MobileBottomNav({ onSearchClick }: MobileBottomNavProps) {
  const pathname = usePathname() ?? "/";
  const { data: session } = useSession();

  const items: NavItem[] = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/docs", label: "Доки", icon: BookOpen },
    { href: "#search", label: "Поиск", icon: Search },
    session?.user
      ? { href: "/admin", label: "Админка", icon: Settings }
      : { href: "/login", label: "Войти", icon: LogIn },
  ];

  const activeIndex = items.findIndex((item) => {
    if (item.href === "#search") return false;
    if (item.href === "/") return pathname === "/";
    return pathname.startsWith(item.href);
  });

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 md:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
    >
      <div className="relative flex w-full max-w-md items-stretch gap-1 rounded-3xl border bg-surface/85 p-1.5 shadow-glow-lg backdrop-blur-xl backdrop-saturate-150">
        {activeIndex >= 0 && (
          <motion.div
            layoutId="bottom-nav-pill"
            className="absolute inset-y-1.5 rounded-2xl bg-[linear-gradient(135deg,rgba(124,92,255,0.25)_0%,rgba(34,211,238,0.25)_100%)] ring-1 ring-primary/30"
            style={{
              width: `calc((100% - 0.75rem) / ${items.length})`,
              left: `calc(0.375rem + ${activeIndex} * ((100% - 0.75rem) / ${items.length}))`,
            }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        )}
        {items.map((item) => {
          const isActive = items[activeIndex]?.href === item.href;
          const isAction = item.href === "#search";
          const content = (
            <>
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-none transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {item.label}
              </span>
            </>
          );
          const className =
            "group relative z-10 flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-colors";

          if (isAction) {
            return (
              <button
                key={item.href}
                type="button"
                aria-label={item.label}
                onClick={onSearchClick}
                className={className}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={className}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
