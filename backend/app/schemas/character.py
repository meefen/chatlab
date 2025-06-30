from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CharacterBase(BaseModel):
    name: str
    role: str
    personality: str
    avatar_url: Optional[str] = None
    is_active: bool = True

class CharacterCreate(CharacterBase):
    pass

class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    personality: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None

class CharacterResponse(CharacterBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True