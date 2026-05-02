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
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarNav, type SidebarSpace } from "@/components/docs/sidebar-nav";
import { usePathname } from "next/navigation";

export function DocsMobileNavTrigger({ spaces }: { spaces: SidebarSpace[] }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex items-center gap-2 pt-6 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Menu className="h-4 w-4" />
            Содержание
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
          <SheetHeader className="border-b">
            <SheetTitle>Документация</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-72px)] px-4 py-4">
            <SidebarNav spaces={spaces} />
            <div className="h-24" />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
