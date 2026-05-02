# Shadogit Docs

Современная платформа документации в стиле Cloud.ru / GitBook: тёмная тема, плиточный интерфейс, мгновенный поиск (⌘K), мобильная плавающая нижняя навигация и встроенный WYSIWYG-редактор.

## Стек

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + кастомные дизайн-токены (HSL CSS variables)
- **Prisma 6** + SQLite (легко свапается на Postgres / Neon)
- **NextAuth** (credentials provider) + bcryptjs
- **TipTap** для WYSIWYG-редактора с подсветкой синтаксиса
- **Radix UI** + shadcn/ui компоненты
- **Framer Motion** для анимаций

## Быстрый старт

```bash
# 1) Установи зависимости
npm install

# 2) Скопируй пример переменных окружения и поправь под себя
cp .env.example .env

# 3) Применить миграции и засидить демо-контент
npx prisma migrate deploy
npm run db:seed

# 4) Запусти dev-сервер
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000) — публичная документация.

Войди в админку через [/login](http://localhost:3000/login). По умолчанию:

- **Email:** `admin@example.com`
- **Пароль:** `admin123`

> Для прода поменяй `ADMIN_EMAIL`, `ADMIN_PASSWORD` и `NEXTAUTH_SECRET` в `.env`, затем перезапусти сид: `npm run db:seed`.

## Скрипты

| Команда | Что делает |
| --- | --- |
| `npm run dev` | dev-сервер на localhost:3000 |
| `npm run build` | продакшн-сборка |
| `npm run start` | запуск собранной сборки |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript без эмита |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | сид демо-контента и админа |
| `npm run db:reset` | полный сброс БД + reseed |

## Структура

```
src/
├── app/
│   ├── (public)/        — публичные страницы (главная, /docs)
│   ├── (admin)/         — админ-панель (/admin/*)
│   ├── api/             — REST API (auth, pages, spaces, search, settings)
│   └── login/
├── components/
│   ├── docs/            — sidebar, TOC, плитки, breadcrumbs, content renderer
│   ├── editor/          — TipTap-редактор + меню
│   ├── layout/          — header, footer, mobile bottom nav, theme toggle
│   ├── search/          — command palette (⌘K)
│   ├── admin/           — формы и менеджеры админки
│   └── ui/              — shadcn-style примитивы
├── lib/                 — prisma, auth, утилиты, data-helpers
└── middleware.ts        — защита /admin/*

prisma/
├── schema.prisma        — User, Space, Page, Revision, SiteSettings
├── migrations/          — миграции (commit'нуты)
└── seed.ts              — демо-контент
```

## Дизайн-система

- Дефолт — тёмная тема. Светлая включается переключателем (next-themes).
- Цвета через HSL-переменные в `src/app/globals.css`. Меняй `--primary`, `--accent`, `--radius` — и весь UI подстроится.
- Тайлы: `rounded-2xl`, hairline-границы, hover с градиентным glow (`.tile-glow`).
- Шрифт: Geist (sans + mono) через `next/font/local`.
- Анимации: framer-motion (плавающая капсула в bottom-nav, hover на плитках).

## Деплой на Vercel

1. Пушни репо на GitHub.
2. Зайди на [vercel.com/new](https://vercel.com/new) и подключи репозиторий.
3. Замени `DATABASE_URL` на `postgresql://...` (Neon / Vercel Postgres) и поменяй провайдер в `prisma/schema.prisma` на `postgresql`.
4. Добавь переменные окружения в Vercel: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
5. На первом деплое запусти `npm run db:migrate` и `npm run db:seed` локально против прод-БД (или повесь на post-deploy hook).

## Лицензия

MIT
