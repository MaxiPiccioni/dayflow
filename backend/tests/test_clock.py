from datetime import date, timedelta

import pytest

from app import clock, main
from app.config import settings
from app.models import SavingEntry


def test_today_follows_the_configured_timezone(monkeypatch):
    monkeypatch.setattr(settings, "app_timezone", "Pacific/Kiritimati")  # UTC+14
    ahead = clock.today()
    monkeypatch.setattr(settings, "app_timezone", "Pacific/Pago_Pago")  # UTC-11
    behind = clock.today()
    # Entre las dos zonas hay 25 horas: siempre caen en días distintos.
    assert ahead - behind >= timedelta(days=1)


def test_default_timezone_is_argentina():
    assert settings.app_timezone == "America/Argentina/Buenos_Aires"


def test_utcnow_is_naive_utc():
    assert clock.utcnow().tzinfo is None


@pytest.fixture()
def user(make_user):
    return make_user("ana@example.com")


def test_pomodoro_and_savings_use_the_app_day_not_the_server_day(client, db, user, monkeypatch):
    # Simula "21:30 en Argentina": el servidor ya está en el día siguiente (UTC), la app todavía no.
    local_day = date(2026, 11, 6)
    monkeypatch.setattr(main, "today", lambda: local_day)
    logged = client.post("/api/pomodoro/log", json={"seconds": 600}, headers=user).json()
    assert logged["date"] == local_day.isoformat()
    history = client.get("/api/pomodoro/history", headers=user).json()
    assert next(day for day in history if day["date"] == local_day.isoformat())["seconds"] == 600
    assert client.post("/api/savings", json={"name": "Viaje", "start_amount": 0}, headers=user).status_code == 201
    assert db.query(SavingEntry).one().month == "2026-11"
