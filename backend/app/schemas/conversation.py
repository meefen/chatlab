from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .message import MessageResponse
from .character import CharacterResponse

class ConversationBase(BaseModel):
    title: str
    participant_ids: List[int]
    is_autonomous: bool = False
    current_turn: int = 0

class ConversationCreate(ConversationBase):
    pass

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    participant_ids: Optional[List[int]] = None
    is_autonomous: Optional[bool] = None
    current_turn: Optional[int] = None

class ConversationResponse(ConversationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ConversationWithMessages(ConversationResponse):
    messages: List[MessageResponse] = []
    participants: List[CharacterResponse] = []