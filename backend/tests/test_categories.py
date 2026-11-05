import pytest

from tests.helpers import TODAY, create_category, create_event, create_shopping_item, create_task, create_transaction


@pytest.fixture()
def user(make_user):
    return make_user("ana@example.com")


def names(client, user, query="") -> list[str]:
    response = client.get(f"/api/categories{query}", headers=user)
    assert response.status_code == 200
    return [category["name"] for category in response.json()]


def find(client, user, name, query=""):
    return next(category for category in client.get(f"/api/categories{query}", headers=user).json() if category["name"] == name)


def snapshot(client, user) -> dict:
    """Categoría de cada tarea, evento, transacción y producto del usuario."""
    dashboard = client.get(f"/api/dashboard?client_today={TODAY}", headers=user).json()
    return {
        "tasks": sorted((task["title"], task["category"]) for task in dashboard["tasks"]),
        "events": sorted((event["title"], event["type"]) for event in client.get("/api/events", headers=user).json()),
        "transactions": sorted((item["description"], item["category"]) for item in dashboard["transactions"]),
        "shopping": sorted((item["name"], item["category"]) for item in client.get("/api/shopping-items", headers=user).json()),
    }


@pytest.mark.parametrize(
    ("query", "expected"),
    [
        ("", ["Foco", "Personal", "Rutina", "Trabajo"]),
        ("?scope=agenda", ["Foco", "Personal", "Rutina", "Trabajo"]),
        ("?scope=finance&kind=income", ["Freelance", "Otro", "Regalo", "Salario"]),
        ("?scope=finance&kind=expense", ["Alimentación", "Ocio", "Otro", "Servicios", "Transporte"]),
        ("?scope=finance", []),
        ("?scope=shopping", []),
    ],
    ids=["default", "agenda", "income", "expense", "finance-without-kind", "shopping"],
)
def test_defaults_by_scope_and_kind(client, user, query, expected):
    assert names(client, user, query) == expected
    assert names(client, user, query) == expected  # pedirlo de nuevo no duplica


def test_defaults_come_back_after_deleting_every_category(client, user):
    # Comportamiento actual: el GET vuelve a sembrar los defaults si la lista quedó vacía.
    for category in client.get("/api/categories", headers=user).json():
        client.delete(f"/api/categories/{category['id']}", headers=user)
    assert names(client, user) == ["Foco", "Personal", "Rutina", "Trabajo"]


def test_create_category_strips_name(client, user):
    created = create_category(client, user, "  Estudio  ")
    assert (created["name"], created["scope"], created["kind"]) == ("Estudio", "agenda", None)


def test_duplicate_is_rejected_case_insensitively_within_scope_and_kind(client, user):
    names(client, user)
    response = client.post("/api/categories", json={"name": "trabajo"}, headers=user)
    assert response.status_code == 409
    assert response.json()["detail"] == "Esa categoría ya existe"
    # Mismo nombre en otro scope o en otro kind sí se permite.
    create_category(client, user, "Trabajo", scope="shopping")
    create_category(client, user, "Trabajo", scope="finance", kind="income")
    create_category(client, user, "Trabajo", scope="finance", kind="expense")


@pytest.mark.parametrize("payload", [{"name": "X", "scope": "otra"}, {"name": "X", "scope": "finance", "kind": "otro"}, {"name": ""}], ids=["scope", "kind", "empty"])
def test_invalid_category_payload(client, user, payload):
    assert client.post("/api/categories", json=payload, headers=user).status_code == 422


@pytest.mark.xfail(strict=True, reason="BUG: el chequeo de duplicados usa ILIKE sin escapar, así que % y _ funcionan como comodines")
def test_name_with_like_wildcards_is_not_a_false_duplicate(client, user):
    names(client, user)
    assert client.post("/api/categories", json={"name": "%"}, headers=user).status_code == 201


def test_rename_to_existing_name_is_rejected(client, user):
    names(client, user)
    foco = find(client, user, "Foco")
    assert client.patch(f"/api/categories/{foco['id']}", json={"name": "RUTINA"}, headers=user).status_code == 409
    # Cambiar solo mayúsculas del propio nombre sí se permite.
    assert client.patch(f"/api/categories/{foco['id']}", json={"name": "FOCO"}, headers=user).json()["name"] == "FOCO"


@pytest.fixture()
def shared_name_data(client, user):
    """Una tarea, un evento, transacciones y un producto que usan el mismo nombre de categoría."""
    create_task(client, user, title="tarea", category="Casa")
    create_event(client, user, title="evento", type="Casa")
    create_transaction(client, user, description="gasto", category="Casa", kind="expense")
    create_transaction(client, user, description="ingreso", category="Casa", kind="income")
    create_shopping_item(client, user, name="producto", category="Casa")
    return {
        "agenda": create_category(client, user, "Casa"),
        "expense": create_category(client, user, "Casa", scope="finance", kind="expense"),
        "shopping": create_category(client, user, "Casa", scope="shopping"),
    }


EXPECTED_AFTER = {
    "agenda": {"tasks": [("tarea", "{new}")], "events": [("evento", "{new}")], "transactions": [("gasto", "Casa"), ("ingreso", "Casa")], "shopping": [("producto", "Casa")]},
    "expense": {"tasks": [("tarea", "Casa")], "events": [("evento", "Casa")], "transactions": [("gasto", "{new}"), ("ingreso", "Casa")], "shopping": [("producto", "Casa")]},
    "shopping": {"tasks": [("tarea", "Casa")], "events": [("evento", "Casa")], "transactions": [("gasto", "Casa"), ("ingreso", "Casa")], "shopping": [("producto", "{new}")]},
}


def expected_snapshot(scope: str, new_value):
    return {key: [(title, new_value if value == "{new}" else value) for title, value in rows] for key, rows in EXPECTED_AFTER[scope].items()}


@pytest.mark.parametrize("scope", ["agenda", "expense", "shopping"])
def test_rename_propagates_only_within_scope(client, user, shared_name_data, scope):
    category = shared_name_data[scope]
    response = client.patch(f"/api/categories/{category['id']}", json={"name": "Hogar"}, headers=user)
    assert response.status_code == 200
    assert snapshot(client, user) == expected_snapshot(scope, "Hogar")


@pytest.mark.parametrize("scope", ["agenda", "expense", "shopping"])
def test_delete_clears_category_only_within_scope(client, user, shared_name_data, scope):
    category = shared_name_data[scope]
    assert client.delete(f"/api/categories/{category['id']}", headers=user).status_code == 204
    assert snapshot(client, user) == expected_snapshot(scope, None)


def test_missing_category_returns_404(client, user):
    assert client.patch("/api/categories/999", json={"name": "X"}, headers=user).status_code == 404
    assert client.delete("/api/categories/999", headers=user).status_code == 404
