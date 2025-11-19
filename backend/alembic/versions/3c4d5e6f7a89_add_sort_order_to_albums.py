"""add sort_order to albums

Revision ID: 3c4d5e6f7a89
Revises: 1f2a3b4c5d67
Create Date: 2025-11-19
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '3c4d5e6f7a89'
down_revision: Union[str, None] = '1f2a3b4c5d67'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('albums', sa.Column('sort_order', sa.Integer(), nullable=True))
    # Optionally, initialize sort_order by id to keep stable order
    op.execute('UPDATE albums SET sort_order = id WHERE sort_order IS NULL')


def downgrade() -> None:
    op.drop_column('albums', 'sort_order')
