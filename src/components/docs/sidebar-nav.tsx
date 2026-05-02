"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarSpace {
  id: string;
  slug: string;
  title: string;
  icon?: string | null;
  pages: SidebarPage[];
}

export interface SidebarPage {
  id: string;
  slug: string;
  title: string;
  emoji?: string | null;
  children: SidebarPage[];
}

function PageLink({
  page,
  spaceSlug,
  depth,
  pathname,
}: {
  page: SidebarPage;
  spaceSlug: string;
  depth: number;
  pathname: string;
}) {
  const href = `/docs/${spaceSlug}/${page.slug}`;
  const isActive = pathname === href;
  const hasChildren = page.children.length > 0;
  const [open, setOpen] = React.useState(true);

  return (
    <li>
      <div className="group flex items-stretch gap-0.5">
        <Link
          href={href}
          className={cn(
            "flex flex-1 items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
            isActive
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          )}
          style={{ paddingLeft: `${0.625 + depth * 0.875}rem` }}
        >
          {page.emoji ? (
            <span className="text-base leading-none">{page.emoji}</span>
          ) : (
            <Hash className="h-3.5 w-3.5 shrink-0 opacity-60" />
          )}
          <span className="line-clamp-1">{page.title}</span>
          {isActive && (
            <span className="ml-auto h-4 w-1 rounded-full bg-[linear-gradient(180deg,#7c5cff,#22d3ee)]" />
          )}
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Свернуть" : "Развернуть"}
            className="rounded-lg px-1.5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                !open && "-rotate-90"
              )}
            />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <ul className="mt-0.5 space-y-0.5">
          {page.children.map((child) => (
            <PageLink
              key={child.id}
              page={child}
              spaceSlug={spaceSlug}
              depth={depth + 1}
              pathname={pathname}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function SidebarNav({ spaces }: { spaces: SidebarSpace[] }) {
  const pathname = usePathname() ?? "";

  return (
    <nav aria-label="Документация" className="space-y-6">
      {spaces.map((space) => (
        <div key={space.id} className="space-y-1.5">
          <div className="flex items-center gap-2 px-2.5 pb-1">
            {space.icon ? (
              <span className="text-base leading-none">{space.icon}</span>
            ) : null}
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {space.title}
            </span>
          </div>
          <ul className="space-y-0.5">
            {space.pages.map((page) => (
              <PageLink
                key={page.id}
                page={page}
                spaceSlug={space.slug}
                depth={0}
                pathname={pathname}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
