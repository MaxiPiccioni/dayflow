"""Mensajes de error de validación (422) en español.

FastAPI/Pydantic devuelven los errores en inglés ("String should have at least 1 character") y
repiten en la respuesta el valor que se mandó (`input`), que puede ser una contraseña. Acá se
traducen los tipos de error más comunes y se saca `input` y `ctx` de la respuesta.
"""

from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

# Tipos de error definidos en schemas.py con PydanticCustomError.
CUSTOM_ERROR_TYPES = {"invalid_link", "grade_requires_approval", "elective_needs_credits", "not_nullable"}

FIELD_LABELS = {
    "title": "título",
    "name": "nombre",
    "email": "email",
    "password": "contraseña",
    "full_name": "nombre completo",
    "amount": "monto",
    "date": "fecha",
    "due_date": "fecha",
    "time": "horario",
    "notes": "notas",
    "category": "categoría",
    "priority": "importancia",
    "rate": "tarifa",
    "hours": "horas",
    "seconds": "segundos",
    "level": "año",
    "credits": "créditos",
    "grade": "nota",
    "url": "link",
    "target": "objetivo",
    "unit": "unidad",
    "stock": "stock",
}


def field_label(loc: tuple[Any, ...]) -> str:
    names = [part for part in loc if isinstance(part, str) and part not in {"body", "query", "path", "header"}]
    raw = names[-1] if names else "valor"
    return FIELD_LABELS.get(raw, raw.replace("_", " "))


def _limit(ctx: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in ctx:
            return ctx[key]
    return None


def translate_error(error: dict[str, Any]) -> str:
    kind = error.get("type", "")
    ctx = error.get("ctx") or {}
    label = field_label(tuple(error.get("loc", ())))
    message = str(error.get("msg", ""))

    if kind == "missing":
        return f"Falta completar «{label}»."
    if kind == "string_too_short":
        minimum = ctx.get("min_length", 1)
        return f"«{label}» no puede estar vacío." if minimum == 1 else f"«{label}» es demasiado corto (mínimo {minimum} caracteres)."
    if kind == "string_too_long":
        return f"«{label}» es demasiado largo (máximo {ctx.get('max_length')} caracteres)."
    if kind == "too_short":
        return f"«{label}» tiene muy pocos elementos (mínimo {ctx.get('min_length')})."
    if kind == "too_long":
        return f"«{label}» tiene demasiados elementos (máximo {ctx.get('max_length')})."
    if kind in {"greater_than_equal", "greater_than", "less_than_equal", "less_than"}:
        words = {"greater_than_equal": "mayor o igual a", "greater_than": "mayor que", "less_than_equal": "menor o igual a", "less_than": "menor que"}
        limit = _limit(ctx, "ge", "gt", "le", "lt")
        return f"«{label}» tiene que ser {words[kind]} {limit}."
    if kind in {"int_parsing", "int_type", "float_parsing", "float_type", "decimal_parsing", "decimal_type", "int_from_float"}:
        return f"«{label}» tiene que ser un número."
    if kind in {"date_parsing", "date_from_datetime_parsing", "date_type", "date_from_datetime_inexact"}:
        return f"«{label}» tiene que ser una fecha válida (AAAA-MM-DD)."
    if kind == "string_pattern_mismatch":
        return f"«{label}» no tiene el formato esperado."
    if kind in {"literal_error", "enum"}:
        return f"«{label}» tiene un valor no permitido."
    if kind in {"bool_parsing", "bool_type"}:
        return f"«{label}» tiene que ser verdadero o falso."
    if kind in {"string_type", "list_type", "dict_type"}:
        return f"«{label}» no tiene el tipo esperado."
    if kind == "json_invalid":
        return "El pedido no tiene un formato válido."
    if kind == "value_error":
        # Los validadores propios ya escriben el mensaje en español; Pydantic le antepone "Value error, ".
        return message.removeprefix("Value error, ")
    if kind == "extra_forbidden":
        return f"«{label}» no se puede enviar."
    # Errores propios de la app (PydanticCustomError) ya traen su mensaje en español: se dejan tal cual.
    if kind in CUSTOM_ERROR_TYPES:
        return message
    return f"«{label}» no es válido."


async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    detail = [{"type": error.get("type"), "loc": list(error.get("loc", ())), "msg": translate_error(error)} for error in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": detail})
