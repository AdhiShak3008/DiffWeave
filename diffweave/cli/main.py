"""
Main entry point for DiffWeave CLI (`dw`).
A Git-like developer interface for DocWeave document intelligence.
"""
from __future__ import annotations

import sys
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import typer
from rich.console import Console

from diffweave import __version__
from diffweave.cli.commands.init_cmd import init_command
from diffweave.cli.commands.add_cmd import add_command
from diffweave.cli.commands.status_cmd import status_command
from diffweave.cli.commands.proposals_cmd import proposals_command
from diffweave.cli.commands.diff_cmd import diff_command
from diffweave.cli.commands.validate_cmd import validate_command
from diffweave.cli.commands.review_cmd import review_command
from diffweave.cli.commands.commit_cmd import commit_command
from diffweave.cli.commands.log_cmd import log_command
from diffweave.cli.commands.search_cmd import search_command
from diffweave.cli.commands.doctor_cmd import doctor_command
from diffweave.cli.commands.rules_cmd import rules_app
from diffweave.cli.commands.auth_cmd import login_command, logout_command, whoami_command

console = Console()

app = typer.Typer(
    name="dw",
    help="DiffWeave (dw) — A Git-like developer platform for DocWeave document intelligence.",
    add_completion=False,
    no_args_is_help=True,
)

# Register top-level commands
app.command(name="init", help="Initialize a DiffWeave workspace (.diffweave/)")(init_command)
app.command(name="login", help="Authenticate with DocWeave via email/password, demo, or API token")(login_command)
app.command(name="logout", help="Log out and remove stored credentials")(logout_command)
app.command(name="whoami", help="Display current authenticated user identity and workspace")(whoami_command)
app.command(name="add", help="Stage and ingest documents into workspace")(add_command)
app.command(name="status", help="Show workspace state, document staging, and pending reviews")(status_command)
app.command(name="proposals", help="List and inspect extracted knowledge proposals (PRs)")(proposals_command)
app.command(name="diff", help="Semantic fact diff comparing proposals against committed truth")(diff_command)
app.command(name="validate", help="Run policy validation lint checks on proposals")(validate_command)
app.command(name="review", help="Interactive review wizard for pending proposals (approve/reject/archive)")(review_command)
app.command(name="commit", help="Commit approved knowledge to the Master Knowledge Register")(commit_command)
app.command(name="log", help="Display chronological knowledge audit trail and timeline")(log_command)
app.command(name="search", help="Search committed knowledge using hybrid lexical + vector search")(search_command)
app.command(name="doctor", help="Run diagnostic health checks on MCP and workspace")(doctor_command)

# Register subcommands
app.add_typer(rules_app, name="rules")


@app.command(name="version", help="Print DiffWeave version")
def version_cmd():
    console.print(f"[bold cyan]DiffWeave[/bold cyan] version [bold white]{__version__}[/bold white]")


def main():
    app()


if __name__ == "__main__":
    main()
