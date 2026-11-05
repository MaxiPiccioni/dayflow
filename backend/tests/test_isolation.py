"""Aislamiento entre usuarios: B nunca lee ni modifica datos de A."""

import pytest

from tests.helpers import (
    TODAY,
    add_hour_payment,
    add_movement,
    close_period,
    create_category,
    create_event,
    create_habit,
    create_saving,
    create_shopping_item,
    create_task,
    create_transaction,
    hours_state,
    put_hour_entry,
    set_habit_log,
)

MARK = "DE-A"


@pytest.fixture()
def users(make_user):
    return make_user("a@example.com"), make_user("b@example.com")


def _setup_task(client, db, a):
    return {"id": create_task(client, a, title=MARK)["id"]}


def _setup_category(client, db, a):
    return {"id": create_category(client, a, MARK)["id"]}


def _setup_habit(client, db, a):
    habit = create_habit(client, db, a, name=MARK)
    assert set_habit_log(client, a, habit["id"], TODAY, 1).status_code == 200
    return {"id": habit["id"]}


def _setup_shopping(client, db, a):
    return {"id": create_shopping_item(client, a, name=MARK)["id"]}


def _setup_transaction(client, db, a):
    return {"id": create_transaction(client, a, description=MARK)["id"]}


def _setup_saving(client, db, a):
    saving = create_saving(client, db, a, name=MARK)
    assert add_movement(client, a, saving["id"], 50).status_code == 201
    movement_id = client.get(f"/api/savings/{saving['id']}/movements", headers=a).json()[0]["id"]
    return {"id": saving["id"], "movement_id": movement_id}


def _setup_event(client, db, a):
    return {"id": create_event(client, a, title=MARK)["id"]}


def _setup_hour_entry(client, db, a):
    return {"id": put_hour_entry(client, a, TODAY)["id"]}


def _setup_hour_payment(client, db, a):
    state = add_hour_payment(client, a, 500)
    return {"id": state["payments"][0]["id"]}


def _setup_closed_period(client, db, a):
    period_id = hours_state(client, a)["period"]["id"]
    assert close_period(client, a).status_code == 200
    return {"id": period_id}


def _setup_subject(client, db, a):
    response = client.post("/api/faculty/subjects", json={"name": MARK, "level": 1, "status": "aprobada", "grade": 8}, headers=a)
    assert response.status_code == 201, response.text
    subject = response.json()
    folder_ids = [folder["id"] for folder in subject["folders"]]
    return {"id": subject["id"], "folder_id": folder_ids[0], "folder_ids": folder_ids, "reversed_folder_ids": list(reversed(folder_ids))}


def _subject_exists(client, a, ctx):
    subjects = client.get("/api/faculty/subjects", headers=a).json()
    return [(s["id"], s["name"], s["status"], s["grade"], [f["id"] for f in s["folders"]]) for s in subjects] == [(ctx["id"], MARK, "aprobada", 8, ctx["folder_ids"])]


def _task_exists(client, a, ctx):
    return any(task["id"] == ctx["id"] and task["title"] == MARK and not task["completed"] for task in client.get(f"/api/dashboard?client_today={TODAY}", headers=a).json()["tasks"])


def _category_exists(client, a, ctx):
    return any(category["id"] == ctx["id"] and category["name"] == MARK for category in client.get("/api/categories", headers=a).json())


def _habit_exists(client, a, ctx):
    habits = client.get(f"/api/dashboard?client_today={TODAY}", headers=a).json()["habits"]
    return any(habit["id"] == ctx["id"] and habit["name"] == MARK and habit["count"] == 1 for habit in habits)


def _shopping_exists(client, a, ctx):
    return any(item["id"] == ctx["id"] and item["name"] == MARK for item in client.get("/api/shopping-items", headers=a).json())


def _transaction_exists(client, a, ctx):
    return any(item["id"] == ctx["id"] for item in client.get(f"/api/dashboard?client_today={TODAY}", headers=a).json()["transactions"])


def _saving_exists(client, a, ctx):
    movements = client.get(f"/api/savings/{ctx['id']}/movements", headers=a).json()
    return [movement["id"] for movement in movements] == [ctx["movement_id"]]


def _event_exists(client, a, ctx):
    return any(event["id"] == ctx["id"] and event["title"] == MARK and not event["done"] for event in client.get("/api/events", headers=a).json())


def _hour_entry_exists(client, a, ctx):
    return [entry["id"] for entry in hours_state(client, a)["entries"]] == [ctx["id"]]


def _hour_payment_exists(client, a, ctx):
    return [payment["id"] for payment in hours_state(client, a)["payments"]] == [ctx["id"]]


def _closed_period_exists(client, a, ctx):
    return [period["id"] for period in hours_state(client, a)["closed_periods"]] == [ctx["id"]]


