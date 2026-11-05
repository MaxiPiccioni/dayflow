import pytest

from app.models import Subject, SubjectFolder, SubjectRequirement

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


# --- Parte 2: datos del plan ---

ELECTIVE_ERROR = "Las electivas tienen que tener créditos"


def test_create_with_plan_data(client, user):
    subject = create_subject(client, user, code=" 19 ", modality="1C-2C", weekly_hours=6, elective=True, credits=3)
    assert {key: subject[key] for key in ("code", "modality", "weekly_hours", "elective", "credits", "notes")} == {
        "code": "19",
        "modality": "1C-2C",
        "weekly_hours": 6,
        "elective": True,
        "credits": 3,
        "notes": "",
    }
    plain = create_subject(client, user, name="Otra")
    assert (plain["code"], plain["elective"], plain["credits"], plain["modality"], plain["weekly_hours"]) == (None, False, None, None, None)


@pytest.mark.parametrize(
    "fields",
    [
        {"elective": True, "credits": 0},
        {"elective": True, "credits": 21},
        {"weekly_hours": 0},
        {"weekly_hours": 21},
        {"modality": "3C"},
        {"code": "x" * 11},
        {"code": "   "},
    ],
    ids=["credits-0", "credits-21", "hours-0", "hours-21", "bad-modality", "long-code", "blank-code"],
)
def test_plan_data_validation(client, user, fields):
    assert client.post("/api/faculty/subjects", json={"name": "X", "level": 1, **fields}, headers=user).status_code == 422


@pytest.mark.parametrize("modality", ["A", "1C", "2C", "1C-2C", "2C-1C"])
def test_all_modalities_are_accepted(client, user, modality):
    assert create_subject(client, user, modality=modality)["modality"] == modality


def test_elective_needs_credits_and_non_elective_drops_them(client, user):
    response = client.post("/api/faculty/subjects", json={"name": "X", "level": 1, "elective": True}, headers=user)
    assert response.status_code == 422
    assert error_message(response) == ELECTIVE_ERROR
    assert create_subject(client, user, credits=5)["credits"] is None


def test_patch_elective_and_credits_against_resulting_state(client, user):
    elective = create_subject(client, user, elective=True, credits=4)
    assert patch_subject(client, user, elective["id"], credits=6).json()["credits"] == 6
    response = patch_subject(client, user, elective["id"], credits=None)
    assert (response.status_code, error_message(response)) == (422, ELECTIVE_ERROR)
    body = patch_subject(client, user, elective["id"], elective=False).json()
    assert (body["elective"], body["credits"]) == (False, None)

    curricular = create_subject(client, user, name="Curricular")
    response = patch_subject(client, user, curricular["id"], elective=True)
    assert (response.status_code, error_message(response)) == (422, ELECTIVE_ERROR)
    assert patch_subject(client, user, curricular["id"], credits=3).json()["credits"] is None
    body = patch_subject(client, user, curricular["id"], elective=True, credits=2).json()
    assert (body["elective"], body["credits"]) == (True, 2)
    assert patch_subject(client, user, curricular["id"], elective=None).status_code == 422


def test_code_is_unique_per_user_and_nulls_do_not_clash(client, user, make_user):
    first = create_subject(client, user, code="19")
    create_subject(client, user, name="Sin código 1")
    create_subject(client, user, name="Sin código 2")
    response = client.post("/api/faculty/subjects", json={"name": "Otra", "level": 1, "code": "19"}, headers=user)
    assert (response.status_code, response.json()["detail"]) == (409, "Ya existe una materia con ese código")
    other = create_subject(client, user, name="Otra", code="20")
    assert patch_subject(client, user, other["id"], code=" 19").status_code == 409
    assert patch_subject(client, user, first["id"], code="19").status_code == 200  # el propio código no choca
    assert patch_subject(client, user, first["id"], code=None).json()["code"] is None
    assert create_subject(client, make_user("otra@example.com"), code="20")["code"] == "20"


def test_patch_modality_and_hours_can_be_cleared(client, user):
    subject = create_subject(client, user, modality="A", weekly_hours=4)
    body = patch_subject(client, user, subject["id"], modality=None, weekly_hours=None).json()
    assert (body["modality"], body["weekly_hours"]) == (None, None)


