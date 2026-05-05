"""
FLove — Telegram-бот для карты лояльности цветочного кафе.

Production: регистрация, реферальная система, рассылки,
role-based меню (клиент / кассир / админ).
"""

import os
import json
import asyncio
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
    BotCommand,
)
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ConversationHandler,
    filters,
)
from telegram.constants import ParseMode

import database

load_dotenv()

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "").rstrip("/")

# Registration states
PHONE, FIRST_NAME, LAST_NAME, BIRTHDAY = range(4)

# Broadcast states
(BC_TEXT, BC_FORMATTING, BC_PHOTO, BC_BUTTONS, BC_BUTTON_TEXT,
 BC_BUTTON_URL, BC_FILTER, BC_PREVIEW) = range(10, 18)


# ─── Keyboards ──────────────────────────────────────────────


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
                    web_app=WebAppInfo(
                        url=f"{WEBAPP_URL}/admin.html?user_id={telegram_id}"
                    ),
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


def _referral_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton(
                "👥 Мои рефералы", callback_data="my_referrals"
            )],
            [InlineKeyboardButton(
                "📤 Поделиться ссылкой", callback_data="share_referral"
            )],
        ]
    )


# ─── Registration Handlers ─────────────────────────────────


async def start(update: Update, context) -> int:
    telegram_id = update.effective_user.id

    # Check for referral deep-link: /start REF_CODE
    if context.args:
        ref_code = context.args[0]
        if ref_code.startswith("ref_"):
            context.user_data["referral_code"] = ref_code[4:]
        else:
            context.user_data["referral_code"] = ref_code

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

    # Check referral
    referred_by = None
    ref_code = context.user_data.get("referral_code")
    if ref_code:
        referrer = database.find_user_by_referral_code(ref_code)
        if referrer and referrer["telegram_id"] != telegram_id:
            referred_by = referrer["telegram_id"]

    user = database.create_user(
        telegram_id=telegram_id,
        phone=phone,
        first_name=name,
        last_name=surname,
        birthday=birthday,
        welcome_bonus=3.0,
        referred_by=referred_by,
    )

    logger.info(
        "Регистрация завершена: %s %s (id=%s), тел: %s, ДР: %s, реферал: %s",
        name, surname, telegram_id, phone, birthday, referred_by,
    )

    ref_text = ""
    if referred_by:
        referrer = database.get_user(referred_by)
        ref_text = (
            "\n🎁 Вы получили дополнительные 3 бонуса за регистрацию по приглашению!"
        )
        # Notify referrer
        try:
            await context.bot.send_message(
                referred_by,
                f"🎉 {name} {surname} зарегистрировался по вашей ссылке!\n"
                f"Вам начислено 5 бонусных рублей.",
            )
        except Exception:
            pass

    await update.message.reply_text(
        f"✨ {name}, ваша карта лояльности готова!{ref_text}\n\n"
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


# ─── Referral Handlers ─────────────────────────────────────


async def referral_cmd(update: Update, context) -> None:
    telegram_id = update.effective_user.id
    user = database.get_user(telegram_id)
    if not user:
        await update.message.reply_text(
            "Сначала зарегистрируйтесь: /start"
        )
        return

    bot_info = await context.bot.get_me()
    ref_link = f"https://t.me/{bot_info.username}?start=ref_{user['referral_code']}"
    stats = database.get_referral_stats(telegram_id)

    await update.message.reply_text(
        f"👥 *Реферальная программа FLove*\n\n"
        f"Ваша ссылка для приглашения:\n`{ref_link}`\n\n"
        f"📊 Приглашено друзей: *{stats['total']}*\n"
        f"💰 Заработано бонусов: *{stats['total_bonus']} р\\.*\n\n"
        f"За каждого друга вы получаете *5 р\\.*,\n"
        f"а ваш друг — *3 р\\.* при регистрации\\!",
        parse_mode="MarkdownV2",
        reply_markup=_referral_menu(),
    )


async def referral_callback(update: Update, context) -> None:
    query = update.callback_query
    await query.answer()
    telegram_id = query.from_user.id
    user = database.get_user(telegram_id)
    if not user:
        return

    if query.data == "my_referrals":
        referrals = database.get_referrals(telegram_id)
        if not referrals:
            await query.message.reply_text(
                "У вас пока нет приглашённых друзей. "
                "Поделитесь своей ссылкой! 👥"
            )
            return

        text = "👥 *Ваши рефералы:*\n\n"
        for i, ref in enumerate(referrals[:15], 1):
            text += (
                f"{i}\\. {_escape_md(ref['first_name'])} "
                f"{_escape_md(ref['last_name'])} — "
                f"\\+{ref['referrer_bonus']} р\\.\n"
            )
        await query.message.reply_text(text, parse_mode="MarkdownV2")

    elif query.data == "share_referral":
        bot_info = await context.bot.get_me()
        ref_link = (
            f"https://t.me/{bot_info.username}?start=ref_{user['referral_code']}"
        )
        await query.message.reply_text(
            f"📤 Отправьте эту ссылку друзьям:\n\n{ref_link}\n\n"
            "За каждого зарегистрированного друга вы получите 5 бонусных рублей!",
        )


# ─── Broadcast Handlers ────────────────────────────────────


async def broadcast_start(update: Update, context) -> int:
    telegram_id = update.effective_user.id
    user = database.get_user(telegram_id)

    if not user or user.get("role") not in ("admin",):
        await update.message.reply_text(
            "⛔ Доступ к рассылкам только для администраторов.\n"
            "Обратитесь к администратору для получения прав."
        )
        return ConversationHandler.END

    context.user_data["bc"] = {
        "text": "",
        "parse_mode": "HTML",
        "photo_file_id": None,
        "buttons": [],
        "filter_type": "all",
        "filter_value": None,
    }

    await update.message.reply_text(
        "📨 *Создание рассылки*\n\n"
        "Введите текст сообщения\\. Поддерживается HTML\\-разметка:\n\n"
        "`<b>жирный</b>`\n"
        "`<i>курсив</i>`\n"
        "`<u>подчёркнутый</u>`\n"
        "`<s>зачёркнутый</s>`\n"
        "`<a href=\"url\">ссылка</a>`\n"
        "`<code>моноширинный</code>`\n\n"
        "Отправьте /cancel для отмены\\.",
        parse_mode="MarkdownV2",
    )
    return BC_TEXT


async def bc_text_received(update: Update, context) -> int:
    context.user_data["bc"]["text"] = update.message.text or ""
    if update.message.text_html:
        context.user_data["bc"]["text"] = update.message.text_html

    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("📷 Добавить фото", callback_data="bc_add_photo"),
            InlineKeyboardButton("🔘 Добавить кнопки", callback_data="bc_add_buttons"),
        ],
        [
            InlineKeyboardButton("🎯 Выбрать аудиторию", callback_data="bc_filter"),
        ],
        [
            InlineKeyboardButton("👁 Превью", callback_data="bc_preview"),
            InlineKeyboardButton("📤 Отправить", callback_data="bc_send"),
        ],
        [
            InlineKeyboardButton("❌ Отмена", callback_data="bc_cancel"),
        ],
    ])

    await update.message.reply_text(
        "✏️ Текст сохранён. Что дальше?",
        reply_markup=keyboard,
    )
    return BC_FORMATTING


