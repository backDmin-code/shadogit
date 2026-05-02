import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarNav } from "@/components/docs/sidebar-nav";
import { getSidebarTree } from "@/lib/data";
import { DocsMobileNavTrigger } from "@/components/docs/mobile-nav-trigger";

export const dynamic = "force-dynamic";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const spaces = await getSidebarTree();
  return (
    <div className="container max-w-7xl">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)_240px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] py-8 md:block">
          <ScrollArea className="h-full pr-4">
            <SidebarNav spaces={spaces} />
            <div className="h-12" />
          </ScrollArea>
        </aside>
        <DocsMobileNavTrigger spaces={spaces} />
        <div className="min-w-0 py-8">{children}</div>
      </div>
    </div>
  );
}
