import pytest

from app.models import Subject, SubjectFolder

GRADE_ERROR = "Solo las materias aprobadas pueden tener nota final"
DEFAULT_FOLDERS = ["FINAL", "PRÁCTICO", "TEÓRICO", "TPS"]


@pytest.fixture()
def user(make_user):
    return make_user("ana@example.com")


def create_subject(client, user, **overrides) -> dict:
    payload = {"name": "Análisis Matemático I", "level": 1, **overrides}
    response = client.post("/api/faculty/subjects", json=payload, headers=user)
    assert response.status_code == 201, response.text
    return response.json()


def list_subjects(client, user) -> list[dict]:
    response = client.get("/api/faculty/subjects", headers=user)
    assert response.status_code == 200
    return response.json()


def patch_subject(client, user, subject_id, **fields):
    return client.patch(f"/api/faculty/subjects/{subject_id}", json=fields, headers=user)


def error_message(response) -> str:
    detail = response.json()["detail"]
    return detail if isinstance(detail, str) else detail[0]["msg"]


# --- Materias ---


def test_create_subject_with_defaults_and_default_folders(client, user):
    subject = create_subject(client, user, name="  Física I  ")
    assert {key: subject[key] for key in ("name", "level", "status", "grade", "icon", "color", "position")} == {
        "name": "Física I",
        "level": 1,
        "status": "por_cursar",
        "grade": None,
        "icon": "book",
        "color": "lime",
        "position": 0,
    }
    assert [(folder["name"], folder["position"]) for folder in subject["folders"]] == list(zip(DEFAULT_FOLDERS, range(4)))
    assert subject["created_at"]


def test_list_is_ordered_by_level_and_position(client, user):
    create_subject(client, user, name="Química", level=2)
    create_subject(client, user, name="Álgebra", level=1)
    create_subject(client, user, name="Física", level=1)
    create_subject(client, user, name="Sistemas", level=1, position=0)  # posición explícita
    subjects = list_subjects(client, user)
    assert [(s["name"], s["level"], s["position"]) for s in subjects] == [("Álgebra", 1, 0), ("Sistemas", 1, 0), ("Física", 1, 1), ("Química", 2, 0)]
    assert all(s["folders"] for s in subjects)


def test_update_subject_fields(client, user):
    subject = create_subject(client, user)
    response = patch_subject(client, user, subject["id"], name="Análisis II", icon="calculator", color="sky", status="cursando")
    assert response.status_code == 200
    body = response.json()
    assert (body["name"], body["icon"], body["color"], body["status"]) == ("Análisis II", "calculator", "sky", "cursando")
    assert patch_subject(client, user, 999, name="x").status_code == 404


def test_update_rejects_null_for_required_fields(client, user):
    subject = create_subject(client, user)
    response = patch_subject(client, user, subject["id"], name=None)
    assert response.status_code == 422
    assert error_message(response) == "name no puede ser null"


def test_delete_subject_removes_its_folders(client, db, user):
    subject = create_subject(client, user)
    other = create_subject(client, user, name="Otra")
    assert client.delete(f"/api/faculty/subjects/{subject['id']}", headers=user).status_code == 204
    assert [s["id"] for s in list_subjects(client, user)] == [other["id"]]
    assert db.query(SubjectFolder).filter_by(subject_id=subject["id"]).count() == 0
    assert db.query(SubjectFolder).count() == 4
    assert client.delete(f"/api/faculty/subjects/{subject['id']}", headers=user).status_code == 404


@pytest.mark.parametrize(
    "payload",
    [
        {"name": "X", "level": 0},
        {"name": "X", "level": 9},
        {"name": "X", "level": 1, "status": "aprobado"},
        {"name": "   ", "level": 1},
        {"name": "X", "level": 1, "grade": 11, "status": "aprobada"},
        {"name": "X", "level": 1, "grade": 0.5, "status": "aprobada"},
    ],
    ids=["level-0", "level-9", "bad-status", "blank-name", "grade-11", "grade-below-1"],
)
def test_create_validation(client, user, payload):
    assert client.post("/api/faculty/subjects", json=payload, headers=user).status_code == 422


def test_update_validation(client, user):
    subject = create_subject(client, user)
    assert patch_subject(client, user, subject["id"], level=9).status_code == 422
    assert patch_subject(client, user, subject["id"], status="otro").status_code == 422


# --- Nota final ---


@pytest.mark.parametrize("status_value", ["aprobada", "aprobacion_directa"])
def test_grade_is_accepted_for_approved_statuses(client, user, status_value):
    subject = create_subject(client, user, status=status_value, grade=8.5)
    assert (subject["status"], subject["grade"]) == (status_value, 8.5)


