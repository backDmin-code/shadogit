import Link from "next/link";
import { redirect } from "next/navigation";
import { Home } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AdminSignOutButton } from "@/components/admin/sign-out-button";
import { getSiteSettings } from "@/lib/data";
import { AdminNav, AdminNavItem } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) {
    redirect("/login?callbackUrl=/admin");
  }
  const settings = await getSiteSettings();

  const items: AdminNavItem[] = [
    { href: "/admin", label: "Дашборд", icon: "dashboard", exact: true },
    { href: "/admin/pages", label: "Страницы", icon: "pages" },
    { href: "/admin/spaces", label: "Разделы", icon: "spaces" },
    { href: "/admin/settings", label: "Настройки", icon: "settings" },
  ];

  return (
    <div className="app-shell relative">
      <header className="app-header">
        <div className="app-header-logo">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="logo-mark" aria-hidden>
              {settings.logoEmoji?.length === 1 ? settings.logoEmoji : "с"}
            </span>
            <div className="min-w-0">
              <div className="logo-text truncate">
                {settings.siteName ?? "Сквады"}
              </div>
            </div>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between gap-3 px-4 md:px-6">
          <div className="hidden md:flex items-center gap-1">
            <span className="font-mono text-2xs uppercase tracking-wider text-text-dimmer">
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline font-mono text-2xs uppercase tracking-wider text-text-dim truncate max-w-[180px]">
              {session.user.email}
            </span>
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-dim hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">На сайт</span>
            </Link>
            <AdminSignOutButton />
          </div>
        </div>
      </header>

      <aside className="app-sidebar">
        <AdminNav items={items} />
      </aside>

      <main className="app-main app-main--no-toc">
        <div className="px-6 md:px-14 py-10 max-w-5xl">{children}</div>
      </main>
    </div>
  );
}


