from datetime import date

import pytest

from app.main import CALENDAR_PERIODS_FROM, _entry_duration, _entry_value
from app.models import HourEntry, HourPayment, PayPeriod
from tests.helpers import TODAY, add_hour_payment, close_period, hours_state, put_hour_entry


def entry(**fields) -> HourEntry:
    defaults = {"from_time": "09:00", "to_time": "17:00", "hours": None, "extra": False, "holiday": False}
    return HourEntry(**{**defaults, **fields})


@pytest.fixture()
def user(make_user):
    return make_user("ana@example.com")


def add_legacy_period(db, user_headers, client, start, end, closed=False):
    user_id = client.get("/api/auth/me", headers=user_headers).json()["id"]
    period = PayPeriod(user_id=user_id, start=date.fromisoformat(start), end=date.fromisoformat(end), rate=1000, closed=closed)
    db.add(period)
    db.commit()
    return period.id


# --- Duración y valor de una jornada ---


@pytest.mark.parametrize(
    ("fields", "expected"),
    [
        ({"from_time": "09:00", "to_time": "17:30"}, 8.5),
        ({"from_time": "08:15", "to_time": "08:45"}, 0.5),
        ({"hours": 3.25}, 3.25),  # las horas manuales pisan el rango
        ({"hours": 0.0}, 0.0),
        ({"holiday": True}, 4.0),
        ({"holiday": True, "hours": 9.0}, 4.0),  # el feriado pisa las horas manuales
        ({"from_time": "18:00", "to_time": "09:00"}, 0.0),  # rango invertido (cruza medianoche) da 0
    ],
    ids=["range", "half-hour", "manual", "manual-zero", "holiday", "holiday-over-manual", "inverted"],
)
def test_entry_duration(fields, expected):
    assert _entry_duration(entry(**fields)) == expected


@pytest.mark.parametrize(
    ("fields", "expected"),
    [
        ({"hours": 2.0}, 2000.0),
        ({"hours": 2.0, "extra": True}, 4000.0),
        ({"holiday": True, "extra": True}, 8000.0),
    ],
    ids=["normal", "extra-x2", "holiday-extra"],
)
def test_entry_value(fields, expected):
    assert _entry_value(entry(**fields), 1000) == expected


def test_entry_upsert_replaces_existing_entry_of_same_date(client, user):
    first = put_hour_entry(client, user, TODAY, from_time="08:00", to_time="12:00")
    second = put_hour_entry(client, user, TODAY, hours=6, extra=True)
    assert second["id"] == first["id"]
    assert hours_state(client, user)["entries"] == [{**second, "from_time": "09:00", "to_time": "17:00"}]


def test_delete_entry(client, user):
    created = put_hour_entry(client, user, TODAY)
    assert client.delete(f"/api/hours/entries/{created['id']}", headers=user).status_code == 204
    assert hours_state(client, user)["entries"] == []
    assert client.delete(f"/api/hours/entries/{created['id']}", headers=user).status_code == 404


# --- Resolución del período ---


def test_cutover_date():
    assert CALENDAR_PERIODS_FROM == date(2026, 10, 1)


@pytest.mark.parametrize(
    ("reference", "start", "end"),
    [
        ("2026-11-04", "2026-11-01", "2026-11-30"),
        ("2026-11-30", "2026-11-01", "2026-11-30"),
        ("2026-10-01", "2026-10-01", "2026-10-31"),
        ("2027-02-10", "2027-02-01", "2027-02-28"),
        ("2028-02-10", "2028-02-01", "2028-02-29"),
        ("2026-12-31", "2026-12-01", "2026-12-31"),
    ],
)
def test_period_is_calendar_month(client, user, reference, start, end):
    period = hours_state(client, user, reference)["period"]
    assert (period["start"], period["end"], period["closed"]) == (start, end, False)


def test_same_month_reuses_period(client, user):
    first = hours_state(client, user, "2026-11-02")["period"]
    second = hours_state(client, user, "2026-11-29")["period"]
    assert first["id"] == second["id"]


