"""
`dw proposals` command.
Inspects knowledge proposals (Knowledge PRs) awaiting human review or committed.
"""
from __future__ import annotations

from typing import Optional
import typer
from rich.panel import Panel
from rich.table import Table

from diffweave.cli.config import get_active_workspace
from diffweave.cli.output import print_error, print_json, console
from diffweave.mcp.client import DiffWeaveMCPClient


def proposals_command(
    workspace_id: Optional[str] = typer.Option(None, "--workspace", "-w", help="Workspace UUID override"),
    proposal_id: Optional[str] = typer.Option(None, "--id", help="Inspect a specific proposal by UUID"),
    prop_type: Optional[str] = typer.Option(None, "--type", "-t", help="Filter by proposal type (CREATE, UPDATE, DELETE)"),
    status: Optional[str] = typer.Option("PENDING", "--status", "-s", help="Filter by proposal status (PENDING, APPROVED, REJECTED, ARCHIVED)"),
    as_json: bool = typer.Option(False, "--json", help="Output machine-readable JSON"),
):
    """
    List and inspect extracted knowledge proposals awaiting governance decisions.
    """
    try:
        active_ws_id = get_active_workspace(workspace_id)
    except Exception as e:
        print_error(str(e))
        raise typer.Exit(code=1)

    client = DiffWeaveMCPClient()

    try:
        proposals = client.call_tool_sync("list_pending_proposals", {"workspace_id": active_ws_id})
    except Exception as e:
        print_error(f"Failed to fetch proposals: {e}")
        raise typer.Exit(code=1)

    # Filter by ID if specified
    if proposal_id:
        proposals = [p for p in proposals if str(p.get("proposal_id", "")).startswith(proposal_id.strip())]
        if not proposals:
            print_error(f"Proposal matching '{proposal_id}' not found.")
            raise typer.Exit(code=1)

    # Filter by type
    if prop_type:
        proposals = [p for p in proposals if p.get("proposal_type", "").upper() == prop_type.strip().upper()]

    if as_json:
        print_json(proposals)
        return

    if not proposals:
        console.print(f"[dim]No proposals found matching criteria in workspace {active_ws_id}.[/dim]")
        return

    if proposal_id and len(proposals) == 1:
        # Detailed single proposal view
        p = proposals[0]
        pc = p.get("proposed_changes", {})
        evidence_list = pc.get("evidence", [])
        evidence_quote = evidence_list[0].get("quote", "None cited") if evidence_list else "None cited"
        page = evidence_list[0].get("page_number", "N/A") if evidence_list else "N/A"

        body = (
            f"[bold white]ID:[/bold white] {p.get('proposal_id')}\n"
            f"[bold white]Type:[/bold white] [cyan]{p.get('proposal_type')}[/cyan]\n"
            f"[bold white]Status:[/bold white] [bold yellow]{p.get('status')}[/bold yellow]\n"
            f"[bold white]Summary:[/bold white] {p.get('summary')}\n"
            f"[bold white]Rationale:[/bold white] {p.get('rationale') or 'N/A'}\n\n"
            f"[bold white]Proposed Changes:[/bold white]\n"
            f"  Value: \"{pc.get('value') or pc.get('proposed', {}).get('value', 'N/A')}\"\n"
            f"  Confidence: {pc.get('confidence') or pc.get('proposed', {}).get('confidence', 1.0)}\n\n"
            f"[bold white]Verbatim Evidence Citation (Page {page}):[/bold white]\n"
            f"  [italic cyan]\"{evidence_quote}\"[/italic cyan]"
        )
        console.print(Panel(body, title=f"[bold]Knowledge Proposal Details[/bold]", border_style="cyan"))
        return

    # Table view
    table = Table(title=f"Knowledge Proposals ({len(proposals)} items)", header_style="bold magenta")
    table.add_column("PR ID", style="bold yellow")
    table.add_column("Type", style="cyan")
    table.add_column("Summary", style="white")
    table.add_column("Status", style="yellow")
    table.add_column("Created", style="dim")

    for p in proposals:
        table.add_row(
            p.get("proposal_id", "")[:8],
            p.get("proposal_type", "CLAIM"),
            p.get("summary", ""),
            p.get("status", "PENDING"),
            str(p.get("created_at", ""))[:19],
        )
    console.print(table)
    console.print("[dim]Run 'dw proposals --id <id>' for full evidence citation.[/dim]")
