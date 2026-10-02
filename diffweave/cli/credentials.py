"""
DiffWeave Credentials Store.

Manages persistent user authentication tokens, API keys, and sessions.
Stores credentials in ~/.diffweave/credentials.json or local .diffweave/credentials.json.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Optional


def get_credentials_dir() -> Path:
    """Returns the user-level ~/.diffweave directory, creating it if needed."""
    creds_dir = Path.home() / ".diffweave"
    creds_dir.mkdir(parents=True, exist_ok=True)
    return creds_dir


def get_credentials_file() -> Path:
    return get_credentials_dir() / "credentials.json"


def save_credentials(
    access_token: str,
    email: Optional[str] = None,
    username: Optional[str] = None,
    mcp_url: Optional[str] = None,
    api_key: Optional[str] = None,
) -> None:
    data = {
        "access_token": access_token,
        "api_key": api_key or access_token,
        "email": email or "",
        "username": username or "",
        "mcp_url": mcp_url or "",
    }
    creds_file = get_credentials_file()
    with open(creds_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def load_credentials() -> Optional[dict[str, Any]]:
    # 1. Environment variable override
    env_token = os.environ.get("DOCWEAVE_API_KEY") or os.environ.get("DIFFWEAVE_TOKEN")
    if env_token:
        return {
            "access_token": env_token,
            "email": os.environ.get("DOCWEAVE_USER_EMAIL", "env-user"),
            "username": os.environ.get("DOCWEAVE_USERNAME", "Environment User"),
            "mcp_url": os.environ.get("DOCWEAVE_MCP_URL", ""),
        }

    # 2. Local workspace override
    local_creds = Path(".diffweave/credentials.json")
    if local_creds.exists():
        try:
            with open(local_creds, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    # 3. User global credentials
    creds_file = get_credentials_file()
    if creds_file.exists():
        try:
            with open(creds_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    return None


def clear_credentials() -> bool:
    cleared = False
    creds_file = get_credentials_file()
    if creds_file.exists():
        try:
            creds_file.unlink()
            cleared = True
        except Exception:
            pass

    local_creds = Path(".diffweave/credentials.json")
    if local_creds.exists():
        try:
            local_creds.unlink()
            cleared = True
        except Exception:
            pass

    return cleared


def get_access_token() -> Optional[str]:
    creds = load_credentials()
    if creds:
        return creds.get("access_token")
    return None