@pytest.mark.parametrize("status_value", ["promocion_practica", "promocion_teorica", "regular", "cursando", "por_cursar", "libre"])
def test_grade_is_rejected_for_other_statuses(client, user, status_value):
    response = client.post("/api/faculty/subjects", json={"name": "X", "level": 1, "status": status_value, "grade": 7}, headers=user)
    assert response.status_code == 422
    assert error_message(response) == GRADE_ERROR


def test_changing_to_status_without_grade_clears_it(client, user):
    subject = create_subject(client, user, status="aprobada", grade=9)
    body = patch_subject(client, user, subject["id"], status="cursando").json()
    assert (body["status"], body["grade"]) == ("cursando", None)


def test_patch_only_grade_validates_against_stored_status(client, user):
    regular = create_subject(client, user, status="regular")
    response = patch_subject(client, user, regular["id"], grade=7)
    assert response.status_code == 422
    assert error_message(response) == GRADE_ERROR

    approved = create_subject(client, user, name="Otra", status="aprobacion_directa", grade=6)
    assert patch_subject(client, user, approved["id"], grade=9.25).json()["grade"] == 9.25
    assert patch_subject(client, user, approved["id"], grade=None).json()["grade"] is None


def test_patch_status_and_grade_together(client, user):
    subject = create_subject(client, user, status="regular")
    body = patch_subject(client, user, subject["id"], status="aprobada", grade=10).json()
    assert (body["status"], body["grade"]) == ("aprobada", 10)
    response = patch_subject(client, user, subject["id"], status="promocion_teorica", grade=8)
    assert response.status_code == 422


# --- Duplicados ---


def test_duplicate_subject_name_is_rejected_case_insensitively(client, user):
    create_subject(client, user, name="Álgebra")
    for name in ("álgebra", "ÁLGEBRA", "  Álgebra "):
        response = client.post("/api/faculty/subjects", json={"name": name, "level": 2}, headers=user)
        assert response.status_code == 409
        assert response.json()["detail"] == "Ya existe una materia con ese nombre"
    other = create_subject(client, user, name="Física")
    assert patch_subject(client, user, other["id"], name="ÁLGEBRA").status_code == 409
    # Cambiar solo mayúsculas del propio nombre está permitido.
    assert patch_subject(client, user, other["id"], name="FÍSICA").json()["name"] == "FÍSICA"


def test_same_subject_name_for_other_user_is_allowed(client, user, make_user):
    create_subject(client, user, name="Álgebra")
    other_user = make_user("otra@example.com")
    assert create_subject(client, other_user, name="Álgebra")["name"] == "Álgebra"


# --- Orden de materias ---


def test_reorder_subjects_within_level(client, user):
    first = create_subject(client, user, name="A")
    second = create_subject(client, user, name="B")
    third = create_subject(client, user, name="C")
    other_level = create_subject(client, user, name="D", level=2)
    response = client.put("/api/faculty/subjects/order", json={"level": 1, "ids": [third["id"], first["id"], second["id"]]}, headers=user)
    assert response.status_code == 200
    assert [(s["name"], s["position"]) for s in response.json()] == [("C", 0), ("A", 1), ("B", 2), ("D", 0)]
    assert other_level["position"] == 0


@pytest.mark.parametrize("case", ["missing", "extra", "duplicated", "other-level"])
def test_reorder_subjects_requires_exact_ids(client, user, case):
    first = create_subject(client, user, name="A")
    second = create_subject(client, user, name="B")
    other_level = create_subject(client, user, name="C", level=2)
    ids = {
        "missing": [first["id"]],
        "extra": [first["id"], second["id"], 999],
        "duplicated": [first["id"], first["id"], second["id"]],
        "other-level": [first["id"], second["id"], other_level["id"]],
    }[case]
    response = client.put("/api/faculty/subjects/order", json={"level": 1, "ids": ids}, headers=user)
    assert response.status_code == 400
    assert response.json()["detail"] == "Los ids no coinciden con las materias de ese nivel"


def test_changing_level_moves_subject_to_end_of_new_level(client, user):
    create_subject(client, user, name="Química", level=2)
    create_subject(client, user, name="Física", level=2)
    moved = create_subject(client, user, name="Álgebra", level=1)
    body = patch_subject(client, user, moved["id"], level=2).json()
    assert (body["level"], body["position"]) == (2, 2)
    # Mandar el mismo nivel no lo mueve.
    assert patch_subject(client, user, moved["id"], level=2).json()["position"] == 2


