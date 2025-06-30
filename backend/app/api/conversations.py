from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.conversation import Conversation
from ..models.message import Message
from ..models.character import Character
from ..schemas.conversation import ConversationCreate, ConversationUpdate, ConversationResponse, ConversationWithMessages
from ..schemas.message import MessageCreate, MessageResponse

router = APIRouter()

@router.get("/", response_model=List[ConversationResponse])
async def get_conversations(db: Session = Depends(get_db)):
    conversations = db.query(Conversation).all()
    return conversations

@router.get("/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get messages with character info
    messages = db.query(Message).filter(Message.conversation_id == conversation_id).all()
    
    # Get participants
    participants = db.query(Character).filter(Character.id.in_(conversation.participant_ids)).all()
    
    return ConversationWithMessages(
        **conversation.__dict__,
        messages=messages,
        participants=participants
    )

@router.post("/", response_model=ConversationResponse)
async def create_conversation(conversation: ConversationCreate, db: Session = Depends(get_db)):
    db_conversation = Conversation(**conversation.dict())
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

@router.put("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: int, 
    conversation_update: ConversationUpdate, 
    db: Session = Depends(get_db)
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    update_data = conversation_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(conversation, key, value)
    
    db.commit()
    db.refresh(conversation)
    return conversation

@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def create_message(
    conversation_id: int, 
    message: MessageCreate, 
    db: Session = Depends(get_db)
):
    # Verify conversation exists
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Set conversation_id from URL
    message_data = message.dict()
    message_data["conversation_id"] = conversation_id
    
    db_message = Message(**message_data)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message