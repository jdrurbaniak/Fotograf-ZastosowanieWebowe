"""add thumbnail_url to photos

Revision ID: dce6d3998db6
Revises: 3c4d5e6f7a89
Create Date: 2025-12-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dce6d3998db6'
down_revision: Union[str, Sequence[str], None] = '3c4d5e6f7a89'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('photos', sa.Column('thumbnail_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('photos', 'thumbnail_url')
