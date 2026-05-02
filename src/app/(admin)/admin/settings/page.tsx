import { SettingsForm } from "@/components/admin/settings-form";
import { getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Настройки сайта</h1>
        <p className="text-sm text-muted-foreground">
          Название, описание и брендинг.
        </p>
      </header>
      <SettingsForm
        initial={{
          siteName: settings.siteName ?? "",
          siteDescription: settings.siteDescription ?? "",
          logoEmoji: settings.logoEmoji ?? "",
        }}
      />
    </div>
  );
}
