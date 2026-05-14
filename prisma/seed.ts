/**
 * Seed script — runs after `prisma migrate dev` (and on demand via `npm run db:seed`).
 * Creates an admin user (from ADMIN_EMAIL/ADMIN_PASSWORD env), default site
 * settings, and a few demo spaces & pages so the documentation site is not
 * empty when first opened.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
const adminName = process.env.ADMIN_NAME ?? "Admin";

interface SeedPage {
  slug: string;
  title: string;
  description: string;
  emoji: string;
  contentJson: object;
}

interface SeedSpace {
  slug: string;
  title: string;
  description: string;
  icon: string;
  pages: SeedPage[];
}

function p(text: string) {
  return { type: "paragraph", content: [{ type: "text", text }] };
}
function h(level: number, text: string) {
  return {
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text }],
  };
}
function ul(items: string[]) {
  return {
    type: "bulletList",
    content: items.map((t) => ({
      type: "listItem",
      content: [p(t)],
    })),
  };
}
function ol(items: string[]) {
  return {
    type: "orderedList",
    content: items.map((t) => ({
      type: "listItem",
      content: [p(t)],
    })),
  };
}
function code(language: string, text: string) {
  return {
    type: "codeBlock",
    attrs: { language },
    content: [{ type: "text", text }],
  };
}
function quote(text: string) {
  return { type: "blockquote", content: [p(text)] };
}
function hr() {
  return { type: "horizontalRule" };
}
function tasks(items: { text: string; checked?: boolean }[]) {
  return {
    type: "taskList",
    content: items.map((it) => ({
      type: "taskItem",
      attrs: { checked: !!it.checked },
      content: [p(it.text)],
    })),
  };
}
function doc(...content: object[]) {
  return { type: "doc", content };
}

const seed: SeedSpace[] = [
  {
    slug: "getting-started",
    title: "Быстрый старт",
    description: "С нуля до запуска за 10 минут.",
    icon: "🚀",
    pages: [
      {
        slug: "welcome",
        title: "Привет!",
        description: "Это твоя новая платформа документации.",
        emoji: "👋",
        contentJson: doc(
          h(2, "Что это"),
          p(
            "Сквады — платформа для микро-бизнеса в Telegram: бот записи, реферальная сеть мастеров и программа лояльности в одной подписке."
          ),
          h(2, "Что внутри"),
          ul([
            "Тёмная и светлая темы из коробки",
            "WYSIWYG-редактор на TipTap",
            "Поиск по всему контенту (⌘K)",
            "Мобильная плавающая нижняя навигация",
            "Защищённая админка с историей ревизий",
          ]),
          h(2, "Что дальше"),
          p("Зайди в админку и начни писать. Через 10 минут будет красиво."),
          quote("Хорошая документация — это не только про текст. Это про впечатление.")
        ),
      },
      {
        slug: "installation",
        title: "Установка",
        description: "Локальный запуск проекта.",
        emoji: "📦",
        contentJson: doc(
          h(2, "Требования"),
          ul(["Node.js 20+", "npm или pnpm", "5 минут времени"]),
          h(2, "Шаги"),
          ol([
            "Клонируй репозиторий",
            "Установи зависимости",
            "Применить миграции БД",
            "Запусти dev-сервер",
          ]),
          h(3, "Команды"),
          code(
            "bash",
            "git clone https://github.com/backDmin-code/shadogit.git\ncd shadogit\nnpm install\nnpx prisma migrate dev\nnpm run db:seed\nnpm run dev\n# репо пока называется shadogit — переименование в squady запланировано"
          ),
          p("Открой http://localhost:3000 — и ты на месте."),
          h(2, "Чек-лист первого запуска"),
          tasks([
            { text: "Клонировал репо", checked: true },
            { text: "Установил зависимости", checked: true },
            { text: "Сменил пароль админа в .env" },
            { text: "Создал свой первый раздел" },
          ])
        ),
      },
      {
        slug: "configuration",
        title: "Конфигурация",
        description: "Переменные окружения и кастомизация.",
        emoji: "⚙️",
        contentJson: doc(
          h(2, "Environment variables"),
          p("Все настройки задаются через .env. Минимальный набор:"),
          code(
            "bash",
            'DATABASE_URL="file:./dev.db"\nNEXTAUTH_URL="http://localhost:3000"\nNEXTAUTH_SECRET="change-me-in-prod"\nADMIN_EMAIL="admin@example.com"\nADMIN_PASSWORD="admin123"'
          ),
          h(2, "Кастомизация дизайна"),
          p(
            "Цвета, отступы, скругления — всё в src/app/globals.css на CSS-токенах. Меняй переменные --primary, --accent, --radius — и весь UI подстроится."
          ),
          h(2, "Брендинг"),
          ul([
            "Название сайта — в Настройках админки",
            "Эмодзи-лого — там же",
            "Цвета — через --primary и --accent",
          ])
        ),
      },
    ],
  },
  {
    slug: "guides",
    title: "Гайды",
    description: "Пошаговые инструкции и рецепты.",
    icon: "🧰",
    pages: [
      {
        slug: "writing-pages",
        title: "Как писать страницы",
        description: "Редактор, форматирование, медиа.",
        emoji: "✍️",
        contentJson: doc(
          h(2, "Редактор"),
          p(
            "Внутри админки — TipTap-редактор. Поддерживает заголовки, списки, цитаты, чек-листы, код с подсветкой, ссылки, изображения и многое другое."
          ),
          h(2, "Форматирование"),
          ul([
            "**Жирный** / *курсив* / ~~зачёркнутый~~",
            "`inline-код` или блоки кода",
            "Списки и чек-листы",
            "Цитаты и горизонтальные разделители",
          ]),
          h(2, "Подсветка кода"),
          p("В блоках кода работает подсветка синтаксиса:"),
          code(
            "ts",
            'export function hello(name: string): string {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(hello("world"));'
          ),
          h(2, "Чек-листы"),
          tasks([
            { text: "Структурируй документ", checked: true },
            { text: "Добавь примеры кода", checked: true },
            { text: "Залей скриншоты" },
            { text: "Опубликуй" },
          ]),
          hr(),
          quote("Тип \u00abкак есть\u00bb всегда лучше пустой страницы.")
        ),
      },
      {
        slug: "organize-content",
        title: "Структура контента",
        description: "Разделы, страницы, иерархия.",
        emoji: "🗂️",
        contentJson: doc(
          h(2, "Иерархия"),
          p(
            "В Сквадах документация имеет два уровня: разделы (spaces) → страницы. Страницы можно вкладывать друг в друга через parentId — получится дерево."
          ),
          h(2, "Советы"),
          ul([
            "Не делай разделов больше 5–7 — их сложно сканировать",
            "Каждый раздел = отдельная история",
            "Внутри раздела сортируй от простого к сложному",
          ])
        ),
      },
    ],
  },
  {
    slug: "api",
    title: "API",
    description: "Внутренние эндпоинты для интеграций.",
    icon: "🔌",
    pages: [
      {
        slug: "overview",
        title: "Обзор API",
        description: "Эндпоинты, аутентификация, rate limits.",
        emoji: "🌐",
        contentJson: doc(
          h(2, "Базовый URL"),
          p("Все эндпоинты живут под /api."),
          h(2, "Эндпоинты"),
          ul([
            "GET /api/pages — список страниц",
            "POST /api/pages — создать (требует auth)",
            "PUT /api/pages/:id — обновить (требует auth)",
            "DELETE /api/pages/:id — удалить (требует auth)",
            "GET /api/search?q=... — поиск",
          ]),
          h(2, "Аутентификация"),
          p(
            "Чтение публичное. Любые мутации требуют сессию админа (cookie от NextAuth)."
          ),
          h(2, "Пример"),
          code(
            "ts",
            "const res = await fetch('/api/search?q=hello');\nconst { results } = await res.json();\nconsole.log(results);"
          )
        ),
      },
    ],
  },
  {
    slug: "changelog",
    title: "Что нового",
    description: "Журнал изменений.",
    icon: "✨",
    pages: [
      {
        slug: "v1-0",
        title: "v1.0 — первый релиз",
        description: "Запуск платформы документации.",
        emoji: "🎉",
        contentJson: doc(
          p(
            "Первая версия Сквады. Спасибо, что заглянул(а)! Ниже — что внутри."
          ),
          h(2, "Что есть"),
          ul([
            "Публичная документация с тёмной/светлой темой",
            "TipTap-редактор с подсветкой кода",
            "Мгновенный поиск ⌘K",
            "Мобильная плавающая нижняя навигация",
            "Защищённая админка через NextAuth",
          ]),
          h(2, "В планах"),
          ul([
            "Версионирование страниц на UI",
            "Совместное редактирование",
            "Полнотекстовый поиск с FTS5",
            "Тёмные и светлые скиншоты для Open Graph",
          ])
        ),
      },
    ],
  },
];

async function main() {
  console.log("→ Seeding database…");

  // Site settings
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  // Admin user
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: adminName, role: "admin" },
    create: {
      email: adminEmail,
      passwordHash,
      name: adminName,
      role: "admin",
    },
  });
  console.log(`✓ Admin user: ${adminEmail}`);

  for (let i = 0; i < seed.length; i++) {
    const s = seed[i];
    const space = await prisma.space.upsert({
      where: { slug: s.slug },
      update: {
        title: s.title,
        description: s.description,
        icon: s.icon,
        order: i,
      },
      create: {
        slug: s.slug,
        title: s.title,
        description: s.description,
        icon: s.icon,
        order: i,
      },
    });
    for (let j = 0; j < s.pages.length; j++) {
      const pg = s.pages[j];
      const contentText = JSON.stringify(pg.contentJson)
        .replace(/[{},"\\]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      await prisma.page.upsert({
        where: { spaceId_slug: { spaceId: space.id, slug: pg.slug } },
        update: {
          title: pg.title,
          description: pg.description,
          emoji: pg.emoji,
          contentJson: JSON.stringify(pg.contentJson),
          contentText,
          published: true,
          order: j,
        },
        create: {
          spaceId: space.id,
          slug: pg.slug,
          title: pg.title,
          description: pg.description,
          emoji: pg.emoji,
          contentJson: JSON.stringify(pg.contentJson),
          contentText,
          published: true,
          order: j,
        },
      });
    }
    console.log(`✓ Space "${s.title}" with ${s.pages.length} pages`);
  }

  console.log("→ Done.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
