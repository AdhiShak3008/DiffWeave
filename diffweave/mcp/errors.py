"""
Typed exceptions for DiffWeave MCP integration.
"""


class DiffWeaveError(Exception):
    """Base error for DiffWeave."""
    def __init__(self, message: str, code: str = "DIFFWEAVE_ERROR", details: dict = None):
        super().__init__(message)
        self.code = code
        self.details = details or {}


class MCPConnectionError(DiffWeaveError):
    """Raised when unable to communicate with the MCP server."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, code="MCP_CONNECTION_ERROR", details=details)


class MCPToolError(DiffWeaveError):
    """Raised when an MCP tool invocation returns an error."""
    def __init__(self, tool_name: str, message: str, code: str = "TOOL_ERROR", details: dict = None):
        super().__init__(f"Tool '{tool_name}' failed: {message}", code=code, details=details)
        self.tool_name = tool_name


class WorkspaceNotConfiguredError(DiffWeaveError):
    """Raised when no active workspace is bound in .diffweave."""
    def __init__(self, message: str = "No active workspace configured. Run 'dw init' first."):
        super().__init__(message, code="WORKSPACE_NOT_CONFIGURED")
