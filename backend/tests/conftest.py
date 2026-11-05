import os
import tempfile

# La base de tests se define antes de importar la app para no tocar dayflow.db.
_DB_FILE = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_DB_FILE}"
os.environ["ENVIRONMENT"] = "development"
os.environ["JWT_SECRET"] = "test-secret-" + "x" * 40

import pytest
from fastapi.testclient import TestClient

from app import rate_limit
from app.database import Base, SessionLocal, engine
from app.main import app

PASSWORD = "supersecret123"


@pytest.fixture(autouse=True)
def clean_state():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    for limiter in (rate_limit.general_limiter, rate_limit.auth_limiter, rate_limit.login_failure_limiter):
        limiter.clear()
    yield


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def make_user(client):
    """Registra un usuario y devuelve su header Authorization.

    Limpia los limitadores antes de cada registro para que los tests que crean
    varios usuarios no choquen con los 10 pedidos a /auth/* cada 5 minutos.
    """

    def _make_user(email: str = "ana@example.com") -> dict[str, str]:
        rate_limit.auth_limiter.clear()
        rate_limit.general_limiter.clear()
        response = client.post("/api/auth/register", json={"email": email, "full_name": "Usuario Test", "password": PASSWORD})
        assert response.status_code == 201, response.text
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    return _make_user


@pytest.fixture()
def db():
    """Sesión sobre la misma SQLite de los tests, para preparar datos que la API no deja fijar."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
