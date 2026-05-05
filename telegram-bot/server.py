"""FastAPI backend for FLove loyalty system — production version.

Serves REST API + static webapp files.
"""

import os
import logging
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import database

load_dotenv()

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

app = FastAPI(title="FLove Loyalty API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    database.init_db()
    logger.info("Database initialized (v2 — production)")


# ─── Request Models ─────────────────────────────────────────


class PurchaseRequest(BaseModel):
    telegram_id: int
    amount: float


class RedeemRequest(BaseModel):
    telegram_id: int
    amount: float


class ManualBonusRequest(BaseModel):
    telegram_id: int
    amount: float
    description: str = ""


class RoleUpdateRequest(BaseModel):
    telegram_id: int
    role: str


class BroadcastCreateRequest(BaseModel):
    admin_telegram_id: int
    text: str
    parse_mode: str = "HTML"
    photo_file_id: Optional[str] = None
    buttons: list = []
    filter_type: str = "all"
    filter_value: Optional[str] = None
    scheduled_at: Optional[str] = None


# ─── User API ───────────────────────────────────────────────


@app.get("/api/user/{telegram_id}")
def api_get_user(telegram_id: int):
    user = database.get_user(telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.get("/api/user/by-phone/{phone:path}")
def api_find_by_phone(phone: str):
    user = database.find_user_by_phone(phone)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.get("/api/users")
def api_list_users(
    search: str = "",
    level: str = "",
    limit: int = Query(default=100, le=500),
    offset: int = 0,
):
    users, total = database.get_all_users(search, level, limit, offset)
    return {"users": users, "total": total}


@app.post("/api/user/role")
def api_update_role(req: RoleUpdateRequest):
    if req.role not in ("client", "admin", "cashier"):
        raise HTTPException(status_code=400, detail="Invalid role")
    user = database.update_user_role(req.telegram_id, req.role)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True, "user": user}


# ─── Purchase / Bonus API ──────────────────────────────────


@app.post("/api/purchase")
def api_purchase(req: PurchaseRequest):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    try:
        user = database.add_purchase(req.telegram_id, req.amount)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"ok": True, "user": user}


@app.post("/api/redeem")
def api_redeem(req: RedeemRequest):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    try:
        user = database.redeem_bonuses(req.telegram_id, req.amount)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True, "user": user}


@app.post("/api/bonus/manual")
def api_manual_bonus(req: ManualBonusRequest):
    try:
        user = database.add_manual_bonus(
            req.telegram_id, req.amount, req.description
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"ok": True, "user": user}


@app.get("/api/user/{telegram_id}/history")
def api_history(telegram_id: int):
    user = database.get_user(telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return database.get_history(telegram_id)


# ─── Referral API ───────────────────────────────────────────


@app.get("/api/user/{telegram_id}/referrals")
def api_referrals(telegram_id: int):
    user = database.get_user(telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    referrals = database.get_referrals(telegram_id)
    stats = database.get_referral_stats(telegram_id)
    return {
        "referral_code": user.get("referral_code", ""),
        "referrals": referrals,
        "stats": stats,
    }


@app.get("/api/referral/{code}")
def api_check_referral(code: str):
    user = database.find_user_by_referral_code(code)
    if not user:
        raise HTTPException(status_code=404, detail="Referral code not found")
    return {
        "valid": True,
        "referrer_name": f"{user['first_name']} {user['last_name']}",
        "referrer_telegram_id": user["telegram_id"],
    }


# ─── Admin Stats API ───────────────────────────────────────


@app.get("/api/admin/stats")
def api_admin_stats():
    return database.get_admin_stats()


@app.get("/api/admin/transactions")
def api_admin_transactions(
    limit: int = Query(default=50, le=200),
    offset: int = 0,
):
    txns, total = database.get_all_transactions(limit, offset)
    return {"transactions": txns, "total": total}


# ─── Broadcast API ──────────────────────────────────────────


@app.post("/api/broadcast")
def api_create_broadcast(req: BroadcastCreateRequest):
    broadcast = database.create_broadcast(
        admin_telegram_id=req.admin_telegram_id,
        text=req.text,
        parse_mode=req.parse_mode,
        photo_file_id=req.photo_file_id,
        buttons=req.buttons,
        filter_type=req.filter_type,
        filter_value=req.filter_value,
        scheduled_at=req.scheduled_at,
    )
    return {"ok": True, "broadcast": broadcast}


@app.get("/api/broadcasts")
def api_list_broadcasts():
    return database.get_broadcasts()


@app.get("/api/broadcast/{broadcast_id}")
def api_get_broadcast(broadcast_id: int):
    b = database.get_broadcast(broadcast_id)
    if not b:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    return b


@app.post("/api/broadcast/{broadcast_id}/send")
def api_send_broadcast(broadcast_id: int):
    b = database.get_broadcast(broadcast_id)
    if not b:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    recipients = database.get_broadcast_recipients(
        b["filter_type"], b.get("filter_value")
    )
    database.update_broadcast_status(
        broadcast_id, "queued", total=len(recipients)
    )
    return {
        "ok": True,
        "broadcast_id": broadcast_id,
        "recipients_count": len(recipients),
        "recipients": recipients,
    }


# ─── Settings API ───────────────────────────────────────────


@app.get("/api/settings/{key}")
def api_get_setting(key: str):
    return {"key": key, "value": database.get_setting(key)}


@app.post("/api/settings/{key}")
def api_set_setting(key: str, value: str = ""):
    database.set_setting(key, value)
    return {"ok": True}


# ─── Static files (must be last) ───────────────────────────

app.mount("/", StaticFiles(directory="webapp", html=True), name="static")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
