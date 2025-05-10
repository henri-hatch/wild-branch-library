"""create_libraries_table_and_update_books_table

Revision ID: c86f655d4c9b
Revises: a1b2c3d4e5f6
Create Date: 2025-05-10 01:00:34.737895

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c86f655d4c9b'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create libraries table
    op.create_table(
        'libraries',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
    )
    op.create_index('ix_libraries_id', 'libraries', ['id'])

    # Add default library for each user to avoid breaking existing books
    op.execute("""
    INSERT INTO libraries (name, user_id)
    SELECT 'Default Library', id FROM users
    """)

    # Add library_id column to books table
    op.add_column('books', sa.Column('library_id', sa.Integer(), nullable=True))
    
    # Create foreign key constraint
    op.create_foreign_key('fk_books_library_id', 'books', 'libraries', ['library_id'], ['id'])

    # Update existing books to use the default library for each user
    op.execute("""
    UPDATE books
    SET library_id = (
        SELECT id FROM libraries 
        WHERE user_id = books.owner_id 
        ORDER BY id ASC 
        LIMIT 1
    )
    """)

    # Make library_id non-nullable after updating existing books
    op.alter_column('books', 'library_id', nullable=False)
    
    # Rename location column to old_location to keep data temporarily
    op.alter_column('books', 'location', new_column_name='old_location', nullable=True)


def downgrade() -> None:
    # Rename old_location back to location
    op.alter_column('books', 'old_location', new_column_name='location', nullable=False)
    
    # Remove library_id column from books
    op.drop_constraint('fk_books_library_id', 'books', type_='foreignkey')
    op.drop_column('books', 'library_id')
    
    # Drop libraries table
    op.drop_index('ix_libraries_id', 'libraries')
    op.drop_table('libraries')
