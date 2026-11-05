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
from app.database import Base, engine
from app.main import app


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
