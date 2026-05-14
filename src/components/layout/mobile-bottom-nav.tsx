"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Search, Settings, LogIn } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface NavItem {
  href: string;
  label: string;
  icon: IconType;
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

  const isActive = (item: NavItem) => {
    if (item.href === "#search") return false;
    if (item.href === "/") return pathname === "/";
    return pathname.startsWith(item.href);
  };

  const handleSearch = () => {
    if (onSearchClick) {
      onSearchClick();
      return;
    }
    const e = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(e);
  };

  return (
    <nav aria-label="Нижнее меню" className="sq-mobnav">
      {items.map((item) => {
        const active = isActive(item);
        const isAction = item.href === "#search";
        const content = (
          <>
            <item.icon className="h-5 w-5" strokeWidth={2.5 as unknown as number} />
            <span>{item.label}</span>
          </>
        );

        if (isAction) {
          return (
            <button
              key={item.href}
              type="button"
              aria-label={item.label}
              onClick={handleSearch}
              className={cn("sq-mobnav-btn", active && "is-active")}
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
            className={cn("sq-mobnav-btn", active && "is-active")}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
