#!/usr/bin/env python3
"""
PostgreSQL Data Import Script

This script imports data from JSON files (exported from SQLite) into PostgreSQL
for the migration to Render.
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.models import User, Character, Conversation, Message
from app.database import Base

def load_json_data(file_path: str):
    """Load data from JSON file"""
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: {file_path} not found")
        return []
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON from {file_path}: {e}")
        return []

def import_users(session, data):
    """Import users data"""
    if not data:
        print("No users data to import")
        return
    
    print(f"Importing {len(data)} users...")
    imported_count = 0
    
    for user_data in data:
        try:
            # Check if user already exists
            existing_user = session.query(User).filter_by(supabase_id=user_data['supabase_id']).first()
            if existing_user:
                print(f"User {user_data['email']} already exists, skipping...")
                continue
            
            user = User(
                supabase_id=user_data['supabase_id'],
                email=user_data['email'],
                full_name=user_data.get('full_name'),
                avatar_url=user_data.get('avatar_url'),
                is_active=user_data.get('is_active', True),
                created_at=datetime.fromisoformat(user_data['created_at'].replace('Z', '+00:00')) if user_data.get('created_at') else None,
                updated_at=datetime.fromisoformat(user_data['updated_at'].replace('Z', '+00:00')) if user_data.get('updated_at') else None
            )
            session.add(user)
            imported_count += 1
            
        except Exception as e:
            print(f"Error importing user {user_data.get('email', 'unknown')}: {e}")
    
    session.commit()
    print(f"Successfully imported {imported_count} users")

def import_characters(session, data):
    """Import characters data"""
    if not data:
        print("No characters data to import")
        return
    
    print(f"Importing {len(data)} characters...")
    imported_count = 0
    
    for char_data in data:
        try:
            # Check if character already exists
            existing_char = session.query(Character).filter_by(name=char_data['name']).first()
            if existing_char:
                print(f"Character {char_data['name']} already exists, skipping...")
                continue
            
            character = Character(
                name=char_data['name'],
                role=char_data['role'],
                personality=char_data['personality'],
                avatar_url=char_data.get('avatar_url'),
                is_public=char_data.get('is_public', False),
                created_by_id=char_data.get('created_by_id'),
                created_at=datetime.fromisoformat(char_data['created_at'].replace('Z', '+00:00')) if char_data.get('created_at') else None
            )
            session.add(character)
            imported_count += 1
            
        except Exception as e:
            print(f"Error importing character {char_data.get('name', 'unknown')}: {e}")
    
    session.commit()
    print(f"Successfully imported {imported_count} characters")

def import_conversations(session, data):
    """Import conversations data"""
    if not data:
        print("No conversations data to import")
        return
    
    print(f"Importing {len(data)} conversations...")
    imported_count = 0
    
    for conv_data in data:
        try:
            # Check if conversation already exists
            existing_conv = session.query(Conversation).filter_by(id=conv_data['id']).first()
            if existing_conv:
                print(f"Conversation {conv_data['id']} already exists, skipping...")
                continue
            
            conversation = Conversation(
                id=conv_data['id'],
                title=conv_data['title'],
                participant_ids=conv_data['participant_ids'],
                user_id=conv_data['user_id'],
                is_autonomous=conv_data.get('is_autonomous', False),
                current_turn=conv_data.get('current_turn', 0),
                created_at=datetime.fromisoformat(conv_data['created_at'].replace('Z', '+00:00')) if conv_data.get('created_at') else None,
                updated_at=datetime.fromisoformat(conv_data['updated_at'].replace('Z', '+00:00')) if conv_data.get('updated_at') else None
            )
            session.add(conversation)
            imported_count += 1
            
        except Exception as e:
            print(f"Error importing conversation {conv_data.get('id', 'unknown')}: {e}")
    
    session.commit()
    print(f"Successfully imported {imported_count} conversations")

def import_messages(session, data):
    """Import messages data"""
    if not data:
        print("No messages data to import")
        return
    
    print(f"Importing {len(data)} messages...")
    imported_count = 0
    
    for msg_data in data:
        try:
            # Check if message already exists
            existing_msg = session.query(Message).filter_by(id=msg_data['id']).first()
            if existing_msg:
                print(f"Message {msg_data['id']} already exists, skipping...")
                continue
            
            message = Message(
                id=msg_data['id'],
                conversation_id=msg_data['conversation_id'],
                character_id=msg_data.get('character_id'),
                content=msg_data['content'],
                is_user_prompt=msg_data.get('is_user_prompt', False),
                turn_number=msg_data['turn_number'],
                created_at=datetime.fromisoformat(msg_data['created_at'].replace('Z', '+00:00')) if msg_data.get('created_at') else None
            )
            session.add(message)
            imported_count += 1
            
        except Exception as e:
            print(f"Error importing message {msg_data.get('id', 'unknown')}: {e}")
    
    session.commit()
    print(f"Successfully imported {imported_count} messages")

def reset_sequences(session):
    """Reset PostgreSQL sequences for auto-increment fields"""
    try:
        print("Resetting PostgreSQL sequences...")
        
        # Get the maximum IDs from each table
        tables = [
            ('users', 'users_id_seq'),
            ('characters', 'characters_id_seq'),
            ('conversations', 'conversations_id_seq'),
            ('messages', 'messages_id_seq')
        ]
        
        for table_name, sequence_name in tables:
            result = session.execute(text(f"SELECT MAX(id) FROM {table_name}")).scalar()
            max_id = result if result else 0
            
            # Reset the sequence to max_id + 1
            session.execute(text(f"SELECT setval('{sequence_name}', {max_id + 1})"))
            print(f"Reset {sequence_name} to {max_id + 1}")
        
        session.commit()
        print("Successfully reset all sequences")
        
    except Exception as e:
        print(f"Error resetting sequences: {e}")

def main():
    """Main function to run the import"""
    
    # Check if we're using PostgreSQL
    if not settings.is_postgresql:
        print("Error: This script is for PostgreSQL migration only")
        print(f"Current database URL: {settings.get_database_url()}")
        return
    
    # Create database engine and session
    engine = create_engine(settings.get_database_url())
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Create all tables
    print("Creating database tables...")
    Base.metadata.create_all(engine)
    
    # Load data from JSON files
    data_dir = "migration_data"
    if not os.path.exists(data_dir):
        print(f"Error: Migration data directory '{data_dir}' not found")
        print("Please run the SQLite export script first")
        return
    
    print(f"Loading data from {data_dir}...")
    
    users_data = load_json_data(os.path.join(data_dir, "users.json"))
    characters_data = load_json_data(os.path.join(data_dir, "characters.json"))
    conversations_data = load_json_data(os.path.join(data_dir, "conversations.json"))
    messages_data = load_json_data(os.path.join(data_dir, "messages.json"))
    
    # Import data in order (respecting foreign key constraints)
    try:
        print("Starting data import...")
        
        # Import users first (no dependencies)
        import_users(session, users_data)
        
        # Import characters next (depends on users for created_by_id)
        import_characters(session, characters_data)
        
        # Import conversations (depends on users)
        import_conversations(session, conversations_data)
        
        # Import messages last (depends on conversations and characters)
        import_messages(session, messages_data)
        
        # Reset sequences for auto-increment fields
        reset_sequences(session)
        
        print("\nData import completed successfully!")
        
        # Print summary
        print("\nImport summary:")
        print(f"- Users: {session.query(User).count()}")
        print(f"- Characters: {session.query(Character).count()}")
        print(f"- Conversations: {session.query(Conversation).count()}")
        print(f"- Messages: {session.query(Message).count()}")
        
    except Exception as e:
        print(f"Error during import: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    main()