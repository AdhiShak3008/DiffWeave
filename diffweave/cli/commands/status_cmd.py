"""
`dw status` command.
Displays workspace context, document inventory, workflows, and pending knowledge PRs.
"""
from __future__ import annotations

import time
from typing import Optional
import typer

from diffweave.cli.config import get_active_workspace, load_config
from diffweave.cli.output import render_status, print_error, print_json, console
from diffweave.mcp.client import DiffWeaveMCPClient


def status_command(
    workspace_id: Optional[str] = typer.Option(None, "--workspace", "-w", help="Workspace UUID override"),
    watch: bool = typer.Option(False, "--watch", help="Continuously refresh status (watch mode)"),
    interval: int = typer.Option(3, "--interval", "-i", help="Watch refresh interval in seconds"),
    as_json: bool = typer.Option(False, "--json", help="Output machine-readable JSON"),
):
    """
    Show workspace knowledge staging, active workflows, and review status.
    """
    try:
        active_ws_id = get_active_workspace(workspace_id)
    except Exception as e:
        print_error(str(e))
        raise typer.Exit(code=1)

    client = DiffWeaveMCPClient()
    config = load_config()
    ws_name = config.get("workspace_name", "DocWeave Workspace")

    def _fetch_and_render():
        # Fetch status data from DocWeave MCP
        docs = client.call_tool_sync("list_documents", {"workspace_id": active_ws_id})
        stats = client.call_tool_sync("get_dashboard_stats", {"workspace_id": active_ws_id})
        pending = client.call_tool_sync("list_pending_proposals", {"workspace_id": active_ws_id})

        if as_json:
            print_json({
                "workspace_id": active_ws_id,
                "workspace_name": ws_name,
                "stats": stats,
                "documents": docs,
                "pending_proposals": pending,
            })
        else:
            render_status(
                workspace_name=ws_name,
                workspace_id=active_ws_id,
                docs=docs,
                stats=stats,
                pending_proposals=pending,
            )

    if watch:
        console.print("[dim]Starting DiffWeave watch mode (Ctrl+C to stop)...[/dim]\n")
        try:
            while True:
                console.clear()
                _fetch_and_render()
                time.sleep(interval)
        except KeyboardInterrupt:
            console.print("\n[dim]Stopped watch mode.[/dim]")
    else:
        _fetch_and_render()
