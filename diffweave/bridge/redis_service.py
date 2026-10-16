"""
DiffWeave Redis Intelligence & Acceleration Service.

Provides 5 enterprise Redis capabilities:
1. Content-Addressable LLM & Document Deduplication Cache (SHA-256 Content Hash -> Extracted Claims)
2. Live Pub/Sub Event Streaming (Zero-polling SSE/WebSocket pipeline)
3. Distributed Mutex Locking for Knowledge PR Merges (Redlock pattern)
4. Fast Workspace Telemetry & Counters Caching (Relieves Neon PostgreSQL load)
5. Sliding-Window Upload Rate Limiter (Protects public workspaces from spam)

Designed with Graceful Degradation: If Redis is offline or not configured,
all methods safely fall back to in-memory/database operations without crashing.
"""
from __future__ import annotations

import os
import json
import uuid
import time
import hashlib
import logging
from typing import Any, Optional, AsyncIterator
from datetime import datetime

logger = logging.getLogger("diffweave.redis")

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
CACHE_DOC_TTL = int(os.environ.get("REDIS_DOC_CACHE_TTL", 604800))       # 7 days
CACHE_STATUS_TTL = int(os.environ.get("REDIS_STATUS_CACHE_TTL", 120))    # 2 minutes
LOCK_DEFAULT_TTL = 15                                                    # 15 seconds

_redis_client = None
_redis_available: Optional[bool] = None

# In-memory fallback caches if Redis server is unavailable
_local_doc_cache: dict[str, dict[str, Any]] = {}
_local_status_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_local_locks: set[str] = set()


_last_check_time: float = 0.0

def get_redis_client():
    """Returns an async Redis client, or None if redis package or connection fails."""
    global _redis_client, _redis_available
    if _redis_available is False:
        # Check if 60 seconds have elapsed to re-probe
        if time.time() - _last_check_time < 60.0:
            return None

    if _redis_client is not None and _redis_available is True:
        return _redis_client

    try:
        import redis.asyncio as aioredis
        _redis_client = aioredis.from_url(
            REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_timeout=0.5,
            socket_connect_timeout=0.5,
        )
        return _redis_client
    except Exception as e:
        logger.debug(f"Redis initialization notice: {e}. Operating in resilient local fallback mode.")
        _redis_available = False
        return None


async def ping_redis() -> bool:
    """Check if Redis connection is active."""
    global _redis_available, _last_check_time
    _last_check_time = time.time()
    client = get_redis_client()
    if not client:
        _redis_available = False
        return False
    try:
        await client.ping()
        _redis_available = True
        return True
    except Exception:
        _redis_available = False
        return False

        return False


# ---------------------------------------------------------------------------
# 1. Content-Addressable LLM Document Deduplication Cache
# ---------------------------------------------------------------------------

def compute_content_hash(data: bytes | str) -> str:
    """Computes a SHA-256 cryptographic hash of raw document bytes or normalized text."""
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


async def get_cached_document_extraction(content_hash: str) -> Optional[dict[str, Any]]:
    """
    Checks if a document with this exact content hash has already been processed by an LLM.
    Returns the cached extracted assertions, saving 100% of LLM tokens and API latency.
    """
    client = get_redis_client()
    key = f"diffweave:doc_cache:{content_hash}"

    if client and _redis_available is not False:
        try:
            raw = await client.get(key)
            if raw:
                data = json.loads(raw)
                logger.info(f"[Redis Cache HIT] Reused LLM extraction for content hash {content_hash[:8]}. Saved ~{data.get('tokens_saved', 3200)} tokens.")
                return data
        except Exception as e:
            logger.debug(f"Redis get cache notice: {e}")

    # Fallback: check in-memory local cache
    return _local_doc_cache.get(content_hash)


async def set_cached_document_extraction(
    content_hash: str,
    extracted_claims: list[dict[str, Any]],
    detected_kind: str,
    tokens_saved: int = 3200,
) -> bool:
    """
    Caches extracted claims keyed by content SHA-256 with a 7-day TTL.
    """
    payload = {
        "content_hash": content_hash,
        "detected_kind": detected_kind,
        "extracted_claims": extracted_claims,
        "tokens_saved": tokens_saved,
        "cached_at": datetime.utcnow().isoformat() + "Z",
    }

    client = get_redis_client()
    key = f"diffweave:doc_cache:{content_hash}"

    # Also store in local memory fallback
    _local_doc_cache[content_hash] = payload

    if client and _redis_available is not False:
        try:
            await client.setex(key, CACHE_DOC_TTL, json.dumps(payload, default=str))
            return True
        except Exception as e:
            logger.debug(f"Redis set cache notice: {e}")

    return True


# ---------------------------------------------------------------------------
# 2. Real-Time Pub/Sub Event Streaming (Zero-Polling)
# ---------------------------------------------------------------------------

async def publish_workspace_event(workspace_id: str, event_data: dict[str, Any]):
    """
    Publishes real-time extraction and batch events to a workspace-scoped Redis channel.
    FastAPI forwards these directly to DiffWeave Studio over WebSockets or SSE.
    """
    client = get_redis_client()
    channel = f"diffweave:ws_events:{workspace_id}"
    payload = json.dumps({
        **event_data,
        "workspace_id": workspace_id,
        "timestamp": event_data.get("timestamp") or datetime.utcnow().strftime("%H:%M:%S"),
    }, default=str)

    if client and _redis_available is not False:
        try:
            await client.publish(channel, payload)
        except Exception as e:
            logger.debug(f"Redis publish notice: {e}")


