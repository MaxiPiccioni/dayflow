"""categorías por id: tareas, eventos, movimientos y compras apuntan a categories

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-11-09 20:00:00.000000

Antes cada fila guardaba el NOMBRE de su categoría (tasks.category, events.type, transactions.category,
shopping_items.category). Ahora guarda category_id (FK a categories, ON DELETE SET NULL).

Conversión de datos, por usuario y ámbito (agenda para tareas y eventos, finance con su tipo para movimientos,
shopping para compras): se busca la categoría por nombre sin distinguir mayúsculas y, si no existe (el nombre era
texto libre), se CREA. Al final se verifica que no quede ninguna fila con nombre y sin category_id; si queda alguna,
la migración falla y no borra las columnas viejas.

Las columnas de nombre se eliminan al final. En el downgrade se vuelven a crear y se llenan con el nombre de la categoría.

Hacer un backup antes de aplicarla en producción: se borran columnas.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, Sequence[str], None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (tabla, columna con el nombre, largo, ámbito, columna del tipo o None)
TABLES = [
    ('tasks', 'category', 50, 'agenda', None),
    ('events', 'type', 30, 'agenda', None),
    ('transactions', 'category', 50, 'finance', 'kind'),
    ('shopping_items', 'category', 50, 'shopping', None),
]


def _key(user_id, scope, kind, name) -> tuple:
    return (user_id, scope, kind or '', name.strip().casefold())


def upgrade() -> None:
    bind = op.get_bind()
    for table, _, _, _, _ in TABLES:
        with op.batch_alter_table(table) as batch_op:
            batch_op.add_column(sa.Column('category_id', sa.Integer(), nullable=True))
            batch_op.create_index(f'ix_{table}_category_id', ['category_id'])
            batch_op.create_foreign_key(f'fk_{table}_category_id_categories', 'categories', ['category_id'], ['id'], ondelete='SET NULL')

    existing = {}
    for category_id, user_id, scope, kind, name in bind.execute(sa.text('SELECT id, user_id, scope, kind, name FROM categories')).fetchall():
        existing.setdefault(_key(user_id, scope, kind, name), category_id)

    for table, column, _, scope, kind_column in TABLES:
        kind_select = f', {kind_column}' if kind_column else ', NULL'
        rows = bind.execute(sa.text(f'SELECT DISTINCT user_id, {column}{kind_select} FROM {table} WHERE {column} IS NOT NULL AND TRIM({column}) <> \'\'')).fetchall()
        for user_id, name, kind in rows:
            key = _key(user_id, scope, kind, name)
            if key not in existing:
                bind.execute(
                    sa.text('INSERT INTO categories (user_id, name, scope, kind) VALUES (:user_id, :name, :scope, :kind)'),
                    {'user_id': user_id, 'name': name.strip(), 'scope': scope, 'kind': kind},
                )
                existing[key] = bind.execute(
                    sa.text('SELECT id FROM categories WHERE user_id = :user_id AND scope = :scope AND name = :name AND COALESCE(kind, \'\') = :kind'),
                    {'user_id': user_id, 'scope': scope, 'name': name.strip(), 'kind': kind or ''},
                ).scalar()
            bind.execute(
                sa.text(f'UPDATE {table} SET category_id = :category_id WHERE user_id = :user_id AND {column} = :name' + (f' AND {kind_column} = :kind' if kind_column else '')),
                {'category_id': existing[key], 'user_id': user_id, 'name': name, **({'kind': kind} if kind_column else {})},
            )
        pending = bind.execute(sa.text(f'SELECT COUNT(*) FROM {table} WHERE category_id IS NULL AND {column} IS NOT NULL AND TRIM({column}) <> \'\'')).scalar()
        if pending:
            raise RuntimeError(f'{table}: {pending} fila(s) quedaron sin category_id. No se borró ninguna columna.')

    for table, column, _, _, _ in TABLES:
        with op.batch_alter_table(table) as batch_op:
            batch_op.drop_column(column)


def downgrade() -> None:
    for table, column, length, _, _ in TABLES:
        with op.batch_alter_table(table) as batch_op:
            batch_op.add_column(sa.Column(column, sa.String(length=length), nullable=True))
        op.execute(sa.text(f'UPDATE {table} SET {column} = (SELECT name FROM categories WHERE categories.id = {table}.category_id) WHERE category_id IS NOT NULL'))
    for table, _, _, _, _ in TABLES:
        with op.batch_alter_table(table) as batch_op:
            batch_op.drop_constraint(f'fk_{table}_category_id_categories', type_='foreignkey')
            batch_op.drop_index(f'ix_{table}_category_id')
            batch_op.drop_column('category_id')
