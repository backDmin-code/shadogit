"""
FLove — Telegram-бот для карты лояльности цветочного кафе.

Production: регистрация, реферальная система, рассылки,
role-based меню (клиент / кассир / админ).
"""

import os
import json
import asyncio
import logging
from datetime import datetime, timezone, timedelta

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

# Parse admin IDs from env
_admin_ids_raw = os.getenv("ADMIN_IDS", "")
ADMIN_IDS: set[int] = set()
for _aid in _admin_ids_raw.split(","):
    _aid = _aid.strip()
    if _aid.isdigit():
        ADMIN_IDS.add(int(_aid))

# Registration states
PHONE, FIRST_NAME, LAST_NAME, BIRTHDAY = range(4)

# Broadcast states
(BC_TEXT, BC_FORMATTING, BC_PHOTO, BC_BUTTONS, BC_BUTTON_TEXT,
 BC_BUTTON_URL, BC_FILTER, BC_PREVIEW) = range(10, 18)


# ─── Typing Effect ──────────────────────────────────────────


async def _typing(chat_id: int, bot, seconds: float = 1.5):
    """Send 'typing...' action and wait for a natural delay."""
    await bot.send_chat_action(chat_id=chat_id, action="typing")
    await asyncio.sleep(seconds)


# ─── Keyboards ──────────────────────────────────────────────


def _get_user_role(telegram_id: int) -> str:
    """Determine effective role: env admins always get 'admin'."""
    if telegram_id in ADMIN_IDS:
        user = database.get_user(telegram_id)
        if user and user.get("role") != "admin":
            database.update_user_role(telegram_id, "admin")
        return "admin"
    user = database.get_user(telegram_id)
    return user.get("role", "client") if user else "client"


def _make_menu_keyboard(telegram_id: int) -> InlineKeyboardMarkup:
    role = _get_user_role(telegram_id)
    buttons = [
        [
            InlineKeyboardButton(
                "🌸 Открыть карту лояльности",
                web_app=WebAppInfo(
                    url=f"{WEBAPP_URL}/client.html?user_id={telegram_id}"
                ),
            )
        ],
    ]
    if role in ("admin", "cashier"):
        buttons.append([
            InlineKeyboardButton(
                "📷 Сканировать QR",
                web_app=WebAppInfo(url=f"{WEBAPP_URL}/scanner.html"),
            )
        ])
    if role == "admin":
        buttons.append([
            InlineKeyboardButton(
                "⚙️ Панель управления",
                web_app=WebAppInfo(
                    url=f"{WEBAPP_URL}/admin.html?user_id={telegram_id}"
                ),
            )
        ])
    return InlineKeyboardMarkup(buttons)


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
        await _typing(update.effective_chat.id, context.bot, 1.0)
        await update.message.reply_text(
            f"🌸 <b>С возвращением, {existing['first_name']}!</b>\n\n"
            "Рады видеть вас снова в <i>FLove</i> 💐",
            parse_mode=ParseMode.HTML,
            reply_markup=_make_menu_keyboard(telegram_id),
        )
        return ConversationHandler.END

    keyboard = [
        [KeyboardButton("📱 Поделиться номером", request_contact=True)]
    ]
    await _typing(update.effective_chat.id, context.bot, 1.5)
    await update.message.reply_text(
        "🌸 <b>Добро пожаловать в FLove!</b>\n\n"
        "Мы рады видеть вас ✨\n"
        "Для создания вашей <b>персональной карты лояльности</b>, "
        "пожалуйста, поделитесь номером телефона 👇",
        parse_mode=ParseMode.HTML,
        reply_markup=ReplyKeyboardMarkup(
            keyboard, resize_keyboard=True, one_time_keyboard=True
        ),
    )
    return PHONE


async def phone_received(update: Update, context) -> int:
    contact = update.message.contact
    if contact is None:
        await _typing(update.effective_chat.id, context.bot, 1.0)
        await update.message.reply_text(
            "☝️ Пожалуйста, используйте <b>кнопку ниже</b>, чтобы поделиться номером.",
            parse_mode=ParseMode.HTML,
        )
        return PHONE

    context.user_data["phone"] = contact.phone_number
    logger.info("Получен телефон: %s", contact.phone_number)

    await _typing(update.effective_chat.id, context.bot, 1.5)
    await update.message.reply_text(
        "✅ <b>Отлично!</b>\n\n"
        "Теперь введите ваше <b>имя</b> ✍️",
        parse_mode=ParseMode.HTML,
        reply_markup=ReplyKeyboardRemove(),
    )
    return FIRST_NAME


