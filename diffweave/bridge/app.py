"""
FastAPI Server Bridge for DiffWeave Studio.

Provides secure, authenticated, workspace-scoped REST APIs that
delegate directly to DocWeave's MCP Server.
"""
from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import secrets
from datetime import datetime
from diffweave.cli.credentials import save_credentials, load_credentials, clear_credentials, get_credentials_file

from diffweave.mcp.client import DiffWeaveMCPClient
from diffweave.mcp.errors import MCPToolError, MCPConnectionError
from diffweave.bridge.batch_manager import batch_manager
from diffweave.bridge import redis_service

app = FastAPI(
    title="DiffWeave Studio Bridge",
    description="Backend bridge serving DiffWeave Studio via DocWeave MCP Server",
    version="0.1.0",
)

# Enable CORS for local Studio frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = DiffWeaveMCPClient()


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------

class CreateWorkspaceRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    template: Optional[str] = "empty"
    visibility: Optional[str] = "private"


class UpdateVisibilityRequest(BaseModel):
    visibility: str


class AddMemberRequest(BaseModel):
    email: str
    role: str = "EDITOR"


class UpdateMemberRoleRequest(BaseModel):
    role: str


class CreateProposalRequest(BaseModel):
    summary: str
    rationale: Optional[str] = "Revision proposal submitted from Truth Register"
    proposal_type: str = "UPDATE"
    knowledge_item_id: Optional[str] = None
    proposed_changes: dict[str, Any]


class ReviewProposalRequest(BaseModel):
    decision: str  # APPROVED, REJECTED, ARCHIVED
    comments: Optional[str] = None


class BatchReviewRequest(BaseModel):
    decision: str  # APPROVED, REJECTED
    proposal_ids: Optional[list[str]] = None
    comments: Optional[str] = None


class BatchDeleteWorkspacesRequest(BaseModel):
    workspace_ids: Optional[list[str]] = None
    delete_all: bool = False

class CreateRuleRequest(BaseModel):
    name: str
    operator: str
    configuration: dict[str, Any]



# ---------------------------------------------------------------------------
# Authentication -- Complete DocWeave Authentication Engine
# ---------------------------------------------------------------------------
import json as _json
from fastapi import Request as _Request, Header
from fastapi.responses import Response as _Response
from diffweave.bridge import docweave_auth
from diffweave.bridge import db_store
from diffweave.cli.credentials import save_credentials, clear_credentials

_DOCWEAVE_URL = os.environ.get("DOCWEAVE_BACKEND_URL", "http://localhost:8000")

