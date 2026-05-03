"""FastAPI backend for FLove loyalty system. Serves API + static webapp files."""

import os
import logging

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
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

app = FastAPI(title="FLove Loyalty API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    database.init_db()
    logger.info("Database initialized")


# ─── Models ─────────────────────────────────────────────────


class PurchaseRequest(BaseModel):
    telegram_id: int
    amount: float


class RedeemRequest(BaseModel):
    telegram_id: int
    amount: float


# ─── API ────────────────────────────────────────────────────


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


@app.get("/api/user/{telegram_id}/history")
def api_history(telegram_id: int):
    user = database.get_user(telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return database.get_history(telegram_id)


# ─── Static files (must be last) ───────────────────────────

app.mount("/", StaticFiles(directory="webapp", html=True), name="static")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
