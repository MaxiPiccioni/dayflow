from datetime import datetime

import pytest

from tests.helpers import TODAY, create_habit, set_habit_log


@pytest.fixture()
def user(make_user):
    return make_user("ana@example.com")


def dashboard_habit(client, user, habit_id, today=TODAY) -> dict:
    habits = client.get(f"/api/dashboard?client_today={today}", headers=user).json()["habits"]
    return next(habit for habit in habits if habit["id"] == habit_id)


def test_progress_is_today_count_over_target(client, db, user):
    habit = create_habit(client, db, user, target=4)
    response = set_habit_log(client, user, habit["id"], TODAY, 2)
    assert response.status_code == 200
    assert (response.json()["count"], response.json()["progress"], response.json()["streak"]) == (2, 50, 0)


def test_count_is_capped_at_target(client, db, user):
    habit = create_habit(client, db, user, target=3)
    assert set_habit_log(client, user, habit["id"], TODAY, 10).json()["count"] == 3
    assert set_habit_log(client, user, habit["id"], TODAY, -1).status_code == 422


def test_log_upsert_overwrites_same_day(client, db, user):
    habit = create_habit(client, db, user, target=5)
    set_habit_log(client, user, habit["id"], TODAY, 2)
    set_habit_log(client, user, habit["id"], TODAY, 4)
    logs = client.get(f"/api/habits/{habit['id']}/logs", headers=user).json()
    assert logs == [{"log_date": TODAY, "count": 4}]


def test_logs_are_listed_by_date(client, db, user):
    habit = create_habit(client, db, user)
    for day in ("2026-11-03", "2026-11-01", "2026-11-02"):
        set_habit_log(client, user, habit["id"], day, 1)
    logs = client.get(f"/api/habits/{habit['id']}/logs", headers=user).json()
    assert [log["log_date"] for log in logs] == ["2026-11-01", "2026-11-02", "2026-11-03"]


def test_streak_counts_consecutive_completed_days_up_to_today(client, db, user):
    habit = create_habit(client, db, user, target=2)
    for day in ("2026-11-02", "2026-11-03", "2026-11-04"):
        set_habit_log(client, user, habit["id"], day, 2)
    assert dashboard_habit(client, user, habit["id"])["streak"] == 3


@pytest.mark.parametrize(
    ("logs", "expected"),
    [
        ({"2026-11-01": 2, "2026-11-03": 2, "2026-11-04": 2}, 2),  # día salteado corta la racha
        ({"2026-11-02": 2, "2026-11-03": 1, "2026-11-04": 2}, 1),  # día incompleto corta la racha
        ({"2026-11-02": 2, "2026-11-03": 2}, 0),  # si hoy no está completo la racha es 0
        ({"2026-11-02": 2, "2026-11-03": 2, "2026-11-04": 1}, 0),
    ],
    ids=["gap", "partial-day", "today-missing", "today-partial"],
)
def test_streak_with_cut_days(client, db, user, logs, expected):
    habit = create_habit(client, db, user, target=2)
    for day, count in logs.items():
        set_habit_log(client, user, habit["id"], day, count)
    assert dashboard_habit(client, user, habit["id"])["streak"] == expected


def test_future_day_is_rejected(client, db, user):
    habit = create_habit(client, db, user)
    response = set_habit_log(client, user, habit["id"], "2026-11-05", 1)
    assert response.status_code == 400
    assert response.json()["detail"] == "No se pueden registrar días futuros"


def test_day_before_creation_is_rejected_and_creation_day_is_allowed(client, db, user):
    habit = create_habit(client, db, user, created_at=datetime(2026, 10, 10, 23, 30))
    response = set_habit_log(client, user, habit["id"], "2026-10-09", 1)
    assert response.status_code == 400
    assert response.json()["detail"] == "No se pueden registrar días previos a la creación del hábito"
    assert set_habit_log(client, user, habit["id"], "2026-10-10", 1).status_code == 200


def test_update_habit_fields(client, db, user):
    habit = create_habit(client, db, user)
    response = client.patch(f"/api/habits/{habit['id']}?client_today={TODAY}", json={"name": "Correr", "target": 3, "unit": "km"}, headers=user)
    assert response.status_code == 200
    assert {key: response.json()[key] for key in ("name", "target", "unit")} == {"name": "Correr", "target": 3, "unit": "km"}


def test_lowering_target_clips_on_read_and_keeps_stored_count(client, db, user):
    habit = create_habit(client, db, user, target=5)
    set_habit_log(client, user, habit["id"], "2026-11-03", 5)
    set_habit_log(client, user, habit["id"], TODAY, 5)

    lowered = client.patch(f"/api/habits/{habit['id']}?client_today={TODAY}", json={"target": 2}, headers=user).json()
    assert (lowered["count"], lowered["progress"], lowered["streak"]) == (2, 100, 2)
    assert [log["count"] for log in client.get(f"/api/habits/{habit['id']}/logs", headers=user).json()] == [2, 2]
    overview = client.get(f"/api/habits/overview?days=2&client_today={TODAY}", headers=user).json()
    assert [(day["completed"], day["total"]) for day in overview] == [(1, 1), (1, 1)]

    # El dato guardado no se tocó: al subir el target vuelve a verse 5.
    raised = client.patch(f"/api/habits/{habit['id']}?client_today={TODAY}", json={"target": 10}, headers=user).json()
    assert (raised["count"], raised["progress"], raised["streak"]) == (5, 50, 0)
    assert [log["count"] for log in client.get(f"/api/habits/{habit['id']}/logs", headers=user).json()] == [5, 5]


def test_delete_habit_removes_it_and_its_logs(client, db, user):
    habit = create_habit(client, db, user)
    set_habit_log(client, user, habit["id"], TODAY, 1)
    assert client.delete(f"/api/habits/{habit['id']}", headers=user).status_code == 204
    assert client.get(f"/api/habits/{habit['id']}/logs", headers=user).status_code == 404
    assert client.get(f"/api/dashboard?client_today={TODAY}", headers=user).json()["habits"] == []


def test_overview_counts_only_habits_active_each_day(client, db, user):
    first = create_habit(client, db, user, name="Leer", created_at=datetime(2026, 10, 1, 9, 0))
    second = create_habit(client, db, user, name="Correr", target=2, created_at=datetime(2026, 10, 10, 9, 0))
    set_habit_log(client, user, first["id"], "2026-10-05", 1, today="2026-10-14")
    set_habit_log(client, user, first["id"], "2026-10-12", 1, today="2026-10-14")
    set_habit_log(client, user, second["id"], "2026-10-12", 2, today="2026-10-14")
    set_habit_log(client, user, second["id"], "2026-10-13", 1, today="2026-10-14")

    overview = client.get("/api/habits/overview?days=14&client_today=2026-10-14", headers=user).json()
    assert len(overview) == 14
    by_day = {day["log_date"]: (day["completed"], day["total"]) for day in overview}
    assert list(by_day)[0] == "2026-10-01" and list(by_day)[-1] == "2026-10-14"
    assert by_day["2026-10-05"] == (1, 1)
    assert by_day["2026-10-09"] == (0, 1)
    assert by_day["2026-10-10"] == (0, 2)
    assert by_day["2026-10-12"] == (2, 2)
    assert by_day["2026-10-13"] == (0, 2)  # 1 de 2 no cuenta como completo


def test_overview_default_is_14_days(client, user):
    overview = client.get(f"/api/habits/overview?client_today={TODAY}", headers=user).json()
    assert [day["log_date"] for day in overview][::13] == ["2026-10-22", TODAY]
