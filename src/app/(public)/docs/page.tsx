import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageTile } from "@/components/docs/page-tile";
import { getSidebarTree } from "@/lib/data";

export const metadata = {
  title: "Документация",
};

export const dynamic = "force-dynamic";

export default async function DocsIndexPage() {
  const spaces = await getSidebarTree();
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <Badge variant="default">Документация</Badge>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Все разделы
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Выбери раздел или начни с быстрого старта. Используй ⌘K, чтобы найти
          нужную страницу за пару секунд.
        </p>
      </header>

      <div className="space-y-12">
        {spaces.length === 0 ? (
          <div className="tile p-10 text-center">
            <p className="text-muted-foreground">
              Документация пока пустая. Зайди в админку и создай разделы.
            </p>
            <Button asChild className="mt-4" variant="gradient">
              <Link href="/login">
                Войти <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          spaces.map((space) => (
            <section key={space.id} className="space-y-4">
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-3">
                  {space.icon ? (
                    <span className="text-2xl">{space.icon}</span>
                  ) : null}
                  <h2 className="text-xl font-semibold tracking-tight">
                    {space.title}
                  </h2>
                </div>
                <Badge variant="secondary">
                  {space.pages.length} страниц
                </Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {space.pages.map((page) => (
                  <PageTile
                    key={page.id}
                    href={`/docs/${space.slug}/${page.slug}`}
                    title={page.title}
                    emoji={page.emoji ?? "📄"}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
