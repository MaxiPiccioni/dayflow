from collections import defaultdict, deque
from time import monotonic

from fastapi import HTTPException, Request, status

WINDOW_SECONDS = 60
MAX_REQUESTS = 120
_requests: dict[str, deque[float]] = defaultdict(deque)


def rate_limit(request: Request) -> None:
    now = monotonic()
    bucket = _requests[request.client.host if request.client else "unknown"]
    while bucket and now - bucket[0] > WINDOW_SECONDS:
        bucket.popleft()
    if len(bucket) >= MAX_REQUESTS:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many requests")
    bucket.append(now)


AUTH_WINDOW_SECONDS = 300
AUTH_MAX_REQUESTS = 10
_auth_requests: dict[str, deque[float]] = defaultdict(deque)


def auth_rate_limit(request: Request) -> None:
    now = monotonic()
    bucket = _auth_requests[request.client.host if request.client else "unknown"]
    while bucket and now - bucket[0] > AUTH_WINDOW_SECONDS:
        bucket.popleft()
    if len(bucket) >= AUTH_MAX_REQUESTS:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Demasiados intentos. Probá de nuevo en unos minutos")
    bucket.append(now)
