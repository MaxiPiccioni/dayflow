"""Migraciones de Alembic probadas sobre SQLite descartable, con datos de ejemplo.

Cada prueba corre `python -m alembic` en un proceso aparte con su propia base, así no se toca la de los tests.
"""

import os
import sqlite3
import subprocess
import sys
import tempfile
from contextlib import closing
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[1]


@pytest.fixture()
def db_path():
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        yield os.path.join(folder, "migration.db")


def alembic(db_path: str, *args: str) -> subprocess.CompletedProcess:
    env = {**os.environ, "DATABASE_URL": f"sqlite:///{db_path}", "ENVIRONMENT": "development", "JWT_SECRET": "test-secret-" + "x" * 40}
    return subprocess.run([sys.executable, "-m", "alembic", *args], cwd=BACKEND, env=env, capture_output=True, text=True, timeout=300)


def run_ok(db_path: str, *args: str) -> None:
    result = alembic(db_path, *args)
    assert result.returncode == 0, result.stdout + result.stderr


def connect(db_path: str):
    """Conexión que se cierra de verdad al salir (en Windows un archivo abierto no se puede borrar) y confirma los cambios."""
    return closing(sqlite3.connect(db_path))


def sql(db_path: str, query: str, params: tuple = ()):
    with connect(db_path) as conn:
        return conn.execute(query, params).fetchall()


def execute(db_path: str, *statements: tuple) -> None:
    with connect(db_path) as conn:
        for query, params in statements:
            conn.execute(query, params)
        conn.commit()


def add_user(db_path: str, email: str = "ana@example.com") -> int:
    execute(db_path, ("INSERT INTO users (email, full_name, password_hash, created_at) VALUES (?, 'Ana', 'x', '2026-11-01 10:00:00')", (email,)))
    return sql(db_path, "SELECT id FROM users WHERE email = ?", (email,))[0][0]


# --- 3-C: dinero en Numeric ---

BEFORE_MONEY = "a1b2c3d4e5f6"
MONEY_REVISION = "b3c4d5e6f7a8"


def test_money_migration_rounds_data_and_roundtrips(db_path):
    run_ok(db_path, "upgrade", BEFORE_MONEY)
    user = add_user(db_path)
    execute(
        db_path,
        ("INSERT INTO transactions (user_id, description, amount, kind, method, created_at) VALUES (?, 'a', 10.005, 'income', 'Efectivo', '2026-11-01 10:00:00')", (user,)),
        ("INSERT INTO transactions (user_id, description, amount, kind, method, created_at) VALUES (?, 'b', 0.30000000000000004, 'expense', 'Efectivo', '2026-11-01 10:00:00')", (user,)),
        ("INSERT INTO saving_entries (user_id, name, start_amount, month) VALUES (?, 'Viaje', 1234.5, '2026-11')", (user,)),
        ("INSERT INTO pay_periods (user_id, start, end, rate, closed, total_hours, expected, paid, balance) VALUES (?, '2026-11-01', '2026-11-30', 33.333, 0, 21.999, 732.9261, 0, 0)", (user,)),
        ("INSERT INTO hour_entries (user_id, entry_date, from_time, to_time, hours, extra, holiday) VALUES (?, '2026-11-02', '09:00', '17:00', NULL, 0, 0)", (user,)),
        ("INSERT INTO hour_entries (user_id, entry_date, from_time, to_time, hours, extra, holiday) VALUES (?, '2026-11-03', '09:00', '17:00', 7.336, 0, 0)", (user,)),
    )

    run_ok(db_path, "upgrade", MONEY_REVISION)
    assert sql(db_path, "SELECT description, amount FROM transactions ORDER BY id") == [("a", 10.01), ("b", 0.3)]
    assert sql(db_path, "SELECT start_amount FROM saving_entries") == [(1234.5,)]
    assert sql(db_path, "SELECT rate, total_hours, expected FROM pay_periods") == [(33.33, 22.0, 732.93)]
    assert sql(db_path, "SELECT hours FROM hour_entries ORDER BY id") == [(None,), (7.34,)]

    run_ok(db_path, "downgrade", BEFORE_MONEY)
    assert sql(db_path, "SELECT amount FROM transactions ORDER BY id") == [(10.01,), (0.3,)]
    run_ok(db_path, "upgrade", MONEY_REVISION)
    assert sql(db_path, "SELECT amount FROM transactions ORDER BY id") == [(10.01,), (0.3,)]


def test_money_migration_stops_on_values_out_of_range(db_path):
    run_ok(db_path, "upgrade", BEFORE_MONEY)
    user = add_user(db_path)
    execute(db_path, ("INSERT INTO transactions (user_id, description, amount, kind, method, created_at) VALUES (?, 'x', 1e12, 'income', 'Efectivo', '2026-11-01 10:00:00')", (user,)))
    result = alembic(db_path, "upgrade", MONEY_REVISION)
    assert result.returncode != 0
    assert "transactions.amount" in result.stdout + result.stderr
    assert sql(db_path, "SELECT amount FROM transactions") == [(1e12,)]  # no se tocó nada


