"""truncate open pay period to end of september

Revision ID: 0efb524cfe57
Revises: 7756fae04a3e
Create Date: 2026-10-01 00:00:00.000000

Los períodos de horas pasan de "11 al 10" a mes calendario (1 al último día).
Los períodos ya cerrados quedan tal cual están, congelados. El único período
todavía abierto en este momento (11 sep - 10 oct) se recorta para terminar el
30 de septiembre, así octubre arranca limpio como el primer mes calendario
completo en vez de quedar un período corto de transición (11-31 de octubre).
No se toca ninguna fila cerrada ni ninguna entrada de horas (HourEntry), solo
la fecha de fin de ese único período abierto.
"""
from datetime import date
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0efb524cfe57'
down_revision: Union[str, Sequence[str], None] = '7756fae04a3e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CUTOVER = date(2026, 10, 1)
NEW_END = date(2026, 9, 30)
OLD_END = date(2026, 10, 10)

pay_periods = sa.table(
    "pay_periods",
    sa.column("start", sa.Date),
    sa.column("end", sa.Date),
    sa.column("closed", sa.Boolean),
)


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        pay_periods.update()
        .where(pay_periods.c.closed.is_(False))
        .where(pay_periods.c.start < CUTOVER)
        .where(pay_periods.c.end >= CUTOVER)
        .values(end=NEW_END)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        pay_periods.update()
        .where(pay_periods.c.closed.is_(False))
        .where(pay_periods.c.start < CUTOVER)
        .where(pay_periods.c.end == NEW_END)
        .values(end=OLD_END)
    )
