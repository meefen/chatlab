#!/usr/bin/env python3
"""
SQLite Data Export Script for Migration to PostgreSQL

This script exports all data from the SQLite database to JSON format
for migration to PostgreSQL on Render.
"""

import json
import sqlite3
from datetime import datetime
import os
from pathlib import Path

def export_sqlite_data(db_path: str, output_dir: str = "migration_data"):
    """Export SQLite database data to JSON files"""
    
    # Create output directory
    Path(output_dir).mkdir(exist_ok=True)
    
    # Connect to SQLite database
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # This allows access by column name
    cursor = conn.cursor()
    
    # Export each table
    tables = ['users', 'characters', 'conversations', 'messages']
    
    for table in tables:
        try:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            
            # Convert rows to list of dictionaries
            data = []
            for row in rows:
                row_dict = {}
                for key in row.keys():
                    value = row[key]
                    # Handle datetime strings and JSON fields
                    if key in ['created_at', 'updated_at'] and value:
                        # Keep datetime strings as-is for PostgreSQL compatibility
                        row_dict[key] = value
                    elif key == 'participant_ids' and value:
                        # Parse JSON field if it's a string
                        try:
                            row_dict[key] = json.loads(value) if isinstance(value, str) else value
                        except (json.JSONDecodeError, TypeError):
                            row_dict[key] = value
                    else:
                        row_dict[key] = value
                data.append(row_dict)
            
            # Write to JSON file
            output_file = os.path.join(output_dir, f"{table}.json")
            with open(output_file, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            
            print(f"Exported {len(data)} records from {table} to {output_file}")
            
        except sqlite3.Error as e:
            print(f"Error exporting {table}: {e}")
    
    conn.close()
    
    # Create summary file
    summary = {
        "export_timestamp": datetime.now().isoformat(),
        "source_database": db_path,
        "tables_exported": tables,
        "export_directory": output_dir
    }
    
    with open(os.path.join(output_dir, "export_summary.json"), 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\nData export completed successfully!")
    print(f"Export summary saved to {os.path.join(output_dir, 'export_summary.json')}")

def main():
    """Main function to run the export"""
    
    # Try different possible database paths
    db_paths = [
        "/data/app.db",  # Production path in Fly.io
        "app.db",        # Local development path
        "./app.db"       # Alternative local path
    ]
    
    db_path = None
    for path in db_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print("Error: Could not find SQLite database file")
        print("Looked in the following locations:")
        for path in db_paths:
            print(f"  - {path}")
        return
    
    print(f"Found database at: {db_path}")
    
    # Export data
    export_sqlite_data(db_path)

if __name__ == "__main__":
    main()