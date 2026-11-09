import pytest


@pytest.fixture()
def user(make_user):
    return make_user("ana@example.com")


def first_error(response) -> dict:
    assert response.status_code == 422
    return response.json()["detail"][0]


def test_empty_title_is_reported_in_spanish(client, user):
    error = first_error(client.post("/api/tasks", json={"title": ""}, headers=user))
    assert error["msg"] == "«título» no puede estar vacío."


def test_missing_field_and_wrong_type_in_spanish(client, user):
    assert first_error(client.post("/api/tasks", json={}, headers=user))["msg"] == "Falta completar «título»."
    assert first_error(client.post("/api/pomodoro/log", json={"seconds": "mucho"}, headers=user))["msg"] == "«segundos» tiene que ser un número."


def test_limits_and_dates_in_spanish(client, user):
    assert first_error(client.post("/api/pomodoro/log", json={"seconds": 0}, headers=user))["msg"] == "«segundos» tiene que ser mayor o igual a 1."
    assert first_error(client.post("/api/tasks", json={"title": "x", "due_date": "ayer"}, headers=user))["msg"] == "«fecha» tiene que ser una fecha válida (AAAA-MM-DD)."


def test_custom_spanish_messages_are_kept(client, user):
    created = client.post("/api/faculty/subjects", json={"name": "Física", "level": 1}, headers=user).json()
    error = first_error(client.patch(f"/api/faculty/subjects/{created['id']}", json={"name": None}, headers=user))
    assert "no puede ser null" in error["msg"]


def test_response_does_not_echo_the_submitted_value(client):
    response = client.post("/api/auth/register", json={"email": "a@example.com", "full_name": "Ana Test", "password": "corta"})
    assert response.status_code == 422
    assert "corta" not in response.text
    assert all("input" not in error and "ctx" not in error for error in response.json()["detail"])
