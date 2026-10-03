"""
Terminal output formatting utilities for DiffWeave CLI using Rich.
"""
from __future__ import annotations

import sys
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import json
from typing import Any
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.tree import Tree
from rich.text import Text

console = Console()
err_console = Console(stderr=True)


def print_json(data: Any):
    """Output machine-readable JSON."""
    console.print(json.dumps(data, indent=2, default=str))


def print_success(message: str):
    console.print(f"[bold green][OK][/bold green] {message}")


def print_info(message: str):
    console.print(f"[bold cyan][i][/bold cyan] {message}")


def print_warning(message: str):
    console.print(f"[bold yellow][!][/bold yellow] {message}")


def print_error(message: str, code: str = None):
    prefix = f"[bold red][FAIL] Error ({code}):[/bold red]" if code else "[bold red][FAIL] Error:[/bold red]"
    err_console.print(f"{prefix} {message}")


def render_status(
    workspace_name: str,
    workspace_id: str,
    docs: list[dict],
    stats: dict,
    pending_proposals: list[dict],
):
    """Render a comprehensive Git-like status display."""
    console.print(
        Panel(
            f"[bold white]Workspace:[/bold white] [bold cyan]{workspace_name}[/bold cyan] ([dim]{workspace_id}[/dim])\n"
            f"[bold white]Engine:[/bold white] DocWeave MCP Server [green]* Connected (29 Tools)[/green]",
            title="[bold blue]DiffWeave Status[/bold blue]",
            border_style="blue",
        )
    )

    # 1. Summary stats
    stats_table = Table(box=None, padding=(0, 2))
    stats_table.add_column("Tracked Docs", style="cyan")
    stats_table.add_column("Running Workflows", style="yellow")
    stats_table.add_column("Awaiting Review", style="magenta")
    stats_table.add_column("Knowledge Register Items", style="green")

    stats_table.add_row(
        str(stats.get("total_documents", len(docs))),
        str(stats.get("workflows_running", 0)),
        str(stats.get("pending_proposals", len(pending_proposals))),
        str(stats.get("knowledge_items", 0)),
    )
    console.print(stats_table)
    console.print()

    # 2. Document Inventory Table
    if docs:
        doc_table = Table(title="Document Knowledge Staging", title_justify="left", header_style="bold cyan")
        doc_table.add_column("Filename", style="white")
        doc_table.add_column("Status", style="bold")
        doc_table.add_column("Workflow Status", style="dim")
        doc_table.add_column("Document ID", style="dim")

        for d in docs:
            w_status = d.get("workflow_status") or d.get("status") or "IDLE"
            if w_status == "COMPLETED":
                status_styled = "[green][OK] COMMITTED[/green]"
            elif w_status == "WAITING_FOR_REVIEW":
                status_styled = "[bold yellow]* WAITING FOR REVIEW[/bold yellow]"
            elif w_status == "RUNNING":
                status_styled = "[cyan]PROCESSING[/cyan]"
            elif w_status == "FAILED":
                status_styled = "[red][FAIL] FAILED[/red]"
            else:
                status_styled = f"[dim]{w_status}[/dim]"

            doc_table.add_row(
                d.get("filename", "unknown"),
                status_styled,
                w_status,
                d.get("document_id", "")[:12] + "...",
            )
        console.print(doc_table)
    else:
        console.print("[dim]No documents uploaded yet. Use 'dw add <file>' to ingest documents.[/dim]")

    console.print()

    # 3. Pending Knowledge PRs
    proposals_list = pending_proposals if isinstance(pending_proposals, list) else (pending_proposals.get("proposals", []) if isinstance(pending_proposals, dict) else [])
    if proposals_list:
        pr_table = Table(title="Pending Knowledge PRs (Requires Human Review)", title_justify="left", header_style="bold magenta")
        pr_table.add_column("PR ID", style="bold yellow")
        pr_table.add_column("Type", style="cyan")
        pr_table.add_column("Summary", style="white")
        pr_table.add_column("Status", style="yellow")

        for p in proposals_list[:10]:
            pr_table.add_row(
                p.get("proposal_id", "")[:8],
                p.get("proposal_type", "CLAIM"),
                p.get("summary", ""),
                p.get("status", "PENDING"),
            )
        console.print(pr_table)
        if len(proposals_list) > 10:
            console.print(f"[dim]...and {len(proposals_list) - 10} more pending reviews. Run 'dw proposals' for full list.[/dim]")
    else:
        console.print("[dim green][OK] All knowledge proposals reviewed. Knowledge register is up to date.[/dim green]")