# --- Carpetas ---


def folders(subject: dict) -> list[str]:
    return [folder["name"] for folder in subject["folders"]]


def test_folder_crud(client, user):
    subject = create_subject(client, user)
    response = client.post(f"/api/faculty/subjects/{subject['id']}/folders", json={"name": "  Parciales  "}, headers=user)
    assert response.status_code == 201
    body = response.json()
    assert folders(body) == [*DEFAULT_FOLDERS, "Parciales"]
    assert body["folders"][-1]["position"] == 4

    folder_id = body["folders"][-1]["id"]
    renamed = client.patch(f"/api/faculty/folders/{folder_id}", json={"name": "Exámenes"}, headers=user).json()
    assert folders(renamed)[-1] == "Exámenes"

    assert client.delete(f"/api/faculty/folders/{folder_id}", headers=user).status_code == 204
    assert folders(list_subjects(client, user)[0]) == DEFAULT_FOLDERS
    assert client.delete(f"/api/faculty/folders/{folder_id}", headers=user).status_code == 404
    assert client.patch(f"/api/faculty/folders/{folder_id}", json={"name": "x"}, headers=user).status_code == 404
    assert client.post("/api/faculty/subjects/999/folders", json={"name": "x"}, headers=user).status_code == 404


def test_all_folders_can_be_deleted_and_new_ones_added(client, user):
    subject = create_subject(client, user)
    for folder in subject["folders"]:
        assert client.delete(f"/api/faculty/folders/{folder['id']}", headers=user).status_code == 204
    assert list_subjects(client, user)[0]["folders"] == []
    body = client.post(f"/api/faculty/subjects/{subject['id']}/folders", json={"name": "Nueva"}, headers=user).json()
    assert [(f["name"], f["position"]) for f in body["folders"]] == [("Nueva", 0)]


def test_folder_name_validation(client, user):
    subject = create_subject(client, user)
    assert client.post(f"/api/faculty/subjects/{subject['id']}/folders", json={"name": "   "}, headers=user).status_code == 422
    assert client.post(f"/api/faculty/subjects/{subject['id']}/folders", json={"name": "x" * 61}, headers=user).status_code == 422


def test_duplicate_folder_name_is_rejected_within_subject_only(client, user):
    subject = create_subject(client, user)
    other = create_subject(client, user, name="Otra")
    for name in ("final", "práctico", "PRÁCTICO "):
        response = client.post(f"/api/faculty/subjects/{subject['id']}/folders", json={"name": name}, headers=user)
        assert response.status_code == 409
        assert response.json()["detail"] == "Ya existe una carpeta con ese nombre"
    tps = subject["folders"][3]["id"]
    assert client.patch(f"/api/faculty/folders/{tps}", json={"name": "Teórico"}, headers=user).status_code == 409
    assert folders(client.patch(f"/api/faculty/folders/{tps}", json={"name": "tps"}, headers=user).json())[3] == "tps"
    # Otra materia puede tener una carpeta con el mismo nombre.
    assert client.post(f"/api/faculty/subjects/{other['id']}/folders", json={"name": "Parciales"}, headers=user).status_code == 201
    assert client.post(f"/api/faculty/subjects/{subject['id']}/folders", json={"name": "Parciales"}, headers=user).status_code == 201


def test_reorder_folders(client, user):
    subject = create_subject(client, user)
    ids = [folder["id"] for folder in subject["folders"]]
    response = client.put(f"/api/faculty/subjects/{subject['id']}/folders/order", json={"ids": list(reversed(ids))}, headers=user)
    assert response.status_code == 200
    assert folders(response.json()) == list(reversed(DEFAULT_FOLDERS))
    assert folders(list_subjects(client, user)[0]) == list(reversed(DEFAULT_FOLDERS))


def test_reorder_folders_requires_exact_ids(client, user):
    subject = create_subject(client, user)
    other = create_subject(client, user, name="Otra")
    ids = [folder["id"] for folder in subject["folders"]]
    for bad in (ids[:3], [*ids, other["folders"][0]["id"]], [ids[0], *ids[:3]]):
        response = client.put(f"/api/faculty/subjects/{subject['id']}/folders/order", json={"ids": bad}, headers=user)
        assert response.status_code == 400
        assert response.json()["detail"] == "Los ids no coinciden con las carpetas de la materia"


def test_subject_rows_store_decimal_grade_and_utc_created_at(client, db, user):
    subject = create_subject(client, user, status="aprobada", grade=7.75)
    row = db.get(Subject, subject["id"])
    assert str(row.grade) == "7.75"
    assert row.created_at is not None
