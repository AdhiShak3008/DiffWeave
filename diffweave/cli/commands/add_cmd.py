"""
`dw add` command.
Ingests local documents into DocWeave staging via upload_document.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Optional
import typer
from rich.progress import Progress, SpinnerColumn, TextColumn

from diffweave.cli.config import get_active_workspace
from diffweave.cli.output import print_success, print_error, print_info, print_json
from diffweave.mcp.client import DiffWeaveMCPClient


def add_command(
    file_path: str = typer.Argument(..., help="Path to document file to stage and ingest"),
    workspace_id: Optional[str] = typer.Option(None, "--workspace", "-w", help="Workspace UUID override"),
    wait: bool = typer.Option(True, "--wait/--no-wait", help="Wait for extraction and proposal workflow to finish"),
    as_json: bool = typer.Option(False, "--json", help="Output machine-readable JSON"),
):
    """
    Stage and ingest a document into the workspace knowledge pipeline.
    """
    path = Path(file_path).resolve()
    if not path.exists():
        print_error(f"File not found: {file_path}")
        raise typer.Exit(code=1)

    try:
        active_ws_id = get_active_workspace(workspace_id)
    except Exception as e:
        print_error(str(e))
        raise typer.Exit(code=1)

    client = DiffWeaveMCPClient()

    if not as_json:
        print_info(f"Ingesting [bold white]{path.name}[/bold white] into workspace [cyan]{active_ws_id}[/cyan]...")

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        transient=True,
    ) as progress:
        task = progress.add_task(f"Uploading {path.name} to DocWeave staging...", total=None)
        try:
            result = client.call_tool_sync(
                "upload_document",
                {"workspace_id": active_ws_id, "file_path": str(path)},
            )
        except Exception as e:
            progress.stop()
            print_error(f"Upload failed: {e}")
            raise typer.Exit(code=1)

    doc_id = result.get("document_id")
    wf_id = result.get("workflow_id")
    version_id = result.get("version_id")

    if wait and wf_id:
        import time
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            wf_task = progress.add_task("Running extraction, reconciliation & fact proposals...", total=None)
            for _ in range(60):  # Wait up to 120s
                time.sleep(2)
                try:
                    wf_status = client.call_tool_sync("get_workflow_status", {"workflow_id": wf_id})
                    curr_state = wf_status.get("status")
                    if curr_state in ("WAITING_FOR_REVIEW", "COMPLETED", "FAILED"):
                        break
                except Exception:
                    pass

    if as_json:
        print_json(result)
        return

    print_success(f"Document [bold]{path.name}[/bold] staged successfully!")
    print_info(f"  Document ID:  [dim]{doc_id}[/dim]")
    print_info(f"  Version ID:   [dim]{version_id}[/dim]")
    print_info(f"  Workflow ID:  [cyan]{wf_id}[/cyan]")

    # Check workflow final status
    try:
        wf_status = client.call_tool_sync("get_workflow_status", {"workflow_id": wf_id})
        status_val = wf_status.get("status", "RUNNING")
        if status_val == "WAITING_FOR_REVIEW":
            print_info(f"  Workflow State: [bold yellow]WAITING FOR REVIEW[/bold yellow] (Run 'dw diff' or 'dw review' to inspect)")
        elif status_val == "COMPLETED":
            print_success(f"  Workflow State: [bold green]COMPLETED[/bold green] (Knowledge items auto-approved)")
        elif status_val == "FAILED":
            print_error(f"  Workflow State: [bold red]FAILED[/bold red] - {wf_status.get('error_message', 'Unknown error')}")
        else:
            print_info(f"  Workflow State: [bold cyan]{status_val}[/bold cyan] (Run 'dw status' to track)")
    except Exception:
        pass
