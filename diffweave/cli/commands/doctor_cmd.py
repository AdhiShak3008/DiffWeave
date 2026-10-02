"""
`dw doctor` command.
Performs system health checks, MCP discovery, and environment diagnostics.
"""
from __future__ import annotations

import sys
from pathlib import Path
import typer
from rich.table import Table
from rich.panel import Panel

from diffweave.cli.config import load_config, get_config_path
from diffweave.cli.output import print_success, print_error, print_warning, print_json, console
from diffweave.mcp.client import DiffWeaveMCPClient

REQUIRED_TOOLS = [
    "list_workspaces",
    "create_workspace",
    "upload_document",
    "list_documents",
    "get_workflow_status",
    "list_workflows",
    "list_pending_proposals",
    "approve_proposal",
    "reject_proposal",
    "archive_proposal",
    "restore_proposal",
    "batch_review_proposals",
    "get_semantic_diff",
    "validate_proposals",
    "get_knowledge_graph",
    "list_knowledge",
    "get_knowledge_item",
    "search_knowledge",
    "list_rules",
    "create_rule",
    "enable_rule",
    "disable_rule",
    "delete_rule",
    "get_dashboard_stats",
    "get_activity_feed",
]


def doctor_command(
    as_json: bool = typer.Option(False, "--json", help="Output machine-readable JSON"),
):
    """
    Run diagnostic checks on DiffWeave environment, MCP server, and workspace.
    """
    checks = []

    # 1. Configuration check
    config = load_config()
    cfg_path = get_config_path()
    if config and config.get("workspace_id"):
        checks.append({
            "check": "Local Workspace Configuration (.diffweave)",
            "status": "PASS",
            "details": f"Bound to '{config.get('workspace_name')}' ({config.get('workspace_id')[:8]}...)",
        })
    else:
        checks.append({
            "check": "Local Workspace Configuration (.diffweave)",
            "status": "WARN",
            "details": "No local workspace initialized. Run 'dw init' to bind one.",
        })

    # 2. MCP Server Connectivity
    client = DiffWeaveMCPClient()
    tools = []
    try:
        backend_str = str(client.backend_dir)
        if backend_str not in sys.path:
            sys.path.insert(0, backend_str)
        from mcp_server import list_tools
        import asyncio
        discovered_tools = asyncio.run(list_tools())
        tools = [t.name for t in discovered_tools]
        checks.append({
            "check": "DocWeave MCP Server Connectivity",
            "status": "PASS",
            "details": f"Successfully connected. Found {len(tools)} tools registered.",
        })
    except Exception as e:
        checks.append({
            "check": "DocWeave MCP Server Connectivity",
            "status": "FAIL",
            "details": f"Failed to connect or import server: {e}",
        })

    # 3. Tool coverage check
    if tools:
        missing = [t for t in REQUIRED_TOOLS if t not in tools]
        if not missing:
            checks.append({
                "check": "Required MCP Tools Coverage",
                "status": "PASS",
                "details": f"All {len(REQUIRED_TOOLS)} core DiffWeave operations are available.",
            })
        else:
            checks.append({
                "check": "Required MCP Tools Coverage",
                "status": "FAIL",
                "details": f"Missing tools: {', '.join(missing)}",
            })

    # 4. Workspace API / Database check
    if config.get("workspace_id") and tools:
        try:
            stats = client.call_tool_sync("get_dashboard_stats", {"workspace_id": config.get("workspace_id")})
            checks.append({
                "check": "Workspace State & Database Verification",
                "status": "PASS",
                "details": f"Workspace verified. Documents: {stats.get('total_documents')}, Knowledge: {stats.get('knowledge_items')}",
            })
        except Exception as e:
            checks.append({
                "check": "Workspace State & Database Verification",
                "status": "FAIL",
                "details": f"Failed to query workspace state: {e}",
            })

    all_passed = all(c["status"] == "PASS" for c in checks)

    if as_json:
        print_json({"healthy": all_passed, "checks": checks})
        return

    table = Table(title="DiffWeave Doctor Diagnostic Report", header_style="bold blue")
    table.add_column("System Subsystem", style="bold white")
    table.add_column("Status", style="bold")
    table.add_column("Details", style="white")

    for c in checks:
        st = c["status"]
        if st == "PASS":
            st_text = "[green][PASS][/green]"
        elif st == "WARN":
            st_text = "[yellow][WARN][/yellow]"
        else:
            st_text = "[bold red][FAIL][/bold red]"
        table.add_row(c["check"], st_text, c["details"])

    console.print(table)
    if all_passed:
        console.print("\n[bold green][OK] All systems nominal. DiffWeave is fully operational![/bold green]")
    else:
        console.print("\n[bold yellow][!] Some checks require attention. See details above.[/bold yellow]")
