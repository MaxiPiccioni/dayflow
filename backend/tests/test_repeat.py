from datetime import date, timedelta

import pytest

START = "2026-11-02"  # lunes
HORIZON_END = date(2026, 11, 2) + timedelta(days=90)
ENDPOINTS = [("/api/tasks", "due_date", "title"), ("/api/events", "event_date", "title")]


@pytest.fixture()
def user(make_user):
    return make_user("ana@example.com")


def create(client, user, path, date_field, repeat_days, **extra):
    payload = {"title": "Clase", date_field: START, "time": "18:30", **extra}
    if repeat_days is not None:
        payload["repeat_days"] = repeat_days
    response = client.post(path, json=payload, headers=user)
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.parametrize(("path", "date_field", "title_field"), ENDPOINTS, ids=["tasks", "events"])
@pytest.mark.parametrize("repeat_days", [None, []], ids=["none", "empty"])
def test_without_repeat_creates_single_occurrence(client, user, path, date_field, title_field, repeat_days):
    created = create(client, user, path, date_field, repeat_days)
    assert [item[date_field] for item in created] == [START]


@pytest.mark.parametrize(("path", "date_field", "title_field"), ENDPOINTS, ids=["tasks", "events"])
@pytest.mark.parametrize(
    ("repeat_days", "weekdays", "count"),
    [
        (["mon"], {0}, 13),  # el día de inicio cuenta: 2/11 + 12 semanas
        (["mon", "wed", "fri"], {0, 2, 4}, 39),
        (["sun"], {6}, 13),
        (["mon", "tue", "wed", "thu", "fri", "sat", "sun"], set(range(7)), 91),  # horizonte de 90 días inclusive
    ],
    ids=["mon", "mon-wed-fri", "sun", "every-day"],
)
def test_repeat_creates_occurrences_on_selected_weekdays_within_90_days(client, user, path, date_field, title_field, repeat_days, weekdays, count):
    created = create(client, user, path, date_field, repeat_days)
    dates = [date.fromisoformat(item[date_field]) for item in created]
    assert len(dates) == count
    assert dates == sorted(dates) and len(set(dates)) == count
    assert all(day.weekday() in weekdays for day in dates)
    assert dates[0] >= date(2026, 11, 2) and dates[-1] <= HORIZON_END
    assert all(item[title_field] == "Clase" and item["time"] == "18:30" for item in created)


@pytest.mark.parametrize(("path", "date_field", "title_field"), ENDPOINTS, ids=["tasks", "events"])
def test_start_date_is_skipped_when_its_weekday_is_not_selected(client, user, path, date_field, title_field):
    created = create(client, user, path, date_field, ["tue"])
    assert created[0][date_field] == "2026-11-03"
    assert START not in [item[date_field] for item in created]


@pytest.mark.parametrize(("path", "date_field", "title_field"), ENDPOINTS, ids=["tasks", "events"])
def test_invalid_weekday_is_rejected(client, user, path, date_field, title_field):
    response = client.post(path, json={"title": "Clase", date_field: START, "repeat_days": ["lun"]}, headers=user)
    assert response.status_code == 422


def test_each_task_occurrence_is_independent(client, user):
    created = create(client, user, "/api/tasks", "due_date", ["mon"], category="Foco", priority="Alta")
    assert all(item["category"] == "Foco" and item["priority"] == "Alta" and not item["completed"] for item in created)
    client.patch(f"/api/tasks/{created[0]['id']}/complete", headers=user)
    client.delete(f"/api/tasks/{created[1]['id']}", headers=user)
    tasks = client.get(f"/api/dashboard?client_today={START}", headers=user).json()["tasks"]
    assert len(tasks) == 12
    assert [task["completed"] for task in tasks if task["id"] == created[0]["id"]] == [True]


def test_task_crud_basics(client, user):
    [task] = create(client, user, "/api/tasks", "due_date", None)
    updated = client.patch(f"/api/tasks/{task['id']}", json={"title": "Otra", "notes": "nota"}, headers=user).json()
    assert (updated["title"], updated["notes"], updated["time"]) == ("Otra", "nota", "18:30")
    assert client.patch(f"/api/tasks/{task['id']}/complete", headers=user).json()["completed"] is True
    assert client.patch(f"/api/tasks/{task['id']}/complete", headers=user).json()["completed"] is False
    assert client.patch(f"/api/tasks/{task['id']}", json={"priority": "Urgente"}, headers=user).status_code == 422


def test_event_crud_basics(client, user):
    [event] = create(client, user, "/api/events", "event_date", None, important=True)
    assert event["important"] is True and event["done"] is False
    assert client.patch(f"/api/events/{event['id']}/toggle", headers=user).json()["done"] is True
    updated = client.patch(f"/api/events/{event['id']}", json={"title": "Reunión", "color": "#fff"}, headers=user).json()
    assert (updated["title"], updated["color"]) == ("Reunión", "#fff")
    assert client.delete(f"/api/events/{event['id']}", headers=user).status_code == 204
    assert client.get("/api/events", headers=user).json() == []
