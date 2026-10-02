"""
`dw search` command.
Queries DocWeave's hybrid search engine over committed knowledge.
"""
from __future__ import annotations

from typing import Optional
import typer
from rich.table import Table

from diffweave.cli.config import get_active_workspace
from diffweave.cli.output import print_error, print_json, console
from diffweave.mcp.client import DiffWeaveMCPClient


def search_command(
    query: str = typer.Argument(..., help="Search text query across knowledge items"),
    top_k: int = typer.Option(10, "--top-k", "-k", help="Maximum results to return"),
    workspace_id: Optional[str] = typer.Option(None, "--workspace", "-w", help="Workspace UUID override"),
    as_json: bool = typer.Option(False, "--json", help="Output machine-readable JSON"),
):
    """
    Search the Knowledge Register using hybrid lexical + semantic search.
    """
    try:
        active_ws_id = get_active_workspace(workspace_id)
    except Exception as e:
        print_error(str(e))
        raise typer.Exit(code=1)

    client = DiffWeaveMCPClient()

    try:
        results = client.call_tool_sync("search_knowledge", {"workspace_id": active_ws_id, "query": query})
    except Exception as e:
        print_error(f"Search failed: {e}")
        raise typer.Exit(code=1)

    results = results[:top_k]

    if as_json:
        print_json(results)
        return

    if not results:
        console.print(f"[dim]No matching knowledge items found for '{query}'.[/dim]")
        return

    table = Table(title=f"Knowledge Search: \"{query}\" ({len(results)} matches)", header_style="bold green")
    table.add_column("Type", style="cyan")
    table.add_column("Title", style="bold white")
    table.add_column("Value", style="white")
    table.add_column("Confidence", style="yellow")
    table.add_column("Source File", style="dim")

    for r in results:
        table.add_row(
            r.get("type", "CLAIM"),
            r.get("title", ""),
            r.get("value", "")[:50] + ("..." if len(r.get("value", "")) > 50 else ""),
            str(r.get("confidence", 1.0)),
            r.get("filename") or "n/a",
        )

    console.print(table)
