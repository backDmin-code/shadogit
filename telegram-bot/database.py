"""SQLite database for FLove loyalty system."""

import os
import sqlite3
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
        """
    )
    conn.commit()
    conn.close()


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


def create_user(
    telegram_id: int,
    phone: str,
    first_name: str,
    last_name: str,
    birthday: str,
    welcome_bonus: float = 3.0,
) -> dict:
    conn = get_db()
    conn.execute(
        """INSERT OR IGNORE INTO users
           (telegram_id, phone, first_name, last_name, birthday, bonuses)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (telegram_id, phone, first_name, last_name, birthday, welcome_bonus),
    )
    if welcome_bonus > 0:
        conn.execute(
            """INSERT INTO transactions
               (user_telegram_id, type, amount, bonuses_change, description)
               VALUES (?, 'welcome', 0, ?, 'Приветственный бонус')""",
            (telegram_id, welcome_bonus),
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
