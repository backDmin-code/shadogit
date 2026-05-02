import Link from "next/link";

export function SiteFooter({ siteName }: { siteName: string }) {
  return (
    <footer className="relative z-10 border-t border-border mt-24">
      <div className="container max-w-7xl py-10 text-[13px] text-text-dim">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-1">
            <p className="font-display text-foreground font-semibold tracking-tight">
              {siteName}
            </p>
            <p className="font-mono text-2xs uppercase tracking-wider text-text-dimmer">
              Built with Next.js · TipTap · shadcn/ui
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href="/docs"
              className="hover:text-primary transition-colors"
            >
              Документация
            </Link>
            <Link
              href="/docs/getting-started"
              className="hover:text-primary transition-colors"
            >
              Быстрый старт
            </Link>
            <Link
              href="/docs/changelog"
              className="hover:text-primary transition-colors"
            >
              Что нового
            </Link>
            <Link
              href="https://github.com/backDmin-code/shadogit"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary transition-colors"
            >
              GitHub
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
