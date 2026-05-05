"""SQLite database for FLove loyalty system — production version."""

import os
import json
import sqlite3
import secrets
import string
from datetime import datetime

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
        conn.execute(
            """INSERT INTO transactions
               (user_telegram_id, type, amount, bonuses_change, description)
               VALUES (?, 'referral', 0, ?, 'Бонус за регистрацию по приглашению')""",
            (telegram_id, referred_bonus),
        )
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
    conn.commit()
    user = get_user(telegram_id, conn)
    conn.close()
    return user


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
