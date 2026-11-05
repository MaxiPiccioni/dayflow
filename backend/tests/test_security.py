import importlib
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app import config, security
from app.config import settings

PASSWORD = "supersecret123"


def register_and_token(client, email="ana@example.com") -> str:
    response = client.post("/api/auth/register", json={"email": email, "full_name": "Ana Test", "password": PASSWORD})
    assert response.status_code == 201
    return response.json()["access_token"]


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_me_with_valid_token(client):
    token = register_and_token(client)
    response = client.get("/api/auth/me", headers=auth(token))
    assert response.status_code == 200
    assert response.json()["email"] == "ana@example.com"


def test_expired_token_is_rejected(client):
    register_and_token(client)
    expired = jwt.encode({"sub": "1", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)}, settings.jwt_secret, algorithm="HS256")
    assert client.get("/api/auth/me", headers=auth(expired)).status_code == 401


def test_token_with_wrong_signature_is_rejected(client):
    register_and_token(client)
    forged = jwt.encode({"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(hours=1)}, "otra-clave-" + "y" * 40, algorithm="HS256")
    assert client.get("/api/auth/me", headers=auth(forged)).status_code == 401


def test_token_without_expiration_is_rejected(client):
    register_and_token(client)
    no_exp = jwt.encode({"sub": "1"}, settings.jwt_secret, algorithm="HS256")
    assert client.get("/api/auth/me", headers=auth(no_exp)).status_code == 401


def test_token_with_none_algorithm_is_rejected(client):
    register_and_token(client)
    unsigned = jwt.encode({"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(hours=1)}, key=None, algorithm="none")
    assert client.get("/api/auth/me", headers=auth(unsigned)).status_code == 401


def test_get_user_id_roundtrip():
    assert security.get_user_id(security.create_access_token(42)) == 42


def test_get_user_id_rejects_garbage():
    with pytest.raises(ValueError):
        security.get_user_id("no-es-un-jwt")


def test_security_headers_without_hsts_in_development(client):
    response = client.get("/api/ping")
    assert response.headers["x-content-type-options"] == "nosniff"
    assert "strict-transport-security" not in response.headers


def test_docs_available_in_development(client):
    assert client.get("/docs").status_code == 200


def test_production_hides_docs_and_sends_hsts(monkeypatch):
    """Recarga la app con ENVIRONMENT=production y verifica docs y HSTS."""
    from fastapi.testclient import TestClient

    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("JWT_SECRET", "p" * 48)
    importlib.reload(config)
    import app.main as main

    main = importlib.reload(main)
    try:
        with TestClient(main.app) as prod_client:
            assert prod_client.get("/docs").status_code == 404
            assert prod_client.get("/redoc").status_code == 404
            assert prod_client.get("/openapi.json").status_code == 404
            response = prod_client.get("/api/ping")
            assert "max-age=" in response.headers["strict-transport-security"]
    finally:
        monkeypatch.undo()
        importlib.reload(config)
        importlib.reload(main)
