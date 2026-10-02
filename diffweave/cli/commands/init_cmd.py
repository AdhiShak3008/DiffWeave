"""
`dw init` command.
Initializes a local DiffWeave workspace in the current directory.
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
    workspace_id: Optional[str] = typer.Option(None, "--workspace", "-w", help="Workspace UUID to bind to"),
    create: Optional[str] = typer.Option(None, "--create", "-c", help="Create a new workspace with this name"),
    as_json: bool = typer.Option(False, "--json", help="Output machine-readable JSON"),
):
    """
    Initialize a DiffWeave workspace in the current directory (.diffweave/).
    """
    client = DiffWeaveMCPClient()

    try:
        # Check MCP server availability
        workspaces = client.call_tool_sync("list_workspaces")
    except Exception as e:
        print_error(f"Cannot connect to DocWeave MCP server: {e}", code="MCP_CONNECT_FAIL")
        raise typer.Exit(code=1)

    target_ws = None

    if create:
        try:
            target_ws = client.call_tool_sync("create_workspace", {"name": create.strip()})
            print_success(f"Created new DocWeave workspace: [bold]{target_ws['name']}[/bold] ({target_ws['id']})")
        except Exception as e:
            print_error(f"Failed to create workspace: {e}")
            raise typer.Exit(code=1)

    elif workspace_id:
        target_ws = next((w for w in workspaces if w["id"] == workspace_id.strip()), None)
        if not target_ws:
            print_error(f"Workspace with ID '{workspace_id}' not found in DocWeave.")
            raise typer.Exit(code=1)

    elif workspaces:
        # If running interactively, prompt user or pick first
        if len(workspaces) == 1:
            target_ws = workspaces[0]
        else:
            print_info("Multiple workspaces found:")
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
        "workspace_id": target_ws["id"],
        "workspace_name": target_ws["name"],
        "mcp_server": "docweave",
    }
    cfg_path = save_config(config_data)

    if as_json:
        print_json({"initialized": True, "config_path": str(cfg_path), **config_data})
    else:
        print_success(
            f"Initialized DiffWeave workspace in [bold]{Path.cwd() / '.diffweave'}[/bold]\n"
            f"Bound to: [cyan]{target_ws['name']}[/cyan] ({target_ws['id']})"
        )
