from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Schema for user response."""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token data."""
    user_id: Optional[int] = None
