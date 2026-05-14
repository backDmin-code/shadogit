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
      <div className="app-shell relative">
        <SiteHeader
          siteName={settings.siteName ?? "Сквады"}
          logoEmoji={settings.logoEmoji ?? "с"}
          withSidebarBlock
        />
        {children}
        <MobileBottomNav />
        <SiteFooter siteName={settings.siteName ?? "Сквады"} />
      </div>
    </CommandPaletteProvider>
  );
}
