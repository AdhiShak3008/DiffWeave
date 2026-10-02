# DocWeave Complete Authentication Engine for DiffWeave
# Shares the same Neon PostgreSQL database, users table, bcrypt passwords,
# and JWT signatures with DocWeave.

import os
import uuid
import time
import random
import logging
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
from sqlalchemy import create_engine, text
import requests
from diffweave.cli.credentials import save_credentials, clear_credentials

logger = logging.getLogger("diffweave.auth")

SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "b1c482a537917a24274fa65e7c7fbe5dcce1e97a1e16c662dd470872e8f76fdf"
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_LP1rgDY6JsTV@ep-morning-shadow-azegcix7-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
)
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("SMTP_FROM", "DocWeave <noreply@doc-weave.xyz>")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_engine = None
def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)
    return _engine

_otp_store: dict[str, dict] = {}
_reset_tokens: dict[str, dict] = {}

def hash_password(password: str) -> str:
    pw_bytes = password.encode("utf-8")[:72]
    return pwd_context.hash(pw_bytes.decode("utf-8", errors="ignore"))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pw_bytes = plain_password.encode("utf-8")[:72]
        return pwd_context.verify(pw_bytes.decode("utf-8", errors="ignore"), hashed_password)
    except Exception as e:
        logger.warning(f"Password verification error: {e}")
        return False

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

def send_email(to_email: str, subject: str, html: str) -> bool:
    if not RESEND_API_KEY:
        return False
    try:
        r = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            json={"from": FROM_EMAIL, "to": [to_email], "subject": subject, "html": html},
            timeout=10,
        )
        return r.status_code in (200, 201)
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

def send_otp(email: str, username: str, password: str) -> dict:
    email = email.strip().lower()
    username = username.strip()
    if not email or not username or not password:
        raise ValueError("Email, username, and password are required.")
    if "@" not in email or "." not in email.split("@")[-1]:
        raise ValueError("Invalid email address.")

    eng = get_engine()
    with eng.connect() as conn:
        existing = conn.execute(text("SELECT id FROM users WHERE email = :e"), {"e": email}).first()
        if existing:
            raise ValueError("Email already registered in DocWeave.")
        existing_u = conn.execute(text("SELECT id FROM users WHERE username = :u"), {"u": username}).first()
        if existing_u:
            raise ValueError("Username already taken in DocWeave.")

    otp_code = f"{random.randint(100000, 999999)}"
    _otp_store[email] = {
        "code": otp_code,
        "expires_at": time.time() + 600,
        "username": username,
        "password": password,
    }

    html = f"""<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #10b981; margin-bottom: 8px;">DocWeave & DiffWeave</h2>
        <p style="color: #666; margin-bottom: 24px;">Your email verification code is:</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111;">{otp_code}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
    </div>"""

    sent = send_email(email, "DocWeave — Your verification code", html)
    print(f"\n[DocWeave Auth OTP] ========================================\nVerification code for {email}: {otp_code}\n(Sent via Resend: {sent})\n========================================\n", flush=True)

    return {"message": f"Verification code sent to {email}"}

def verify_otp(email: str, code: str) -> dict:
    email = email.strip().lower()
    code = code.strip()
    stored = _otp_store.get(email)
    if not stored:
        raise ValueError("No verification request found for this email or code has expired.")
    if time.time() > stored["expires_at"]:
        del _otp_store[email]
        raise ValueError("Verification code has expired. Please sign up again.")
    if stored["code"] != code:
        raise ValueError("Invalid verification code.")

    username = stored["username"]
    password = stored["password"]
    hashed = hash_password(password)
    user_id = str(uuid.uuid4())

    eng = get_engine()
    with eng.connect() as conn:
        conn.execute(
            text("INSERT INTO users (id, username, email, hashed_password, role) VALUES (:id, :username, :email, :hashed, :role)"),
            {"id": user_id, "username": username, "email": email, "hashed": hashed, "role": "user"}
        )
        conn.commit()

    del _otp_store[email]
    return {"message": "Account created successfully. Please sign in.", "user_id": user_id, "email": email, "username": username}

