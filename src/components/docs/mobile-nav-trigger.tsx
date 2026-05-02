"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav, type SidebarSpace } from "@/components/docs/sidebar-nav";
import { usePathname } from "next/navigation";

export function DocsMobileNavTrigger({ spaces }: { spaces: SidebarSpace[] }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex items-center gap-2 px-4 pt-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-text-dim hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Menu className="h-4 w-4" />
            Содержание
          </button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[88vw] max-w-[320px] border-r border-border bg-background p-0"
        >
          <SheetHeader className="flex h-[58px] flex-row items-center justify-between border-b border-border px-5">
            <SheetTitle className="font-display text-[15px] font-semibold tracking-tight">
              Документация
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto" style={{ height: "calc(100vh - 58px)" }}>
            <div className="py-3">
              <SidebarNav spaces={spaces} />
              <div className="h-24" />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
