"""
FLove — Telegram-бот для карты лояльности цветочного кафе.

MVP: регистрация (телефон -> имя -> фамилия -> дата рождения),
сохранение в БД, затем выдача кнопок с Web App.
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

import database

load_dotenv()

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "").rstrip("/")

PHONE, FIRST_NAME, LAST_NAME, BIRTHDAY = range(4)


def _make_menu_keyboard(telegram_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    "🌸 Открыть карту лояльности",
                    web_app=WebAppInfo(
                        url=f"{WEBAPP_URL}/client.html?user_id={telegram_id}"
                    ),
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
    )


# ─── handlers ───────────────────────────────────────────────


async def start(update: Update, context) -> int:
    telegram_id = update.effective_user.id
    existing = database.get_user(telegram_id)
    if existing:
        await update.message.reply_text(
            f"С возвращением, {existing['first_name']}! 🌸",
            reply_markup=_make_menu_keyboard(telegram_id),
        )
        return ConversationHandler.END

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
    telegram_id = update.effective_user.id

    name = context.user_data.get("first_name", "")
    surname = context.user_data.get("last_name", "")
    phone = context.user_data.get("phone", "")
    birthday = context.user_data.get("birthday", "")

    database.create_user(
        telegram_id=telegram_id,
        phone=phone,
        first_name=name,
        last_name=surname,
        birthday=birthday,
        welcome_bonus=3.0,
    )

    logger.info(
        "Регистрация завершена: %s %s (id=%s), тел: %s, ДР: %s",
        name,
        surname,
        telegram_id,
        phone,
        birthday,
    )

    await update.message.reply_text(
        f"✨ {name}, ваша карта лояльности готова!\n\n"
        "Для открытия перейдите по кнопке ниже 👇",
        reply_markup=_make_menu_keyboard(telegram_id),
    )
    return ConversationHandler.END


async def cancel(update: Update, context) -> int:
    await update.message.reply_text(
        "Регистрация отменена. Введите /start, чтобы начать заново.",
        reply_markup=ReplyKeyboardRemove(),
    )
    return ConversationHandler.END


async def menu(update: Update, context) -> None:
    telegram_id = update.effective_user.id
    await update.message.reply_text(
        "Выберите действие 👇",
        reply_markup=_make_menu_keyboard(telegram_id),
    )


# ─── main ───────────────────────────────────────────────────


def main() -> None:
    if not BOT_TOKEN:
        raise SystemExit("BOT_TOKEN не задан. Укажите его в .env")
    if not WEBAPP_URL:
        raise SystemExit("WEBAPP_URL не задан. Укажите его в .env")

    database.init_db()

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
