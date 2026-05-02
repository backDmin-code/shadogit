import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPagesIndex() {
  const pages = await prisma.page.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: { space: true },
  });
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="hero-eyebrow !mb-0">Контент</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Страницы
          </h1>
          <p className="text-[13px] text-text-dim">
            Управляй контентом документации.
          </p>
        </div>
        <Link href="/admin/pages/new" className="btn-cta">
          <Plus className="h-3.5 w-3.5" /> Новая
        </Link>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 border-b border-border">
            <tr className="text-left font-mono text-2xs uppercase tracking-wider text-text-dimmer">
              <th className="px-4 py-3">Заголовок</th>
              <th className="px-4 py-3">Раздел</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Обновлено</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pages.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-text-dim text-[13px]"
                >
                  Пока ничего нет. Создай первую страницу.
                </td>
              </tr>
            ) : (
              pages.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-surface-2/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pages/${p.id}`}
                      className="flex items-center gap-2 text-[14px] font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <span className="text-base">{p.emoji ?? "📄"}</span>
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{p.space.title}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {p.published ? (
                      <Badge variant="default">Опубликовано</Badge>
                    ) : (
                      <Badge variant="outline">Черновик</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-2xs uppercase tracking-wider text-text-dimmer">
                    {formatDate(p.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/docs/${p.space.slug}/${p.slug}`}
                        target="_blank"
                        className="font-mono text-2xs uppercase tracking-wider text-text-dim hover:text-primary transition-colors"
                      >
                        Открыть
                      </Link>
                      <Link
                        href={`/admin/pages/${p.id}`}
                        className="font-mono text-2xs uppercase tracking-wider text-primary hover:text-foreground transition-colors"
                      >
                        Редактировать
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
