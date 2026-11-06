"""link tasks and pomodoro logs to subjects

Revision ID: a1b2c3d4e5f6
Revises: e59976ec7ac0
Create Date: 2026-11-06 16:00:00.000000

Facultad: tareas y registros de Pomodoro pueden asociarse a una materia.
Solo agrega columnas nullable; no toca datos existentes.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'e59976ec7ac0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.add_column(sa.Column('subject_id', sa.Integer(), nullable=True))
        batch_op.create_index('ix_tasks_subject_id', ['subject_id'])
        batch_op.create_foreign_key('fk_tasks_subject_id_subjects', 'subjects', ['subject_id'], ['id'], ondelete='SET NULL')
    with op.batch_alter_table('pomodoro_logs') as batch_op:
        batch_op.add_column(sa.Column('subject_id', sa.Integer(), nullable=True))
        batch_op.create_index('ix_pomodoro_logs_subject_id', ['subject_id'])
        batch_op.create_foreign_key('fk_pomodoro_logs_subject_id_subjects', 'subjects', ['subject_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    with op.batch_alter_table('pomodoro_logs') as batch_op:
        batch_op.drop_constraint('fk_pomodoro_logs_subject_id_subjects', type_='foreignkey')
        batch_op.drop_index('ix_pomodoro_logs_subject_id')
        batch_op.drop_column('subject_id')
    with op.batch_alter_table('tasks') as batch_op:
        batch_op.drop_constraint('fk_tasks_subject_id_subjects', type_='foreignkey')
        batch_op.drop_index('ix_tasks_subject_id')
        batch_op.drop_column('subject_id')
