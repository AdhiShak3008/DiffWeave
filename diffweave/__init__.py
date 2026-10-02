"""
DiffWeave — A Git-Like Developer Platform for DocWeave.
"""

__version__ = "0.1.0"

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
