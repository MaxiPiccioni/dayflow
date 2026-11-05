import pytest

from tests.conftest import PASSWORD


def register(client, email="ana@example.com", password=PASSWORD, full_name="Ana Test"):
    return client.post("/api/auth/register", json={"email": email, "full_name": full_name, "password": password})


def login(client, email="ana@example.com", password=PASSWORD):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def bearer(response) -> dict[str, str]:
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_register_returns_bearer_token_and_normalizes_email(client):
    response = register(client, email="Ana.Perez@Example.COM", full_name="  Ana Pérez  ")
    assert response.status_code == 201
    assert response.json()["token_type"] == "bearer"
    me = client.get("/api/auth/me", headers=bearer(response)).json()
    assert me["email"] == "ana.perez@example.com"
    assert me["full_name"] == "Ana Pérez"


def test_register_duplicate_email_is_rejected_case_insensitively(client):
    assert register(client).status_code == 201
    response = register(client, email="ANA@example.com")
    assert response.status_code == 409


@pytest.mark.parametrize(
    "overrides",
    [
        {"password": "corta12"},  # mínimo 8 caracteres
        {"email": "no-es-un-email"},
        {"full_name": "A"},  # mínimo 2 caracteres
    ],
    ids=["short-password", "invalid-email", "short-name"],
)
def test_register_validates_payload(client, overrides):
    assert register(client, **overrides).status_code == 422


def test_login_with_correct_credentials_ignores_email_case(client):
    register(client)
    response = login(client, email="ANA@EXAMPLE.com")
    assert response.status_code == 200
    assert client.get("/api/auth/me", headers=bearer(response)).json()["email"] == "ana@example.com"


@pytest.mark.parametrize(("email", "password"), [("ana@example.com", "incorrecta"), ("nadie@example.com", PASSWORD)], ids=["wrong-password", "unknown-email"])
def test_login_with_wrong_credentials_is_rejected(client, email, password):
    register(client)
    response = login(client, email=email, password=password)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_me_requires_a_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_only_public_fields(client, make_user):
    headers = make_user("ana@example.com")
    assert set(client.get("/api/auth/me", headers=headers).json()) == {"id", "email", "full_name"}


def test_token_of_deleted_user_is_rejected(client, db, make_user):
    from app.models import User

    headers = make_user("ana@example.com")
    db.delete(db.query(User).one())
    db.commit()
    assert client.get("/api/auth/me", headers=headers).status_code == 401
