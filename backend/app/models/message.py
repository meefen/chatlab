from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    character_id = Column(Integer, ForeignKey("characters.id"))
    content = Column(Text, nullable=False)  # Use Text for longer message content
    is_user_prompt = Column(Boolean, default=False, nullable=False)
    turn_number = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    conversation = relationship("Conversation", back_populates="messages")
    character = relationship("Character", back_populates="messages")