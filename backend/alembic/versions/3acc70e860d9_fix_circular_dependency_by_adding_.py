"""Fix circular dependency by adding columns separately

Revision ID: 3acc70e860d9
Revises: 0b264938d458
Create Date: 2025-07-01 09:16:40.982415

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3acc70e860d9'
down_revision: Union[str, None] = '0b264938d458'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Since the previous migration failed, we need to check if columns exist before adding them
    # This migration will be a no-op if columns already exist, or add missing columns if they don't
    
    # Check and add is_public column to characters if it doesn't exist
    import sqlalchemy as sa
    from sqlalchemy import inspect
    
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Get existing columns
    characters_columns = [col['name'] for col in inspector.get_columns('characters')]
    conversations_columns = [col['name'] for col in inspector.get_columns('conversations')]
    
    # Add missing columns to characters table
    if 'is_public' not in characters_columns:
        with op.batch_alter_table('characters', schema=None) as batch_op:
            batch_op.add_column(sa.Column('is_public', sa.Boolean(), nullable=False, server_default='1'))
    
    if 'created_by_id' not in characters_columns:
        with op.batch_alter_table('characters', schema=None) as batch_op:
            batch_op.add_column(sa.Column('created_by_id', sa.Integer(), nullable=True))
    
    # Add foreign key constraint if it doesn't exist
    try:
        with op.batch_alter_table('characters', schema=None) as batch_op:
            batch_op.create_foreign_key('fk_characters_created_by', 'users', ['created_by_id'], ['id'])
    except:
        pass  # Foreign key might already exist

    # Add missing column to conversations table
    if 'user_id' not in conversations_columns:
        with op.batch_alter_table('conversations', schema=None) as batch_op:
            batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))
        
        # Add foreign key constraint
        try:
            with op.batch_alter_table('conversations', schema=None) as batch_op:
                batch_op.create_foreign_key('fk_conversations_user', 'users', ['user_id'], ['id'])
        except:
            pass  # Foreign key might already exist


def downgrade() -> None:
    # Remove foreign key constraints and columns
    try:
        with op.batch_alter_table('conversations', schema=None) as batch_op:
            batch_op.drop_constraint('fk_conversations_user', type_='foreignkey')
            batch_op.drop_column('user_id')
    except:
        pass
        
    try:
        with op.batch_alter_table('characters', schema=None) as batch_op:
            batch_op.drop_constraint('fk_characters_created_by', type_='foreignkey')
            batch_op.drop_column('created_by_id')
            batch_op.drop_column('is_public')
    except:
        pass
