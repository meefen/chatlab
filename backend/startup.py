#!/usr/bin/env python3
import subprocess
import sys
import os
import logging
from app.config import settings
from app.database import get_database_info

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_command(command, description):
    """Run a command and handle errors"""
    logger.info(f"Running: {description}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        if result.stdout:
            logger.info(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Error running {description}: {e}")
        if e.stdout:
            logger.error(f"stdout: {e.stdout}")
        if e.stderr:
            logger.error(f"stderr: {e.stderr}")
        return False

def ensure_database_connection():
    """Ensure database connection is working"""
    try:
        db_info = get_database_info()
        logger.info(f"Database configuration: {db_info}")
        
        # Import here to avoid circular imports
        from app.database import engine
        
        # Test database connection
        with engine.connect() as conn:
            logger.info("Database connection successful")
            return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False

def run_migrations():
    """Run database migrations"""
    logger.info("Running database migrations...")
    
    # For PostgreSQL, we'll use Alembic migrations
    if settings.is_postgresql:
        logger.info("Using PostgreSQL - running Alembic migrations")
        success = run_command("alembic upgrade head", "Alembic database migrations")
        if not success:
            logger.warning("Alembic migrations failed, attempting to create tables directly")
            try:
                from app.database import create_tables
                import asyncio
                asyncio.run(create_tables())
                logger.info("Tables created successfully")
                return True
            except Exception as e:
                logger.error(f"Failed to create tables: {e}")
                return False
        return success
    else:
        # For SQLite, use the legacy schema update method
        logger.info("Using SQLite - running legacy schema updates")
        return ensure_sqlite_schema()

def ensure_sqlite_schema():
    """Ensure SQLite database has the required schema (legacy support)"""
    try:
        import sqlite3
        db_path = settings.get_database_url().replace("sqlite:///", "")
        logger.info(f"Checking SQLite schema at {db_path}")
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if conversations table has user_id column
        cursor.execute("PRAGMA table_info(conversations)")
        conversations_columns = [row[1] for row in cursor.fetchall()]
        
        if 'user_id' not in conversations_columns:
            logger.info("Adding missing user_id column to conversations table...")
            cursor.execute("ALTER TABLE conversations ADD COLUMN user_id INTEGER")
        
        # Check if characters table has required columns  
        cursor.execute("PRAGMA table_info(characters)")
        characters_columns = [row[1] for row in cursor.fetchall()]
        
        if 'is_public' not in characters_columns:
            logger.info("Adding missing is_public column to characters table...")
            cursor.execute("ALTER TABLE characters ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT 0")
            
        if 'created_by_id' not in characters_columns:
            logger.info("Adding missing created_by_id column to characters table...")
            cursor.execute("ALTER TABLE characters ADD COLUMN created_by_id INTEGER")
        
        conn.commit()
        conn.close()
        logger.info("SQLite schema verified/updated")
        return True
        
    except Exception as e:
        logger.error(f"Error updating SQLite schema: {e}")
        return False

def main():
    """Run database setup and start the server"""
    logger.info("Starting ChatLab backend...")
    
    # Log environment information
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database type: {'PostgreSQL' if settings.is_postgresql else 'SQLite'}")
    
    # Ensure database connection
    if not ensure_database_connection():
        logger.error("Database connection failed. Exiting.")
        sys.exit(1)
    
    # Run migrations
    if not run_migrations():
        logger.error("Database migrations failed. Exiting.")
        sys.exit(1)
    
    # Start the FastAPI server
    logger.info("Starting FastAPI server...")
    port = os.getenv("PORT", str(settings.PORT))
    host = settings.HOST
    
    os.execvp("uvicorn", [
        "uvicorn", 
        "app.main:app", 
        "--host", host, 
        "--port", port,
        "--log-level", "info"
    ])

if __name__ == "__main__":
    main()