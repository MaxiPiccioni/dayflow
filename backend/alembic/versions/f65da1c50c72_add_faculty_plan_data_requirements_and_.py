"""add faculty plan data, requirements and notes

Revision ID: f65da1c50c72
Revises: 3d74a4d73f2c
Create Date: 2026-11-05 19:20:00.000000

Facultad, parte 2: datos del plan (código, electiva y créditos, modalidad,
carga horaria), anotaciones y correlativas. Las columnas nuevas llevan
server_default para que las materias que ya existen queden válidas
(elective=false, notes=''). Los cambios en subjects van en batch porque
SQLite no puede agregar un constraint único con ALTER TABLE.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'f65da1c50c72'
down_revision: Union[str, Sequence[str], None] = '3d74a4d73f2c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('subjects') as batch_op:
        batch_op.add_column(sa.Column('code', sa.String(length=10), nullable=True))
        batch_op.add_column(sa.Column('elective', sa.Boolean(), server_default=sa.false(), nullable=False))
        batch_op.add_column(sa.Column('credits', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('modality', sa.String(length=10), nullable=True))
        batch_op.add_column(sa.Column('weekly_hours', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('notes', sa.Text(), server_default='', nullable=False))
        batch_op.create_unique_constraint('uq_subjects_user_id_code', ['user_id', 'code'])

    op.create_table(
        'subject_requirements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('required_id', sa.Integer(), nullable=False),
        sa.Column('kind', sa.String(length=10), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_subject_requirements_user_id_users'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], name='fk_subject_requirements_subject_id_subjects', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['required_id'], ['subjects.id'], name='fk_subject_requirements_required_id_subjects', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='pk_subject_requirements'),
        sa.UniqueConstraint('subject_id', 'required_id', name='uq_subject_requirements_subject_id_required_id'),
    )
    op.create_index('ix_subject_requirements_user_id', 'subject_requirements', ['user_id'], unique=False)
    op.create_index('ix_subject_requirements_subject_id', 'subject_requirements', ['subject_id'], unique=False)
    op.create_index('ix_subject_requirements_required_id', 'subject_requirements', ['required_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_subject_requirements_required_id', table_name='subject_requirements')
    op.drop_index('ix_subject_requirements_subject_id', table_name='subject_requirements')
    op.drop_index('ix_subject_requirements_user_id', table_name='subject_requirements')
    op.drop_table('subject_requirements')

    with op.batch_alter_table('subjects') as batch_op:
        batch_op.drop_constraint('uq_subjects_user_id_code', type_='unique')
        batch_op.drop_column('notes')
        batch_op.drop_column('weekly_hours')
        batch_op.drop_column('modality')
        batch_op.drop_column('credits')
        batch_op.drop_column('elective')
        batch_op.drop_column('code')
