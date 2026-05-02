"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const current = mounted
    ? theme === "system"
      ? resolvedTheme
      : theme
    : "dark";
  const isDark = current === "dark";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Сменить тему"
      className="theme-toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setTheme(isDark ? "light" : "dark");
        }
      }}
    >
      <div
        className={cn("theme-toggle-option", isDark && "active")}
        title="Тёмная"
      >
        <Moon className="h-3.5 w-3.5" />
      </div>
      <div
        className={cn("theme-toggle-option", !isDark && "active")}
        title="Светлая"
      >
        <Sun className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}