async def bc_formatting_callback(update: Update, context) -> int:
    query = update.callback_query
    await query.answer()

    if query.data == "bc_add_photo":
        await query.message.reply_text(
            "📷 Отправьте фото для рассылки.\n"
            "Или /skip чтобы пропустить."
        )
        return BC_PHOTO

    elif query.data == "bc_add_buttons":
        await query.message.reply_text(
            "🔘 Введите текст кнопки (например: «Перейти на сайт»).\n"
            "Или /skip чтобы пропустить."
        )
        return BC_BUTTON_TEXT

    elif query.data == "bc_filter":
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("👥 Все пользователи", callback_data="filter_all")],
            [InlineKeyboardButton("◆ Бронза", callback_data="filter_Бронза")],
            [InlineKeyboardButton("◈ Серебро", callback_data="filter_Серебро")],
            [InlineKeyboardButton("✦ Золото", callback_data="filter_Золото")],
            [InlineKeyboardButton("📊 Активные за 30 дней", callback_data="filter_active")],
        ])
        await query.message.reply_text(
            "🎯 Выберите аудиторию рассылки:",
            reply_markup=keyboard,
        )
        return BC_FILTER

    elif query.data == "bc_preview":
        return await _send_preview(query.message, context)

    elif query.data == "bc_send":
        return await _execute_broadcast(query.message, context)

    elif query.data == "bc_cancel":
        await query.message.reply_text("❌ Рассылка отменена.")
        return ConversationHandler.END

    return BC_FORMATTING


