"""
`dw review` command.
Interactive Human Review Wizard for knowledge proposals.
"""
from __future__ import annotations

from typing import Optional
import typer
from rich.prompt import Prompt
from rich.panel import Panel

from diffweave.cli.config import get_active_workspace
from diffweave.cli.output import print_success, print_error, print_info, console
from diffweave.mcp.client import DiffWeaveMCPClient


def review_command(
    proposal_id: Optional[str] = typer.Option(None, "--proposal", "-p", help="Target specific proposal UUID"),
    action: Optional[str] = typer.Option(None, "--action", "-a", help="Direct action: approve, reject, archive"),
    comments: Optional[str] = typer.Option(None, "--comments", "-m", help="Review comments / commit note"),
    workspace_id: Optional[str] = typer.Option(None, "--workspace", "-w", help="Workspace UUID override"),
    interactive: bool = typer.Option(True, "--interactive/--no-interactive", help="Enable interactive wizard"),
):
    """
    Review pending knowledge proposals (Approve into truth, Reject, or Stash).
    """
    try:
        active_ws_id = get_active_workspace(workspace_id)
    except Exception as e:
        print_error(str(e))
        raise typer.Exit(code=1)

    client = DiffWeaveMCPClient()

    # Direct non-interactive action
    if proposal_id and action:
        act = action.strip().lower()
        try:
            if act == "approve":
                res = client.call_tool_sync("approve_proposal", {"proposal_id": proposal_id, "comments": comments})
                print_success(f"Proposal [bold]{proposal_id}[/bold] APPROVED. Commit ID: [cyan]{res.get('commit_id')}[/cyan]")
            elif act == "reject":
                res = client.call_tool_sync("reject_proposal", {"proposal_id": proposal_id, "comments": comments})
                print_info(f"Proposal [bold]{proposal_id}[/bold] REJECTED. (No commit created)")
            elif act in ("archive", "stash"):
                res = client.call_tool_sync("archive_proposal", {"proposal_id": proposal_id, "comments": comments})
                print_info(f"Proposal [bold]{proposal_id}[/bold] ARCHIVED / STASHED for later review.")
            else:
                print_error(f"Unknown action '{action}'. Use approve, reject, or archive.")
                raise typer.Exit(code=1)
            return
        except Exception as e:
            print_error(f"Review action failed: {e}")
            raise typer.Exit(code=1)

    # Fetch pending proposals
    try:
        pending = client.call_tool_sync("list_pending_proposals", {"workspace_id": active_ws_id})
    except Exception as e:
        print_error(f"Failed to fetch proposals: {e}")
        raise typer.Exit(code=1)

    if proposal_id:
        pending = [p for p in pending if str(p.get("proposal_id", "")).startswith(proposal_id.strip())]

    if not pending:
        print_success("Review queue is clean! No pending proposals awaiting review.")
        return

    console.print(f"[bold cyan]DiffWeave Review Wizard[/bold cyan] ({len(pending)} pending proposals)\n")

    for idx, p in enumerate(pending, 1):
        pid = p.get("proposal_id")
        pc = p.get("proposed_changes", {})
        evidence_list = pc.get("evidence", [])
        evidence_quote = evidence_list[0].get("quote", "None cited") if evidence_list else "None cited"
        page = evidence_list[0].get("page_number", "N/A") if evidence_list else "N/A"
        prop_val = pc.get("value") or pc.get("proposed", {}).get("value", "N/A")

        body = (
            f"[bold white]Summary:[/bold white] {p.get('summary')}\n"
            f"[bold white]Type:[/bold white] [cyan]{p.get('proposal_type')}[/cyan] | "
            f"[bold white]Confidence:[/bold white] {pc.get('confidence') or pc.get('proposed', {}).get('confidence', 1.0)}\n"
            f"[bold white]Proposed Value:[/bold white] \"{prop_val}\"\n"
            f"[bold white]Verbatim Evidence (Page {page}):[/bold white]\n"
            f"  [italic cyan]\"{evidence_quote}\"[/italic cyan]"
        )
        console.print(Panel(body, title=f"Review [{idx}/{len(pending)}] — PR {pid[:8]}", border_style="cyan"))

        choice = Prompt.ask(
            "Decision",
            choices=["a", "r", "s", "q", "skip"],
            default="a",
            show_choices=False,
            show_default=False,
        )

        if choice in ("q", "quit"):
            console.print("[dim]Review session stopped.[/dim]")
            break
        elif choice in ("skip", "s"):
            if choice == "s":
                client.call_tool_sync("archive_proposal", {"proposal_id": pid})
                print_info(f"PR {pid[:8]} stashed/archived.")
            continue
        elif choice == "a":
            note = Prompt.ask("Commit message / comment (optional)", default="")
            try:
                res = client.call_tool_sync("approve_proposal", {"proposal_id": pid, "comments": note or None})
                print_success(f"PR {pid[:8]} APPROVED. Commit ID: [cyan]{res.get('commit_id')}[/cyan]\n")
            except Exception as e:
                print_error(f"Approval failed: {e}\n")
        elif choice == "r":
            reason = Prompt.ask("Rejection reason (optional)", default="")
            try:
                client.call_tool_sync("reject_proposal", {"proposal_id": pid, "comments": reason or None})
                print_info(f"PR {pid[:8]} REJECTED.\n")
            except Exception as e:
                print_error(f"Rejection failed: {e}\n")
