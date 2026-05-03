# Инструкция по запуску FLove на сервере (Caddy + dacdns.org)

## Содержание

1. [Подготовка сервера](#1-подготовка-сервера)
2. [Клонирование проекта](#2-клонирование-проекта)
3. [Установка зависимостей Python](#3-установка-зависимостей-python)
4. [Создание Telegram-бота](#4-создание-telegram-бота)
5. [Настройка .env](#5-настройка-env)
6. [Настройка Caddy](#6-настройка-caddy)
7. [Запуск как systemd-сервисы](#7-запуск-как-systemd-сервисы)
8. [Проверка работы](#8-проверка-работы)
9. [Управление и обслуживание](#9-управление-и-обслуживание)

---

## 1. Подготовка сервера

Убедитесь, что на сервере установлены Python 3.10+ и Caddy.

```bash
# Проверка версий
python3 --version    # нужен 3.10 или выше
caddy version

# Если Python не установлен
sudo apt update && sudo apt install -y python3 python3-pip python3-venv

# Если Caddy не установлен
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

---

## 2. Клонирование проекта

```bash
# Клонировать репозиторий
cd /opt
sudo git clone https://github.com/backDmin-code/shadogit.git
sudo chown -R $USER:$USER /opt/shadogit

# Перейти в папку проекта
cd /opt/shadogit/telegram-bot
```

> **Примечание:** Можно использовать любую директорию вместо `/opt/shadogit`. Далее в инструкции используется этот путь — замените на свой, если отличается.

---

## 3. Установка зависимостей Python

```bash
cd /opt/shadogit/telegram-bot

# Создать виртуальное окружение
python3 -m venv venv

# Активировать его
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt
```

---

## 4. Создание Telegram-бота

1. Откройте Telegram, найдите **@BotFather**
2. Отправьте `/newbot`
3. Введите имя бота, например: `FLove Loyalty`
4. Введите username бота, например: `flove_loyalty_bot`
5. Скопируйте **токен** (выглядит как `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

---

## 5. Настройка .env

```bash
cd /opt/shadogit/telegram-bot
cp .env.example .env
nano .env
```

Заполните файл:

```env
# Токен от @BotFather (шаг 4)
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Ваш домен с HTTPS (замените flove на ваш поддомен)
WEBAPP_URL=https://flove.dacdns.org

# Порт для FastAPI (Caddy будет проксировать на него)
PORT=8000
```

> **Важно:** `WEBAPP_URL` должен быть с `https://` — Telegram Web App не работает без HTTPS.

---

## 6. Настройка Caddy

Caddy автоматически получит SSL-сертификат от Let's Encrypt.

### Вариант A: Если используете Caddyfile

```bash
sudo nano /etc/caddy/Caddyfile
```

Добавьте блок для вашего домена (замените `flove.dacdns.org` на ваш домен):

```caddyfile
flove.dacdns.org {
    reverse_proxy localhost:8000
}
```

> **Если у вас уже есть другие сайты в Caddyfile** — просто добавьте этот блок в конец файла.

### Вариант B: Если бот будет на основном домене

Если вы хотите использовать корневой домен (например, `yourdomain.dacdns.org`):

```caddyfile
yourdomain.dacdns.org {
    reverse_proxy localhost:8000
}
```

### Перезапуск Caddy

```bash
# Проверить конфигурацию
sudo caddy validate --config /etc/caddy/Caddyfile

# Перезапустить Caddy
sudo systemctl reload caddy
```

---

## 7. Запуск как systemd-сервисы

Чтобы бот и сервер запускались автоматически и работали в фоне.

### 7.1 Сервис FastAPI-сервера

```bash
sudo nano /etc/systemd/system/flove-server.service
```

Вставьте (замените `your_user` на вашего пользователя):

```ini
[Unit]
Description=FLove FastAPI Server
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/opt/shadogit/telegram-bot
EnvironmentFile=/opt/shadogit/telegram-bot/.env
ExecStart=/opt/shadogit/telegram-bot/venv/bin/python server.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 7.2 Сервис Telegram-бота

```bash
sudo nano /etc/systemd/system/flove-bot.service
```

Вставьте:

```ini
[Unit]
Description=FLove Telegram Bot
After=network.target flove-server.service

[Service]
Type=simple
User=your_user
WorkingDirectory=/opt/shadogit/telegram-bot
EnvironmentFile=/opt/shadogit/telegram-bot/.env
ExecStart=/opt/shadogit/telegram-bot/venv/bin/python bot.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 7.3 Запуск сервисов

```bash
# Перечитать конфигурацию systemd
sudo systemctl daemon-reload

# Включить автозапуск
sudo systemctl enable flove-server flove-bot

# Запустить сервисы
sudo systemctl start flove-server
sudo systemctl start flove-bot

# Проверить статус
sudo systemctl status flove-server
sudo systemctl status flove-bot
```

---

## 8. Проверка работы

### 8.1 Проверить что сервер запустился

```bash
# Локально на сервере
curl http://localhost:8000/api/user/0
# Ожидаемый ответ: {"detail":"User not found"}

# Через домен (HTTPS)
curl https://flove.dacdns.org/api/user/0
# Тот же ответ — значит Caddy + сервер работают
```

### 8.2 Проверить HTML-страницы

Откройте в браузере:
- `https://flove.dacdns.org/client.html?user_id=0` — карта клиента (покажет "не найден" пока нет пользователей)
- `https://flove.dacdns.org/scanner.html` — терминал кассира
- `https://flove.dacdns.org/admin.html` — админ-панель

### 8.3 Проверить бота

1. Откройте вашего бота в Telegram
2. Отправьте `/start`
3. Пройдите регистрацию (телефон → имя → фамилия → ДР)
4. Нажмите «Открыть карту лояльности» — должна открыться карта с QR-кодом
5. Нажмите «Сканировать QR» — откроется терминал кассира

### 8.4 Протестировать полный цикл

1. **Пользователь A**: зарегистрируйтесь в боте, откройте карту → покажите QR-код
2. **Пользователь B** (или тот же с другого устройства): откройте сканер → отсканируйте QR-код пользователя A
3. Введите сумму покупки → «Начислить кэшбэк»
4. Проверьте что бонусы обновились
5. Попробуйте «Списать» бонусы

---

## 9. Управление и обслуживание

### Просмотр логов

```bash
# Логи сервера
sudo journalctl -u flove-server -f

# Логи бота
sudo journalctl -u flove-bot -f

# Последние 50 строк
sudo journalctl -u flove-server -n 50
```

### Перезапуск

```bash
sudo systemctl restart flove-server
sudo systemctl restart flove-bot
```

### Остановка

```bash
sudo systemctl stop flove-server flove-bot
```

### Обновление кода

```bash
cd /opt/shadogit
git pull origin devin/1777734845-flove-telegram-bot

# Перезапустить сервисы
sudo systemctl restart flove-server flove-bot
```

### Резервная копия базы

```bash
# База данных находится здесь:
cp /opt/shadogit/telegram-bot/flove.db /opt/shadogit/telegram-bot/flove.db.backup
```

### Добавление тестовых пользователей вручную

Если нужно добавить пользователей без регистрации через бот:

```bash
cd /opt/shadogit/telegram-bot
source venv/bin/activate

python3 -c "
import database
database.init_db()

# Добавить тестовых пользователей (telegram_id, телефон, имя, фамилия, ДР)
database.create_user(111111, '+375292299001', 'Админ', 'Тестов', '01.01.1985')
database.create_user(222222, '+375291234567', 'Александра', 'М.', '14.03.1994')
database.create_user(333333, '+375447654321', 'Дмитрий', 'К.', '22.07.1990')
database.create_user(444444, '+375331234567', 'Виктория', 'Н.', '05.11.1988')

# Добавить покупки для демонстрации уровней
database.add_purchase(333333, 1800)   # Серебро
database.add_purchase(444444, 6200)   # Золото

print('Тестовые пользователи добавлены!')
"
```

После этого можно проверить:
- `https://flove.dacdns.org/client.html?user_id=111111` — Админ (Бронза)
- `https://flove.dacdns.org/client.html?user_id=333333` — Дмитрий (Серебро)
- `https://flove.dacdns.org/client.html?user_id=444444` — Виктория (Золото)

---

## Частые проблемы

| Проблема | Решение |
|----------|---------|
| Caddy не получает сертификат | Убедитесь что домен указывает на IP сервера, порт 443 открыт |
| Бот не отвечает | Проверьте `BOT_TOKEN` в `.env`, логи: `journalctl -u flove-bot -f` |
| Web App не открывается | `WEBAPP_URL` должен быть с `https://`, проверьте Caddy |
| QR-сканер не видит камеру | Камера работает только по HTTPS, проверьте сертификат |
| «User not found» на карте | Пользователь не зарегистрирован — пройдите `/start` в боте |
