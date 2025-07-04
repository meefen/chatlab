"""remove_is_active_column_from_characters

Revision ID: 0c33def2c20e
Revises: 3acc70e860d9
Create Date: 2025-07-03 22:28:15.910488

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0c33def2c20e'
down_revision: Union[str, None] = '3acc70e860d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove is_active column from characters table
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Get existing columns
    characters_columns = [col['name'] for col in inspector.get_columns('characters')]
    
    # Remove is_active column if it exists
    if 'is_active' in characters_columns:
        with op.batch_alter_table('characters', schema=None) as batch_op:
            batch_op.drop_column('is_active')


def downgrade() -> None:
    # Add back is_active column
    with op.batch_alter_table('characters', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'))
