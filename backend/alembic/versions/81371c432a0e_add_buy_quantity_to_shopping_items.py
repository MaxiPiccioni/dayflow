"""add buy_quantity to shopping_items

Revision ID: 81371c432a0e
Revises: e7945ffcf34b
Create Date: 2026-09-03 22:59:08.730600

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '81371c432a0e'
down_revision: Union[str, Sequence[str], None] = 'e7945ffcf34b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('shopping_items', sa.Column('buy_quantity', sa.Integer(), nullable=False, server_default='1'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('shopping_items', 'buy_quantity')
