import pytest

from app.models import PomodoroLog, Task


@pytest.fixture()
def user(make_user):
    return make_user("ana@example.com")


def subject(client, user, name="Física I") -> int:
    response = client.post("/api/faculty/subjects", json={"name": name, "level": 1}, headers=user)
    assert response.status_code == 201
    return response.json()["id"]


def study(client, user) -> list[dict]:
    response = client.get("/api/faculty/study", headers=user)
    assert response.status_code == 200
    return response.json()


def test_pomodoro_log_by_subject_accumulates_per_subject_and_total(client, user):
    a, b = subject(client, user), subject(client, user, "Química")
    for sid, secs in ((a, 600), (a, 300), (b, 120), (None, 60)):
        assert client.post("/api/pomodoro/log", json={"seconds": secs, "subject_id": sid}, headers=user).status_code == 200
    last = client.post("/api/pomodoro/log", json={"seconds": 30}, headers=user).json()
    assert last["seconds"] == 600 + 300 + 120 + 60 + 30
    by_id = {item["subject_id"]: item for item in study(client, user)}
    assert by_id[a]["total_seconds"] == 900 and by_id[a]["week_seconds"] == 900
    assert by_id[b]["total_seconds"] == 120
    history = client.get("/api/pomodoro/history", headers=user).json()
    assert sum(day["seconds"] for day in history) == 1110


def test_pomodoro_log_rejects_foreign_subject(client, user, make_user):
    other = make_user("otro@example.com")
    foreign = subject(client, other)
    assert client.post("/api/pomodoro/log", json={"seconds": 60, "subject_id": foreign}, headers=user).status_code == 404
    assert client.post("/api/pomodoro/log", json={"seconds": 60, "subject_id": 9999}, headers=user).status_code == 404


def test_task_with_subject_counts_pending_and_clears_on_complete(client, user):
    sid = subject(client, user)
    created = client.post("/api/tasks", json={"title": "TP 1", "subject_id": sid}, headers=user)
    assert created.status_code == 201 and created.json()[0]["subject_id"] == sid
    task_id = created.json()[0]["id"]
    assert study(client, user) == [{"subject_id": sid, "total_seconds": 0, "week_seconds": 0, "pending_tasks": 1}]
    client.patch(f"/api/tasks/{task_id}/complete", headers=user)
    assert study(client, user) == []


def test_task_subject_can_be_changed_and_cleared_and_must_be_owned(client, user, make_user):
    a, b = subject(client, user), subject(client, user, "Química")
    task_id = client.post("/api/tasks", json={"title": "TP", "subject_id": a}, headers=user).json()[0]["id"]
    assert client.patch(f"/api/tasks/{task_id}", json={"subject_id": b}, headers=user).json()["subject_id"] == b
    assert client.patch(f"/api/tasks/{task_id}", json={"title": "TP 2"}, headers=user).json()["subject_id"] == b
    assert client.patch(f"/api/tasks/{task_id}", json={"subject_id": None}, headers=user).json()["subject_id"] is None
    foreign = subject(client, make_user("otro@example.com"))
    assert client.patch(f"/api/tasks/{task_id}", json={"subject_id": foreign}, headers=user).status_code == 404
    assert client.post("/api/tasks", json={"title": "x", "subject_id": foreign}, headers=user).status_code == 404


def test_deleting_subject_keeps_tasks_and_time_without_subject(client, db, user):
    sid = subject(client, user)
    client.post("/api/tasks", json={"title": "TP", "subject_id": sid}, headers=user)
    client.post("/api/pomodoro/log", json={"seconds": 600, "subject_id": sid}, headers=user)
    assert client.delete(f"/api/faculty/subjects/{sid}", headers=user).status_code == 204
    assert db.query(Task).one().subject_id is None
    assert db.query(PomodoroLog).one().subject_id is None
    assert study(client, user) == []


def test_study_is_isolated_between_users(client, user, make_user):
    other = make_user("otro@example.com")
    client.post("/api/pomodoro/log", json={"seconds": 600, "subject_id": subject(client, other)}, headers=other)
    assert study(client, user) == []