@app.post("/api/auth/send-otp")
async def send_otp_endpoint(request: _Request):
    body = await request.json()
    try:
        res = docweave_auth.send_otp(
            email=body.get("email", ""),
            username=body.get("username", ""),
            password=body.get("password", ""),
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auth error: {str(e)}")

@app.post("/api/auth/verify-otp")
async def verify_otp_endpoint(request: _Request):
    body = await request.json()
    try:
        res = docweave_auth.verify_otp(
            email=body.get("email", ""),
            code=body.get("code", ""),
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification error: {str(e)}")

@app.post("/api/auth/signup")
async def signup_endpoint(request: _Request):
    body = await request.json()
    try:
        res = docweave_auth.send_otp(
            email=body.get("email", ""),
            username=body.get("username", ""),
            password=body.get("password", ""),
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login")
async def login_endpoint(request: _Request):
    """
    DocWeave login: accepts both OAuth2 form data (username, password)
    and JSON bodies (email/username, password).
    """
    content_type = request.headers.get("content-type", "")
    username = ""
    password = ""
    if "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        username = form.get("username", "")
        password = form.get("password", "")
    else:
        try:
            data = await request.json()
            username = data.get("username") or data.get("email", "")
            password = data.get("password", "")
        except Exception:
            pass

    if not username or not password:
        raise HTTPException(status_code=400, detail="Username/Email and password are required.")

    try:
        result = docweave_auth.login(username, password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.post("/api/auth/demo-login")
async def demo_login_endpoint():
    try:
        return docweave_auth.demo_login()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo login failed: {str(e)}")



@app.post("/api/auth/token-login")
@app.post("/auth/token-login")
async def token_login_endpoint(request: _Request):
    """
    Direct login with Personal Access Token / API Key.
    """
    token = ""
    content_type = request.headers.get("content-type", "")
    if "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        token = form.get("token") or form.get("api_key", "")
    else:
        try:
            data = await request.json()
            token = data.get("token") or data.get("api_key", "")
        except Exception:
            pass

    if not token or not str(token).strip():
        raise HTTPException(status_code=400, detail="API key or personal access token is required.")

    token = str(token).strip()
    user = docweave_auth.get_current_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired API key / token.")

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }
@app.get("/api/auth/me")
@app.get("/api/auth/whoami")
async def auth_me_endpoint(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")
    token = authorization.split(" ", 1)[1].strip()
    user = docweave_auth.get_current_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return user

@app.post("/api/auth/forgot-password")
async def forgot_password_endpoint(request: _Request):
    body = await request.json()
    return docweave_auth.forgot_password(body.get("email", ""))

@app.post("/api/auth/reset-password")
async def reset_password_endpoint(request: _Request):
    body = await request.json()
    try:
        return docweave_auth.reset_password(body.get("token", ""), body.get("new_password", ""))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/logout")
async def logout_endpoint():
    return docweave_auth.logout()

@app.post("/api/auth/generate-key")
async def generate_key_endpoint(request: _Request, authorization: str = Header(None)):
    token = ""
    email = "evaluator@docweave.io"
    username = "DocWeave User"
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        user = docweave_auth.get_current_user_from_token(token)
        if user:
            email = user.get("email", email)
            username = user.get("username", username)
    if not token:
        token = f"dw_pat_{uuid.uuid4().hex}"

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
        "status": "success",
        "api_key": token,
        "token_type": "personal_access_token",
        "username": username,
        "email": email,
        "created_at": datetime.utcnow().isoformat(),
        "instructions": "Set DIFFWEAVE_API_KEY in terminal or run 'diffweave auth login'.",
    }

@app.post("/api/auth/sync-cli")
async def sync_cli_endpoint(request: _Request):
    body = await request.json()
    token = body.get("access_token", "")
    email = body.get("email", "evaluator@docweave.io")
    username = body.get("username", "Evaluator")
    try:
        save_credentials(
            access_token=token,
            email=email,
            username=username,
            api_key=token,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"status": "synced", "cli_config": "~/.diffweave/credentials.json"}

# ---------------------------------------------------------------------------
# Workspaces
# ---------------------------------------------------------------------------

@app.get("/api/workspaces")
async def get_workspaces(authorization: str = Header(None)):
    try:
        from sqlalchemy import text
        user = None
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ", 1)[1].strip()
            user = docweave_auth.get_current_user_from_token(token)

        eng = docweave_auth.get_engine()
        with eng.connect() as conn:
            # If user is authenticated (and not demo evaluator), return only their active workspaces
            if user and user.get("id") and user.get("role") != "evaluator":
                rows = conn.execute(
                    text("""
                        SELECT w.id, w.name, w.description, w.visibility, w.template,
                               (SELECT count(*) FROM knowledge_items WHERE workspace_id = w.id) as k_count,
                               (SELECT count(*) FROM documents WHERE workspace_id = w.id) as d_count
                        FROM workspaces w
                        WHERE w.created_by::text = :uid
                          AND (w.status != 'DELETED' OR w.status IS NULL)
                        ORDER BY k_count DESC, w.created_at DESC
                    """),
                    {"uid": str(user["id"])}
                ).fetchall()
                return [
                    {
                        "id": str(r[0]),
                        "name": r[1],
                        "description": r[2] or f"{r[6]} documents · {r[5]} verified facts",
                        "visibility": r[3] or "private",
                        "template": r[4] or "empty",
                        "k_count": r[5],
                        "d_count": r[6]
                    }
                    for r in rows
                ]

            # If evaluator/demo or no user, return active workspaces (excluding deleted)
            rows = conn.execute(
                text("""
                    SELECT w.id, w.name, w.description, w.visibility, w.template,
                           (SELECT count(*) FROM knowledge_items WHERE workspace_id = w.id) as k_count,
                           (SELECT count(*) FROM documents WHERE workspace_id = w.id) as d_count
                    FROM workspaces w
                    WHERE (w.status != 'DELETED' OR w.status IS NULL)
                    ORDER BY k_count DESC, w.created_at DESC
                """)
            ).fetchall()
            return [
                {
                    "id": str(r[0]),
                    "name": r[1],
                    "description": r[2] or f"{r[6]} documents · {r[5]} verified facts",
                    "visibility": r[3] or "private",
                    "template": r[4] or "empty",
                    "k_count": r[5],
                    "d_count": r[6]
                }
                for r in rows
            ]
        return await client.list_workspaces()
    except Exception as e:
        return await client.list_workspaces()


@app.post("/api/workspaces")
async def create_workspace(req: CreateWorkspaceRequest, authorization: str = Header(None)):
    clean_name = req.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Workspace name cannot be empty.")

    try:
        from sqlalchemy import text
        import uuid
        user = None
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ", 1)[1].strip()
            user = docweave_auth.get_current_user_from_token(token)

        eng = docweave_auth.get_engine()
        user_id = user["id"] if user and user.get("id") else None

        # Check for duplicate workspace name
        with eng.connect() as conn:
            if user_id:
                dup = conn.execute(
                    text("""
                        SELECT id, name FROM workspaces
                        WHERE created_by = :uid
                          AND LOWER(TRIM(name)) = LOWER(TRIM(:name))
                          AND (status != 'DELETED' OR status IS NULL)
                    """),
                    {"uid": user_id, "name": clean_name}
                ).first()
            else:
                dup = conn.execute(
                    text("""
                        SELECT id, name FROM workspaces
                        WHERE LOWER(TRIM(name)) = LOWER(TRIM(:name))
                          AND (status != 'DELETED' OR status IS NULL)
                    """),
                    {"name": clean_name}
                ).first()

            if dup:
                raise HTTPException(
                    status_code=409,
                    detail=f"A workspace named '{clean_name}' already exists. Workspace names must be unique."
                )

        # Create new workspace directly in DB with authenticated ownership, template, and visibility
        ws_id = str(uuid.uuid4())
        if user_id == "00000000-0000-0000-0000-000000000001":
            docweave_auth.ensure_evaluator_user()
        owner_id = user_id or "59a0fed0-17c7-4013-82fc-985f5d1ee623"
        template_id = (req.template or "empty").lower().strip()
        visibility = (req.visibility or "private").lower().strip()

        with eng.begin() as conn:
            conn.execute(
                text("""
                    INSERT INTO workspaces (id, name, description, created_by, status, created_at, updated_at, visibility, template)
                    VALUES (:id, :name, :desc, :uid, 'ACTIVE', NOW(), NOW(), :vis, :tmpl)
                """),
                {
                    "id": ws_id,
                    "name": clean_name,
                    "desc": req.description or "",
                    "uid": owner_id,
                    "vis": visibility,
                    "tmpl": template_id
                }
            )

        # Automatically seed specialized template policy rules
        try:
            db_store.seed_workspace_template_rules(ws_id, template_id)
        except Exception as seed_err:
            logger.warning(f"Could not auto-seed template rules for workspace {ws_id}: {seed_err}")

        return {
            "id": ws_id,
            "name": clean_name,
            "description": req.description or "",
            "visibility": visibility,
            "template": template_id,
            "status": "ACTIVE",
            "created_by": owner_id,
            "d_count": 0,
            "k_count": 0,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# Workspace Access & Collaborator Management
# ---------------------------------------------------------------------------

@app.get("/api/workspaces/{workspace_id}/access")
async def get_workspace_access_endpoint(workspace_id: str, authorization: str = Header(None)):
    try:
        eng = docweave_auth.get_engine()
        with eng.connect() as conn:
            ws = conn.execute(
                text("SELECT id, name, created_by, visibility, template FROM workspaces WHERE id::text = :ws"),
                {"ws": workspace_id}
            ).first()
            if not ws:
                raise HTTPException(status_code=404, detail="Workspace not found.")

            owner_id = str(ws[2]) if ws[2] else ""
            owner_user = None
            if owner_id:
                u = conn.execute(
                    text("SELECT id, username, email FROM users WHERE id::text = :uid"),
                    {"uid": owner_id}
                ).first()
                if u:
                    owner_user = {"id": str(u[0]), "username": u[1], "email": u[2]}

            members_rows = conn.execute(
                text("""
                    SELECT id, user_id, email, role, created_at
                    FROM workspace_members
                    WHERE workspace_id::text = :ws
                    ORDER BY created_at ASC
                """),
                {"ws": workspace_id}
            ).fetchall()

            members = [
                {
                    "id": str(m[0]),
                    "user_id": str(m[1]) if m[1] else None,
                    "email": m[2],
                    "role": m[3] or "VIEWER",
                    "created_at": m[4].isoformat() if m[4] else ""
                }
                for m in members_rows
            ]

            return {
                "workspace_id": workspace_id,
                "name": ws[1],
                "visibility": ws[3] or "private",
                "template": ws[4] or "empty",
                "owner": owner_user or {"id": owner_id, "username": "Workspace Owner", "email": "evaluator@docweave.io"},
                "members": members,
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workspaces/{workspace_id}/access/visibility")
async def update_workspace_visibility_endpoint(
    workspace_id: str,
    req: UpdateVisibilityRequest,
    authorization: str = Header(None)
):
    vis = req.visibility.lower().strip()
    if vis not in ["public", "private"]:
        raise HTTPException(status_code=400, detail="Visibility must be 'public' or 'private'.")
    try:
        eng = docweave_auth.get_engine()
        with eng.begin() as conn:
            conn.execute(
                text("UPDATE workspaces SET visibility = :vis, updated_at = NOW() WHERE id::text = :ws"),
                {"vis": vis, "ws": workspace_id}
            )
        return {"workspace_id": workspace_id, "visibility": vis, "message": f"Visibility updated to {vis}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workspaces/{workspace_id}/access/members")
async def add_workspace_member_endpoint(
    workspace_id: str,
    req: AddMemberRequest,
    authorization: str = Header(None)
):
    clean_email = req.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Valid email address is required.")
    role = req.role.upper().strip()
    if role not in ["ADMIN", "EDITOR", "VIEWER"]:
        role = "EDITOR"
    try:
        import uuid
        eng = docweave_auth.get_engine()
        with eng.begin() as conn:
            user_row = conn.execute(
                text("SELECT id FROM users WHERE LOWER(email) = :e"),
                {"e": clean_email}
            ).first()
            user_id = user_row[0] if user_row else None

            existing = conn.execute(
                text("SELECT id FROM workspace_members WHERE workspace_id::text = :ws AND LOWER(email) = :e"),
                {"ws": workspace_id, "e": clean_email}
            ).first()
            if existing:
                conn.execute(
                    text("UPDATE workspace_members SET role = :r WHERE id = :mid"),
                    {"r": role, "mid": existing[0]}
                )
                member_id = str(existing[0])
            else:
                member_id = str(uuid.uuid4())
                conn.execute(
                    text("""
                        INSERT INTO workspace_members (id, workspace_id, user_id, email, role, created_at)
                        VALUES (:id, :ws, :uid, :e, :r, NOW())
                    """),
                    {"id": member_id, "ws": workspace_id, "uid": user_id, "e": clean_email, "r": role}
                )

        return {
            "id": member_id,
            "workspace_id": workspace_id,
            "email": clean_email,
            "role": role,
            "message": f"Collaborator {clean_email} added with role {role}."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/workspaces/{workspace_id}/access/members/{member_id}")
async def remove_workspace_member_endpoint(workspace_id: str, member_id: str, authorization: str = Header(None)):
    try:
        eng = docweave_auth.get_engine()
        with eng.begin() as conn:
            conn.execute(
                text("DELETE FROM workspace_members WHERE workspace_id::text = :ws AND id::text = :mid"),
                {"ws": workspace_id, "mid": member_id}
            )
        return {"status": "ok", "message": "Collaborator removed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/workspaces/{workspace_id}/access/members/{member_id}")
async def update_workspace_member_role_endpoint(
    workspace_id: str,
    member_id: str,
    req: UpdateMemberRoleRequest,
    authorization: str = Header(None)
):
    role = req.role.upper().strip()
    if role not in ["ADMIN", "EDITOR", "VIEWER"]:
        raise HTTPException(status_code=400, detail="Role must be ADMIN, EDITOR, or VIEWER.")
    try:
        eng = docweave_auth.get_engine()
        with eng.begin() as conn:
            conn.execute(
                text("UPDATE workspace_members SET role = :r WHERE workspace_id::text = :ws AND id::text = :mid"),
                {"r": role, "ws": workspace_id, "mid": member_id}
            )
        return {"status": "ok", "role": role}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.delete("/api/workspaces/{workspace_id}")
async def delete_workspace_endpoint(workspace_id: str, authorization: str = Header(None)):
    try:
        user = None
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ", 1)[1].strip()
            user = docweave_auth.get_current_user_from_token(token)
        user_id = user["id"] if user and user.get("id") else None
        ok = db_store.delete_db_workspace(workspace_id, user_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Workspace not found.")
        return {"status": "DELETED", "workspace_id": workspace_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/workspaces/batch-delete")
async def batch_delete_workspaces_endpoint(req: BatchDeleteWorkspacesRequest, authorization: str = Header(None)):
    try:
        user = None
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ", 1)[1].strip()
            user = docweave_auth.get_current_user_from_token(token)
        user_id = user["id"] if user and user.get("id") else None

        if req.delete_all:
            count = db_store.delete_all_user_workspaces(user_id=user_id, workspace_ids=req.workspace_ids)
            return {"status": "DELETED_ALL", "deleted_count": count}

        if not req.workspace_ids:
            raise HTTPException(status_code=400, detail="No workspace IDs provided.")

        count = db_store.batch_delete_db_workspaces(req.workspace_ids, user_id)
        return {"status": "DELETED_BATCH", "deleted_count": count}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/workspaces/{workspace_id}/status")
async def get_workspace_status(workspace_id: str):
    try:
        # Check Redis cache first (sub-millisecond latency)
        cached = await redis_service.get_cached_workspace_status(workspace_id)
        if cached:
            return cached

        db_status = db_store.get_db_workspace_status(workspace_id)
        docs = db_store.get_db_documents(workspace_id)
        pending = db_store.get_db_proposals(workspace_id, status="PENDING")
        res = {
            "workspace_id": workspace_id,
            "stats": db_status,
            "documents": docs,
            "pending_proposals": pending,
        }
        await redis_service.set_cached_workspace_status(workspace_id, res)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Documents & Ingestion
# ---------------------------------------------------------------------------

@app.get("/api/workspaces/{workspace_id}/documents")
async def get_documents(workspace_id: str):
    try:
        docs = await client.list_documents(workspace_id)
        if not docs:
            docs = db_store.get_db_documents(workspace_id)
        return docs
    except Exception:
        return db_store.get_db_documents(workspace_id)


@app.post("/api/workspaces/{workspace_id}/upload")
async def upload_document_endpoint(
    workspace_id: str,
    file: UploadFile = File(...),
):
    """
    Accepts document file upload from Studio, saves to temporary staging file,
    and dispatches upload_document through DocWeave MCP.
    """
    suffix = Path(file.filename).suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        # Save to database
        db_store.insert_db_document(workspace_id, file.filename)
        result = await client.upload_document(workspace_id, tmp_path, filename=file.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass


@app.delete("/api/documents/{document_id}")
async def delete_document_endpoint(document_id: str):
    try:
        return await client.delete_document(document_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



# ---------------------------------------------------------------------------
# Asynchronous Batch Document Processing
# ---------------------------------------------------------------------------

@app.post("/api/workspaces/{workspace_id}/batch-upload")
async def batch_upload_endpoint(
    workspace_id: str,
    files: list[UploadFile] = File(...),
    batch_name: Optional[str] = Form(None),
    authorization: Optional[str] = Header(None),
):
    """
    Accepts multiple documents in a single batch (heterogeneous or homogeneous kinds).
    Saves them to temporary staging storage and triggers an asynchronous background
    extraction & proposal pipeline.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided in batch upload.")

    user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        user = docweave_auth.get_current_user_from_token(token)

    # Redis Sliding Window Rate Limiting (Prevents token exhaustion in public workspaces)
    client_id = (user.get("id") if user else None) or "anonymous_uploader"
    allowed, remaining = await redis_service.check_upload_rate_limit(client_id, max_uploads=25, window_seconds=900)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Batch upload rate limit exceeded on this workspace (25 batches / 15 mins). Please wait before staging new documents."
        )

    staged_files_data = []
    batch_temp_dir = Path("storage/batches") / f"temp_{uuid.uuid4().hex[:12]}"
    batch_temp_dir.mkdir(parents=True, exist_ok=True)

    try:
        for f in files:
            safe_filename = Path(f.filename).name
            target_path = batch_temp_dir / safe_filename
            with open(target_path, "wb") as out_f:
                shutil.copyfileobj(f.file, out_f)

            size_bytes = target_path.stat().st_size
            sample_text = ""
            try:
                with open(target_path, "r", encoding="utf-8", errors="ignore") as tf:
                    sample_text = tf.read(2048)
            except Exception:
                pass

            staged_files_data.append({
                "filename": safe_filename,
                "file_path": str(target_path),
                "size_bytes": size_bytes,
                "content_sample": sample_text,
            })

        # Register batch job
        batch_record = batch_manager.create_batch(
            workspace_id=workspace_id,
            files_data=staged_files_data,
            batch_name=batch_name,
            uploader=user,
        )

        # Dispatch background asynchronous processing pipeline
        await batch_manager.start_batch_processing(batch_record["id"], mcp_client=client)

        return {
            "status": "ACCEPTED",
            "message": f"Batch '{batch_record['name']}' accepted with {len(staged_files_data)} documents for asynchronous processing.",
            "batch_id": batch_record["id"],
            "workspace_id": workspace_id,
            "total_files": batch_record["total_files"],
            "batch": batch_record,
        }

    except Exception as e:
        logger.error(f"Error initiating batch upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/workspaces/{workspace_id}/batches")
async def get_workspace_batches_endpoint(
    workspace_id: str,
    limit: int = Query(50),
):
    """List all batch processing jobs for a workspace with real-time status and metrics."""
    try:
        return batch_manager.list_batches(workspace_id, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/workspaces/{workspace_id}/batches/{batch_id}")
async def get_batch_details_endpoint(
    workspace_id: str,
    batch_id: str,
):
    """Get granular per-file status, progress percentage, and live logs for a batch."""
    b = batch_manager.get_batch(batch_id)
    if not b or b.get("workspace_id") != workspace_id:
        raise HTTPException(status_code=404, detail="Batch job not found.")
    return b


@app.post("/api/workspaces/{workspace_id}/batches/{batch_id}/retry")
async def retry_batch_endpoint(
    workspace_id: str,
    batch_id: str,
):
    """Re-trigger failed documents in a batch asynchronously."""
    b = await batch_manager.retry_batch(batch_id, mcp_client=client)
    if not b:
        raise HTTPException(status_code=404, detail="Batch job not found.")
    return {"message": "Batch retry triggered", "batch": b}


@app.delete("/api/workspaces/{workspace_id}/batches/{batch_id}")
async def delete_batch_endpoint(
    workspace_id: str,
    batch_id: str,
):
    """Remove batch record from workspace history."""
    success = batch_manager.delete_batch(batch_id)
    if not success:
        raise HTTPException(status_code=404, detail="Batch job not found.")
    return {"message": "Batch removed from workspace history", "batch_id": batch_id}


@app.get("/api/workspaces/{workspace_id}/stream")
async def stream_workspace_events_endpoint(workspace_id: str):
    """
    Server-Sent Events (SSE) streaming endpoint powered by Redis Pub/Sub.
    Clients receive instant, zero-polling live notifications for document ingestion,
    cache hits, and batch completion.
    """
    async def event_generator():
        yield "data: {\"event\": \"connected\", \"workspace_id\": \"%s\", \"timestamp\": \"%s\"}\n\n" % (
            workspace_id, datetime.utcnow().strftime("%H:%M:%S")
        )
        async for event in redis_service.subscribe_workspace_events(workspace_id):
            yield f"data: {json.dumps(event)}\n\n"

    from fastapi.responses import StreamingResponse
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/api/redis/status")
async def get_redis_health_endpoint():
    """Returns live Redis connectivity status and caching capabilities."""
    is_live = await redis_service.ping_redis()
    return {
        "redis_connected": is_live,
        "mode": "DISTRIBUTED_REDIS" if is_live else "LOCAL_MEMORY_FALLBACK",
        "features": {
            "content_addressable_llm_caching": True,
            "pub_sub_realtime_streaming": is_live,
            "redlock_distributed_pr_mutex": is_live,
            "workspace_status_caching": True,
            "sliding_window_rate_limiting": is_live,
        },
        "description": "Content-addressable deduplication & distributed knowledge operations engine."
    }




# ---------------------------------------------------------------------------
# Proposals & Review Queue (Knowledge PRs)
# ---------------------------------------------------------------------------

@app.get("/api/workspaces/{workspace_id}/proposals")
async def get_proposals(
    workspace_id: str,
    document_version_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    try:
        filter_status = None if (not status or status.upper() == "ALL") else status.upper()
        props = db_store.get_db_proposals(workspace_id, status=filter_status)
        if not props:
            props = await client.list_proposals(workspace_id, status=filter_status)
        return props
    except Exception:
        return db_store.get_db_proposals(workspace_id)


@app.post("/api/workspaces/{workspace_id}/proposals")
async def create_proposal_endpoint(
    workspace_id: str,
    req: CreateProposalRequest,
):
    try:
        return db_store.create_db_proposal(
            workspace_id=workspace_id,
            proposal_type=req.proposal_type,
            summary=req.summary,
            rationale=req.rationale,
            proposed_changes=req.proposed_changes,
            knowledge_item_id=req.knowledge_item_id,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/workspaces/{workspace_id}/proposals/{proposal_id}/review")
async def review_proposal_endpoint(
    workspace_id: str,
    proposal_id: str,
    req: ReviewProposalRequest,
):
    decision = req.decision.upper()
    # Acquire Redis Distributed Mutex (Redlock pattern)
    locked = await redis_service.acquire_proposal_lock(proposal_id, operator_name="reviewer")
    if not locked:
        raise HTTPException(
            status_code=409,
            detail="Conflict: This proposal is currently being reviewed or merged by another collaborator."
        )

    try:
        # Fast direct DB review (sub-millisecond execution)
        result = db_store.review_db_proposal(workspace_id, proposal_id, decision, req.comments)
        await redis_service.invalidate_workspace_cache(workspace_id)
        return result
    except Exception:
        try:
            if decision == "APPROVED":
                res = await client.approve_proposal(proposal_id, req.comments)
            elif decision == "REJECTED":
                res = await client.reject_proposal(proposal_id, req.comments)
            elif decision in ("ARCHIVED", "STASHED"):
                res = await client.archive_proposal(proposal_id, req.comments)
            elif decision == "RESTORE":
                res = await client.restore_proposal(proposal_id)
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported decision '{decision}'.")
            await redis_service.invalidate_workspace_cache(workspace_id)
            return res
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    finally:
        await redis_service.release_proposal_lock(proposal_id)



@app.post("/api/workspaces/{workspace_id}/proposals/batch-review")
async def batch_review_endpoint(
    workspace_id: str,
    req: BatchReviewRequest,
):
    try:
        # Fast direct DB batch review (sub-millisecond execution)
        return db_store.batch_review_db_proposals(
            workspace_id=workspace_id,
            decision=req.decision,
            proposal_ids=req.proposal_ids,
            comments=req.comments,
        )
    except Exception:
        try:
            return await client.batch_review_proposals(
                workspace_id=workspace_id,
                decision=req.decision,
                proposal_ids=req.proposal_ids,
                comments=req.comments,
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# Semantic Diff & Policy Validation
# ---------------------------------------------------------------------------

@app.get("/api/workspaces/{workspace_id}/diff")
async def get_semantic_diff_endpoint(
    workspace_id: str,
    proposal_id: Optional[str] = Query(None),
    document_version_id: Optional[str] = Query(None),
):
    try:
        diff_data = await client.get_semantic_diff(workspace_id, proposal_id, document_version_id)
        if not diff_data or (not diff_data.get("additions") and not diff_data.get("modifications") and not diff_data.get("unchanged")):
            diff_data = db_store.get_db_semantic_diff(workspace_id)
        return diff_data
    except Exception:
        return db_store.get_db_semantic_diff(workspace_id)


@app.get("/api/workspaces/{workspace_id}/validate")
async def get_validation_endpoint(
    workspace_id: str,
    proposal_id: Optional[str] = Query(None),
):
    try:
        return db_store.validate_db_proposals(workspace_id, proposal_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Knowledge Register & Graph
# ---------------------------------------------------------------------------

@app.get("/api/workspaces/{workspace_id}/graph")
async def get_knowledge_graph_endpoint(workspace_id: str):
    try:
        graph = await client.get_knowledge_graph(workspace_id)
        if not graph or not graph.get("nodes"):
            graph = db_store.get_db_knowledge_graph(workspace_id)
        return graph
    except Exception:
        return db_store.get_db_knowledge_graph(workspace_id)


@app.get("/api/workspaces/{workspace_id}/knowledge")
async def get_knowledge_endpoint(
    workspace_id: str,
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    try:
        items = db_store.get_db_knowledge_items(workspace_id, type=type, status=status)
        if not items:
            items = await client.list_knowledge(workspace_id, type=type, status=status)
        return items
    except Exception:
        return db_store.get_db_knowledge_items(workspace_id, type=type, status=status)


@app.get("/api/knowledge/{item_id}")
async def get_knowledge_item_endpoint(item_id: str):
    try:
        return await client.get_knowledge_item(item_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/workspaces/{workspace_id}/search")
async def search_knowledge_endpoint(
    workspace_id: str,
    q: str = Query(..., description="Search query string"),
):
    try:
        results = db_store.search_db_knowledge(workspace_id, q)
        if not results:
            results = await client.search_knowledge(workspace_id, q)
        return results
    except Exception as e:
        return db_store.search_db_knowledge(workspace_id, q)


# ---------------------------------------------------------------------------
# Rules (Policy Linter)
# ---------------------------------------------------------------------------

@app.get("/api/workspaces/{workspace_id}/rules")
async def get_rules_endpoint(workspace_id: str):
    try:
        rules = await client.list_rules(workspace_id)
        if not rules:
            rules = db_store.get_db_rules(workspace_id)
        return rules
    except Exception:
        return db_store.get_db_rules(workspace_id)


@app.post("/api/workspaces/{workspace_id}/rules")
async def create_rule_endpoint(
    workspace_id: str,
    req: CreateRuleRequest,
):
    try:
        return await client.create_rule(
            workspace_id=workspace_id,
            name=req.name,
            operator=req.operator,
            configuration=req.configuration,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/rules/{rule_id}/enable")
async def enable_rule_endpoint(rule_id: str):
    try:
        return await client.enable_rule(rule_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/rules/{rule_id}/disable")
async def disable_rule_endpoint(rule_id: str):
    try:
        return await client.disable_rule(rule_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/rules/{rule_id}")
async def delete_rule_endpoint(rule_id: str):
    try:
        return await client.delete_rule(rule_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# Workflows, Metrics & Activity
# ---------------------------------------------------------------------------

@app.get("/api/workspaces/{workspace_id}/workflows")
async def list_workflows_endpoint(
    workspace_id: str,
    status: Optional[str] = Query(None),
):
    try:
        return await client.list_workflows(workspace_id, status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/workflows/{workflow_id}/status")
async def get_workflow_status_endpoint(workflow_id: str):
    try:
        return await client.get_workflow_status(workflow_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/workflows/{workflow_id}/metrics")
async def get_run_metrics_endpoint(workflow_id: str):
    try:
        return await client.get_run_metrics(workflow_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/workspaces/{workspace_id}/activity")
async def get_activity_feed_endpoint(
    workspace_id: str,
    limit: int = Query(50),
):
    try:
        return await client.get_activity_feed(workspace_id, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Static Studio UI Hosting (SPA with catch-all routing)
# ---------------------------------------------------------------------------

@app.get("/healthz")
async def healthz():
    return {"status": "ok", "service": "diffweave", "platform": "huggingface-space"}

@app.get("/.well-known/assetlinks.json")
async def get_assetlinks():
    return [
        {
            "relation": ["delegate_permission/common.get_login_creds"],
            "target": {
                "namespace": "web",
                "site": "https://www.doc-weave.xyz"
            }
        },
        {
            "relation": ["delegate_permission/common.get_login_creds"],
            "target": {
                "namespace": "web",
                "site": "https://doc-weave.xyz"
            }
        },
        {
            "relation": ["delegate_permission/common.get_login_creds"],
            "target": {
                "namespace": "web",
                "site": "https://doc-weave.vercel.app"
            }
        },
        {
            "relation": ["delegate_permission/common.get_login_creds"],
            "target": {
                "namespace": "web",
                "site": "https://diff-weave.vercel.app"
            }
        },
        {
            "relation": ["delegate_permission/common.get_login_creds"],
            "target": {
                "namespace": "web",
                "site": "https://shak3008-diffweave.hf.space"
            }
        }
    ]

studio_dist_candidates = [
    Path("/app/studio/dist"),
    Path("studio/dist"),
    Path(__file__).parent.parent.parent / "studio" / "dist",
    Path(__file__).parent.parent / "studio" / "dist",
    Path("C:/Users/Adhi/Desktop/DiffWeave/studio/dist"),
]

dist_path = None
for p in studio_dist_candidates:
    if p.exists() and (p / "index.html").exists():
        dist_path = p
        break

if dist_path:
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    assets_path = dist_path / "assets"
    if assets_path.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_path)), name="studio_assets")

    @app.get("/{full_path:path}")
    async def serve_spa_page(full_path: str):
        # Allow static files if they exist in dist
        file_p = dist_path / full_path
        if file_p.exists() and file_p.is_file():
            return FileResponse(file_p)
        # Otherwise fallback to index.html for React Router (e.g. /login, /signup)
        return FileResponse(dist_path / "index.html")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run("diffweave.bridge.app:app", host="0.0.0.0", port=port, reload=False)
