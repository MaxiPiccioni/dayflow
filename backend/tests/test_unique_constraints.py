from datetime import date

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.db_helpers import insert_or_get
from app.models import Category, Habit, HabitLog, HourEntry, PayPeriod, PomodoroLog, SavingEntry
from tests.helpers import TODAY, add_movement, create_saving


@pytest.fixture()
def user(make_user):
    return make_user("ana@example.com")


@pytest.fixture()
def user_id(client, user):
    return client.get("/api/auth/me", headers=user).json()["id"]


def month_of(db, user_id, name):
    return [row.month for row in db.scalars(select(SavingEntry).where(SavingEntry.user_id == user_id, SavingEntry.name == name).order_by(SavingEntry.month))]


# --- Índices únicos: la base rechaza el duplicado aunque el código no lo revise ---


def add_and_commit(db, instance):
    db.add(instance)
    db.commit()


def test_database_rejects_duplicates(db, user_id):
    habit = Habit(user_id=user_id, name="Agua", target=2)
    db.add(habit)
    db.commit()
    cases = [
        (HabitLog(user_id=user_id, habit_id=habit.id, log_date=date(2026, 11, 4), count=1), HabitLog(user_id=user_id, habit_id=habit.id, log_date=date(2026, 11, 4), count=2)),
        (HourEntry(user_id=user_id, entry_date=date(2026, 11, 4)), HourEntry(user_id=user_id, entry_date=date(2026, 11, 4))),
        (PayPeriod(user_id=user_id, start=date(2026, 11, 1), end=date(2026, 11, 30)), PayPeriod(user_id=user_id, start=date(2026, 11, 1), end=date(2026, 11, 30))),
        (PomodoroLog(user_id=user_id, log_date=date(2026, 11, 4), seconds=60), PomodoroLog(user_id=user_id, log_date=date(2026, 11, 4), seconds=30)),
        (Category(user_id=user_id, name="Trabajo", scope="agenda"), Category(user_id=user_id, name="TRABAJO", scope="agenda")),
        (Category(user_id=user_id, name="Salario", scope="finance", kind="income"), Category(user_id=user_id, name="salario", scope="finance", kind="income")),
        (SavingEntry(user_id=user_id, name="Viaje", month="2026-11"), SavingEntry(user_id=user_id, name="Viaje", month="2026-11")),
    ]
    for first, second in cases:
        add_and_commit(db, first)
        with pytest.raises(IntegrityError):
            add_and_commit(db, second)
        db.rollback()


def test_same_value_is_allowed_for_other_scopes_users_and_subjects(db, user_id, make_user, client):
    other_id = client.get("/api/auth/me", headers=make_user("beto@example.com")).json()["id"]
    db.add_all(
        [
            Category(user_id=user_id, name="Otro", scope="agenda"),
            Category(user_id=user_id, name="Otro", scope="finance", kind="income"),
            Category(user_id=user_id, name="Otro", scope="finance", kind="expense"),
            Category(user_id=user_id, name="Otro", scope="shopping"),
            Category(user_id=other_id, name="Otro", scope="agenda"),
            HourEntry(user_id=user_id, entry_date=date(2026, 11, 4)),
            HourEntry(user_id=other_id, entry_date=date(2026, 11, 4)),
            SavingEntry(user_id=user_id, name="Viaje", month="2026-10"),
            SavingEntry(user_id=user_id, name="Viaje", month="2026-11"),
        ]
    )
    db.commit()


def test_insert_or_get_returns_the_row_created_first(db, user_id):
    first = HourEntry(user_id=user_id, entry_date=date(2026, 11, 4), from_time="08:00")
    found, created = insert_or_get(db, first, lambda: None)
    assert created and found.from_time == "08:00"
    loser = HourEntry(user_id=user_id, entry_date=date(2026, 11, 4), from_time="10:00")
    found, created = insert_or_get(db, loser, lambda: db.scalar(select(HourEntry).where(HourEntry.user_id == user_id)))
    assert not created and found.from_time == "08:00"
    with pytest.raises(IntegrityError):
        insert_or_get(db, HourEntry(user_id=user_id, entry_date=date(2026, 11, 4)), lambda: None)


# --- Ahorros: nombre único por mes, y borrar o renombrar alcanza a todo el ahorro ---


def test_duplicate_saving_name_in_same_month_is_rejected(client, db, user):
    create_saving(client, db, user, name="Viaje")
    again = client.post("/api/savings", json={"name": " Viaje ", "start_amount": 1}, headers=user)
    assert again.status_code == 409
    assert "ahorro" in again.json()["detail"]


def test_rename_applies_to_the_whole_saving(client, db, user, user_id):
    create_saving(client, db, user, month="2026-10", name="Viaje")
    [rolled] = client.get(f"/api/dashboard?client_today={TODAY}", headers=user).json()["savings"]
    renamed = client.patch(f"/api/savings/{rolled['id']}", json={"name": "Vacaciones"}, headers=user)
    assert renamed.status_code == 200 and renamed.json()["name"] == "Vacaciones"
    assert month_of(db, user_id, "Viaje") == []
    assert month_of(db, user_id, "Vacaciones") == ["2026-10", "2026-11"]


def test_rename_to_a_name_already_used_is_rejected(client, db, user):
    create_saving(client, db, user, name="Viaje")
    auto = create_saving(client, db, user, name="Auto")
    response = client.patch(f"/api/savings/{auto['id']}", json={"name": "Viaje"}, headers=user)
    assert response.status_code == 409


def test_delete_removes_every_month_and_movement(client, db, user, user_id):
    create_saving(client, db, user, month="2026-10", name="Viaje")
    [rolled] = client.get(f"/api/dashboard?client_today={TODAY}", headers=user).json()["savings"]
    add_movement(client, user, rolled["id"], 100)
    assert client.delete(f"/api/savings/{rolled['id']}", headers=user).status_code == 204
    assert month_of(db, user_id, "Viaje") == []
    assert client.get(f"/api/dashboard?client_today={TODAY}", headers=user).json()["savings"] == []


def test_rollover_is_idempotent(client, db, user, user_id):
    create_saving(client, db, user, month="2026-10", name="Viaje", start_amount=500)
    for _ in range(3):
        [out] = client.get(f"/api/dashboard?client_today={TODAY}", headers=user).json()["savings"]
    assert out["start_amount"] == 500
    assert month_of(db, user_id, "Viaje") == ["2026-10", "2026-11"]


def test_category_duplicate_ignoring_case_is_rejected_by_the_api(client, user):
    ok = client.post("/api/categories", json={"name": "Gym", "scope": "agenda"}, headers=user)
    assert ok.status_code == 201
    assert client.post("/api/categories", json={"name": "gym", "scope": "agenda"}, headers=user).status_code == 409
