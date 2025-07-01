#!/usr/bin/env python3
import subprocess
import sys
import os

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

def main():
    """Run database migrations and start the server"""
    print("Starting application...")
    
    # Run database migrations
    if run_command("alembic upgrade head", "database migrations"):
        print("Database migrations completed successfully")
    else:
        print("Database migrations failed, but continuing...")
    
    # Start the FastAPI server
    print("Starting FastAPI server...")
    os.execvp("uvicorn", ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"])

if __name__ == "__main__":
    main()