async def bc_photo_received(update: Update, context) -> int:
    if update.message.text and update.message.text.lower() == "/skip":
        pass
    elif update.message.photo:
        context.user_data["bc"]["photo_file_id"] = update.message.photo[-1].file_id
    else:
        await update.message.reply_text("Отправьте фото или /skip.")
        return BC_PHOTO

    return await _show_bc_menu(update.message, context)


async def bc_button_text_received(update: Update, context) -> int:
    if update.message.text and update.message.text.lower() == "/skip":
        return await _show_bc_menu(update.message, context)

    context.user_data["bc"]["_pending_button_text"] = update.message.text
    await update.message.reply_text(
        "🔗 Теперь введите URL для этой кнопки:"
    )
    return BC_BUTTON_URL


async def bc_button_url_received(update: Update, context) -> int:
    url = update.message.text.strip()
    btn_text = context.user_data["bc"].pop("_pending_button_text", "Кнопка")

    context.user_data["bc"]["buttons"].append({
        "text": btn_text,
        "url": url,
    })

    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("➕ Ещё кнопку", callback_data="bc_more_btn")],
        [InlineKeyboardButton("✅ Готово", callback_data="bc_btn_done")],
    ])
    await update.message.reply_text(
        f"Кнопка «{btn_text}» → {url} добавлена.\n"
        f"Всего кнопок: {len(context.user_data['bc']['buttons'])}",
        reply_markup=keyboard,
    )
    return BC_BUTTONS


async def bc_buttons_callback(update: Update, context) -> int:
    query = update.callback_query
    await query.answer()

    if query.data == "bc_more_btn":
        await query.message.reply_text(
            "🔘 Введите текст следующей кнопки:"
        )
        return BC_BUTTON_TEXT
    else:
        return await _show_bc_menu(query.message, context)


async def bc_filter_callback(update: Update, context) -> int:
    query = update.callback_query
    await query.answer()

    if query.data == "filter_all":
        context.user_data["bc"]["filter_type"] = "all"
        context.user_data["bc"]["filter_value"] = None
        label = "Все пользователи"
    elif query.data == "filter_active":
        context.user_data["bc"]["filter_type"] = "active"
        context.user_data["bc"]["filter_value"] = None
        label = "Активные за 30 дней"
    else:
        level = query.data.replace("filter_", "")
        context.user_data["bc"]["filter_type"] = "level"
        context.user_data["bc"]["filter_value"] = level
        label = f"Уровень: {level}"

    await query.message.reply_text(f"🎯 Аудитория: {label}")
    return await _show_bc_menu(query.message, context)


async def _show_bc_menu(message, context) -> int:
    bc = context.user_data.get("bc", {})
    summary = f"📝 Текст: {bc['text'][:80]}{'...' if len(bc['text']) > 80 else ''}\n"
    summary += f"📷 Фото: {'Да' if bc['photo_file_id'] else 'Нет'}\n"
    summary += f"🔘 Кнопок: {len(bc['buttons'])}\n"
    summary += f"🎯 Аудитория: {bc['filter_type']}"
    if bc.get("filter_value"):
        summary += f" ({bc['filter_value']})"

    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("📷 Фото", callback_data="bc_add_photo"),
            InlineKeyboardButton("🔘 Кнопки", callback_data="bc_add_buttons"),
        ],
        [
            InlineKeyboardButton("🎯 Аудитория", callback_data="bc_filter"),
        ],
        [
            InlineKeyboardButton("👁 Превью", callback_data="bc_preview"),
            InlineKeyboardButton("📤 Отправить", callback_data="bc_send"),
        ],
        [
            InlineKeyboardButton("❌ Отмена", callback_data="bc_cancel"),
        ],
    ])

    await message.reply_text(summary, reply_markup=keyboard)
    return BC_FORMATTING


