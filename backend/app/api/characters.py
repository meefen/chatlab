from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.character import Character
from ..schemas.character import CharacterCreate, CharacterUpdate, CharacterResponse

router = APIRouter()

@router.get("/", response_model=List[CharacterResponse])
async def get_characters(db: Session = Depends(get_db)):
    characters = db.query(Character).all()
    return characters

@router.get("/active", response_model=List[CharacterResponse])
async def get_active_characters(db: Session = Depends(get_db)):
    characters = db.query(Character).filter(Character.is_active == True).all()
    return characters

@router.get("/{character_id}", response_model=CharacterResponse)
async def get_character(character_id: int, db: Session = Depends(get_db)):
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return character

@router.post("/", response_model=CharacterResponse)
async def create_character(character: CharacterCreate, db: Session = Depends(get_db)):
    db_character = Character(**character.dict())
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
    
    update_data = character_update.dict(exclude_unset=True)
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