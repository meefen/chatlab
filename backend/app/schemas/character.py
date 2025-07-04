from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CreatorInfo(BaseModel):
    id: int
    full_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class CharacterBase(BaseModel):
    name: str
    role: str
    personality: str
    avatar_url: Optional[str] = None
    is_public: bool = False

class CharacterCreate(CharacterBase):
    pass

class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    personality: Optional[str] = None
    avatar_url: Optional[str] = None
    is_public: Optional[bool] = None

class CharacterResponse(CharacterBase):
    id: int
    created_by_id: Optional[int] = None
    created_by: Optional[CreatorInfo] = None
    created_at: datetime
    
    class Config:
        from_attributes = True