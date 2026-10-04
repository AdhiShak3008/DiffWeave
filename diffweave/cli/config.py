"""
Configuration manager for DiffWeave CLI.

Handles local `.diffweave/` workspace context similar to `.git/`.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Optional

from diffweave.mcp.errors import WorkspaceNotConfiguredError

CONFIG_DIR_NAME = ".diffweave"
CONFIG_FILE_NAME = "config.json"


def find_diffweave_root(start_dir: Optional[Path] = None) -> Optional[Path]:
    """Search current directory and ancestors for a .diffweave directory."""
    current = (start_dir or Path.cwd()).resolve()
    while True:
        if (current / CONFIG_DIR_NAME).is_dir():
            return current
        if current.parent == current:
            break
        current = current.parent
    return None


def get_config_path(start_dir: Optional[Path] = None) -> Path:
    """Return path to config.json, using discovered root or cwd."""
    root = find_diffweave_root(start_dir) or Path.cwd()
    return root / CONFIG_DIR_NAME / CONFIG_FILE_NAME


def load_config(start_dir: Optional[Path] = None) -> dict[str, Any]:
    """Load the local .diffweave configuration."""
    config_path = get_config_path(start_dir)
    if not config_path.exists():
        return {}
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_config(data: dict[str, Any], target_dir: Optional[Path] = None) -> Path:
    """Save configuration to .diffweave/config.json."""
    root = target_dir or Path.cwd()
    cfg_dir = root / CONFIG_DIR_NAME
    cfg_dir.mkdir(parents=True, exist_ok=True)
    config_path = cfg_dir / CONFIG_FILE_NAME
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    return config_path


def get_active_workspace(
    override_id: Optional[str] = None, start_dir: Optional[Path] = None
) -> str:
    """
    Resolve the active workspace ID:
    1. CLI flag override (--workspace)
    2. Local directory .diffweave/config.json (like .git, takes precedence over ambient env)
    3. Environment variable DIFFWEAVE_WORKSPACE_ID / DOCWEAVE_WORKSPACE_ID
    """
    # 1. Direct CLI flag override
    if override_id and override_id.strip():
        return override_id.strip()

    # 2. Local initialized workspace context (.diffweave/config.json)
    config = load_config(start_dir)
    ws_id = config.get("workspace_id")
    if ws_id and str(ws_id).strip():
        return str(ws_id).strip()

    # 3. Ambient environment variable override
    env_ws = os.environ.get("DIFFWEAVE_WORKSPACE_ID") or os.environ.get("DOCWEAVE_WORKSPACE_ID")
    if env_ws and env_ws.strip():
        return env_ws.strip()

    raise WorkspaceNotConfiguredError(
        "No active workspace found. Run 'dw init' to bind this directory to a workspace, "
        "or pass '--workspace <name_or_uuid>'."
    )
