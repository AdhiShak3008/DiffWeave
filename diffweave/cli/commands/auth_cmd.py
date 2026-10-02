"""
`dw login`, `dw logout`, and `dw whoami` commands.

Manages authentication with DocWeave via JWT tokens, OAuth, demo logins, or API keys.
"""
from __future__ import annotations

import os
from typing import Optional
import typer
import httpx

from diffweave.cli.config import get_active_workspace
from diffweave.cli.credentials import save_credentials, load_credentials, clear_credentials
from diffweave.cli.output import print_success, print_error, print_info, print_warning


def login_command(
    email: Optional[str] = typer.Option(None, "--email", "-e", help="DocWeave user email"),
    password: Optional[str] = typer.Option(None, "--password", "-p", help="DocWeave user password"),
    token: Optional[str] = typer.Option(None, "--token", "-t", help="Personal Access Token or JWT"),
    demo: bool = typer.Option(False, "--demo", help="Log in instantly using demo evaluator account"),
    url: Optional[str] = typer.Option(None, "--url", help="DocWeave Server URL (default: http://localhost:8000 or DOCWEAVE_MCP_URL)"),
):
    """
    Authenticate with DocWeave and securely store credentials.
    """
    server_url = url or os.environ.get("DOCWEAVE_MCP_URL") or "http://localhost:8000"
    server_url = server_url.rstrip("/")

    # 1. Direct Token Login
    if token:
        save_credentials(access_token=token, email="token-user", username="API Token User", mcp_url=server_url)
        print_success("Successfully authenticated via API token!")
        print_info(f"  Stored in: ~/.diffweave/credentials.json")
        return

    # 2. Demo Login
    if demo:
        print_info(f"Authenticating with DocWeave demo evaluator account at [cyan]{server_url}[/cyan]...")
        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(f"{server_url}/auth/demo-login")
                if resp.status_code == 200:
                    data = resp.json()
                    tok = data.get("access_token")
                    user_email = data.get("email", "demo@docweave.io")
                    username = data.get("username", "Demo Evaluator")
                    save_credentials(access_token=tok, email=user_email, username=username, mcp_url=server_url)
                    print_success(f"Logged in as [bold white]{username}[/bold white] ({user_email})!")
                    print_info("  Credentials saved to ~/.diffweave/credentials.json")
                    return
                else:
                    print_error(f"Demo login failed: {resp.text}")
                    raise typer.Exit(code=1)
        except Exception as e:
            # If server not running on localhost, fallback to local demo session
            print_warning(f"Could not reach remote server at {server_url}: {e}")
            print_info("Creating local demo evaluator session...")
            save_credentials(
                access_token="demo-offline-evaluator-token",
                email="demo@docweave.io",
                username="Demo Evaluator (Offline)",
                mcp_url=server_url,
            )
            print_success("Logged in as [bold white]Demo Evaluator (Offline)[/bold white]!")
            return

    # 3. Interactive Email & Password Prompt
    if not email:
        email = typer.prompt("DocWeave Email")
    if not password:
        password = typer.prompt("DocWeave Password", hide_input=True)

    print_info(f"Authenticating [bold white]{email}[/bold white] against [cyan]{server_url}[/cyan]...")

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(
                f"{server_url}/auth/login",
                data={"username": email, "password": password},
            )
            if resp.status_code == 200:
                data = resp.json()
                tok = data.get("access_token")
                save_credentials(access_token=tok, email=email, username=email.split("@")[0], mcp_url=server_url)
                print_success(f"Successfully authenticated as [bold white]{email}[/bold white]!")
                print_info("  Session token stored in ~/.diffweave/credentials.json")
            else:
                print_error(f"Login failed: {resp.text}")
                raise typer.Exit(code=1)
    except httpx.ConnectError:
        print_error(f"Could not connect to DocWeave server at {server_url}.")
        print_info("Ensure the server is running, or pass --token / --url to specify a remote host.")
        raise typer.Exit(code=1)
    except Exception as e:
        print_error(f"Authentication error: {e}")
        raise typer.Exit(code=1)


def logout_command():
    """
    Log out and remove stored DocWeave credentials.
    """
    cleared = clear_credentials()
    if cleared:
        print_success("Logged out successfully. Stored credentials removed.")
    else:
        print_info("No stored credentials found.")


def whoami_command():
    """
    Display current authenticated identity and active workspace.
    """
    creds = load_credentials()
    if not creds:
        print_warning("Not currently logged in. Run 'dw login' or 'dw login --demo' to authenticate.")
    else:
        print_success("Authenticated Session Active")
        print_info(f"  User:      [bold white]{creds.get('username', 'N/A')}[/bold white]")
        print_info(f"  Email:     [cyan]{creds.get('email', 'N/A')}[/cyan]")
        token_preview = creds.get('access_token', '')[:16] + "..." if creds.get('access_token') else "N/A"
        print_info(f"  Token:     [dim]{token_preview}[/dim]")
        if creds.get('mcp_url'):
            print_info(f"  Server:    [cyan]{creds.get('mcp_url')}[/cyan]")

    try:
        active_ws = get_active_workspace()
        print_info(f"  Workspace: [bold green]{active_ws}[/bold green]")
    except Exception:
        print_info("  Workspace: [yellow]None (Run 'dw init' to bind one)[/yellow]")
