"""
Temporary migration API endpoint for importing data
This will be removed after migration is complete
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any
import json
from datetime import datetime

from ..database import get_db
from ..models import User, Character, Conversation, Message

router = APIRouter()

@router.post("/import-data")
async def import_migration_data(
    data: Dict[str, List[Dict[str, Any]]], 
    db: Session = Depends(get_db)
):
    """Import migration data from SQLite export"""
    
    try:
        imported_counts = {}
        
        # Import users first (no dependencies)
        if 'users' in data:
            users_data = data['users']
            imported_count = 0
            
            for user_data in users_data:
                # Check if user already exists
                existing_user = db.query(User).filter_by(supabase_id=user_data['supabase_id']).first()
                if existing_user:
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
                db.add(user)
                imported_count += 1
            
            db.commit()
            imported_counts['users'] = imported_count
        
        # Import characters (depends on users for created_by_id)
        if 'characters' in data:
            characters_data = data['characters']
            imported_count = 0
            
            for char_data in characters_data:
                # Check if character already exists
                existing_char = db.query(Character).filter_by(name=char_data['name']).first()
                if existing_char:
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
                db.add(character)
                imported_count += 1
            
            db.commit()
            imported_counts['characters'] = imported_count
        
        # Import conversations (depends on users)
        if 'conversations' in data:
            conversations_data = data['conversations']
            imported_count = 0
            
            for conv_data in conversations_data:
                # Check if conversation already exists
                existing_conv = db.query(Conversation).filter_by(id=conv_data['id']).first()
                if existing_conv:
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
                db.add(conversation)
                imported_count += 1
            
            db.commit()
            imported_counts['conversations'] = imported_count
        
        # Import messages (depends on conversations and characters)
        if 'messages' in data:
            messages_data = data['messages']
            imported_count = 0
            
            for msg_data in messages_data:
                # Check if message already exists
                existing_msg = db.query(Message).filter_by(id=msg_data['id']).first()
                if existing_msg:
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
                db.add(message)
                imported_count += 1
            
            db.commit()
            imported_counts['messages'] = imported_count
        
        # Reset sequences for PostgreSQL auto-increment
        try:
            tables = [
                ('users', 'users_id_seq'),
                ('characters', 'characters_id_seq'), 
                ('conversations', 'conversations_id_seq'),
                ('messages', 'messages_id_seq')
            ]
            
            for table_name, sequence_name in tables:
                result = db.execute(text(f"SELECT MAX(id) FROM {table_name}")).scalar()
                max_id = result if result else 0
                db.execute(text(f"SELECT setval('{sequence_name}', {max_id + 1})"))
            
            db.commit()
            
        except Exception as e:
            print(f"Warning: Could not reset sequences: {e}")
        
        return {
            "success": True,
            "message": "Data imported successfully",
            "imported_counts": imported_counts,
            "total_records": sum(imported_counts.values())
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

@router.get("/import-status")
async def get_import_status(db: Session = Depends(get_db)):
    """Check current database status"""
    
    try:
        counts = {
            "users": db.query(User).count(),
            "characters": db.query(Character).count(),
            "conversations": db.query(Conversation).count(),
            "messages": db.query(Message).count()
        }
        
        return {
            "success": True,
            "current_counts": counts,
            "total_records": sum(counts.values())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")