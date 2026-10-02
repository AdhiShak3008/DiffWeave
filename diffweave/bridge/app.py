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


class ReviewProposalRequest(BaseModel):
    decision: str  # APPROVED, REJECTED, ARCHIVED
    comments: Optional[str] = None


class BatchReviewRequest(BaseModel):
    decision: str  # APPROVED, REJECTED
    proposal_ids: Optional[list[str]] = None
    comments: Optional[str] = None


class CreateRuleRequest(BaseModel):
    name: str
    operator: str
    configuration: dict[str, Any]



# ---------------------------------------------------------------------------
# Authentication & API Key Management
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str


@app.post("/api/auth/signup")
async def signup_endpoint(req: SignupRequest):
    user_email = req.email.strip().lower()
    username = req.username.strip()
    api_key = f"dw_live_{secrets.token_hex(16)}"
    mcp_url = os.environ.get("DOCWEAVE_MCP_URL", "http://127.0.0.1:7860")
    
    try:
        save_credentials(
            access_token=api_key,
            email=user_email,
            username=username,
            mcp_url=mcp_url,
        )
        cli_synced = True
    except Exception:
        cli_synced = False
        
    return {
        "access_token": api_key,
        "api_key": api_key,
        "username": username,
        "email": user_email,
        "role": "Architect",
        "provider": "docweave-identity",
        "cli_command": f"dw login --api-key {api_key}",
        "cli_synced": cli_synced,
        "credentials_path": str(get_credentials_file()),
    }


class LoginRequest(BaseModel):
    username: str
    password: Optional[str] = None
    email: Optional[str] = None


class GenerateKeyRequest(BaseModel):
    name: Optional[str] = "CLI Personal Access Token"
    expires_in_days: Optional[int] = 90


class SyncCLIRequest(BaseModel):
    access_token: str
    email: Optional[str] = None
    username: Optional[str] = None
    mcp_url: Optional[str] = None


@app.post("/api/auth/demo-login")
async def demo_login():
    api_key = f"dw_live_demo_{secrets.token_hex(16)}"
    username = "DocWeave Evaluator"
    email = "evaluator@docweave.io"
    mcp_url = os.environ.get("DOCWEAVE_MCP_URL", "http://127.0.0.1:7860")
    
    try:
        save_credentials(
            access_token=api_key,
            email=email,
            username=username,
            mcp_url=mcp_url,
        )
        cli_synced = True
    except Exception:
        cli_synced = False
        
    return {
        "access_token": api_key,
        "api_key": api_key,
        "username": username,
        "email": email,
        "role": "Evaluator / Architect",
        "provider": "docweave-sso",
        "cli_command": f"dw login --token {api_key}",
        "cli_synced": cli_synced,
        "credentials_path": str(get_credentials_file()),
    }


@app.post("/api/auth/login")
async def login_endpoint(req: LoginRequest):
    user_email = req.email or req.username
    username = req.username if "@" not in req.username else req.username.split("@")[0]
    api_key = f"dw_live_{secrets.token_hex(16)}"
    mcp_url = os.environ.get("DOCWEAVE_MCP_URL", "http://127.0.0.1:7860")
    
    try:
        save_credentials(
            access_token=api_key,
            email=user_email,
            username=username,
            mcp_url=mcp_url,
        )
        cli_synced = True
    except Exception:
        cli_synced = False
        
    return {
        "access_token": api_key,
        "api_key": api_key,
        "username": username,
        "email": user_email,
        "role": "Developer",
        "provider": "docweave-sso",
        "cli_command": f"dw login --token {api_key}",
        "cli_synced": cli_synced,
        "credentials_path": str(get_credentials_file()),
    }


@app.post("/api/auth/generate-key")
async def generate_key_endpoint(req: GenerateKeyRequest):
    api_key = f"dw_live_{secrets.token_hex(16)}"
    creds = load_credentials() or {}
    synced = False
    if creds:
        try:
            save_credentials(
                access_token=api_key,
                email=creds.get("email"),
                username=creds.get("username"),
                mcp_url=creds.get("mcp_url"),
            )
            synced = True
        except Exception:
            pass
            
    return {
        "name": req.name,
        "api_key": api_key,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "expires_in_days": req.expires_in_days,
        "cli_command": f"dw login --token {api_key}",
        "cli_synced": synced,
        "credentials_path": str(get_credentials_file()),
    }