# (nombre, preparar datos de A, pedidos de B que deben dar 404, verificar que lo de A sigue intacto)
RESOURCES = [
    ("tasks", _setup_task, [("PATCH", "/api/tasks/{id}/complete", None), ("PATCH", "/api/tasks/{id}", {"title": "hackeada"}), ("DELETE", "/api/tasks/{id}", None)], _task_exists),
    ("categories", _setup_category, [("PATCH", "/api/categories/{id}", {"name": "hackeada"}), ("DELETE", "/api/categories/{id}", None)], _category_exists),
    ("habits", _setup_habit, [("PATCH", "/api/habits/{id}", {"name": "hackeado"}), ("DELETE", "/api/habits/{id}", None)], _habit_exists),
    ("habit logs", _setup_habit, [("GET", "/api/habits/{id}/logs", None), ("PUT", f"/api/habits/{{id}}/logs/{TODAY}?client_today={TODAY}", {"count": 0})], _habit_exists),
    ("shopping-items", _setup_shopping, [("PATCH", "/api/shopping-items/{id}", {"name": "hackeado"}), ("DELETE", "/api/shopping-items/{id}", None)], _shopping_exists),
    ("transactions", _setup_transaction, [("DELETE", "/api/transactions/{id}", None)], _transaction_exists),
    ("savings", _setup_saving, [("PATCH", "/api/savings/{id}", {"start_amount": 0}), ("DELETE", "/api/savings/{id}", None)], _saving_exists),
    (
        "saving movements",
        _setup_saving,
        [
            ("GET", "/api/savings/{id}/movements", None),
            ("POST", "/api/savings/{id}/movements", {"amount": 10, "movement_date": TODAY}),
            ("DELETE", "/api/savings/{id}/movements/{movement_id}", None),
        ],
        _saving_exists,
    ),
    ("events", _setup_event, [("PATCH", "/api/events/{id}/toggle", None), ("PATCH", "/api/events/{id}", {"title": "hackeado"}), ("DELETE", "/api/events/{id}", None)], _event_exists),
    ("hour entries", _setup_hour_entry, [("DELETE", "/api/hours/entries/{id}", None)], _hour_entry_exists),
    ("hour payments", _setup_hour_payment, [("DELETE", "/api/hours/payments/{id}", None)], _hour_payment_exists),
    (
        "hour periods",
        _setup_closed_period,
        [
            ("POST", "/api/hours/periods/{id}/reopen", None),
            ("GET", "/api/hours/periods/{id}/payments", None),
            ("POST", "/api/hours/periods/{id}/payments", {"amount": 100, "payment_date": TODAY}),
            ("DELETE", "/api/hours/periods/{id}", None),
        ],
        _closed_period_exists,
    ),
    (
        "subjects",
        _setup_subject,
        [
            ("PATCH", "/api/faculty/subjects/{id}", {"name": "hackeada", "status": "libre"}),
            ("POST", "/api/faculty/subjects/{id}/folders", {"name": "hackeada"}),
            ("PUT", "/api/faculty/subjects/{id}/folders/order", {"ids": "{reversed_folder_ids}"}),
            ("DELETE", "/api/faculty/subjects/{id}", None),
        ],
        _subject_exists,
    ),
    (
        "subject folders",
        _setup_subject,
        [("PATCH", "/api/faculty/folders/{folder_id}", {"name": "hackeada"}), ("DELETE", "/api/faculty/folders/{folder_id}", None)],
        _subject_exists,
    ),
]


@pytest.mark.parametrize(("name", "setup", "attempts", "still_there"), RESOURCES, ids=[resource[0] for resource in RESOURCES])
def test_other_user_gets_404_on_foreign_resource(client, db, users, name, setup, attempts, still_there):
    a, b = users
    ctx = setup(client, db, a)
    for method, path, body in attempts:
        # Un valor "{clave}" en el cuerpo se reemplaza por ctx[clave] (por ejemplo, los ids de las carpetas de A).
        if body:
            body = {key: ctx[value[1:-1]] if isinstance(value, str) and value[1:-1] in ctx else value for key, value in body.items()}
        response = client.request(method, path.format(**ctx), json=body, headers=b)
        assert response.status_code == 404, f"{method} {path} -> {response.status_code}"
    assert still_there(client, a, ctx)


def test_movement_of_other_user_cannot_be_deleted_through_own_saving(client, db, users):
    a, b = users
    ctx_a = _setup_saving(client, db, a)
    own_saving = create_saving(client, db, b, name="De B")
    response = client.delete(f"/api/savings/{own_saving['id']}/movements/{ctx_a['movement_id']}", headers=b)
    assert response.status_code == 404
    assert _saving_exists(client, a, ctx_a)


def test_other_user_cannot_reorder_foreign_subjects(client, db, users):
    a, b = users
    first = _setup_subject(client, db, a)
    second = client.post("/api/faculty/subjects", json={"name": "Otra de A", "level": 1}, headers=a).json()
    # El orden de materias no lleva id en la ruta: los ids de A no son materias de B, así que da 400.
    response = client.put("/api/faculty/subjects/order", json={"level": 1, "ids": [second["id"], first["id"]]}, headers=b)
    assert response.status_code == 400
    subjects_a = client.get("/api/faculty/subjects", headers=a).json()
    assert [(s["id"], s["position"]) for s in subjects_a] == [(first["id"], 0), (second["id"], 1)]


