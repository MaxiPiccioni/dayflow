"""Rate limiting en memoria.

Limitación conocida: el estado vive en el proceso. Se reinicia con cada deploy o
cuando Render duerme la instancia, y no se comparte entre varias instancias. Para
escalar a más de una instancia hay que mover el almacenamiento a Redis (o similar)
manteniendo la interfaz de `SlidingWindowLimiter`.
"""

from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request, status

from .config import settings


class SlidingWindowLimiter:
    def __init__(self, window_seconds: int, max_events: int) -> None:
        self.window_seconds = window_seconds
        self.max_events = max_events
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def _prune(self, key: str, now: float) -> deque[float]:
        bucket = self._events[key]
        while bucket and now - bucket[0] > self.window_seconds:
            bucket.popleft()
        if not bucket:
            # Evita que el diccionario crezca para siempre con claves viejas.
            self._events.pop(key, None)
            return self._events[key]
        return bucket

    def retry_after(self, key: str) -> int:
        """Segundos hasta que `key` vuelva a tener cupo (0 si ya tiene)."""
        with self._lock:
            now = monotonic()
            bucket = self._prune(key, now)
            if len(bucket) < self.max_events:
                return 0
            return max(1, int(self.window_seconds - (now - bucket[0])) + 1)

    def hit(self, key: str) -> None:
        with self._lock:
            now = monotonic()
            self._prune(key, now).append(now)

    def reset(self, key: str) -> None:
        with self._lock:
            self._events.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._events.clear()


def too_many_requests(detail: str, retry_after: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail=detail,
        headers={"Retry-After": str(retry_after)},
    )


def client_ip(request: Request) -> str:
    """IP real del cliente.

    Detrás de un proxy, `X-Forwarded-For` lo arma cada proxy agregando la IP que ve
    al final de la lista; todo lo que está a la izquierda lo manda el cliente y se
    puede falsificar. Por eso se toma el valor que agregó nuestro proxy de confianza
    (contando `trusted_proxy_hops` desde la derecha), nunca el primero.
    """
    hops = settings.trusted_proxy_hops
    if hops > 0:
        forwarded = request.headers.get("x-forwarded-for", "")
        parts = [part.strip() for part in forwarded.split(",") if part.strip()]
        if len(parts) >= hops:
            return parts[-hops]
    return request.client.host if request.client else "unknown"


# Límite general por IP. Cada carga de la app hace unos 13 pedidos, así que con 120 por
# minuto bastaban unas 9 recargas para bloquear a un usuario legítimo. 300 deja margen
# para recargas y uso normal y sigue frenando abusos. En la Fase 5 se reduce la cantidad
# de pedidos de la carga inicial.
general_limiter = SlidingWindowLimiter(window_seconds=60, max_events=300)
# Límite de pedidos a /auth/* por IP (login y registro).
auth_limiter = SlidingWindowLimiter(window_seconds=300, max_events=10)
# Intentos de login fallidos por cuenta, sin importar desde qué IP vengan.
# Contrapartida: alguien podría bloquear a propósito una cuenta ajena por unos
# minutos. Para una app personal es preferible a permitir fuerza bruta distribuida.
login_failure_limiter = SlidingWindowLimiter(window_seconds=15 * 60, max_events=5)


def rate_limit(request: Request) -> None:
    key = client_ip(request)
    wait = general_limiter.retry_after(key)
    if wait:
        raise too_many_requests("Too many requests", wait)
    general_limiter.hit(key)


def auth_rate_limit(request: Request) -> None:
    key = client_ip(request)
    wait = auth_limiter.retry_after(key)
    if wait:
        raise too_many_requests("Demasiados intentos. Probá de nuevo en unos minutos", wait)
    auth_limiter.hit(key)


def ensure_login_allowed(email: str) -> None:
    wait = login_failure_limiter.retry_after(email)
    if wait:
        raise too_many_requests("Demasiados intentos fallidos. Probá de nuevo en unos minutos", wait)


def register_login_failure(email: str) -> None:
    login_failure_limiter.hit(email)


def clear_login_failures(email: str) -> None:
    login_failure_limiter.reset(email)