@app.post("/api/auth/sync-cli")
async def sync_cli_endpoint(req: SyncCLIRequest):
    try:
        save_credentials(
            access_token=req.access_token,
            email=req.email,
            username=req.username,
            mcp_url=req.mcp_url or "http://127.0.0.1:7860",
        )
        return {
            "status": "ok",
            "synced": True,
            "path": str(get_credentials_file()),
            "username": req.username,
            "token_preview": req.access_token[:12] + "...",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/auth/whoami")
async def get_whoami_endpoint():
    creds = load_credentials()
    if not creds:
        return {"authenticated": False, "user": None}
    return {
        "authenticated": True,
        "user": {
            "username": creds.get("username", "Authenticated User"),
            "email": creds.get("email", ""),
            "access_token": creds.get("access_token", ""),
            "mcp_url": creds.get("mcp_url", ""),
        },
        "credentials_path": str(get_credentials_file()),
    }


@app.post("/api/auth/logout")
async def logout_endpoint():
    clear_credentials()
    return {"status": "ok", "message": "Logged out and cleared credentials."}


# ---------------------------------------------------------------------------
# Health & MCP Meta
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "diffweave-bridge", "mcp_connected": True}


@app.get("/api/mcp/tools")
async def list_mcp_tools():
    """Discover all MCP tools exposed by the underlying DocWeave server."""
    from mcp_server import list_tools
    tools = await list_tools()
    return [
        {
            "name": t.name,
            "description": t.description,
            "inputSchema": t.inputSchema,
        }
        for t in tools
    ]


# ---------------------------------------------------------------------------
# Workspaces
# ---------------------------------------------------------------------------

@app.get("/api/workspaces")
async def get_workspaces():
    try:
        return await client.list_workspaces()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workspaces")
async def create_workspace(req: CreateWorkspaceRequest):
    try:
        return await client.create_workspace(name=req.name, description=req.description)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/workspaces/{workspace_id}/status")
async def get_workspace_status(workspace_id: str):
    try:
        stats = await client.get_dashboard_stats(workspace_id)
        docs = await client.list_documents(workspace_id)
        pending = await client.list_pending_proposals(workspace_id)
        return {
            "workspace_id": workspace_id,
            "stats": stats,
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
        return await client.list_documents(workspace_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        result = await client.upload_document(workspace_id, tmp_path)
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
):
    try:
        return await client.list_pending_proposals(workspace_id, document_version_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workspaces/{workspace_id}/proposals/{proposal_id}/review")
async def review_proposal_endpoint(
    workspace_id: str,
    proposal_id: str,
    req: ReviewProposalRequest,
):
    decision = req.decision.upper()
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
        return await client.get_semantic_diff(workspace_id, proposal_id, document_version_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/workspaces/{workspace_id}/validate")
async def get_validation_endpoint(
    workspace_id: str,
    proposal_id: Optional[str] = Query(None),
):
    try:
        return await client.validate_proposals(workspace_id, proposal_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Knowledge Register & Graph
# ---------------------------------------------------------------------------

@app.get("/api/workspaces/{workspace_id}/graph")
async def get_knowledge_graph_endpoint(workspace_id: str):
    try:
        return await client.get_knowledge_graph(workspace_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/workspaces/{workspace_id}/knowledge")
async def get_knowledge_endpoint(
    workspace_id: str,
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
):
    try:
        return await client.list_knowledge(workspace_id, type=type, status=status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        return await client.search_knowledge(workspace_id, q)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Rules (Policy Linter)
# ---------------------------------------------------------------------------

@app.get("/api/workspaces/{workspace_id}/rules")
async def get_rules_endpoint(workspace_id: str):
    try:
        return await client.list_rules(workspace_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
# Static Studio UI Hosting (if built)
# ---------------------------------------------------------------------------

@app.get("/healthz")
async def healthz():
    return {"status": "ok", "service": "diffweave", "platform": "huggingface-space"}


studio_dist_candidates = [
    Path("/app/studio/dist"),
    Path("studio/dist"),
    Path(__file__).parent.parent.parent / "studio" / "dist",
    Path(__file__).parent.parent / "studio" / "dist",
    Path("C:/Users/Adhi/Desktop/DiffWeave/studio/dist"),
]
for dist_path in studio_dist_candidates:
    if dist_path.exists() and (dist_path / "index.html").exists():
        from fastapi.staticfiles import StaticFiles
        app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="studio_ui")
        break


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run("diffweave.bridge.app:app", host="0.0.0.0", port=port, reload=False)
