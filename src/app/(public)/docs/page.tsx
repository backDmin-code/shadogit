import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageTile } from "@/components/docs/page-tile";
import { getSidebarTree } from "@/lib/data";

export const metadata = {
  title: "Документация",
};

export const dynamic = "force-dynamic";

export default async function DocsIndexPage() {
  const spaces = await getSidebarTree();
  return (
    <main className="app-main app-main--no-toc">
      <section className="page-hero">
        <div className="hero-orb1" />
        <div className="relative z-10">
          <div className="hero-eyebrow">Документация</div>
          <h1 className="page-title">Все разделы</h1>
          <p className="page-subtitle">
            Выбери раздел или начни с быстрого старта. Используй <kbd>⌘ K</kbd>,
            чтобы найти нужную страницу за пару секунд.
          </p>
        </div>
      </section>

      <div className="space-y-14 px-6 md:px-14 py-12 max-w-5xl">
        {spaces.length === 0 ? (
          <div className="tile p-10 text-center">
            <p className="text-text-dim text-[14px]">
              Документация пока пустая. Зайди в админку и создай разделы.
            </p>
            <Link href="/login" className="btn-cta mt-5">
              Войти <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          spaces.map((space) => (
            <section key={space.id} className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                  {space.icon ? (
                    <span className="text-xl">{space.icon}</span>
                  ) : null}
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    {space.title}
                  </h2>
                </div>
                <Badge variant="default">
                  {space.pages.length} страниц
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
    </main>
  );
}
