"""
`dw rules` subcommands.
Manages dynamic validation policy rules (linter rules) on the workspace.
"""
from __future__ import annotations

import json
from typing import Optional
import typer
from rich.table import Table

from diffweave.cli.config import get_active_workspace
from diffweave.cli.output import print_success, print_error, print_info, print_json, console
from diffweave.mcp.client import DiffWeaveMCPClient

rules_app = typer.Typer(name="rules", help="Manage validation policy rules for workspace.")


@rules_app.command("list")
def list_rules_cmd(
    workspace_id: Optional[str] = typer.Option(None, "--workspace", "-w", help="Workspace UUID override"),
    as_json: bool = typer.Option(False, "--json", help="Output machine-readable JSON"),
):
    """List all validation policy rules configured for the workspace."""
    try:
        active_ws_id = get_active_workspace(workspace_id)
    except Exception as e:
        print_error(str(e))
        raise typer.Exit(code=1)

    client = DiffWeaveMCPClient()
    try:
        rules = client.call_tool_sync("list_rules", {"workspace_id": active_ws_id})
    except Exception as e:
        print_error(f"Failed to list rules: {e}")
        raise typer.Exit(code=1)

    if as_json:
        print_json(rules)
        return

    if not rules:
        console.print("[dim]No policy rules configured. Use 'dw rules add' to create one.[/dim]")
        return

    table = Table(title="Workspace Policy Rules", header_style="bold cyan")
    table.add_column("Rule ID", style="dim")
    table.add_column("Name", style="bold white")
    table.add_column("Operator", style="cyan")
    table.add_column("Status", style="bold")
    table.add_column("Configuration", style="dim")

    for r in rules:
        status_styled = "[green]ENABLED[/green]" if r.get("enabled") else "[yellow]DISABLED[/yellow]"
        table.add_row(
            r.get("id", "")[:8],
            r.get("name", "Unnamed"),
            r.get("operator") or "n/a",
            status_styled,
            json.dumps(r.get("configuration") or {}),
        )

    console.print(table)


@rules_app.command("enable")
def enable_rule_cmd(rule_id: str = typer.Argument(..., help="Rule UUID to enable")):
    """Enable a validation rule."""
    client = DiffWeaveMCPClient()
    try:
        res = client.call_tool_sync("enable_rule", {"rule_id": rule_id})
        print_success(f"Rule '{res.get('name')}' ({rule_id[:8]}) is now ENABLED.")
    except Exception as e:
        print_error(f"Failed to enable rule: {e}")
        raise typer.Exit(code=1)


@rules_app.command("disable")
def disable_rule_cmd(rule_id: str = typer.Argument(..., help="Rule UUID to disable")):
    """Disable a validation rule without deleting it."""
    client = DiffWeaveMCPClient()
    try:
        res = client.call_tool_sync("disable_rule", {"rule_id": rule_id})
        print_info(f"Rule '{res.get('name')}' ({rule_id[:8]}) is now DISABLED.")
    except Exception as e:
        print_error(f"Failed to disable rule: {e}")
        raise typer.Exit(code=1)


@rules_app.command("add")
def add_rule_cmd(
    name: str = typer.Argument(..., help="Human-readable rule name"),
    operator: str = typer.Option("min_confidence", "--operator", "-o", help="Rule operator: min_confidence, required_evidence, allowed_proposal_types"),
    threshold: float = typer.Option(0.85, "--threshold", "-t", help="Threshold for min_confidence operator"),
    workspace_id: Optional[str] = typer.Option(None, "--workspace", "-w", help="Workspace UUID override"),
):
    """Add a new validation rule to the workspace."""
    try:
        active_ws_id = get_active_workspace(workspace_id)
    except Exception as e:
        print_error(str(e))
        raise typer.Exit(code=1)

    client = DiffWeaveMCPClient()
    config = {}
    if operator == "min_confidence":
        config = {"value": threshold}
    elif operator == "allowed_proposal_types":
        config = {"values": ["CREATE", "UPDATE"]}

    try:
        res = client.call_tool_sync(
            "create_rule",
            {
                "workspace_id": active_ws_id,
                "name": name,
                "operator": operator,
                "configuration": config,
            },
        )
        print_success(f"Created rule [bold]{res.get('name')}[/bold] (ID: {res.get('id')[:8]})")
    except Exception as e:
        print_error(f"Failed to create rule: {e}")
        raise typer.Exit(code=1)
