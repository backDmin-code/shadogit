import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Страницы</h1>
          <p className="text-sm text-muted-foreground">
            Управляй контентом документации.
          </p>
        </div>
        <Button asChild variant="gradient">
          <Link href="/admin/pages/new">
            <Plus className="h-4 w-4" /> Новая
          </Link>
        </Button>
      </header>

      <div className="overflow-hidden rounded-2xl border bg-surface/40 backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
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
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  Пока ничего нет. Создай первую страницу.
                </td>
              </tr>
            ) : (
              pages.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pages/${p.id}`}
                      className="flex items-center gap-2 font-medium hover:text-primary"
                    >
                      <span className="text-lg">{p.emoji ?? "📄"}</span>
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
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(p.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/docs/${p.space.slug}/${p.slug}`}
                          target="_blank"
                        >
                          Открыть
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/pages/${p.id}`}>Редактировать</Link>
                      </Button>
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
