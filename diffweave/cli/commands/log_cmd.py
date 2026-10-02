"""
`dw log` command.
Chronological knowledge audit history and telemetry timeline.
"""
from __future__ import annotations

from typing import Optional
import typer
from rich.table import Table

from diffweave.cli.config import get_active_workspace
from diffweave.cli.output import print_error, print_json, console
from diffweave.mcp.client import DiffWeaveMCPClient


def log_command(
    limit: int = typer.Option(20, "--limit", "-n", help="Number of history events to display"),
    workspace_id: Optional[str] = typer.Option(None, "--workspace", "-w", help="Workspace UUID override"),
    as_json: bool = typer.Option(False, "--json", help="Output machine-readable JSON"),
):
    """
    View chronological knowledge audit log (commits, reviews, workflows).
    """
    try:
        active_ws_id = get_active_workspace(workspace_id)
    except Exception as e:
        print_error(str(e))
        raise typer.Exit(code=1)

    client = DiffWeaveMCPClient()

    try:
        feed = client.call_tool_sync("get_activity_feed", {"workspace_id": active_ws_id, "limit": limit})
    except Exception as e:
        print_error(f"Failed to fetch activity log: {e}")
        raise typer.Exit(code=1)

    if as_json:
        print_json(feed)
        return

    events = feed.get("events", [])
    if not events:
        console.print("[dim]No activity events recorded in this workspace yet.[/dim]")
        return

    table = Table(title=f"Knowledge Audit History (Last {len(events)} events)", header_style="bold blue")
    table.add_column("Timestamp", style="dim")
    table.add_column("Event Type", style="cyan")
    table.add_column("Details", style="white")

    for ev in events:
        ev_type = ev.get("type", "event")
        if "approved" in ev_type or "completed" in ev_type:
            badge = f"[green]{ev_type}[/green]"
        elif "rejected" in ev_type:
            badge = f"[red]{ev_type}[/red]"
        elif "archived" in ev_type:
            badge = f"[yellow]{ev_type}[/yellow]"
        else:
            badge = f"[cyan]{ev_type}[/cyan]"

        table.add_row(
            str(ev.get("timestamp", ""))[:19],
            badge,
            ev.get("message", ""),
        )

    console.print(table)
