"""Helpers para crear datos por la API con fechas fijas (los tests no dependen del día real)."""

from datetime import datetime

from app.models import Habit, SavingEntry

TODAY = "2026-11-04"  # miércoles
HABIT_CREATED_AT = datetime(2026, 10, 1, 12, 0)


def create_task(client, headers, **overrides) -> dict:
    payload = {"title": "Tarea", "due_date": TODAY, **overrides}
    response = client.post("/api/tasks", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()[0]


def create_event(client, headers, **overrides) -> dict:
    payload = {"title": "Evento", "event_date": TODAY, **overrides}
    response = client.post("/api/events", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()[0]


def create_category(client, headers, name, scope="agenda", kind=None) -> dict:
    response = client.post("/api/categories", json={"name": name, "scope": scope, "kind": kind}, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def create_transaction(client, headers, **overrides) -> dict:
    payload = {"description": "Compra", "amount": 100, "kind": "expense", **overrides}
    response = client.post("/api/transactions", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def create_shopping_item(client, headers, **overrides) -> dict:
    payload = {"name": "Yerba", **overrides}
    response = client.post("/api/shopping-items", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def create_habit(client, db, headers, created_at=HABIT_CREATED_AT, **overrides) -> dict:
    """Crea un hábito y fija su created_at, que el servidor toma del reloj real."""
    payload = {"name": "Leer", "target": 1, **overrides}
    response = client.post(f"/api/habits?client_today={TODAY}", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    habit = response.json()
    db.get(Habit, habit["id"]).created_at = created_at
    db.commit()
    return habit


def set_habit_log(client, headers, habit_id, log_date, count, today=TODAY):
    return client.put(f"/api/habits/{habit_id}/logs/{log_date}?client_today={today}", json={"count": count}, headers=headers)


def create_saving(client, db, headers, month="2026-11", **overrides) -> dict:
    """Crea un ahorro y fija su mes, que el servidor toma del reloj real."""
    payload = {"name": "Viaje", "start_amount": 1000, **overrides}
    response = client.post("/api/savings", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    saving = response.json()
    db.get(SavingEntry, saving["id"]).month = month
    db.commit()
    return saving


def add_movement(client, headers, saving_id, amount, movement_date=TODAY):
    return client.post(f"/api/savings/{saving_id}/movements", json={"amount": amount, "movement_date": movement_date}, headers=headers)


def put_hour_entry(client, headers, entry_date, **overrides) -> dict:
    response = client.put("/api/hours/entries", json={"entry_date": entry_date, **overrides}, headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def hours_state(client, headers, reference_date=TODAY) -> dict:
    response = client.get(f"/api/hours?reference_date={reference_date}", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def add_hour_payment(client, headers, amount, payment_date=TODAY, reference_date=TODAY) -> dict:
    response = client.post("/api/hours/payments", json={"amount": amount, "payment_date": payment_date, "reference_date": reference_date}, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def close_period(client, headers, reference_date=TODAY):
    return client.post("/api/hours/close", json={"reference_date": reference_date}, headers=headers)
