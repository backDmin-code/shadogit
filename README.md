# Сквады

Платформа для микро-бизнеса в Telegram: бот записи, реферальная сеть мастеров и программа лояльности — в одной подписке. Сайт-витрина продукта с продающим лендингом, встроенной документацией и админкой.

> Репозиторий пока называется `shadogit` — это исторический slug, в коде проект называется **«Сквады»**.

## Стек

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + кастомные дизайн-токены (HSL CSS variables) + bold-marketing `.sq-*` слой
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

Открой [http://localhost:3000](http://localhost:3000) — лендинг «Сквады».

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
│   ├── (public)/        — публичные страницы: лендинг /, /docs/*
│   ├── (admin)/         — админ-панель (/admin/*)
│   ├── api/             — REST API (auth, pages, spaces, search, settings)
│   └── login/
├── components/
│   ├── squady/          — секции лендинга (hero, marquee, principles, …)
│   ├── docs/            — sidebar, TOC, плитки, breadcrumbs, content renderer
│   ├── editor/          — TipTap-редактор + меню
│   ├── layout/          — sq-header, sq-footer, mobile bottom nav, theme toggle
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

- **Лендинг** — bold marketing вайб (Gumroad / Tally / Spline): кремовая бумага `#FFF6E5`, чернильные `#0E0B16` границы, наклонные стикеры, тени `box-shadow: 3-4px solid #0E0B16`.
  - Палитра: lime `#C8F046`, magenta `#FF3F8E`, sky `#5BCEFA`, orange `#FF8C42`, yellow `#FFDD55`, mint `#9BF0CC`, violet `#4F2BD8`.
  - Шрифты: **Manrope** (display), **Inter** (body), **Lora italic** (акценты), **Fira Code** (код).
  - Все `.sq-*` классы — в `src/app/globals.css`, секции — в `src/components/squady/`.
- **Док-портал** (`/docs/*`) — тот же header, но контентный шрифт Inter + Fira Code, спокойный layout с сайдбаром.
- **Темы** — dark/light переключаются через `next-themes`. Лендинг всегда light-first.

## Деплой на Vercel

1. Пушни репо на GitHub.
2. Зайди на [vercel.com/new](https://vercel.com/new) и подключи репозиторий.
3. Замени `DATABASE_URL` на `postgresql://...` (Neon / Vercel Postgres) и поменяй провайдер в `prisma/schema.prisma` на `postgresql`.
4. Добавь переменные окружения в Vercel: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
5. На первом деплое запусти `npm run db:migrate` и `npm run db:seed` локально против прод-БД (или повесь на post-deploy hook).

## Лицензия

MIT
