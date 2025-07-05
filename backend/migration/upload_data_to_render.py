#!/usr/bin/env python3
"""
Upload migration data to Render service
"""

import json
import requests
import os

def load_migration_data(data_dir="migration_data"):
    """Load all migration data files"""
    
    files_to_load = ['users.json', 'characters.json', 'conversations.json', 'messages.json']
    data_payload = {}
    
    for filename in files_to_load:
        filepath = os.path.join(data_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                data_payload[filename.replace('.json', '')] = json.load(f)
            print(f"✅ Loaded {filename} ({len(data_payload[filename.replace('.json', '')])} records)")
        else:
            print(f"⚠️  {filename} not found, skipping...")
            data_payload[filename.replace('.json', '')] = []
    
    return data_payload

def upload_to_render(base_url, data):
    """Upload data to Render service"""
    
    print(f"\n🚀 Uploading data to {base_url}/api/migration/import-data")
    
    try:
        response = requests.post(
            f"{base_url}/api/migration/import-data",
            json=data,
            timeout=300  # 5 minutes timeout for large imports
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Import successful!")
            print(f"📊 Import summary: {result['imported_counts']}")
            print(f"📈 Total records imported: {result['total_records']}")
            return True
        else:
            print(f"❌ Import failed with status {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except requests.RequestException as e:
        print(f"❌ Connection error: {e}")
        return False

def check_status(base_url):
    """Check current database status"""
    
    try:
        response = requests.get(f"{base_url}/api/migration/import-status", timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("📊 Current database status:")
            for table, count in result['current_counts'].items():
                print(f"  {table}: {count} records")
            print(f"Total: {result['total_records']} records")
        else:
            print(f"⚠️  Status check failed: {response.status_code}")
            
    except requests.RequestException as e:
        print(f"❌ Status check error: {e}")

def main():
    # Your Render service URL
    base_url = "https://chatlab-backend.onrender.com"  # Update this if different
    
    print("🔄 ChatLab Data Migration to Render")
    print("="*40)
    
    # Test connection
    print(f"🔍 Testing connection to {base_url}...")
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        if response.status_code == 200:
            print(f"✅ Service is responding: {response.json()}")
        else:
            print(f"⚠️  Service returned status {response.status_code}")
            return
    except requests.RequestException as e:
        print(f"❌ Could not connect to service: {e}")
        print("Please check that your Render service is running.")
        return
    
    # Check current status
    print(f"\n📊 Checking current database status...")
    check_status(base_url)
    
    # Load migration data
    print(f"\n📂 Loading migration data...")
    data = load_migration_data()
    
    total_records = sum(len(records) for records in data.values())
    print(f"\n📋 Ready to import {total_records} total records")
    
    # Confirm before importing
    if total_records == 0:
        print("❌ No data to import. Make sure migration_data/ directory exists with JSON files.")
        return
    
    # Auto-proceed for automation
    print(f"\n🚀 Proceeding with import of {total_records} records...")
    
    # Upload data
    success = upload_to_render(base_url, data)
    
    if success:
        print(f"\n📊 Final database status:")
        check_status(base_url)
        print(f"\n🎉 Migration completed successfully!")
        print(f"🌐 Your API is now available at: {base_url}")
        print(f"🧪 Test it: {base_url}/api/characters")
    else:
        print(f"\n❌ Migration failed. Check the error messages above.")

if __name__ == "__main__":
    main()