# --- Parte 2: correlativas ---


def by_id(client, user) -> dict[int, dict]:
    return {subject["id"]: subject for subject in list_subjects(client, user)}


def test_create_with_both_requirement_lists(client, user):
    a = create_subject(client, user, name="A")
    b = create_subject(client, user, name="B")
    c = create_subject(client, user, name="C", level=2, requires_aprobada=[a["id"]], requires_cursada=[b["id"]])
    assert (c["requires_aprobada"], c["requires_cursada"], c["required_by"]) == ([a["id"]], [b["id"]], [])
    subjects = by_id(client, user)
    assert subjects[a["id"]]["required_by"] == [c["id"]]
    assert subjects[b["id"]]["required_by"] == [c["id"]]


def test_id_in_both_lists_stays_as_aprobada(client, user):
    a = create_subject(client, user, name="A")
    c = create_subject(client, user, name="C", requires_aprobada=[a["id"]], requires_cursada=[a["id"], a["id"]])
    assert (c["requires_aprobada"], c["requires_cursada"]) == ([a["id"]], [])


def test_self_requirement_is_rejected(client, user):
    a = create_subject(client, user, name="A")
    response = patch_subject(client, user, a["id"], requires_cursada=[a["id"]])
    assert (response.status_code, response.json()["detail"]) == (422, "Una materia no puede ser correlativa de sí misma")


def test_direct_and_indirect_cycles_are_rejected(client, user):
    a = create_subject(client, user, name="A")
    b = create_subject(client, user, name="B", requires_cursada=[a["id"]])
    c = create_subject(client, user, name="C", requires_aprobada=[b["id"]])
    # Directo: B requiere A, A no puede requerir B. Indirecto: C -> B -> A, A no puede requerir C.
    for payload in ({"requires_aprobada": [b["id"]]}, {"requires_cursada": [c["id"]]}):
        response = patch_subject(client, user, a["id"], **payload)
        assert (response.status_code, response.json()["detail"]) == (422, "Esa correlativa genera un ciclo")
    assert (by_id(client, user)[a["id"]]["requires_aprobada"], by_id(client, user)[a["id"]]["requires_cursada"]) == ([], [])


def test_shared_requirement_is_not_a_cycle(client, user):
    # Diamante: B y C requieren A, y D requiere B y C. Que E requiera D no es un ciclo.
    a = create_subject(client, user, name="A")
    b = create_subject(client, user, name="B", requires_cursada=[a["id"]])
    c = create_subject(client, user, name="C", requires_cursada=[a["id"]])
    d = create_subject(client, user, name="D", requires_aprobada=[b["id"], c["id"]])
    e = create_subject(client, user, name="E")
    assert patch_subject(client, user, e["id"], requires_cursada=[d["id"]]).json()["requires_cursada"] == [d["id"]]


def test_foreign_or_missing_requirement_is_invalid(client, user, make_user):
    foreign = create_subject(client, make_user("otra@example.com"), name="Ajena")
    for required in (foreign["id"], 999):
        response = client.post("/api/faculty/subjects", json={"name": "X", "level": 1, "requires_cursada": [required]}, headers=user)
        assert (response.status_code, response.json()["detail"]) == (422, "Correlativa inválida")
    assert list_subjects(client, user) == []


def test_patch_replaces_given_lists_and_keeps_omitted_ones(client, user):
    a = create_subject(client, user, name="A")
    b = create_subject(client, user, name="B")
    c = create_subject(client, user, name="C")
    target = create_subject(client, user, name="T", requires_aprobada=[a["id"]], requires_cursada=[b["id"]])
    body = patch_subject(client, user, target["id"], requires_cursada=[c["id"]]).json()
    assert (body["requires_aprobada"], body["requires_cursada"]) == ([a["id"]], [c["id"]])
    # Pasar una requerida de cursada a aprobada actualiza la fila existente.
    body = patch_subject(client, user, target["id"], requires_aprobada=[a["id"], c["id"]]).json()
    assert (body["requires_aprobada"], body["requires_cursada"]) == ([a["id"], c["id"]], [])
    body = patch_subject(client, user, target["id"], requires_aprobada=[], name="T2").json()
    assert (body["requires_aprobada"], body["requires_cursada"], body["name"]) == ([], [], "T2")
    assert patch_subject(client, user, target["id"], requires_aprobada=None).status_code == 422


