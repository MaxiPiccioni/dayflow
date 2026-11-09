"""Dinero y horas con precisión: Decimal con 2 decimales, redondeo "mitad hacia arriba" en todos lados.

En la base son Numeric; en la API entran como número (o texto) y salen como número JSON, así el frontend no cambia.
"""

from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from typing import Annotated

from pydantic import BeforeValidator, PlainSerializer
from pydantic_core import PydanticCustomError

CENT = Decimal("0.01")
ZERO = Decimal("0.00")
# Numeric(12, 2): hasta 9.999.999.999,99. Numeric(6, 2) para horas: hasta 9999,99.
MAX_MONEY = Decimal("9999999999.99")
MAX_HOURS = Decimal("9999.99")


def to_decimal(value: object) -> Decimal:
    """Convierte int, float, str o Decimal a Decimal sin arrastrar el error binario del float (0.1 + 0.2)."""
    if isinstance(value, Decimal):
        return value
    if isinstance(value, bool):
        raise PydanticCustomError("money_type", "El monto tiene que ser un número.")
    try:
        return Decimal(str(value).strip())
    except (InvalidOperation, ValueError) as exc:
        raise PydanticCustomError("money_type", "El monto tiene que ser un número.") from exc


def quantize(value: Decimal) -> Decimal:
    """Redondea a 2 decimales (mitad hacia arriba)."""
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def _money(value: object) -> Decimal:
    number = to_decimal(value)
    if not number.is_finite():
        raise PydanticCustomError("money_finite", "El monto tiene que ser un número finito.")
    if number.adjusted() > 12:
        raise PydanticCustomError("money_too_big", "El monto es demasiado grande.")
    rounded = quantize(number)
    if abs(rounded) > MAX_MONEY:
        raise PydanticCustomError("money_too_big", "El monto es demasiado grande.")
    return rounded


def _hours(value: object) -> Decimal:
    number = to_decimal(value)
    if not number.is_finite():
        raise PydanticCustomError("hours_finite", "Las horas tienen que ser un número finito.")
    if number.adjusted() > 6:
        raise PydanticCustomError("hours_too_big", "Las horas son demasiadas.")
    rounded = quantize(number)
    if abs(rounded) > MAX_HOURS:
        raise PydanticCustomError("hours_too_big", "Las horas son demasiadas.")
    return rounded


_as_number = PlainSerializer(lambda v: float(v), return_type=float, when_used="json")

# Monto de dinero: entra como número o texto, se redondea a 2 decimales y sale como número JSON.
Money = Annotated[Decimal, BeforeValidator(_money), _as_number]
# Horas (2 decimales), igual que Money.
Hours = Annotated[Decimal, BeforeValidator(_hours), _as_number]
