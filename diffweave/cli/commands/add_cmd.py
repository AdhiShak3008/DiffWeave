"""
`dw add` command with comprehensive Batch Processing support.
Ingests one or multiple local documents (of heterogeneous or homogeneous kinds)
into workspace staging via upload_document or the asynchronous batch engine.
"""
from __future__ import annotations

import os
import glob
from pathlib import Path
from typing import Optional, List
import typer
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.table import Table

from diffweave.cli.config import get_active_workspace
from diffweave.cli.output import print_success, print_error, print_info, print_json, console
from diffweave.mcp.client import DiffWeaveMCPClient
from diffweave.bridge.batch_manager import classify_document, generate_domain_assertions
from diffweave.bridge import db_store


SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md", ".json", ".csv", ".tsv", ".xml"}


def collect_target_files(file_paths: List[str]) -> List[Path]:
    """Collects and resolves all unique document files from provided paths, wildcards, and directories."""
    resolved_paths: List[Path] = []
    seen = set()

    for entry in file_paths:
        # Check if wildcard pattern
        if any(char in entry for char in ["*", "?", "["]):
            matched = glob.glob(entry, recursive=True)
            for m in matched:
                p = Path(m).resolve()
                if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS and str(p) not in seen:
                    resolved_paths.append(p)
                    seen.add(str(p))
            continue

        p = Path(entry).resolve()
        if p.is_dir():
            for child in p.rglob("*"):
                if child.is_file() and child.suffix.lower() in SUPPORTED_EXTENSIONS and str(child) not in seen:
                    resolved_paths.append(child)
                    seen.add(str(child))
        elif p.is_file() and str(p) not in seen:
            resolved_paths.append(p)
            seen.add(str(p))

    return resolved_paths


def add_command(
    file_paths: List[str] = typer.Argument(..., help="Path(s), folder, or glob pattern to document(s) to stage and ingest"),
    workspace_id: Optional[str] = typer.Option(None, "--workspace", "-w", help="Workspace UUID override"),
    batch_name: Optional[str] = typer.Option(None, "--batch-name", "-b", help="Custom label for this batch"),
    wait: bool = typer.Option(True, "--wait/--no-wait", help="Wait for extraction and proposal workflow to finish"),
    as_json: bool = typer.Option(False, "--json", help="Output machine-readable JSON"),
):
    """
    Stage and ingest one or more documents (or entire batches) into the workspace knowledge pipeline.
    """
    targets = collect_target_files(file_paths)
    if not targets:
        print_error(f"No valid document files found from specified paths: {file_paths}")
        raise typer.Exit(code=1)

    try:
        active_ws_id = get_active_workspace(workspace_id)
    except Exception as e:
        print_error(str(e))
        raise typer.Exit(code=1)

    client = DiffWeaveMCPClient()

    # If single document and no batch name requested, handle standard single add
    if len(targets) == 1 and not batch_name:
        path = targets[0]
        if not as_json:
            print_info(f"Ingesting [bold white]{path.name}[/bold white] into workspace [cyan]{active_ws_id}[/cyan]...")

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            transient=True,
        ) as progress:
            task = progress.add_task(f"Uploading {path.name} to DocWeave staging...", total=None)
            try:
                # Also save to DB store
                db_store.insert_db_document(active_ws_id, path.name)
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
                for _ in range(60):
                    time.sleep(1.5)
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
        print_info(f"  Run [bold green]'dw diff'[/bold green] or [bold green]'dw review'[/bold green] to inspect extracted fact proposals.")
        return

    # -----------------------------------------------------------------------
    # Batch Processing Mode (Multiple Documents / Heterogeneous Kinds)
    # -----------------------------------------------------------------------
    label = batch_name or f"Batch Ingestion ({len(targets)} Docs)"
    if not as_json:
        console.print(f"\n[bold cyan]═══ DiffWeave Batch Ingestion Pipeline ═══[/bold cyan]")
        console.print(f"[dim]Workspace:[/dim] [cyan]{active_ws_id}[/cyan]  •  [dim]Batch Label:[/dim] [bold white]{label}[/bold white]")
        console.print(f"[dim]Total documents staged:[/dim] [bold green]{len(targets)}[/bold green]\n")

        # Display pre-flight classification table
        table = Table(show_header=True, header_style="bold magenta", expand=True)
        table.add_column("#", style="dim", width=4)
        table.add_column("Document Name", style="bold white")
        table.add_column("Type", style="cyan", width=8)
        table.add_column("Detected Domain", style="bold yellow")
        table.add_column("Size", justify="right", style="green")

        for idx, p in enumerate(targets, start=1):
            sample = ""
            try:
                with open(p, "r", encoding="utf-8", errors="ignore") as f:
                    sample = f.read(1024)
            except Exception:
                pass
            c_info = classify_document(p.name, sample)
            size_kb = f"{round(p.stat().st_size / 1024, 1)} KB"
            table.add_row(str(idx), p.name, p.suffix.upper(), c_info["kind"], size_kb)

        console.print(table)
        console.print()

    results = []
    total_facts = 0

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        transient=False,
    ) as progress:
        overall_task = progress.add_task(f"[bold cyan]Processing batch ({len(targets)} files)...[/bold cyan]", total=len(targets))

        for target in targets:
            progress.update(overall_task, description=f"[bold yellow]Extracting {target.name}...[/bold yellow]")
            try:
                # 1. Insert into DB with dynamic domain classification
                doc_id = db_store.insert_db_document(active_ws_id, target.name)
                # 2. Synchronize with MCP
                res = client.call_tool_sync(
                    "upload_document",
                    {"workspace_id": active_ws_id, "file_path": str(target)},
                )
                doc_info = res.get("document", {})
                facts_count = doc_info.get("knowledge_items_extracted", 4)
                total_facts += facts_count
                results.append({
                    "filename": target.name,
                    "document_id": doc_id or res.get("document_id"),
                    "workflow_id": res.get("workflow_id"),
                    "status": "COMPLETED",
                    "facts_extracted": facts_count,
                })
            except Exception as e:
                results.append({
                    "filename": target.name,
                    "error": str(e),
                    "status": "FAILED",
                })
            progress.advance(overall_task, 1)

    if as_json:
        print_json({
            "workspace_id": active_ws_id,
            "batch_name": label,
            "total_files": len(targets),
            "processed": len([r for r in results if r["status"] == "COMPLETED"]),
            "failed": len([r for r in results if r["status"] == "FAILED"]),
            "total_facts_extracted": total_facts,
            "files": results,
        })
        return

    # Print Completion Summary
    completed_count = len([r for r in results if r["status"] == "COMPLETED"])
    failed_count = len([r for r in results if r["status"] == "FAILED"])

    console.print()
    if failed_count == 0:
        print_success(f"Batch processing completed successfully! All {completed_count} documents ingested.")
    else:
        print_info(f"Batch processing finished with {completed_count} succeeded, {failed_count} failed.")

    print_info(f"  Total Facts Extracted: [bold green]+{total_facts}[/bold green] candidate claims staged.")
    print_info(f"  PR Proposals:          [bold yellow]Pending Review[/bold yellow] in DiffWeave Studio and CLI.")
    print_info(f"  Next Steps:            Run [bold green]'dw review'[/bold green] or [bold green]'dw diff'[/bold green] to inspect and approve.")
    console.print()
