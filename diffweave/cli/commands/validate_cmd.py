"""
`dw validate` command.
Evaluates active validation policy rules against extracted knowledge proposals.
"""
from __future__ import annotations

from typing import Optional
import typer
from rich.table import Table
from rich.panel import Panel

from diffweave.cli.config import get_active_workspace
from diffweave.cli.output import print_error, print_json, console
from diffweave.mcp.client import DiffWeaveMCPClient


def validate_command(
    workspace_id: Optional[str] = typer.Option(None, "--workspace", "-w", help="Workspace UUID override"),
    proposal_id: Optional[str] = typer.Option(None, "--proposal", "-p", help="Validate a specific proposal UUID"),
    as_json: bool = typer.Option(False, "--json", help="Output machine-readable JSON"),
    strict: bool = typer.Option(True, "--strict/--no-strict", help="Exit with non-zero code on violations (ideal for CI/CD)"),
):
    """
    Run policy rule validation (CI linter) on knowledge proposals.
    """
    try:
        active_ws_id = get_active_workspace(workspace_id)
    except Exception as e:
        print_error(str(e))
        raise typer.Exit(code=1)

    client = DiffWeaveMCPClient()

    try:
        val_res = client.call_tool_sync(
            "validate_proposals",
            {"workspace_id": active_ws_id, "proposal_id": proposal_id},
        )
    except Exception as e:
        print_error(f"Validation failed: {e}")
        raise typer.Exit(code=1)

    if as_json:
        print_json(val_res)
        if strict and not compliant:
            raise typer.Exit(code=1)
        return

    rules_total = val_res.get("rules_total", 0)
    rules_enabled = val_res.get("rules_enabled", 0)
    props_count = val_res.get("proposals_evaluated", 0)
    compliant = val_res.get("compliant", False)
    summary = val_res.get("summary", {})
    results = val_res.get("results", [])

    status_badge = "[bold green]COMPLIANT (0 VIOLATIONS)[/bold green]" if compliant else "[bold red]NON-COMPLIANT (VIOLATIONS DETECTED)[/bold red]"

    console.print(
        Panel(
            f"[bold white]Policy Compliance Status:[/bold white] {status_badge}\n"
            f"[bold white]Active Rules:[/bold white] {rules_enabled} of {rules_total} enabled\n"
            f"[bold white]Proposals Evaluated:[/bold white] {props_count}\n"
            f"[bold white]Passed Rules:[/bold white] [green]{summary.get('passed', 0)}[/green] | "
            f"[bold white]Violations:[/bold white] [red]{summary.get('violations', 0)}[/red]",
            title="[bold blue]DiffWeave Policy Validation Report[/bold blue]",
            border_style="blue",
        )
    )

    if not results:
        console.print("[dim]No proposals or rules to evaluate.[/dim]")
        return

    table = Table(title="Rule Evaluation Details", header_style="bold cyan")
    table.add_column("Rule Name", style="white")
    table.add_column("Operator", style="dim")
    table.add_column("Result", style="bold")
    table.add_column("Severity", style="dim")
    table.add_column("Details", style="white")

    for r in results:
        res_status = r.get("status", "INFO")
        if res_status == "PASS":
            styled_status = "[green]✔ PASS[/green]"
        elif res_status == "FAIL":
            styled_status = "[bold red]✖ FAIL[/bold red]"
        elif res_status == "WARNING":
            styled_status = "[bold yellow]▲ WARN[/bold yellow]"
        else:
            styled_status = f"[dim]{res_status}[/dim]"

        table.add_row(
            r.get("rule_name") or "Unnamed Rule",
            r.get("operator") or "n/a",
            styled_status,
            r.get("severity") or "LOW",
            r.get("message") or "",
        )

    console.print(table)

    if strict and not compliant:
        raise typer.Exit(code=1)
