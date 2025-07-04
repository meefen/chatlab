#!/usr/bin/env python3
"""
Direct SQLite script to insert educational theorist characters into the database.
These are built-in characters (created_by_id = NULL) that should be available to all users.
"""

import json
import sqlite3
from datetime import datetime

def load_characters_from_json(file_path):
    """Load character data from JSON file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def insert_characters():
    """Insert characters directly into SQLite database"""
    # Database connection
    db_path = "app.db"
    
    # Load character data
    characters_data = load_characters_from_json('characters_data.json')
    
    try:
        conn = sqlite3.connect(db_path, timeout=30.0)
        cursor = conn.cursor()
        
        # Enable WAL mode for better concurrency
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=30000")  # 30 second timeout
        
        for char_data in characters_data:
            # Check if character already exists by name to avoid duplicates
            cursor.execute("SELECT id FROM characters WHERE name = ?", (char_data['name'],))
            existing = cursor.fetchone()
            
            if existing:
                print(f"Character '{char_data['name']}' already exists, skipping...")
                continue
            
            # Insert new character (built-in character with created_by_id = NULL)
            cursor.execute("""
                INSERT INTO characters (name, role, personality, avatar_url, is_public, created_by_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                char_data['name'],
                char_data['role'],
                char_data['personality'],
                char_data.get('avatar_url'),
                char_data['is_public'],
                None,  # created_by_id = NULL for built-in characters
                datetime.now().isoformat()
            ))
            
            print(f"Added character: {char_data['name']}")
        
        conn.commit()
        print(f"\nSuccessfully processed {len(characters_data)} characters!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error inserting characters: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    insert_characters()