"""
`dw init` command.
Initializes a local DiffWeave workspace in the current directory.
Supports binding by Workspace Name or UUID, with automatic creation.
"""
from __future__ import annotations

from pathlib import Path
from typing import Optional
import typer
from rich.prompt import Prompt

from diffweave.cli.config import save_config, load_config
from diffweave.cli.output import print_success, print_info, print_error, print_json
from diffweave.mcp.client import DiffWeaveMCPClient


def init_command(
    workspace: Optional[str] = typer.Option(
        None,
        "--workspace",
        "-w",
        help="Workspace name or UUID to bind to (e.g. 'security-policies' or 'heart')",
    ),
    create: Optional[str] = typer.Option(
        None,
        "--create",
        "-c",
        help="Create a new workspace with this name",
    ),
    as_json: bool = typer.Option(False, "--json", help="Output machine-readable JSON"),
):
    """
    Initialize a DiffWeave workspace in the current directory (.diffweave/).
    You can specify a workspace by its unique name or its UUID.
    """
    client = DiffWeaveMCPClient()

    try:
        # Check MCP server availability and get available workspaces
        workspaces = client.call_tool_sync("list_workspaces")
    except Exception as e:
        workspaces = []

    target_ws = None
    target_name = (create or workspace or "").strip()

    if create:
        try:
            target_ws = client.call_tool_sync("create_workspace", {"name": create.strip()})
            if not as_json:
                print_success(f"Created new DocWeave workspace: [bold]{target_ws['name']}[/bold] ({target_ws['id']})")
        except Exception as e:
            print_error(f"Failed to create workspace: {e}")
            raise typer.Exit(code=1)

    elif target_name:
        # 1. Match by Workspace Name (case-insensitive) or UUID in retrieved workspaces
        target_ws = next(
            (
                w for w in workspaces
                if w.get("name", "").strip().lower() == target_name.lower()
                or str(w.get("id", "")).strip().lower() == target_name.lower()
            ),
            None,
        )

        # 2. Check local database directly (including case-insensitive name match)
        if not target_ws:
            try:
                from mcp_server import get_db, Workspace, WorkspaceStatus
                from sqlalchemy import func
                db = get_db()
                ws_row = (
                    db.query(Workspace)
                    .filter(
                        (func.lower(Workspace.name) == target_name.lower())
                        | (Workspace.id == target_name)
                    )
                    .first()
                )
                if ws_row:
                    if ws_row.status != WorkspaceStatus.ACTIVE:
                        ws_row.status = WorkspaceStatus.ACTIVE
                        db.commit()
                    target_ws = {
                        "id": str(ws_row.id),
                        "name": ws_row.name,
                        "description": ws_row.description or "",
                    }
                db.close()
            except Exception:
                pass

        # 3. If workspace does not exist yet, auto-create it by name
        if not target_ws:
            try:
                target_ws = client.call_tool_sync("create_workspace", {"name": target_name})
                if not as_json:
                    print_success(f"Initialized new workspace: [bold]{target_ws['name']}[/bold] ({target_ws['id']})")
            except Exception:
                target_ws = {"id": target_name, "name": target_name, "description": ""}

    elif workspaces:
        # If running interactively with no argument, pick first or prompt
        if len(workspaces) == 1:
            target_ws = workspaces[0]
        else:
            print_info("Available workspaces:")
            for idx, w in enumerate(workspaces, 1):
                print_info(f"  [{idx}] {w['name']} ({w['id']})")
            choice = Prompt.ask("Select workspace index", default="1")
            try:
                target_ws = workspaces[int(choice) - 1]
            except Exception:
                target_ws = workspaces[0]
    else:
        # Auto-create default
        try:
            target_ws = client.call_tool_sync("create_workspace", {"name": "Default Workspace"})
        except Exception as e:
            print_error(f"No workspaces exist and failed to create one: {e}")
            raise typer.Exit(code=1)

    # Save to local .diffweave/config.json
    config_data = {
        "workspace_id": str(target_ws["id"]),
        "workspace_name": target_ws.get("name", target_name),
        "mcp_server": "docweave",
    }
    cfg_path = save_config(config_data)

    if as_json:
        print_json({"initialized": True, "config_path": str(cfg_path), **config_data})
    else:
        print_success(
            f"Initialized DiffWeave workspace in [bold]{Path.cwd() / '.diffweave'}[/bold]\n"
            f"Bound to: [cyan]{target_ws.get('name', target_name)}[/cyan] ({target_ws['id']})"
        )
