import Link from "next/link";

export function SiteFooter({ siteName }: { siteName: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="sq-footer">
      <div className="sq-footer-inner">
        <div className="sq-footer-brand">
          <div className="sq-footer-brand-row">
            <span className="sq-footer-mark" aria-hidden>
              с
            </span>
            <span className="sq-footer-name">{siteName}</span>
          </div>
          <p className="sq-footer-tagline">
            Платформа для микро-бизнеса в Telegram: умный бот записи,
            реферальная сеть мастеров и программа лояльности — в одной
            подписке.
          </p>
        </div>

        <div>
          <div className="sq-footer-col-title">Продукт</div>
          <div className="sq-footer-list">
            <Link href="/#bot-features">Bot Layer</Link>
            <Link href="/#squad-network">Squad Network</Link>
            <Link href="/#loyalty">Loyalty Engine</Link>
            <Link href="/#pricing">Тарифы</Link>
          </div>
        </div>

        <div>
          <div className="sq-footer-col-title">Помощь</div>
          <div className="sq-footer-list">
            <Link href="/docs">Документация</Link>
            <Link href="/docs/getting-started">Быстрый старт</Link>
            <Link href="/docs/changelog">Что нового</Link>
            <Link href="/#faq">FAQ</Link>
          </div>
        </div>

        <div>
          <div className="sq-footer-col-title">Команда</div>
          <div className="sq-footer-list">
            <Link href="/login">Войти</Link>
            <Link href="mailto:hi@squady.app">hi@squady.app</Link>
            <Link
              href="https://github.com/backDmin-code/shadogit"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>

      <div className="sq-footer-bottom">
        <span>© {year} {siteName}. Сделано с любовью к малому бизнесу.</span>
        <div className="sq-footer-bottom-right">
          <span className="sq-footer-bottom-tag">beta</span>
          <span>v0.1 — Telegram Bot API 9.6</span>
        </div>
      </div>
    </footer>
  );
}
