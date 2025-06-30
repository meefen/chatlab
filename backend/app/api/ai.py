from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Literal

from ..database import get_db
from ..models.conversation import Conversation
from ..models.message import Message
from ..models.character import Character
from ..services.ai_service import generate_character_response, generate_conversation_title
from ..config import settings

router = APIRouter()

class GenerateResponseRequest(BaseModel):
    character_id: int
    user_prompt: str = None

class GenerateResponseResponse(BaseModel):
    message: dict
    should_continue: bool

@router.post("/conversations/{conversation_id}/generate-response", response_model=GenerateResponseResponse)
async def generate_response(
    conversation_id: int,
    request: GenerateResponseRequest,
    db: Session = Depends(get_db)
):
    try:
        # Get conversation
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Get character
        character = db.query(Character).filter(Character.id == request.character_id).first()
        if not character:
            raise HTTPException(status_code=404, detail="Character not found")
        
        # Build conversation history
        messages = db.query(Message).filter(Message.conversation_id == conversation_id).all()
        conversation_history = []
        
        for msg in messages:
            if msg.is_user_prompt:
                conversation_history.append(f"User: {msg.content}")
            elif msg.character:
                conversation_history.append(f"{msg.character.name}: {msg.content}")
        
        conversation_history_str = "\n".join(conversation_history)
        if not conversation_history_str:
            conversation_history_str = "This is the beginning of the conversation."
        
        # Generate AI response
        ai_response = await generate_character_response(
            character.name,
            character.personality,
            conversation_history_str,
            request.user_prompt or "Please introduce yourself and share your thoughts on education."
        )
        
        # Save the response as a message
        next_turn = max([m.turn_number for m in messages] + [0]) + 1
        message = Message(
            conversation_id=conversation_id,
            character_id=request.character_id,
            content=ai_response.content,
            is_user_prompt=False,
            turn_number=next_turn
        )
        
        db.add(message)
        
        # Update conversation's current turn
        conversation.current_turn = next_turn
        
        db.commit()
        db.refresh(message)
        
        return GenerateResponseResponse(
            message={
                "id": message.id,
                "content": message.content,
                "character_id": message.character_id,
                "turn_number": message.turn_number,
                "created_at": message.created_at.isoformat() if message.created_at else None
            },
            should_continue=ai_response.should_continue
        )
    except Exception as e:
        print(f"Error in generate_response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/conversations/{conversation_id}/generate-title")
async def generate_title(conversation_id: int, db: Session = Depends(get_db)):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    messages = db.query(Message).filter(Message.conversation_id == conversation_id).limit(3).all()
    if not messages:
        raise HTTPException(status_code=404, detail="Conversation not found or empty")
    
    first_messages = []
    for msg in messages:
        if msg.character:
            first_messages.append(f"{msg.character.name}: {msg.content}")
        else:
            first_messages.append(f"User: {msg.content}")
    
    first_messages_str = "\n".join(first_messages)
    title = await generate_conversation_title(first_messages_str)
    
    conversation.title = title
    db.commit()
    
    return {"title": title}

@router.get("/config")
async def get_ai_config():
    return {
        "ai_provider": settings.AI_PROVIDER,
        "openai_configured": bool(settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "sk-fake-key-for-development"),
        "anthropic_configured": bool(settings.ANTHROPIC_API_KEY and settings.ANTHROPIC_API_KEY != "sk-ant-fake-key-for-development")
    }

class AIProviderRequest(BaseModel):
    provider: Literal["openai", "anthropic"]

@router.post("/config/provider")
async def set_ai_provider(request: AIProviderRequest):
    # Note: This changes the runtime setting but doesn't persist to .env
    settings.AI_PROVIDER = request.provider
    return {"ai_provider": settings.AI_PROVIDER, "message": f"AI provider set to {request.provider}"}