def login(email_or_username: str, password: str) -> dict:
    val = email_or_username.strip().lower()
    eng = get_engine()
    with eng.connect() as conn:
        row = conn.execute(
            text("SELECT id, username, email, hashed_password, role FROM users WHERE LOWER(email) = :val OR LOWER(username) = :val"),
            {"val": val}
        ).first()

    if not row or not verify_password(password, row[3]):
        raise ValueError("Invalid email or password.")

    token = create_access_token({"sub": row[2]})

    try:
        save_credentials(
            access_token=token,
            email=row[2],
            username=row[1],
            api_key=token,
        )
    except Exception as e:
        logger.warning(f"Could not save CLI credentials: {e}")

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(row[0]),
            "username": row[1],
            "email": row[2],
            "role": row[4] or "user",
        }
    }

def demo_login() -> dict:
    email = "evaluator@docweave.io"
    username = "DocWeave Evaluator"
    user_id = "00000000-0000-0000-0000-000000000001"

    eng = get_engine()
    try:
        with eng.connect() as conn:
            row = conn.execute(text("SELECT id, username, email, role FROM users WHERE email = :e"), {"e": email}).first()
            if row:
                user_id = str(row[0])
                username = row[1]
    except Exception:
        pass

    token = create_access_token({"sub": email})

    try:
        save_credentials(
            access_token=token,
            email=email,
            username=username,
            api_key=token,
        )
    except Exception:
        pass

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": username,
            "email": email,
            "role": "evaluator",
        }
    }

def get_current_user_from_token(token: str) -> dict:
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    email = payload["sub"]
    eng = get_engine()
    with eng.connect() as conn:
        row = conn.execute(
            text("SELECT id, username, email, role FROM users WHERE email = :e"),
            {"e": email}
        ).first()
    if not row:
        if email == "evaluator@docweave.io":
            return {
                "id": "00000000-0000-0000-0000-000000000001",
                "username": "DocWeave Evaluator",
                "email": "evaluator@docweave.io",
                "role": "evaluator",
            }
        return None
    return {
        "id": str(row[0]),
        "username": row[1],
        "email": row[2],
        "role": row[3] or "user",
    }

def forgot_password(email: str) -> dict:
    email = email.strip().lower()
    eng = get_engine()
    with eng.connect() as conn:
        row = conn.execute(text("SELECT id FROM users WHERE email = :e"), {"e": email}).first()
        if not row:
            return {"message": "If that email exists, a password reset link has been sent."}

    reset_token = f"{uuid.uuid4().hex}"
    _reset_tokens[reset_token] = {
        "email": email,
        "expires_at": time.time() + 3600,
    }

    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:7860")
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    html = f"""<div style="font-family: sans-serif; padding: 32px;">
        <h2>DocWeave & DiffWeave Password Reset</h2>
        <p>You requested a password reset. Click below to choose a new password:</p>
        <p><a href="{reset_link}" style="background:#10b981;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
    </div>"""
    send_email(email, "DocWeave — Reset your password", html)
    print(f"\n[DocWeave Auth Reset] Reset link for {email}: {reset_link}\n", flush=True)
    return {"message": "If that email exists, a password reset link has been sent."}

def reset_password(token: str, new_password: str) -> dict:
    token = token.strip()
    stored = _reset_tokens.get(token)
    if not stored:
        raise ValueError("Invalid or expired reset token.")
    if time.time() > stored["expires_at"]:
        del _reset_tokens[token]
        raise ValueError("Reset token has expired.")

    if len(new_password) < 8:
        raise ValueError("Password must be at least 8 characters.")

    email = stored["email"]
    hashed = hash_password(new_password)
    eng = get_engine()
    with eng.connect() as conn:
        conn.execute(text("UPDATE users SET hashed_password = :h WHERE email = :e"), {"h": hashed, "e": email})
        conn.commit()

    del _reset_tokens[token]
    return {"message": "Password has been reset successfully. Please log in."}

def logout() -> dict:
    try:
        clear_credentials()
    except Exception:
        pass
    return {"status": "ok"}
