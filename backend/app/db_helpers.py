"""Ayudas para operaciones "buscar o crear" que se apoyan en un índice único, no solo en un select previo."""

from collections.abc import Callable
from typing import TypeVar

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

T = TypeVar("T")


def insert_or_get(db: Session, instance: T, find: Callable[[], T | None]) -> tuple[T, bool]:
    """Inserta `instance` y confirma. Si otro pedido la creó primero (choca con el índice único) vuelve a buscarla.

    Devuelve (fila, creada). Si no la encuentra después del choque, vuelve a lanzar el error original.
    """
    try:
        db.add(instance)
        db.commit()
        return instance, True
    except IntegrityError:
        db.rollback()
        existing = find()
        if existing is None:
            raise
        return existing, False
