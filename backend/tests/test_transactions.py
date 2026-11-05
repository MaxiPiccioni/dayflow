import pytest

from tests.helpers import TODAY, create_transaction


@pytest.fixture()
def user(make_user):
    return make_user("ana@example.com")


def dashboard_transactions(client, user) -> list[dict]:
    return client.get(f"/api/dashboard?client_today={TODAY}", headers=user).json()["transactions"]


def test_create_uses_defaults(client, user):
    created = create_transaction(client, user, description="Sueldo", amount=5000, kind="income")
    # Comportamiento actual: la categoría por defecto es "General", que no está entre los defaults de finanzas.
    assert (created["category"], created["method"]) == ("General", "Efectivo")


@pytest.mark.parametrize("overrides", [{"amount": 0}, {"kind": "transfer"}, {"method": "Tarjeta"}], ids=["zero-amount", "kind", "method"])
def test_invalid_transaction(client, user, overrides):
    response = client.post("/api/transactions", json={"description": "x", "amount": 10, "kind": "expense", **overrides}, headers=user)
    assert response.status_code == 422


def test_delete_transaction(client, user):
    created = create_transaction(client, user)
    assert client.delete(f"/api/transactions/{created['id']}", headers=user).status_code == 204
    assert dashboard_transactions(client, user) == []
    assert client.delete(f"/api/transactions/{created['id']}", headers=user).status_code == 404


def test_health_checks_the_database(client):
    assert client.get("/api/health").json() == {"status": "ok"}
