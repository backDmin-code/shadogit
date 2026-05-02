import Link from "next/link";

export function SiteFooter({ siteName }: { siteName: string }) {
  return (
    <footer className="border-t mt-20">
      <div className="container max-w-7xl py-10 text-sm text-muted-foreground">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-1">
            <p className="text-foreground font-medium">{siteName}</p>
            <p>
              Сделано с заботой. Built with Next.js & shadcn/ui.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/docs" className="hover:text-foreground transition-colors">
              Документация
            </Link>
            <Link href="/docs/getting-started" className="hover:text-foreground transition-colors">
              Быстрый старт
            </Link>
            <Link href="/docs/changelog" className="hover:text-foreground transition-colors">
              Что нового
            </Link>
            <Link
              href="https://github.com/backDmin-code/shadogit"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
