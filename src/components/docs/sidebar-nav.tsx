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
      <div className="group flex items-stretch">
        <Link
          href={href}
          className={cn("nav-item flex-1", isActive && "active")}
          style={
            depth > 0
              ? {
                  paddingLeft: `${18 + depth * 14}px`,
                }
              : undefined
          }
        >
          {page.emoji ? (
            <span className="text-[14px] leading-none">{page.emoji}</span>
          ) : (
            <Hash className="nav-icon" />
          )}
          <span className="line-clamp-1 flex-1">{page.title}</span>
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Свернуть" : "Развернуть"}
            className="px-2 text-text-dimmer hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                !open && "-rotate-90"
              )}
            />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <ul>
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
    <nav aria-label="Документация">
      {spaces.map((space) => (
        <div key={space.id}>
          <div className="nav-label flex items-center gap-2">
            {space.icon ? (
              <span className="text-[12px] leading-none">{space.icon}</span>
            ) : null}
            <span>{space.title}</span>
          </div>
          <ul>
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
