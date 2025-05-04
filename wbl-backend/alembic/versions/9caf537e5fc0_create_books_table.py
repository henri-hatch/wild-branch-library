"""create_books_table

Revision ID: 9caf537e5fc0
Revises: ebc0d6244061
Create Date: 2025-05-03 16:01:57.828182

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9caf537e5fc0'
down_revision: Union[str, None] = 'ebc0d6244061'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'books',
        sa.Column('isbn', sa.String(20), nullable=True, unique=True, index=True, primary_key=True),
        sa.Column('title', sa.String(255), nullable=False, index=True),
        sa.Column('author', sa.String(255), nullable=False, index=True),
        sa.Column('genre', sa.String(100), nullable=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('cover_image', sa.String(255), nullable=True),
        sa.Column('is_available', sa.Boolean, default=True),
        sa.Column('owner_id', sa.Integer, sa.ForeignKey('users.id'), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('books')
