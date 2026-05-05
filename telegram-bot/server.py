"""FastAPI backend for FLove loyalty system — production version.

Serves REST API + static webapp files.
"""

import os
import io
import logging
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import uuid
import shutil

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
    photo_url: Optional[str] = None
    buttons: list = []
    filter_type: str = "all"
    filter_value: Optional[str] = None
    scheduled_at: Optional[str] = None


class UserUpdateRequest(BaseModel):
    telegram_id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    birthday: Optional[str] = None
    bonuses: Optional[float] = None
    is_blocked: Optional[int] = None


class PromotionCreateRequest(BaseModel):
    name: str
    type: str = "cashback_multiplier"
    value: float = 2
    min_purchase: float = 0
    promo_code: Optional[str] = None
    max_uses: int = 0
    start_at: Optional[str] = None
    end_at: Optional[str] = None


class PromotionUpdateRequest(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    value: Optional[float] = None
    min_purchase: Optional[float] = None
    promo_code: Optional[str] = None
    max_uses: Optional[int] = None
    start_at: Optional[str] = None
    end_at: Optional[str] = None
    is_active: Optional[int] = None


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


@app.post("/api/user/update")
def api_update_user(req: UserUpdateRequest):
    kwargs = {}
    for field in ["first_name", "last_name", "phone", "birthday", "bonuses", "is_blocked"]:
        val = getattr(req, field, None)
        if val is not None:
            kwargs[field] = val
    user = database.update_user(req.telegram_id, **kwargs)
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
    photo = req.photo_file_id or req.photo_url
    broadcast = database.create_broadcast(
        admin_telegram_id=req.admin_telegram_id,
        text=req.text,
        parse_mode=req.parse_mode,
        photo_file_id=photo,
        buttons=req.buttons,
        filter_type=req.filter_type,
        filter_value=req.filter_value,
        scheduled_at=req.scheduled_at,
    )
    result = dict(broadcast)
    result["photo_url"] = result.get("photo_file_id")
    return {"ok": True, "broadcast": result}


@app.get("/api/broadcasts")
def api_list_broadcasts():
    return database.get_broadcasts()


@app.get("/api/broadcast/{broadcast_id}")
def api_get_broadcast(broadcast_id: int):
    b = database.get_broadcast(broadcast_id)
    if not b:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    result = dict(b)
    result["photo_url"] = result.get("photo_file_id")
    return result


@app.post("/api/broadcast/{broadcast_id}/preview")
async def api_preview_broadcast(broadcast_id: int):
    b = database.get_broadcast(broadcast_id)
    if not b:
        raise HTTPException(status_code=404, detail="Broadcast not found")
    return {
        "ok": True,
        "message": "Preview saved. Use /preview command in bot to send to admin chat.",
        "broadcast_id": broadcast_id,
    }


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

SETTINGS_DEFAULTS = {
    "cashback_bronze_pct": "2",
    "cashback_bronze_min": "0",
    "cashback_bronze_max": "399",
    "cashback_bronze_enabled": "1",
    "cashback_silver_pct": "5",
    "cashback_silver_min": "400",
    "cashback_silver_max": "5999",
    "cashback_silver_enabled": "1",
    "cashback_gold_pct": "10",
    "cashback_gold_min": "6000",
    "cashback_gold_max": "999999",
    "cashback_gold_enabled": "1",
    "bonus_referrer": "5",
    "bonus_referrer_enabled": "1",
    "bonus_new_client": "3",
    "bonus_new_client_enabled": "1",
    "bonus_welcome": "3",
    "bonus_welcome_enabled": "1",
    "notif_birthday_enabled": "1",
    "notif_inactive_enabled": "1",
    "notif_inactive_days": "14",
    "notif_level_enabled": "1",
    "notif_bonus_reminder_enabled": "1",
    "notif_bonus_min": "50",
    "backup_enabled": "0",
    "backup_hour": "3",
    "backup_admin_id": "",
}


@app.get("/api/settings/{key}")
def api_get_setting(key: str):
    return {"key": key, "value": database.get_setting(key)}


@app.get("/api/settings")
def api_get_all_settings():
    result = {}
    for key, default in SETTINGS_DEFAULTS.items():
        result[key] = database.get_setting(key, default)
    return result


class SettingsUpdateRequest(BaseModel):
    settings: dict


@app.post("/api/settings")
def api_set_settings(req: SettingsUpdateRequest):
    for key, value in req.settings.items():
        database.set_setting(key, str(value))
    return {"ok": True}


@app.post("/api/settings/{key}")
def api_set_setting(key: str, value: str = ""):
    database.set_setting(key, value)
    return {"ok": True}


# ─── Analytics API ──────────────────────────────────────────


@app.get("/api/analytics")
def api_analytics(period: int = Query(default=30, le=365)):
    return database.get_analytics(period)


@app.get("/api/rfm")
def api_rfm():
    return database.get_rfm_segments()


# ─── Notifications API ─────────────────────────────────────


@app.get("/api/notifications/targets")
def api_notification_targets():
    birthday = database.get_birthday_users()
    inactive = database.get_inactive_users(14)
    approaching = database.get_level_approaching_users()
    high_bonus = database.get_high_bonus_users(50)
    return {
        "birthday": birthday,
        "inactive": inactive,
        "level_approaching": approaching,
        "high_bonus": high_bonus,
    }


# ─── Promotions API ────────────────────────────────────────


@app.get("/api/promotions")
def api_list_promotions(active_only: bool = False):
    return database.get_promotions(active_only)


@app.post("/api/promotions")
def api_create_promotion(req: PromotionCreateRequest):
    promo = database.create_promotion(
        name=req.name, promo_type=req.type, value=req.value,
        min_purchase=req.min_purchase,
        promo_code=req.promo_code.upper() if req.promo_code else None,
        max_uses=req.max_uses, start_at=req.start_at, end_at=req.end_at,
    )
    return {"ok": True, "promotion": promo}


@app.put("/api/promotions/{promo_id}")
def api_update_promotion(promo_id: int, req: PromotionUpdateRequest):
    kwargs = {}
    for field in ["name", "type", "value", "min_purchase", "promo_code",
                   "max_uses", "start_at", "end_at", "is_active"]:
        val = getattr(req, field, None)
        if val is not None:
            if field == "promo_code" and isinstance(val, str):
                val = val.upper()
            kwargs[field] = val
    promo = database.update_promotion(promo_id, **kwargs)
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found")
    return {"ok": True, "promotion": promo}


@app.delete("/api/promotions/{promo_id}")
def api_delete_promotion(promo_id: int):
    database.delete_promotion(promo_id)
    return {"ok": True}


@app.get("/api/promo/{code}")
def api_check_promo(code: str):
    promo = database.check_promo_code(code)
    if not promo:
        raise HTTPException(status_code=404, detail="Promo code not found or expired")
    return promo


# ─── Export/Import API ─────────────────────────────────────


@app.get("/api/export/users")
def api_export_users():
    csv_data = database.export_users_csv()
    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=flove_users.csv"},
    )


@app.post("/api/import/users")
async def api_import_users(file: UploadFile = File(...)):
    content = await file.read()
    csv_text = content.decode("utf-8")
    count = database.import_users_csv(csv_text)
    return {"ok": True, "imported": count}


# ─── Backup API ────────────────────────────────────────────


@app.get("/api/backup")
def api_backup():
    db_path = database.DB_PATH
    if not os.path.isfile(db_path):
        raise HTTPException(status_code=404, detail="Database file not found")
    return FileResponse(
        db_path,
        media_type="application/octet-stream",
        filename="flove_backup.db",
    )


# ─── Upload API ─────────────────────────────────────────────

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/api/upload")
async def api_upload_image(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, name)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"ok": True, "url": f"/uploads/{name}", "filename": name}


@app.get("/uploads/{filename}")
def serve_upload(filename: str):
    path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)


# ─── Static files (must be last) ───────────────────────────

app.mount("/", StaticFiles(directory="webapp", html=True), name="static")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
