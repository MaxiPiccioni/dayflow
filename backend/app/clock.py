"""Fecha y hora "de hoy" de la app.

El servidor (Render) corre en UTC: después de las 21:00 en Argentina `date.today()` ya devuelve el
día siguiente, y cosas como el registro del Pomodoro, el mes de un ahorro o el período de horas caían
en el día equivocado. Todo lo que dependa de "hoy" usa `today()`, que respeta `APP_TIMEZONE`.
"""

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from .config import settings


def today() -> date:
    return datetime.now(ZoneInfo(settings.app_timezone)).date()


def utcnow() -> datetime:
    """Instante actual en UTC sin zona (las columnas DateTime de la base guardan UTC sin tzinfo)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