async def _send_preview(message, context) -> int:
    bc = context.user_data.get("bc", {})
    text = bc.get("text", "")

    inline_buttons = []
    for btn in bc.get("buttons", []):
        inline_buttons.append(
            [InlineKeyboardButton(btn["text"], url=btn["url"])]
        )
    inline_buttons.append(
        [InlineKeyboardButton("↩️ Назад к редактору", callback_data="bc_back")]
    )
    reply_markup = InlineKeyboardMarkup(inline_buttons)

    try:
        if bc.get("photo_file_id"):
            await message.reply_photo(
                photo=bc["photo_file_id"],
                caption=text,
                parse_mode=ParseMode.HTML,
                reply_markup=reply_markup,
            )
        else:
            await message.reply_text(
                f"👁 *Превью рассылки:*\n\n{text}",
                parse_mode=ParseMode.HTML,
                reply_markup=reply_markup,
            )
    except Exception as e:
        await message.reply_text(
            f"⚠️ Ошибка отображения превью: {e}\n"
            "Проверьте HTML-разметку текста."
        )

    return BC_FORMATTING


async def bc_preview_callback(update: Update, context) -> int:
    query = update.callback_query
    await query.answer()
    if query.data == "bc_back":
        return await _show_bc_menu(query.message, context)
    return BC_FORMATTING


async def _execute_broadcast(message, context) -> int:
    bc = context.user_data.get("bc", {})
    admin_id = message.chat_id

    # Save to DB
    broadcast = database.create_broadcast(
        admin_telegram_id=admin_id,
        text=bc["text"],
        parse_mode=bc["parse_mode"],
        photo_file_id=bc.get("photo_file_id"),
        buttons=bc.get("buttons", []),
        filter_type=bc["filter_type"],
        filter_value=bc.get("filter_value"),
    )

    # Get recipients
    recipients = database.get_broadcast_recipients(
        bc["filter_type"], bc.get("filter_value")
    )

    if not recipients:
        await message.reply_text("⚠️ Нет получателей для данного фильтра.")
        return ConversationHandler.END

    await message.reply_text(
        f"📤 Начинаю рассылку...\n"
        f"Получателей: {len(recipients)}"
    )

    # Build inline keyboard
    inline_buttons = []
    for btn in bc.get("buttons", []):
        inline_buttons.append(
            [InlineKeyboardButton(btn["text"], url=btn["url"])]
        )
    reply_markup = InlineKeyboardMarkup(inline_buttons) if inline_buttons else None

    successful = 0
    failed = 0

    for tid in recipients:
        try:
            if bc.get("photo_file_id"):
                await context.bot.send_photo(
                    chat_id=tid,
                    photo=bc["photo_file_id"],
                    caption=bc["text"],
                    parse_mode=ParseMode.HTML,
                    reply_markup=reply_markup,
                )
            else:
                await context.bot.send_message(
                    chat_id=tid,
                    text=bc["text"],
                    parse_mode=ParseMode.HTML,
                    reply_markup=reply_markup,
                )
            successful += 1
        except Exception as e:
            logger.warning("Broadcast failed for %s: %s", tid, e)
            failed += 1
        await asyncio.sleep(0.05)

    database.update_broadcast_status(
        broadcast["id"], "sent",
        total=len(recipients),
        successful=successful,
        failed=failed,
    )

    await message.reply_text(
        f"✅ Рассылка завершена!\n\n"
        f"📤 Отправлено: {successful}\n"
        f"❌ Ошибок: {failed}\n"
        f"📊 Всего: {len(recipients)}"
    )
    return ConversationHandler.END


