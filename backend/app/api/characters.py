from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
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
    # Return public characters and user's private characters
    if current_user:
        characters = db.query(Character).filter(
            (Character.is_public == True) | (Character.created_by_id == current_user.id)
        ).all()
    else:
        characters = db.query(Character).filter(Character.is_public == True).all()
    return characters

@router.get("/active", response_model=List[CharacterResponse])
async def get_active_characters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_current_user)
):
    # Return active public characters and user's private characters
    if current_user:
        characters = db.query(Character).filter(
            Character.is_active == True,
            (Character.is_public == True) | (Character.created_by_id == current_user.id)
        ).all()
    else:
        characters = db.query(Character).filter(
            Character.is_active == True,
            Character.is_public == True
        ).all()
    return characters

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
        **character_data,
        is_public=False,  # User-created characters are private by default
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
    db: Session = Depends(get_db)
):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    update_data = character_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(character, key, value)
    
    db.commit()
    db.refresh(character)
    return character

@router.delete("/{character_id}")
async def delete_character(character_id: int, db: Session = Depends(get_db)):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    db.delete(character)
    db.commit()
    return {"success": True}