"""
`dw diff` command.
Semantic Knowledge Diff comparing proposed document claims against committed truth.
"""
from __future__ import annotations

from typing import Optional
import typer

from diffweave.cli.config import get_active_workspace
from diffweave.cli.output import render_diff, print_error, print_json
from diffweave.mcp.client import DiffWeaveMCPClient


def diff_command(
    workspace_id: Optional[str] = typer.Option(None, "--workspace", "-w", help="Workspace UUID override"),
    proposal_id: Optional[str] = typer.Option(None, "--proposal", "-p", help="Diff a specific proposal only"),
    document_id: Optional[str] = typer.Option(None, "--document", "-d", help="Filter diff to proposals from document"),
    as_json: bool = typer.Option(False, "--json", help="Output machine-readable JSON"),
):
    """
    Inspect semantic differences, updates, and contradictions between documents and baseline knowledge.
    """
    try:
        active_ws_id = get_active_workspace(workspace_id)
    except Exception as e:
        print_error(str(e))
        raise typer.Exit(code=1)

    client = DiffWeaveMCPClient()

    try:
        diff_data = client.call_tool_sync(
            "get_semantic_diff",
            {
                "workspace_id": active_ws_id,
                "proposal_id": proposal_id,
                "document_version_id": document_id,
            },
        )
    except Exception as e:
        print_error(f"Failed to generate semantic diff: {e}")
        raise typer.Exit(code=1)

    if as_json:
        print_json(diff_data)
    else:
        render_diff(diff_data)
