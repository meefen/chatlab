from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .character import CharacterResponse

class MessageBase(BaseModel):
    conversation_id: int
    character_id: Optional[int] = None
    content: str
    is_user_prompt: bool = False
    turn_number: int

class MessageCreate(BaseModel):
    character_id: Optional[int] = None
    content: str
    is_user_prompt: bool = False
    turn_number: int

class MessageResponse(MessageBase):
    id: int
    created_at: datetime
    character: Optional[CharacterResponse] = None
    
    class Config:
        from_attributes = True