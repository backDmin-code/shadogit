"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  dashboard: LayoutDashboard,
  pages: FileText,
  spaces: FolderTree,
  settings: Settings,
} as const;

export type AdminNavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  exact?: boolean;
};

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname() ?? "";

  return (
    <nav>
      <div className="nav-label">Управление</div>
      <ul>
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn("nav-item", active && "active")}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
