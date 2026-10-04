"""
`dw push` command.
Pushes all approved knowledge proposals into the Master Knowledge Register in the cloud.
"""
from __future__ import annotations

from typing import Optional
import typer

from diffweave.cli.config import get_active_workspace
from diffweave.cli.output import print_success, print_error, print_info, print_json
from diffweave.mcp.client import DiffWeaveMCPClient


def push_command(
    workspace_id: Optional[str] = typer.Option(None, "--workspace", "-w", help="Workspace UUID override"),
    message: Optional[str] = typer.Option(None, "--message", "-m", help="Push commit message"),
    as_json: bool = typer.Option(False, "--json", help="Output machine-readable JSON"),
):
    """
    Push and publish staged document proposals to Master Knowledge Truth.
    """
    try:
        active_ws_id = get_active_workspace(workspace_id)
    except Exception as e:
        print_error(str(e))
        raise typer.Exit(code=1)

    client = DiffWeaveMCPClient()

    if not as_json:
        print_info(f"Pushing knowledge proposals to Master Register for workspace [cyan]{active_ws_id}[/cyan]...")

    try:
        res = client.call_tool_sync(
            "batch_review_proposals",
            {
                "workspace_id": active_ws_id,
                "decision": "APPROVED",
                "comments": message or "Synchronized via dw push",
            },
        )
        count = res.get("processed_count", 0)
        if as_json:
            print_json({"pushed": True, "count": count, "workspace_id": active_ws_id})
        else:
            if count > 0:
                print_success(f"Successfully pushed and committed [bold]{count}[/bold] proposal(s) to Master Knowledge Register!")
            else:
                print_success("Knowledge Register is already up to date with workspace state. Everything synced.")
    except Exception as e:
        print_error(f"Push failed: {e}")
        raise typer.Exit(code=1)
