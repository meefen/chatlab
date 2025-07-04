#!/usr/bin/env python3
import subprocess
import sys
import os
import sqlite3

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"Running: {description}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running {description}: {e}")
        if e.stdout:
            print(f"stdout: {e.stdout}")
        if e.stderr:
            print(f"stderr: {e.stderr}")
        return False

def ensure_database_schema():
    """Ensure the database has the required columns"""
    db_path = "/data/app.db"
    print(f"Checking database schema at {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if conversations table has user_id column
        cursor.execute("PRAGMA table_info(conversations)")
        conversations_columns = [row[1] for row in cursor.fetchall()]
        
        if 'user_id' not in conversations_columns:
            print("Adding missing user_id column to conversations table...")
            cursor.execute("ALTER TABLE conversations ADD COLUMN user_id INTEGER")
        
        # Check if characters table has required columns  
        cursor.execute("PRAGMA table_info(characters)")
        characters_columns = [row[1] for row in cursor.fetchall()]
        
        if 'is_public' not in characters_columns:
            print("Adding missing is_public column to characters table...")
            cursor.execute("ALTER TABLE characters ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT 0")
            
        if 'created_by_id' not in characters_columns:
            print("Adding missing created_by_id column to characters table...")
            cursor.execute("ALTER TABLE characters ADD COLUMN created_by_id INTEGER")
        
        # Remove is_active column if it exists (we no longer need it)
        if 'is_active' in characters_columns:
            print("Removing deprecated is_active column from characters table...")
            # SQLite doesn't support DROP COLUMN easily, so we'll recreate the table
            # First, get the table structure and data (include id for preservation)
            cursor.execute("SELECT id, name, role, personality, avatar_url, is_public, created_by_id, created_at FROM characters")
            characters_data = cursor.fetchall()
            
            # Drop the old table
            cursor.execute("DROP TABLE characters")
            
            # Create the new table without is_active
            cursor.execute('''
                CREATE TABLE characters (
                    id INTEGER PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    role VARCHAR NOT NULL,
                    personality VARCHAR NOT NULL,
                    avatar_url VARCHAR,
                    is_public BOOLEAN NOT NULL DEFAULT 0,
                    created_by_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Re-insert the data with proper ID preservation
            for row in characters_data:
                cursor.execute('''
                    INSERT INTO characters (id, name, role, personality, avatar_url, is_public, created_by_id, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', row)
        
        conn.commit()
        conn.close()
        print("Database schema verified/updated")
        return True
        
    except Exception as e:
        print(f"Error updating database schema: {e}")
        return False

def main():
    """Run database migrations and start the server"""
    print("Starting application...")
    
    # Ensure database schema is correct first
    ensure_database_schema()
    
    # Try to run database migrations (may fail but that's ok)
    run_command("alembic upgrade head", "database migrations")
    
    # Start the FastAPI server
    print("Starting FastAPI server...")
    os.execvp("uvicorn", ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"])

if __name__ == "__main__":
    main()