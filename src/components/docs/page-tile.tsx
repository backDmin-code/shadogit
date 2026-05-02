"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
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
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn("group", className)}
    >
      <Link
        href={href}
        className={cn(
          "tile-glow flex h-full flex-col gap-3 p-5 sm:p-6",
          variant === "gradient" &&
            "bg-[linear-gradient(135deg,rgba(124,92,255,0.18)_0%,rgba(34,211,238,0.10)_100%)]"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/80 text-xl">
            {emoji ?? "📄"}
          </div>
          <div className="flex items-center gap-2">
            {badge && (
              <span className="rounded-full border bg-surface/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {badge}
              </span>
            )}
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h3 className="font-semibold tracking-tight">{title}</h3>
          {description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