def test_before_cutover_legacy_period_is_found_by_range(client, db, user):
    legacy_id = add_legacy_period(db, user, client, "2026-08-11", "2026-09-10", closed=True)
    for reference in ("2026-08-11", "2026-08-31", "2026-09-10"):
        assert hours_state(client, user, reference)["period"]["id"] == legacy_id


def test_before_cutover_without_period_returns_404_and_creates_nothing(client, db, user):
    response = client.get("/api/hours?reference_date=2026-05-20", headers=user)
    assert response.status_code == 404
    assert response.json()["detail"] == "No hay registros para esa fecha"
    assert db.query(PayPeriod).count() == 0


HISTORY_DETAIL = "Ese período es historia cerrada"


@pytest.mark.parametrize("entry_date", ["2026-09-30", "2026-09-05"], ids=["without-period", "inside-legacy-period"])
def test_entries_before_cutover_cannot_be_created_or_edited(client, db, user, entry_date):
    add_legacy_period(db, user, client, "2026-08-11", "2026-09-10", closed=True)
    response = client.put("/api/hours/entries", json={"entry_date": entry_date}, headers=user)
    assert response.status_code == 400
    assert response.json()["detail"] == HISTORY_DETAIL
    put_hour_entry(client, user, "2026-10-01")  # desde el corte sí se puede


def test_rate_and_close_before_cutover_are_rejected(client, db, user):
    legacy_id = add_legacy_period(db, user, client, "2026-08-11", "2026-09-10")
    for path, body in (("/api/hours/period", {"rate": 5, "reference_date": "2026-09-01"}), ("/api/hours/close", {"reference_date": "2026-09-01"})):
        response = client.request("PATCH" if path.endswith("period") else "POST", path, json=body, headers=user)
        assert response.status_code == 400, path
        assert response.json()["detail"] == HISTORY_DETAIL
    period = db.get(PayPeriod, legacy_id)
    db.refresh(period)
    assert (period.rate, period.closed) == (1000, False)


def test_payments_on_existing_legacy_period_are_allowed(client, db, user):
    legacy_id = add_legacy_period(db, user, client, "2026-09-11", "2026-09-30", closed=True)
    state = add_hour_payment(client, user, 700, payment_date="2026-10-15", reference_date="2026-09-20")
    assert state["period"]["id"] == legacy_id
    state = client.post(f"/api/hours/periods/{legacy_id}/payments", json={"amount": 300, "payment_date": "2026-10-20"}, headers=user).json()
    assert state["closed_periods"][0]["paid"] == 1000
    response = client.post("/api/hours/payments", json={"amount": 10, "payment_date": TODAY, "reference_date": "2026-05-20"}, headers=user)
    assert response.status_code == 404


def test_legacy_period_can_still_be_reopened_and_deleted(client, db, user):
    legacy_id = add_legacy_period(db, user, client, "2026-08-11", "2026-09-10", closed=True)
    assert client.post(f"/api/hours/periods/{legacy_id}/reopen", headers=user).json()["period"]["id"] == legacy_id
    db.get(PayPeriod, legacy_id).closed = True
    db.commit()
    assert client.delete(f"/api/hours/periods/{legacy_id}", headers=user).status_code == 200
    db.expire_all()
    assert db.query(PayPeriod).filter_by(start=date(2026, 8, 11)).count() == 0


def test_from_cutover_legacy_period_overlapping_the_date_is_ignored(client, db, user):
    # Un período viejo "11 al 10" que quedó cruzando el corte no captura fechas nuevas.
    legacy_id = add_legacy_period(db, user, client, "2026-10-11", "2026-11-10", closed=True)
    november = hours_state(client, user, "2026-11-02")["period"]
    october = hours_state(client, user, "2026-10-20")["period"]
    assert (november["start"], november["end"]) == ("2026-11-01", "2026-11-30")
    assert (october["start"], october["end"]) == ("2026-10-01", "2026-10-31")
    assert legacy_id not in (november["id"], october["id"])


def test_before_cutover_new_period_does_not_overlap_legacy_period(client, db, user):
    legacy_id = add_legacy_period(db, user, client, "2026-06-11", "2026-07-10", closed=True)
    assert client.get("/api/hours?reference_date=2026-06-05", headers=user).status_code == 404
    assert [period.id for period in db.query(PayPeriod).all()] == [legacy_id]


