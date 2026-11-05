from types import SimpleNamespace

from app import rate_limit
from app.config import settings
from app.rate_limit import SlidingWindowLimiter, client_ip

PASSWORD = "supersecret123"


def register(client, email="ana@example.com", headers=None):
    return client.post("/api/auth/register", json={"email": email, "full_name": "Ana Test", "password": PASSWORD}, headers=headers)


def login(client, email="ana@example.com", password=PASSWORD, headers=None):
    return client.post("/api/auth/login", json={"email": email, "password": password}, headers=headers)


def fake_request(forwarded=None, host="10.0.0.1"):
    headers = {"x-forwarded-for": forwarded} if forwarded is not None else {}
    return SimpleNamespace(headers=headers, client=SimpleNamespace(host=host))


def test_limiter_blocks_after_max_and_reports_retry_after():
    limiter = SlidingWindowLimiter(window_seconds=60, max_events=2)
    assert limiter.retry_after("k") == 0
    limiter.hit("k")
    limiter.hit("k")
    assert limiter.retry_after("k") > 0
    assert limiter.retry_after("otra") == 0


def test_limiter_reset_clears_key():
    limiter = SlidingWindowLimiter(window_seconds=60, max_events=1)
    limiter.hit("k")
    assert limiter.retry_after("k") > 0
    limiter.reset("k")
    assert limiter.retry_after("k") == 0


def test_client_ip_without_proxy_uses_socket_address(monkeypatch):
    monkeypatch.setattr(settings, "trusted_proxy_hops", 0)
    assert client_ip(fake_request(forwarded="1.2.3.4")) == "10.0.0.1"


def test_client_ip_ignores_spoofed_left_values(monkeypatch):
    monkeypatch.setattr(settings, "trusted_proxy_hops", 1)
    # El atacante manda "9.9.9.9"; el proxy agrega la IP real (203.0.113.7) al final.
    assert client_ip(fake_request(forwarded="9.9.9.9, 203.0.113.7")) == "203.0.113.7"


def test_client_ip_falls_back_when_header_missing(monkeypatch):
    monkeypatch.setattr(settings, "trusted_proxy_hops", 1)
    assert client_ip(fake_request()) == "10.0.0.1"


def test_login_is_blocked_after_repeated_failures_for_same_account(client):
    assert register(client).status_code == 201
    # Cada intento viene con una IP distinta: el bloqueo es por cuenta, no por IP.
    monkeypatched = []
    for attempt in range(rate_limit.login_failure_limiter.max_events):
        rate_limit.auth_limiter.clear()
        response = login(client, password="incorrecta", headers={"x-forwarded-for": f"198.51.100.{attempt}"})
        monkeypatched.append(response.status_code)
    assert monkeypatched == [401] * rate_limit.login_failure_limiter.max_events

    rate_limit.auth_limiter.clear()
    blocked = login(client, password=PASSWORD)
    assert blocked.status_code == 429
    assert "Retry-After" in blocked.headers


def test_successful_login_resets_failure_counter(client):
    assert register(client).status_code == 201
    for _ in range(rate_limit.login_failure_limiter.max_events - 1):
        rate_limit.auth_limiter.clear()
        assert login(client, password="incorrecta").status_code == 401
    rate_limit.auth_limiter.clear()
    assert login(client).status_code == 200
    rate_limit.auth_limiter.clear()
    assert login(client, password="incorrecta").status_code == 401


def test_auth_endpoints_are_limited_per_ip(client):
    statuses = []
    for index in range(rate_limit.auth_limiter.max_events + 1):
        statuses.append(register(client, email=f"user{index}@example.com").status_code)
    assert statuses[-1] == 429


def test_general_limit_is_300_per_minute():
    assert (rate_limit.general_limiter.window_seconds, rate_limit.general_limiter.max_events) == (60, 300)


def test_auth_and_login_failure_limits_are_unchanged():
    assert (rate_limit.auth_limiter.window_seconds, rate_limit.auth_limiter.max_events) == (300, 10)
    assert (rate_limit.login_failure_limiter.window_seconds, rate_limit.login_failure_limiter.max_events) == (900, 5)


def test_general_limit_blocks_after_max_with_retry_after_exposed_to_cors(client):
    origin = settings.cors_origins.split(",")[0].strip()
    for _ in range(rate_limit.general_limiter.max_events):
        assert client.get("/api/ping", headers={"Origin": origin}).status_code == 200
    blocked = client.get("/api/ping", headers={"Origin": origin})
    assert blocked.status_code == 429
    assert int(blocked.headers["Retry-After"]) > 0
    # El frontend corre en otro origen: el navegador solo le deja leer Retry-After si se expone.
    assert "retry-after" in blocked.headers["access-control-expose-headers"].lower()