async def first_name_received(update: Update, context) -> int:
    context.user_data["first_name"] = update.message.text.strip()
    await _typing(update.effective_chat.id, context.bot, 1.2)
    await update.message.reply_text(
        f"👋 Приятно познакомиться, <b>{context.user_data['first_name']}</b>!\n\n"
        "Теперь введите вашу <b>фамилию</b> ✍️",
        parse_mode=ParseMode.HTML,
    )
    return LAST_NAME


async def last_name_received(update: Update, context) -> int:
    context.user_data["last_name"] = update.message.text.strip()
    await _typing(update.effective_chat.id, context.bot, 1.2)
    await update.message.reply_text(
        "🎂 <b>Последний шаг!</b>\n\n"
        "Введите вашу <b>дату рождения</b>\n"
        "<i>в формате ДД.ММ.ГГГГ</i>\n\n"
        "💡 <i>Мы подготовим для вас особый подарок!</i>",
        parse_mode=ParseMode.HTML,
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
            "\n\n🎁 <i>Вы получили дополнительные </i><b>3 бонуса</b>"
            "<i> за регистрацию по приглашению!</i>"
        )
        # Notify referrer
        try:
            await _typing(referred_by, context.bot, 1.0)
            await context.bot.send_message(
                referred_by,
                f"🎉 <b>{name} {surname}</b> зарегистрировался по вашей ссылке!\n"
                f"💰 Вам начислено <b>5 бонусных рублей</b>.",
                parse_mode=ParseMode.HTML,
            )
        except Exception:
            pass

    await _typing(update.effective_chat.id, context.bot, 2.0)
    await update.message.reply_text(
        f"🎉 <b>{name}, ваша карта лояльности готова!</b>{ref_text}\n\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        "💳 <b>Карта:</b> активирована\n"
        "🌟 <b>Уровень:</b> Бронза\n"
        "💰 <b>Бонусы:</b> 3 р.\n"
        "━━━━━━━━━━━━━━━━━━━━\n\n"
        "Для открытия нажмите кнопку ниже 👇",
        parse_mode=ParseMode.HTML,
        reply_markup=_make_menu_keyboard(telegram_id),
    )
    return ConversationHandler.END


async def cancel(update: Update, context) -> int:
    await _typing(update.effective_chat.id, context.bot, 1.0)
    await update.message.reply_text(
        "❌ <b>Регистрация отменена.</b>\n\n"
        "Введите /start, чтобы начать заново 🔄",
        parse_mode=ParseMode.HTML,
        reply_markup=ReplyKeyboardRemove(),
    )
    return ConversationHandler.END


async def menu(update: Update, context) -> None:
    telegram_id = update.effective_user.id
    await _typing(update.effective_chat.id, context.bot, 1.0)
    await update.message.reply_text(
        "🌸 <b>Меню FLove</b>\n\n"
        "Выберите действие 👇",
        parse_mode=ParseMode.HTML,
        reply_markup=_make_menu_keyboard(telegram_id),
    )


# ─── Referral Handlers ─────────────────────────────────────


