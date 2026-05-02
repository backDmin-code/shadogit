import Link from "next/link";
import { Plus, FileText, FolderTree, Sparkles } from "lucide-react";
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
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="hero-eyebrow !mb-0">Admin</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Дашборд
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/spaces"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-dim hover:border-primary/40 hover:text-primary transition-colors"
          >
            <FolderTree className="h-3.5 w-3.5" /> Разделы
          </Link>
          <Link href="/admin/pages/new" className="btn-cta">
            <Plus className="h-3.5 w-3.5" /> Новая страница
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Страниц" value={pageCount} icon={<FileText className="h-4 w-4" />} />
        <StatCard label="Разделов" value={spaceCount} icon={<FolderTree className="h-4 w-4" />} />
        <StatCard label="Версия" value="v1.0" icon={<Sparkles className="h-4 w-4" />} />
      </div>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-2.5">Активность</div>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Последние страницы
            </h2>
          </div>
          <Link
            href="/admin/pages"
            className="font-mono text-2xs uppercase tracking-wider text-primary hover:text-foreground transition-colors"
          >
            Все →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-[13px] text-text-dim">
            Ничего пока нет. Создай первую страницу.
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <ul className="divide-y divide-border">
              {recent.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-surface-2/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-base shrink-0">{p.emoji ?? "📄"}</span>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/pages/${p.id}`}
                        className="block font-medium text-[14px] text-foreground hover:text-primary transition-colors truncate"
                      >
                        {p.title}
                      </Link>
                      <div className="font-mono text-2xs uppercase tracking-wider text-text-dimmer mt-0.5">
                        {p.space.title} · {formatDate(p.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/docs/${p.space.slug}/${p.slug}`}
                    target="_blank"
                    className="font-mono text-2xs uppercase tracking-wider text-text-dim hover:text-primary transition-colors shrink-0"
                  >
                    Открыть
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
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
    <div className="tile flex items-center justify-between !p-5">
      <div>
        <div className="font-mono text-2xs uppercase tracking-wider text-text-dimmer">
          {label}
        </div>
        <div className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </div>
      </div>
      <div className="tile-icon !mb-0">{icon}</div>
    </div>
  );
}