def render_diff(diff_data: dict):
    """Render a visual, high-contrast semantic knowledge diff."""
    summary = diff_data.get("summary", {})
    additions = diff_data.get("additions", [])
    changes = diff_data.get("changes", [])
    conflicts = diff_data.get("conflicts", [])
    removals = diff_data.get("removals", [])

    console.print(
        f"[bold]Knowledge Semantic Diff[/bold] "
        f"([green]+{summary.get('additions_count', 0)} additions[/green], "
        f"[yellow]~{summary.get('changes_count', 0)} changes[/yellow], "
        f"[red]!{summary.get('conflicts_count', 0)} conflicts[/red], "
        f"[red]-{summary.get('removals_count', 0)} removals[/red])\n"
    )

    if not additions and not changes and not conflicts and not removals:
        console.print("[dim]No pending knowledge differences detected against committed truth.[/dim]")
        return

    # 1. Conflicts
    for idx, c in enumerate(conflicts, 1):
        existing = c.get("existing", {})
        proposed = c.get("proposed", {})
        evidence_list = proposed.get("evidence", [])
        evidence_quote = evidence_list[0].get("quote", "N/A") if evidence_list else "None cited"

        body = (
            f"[bold red]COLLISION / CONTRADICTION DETECTED[/bold red]\n"
            f"[bold white]Target Claim / Metric:[/bold white] {c.get('title')}\n\n"
            f"[red]◀ COMMITTED BASELINE:[/red]\n"
            f"   Value: \"{existing.get('value')}\"\n"
            f"   Confidence: {existing.get('confidence', 1.0)}\n\n"
            f"[green]▶ PROPOSED UPDATE (From new document):[/green]\n"
            f"   Value: \"{proposed.get('value')}\"\n"
            f"   Confidence: {proposed.get('confidence', 1.0)}\n"
            f"   Evidence Quote: [italic cyan]\"{evidence_quote}\"[/italic cyan]\n\n"
            f"[dim]Proposal ID: {c.get('proposal_id')}[/dim]"
        )
        console.print(Panel(body, title=f"[bold red]! CONFLICT #{idx}[/bold red]", border_style="red"))

    # 2. Additions
    for idx, a in enumerate(additions, 1):
        evidence_list = a.get("evidence", [])
        evidence_quote = evidence_list[0].get("quote", "N/A") if evidence_list else "None cited"
        body = (
            f"[bold green]+ NEW {a.get('type', 'CLAIM')}:[/bold green] [bold white]{a.get('title')}[/bold white]\n"
            f"Value: \"{a.get('proposed_value')}\"\n"
            f"Confidence: {a.get('confidence', 1.0)}\n"
            f"Evidence: [italic cyan]\"{evidence_quote}\"[/italic cyan]\n"
            f"[dim]Proposal ID: {a.get('proposal_id')}[/dim]"
        )
        console.print(Panel(body, title=f"[bold green]+ ADDITION #{idx}[/bold green]", border_style="green"))

    # 3. Changes
    for idx, ch in enumerate(changes, 1):
        existing = ch.get("existing", {})
        proposed = ch.get("proposed", {})
        body = (
            f"[bold yellow]~ MODIFIED CLAIM:[/bold yellow] [bold white]{ch.get('title')}[/bold white]\n"
            f"Existing: \"{existing.get('value')}\"\n"
            f"Proposed: \"{proposed.get('value')}\"\n"
            f"[dim]Proposal ID: {ch.get('proposal_id')}[/dim]"
        )
        console.print(Panel(body, title=f"[bold yellow]~ UPDATE #{idx}[/bold yellow]", border_style="yellow"))
