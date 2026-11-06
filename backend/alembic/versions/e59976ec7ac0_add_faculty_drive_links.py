"""add faculty drive links

Revision ID: e59976ec7ac0
Revises: f65da1c50c72
Create Date: 2026-11-06 10:00:00.000000

Facultad: link de Drive (drive_url) por materia y por carpeta, y archivos de
cada carpeta (folder_links), guardados como links que se abren en otra
pestaña. Los archivos no se suben a la app. Solo agrega columnas nullable y
una tabla nueva; no toca datos existentes.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'e59976ec7ac0'
down_revision: Union[str, Sequence[str], None] = 'f65da1c50c72'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('subjects') as batch_op:
        batch_op.add_column(sa.Column('drive_url', sa.String(length=2000), nullable=True))
    with op.batch_alter_table('subject_folders') as batch_op:
        batch_op.add_column(sa.Column('drive_url', sa.String(length=2000), nullable=True))

    op.create_table(
        'folder_links',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('folder_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=120), nullable=False),
        sa.Column('url', sa.String(length=2000), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_folder_links_user_id_users'),
        sa.ForeignKeyConstraint(['folder_id'], ['subject_folders.id'], name='fk_folder_links_folder_id_subject_folders', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='pk_folder_links'),
    )
    op.create_index('ix_folder_links_user_id', 'folder_links', ['user_id'], unique=False)
    op.create_index('ix_folder_links_folder_id', 'folder_links', ['folder_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_folder_links_folder_id', table_name='folder_links')
    op.drop_index('ix_folder_links_user_id', table_name='folder_links')
    op.drop_table('folder_links')
    with op.batch_alter_table('subject_folders') as batch_op:
        batch_op.drop_column('drive_url')
    with op.batch_alter_table('subjects') as batch_op:
        batch_op.drop_column('drive_url')
