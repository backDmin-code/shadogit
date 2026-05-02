import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CommandPaletteProvider } from "@/components/search/command-palette";
import { getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  return (
    <CommandPaletteProvider>
      <div className="relative flex min-h-screen flex-col pb-24 md:pb-0">
        <SiteHeader
          siteName={settings.siteName ?? "Shadogit Docs"}
          logoEmoji={settings.logoEmoji ?? "📘"}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter siteName={settings.siteName ?? "Shadogit Docs"} />
        <MobileBottomNav />
      </div>
    </CommandPaletteProvider>
  );
}
