# Migration Files

This folder contains files used for migrating from Fly.io (SQLite) to Render (PostgreSQL).

## Files

- **export_sqlite_data.py** - Export data from SQLite to JSON
- **import_postgresql_data.py** - Import data from JSON to PostgreSQL
- **upload_data_to_render.py** - Upload data via API endpoint
- **run_import_on_render.py** - Alternative import helper
- **requirements-render.txt** - Alternative requirements with looser constraints
- **migration_data/** - Exported JSON data files

## Usage

These files were used during the one-time migration process. They can be kept for reference or removed if migration is complete and stable.

## Migration Process

1. Export SQLite data: `python migration/export_sqlite_data.py`
2. Import to PostgreSQL: `DATABASE_URL="postgresql://..." python migration/import_postgresql_data.py`
3. Alternative: Upload via API: `python migration/upload_data_to_render.py`

See `/MIGRATION_TO_RENDER.md` for detailed migration instructions.