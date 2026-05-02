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
    <>
      <aside className="app-sidebar">
        <SidebarNav spaces={spaces} />
        <div className="h-12" />
      </aside>
      <DocsMobileNavTrigger spaces={spaces} />
      {children}
    </>
  );
}
