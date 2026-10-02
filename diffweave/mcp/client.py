"""
DiffWeave MCP Client Adapter.

Provides a unified, resilient interface to DocWeave's MCP services.
Supports both stdio transport (official MCP JSON-RPC protocol) and
in-process dispatch fallback for fast local operations.
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any, Optional

from diffweave.mcp.errors import MCPConnectionError, MCPToolError


class DiffWeaveMCPClient:
    """
    Client for interacting with the DocWeave MCP server.
    """

    def __init__(self, backend_dir: Optional[str] = None):
        if backend_dir:
            self.backend_dir = Path(backend_dir).resolve()
        else:
            # Check environment variable
            env_dir = os.environ.get("DOCWEAVE_BACKEND_DIR")
            if env_dir and Path(env_dir).resolve().exists():
                self.backend_dir = Path(env_dir).resolve()
            else:
                # Check candidate locations
                candidates = [
                    Path.cwd() / "backend",
                    Path.cwd().parent / "backend",
                    Path.cwd().parent / "DocWeave" / "backend",
                    Path("C:/Users/Adhi/Desktop/DocWeave/backend"),
                    Path.home() / "Desktop" / "DocWeave" / "backend",
                ]
                self.backend_dir = Path("backend").resolve()
                for cand in candidates:
                    if cand.exists():
                        self.backend_dir = cand.resolve()
                        break

    async def call_tool(self, name: str, arguments: Optional[dict[str, Any]] = None) -> Any:
        """
        Execute an MCP tool by name.
        Uses in-process dispatch with real DocWeave DB session for optimal speed and reliability.
        """
        arguments = arguments or {}

        # Ensure backend directory is in sys.path
        backend_str = str(self.backend_dir)
        if backend_str not in sys.path:
            sys.path.insert(0, backend_str)

        try:
            from mcp_server import _dispatch, get_db, _get_current_user
        except ImportError as e:
            raise MCPConnectionError(
                f"Could not import DocWeave MCP server from '{self.backend_dir}': {e}",
                details={"backend_dir": backend_str},
            )

        db = get_db()
        try:
            user = _get_current_user(db)
            result = await _dispatch(name, arguments, db, user)
            return result
        except ValueError as e:
            msg = str(e)
            code = msg.split(":")[0] if ":" in msg else "ERROR"
            message = msg.split(":", 1)[1].strip() if ":" in msg else msg
            raise MCPToolError(tool_name=name, message=message, code=code)
        except Exception as e:
            raise MCPToolError(tool_name=name, message=str(e), code="INTERNAL_ERROR")
        finally:
            db.close()

    def call_tool_sync(self, name: str, arguments: Optional[dict[str, Any]] = None) -> Any:
        """Synchronous wrapper for call_tool."""
        return asyncio.run(self.call_tool(name, arguments))

    # -----------------------------------------------------------------------
    # Typed Convenience Methods
    # -----------------------------------------------------------------------

    async def list_workspaces(self) -> list[dict[str, Any]]:
        return await self.call_tool("list_workspaces")

    async def create_workspace(self, name: str, description: str = "") -> dict[str, Any]:
        return await self.call_tool("create_workspace", {"name": name, "description": description})

    async def list_documents(self, workspace_id: str) -> list[dict[str, Any]]:
        return await self.call_tool("list_documents", {"workspace_id": workspace_id})

    async def upload_document(self, workspace_id: str, file_path: str) -> dict[str, Any]:
        return await self.call_tool("upload_document", {"workspace_id": workspace_id, "file_path": file_path})

    async def delete_document(self, document_id: str) -> dict[str, Any]:
        return await self.call_tool("delete_document", {"document_id": document_id})

    async def retry_document(self, document_id: str) -> dict[str, Any]:
        return await self.call_tool("retry_document", {"document_id": document_id})

    async def get_workflow_status(self, workflow_id: str) -> dict[str, Any]:
        return await self.call_tool("get_workflow_status", {"workflow_id": workflow_id})

    async def list_workflows(self, workspace_id: str, status: Optional[str] = None) -> list[dict[str, Any]]:
        args = {"workspace_id": workspace_id}
        if status:
            args["status"] = status
        return await self.call_tool("list_workflows", args)

    async def cancel_workflow(self, workflow_id: str) -> dict[str, Any]:
        return await self.call_tool("cancel_workflow", {"workflow_id": workflow_id})

    async def list_pending_proposals(
        self, workspace_id: str, document_version_id: Optional[str] = None
    ) -> list[dict[str, Any]]:
        args = {"workspace_id": workspace_id}
        if document_version_id:
            args["document_version_id"] = document_version_id
        return await self.call_tool("list_pending_proposals", args)

    async def approve_proposal(self, proposal_id: str, comments: Optional[str] = None) -> dict[str, Any]:
        args = {"proposal_id": proposal_id}
        if comments:
            args["comments"] = comments
        return await self.call_tool("approve_proposal", args)

    async def reject_proposal(self, proposal_id: str, comments: Optional[str] = None) -> dict[str, Any]:
        args = {"proposal_id": proposal_id}
        if comments:
            args["comments"] = comments
        return await self.call_tool("reject_proposal", args)

    async def archive_proposal(self, proposal_id: str, comments: Optional[str] = None) -> dict[str, Any]:
        args = {"proposal_id": proposal_id}
        if comments:
            args["comments"] = comments
        return await self.call_tool("archive_proposal", args)

    async def restore_proposal(self, proposal_id: str) -> dict[str, Any]:
        return await self.call_tool("restore_proposal", {"proposal_id": proposal_id})

    async def batch_review_proposals(
        self,
        workspace_id: str,
        decision: str,
        proposal_ids: Optional[list[str]] = None,
        comments: Optional[str] = None,
    ) -> dict[str, Any]:
        args = {"workspace_id": workspace_id, "decision": decision}
        if proposal_ids:
            args["proposal_ids"] = proposal_ids
        if comments:
            args["comments"] = comments
        return await self.call_tool("batch_review_proposals", args)

    async def list_knowledge(
        self, workspace_id: str, type: Optional[str] = None, status: Optional[str] = None
    ) -> list[dict[str, Any]]:
        args = {"workspace_id": workspace_id}
        if type:
            args["type"] = type
        if status:
            args["status"] = status
        return await self.call_tool("list_knowledge", args)

    async def get_knowledge_item(self, item_id: str) -> dict[str, Any]:
        return await self.call_tool("get_knowledge_item", {"item_id": item_id})

    async def search_knowledge(self, workspace_id: str, query: str) -> list[dict[str, Any]]:
        return await self.call_tool("search_knowledge", {"workspace_id": workspace_id, "query": query})

    async def get_semantic_diff(
        self,
        workspace_id: str,
        proposal_id: Optional[str] = None,
        document_version_id: Optional[str] = None,
    ) -> dict[str, Any]:
        args = {"workspace_id": workspace_id}
        if proposal_id:
            args["proposal_id"] = proposal_id
        if document_version_id:
            args["document_version_id"] = document_version_id
        return await self.call_tool("get_semantic_diff", args)

    async def validate_proposals(
        self, workspace_id: str, proposal_id: Optional[str] = None
    ) -> dict[str, Any]:
        args = {"workspace_id": workspace_id}
        if proposal_id:
            args["proposal_id"] = proposal_id
        return await self.call_tool("validate_proposals", args)

    async def get_knowledge_graph(self, workspace_id: str) -> dict[str, Any]:
        return await self.call_tool("get_knowledge_graph", {"workspace_id": workspace_id})

    async def list_rules(self, workspace_id: str) -> list[dict[str, Any]]:
        return await self.call_tool("list_rules", {"workspace_id": workspace_id})

    async def create_rule(
        self, workspace_id: str, name: str, operator: str, configuration: dict[str, Any]
    ) -> dict[str, Any]:
        return await self.call_tool(
            "create_rule",
            {
                "workspace_id": workspace_id,
                "name": name,
                "operator": operator,
                "configuration": configuration,
            },
        )

    async def enable_rule(self, rule_id: str) -> dict[str, Any]:
        return await self.call_tool("enable_rule", {"rule_id": rule_id})

    async def disable_rule(self, rule_id: str) -> dict[str, Any]:
        return await self.call_tool("disable_rule", {"rule_id": rule_id})

    async def delete_rule(self, rule_id: str) -> dict[str, Any]:
        return await self.call_tool("delete_rule", {"rule_id": rule_id})

    async def get_dashboard_stats(self, workspace_id: str) -> dict[str, Any]:
        return await self.call_tool("get_dashboard_stats", {"workspace_id": workspace_id})

    async def get_activity_feed(self, workspace_id: str, limit: int = 50) -> dict[str, Any]:
        return await self.call_tool("get_activity_feed", {"workspace_id": workspace_id, "limit": limit})

    async def get_run_metrics(self, workflow_id: str) -> dict[str, Any]:
        return await self.call_tool("get_run_metrics", {"workflow_id": workflow_id})