def test_own_folder_order_cannot_include_foreign_folders(client, db, users):
    a, b = users
    ctx_a = _setup_subject(client, db, a)
    own = client.post("/api/faculty/subjects", json={"name": "De B", "level": 1}, headers=b).json()
    own_ids = [folder["id"] for folder in own["folders"]]
    response = client.put(f"/api/faculty/subjects/{own['id']}/folders/order", json={"ids": [*own_ids, ctx_a["folder_id"]]}, headers=b)
    assert response.status_code == 400
    assert _subject_exists(client, a, ctx_a)


def test_pomodoro_settings_and_logs_are_per_user(client, users):
    a, b = users
    assert client.patch("/api/pomodoro", json={"work": 50, "repetitions": 4, "break_time": 10}, headers=a).status_code == 200
    assert client.post("/api/pomodoro/log", json={"seconds": 600}, headers=a).status_code == 200
    assert client.get("/api/pomodoro", headers=b).json() == {"repetitions": 0, "work": 0, "break_time": 0}
    assert all(day["seconds"] == 0 for day in client.get("/api/pomodoro/history", headers=b).json())
    # B cambia su configuración y la de A queda igual.
    client.patch("/api/pomodoro", json={"work": 5}, headers=b)
    assert client.get("/api/pomodoro", headers=a).json()["work"] == 50


def test_hour_entry_upsert_on_same_date_does_not_touch_other_user(client, users):
    a, b = users
    entry_a = put_hour_entry(client, a, TODAY, from_time="08:00", to_time="12:00")
    put_hour_entry(client, b, TODAY, from_time="10:00", to_time="11:00")
    entries_a = hours_state(client, a)["entries"]
    assert [(entry["id"], entry["from_time"], entry["to_time"]) for entry in entries_a] == [(entry_a["id"], "08:00", "12:00")]


def test_rate_and_close_of_other_user_period_are_independent(client, users):
    a, b = users
    client.patch("/api/hours/period", json={"rate": 1000, "reference_date": TODAY}, headers=a)
    client.patch("/api/hours/period", json={"rate": 5, "reference_date": TODAY}, headers=b)
    assert close_period(client, b).status_code == 200
    state_a = hours_state(client, a)
    assert state_a["period"]["rate"] == 1000
    assert state_a["period"]["closed"] is False
    assert state_a["closed_periods"] == []


def test_lists_of_other_user_do_not_include_foreign_data(client, db, users):
    a, b = users
    for setup in (_setup_task, _setup_category, _setup_habit, _setup_shopping, _setup_transaction, _setup_saving, _setup_event, _setup_hour_entry, _setup_hour_payment, _setup_subject):
        setup(client, db, a)
    create_category(client, a, MARK, scope="finance", kind="expense")
    create_category(client, a, MARK, scope="shopping")
    assert close_period(client, a, "2026-11-04").status_code == 200

    dashboard = client.get(f"/api/dashboard?client_today={TODAY}", headers=b).json()
    assert dashboard == {"tasks": [], "habits": [], "transactions": [], "savings": []}
    assert client.get("/api/events", headers=b).json() == []
    assert client.get("/api/shopping-items", headers=b).json() == []
    for query in ("", "?scope=finance&kind=expense", "?scope=finance&kind=income", "?scope=shopping"):
        names = [category["name"] for category in client.get(f"/api/categories{query}", headers=b).json()]
        assert MARK not in names, query
    overview = client.get(f"/api/habits/overview?client_today={TODAY}", headers=b).json()
    assert all(day["total"] == 0 and day["completed"] == 0 for day in overview)
    hours_b = hours_state(client, b)
    assert hours_b["entries"] == [] and hours_b["payments"] == [] and hours_b["closed_periods"] == []
    assert hours_b["period"]["rate"] == 0
    assert client.get("/api/faculty/subjects", headers=b).json() == []


def test_same_name_categories_of_other_user_do_not_propagate(client, users):
    a, b = users
    name = "Compartida"
    task = create_task(client, a, category=name)
    event = create_event(client, a, type=name)
    transaction = create_transaction(client, a, category=name, kind="expense")
    item = create_shopping_item(client, a, category=name)

    categories_b = [
        create_category(client, b, name),
        create_category(client, b, name, scope="finance", kind="expense"),
        create_category(client, b, name, scope="shopping"),
    ]
    for category in categories_b:
        assert client.patch(f"/api/categories/{category['id']}", json={"name": "Renombrada"}, headers=b).status_code == 200
    for category in categories_b:
        assert client.delete(f"/api/categories/{category['id']}", headers=b).status_code == 204

    dashboard = client.get(f"/api/dashboard?client_today={TODAY}", headers=a).json()
    assert [t["category"] for t in dashboard["tasks"] if t["id"] == task["id"]] == [name]
    assert [t["category"] for t in dashboard["transactions"] if t["id"] == transaction["id"]] == [name]
    assert [e["type"] for e in client.get("/api/events", headers=a).json() if e["id"] == event["id"]] == [name]
    assert [i["category"] for i in client.get("/api/shopping-items", headers=a).json() if i["id"] == item["id"]] == [name]
