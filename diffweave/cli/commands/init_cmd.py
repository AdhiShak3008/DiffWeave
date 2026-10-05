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

    # Load authenticated identity
    from diffweave.cli.credentials import load_credentials
    creds = load_credentials()
    auth_email = creds.get("email") if creds else None
    current_uid = None

    try:
        from diffweave.bridge.db_store import get_engine
        from sqlalchemy import text
        eng = get_engine()
        with eng.connect() as conn:
            if auth_email:
                u_row = conn.execute(text("SELECT id FROM users WHERE LOWER(email)=:e"), {"e": auth_email.lower()}).first()
                if u_row:
                    current_uid = str(u_row[0])
    except Exception:
        pass

    try:
        # Check MCP server availability and get available workspaces
        workspaces = client.call_tool_sync("list_workspaces")
    except Exception as e:
        workspaces = []

    target_ws = None
    target_name = (create or workspace or "").strip()

    if create:
        clean_create = create.strip()
        # Enforce unique workspace name check
        try:
            from diffweave.bridge.db_store import get_engine
            from sqlalchemy import text
            eng = get_engine()
            with eng.connect() as conn:
                if current_uid:
                    existing = conn.execute(
                        text("SELECT id, name FROM workspaces WHERE created_by = :uid AND LOWER(TRIM(name)) = LOWER(TRIM(:n)) AND (status != 'DELETED' OR status IS NULL)"),
                        {"uid": current_uid, "n": clean_create}
                    ).first()
                else:
                    existing = conn.execute(
                        text("SELECT id, name FROM workspaces WHERE LOWER(TRIM(name)) = LOWER(TRIM(:n)) AND (status != 'DELETED' OR status IS NULL)"),
                        {"n": clean_create}
                    ).first()
                if existing:
                    print_error(f"Error: A workspace named '{clean_create}' already exists. Workspace names must be unique.")
                    raise typer.Exit(code=1)
        except typer.Exit:
            raise
        except Exception:
            pass

        try:
            target_ws = client.call_tool_sync("create_workspace", {"name": clean_create})
            if not as_json:
                print_success(f"Created new DocWeave workspace: [bold]{target_ws['name']}[/bold] ({target_ws['id']})")
        except Exception as e:
            print_error(f"Failed to create workspace: {e}")
            raise typer.Exit(code=1)

    elif target_name:
        # 1. Match by Workspace Name or UUID in user's workspaces
        target_ws = next(
            (
                w for w in workspaces
                if w.get("name", "").strip().lower() == target_name.lower()
                or str(w.get("id", "")).strip().lower() == target_name.lower()
            ),
            None,
        )

        # 2. Check database directly (ensuring user ownership scoping)
        if not target_ws:
            try:
                from diffweave.bridge.db_store import get_engine
                from sqlalchemy import text
                eng = get_engine()
                with eng.connect() as conn:
                    if current_uid:
                        # Scoped to current authenticated user
                        ws_row = conn.execute(
                            text("SELECT id, name, description FROM workspaces WHERE created_by = :uid AND (LOWER(TRIM(name)) = LOWER(TRIM(:n)) OR id::text = :n) AND (status != 'DELETED' OR status IS NULL)"),
                            {"uid": current_uid, "n": target_name}
                        ).first()
                    else:
                        ws_row = conn.execute(
                            text("SELECT id, name, description FROM workspaces WHERE (LOWER(TRIM(name)) = LOWER(TRIM(:n)) OR id::text = :n) AND (status != 'DELETED' OR status IS NULL)"),
                            {"n": target_name}
                        ).first()

                    if ws_row:
                        target_ws = {
                            "id": str(ws_row[0]),
                            "name": ws_row[1],
                            "description": ws_row[2] or "",
                        }
            except Exception:
                pass

        # 3. If workspace does not exist yet for this user, auto-create it under their account
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
