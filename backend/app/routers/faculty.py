"""Facultad: materias por nivel con estado, nota final, datos del plan y correlativas, y carpetas por materia."""

from collections import defaultdict
from collections.abc import Iterable
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session, selectinload

from ..clock import today
from ..database import get_db
from ..deps import current_user
from ..models import FolderLink, PomodoroLog, Subject, SubjectFolder, SubjectRequirement, Task, User
from ..schemas import (
    ELECTIVE_NEEDS_CREDITS,
    GRADE_REQUIRES_APPROVAL,
    GRADED_SUBJECT_STATUSES,
    FolderLinkCreate,
    FolderLinkOrder,
    FolderLinkUpdate,
    MissingRequirement,
    SubjectCreate,
    SubjectFolderCreate,
    SubjectFolderOrder,
    SubjectFolderOut,
    SubjectFolderUpdate,
    SubjectNotesOut,
    SubjectNotesUpdate,
    SubjectOrder,
    SubjectOut,
    SubjectStudyOut,
    SubjectUpdate,
)

router = APIRouter(prefix="/api/faculty", tags=["faculty"])

DEFAULT_FOLDERS = ("FINAL", "PRÁCTICO", "TEÓRICO", "TPS")
# Para correlativas: una materia aprobada también cuenta como cursada.
CURSADA_STATUSES = frozenset({"regular", "promocion_practica", "promocion_teorica", "aprobacion_directa", "aprobada"})
SATISFIED_BY = {"cursada": CURSADA_STATUSES, "aprobada": GRADED_SUBJECT_STATUSES}
# Campos que no se copian directo al modelo.
REQUIREMENT_FIELDS = {"requires_aprobada", "requires_cursada"}
# Campos de SubjectOut que salen tal cual de la tabla; el resto se calcula en _build_outs.
COMPUTED_OUT_FIELDS = {"folders", "requires_aprobada", "requires_cursada", "required_by", "available", "missing"}
STORED_OUT_FIELDS = [field for field in SubjectOut.model_fields if field not in COMPUTED_OUT_FIELDS]