# --- Parte 2: disponibilidad ---

CURSADA_OK = {"regular", "promocion_practica", "promocion_teorica", "aprobacion_directa", "aprobada"}
APROBADA_OK = {"aprobacion_directa", "aprobada"}
ALL_STATUSES = ["por_cursar", "cursando", "regular", "promocion_practica", "promocion_teorica", "aprobacion_directa", "aprobada", "libre"]


@pytest.mark.parametrize("kind", ["cursada", "aprobada"])
@pytest.mark.parametrize("required_status", ALL_STATUSES)
def test_availability_for_each_status_and_kind(client, user, kind, required_status):
    required = create_subject(client, user, name="Requerida", status=required_status)
    target = create_subject(client, user, name="Objetivo", level=2, **{f"requires_{kind}": [required["id"]]})
    expected = required_status in (CURSADA_OK if kind == "cursada" else APROBADA_OK)
    assert target["available"] is expected
    assert target["missing"] == ([] if expected else [{"id": required["id"], "name": "Requerida", "kind": kind}])


def test_missing_lists_exactly_what_is_missing_and_updates_with_status(client, user):
    a = create_subject(client, user, name="Análisis", status="aprobada")
    b = create_subject(client, user, name="Álgebra", status="regular")
    c = create_subject(client, user, name="Física", status="cursando")
    target = create_subject(client, user, name="Economía", level=3, requires_aprobada=[a["id"], b["id"]], requires_cursada=[c["id"]])
    assert target["available"] is False
    assert target["missing"] == [{"id": b["id"], "name": "Álgebra", "kind": "aprobada"}, {"id": c["id"], "name": "Física", "kind": "cursada"}]
    patch_subject(client, user, b["id"], status="aprobacion_directa")
    patch_subject(client, user, c["id"], status="promocion_teorica")
    refreshed = by_id(client, user)[target["id"]]
    assert (refreshed["available"], refreshed["missing"]) == (True, [])
    assert create_subject(client, user, name="Sin correlativas")["available"] is True


def test_deleting_a_subject_cleans_requirements_in_both_directions(client, db, user):
    base = create_subject(client, user, name="Base", status="cursando")
    middle = create_subject(client, user, name="Medio", level=2, requires_aprobada=[base["id"]])
    top = create_subject(client, user, name="Final", level=3, requires_cursada=[middle["id"]])
    assert top["available"] is False
    assert client.delete(f"/api/faculty/subjects/{middle['id']}", headers=user).status_code == 204
    subjects = by_id(client, user)
    assert (subjects[top["id"]]["requires_cursada"], subjects[top["id"]]["available"], subjects[top["id"]]["missing"]) == ([], True, [])
    assert subjects[base["id"]]["required_by"] == []
    db.expire_all()
    assert db.query(SubjectRequirement).count() == 0


# --- Parte 2: anotaciones ---


def test_notes_are_saved_and_returned(client, user):
    subject = create_subject(client, user)
    text = "Horario: martes 18 h\nhttps://campus.example.com/aula"
    response = client.patch(f"/api/faculty/subjects/{subject['id']}/notes", json={"notes": text}, headers=user)
    assert response.status_code == 200
    body = response.json()
    assert body["notes"] == text and body["updated_at"]
    assert list_subjects(client, user)[0]["notes"] == text


def test_notes_length_limit_and_missing_subject(client, user):
    subject = create_subject(client, user)
    path = f"/api/faculty/subjects/{subject['id']}/notes"
    assert client.patch(path, json={"notes": "x" * 5000}, headers=user).status_code == 200
    assert client.patch(path, json={"notes": "x" * 5001}, headers=user).status_code == 422
    assert client.patch("/api/faculty/subjects/999/notes", json={"notes": "x"}, headers=user).status_code == 404
