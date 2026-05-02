import { SettingsForm } from "@/components/admin/settings-form";
import { getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="hero-eyebrow !mb-0">Конфиг</div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Настройки сайта
        </h1>
        <p className="text-[13px] text-text-dim">
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
