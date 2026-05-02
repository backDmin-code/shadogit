"""
FLove — Telegram-бот для карты лояльности цветочного кафе.

MVP: регистрация (телефон → имя → фамилия → дата рождения),
затем выдача кнопок с Web App (карта клиента, админ-панель, сканер QR).
"""

import os
import logging

from dotenv import load_dotenv
from telegram import (
    Update,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    KeyboardButton,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    WebAppInfo,
)
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ConversationHandler,
    filters,
)

load_dotenv()

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "").rstrip("/")

PHONE, FIRST_NAME, LAST_NAME, BIRTHDAY = range(4)


# ─── handlers ───────────────────────────────────────────────


async def start(update: Update, context) -> int:
    keyboard = [
        [KeyboardButton("📱 Поделиться номером", request_contact=True)]
    ]
    await update.message.reply_text(
        "🌸 *Добро пожаловать в FLove\\!*\n\n"
        "Мы рады видеть вас\\. Для создания вашей персональной "
        "карты лояльности, пожалуйста, поделитесь номером телефона\\.",
        parse_mode="MarkdownV2",
        reply_markup=ReplyKeyboardMarkup(
            keyboard, resize_keyboard=True, one_time_keyboard=True
        ),
    )
    return PHONE


async def phone_received(update: Update, context) -> int:
    contact = update.message.contact
    if contact is None:
        await update.message.reply_text(
            "Пожалуйста, используйте кнопку ниже, чтобы поделиться номером."
        )
        return PHONE

    context.user_data["phone"] = contact.phone_number
    logger.info("Получен телефон: %s", contact.phone_number)

    await update.message.reply_text(
        "Отлично! Теперь введите ваше *имя*:",
        parse_mode="Markdown",
        reply_markup=ReplyKeyboardRemove(),
    )
    return FIRST_NAME


async def first_name_received(update: Update, context) -> int:
    context.user_data["first_name"] = update.message.text.strip()
    await update.message.reply_text(
        "Введите вашу *фамилию*:", parse_mode="Markdown"
    )
    return LAST_NAME


async def last_name_received(update: Update, context) -> int:
    context.user_data["last_name"] = update.message.text.strip()
    await update.message.reply_text(
        "Введите вашу *дату рождения* (ДД\\.ММ\\.ГГГГ):",
        parse_mode="MarkdownV2",
    )
    return BIRTHDAY


async def birthday_received(update: Update, context) -> int:
    context.user_data["birthday"] = update.message.text.strip()

    name = context.user_data.get("first_name", "")
    surname = context.user_data.get("last_name", "")

    logger.info(
        "Регистрация завершена: %s %s, тел: %s, ДР: %s",
        name,
        surname,
        context.user_data.get("phone"),
        context.user_data.get("birthday"),
    )

    keyboard = [
        [
            InlineKeyboardButton(
                "🌸 Открыть карту лояльности",
                web_app=WebAppInfo(url=f"{WEBAPP_URL}/client.html"),
            )
        ],
        [
            InlineKeyboardButton(
                "⚙️ Панель управления",
                web_app=WebAppInfo(url=f"{WEBAPP_URL}/admin.html"),
            )
        ],
        [
            InlineKeyboardButton(
                "📷 Сканировать QR",
                web_app=WebAppInfo(url=f"{WEBAPP_URL}/scanner.html"),
            )
        ],
    ]

    await update.message.reply_text(
        f"✨ {name}, ваша карта лояльности готова!\n\n"
        "Для открытия перейдите по кнопке ниже 👇",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )
    return ConversationHandler.END


async def cancel(update: Update, context) -> int:
    await update.message.reply_text(
        "Регистрация отменена. Введите /start, чтобы начать заново.",
        reply_markup=ReplyKeyboardRemove(),
    )
    return ConversationHandler.END


async def menu(update: Update, context) -> None:
    """Повторно показать кнопки без повторной регистрации."""
    keyboard = [
        [
            InlineKeyboardButton(
                "🌸 Открыть карту лояльности",
                web_app=WebAppInfo(url=f"{WEBAPP_URL}/client.html"),
            )
        ],
        [
            InlineKeyboardButton(
                "⚙️ Панель управления",
                web_app=WebAppInfo(url=f"{WEBAPP_URL}/admin.html"),
            )
        ],
        [
            InlineKeyboardButton(
                "📷 Сканировать QR",
                web_app=WebAppInfo(url=f"{WEBAPP_URL}/scanner.html"),
            )
        ],
    ]
    await update.message.reply_text(
        "Выберите действие 👇",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ─── main ───────────────────────────────────────────────────


def main() -> None:
    if not BOT_TOKEN:
        raise SystemExit("BOT_TOKEN не задан. Укажите его в .env")
    if not WEBAPP_URL:
        raise SystemExit("WEBAPP_URL не задан. Укажите его в .env")

    app = Application.builder().token(BOT_TOKEN).build()

    conv = ConversationHandler(
        entry_points=[CommandHandler("start", start)],
        states={
            PHONE: [MessageHandler(filters.CONTACT, phone_received)],
            FIRST_NAME: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, first_name_received)
            ],
            LAST_NAME: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, last_name_received)
            ],
            BIRTHDAY: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, birthday_received)
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    app.add_handler(conv)
    app.add_handler(CommandHandler("menu", menu))

    logger.info("FLove бот запущен!")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
