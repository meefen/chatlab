from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Character(Base):
    __tablename__ = "characters"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    personality = Column(Text, nullable=False)  # Use Text for longer personality descriptions
    avatar_url = Column(String(500))
    is_public = Column(Boolean, default=False, nullable=False)  # Whether character is public for all users
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null for built-in characters
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    messages = relationship("Message", back_populates="character")
    created_by = relationship("User", back_populates="custom_characters", foreign_keys=[created_by_id])