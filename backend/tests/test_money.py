from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.main import _entry_duration, _entry_value
from app.models import HourEntry
from app.schemas import HourEntryCreate, SavingEntryCreate, TransactionCreate
from tests.helpers import TODAY, add_hour_payment, add_movement, close_period, create_saving, hours_state, put_hour_entry


@pytest.fixture()
def user(make_user):
    return make_user("ana@example.com")


# --- Schemas: redondeo a 2 decimales, mitad hacia arriba ---


@pytest.mark.parametrize(
    "raw, expected",
    [(10, "10.00"), (10.005, "10.01"), (10.004, "10.00"), ("10.995", "11.00"), (0.1 + 0.2, "0.30"), (1234567.891, "1234567.89"), ("  7.5 ", "7.50")],
)
def test_amounts_are_rounded_to_cents(raw, expected):
    assert TransactionCreate(description="x", amount=raw, kind="income").amount == Decimal(expected)


@pytest.mark.parametrize("raw", ["abc", "", "1e999999", "NaN", "Infinity", True, 10**12])
def test_invalid_amounts_are_rejected(raw):
    with pytest.raises(ValidationError):
        TransactionCreate(description="x", amount=raw, kind="income")


def test_hours_and_start_amount_use_cents_too():
    assert HourEntryCreate(entry_date=TODAY, hours=7.335).hours == Decimal("7.34")
    assert SavingEntryCreate(name="A", start_amount="0.1").start_amount == Decimal("0.10")
    assert SavingEntryCreate(name="A").start_amount == Decimal("0.00")


# --- La API sigue hablando en números ---


def test_api_returns_json_numbers_not_strings(client, user):
    response = client.post("/api/transactions", json={"description": "Café", "amount": 1234.5, "kind": "expense", "category": None}, headers=user)
    assert response.status_code == 201
    amount = response.json()["amount"]
    assert isinstance(amount, (int, float)) and not isinstance(amount, bool)
    assert amount == 1234.5
    assert client.get("/api/dashboard?client_today=" + TODAY, headers=user).json()["transactions"][0]["amount"] == 1234.5


def test_api_rounds_input_and_rejects_text(client, user):
    ok = client.post("/api/transactions", json={"description": "Pan", "amount": 10.005, "kind": "expense", "category": None}, headers=user)
    assert ok.json()["amount"] == 10.01
    bad = client.post("/api/transactions", json={"description": "Pan", "amount": "mucho", "kind": "expense", "category": None}, headers=user)
    assert bad.status_code == 422


# --- Sumas sin error binario ---


def test_savings_sum_has_no_binary_error(client, db, user):
    saving = create_saving(client, db, user, start_amount=0.1)
    out = add_movement(client, user, saving["id"], 0.2).json()
    assert out["current_amount"] == 0.3
    assert out["gain"] == 0.2
    for _ in range(9):
        out = add_movement(client, user, saving["id"], 0.1).json()
    assert out["current_amount"] == 1.2
    assert out["gain"] == 1.1


def test_dashboard_savings_use_exact_sums(client, db, user):
    saving = create_saving(client, db, user, start_amount=0.1)
    add_movement(client, user, saving["id"], 0.2)
    [out] = client.get(f"/api/dashboard?client_today={TODAY}", headers=user).json()["savings"]
    assert out["current_amount"] == 0.3


def test_hour_value_is_rounded_per_entry_and_summed_in_cents():
    entry = HourEntry(from_time="09:00", to_time="09:20", hours=None, extra=False, holiday=False)
    assert _entry_duration(entry) == Decimal(20) / 60
    assert _entry_value(entry, Decimal("100.00")) == Decimal("33.33")
    doubled = HourEntry(from_time="09:00", to_time="09:20", hours=None, extra=True, holiday=False)
    assert _entry_value(doubled, Decimal("100.00")) == Decimal("66.67")
    assert _entry_value(HourEntry(from_time="09:00", to_time="17:00", hours=Decimal("7.50"), extra=False, holiday=False), Decimal("33.33")) == Decimal("249.98")


def test_closed_period_freezes_exact_hours_and_expected(client, user):
    client.patch("/api/hours/period", json={"rate": 33.33, "reference_date": TODAY}, headers=user)
    for day in ("2026-11-02", "2026-11-03", "2026-11-04"):
        put_hour_entry(client, user, entry_date=day, hours=7.33)
    add_hour_payment(client, user, amount=100.1)
    assert close_period(client, user).status_code == 200
    [closed] = hours_state(client, user)["closed_periods"]
    assert closed["total_hours"] == 21.99
    assert closed["expected"] == 732.93  # 3 jornadas de 244,31 (7,33 h x 33,33 redondeado por jornada)
    assert closed["paid"] == 100.1
    assert closed["balance"] == 632.83