async def bc_cancel(update: Update, context) -> int:
    await update.message.reply_text(
        "❌ Рассылка отменена.",
        reply_markup=ReplyKeyboardRemove(),
    )
    return ConversationHandler.END


# ─── Admin Helpers ──────────────────────────────────────────


async def admin_cmd(update: Update, context) -> None:
    telegram_id = update.effective_user.id
    user = database.get_user(telegram_id)
    if not user:
        await update.message.reply_text("Сначала зарегистрируйтесь: /start")
        return

    stats = database.get_admin_stats()
    await update.message.reply_text(
        f"📊 *Статистика FLove*\n\n"
        f"👥 Клиентов: *{stats['total_users']}*\n"
        f"💰 Активных бонусов: *{stats['total_bonuses']} р\\.*\n"
        f"🧾 Транзакций сегодня: *{stats['txn_today']}*\n"
        f"👥 Рефералов всего: *{stats['ref_total']}*\n"
        f"📈 Новых за месяц: *{stats['new_this_month']}*",
        parse_mode="MarkdownV2",
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton(
                "📊 Открыть панель",
                web_app=WebAppInfo(
                    url=f"{WEBAPP_URL}/admin.html?user_id={telegram_id}"
                ),
            )],
        ]),
    )


# ─── Utility ────────────────────────────────────────────────


def _escape_md(text: str) -> str:
    special = r"_*[]()~`>#+-=|{}.!"
    return "".join(f"\\{c}" if c in special else c for c in str(text))


# ─── Main ───────────────────────────────────────────────────


def main() -> None:
    if not BOT_TOKEN:
        raise SystemExit("BOT_TOKEN не задан. Укажите его в .env")
    if not WEBAPP_URL:
        raise SystemExit("WEBAPP_URL не задан. Укажите его в .env")

    database.init_db()

    app = Application.builder().token(BOT_TOKEN).build()

    # Registration conversation
    reg_conv = ConversationHandler(
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

    # Broadcast conversation
    bc_conv = ConversationHandler(
        entry_points=[CommandHandler("broadcast", broadcast_start)],
        states={
            BC_TEXT: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, bc_text_received)
            ],
            BC_FORMATTING: [
                CallbackQueryHandler(
                    bc_formatting_callback,
                    pattern=r"^bc_(add_photo|add_buttons|filter|preview|send|cancel)$",
                ),
            ],
            BC_PHOTO: [
                MessageHandler(
                    filters.PHOTO | (filters.TEXT & ~filters.COMMAND),
                    bc_photo_received,
                ),
                CommandHandler("skip", bc_photo_received),
            ],
            BC_BUTTON_TEXT: [
                MessageHandler(
                    filters.TEXT & ~filters.COMMAND, bc_button_text_received
                ),
                CommandHandler("skip", lambda u, c: _show_bc_menu(u.message, c)),
            ],
            BC_BUTTON_URL: [
                MessageHandler(
                    filters.TEXT & ~filters.COMMAND, bc_button_url_received
                ),
            ],
            BC_BUTTONS: [
                CallbackQueryHandler(
                    bc_buttons_callback, pattern=r"^bc_(more_btn|btn_done)$"
                ),
            ],
            BC_FILTER: [
                CallbackQueryHandler(
                    bc_filter_callback, pattern=r"^filter_"
                ),
            ],
            BC_PREVIEW: [
                CallbackQueryHandler(
                    bc_preview_callback, pattern=r"^bc_back$"
                ),
            ],
        },
        fallbacks=[CommandHandler("cancel", bc_cancel)],
    )

    app.add_handler(reg_conv)
    app.add_handler(bc_conv)
    app.add_handler(CommandHandler("menu", menu))
    app.add_handler(CommandHandler("referral", referral_cmd))
    app.add_handler(CommandHandler("admin", admin_cmd))
    app.add_handler(CallbackQueryHandler(
        referral_callback, pattern=r"^(my_referrals|share_referral)$"
    ))

    logger.info("FLove бот запущен! (production)")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
