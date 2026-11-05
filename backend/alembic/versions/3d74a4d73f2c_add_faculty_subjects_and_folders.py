"""add faculty subjects and folders

Revision ID: 3d74a4d73f2c
Revises: 0efb524cfe57
Create Date: 2026-11-05 18:39:24.705893

Facultad, parte 1: materias por nivel con estado y nota final, y carpetas por
materia. Solo crea tablas nuevas; no toca datos existentes.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '3d74a4d73f2c'
down_revision: Union[str, Sequence[str], None] = '0efb524cfe57'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'subjects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('grade', sa.Numeric(precision=4, scale=2), nullable=True),
        sa.Column('icon', sa.String(length=40), nullable=False),
        sa.Column('color', sa.String(length=20), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_subjects_user_id_users'),
        sa.PrimaryKeyConstraint('id', name='pk_subjects'),
        sa.UniqueConstraint('user_id', 'name', name='uq_subjects_user_id_name'),
    )
    op.create_index('ix_subjects_user_id', 'subjects', ['user_id'], unique=False)
    op.create_table(
        'subject_folders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('subject_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=60), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], name='fk_subject_folders_subject_id_subjects', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_subject_folders_user_id_users'),
        sa.PrimaryKeyConstraint('id', name='pk_subject_folders'),
        sa.UniqueConstraint('subject_id', 'name', name='uq_subject_folders_subject_id_name'),
    )
    op.create_index('ix_subject_folders_subject_id', 'subject_folders', ['subject_id'], unique=False)
    op.create_index('ix_subject_folders_user_id', 'subject_folders', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_subject_folders_user_id', table_name='subject_folders')
    op.drop_index('ix_subject_folders_subject_id', table_name='subject_folders')
    op.drop_table('subject_folders')
    op.drop_index('ix_subjects_user_id', table_name='subjects')
    op.drop_table('subjects')