def test_new_period_inherits_rate_of_latest_period(client, user):
    client.patch("/api/hours/period", json={"rate": 1500, "reference_date": "2026-10-15"}, headers=user)
    assert hours_state(client, user, "2026-11-04")["period"]["rate"] == 1500


def test_rate_update_applies_to_period_of_reference(client, user):
    state = client.patch("/api/hours/period", json={"rate": 2000, "reference_date": TODAY}, headers=user).json()
    assert state["period"]["rate"] == 2000
    assert client.patch("/api/hours/period", json={"rate": -1, "reference_date": TODAY}, headers=user).status_code == 422


# --- Pagos, cierre, reapertura y borrado ---


def seed_november(client, user):
    """Rate 1000; 8 h normales + 4 h extra en noviembre y 2 h en diciembre."""
    client.patch("/api/hours/period", json={"rate": 1000, "reference_date": TODAY}, headers=user)
    put_hour_entry(client, user, "2026-11-02", from_time="09:00", to_time="17:00")
    put_hour_entry(client, user, "2026-11-03", hours=4, extra=True)
    put_hour_entry(client, user, "2026-12-01", hours=2)


def test_payments_belong_to_the_period_of_reference(client, user):
    add_hour_payment(client, user, 3000)
    state = add_hour_payment(client, user, 2000, payment_date="2026-12-05")
    assert sorted(payment["amount"] for payment in state["payments"]) == [2000, 3000]
    assert hours_state(client, user, "2026-12-15")["payments"] == []
    assert client.post("/api/hours/payments", json={"amount": 0, "payment_date": TODAY, "reference_date": TODAY}, headers=user).status_code == 422


def test_delete_payment(client, user):
    payment_id = add_hour_payment(client, user, 3000)["payments"][0]["id"]
    assert client.delete(f"/api/hours/payments/{payment_id}", headers=user).status_code == 204
    assert hours_state(client, user)["payments"] == []
    assert client.delete(f"/api/hours/payments/{payment_id}", headers=user).status_code == 404


def test_close_freezes_totals_paid_and_balance(client, user):
    seed_november(client, user)
    add_hour_payment(client, user, 3000)
    add_hour_payment(client, user, 2000)
    response = close_period(client, user)
    assert response.status_code == 200
    [closed] = response.json()["closed_periods"]
    assert (closed["start"], closed["end"]) == ("2026-11-01", "2026-11-30")
    assert closed["total_hours"] == 12
    assert closed["expected"] == 8000 + 8000
    assert closed["paid"] == 5000
    assert closed["balance"] == 11000
    assert hours_state(client, user)["period"]["closed"] is True

    # Las jornadas cargadas después no cambian los totales congelados.
    put_hour_entry(client, user, "2026-11-20", hours=10)
    assert hours_state(client, user)["closed_periods"][0]["total_hours"] == 12


def test_overpaid_period_has_negative_balance(client, user):
    seed_november(client, user)
    add_hour_payment(client, user, 20000)
    [closed] = close_period(client, user).json()["closed_periods"]
    assert closed["balance"] == -4000


def test_period_cannot_be_closed_twice(client, user):
    assert close_period(client, user).status_code == 200
    response = close_period(client, user)
    assert response.status_code == 400
    assert response.json()["detail"] == "Period already closed"


def test_reopen_returns_the_reopened_period_and_close_recomputes(client, user):
    seed_november(client, user)
    period_id = hours_state(client, user)["period"]["id"]
    close_period(client, user)

    state = client.post(f"/api/hours/periods/{period_id}/reopen", headers=user).json()
    assert state["period"]["id"] == period_id
    assert state["period"]["closed"] is False
    assert state["closed_periods"] == []

    put_hour_entry(client, user, "2026-11-20", hours=10)
    [closed] = close_period(client, user).json()["closed_periods"]
    assert closed["total_hours"] == 22


def test_reopen_legacy_period_returns_it_instead_of_calendar_month(client, db, user):
    legacy_id = add_legacy_period(db, user, client, "2026-10-11", "2026-11-10", closed=True)
    state = client.post(f"/api/hours/periods/{legacy_id}/reopen", headers=user).json()
    assert (state["period"]["id"], state["period"]["start"], state["period"]["end"]) == (legacy_id, "2026-10-11", "2026-11-10")


