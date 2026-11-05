"""Facultad: materias por nivel con estado y nota final, y carpetas por materia."""

from collections.abc import Iterable

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..deps import current_user
from ..models import Subject, SubjectFolder, User
from ..schemas import (
    GRADE_REQUIRES_APPROVAL,
    GRADED_SUBJECT_STATUSES,
    SubjectCreate,
    SubjectFolderCreate,
    SubjectFolderOrder,
    SubjectOrder,
    SubjectOut,
    SubjectUpdate,
)

router = APIRouter(prefix="/api/faculty", tags=["faculty"])

DEFAULT_FOLDERS = ("FINAL", "PRÁCTICO", "TEÓRICO", "TPS")


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


def _next_subject_position(db: Session, user: User, level: int, exclude_id: int | None = None) -> int:
    query = select(func.max(Subject.position)).where(Subject.user_id == user.id, Subject.level == level)
    if exclude_id is not None:
        query = query.where(Subject.id != exclude_id)
    current = db.scalar(query)
    return 0 if current is None else current + 1


def _ensure_same_ids(requested: list[int], existing: Iterable[int], detail: str) -> None:
    if len(requested) != len(set(requested)) or set(requested) != set(existing):
        raise HTTPException(status_code=400, detail=detail)


def _subject_out(db: Session, subject: Subject) -> SubjectOut:
    db.refresh(subject)
    return SubjectOut.model_validate(subject)


@router.get("/subjects", response_model=list[SubjectOut])
def list_subjects(user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[Subject]:
    query = select(Subject).where(Subject.user_id == user.id).options(selectinload(Subject.folders)).order_by(Subject.level, Subject.position, Subject.id)
    return db.scalars(query).all()


@router.post("/subjects", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_subject(payload: SubjectCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SubjectOut:
    if _name_taken(db.scalars(select(Subject).where(Subject.user_id == user.id)), payload.name):
        raise HTTPException(status_code=409, detail="Ya existe una materia con ese nombre")
    data = payload.model_dump(exclude={"position"})
    position = payload.position if payload.position is not None else _next_subject_position(db, user, payload.level)
    subject = Subject(user_id=user.id, position=position, **data)
    subject.folders = [SubjectFolder(user_id=user.id, name=name, position=index) for index, name in enumerate(DEFAULT_FOLDERS)]
    db.add(subject)
    db.commit()
    return _subject_out(db, subject)


@router.put("/subjects/order", response_model=list[SubjectOut])
def reorder_subjects(payload: SubjectOrder, user: User = Depends(current_user), db: Session = Depends(get_db)) -> list[Subject]:
    subjects = db.scalars(select(Subject).where(Subject.user_id == user.id, Subject.level == payload.level)).all()
    _ensure_same_ids(payload.ids, (subject.id for subject in subjects), "Los ids no coinciden con las materias de ese nivel")
    by_id = {subject.id: subject for subject in subjects}
    for index, subject_id in enumerate(payload.ids):
        by_id[subject_id].position = index
    db.commit()
    return list_subjects(user, db)


@router.patch("/subjects/{subject_id}", response_model=SubjectOut)
def update_subject(subject_id: int, payload: SubjectUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SubjectOut:
    subject = _get_owned_or_404(db, Subject, subject_id, user)
    data = payload.model_dump(exclude_unset=True)
    if "name" in data and _name_taken(db.scalars(select(Subject).where(Subject.user_id == user.id)), data["name"], exclude_id=subject.id):
        raise HTTPException(status_code=409, detail="Ya existe una materia con ese nombre")
    # La regla nota/estado se valida contra el estado resultante: el nuevo si viene, si no el guardado.
    resulting_status = data.get("status", subject.status)
    if resulting_status not in GRADED_SUBJECT_STATUSES:
        if data.get("grade") is not None:
            raise HTTPException(status_code=422, detail=GRADE_REQUIRES_APPROVAL)
        data["grade"] = None
    if "level" in data and data["level"] != subject.level:
        subject.position = _next_subject_position(db, user, data["level"], exclude_id=subject.id)
    for field, value in data.items():
        setattr(subject, field, value)
    db.commit()
    return _subject_out(db, subject)


@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(subject_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    db.delete(_get_owned_or_404(db, Subject, subject_id, user))
    db.commit()


@router.post("/subjects/{subject_id}/folders", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_folder(subject_id: int, payload: SubjectFolderCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SubjectOut:
    subject = _get_owned_or_404(db, Subject, subject_id, user)
    if _name_taken(subject.folders, payload.name):
        raise HTTPException(status_code=409, detail="Ya existe una carpeta con ese nombre")
    position = max((folder.position for folder in subject.folders), default=-1) + 1
    db.add(SubjectFolder(user_id=user.id, subject_id=subject.id, name=payload.name, position=position))
    db.commit()
    return _subject_out(db, subject)


@router.put("/subjects/{subject_id}/folders/order", response_model=SubjectOut)
def reorder_folders(subject_id: int, payload: SubjectFolderOrder, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SubjectOut:
    subject = _get_owned_or_404(db, Subject, subject_id, user)
    _ensure_same_ids(payload.ids, (folder.id for folder in subject.folders), "Los ids no coinciden con las carpetas de la materia")
    by_id = {folder.id: folder for folder in subject.folders}
    for index, folder_id in enumerate(payload.ids):
        by_id[folder_id].position = index
    db.commit()
    return _subject_out(db, subject)


@router.patch("/folders/{folder_id}", response_model=SubjectOut)
def rename_folder(folder_id: int, payload: SubjectFolderCreate, user: User = Depends(current_user), db: Session = Depends(get_db)) -> SubjectOut:
    folder = _get_owned_or_404(db, SubjectFolder, folder_id, user)
    subject = db.get(Subject, folder.subject_id)
    if _name_taken(subject.folders, payload.name, exclude_id=folder.id):
        raise HTTPException(status_code=409, detail="Ya existe una carpeta con ese nombre")
    folder.name = payload.name
    db.commit()
    return _subject_out(db, subject)


@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(folder_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    db.delete(_get_owned_or_404(db, SubjectFolder, folder_id, user))
    db.commit()
