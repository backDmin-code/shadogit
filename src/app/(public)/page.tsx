import Link from "next/link";
import { ArrowRight, Sparkles, BookOpen, Rocket, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTile } from "@/components/docs/page-tile";
import { getRecentPages, getSidebarTree, getSiteSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, spaces, recent] = await Promise.all([
    getSiteSettings(),
    getSidebarTree(),
    getRecentPages(6),
  ]);

  const totalPages = spaces.reduce(
    (sum, s) => sum + s.pages.length + s.pages.reduce((c, p) => c + p.children.length, 0),
    0
  );

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" aria-hidden />
        <div className="container relative max-w-6xl py-20 md:py-28">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Badge variant="gradient" className="gap-1.5 px-3 py-1 text-xs">
              <Sparkles className="h-3 w-3" /> Documentation reimagined
            </Badge>
            <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
              <span className="block">Документация для проекта,</span>
              <span className="gradient-text mt-1 block">
                которой захочется пользоваться.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
              {settings.siteDescription ??
                "Тёмная тема, плиточный интерфейс, мгновенный поиск, мобильная нижняя панель и встроенный WYSIWYG-редактор."}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="gradient">
                <Link href="/docs">
                  Открыть документацию
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/admin">Войти в админку</Link>
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse-glow rounded-full bg-emerald-400" />
                Все системы в норме
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <BookOpen className="h-4 w-4" />
                {totalPages} страниц
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Layers className="h-4 w-4" />
                {spaces.length} разделов
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spaces */}
      <section className="container max-w-6xl pb-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Разделы</h2>
            <p className="text-sm text-muted-foreground">
              Логические пространства документации.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/docs">
              Все доки <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.length === 0 ? (
            <EmptyState />
          ) : (
            spaces.map((space, i) => (
              <PageTile
                key={space.id}
                href={`/docs/${space.slug}`}
                title={space.title}
                description={`${space.pages.length} страниц в этом разделе`}
                emoji={space.icon ?? ["📘", "🚀", "🧰", "🌐", "🛡️", "🔌"][i % 6]}
                variant={i === 0 ? "gradient" : "default"}
                badge={i === 0 ? "Старт" : undefined}
              />
            ))
          )}
        </div>
      </section>

      {/* Highlights */}
      <section className="container max-w-6xl pb-12">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">
          Что внутри
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureTile
            emoji="✨"
            title="Дизайн как у топов"
            description="Тёмная тема, неоновые акценты, плитки со скруглениями, плавные анимации и адаптив под мобильные."
          />
          <FeatureTile
            emoji="✍️"
            title="WYSIWYG-редактор"
            description="TipTap с заголовками, кодом, чек-листами, цитатами и подсветкой синтаксиса."
          />
          <FeatureTile
            emoji="⚡"
            title="Мгновенный поиск"
            description="⌘K — и ты уже на нужной странице. Подсветка совпадений, навигация стрелками."
          />
          <FeatureTile
            emoji="🔐"
            title="Защищённая админка"
            description="NextAuth + bcrypt, страницы редактируют только админы. Истории ревизий."
          />
          <FeatureTile
            emoji="📱"
            title="Mobile-first"
            description="Плавающая нижняя навигация, sheet-меню, одинаковые отступы со всех сторон."
          />
          <FeatureTile
            emoji="🎨"
            title="Кастомизация"
            description="Цвета, шрифты, плитки, иконки разделов — всё на токенах. Меняй под бренд."
          />
        </div>
      </section>

      {/* Recent */}
      {recent.length > 0 && (
        <section className="container max-w-6xl pb-20">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">
            Недавно обновлено
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((p) => (
              <PageTile
                key={p.id}
                href={`/docs/${p.space.slug}/${p.slug}`}
                title={p.title}
                description={p.description ?? undefined}
                emoji={p.emoji ?? "📄"}
                badge={p.space.title}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FeatureTile({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="tile flex h-full flex-col gap-3 p-5 sm:p-6">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/80 text-xl">
        {emoji}
      </div>
      <h3 className="font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full">
      <div className="tile flex flex-col items-center gap-4 p-10 text-center">
        <Rocket className="h-10 w-10 text-primary" />
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Здесь пока пусто</h3>
          <p className="text-sm text-muted-foreground">
            Залогинься в админку и создай свой первый раздел.
          </p>
        </div>
        <Button asChild variant="gradient">
          <Link href="/login">
            Войти <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}