def test_only_closed_periods_can_be_deleted(client, user):
    period_id = hours_state(client, user)["period"]["id"]
    response = client.delete(f"/api/hours/periods/{period_id}", headers=user)
    assert response.status_code == 400
    assert response.json()["detail"] == "Only closed periods can be deleted"


def test_delete_closed_period_removes_its_entries_and_payments(client, db, user):
    seed_november(client, user)
    add_hour_payment(client, user, 1000)
    period_id = hours_state(client, user)["period"]["id"]
    close_period(client, user)

    state = client.delete(f"/api/hours/periods/{period_id}", headers=user).json()
    assert state["closed_periods"] == []
    assert [entry["entry_date"] for entry in state["entries"]] == ["2026-12-01"]
    # Se verifica en la base: la respuesta arma el estado con la fecha real del servidor
    # y SQLite puede reutilizar el id del período borrado.
    assert db.query(HourPayment).count() == 0


def test_period_payments_endpoint_lists_payments_by_date(client, user):
    add_hour_payment(client, user, 500, payment_date="2026-11-20")
    add_hour_payment(client, user, 700, payment_date="2026-11-05")
    period_id = hours_state(client, user)["period"]["id"]
    payments = client.get(f"/api/hours/periods/{period_id}/payments", headers=user).json()
    assert [(payment["payment_date"], payment["amount"]) for payment in payments] == [("2026-11-05", 700), ("2026-11-20", 500)]


def closed_summary(state) -> tuple:
    [closed] = state["closed_periods"]
    return (closed["total_hours"], closed["expected"], closed["paid"], closed["balance"])


def test_payments_on_closed_period_update_paid_and_balance_but_not_frozen_totals(client, user):
    # Los pagos llegan a mes vencido: un período cerrado tiene que seguir aceptándolos.
    seed_november(client, user)
    add_hour_payment(client, user, 5000)
    assert closed_summary(close_period(client, user).json()) == (12, 16000, 5000, 11000)

    state = add_hour_payment(client, user, 4000, payment_date="2026-12-05")
    assert closed_summary(state) == (12, 16000, 9000, 7000)
    assert (state["period"]["paid"], state["period"]["balance"]) == (9000, 7000)

    payment_id = next(payment["id"] for payment in state["payments"] if payment["amount"] == 5000)
    assert client.delete(f"/api/hours/payments/{payment_id}", headers=user).status_code == 204
    assert closed_summary(hours_state(client, user)) == (12, 16000, 4000, 12000)


def test_period_payments_endpoint_targets_explicit_period(client, user):
    seed_november(client, user)
    period_id = hours_state(client, user)["period"]["id"]
    close_period(client, user)

    # Se paga noviembre (cerrado) mientras se mira diciembre.
    hours_state(client, user, "2026-12-10")
    response = client.post(f"/api/hours/periods/{period_id}/payments", json={"amount": 3000, "payment_date": "2026-12-10", "method": "Efectivo"}, headers=user)
    assert response.status_code == 201
    state = response.json()
    assert state["period"]["id"] == period_id
    assert [(payment["amount"], payment["method"]) for payment in state["payments"]] == [(3000, "Efectivo")]
    assert closed_summary(state) == (12, 16000, 3000, 13000)
    assert hours_state(client, user, "2026-12-10")["payments"] == []


def test_period_payments_endpoint_validation_and_missing_period(client, user):
    period_id = hours_state(client, user)["period"]["id"]
    assert client.post(f"/api/hours/periods/{period_id}/payments", json={"amount": 0, "payment_date": TODAY}, headers=user).status_code == 422
    assert client.post("/api/hours/periods/999/payments", json={"amount": 10, "payment_date": TODAY}, headers=user).status_code == 404


def test_open_period_paid_and_balance_are_live(client, user):
    seed_november(client, user)
    state = add_hour_payment(client, user, 6000)
    assert (state["period"]["closed"], state["period"]["paid"], state["period"]["balance"]) == (False, 6000, 10000)
    assert hours_state(client, user, "2026-12-10")["period"]["paid"] == 0