def _get_owned_or_404(db: Session, model, item_id: int, user: User):
    # En la Fase 4 este helper se mueve a deps.py.
    item = db.scalar(select(model).where(model.id == item_id, model.user_id == user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


def _name_taken(items: Iterable, name: str, exclude_id: int | None = None) -> bool:
    # Mismo criterio que las categorías: se compara en Python con casefold (SQLite solo
    # pasa a minúsculas ASCII). El constraint único de la tabla respalda el chequeo.
    wanted = name.strip().casefold()
    return any(item.name.strip().casefold() == wanted for item in items if item.id != exclude_id)


def _code_taken(subjects: Iterable[Subject], code: str | None, exclude_id: int | None = None) -> bool:
    if code is None:
        return False
    wanted = code.strip().casefold()
    return any(subject.code is not None and subject.code.strip().casefold() == wanted for subject in subjects if subject.id != exclude_id)


def _next_subject_position(db: Session, user: User, level: int, exclude_id: int | None = None) -> int:
    query = select(func.max(Subject.position)).where(Subject.user_id == user.id, Subject.level == level)
    if exclude_id is not None:
        query = query.where(Subject.id != exclude_id)
    current = db.scalar(query)
    return 0 if current is None else current + 1


def _ensure_same_ids(requested: list[int], existing: Iterable[int], detail: str) -> None:
    if len(requested) != len(set(requested)) or set(requested) != set(existing):
        raise HTTPException(status_code=400, detail=detail)


def _user_subjects(db: Session, user: User) -> list[Subject]:
    # Carpetas y sus links en dos consultas más, sin consultas por materia ni por carpeta.
    query = (
        select(Subject)
        .where(Subject.user_id == user.id)
        .options(selectinload(Subject.folders).selectinload(SubjectFolder.links))
        .order_by(Subject.level, Subject.position, Subject.id)
    )
    return list(db.scalars(query).all())


def _user_requirements(db: Session, user: User) -> list[SubjectRequirement]:
    return list(db.scalars(select(SubjectRequirement).where(SubjectRequirement.user_id == user.id)).all())


def _build_outs(subjects: list[Subject], requirements: list[SubjectRequirement]) -> list[SubjectOut]:
    """Arma la respuesta de todas las materias con dos consultas ya hechas (sin consultas por materia)."""
    by_id = {subject.id: subject for subject in subjects}
    order = {subject.id: index for index, subject in enumerate(subjects)}
    requires: dict[int, list[SubjectRequirement]] = defaultdict(list)
    required_by: dict[int, list[int]] = defaultdict(list)
    for requirement in sorted(requirements, key=lambda item: order.get(item.required_id, 0)):
        requires[requirement.subject_id].append(requirement)
    for requirement in sorted(requirements, key=lambda item: order.get(item.subject_id, 0)):
        required_by[requirement.required_id].append(requirement.subject_id)

    outs = []
    for subject in subjects:
        own = requires[subject.id]
        missing = [
            MissingRequirement(id=item.required_id, name=by_id[item.required_id].name, kind=item.kind)
            for item in own
            if by_id[item.required_id].status not in SATISFIED_BY[item.kind]
        ]
        outs.append(
            SubjectOut.model_validate(
                {
                    **{field: getattr(subject, field) for field in STORED_OUT_FIELDS},
                    "folders": [SubjectFolderOut.model_validate(folder) for folder in subject.folders],
                    "requires_aprobada": [item.required_id for item in own if item.kind == "aprobada"],
                    "requires_cursada": [item.required_id for item in own if item.kind == "cursada"],
                    "required_by": required_by[subject.id],
                    "available": not missing,
                    "missing": missing,
                }
            )
        )
    return outs


def _all_outs(db: Session, user: User) -> list[SubjectOut]:
    return _build_outs(_user_subjects(db, user), _user_requirements(db, user))


def _subject_out(db: Session, user: User, subject_id: int) -> SubjectOut:
    # La disponibilidad y required_by dependen de las demás materias: se calcula sobre todas.
    return next(out for out in _all_outs(db, user) if out.id == subject_id)


def _apply_requirements(db: Session, user: User, subject: Subject, aprobada: list[int], cursada: list[int]) -> None:
    """Reemplaza las correlativas de la materia validando dueño, autorrequisito y ciclos."""
    # Si un id está en las dos listas queda como aprobada: la aprobada implica la cursada.
    wanted = {required_id: "cursada" for required_id in cursada}
    wanted.update({required_id: "aprobada" for required_id in aprobada})
    if subject.id is not None and subject.id in wanted:
        raise HTTPException(status_code=422, detail="Una materia no puede ser correlativa de sí misma")
    owned = set(db.scalars(select(Subject.id).where(Subject.user_id == user.id, Subject.id.in_(wanted))).all()) if wanted else set()
    if owned != set(wanted):
        # Mismo mensaje para ids inexistentes y de otro usuario: no se revela si existen.
        raise HTTPException(status_code=422, detail="Correlativa inválida")

    if subject.id is not None and wanted:
        # Ciclo: alguna requerida ya necesita (directa o indirectamente) a esta materia.
        edges: dict[int, set[int]] = defaultdict(set)
        for requirement in _user_requirements(db, user):
            if requirement.subject_id != subject.id:
                edges[requirement.subject_id].add(requirement.required_id)
        pending, seen = list(wanted), set()
        while pending:
            current = pending.pop()
            if current == subject.id:
                raise HTTPException(status_code=422, detail="Esa correlativa genera un ciclo")
            if current in seen:
                continue
            seen.add(current)
            pending.extend(edges[current])

    # Se actualizan las filas existentes en vez de borrarlas y recrearlas: el flush inserta
    # antes de borrar y chocaría con el único (subject_id, required_id).
    existing = {requirement.required_id: requirement for requirement in subject.requirements}
    for required_id, requirement in existing.items():
        if required_id in wanted:
            requirement.kind = wanted[required_id]
        else:
            subject.requirements.remove(requirement)
    for required_id, kind in wanted.items():
        if required_id not in existing:
            subject.requirements.append(SubjectRequirement(user_id=user.id, required_id=required_id, kind=kind))


@router.get("/subjects", response_model=list[SubjectOut])
def list_subjects(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[SubjectOut]:
    return _all_outs(db, user)


@router.get("/study", response_model=list[SubjectStudyOut])
def study_summary(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[SubjectStudyOut]:
    """Tiempo de estudio (Pomodoro) y tareas pendientes por materia. Solo materias con algún dato."""
    current = today()
    week_start = current - timedelta(days=(current.weekday() + 1) % 7)  # semana de domingo a sábado, igual que el gráfico
    totals = {sid: secs for sid, secs in db.execute(
        select(PomodoroLog.subject_id, func.sum(PomodoroLog.seconds))
        .where(PomodoroLog.user_id == user.id, PomodoroLog.subject_id.is_not(None))
        .group_by(PomodoroLog.subject_id))}
    weeks = {sid: secs for sid, secs in db.execute(
        select(PomodoroLog.subject_id, func.sum(PomodoroLog.seconds))
        .where(PomodoroLog.user_id == user.id, PomodoroLog.subject_id.is_not(None), PomodoroLog.log_date >= week_start)
        .group_by(PomodoroLog.subject_id))}
    pending = {sid: count for sid, count in db.execute(
        select(Task.subject_id, func.count(Task.id))
        .where(Task.user_id == user.id, Task.subject_id.is_not(None), Task.completed.is_(False))
        .group_by(Task.subject_id))}
    ids = sorted(set(totals) | set(pending))
    return [SubjectStudyOut(subject_id=sid, total_seconds=int(totals.get(sid, 0)), week_seconds=int(weeks.get(sid, 0)), pending_tasks=int(pending.get(sid, 0))) for sid in ids]


@router.post("/subjects", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_subject(payload: SubjectCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SubjectOut:
    subjects = db.scalars(select(Subject).where(Subject.user_id == user.id)).all()
    if _name_taken(subjects, payload.name):
        raise HTTPException(status_code=409, detail="Ya existe una materia con ese nombre")
    if _code_taken(subjects, payload.code):
        raise HTTPException(status_code=409, detail="Ya existe una materia con ese código")
    data = payload.model_dump(exclude={"position"} | REQUIREMENT_FIELDS)
    position = payload.position if payload.position is not None else _next_subject_position(db, user, payload.level)
    subject = Subject(user_id=user.id, position=position, **data)
    subject.folders = [SubjectFolder(user_id=user.id, name=name, position=index) for index, name in enumerate(DEFAULT_FOLDERS)]
    _apply_requirements(db, user, subject, payload.requires_aprobada, payload.requires_cursada)
    db.add(subject)
    db.commit()
    return _subject_out(db, user, subject.id)


@router.put("/subjects/order", response_model=list[SubjectOut])
def reorder_subjects(payload: SubjectOrder, user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[SubjectOut]:
    subjects = db.scalars(select(Subject).where(Subject.user_id == user.id, Subject.level == payload.level)).all()
    _ensure_same_ids(payload.ids, (subject.id for subject in subjects), "Los ids no coinciden con las materias de ese nivel")
    by_id = {subject.id: subject for subject in subjects}
    for index, subject_id in enumerate(payload.ids):
        by_id[subject_id].position = index
    db.commit()
    return _all_outs(db, user)


@router.patch("/subjects/{subject_id}", response_model=SubjectOut)
def update_subject(subject_id: int, payload: SubjectUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SubjectOut:
    subject = _get_owned_or_404(db, Subject, subject_id, user)
    data = payload.model_dump(exclude_unset=True, exclude=REQUIREMENT_FIELDS)
    subjects = db.scalars(select(Subject).where(Subject.user_id == user.id)).all()
    if "name" in data and _name_taken(subjects, data["name"], exclude_id=subject.id):
        raise HTTPException(status_code=409, detail="Ya existe una materia con ese nombre")
    if "code" in data and _code_taken(subjects, data["code"], exclude_id=subject.id):
        raise HTTPException(status_code=409, detail="Ya existe una materia con ese código")
    # La regla nota/estado se valida contra el estado resultante: el nuevo si viene, si no el guardado.
    resulting_status = data.get("status", subject.status)
    if resulting_status not in GRADED_SUBJECT_STATUSES:
        if data.get("grade") is not None:
            raise HTTPException(status_code=422, detail=GRADE_REQUIRES_APPROVAL)
        data["grade"] = None
    # Igual con los créditos: solo las electivas los tienen, y son obligatorios.
    if data.get("elective", subject.elective):
        resulting_credits = data["credits"] if "credits" in data else subject.credits
        if resulting_credits is None:
            raise HTTPException(status_code=422, detail=ELECTIVE_NEEDS_CREDITS)
    else:
        data["credits"] = None
    if "level" in data and data["level"] != subject.level:
        subject.position = _next_subject_position(db, user, data["level"], exclude_id=subject.id)
    if payload.requires_aprobada is not None or payload.requires_cursada is not None:
        current_aprobada = [item.required_id for item in subject.requirements if item.kind == "aprobada"]
        current_cursada = [item.required_id for item in subject.requirements if item.kind == "cursada"]
        aprobada = payload.requires_aprobada if payload.requires_aprobada is not None else current_aprobada
        cursada = payload.requires_cursada if payload.requires_cursada is not None else current_cursada
        _apply_requirements(db, user, subject, aprobada, cursada)
    for field, value in data.items():
        setattr(subject, field, value)
    db.commit()
    return _subject_out(db, user, subject.id)


@router.patch("/subjects/{subject_id}/notes", response_model=SubjectNotesOut)
def update_subject_notes(subject_id: int, payload: SubjectNotesUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SubjectNotesOut:
    # Endpoint aparte y liviano para el guardado automático de las anotaciones del detalle.
    subject = _get_owned_or_404(db, Subject, subject_id, user)
    subject.notes = payload.notes
    db.commit()
    return SubjectNotesOut(notes=subject.notes, updated_at=datetime.now(timezone.utc))


@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(subject_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    subject = _get_owned_or_404(db, Subject, subject_id, user)
    # SQLite no aplica el ON DELETE CASCADE: las correlativas que otras materias tienen sobre esta se
    # borran a mano. Las propias (subject.requirements) y las carpetas las borra la cascada del ORM.
    db.execute(delete(SubjectRequirement).where(SubjectRequirement.user_id == user.id, SubjectRequirement.required_id == subject.id))
    # Tareas y registros de Pomodoro se conservan sin materia (tampoco hay ON DELETE SET NULL en SQLite).
    db.execute(update(Task).where(Task.user_id == user.id, Task.subject_id == subject.id).values(subject_id=None))
    db.execute(update(PomodoroLog).where(PomodoroLog.user_id == user.id, PomodoroLog.subject_id == subject.id).values(subject_id=None))
    db.delete(subject)
    db.commit()


@router.post("/subjects/{subject_id}/folders", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_folder(subject_id: int, payload: SubjectFolderCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SubjectOut:
    subject = _get_owned_or_404(db, Subject, subject_id, user)
    if _name_taken(subject.folders, payload.name):
        raise HTTPException(status_code=409, detail="Ya existe una carpeta con ese nombre")
    position = max((folder.position for folder in subject.folders), default=-1) + 1
    db.add(SubjectFolder(user_id=user.id, subject_id=subject.id, name=payload.name, position=position))
    db.commit()
    return _subject_out(db, user, subject.id)


@router.put("/subjects/{subject_id}/folders/order", response_model=SubjectOut)
def reorder_folders(subject_id: int, payload: SubjectFolderOrder, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SubjectOut:
    subject = _get_owned_or_404(db, Subject, subject_id, user)
    _ensure_same_ids(payload.ids, (folder.id for folder in subject.folders), "Los ids no coinciden con las carpetas de la materia")
    by_id = {folder.id: folder for folder in subject.folders}
    for index, folder_id in enumerate(payload.ids):
        by_id[folder_id].position = index
    db.commit()
    return _subject_out(db, user, subject.id)


@router.patch("/folders/{folder_id}", response_model=SubjectOut)
def update_folder(folder_id: int, payload: SubjectFolderUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SubjectOut:
    folder = _get_owned_or_404(db, SubjectFolder, folder_id, user)
    subject = db.get(Subject, folder.subject_id)
    data = payload.model_dump(exclude_unset=True)
    if "name" in data and _name_taken(subject.folders, data["name"], exclude_id=folder.id):
        raise HTTPException(status_code=409, detail="Ya existe una carpeta con ese nombre")
    for field, value in data.items():
        setattr(folder, field, value)
    db.commit()
    return _subject_out(db, user, subject.id)


@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(folder_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    db.delete(_get_owned_or_404(db, SubjectFolder, folder_id, user))
    db.commit()


# --- Archivos de las carpetas (links a Drive u otros sitios) ---


@router.post("/folders/{folder_id}/links", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_link(folder_id: int, payload: FolderLinkCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SubjectOut:
    folder = _get_owned_or_404(db, SubjectFolder, folder_id, user)
    position = max((link.position for link in folder.links), default=-1) + 1
    db.add(FolderLink(user_id=user.id, folder_id=folder.id, title=payload.title, url=payload.url, position=position))
    db.commit()
    return _subject_out(db, user, folder.subject_id)


@router.put("/folders/{folder_id}/links/order", response_model=SubjectOut)
def reorder_links(folder_id: int, payload: FolderLinkOrder, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SubjectOut:
    folder = _get_owned_or_404(db, SubjectFolder, folder_id, user)
    _ensure_same_ids(payload.ids, (link.id for link in folder.links), "Los ids no coinciden con los archivos de la carpeta")
    by_id = {link.id: link for link in folder.links}
    for index, link_id in enumerate(payload.ids):
        by_id[link_id].position = index
    db.commit()
    return _subject_out(db, user, folder.subject_id)


@router.patch("/links/{link_id}", response_model=SubjectOut)
def update_link(link_id: int, payload: FolderLinkUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SubjectOut:
    link = _get_owned_or_404(db, FolderLink, link_id, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(link, field, value)
    db.commit()
    return _subject_out(db, user, db.get(SubjectFolder, link.folder_id).subject_id)


@router.delete("/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_link(link_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    db.delete(_get_owned_or_404(db, FolderLink, link_id, user))
    db.commit()
