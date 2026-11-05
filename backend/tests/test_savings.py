import pytest

from app.models import SavingEntry
from tests.helpers import add_movement, create_saving


@pytest.fixture()
def user(make_user):
    return make_user("ana@example.com")


def dashboard_savings(client, user, today) -> list[dict]:
    response = client.get(f"/api/dashboard?client_today={today}", headers=user)
    assert response.status_code == 200
    return response.json()["savings"]


def test_new_saving_has_no_gain(client, db, user):
    saving = create_saving(client, db, user, start_amount=1000)
    assert {key: saving[key] for key in ("start_amount", "current_amount", "gain")} == {"start_amount": 1000, "current_amount": 1000, "gain": 0}


def test_movements_update_current_amount_and_gain(client, db, user):
    saving = create_saving(client, db, user, start_amount=1000)
    assert add_movement(client, user, saving["id"], 500).json()["current_amount"] == 1500
    out = add_movement(client, user, saving["id"], -200, movement_date="2026-11-05").json()
    assert (out["current_amount"], out["gain"]) == (1300, 300)

    movements = client.get(f"/api/savings/{saving['id']}/movements", headers=user).json()
    assert [(m["movement_date"], m["amount"]) for m in movements] == [("2026-11-05", -200), ("2026-11-04", 500)]

    out = client.delete(f"/api/savings/{saving['id']}/movements/{movements[0]['id']}", headers=user).json()
    assert (out["current_amount"], out["gain"]) == (1500, 500)
    assert client.delete(f"/api/savings/{saving['id']}/movements/{movements[0]['id']}", headers=user).status_code == 404


def test_zero_movement_is_rejected(client, db, user):
    saving = create_saving(client, db, user)
    response = add_movement(client, user, saving["id"], 0)
    assert response.status_code == 400
    assert response.json()["detail"] == "El monto no puede ser cero"


def test_update_start_amount_recomputes(client, db, user):
    saving = create_saving(client, db, user, start_amount=1000)
    add_movement(client, user, saving["id"], 100)
    out = client.patch(f"/api/savings/{saving['id']}", json={"start_amount": 2000, "name": "Auto"}, headers=user).json()
    assert (out["name"], out["current_amount"], out["gain"]) == ("Auto", 2100, 100)


def test_delete_saving(client, db, user):
    saving = create_saving(client, db, user)
    add_movement(client, user, saving["id"], 100)
    assert client.delete(f"/api/savings/{saving['id']}", headers=user).status_code == 204
    assert client.get(f"/api/savings/{saving['id']}/movements", headers=user).status_code == 404
    assert dashboard_savings(client, user, "2026-11-04") == []


def test_dashboard_shows_only_savings_of_client_month(client, db, user):
    create_saving(client, db, user, name="Noviembre", month="2026-11")
    create_saving(client, db, user, name="Diciembre", month="2026-12")
    assert [saving["name"] for saving in dashboard_savings(client, user, "2026-11-04")] == ["Noviembre"]


def test_rollover_creates_new_month_with_accumulated_amount_once(client, db, user):
    saving = create_saving(client, db, user, start_amount=1000, month="2026-10")
    add_movement(client, user, saving["id"], 300, movement_date="2026-10-20")

    [rolled] = dashboard_savings(client, user, "2026-11-04")
    assert rolled["id"] != saving["id"]
    assert (rolled["name"], rolled["start_amount"], rolled["current_amount"], rolled["gain"]) == ("Viaje", 1300, 1300, 0)

    # Llamar de nuevo no duplica.
    assert [s["id"] for s in dashboard_savings(client, user, "2026-11-20")] == [rolled["id"]]
    assert db.query(SavingEntry).filter_by(month="2026-11").count() == 1

    # El mes anterior queda como estaba.
    [october] = dashboard_savings(client, user, "2026-10-15")
    assert (october["id"], october["current_amount"], october["gain"]) == (saving["id"], 1300, 300)


def test_rollover_skips_empty_months(client, db, user):
    create_saving(client, db, user, start_amount=500, month="2026-10")
    [rolled] = dashboard_savings(client, user, "2027-01-03")
    assert rolled["start_amount"] == 500
    assert sorted(entry.month for entry in db.query(SavingEntry).all()) == ["2026-10", "2027-01"]


@pytest.mark.xfail(strict=True, reason="BUG: borrar el ahorro del mes actual lo vuelve a crear en el próximo /dashboard a partir del mes anterior")
def test_deleted_saving_does_not_come_back(client, db, user):
    create_saving(client, db, user, month="2026-10")
    [rolled] = dashboard_savings(client, user, "2026-11-04")
    client.delete(f"/api/savings/{rolled['id']}", headers=user)
    assert dashboard_savings(client, user, "2026-11-04") == []


@pytest.mark.xfail(strict=True, reason="BUG: renombrar el ahorro del mes actual hace que el nombre viejo se vuelva a crear desde el mes anterior")
def test_renamed_saving_is_not_duplicated(client, db, user):
    create_saving(client, db, user, month="2026-10")
    [rolled] = dashboard_savings(client, user, "2026-11-04")
    client.patch(f"/api/savings/{rolled['id']}", json={"name": "Vacaciones"}, headers=user)
    assert [saving["name"] for saving in dashboard_savings(client, user, "2026-11-04")] == ["Vacaciones"]
