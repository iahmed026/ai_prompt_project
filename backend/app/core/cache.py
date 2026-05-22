import time
from typing import Any, Dict, Optional, Tuple

try:
    from cachetools import TTLCache
except ModuleNotFoundError:
    TTLCache = None


# =========================
# CONFIGURATION
# =========================
CACHE_TTL = 3600
CACHE_MAXSIZE = 1000


# =========================
# CACHE IMPLEMENTATION
# =========================
if TTLCache:
    # Production-grade cache using cachetools
    cache = TTLCache(
        maxsize=CACHE_MAXSIZE,
        ttl=CACHE_TTL,
    )

    def get_cache(key: str) -> Optional[Any]:
        return cache.get(key)

    def set_cache(key: str, value: Any) -> None:
        cache[key] = value

    def delete_cache(key: str) -> None:
        cache.pop(key, None)

    def clear_cache() -> None:
        cache.clear()

else:
    # Lightweight fallback cache if cachetools is unavailable
    cache: Dict[str, Tuple[float, Any]] = {}

    def get_cache(key: str) -> Optional[Any]:
        item = cache.get(key)

        if item is None:
            return None

        expires_at, value = item

        if expires_at < time.time():
            cache.pop(key, None)
            return None

        return value

    def set_cache(key: str, value: Any) -> None:
        # Remove expired items first
        expired_keys = [
            k for k, (exp, _) in cache.items()
            if exp < time.time()
        ]

        for k in expired_keys:
            cache.pop(k, None)

        # Prevent oversized cache
        if len(cache) >= CACHE_MAXSIZE:
            oldest_key = min(
                cache,
                key=lambda k: cache[k][0]
            )
            cache.pop(oldest_key, None)

        cache[key] = (
            time.time() + CACHE_TTL,
            value,
        )

    def delete_cache(key: str) -> None:
        cache.pop(key, None)

    def clear_cache() -> None:
        cache.clear()