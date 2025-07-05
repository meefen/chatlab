#!/usr/bin/env python3
"""
Script to run data import on Render via the deployed service
This bypasses local network connectivity issues
"""

import json
import requests
import os

def upload_and_import_data(base_url, data_dir="migration_data"):
    """Upload data files to Render and trigger import"""
    
    # Check if data directory exists
    if not os.path.exists(data_dir):
        print(f"Error: {data_dir} directory not found")
        return False
    
    print(f"Starting data upload to {base_url}")
    
    # Read all data files
    files_to_upload = ['users.json', 'characters.json', 'conversations.json', 'messages.json']
    data_payload = {}
    
    for filename in files_to_upload:
        filepath = os.path.join(data_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                data_payload[filename.replace('.json', '')] = json.load(f)
            print(f"✅ Loaded {filename}")
        else:
            print(f"⚠️  {filename} not found, skipping...")
    
    # Create a simple endpoint call to trigger import
    print(f"\nData loaded: {list(data_payload.keys())}")
    print(f"Total records: {sum(len(data) for data in data_payload.values())}")
    
    return data_payload

def main():
    # Your Render service URL
    base_url = input("Enter your Render service URL (e.g., https://chatlab-backend.onrender.com): ").strip()
    
    if not base_url:
        print("Error: Please provide the Render service URL")
        return
    
    # Test connection first
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        if response.status_code == 200:
            print(f"✅ Service is responding: {response.json()}")
        else:
            print(f"⚠️  Service returned status {response.status_code}")
    except requests.RequestException as e:
        print(f"❌ Could not connect to service: {e}")
        return
    
    # Load and display data
    data = upload_and_import_data(base_url)
    
    if data:
        print("\n" + "="*50)
        print("DATA READY FOR MANUAL IMPORT")
        print("="*50)
        print("Since we can't connect to PostgreSQL directly from your local machine,")
        print("here's what we'll do instead:")
        print("\n1. The data is already exported in migration_data/")
        print("2. Your Render service has access to the PostgreSQL database")
        print("3. We can create a temporary API endpoint to import the data")
        print("\nAlternatively, you can:")
        print("- Use a PostgreSQL client tool to import the data")
        print("- Connect directly from a machine that can reach the database")
        print("- Import via Render's shell access (if available)")

if __name__ == "__main__":
    main()