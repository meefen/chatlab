from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..database import get_db
from ..models.character import Character
from ..models.user import User
from ..schemas.character import CharacterCreate, CharacterUpdate, CharacterResponse
from ..auth import get_current_user, get_optional_current_user

router = APIRouter()

@router.get("/", response_model=List[CharacterResponse])
async def get_characters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user)
):
    """
    Get characters available to the current user:
    - Built-in characters (created_by_id is NULL)
    - Public user-created characters (is_public is True)
    - Current user's private characters (created_by_id equals current user)
    """
    if current_user:
        characters = db.query(Character).options(joinedload(Character.created_by)).filter(
            (Character.created_by_id == None) |  # Built-in characters
            (Character.is_public == True) |      # Public characters
            (Character.created_by_id == current_user.id)  # User's own characters
        ).all()
    else:
        # Unauthenticated users only see built-in and public characters
        characters = db.query(Character).options(joinedload(Character.created_by)).filter(
            (Character.created_by_id == None) |  # Built-in characters
            (Character.is_public == True)        # Public characters
        ).all()
    return characters

@router.get("/active", response_model=List[CharacterResponse])
async def get_active_characters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user)
):
    # Alias for get_characters since we removed is_active column
    return await get_characters(db, current_user)

@router.get("/{character_id}", response_model=CharacterResponse)
async def get_character(character_id: int, db: Session = Depends(get_db)):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return character

@router.post("/", response_model=CharacterResponse)
async def create_character(
    character: CharacterCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Create character linked to current user
    character_data = character.model_dump()
    db_character = Character(
        name=character_data["name"],
        role=character_data["role"],
        personality=character_data["personality"],
        avatar_url=character_data.get("avatar_url"),
        is_public=character_data.get("is_public", False),  # Default to private
        created_by_id=current_user.id
    )
    db.add(db_character)
    db.commit()
    db.refresh(db_character)
    return db_character

@router.put("/{character_id}", response_model=CharacterResponse)
async def update_character(
    character_id: int, 
    character_update: CharacterUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Check if user owns this character (only owners can edit their characters)
    if character.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit characters you created")
    
    update_data = character_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(character, key, value)
    
    db.commit()
    db.refresh(character)
    return character

@router.delete("/{character_id}")
async def delete_character(
    character_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Check if user owns this character (only owners can delete their characters)
    if character.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete characters you created")
    
    db.delete(character)
    db.commit()
    return {"success": True}