from pydantic_settings import BaseSettings
from typing import List, Literal

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./app.db"
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    AI_PROVIDER: Literal["openai", "anthropic"] = "anthropic"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"

settings = Settings()