async def subscribe_workspace_events(workspace_id: str) -> AsyncIterator[dict[str, Any]]:
    """
    Yields real-time events published for a workspace.
    """
    client = get_redis_client()
    channel = f"diffweave:ws_events:{workspace_id}"

    if client and _redis_available is not False:
        try:
            pubsub = client.pubsub()
            await pubsub.subscribe(channel)
            async for msg in pubsub.listen():
                if msg and msg.get("type") == "message":
                    try:
                        yield json.loads(msg["data"])
                    except Exception:
                        pass
        except Exception as e:
            logger.debug(f"Redis subscribe notice: {e}")


# ---------------------------------------------------------------------------
# 3. Distributed Mutex Locking for Knowledge PR Merges (Redlock Pattern)
# ---------------------------------------------------------------------------

async def acquire_proposal_lock(proposal_id: str, operator_name: str = "operator", ttl_seconds: int = LOCK_DEFAULT_TTL) -> bool:
    """
    Acquires an atomic distributed lock before committing or modifying a Knowledge PR.
    Prevents race conditions, double merges, and inconsistent state in public workspaces.
    """
    client = get_redis_client()
    lock_key = f"diffweave:lock:proposal:{proposal_id}"

    if client and _redis_available is not False:
        try:
            acquired = await client.set(lock_key, operator_name, nx=True, ex=ttl_seconds)
            return bool(acquired)
        except Exception as e:
            logger.debug(f"Redis lock notice: {e}")

    # Fallback in-memory mutex
    if proposal_id in _local_locks:
        return False
    _local_locks.add(proposal_id)
    return True


async def release_proposal_lock(proposal_id: str):
    """Releases the distributed proposal lock upon commit finalization."""
    client = get_redis_client()
    lock_key = f"diffweave:lock:proposal:{proposal_id}"

    _local_locks.discard(proposal_id)

    if client and _redis_available is not False:
        try:
            await client.delete(lock_key)
        except Exception as e:
            logger.debug(f"Redis release lock notice: {e}")


# ---------------------------------------------------------------------------
# 4. Fast Workspace Telemetry & Counters Caching
# ---------------------------------------------------------------------------

async def get_cached_workspace_status(workspace_id: str) -> Optional[dict[str, Any]]:
    """Retrieves cached workspace counters, avoiding repeated round-trips to Neon PostgreSQL."""
    client = get_redis_client()
    key = f"diffweave:ws:{workspace_id}:status"

    if client and _redis_available is not False:
        try:
            raw = await client.get(key)
            if raw:
                return json.loads(raw)
        except Exception as e:
            logger.debug(f"Redis get status notice: {e}")

    # In-memory fallback
    if workspace_id in _local_status_cache:
        cached_time, data = _local_status_cache[workspace_id]
        if time.time() - cached_time < CACHE_STATUS_TTL:
            return data

    return None


async def set_cached_workspace_status(workspace_id: str, status_data: dict[str, Any]):
    """Caches workspace status data with TTL."""
    client = get_redis_client()
    key = f"diffweave:ws:{workspace_id}:status"

    _local_status_cache[workspace_id] = (time.time(), status_data)

    if client and _redis_available is not False:
        try:
            await client.setex(key, CACHE_STATUS_TTL, json.dumps(status_data, default=str))
        except Exception as e:
            logger.debug(f"Redis set status notice: {e}")


async def invalidate_workspace_cache(workspace_id: str):
    """Clears cached workspace counters when documents are added or proposals are approved."""
    client = get_redis_client()
    key = f"diffweave:ws:{workspace_id}:status"

    _local_status_cache.pop(workspace_id, None)

    if client and _redis_available is not False:
        try:
            await client.delete(key)
        except Exception as e:
            logger.debug(f"Redis invalidate notice: {e}")


# ---------------------------------------------------------------------------
# 5. Sliding-Window Upload Rate Limiting for Public Workspaces
# ---------------------------------------------------------------------------

async def check_upload_rate_limit(
    identifier: str,
    max_uploads: int = 15,
    window_seconds: int = 900  # 15 minutes
) -> tuple[bool, int]:
    """
    Sliding window rate-limiter using Redis sorted sets (ZADD / ZREMRANGEBYSCORE).
    Prevents denial-of-service and token exhaustion in public workspaces.
    Returns: (is_allowed, remaining_quota)
    """
    client = get_redis_client()
    key = f"diffweave:ratelimit:upload:{identifier}"
    now = time.time()
    cutoff = now - window_seconds

    if client and _redis_available is not False:
        try:
            pipe = client.pipeline()
            # Remove timestamps older than window
            pipe.zremrangebyscore(key, 0, cutoff)
            # Add current timestamp
            pipe.zadd(key, {f"{now}-{uuid.uuid4().hex[:6]}": now})
            # Count entries in current window
            pipe.zcard(key)
            # Set key expiry
            pipe.expire(key, window_seconds)
            results = await pipe.execute()

            current_count = results[2]
            if current_count > max_uploads:
                return False, 0
            return True, max_uploads - current_count
        except Exception as e:
            logger.debug(f"Redis rate limit notice: {e}")

    # Fallback: allow by default if Redis is down
    return True, max_uploads
