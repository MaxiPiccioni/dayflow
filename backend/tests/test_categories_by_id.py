import pytest
from sqlalchemy import select

from app.models import Category, Event, ShoppingItem, Task, Transaction
from tests.helpers import create_category, create_event, create_shopping_item, create_task, create_transaction


@pytest.fixture()
def user(make_user):
    return make_user("ana@example.com")


def names(client, user, scope="agenda", kind=None):
    query = f"scope={scope}" + (f"&kind={kind}" if kind else "")
    return [category["name"] for category in client.get(f"/api/categories?{query}", headers=user).json()]


def test_rows_point_to_the_category_by_id_and_the_api_still_shows_the_name(client, db, user):
    category = create_category(client, user, "Estudio")
    task = create_task(client, user, category="Estudio")
    event = create_event(client, user, type="Estudio")
    assert (task["category"], task["category_id"]) == ("Estudio", category["id"])
    assert (event["type"], event["category_id"]) == ("Estudio", category["id"])
    assert db.get(Task, task["id"]).category_id == category["id"]
    assert db.get(Event, event["id"]).category_id == category["id"]


def test_renaming_a_category_renames_it_everywhere_with_one_update(client, db, user):
    create_category(client, user, "Estudio")
    create_category(client, user, "Compras chicas", scope="shopping")
    create_category(client, user, "Comida", scope="finance", kind="expense")
    task = create_task(client, user, category="Estudio")
    event = create_event(client, user, type="Estudio")
    item = create_shopping_item(client, user, category="Compras chicas")
    tx = create_transaction(client, user, category="Comida", kind="expense")
    categories = {}
    for scope, kind in (("agenda", None), ("shopping", None), ("finance", "expense")):
        query = f"scope={scope}" + (f"&kind={kind}" if kind else "")
        categories.update({c["name"]: c["id"] for c in client.get(f"/api/categories?{query}", headers=user).json()})
    for old, new in (("Estudio", "Facultad"), ("Compras chicas", "Super"), ("Comida", "Almuerzo")):
        assert client.patch(f"/api/categories/{categories[old]}", json={"name": new}, headers=user).status_code == 200
    dashboard = client.get("/api/dashboard?client_today=2026-11-04", headers=user).json()
    assert [t["category"] for t in dashboard["tasks"] if t["id"] == task["id"]] == ["Facultad"]
    assert [t["category"] for t in dashboard["transactions"] if t["id"] == tx["id"]] == ["Almuerzo"]
    assert [e["type"] for e in client.get("/api/events", headers=user).json() if e["id"] == event["id"]] == ["Facultad"]
    assert [i["category"] for i in client.get("/api/shopping-items", headers=user).json() if i["id"] == item["id"]] == ["Super"]


def test_deleting_a_category_leaves_rows_without_category(client, db, user):
    category = create_category(client, user, "Estudio")
    task = create_task(client, user, category="Estudio")
    item_cat = create_category(client, user, "Almacén", scope="shopping")
    item = create_shopping_item(client, user, category="Almacén")
    assert client.delete(f"/api/categories/{category['id']}", headers=user).status_code == 204
    assert client.delete(f"/api/categories/{item_cat['id']}", headers=user).status_code == 204
    dashboard = client.get("/api/dashboard?client_today=2026-11-04", headers=user).json()
    assert [(t["category"], t["category_id"]) for t in dashboard["tasks"] if t["id"] == task["id"]] == [(None, None)]
    assert [i["category"] for i in client.get("/api/shopping-items", headers=user).json() if i["id"] == item["id"]] == [None]


def test_a_new_name_creates_its_category_once_and_matches_ignoring_case(client, db, user):
    create_task(client, user, category="Libre")
    create_task(client, user, category="libre")
    create_task(client, user, category=" LIBRE ")
    assert names(client, user).count("Libre") == 1
    assert len([c for c in db.scalars(select(Category)) if c.name.casefold() == "libre"]) == 1


def test_finance_categories_are_per_kind(client, db, user):
    expense = create_transaction(client, user, category="Otra", kind="expense")
    income = create_transaction(client, user, category="Otra", kind="income")
    assert expense["category_id"] != income["category_id"]
    assert db.get(Transaction, expense["id"]).category_ref.kind == "expense"
    assert db.get(Transaction, income["id"]).category_ref.kind == "income"


def test_update_category_by_name_and_clear_it(client, db, user):
    task = create_task(client, user, category="Estudio")
    moved = client.patch(f"/api/tasks/{task['id']}", json={"category": "Casa"}, headers=user).json()
    assert moved["category"] == "Casa" and moved["category_id"] != task["category_id"]
    cleared = client.patch(f"/api/tasks/{task['id']}", json={"category": None}, headers=user).json()
    assert (cleared["category"], cleared["category_id"]) == (None, None)
    item = create_shopping_item(client, user, category="Almacén")
    assert client.patch(f"/api/shopping-items/{item['id']}", json={"category": "Limpieza"}, headers=user).json()["category"] == "Limpieza"
    assert db.get(ShoppingItem, item["id"]).category_ref.scope == "shopping"
