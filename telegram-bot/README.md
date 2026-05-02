# FLove — Telegram-бот карты лояльности

MVP Telegram-бот для цветочного кафе **FLove**.

## Что делает бот

1. `/start` — приветствие + запрос номера телефона (кнопка «Поделиться номером»)
2. Ввод **имени** (шаг 1)
3. Ввод **фамилии** (шаг 2)
4. Ввод **даты рождения** (шаг 3)
5. Выдача карты лояльности с тремя кнопками:
   - 🌸 **Карта лояльности** — открывает `client.html` как Telegram Web App
   - ⚙️ **Панель управления** — открывает `admin.html`
   - 📷 **Сканировать QR** — открывает `scanner.html`

Команда `/menu` — повторно показывает кнопки без регистрации.

## Быстрый старт

```bash
cd telegram-bot

# 1) Создай виртуальное окружение
python3 -m venv venv
source venv/bin/activate

# 2) Установи зависимости
pip install -r requirements.txt

# 3) Настрой переменные окружения
cp .env.example .env
# Заполни BOT_TOKEN и WEBAPP_URL в .env

# 4) Запусти бота
python bot.py
```

## Хостинг Web App файлов

HTML-файлы из `webapp/` нужно разместить по **HTTPS**-адресу.

### Вариант 1 — GitHub Pages

1. Включи GitHub Pages в настройках репозитория
2. Укажи `WEBAPP_URL=https://username.github.io/repo/telegram-bot/webapp`

### Вариант 2 — Nginx на сервере

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        root /path/to/telegram-bot/webapp;
        index client.html;
    }
}
```

Укажи `WEBAPP_URL=https://your-domain.com`

### Вариант 3 — Vercel / Netlify

Задеплой папку `webapp/` как статический сайт.

## Структура

```
telegram-bot/
├── bot.py              # Основной код бота
├── requirements.txt    # Python-зависимости
├── .env.example        # Шаблон переменных окружения
├── README.md
└── webapp/
    ├── client.html     # Карта лояльности клиента
    ├── admin.html      # Админ-панель
    └── scanner.html    # Сканер QR-кодов
```
