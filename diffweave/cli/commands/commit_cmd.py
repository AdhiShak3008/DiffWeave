"""
`dw commit` command.
Commits approved knowledge proposals into the active Knowledge Register.
"""
from __future__ import annotations

from typing import Optional
import typer
from rich.prompt import Confirm

from diffweave.cli.config import get_active_workspace
from diffweave.cli.output import print_success, print_error, print_info, print_json
from diffweave.mcp.client import DiffWeaveMCPClient


def commit_command(
    proposal_id: Optional[str] = typer.Option(None, "--proposal", "-p", help="Specific proposal UUID to commit"),
    all_approved: bool = typer.Option(False, "--all-approved", "-a", help="Commit all pending proposals in workspace"),
    message: Optional[str] = typer.Option(None, "--message", "-m", help="Commit audit message"),
    workspace_id: Optional[str] = typer.Option(None, "--workspace", "-w", help="Workspace UUID override"),
    as_json: bool = typer.Option(False, "--json", help="Output machine-readable JSON"),
):
    """
    Commit approved knowledge proposals to Master Knowledge Truth.
    """
    try:
        active_ws_id = get_active_workspace(workspace_id)
    except Exception as e:
        print_error(str(e))
        raise typer.Exit(code=1)

    client = DiffWeaveMCPClient()

    if not proposal_id and not all_approved:
        if message:
            all_approved = True
        else:
            print_error("Please specify a proposal to commit via '--proposal <id>', use '--all-approved', or pass '-m <message>'.")
            raise typer.Exit(code=1)

    if proposal_id:
        try:
            res = client.call_tool_sync("approve_proposal", {"proposal_id": proposal_id, "comments": message})
            if as_json:
                print_json(res)
            else:
                print_success(
                    f"Committed proposal [bold]{proposal_id}[/bold] into Knowledge Register!\n"
                    f"Commit ID: [cyan]{res.get('commit_id')}[/cyan]\n"
                    f"Committed at: [dim]{res.get('committed_at')}[/dim]"
                )
        except Exception as e:
            print_error(f"Commit failed: {e}")
            raise typer.Exit(code=1)

    elif all_approved:
        # Prompt for confirmation if not in JSON mode
        if not as_json:
            proceed = Confirm.ask(f"Are you sure you want to batch commit all pending proposals in workspace {active_ws_id}?")
            if not proceed:
                print_info("Commit cancelled.")
                return

        try:
            res = client.call_tool_sync(
                "batch_review_proposals",
                {
                    "workspace_id": active_ws_id,
                    "decision": "APPROVED",
                    "comments": message or "Batch approved via dw commit --all-approved",
                },
            )
            if as_json:
                print_json(res)
            else:
                count = res.get("processed_count", 0)
                print_success(f"Successfully committed {count} proposals to the Knowledge Register.")
        except Exception as e:
            print_error(f"Batch commit failed: {e}")
            raise typer.Exit(code=1)
