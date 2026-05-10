"""SQLite database for FLove loyalty system — production version."""

import os
import json
import sqlite3
import secrets
import string
from datetime import datetime, timedelta

DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "flove.db"))


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    conn = get_db()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id     INTEGER UNIQUE NOT NULL,
            phone           TEXT,
            first_name      TEXT,
            last_name       TEXT,
            birthday        TEXT,
            bonuses         REAL    DEFAULT 0,
            total_purchases REAL    DEFAULT 0,
            cashback_pct    REAL    DEFAULT 2,
            level           TEXT    DEFAULT 'Бронза',
            role            TEXT    DEFAULT 'client',
            referral_code   TEXT    UNIQUE,
            referred_by     INTEGER,
            is_blocked      INTEGER DEFAULT 0,
            created_at      TEXT    DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            user_telegram_id  INTEGER NOT NULL,
            type              TEXT    NOT NULL,
            amount            REAL    NOT NULL DEFAULT 0,
            bonuses_change    REAL    NOT NULL DEFAULT 0,
            description       TEXT,
            created_at        TEXT    DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id)
        );

        CREATE TABLE IF NOT EXISTS referrals (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
            referrer_telegram_id  INTEGER NOT NULL,
            referred_telegram_id  INTEGER NOT NULL,
            referrer_bonus        REAL    DEFAULT 0,
            referred_bonus        REAL    DEFAULT 0,
            created_at            TEXT    DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (referrer_telegram_id) REFERENCES users(telegram_id),
            FOREIGN KEY (referred_telegram_id) REFERENCES users(telegram_id)
        );

        CREATE TABLE IF NOT EXISTS broadcasts (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_telegram_id INTEGER NOT NULL,
            text              TEXT    NOT NULL DEFAULT '',
            parse_mode        TEXT    DEFAULT 'HTML',
            photo_file_id     TEXT,
            buttons           TEXT    DEFAULT '[]',
            filter_type       TEXT    DEFAULT 'all',
            filter_value      TEXT,
            status            TEXT    DEFAULT 'draft',
            scheduled_at      TEXT,
            sent_at           TEXT,
            total_recipients  INTEGER DEFAULT 0,
            successful        INTEGER DEFAULT 0,
            failed            INTEGER DEFAULT 0,
            created_at        TEXT    DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT
        );

        CREATE TABLE IF NOT EXISTS notifications_log (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_telegram_id INTEGER NOT NULL,
            type            TEXT    NOT NULL,
            sent_at         TEXT    DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id)
        );

        CREATE TABLE IF NOT EXISTS promotions (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            name            TEXT    NOT NULL,
            type            TEXT    NOT NULL DEFAULT 'cashback_multiplier',
            value           REAL    NOT NULL DEFAULT 2,
            min_purchase    REAL    DEFAULT 0,
            promo_code      TEXT    UNIQUE,
            max_uses        INTEGER DEFAULT 0,
            used_count      INTEGER DEFAULT 0,
            start_at        TEXT,
            end_at          TEXT,
            is_active       INTEGER DEFAULT 1,
            created_at      TEXT    DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS bonus_entries (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            user_telegram_id  INTEGER NOT NULL,
            type              TEXT    NOT NULL,
            amount            REAL    NOT NULL DEFAULT 0,
            remaining         REAL    NOT NULL DEFAULT 0,
            awarded_at        TEXT    DEFAULT (datetime('now','localtime')),
            expires_at        TEXT,
            burned            INTEGER DEFAULT 0,
            burned_at         TEXT,
            FOREIGN KEY (user_telegram_id) REFERENCES users(telegram_id)
        );
        """
    )
    # Migrate: add new columns if they don't exist yet (for upgrades from MVP)
    for col, coldef in [
        ("role", "TEXT DEFAULT 'client'"),
        ("referral_code", "TEXT"),
        ("referred_by", "INTEGER"),
        ("is_blocked", "INTEGER DEFAULT 0"),
    ]:
        try:
            conn.execute(f"ALTER TABLE users ADD COLUMN {col} {coldef}")
        except sqlite3.OperationalError:
            pass
    conn.commit()
    conn.close()


def _generate_referral_code(length: int = 8) -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))


def _recalc_level(conn: sqlite3.Connection, telegram_id: int) -> None:
    row = conn.execute(
        "SELECT total_purchases FROM users WHERE telegram_id=?", (telegram_id,)
    ).fetchone()
    if not row:
        return
    p = row["total_purchases"]
    if p >= 6000:
        level, cashback = "Золото", 10
    elif p >= 400:
        level, cashback = "Серебро", 5
    else:
        level, cashback = "Бронза", 2
    conn.execute(
        "UPDATE users SET level=?, cashback_pct=? WHERE telegram_id=?",
        (level, cashback, telegram_id),
    )


# Default expiration periods (days)
_EXPIRY_DEFAULTS = {
    "bonus_expiry_welcome": "14",
    "bonus_expiry_referral": "30",
    "bonus_expiry_purchase": "90",
    "bonus_expiry_enabled": "1",
    "bonus_expiry_warn_days": "3",
    "bonus_expiry_notify_enabled": "1",
}


def _get_expiry_days(conn: sqlite3.Connection, bonus_type: str) -> int | None:
    enabled = conn.execute(
        "SELECT value FROM settings WHERE key='bonus_expiry_enabled'"
    ).fetchone()
    if enabled and enabled["value"] == "0":
        return None
    key = f"bonus_expiry_{bonus_type}"
    row = conn.execute("SELECT value FROM settings WHERE key=?", (key,)).fetchone()
    if row:
        return int(row["value"])
    return int(_EXPIRY_DEFAULTS.get(key, "90"))


def _create_bonus_entry(
    conn: sqlite3.Connection,
    telegram_id: int,
    bonus_type: str,
    amount: float,
) -> None:
    if amount <= 0:
        return
    expiry_days = _get_expiry_days(conn, bonus_type)
    now = datetime.now()
    expires_at = None
    if expiry_days is not None:
        expires_at = (now + timedelta(days=expiry_days)).strftime("%Y-%m-%d %H:%M:%S")
    conn.execute(
        """INSERT INTO bonus_entries
           (user_telegram_id, type, amount, remaining, awarded_at, expires_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (telegram_id, bonus_type, amount, amount,
         now.strftime("%Y-%m-%d %H:%M:%S"), expires_at),
    )


def burn_expired_bonuses() -> dict:
    conn = get_db()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    expired = conn.execute(
        """SELECT id, user_telegram_id, remaining
           FROM bonus_entries
           WHERE burned = 0
             AND expires_at IS NOT NULL
             AND expires_at <= ?
             AND remaining > 0""",
        (now,),
    ).fetchall()

    total_burned = 0
    users_affected = set()
    for entry in expired:
        amount = entry["remaining"]
        tid = entry["user_telegram_id"]
        conn.execute(
            "UPDATE bonus_entries SET remaining=0, burned=1, burned_at=? WHERE id=?",
            (now, entry["id"]),
        )
        conn.execute(
            "UPDATE users SET bonuses = MAX(0, bonuses - ?) WHERE telegram_id=?",
            (amount, tid),
        )
        conn.execute(
            """INSERT INTO transactions
               (user_telegram_id, type, amount, bonuses_change, description)
               VALUES (?, 'burn', 0, ?, ?)""",
            (tid, -amount, f"Сгорание бонуса ({amount} р.)"),
        )
        total_burned += amount
        users_affected.add(tid)

    conn.commit()
    conn.close()
    return {
        "burned_entries": len(expired),
        "total_burned": round(total_burned, 2),
        "users_affected": len(users_affected),
    }


def get_bonus_entries(telegram_id: int) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        """SELECT * FROM bonus_entries
           WHERE user_telegram_id = ?
           ORDER BY awarded_at DESC""",
        (telegram_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_expiring_soon(days: int = 7) -> list[dict]:
    conn = get_db()
    future = (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    rows = conn.execute(
        """SELECT be.*, u.first_name, u.last_name
           FROM bonus_entries be
           JOIN users u ON u.telegram_id = be.user_telegram_id
           WHERE be.burned = 0
             AND be.remaining > 0
             AND be.expires_at IS NOT NULL
             AND be.expires_at > ?
             AND be.expires_at <= ?
           ORDER BY be.expires_at ASC""",
        (now, future),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_bonus_expiry_settings() -> dict:
    conn = get_db()
    result = {}
    for key, default in _EXPIRY_DEFAULTS.items():
        row = conn.execute(
            "SELECT value FROM settings WHERE key=?", (key,)
        ).fetchone()
        result[key] = row["value"] if row else default
    conn.close()
    return result


def get_users_with_expiring_bonuses(warn_days: int = 3) -> list[dict]:
    conn = get_db()
    now = datetime.now()
    future = (now + timedelta(days=warn_days)).strftime("%Y-%m-%d %H:%M:%S")
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    rows = conn.execute(
        """SELECT be.user_telegram_id, be.type, be.remaining, be.expires_at,
                  u.first_name, u.last_name, u.bonuses
           FROM bonus_entries be
           JOIN users u ON u.telegram_id = be.user_telegram_id
           WHERE be.burned = 0
             AND be.remaining > 0
             AND be.expires_at IS NOT NULL
             AND be.expires_at > ?
             AND be.expires_at <= ?
           ORDER BY be.expires_at ASC""",
        (now_str, future),
    ).fetchall()
    conn.close()

    user_map = {}
    for r in rows:
        tid = r["user_telegram_id"]
        if tid not in user_map:
            user_map[tid] = {
                "telegram_id": tid,
                "first_name": r["first_name"],
                "last_name": r["last_name"],
                "total_bonuses": r["bonuses"],
                "expiring_entries": [],
                "total_expiring": 0,
            }
        days_left = max(0, (datetime.strptime(r["expires_at"], "%Y-%m-%d %H:%M:%S") - now).days)
        user_map[tid]["expiring_entries"].append({
            "type": r["type"],
            "remaining": r["remaining"],
            "expires_at": r["expires_at"],
            "days_left": days_left,
        })
        user_map[tid]["total_expiring"] += r["remaining"]

    for u in user_map.values():
        u["total_expiring"] = round(u["total_expiring"], 2)

    return list(user_map.values())


# ─── Users ──────────────────────────────────────────────────


def create_user(
    telegram_id: int,
    phone: str,
    first_name: str,
    last_name: str,
    birthday: str,
    welcome_bonus: float = 3.0,
    referred_by: int | None = None,
) -> dict:
    conn = get_db()
    ref_code = _generate_referral_code()
    # Ensure unique referral code
    while conn.execute(
        "SELECT 1 FROM users WHERE referral_code=?", (ref_code,)
    ).fetchone():
        ref_code = _generate_referral_code()

    conn.execute(
        """INSERT OR IGNORE INTO users
           (telegram_id, phone, first_name, last_name, birthday, bonuses,
            referral_code, referred_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (telegram_id, phone, first_name, last_name, birthday, welcome_bonus,
         ref_code, referred_by),
    )
    if welcome_bonus > 0:
        conn.execute(
            """INSERT INTO transactions
               (user_telegram_id, type, amount, bonuses_change, description)
               VALUES (?, 'welcome', 0, ?, 'Приветственный бонус')""",
            (telegram_id, welcome_bonus),
        )
        _create_bonus_entry(conn, telegram_id, 'welcome', welcome_bonus)

    # Process referral bonus
    if referred_by:
        referrer_bonus = 5.0
        referred_bonus = 3.0
        conn.execute(
            "UPDATE users SET bonuses=bonuses+? WHERE telegram_id=?",
            (referrer_bonus, referred_by),
        )
        conn.execute(
            """INSERT INTO transactions
               (user_telegram_id, type, amount, bonuses_change, description)
               VALUES (?, 'referral', 0, ?, ?)""",
            (referred_by, referrer_bonus,
             f"Реферальный бонус за {first_name} {last_name}"),
        )
        _create_bonus_entry(conn, referred_by, 'referral', referrer_bonus)
        conn.execute(
            """INSERT INTO transactions
               (user_telegram_id, type, amount, bonuses_change, description)
               VALUES (?, 'referral', 0, ?, 'Бонус за регистрацию по приглашению')""",
            (telegram_id, referred_bonus),
        )
        _create_bonus_entry(conn, telegram_id, 'referral', referred_bonus)
        conn.execute(
            "UPDATE users SET bonuses=bonuses+? WHERE telegram_id=?",
            (referred_bonus, telegram_id),
        )
        conn.execute(
            """INSERT INTO referrals
               (referrer_telegram_id, referred_telegram_id, referrer_bonus, referred_bonus)
               VALUES (?, ?, ?, ?)""",
            (referred_by, telegram_id, referrer_bonus, referred_bonus),
        )

    conn.commit()
    user = get_user(telegram_id, conn)
    conn.close()
    return user


def get_user(telegram_id: int, conn: sqlite3.Connection | None = None) -> dict | None:
    own = conn is None
    if own:
        conn = get_db()
    row = conn.execute(
        "SELECT * FROM users WHERE telegram_id=?", (telegram_id,)
    ).fetchone()
    if own:
        conn.close()
    return dict(row) if row else None


def find_user_by_phone(phone: str) -> dict | None:
    cleaned = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM users WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')','') = ?",
        (cleaned,),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def find_user_by_referral_code(code: str) -> dict | None:
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM users WHERE referral_code=?", (code.upper(),)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def get_all_users(
    search: str = "",
    level_filter: str = "",
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[dict], int]:
    conn = get_db()
    where_parts = []
    params: list = []

    if search:
        where_parts.append(
            "(first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?)"
        )
        s = f"%{search}%"
        params.extend([s, s, s])

    if level_filter:
        where_parts.append("level = ?")
        params.append(level_filter)

    where = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

    total = conn.execute(
        f"SELECT COUNT(*) FROM users {where}", params
    ).fetchone()[0]

    rows = conn.execute(
        f"SELECT * FROM users {where} ORDER BY id DESC LIMIT ? OFFSET ?",
        params + [limit, offset],
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows], total


def update_user_role(telegram_id: int, role: str) -> dict | None:
    conn = get_db()
    conn.execute(
        "UPDATE users SET role=? WHERE telegram_id=?", (role, telegram_id)
    )
    conn.commit()
    user = get_user(telegram_id, conn)
    conn.close()
    return user


def get_staff() -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM users WHERE role IN ('admin', 'cashier') ORDER BY role, id"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def is_admin(telegram_id: int) -> bool:
    user = get_user(telegram_id)
    return user is not None and user.get("role") == "admin"


def is_staff(telegram_id: int) -> bool:
    user = get_user(telegram_id)
    return user is not None and user.get("role") in ("admin", "cashier")


def add_manual_bonus(telegram_id: int, amount: float, description: str = "") -> dict:
    conn = get_db()
    user = get_user(telegram_id, conn)
    if not user:
        conn.close()
        raise ValueError("User not found")
    conn.execute(
        "UPDATE users SET bonuses=bonuses+? WHERE telegram_id=?",
        (amount, telegram_id),
    )
    conn.execute(
        """INSERT INTO transactions
           (user_telegram_id, type, amount, bonuses_change, description)
           VALUES (?, 'manual', 0, ?, ?)""",
        (telegram_id, amount, description or f"Ручное начисление {amount} р."),
    )
    conn.commit()
    user = get_user(telegram_id, conn)
    conn.close()
    return user


# ─── Purchases & Bonuses ────────────────────────────────────


def add_purchase(telegram_id: int, amount: float) -> dict:
    conn = get_db()
    user = get_user(telegram_id, conn)
    if not user:
        conn.close()
        raise ValueError("User not found")

    cashback = round(amount * user["cashback_pct"] / 100, 2)
    conn.execute(
        "UPDATE users SET bonuses=bonuses+?, total_purchases=total_purchases+? WHERE telegram_id=?",
        (cashback, amount, telegram_id),
    )
    conn.execute(
        """INSERT INTO transactions
           (user_telegram_id, type, amount, bonuses_change, description)
           VALUES (?, 'purchase', ?, ?, ?)""",
        (telegram_id, amount, cashback, f"Покупка на {amount} р."),
    )
    _create_bonus_entry(conn, telegram_id, 'purchase', cashback)
    _recalc_level(conn, telegram_id)
    conn.commit()
    user = get_user(telegram_id, conn)
    conn.close()
    return user


def redeem_bonuses(telegram_id: int, amount: float) -> dict:
    conn = get_db()
    user = get_user(telegram_id, conn)
    if not user:
        conn.close()
        raise ValueError("User not found")
    if amount > user["bonuses"]:
        conn.close()
        raise ValueError("Insufficient bonuses")

    conn.execute(
        "UPDATE users SET bonuses=bonuses-? WHERE telegram_id=?",
        (amount, telegram_id),
    )
    conn.execute(
        """INSERT INTO transactions
           (user_telegram_id, type, amount, bonuses_change, description)
           VALUES (?, 'redeem', ?, ?, ?)""",
        (telegram_id, 0, -amount, f"Списание {amount} р."),
    )
    # FIFO: deduct from oldest bonus entries first
    _deduct_bonus_entries(conn, telegram_id, amount)
    conn.commit()
    user = get_user(telegram_id, conn)
    conn.close()
    return user


def _deduct_bonus_entries(
    conn: sqlite3.Connection, telegram_id: int, amount: float
) -> None:
    entries = conn.execute(
        """SELECT id, remaining FROM bonus_entries
           WHERE user_telegram_id = ? AND burned = 0 AND remaining > 0
           ORDER BY awarded_at ASC""",
        (telegram_id,),
    ).fetchall()
    left = amount
    for entry in entries:
        if left <= 0:
            break
        deduct = min(entry["remaining"], left)
        new_remaining = round(entry["remaining"] - deduct, 2)
        conn.execute(
            "UPDATE bonus_entries SET remaining=? WHERE id=?",
            (new_remaining, entry["id"]),
        )
        left = round(left - deduct, 2)


def get_history(telegram_id: int, limit: int = 20) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM transactions WHERE user_telegram_id=? ORDER BY id DESC LIMIT ?",
        (telegram_id, limit),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ─── Referrals ──────────────────────────────────────────────


def get_referrals(telegram_id: int) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        """SELECT r.*, u.first_name, u.last_name, u.level
           FROM referrals r
           JOIN users u ON u.telegram_id = r.referred_telegram_id
           WHERE r.referrer_telegram_id = ?
           ORDER BY r.id DESC""",
        (telegram_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_referral_stats(telegram_id: int) -> dict:
    conn = get_db()
    row = conn.execute(
        """SELECT COUNT(*) as total,
                  COALESCE(SUM(referrer_bonus), 0) as total_bonus
           FROM referrals WHERE referrer_telegram_id = ?""",
        (telegram_id,),
    ).fetchone()
    conn.close()
    return dict(row) if row else {"total": 0, "total_bonus": 0}


# ─── Admin Stats ────────────────────────────────────────────


def get_admin_stats() -> dict:
    conn = get_db()
    total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    total_bonuses = conn.execute(
        "SELECT COALESCE(SUM(bonuses), 0) FROM users"
    ).fetchone()[0]
    total_revenue = conn.execute(
        "SELECT COALESCE(SUM(total_purchases), 0) FROM users"
    ).fetchone()[0]
    today = datetime.now().strftime("%Y-%m-%d")
    txn_today = conn.execute(
        "SELECT COUNT(*) FROM transactions WHERE created_at LIKE ?",
        (f"{today}%",),
    ).fetchone()[0]
    ref_total = conn.execute("SELECT COUNT(*) FROM referrals").fetchone()[0]

    # Level distribution
    levels = {}
    for row in conn.execute(
        "SELECT level, COUNT(*) as cnt FROM users GROUP BY level"
    ).fetchall():
        levels[row["level"]] = row["cnt"]

    # Recent transactions
    recent_txns = conn.execute(
        """SELECT t.*, u.first_name, u.last_name
           FROM transactions t
           JOIN users u ON u.telegram_id = t.user_telegram_id
           ORDER BY t.id DESC LIMIT 20"""
    ).fetchall()

    # Top clients
    top_clients = conn.execute(
        "SELECT * FROM users ORDER BY total_purchases DESC LIMIT 10"
    ).fetchall()

    # New users this month
    month_start = datetime.now().strftime("%Y-%m-01")
    new_this_month = conn.execute(
        "SELECT COUNT(*) FROM users WHERE created_at >= ?", (month_start,)
    ).fetchone()[0]

    conn.close()
    return {
        "total_users": total_users,
        "total_bonuses": round(total_bonuses, 2),
        "total_revenue": round(total_revenue, 2),
        "txn_today": txn_today,
        "ref_total": ref_total,
        "new_this_month": new_this_month,
        "levels": levels,
        "recent_transactions": [dict(r) for r in recent_txns],
        "top_clients": [dict(r) for r in top_clients],
    }


def get_all_transactions(limit: int = 50, offset: int = 0) -> tuple[list[dict], int]:
    conn = get_db()
    total = conn.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
    rows = conn.execute(
        """SELECT t.*, u.first_name, u.last_name
           FROM transactions t
           JOIN users u ON u.telegram_id = t.user_telegram_id
           ORDER BY t.id DESC LIMIT ? OFFSET ?""",
        (limit, offset),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows], total


# ─── Broadcasts ─────────────────────────────────────────────


def create_broadcast(
    admin_telegram_id: int,
    text: str,
    parse_mode: str = "HTML",
    photo_file_id: str | None = None,
    buttons: list | None = None,
    filter_type: str = "all",
    filter_value: str | None = None,
    scheduled_at: str | None = None,
) -> dict:
    conn = get_db()
    status = "scheduled" if scheduled_at else "draft"
    cur = conn.execute(
        """INSERT INTO broadcasts
           (admin_telegram_id, text, parse_mode, photo_file_id, buttons,
            filter_type, filter_value, status, scheduled_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            admin_telegram_id, text, parse_mode, photo_file_id,
            json.dumps(buttons or []), filter_type, filter_value,
            status, scheduled_at,
        ),
    )
    broadcast_id = cur.lastrowid
    conn.commit()
    row = conn.execute(
        "SELECT * FROM broadcasts WHERE id=?", (broadcast_id,)
    ).fetchone()
    conn.close()
    return dict(row)


def get_broadcast(broadcast_id: int) -> dict | None:
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM broadcasts WHERE id=?", (broadcast_id,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def get_broadcasts(limit: int = 50) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM broadcasts ORDER BY id DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_broadcast_status(
    broadcast_id: int,
    status: str,
    total: int = 0,
    successful: int = 0,
    failed: int = 0,
) -> None:
    conn = get_db()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn.execute(
        """UPDATE broadcasts SET status=?, sent_at=?,
           total_recipients=?, successful=?, failed=?
           WHERE id=?""",
        (status, now, total, successful, failed, broadcast_id),
    )
    conn.commit()
    conn.close()


def get_due_scheduled_broadcasts() -> list[dict]:
    conn = get_db()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    rows = conn.execute(
        """SELECT * FROM broadcasts
           WHERE status = 'scheduled'
             AND scheduled_at IS NOT NULL
             AND scheduled_at <= ?""",
        (now,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_broadcast_recipients(filter_type: str, filter_value: str | None) -> list[int]:
    conn = get_db()
    if filter_type == "level" and filter_value:
        rows = conn.execute(
            "SELECT telegram_id FROM users WHERE level=? AND is_blocked=0",
            (filter_value,),
        ).fetchall()
    elif filter_type == "active":
        rows = conn.execute(
            """SELECT DISTINCT u.telegram_id FROM users u
               JOIN transactions t ON t.user_telegram_id = u.telegram_id
               WHERE u.is_blocked=0
               AND t.created_at >= datetime('now', '-30 days')"""
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT telegram_id FROM users WHERE is_blocked=0"
        ).fetchall()
    conn.close()
    return [r["telegram_id"] for r in rows]


# ─── Settings ───────────────────────────────────────────────


def get_setting(key: str, default: str = "") -> str:
    conn = get_db()
    row = conn.execute("SELECT value FROM settings WHERE key=?", (key,)).fetchone()
    conn.close()
    return row["value"] if row else default


def set_setting(key: str, value: str) -> None:
    conn = get_db()
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        (key, value),
    )
    conn.commit()
    conn.close()


# ─── User Update ────────────────────────────────────────────


def update_user(telegram_id: int, **kwargs) -> dict | None:
    conn = get_db()
    allowed = {"first_name", "last_name", "phone", "birthday", "bonuses", "is_blocked"}
    parts, vals = [], []
    for k, v in kwargs.items():
        if k in allowed:
            parts.append(f"{k}=?")
            vals.append(v)
    if not parts:
        conn.close()
        return get_user(telegram_id)
    vals.append(telegram_id)
    conn.execute(f"UPDATE users SET {','.join(parts)} WHERE telegram_id=?", vals)
    conn.commit()
    user = get_user(telegram_id, conn)
    conn.close()
    return user


# ─── Analytics ──────────────────────────────────────────────


def get_analytics(period_days: int = 30) -> dict:
    conn = get_db()
    # Sales by day
    sales_by_day = conn.execute(
        """SELECT date(created_at) as day, SUM(amount) as total, COUNT(*) as cnt,
                  AVG(amount) as avg_check
           FROM transactions WHERE type='purchase'
           AND created_at >= datetime('now', '-' || ? || ' days', 'localtime')
           GROUP BY date(created_at) ORDER BY day""",
        (period_days,),
    ).fetchall()

    # Heatmap: hour x day_of_week
    heatmap = conn.execute(
        """SELECT CAST(strftime('%w', created_at) AS INTEGER) as dow,
                  CAST(strftime('%H', created_at) AS INTEGER) as hour,
                  COUNT(*) as cnt
           FROM transactions WHERE type='purchase'
           GROUP BY dow, hour"""
    ).fetchall()

    # Totals
    total_revenue = conn.execute(
        "SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type='purchase'"
    ).fetchone()[0]
    total_purchases = conn.execute(
        "SELECT COUNT(*) FROM transactions WHERE type='purchase'"
    ).fetchone()[0]
    avg_check = round(total_revenue / total_purchases, 2) if total_purchases else 0

    # New clients per day
    new_clients = conn.execute(
        """SELECT date(created_at) as day, COUNT(*) as cnt
           FROM users
           WHERE created_at >= datetime('now', '-' || ? || ' days', 'localtime')
           GROUP BY date(created_at) ORDER BY day""",
        (period_days,),
    ).fetchall()

    conn.close()
    return {
        "sales_by_day": [dict(r) for r in sales_by_day],
        "heatmap": [dict(r) for r in heatmap],
        "total_revenue": round(total_revenue, 2),
        "total_purchases": total_purchases,
        "avg_check": avg_check,
        "new_clients": [dict(r) for r in new_clients],
    }


def get_rfm_segments() -> list[dict]:
    conn = get_db()
    now = datetime.now()
    users = conn.execute("SELECT * FROM users").fetchall()
    results = []
    for u in users:
        uid = u["telegram_id"]
        last_tx = conn.execute(
            "SELECT MAX(created_at) as last FROM transactions WHERE user_telegram_id=? AND type='purchase'",
            (uid,),
        ).fetchone()
        freq = conn.execute(
            "SELECT COUNT(*) as cnt FROM transactions WHERE user_telegram_id=? AND type='purchase'",
            (uid,),
        ).fetchone()
        monetary = u["total_purchases"] or 0
        # R score
        if last_tx and last_tx["last"]:
            try:
                last_dt = datetime.strptime(last_tx["last"][:19], "%Y-%m-%d %H:%M:%S")
                days_since = (now - last_dt).days
            except Exception:
                days_since = 999
        else:
            days_since = 999
        r = 5 if days_since <= 3 else 4 if days_since <= 7 else 3 if days_since <= 14 else 2 if days_since <= 30 else 1
        # F score
        f_cnt = freq["cnt"] if freq else 0
        f = 5 if f_cnt >= 20 else 4 if f_cnt >= 10 else 3 if f_cnt >= 5 else 2 if f_cnt >= 2 else 1
        # M score
        m = 5 if monetary >= 10000 else 4 if monetary >= 5000 else 3 if monetary >= 1000 else 2 if monetary >= 200 else 1
        # Segment
        rfm = r * 100 + f * 10 + m
        if r >= 4 and f >= 4:
            segment = "champion"
        elif f >= 3:
            segment = "loyal"
        elif r >= 3:
            segment = "promising"
        elif r >= 2:
            segment = "sleeping"
        else:
            segment = "lost"
        results.append({
            "telegram_id": uid,
            "first_name": u["first_name"],
            "last_name": u["last_name"],
            "level": u["level"],
            "total_purchases": monetary,
            "bonuses": u["bonuses"],
            "r": r, "f": f, "m": m,
            "rfm": rfm,
            "days_since": days_since,
            "purchase_count": f_cnt,
            "segment": segment,
        })
    conn.close()
    return results


# ─── Notifications Log ──────────────────────────────────────


def was_notified(telegram_id: int, notif_type: str, within_hours: int = 24) -> bool:
    conn = get_db()
    row = conn.execute(
        """SELECT 1 FROM notifications_log
           WHERE user_telegram_id=? AND type=?
           AND sent_at >= datetime('now', '-' || ? || ' hours', 'localtime')""",
        (telegram_id, notif_type, within_hours),
    ).fetchone()
    conn.close()
    return row is not None


def log_notification(telegram_id: int, notif_type: str) -> None:
    conn = get_db()
    conn.execute(
        "INSERT INTO notifications_log (user_telegram_id, type) VALUES (?, ?)",
        (telegram_id, notif_type),
    )
    conn.commit()
    conn.close()


def get_birthday_users() -> list[dict]:
    conn = get_db()
    today_md = datetime.now().strftime("%m.%d")
    tomorrow = datetime.now()
    from datetime import timedelta
    tomorrow_md = (tomorrow + timedelta(days=1)).strftime("%m.%d")
    rows = conn.execute(
        """SELECT * FROM users WHERE is_blocked=0
           AND (substr(birthday,4,5)=? OR substr(birthday,4,5)=?)""",
        (today_md, tomorrow_md),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_inactive_users(days: int = 14) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        """SELECT u.* FROM users u
           WHERE u.is_blocked=0
           AND NOT EXISTS (
               SELECT 1 FROM transactions t
               WHERE t.user_telegram_id=u.telegram_id
               AND t.created_at >= datetime('now', '-' || ? || ' days', 'localtime')
           )""",
        (days,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_level_approaching_users() -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        """SELECT * FROM users WHERE is_blocked=0
           AND ((level='Бронза' AND total_purchases >= 350)
             OR (level='Серебро' AND total_purchases >= 5500))"""
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_high_bonus_users(min_bonuses: float = 50) -> list[dict]:
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM users WHERE is_blocked=0 AND bonuses >= ?",
        (min_bonuses,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ─── Promotions ─────────────────────────────────────────────


def create_promotion(name: str, promo_type: str, value: float,
                     min_purchase: float = 0, promo_code: str | None = None,
                     max_uses: int = 0, start_at: str | None = None,
                     end_at: str | None = None) -> dict:
    conn = get_db()
    cur = conn.execute(
        """INSERT INTO promotions (name, type, value, min_purchase, promo_code,
           max_uses, start_at, end_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (name, promo_type, value, min_purchase, promo_code, max_uses, start_at, end_at),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM promotions WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return dict(row)


def get_promotions(active_only: bool = False) -> list[dict]:
    conn = get_db()
    if active_only:
        rows = conn.execute(
            """SELECT * FROM promotions WHERE is_active=1
               AND (start_at IS NULL OR start_at <= datetime('now','localtime'))
               AND (end_at IS NULL OR end_at >= datetime('now','localtime'))
               ORDER BY id DESC"""
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM promotions ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_promotion(promo_id: int) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT * FROM promotions WHERE id=?", (promo_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def update_promotion(promo_id: int, **kwargs) -> dict | None:
    conn = get_db()
    allowed = {"name", "type", "value", "min_purchase", "promo_code",
               "max_uses", "start_at", "end_at", "is_active"}
    parts, vals = [], []
    for k, v in kwargs.items():
        if k in allowed:
            parts.append(f"{k}=?")
            vals.append(v)
    if parts:
        vals.append(promo_id)
        conn.execute(f"UPDATE promotions SET {','.join(parts)} WHERE id=?", vals)
        conn.commit()
    row = conn.execute("SELECT * FROM promotions WHERE id=?", (promo_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def delete_promotion(promo_id: int) -> bool:
    conn = get_db()
    conn.execute("DELETE FROM promotions WHERE id=?", (promo_id,))
    conn.commit()
    conn.close()
    return True


def check_promo_code(code: str) -> dict | None:
    conn = get_db()
    row = conn.execute(
        """SELECT * FROM promotions WHERE promo_code=? AND is_active=1
           AND (start_at IS NULL OR start_at <= datetime('now','localtime'))
           AND (end_at IS NULL OR end_at >= datetime('now','localtime'))
           AND (max_uses=0 OR used_count < max_uses)""",
        (code.upper(),),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def use_promo_code(code: str) -> None:
    conn = get_db()
    conn.execute(
        "UPDATE promotions SET used_count=used_count+1 WHERE promo_code=?",
        (code.upper(),),
    )
    conn.commit()
    conn.close()


# ─── Export/Import ──────────────────────────────────────────


def export_users_csv() -> str:
    import csv
    import io
    conn = get_db()
    rows = conn.execute("SELECT * FROM users ORDER BY id").fetchall()
    conn.close()
    output = io.StringIO()
    if rows:
        writer = csv.DictWriter(output, fieldnames=dict(rows[0]).keys())
        writer.writeheader()
        for r in rows:
            writer.writerow(dict(r))
    return output.getvalue()


def import_users_csv(csv_text: str) -> int:
    import csv
    import io
    reader = csv.DictReader(io.StringIO(csv_text))
    conn = get_db()
    count = 0
    for row in reader:
        tid = int(row.get("telegram_id", 0))
        if not tid:
            continue
        existing = conn.execute(
            "SELECT 1 FROM users WHERE telegram_id=?", (tid,)
        ).fetchone()
        if existing:
            conn.execute(
                """UPDATE users SET first_name=?, last_name=?, phone=?, birthday=?
                   WHERE telegram_id=?""",
                (row.get("first_name", ""), row.get("last_name", ""),
                 row.get("phone", ""), row.get("birthday", ""), tid),
            )
        else:
            ref_code = _generate_referral_code()
            conn.execute(
                """INSERT INTO users (telegram_id, phone, first_name, last_name,
                   birthday, bonuses, referral_code)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (tid, row.get("phone", ""), row.get("first_name", ""),
                 row.get("last_name", ""), row.get("birthday", ""),
                 float(row.get("bonuses", 0)), ref_code),
            )
        count += 1
    conn.commit()
    conn.close()
    return count