def test_full_chain_upgrades_and_downgrades_on_empty_database(db_path):
    run_ok(db_path, "upgrade", "head")
    run_ok(db_path, "downgrade", "base")
    run_ok(db_path, "upgrade", "head")


# --- 3-D: índices únicos y series de ahorros ---

UNIQUE_REVISION = "c4d5e6f7a8b9"


def index_names(db_path: str) -> set[str]:
    return {name for (name,) in sql(db_path, "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'uq_%'")}


def test_unique_migration_groups_savings_in_series_and_roundtrips(db_path):
    run_ok(db_path, "upgrade", MONEY_REVISION)
    user = add_user(db_path)
    other = add_user(db_path, "beto@example.com")
    execute(
        db_path,
        ("INSERT INTO saving_entries (user_id, name, start_amount, month) VALUES (?, 'Viaje', 100, '2026-10')", (user,)),
        ("INSERT INTO saving_entries (user_id, name, start_amount, month) VALUES (?, 'Viaje', 150, '2026-11')", (user,)),
        ("INSERT INTO saving_entries (user_id, name, start_amount, month) VALUES (?, 'Auto', 10, '2026-11')", (user,)),
        ("INSERT INTO saving_entries (user_id, name, start_amount, month) VALUES (?, 'Viaje', 5, '2026-11')", (other,)),
        ("INSERT INTO categories (user_id, name, scope, kind) VALUES (?, 'Trabajo', 'agenda', NULL)", (user,)),
        ("INSERT INTO categories (user_id, name, scope, kind) VALUES (?, 'Trabajo', 'agenda', NULL)", (other,)),
        ("INSERT INTO pomodoro_logs (user_id, log_date, seconds, subject_id) VALUES (?, '2026-11-04', 60, NULL)", (user,)),
    )

    run_ok(db_path, "upgrade", UNIQUE_REVISION)
    assert len(index_names(db_path)) == 8
    series = dict(sql(db_path, "SELECT user_id || ':' || name || ':' || month, series_id FROM saving_entries"))
    assert series[f"{user}:Viaje:2026-10"] == series[f"{user}:Viaje:2026-11"]
    assert series[f"{user}:Viaje:2026-11"] != series[f"{user}:Auto:2026-11"]
    assert series[f"{user}:Viaje:2026-11"] != series[f"{other}:Viaje:2026-11"]
    assert sql(db_path, "SELECT COUNT(*) FROM saving_entries")[0][0] == 4

    run_ok(db_path, "downgrade", MONEY_REVISION)
    assert index_names(db_path) == set()
    assert "series_id" not in [row[1] for row in sql(db_path, "PRAGMA table_info(saving_entries)")]
    assert sql(db_path, "SELECT COUNT(*) FROM saving_entries")[0][0] == 4
    run_ok(db_path, "upgrade", "head")


def test_unique_migration_stops_on_duplicates_without_changing_anything(db_path):
    run_ok(db_path, "upgrade", MONEY_REVISION)
    user = add_user(db_path)
    execute(
        db_path,
        ("INSERT INTO categories (user_id, name, scope, kind) VALUES (?, 'Trabajo', 'agenda', NULL)", (user,)),
        ("INSERT INTO categories (user_id, name, scope, kind) VALUES (?, 'trabajo', 'agenda', NULL)", (user,)),
        ("INSERT INTO pomodoro_logs (user_id, log_date, seconds, subject_id) VALUES (?, '2026-11-04', 60, NULL)", (user,)),
        ("INSERT INTO pomodoro_logs (user_id, log_date, seconds, subject_id) VALUES (?, '2026-11-04', 30, NULL)", (user,)),
        ("INSERT INTO saving_entries (user_id, name, start_amount, month) VALUES (?, 'Viaje', 100, '2026-11')", (user,)),
    )
    result = alembic(db_path, "upgrade", UNIQUE_REVISION)
    output = result.stdout + result.stderr
    assert result.returncode != 0
    assert "categories" in output and "pomodoro_logs" in output and "No se cambió ningún dato" in output
    assert sql(db_path, "SELECT COUNT(*) FROM categories")[0][0] == 2
    assert sql(db_path, "SELECT COUNT(*) FROM pomodoro_logs")[0][0] == 2
    assert "series_id" not in [row[1] for row in sql(db_path, "PRAGMA table_info(saving_entries)")]
    # Se arregla a mano y la migración corre sin problemas.
    execute(db_path, ("DELETE FROM categories WHERE name = 'trabajo'", ()), ("DELETE FROM pomodoro_logs WHERE seconds = 30", ()))
    run_ok(db_path, "upgrade", UNIQUE_REVISION)
