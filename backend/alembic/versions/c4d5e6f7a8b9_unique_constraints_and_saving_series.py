"""índices únicos y series de ahorros

Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
Create Date: 2026-11-09 19:00:00.000000

Agrega los índices únicos que protegen las reglas de negocio:

- habit_logs (habit_id, log_date)
- hour_entries (user_id, entry_date)
- pay_periods (user_id, start)
- pomodoro_logs: uno por (user_id, log_date, subject_id) y otro por (user_id, log_date) cuando no hay materia
  (índices parciales: los NULL no chocan entre sí)
- categories (user_id, scope, coalesce(kind, ''), lower(name))
- saving_entries (user_id, name, month) y (user_id, series_id, month)

Además agrega saving_entries.series_id (todas las filas mensuales de un mismo ahorro, agrupadas por usuario y nombre)
para que borrar o renombrar el ahorro del mes actual no lo reviva ni lo duplique.

La migración NUNCA borra datos: si hay filas duplicadas que impedirían un índice, se detiene con un mensaje que las
lista y no cambia nada. Se arreglan a mano (por ejemplo, borrando la fila sobrante) y se vuelve a correr.
"""
import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, Sequence[str], None] = 'b3c4d5e6f7a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (nombre del índice, tabla, expresión SQL del grupo, cláusula WHERE de duplicados opcional)
UNIQUE_RULES = [
    ('uq_habit_logs_habit_id_log_date', 'habit_logs', 'habit_id, log_date', None),
    ('uq_hour_entries_user_id_entry_date', 'hour_entries', 'user_id, entry_date', None),
    ('uq_pay_periods_user_id_start', 'pay_periods', 'user_id, start', None),
    ('uq_pomodoro_logs_user_id_log_date_subject', 'pomodoro_logs', 'user_id, log_date, subject_id', 'subject_id IS NOT NULL'),
    ('uq_pomodoro_logs_user_id_log_date_no_subject', 'pomodoro_logs', 'user_id, log_date', 'subject_id IS NULL'),
    ('uq_categories_user_scope_kind_name', 'categories', "user_id, scope, COALESCE(kind, ''), LOWER(name)", None),
    ('uq_saving_entries_user_id_name_month', 'saving_entries', 'user_id, name, month', None),
    ('uq_saving_entries_user_id_series_id_month', 'saving_entries', 'user_id, series_id, month', None),
]


def _find_duplicates(bind) -> list[str]:
    problems = []
    for index_name, table, group, condition in UNIQUE_RULES:
        if 'series_id' in group:
            continue  # la serie se arma a partir del nombre: un duplicado de (usuario, nombre, mes) ya lo detecta la otra regla
        where = f'WHERE {condition}' if condition else ''
        rows = bind.execute(sa.text(f'SELECT {group}, COUNT(*) AS n FROM {table} {where} GROUP BY {group} HAVING COUNT(*) > 1 LIMIT 5')).fetchall()
        if rows:
            examples = '; '.join('(' + ', '.join(str(value) for value in row[:-1]) + f') x{row[-1]}' for row in rows)
            problems.append(f'- {table} [{group}] repetidos, por ejemplo: {examples}  (índice {index_name})')
    return problems


def _backfill_series(bind) -> None:
    """Una serie por (usuario, nombre): los meses de un mismo ahorro se reconocían por el nombre."""
    rows = bind.execute(sa.text('SELECT DISTINCT user_id, name FROM saving_entries')).fetchall()
    for user_id, name in rows:
        bind.execute(
            sa.text('UPDATE saving_entries SET series_id = :series WHERE user_id = :user_id AND name = :name'),
            {'series': str(uuid.uuid4()), 'user_id': user_id, 'name': name},
        )


def upgrade() -> None:
    bind = op.get_bind()
    # Primero se revisan los duplicados, antes de cualquier cambio: en SQLite el DDL no es transaccional y un error a
    # mitad de camino dejaría la base a medias.
    problems = _find_duplicates(bind)
    if problems:
        raise RuntimeError(
            'No se pueden crear los índices únicos: hay filas duplicadas. No se cambió ningún dato; '
            'resolvelas a mano y volvé a correr la migración.' + chr(10) + chr(10).join(problems)
        )
    with op.batch_alter_table('saving_entries') as batch_op:
        batch_op.add_column(sa.Column('series_id', sa.String(length=36), nullable=True))
    _backfill_series(bind)
    with op.batch_alter_table('saving_entries') as batch_op:
        batch_op.alter_column('series_id', existing_type=sa.String(length=36), nullable=False)
        batch_op.create_index('ix_saving_entries_series_id', ['series_id'])

    op.create_index('uq_habit_logs_habit_id_log_date', 'habit_logs', ['habit_id', 'log_date'], unique=True)
    op.create_index('uq_hour_entries_user_id_entry_date', 'hour_entries', ['user_id', 'entry_date'], unique=True)
    op.create_index('uq_pay_periods_user_id_start', 'pay_periods', ['user_id', 'start'], unique=True)
    op.create_index(
        'uq_pomodoro_logs_user_id_log_date_subject', 'pomodoro_logs', ['user_id', 'log_date', 'subject_id'], unique=True,
        sqlite_where=sa.text('subject_id IS NOT NULL'), postgresql_where=sa.text('subject_id IS NOT NULL'),
    )
    op.create_index(
        'uq_pomodoro_logs_user_id_log_date_no_subject', 'pomodoro_logs', ['user_id', 'log_date'], unique=True,
        sqlite_where=sa.text('subject_id IS NULL'), postgresql_where=sa.text('subject_id IS NULL'),
    )
    op.create_index(
        'uq_categories_user_scope_kind_name', 'categories',
        ['user_id', 'scope', sa.text("COALESCE(kind, '')"), sa.text('LOWER(name)')], unique=True,
    )
    op.create_index('uq_saving_entries_user_id_name_month', 'saving_entries', ['user_id', 'name', 'month'], unique=True)
    op.create_index('uq_saving_entries_user_id_series_id_month', 'saving_entries', ['user_id', 'series_id', 'month'], unique=True)


def downgrade() -> None:
    op.drop_index('uq_saving_entries_user_id_series_id_month', table_name='saving_entries')
    op.drop_index('uq_saving_entries_user_id_name_month', table_name='saving_entries')
    op.drop_index('uq_categories_user_scope_kind_name', table_name='categories')
    op.drop_index('uq_pomodoro_logs_user_id_log_date_no_subject', table_name='pomodoro_logs')
    op.drop_index('uq_pomodoro_logs_user_id_log_date_subject', table_name='pomodoro_logs')
    op.drop_index('uq_pay_periods_user_id_start', table_name='pay_periods')
    op.drop_index('uq_hour_entries_user_id_entry_date', table_name='hour_entries')
    op.drop_index('uq_habit_logs_habit_id_log_date', table_name='habit_logs')
    with op.batch_alter_table('saving_entries') as batch_op:
        batch_op.drop_index('ix_saving_entries_series_id')
        batch_op.drop_column('series_id')