async def referral_cmd(update: Update, context) -> None:
    telegram_id = update.effective_user.id
    user = database.get_user(telegram_id)
    if not user:
        await _typing(update.effective_chat.id, context.bot, 1.0)
        await update.message.reply_text(
            "☝️ Сначала зарегистрируйтесь: /start",
            parse_mode=ParseMode.HTML,
        )
        return

    bot_info = await context.bot.get_me()
    ref_link = f"https://t.me/{bot_info.username}?start=ref_{user['referral_code']}"
    stats = database.get_referral_stats(telegram_id)

    await _typing(update.effective_chat.id, context.bot, 1.5)
    await update.message.reply_text(
        f"👥 <b>Реферальная программа FLove</b>\n\n"
        f"🔗 Ваша ссылка для приглашения:\n"
        f"<code>{ref_link}</code>\n\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"📊 Приглашено друзей: <b>{stats['total']}</b>\n"
        f"💰 Заработано бонусов: <b>{stats['total_bonus']} р.</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━\n\n"
        f"💡 За каждого друга вы получаете <b>5 р.</b>,\n"
        f"а ваш друг — <b>3 р.</b> при регистрации!",
        parse_mode=ParseMode.HTML,
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
            await _typing(query.message.chat_id, context.bot, 1.0)
            await query.message.reply_text(
                "🤷 У вас пока нет приглашённых друзей.\n\n"
                "<i>Поделитесь своей ссылкой и получайте бонусы!</i> 👥",
                parse_mode=ParseMode.HTML,
            )
            return

        await _typing(query.message.chat_id, context.bot, 1.5)
        text = "👥 <b>Ваши рефералы:</b>\n\n"
        for i, ref in enumerate(referrals[:15], 1):
            text += (
                f"{i}. {ref['first_name']} "
                f"{ref['last_name']} — "
                f"<b>+{ref['referrer_bonus']} р.</b>\n"
            )
        await query.message.reply_text(text, parse_mode=ParseMode.HTML)

    elif query.data == "share_referral":
        bot_info = await context.bot.get_me()
        ref_link = (
            f"https://t.me/{bot_info.username}?start=ref_{user['referral_code']}"
        )
        await _typing(query.message.chat_id, context.bot, 1.0)
        await query.message.reply_text(
            f"📤 <b>Отправьте эту ссылку друзьям:</b>\n\n"
            f"<code>{ref_link}</code>\n\n"
            f"💰 За каждого друга — <b>5 бонусных рублей!</b>",
            parse_mode=ParseMode.HTML,
        )


# ─── Broadcast Handlers ────────────────────────────────────


async def broadcast_start(update: Update, context) -> int:
    telegram_id = update.effective_user.id
    user = database.get_user(telegram_id)

    if not user or user.get("role") not in ("admin",):
        await _typing(update.effective_chat.id, context.bot, 1.0)
        await update.message.reply_text(
            "⛔ <b>Доступ запрещён</b>\n\n"
            "<i>Рассылки доступны только администраторам.\n"
            "Обратитесь к администратору для получения прав.</i>",
            parse_mode=ParseMode.HTML,
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

    await _typing(update.effective_chat.id, context.bot, 1.5)
    await update.message.reply_text(
        "📨 <b>Создание рассылки</b>\n\n"
        "Введите текст сообщения. Поддерживается HTML-разметка:\n\n"
        "<code>&lt;b&gt;жирный&lt;/b&gt;</code>\n"
        "<code>&lt;i&gt;курсив&lt;/i&gt;</code>\n"
        "<code>&lt;u&gt;подчёркнутый&lt;/u&gt;</code>\n"
        "<code>&lt;s&gt;зачёркнутый&lt;/s&gt;</code>\n\n"
        "Отправьте /cancel для отмены.",
        parse_mode=ParseMode.HTML,
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

    await _typing(update.effective_chat.id, context.bot, 1.0)
    await update.message.reply_text(
        "✏️ <b>Текст сохранён.</b> Что дальше?",
        parse_mode=ParseMode.HTML,
        reply_markup=keyboard,
    )
    return BC_FORMATTING


async def bc_formatting_callback(update: Update, context) -> int:
    query = update.callback_query
    await query.answer()

    if query.data == "bc_add_photo":
        await _typing(query.message.chat_id, context.bot, 1.0)
        await query.message.reply_text(
            "📷 <b>Отправьте фото</b> для рассылки.\n"
            "<i>Или /skip чтобы пропустить.</i>",
            parse_mode=ParseMode.HTML,
        )
        return BC_PHOTO

    elif query.data == "bc_add_buttons":
        await _typing(query.message.chat_id, context.bot, 1.0)
        await query.message.reply_text(
            "🔘 Введите <b>текст кнопки</b>\n"
            "<i>Например: «Перейти на сайт»</i>\n\n"
            "Или /skip чтобы пропустить.",
            parse_mode=ParseMode.HTML,
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
        await _typing(query.message.chat_id, context.bot, 1.0)
        await query.message.reply_text(
            "🎯 <b>Выберите аудиторию рассылки:</b>",
            parse_mode=ParseMode.HTML,
            reply_markup=keyboard,
        )
        return BC_FILTER

    elif query.data == "bc_preview":
        return await _send_preview(query.message, context)

    elif query.data == "bc_send":
        return await _execute_broadcast(query.message, context)

    elif query.data == "bc_cancel":
        await query.message.reply_text(
            "❌ <b>Рассылка отменена.</b>",
            parse_mode=ParseMode.HTML,
        )
        return ConversationHandler.END

    return BC_FORMATTING


async def bc_photo_received(update: Update, context) -> int:
    if update.message.text and update.message.text.lower() == "/skip":
        pass
    elif update.message.photo:
        context.user_data["bc"]["photo_file_id"] = update.message.photo[-1].file_id
    else:
        await update.message.reply_text(
            "☝️ Отправьте <b>фото</b> или /skip.",
            parse_mode=ParseMode.HTML,
        )
        return BC_PHOTO

    return await _show_bc_menu(update.message, context)


async def bc_button_text_received(update: Update, context) -> int:
    if update.message.text and update.message.text.lower() == "/skip":
        return await _show_bc_menu(update.message, context)

    context.user_data["bc"]["_pending_button_text"] = update.message.text
    await _typing(update.effective_chat.id, context.bot, 1.0)
    await update.message.reply_text(
        "🔗 Теперь введите <b>URL</b> для этой кнопки:",
        parse_mode=ParseMode.HTML,
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
    await _typing(update.effective_chat.id, context.bot, 1.0)
    await update.message.reply_text(
        f"✅ Кнопка <b>«{btn_text}»</b> добавлена\n"
        f"<i>Всего кнопок: {len(context.user_data['bc']['buttons'])}</i>",
        parse_mode=ParseMode.HTML,
        reply_markup=keyboard,
    )
    return BC_BUTTONS


async def bc_buttons_callback(update: Update, context) -> int:
    query = update.callback_query
    await query.answer()

    if query.data == "bc_more_btn":
        await _typing(query.message.chat_id, context.bot, 1.0)
        await query.message.reply_text(
            "🔘 Введите <b>текст следующей кнопки</b>:",
            parse_mode=ParseMode.HTML,
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

    await query.message.reply_text(
        f"🎯 Аудитория: <b>{label}</b>",
        parse_mode=ParseMode.HTML,
    )
    return await _show_bc_menu(query.message, context)


async def _show_bc_menu(message, context) -> int:
    bc = context.user_data.get("bc", {})
    text_preview = bc['text'].replace('<', '&lt;').replace('>', '&gt;')[:80]
    if len(bc['text']) > 80:
        text_preview += '...'
    summary = f"📝 <b>Текст:</b> {text_preview}\n"
    summary += f"📷 <b>Фото:</b> {'Да' if bc['photo_file_id'] else 'Нет'}\n"
    summary += f"🔘 <b>Кнопок:</b> {len(bc['buttons'])}\n"
    summary += f"🎯 <b>Аудитория:</b> {bc['filter_type']}"
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

    await message.reply_text(summary, parse_mode=ParseMode.HTML, reply_markup=keyboard)
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
                f"👁 <b>Превью рассылки:</b>\n\n{text}",
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
        await message.reply_text(
            "⚠️ <b>Нет получателей</b> для данного фильтра.",
            parse_mode=ParseMode.HTML,
        )
        return ConversationHandler.END

    await message.reply_text(
        f"📤 <b>Начинаю рассылку...</b>\n"
        f"<i>Получателей: {len(recipients)}</i>",
        parse_mode=ParseMode.HTML,
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

    await _typing(message.chat_id, context.bot, 1.5)
    await message.reply_text(
        f"🎉 <b>Рассылка завершена!</b>\n\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"📤 Отправлено: <b>{successful}</b>\n"
        f"❌ Ошибок: <b>{failed}</b>\n"
        f"📊 Всего: <b>{len(recipients)}</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━",
        parse_mode=ParseMode.HTML,
    )
    return ConversationHandler.END


async def bc_cancel(update: Update, context) -> int:
    await _typing(update.effective_chat.id, context.bot, 1.0)
    await update.message.reply_text(
        "❌ <b>Рассылка отменена.</b>",
        parse_mode=ParseMode.HTML,
        reply_markup=ReplyKeyboardRemove(),
    )
    return ConversationHandler.END


# ─── Admin Helpers ──────────────────────────────────────────


async def admin_cmd(update: Update, context) -> None:
    telegram_id = update.effective_user.id
    user = database.get_user(telegram_id)
    if not user:
        await _typing(update.effective_chat.id, context.bot, 1.0)
        await update.message.reply_text(
            "☝️ Сначала зарегистрируйтесь: /start",
            parse_mode=ParseMode.HTML,
        )
        return

    stats = database.get_admin_stats()
    await _typing(update.effective_chat.id, context.bot, 1.5)
    await update.message.reply_text(
        f"📊 <b>Статистика FLove</b>\n\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"👥 Клиентов: <b>{stats['total_users']}</b>\n"
        f"💰 Активных бонусов: <b>{stats['total_bonuses']} р.</b>\n"
        f"🧾 Транзакций сегодня: <b>{stats['txn_today']}</b>\n"
        f"👥 Рефералов всего: <b>{stats['ref_total']}</b>\n"
        f"📈 Новых за месяц: <b>{stats['new_this_month']}</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━",
        parse_mode=ParseMode.HTML,
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


# ─── Smart Bonus Expiry Notifications ───────────────────────


_TYPE_NAMES = {
    "welcome": "приветственный",
    "referral": "реферальный",
    "purchase": "за покупку",
    "manual": "ручной",
}


async def _send_expiry_notification(bot, user_data: dict) -> bool:
    tid = user_data["telegram_id"]
    name = user_data["first_name"]
    total = user_data["total_expiring"]
    entries = user_data["expiring_entries"]

    if database.was_notified(tid, "bonus_expiry", within_hours=24):
        return False

    details = ""
    for e in entries:
        tname = _TYPE_NAMES.get(e["type"], e["type"])
        details += f"  • {tname}: <b>{e['remaining']} р.</b> — через {e['days_left']} дн.\n"

    try:
        await bot.send_chat_action(chat_id=tid, action="typing")
        await asyncio.sleep(1.0)
        await bot.send_message(
            chat_id=tid,
            text=(
                f"⏳ <b>{name}, ваши бонусы скоро сгорят!</b>\n\n"
                f"━━━━━━━━━━━━━━━━━━━━\n"
                f"{details}"
                f"━━━━━━━━━━━━━━━━━━━━\n\n"
                f"💸 Всего сгорит: <b>{total} р.</b>\n\n"
                f"🛍 <i>Успейте использовать бонусы при следующей покупке!\n"
                f"Каждый бонус = 1 рубль скидки.</i>\n\n"
                f"💡 Загляните к нам — побалуйте себя букетом "
                f"и не дайте бонусам пропасть 🌸"
            ),
            parse_mode=ParseMode.HTML,
        )
        database.log_notification(tid, "bonus_expiry")
        return True
    except Exception as e:
        logger.warning(f"Failed to send expiry notification to {tid}: {e}")
        return False


# Minsk timezone (UTC+3)
_MINSK_TZ = timezone(timedelta(hours=3))


def _is_working_hours() -> bool:
    now = datetime.now(_MINSK_TZ)
    return 9 <= now.hour < 20


async def _check_and_notify_expiring(context) -> None:
    if not _is_working_hours():
        return

    settings = database.get_bonus_expiry_settings()
    if settings.get("bonus_expiry_enabled") != "1":
        return
    if settings.get("bonus_expiry_notify_enabled") != "1":
        return

    warn_days = int(settings.get("bonus_expiry_warn_days", "3"))
    users = database.get_users_with_expiring_bonuses(warn_days)

    sent = 0
    for u in users:
        if await _send_expiry_notification(context.bot, u):
            sent += 1
            await asyncio.sleep(0.5)

    if sent:
        logger.info(f"Expiry notifications sent: {sent}")


async def _auto_burn_expired(context) -> None:
    settings = database.get_bonus_expiry_settings()
    if settings.get("bonus_expiry_enabled") != "1":
        return

    result = database.burn_expired_bonuses()
    if result["burned_entries"] > 0:
        logger.info(
            f"Auto-burned {result['burned_entries']} entries, "
            f"total {result['total_burned']} р., "
            f"{result['users_affected']} users affected"
        )

        admin_ids = os.getenv("ADMIN_IDS", "")
        if admin_ids:
            for aid in admin_ids.split(","):
                aid = aid.strip()
                if aid:
                    try:
                        await context.bot.send_message(
                            chat_id=int(aid),
                            text=(
                                f"🔥 <b>Автосжигание бонусов</b>\n\n"
                                f"━━━━━━━━━━━━━━━━━━━━\n"
                                f"📊 Записей: <b>{result['burned_entries']}</b>\n"
                                f"💸 Сожжено: <b>{result['total_burned']} р.</b>\n"
                                f"👥 Клиентов: <b>{result['users_affected']}</b>\n"
                                f"━━━━━━━━━━━━━━━━━━━━"
                            ),
                            parse_mode=ParseMode.HTML,
                        )
                    except Exception:
                        pass


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

    # Scheduled jobs: expiry notifications every 6 hours, auto-burn every hour
    if app.job_queue:
        app.job_queue.run_repeating(
            _check_and_notify_expiring,
            interval=6 * 3600,
            first=60,
            name="expiry_notifications",
        )
        app.job_queue.run_repeating(
            _auto_burn_expired,
            interval=3600,
            first=120,
            name="auto_burn",
        )
        logger.info("Scheduled jobs: expiry_notifications (6h), auto_burn (1h)")

    logger.info("FLove бот запущен! (production)")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
