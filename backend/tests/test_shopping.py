import pytest

from tests.helpers import create_shopping_item


@pytest.fixture()
def user(make_user):
    return make_user("ana@example.com")


def test_items_are_listed_by_name(client, user):
    for name in ("Yerba", "Arroz", "  Café  "):
        create_shopping_item(client, user, name=name)
    assert [item["name"] for item in client.get("/api/shopping-items", headers=user).json()] == ["Arroz", "Café", "Yerba"]


def test_update_and_delete_item(client, user):
    item = create_shopping_item(client, user, stock=2)
    updated = client.patch(f"/api/shopping-items/{item['id']}", json={"stock": 0, "force_list": True, "buy_quantity": 3}, headers=user).json()
    assert (updated["stock"], updated["force_list"], updated["buy_quantity"]) == (0, True, 3)
    assert client.patch(f"/api/shopping-items/{item['id']}", json={"stock": -1}, headers=user).status_code == 422
    assert client.delete(f"/api/shopping-items/{item['id']}", headers=user).status_code == 204
    assert client.get("/api/shopping-items", headers=user).json() == []
    assert client.delete(f"/api/shopping-items/{item['id']}", headers=user).status_code == 404


@pytest.mark.xfail(strict=True, reason="BUG: create_shopping_item no pasa buy_quantity al modelo y siempre guarda 1")
def test_create_keeps_buy_quantity(client, user):
    assert create_shopping_item(client, user, buy_quantity=4)["buy_quantity"] == 4
