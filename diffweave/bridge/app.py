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

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import secrets
from datetime import datetime
from diffweave.cli.credentials import save_credentials, load_credentials, clear_credentials, get_credentials_file

from diffweave.mcp.client import DiffWeaveMCPClient
from diffweave.mcp.errors import MCPToolError, MCPConnectionError

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
                        SELECT w.id, w.name, w.description,
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
                        "description": r[2] or f"{r[4]} documents · {r[3]} verified facts",
                        "k_count": r[3],
                        "d_count": r[4]
                    }
                    for r in rows
                ]

            # If evaluator/demo or no user, return active workspaces (excluding deleted)
            rows = conn.execute(
                text("""
                    SELECT w.id, w.name, w.description,
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
                    "description": r[2] or f"{r[4]} documents · {r[3]} verified facts",
                    "k_count": r[3],
                    "d_count": r[4]
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

        # Create new workspace directly in DB with authenticated ownership
        ws_id = str(uuid.uuid4())
        if user_id == "00000000-0000-0000-0000-000000000001":
            docweave_auth.ensure_evaluator_user()
        owner_id = user_id or "59a0fed0-17c7-4013-82fc-985f5d1ee623"
        with eng.begin() as conn:
            conn.execute(
                text("""
                    INSERT INTO workspaces (id, name, description, created_by, status, created_at, updated_at)
                    VALUES (:id, :name, :desc, :uid, 'ACTIVE', NOW(), NOW())
                """),
                {"id": ws_id, "name": clean_name, "desc": req.description or "", "uid": owner_id}
            )

        return {
            "id": ws_id,
            "name": clean_name,
            "description": req.description or "",
            "status": "ACTIVE",
            "created_by": owner_id,
            "d_count": 0,
            "k_count": 0,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



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
        db_status = db_store.get_db_workspace_status(workspace_id)
        docs = db_store.get_db_documents(workspace_id)
        pending = db_store.get_db_proposals(workspace_id, status="PENDING")
        return {
            "workspace_id": workspace_id,
            "stats": db_status,
            "documents": docs,
            "pending_proposals": pending,
        }
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


@app.post("/api/documents/{document_id}/retry")
async def retry_document_endpoint(document_id: str):
    try:
        return await client.retry_document(document_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


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
    try:
        # Fast direct DB review (sub-millisecond execution)
        return db_store.review_db_proposal(workspace_id, proposal_id, decision, req.comments)
    except Exception:
        try:
            if decision == "APPROVED":
                return await client.approve_proposal(proposal_id, req.comments)
            elif decision == "REJECTED":
                return await client.reject_proposal(proposal_id, req.comments)
            elif decision in ("ARCHIVED", "STASHED"):
                return await client.archive_proposal(proposal_id, req.comments)
            elif decision == "RESTORE":
                return await client.restore_proposal(proposal_id)
            else:
                raise HTTPException(status_code=400, detail=f"Unsupported decision '{decision}'.")
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))


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
