import Link from "next/link";
import { ArrowRight, Sparkles, BookOpen, Rocket, Layers } from "lucide-react";
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
    (sum, s) =>
      sum +
      s.pages.length +
      s.pages.reduce((c, p) => c + p.children.length, 0),
    0
  );

  return (
    <main className="app-main app-main--no-toc !ml-0 !mr-0 relative z-10">
      {/* Hero */}
      <section className="page-hero">
        <div className="hero-orb1" />
        <div className="hero-orb2" />
        <div className="relative z-10">
          <div className="hero-eyebrow">
            <Sparkles className="h-3 w-3" /> Documentation reimagined
          </div>
          <h1 className="page-title">
            Документация для проекта,
            <br />
            которой захочется пользоваться.
          </h1>
          <p className="page-subtitle">
            {settings.siteDescription ??
              "Тёмная тема, плиточный интерфейс, мгновенный поиск, мобильная нижняя панель и встроенный WYSIWYG-редактор."}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/docs"
              className="btn-cta"
            >
              Открыть документацию
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-4 py-1.5 text-xs font-semibold text-text-dim hover:border-primary/40 hover:text-primary transition-colors"
            >
              Войти в админку
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="meta-chip">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-mint))] animate-pulse-glow" />
              Все системы в норме
            </span>
            <span className="meta-chip">
              <BookOpen className="h-3 w-3" />
              <span>{totalPages} страниц</span>
            </span>
            <span className="meta-chip">
              <Layers className="h-3 w-3" />
              <span>{spaces.length} разделов</span>
            </span>
          </div>
        </div>
      </section>

      {/* Spaces */}
      <section className="px-6 py-14 md:px-14 md:py-20 max-w-6xl">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-3">Разделы</div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Логические пространства документации
            </h2>
          </div>
          <Link
            href="/docs"
            className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-primary hover:gap-2 transition-all"
          >
            Все доки <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.length === 0 ? (
            <EmptyState />
          ) : (
            spaces.map((space, i) => (
              <PageTile
                key={space.id}
                href={`/docs/${space.slug}`}
                title={space.title}
                description={`${space.pages.length} страниц в этом разделе`}
                emoji={
                  space.icon ?? ["📘", "🚀", "🧰", "🌐", "🛡️", "🔌"][i % 6]
                }
                variant={i === 0 ? "gradient" : "default"}
                badge={i === 0 ? "Старт" : undefined}
              />
            ))
          )}
        </div>
      </section>

      {/* Highlights */}
      <section className="px-6 py-14 md:px-14 md:py-20 max-w-6xl">
        <div className="mb-7">
          <div className="eyebrow mb-3">Что внутри</div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Шесть фич, ради которых это и собирали
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureTile
            emoji="✨"
            title="Дизайн как у топов"
            description="Лайм-акцент, мятные подсветки, плитки со скруглениями, плавные fade-up анимации."
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
            description="NextAuth + bcrypt, страницы редактируют только админы. История ревизий."
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
        <section className="px-6 py-14 md:px-14 md:py-20 pb-24 max-w-6xl">
          <div className="mb-7">
            <div className="eyebrow mb-3">Недавно</div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Свежие обновления документации
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
    </main>
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
    <div className="tile flex h-full flex-col gap-2.5">
      <div className="tile-icon">{emoji}</div>
      <h3 className="tile-title">{title}</h3>
      <p className="text-[13px] text-text-dim leading-relaxed">{description}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full">
      <div className="tile flex flex-col items-center gap-4 p-10 text-center">
        <div className="tile-icon !w-12 !h-12">
          <Rocket className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-base font-semibold">
            Здесь пока пусто
          </h3>
          <p className="text-[13px] text-text-dim">
            Залогинься в админку и создай свой первый раздел.
          </p>
        </div>
        <Link href="/login" className="btn-cta">
          Войти <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
