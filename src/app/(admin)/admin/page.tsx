import Link from "next/link";
import { Plus, FileText, FolderTree, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [pageCount, spaceCount, recent] = await Promise.all([
    prisma.page.count(),
    prisma.space.count(),
    prisma.page.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { space: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Привет, админ 👋</p>
          <h1 className="text-3xl font-bold tracking-tight">Дашборд</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/spaces">
              <FolderTree className="h-4 w-4" /> Разделы
            </Link>
          </Button>
          <Button asChild variant="gradient">
            <Link href="/admin/pages/new">
              <Plus className="h-4 w-4" /> Новая страница
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Страниц"
          value={pageCount}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          label="Разделов"
          value={spaceCount}
          icon={<FolderTree className="h-5 w-5" />}
        />
        <StatCard
          label="Версия"
          value="v1.0"
          icon={<Sparkles className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Последние страницы</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/pages">Все страницы</Link>
            </Button>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Ничего пока нет. Создай первую страницу.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{p.emoji ?? "📄"}</span>
                    <div>
                      <Link
                        href={`/admin/pages/${p.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {p.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {p.space.title} · {formatDate(p.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/docs/${p.space.slug}/${p.slug}`} target="_blank">
                      Открыть
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="tile-glow flex items-center justify-between p-5">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
      </div>
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-[linear-gradient(135deg,rgba(124,92,255,0.25)_0%,rgba(34,211,238,0.20)_100%)] text-primary">
        {icon}
      </div>
    </div>
  );
}
