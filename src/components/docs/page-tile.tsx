"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageTileProps {
  href: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  emoji?: string | null;
  className?: string;
  variant?: "default" | "gradient";
  badge?: string;
}

export function PageTile({
  href,
  title,
  description,
  emoji,
  className,
  variant = "default",
  badge,
}: PageTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        "tile group flex h-full flex-col gap-3",
        variant === "gradient" &&
          "bg-[linear-gradient(135deg,rgba(200,241,53,0.14)_0%,rgba(247,106,170,0.08)_100%)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="tile-icon">{emoji ?? "📄"}</div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="font-mono text-2xs uppercase tracking-wider text-text-dimmer border border-border bg-surface-2 px-2 py-0.5 rounded">
              {badge}
            </span>
          )}
          <ArrowUpRight className="h-4 w-4 text-text-dimmer transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="tile-title">{title}</h3>
        {description && (
          <p className="line-clamp-2 text-[13px] text-text-dim leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}
