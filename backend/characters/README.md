# Characters Data

This folder contains the default educational theorist characters and related utilities.

## Files

- **characters_data.json** - Default characters with their personalities and roles
- **insert_characters_sqlite.py** - Script to insert default characters into SQLite database

## Usage

The characters_data.json file contains the built-in educational theorists that come with ChatLab:

- John Dewey - Progressive Educator
- Maria Montessori - Educational Reformer  
- Jean Piaget - Developmental Psychologist
- Lev Vygotsky - Social Learning Theorist
- Paulo Freire - Critical Pedagogy Advocate
- And more...

## Adding Characters

To add new default characters:

1. Edit `characters_data.json`
2. Run the insert script if using SQLite locally
3. For production (PostgreSQL), characters can be added via the API or admin interface