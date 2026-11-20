"""Tiny in-memory sliding-window rate limiter (per client IP). Good enough for a single server process."""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque

from fastapi import Request


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self.max, self.window = max_requests, window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            q = self._hits[key]
            while q and now - q[0] > self.window:
                q.popleft()
            if len(q) >= self.max:
                return False
            q.append(now)
            return True


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"
