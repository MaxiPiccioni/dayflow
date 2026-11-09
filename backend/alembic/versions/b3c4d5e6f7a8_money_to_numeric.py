"""dinero y horas con precisión: Float pasa a Numeric

Revision ID: b3c4d5e6f7a8
Revises: a1b2c3d4e5f6
Create Date: 2026-11-09 18:00:00.000000

Montos en Numeric(12, 2) y horas en Numeric(6, 2). Los valores existentes se redondean a 2 decimales
(ROUND() redondea mitad hacia arriba tanto en Postgres como en SQLite).

Antes de tocar nada se revisa que ningún valor se pase del rango nuevo: si alguno no entra, la migración
se detiene con un mensaje y no cambia la base.

Postgres: ALTER COLUMN ... TYPE NUMERIC con USING ROUND(col::numeric, 2) (reescribe la tabla; son chicas).
SQLite: batch_alter_table recrea la tabla copiando los datos.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (tabla, columna, precisión, escala, acepta NULL)
COLUMNS = [
    ('transactions', 'amount', 12, 2, False),
    ('saving_entries', 'start_amount', 12, 2, False),
    ('saving_movements', 'amount', 12, 2, False),
    ('pay_periods', 'rate', 12, 2, False),
    ('pay_periods', 'total_hours', 6, 2, False),
    ('pay_periods', 'expected', 12, 2, False),
    ('pay_periods', 'paid', 12, 2, False),
    ('pay_periods', 'balance', 12, 2, False),
    ('hour_entries', 'hours', 6, 2, True),
    ('hour_payments', 'amount', 12, 2, False),
]


def _by_table() -> dict[str, list]:
    grouped: dict[str, list] = {}
    for table, column, precision, scale, nullable in COLUMNS:
        grouped.setdefault(table, []).append((column, precision, scale, nullable))
    return grouped


def _check_ranges(bind) -> None:
    too_big = []
    for table, column, precision, scale, _ in COLUMNS:
        limit = 10 ** (precision - scale)
        found = bind.execute(sa.text(f'SELECT COUNT(*) FROM {table} WHERE ABS({column}) >= :limit'), {'limit': limit}).scalar()
        if found:
            too_big.append(f'{table}.{column} ({found} fila(s) con valor >= {limit})')
    if too_big:
        raise RuntimeError('No se puede pasar a Numeric: hay valores fuera de rango en ' + ', '.join(too_big) + '. Corregilos y volvé a correr la migración.')


def upgrade() -> None:
    _check_ranges(op.get_bind())
    for table, columns in _by_table().items():
        with op.batch_alter_table(table) as batch_op:
            for column, precision, scale, nullable in columns:
                batch_op.alter_column(
                    column,
                    existing_type=sa.Float(),
                    type_=sa.Numeric(precision, scale),
                    existing_nullable=nullable,
                    postgresql_using=f'ROUND({column}::numeric, {scale})',
                )
        for column, _, scale, _ in columns:
            op.execute(sa.text(f'UPDATE {table} SET {column} = ROUND({column}, {scale}) WHERE {column} IS NOT NULL'))


def downgrade() -> None:
    for table, columns in _by_table().items():
        with op.batch_alter_table(table) as batch_op:
            for column, precision, scale, nullable in columns:
                batch_op.alter_column(
                    column,
                    existing_type=sa.Numeric(precision, scale),
                    type_=sa.Float(),
                    existing_nullable=nullable,
                    postgresql_using=f'{column}::double precision',
                )
