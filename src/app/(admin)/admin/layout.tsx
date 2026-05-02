import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Settings,
  Home,
  LogOut,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AdminSignOutButton } from "@/components/admin/sign-out-button";
import { getSiteSettings } from "@/lib/data";

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

  const items = [
    { href: "/admin", label: "Дашборд", icon: LayoutDashboard, exact: true },
    { href: "/admin/pages", label: "Страницы", icon: FileText },
    { href: "/admin/spaces", label: "Разделы", icon: FolderTree },
    { href: "/admin/settings", label: "Настройки", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r bg-surface/30 backdrop-blur-xl md:flex md:flex-col">
        <div className="border-b p-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[linear-gradient(135deg,#7c5cff_0%,#22d3ee_100%)] text-lg shadow-glow">
              {settings.logoEmoji ?? "📘"}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {settings.siteName ?? "Shadogit Docs"}
              </div>
              <div className="text-xs text-muted-foreground">Admin Panel</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t p-3 text-sm">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            На сайт
          </Link>
          <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-muted-foreground">
            <span className="truncate">{session.user.email}</span>
            <ThemeToggle />
          </div>
          <AdminSignOutButton />
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="container max-w-5xl px-4 py-8 md:px-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}

export function _Sentinel() {
  return <LogOut />;
}
