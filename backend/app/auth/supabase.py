from typing import Optional
import os
import httpx
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..config import settings

class SupabaseAuth:
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_KEY
        self.jwt_secret = self.supabase_key  # Use anon key for JWT verification
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY environment variables")
        
    async def verify_token(self, token: str) -> dict:
        """Verify JWT token from Supabase by calling Supabase user endpoint"""
        try:
            # Use Supabase's user endpoint to validate the token
            headers = {
                "Authorization": f"Bearer {token}",
                "apikey": self.supabase_key
            }
            
            url = f"{self.supabase_url}/auth/v1/user"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid authentication token",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                
                user_data = response.json()
                return user_data
                
        except httpx.RequestError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not verify authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    def get_user_from_token(self, user_data: dict, db: Session) -> User:
        """Get or create user from Supabase user data"""
        user_id = user_data.get("id")
        user_email = user_data.get("email")
        
        if not user_id or not user_email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user data from Supabase"
            )
        
        # Check if user exists in our database
        user = db.query(User).filter(User.supabase_id == user_id).first()
        
        if not user:
            # Create new user if doesn't exist
            user_metadata = user_data.get("user_metadata", {})
            user = User(
                supabase_id=user_id,
                email=user_email,
                full_name=user_metadata.get("full_name"),
                avatar_url=user_metadata.get("avatar_url"),
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        return user

# Security scheme for FastAPI
security = HTTPBearer()
supabase_auth = SupabaseAuth()

async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """Dependency to get current authenticated user"""
    
    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth_header.replace("Bearer ", "")
    
    # Verify token and get user
    user_data = await supabase_auth.verify_token(token)
    user = supabase_auth.get_user_from_token(user_data, db)
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled"
        )
    
    return user

async def get_optional_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Optional dependency to get current authenticated user (doesn't fail if no auth)"""
    try:
        return await get_current_user(request, db)
    except HTTPException:
        return None