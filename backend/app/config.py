from pydantic_settings import BaseSettings
from typing import List, Literal
import os

class Settings(BaseSettings):
    # Database configuration
    DATABASE_URL: str = "sqlite:///./app.db"
    
    # Environment detection
    ENVIRONMENT: str = "development"
    
    # Authentication
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    
    # AI Services
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    AI_PROVIDER: Literal["openai", "anthropic"] = "anthropic"
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:3000",
        "https://chatlab-frontend.vercel.app",
        "https://chatlab-frontend.onrender.com"
    ]
    
    # Server Configuration
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    class Config:
        env_file = ".env"
    
    def get_database_url(self) -> str:
        """Get the appropriate database URL based on environment"""
        # If DATABASE_URL is explicitly set, use it
        if self.DATABASE_URL and self.DATABASE_URL != "sqlite:///./app.db":
            return self.DATABASE_URL
        
        # Check for Render PostgreSQL environment variables
        if os.getenv("DATABASE_URL"):
            return os.getenv("DATABASE_URL")
        
        # Check for individual PostgreSQL environment variables
        db_name = os.getenv("POSTGRES_DB")
        db_user = os.getenv("POSTGRES_USER")
        db_password = os.getenv("POSTGRES_PASSWORD")
        db_host = os.getenv("POSTGRES_HOST")
        db_port = os.getenv("POSTGRES_PORT", "5432")
        
        if all([db_name, db_user, db_password, db_host]):
            return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        
        # Default to SQLite for local development
        if self.ENVIRONMENT == "development":
            return "sqlite:///./app.db"
        else:
            # Production with volume mount (Fly.io style)
            return "sqlite:////data/app.db"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.ENVIRONMENT.lower() in ["production", "prod"]
    
    @property
    def is_postgresql(self) -> bool:
        """Check if using PostgreSQL database"""
        return self.get_database_url().startswith("postgresql://")
    
    def get_cors_origins(self) -> List[str]:
        """Get CORS origins with environment variable support"""
        # Check if CORS_ORIGINS is set as an environment variable
        cors_env = os.getenv("CORS_ORIGINS")
        if cors_env:
            try:
                # Parse JSON string from environment variable
                import json
                parsed_origins = json.loads(cors_env)
                if isinstance(parsed_origins, list):
                    return parsed_origins
            except (json.JSONDecodeError, TypeError):
                # If parsing fails, treat as comma-separated string
                return [origin.strip() for origin in cors_env.split(",")]
        
        # Return default CORS origins
        return self.CORS_ORIGINS

settings = Settings()